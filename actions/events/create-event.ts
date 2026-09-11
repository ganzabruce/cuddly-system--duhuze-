"use server";

import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { withTransaction } from "@/lib/db/serverless";
import { getUserById } from "@/lib/services/auth/user-service";
import { events, eventSettings } from "@/lib/db/schema";
import { createEventSchema } from "@/lib/services/events/validation";
import { generateUniqueSlug } from "@/lib/utils";
import {
  getEventEndedAt,
  normalizeStatusValue,
} from "@/lib/utils/event-status";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import logger from "@/lib/utils/logger";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventLink } from "@/lib/services/notifications/links";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";
import {
  assertCanPublishEvent,
  assertCanUseBillingFeature,
} from "@/lib/services/billing/entitlements";
import {
  didAdvancedEventSettingsChange,
  didAttendeeCategoriesChange,
  didCustomQuestionsChange,
  didEventContributionsChange,
} from "@/lib/services/billing/event-settings";

/**
 * Create a new event
 */
export async function createEvent(data: unknown, userId: number) {
  const validated = createEventSchema.parse(data);

  const user = await getUserById(userId);
  if (!user?.username) {
    throw new NotFoundError("User not found or no username set");
  }

  const existingEvents = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.username, user.username));

  const existingSlugs = existingEvents.map((event) => event.slug);

  const slug = await generateUniqueSlug(validated.title, existingSlugs);

  const statusRaw = validated.status ?? "published";
  const sanitizedStatus = statusRaw === "completed" ? "published" : statusRaw;
  const startDate = new Date(validated.date);
  const endDateValue = validated.endDate ? new Date(validated.endDate) : null;
  const eventEndedAt = getEventEndedAt({
    date: startDate,
    endDate: endDateValue,
    status: sanitizedStatus,
  });
  const effectiveStatus =
    normalizeStatusValue(sanitizedStatus, eventEndedAt) ?? sanitizedStatus;

  const hasCategoryPricing =
    validated.attendeeCategories?.some((category) => category.contributionAmount > 0) ??
    false;
  const effectiveAllowAdditionalGuests =
    (validated.allowAdditionalGuests ?? false) ||
    (validated.attendeeCategories?.length ?? 0) > 0;
  const contributionCollectionMode =
    validated.contributionCollectionMode ??
    (hasCategoryPricing || (validated.contributionAmount ?? 0) > 0
      ? "platform"
      : "offline");

  if (
    contributionCollectionMode === "platform" &&
    !hasCategoryPricing &&
    (validated.contributionAmount == null || validated.contributionAmount <= 0)
  ) {
    throw new ValidationError(
      "Contribution amount is required for platform collection.",
    );
  }

  if (
    contributionCollectionMode === "offline" &&
    (hasCategoryPricing || (validated.contributionAmount ?? 0) > 0) &&
    !validated.contributionPaymentInfo?.trim()
  ) {
    throw new ValidationError(
      "Payment instructions are required for offline collection.",
    );
  }

  const effectiveVisibility = validated.visibility ?? "private";
  const rsvpAccessMode =
    effectiveVisibility === "public"
      ? "open_rsvp"
      : (validated.rsvpAccessMode ?? "open_rsvp");

  const usesAdvancedEventSettings = didAdvancedEventSettingsChange({
    current: {
      guestCapacity: null,
      rsvpAccessMode: "open_rsvp",
      requireApproval: false,
      allowAdditionalGuests: false,
      maxAdditionalGuests: null,
    },
    next: {
      guestCapacity: validated.maxCapacity ?? null,
      rsvpAccessMode,
      requireApproval: validated.requireApproval ?? false,
      allowAdditionalGuests: effectiveAllowAdditionalGuests,
      maxAdditionalGuests: effectiveAllowAdditionalGuests
        ? (validated.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
        : null,
    },
  });
  const usesCustomQuestions = didCustomQuestionsChange(
    null,
    validated.customQuestions ?? null,
  );
  const usesEventContributions = didEventContributionsChange({
    current: {
      contributionCollectionMode: "offline",
      contributionAmount: null,
      contributionPaymentInfo: null,
    },
    next: {
      contributionCollectionMode,
      contributionAmount: hasCategoryPricing
        ? null
        : (validated.contributionAmount ?? null),
      contributionPaymentInfo:
        contributionCollectionMode === "offline"
          ? (validated.contributionPaymentInfo ?? null)
          : null,
    },
  });
  const usesAttendeeCategories = didAttendeeCategoriesChange(
    null,
    validated.attendeeCategories ?? null,
  );

  if (usesAdvancedEventSettings) {
    await assertCanUseBillingFeature(userId, "advancedEventSettings");
  }

  if (usesCustomQuestions) {
    await assertCanUseBillingFeature(userId, "customQuestions");
  }

  if (usesEventContributions) {
    await assertCanUseBillingFeature(userId, "eventContributions");
  }

  if (usesAttendeeCategories) {
    await assertCanUseBillingFeature(userId, "attendeeCategories");
  }

  if (effectiveStatus === "published") {
    await assertCanPublishEvent(userId);
  }

  const eventValues: typeof events.$inferInsert = {
    title: validated.title,
    description: validated.description ?? null,
    category: validated.category ?? null,
    date: new Date(validated.date),
    endDate: validated.endDate ? new Date(validated.endDate) : null,
    locationType: validated.locationType ?? "online",
    locationName:
      validated.locationType === "in_person"
        ? (validated.locationName?.trim() ?? "")
        : "Online",
    locationLink: validated.locationLink ?? null,
    image: validated.image ?? null,
    imageFormat: validated.imageFormat,
    createdBy: userId,
    username: user.username,
    slug,
    visibility: effectiveVisibility,
    status: effectiveStatus,
    timezone: validated.timezone || "Africa/Kigali",
  };

  const newEvent = await withTransaction(async (tx) => {
    const [createdEvent] = await tx
      .insert(events)
      .values(eventValues)
      .returning();

    await tx.insert(eventSettings).values({
      eventId: createdEvent.id,
      rsvpAccessMode,
      allowAdditionalGuests: effectiveAllowAdditionalGuests,
      maxAdditionalGuests: effectiveAllowAdditionalGuests
        ? (validated.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
        : null,
      customQuestions: validated.customQuestions ?? null,
      attendeeCategories: validated.attendeeCategories ?? null,
      contributionCollectionMode,
      contributionAmount: hasCategoryPricing
        ? null
        : (validated.contributionAmount ?? null),
      contributionPaymentInfo:
        contributionCollectionMode === "offline"
          ? (validated.contributionPaymentInfo ?? null)
          : null,
      currency: validated.currency ?? "RWF",
      whatsappEnabled: true,
    });

    return createdEvent;
  });

  logger.info(`Event created: ${newEvent.id} by user ${userId}`);

  await publishNotification(
    {
      type: "event_created",
      recipientUserIds: [newEvent.createdBy],
      actorUserId: userId,
      context: {
        eventId: newEvent.id,
        eventSlug: newEvent.slug,
        eventTitle: newEvent.title,
        link: dashboardEventLink(newEvent.slug),
      },
    },
  );

  return newEvent;
}
