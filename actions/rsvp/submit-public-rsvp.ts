"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import {
  assertEventPaymentCanStart,
} from "@/lib/services/events/payments/helpers";
import {
  normalizeAttendeeCategories,
} from "@/lib/constants/events/rsvp-config";
import {
  formatCustomQuestionResponses,
  mapAdditionalGuestsForEmail,
  sendRsvpConfirmationSideEffects,
} from "@/lib/services/events/rsvp-side-effects";
import logger from "@/lib/utils/logger";
import { getEventPublic } from "@/actions/events/get-events";
import { executeRsvpWriteTransaction } from "@/lib/services/rsvp/transactions";
import {
  extractRsvpRouteParams,
  getString,
  parseAdditionalGuestCount,
  parseAdditionalGuestDetails,
  extractCustomQuestionAnswers,
  validateCustomQuestionResponses,
  validateRsvpFields,
} from "@/lib/services/rsvp/validation";
import type { AdditionalGuestDetail, FormState, RsvpStatus } from "@/types/rsvp";
import {
  finalizePaymentIfNeeded,
  getPlatformPaymentRequest,
  readPlatformPaymentMethod,
} from "@/lib/services/rsvp/payment-helpers";

type ValidatedRsvp = {
  nameValue: string;
  emailValue: string | null;
  normalizedEmail: string | null;
  phoneNumber: string | null;
  rsvpStatus: RsvpStatus;
  rsvpNote: string | null;
  inviteToken: string | null;
  additionalGuestCount: number;
  additionalGuestsToInsert: AdditionalGuestDetail[];
  customQuestionResponses: Record<string, string> | null;
  isOptionalAndPaying: boolean;
  optionalContributionAmount: number | null;
};

