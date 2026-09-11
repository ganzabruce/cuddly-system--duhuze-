"use server";

import { eq, desc, asc, count, and, or, sql } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { events, eventSettings, users } from "@/lib/db/schema";
import { NotFoundError, UnauthorizedError } from "@/lib/utils/errors";
import { normalizeEventStatus } from "@/lib/utils/event-status";
import type { PaginationParams, PaginatedResponse } from "@/types";

// Get paginated events for a user (by database user id)
export async function getUserEvents(
  userId: number,
  params: PaginationParams = {},
): Promise<PaginatedResponse<typeof events.$inferSelect>> {
  const { page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const [userEvents, totalResult] = await Promise.all([
    db
      .select()
      .from(events)
      .where(eq(events.createdBy, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(events.createdAt)),
    db
      .select({ count: count() })
      .from(events)
      .where(eq(events.createdBy, userId)),
  ]);

  const total = totalResult[0].count;
  const totalPages = Math.ceil(total / limit);

  const now = new Date();
  const normalizedEvents = userEvents.map((event) =>
    normalizeEventStatus(event, now),
  );

  return {
    data: normalizedEvents,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get active (published, not yet completed) events for the sidebar.
 * Returns up to `limit` events ordered by date ascending.
 */
export async function getActiveEvents(userId: number, limit: number = 25) {
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      username: events.username,
      date: events.date,
      endDate: events.endDate,
      status: events.status,
    })
    .from(events)
    .where(and(eq(events.createdBy, userId), eq(events.status, "published")))
    .orderBy(asc(events.date))
    .limit(limit);

  // Filter out any that have actually ended (normalizeEventStatus would mark them completed)
  return rows.filter((e) => {
    const endedAt = e.endDate ?? e.date;
    return endedAt >= now;
  });
}

const eventWithSettingsColumns = {
  id: events.id,
  title: events.title,
  description: events.description,
  category: events.category,
  date: events.date,
  endDate: events.endDate,
  locationType: events.locationType,
  locationName: events.locationName,
  locationLink: events.locationLink,
  image: events.image,
  imageFormat: events.imageFormat,
  createdBy: events.createdBy,
  username: events.username,
  slug: events.slug,
  visibility: events.visibility,
  status: events.status,
  timezone: events.timezone,
  createdAt: events.createdAt,
  // settings
  guestCapacity: eventSettings.guestCapacity,
  rsvpAccessMode: eventSettings.rsvpAccessMode,
  requireApproval: eventSettings.requireApproval,
  contributionCollectionMode: eventSettings.contributionCollectionMode,
  contributionAmount: eventSettings.contributionAmount,
  contributionPaymentInfo: eventSettings.contributionPaymentInfo,
  currency: eventSettings.currency,
  customQuestions: eventSettings.customQuestions,
  attendeeCategories: eventSettings.attendeeCategories,
  allowAdditionalGuests: eventSettings.allowAdditionalGuests,
  maxAdditionalGuests: eventSettings.maxAdditionalGuests,
  whatsappEnabled: eventSettings.whatsappEnabled,
};

/**
 * Get a single event by ID (verifies ownership by database user id). Includes event settings.
 */
export async function getEventById(
  eventId: number,
  userId: number,
  executor: DbExecutor = db,
) {
  const [event] = await executor
    .select(eventWithSettingsColumns)
    .from(events)
    .leftJoin(eventSettings, eq(eventSettings.eventId, events.id))
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  if (event.createdBy !== userId) {
    throw new UnauthorizedError(
      "You do not have permission to access this event",
    );
  }

  return normalizeEventStatus(event, new Date());
}

/**
 * Get event by ID without auth (for system/scheduled jobs only, e.g. 24h reminder cron). Includes event settings.
 */
export async function getEventByIdForSystem(eventId: number) {
  const [event] = await db
    .select(eventWithSettingsColumns)
    .from(events)
    .leftJoin(eventSettings, eq(eventSettings.eventId, events.id))
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  return normalizeEventStatus(event, new Date());
}

/**
 * Get event by ID and slug for public RSVP flows (no auth). Includes event settings.
 * Uses both id + slug to prevent event ID enumeration.
 */
export async function getEventPublic(eventId: number, eventSlug: string) {
  const [event] = await db
    .select({
      ...eventWithSettingsColumns,
      eventStatus: events.status,
    })
    .from(events)
    .leftJoin(eventSettings, eq(eventSettings.eventId, events.id))
    .where(and(eq(events.id, eventId), eq(events.slug, eventSlug)))
    .limit(1);

  return event ?? null;
}

/**
 * Get event by username and slug (public access)
 */
export async function getEventBySlug(username: string, slug: string) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedUsername || !normalizedSlug) {
    throw new NotFoundError("Event not found");
  }

  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      category: events.category,
      date: events.date,
      endDate: events.endDate,
      locationType: events.locationType,
      locationName: events.locationName,
      locationLink: events.locationLink,
      image: events.image,
      imageFormat: events.imageFormat,
      createdBy: events.createdBy,
      username: events.username,
      slug: events.slug,
      visibility: events.visibility,
      status: events.status,
      timezone: events.timezone,
      createdAt: events.createdAt,
    })
    .from(events)
    .leftJoin(users, eq(events.createdBy, users.id))
    .where(
      and(
        sql`lower(${events.slug}) = ${normalizedSlug}`,
        or(
          sql`lower(${events.username}) = ${normalizedUsername}`,
          sql`lower(${users.username}) = ${normalizedUsername}`,
        ),
      ),
    )
    .limit(1);

  if (!event) {
    throw new NotFoundError("Event not found");
  }

  return normalizeEventStatus(event, new Date());
}
