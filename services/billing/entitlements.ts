import {
  and,
  eq,
  inArray,
  isNotNull,
  ne,
  sql,
  type SQL,
} from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { events, eventSettings } from "@/lib/db/schema";
import { PLANS } from "@/lib/constants/billing/constants";
import { ValidationError } from "@/lib/utils/errors";
import type { ResolvedEntitlements } from "@/types/billing";
import type { BillingFeatureAccess } from "@/lib/constants/billing/feature-access";
import { getEffectiveSubscription } from "@/lib/services/billing/subscriptions";

function activeEventFilter(userId: number, now: Date) {
  return and(
    eq(events.createdBy, userId),
    eq(events.status, "published"),
    sql`coalesce(${events.endDate}, ${events.date}) >= ${now}`,
  );
}

export async function countActivePublishedEvents(
  userId: number,
  options: {
    executor?: DbExecutor;
    excludeEventId?: number;
  } = {},
): Promise<number> {
  const executor = options.executor ?? db;
  const now = new Date();
  const conditions: SQL[] = [activeEventFilter(userId, now)!];

  if (options.excludeEventId != null) {
    conditions.push(ne(events.id, options.excludeEventId));
  }

  const [row] = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(and(...conditions));

  return Number(row?.count ?? 0);
}

export async function getResolvedEntitlements(
  userId: number,
  executor: DbExecutor = db,
): Promise<ResolvedEntitlements> {
  const subscription = await getEffectiveSubscription(userId, executor);
  const planId = subscription?.plan ?? "free";
  const activePublishedEvents = await countActivePublishedEvents(userId, {
    executor,
  });
  const maxActiveEvents = PLANS[planId].limits.maxActiveEvents;

  return {
    planId,
    label: PLANS[planId].name,
    features: PLANS[planId].featureFlags,
    limits: PLANS[planId].limits,
    subscription,
    isInGracePeriod: subscription?.status === "grace_period",
    usage: {
      activePublishedEvents,
      remainingActiveEvents:
        maxActiveEvents == null
          ? null
          : Math.max(maxActiveEvents - activePublishedEvents, 0),
    },
  };
}

export function getEventFeatureAccess(
  entitlements: ResolvedEntitlements,
): BillingFeatureAccess {
  return {
    analytics: entitlements.features.analytics,
    advancedEventSettings: entitlements.features.advancedEventSettings,
    csvImport: entitlements.features.csvImport,
    csvExport: entitlements.features.csvExport,
    customQuestions: entitlements.features.customQuestions,
    eventContributions: entitlements.features.eventContributions,
    attendeeCategories: entitlements.features.attendeeCategories,
    whatsappInvitations: entitlements.features.whatsappInvitations,
  };
}

export async function assertCanPublishEvent(
  userId: number,
  options: {
    executor?: DbExecutor;
    excludeEventId?: number;
  } = {},
): Promise<ResolvedEntitlements> {
  const executor = options.executor ?? db;
  const entitlements = await getResolvedEntitlements(userId, executor);
  const limit = entitlements.limits.maxActiveEvents;

  if (limit == null) {
    return entitlements;
  }

  const publishedCount = await countActivePublishedEvents(userId, {
    executor,
    excludeEventId: options.excludeEventId,
  });

  if (publishedCount >= limit) {
    throw new ValidationError(
      `Your ${entitlements.label} plan allows up to ${limit} active published events.`,
    );
  }

  return {
    ...entitlements,
    usage: {
      activePublishedEvents: publishedCount,
      remainingActiveEvents: Math.max(limit - publishedCount, 0),
    },
  };
}

export async function assertCanUseBillingFeature(
  userId: number,
  feature: keyof BillingFeatureAccess,
  executor: DbExecutor = db,
): Promise<ResolvedEntitlements> {
  const entitlements = await getResolvedEntitlements(userId, executor);

  if (!getEventFeatureAccess(entitlements)[feature]) {
    throw new ValidationError(
      `Your ${entitlements.label} plan does not include this feature.`,
    );
  }

  return entitlements;
}

type ActiveEventRow = {
  id: number;
  date: Date;
  endDate: Date | null;
  createdAt: Date | null;
};

export function sortEventsForQuota(rows: ActiveEventRow[]) {
  return [...rows].sort((a, b) => {
    const aEnd = (a.endDate ?? a.date).getTime();
    const bEnd = (b.endDate ?? b.date).getTime();
    if (aEnd !== bEnd) return bEnd - aEnd;
    return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
  });
}

export async function reconcilePublishedEventQuota(
  userId: number,
  executor: DbExecutor = db,
  now: Date = new Date(),
): Promise<{ keptIds: number[]; deactivatedIds: number[] }> {
  const entitlements = await getResolvedEntitlements(userId, executor);
  const limit = entitlements.limits.maxActiveEvents;

  const rows = await executor
    .select({
      id: events.id,
      date: events.date,
      endDate: events.endDate,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(activeEventFilter(userId, now));

  if (limit == null || rows.length <= limit) {
    return {
      keptIds: rows.map((row) => row.id),
      deactivatedIds: [],
    };
  }

  const ordered = sortEventsForQuota(rows);
  const keptIds = ordered.slice(0, limit).map((row) => row.id);
  const deactivatedIds = ordered.slice(limit).map((row) => row.id);

  if (deactivatedIds.length > 0) {
    await executor
      .update(events)
      .set({ status: "draft" })
      .where(inArray(events.id, deactivatedIds));
  }

  return { keptIds, deactivatedIds };
}

/**
 * Called when a user loses access to the attendeeCategories feature (e.g. premium → standard
 * downgrade or grace period expiry). Clears attendeeCategories from all their events and resets
 * any platform-mode events that relied solely on category pricing back to offline, preventing
 * a broken payment flow.
 */
export async function reconcileAttendeeCategoriesOnDowngrade(
  userId: number,
  executor: DbExecutor = db,
): Promise<{ clearedEventIds: number[] }> {
  const rows = await executor
    .select({
      eventId: eventSettings.eventId,
      contributionCollectionMode: eventSettings.contributionCollectionMode,
      contributionAmount: eventSettings.contributionAmount,
    })
    .from(eventSettings)
    .innerJoin(events, eq(events.id, eventSettings.eventId))
    .where(
      and(
        eq(events.createdBy, userId),
        isNotNull(eventSettings.attendeeCategories),
      ),
    );

  if (rows.length === 0) {
    return { clearedEventIds: [] };
  }

  for (const row of rows) {
    const hadCategoryOnlyPricing =
      row.contributionCollectionMode === "platform" &&
      (row.contributionAmount == null || row.contributionAmount === 0);

    await executor
      .update(eventSettings)
      .set({
        attendeeCategories: null,
        ...(hadCategoryOnlyPricing
          ? { contributionCollectionMode: "offline" }
          : {}),
      })
      .where(eq(eventSettings.eventId, row.eventId));
  }

  return { clearedEventIds: rows.map((row) => row.eventId) };
}
