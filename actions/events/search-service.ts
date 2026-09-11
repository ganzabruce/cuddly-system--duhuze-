"use server";

import db from "@/lib/db";
import { events, guests } from "@/lib/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/services/auth/auth";

export type DashboardSearchResult =
    | { type: "event"; id: number; label: string; subtitle: string; href: string }
    | { type: "guest"; id: number; label: string; subtitle: string; href: string; eventId: number };

const LIMIT_PER_TYPE = 5;

export async function dashboardSearch(
    q: string
): Promise<DashboardSearchResult[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const term = q.trim();
    if (term.length < 2) return [];

    const pattern = `%${term}%`;

    const [eventsRows, guestsRows] = await Promise.all([
        db
            .select({
                id: events.id,
                title: events.title,
                slug: events.slug,
            })
            .from(events)
            .where(
                and(
                    eq(events.createdBy, user.id),
                    ilike(events.title, pattern)
                )
            )
            .limit(LIMIT_PER_TYPE),
        db
            .select({
                id: guests.id,
                name: guests.name,
                email: guests.email,
                eventId: guests.eventId,
                eventSlug: events.slug,
            })
            .from(guests)
            .innerJoin(events, eq(guests.eventId, events.id))
            .where(
                and(
                    eq(events.createdBy, user.id),
                    or(
                        ilike(guests.name, pattern),
                        ilike(guests.email, pattern)
                    )!
                )
            )
            .limit(LIMIT_PER_TYPE),
    ]);

    const results: DashboardSearchResult[] = [];

    for (const row of eventsRows) {
        results.push({
            type: "event",
            id: row.id,
            label: row.title,
            subtitle: row.slug,
            href: `/app/events/${row.slug}`,
        });
    }
    for (const row of guestsRows) {
        results.push({
            type: "guest",
            id: row.id,
            label: row.name,
            subtitle: row.email ?? row.name,
            href: `/app/events/${row.eventSlug}`,
            eventId: row.eventId,
        });
    }

    return results;
}
