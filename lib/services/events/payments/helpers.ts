import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { getAppBaseUrl } from "@/lib/utils/url";
import { ValidationError } from "@/lib/utils/errors";
import type { AttendeeCategory } from "@/types/events";
import { assertIntouchConfig } from "@/lib/services/billing/providers/intouch";
import { assertCanUseBillingFeature } from "@/lib/services/billing/entitlements";
import type { DbExecutor } from "@/lib/db/serverless";
import {
  normalizeAttendeeCategories,
} from "@/lib/constants/events/rsvp-config";
import logger from "@/lib/utils/logger";

export function assertIntouchConfigured() {
  assertIntouchConfig({
    baseUrl: env.INTOUCH_BASE_URL,
    username: env.INTOUCH_USERNAME,
    accountNo: env.INTOUCH_ACCOUNT_NO,
    partnerPassword: env.INTOUCH_PARTNER_PASSWORD,
  });
}

export function buildRequestTransactionId(eventId: number, guestId: number) {
  const random = randomUUID().replace(/-/g, "").slice(0, 12);
  return `eventpay-${eventId}-${guestId}-${Date.now()}-${random}`;
}

export function getIntouchCallbackUrl(explicit?: string | null) {
  if (explicit) return explicit;

  try {
    return new URL("/api/events/payments/intouch/callback", getAppBaseUrl()).toString();
  } catch (error) {
    logger.warn("Invalid Intouch event callback URL base", {
      source: "event-payments.start",
      error,
    });
    return undefined;
  }
}

export async function assertEventPaymentCanStart(
  organizerId: number,
  amount: number,
  executor?: DbExecutor,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError("This event does not have a valid payable amount.");
  }

  await assertCanUseBillingFeature(organizerId, "eventContributions", executor);
}

export function computeEventPaymentAmount(input: {
  attendeeCategories: AttendeeCategory[];
  contributionAmount: number | null;
  additionalGuests: Pick<AdditionalGuestDetail, "categoryId">[];
  isTotalAmount?: boolean;
}): number {
  if (input.isTotalAmount) {
    return input.contributionAmount ?? 0;
  }

  const normalizedCategories = normalizeAttendeeCategories(input.attendeeCategories);

  if (normalizedCategories.length > 0) {
    const primaryCategory = normalizedCategories[0];
    const additionalTotal = input.additionalGuests.reduce((sum, guest) => {
      const category = normalizedCategories.find((item) => item.id === guest.categoryId);
      return sum + (category?.contributionAmount ?? 0);
    }, 0);
    return (primaryCategory?.contributionAmount ?? 0) + additionalTotal;
  }

  const amountPerGuest = input.contributionAmount ?? 0;
  return amountPerGuest * (1 + input.additionalGuests.length);
}

export function getEventPaymentFailureMessage(payment: {
  providerStatusCode?: string | null;
  rawProviderStatus?: unknown;
}) {
  if (payment.providerStatusCode === "REQUEST_INIT_FAILED") {
    return "We could not reach the payment provider. Please try again.";
  }

  const providerMessage =
    typeof payment.rawProviderStatus === "object" &&
    payment.rawProviderStatus !== null &&
    "message" in payment.rawProviderStatus &&
    typeof payment.rawProviderStatus.message === "string"
      ? payment.rawProviderStatus.message
      : null;

  if (providerMessage?.toLowerCase().includes("phone")) {
    return "Enter a valid Rwanda mobile number starting with 07.";
  }

  return "Your payment could not be initiated. Please try again.";
}

type AdditionalGuestDetail = {
  categoryId: string | null;
};
