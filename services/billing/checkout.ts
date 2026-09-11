import { eq } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { withTransaction } from "@/lib/db/serverless";
import { payments, subscriptions } from "@/lib/db/schema";
import {
  getPlanPriceAmount,
  isPaidPlan,
  PLAN_RANK,
} from "@/lib/constants/billing/constants";
import type {
  BillingPeriod,
  CheckoutCurrency,
  PlanId,
  PaymentPurpose,
} from "@/types/billing";
import { env } from "@/lib/env";
import { AppError, ValidationError } from "@/lib/utils/errors";
import {
  finalizeCallbackPayment,
} from "@/lib/services/billing/providers/intouch";
import type {
  PaymentRow,
  SubscriptionRow,
  CreateCheckoutPaymentInput,
  ConfirmPaymentSuccessInput,
  FailPaymentInput,
} from "@/types/billing";
import {
  addBillingPeriod,
  buildPendingCancellationError,
  buildPendingPlanError,
  enterGracePeriod,
  expireEffectiveSubscriptions,
  getEffectiveSubscription,
  getFuturePaidSubscription,
  isFutureDate,
} from "@/lib/services/billing/subscriptions";
import { reconcilePublishedEventQuota } from "@/lib/services/billing/entitlements";
import {
  getPaymentById,
  getSubscriptionById,
  getPaymentByRequestTransactionId,
} from "@/lib/services/billing/reconciliation";


export function assertPaidPlan(planId: PlanId) {
  if (!isPaidPlan(planId)) {
    throw new ValidationError("The free plan does not require a payment.");
  }
}

export function resolvePaymentPurpose(input: {
  explicitPurpose?: PaymentPurpose;
  effectiveSubscription: SubscriptionRow | null;
  planId: PlanId;
  billingPeriod: BillingPeriod;
}): PaymentPurpose {
  if (input.explicitPurpose) {
    return input.explicitPurpose;
  }

  if (!input.effectiveSubscription) {
    return "new_subscription";
  }

  if (
    input.effectiveSubscription.plan === input.planId &&
    input.effectiveSubscription.billingCycle === input.billingPeriod
  ) {
    return "renewal";
  }

  return "plan_change";
}

