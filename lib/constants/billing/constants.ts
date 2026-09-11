/**
 * Machine-readable plan definitions.
 * Marketing copy lives in site-facing components/JSON; this file is the runtime source of truth
 * for plan IDs, limits, and pricing used by checkout, billing, and enforcement logic.
 */

import type {
  PlanId,
  BillingPeriod,
  CheckoutCurrency,
  SubscriptionStatus,
  PaymentStatus,
  PaymentPurpose,
  PlanFeatureFlags,
  PlanDefinition,
  PlanComparisonRow,
} from "@/types/billing";

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    features: [
      "Up to 3 active events",
      "Core RSVP collection",
      "Analytics included",
      "No guest-count limit",
    ],
    marketing: {
      tagline: "Get started at no cost",
      cta: "Get started free",
      checkoutPath: "/signup",
      popular: false,
    },
    featureFlags: {
      analytics: true,
      advancedEventSettings: false,
      csvImport: false,
      csvExport: false,
      eventContributions: false,
      customQuestions: false,
      attendeeCategories: false,
      whatsappInvitations: false,
    },
    limits: { maxActiveEvents: 3, maxGuestsPerEvent: null },
    pricing: {
      monthly: 0,
      yearly: 0,
    },
  },
  standard: {
    id: "standard",
    name: "Standard",
    features: [
      "Up to 5 active events",
      "Advanced RSVP event settings",
      "CSV import and export",
      "Analytics included",
      "No guest-count limit",
    ],
    marketing: {
      tagline: "For growing event organizers",
      cta: "Start Standard",
      checkoutPath: "/checkout?plan=standard",
      popular: true,
    },
    featureFlags: {
      analytics: true,
      advancedEventSettings: true,
      csvImport: true,
      csvExport: true,
      eventContributions: true,
      customQuestions: false,
      attendeeCategories: false,
      whatsappInvitations: true,
    },
    limits: { maxActiveEvents: 5, maxGuestsPerEvent: null },
    pricing: {
      monthly: 8900,
      yearly: 85440,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    features: [
      "Up to 10 active events",
      "Everything in Standard",
      "Custom RSVP questions",
      "Event contributions",
      "No guest-count limit",
    ],
    marketing: {
      tagline: "For serious event professionals",
      cta: "Go Premium",
      checkoutPath: "/checkout?plan=premium",
      popular: false,
    },
    featureFlags: {
      analytics: true,
      advancedEventSettings: true,
      csvImport: true,
      csvExport: true,
      eventContributions: true,
      customQuestions: true,
      attendeeCategories: true,
      whatsappInvitations: true,
    },
    limits: { maxActiveEvents: 10, maxGuestsPerEvent: null },
    pricing: {
      monthly: 17500,
      yearly: 168000,
    },
  },
};

/** All valid plan IDs */
export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "grace_period",
  "canceled",
  "expired",
  "past_due",
];
export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
];
export const PAYMENT_PURPOSES: PaymentPurpose[] = [
  "new_subscription",
  "renewal",
  "plan_change",
  "promo_activation",
];

export const PLAN_RANK: Record<PlanId, number> = { free: 0, standard: 1, premium: 2 };

export function isHigherPlan(a: PlanId, b: PlanId): boolean {
  return PLAN_RANK[a] > PLAN_RANK[b];
}

export function isPromoCoveredPlan(promoPlan: PlanId, targetPlan: PlanId): boolean {
  return PLAN_RANK[promoPlan] >= PLAN_RANK[targetPlan];
}

export function formatRwfZero(): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(0);
}

export function formatYearlyMonthlyEquiv(planId: PlanId): string {
  const plan = PLANS[planId];
  const perMonth = Math.round(plan.pricing.yearly / 12);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(perMonth);
}

