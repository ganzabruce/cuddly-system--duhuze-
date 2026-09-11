import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { guests } from "@/lib/db/schema";
import logger from "@/lib/utils/logger";
import type { DeleteResult } from "@/types/guests";
import { getGuestById } from "@/lib/services/guests/get-guests";

/**
 * Delete a guest
 */
export async function deleteGuest(guestId: number, userId: number): Promise<DeleteResult> {
    const guest = await getGuestById(guestId, userId);

    await db.delete(guests).where(eq(guests.id, guestId));

    logger.info(`Guest deleted: ${guestId} from event ${guest.eventId} by user ${userId} (db id)`);

    return { success: true, id: guestId, guestId };
}
