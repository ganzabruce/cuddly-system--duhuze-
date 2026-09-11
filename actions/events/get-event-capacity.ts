"use server";

import { eq, sql } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { eventPayments, eventSettings, guests } from "@/lib/db/schema";
import type { EventCapacity } from "@/types/events";



/**
 * Get capacity info for an event: max capacity (null = unlimited),
 * total seats used (each confirmed or payment-pending guest counts as
 * 1 + their additional_guest_count), and whether the event is at capacity.
 */
export async function getEventCapacityInfo(
    eventId: number,
    executor: DbExecutor = db,
): Promise<EventCapacity> {
    const [settingsRow, sumResult] = await Promise.all([
        executor
            .select({ guestCapacity: eventSettings.guestCapacity })
            .from(eventSettings)
            .where(eq(eventSettings.eventId, eventId))
            .limit(1),
        executor
            .select({
                totalSeats: sql<number>`COALESCE(SUM(1 + COALESCE("guests"."additional_guest_count", 0)), 0)`,
            })
            .from(guests)
            .where(
                sql`
                  ${guests.eventId} = ${eventId}
                  AND (
                    ${guests.rsvpStatus} = 'yes'
                    OR (
                      ${guests.rsvpStatus} IS NULL
                      AND EXISTS (
                        SELECT 1
                        FROM ${eventPayments}
                        WHERE ${eventPayments.guestId} = ${guests.id}
                          AND ${eventPayments.status} = 'pending'
                      )
                    )
                  )
                `,
            ),
    ]);

    const guestCapacity = settingsRow[0]?.guestCapacity ?? null;
    const totalSeatsUsed = Number(sumResult[0]?.totalSeats ?? 0);
    const atCapacity =
        guestCapacity != null && totalSeatsUsed >= guestCapacity;

    return { guestCapacity, totalSeatsUsed, atCapacity };
}
