import {
  and,
  desc,
  eq,
  inArray,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { payments, subscriptions } from "@/lib/db/schema";
import { env } from "@/lib/env";
import {
  getTransactionStatus,
} from "@/lib/services/billing/providers/intouch";
import {
  getPesapalTransactionStatus,
  normalizePesapalState,
} from "@/lib/services/billing/providers/pesapal";
import type {
  PaymentRow,
  SubscriptionRow,
  BillingOverview,
} from "@/types/billing";
import {
  getLatestSubscriptionForUser,
  getFuturePaidSubscription,
} from "@/lib/services/billing/subscriptions";
import {
  getResolvedEntitlements,
} from "@/lib/services/billing/entitlements";
import {
  confirmPaymentSuccess,
  failPayment,
  updatePaymentProviderDetails,
} from "@/lib/services/billing/checkout";

export async function getPaymentById(
  paymentId: number,
  executor: DbExecutor = db,
): Promise<PaymentRow | null> {
  const [row] = await executor
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  return row ?? null;
}

export async function getSubscriptionById(
  subscriptionId: number,
  executor: DbExecutor = db,
): Promise<SubscriptionRow | null> {
  const [row] = await executor
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  return row ?? null;
}

const AUTO_RECONCILABLE_FAILURE_CODES = [
  "PENDING_TIMEOUT",
  "STATUS_CHECK_FAILED",
  "UNRESOLVED_PENDING_TIMEOUT",
  "STALE_TIMEOUT",
] as const;

const PAYMENT_ORDER_BY = [
  desc(payments.paidAt),
  desc(payments.updatedAt),
  desc(payments.createdAt),
] as const;

export function getPaymentStatusPriority(status: PaymentRow["status"]): number {
  switch (status) {
    case "succeeded":
      return 0;
    case "pending":
      return 1;
    case "failed":
      return 2;
    case "refunded":
      return 3;
    default:
      return 4;
  }
}

export function sortPaymentsForHistory(rows: PaymentRow[]): PaymentRow[] {
  return [...rows].sort((a, b) => {
    const statusPriority = getPaymentStatusPriority(a.status) - getPaymentStatusPriority(b.status);
    if (statusPriority !== 0) {
      return statusPriority;
    }

    const aPrimaryTime =
      a.paidAt?.getTime() ?? a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
    const bPrimaryTime =
      b.paidAt?.getTime() ?? b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;

    return bPrimaryTime - aPrimaryTime;
  });
}

export async function getPaymentByRequestTransactionId(
  requestTransactionId: string,
  executor: DbExecutor = db,
): Promise<PaymentRow | null> {
  const [row] = await executor
    .select()
    .from(payments)
    .where(eq(payments.requestTransactionId, requestTransactionId))
    .limit(1);

  return row ?? null;
}

export async function listPaymentsForUser(
  userId: number,
  options: {
    executor?: DbExecutor;
    limit?: number;
  } = {},
): Promise<PaymentRow[]> {
  const executor = options.executor ?? db;
  const limit = options.limit ?? 10;

  const rows = await executor
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));

  return sortPaymentsForHistory(rows).slice(0, limit);
}

export async function getLatestPaymentForUser(
  userId: number,
  executor: DbExecutor = db,
): Promise<PaymentRow | null> {
  const [row] = await listPaymentsForUser(userId, { executor, limit: 1 });
  return row ?? null;
}

export async function getBillingOverview(
  userId: number,
  executor: DbExecutor = db,
): Promise<BillingOverview> {
  await reconcilePendingPayments({
    executor,
    userId,
    maxAgeMinutes: 5,
  });

  const [
    entitlements,
    latestSubscription,
    futureSubscription,
    latestPayment,
    recentPayments,
  ] =
    await Promise.all([
      getResolvedEntitlements(userId, executor),
      getLatestSubscriptionForUser(userId, executor),
      getFuturePaidSubscription(userId, executor),
      getLatestPaymentForUser(userId, executor),
      listPaymentsForUser(userId, { executor, limit: 10 }),
    ]);

  return {
    entitlements,
    latestSubscription,
    futureSubscription,
    latestPayment,
    recentPayments,
  };
}