export async function createCheckoutPayment(
  input: CreateCheckoutPaymentInput,
): Promise<PaymentRow> {
  assertPaidPlan(input.planId);

  return withTransaction(async (tx) => {
    const now = new Date();
    const effectiveSubscription = await getEffectiveSubscription(
      input.userId,
      tx,
      now,
    );
    const futurePaidSubscription = await getFuturePaidSubscription(
      input.userId,
      tx,
      now,
    );

    if (futurePaidSubscription) {
      throw buildPendingPlanError();
    }

    if (
      effectiveSubscription &&
      effectiveSubscription.plan !== "free" &&
      effectiveSubscription.status === "canceled" &&
      isFutureDate(effectiveSubscription.currentPeriodEnd, now)
    ) {
      throw buildPendingCancellationError();
    }

    const purpose = resolvePaymentPurpose({
      explicitPurpose: input.purpose,
      effectiveSubscription,
      planId: input.planId,
      billingPeriod: input.billingPeriod,
    });

    if (purpose === "new_subscription" && effectiveSubscription) {
      throw new ValidationError(
        "This user already has an active subscription. Use a renewal or plan change instead.",
      );
    }

    if (
      purpose === "renewal" &&
      effectiveSubscription &&
      (effectiveSubscription.plan !== input.planId ||
        effectiveSubscription.billingCycle !== input.billingPeriod)
    ) {
      throw new ValidationError(
        "Renewals must keep the same plan and billing period. Use a plan change instead.",
      );
    }

    const amount =
      input.amountOverride ??
      getPlanPriceAmount(input.planId, input.billingPeriod);

    if (amount <= 0) {
      throw new ValidationError("A paid checkout must have a non-zero amount.");
    }

    const [created] = await tx
      .insert(payments)
      .values({
        userId: input.userId,
        subscriptionId: effectiveSubscription?.id ?? null,
        amount,
        currency: input.currency,
        status: "pending",
        purpose,
        plan: input.planId,
        billingCycle: input.billingPeriod,
        providerName: input.providerName ?? null,
        requestTransactionId: input.requestTransactionId ?? null,
        payerPhone: input.payerPhone ?? null,
        payerName: input.payerName ?? null,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new ValidationError("Failed to create payment.");
    }

    return created;
  });
}

export async function createTestPayment(input: {
  userId: number;
  amount: number;
  currency: CheckoutCurrency;
  providerName: string;
  requestTransactionId: string;
  payerPhone?: string | null;
  payerName?: string | null;
}): Promise<PaymentRow> {
  if (input.amount <= 0) {
    throw new ValidationError("A test payment must have a non-zero amount.");
  }

  const now = new Date();
  const [created] = await db
    .insert(payments)
    .values({
      userId: input.userId,
      subscriptionId: null,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      purpose: "test",
      // plan/billingCycle are NOT NULL; these placeholders are never acted
      // on — confirmPaymentSuccess short-circuits on purpose "test"
      plan: "standard",
      billingCycle: "monthly",
      providerName: input.providerName,
      requestTransactionId: input.requestTransactionId,
      payerPhone: input.payerPhone ?? null,
      payerName: input.payerName ?? null,
      updatedAt: now,
    })
    .returning();

  if (!created) {
    throw new AppError(500, "Failed to create test payment.", "DB_ERROR");
  }

  return created;
}

export async function updatePaymentProviderDetails(
  paymentId: number,
  details: {
    providerTransactionId?: string | null;
    providerReferenceNo?: string | null;
    providerStatusCode?: string | null;
    rawProviderStatus?: unknown;
  },
  executor: DbExecutor = db
): Promise<PaymentRow> {
  const [updated] = await executor
    .update(payments)
    .set({
      providerTransactionId: details.providerTransactionId ?? null,
      providerReferenceNo: details.providerReferenceNo ?? null,
      providerStatusCode: details.providerStatusCode ?? null,
      rawProviderStatus: details.rawProviderStatus ?? null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  if (!updated) {
    throw new ValidationError("Failed to update payment provider details.");
  }

  return updated;
}

export async function finalizePaymentFromCallback(
  payload: {
    requestTransactionId: string;
    transactionId: string | null;
    responseCode: string | null;
    referenceNo: string | null;
  },
  body: unknown,
): Promise<PaymentRow | null> {
  return finalizeCallbackPayment<PaymentRow>({
    payload,
    body,
    config: {
      baseUrl: env.INTOUCH_BASE_URL,
      username: env.INTOUCH_USERNAME,
      accountNo: env.INTOUCH_ACCOUNT_NO,
      partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
    },
    findByRequestTransactionId: getPaymentByRequestTransactionId,
    getStoredRequestTransactionId: (payment) => payment.requestTransactionId,
    getStoredTransactionId: (payment) => payment.providerTransactionId,
    updateProviderDetails: updatePaymentProviderDetails,
    markSucceeded: async (payment, details) => {
      const result = await confirmPaymentSuccess({
        paymentId: payment.id,
        providerTransactionId: details.providerTransactionId,
        providerReferenceNo: details.providerReferenceNo,
        providerStatusCode: details.providerStatusCode,
        rawProviderStatus: details.rawProviderStatus,
      });
      return result.payment;
    },
    markFailed: async (payment, details) => {
      return failPayment({
        paymentId: payment.id,
        providerStatusCode: details.providerStatusCode,
        rawProviderStatus: details.rawProviderStatus,
      });
    },
  });
}

export async function confirmPaymentSuccess(
  input: ConfirmPaymentSuccessInput,
): Promise<{ payment: PaymentRow; subscription: SubscriptionRow | null }> {
  return withTransaction(async (tx) => {
    const now = input.paidAt ?? new Date();
    const payment = await getPaymentById(input.paymentId, tx);

    if (!payment) {
      throw new ValidationError("Payment not found.");
    }

    if (!payment.plan || !payment.billingCycle) {
      throw new ValidationError(
        "Payment is missing plan or billing period metadata.",
      );
    }

    if (payment.status === "refunded") {
      throw new ValidationError(
        "Refunded payments cannot be reactivated as successful.",
      );
    }

    // Admin test payments verify provider integration only — they must never
    // create or modify subscriptions.
    if (payment.purpose === "test") {
      const [updatedTestPayment] = await tx
        .update(payments)
        .set({
          status: "succeeded",
          providerTransactionId:
            input.providerTransactionId ?? payment.providerTransactionId,
          providerReferenceNo:
            input.providerReferenceNo ?? payment.providerReferenceNo,
          providerStatusCode:
            input.providerStatusCode ?? payment.providerStatusCode,
          rawProviderStatus:
            input.rawProviderStatus ?? payment.rawProviderStatus,
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id))
        .returning();

      if (!updatedTestPayment) {
        throw new ValidationError("Failed to finalize test payment.");
      }

      return { payment: updatedTestPayment, subscription: null };
    }

    if (payment.status === "succeeded" && payment.subscriptionId) {
      const existingSubscription = await getSubscriptionById(
        payment.subscriptionId,
        tx,
      );
      if (existingSubscription) {
        return { payment, subscription: existingSubscription };
      }
    }

    const effectiveSubscription =
      payment.subscriptionId != null
        ? await getSubscriptionById(payment.subscriptionId, tx)
        : await getEffectiveSubscription(payment.userId, tx, now);
    const futurePaidSubscription = await getFuturePaidSubscription(
      payment.userId,
      tx,
      now,
    );

    const shouldRenewExisting =
      payment.purpose === "renewal" &&
      effectiveSubscription != null &&
      effectiveSubscription.plan === payment.plan &&
      effectiveSubscription.billingCycle === payment.billingCycle;

    const isScheduledDowngrade =
      payment.purpose === "plan_change" &&
      effectiveSubscription != null &&
      PLAN_RANK[payment.plan] < PLAN_RANK[effectiveSubscription.plan] &&
      !!effectiveSubscription.currentPeriodEnd &&
      effectiveSubscription.currentPeriodEnd.getTime() > now.getTime();
    const isImmediateUpgrade =
      payment.purpose === "plan_change" &&
      effectiveSubscription != null &&
      PLAN_RANK[payment.plan] > PLAN_RANK[effectiveSubscription.plan];

    if (futurePaidSubscription) {
      throw buildPendingPlanError();
    }

    const currentPeriodStart = shouldRenewExisting
      ? effectiveSubscription.currentPeriodStart &&
        effectiveSubscription.currentPeriodStart.getTime() <= now.getTime()
        ? effectiveSubscription.currentPeriodStart
        : now
      : isScheduledDowngrade
        ? effectiveSubscription!.currentPeriodEnd!
        : now;
    const renewalEndAnchor =
      shouldRenewExisting &&
      effectiveSubscription.currentPeriodEnd &&
      effectiveSubscription.currentPeriodEnd.getTime() > now.getTime()
        ? effectiveSubscription.currentPeriodEnd
        : currentPeriodStart;
    const currentPeriodEnd = addBillingPeriod(
      shouldRenewExisting ? renewalEndAnchor : currentPeriodStart,
      payment.billingCycle as BillingPeriod,
    );
    const standardCarryoverMs =
      isImmediateUpgrade &&
      effectiveSubscription?.plan === "standard" &&
      payment.plan === "premium" &&
      effectiveSubscription.currentPeriodEnd
        ? Math.max(
            effectiveSubscription.currentPeriodEnd.getTime() - now.getTime(),
            0,
          )
        : 0;

    let subscription: SubscriptionRow;

    if (shouldRenewExisting && effectiveSubscription) {
      const [updatedSubscription] = await tx
        .update(subscriptions)
        .set({
          status: "active",
          currentPeriodStart,
          currentPeriodEnd,
          gracePeriodEndsAt: null,
          canceledAt: null,
          providerName: payment.providerName ?? effectiveSubscription.providerName,
          source: payment.providerName ?? "payment",
          updatedAt: now,
        })
        .where(eq(subscriptions.id, effectiveSubscription.id))
        .returning();

      if (!updatedSubscription) {
        throw new ValidationError("Failed to renew subscription.");
      }

      subscription = updatedSubscription;
    } else {
      if (!isScheduledDowngrade) {
        await expireEffectiveSubscriptions(payment.userId, tx, now, {
          currentPeriodEnd: now,
        });
      }

      const [createdSubscription] = await tx
        .insert(subscriptions)
        .values({
          userId: payment.userId,
          plan: payment.plan,
          billingCycle: payment.billingCycle,
          status: "active",
          currentPeriodStart,
          currentPeriodEnd,
          gracePeriodEndsAt: null,
          canceledAt: null,
          providerName: payment.providerName ?? null,
          source: isScheduledDowngrade
            ? "scheduled_change"
            : (payment.providerName ?? "payment"),
          notes: isScheduledDowngrade
            ? `Scheduled downgrade from payment ${payment.id}`
            : `Activated from payment ${payment.id}`,
          updatedAt: now,
        })
        .returning();

      if (!createdSubscription) {
        throw new ValidationError("Failed to activate subscription.");
      }

      subscription = createdSubscription;
    }

    if (standardCarryoverMs > 0) {
      const carryoverStart = subscription.currentPeriodEnd;
      const carryoverEnd = new Date(carryoverStart.getTime() + standardCarryoverMs);

      await tx.insert(subscriptions).values({
        userId: payment.userId,
        plan: "standard",
        billingCycle: effectiveSubscription!.billingCycle,
        status: "active",
        currentPeriodStart: carryoverStart,
        currentPeriodEnd: carryoverEnd,
        gracePeriodEndsAt: null,
        canceledAt: null,
        providerName: effectiveSubscription!.providerName,
        source: "carryover",
        notes: `Remaining Standard time preserved after Premium upgrade from payment ${payment.id}`,
        updatedAt: now,
      });
    }

    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: "succeeded",
        subscriptionId: subscription.id,
        providerTransactionId: input.providerTransactionId ?? payment.providerTransactionId,
        providerReferenceNo: input.providerReferenceNo ?? payment.providerReferenceNo,
        providerStatusCode: input.providerStatusCode ?? payment.providerStatusCode,
        rawProviderStatus: input.rawProviderStatus ?? payment.rawProviderStatus,
        payerPhone: input.payerPhone ?? payment.payerPhone,
        payerName: input.payerName ?? payment.payerName,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id))
      .returning();

    await reconcilePublishedEventQuota(payment.userId, tx, now);

    if (!updatedPayment) {
      throw new ValidationError("Failed to finalize payment.");
    }

    return { payment: updatedPayment, subscription };
  });
}

export async function failPayment(
  input: FailPaymentInput,
): Promise<PaymentRow> {
  return withTransaction(async (tx) => {
    const now = new Date();
    const payment = await getPaymentById(input.paymentId, tx);

    if (!payment) {
      throw new ValidationError("Payment not found.");
    }

    if (payment.status === "succeeded" || payment.status === "refunded") {
      return payment;
    }

    const [updatedPayment] = await tx
      .update(payments)
      .set({
        status: "failed",
        providerStatusCode: input.providerStatusCode ?? payment.providerStatusCode,
        rawProviderStatus: input.rawProviderStatus ?? payment.rawProviderStatus,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id))
      .returning();

    if (!updatedPayment) {
      throw new ValidationError("Failed to mark payment as failed.");
    }

    const effectiveSubscription = await getEffectiveSubscription(
      payment.userId,
      tx,
      now,
    );

    if (
      payment.purpose === "renewal" &&
      effectiveSubscription &&
      effectiveSubscription.currentPeriodEnd &&
      effectiveSubscription.currentPeriodEnd.getTime() <= now.getTime()
    ) {
      await enterGracePeriod(payment.userId, {
        executor: tx,
        now,
      });
    }

    return updatedPayment;
  });
}
