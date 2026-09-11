import { env } from "@/lib/env";
import {
  requestConfiguredPayment,
} from "@/lib/services/billing/providers/intouch";
import logger from "@/lib/utils/logger";
import type { StartEventPaymentInput, StartEventPaymentResult } from "./types";
import {
  assertIntouchConfigured,
  getIntouchCallbackUrl,
} from "./helpers";
import { createPendingEventPaymentAttempt } from "./queries";
import { updateEventPaymentProviderDetails } from "./queries";
import { confirmEventPaymentSuccess, finalizeEventPaymentFailure } from "./lifecycle";

export async function startEventPayment(
  input: StartEventPaymentInput,
): Promise<StartEventPaymentResult> {
  return startIntouchEventPayment(input);
}

async function startIntouchEventPayment(
  input: StartEventPaymentInput,
): Promise<StartEventPaymentResult> {
  assertIntouchConfigured();

  const created = await createPendingEventPaymentAttempt({
    eventId: input.eventId,
    guestId: input.guestId,
    organizerId: input.organizerId,
    amount: input.amount,
    currency: input.currency,
    providerName: "intouch",
    payerPhone: input.payerPhone,
    payerName: input.payerName,
    rsvpContext: input.rsvpContext ?? null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    const response = await requestConfiguredPayment({
      config: {
        baseUrl: env.INTOUCH_BASE_URL,
        username: env.INTOUCH_USERNAME,
        accountNo: env.INTOUCH_ACCOUNT_NO,
        partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
      },
      mobilePhone: input.payerPhone ?? "",
      amount: input.amount,
      requestTransactionId: created.requestTransactionId!,
      callbackUrl: getIntouchCallbackUrl(input.callbackUrl),
    });

    const synced = await updateEventPaymentProviderDetails(created.id, {
      providerTransactionId: response.transactionId,
      providerStatusCode: response.responseCode,
      rawProviderStatus: response.raw,
    });

    if (response.state === "succeeded") {
      return {
        payment: await confirmEventPaymentSuccess({
          paymentId: created.id,
          providerTransactionId: response.transactionId,
          providerStatusCode: response.responseCode,
          rawProviderStatus: response.raw,
        }),
        redirectUrl: null,
      };
    }

    if (response.state === "failed") {
      return {
        payment: await finalizeEventPaymentFailure({
          paymentId: created.id,
          providerTransactionId: response.transactionId,
          providerStatusCode: response.responseCode,
          rawProviderStatus: response.raw,
        }),
        redirectUrl: null,
      };
    }

    return { payment: synced, redirectUrl: null };
  } catch (error) {
    logger.warn("Event payment initiation failed after creating pending attempt", {
      eventId: input.eventId,
      guestId: input.guestId,
      error,
    });
    return {
      payment: await finalizeEventPaymentFailure({
        paymentId: created.id,
        providerStatusCode: "REQUEST_INIT_FAILED",
        rawProviderStatus: {
          reason: "Failed to initiate payment with Intouch.",
          message:
            error instanceof Error ? error.message : "Unknown provider error",
        },
      }),
      redirectUrl: null,
    };
  }
}
