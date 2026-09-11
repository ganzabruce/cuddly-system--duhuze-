import { eq, and, sql } from "drizzle-orm";
import db from "@/lib/db";
import type { DbExecutor, ServerlessTransaction } from "@/lib/db/serverless";
import { guests, rsvpAdditionalGuests } from "@/lib/db/schema";
import { generateOpaqueToken } from "@/lib/utils/tokens";
import type { AdditionalGuestDetail, RsvpStatus } from "@/types/rsvp";

export type NullableRsvpStatus = RsvpStatus | null;

export async function resolveExistingGuest(params: {
  eventId: number;
  normalizedEmail: string | null;
  phoneNumber?: string | null;
  visibility: string | null;
  rsvpAccessMode: string | null;
  inviteToken: string | null;
  executor?: DbExecutor;
}): Promise<
  | {
      ok: true;
      guest?: {
        id: number;
        rsvpStatus: NullableRsvpStatus;
        guestToken: string | null;
        additionalGuestCount: number | null;
      };
      isInviteOnly: boolean;
    }
  | { ok: false; message: string }
> {
  const {
    eventId,
    normalizedEmail,
    visibility,
    rsvpAccessMode,
    inviteToken,
    executor = db,
  } = params;
  const isInviteOnly = visibility === "private" && rsvpAccessMode === "invite_only";

  if (isInviteOnly) {
    if (!inviteToken) {
      return { ok: false, message: "This event requires a valid invitation link to RSVP." };
    }

    const [inviteGuest, existingGuestRow] = await Promise.all([
      executor
        .select({
          id: guests.id,
          email: guests.email,
          inviteTokenState: guests.inviteTokenState,
          inviteTokenExpiresAt: guests.inviteTokenExpiresAt,
        })
        .from(guests)
        .where(and(eq(guests.eventId, eventId), eq(guests.inviteToken, inviteToken)))
        .limit(1)
        .then((rows) => rows[0]),
      executor
        .select({
          id: guests.id,
          rsvpStatus: guests.rsvpStatus,
          guestToken: guests.guestToken,
          additionalGuestCount: guests.additionalGuestCount,
        })
        .from(guests)
        .where(
          and(
            eq(guests.eventId, eventId),
            sql`lower(${guests.email}) = ${normalizedEmail}`,
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
    ]);

    if (!inviteGuest) {
      return { ok: false, message: "Invitation link is invalid or expired." };
    }

    const isExpired =
      inviteGuest.inviteTokenExpiresAt != null &&
      inviteGuest.inviteTokenExpiresAt.getTime() < Date.now();
    const isBlockedState =
      inviteGuest.inviteTokenState === "used" ||
      inviteGuest.inviteTokenState === "expired" ||
      inviteGuest.inviteTokenState === "revoked";
    if (isExpired || isBlockedState) {
      return { ok: false, message: "Invitation link is invalid or expired." };
    }
    if (inviteGuest.email && normalizedEmail && inviteGuest.email.toLowerCase() !== normalizedEmail) {
      return { ok: false, message: "Please use the invited email address to RSVP for this event." };
    }
    if (!existingGuestRow || existingGuestRow.id !== inviteGuest.id) {
      return { ok: false, message: "Invitation link is invalid or expired." };
    }

    return { ok: true, guest: existingGuestRow, isInviteOnly: true };
  }

  const selectFields = {
    id: guests.id,
    rsvpStatus: guests.rsvpStatus,
    guestToken: guests.guestToken,
    additionalGuestCount: guests.additionalGuestCount,
  };

  if (normalizedEmail) {
    const [row] = await executor
      .select(selectFields)
      .from(guests)
      .where(
        and(
          eq(guests.eventId, eventId),
          sql`lower(${guests.email}) = ${normalizedEmail}`,
        ),
      )
      .limit(1);
    if (row) return { ok: true, guest: row, isInviteOnly: false };
  }

  if (params.phoneNumber) {
    const [row] = await executor
      .select(selectFields)
      .from(guests)
      .where(
        and(
          eq(guests.eventId, eventId),
          eq(guests.phoneNumber, params.phoneNumber),
        ),
      )
      .limit(1);
    if (row) return { ok: true, guest: row, isInviteOnly: false };
  }

  return { ok: true, guest: undefined, isInviteOnly: false };
}

async function updateGuestRow(
  tx: ServerlessTransaction,
  guestId: number,
  params: {
    nameValue: string;
    guestToken: string;
    phoneNumber: string | null;
    rsvpStatus: NullableRsvpStatus;
    rsvpNote: string | null;
    additionalGuestCount: number;
    customQuestionResponses: Record<string, string> | null;
    isInviteOnly: boolean;
    eventId: number;
    additionalGuestsToInsert: AdditionalGuestDetail[];
    respondedAt: Date | null;
  },
) {
  await tx
    .update(guests)
    .set({
      name: params.nameValue,
      guestToken: params.guestToken,
      phoneNumber: params.phoneNumber,
      rsvpStatus: params.rsvpStatus,
      rsvpNote: params.rsvpNote,
      respondedAt: params.respondedAt,
      additionalGuestCount: params.additionalGuestCount,
      customQuestionResponses: params.customQuestionResponses,
      ...(params.isInviteOnly
        ? {
            inviteTokenState: "used" as const,
            inviteTokenUsedAt: new Date(),
          }
        : {}),
    })
    .where(eq(guests.id, guestId));

  await tx
    .delete(rsvpAdditionalGuests)
    .where(eq(rsvpAdditionalGuests.guestId, guestId));

  if (params.additionalGuestCount > 0 && params.additionalGuestsToInsert.length > 0) {
    await tx.insert(rsvpAdditionalGuests).values(
      params.additionalGuestsToInsert.map((g) => ({
        eventId: params.eventId,
        guestId,
        name: g.name,
        email: g.email,
        categoryId: g.categoryId,
        categoryLabel: g.categoryLabel,
        sortOrder: g.sortOrder,
      })),
    );
  }
}

export async function persistGuestUpsert(params: {
  tx: ServerlessTransaction;
  eventId: number;
  nameValue: string;
  emailValue: string | null;
  phoneNumber: string | null;
  rsvpStatus: NullableRsvpStatus;
  rsvpNote: string | null;
  additionalGuestCount: number;
  customQuestionResponses: Record<string, string> | null;
  isInviteOnly: boolean;
  normalizedEmail: string | null;
  additionalGuestsToInsert: AdditionalGuestDetail[];
  existingGuest?: { id: number; guestToken: string | null };
  respondedAt: Date | null;
}): Promise<{ guestToken: string; guestId: number }> {
  const {
    tx,
    eventId,
    nameValue,
    emailValue,
    rsvpStatus,
    rsvpNote,
    additionalGuestCount,
    customQuestionResponses,
    isInviteOnly,
    normalizedEmail,
    additionalGuestsToInsert,
    existingGuest,
  } = params;

  if (existingGuest) {
    const ensuredGuestToken = existingGuest.guestToken ?? generateOpaqueToken();
    await updateGuestRow(tx, existingGuest.id, {
      nameValue,
      guestToken: ensuredGuestToken,
      phoneNumber: params.phoneNumber,
      rsvpStatus,
      rsvpNote,
      additionalGuestCount,
      customQuestionResponses,
      isInviteOnly,
      eventId,
      additionalGuestsToInsert,
      respondedAt: params.respondedAt,
    });
    return { guestToken: ensuredGuestToken, guestId: existingGuest.id };
  }

  try {
    const guestToken = generateOpaqueToken();
    const [inserted] = await tx
      .insert(guests)
      .values({
        eventId,
        name: nameValue,
        email: emailValue,
        phoneNumber: params.phoneNumber,
        guestToken,
        rsvpStatus,
        rsvpNote,
        respondedAt: params.respondedAt,
        invitationSent: false,
        additionalGuestCount,
        customQuestionResponses,
        ...(isInviteOnly
          ? {
              inviteTokenState: "used" as const,
              inviteTokenUsedAt: new Date(),
            }
          : {}),
      })
      .returning({ id: guests.id, guestToken: guests.guestToken });

    const guestId = inserted.id;

    if (additionalGuestCount > 0 && additionalGuestsToInsert.length > 0) {
      await tx.insert(rsvpAdditionalGuests).values(
        additionalGuestsToInsert.map((g) => ({
          eventId,
          guestId,
          name: g.name,
          email: g.email,
          categoryId: g.categoryId,
          categoryLabel: g.categoryLabel,
          sortOrder: g.sortOrder,
        })),
      );
    }

    return { guestToken: inserted.guestToken ?? guestToken, guestId };
  } catch (insertError) {
    const err = insertError as { code?: string };
    if (err.code !== "23505") {
      throw insertError;
    }

    const racedCondition = normalizedEmail
      ? sql`lower(${guests.email}) = ${normalizedEmail}`
      : params.phoneNumber
        ? eq(guests.phoneNumber, params.phoneNumber)
        : null;

    if (!racedCondition) throw insertError;

    const [racedGuest] = await tx
      .select({ id: guests.id, guestToken: guests.guestToken })
      .from(guests)
      .where(and(eq(guests.eventId, eventId), racedCondition))
      .limit(1);

    if (!racedGuest) {
      throw insertError;
    }

    const ensuredGuestToken = racedGuest.guestToken ?? generateOpaqueToken();
    await updateGuestRow(tx, racedGuest.id, {
      nameValue,
      guestToken: ensuredGuestToken,
      phoneNumber: params.phoneNumber,
      rsvpStatus,
      rsvpNote,
      additionalGuestCount,
      customQuestionResponses,
      isInviteOnly,
      eventId,
      additionalGuestsToInsert,
      respondedAt: params.respondedAt,
    });

    return { guestToken: ensuredGuestToken, guestId: racedGuest.id };
  }
}

export function calculateUpdatedSeatUsage(params: {
  totalSeatsUsed: number;
  existingStatus: NullableRsvpStatus;
  existingAdditionalGuestCount: number;
  nextStatus: NullableRsvpStatus;
  nextAdditionalGuestCount: number;
}) {
  const currentSeats =
    params.existingStatus === "yes" || params.existingStatus === null
      ? 1 + params.existingAdditionalGuestCount
      : 0;
  const nextSeats =
    params.nextStatus === "yes" || params.nextStatus === null
      ? 1 + params.nextAdditionalGuestCount
      : 0;

  return params.totalSeatsUsed - currentSeats + nextSeats;
}
