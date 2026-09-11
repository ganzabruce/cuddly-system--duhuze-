"use server";

import { and, eq, lt, sql } from "drizzle-orm";
import db from "@/lib/db";
import { events, guests } from "@/lib/db/schema";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";

// PUBLIC ACTION — no auth by design (guest-facing invite link resolution)
export async function resolveInviteToken(params: {
  username: string;
  eventSlug: string;
  token: string;
}) {
  const { username, eventSlug, token } = params;
  const normalizedToken = normalizeOpaqueToken(token);
  if (!normalizedToken) return null;

  await db
    .update(guests)
    .set({ inviteTokenState: "expired" })
    .where(
      and(
        eq(guests.inviteToken, normalizedToken),
        eq(guests.inviteTokenState, "pending"),
        lt(guests.inviteTokenExpiresAt, sql`now()`),
      ),
    );

  const [row] = await db
    .select({ guest: guests, event: events })
    .from(guests)
    .innerJoin(events, eq(guests.eventId, events.id))
    .where(
      and(
        eq(events.username, username),
        eq(events.slug, eventSlug),
        eq(guests.inviteToken, normalizedToken),
      ),
    )
    .limit(1);

  return row ?? null;
}
