import { revalidatePath } from "next/cache";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import type { PaymentMethodType } from "@/types/billing";
import type {
  AttendeeCategory,
} from "@/types/events";
import {
  computeEventPaymentAmount,
  getEventPaymentFailureMessage,
} from "@/lib/services/events/payments/helpers";
import { startEventPayment } from "@/lib/services/events/payments/start";
import type { RsvpContext } from "@/lib/services/events/payments/types";
import { formatPhoneForDisplay, parseRwandanMobile } from "@/lib/utils/phone";
import type { AdditionalGuestDetail, PaymentActionPayload } from "@/types/rsvp";

export function getPlatformPaymentRequest(params: {
  shouldStart: boolean;
  contributionAmount: number | null;
  attendeeCategories: AttendeeCategory[];
  additionalGuests: AdditionalGuestDetail[];
  paymentMethod: PaymentMethodType;
  payerPhone: string | null;
  isTotalAmount?: boolean;
}):
  | {
      shouldStart: false;
      paymentMethod: PaymentMethodType;
      payerPhone: null;
      amount: null;
      error?: undefined;
    }
  | {
      shouldStart: true;
      paymentMethod: PaymentMethodType;
      payerPhone: string | null;
      amount: number | null;
      error?: string;
    } {
  if (!params.shouldStart) {
    return {
      shouldStart: false,
      paymentMethod: params.paymentMethod,
      payerPhone: null,
      amount: null,
    };
  }

  const computedAmount = computeEventPaymentAmount({
    attendeeCategories: params.attendeeCategories,
    contributionAmount: params.contributionAmount,
    additionalGuests: params.additionalGuests,
    isTotalAmount: params.isTotalAmount,
  });

  if (computedAmount <= 0) {
    return {
      shouldStart: false,
      paymentMethod: params.paymentMethod,
      payerPhone: null,
      amount: null,
    };
  }

  if (!params.payerPhone?.trim()) {
    return {
      shouldStart: true,
      paymentMethod: params.paymentMethod,
      payerPhone: null,
      amount: null,
      error: "Phone number is required for payment.",
    };
  }

  const payerPhone = parseRwandanMobile(params.payerPhone);
  if (!payerPhone) {
    return {
      shouldStart: true,
      paymentMethod: params.paymentMethod,
      payerPhone: null,
      amount: null,
      error: "Enter a valid Rwandan MTN MoMo or Airtel Money number.",
    };
  }

  return {
    shouldStart: true,
    paymentMethod: params.paymentMethod,
    payerPhone,
    amount: computedAmount,
  };
}

export function readPlatformPaymentMethod(value: string | null): PaymentMethodType {
  if (value === "airtel_money") {
    return value;
  }
  return "mtn_momo";
}

export function buildPaymentActionPayload(
  payment: {
    id: number;
    requestTransactionId: string | null;
    amount: number;
    currency: string;
    status: string;
    providerName?: string | null;
    payerPhone: string | null;
  },
  fallbackPhone: string | null,
): PaymentActionPayload {
  return {
    id: payment.id,
    requestTransactionId: payment.requestTransactionId ?? "",
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paymentMethod: "mobile_money",
    payerPhone:
      formatPhoneForDisplay(payment.payerPhone) ||
      formatPhoneForDisplay(fallbackPhone),
  };
}

export function buildStartPaymentResult(params: {
  payment: {
    id: number;
    requestTransactionId: string | null;
    amount: number;
    currency: string;
    status: string;
    providerName?: string | null;
    payerPhone: string | null;
    providerStatusCode?: string | null;
    rawProviderStatus?: unknown;
  };
  guestToken: string;
  fallbackPhone: string | null;
  redirectUrl?: string | null;
}) {
  if (
    params.payment.status === "failed" ||
    params.payment.status === "expired"
  ) {
    return {
      success: false as const,
      message: getEventPaymentFailureMessage(params.payment),
    };
  }

  return {
    paymentPending: params.payment.status === "pending",
    success: true,
    message:
      params.payment.status === "succeeded"
        ? "Payment confirmed. Your RSVP is confirmed."
        : "Payment initiated. Approve the prompt on your phone.",
    guestToken: params.guestToken,
    payment: buildPaymentActionPayload(params.payment, params.fallbackPhone),
    redirectUrl: params.redirectUrl ?? null,
  };
}

export async function finalizePaymentIfNeeded(params: {
  paymentRequest: { shouldStart: boolean; amount: number | null; paymentMethod: PaymentMethodType; payerPhone: string | null };
  eventId: number;
  guestId: number;
  organizerId: number;
  currency: string;
  payerName: string;
  payerEmail: string | null;
  guestToken: string;
  username: string;
  eventSlug: string;
  rsvpContext: RsvpContext;
}): Promise<{ handled: false } | { handled: true; result: Awaited<ReturnType<typeof startPlatformPaymentAndRevalidate>> | { success: false; message: string } }> {
  if (!params.paymentRequest.shouldStart) {
    return { handled: false };
  }
  if (params.paymentRequest.amount == null) {
    return { handled: true, result: { success: false, message: "Payment amount is missing." } };
  }
  const result = await startPlatformPaymentAndRevalidate({
    eventId: params.eventId,
    guestId: params.guestId,
    organizerId: params.organizerId,
    amount: params.paymentRequest.amount,
    currency: params.currency,
    paymentMethod: params.paymentRequest.paymentMethod,
    payerPhone: params.paymentRequest.payerPhone,
    payerName: params.payerName,
    payerEmail: params.payerEmail,
    guestToken: params.guestToken,
    username: params.username,
    eventSlug: params.eventSlug,
    rsvpContext: params.rsvpContext,
  });
  return { handled: true, result };
}

export async function startPlatformPaymentAndRevalidate(params: {
  eventId: number;
  guestId: number;
  organizerId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  payerPhone: string | null;
  payerName: string;
  payerEmail?: string | null;
  guestToken: string;
  username: string;
  eventSlug: string;
  rsvpContext?: RsvpContext | null;
}) {
  const result = await startEventPayment({
    eventId: params.eventId,
    guestId: params.guestId,
    organizerId: params.organizerId,
    amount: params.amount,
    currency: params.currency,
    paymentMethod: "mobile_money",
    payerPhone: params.payerPhone,
    payerName: params.payerName,
    payerEmail: params.payerEmail,
    rsvpContext: params.rsvpContext ?? null,
  });

  revalidatePath(getPublicEventPath(params.username, params.eventSlug));
  revalidatePath(`/app/events/${params.eventSlug}`);

  return buildStartPaymentResult({
    payment: result.payment,
    guestToken: params.guestToken,
    fallbackPhone: params.payerPhone,
    redirectUrl: result.redirectUrl,
  });
}
