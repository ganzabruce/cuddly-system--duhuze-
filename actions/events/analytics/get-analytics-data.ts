"use server";

import { desc, eq, inArray } from "drizzle-orm";
import db from "@/lib/db";
import { events, guests, eventSettings } from "@/lib/db/schema";
import type { AnalyticsData, EventAnalyticsRow } from "@/types/analytics";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type AnalyticsRange = {
    startDate?: Date;
    endDate?: Date;
};

function emptyAnalyticsData(): AnalyticsData {
    return {
        totalEvents: 0,
        totalGuests: 0,
        totalResponded: 0,
        overallResponseRate: 0,
        totalInvitationsSent: 0,
        totalInvitationsOpened: 0,
        overallOpenRate: 0,
        avgTimeToRespondDays: null,
        events: [],
    };
}

function isWithinRange(
    value: Date | null | undefined,
    range: AnalyticsRange,
): boolean {
    if (!value) {
        return false;
    }

    if (range.startDate && value < range.startDate) {
        return false;
    }

    if (range.endDate && value > range.endDate) {
        return false;
    }

    return true;
}

export async function getAnalyticsData(
    userId: number,
    range: AnalyticsRange = {},
): Promise<AnalyticsData | null> {
    const hasDateFilter = Boolean(range.startDate || range.endDate);

    const userEvents = await db
        .select({
            id: events.id,
            title: events.title,
            slug: events.slug,
            date: events.date,
        })
        .from(events)
        .where(eq(events.createdBy, userId))
        .orderBy(desc(events.date));

    if (userEvents.length === 0) {
        return emptyAnalyticsData();
    }

    const eventIds = userEvents.map((event) => event.id);

    const [guestRows, settingsRows] = await Promise.all([
        db
            .select({
                eventId: guests.eventId,
                rsvpStatus: guests.rsvpStatus,
                invitationSent: guests.invitationSent,
                invitationOpened: guests.invitationOpened,
                invitationSentAt: guests.invitationSentAt,
                invitationOpenedAt: guests.invitationOpenedAt,
                respondedAt: guests.respondedAt,
                additionalGuestCount: guests.additionalGuestCount,
            })
            .from(guests)
            .where(inArray(guests.eventId, eventIds)),
        db
            .select({
                eventId: eventSettings.eventId,
                guestCapacity: eventSettings.guestCapacity,
            })
            .from(eventSettings)
            .where(inArray(eventSettings.eventId, eventIds)),
    ]);

    const includedEventIds = hasDateFilter
        ? new Set(
              guestRows
                  .filter(
                      (guest) =>
                          isWithinRange(guest.invitationSentAt, range) ||
                          isWithinRange(guest.invitationOpenedAt, range) ||
                          isWithinRange(guest.respondedAt, range),
                  )
                  .map((guest) => guest.eventId),
          )
        : new Set(eventIds);

    const filteredEvents = userEvents.filter((event) =>
        includedEventIds.has(event.id),
    );

    if (filteredEvents.length === 0) {
        return emptyAnalyticsData();
    }

    const capacityByEvent = new Map(
        settingsRows.map((r) => [r.eventId, r.guestCapacity ?? null]),
    );

    const byEvent = new Map<
        number,
        {
            yes: number;
            no: number;
            maybe: number;
            pending: number;
            sent: number;
            opened: number;
            seatsUsed: number;
        }
    >();

    for (const event of filteredEvents) {
        byEvent.set(event.id, {
            yes: 0,
            no: 0,
            maybe: 0,
            pending: 0,
            sent: 0,
            opened: 0,
            seatsUsed: 0,
        });
    }

    let totalInvitations = 0;
    let totalAttendees = 0;
    let totalResponded = 0;
    let totalSent = 0;
    let totalOpened = 0;
    const allResponseDeltas: number[] = [];

    for (const g of guestRows) {
        const row = byEvent.get(g.eventId);
        if (!row) {
            continue;
        }

        totalInvitations += 1;

        if (g.rsvpStatus === "yes") {
            row.yes += 1;
            const attendees = 1 + (g.additionalGuestCount ?? 0);
            row.seatsUsed += attendees;
            totalAttendees += attendees;
            totalResponded += 1;
        } else if (g.rsvpStatus === "no") {
            row.no += 1;
            totalResponded += 1;
        } else if (g.rsvpStatus === "maybe") {
            row.maybe += 1;
            totalResponded += 1;
        } else {
            row.pending += 1;
        }

        if (g.invitationSent) {
            row.sent += 1;
            totalSent += 1;
        }
        if (g.invitationOpened) {
            row.opened += 1;
            totalOpened += 1;
        }

        if (g.invitationSentAt && g.respondedAt && g.rsvpStatus) {
            const sent = new Date(g.invitationSentAt).getTime();
            const responded = new Date(g.respondedAt).getTime();
            allResponseDeltas.push((responded - sent) / MS_PER_DAY);
        }
    }

    const eventsData: EventAnalyticsRow[] = filteredEvents.map((ev) => {
        const stats = byEvent.get(ev.id)!;
        const total = stats.yes + stats.no + stats.maybe + stats.pending;
        const responseRate =
            total === 0 ? 0 : (Math.round(((total - stats.pending) / total) * 10000) / 100);
        const openRate =
            stats.sent === 0
                ? 0
                : Math.round((stats.opened / stats.sent) * 10000) / 100;
        return {
            eventId: ev.id,
            title: ev.title,
            slug: ev.slug,
            date: ev.date,
            totalGuests: stats.seatsUsed,
            yesCount: stats.yes,
            noCount: stats.no,
            maybeCount: stats.maybe,
            pendingCount: stats.pending,
            responseRate,
            guestCapacity: capacityByEvent.get(ev.id) ?? null,
            invitationsSent: stats.sent,
            invitationsOpened: stats.opened,
            openRate,
        };
    });

    const overallResponseRate =
        totalInvitations === 0
            ? 0
            : Math.round((totalResponded / totalInvitations) * 10000) / 100;
    const overallOpenRate =
        totalSent === 0 ? 0 : Math.round((totalOpened / totalSent) * 10000) / 100;
    const avgTimeToRespondDays =
        allResponseDeltas.length === 0
            ? null
            : Math.round(
                  (allResponseDeltas.reduce((a, b) => a + b, 0) /
                      allResponseDeltas.length) *
                      100,
              ) / 100;

    return {
        totalEvents: filteredEvents.length,
        totalGuests: totalAttendees,
        totalResponded,
        overallResponseRate,
        totalInvitationsSent: totalSent,
        totalInvitationsOpened: totalOpened,
        overallOpenRate,
        avgTimeToRespondDays,
        events: eventsData,
    };
}
