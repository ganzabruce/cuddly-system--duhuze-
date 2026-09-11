"use server";

// PUBLIC ACTION — no auth by design (guest-facing link resolution, token-validated)
import { and, eq, or, sql } from "drizzle-orm";
import db from "@/lib/db";
import { guests, events } from "@/lib/db/schema";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";
import type { GuestWithEvent } from "@/types/guests";

// PUBLIC ACTION — no auth by design (guest-facing RSVP link resolution)
/**
 * Resolve guest and event by guest token (no auth).
 * Falls back to legacy confirmation token for backward compatibility.
 * Returns null if token invalid or guest/event not found.
 */
export async function resolveGuestByToken(
  token: string,
  routeContext?: { username?: string; eventSlug?: string },
): Promise<GuestWithEvent | null> {
  const normalizedToken = normalizeOpaqueToken(token);
  if (!normalizedToken) return null;

  const [row] = await db
    .select({
      guest: guests,
      event: events,
    })
    .from(guests)
    .innerJoin(events, eq(guests.eventId, events.id))
    .where(
      and(
        or(
          eq(guests.guestToken, normalizedToken),
          eq(guests.confirmationToken, normalizedToken),
        ),
        routeContext?.username
          ? sql`lower(${events.username}) = ${routeContext.username.trim().toLowerCase()}`
          : sql`true`,
        routeContext?.eventSlug
          ? sql`lower(${events.slug}) = ${routeContext.eventSlug.trim().toLowerCase()}`
          : sql`true`,
      ),
    )
    .limit(1);

  if (!row) return null;
  return { guest: row.guest, event: row.event };
}
