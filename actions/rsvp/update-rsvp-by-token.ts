"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import db from "@/lib/db";
import { eventSettings, events, guests, rsvpAdditionalGuests } from "@/lib/db/schema";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";
import { getAppBaseUrl } from "@/lib/utils/url";
import logger from "@/lib/utils/logger";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";
import {
  getPublicEventGuestPath,
  getPublicEventPath,
} from "@/lib/constants/events/profile-paths";
import {
  normalizeAttendeeCategories,
  normalizeCustomQuestionResponses,
} from "@/lib/constants/events/rsvp-config";
import {
  assertEventPaymentCanStart,
} from "@/lib/services/events/payments/helpers";
import {
  formatCustomQuestionResponses,
  mapAdditionalGuestsForEmail,
  sendRsvpUpdateSideEffects,
} from "@/lib/services/events/rsvp-side-effects";
import type {
  UpdateRsvpByTokenErrors,
  UpdateRsvpByTokenInput,
  UpdateRsvpByTokenResult,
} from "@/types/rsvp";
import {
  validateCustomQuestionResponses,
  validateRsvpCoreFields,
  validateAdditionalGuestsCore,
} from "@/lib/services/rsvp/validation";
import { executeRsvpWriteTransaction } from "@/lib/services/rsvp/transactions";
import {
  finalizePaymentIfNeeded,
  getPlatformPaymentRequest,
  readPlatformPaymentMethod,
} from "@/lib/services/rsvp/payment-helpers";

