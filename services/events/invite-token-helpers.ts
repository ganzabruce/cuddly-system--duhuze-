import { eq, inArray, sql } from "drizzle-orm";
import db from "@/lib/db";
import { guests } from "@/lib/db/schema";
import { generateOpaqueToken } from "@/lib/utils/tokens";

const INVITE_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function buildInviteTokenExpiry(): Date {
  return new Date(Date.now() + INVITE_TOKEN_TTL_MS);
}

/**
 * Ensure the guest has an invite token and mark it pending with a fresh expiry.
 * Creates a new token if the guest has none. Returns the token value.
 */
export async function prepareInviteToken(guest: {
  id: number;
  inviteToken: string | null;
}): Promise<string> {
  const token = guest.inviteToken ?? generateOpaqueToken();
  const expiresAt = buildInviteTokenExpiry();

  if (!guest.inviteToken) {
    await db
      .update(guests)
      .set({ inviteToken: token, inviteTokenState: "pending", inviteTokenExpiresAt: expiresAt })
      .where(eq(guests.id, guest.id));
  } else {
    await db
      .update(guests)
      .set({ inviteTokenState: "pending", inviteTokenExpiresAt: expiresAt })
      .where(eq(guests.id, guest.id));
  }

  return token;
}

/**
 * Batch variant of prepareInviteToken for multiple guests.
 * Returns a Map<guestId, token> with the token to use per guest.
 * Two bulk DB updates: one for new tokens, one for existing token refreshes.
 */
export async function prepareInviteTokens(
  guestList: Array<{ id: number; inviteToken: string | null }>,
): Promise<Map<number, string>> {
  const expiresAt = buildInviteTokenExpiry();
  const tokenMap = new Map<number, string>();

  const needsNew: Array<{ id: number; token: string }> = [];
  const needsRefresh: number[] = [];

  for (const guest of guestList) {
    if (!guest.inviteToken) {
      const token = generateOpaqueToken();
      tokenMap.set(guest.id, token);
      needsNew.push({ id: guest.id, token });
    } else {
      tokenMap.set(guest.id, guest.inviteToken);
      needsRefresh.push(guest.id);
    }
  }

  await Promise.all([
    ...needsNew.map(({ id, token }) =>
      db
        .update(guests)
        .set({ inviteToken: token, inviteTokenState: "pending", inviteTokenExpiresAt: expiresAt })
        .where(eq(guests.id, id)),
    ),
    needsRefresh.length > 0
      ? db
          .update(guests)
          .set({ inviteTokenState: "pending", inviteTokenExpiresAt: expiresAt })
          .where(inArray(guests.id, needsRefresh))
      : Promise.resolve(),
  ]);

  return tokenMap;
}

/**
 * Roll back an invite token after a failed send.
 * - hadTokenBefore=false: token was created this attempt — null everything out.
 * - hadTokenBefore=true: guest already had a token — mark it revoked.
 */
export async function rollbackInviteToken(
  guestId: number,
  hadTokenBefore: boolean,
): Promise<void> {
  await db
    .update(guests)
    .set(
      hadTokenBefore
        ? { inviteTokenState: "revoked" }
        : { inviteToken: sql`null`, inviteTokenState: sql`null`, inviteTokenExpiresAt: sql`null` },
    )
    .where(eq(guests.id, guestId));
}
