"use server";

import { eq, and, ne } from "drizzle-orm";
import { withTransaction } from "@/lib/db/serverless";
import { events, eventSettings } from "@/lib/db/schema";
import { updateEventSchema } from "@/lib/services/events/validation";
import { generateUniqueSlug } from "@/lib/utils";
import {
  getEventEndedAt,
  normalizeStatusValue,
} from "@/lib/utils/event-status";
import logger from "@/lib/utils/logger";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventLink } from "@/lib/services/notifications/links";
import { getEventById } from "./get-events";
import {
  assertCanPublishEvent,
  assertCanUseBillingFeature,
} from "@/lib/services/billing/entitlements";
import {
  didAdvancedEventSettingsChange,
  didAttendeeCategoriesChange,
  didCustomQuestionsChange,
  didEventContributionsChange,
  getEventSettingsAccessState,
} from "@/lib/services/billing/event-settings";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";

/**
 * Update an event (userId = database user id)
 */
export async function updateEvent(
  eventId: number,
  data: unknown,
  userId: number,
) {
  const validated = updateEventSchema.parse(data);
  const changeLabels: string[] = [];

  const { event, updatedEvent } = await withTransaction(async (tx) => {
    const event = await getEventById(eventId, userId, tx);
    const currentSettings = await getEventSettingsAccessState(eventId, tx);

    if (validated.date !== undefined || validated.endDate !== undefined) {
      const nextDateValue = validated.date
        ? new Date(validated.date).getTime()
        : event.date.getTime();
      const prevDateValue = event.date.getTime();
      const nextEndDateValue =
        validated.endDate !== undefined
          ? validated.endDate
            ? new Date(validated.endDate).getTime()
            : null
          : event.endDate
            ? new Date(event.endDate).getTime()
            : null;
      const prevEndDateValue = event.endDate ? new Date(event.endDate).getTime() : null;

      if (nextDateValue !== prevDateValue || nextEndDateValue !== prevEndDateValue) {
        changeLabels.push("date/time");
      }
    }

    if (
      validated.locationType !== undefined ||
      validated.locationName !== undefined ||
      validated.locationLink !== undefined
    ) {
      const nextLocationType = validated.locationType ?? event.locationType;
      const nextLocationName =
        validated.locationName !== undefined
          ? (validated.locationName?.trim() ?? "Online")
          : event.locationName;
      const nextLocationLink =
        validated.locationLink !== undefined
          ? (validated.locationLink ?? null)
          : event.locationLink ?? null;

      const prevLocationLink = event.locationLink ?? null;

      if (
        nextLocationType !== event.locationType ||
        nextLocationName !== event.locationName ||
        nextLocationLink !== prevLocationLink
      ) {
        changeLabels.push("location");
      }
    }

    if (validated.description !== undefined) {
      const nextDescription = validated.description ?? null;
      if (nextDescription !== (event.description ?? null)) {
        changeLabels.push("description");
      }
    }

    const updateData: Partial<typeof events.$inferInsert> = {};

    if (validated.title !== undefined) {
      updateData.title = validated.title;
    }
    if (validated.description !== undefined) {
      updateData.description = validated.description ?? null;
    }
    if (validated.category !== undefined) {
      updateData.category = validated.category ?? null;
    }
    if (validated.date !== undefined) {
      updateData.date = new Date(validated.date);
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate ? new Date(validated.endDate) : null;
    }
    if (validated.timezone !== undefined) {
      updateData.timezone = validated.timezone;
    }
    if (validated.locationType !== undefined) {
      updateData.locationType = validated.locationType;
    }
    if (validated.locationName !== undefined) {
      updateData.locationName = validated.locationName?.trim() ?? "Online";
    }
    if (validated.visibility !== undefined) {
      updateData.visibility = validated.visibility;
    }
    const nextDate = validated.date ? new Date(validated.date) : event.date;
    const nextEndDate =
      validated.endDate !== undefined
        ? validated.endDate
          ? new Date(validated.endDate)
          : null
        : event.endDate;
    const rawStatus = validated.status ?? event.status ?? "published";
    const sanitizedStatus = rawStatus === "completed" ? "published" : rawStatus;
    const eventEndedAt = getEventEndedAt({
      date: nextDate,
      endDate: nextEndDate,
      status: sanitizedStatus,
    });
    const normalizedStatus =
      normalizeStatusValue(sanitizedStatus, eventEndedAt) ?? sanitizedStatus;

    const resolvedVisibility = validated.visibility ?? event.visibility;
    const nextAttendeeCategories =
      validated.attendeeCategories !== undefined
        ? (validated.attendeeCategories ?? null)
        : currentSettings.attendeeCategories;
    const hasCategoryPricing =
      Array.isArray(nextAttendeeCategories) &&
      nextAttendeeCategories.some((category) => {
        if (
          typeof category !== "object" ||
          category == null ||
          !("contributionAmount" in category)
        ) {
          return false;
        }
        const value = (category as { contributionAmount?: unknown })
          .contributionAmount;
        return typeof value === "number" && value > 0;
      });
    const nextContributionCollectionMode =
      validated.contributionCollectionMode ??
      currentSettings.contributionCollectionMode;
    const nextContributionAmount = hasCategoryPricing
      ? null
      : validated.contributionAmount !== undefined
        ? validated.contributionAmount
        : currentSettings.contributionAmount;
    const nextContributionPaymentInfo =
      validated.contributionPaymentInfo !== undefined
        ? (validated.contributionPaymentInfo ?? null)
        : currentSettings.contributionPaymentInfo;

    if (
      nextContributionCollectionMode === "platform" &&
      !hasCategoryPricing &&
      (nextContributionAmount == null || nextContributionAmount <= 0)
    ) {
      throw new Error("Contribution amount is required for platform collection.");
    }

    if (
      nextContributionCollectionMode === "offline" &&
      (hasCategoryPricing || (nextContributionAmount ?? 0) > 0) &&
      !nextContributionPaymentInfo?.trim()
    ) {
      throw new Error("Payment instructions are required for offline collection.");
    }
    const nextRsvpAccessMode =
      resolvedVisibility === "public"
        ? "open_rsvp"
        : (validated.rsvpAccessMode ?? currentSettings.rsvpAccessMode);
    const nextRequireApproval =
      validated.requireApproval ?? currentSettings.requireApproval;
    const nextAllowAdditionalGuestsBase =
      validated.allowAdditionalGuests ?? currentSettings.allowAdditionalGuests;
    const nextAllowAdditionalGuests =
      nextAllowAdditionalGuestsBase || (Array.isArray(nextAttendeeCategories) && nextAttendeeCategories.length > 0);
    const nextMaxAdditionalGuests = nextAllowAdditionalGuests
      ? (validated.maxAdditionalGuests ??
        currentSettings.maxAdditionalGuests ??
        DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
      : null;
    const nextGuestCapacity =
      validated.maxCapacity !== undefined
        ? validated.maxCapacity
        : currentSettings.guestCapacity;
    const nextCustomQuestions =
      validated.customQuestions !== undefined
        ? validated.customQuestions ?? null
        : currentSettings.customQuestions;

    if (
      didAdvancedEventSettingsChange({
        current: {
          guestCapacity: currentSettings.guestCapacity,
          rsvpAccessMode: currentSettings.rsvpAccessMode,
          requireApproval: currentSettings.requireApproval,
          allowAdditionalGuests: currentSettings.allowAdditionalGuests,
          maxAdditionalGuests: currentSettings.maxAdditionalGuests,
        },
        next: {
          guestCapacity: nextGuestCapacity,
          rsvpAccessMode: nextRsvpAccessMode,
          requireApproval: nextRequireApproval,
          allowAdditionalGuests: nextAllowAdditionalGuests,
          maxAdditionalGuests: nextMaxAdditionalGuests,
        },
      })
    ) {
      await assertCanUseBillingFeature(userId, "advancedEventSettings", tx);
    }

    if (didCustomQuestionsChange(currentSettings.customQuestions, nextCustomQuestions)) {
      await assertCanUseBillingFeature(userId, "customQuestions", tx);
    }

    if (
      didEventContributionsChange({
        current: {
          contributionCollectionMode: currentSettings.contributionCollectionMode,
          contributionAmount: currentSettings.contributionAmount,
          contributionPaymentInfo: currentSettings.contributionPaymentInfo,
        },
        next: {
          contributionCollectionMode: nextContributionCollectionMode,
          contributionAmount: nextContributionAmount,
          contributionPaymentInfo:
            nextContributionCollectionMode === "offline"
              ? nextContributionPaymentInfo
              : null,
        },
      })
    ) {
      await assertCanUseBillingFeature(userId, "eventContributions", tx);
    }

    if (didAttendeeCategoriesChange(currentSettings.attendeeCategories, nextAttendeeCategories)) {
      await assertCanUseBillingFeature(userId, "attendeeCategories", tx);
    }

    if (
      validated.whatsappEnabled === true &&
      !currentSettings.whatsappEnabled
    ) {
      await assertCanUseBillingFeature(userId, "whatsappInvitations", tx);
    }

    if (normalizedStatus === "published") {
      await assertCanPublishEvent(userId, {
        executor: tx,
        excludeEventId: eventId,
      });
    }

    if (
      validated.status !== undefined ||
      validated.date !== undefined ||
      validated.endDate !== undefined
    ) {
      updateData.status = normalizedStatus;
    }
    if (validated.locationLink !== undefined) {
      updateData.locationLink = validated.locationLink ?? null;
    }
    const resolvedLocationType =
      (updateData.locationType as "online" | "in_person" | undefined) ??
      event.locationType;
    if (resolvedLocationType === "online") {
      updateData.locationName = "Online";
    }
    if (validated.image !== undefined) {
      updateData.image = validated.image ?? null;
    }
    if (validated.imageFormat !== undefined) {
      updateData.imageFormat = validated.imageFormat;
    }

    if (validated.slug && validated.slug !== event.slug) {
      const existing = await tx
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.username, event.username),
            eq(events.slug, validated.slug),
            ne(events.id, eventId),
          ),
        )
        .limit(1);
      if (existing.length > 0) {
        throw new Error("This event link is already taken");
      }
      updateData.slug = validated.slug;
    } else if (
      validated.title &&
      validated.title !== event.title &&
      !validated.slug
    ) {
      const existingEvents = await tx
        .select({ slug: events.slug })
        .from(events)
        .where(and(eq(events.username, event.username), ne(events.id, eventId)));
      const existingSlugs = existingEvents.map((currentEvent) => currentEvent.slug);
      updateData.slug = await generateUniqueSlug(validated.title, existingSlugs);
    }

    try {
      await tx.update(events).set(updateData).where(eq(events.id, eventId));
    } catch (error) {
      const dbError = error as { code?: string };
      if (dbError.code === "23505") {
        throw new Error("This event link is already taken");
      }
      throw error;
    }

    const settingsUpdate: Partial<typeof eventSettings.$inferInsert> = {};
    if (validated.maxCapacity !== undefined) {
      settingsUpdate.guestCapacity = validated.maxCapacity;
    }
    if (validated.contributionCollectionMode !== undefined) {
      settingsUpdate.contributionCollectionMode =
        validated.contributionCollectionMode;
    }
    if (validated.contributionAmount !== undefined) {
      settingsUpdate.contributionAmount = Array.isArray(nextAttendeeCategories) &&
        nextAttendeeCategories.length > 0
        ? null
        : validated.contributionAmount;
    }
    if (validated.contributionPaymentInfo !== undefined) {
      settingsUpdate.contributionPaymentInfo =
        (validated.contributionCollectionMode ??
          currentSettings.contributionCollectionMode) === "offline"
          ? validated.contributionPaymentInfo ?? null
          : null;
    } else if (validated.contributionCollectionMode === "platform") {
      settingsUpdate.contributionPaymentInfo = null;
    }
    if (validated.customQuestions !== undefined) {
      settingsUpdate.customQuestions = validated.customQuestions ?? null;
    }
    if (validated.attendeeCategories !== undefined) {
      settingsUpdate.attendeeCategories = validated.attendeeCategories ?? null;
      if (
        Array.isArray(validated.attendeeCategories) &&
        validated.attendeeCategories.length > 0
      ) {
        settingsUpdate.contributionAmount = null;
      }
    }
    if (validated.rsvpAccessMode !== undefined) {
      settingsUpdate.rsvpAccessMode = validated.rsvpAccessMode;
    }
    if (validated.requireApproval !== undefined) {
      settingsUpdate.requireApproval = validated.requireApproval;
    }
    if (validated.allowAdditionalGuests !== undefined) {
      settingsUpdate.allowAdditionalGuests = validated.allowAdditionalGuests;
    }
    if (validated.maxAdditionalGuests !== undefined) {
      settingsUpdate.maxAdditionalGuests = validated.maxAdditionalGuests;
    }

    if (resolvedVisibility === "public") {
      settingsUpdate.rsvpAccessMode = "open_rsvp";
    }

    if (validated.whatsappEnabled !== undefined) {
      settingsUpdate.whatsappEnabled = validated.whatsappEnabled;
    }

    if (Object.keys(settingsUpdate).length > 0) {
      const [existing] = await tx
        .select({ id: eventSettings.id })
        .from(eventSettings)
        .where(eq(eventSettings.eventId, eventId))
        .limit(1);
      if (existing) {
        await tx
          .update(eventSettings)
          .set(settingsUpdate)
          .where(eq(eventSettings.eventId, eventId));
      } else {
        await tx.insert(eventSettings).values({
          eventId,
          ...settingsUpdate,
        });
      }
    }

    const [updatedEvent] = await tx
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    return { event, updatedEvent: updatedEvent! };
  });

  logger.info(`Event updated: ${eventId} by user ${userId} (db id)`);

  await publishNotification(
    {
      type: "event_updated",
      recipientUserIds: [event.createdBy],
      actorUserId: userId,
      context: {
        eventId,
        eventSlug: updatedEvent?.slug ?? event.slug,
        eventTitle: updatedEvent?.title ?? event.title,
        link: dashboardEventLink(updatedEvent?.slug ?? event.slug),
        changes: changeLabels.length > 0 ? changeLabels : ["details"],
      },
    },
  );

  return updatedEvent;
}
