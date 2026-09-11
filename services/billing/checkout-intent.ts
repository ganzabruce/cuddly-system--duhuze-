import { and, eq } from "drizzle-orm";
import db from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { withTransaction } from "@/lib/db/serverless";
import { isPromoCoveredPlan, PLAN_RANK } from "@/lib/constants/billing/constants";
import type { BillingPeriod, PlanId } from "@/types/billing";
import { getResolvedEntitlements } from "@/lib/services/billing/entitlements";
import { expireEffectiveSubscriptions } from "@/lib/services/billing/subscriptions";
import {
  reconcilePublishedEventQuota,
  reconcileAttendeeCategoriesOnDowngrade,
} from "@/lib/services/billing/entitlements";
import type { ResolvedEntitlements, SubscriptionRow } from "@/types/billing";
import type { ActivePromotion } from "@/types/billing";
import { getActivePromotion } from "@/lib/services/billing/promotions";

export type CheckoutIntent =
  | { type: "promo_grant"; promo: ActivePromotion; grantPlan: PlanId; periodEnd: Date; queuedStart?: Date }
  | { type: "paid_checkout" }
  | { type: "blocked"; reason: string };

export async function resolveCheckoutIntent(
  userId: number,
  requestedPlan: PlanId,
  billingPeriod: BillingPeriod,
  prefetched?: { entitlements: ResolvedEntitlements; activePromotion: ActivePromotion | null },
): Promise<CheckoutIntent> {
  let entitlements: ResolvedEntitlements;
  let activePromotion: ActivePromotion | null;
  if (prefetched) {
    entitlements = prefetched.entitlements;
    activePromotion = prefetched.activePromotion;
  } else {
    [entitlements, activePromotion] = await Promise.all([
      getResolvedEntitlements(userId),
      getActivePromotion(),
    ]);
  }

  if (!activePromotion || !isPromoCoveredPlan(activePromotion.plan as PlanId, requestedPlan)) {
    return { type: "paid_checkout" };
  }

  const grantPlan = activePromotion.plan as PlanId;
  const promoSource = `promo:${activePromotion.slug}`;

  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.source, promoSource),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { type: "paid_checkout" };
  }

  const currentPlan = entitlements.planId;

  if (currentPlan === "free") {
    return {
      type: "promo_grant",
      promo: activePromotion,
      grantPlan,
      periodEnd: activePromotion.endsAt,
    };
  }

  if (PLAN_RANK[currentPlan] >= PLAN_RANK[grantPlan]) {
    return { type: "paid_checkout" };
  }

  const effectiveSub = entitlements.subscription;
  if (!effectiveSub?.currentPeriodEnd) {
    return { type: "paid_checkout" };
  }

  if (effectiveSub.currentPeriodEnd.getTime() >= activePromotion.endsAt.getTime()) {
    return {
      type: "blocked",
      reason: "Your current paid subscription extends past this promotion's end date.",
    };
  }

  return {
    type: "promo_grant",
    promo: activePromotion,
    grantPlan,
    periodEnd: activePromotion.endsAt,
    queuedStart: effectiveSub.currentPeriodEnd,
  };
}

export async function claimPromotion(
  userId: number,
  intent: Extract<CheckoutIntent, { type: "promo_grant" }>,
): Promise<SubscriptionRow | null> {
  const promoSource = `promo:${intent.promo.slug}`;

  return withTransaction(async (tx) => {
    const now = new Date();

    if (!intent.queuedStart) {
      await expireEffectiveSubscriptions(userId, tx, now);
    }

    const [created] = await tx
      .insert(subscriptions)
      .values({
        userId,
        plan: intent.grantPlan,
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: intent.queuedStart ?? now,
        currentPeriodEnd: intent.periodEnd,
        source: promoSource,
        notes: `Promotion: ${intent.promo.slug}`,
        adminAssignedByEmail: "system",
        updatedAt: now,
      })
      .returning();

    if (created) {
      await tx.insert(payments).values({
        userId,
        subscriptionId: created.id,
        amount: 0,
        currency: "RWF",
        status: "succeeded",
        purpose: "promo_activation",
        plan: intent.grantPlan,
        billingCycle: "monthly",
        providerName: null,
        paidAt: now,
        updatedAt: now,
      });
    }

    if (!intent.queuedStart) {
      await Promise.all([
        reconcilePublishedEventQuota(userId, tx, now),
        ...(intent.grantPlan !== "premium" ? [reconcileAttendeeCategoriesOnDowngrade(userId, tx)] : []),
      ]);
    }

    return created ?? null;
  });
}
