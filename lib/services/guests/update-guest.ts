import { eq, and, sql } from "drizzle-orm";
import { withTransaction } from "@/lib/db/serverless";
import { eventSettings, guests } from "@/lib/db/schema";
import { ValidationError } from "@/lib/utils/errors";
import logger from "@/lib/utils/logger";
import { updateGuestSchema } from "@/types/guests";
import { getGuestById } from "@/lib/services/guests/get-guests";
import { getEventCapacityInfo } from "@/actions/events/get-event-capacity";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";

/**
 * Update a guest
 */
export async function updateGuest(guestId: number, data: unknown, userId: number) {
    const validated = updateGuestSchema.parse(data);
    const updatedGuest = await withTransaction(async (tx) => {
        const guest = await getGuestById(guestId, userId, tx);
        const updateData: Partial<typeof guests.$inferInsert> = {};

        if (validated.name !== undefined) {
            updateData.name = validated.name;
        }
        if (validated.email !== undefined) {
            updateData.email = validated.email || null;

            if (validated.email) {
                const existingGuest = await tx
                    .select()
                    .from(guests)
                    .where(
                        and(
                            eq(guests.eventId, guest.eventId),
                            sql`lower(${guests.email}) = ${validated.email.toLowerCase()}`
                        )
                    )
                    .limit(1);

                if (existingGuest.length > 0 && existingGuest[0].id !== guestId) {
                    throw new ValidationError("A guest with this email already exists for this event");
                }
            }
        }
        if (validated.phoneNumber !== undefined) {
            updateData.phoneNumber = validated.phoneNumber || null;
        }
        if (validated.rsvpStatus !== undefined) {
            updateData.rsvpStatus = validated.rsvpStatus ?? null;
            if (validated.rsvpStatus) {
                updateData.respondedAt = new Date();
            }
        }
        if (validated.additionalGuestCount !== undefined) {
            updateData.additionalGuestCount =
                (updateData.rsvpStatus ?? guest.rsvpStatus) === "yes"
                    ? validated.additionalGuestCount
                    : 0;
        }
        if (validated.rsvpNote !== undefined) {
            updateData.rsvpNote = validated.rsvpNote ?? null;
        }
        const willBeYes = (validated.rsvpStatus ?? guest.rsvpStatus) === "yes";
        const newAdditionalCount =
            validated.additionalGuestCount ?? guest.additionalGuestCount ?? 0;
        const [settings] = await tx
            .select({
                allowAdditionalGuests: eventSettings.allowAdditionalGuests,
                maxAdditionalGuests: eventSettings.maxAdditionalGuests,
                attendeeCategories: eventSettings.attendeeCategories,
            })
            .from(eventSettings)
            .where(eq(eventSettings.eventId, guest.eventId))
            .limit(1);
        const additionalGuestsEnabled =
            (settings?.allowAdditionalGuests ?? false) ||
            (Array.isArray(settings?.attendeeCategories) &&
                settings.attendeeCategories.length > 0);
        const maxAdditionalGuests = additionalGuestsEnabled
            ? (settings?.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
            : 0;
        if (newAdditionalCount > 0 && !additionalGuestsEnabled) {
            throw new ValidationError("Additional guests are not enabled for this event.");
        }
        if (newAdditionalCount > maxAdditionalGuests) {
            throw new ValidationError(
                `Additional guests cannot exceed ${maxAdditionalGuests} for this event.`,
            );
        }

        if (willBeYes) {
            const capacityInfo = await getEventCapacityInfo(guest.eventId, tx);
            if (capacityInfo.guestCapacity != null) {
                const currentSeatsFromGuest =
                    guest.rsvpStatus === "yes"
                        ? 1 + (guest.additionalGuestCount ?? 0)
                        : 0;
                const newSeatsFromGuest = 1 + newAdditionalCount;
                const totalSeats =
                    capacityInfo.totalSeatsUsed -
                    currentSeatsFromGuest +
                    newSeatsFromGuest;
                if (totalSeats > capacityInfo.guestCapacity) {
                    throw new ValidationError("This event has reached its capacity.");
                }
            }
        }

        const [updatedGuest] = await tx
            .update(guests)
            .set(updateData)
            .where(eq(guests.id, guestId))
            .returning();

        return updatedGuest!;
    });

    logger.info(`Guest updated: ${guestId} by user ${userId} (db id)`);

    return updatedGuest;
}
