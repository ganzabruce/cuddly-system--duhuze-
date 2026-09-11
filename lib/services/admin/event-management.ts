import db from "@/lib/db";
import { events, users, guests } from "@/lib/db/schema";
import { eq, sql, gte, lt, desc, or, and } from "drizzle-orm";
import logger from "@/lib/utils/logger";
import { logAdminAction } from "@/lib/services/admin/audit-log";
import type {
  EventIdentifier,
  EventListParams,
  EventListResult,
  EventWithStats,
} from "@/types/admin";

function mapEventWithStatsRow<T extends EventWithStats>(row: T): EventWithStats {
  return {
    ...row,
    guestCount: row.guestCount ?? 0,
  };
}

/**
 * Get paginated list of events with organizer info and guest counts
 */
export async function getEventList(
  params: EventListParams = {},
): Promise<EventListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const offset = (page - 1) * limit;
  const now = new Date();

  try {
    const conditions = [];

    if (params.visibility) {
      conditions.push(eq(events.visibility, params.visibility));
    }

    if (params.filter === "upcoming") {
      conditions.push(gte(events.date, now));
    } else if (params.filter === "past") {
      conditions.push(lt(events.date, now));
    }

    if (params.search) {
      const searchTerm = `%${params.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${events.title}) LIKE ${searchTerm}`,
          sql`LOWER(${users.name}) LIKE ${searchTerm}`,
          sql`LOWER(${users.username}) LIKE ${searchTerm}`,
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .innerJoin(users, eq(events.createdBy, users.id))
      .where(whereClause ?? sql`true`);

    const total = totalResult[0]?.count ?? 0;

    const resultsQuery = db
      .select({
        id: events.id,
        title: events.title,
        category: events.category,
        slug: events.slug,
        username: events.username,
        date: events.date,
        visibility: events.visibility,
        organizerName: users.name,
        organizerUsername: users.username,
        organizerEmail: users.email,
        createdAt: events.createdAt,
        guestCount: sql<number>`COALESCE((
                    SELECT SUM(1 + COALESCE(${guests.additionalGuestCount}, 0))::int
                    FROM ${guests}
                    WHERE ${guests.eventId} = ${events.id}
                      AND ${guests.rsvpStatus} = 'yes'
                ), 0)`,
      })
      .from(events)
      .innerJoin(users, eq(events.createdBy, users.id));

    const results = await (whereClause
      ? resultsQuery.where(whereClause)
      : resultsQuery)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      events: results.map(mapEventWithStatsRow),
      total,
      page,
      limit,
    };
  } catch (error) {
    logger.error("Failed to get event list", error);
    return {
      events: [],
      total: 0,
      page,
      limit,
    };
  }
}

/**
 * Get event by slug with organizer info and guest count
 */
export async function getEventBySlug(identifier: EventIdentifier): Promise<EventWithStats | null> {
  try {
    const result = await db
      .select({
        id: events.id,
        slug: events.slug,
        username: events.username,
        title: events.title,
        category: events.category,
        date: events.date,
        visibility: events.visibility,
        organizerName: users.name,
        organizerUsername: users.username,
        organizerEmail: users.email,
        createdAt: events.createdAt,
        guestCount: sql<number>`COALESCE((
                    SELECT SUM(1 + COALESCE(${guests.additionalGuestCount}, 0))::int
                    FROM ${guests}
                    WHERE ${guests.eventId} = ${events.id}
                      AND ${guests.rsvpStatus} = 'yes'
                ), 0)`,
      })
      .from(events)
      .innerJoin(users, eq(events.createdBy, users.id))
      .where(and(eq(events.username, identifier.username), eq(events.slug, identifier.slug)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return mapEventWithStatsRow(result[0]);
  } catch (error) {
    logger.error("Failed to get event by ID", error);
    return null;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(
  identifier: EventIdentifier,
  adminEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const event = await getEventBySlug(identifier);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Delete event (cascade will delete guests)
    await db.delete(events).where(eq(events.id, event.id));

    await logAdminAction({
      adminEmail,
      action: "event.delete",
      targetType: "event",
      targetId: `${event.username}/${event.slug}`,
      details: {
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
        eventUsername: event.username,
        organizerEmail: event.organizerEmail,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete event", error);
    return { success: false, error: "Failed to delete event" };
  }
}

/**
 * Toggle event visibility
 */
export async function toggleEventVisibility(
  identifier: EventIdentifier,
  adminEmail: string,
): Promise<{ success: boolean; error?: string; newVisibility?: string }> {
  try {
    const event = await getEventBySlug(identifier);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const newVisibility = event.visibility === "public" ? "private" : "public";

    await db
      .update(events)
      .set({ visibility: newVisibility })
      .where(eq(events.id, event.id));

    await logAdminAction({
      adminEmail,
      action: "event.visibility_toggle",
      targetType: "event",
      targetId: `${event.username}/${event.slug}`,
      details: {
        eventId: event.id,
        eventSlug: event.slug,
        eventUsername: event.username,
        eventTitle: event.title,
        oldVisibility: event.visibility,
        newVisibility,
        organizerEmail: event.organizerEmail,
      },
    });

    return { success: true, newVisibility };
  } catch (error) {
    logger.error("Failed to toggle event visibility", error);
    return { success: false, error: "Failed to toggle visibility" };
  }
}
