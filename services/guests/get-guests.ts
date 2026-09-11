import { eq, desc, count, sum, and } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor } from "@/lib/db/serverless";
import { events, guests, rsvpAdditionalGuests, eventSettings, eventPayments } from "@/lib/db/schema";
import { NotFoundError } from "@/lib/utils/errors";
import type { PaginationParams, PaginatedResponse } from "@/types";
import { verifyEventOwnership } from "@/actions/events/verify-ownership";
import {
    buildGuestRsvpSummary,
    normalizeAttendeeCategories,
    normalizeCustomQuestions,
    normalizeCustomQuestionResponses,
} from "@/lib/constants/events/rsvp-config";

/**
 * Get paginated guests for a user (across all their events)
 */
export async function getUserGuests(
    userId: number,
    params: PaginationParams = {},
): Promise<
    PaginatedResponse<{
        id: number;
        eventId: number;
        name: string;
        email: string | null;
        rsvpStatus: "yes" | "no" | "maybe" | null;
        rsvpNote: string | null;
        respondedAt: Date | null;
        invitationSent: boolean;
        invitationOpened: boolean;
        createdAt: Date | null;
        eventTitle: string;
        eventSlug: string;
        eventDate: Date;
    }>
> {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const uid = Number(userId);
    if (Number.isNaN(uid)) {
        throw new Error("getUserGuests: invalid userId");
    }

    let guestsData: Array<{
        id: number;
        eventId: number;
        name: string;
        email: string | null;
        rsvpStatus: "yes" | "no" | "maybe" | null;
        rsvpNote: string | null;
        respondedAt: Date | null;
        invitationSent: boolean;
        invitationOpened: boolean;
        createdAt: Date | null;
        eventTitle: string;
        eventSlug: string;
        eventDate: Date;
    }>;
    let totalResult: { count: number }[];

    try {
        [guestsData, totalResult] = await Promise.all([
            db
                .select({
                    id: guests.id,
                    eventId: guests.eventId,
                    name: guests.name,
                    email: guests.email,
                    rsvpStatus: guests.rsvpStatus,
                    rsvpNote: guests.rsvpNote,
                    respondedAt: guests.respondedAt,
                    invitationSent: guests.invitationSent,
                    invitationOpened: guests.invitationOpened,
                    phoneNumber: guests.phoneNumber,
                    createdAt: guests.createdAt,
                    eventTitle: events.title,
                    eventSlug: events.slug,
                    eventDate: events.date,
                })
                .from(guests)
                .innerJoin(events, eq(guests.eventId, events.id))
                .where(eq(events.createdBy, uid))
                .limit(limit)
                .offset(offset)
                .orderBy(desc(guests.createdAt)),
            db
                .select({ count: count() })
                .from(guests)
                .innerJoin(events, eq(guests.eventId, events.id))
                .where(eq(events.createdBy, uid)),
        ]);
    } catch (err: unknown) {
        const cause = err instanceof Error ? err.cause : undefined;
        const message =
            cause instanceof Error ? cause.message : String(cause ?? err);
        throw new Error(`getUserGuests failed: ${message}`, { cause: err });
    }

    let total = totalResult[0].count;
    // On first page, when returning a capped subset, report total as rows we have so client pagination doesn't show phantom pages
    if (page === 1 && guestsData.length < total) {
        total = guestsData.length;
    }
    const totalPages = Math.ceil(total / limit);

    return {
        data: guestsData,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Get paginated guests for a specific event
 */
export async function getEventGuests(
    eventId: number,
    userId: number,
    params: PaginationParams = {},
): Promise<PaginatedResponse<typeof guests.$inferSelect>> {
    const { page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;

    // Verify event ownership
    await verifyEventOwnership(eventId, userId);

    // Fetch paginated guests and total count in parallel
    const [eventGuests, totalResult] = await Promise.all([
        db
            .select()
            .from(guests)
            .where(eq(guests.eventId, eventId))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(guests.createdAt)),
        db
            .select({ count: count() })
            .from(guests)
            .where(eq(guests.eventId, eventId)),
    ]);

    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / limit);

    return {
        data: eventGuests,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Get a single guest by ID
 */
export async function getGuestById(
    guestId: number,
    userId: number,
    executor: DbExecutor = db,
) {
    const [guest] = await executor
        .select()
        .from(guests)
        .where(eq(guests.id, guestId))
        .limit(1);

    if (!guest) {
        throw new NotFoundError("Guest not found");
    }

    // Verify event ownership
    await verifyEventOwnership(guest.eventId, userId, executor);

    const [settingsRow, additionalGuests, paidAmountRow] = await Promise.all([
        executor
            .select({
                customQuestions: eventSettings.customQuestions,
                attendeeCategories: eventSettings.attendeeCategories,
                contributionAmount: eventSettings.contributionAmount,
                currency: eventSettings.currency,
            })
            .from(eventSettings)
            .where(eq(eventSettings.eventId, guest.eventId))
            .limit(1)
            .then((rows) => rows[0] ?? null),
        executor
            .select({
                id: rsvpAdditionalGuests.id,
                name: rsvpAdditionalGuests.name,
                email: rsvpAdditionalGuests.email,
                categoryId: rsvpAdditionalGuests.categoryId,
                categoryLabel: rsvpAdditionalGuests.categoryLabel,
                sortOrder: rsvpAdditionalGuests.sortOrder,
            })
            .from(rsvpAdditionalGuests)
            .where(eq(rsvpAdditionalGuests.guestId, guestId))
            .orderBy(rsvpAdditionalGuests.sortOrder),
        executor
            .select({ total: sum(eventPayments.amount) })
            .from(eventPayments)
            .where(
                and(
                    eq(eventPayments.guestId, guestId),
                    eq(eventPayments.status, "succeeded"),
                ),
            )
            .then((rows) => rows[0] ?? null),
    ]);

    const customQuestions = normalizeCustomQuestions(settingsRow?.customQuestions);
    const attendeeCategories = normalizeAttendeeCategories(
        settingsRow?.attendeeCategories,
    );
    const actualPaid = Number(paidAmountRow?.total ?? 0);

    // Compute total attendees so we can derive the actual per-person rate
    const storedAdditionalGuestCount = Math.max(0, guest.additionalGuestCount ?? 0);
    const resolvedAdditionalGuestCount = Math.max(
        storedAdditionalGuestCount,
        additionalGuests.length,
    );
    const totalAttendees = 1 + resolvedAdditionalGuestCount;

    const rsvpSummary = buildGuestRsvpSummary({
        rsvpStatus: guest.rsvpStatus,
        categories: attendeeCategories,
        additionalGuests,
        additionalGuestCount: guest.additionalGuestCount,
        // When the guest has actually paid, use the real per-person amount
        // derived from the payment total instead of the event's recommended amount.
        contributionAmount:
            actualPaid > 0 && attendeeCategories.length === 0
                ? Math.round(actualPaid / totalAttendees)
                : (settingsRow?.contributionAmount ?? null),
    });

    // If the guest paid but the event has categories, check whether the category-based
    // total matches the actual payment. If it doesn't (optional payment overriding categories),
    // rebuild with a flat rate based on the actual amount.
    const finalSummary =
        rsvpSummary && actualPaid > 0
            ? (() => {
                  if (attendeeCategories.length === 0) {
                      // Flat-rate case: the per-person amount above already reflects actual paid
                      return rsvpSummary;
                  }

                  // Category case: if computed total differs from actual paid, the guest
                  // must have chosen a custom optional amount — fall back to flat-rate summary.
                  if (rsvpSummary.totalContribution !== actualPaid) {
                      const perPersonAmount = Math.round(actualPaid / totalAttendees);
                      return buildGuestRsvpSummary({
                          rsvpStatus: guest.rsvpStatus,
                          categories: [],
                          additionalGuests,
                          additionalGuestCount: guest.additionalGuestCount,
                          contributionAmount: perPersonAmount,
                      });
                  }

                  // Category total matches actual paid — use category amounts as-is
                  return { ...rsvpSummary, totalContribution: actualPaid };
              })()
            : rsvpSummary
              ? { ...rsvpSummary, totalContribution: actualPaid > 0 ? actualPaid : 0 }
              : null;

    return {
        ...guest,
        customQuestionResponses: normalizeCustomQuestionResponses(
            guest.customQuestionResponses,
        ),
        additionalGuests,
        customQuestions,
        attendeeCategories,
        currency: settingsRow?.currency ?? "RWF",
        rsvpSummary: finalSummary,
    };
}
