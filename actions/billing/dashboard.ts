"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { PLANS } from "@/lib/constants/billing/constants";
import type { PlanId, BillingPeriod } from "@/types/billing";
import { env } from "@/lib/env";
import { getBillingOverview } from "@/lib/services/billing/reconciliation";
import { getFuturePaidSubscription } from "@/lib/services/billing/subscriptions";
import { getResolvedEntitlements } from "@/lib/services/billing/entitlements";
import { getActivePromotion } from "@/lib/services/billing/promotions";
import {
  resolveCheckoutIntent,
  claimPromotion,
} from "@/lib/services/billing/checkout-intent";

export async function getDashboardBillingOverview() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return getBillingOverview(user.id);
}

const VALID_PLANS = new Set<string>(["standard", "premium"]);
const VALID_PERIODS = new Set<string>(["monthly", "yearly"]);

export type DashboardCheckoutData =
  | {
      view: "blocked";
      title: string;
      description: string;
    }
  | {
      view: "plan-selector";
      currentPlanId: PlanId;
      activePromotion: Awaited<ReturnType<typeof getActivePromotion>>;
    }
  | {
      view: "payment-form";
      planId: PlanId;
      billingPeriod: BillingPeriod;
      userName: string;
      userEmail: string;
      isCardPaymentEnabled: boolean;
    };

export async function getDashboardCheckoutData(searchParams: {
  plan?: string;
  period?: string;
  existing?: string;
}): Promise<DashboardCheckoutData> {
  const { plan, period, existing } = searchParams;

  const user = await getCurrentUser();
  if (!user) {
    const checkoutUrl = `/app/billing/checkout?plan=${plan ?? ""}${period ? `&period=${period}` : ""}`;
    redirect(`/login?redirect_url=${encodeURIComponent(checkoutUrl)}`);
  }

  const [futurePaidSubscription, entitlements, activePromotion] = await Promise.all([
    getFuturePaidSubscription(user.id),
    getResolvedEntitlements(user.id),
    getActivePromotion(),
  ]);
  const currentPlanId = entitlements.planId;
  const currentSubscription = entitlements.subscription;
  const nowMs = Date.now();
  const hasPendingCancellation = subscriptionHasPendingCancellation(currentSubscription, nowMs);

  let blockedNotice: { title: string; description: string } | null = null;
  if (futurePaidSubscription) {
    blockedNotice = {
      title: "You already have a scheduled plan change",
      description: `Your ${PLANS[futurePaidSubscription.plan].name} plan is scheduled to start${formatStartDate(futurePaidSubscription.currentPeriodStart)}. Wait for that change to take effect before starting another payment.`,
    };
  } else if (hasPendingCancellation) {
    blockedNotice = {
      title: "Your current plan is already set to end",
      description: `Your current paid plan ends${formatStartDate(currentSubscription?.currentPeriodEnd ?? null, " on ")}. Wait until that billing period finishes before starting another payment.`,
    };
  }

  if (plan && VALID_PLANS.has(plan)) {
    const intent = await resolveCheckoutIntent(user.id, plan as PlanId, (period ?? "monthly") as BillingPeriod, {
      entitlements,
      activePromotion,
    });
    if (intent.type === "promo_grant") {
      await claimPromotion(user.id, intent);
      redirect("/app/billing");
    }
    if (intent.type === "blocked") {
      redirect(`/app/billing?toast=${encodeURIComponent(intent.reason)}`);
    }
  }

  if (!plan || !VALID_PLANS.has(plan) || !period || !VALID_PERIODS.has(period)) {
    if (existing && blockedNotice) {
      return { view: "blocked", ...blockedNotice };
    }

    return { view: "plan-selector", currentPlanId, activePromotion };
  }

  if (blockedNotice) {
    redirect("/app/billing/checkout?existing=1");
  }

  const isCardPaymentEnabled = Boolean(
    env.PESAPAL_BASE_URL &&
      env.PESAPAL_CONSUMER_KEY &&
      env.PESAPAL_CONSUMER_SECRET &&
      env.PESAPAL_NOTIFICATION_ID,
  );

  return {
    view: "payment-form",
    planId: plan as PlanId,
    billingPeriod: period as BillingPeriod,
    userName: user.name ?? "",
    userEmail: user.email ?? "",
    isCardPaymentEnabled,
  };
}

function formatStartDate(date: Date | null, prefix = " for "): string {
  if (!date) {
    return "";
  }

  return `${prefix}${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))}`;
}

function subscriptionHasPendingCancellation(
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
  } | null,
  nowMs: number,
): boolean {
  return (
    subscription !== null &&
    subscription.plan !== "free" &&
    subscription.status === "canceled" &&
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() > nowMs
  );
}
