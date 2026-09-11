"use server";

import db from "@/lib/db";
import { users, events, guests } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/actions/admin/auth";

export type AdminSearchResult =
    | { type: "user"; id: number; label: string; subtitle: string; href: string }
    | { type: "event"; id: number; label: string; subtitle: string; href: string }
    | { type: "guest"; id: number; label: string; subtitle: string; href: string; eventId: number };

const LIMIT_PER_TYPE = 5;

export async function adminSearch(q: string): Promise<AdminSearchResult[]> {
    await requireAdmin();
    const term = q.trim();
    if (term.length < 2) return [];

    const pattern = `%${term}%`;

    const [usersRows, eventsRows, guestsRows] = await Promise.all([
        db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                username: users.username,
            })
            .from(users)
            .where(
                or(
                    ilike(users.name, pattern),
                    ilike(users.email, pattern)
                )!
            )
            .limit(LIMIT_PER_TYPE),
        db
            .select({
                id: events.id,
                title: events.title,
                username: events.username,
                slug: events.slug,
            })
            .from(events)
            .where(ilike(events.title, pattern))
            .limit(LIMIT_PER_TYPE),
        db
            .select({
                id: guests.id,
                name: guests.name,
                email: guests.email,
                eventId: guests.eventId,
                eventSlug: events.slug,
                eventUsername: events.username,
            })
            .from(guests)
            .innerJoin(events, eq(guests.eventId, events.id))
            .where(
                or(
                    ilike(guests.name, pattern),
                    ilike(guests.email, pattern)
                )!
            )
            .limit(LIMIT_PER_TYPE),
    ]);

    const results: AdminSearchResult[] = [];

    for (const row of usersRows) {
        results.push({
            type: "user",
            id: row.id,
            label: row.name,
            subtitle: row.email,
            href: `/admin/users/${row.username}`,
        });
    }
    for (const row of eventsRows) {
        results.push({
            type: "event",
            id: row.id,
            label: row.title,
            subtitle: `${row.username}/${row.slug}`,
            href: `/admin/events/${row.username}/${row.slug}`,
        });
    }
    for (const row of guestsRows) {
        if (row.eventUsername && row.eventSlug) {
            results.push({
                type: "guest",
                id: row.id,
                label: row.name,
                subtitle: row.email ?? row.name,
                href: `/admin/events/${row.eventUsername}/${row.eventSlug}`,
                eventId: row.eventId,
            });
        }
    }

    return results;
}
