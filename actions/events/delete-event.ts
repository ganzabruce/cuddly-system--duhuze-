"use server";

import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { events } from "@/lib/db/schema";
import logger from "@/lib/utils/logger";
import { getEventById } from "./get-events";
import type { EventDeleteResult } from "@/types/events";

/**
 * Delete an event (userId = database user id)
 */
export async function deleteEvent(eventId: number, userId: number): Promise<EventDeleteResult> {
    await getEventById(eventId, userId);

    await db.delete(events).where(eq(events.id, eventId));

    logger.info(`Event deleted: ${eventId} by user ${userId}`);

    return { success: true, id: eventId, eventId };
}
