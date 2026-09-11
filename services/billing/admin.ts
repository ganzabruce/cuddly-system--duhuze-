import { withTransaction } from "@/lib/db/serverless";
import { subscriptions } from "@/lib/db/schema";
import { ValidationError } from "@/lib/utils/errors";
import type { SubscriptionRow, AssignAdminSubscriptionInput } from "@/types/billing";
import {
  addBillingPeriod,
  addGracePeriod,
  expireEffectiveSubscriptions,
} from "@/lib/services/billing/subscriptions";
import { reconcilePublishedEventQuota, reconcileAttendeeCategoriesOnDowngrade } from "@/lib/services/billing/entitlements";

export async function assignAdminSubscription(
  userId: number,
  input: AssignAdminSubscriptionInput,
  adminEmail: string,
): Promise<SubscriptionRow | null> {
  return withTransaction(async (tx) => {
    const now = new Date();
    await expireEffectiveSubscriptions(userId, tx, now);

    if (input.planId === "free") {
      await reconcilePublishedEventQuota(userId, tx, now);
      await reconcileAttendeeCategoriesOnDowngrade(userId, tx);
      return null;
    }

    const currentPeriodStart = now;
    const currentPeriodEnd =
      input.currentPeriodEnd ??
      (input.status === "active" || input.status === "canceled"
        ? addBillingPeriod(now, input.billingPeriod)
        : now);
    const gracePeriodEndsAt =
      input.status === "grace_period"
        ? (input.gracePeriodEndsAt ?? addGracePeriod(now))
        : null;

    const [created] = await tx
      .insert(subscriptions)
      .values({
        userId,
        plan: input.planId,
        billingCycle: input.billingPeriod,
        status: input.status,
        currentPeriodStart,
        currentPeriodEnd:
          input.status === "grace_period" ? now : currentPeriodEnd,
        gracePeriodEndsAt,
        canceledAt: input.status === "canceled" ? now : null,
        source: input.source ?? "admin",
        notes: input.notes ?? null,
        adminAssignedByEmail: adminEmail,
        updatedAt: now,
      })
      .returning();

    await reconcilePublishedEventQuota(userId, tx, now);
    if (input.planId !== "premium") {
      await reconcileAttendeeCategoriesOnDowngrade(userId, tx);
    }
    return created ?? null;
  });
}

export function normalizeSubscriptionDateInput(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const next = new Date(trimmed);
  if (Number.isNaN(next.getTime())) {
    throw new ValidationError("Invalid subscription date");
  }
  return next;
}