/** Get formatted price string for a plan */
export function formatPlanPrice(
  planId: PlanId,
  period: BillingPeriod,
  currency: CheckoutCurrency,
): string {
  const plan = PLANS[planId];
  const storedAmount = plan.pricing[period];

  if (storedAmount === 0) return "Free";

  const amount = storedAmount;
  const fractionDigits = 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/**
 * Returns price in the stored unit.
 * RWF: 5200 → 5,200 RWF.
 * Use formatPlanPrice() for display strings.
 */
export function getPlanPriceAmount(
  planId: PlanId,
  period: BillingPeriod,
): number {
  const plan = PLANS[planId];
  return plan.pricing[period];
}

/** Check if a plan is a paid plan */
export function isPaidPlan(planId: PlanId): boolean {
  return planId !== "free";
}

export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  {
    group: "Limits",
    label: "Active events",
    values: {
      free: String(PLANS.free.limits.maxActiveEvents ?? "Unlimited"),
      standard: String(PLANS.standard.limits.maxActiveEvents ?? "Unlimited"),
      premium: String(PLANS.premium.limits.maxActiveEvents ?? "Unlimited"),
    },
  },
  {
    group: "Limits",
    label: "Guest capacity",
    values: {
      free: "Unlimited",
      standard: "Unlimited",
      premium: "Unlimited",
    },
  },
  {
    group: "Core",
    label: "RSVP collection",
    values: { free: true, standard: true, premium: true },
  },
  {
    group: "Core",
    label: "Public event page",
    values: { free: true, standard: true, premium: true },
  },
  {
    group: "Core",
    label: "Analytics & insights",
    values: {
      free: PLANS.free.featureFlags.analytics,
      standard: PLANS.standard.featureFlags.analytics,
      premium: PLANS.premium.featureFlags.analytics,
    },
  },
  {
    group: "Standard+",
    label: "Advanced event settings",
    values: {
      free: PLANS.free.featureFlags.advancedEventSettings,
      standard: PLANS.standard.featureFlags.advancedEventSettings,
      premium: PLANS.premium.featureFlags.advancedEventSettings,
    },
  },
  {
    group: "Standard+",
    label: "CSV import & export",
    values: {
      free: PLANS.free.featureFlags.csvImport && PLANS.free.featureFlags.csvExport,
      standard:
        PLANS.standard.featureFlags.csvImport &&
        PLANS.standard.featureFlags.csvExport,
      premium:
        PLANS.premium.featureFlags.csvImport &&
        PLANS.premium.featureFlags.csvExport,
    },
  },
  {
    group: "Premium",
    label: "Custom RSVP questions",
    values: {
      free: PLANS.free.featureFlags.customQuestions,
      standard: PLANS.standard.featureFlags.customQuestions,
      premium: PLANS.premium.featureFlags.customQuestions,
    },
  },
  {
    group: "Premium",
    label: "Event contributions",
    values: {
      free: PLANS.free.featureFlags.eventContributions,
      standard: PLANS.standard.featureFlags.eventContributions,
      premium: PLANS.premium.featureFlags.eventContributions,
    },
  },
  {
    group: "Standard+",
    label: "WhatsApp invitations",
    values: {
      free: PLANS.free.featureFlags.whatsappInvitations,
      standard: PLANS.standard.featureFlags.whatsappInvitations,
      premium: PLANS.premium.featureFlags.whatsappInvitations,
    },
  },
  {
    group: "Premium",
    label: "Attendee categories",
    values: {
      free: PLANS.free.featureFlags.attendeeCategories,
      standard: PLANS.standard.featureFlags.attendeeCategories,
      premium: PLANS.premium.featureFlags.attendeeCategories,
    },
  },
];

const PLAN_FEATURE_LABELS: Record<
  keyof PlanFeatureFlags | "publicEventPage",
  string
> = {
  analytics: "Analytics included",
  advancedEventSettings: "Advanced event settings",
  csvImport: "CSV import & export",
  csvExport: "CSV import & export",
  customQuestions: "Custom RSVP questions",
  eventContributions: "Event contributions",
  attendeeCategories: "Attendee categories",
  whatsappInvitations: "WhatsApp invitations",
  publicEventPage: "Public event page",
};

export function getPlanCardFeatures(planId: PlanId): {
  active: string[];
  inactive: string[];
} {
  const plan = PLANS[planId];
  const active = [
    `${plan.limits.maxActiveEvents} active events`,
    "Unlimited guests",
    PLAN_FEATURE_LABELS.publicEventPage,
    "Core RSVP collection",
  ];

  const optionalKeys: Array<keyof PlanFeatureFlags> = [
    "analytics",
    "advancedEventSettings",
    "csvImport",
    "whatsappInvitations",
    "customQuestions",
    "eventContributions",
    "attendeeCategories",
  ];

  const seen = new Set(active);
  const inactive: string[] = [];

  for (const key of optionalKeys) {
    const label = PLAN_FEATURE_LABELS[key];
    if (seen.has(label)) continue;
    if (plan.featureFlags[key]) {
      active.push(label);
      seen.add(label);
    } else {
      inactive.push(label);
    }
  }

  return { active, inactive };
}
