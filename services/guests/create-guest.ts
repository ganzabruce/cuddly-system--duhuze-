import { eq, and, sql } from "drizzle-orm";
import { withTransaction } from "@/lib/db/serverless";
import { eventSettings, guests } from "@/lib/db/schema";
import { ValidationError } from "@/lib/utils/errors";
import { toE164 } from "@/lib/utils/phone";
import logger from "@/lib/utils/logger";
import { createGuestSchema } from "@/types/guests";
import { verifyEventOwnership } from "@/actions/events/verify-ownership";
import { getEventCapacityInfo } from "@/actions/events/get-event-capacity";
import { generateOpaqueToken } from "@/lib/utils/tokens";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventGuestsLink } from "@/lib/services/notifications/links";
import { DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP } from "@/lib/constants/events/rsvp-limits";

/**
 * Create a new guest
 */
export async function createGuest(data: unknown, userId: number) {
    const validated = createGuestSchema.parse(data);
    const { event, newGuest } = await withTransaction(async (tx) => {
        const event = await verifyEventOwnership(validated.eventId, userId, tx);

        if (validated.email) {
            const existingGuest = await tx
                .select()
                .from(guests)
                .where(
                    and(
                        eq(guests.eventId, validated.eventId),
                        sql`lower(${guests.email}) = ${validated.email.toLowerCase()}`
                    )
                )
                .limit(1);

            if (existingGuest.length > 0) {
                throw new ValidationError("A guest with this email already exists for this event");
            }
        }

        const additionalCount = validated.additionalGuestCount ?? 0;
        const [settings] = await tx
            .select({
                allowAdditionalGuests: eventSettings.allowAdditionalGuests,
                maxAdditionalGuests: eventSettings.maxAdditionalGuests,
                attendeeCategories: eventSettings.attendeeCategories,
            })
            .from(eventSettings)
            .where(eq(eventSettings.eventId, validated.eventId))
            .limit(1);
        const additionalGuestsEnabled =
            (settings?.allowAdditionalGuests ?? false) ||
            (Array.isArray(settings?.attendeeCategories) &&
                settings.attendeeCategories.length > 0);
        const maxAdditionalGuests = additionalGuestsEnabled
            ? (settings?.maxAdditionalGuests ?? DEFAULT_MAX_ADDITIONAL_GUESTS_PER_RSVP)
            : 0;
        if (additionalCount > 0 && !additionalGuestsEnabled) {
            throw new ValidationError("Additional guests are not enabled for this event.");
        }
        if (additionalCount > maxAdditionalGuests) {
            throw new ValidationError(
                `Additional guests cannot exceed ${maxAdditionalGuests} for this event.`,
            );
        }

        if (validated.rsvpStatus === "yes") {
            const capacityInfo = await getEventCapacityInfo(validated.eventId, tx);
            if (capacityInfo.guestCapacity != null) {
                const totalSeatsIfAdded =
                    capacityInfo.totalSeatsUsed + 1 + additionalCount;
                if (totalSeatsIfAdded > capacityInfo.guestCapacity) {
                    throw new ValidationError("This event has reached its capacity.");
                }
            }
        }

        const [newGuest] = await tx
            .insert(guests)
            .values({
                eventId: validated.eventId,
                name: validated.name,
                email: validated.email,
                phoneNumber: toE164(validated.phoneNumber) ?? null,
                rsvpStatus: validated.rsvpStatus ?? null,
                rsvpNote: validated.rsvpNote ?? null,
                additionalGuestCount: validated.rsvpStatus === "yes" ? additionalCount : 0,
                inviteToken: generateOpaqueToken(),
                inviteTokenState: "pending",
            })
            .returning();

        return { event, newGuest };
    });

    logger.info(`Guest created: ${newGuest.id} for event ${validated.eventId} by user ${userId} (db id)`);

    await publishNotification(
        {
            type: "guest_added",
            recipientUserIds: [event.createdBy],
            actorUserId: userId,
            context: {
                eventId: validated.eventId,
                eventSlug: event.slug,
                eventTitle: event.title,
                link: dashboardEventGuestsLink(event.slug),
                guestId: newGuest.id,
                guestName: newGuest.name,
                guestEmail: newGuest.email,
            },
        },
    );

    return newGuest;
}