export async function failStalePendingPayments(
  options: {
    executor?: DbExecutor;
    now?: Date;
    maxAgeHours?: number;
  } = {},
): Promise<{ failedPaymentIds: number[] }> {
  const executor = options.executor ?? db;
  const now = options.now ?? new Date();
  const maxAgeHours = options.maxAgeHours ?? 24;

  const threshold = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);

  const rows = await executor
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.status, "pending"),
        lte(payments.createdAt, threshold)
      )
    );

  if (rows.length === 0) {
    return { failedPaymentIds: [] };
  }

  await executor
    .update(payments)
    .set({
      status: "failed",
      providerStatusCode: "STALE_TIMEOUT",
      rawProviderStatus: { reason: "Automatically failed after stuck pending for > " + maxAgeHours + " hours" },
      updatedAt: now,
    })
    .where(
      inArray(
        payments.id,
        rows.map((row) => row.id)
      )
    );

  return { failedPaymentIds: rows.map((row) => row.id) };
}

export async function reconcilePendingPayments(
  options: {
    executor?: DbExecutor;
    now?: Date;
    maxAgeMinutes?: number;
    userId?: number;
  } = {},
): Promise<{ succeededPaymentIds: number[]; failedPaymentIds: number[] }> {
  const executor = options.executor ?? db;
  const now = options.now ?? new Date();
  const maxAgeMinutes = options.maxAgeMinutes ?? 5;
  const threshold = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);

  const pendingCondition = and(
    eq(payments.status, "pending"),
    lte(payments.createdAt, threshold),
  );
  const recoverableFailedCondition = and(
    eq(payments.status, "failed"),
    lte(payments.createdAt, threshold),
    inArray(payments.providerStatusCode, [...AUTO_RECONCILABLE_FAILURE_CODES]),
  );
  const conditions: SQL[] = [or(pendingCondition, recoverableFailedCondition)!];

  if (options.userId != null) {
    conditions.push(eq(payments.userId, options.userId));
  }

  const rows = await executor
    .select()
    .from(payments)
    .where(and(...conditions))
    .orderBy(...PAYMENT_ORDER_BY);

  if (rows.length === 0) {
    return { succeededPaymentIds: [], failedPaymentIds: [] };
  }

  const hasIntouchConfig =
    !!env.INTOUCH_BASE_URL &&
    !!env.INTOUCH_USERNAME &&
    !!env.INTOUCH_ACCOUNT_NO &&
    !!env.INTOUCH_PARTNER_PASSWORD;
  const hasPesapalConfig =
    !!env.PESAPAL_BASE_URL &&
    !!env.PESAPAL_CONSUMER_KEY &&
    !!env.PESAPAL_CONSUMER_SECRET;

  const succeededPaymentIds: number[] = [];
  const failedPaymentIds: number[] = [];

  for (const payment of rows) {
    if (!payment.requestTransactionId) {
      if (payment.status === "pending") {
        await failPayment({
          paymentId: payment.id,
          providerStatusCode: "MISSING_REQUEST_TRANSACTION_ID",
          rawProviderStatus: {
            reason: "Pending payment exceeded max age without a request transaction id.",
          },
        });
        failedPaymentIds.push(payment.id);
      }
      continue;
    }

    if (payment.providerName === "intouch" && hasIntouchConfig) {
      try {
        const response = await getTransactionStatus({
          baseUrl: env.INTOUCH_BASE_URL!,
          username: env.INTOUCH_USERNAME!,
          accountNo: env.INTOUCH_ACCOUNT_NO!,
          partnerPassword: env.INTOUCH_PARTNER_PASSWORD!,
          requestTransactionId: payment.requestTransactionId,
          transactionId:
            payment.providerTransactionId ?? payment.requestTransactionId,
        });

        if (response.state === "succeeded") {
          await confirmPaymentSuccess({
            paymentId: payment.id,
            providerTransactionId: response.transactionId,
            providerStatusCode: response.responseCode,
            rawProviderStatus: response.raw,
          });
          succeededPaymentIds.push(payment.id);
          continue;
        }

        if (response.state === "failed") {
          await failPayment({
            paymentId: payment.id,
            providerStatusCode: response.responseCode,
            rawProviderStatus: response.raw,
          });
          failedPaymentIds.push(payment.id);
          continue;
        }

        if (payment.status === "pending") {
          await updatePaymentProviderDetails(payment.id, {
            providerTransactionId: response.transactionId,
            providerStatusCode: response.responseCode,
            rawProviderStatus: response.raw,
          });
        }
      } catch (error) {
        if (payment.status === "pending") {
          const message = error instanceof Error ? error.message : "Unknown reconciliation error";
          await updatePaymentProviderDetails(payment.id, {
            providerStatusCode: "STATUS_CHECK_FAILED",
            rawProviderStatus: {
              reason: "Failed to check provider status during pending-payment reconciliation.",
              message,
            },
          });
        }
      }
      continue;
    }

    if (payment.providerName === "pesapal" && hasPesapalConfig) {
      if (!payment.providerTransactionId) {
        if (payment.status === "pending") {
          await failPayment({
            paymentId: payment.id,
            providerStatusCode: "MISSING_ORDER_TRACKING_ID",
            rawProviderStatus: {
              reason: "Pending Pesapal payment missing order tracking id.",
            },
          });
          failedPaymentIds.push(payment.id);
        }
        continue;
      }

      try {
        const response = await getPesapalTransactionStatus({
          baseUrl: env.PESAPAL_BASE_URL!,
          consumerKey: env.PESAPAL_CONSUMER_KEY!,
          consumerSecret: env.PESAPAL_CONSUMER_SECRET!,
          orderTrackingId: payment.providerTransactionId,
        });
        const state = normalizePesapalState({
          statusCode: response.statusCode,
          paymentStatusDescription: response.paymentStatusDescription,
        });

        if (state === "succeeded") {
          await confirmPaymentSuccess({
            paymentId: payment.id,
            providerTransactionId:
              response.orderTrackingId ?? payment.providerTransactionId,
            providerReferenceNo: response.confirmationCode,
            providerStatusCode:
              response.paymentStatusCode ?? response.paymentStatusDescription,
            rawProviderStatus: response.raw,
          });
          succeededPaymentIds.push(payment.id);
          continue;
        }

        if (state === "failed") {
          await failPayment({
            paymentId: payment.id,
            providerStatusCode:
              response.paymentStatusCode ?? response.paymentStatusDescription,
            rawProviderStatus: response.raw,
          });
          failedPaymentIds.push(payment.id);
          continue;
        }

        await updatePaymentProviderDetails(payment.id, {
          providerTransactionId:
            response.orderTrackingId ?? payment.providerTransactionId,
          providerReferenceNo: response.confirmationCode,
          providerStatusCode:
            response.paymentStatusCode ?? response.paymentStatusDescription,
          rawProviderStatus: response.raw,
        });
      } catch (error) {
        if (payment.status === "pending") {
          const message = error instanceof Error ? error.message : "Unknown reconciliation error";
          await updatePaymentProviderDetails(payment.id, {
            providerStatusCode: "STATUS_CHECK_FAILED",
            rawProviderStatus: {
              reason: "Failed to check provider status during pending-payment reconciliation.",
              message,
            },
          });
        }
      }
      continue;
    }

    if (payment.providerName !== "intouch" && payment.providerName !== "pesapal") {
      if (payment.status === "pending") {
        await failPayment({
          paymentId: payment.id,
          providerStatusCode: "UNRESOLVED_PENDING_TIMEOUT",
          rawProviderStatus: {
            reason: "Pending payment exceeded max age and could not be reconciled.",
          },
        });
        failedPaymentIds.push(payment.id);
      }
      continue;
    }

    if (payment.status === "pending") {
      await failPayment({
        paymentId: payment.id,
        providerStatusCode: "UNRESOLVED_PENDING_TIMEOUT",
        rawProviderStatus: {
          reason: "Pending payment exceeded max age and could not be reconciled.",
        },
      });
      failedPaymentIds.push(payment.id);
    }
  }

  return { succeededPaymentIds, failedPaymentIds };
}
