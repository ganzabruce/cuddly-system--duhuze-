import db from "@/lib/db";
import { users, events, guests } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import logger from "@/lib/utils/logger";
import type { PlatformStats } from "@/types/admin";

/**
 * Get platform-wide statistics for admin overview (summary stats + recent lists).
 * Detailed analytics live on the analytics page.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [userCountResult, eventCountResult, rsvpCountResult, recentSignupsResult, recentEventsResult] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(users),
        db.select({ count: sql<number>`count(*)::int` }).from(events),
        db
          .select({
            count: sql<number>`coalesce(sum(case when ${guests.rsvpStatus} is not null then 1 else 0 end), 0)::int`,
          })
          .from(guests),
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            username: users.username,
            createdAt: users.createdAt,
          })
          .from(users)
          .orderBy(desc(users.createdAt))
          .limit(10),
        db
          .select({
            id: events.id,
            slug: events.slug,
            username: events.username,
            title: events.title,
            date: events.date,
            visibility: events.visibility,
            organizerName: users.name,
            organizerUsername: users.username,
            createdAt: events.createdAt,
          })
          .from(events)
          .innerJoin(users, eq(events.createdBy, users.id))
          .orderBy(desc(events.createdAt))
          .limit(10),
      ]);

    return {
      totalUsers: userCountResult[0]?.count ?? 0,
      totalEvents: eventCountResult[0]?.count ?? 0,
      totalRSVPs: rsvpCountResult[0]?.count ?? 0,
      recentSignups: recentSignupsResult.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        createdAt: u.createdAt ?? new Date(),
      })),
      recentEvents: recentEventsResult.map((e) => ({
        id: e.id,
        slug: e.slug,
        username: e.username,
        title: e.title,
        date: e.date,
        visibility: e.visibility,
        organizerName: e.organizerName,
        organizerUsername: e.organizerUsername,
        createdAt: e.createdAt ?? new Date(),
      })),
    };
  } catch (error) {
    logger.error("Failed to get platform stats", error);
    return {
      totalUsers: 0,
      totalEvents: 0,
      totalRSVPs: 0,
      recentSignups: [],
      recentEvents: [],
    };
  }
}
