import { env } from "@/lib/env";
import {
  finalizeCallbackPayment,
  parseCallbackPayload,
} from "@/lib/services/billing/providers/intouch";
import type { EventPaymentRow } from "./types";
import {
  getEventPaymentByRequestTransactionId,
  updateEventPaymentProviderDetails,
} from "./queries";
import { confirmEventPaymentSuccess, finalizeEventPaymentFailure } from "./lifecycle";

export function parseEventPaymentCallbackPayload(body: unknown) {
  return parseCallbackPayload(body);
}

export async function finalizeEventPaymentFromCallback(
  payload: {
    requestTransactionId: string;
    transactionId: string | null;
    responseCode: string | null;
    referenceNo: string | null;
  },
  body: unknown,
): Promise<EventPaymentRow | null> {
  return finalizeCallbackPayment<EventPaymentRow>({
    payload,
    body,
    config: {
      baseUrl: env.INTOUCH_BASE_URL,
      username: env.INTOUCH_USERNAME,
      accountNo: env.INTOUCH_ACCOUNT_NO,
      partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
    },
    findByRequestTransactionId: getEventPaymentByRequestTransactionId,
    getStoredRequestTransactionId: (p) => p.requestTransactionId,
    getStoredTransactionId: (p) => p.providerTransactionId,
    updateProviderDetails: updateEventPaymentProviderDetails,
    markSucceeded: async (p, details) => {
      return confirmEventPaymentSuccess({
        paymentId: p.id,
        providerTransactionId: details.providerTransactionId,
        providerReferenceNo: details.providerReferenceNo,
        providerStatusCode: details.providerStatusCode,
        rawProviderStatus: details.rawProviderStatus,
      });
    },
    markFailed: async (p, details) => {
      return finalizeEventPaymentFailure({
        paymentId: p.id,
        providerTransactionId: details.providerTransactionId,
        providerReferenceNo: details.providerReferenceNo,
        providerStatusCode: details.providerStatusCode,
        rawProviderStatus: details.rawProviderStatus,
      });
    },
  });
}
