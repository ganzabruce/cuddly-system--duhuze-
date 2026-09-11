"use server";


import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { getCurrentUser } from "@/lib/services/auth/auth";
import { updateEvent as updateEventService } from "@/actions/events/update-event";
import { deleteEvent as deleteEventService } from "@/actions/events/delete-event";
import { getEventById } from "@/actions/events/get-events";
import type { ImageFormat } from "@/types/events";
import { createEventWithdrawal } from "@/lib/services/events/withdrawals";
import type {
  AttendeeCategory,
  CustomRsvpQuestion,
} from "@/types/events";
import { getEventEndedAt, normalizeStatusValue } from "@/lib/utils/event-status";
import type { EventStatus } from "@/types/events";
import {
  DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP,
  MAX_ADDITIONAL_GUESTS_PER_RSVP,
} from "@/lib/constants/events/rsvp-limits";
import {
  parseBoundedInteger,
  parseContributionAmount,
  parseEventCoreFields,
  parseRsvpAccessMode,
  normalizeOptionalString,
} from "@/lib/services/events/form-utils";
import {
  parseAttendeeCategories,
  parseCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
export async function updateEvent(
  eventId: number,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const coreResult = parseEventCoreFields(formData, { requireLocationType: true });
  if (coreResult.error || !coreResult.value) {
    return { error: coreResult.error ?? "Invalid event data" };
  }
  const {
    title,
    description,
    category,
    date,
    endDate,
    timezone,
    locationType,
    locationName,
    safeLocationLink,
    image,
    imageFormat,
    visibility,
    effectiveStatus,
  } = coreResult.value;

  const rsvpAccessMode = parseRsvpAccessMode(formData.get("rsvpAccessMode"));
  const requireApproval = formData.get("requireApproval") === "true" || formData.get("requireApproval") === "on";
  const allowAdditionalGuests =
    formData.get("allowAdditionalGuests") === "true" ||
    formData.get("allowAdditionalGuests") === "on";
  const maxAdditionalGuestsRaw = formData.get("maxAdditionalGuests");
  const contributionAmountRaw = formData.get("contributionAmount");
  const contributionPaymentInfoRaw = formData.get("contributionPaymentInfo");
  const contributionCollectionModeRaw = formData.get("contributionCollectionMode");
  const contributionPaymentInfo = normalizeOptionalString(contributionPaymentInfoRaw);
  const maxCapacityRaw = formData.get("maxCapacity");
  const customRsvpQuestionsRaw = formData.get("customRsvpQuestions");
  const customQuestionsResult = parseCustomQuestions(customRsvpQuestionsRaw);
  if (customQuestionsResult.error) {
    return { error: customQuestionsResult.error };
  }
  const customQuestions = customQuestionsResult.value;
  const attendeeCategoriesRaw = formData.get("attendeeCategories");
  const attendeeCategoriesResult = parseAttendeeCategories(attendeeCategoriesRaw);
  if (attendeeCategoriesResult.error) {
    return { error: attendeeCategoriesResult.error };
  }
  const attendeeCategories = attendeeCategoriesResult.value;
  const hasCategoryPricing =
    attendeeCategories?.some((category) => category.contributionAmount > 0) ??
    false;

  const maxCapacityResult = parseBoundedInteger(maxCapacityRaw, {
    min: 1,
    max: 10000,
    errorMessage: "Max capacity must be between 1 and 10000",
  });
  if (maxCapacityResult.error) {
    return { error: maxCapacityResult.error };
  }
  const maxCapacity = maxCapacityResult.value;
  const maxAdditionalGuestsResult = parseBoundedInteger(maxAdditionalGuestsRaw, {
    min: 1,
    max: MAX_ADDITIONAL_GUESTS_PER_RSVP,
    errorMessage: `Max additional guests must be between 1 and ${MAX_ADDITIONAL_GUESTS_PER_RSVP}`,
  });
  if (maxAdditionalGuestsResult.error) {
    return { error: maxAdditionalGuestsResult.error };
  }
  const contributionAmountResult = parseContributionAmount(contributionAmountRaw);
  if (contributionAmountResult.error) {
    return { error: contributionAmountResult.error };
  }
  const contributionAmount = contributionAmountResult.value;
  const contributionCollectionMode =
    contributionCollectionModeRaw === "platform"
      ? "platform"
      : contributionCollectionModeRaw === "optional"
        ? "optional"
        : "offline";
  if (
    contributionCollectionMode === "platform" &&
    !hasCategoryPricing &&
    (contributionAmount == null || contributionAmount <= 0)
  ) {
    return { error: "Contribution amount is required" };
  }
  const hasAttendeeCategories = (attendeeCategories?.length ?? 0) > 0;
  const effectiveAllowAdditionalGuests =
    allowAdditionalGuests || hasAttendeeCategories;
  const maxAdditionalGuests = effectiveAllowAdditionalGuests
    ? (maxAdditionalGuestsResult.value ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
    : null;

  const data = {
    title,
    description: description ?? undefined,
    category: category || undefined,
    date,
    endDate: endDate || undefined,
    timezone: timezone || undefined,
    locationType,
    locationName,
    locationLink: safeLocationLink ?? undefined,
    image: image ?? undefined,
    imageFormat,
    visibility: visibility as "public" | "private",
    status: effectiveStatus as
      | "draft"
      | "published"
      | "completed"
      | "cancelled",
    maxCapacity,
    contributionCollectionMode,
    contributionAmount: !hasCategoryPricing
      ? contributionAmount
      : null,
    contributionPaymentInfo:
      contributionCollectionMode === "offline"
        ? contributionPaymentInfo || null
        : null,
    ...(customQuestions !== undefined ? { customQuestions } : {}),
    ...(attendeeCategories !== undefined ? { attendeeCategories } : {}),
    rsvpAccessMode,
    requireApproval,
    allowAdditionalGuests: effectiveAllowAdditionalGuests,
    maxAdditionalGuests,
  };

  const event = await updateEventService(eventId, data, user.id);

  revalidatePath("/explore");
  revalidatePath(`/app/events/${event.slug}`);
  revalidatePath(getPublicEventPath(event.username, event.slug));
  return {};
}

export async function updateEventSlug(
  eventId: number,
  newSlug: string,
): Promise<{ error?: string; slug?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const slug = newSlug.trim().toLowerCase();

  if (!slug) {
    return { error: "Event link is required" };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Only lowercase letters, numbers, and dashes allowed" };
  }
  if (slug.length > 255) {
    return { error: "Event link is too long" };
  }

  const event = await getEventById(eventId, user.id);
  if (slug === event.slug) {
    return { slug: event.slug };
  }

  try {
    const updatedEvent = await updateEventService(
      eventId,
      { slug },
      user.id,
    );

    revalidatePath("/explore");
    revalidatePath("/app/events");
    revalidatePath(`/app/events/${event.slug}`);
    revalidatePath(`/app/events/${updatedEvent.slug}`);
    revalidatePath(getPublicEventPath(event.username, event.slug));
    revalidatePath(getPublicEventPath(updatedEvent.username, updatedEvent.slug));

    return { slug: updatedEvent.slug };
  } catch (err) {
    const error = err as { code?: string; cause?: { code?: string } };
    const code = error.code ?? error.cause?.code;
    if (code === "23505") {
      return { error: "This event link is already taken" };
    }
    if (err instanceof Error && err.message.includes("already taken")) {
      return { error: "This event link is already taken" };
    }
    return { error: "Failed to update event link" };
  }
}

export async function updateEventImage(
  eventId: number,
  imageUrl: string,
  imageFormat?: ImageFormat,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const event = await updateEventService(
    eventId,
    { image: imageUrl || undefined, ...(imageFormat && { imageFormat }) },
    user.id,
  );

  revalidatePath(`/app/events/${event.slug}`);
  revalidatePath(getPublicEventPath(event.username, event.slug));
  return {};
}

export async function updateEventSettings(
  eventId: number,
  settings: {
    status: "draft" | "published" | "completed" | "cancelled";
    maxCapacity: number | null;
    rsvpAccessMode: "open_rsvp" | "invite_only";
    requireApproval: boolean;
    allowAdditionalGuests: boolean;
    maxAdditionalGuests: number | null;
    contributionCollectionMode: "offline" | "platform" | "optional";
    contributionAmount: number | null;
    contributionPaymentInfo: string | null;
    customQuestions: CustomRsvpQuestion[] | null;
    attendeeCategories: AttendeeCategory[] | null;
    whatsappEnabled?: boolean;
  },
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const existing = await getEventById(eventId, user.id);
  const sanitizedStatus =
    settings.status === "completed" ? "published" : settings.status;
  const eventEndedAt = getEventEndedAt({
    date: new Date(existing.date),
    endDate: existing.endDate ? new Date(existing.endDate) : null,
    status: sanitizedStatus,
  });
  const normalizedStatus =
    normalizeStatusValue(sanitizedStatus, eventEndedAt) ?? sanitizedStatus;

  const hasCategoryPricing =
    settings.attendeeCategories?.some((category) => category.contributionAmount > 0) ??
    false;
  const effectiveAllowAdditionalGuests =
    settings.allowAdditionalGuests || (settings.attendeeCategories?.length ?? 0) > 0;
  if (
    settings.contributionCollectionMode === "platform" &&
    !hasCategoryPricing
  ) {
    if (
      settings.contributionAmount == null ||
      settings.contributionAmount <= 0
    ) {
      return { error: "Contribution amount is required" };
    }
  }
  if (
    settings.contributionCollectionMode === "offline" &&
    (hasCategoryPricing || (settings.contributionAmount ?? 0) > 0) &&
    !settings.contributionPaymentInfo?.trim()
  ) {
    return { error: "Payment instructions are required" };
  }

  const event = await updateEventService(
    eventId,
    {
      status: normalizedStatus as EventStatus,
      maxCapacity: settings.maxCapacity,
      rsvpAccessMode: settings.rsvpAccessMode,
      requireApproval: settings.requireApproval,
      allowAdditionalGuests: effectiveAllowAdditionalGuests,
      maxAdditionalGuests: effectiveAllowAdditionalGuests
        ? (settings.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
        : null,
      contributionCollectionMode: settings.contributionCollectionMode,
      contributionAmount: !hasCategoryPricing
        ? settings.contributionAmount
        : null,
      contributionPaymentInfo:
        settings.contributionCollectionMode === "offline"
          ? settings.contributionPaymentInfo
          : null,
      customQuestions: settings.customQuestions,
      attendeeCategories: settings.attendeeCategories,
      ...(settings.whatsappEnabled !== undefined && { whatsappEnabled: settings.whatsappEnabled }),
    },
    user.id,
  );

  revalidatePath("/explore");
  revalidatePath(`/app/events/${event.slug}`);
  revalidatePath(getPublicEventPath(event.username, event.slug));
  return {};
}

export async function deleteEvent(eventId: number): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const event = await getEventById(eventId, user.id);
    await deleteEventService(eventId, user.id);
    revalidatePath("/app/events");
    revalidatePath(getPublicEventPath(event.username, event.slug));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }

  redirect("/app/events");
}

export async function requestEventWithdrawal(
  eventId: number,
  input: {
    amount: number;
    destinationPhone: string;
    reason?: string | null;
  },
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const event = await getEventById(eventId, user.id);

    const withdrawal = await createEventWithdrawal({
      eventId,
      organizerId: user.id,
      amount: input.amount,
      destinationPhone: input.destinationPhone,
      reason: input.reason ?? null,
    });

    if (withdrawal.status === "failed") {
      return { error: "The payout provider could not process this withdrawal request." };
    }

    revalidatePath(`/app/events/${event.slug}`);
    revalidatePath(getPublicEventPath(event.username, event.slug));
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to process the withdrawal request.",
    };
  }
}
