"use server";

import { getCurrentUser } from "@/lib/services/auth/auth";
import logger from "@/lib/utils/logger";
import { getActivePromotion } from "@/lib/services/billing/promotions";
import type { ActivePromotion } from "@/types/billing";
import {
  cancelSubscriptionAtPeriodEnd,
  scheduleDowngradeToStandard,
  getFuturePaidSubscription,
} from "@/lib/services/billing/subscriptions";
import {
  resolveCheckoutIntent,
  claimPromotion,
  type CheckoutIntent,
} from "@/lib/services/billing/checkout-intent";
import type { PlanId, BillingPeriod } from "@/types/billing";

// PUBLIC ACTION — no auth by design (active promotion drives public pricing UI)
export async function getActivePromotionAction(): Promise<ActivePromotion | null> {
  return getActivePromotion();
}

export async function getCheckoutContextAction(
  userId: number,
  planId: PlanId,
  billingPeriod: BillingPeriod,
): Promise<{
  futurePaidSubscription: boolean;
  intent: CheckoutIntent;
}> {
  const [futurePaidSubscription, intent] = await Promise.all([
    getFuturePaidSubscription(userId),
    resolveCheckoutIntent(userId, planId, billingPeriod),
  ]);

  return { futurePaidSubscription: Boolean(futurePaidSubscription), intent };
}

export async function claimPromotionAction(
  userId: number,
  intent: Extract<CheckoutIntent, { type: "promo_grant" }>,
) {
  await claimPromotion(userId, intent);
}

export async function cancelCurrentSubscriptionAction(): Promise<
  { success: true } | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be signed in to cancel a plan." };
  }

  try {
    await cancelSubscriptionAtPeriodEnd(user.id);
    return { success: true };
  } catch (error) {
    logger.error("Failed to cancel current subscription", error, {
      source: "dashboard.billing.cancel-current",
      userId: user.id,
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel the current subscription.",
    };
  }
}

export async function scheduleDowngradeToStandardAction(): Promise<
  { success: true } | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be signed in to schedule a downgrade.",
    };
  }

  try {
    await scheduleDowngradeToStandard(user.id);
    return { success: true };
  } catch (error) {
    logger.error("Failed to schedule downgrade to Standard", error, {
      source: "dashboard.billing.schedule-downgrade",
      userId: user.id,
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to schedule the Standard plan.",
    };
  }
}
