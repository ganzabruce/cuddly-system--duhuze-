"use server";

import { eq, and, desc, inArray } from "drizzle-orm";
import db from "@/lib/db";
import { eventSettings, users, events } from "@/lib/db/schema";
import { getPublicEventPath } from "@/lib/constants/events/profile-paths";
import { getAppBaseUrl } from "@/lib/utils/url";
import { getEventBySlug } from "@/actions/events/get-events";
import { getEventCapacityInfo } from "@/actions/events/get-event-capacity";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";
import {
  normalizeAttendeeCategories,
  normalizeCustomQuestions,
} from "@/lib/constants/events/rsvp-config";
import { parseUserPreferences } from "@/types/auth";

export async function getPublicEventData(username: string, eventSlug: string) {
  try {
    const event = await getEventBySlug(username, eventSlug);

    const [settingsRows, organizerRows] = await Promise.all([
      db
        .select({
          guestCapacity: eventSettings.guestCapacity,
          contributionCollectionMode: eventSettings.contributionCollectionMode,
          contributionAmount: eventSettings.contributionAmount,
          contributionPaymentInfo: eventSettings.contributionPaymentInfo,
          currency: eventSettings.currency,
          customQuestions: eventSettings.customQuestions,
          attendeeCategories: eventSettings.attendeeCategories,
          rsvpAccessMode: eventSettings.rsvpAccessMode,
          allowAdditionalGuests: eventSettings.allowAdditionalGuests,
          maxAdditionalGuests: eventSettings.maxAdditionalGuests,
        })
        .from(eventSettings)
        .where(eq(eventSettings.eventId, event.id))
        .limit(1),
      db
        .select({
          preferences: users.preferences,
          name: users.name,
          publicEmail: users.publicEmail,
          phoneNumber: users.phoneNumber,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, event.createdBy))
        .limit(1),
    ]);

    const settings = settingsRows[0];
    const maxCapacity = settings?.guestCapacity ?? null;
    const collectionMode = settings?.contributionCollectionMode ?? "offline";
    const contributionAmount = settings?.contributionAmount ?? null;
    const contributionPaymentInfo = settings?.contributionPaymentInfo ?? null;
    const currency = settings?.currency ?? "RWF";
    const organizerPreferences = parseUserPreferences(organizerRows[0]?.preferences ?? null);
    const useHour12 = organizerPreferences.dateFormat !== "24h";

    const capacityInfo = await getEventCapacityInfo(event.id);
    const attendeeCategories = normalizeAttendeeCategories(settings?.attendeeCategories);
    const paymentsEnabled =
      collectionMode === "optional" ||
      (collectionMode === "platform" &&
        ((contributionAmount ?? 0) > 0 ||
          attendeeCategories.some((c) => c.contributionAmount > 0)));
    const allowAdditionalGuests =
      (settings?.allowAdditionalGuests ?? false) ||
      attendeeCategories.length > 0;
    const maxAdditionalGuests = allowAdditionalGuests
      ? (settings?.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
      : 0;
    const customQuestions = normalizeCustomQuestions(settings?.customQuestions);
    const requiresInviteToken =
      event.visibility === "private" && settings?.rsvpAccessMode === "invite_only";

    const baseUrl = getAppBaseUrl();
    const canonicalEventUrl = `${baseUrl}${getPublicEventPath(username, eventSlug)}`;

    const organizerRow = organizerRows[0];
    const organizerContact: {
      name: string;
      profileImageUrl: string | null;
      email?: string;
      phone?: string;
    } = {
      name: organizerRow?.name ?? username,
      profileImageUrl: organizerRow?.profileImageUrl ?? null,
    };
    if (organizerRow?.publicEmail) organizerContact.email = organizerRow.publicEmail;
    if (organizerRow?.phoneNumber) organizerContact.phone = organizerRow.phoneNumber;

    return {
      data: {
        organizer: organizerContact,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          date: event.date,
          endDate: event.endDate,
          locationType: event.locationType,
          locationName: event.locationName,
          locationLink: event.locationLink,
          image: event.image,
          imageFormat: event.imageFormat ?? "square",
          slug: event.slug,
          visibility: event.visibility,
          status: event.status ?? "published",
          timezone: event.timezone,
          username: event.username,
        },
        settings: {
          maxCapacity,
          collectionMode,
          contributionAmount,
          contributionPaymentInfo,
          currency,
          customQuestions,
          attendeeCategories,
          paymentsEnabled,
          allowAdditionalGuests,
          maxAdditionalGuests,
          requiresInviteToken,
        },
        capacity: capacityInfo,
        useHour12,
        canonicalEventUrl,
      },
    };
  } catch {
    return { error: "Event not found" };
  }
}

// PUBLIC ACTION — no auth by design (sitemap needs only public username/slug lists)
export async function getSitemapEntries() {
  const userRows = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.status, "ok"));

  const usernames = userRows
    .map((u) => u.username)
    .filter((username): username is string => username !== null);

  const eventRows = await db
    .select({ username: events.username, slug: events.slug })
    .from(events)
    .where(
      and(
        eq(events.status, "published"),
        eq(events.visibility, "public"),
      ),
    );

  return { usernames, events: eventRows };
}

export async function getPublicExploreEvents() {
  const publicEvents = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      category: events.category,
      date: events.date,
      locationName: events.locationName,
      locationLink: events.locationLink,
      image: events.image,
      imageFormat: events.imageFormat,
      username: events.username,
      slug: events.slug,
    })
    .from(events)
    .where(
      and(
        eq(events.visibility, "public"),
        inArray(events.status, ["published", "completed"]),
      ),
    )
    .orderBy(desc(events.date))
    .limit(100);

  return publicEvents;
}
