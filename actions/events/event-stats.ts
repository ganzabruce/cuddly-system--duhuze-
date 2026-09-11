"use server";

import { eq, and, gt } from "drizzle-orm";
import { count } from "drizzle-orm";
import db from "@/lib/db";
import { events } from "@/lib/db/schema";
import type { EventStats } from "@/types/events";

/**
 * Get event statistics for a user (userId = database user id)
 */
export async function getEventStats(userId: number): Promise<EventStats> {
    const now = new Date();

    const [totalEvents] = await db
        .select({ count: count() })
        .from(events)
        .where(eq(events.createdBy, userId));

    const [upcomingEvents] = await db
        .select({ count: count() })
        .from(events)
        .where(
            and(
                eq(events.createdBy, userId),
                gt(events.date, now)
            )
        );

    return {
        total: totalEvents.count,
        upcoming: upcomingEvents.count,
        past: totalEvents.count - upcomingEvents.count,
    };
}
