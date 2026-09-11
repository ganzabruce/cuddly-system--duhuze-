"use server";

import { eq } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { events } from "@/lib/db/schema";
import { NotFoundError, UnauthorizedError } from "@/lib/utils/errors";

/**
 * Verify that the user (by database user id) owns the event. Returns event or throws.
 */
export async function verifyEventOwnership(
    eventId: number,
    userId: number,
    executor: DbExecutor = db,
): Promise<typeof events.$inferSelect> {
    const [event] = await executor
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    if (event.createdBy !== userId) {
        throw new UnauthorizedError(
            "You do not have permission to manage this event",
        );
    }

    return event;
}
