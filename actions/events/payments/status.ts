"use server";

import { and, eq, lte, or } from "drizzle-orm";
import db from "@/lib/db";
import { eventPayments } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { ValidationError } from "@/lib/utils/errors";
import {
  getTransactionStatus,
} from "@/lib/services/billing/providers/intouch";
import logger from "@/lib/utils/logger";
import type { EventPaymentRow } from "@/lib/services/events/payments/types";
import { assertIntouchConfigured } from "@/lib/services/events/payments/helpers";
import {
  getEventPaymentByRequestTransactionId,
  updateEventPaymentProviderDetails,
} from "@/lib/services/events/payments/queries";
import {
  confirmEventPaymentSuccess,
  finalizeEventPaymentFailure,
} from "@/lib/services/events/payments/lifecycle";

export async function refreshEventPaymentStatus(
  paymentId: number,
): Promise<EventPaymentRow> {
  const [payment] = await db
    .select()
    .from(eventPayments)
    .where(eq(eventPayments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new ValidationError("Event payment not found.");
  }

  if (payment.status !== "pending") {
    return payment;
  }

  if (
    payment.providerName === "intouch" &&
    payment.expiresAt &&
    payment.expiresAt.getTime() <= Date.now()
  ) {
    return finalizeEventPaymentFailure({
      paymentId: payment.id,
      status: "expired",
      providerStatusCode: payment.providerStatusCode ?? "EXPIRED",
      rawProviderStatus: payment.rawProviderStatus ?? { reason: "expired" },
    });
  }

  if (!payment.providerTransactionId) {
    return payment;
  }

  assertIntouchConfigured();
  const response = await getTransactionStatus({
    baseUrl: env.INTOUCH_BASE_URL!,
    username: env.INTOUCH_USERNAME!,
    accountNo: env.INTOUCH_ACCOUNT_NO!,
    partnerPassword: env.INTOUCH_PARTNER_PASSWORD!,
    requestTransactionId: payment.requestTransactionId ?? "",
    transactionId: payment.providerTransactionId,
  });

  if (response.state === "succeeded") {
    return confirmEventPaymentSuccess({
      paymentId: payment.id,
      providerTransactionId: response.transactionId,
      providerStatusCode: response.responseCode,
      rawProviderStatus: response.raw,
    });
  }

  if (response.state === "failed") {
    return finalizeEventPaymentFailure({
      paymentId: payment.id,
      providerTransactionId: response.transactionId,
      providerStatusCode: response.responseCode,
      rawProviderStatus: response.raw,
    });
  }

  await updateEventPaymentProviderDetails(payment.id, {
    providerTransactionId: response.transactionId,
    providerStatusCode: response.responseCode,
    rawProviderStatus: response.raw,
  });

  return (await getEventPaymentByRequestTransactionId(
    payment.requestTransactionId ?? "",
  )) ?? payment;
}

export async function reconcilePendingEventPayments(options: {
  maxAgeMinutes?: number;
} = {}): Promise<{ succeededPaymentIds: number[]; failedPaymentIds: number[] }> {
  const now = new Date();
  const maxAgeMinutes = options.maxAgeMinutes ?? 5;
  const cutoff = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);

  const rows = await db
    .select()
    .from(eventPayments)
    .where(
      and(
        eq(eventPayments.status, "pending"),
        or(
          lte(eventPayments.expiresAt, now),
          lte(eventPayments.createdAt, cutoff),
        ),
      ),
    )
    .orderBy(eventPayments.createdAt);

  const succeededPaymentIds: number[] = [];
  const failedPaymentIds: number[] = [];

  for (const row of rows) {
    try {
      const refreshed = await refreshEventPaymentStatus(row.id);
      if (refreshed.status === "succeeded") {
        succeededPaymentIds.push(refreshed.id);
      } else if (refreshed.status === "failed" || refreshed.status === "expired") {
        failedPaymentIds.push(refreshed.id);
      } else if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) {
        const expired = await finalizeEventPaymentFailure({
          paymentId: row.id,
          status: "expired",
          providerStatusCode: row.providerStatusCode ?? "STALE_TIMEOUT",
          rawProviderStatus: row.rawProviderStatus ?? { reason: "stale_timeout" },
        });
        failedPaymentIds.push(expired.id);
      }
    } catch (error) {
      logger.warn("Failed to reconcile pending event payment", {
        paymentId: row.id,
        error,
      });
    }
  }

  return { succeededPaymentIds, failedPaymentIds };
}
