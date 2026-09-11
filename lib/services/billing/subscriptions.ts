import {
  and,
  desc,
  eq,
  inArray,
  lte,
  type SQL,
} from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { withTransaction } from "@/lib/db/serverless";
import { payments, subscriptions } from "@/lib/db/schema";
import { ValidationError } from "@/lib/utils/errors";
import type { BillingPeriod } from "@/types/billing";
import type { SubscriptionRow, CancelSubscriptionResult, ScheduleDowngradeResult } from "@/types/billing";
import { reconcilePublishedEventQuota, reconcileAttendeeCategoriesOnDowngrade } from "@/lib/services/billing/entitlements";

const SUBSCRIPTION_ORDER_BY = [
  desc(subscriptions.updatedAt),
  desc(subscriptions.createdAt),
] as const;

export function addBillingPeriod(
  start: Date,
  billingPeriod: BillingPeriod,
): Date {
  const next = new Date(start);
  if (billingPeriod === "yearly") {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    return next;
  }

  const originalDay = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + 1);
  if (next.getUTCDate() !== originalDay) {
    next.setUTCDate(0);
  }
  return next;
}

export function addGracePeriod(start: Date, days = 7): Date {
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isFutureDate(value: Date | null | undefined, now: Date) {
  return !!value && value.getTime() > now.getTime();
}

export function hasSubscriptionStarted(
  subscription: SubscriptionRow,
  now: Date,
): boolean {
  return (
    !subscription.currentPeriodStart ||
    subscription.currentPeriodStart.getTime() <= now.getTime()
  );
}

export function isSubscriptionEffective(
  subscription: SubscriptionRow,
  now: Date = new Date(),
): boolean {
  if (subscription.status === "active") {
    return (
      hasSubscriptionStarted(subscription, now) &&
      (!subscription.currentPeriodEnd ||
        subscription.currentPeriodEnd.getTime() > now.getTime())
    );
  }

  if (subscription.status === "grace_period") {
    return isFutureDate(subscription.gracePeriodEndsAt, now);
  }

  if (subscription.status === "canceled") {
    return hasSubscriptionStarted(subscription, now) &&
      isFutureDate(subscription.currentPeriodEnd, now);
  }

  return false;
}

export async function listSubscriptionsForUser(
  userId: number,
  executor: DbExecutor = db,
): Promise<SubscriptionRow[]> {
  return executor
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(...SUBSCRIPTION_ORDER_BY);
}

export async function getFuturePaidSubscription(
  userId: number,
  executor: DbExecutor = db,
  now: Date = new Date(),
): Promise<SubscriptionRow | null> {
  const rows = await listSubscriptionsForUser(userId, executor);
  return (
    rows
      .filter(
        (row) =>
          row.plan !== "free" &&
          row.status !== "expired" &&
          !!row.currentPeriodStart &&
          row.currentPeriodStart.getTime() > now.getTime() &&
          !row.source?.startsWith("promo:"),
      )
      .sort(
        (a, b) =>
          a.currentPeriodStart.getTime() - b.currentPeriodStart.getTime(),
      )[0] ?? null
  );
}

export function buildPendingPlanError() {
  return new ValidationError("You already have a pending plan.");
}

export function buildPendingCancellationError() {
  return new ValidationError(
    "Your current paid plan is already scheduled to end at period close.",
  );
}

export async function getEffectiveSubscription(
  userId: number,
  executor: DbExecutor = db,
  now: Date = new Date(),
): Promise<SubscriptionRow | null> {
  const rows = await listSubscriptionsForUser(userId, executor);

  const effective = rows.find((row) => isSubscriptionEffective(row, now)) ?? null;
  if (effective) {
    return effective;
  }

  for (const row of rows) {
    if (
      row.status !== "active" ||
      !row.currentPeriodStart ||
      !row.currentPeriodEnd ||
      row.currentPeriodStart.getTime() <= now.getTime() ||
      row.currentPeriodEnd.getTime() <= now.getTime()
    ) {
      continue;
    }

    const [firstSuccessfulPayment] = await executor
      .select({
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(
        and(
          eq(payments.subscriptionId, row.id),
          eq(payments.status, "succeeded"),
        ),
      )
      .orderBy(payments.paidAt, payments.createdAt)
      .limit(1);

    const repairedStart =
      firstSuccessfulPayment?.paidAt ?? firstSuccessfulPayment?.createdAt ?? null;
    if (!repairedStart || repairedStart.getTime() > now.getTime()) {
      continue;
    }

    const [updated] = await executor
      .update(subscriptions)
      .set({
        currentPeriodStart: repairedStart,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, row.id))
      .returning();

    if (updated && isSubscriptionEffective(updated, now)) {
      return updated;
    }
  }

  return null;
}

export async function expireEffectiveSubscriptions(
  userId: number,
  executor: DbExecutor,
  now: Date,
  options: {
    currentPeriodEnd?: Date | null;
  } = {},
) {
  const rows = await executor
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(...SUBSCRIPTION_ORDER_BY);

  const effectiveIds = rows
    .filter((row) => isSubscriptionEffective(row, now))
    .map((row) => row.id);

  if (effectiveIds.length === 0) {
    return;
  }

  await executor
    .update(subscriptions)
    .set({
      status: "expired",
      currentPeriodEnd: options.currentPeriodEnd ?? now,
      gracePeriodEndsAt: null,
      updatedAt: now,
    })
    .where(inArray(subscriptions.id, effectiveIds));
}

export async function getLatestSubscriptionForUser(
  userId: number,
  executor: DbExecutor = db,
): Promise<SubscriptionRow | null> {
  const [row] = await executor
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(...SUBSCRIPTION_ORDER_BY)
    .limit(1);

  return row ?? null;
}

export async function cancelSubscriptionAtPeriodEnd(
  userId: number,
): Promise<CancelSubscriptionResult> {
  return withTransaction(async (tx) => {
    const now = new Date();
    const effectiveSubscription = await getEffectiveSubscription(userId, tx, now);
    const futureSubscriptions = await listSubscriptionsForUser(userId, tx);

    if (!effectiveSubscription || effectiveSubscription.plan === "free") {
      throw new ValidationError("You do not have an active paid subscription to cancel.");
    }

    if (!effectiveSubscription.currentPeriodEnd) {
      throw new ValidationError("This subscription has no billing period end to cancel against.");
    }

    const keptFutureSubscriptionIds = futureSubscriptions
      .filter(
        (row) =>
          row.id !== effectiveSubscription.id &&
          row.plan !== "free" &&
          row.status !== "expired" &&
          !!row.currentPeriodStart &&
          row.currentPeriodStart.getTime() > now.getTime(),
      )
      .map((row) => row.id);

    if (effectiveSubscription.status === "canceled") {
      return {
        canceledSubscription: effectiveSubscription,
        keptFutureSubscriptionIds,
      };
    }

    const [canceledSubscription] = await tx
      .update(subscriptions)
      .set({
        status: "canceled",
        gracePeriodEndsAt: null,
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, effectiveSubscription.id))
      .returning();

    if (!canceledSubscription) {
      throw new ValidationError("Failed to cancel subscription.");
    }

    return {
      canceledSubscription,
      keptFutureSubscriptionIds,
    };
  });
}

export async function scheduleDowngradeToStandard(
  userId: number,
): Promise<ScheduleDowngradeResult> {
  return withTransaction(async (tx) => {
    const now = new Date();
    const effectiveSubscription = await getEffectiveSubscription(userId, tx, now);

    if (!effectiveSubscription || effectiveSubscription.plan !== "premium") {
      throw new ValidationError("Only Premium plans can schedule a downgrade to Standard.");
    }

    if (!effectiveSubscription.currentPeriodEnd) {
      throw new ValidationError("This subscription has no billing period end to downgrade against.");
    }

    const futurePaidSubscription = await getFuturePaidSubscription(userId, tx, now);
    if (futurePaidSubscription) {
      throw buildPendingPlanError();
    }

    const [scheduledSubscription] = await tx
      .insert(subscriptions)
      .values({
        userId,
        plan: "standard",
        billingCycle: effectiveSubscription.billingCycle,
        status: "active",
        currentPeriodStart: effectiveSubscription.currentPeriodEnd,
        currentPeriodEnd: addBillingPeriod(
          effectiveSubscription.currentPeriodEnd,
          effectiveSubscription.billingCycle,
        ),
        gracePeriodEndsAt: null,
        canceledAt: null,
        providerName: effectiveSubscription.providerName,
        source: "scheduled_change",
        notes: `Scheduled downgrade from Premium at period end`,
        updatedAt: now,
      })
      .returning();

    if (!scheduledSubscription) {
      throw new ValidationError("Failed to schedule the Standard plan.");
    }

    return { scheduledSubscription };
  });
}

export async function enterGracePeriod(
  userId: number,
  options: {
    executor?: DbExecutor;
    now?: Date;
    force?: boolean;
  } = {},
): Promise<SubscriptionRow | null> {
  const executor = options.executor ?? db;
  const now = options.now ?? new Date();
  const latestSubscription = await getLatestSubscriptionForUser(userId, executor);

  if (!latestSubscription || latestSubscription.plan === "free") {
    return null;
  }

  if (
    latestSubscription.status === "grace_period" &&
    isFutureDate(latestSubscription.gracePeriodEndsAt, now)
  ) {
    return latestSubscription;
  }

  if (
    !options.force &&
    latestSubscription.currentPeriodEnd &&
    latestSubscription.currentPeriodEnd.getTime() > now.getTime()
  ) {
    return latestSubscription;
  }

  const [updated] = await executor
    .update(subscriptions)
    .set({
      status: "grace_period",
      gracePeriodEndsAt: addGracePeriod(now),
      updatedAt: now,
    })
    .where(eq(subscriptions.id, latestSubscription.id))
    .returning();

  return updated ?? null;
}

export async function expireGracePeriodSubscriptions(
  options: {
    executor?: DbExecutor;
    now?: Date;
    userId?: number;
  } = {},
): Promise<{
  expiredSubscriptionIds: number[];
  affectedUserIds: number[];
}> {
  const executor = options.executor ?? db;
  const now = options.now ?? new Date();
  const conditions: SQL[] = [
    eq(subscriptions.status, "grace_period"),
    lte(subscriptions.gracePeriodEndsAt, now),
  ];

  if (options.userId != null) {
    conditions.push(eq(subscriptions.userId, options.userId));
  }

  const rows = await executor
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
    })
    .from(subscriptions)
    .where(and(...conditions));

  if (rows.length === 0) {
    return {
      expiredSubscriptionIds: [],
      affectedUserIds: [],
    };
  }

  await executor
    .update(subscriptions)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      inArray(
        subscriptions.id,
        rows.map((row) => row.id),
      ),
    );

  const affectedUserIds = [...new Set(rows.map((row) => row.userId))];
  for (const userId of affectedUserIds) {
    await reconcilePublishedEventQuota(userId, executor, now);
    await reconcileAttendeeCategoriesOnDowngrade(userId, executor);
  }

  return {
    expiredSubscriptionIds: rows.map((row) => row.id),
    affectedUserIds,
  };
}