function validateRsvpSubmission(
  formData: FormData,
  event: NonNullable<Awaited<ReturnType<typeof getEventPublic>>>,
): { ok: true; validated: ValidatedRsvp } | { ok: false; state: FormState } {
  const fieldResult = validateRsvpFields(formData);
  if (!fieldResult.ok) {
    return { ok: false, state: { success: false, message: "Please fix the errors below", errors: fieldResult.errors } };
  }
  const { name: nameValue, email: emailValue, phoneNumber, rsvpStatus, rsvpNote, inviteToken, additionalGuestCountRaw } = fieldResult;

  const attendeeCategories = normalizeAttendeeCategories(event.attendeeCategories);
  const allowAdditionalGuests = (event.allowAdditionalGuests ?? false) || attendeeCategories.length > 0;
  const maxAdditionalGuests = allowAdditionalGuests
    ? (event.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
    : 0;

  const cqAnswers = rsvpStatus === "no" ? null : extractCustomQuestionAnswers(formData, event.customQuestions);
  const cqResult = rsvpStatus === "no"
    ? { ok: true as const, responses: null }
    : validateCustomQuestionResponses(cqAnswers, event.customQuestions);
  if (!cqResult.ok) {
    return { ok: false, state: { success: false, message: "Please fix the errors below", errors: { customQuestions: cqResult.error } } };
  }

  const countResult = parseAdditionalGuestCount(additionalGuestCountRaw, allowAdditionalGuests, maxAdditionalGuests);
  if (!countResult.ok) {
    return { ok: false, state: { success: false, message: "Please fix the errors below", errors: { additionalGuestCount: countResult.error } } };
  }

  const detailsResult = parseAdditionalGuestDetails(formData, countResult.count, allowAdditionalGuests, rsvpStatus, attendeeCategories);
  if (!detailsResult.ok) {
    return { ok: false, state: { success: false, message: "Please fix the errors below", errors: { additionalGuestCount: detailsResult.error } } };
  }

  const isOptionalAndPaying =
    event.contributionCollectionMode === "optional" &&
    getString(formData, "skipContribution") !== "true";
  const rawOptionalAmount = getString(formData, "optionalContributionAmount");
  const parsedOptionalAmount = rawOptionalAmount ? parseInt(rawOptionalAmount, 10) : NaN;
  const optionalContributionAmount =
    isOptionalAndPaying && !Number.isNaN(parsedOptionalAmount) ? parsedOptionalAmount : null;

  return {
    ok: true,
    validated: {
      nameValue,
      emailValue,
      normalizedEmail: emailValue?.toLowerCase() ?? null,
      phoneNumber,
      rsvpStatus,
      rsvpNote,
      inviteToken,
      additionalGuestCount: detailsResult.count,
      additionalGuestsToInsert: detailsResult.guests,
      customQuestionResponses: cqResult.responses,
      isOptionalAndPaying,
      optionalContributionAmount,
    },
  };
}

// PUBLIC ACTION — no auth by design (guest RSVP submission)
export async function submitPublicRsvp(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    // 1. Extract route params
    const route = extractRsvpRouteParams(formData);
    if (!route) {
      return { success: false, message: "Invalid request. Missing event information." };
    }

    // 2. Look up event
    const event = await getEventPublic(route.eventId, route.eventSlug);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    if (event.status !== "published") {
      return { success: false, message: "This event is no longer accepting RSVPs." };
    }

    // 3. Validate all RSVP fields against event settings
    const validationResult = validateRsvpSubmission(formData, event);
    if (!validationResult.ok) {
      return validationResult.state;
    }
    const { nameValue, emailValue, normalizedEmail, phoneNumber, rsvpStatus, rsvpNote, inviteToken,
      additionalGuestCount, additionalGuestsToInsert, customQuestionResponses,
      isOptionalAndPaying, optionalContributionAmount } = validationResult.validated;

    const attendeeCategories = normalizeAttendeeCategories(event.attendeeCategories);

    const clientRequestedPayment = getString(formData, "startPayment") === "true";
    const paymentRequest = getPlatformPaymentRequest({
      shouldStart:
        clientRequestedPayment &&
        (event.contributionCollectionMode === "platform" || isOptionalAndPaying) &&
        rsvpStatus === "yes",
      contributionAmount:
        isOptionalAndPaying && optionalContributionAmount != null
          ? optionalContributionAmount
          : event.contributionAmount,
      attendeeCategories: isOptionalAndPaying ? [] : attendeeCategories,
      additionalGuests: additionalGuestsToInsert,
      paymentMethod: readPlatformPaymentMethod(getString(formData, "paymentMethod")),
      payerPhone: getString(formData, "payerPhone"),
      isTotalAmount: isOptionalAndPaying && optionalContributionAmount != null,
    });

    if (paymentRequest.error) {
      return {
        success: false,
        message: paymentRequest.error,
        errors: { payerPhone: paymentRequest.error },
      };
    }

    if (paymentRequest.shouldStart) {
      await assertEventPaymentCanStart(event.createdBy, paymentRequest.amount ?? 0);
    }

    const persistenceResult = await executeRsvpWriteTransaction({
      eventId: route.eventId,
      normalizedEmail,
      nameValue,
      emailValue,
      phoneNumber,
      resolveGuest: {
        visibility: event.visibility,
        rsvpAccessMode: event.rsvpAccessMode,
        inviteToken,
      },
      rsvpStatus,
      rsvpNote,
      additionalGuestCount,
      additionalGuestsToInsert,
      customQuestionResponses,
      paymentShouldStart: paymentRequest.shouldStart,
    });
    if (!persistenceResult.ok) {
      return { success: false, message: persistenceResult.message };
    }
    const { guestToken } = persistenceResult;

    const paymentFinalization = await finalizePaymentIfNeeded({
      paymentRequest,
      eventId: route.eventId,
      guestId: persistenceResult.guestId,
      organizerId: event.createdBy,
      currency: event.currency ?? "RWF",
      payerName: nameValue,
      payerEmail: emailValue,
      guestToken,
      username: route.username,
      eventSlug: route.eventSlug,
      rsvpContext: {
        rsvpStatus,
        rsvpNote,
        additionalGuestCount,
        additionalGuests: mapAdditionalGuestsForEmail(additionalGuestsToInsert, attendeeCategories),
        customQuestionResponses: formatCustomQuestionResponses(customQuestionResponses, event.customQuestions),
        contributionAmount: isOptionalAndPaying && optionalContributionAmount != null
          ? optionalContributionAmount
          : event.contributionAmount ?? null,
        currency: event.currency ?? null,
      },
    });
    if (paymentFinalization.handled) {
      return paymentFinalization.result;
    }

    // 10. Revalidate paths
    revalidatePath(getPublicEventPath(route.username, route.eventSlug));
    revalidatePath(`/app/events/${route.eventSlug}`);

    // 11. Send confirmation (email and/or WhatsApp)
    await sendRsvpConfirmationSideEffects({
      to: emailValue || null,
      guestName: nameValue,
      guestEmail: emailValue,
      guestPhone: phoneNumber,
      guestToken,
      eventId: route.eventId,
      eventTitle: event.title,
      eventSlug: event.slug,
      eventDate: event.date,
      eventTimezone: event.timezone,
      eventUsername: route.username,
      organizerId: event.createdBy,
      rsvpStatus,
      rsvpNote,
      additionalGuestCount,
      additionalGuests: mapAdditionalGuestsForEmail(
        additionalGuestsToInsert,
        attendeeCategories,
      ),
      customQuestionResponses: formatCustomQuestionResponses(
        customQuestionResponses,
        event.customQuestions,
      ),
      notificationType: persistenceResult.isFirstResponse
        ? "rsvp_received"
        : "rsvp_updated",
      locationName: event.locationName,
      locationLink: event.locationLink,
      locationType: event.locationType,
      contributionRequired:
        event.contributionCollectionMode === "platform" || isOptionalAndPaying,
      contributionAmount:
        isOptionalAndPaying && optionalContributionAmount != null
          ? optionalContributionAmount
          : event.contributionAmount,
      contributionPaymentInfo: event.contributionPaymentInfo,
      currency: event.currency,
    });

    return {
      success: true,
      message: persistenceResult.hadExistingGuest
        ? "Your RSVP has been updated successfully!"
        : "Your RSVP has been submitted successfully!",
      guestToken: guestToken ?? undefined,
    };
  } catch (error) {
    logger.error("Error submitting RSVP", error, {
      eventId: formData.get("eventId"),
      username: formData.get("username"),
      eventSlug: formData.get("eventSlug"),
    });
    const err = error as Error & {
      code?: string;
      cause?: Error & { code?: string };
    };
    const msg = err.message ?? "";
    const code = err.code ?? err.cause?.code;
    const isConnectionError =
      msg.includes("fetch failed") ||
      msg.includes("ETIMEDOUT") ||
      code === "ETIMEDOUT" ||
      err.cause?.message?.includes("ETIMEDOUT");
    return {
      success: false,
      message: isConnectionError
        ? "We couldn't reach our servers. Please check your connection and try again."
        : "An unexpected error occurred. Please try again later.",
    };
  }
}
