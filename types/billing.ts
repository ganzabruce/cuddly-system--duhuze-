import { payments, promotions, subscriptions } from "@/lib/db/schema";

export type PlanId = "free" | "standard" | "premium";
export type BillingPeriod = "monthly" | "yearly";
export type PaymentMethodType = "mtn_momo" | "airtel_money" | "card";
export type CheckoutCurrency = "RWF";
export type SubscriptionStatus = "active" | "grace_period" | "canceled" | "expired" | "past_due";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PaymentPurpose = "new_subscription" | "renewal" | "plan_change" | "promo_activation" | "test";

export interface PlanFeatureFlags {
  analytics: boolean;
  advancedEventSettings: boolean;
  csvImport: boolean;
  csvExport: boolean;
  customQuestions: boolean;
  eventContributions: boolean;
  attendeeCategories: boolean;
  whatsappInvitations: boolean;
}

export interface PlanMarketing {
  tagline: string;
  cta: string;
  checkoutPath: string;
  popular: boolean;
}

export type PlanLimits = {
  maxActiveEvents: number | null; // null = unlimited
  maxGuestsPerEvent: number | null; // null = unlimited / not enforced
};

export interface PlanDefinition {
  id: PlanId;
  name: string;
  features: string[];
  marketing: PlanMarketing;
  featureFlags: PlanFeatureFlags;
  limits: PlanLimits;
  pricing: Record<BillingPeriod, number>;
}

export type PlanComparisonRow = {
  group: string;
  label: string;
  values: Record<PlanId, boolean | string>;
};

export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type PromotionRow = typeof promotions.$inferSelect;

export type ActivePromotion = {
  id: number;
  slug: string;
  plan: "standard" | "premium";
  startedAt: Date;
  endsAt: Date;
  startedByEmail: string;
};

export type AssignAdminSubscriptionInput = {
  planId: PlanId;
  billingPeriod: BillingPeriod;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
  gracePeriodEndsAt?: Date | null;
  notes?: string | null;
  source?: "admin" | "payment" | "scheduled_change" | "carryover" | `promo:${string}`;
};

export type ResolvedEntitlements = {
  planId: PlanId;
  label: string;
  features: PlanFeatureFlags;
  limits: PlanLimits;
  subscription: SubscriptionRow | null;
  isInGracePeriod: boolean;
  usage: {
    activePublishedEvents: number;
    remainingActiveEvents: number | null;
  };
};

export type PaymentHistoryItem = PaymentRow;

export type BillingOverview = {
  entitlements: ResolvedEntitlements;
  latestSubscription: SubscriptionRow | null;
  futureSubscription: SubscriptionRow | null;
  latestPayment: PaymentRow | null;
  recentPayments: PaymentRow[];
};

export type CancelSubscriptionResult = {
  canceledSubscription: SubscriptionRow;
  keptFutureSubscriptionIds: number[];
};

export type ScheduleDowngradeResult = {
  scheduledSubscription: SubscriptionRow;
};

export type CreateCheckoutPaymentInput = {
  userId: number;
  planId: PlanId;
  billingPeriod: BillingPeriod;
  currency: CheckoutCurrency;
  amountOverride?: number;
  purpose?: PaymentPurpose;
  providerName?: string | null;
  requestTransactionId?: string | null;
  payerPhone?: string | null;
  payerName?: string | null;
};

export type ConfirmPaymentSuccessInput = {
  paymentId: number;
  providerTransactionId?: string | null;
  providerReferenceNo?: string | null;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
  payerPhone?: string | null;
  payerName?: string | null;
  paidAt?: Date;
};

export type FailPaymentInput = {
  paymentId: number;
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
};

export type CheckoutState = {
  status: "idle" | "error" | "pending";
  message?: string;
  redirectUrl?: string | null;
  payment?: {
    id: number;
    requestTransactionId: string | null;
    amount: number;
    currency: CheckoutCurrency;
    planId: PlanId;
    billingPeriod: BillingPeriod;
    paymentMethod: PaymentMethodType;
    payerPhone: string | null;
  };
};

export type EventSettingsAccessState = {
  guestCapacity: number | null;
  rsvpAccessMode: "open_rsvp" | "invite_only";
  requireApproval: boolean;
  allowAdditionalGuests: boolean;
  maxAdditionalGuests: number | null;
  contributionCollectionMode: "offline" | "platform" | "optional";
  contributionAmount: number | null;
  contributionPaymentInfo: string | null;
  attendeeCategories: unknown;
  customQuestions: unknown;
  whatsappEnabled: boolean;
};
