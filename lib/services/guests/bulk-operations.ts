import { eq, inArray, and } from "drizzle-orm";
import db from "@/lib/db";
import { withTransaction } from "@/lib/db/serverless";
import { guests, events } from "@/lib/db/schema";
import { NotFoundError, ValidationError, UnauthorizedError } from "@/lib/utils/errors";
import { toE164 } from "@/lib/utils/phone";
import logger from "@/lib/utils/logger";
import type { BulkCreateResult, BulkDeleteResult } from "@/types/guests";
import { bulkCreateGuestSchema } from "@/types/guests";
import { generateOpaqueToken } from "@/lib/utils/tokens";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventGuestsLink } from "@/lib/services/notifications/links";
import { assertCanUseBillingFeature } from "@/lib/services/billing/entitlements";

export async function bulkCreateGuests(
    data: unknown,
    userId: number
): Promise<BulkCreateResult> {
    const validated = bulkCreateGuestSchema.parse(data);
    const { eventId, guests: incoming } = validated;

    const [event] = await db
        .select({
            id: events.id,
            title: events.title,
            slug: events.slug,
            createdBy: events.createdBy,
        })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.createdBy, userId)))
        .limit(1);

    if (!event) {
        throw new UnauthorizedError("You don't have access to this event");
    }

    if (validated.source === "csv_import") {
        await assertCanUseBillingFeature(userId, "csvImport");
    }

    const newGuests = await withTransaction(async (tx) => {
        const existing = await tx
            .select({ email: guests.email, phoneNumber: guests.phoneNumber })
            .from(guests)
            .where(eq(guests.eventId, eventId));

        const takenEmails = new Set(
            existing.filter((g) => g.email).map((g) => g.email!.toLowerCase())
        );
        const takenPhones = new Set(
            existing.filter((g) => g.phoneNumber).map((g) => g.phoneNumber!)
        );

        const unique = incoming.filter((g) => {
            const email = g.email?.toLowerCase();
            const phone = toE164(g.phoneNumber);
            if (email && takenEmails.has(email)) return false;
            if (phone && takenPhones.has(phone)) return false;
            // Dedup within the batch itself
            if (email) { if (takenEmails.has(email)) return false; takenEmails.add(email); }
            if (phone) { if (takenPhones.has(phone)) return false; takenPhones.add(phone); }
            return true;
        });

        if (unique.length === 0) return [];

        return tx.insert(guests).values(
            unique.map((g) => ({
                eventId,
                name: g.name,
                email: g.email || null,
                phoneNumber: toE164(g.phoneNumber) ?? null,
                rsvpStatus: g.rsvpStatus ?? null,
                rsvpNote: null,
                inviteToken: generateOpaqueToken(),
                inviteTokenState: "pending" as const,
            }))
        ).returning();
    });

    if (newGuests.length > 0) {
        logger.info(`Bulk created ${newGuests.length} guests for event ${eventId} by user ${userId}`);

        await publishNotification({
            type: "guests_imported",
            recipientUserIds: [event.createdBy],
            actorUserId: userId,
            context: {
                eventId,
                eventSlug: event.slug,
                eventTitle: event.title,
                link: dashboardEventGuestsLink(event.slug),
                count: newGuests.length,
            },
        });
    }

    return {
        created: newGuests,
        skipped: incoming.length - newGuests.length,
        total: incoming.length,
    };
}

/**
 * Bulk delete guests
 */
export async function bulkDeleteGuests(
    guestIds: number[],
    userId: number
): Promise<BulkDeleteResult> {
    if (guestIds.length === 0) {
        throw new ValidationError("No guest IDs provided");
    }

    if (guestIds.length > 100) {
        throw new ValidationError("Maximum 100 guests can be deleted at once");
    }

    const guestsToDelete = await db
        .select({
            id: guests.id,
            eventId: guests.eventId,
        })
        .from(guests)
        .where(inArray(guests.id, guestIds));

    if (guestsToDelete.length === 0) {
        throw new NotFoundError("No guests found with provided IDs");
    }

    const eventIds = [...new Set(guestsToDelete.map((g) => g.eventId))];
    const ownedEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(and(inArray(events.id, eventIds), eq(events.createdBy, userId)));

    const ownedEventIds = new Set(ownedEvents.map((e) => e.id));
    const unauthorizedIds = eventIds.filter((id) => !ownedEventIds.has(id));

    if (unauthorizedIds.length > 0) {
        throw new UnauthorizedError("You don't have access to all events");
    }

    await db.delete(guests).where(inArray(guests.id, guestIds));

    logger.info(`Bulk deleted ${guestsToDelete.length} guests by user ${userId}`);

    return {
        success: true,
        deleted: guestsToDelete.length,
    };
}