// PUBLIC ACTION — no auth by design (token-scoped: guestToken/confirmationToken validated below)
export async function updateRsvpByToken(
  token: string,
  data: UpdateRsvpByTokenInput,
): Promise<UpdateRsvpByTokenResult> {
  try {
    const normalizedToken = normalizeOpaqueToken(token);
    if (!normalizedToken) {
      return { success: false, message: "Guest link is invalid." };
    }

    const errors: UpdateRsvpByTokenErrors = {};
    const nextStatus = data.rsvpStatus;
    const rsvpNote = data.rsvpNote?.trim() || null;

    const fieldResult = validateRsvpCoreFields({ rsvpStatus: nextStatus, rsvpNote, required: false });
    if (!fieldResult.ok) {
      Object.assign(errors, fieldResult.errors);
    }

    const rawAdditionalGuestCount = data.additionalGuestCount ?? 0;

    const [row] = await db
      .select({
        guestId: guests.id,
        guestName: guests.name,
        guestEmail: guests.email,
        guestPhone: guests.phoneNumber,
        guestToken: guests.guestToken,
        existingCustomQuestionResponses: guests.customQuestionResponses,
        existingStatus: guests.rsvpStatus,
        existingAdditionalGuestCount: guests.additionalGuestCount,
        eventId: events.id,
        eventTitle: events.title,
        eventDate: events.date,
        eventEndDate: events.endDate,
        eventTimezone: events.timezone,
        eventUsername: events.username,
        eventSlug: events.slug,
        eventCreatedBy: events.createdBy,
        eventStatus: events.status,
        locationType: events.locationType,
        locationName: events.locationName,
        locationLink: events.locationLink,
        allowAdditionalGuests: eventSettings.allowAdditionalGuests,
        maxAdditionalGuests: eventSettings.maxAdditionalGuests,
        customQuestions: eventSettings.customQuestions,
        attendeeCategories: eventSettings.attendeeCategories,
        contributionCollectionMode: eventSettings.contributionCollectionMode,
        contributionAmount: eventSettings.contributionAmount,
        contributionPaymentInfo: eventSettings.contributionPaymentInfo,
        currency: eventSettings.currency,
      })
      .from(guests)
      .innerJoin(events, eq(events.id, guests.eventId))
      .leftJoin(eventSettings, eq(eventSettings.eventId, events.id))
      .where(
        sql`${guests.guestToken} = ${normalizedToken} OR ${guests.confirmationToken} = ${normalizedToken}`,
      )
      .limit(1);

    if (!row) {
      return { success: false, message: "Guest link is invalid or expired." };
    }

    if (row.eventStatus !== "published") {
      return { success: false, message: "This event is no longer accepting RSVPs." };
    }

    const existingAdditionalGuests = await db
      .select({
        email: rsvpAdditionalGuests.email,
        sortOrder: rsvpAdditionalGuests.sortOrder,
      })
      .from(rsvpAdditionalGuests)
      .where(eq(rsvpAdditionalGuests.guestId, row.guestId))
      .orderBy(rsvpAdditionalGuests.sortOrder);

    const eventEnd = row.eventEndDate ?? row.eventDate;
    if (new Date(eventEnd).getTime() < Date.now()) {
      return {
        success: false,
        message: "RSVP changes are closed because this event has already started.",
      };
    }

    const attendeeCategories = normalizeAttendeeCategories(row.attendeeCategories);
    const allowAdditionalGuests =
      (row.allowAdditionalGuests ?? false) || attendeeCategories.length > 0;
    const maxAdditionalGuests = allowAdditionalGuests
      ? (row.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
      : 0;
    let additionalGuestCount = 0;
    if (allowAdditionalGuests && nextStatus === "yes") {
      const parsedAdditionalGuestCount =
        Number.isFinite(rawAdditionalGuestCount) && rawAdditionalGuestCount >= 0
          ? Math.floor(rawAdditionalGuestCount)
          : Number.NaN;

      if (Number.isNaN(parsedAdditionalGuestCount)) {
        errors.additionalGuestCount =
          "Additional guests must be a non-negative number";
      } else if (parsedAdditionalGuestCount > maxAdditionalGuests) {
        errors.additionalGuestCount = `You can only bring up to ${maxAdditionalGuests} additional guests`;
      } else {
        additionalGuestCount = parsedAdditionalGuestCount;
      }
    }

    const additionalGuestsInput = Array.isArray(data.additionalGuests)
      ? data.additionalGuests
      : [];
    const existingAdditionalGuestEmails = new Map(
      existingAdditionalGuests.map((guest) => [guest.sortOrder, guest.email]),
    );

    // Pre-process items with email fallback (client may not send unchanged fields)
    const agItems = Array.from({ length: additionalGuestCount }, (_, i) => {
      const item = additionalGuestsInput[i] ?? {};
      const email =
        typeof item.email === "string"
          ? item.email.trim() || null
          : item.email === null
            ? null
            : (existingAdditionalGuestEmails.get(i) ?? null);
      return {
        name: item.name ?? null,
        email,
        categoryId: item.categoryId ?? null,
      };
    });

    const agResult = validateAdditionalGuestsCore({
      items: agItems,
      count: additionalGuestCount,
      allowAdditionalGuests,
      rsvpStatus: nextStatus,
      attendeeCategories,
    });

    if (!agResult.ok) {
      errors.additionalGuestCount = agResult.error;
    }

    const additionalGuestsToInsert = agResult.ok ? agResult.guests : [];

    const customQuestionResult = validateCustomQuestionResponses(
      data.customQuestionResponses ??
        normalizeCustomQuestionResponses(row.existingCustomQuestionResponses),
      row.customQuestions,
      { skipRequired: nextStatus === "no" },
    );
    if (!customQuestionResult.ok) {
      errors.customQuestions = customQuestionResult.error;
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Please fix the errors below",
        errors,
      };
    }

    const customQuestionResponses = customQuestionResult.ok
      ? customQuestionResult.responses
      : null;

    const isOptionalContribution = row.contributionCollectionMode === "optional";
    const isOptionalPaymentStarting =
      isOptionalContribution && nextStatus === "yes" && data.paymentIntent === "start";
    const resolvedContributionAmount =
      isOptionalContribution && data.optionalContributionAmount != null
        ? data.optionalContributionAmount
        : row.contributionAmount;

    const paymentRequest = getPlatformPaymentRequest({
      shouldStart:
        (row.contributionCollectionMode === "platform" || isOptionalPaymentStarting) &&
        nextStatus === "yes" &&
        data.paymentIntent === "start",
      contributionAmount: resolvedContributionAmount,
      attendeeCategories: isOptionalContribution ? [] : attendeeCategories,
      additionalGuests: additionalGuestsToInsert,
      paymentMethod: readPlatformPaymentMethod(data.paymentMethod ?? null),
      payerPhone: data.payerPhone ?? null,
      isTotalAmount: isOptionalContribution && data.optionalContributionAmount != null,
    });

    if (paymentRequest.error) {
      return {
        success: false,
        message: paymentRequest.error,
        errors: { rsvpStatus: "Phone number is required for payment." },
      };
    }

    if (paymentRequest.shouldStart) {
      await assertEventPaymentCanStart(
        row.eventCreatedBy,
        paymentRequest.amount ?? 0,
      );
    }

    // Wrap capacity check + writes in a transaction to prevent race conditions
    const writeResult = await executeRsvpWriteTransaction({
      eventId: row.eventId,
      normalizedEmail: row.guestEmail?.toLowerCase() ?? null,
      nameValue: row.guestName,
      emailValue: row.guestEmail,
      phoneNumber: null,
      preResolvedGuest: {
        id: row.guestId,
        rsvpStatus: row.existingStatus,
        guestToken: row.guestToken,
        additionalGuestCount: row.existingAdditionalGuestCount,
      },
      rsvpStatus: nextStatus,
      rsvpNote,
      additionalGuestCount,
      additionalGuestsToInsert,
      customQuestionResponses,
      paymentShouldStart: paymentRequest.shouldStart,
    });
    if (!writeResult.ok) {
      return { success: false, message: writeResult.message };
    }
    const ensuredGuestToken = writeResult.guestToken;

    const paymentFinalization = await finalizePaymentIfNeeded({
      paymentRequest,
      eventId: row.eventId,
      guestId: row.guestId,
      organizerId: row.eventCreatedBy,
      currency: row.currency ?? "RWF",
      payerName: row.guestName,
      payerEmail: row.guestEmail,
      guestToken: ensuredGuestToken,
      username: row.eventUsername,
      eventSlug: row.eventSlug,
      rsvpContext: {
        rsvpStatus: nextStatus,
        rsvpNote,
        additionalGuestCount,
        additionalGuests: mapAdditionalGuestsForEmail(additionalGuestsToInsert, attendeeCategories),
        customQuestionResponses: formatCustomQuestionResponses(customQuestionResponses, row.customQuestions),
        contributionAmount: resolvedContributionAmount ?? null,
        currency: row.currency ?? null,
      },
    });
    if (paymentFinalization.handled) {
      return paymentFinalization.result;
    }

    const guestPath = getPublicEventGuestPath(
      row.eventUsername,
      row.eventSlug,
      ensuredGuestToken,
    );
    revalidatePath(getPublicEventPath(row.eventUsername, row.eventSlug));
    revalidatePath(guestPath);
    revalidatePath(`/app/events/${row.eventSlug}`);

    const baseUrl = getAppBaseUrl();
    const guestPageLink = `${baseUrl}${guestPath}`;

    await sendRsvpUpdateSideEffects({
      to: row.guestEmail,
      guestId: row.guestId,
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      guestPageLink,
      eventId: row.eventId,
      eventSlug: row.eventSlug,
      eventTitle: row.eventTitle,
      eventDate: row.eventDate,
      eventTimezone: row.eventTimezone,
      organizerId: row.eventCreatedBy,
      rsvpStatus: nextStatus,
      rsvpNote,
      additionalGuestCount,
      additionalGuests: mapAdditionalGuestsForEmail(additionalGuestsToInsert, attendeeCategories),
      customQuestionResponses: formatCustomQuestionResponses(customQuestionResponses, row.customQuestions),
      contributionRequired:
        row.contributionCollectionMode === "platform" || isOptionalPaymentStarting ? true : undefined,
      contributionAmount: resolvedContributionAmount ?? undefined,
      contributionPaymentInfo: row.contributionPaymentInfo,
      currency: row.currency ?? undefined,
    });

    return {
      success: true,
      message: "Your RSVP has been updated.",
      guestToken: ensuredGuestToken,
    };
  } catch (error) {
    logger.error("Error updating RSVP by token", error, { token });
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
