"use server";

import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { events, guests, users } from "@/lib/db/schema";
import { normalizeOpaqueToken } from "@/lib/utils/tokens";
import { sendInviteEmail, sendRsvpConfirmationEmail } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/utils/url";
import {
  getPublicEventInvitePath,
  getPublicEventGuestPath,
} from "@/lib/constants/events/profile-paths";
import {
  prepareInviteToken,
  rollbackInviteToken,
} from "@/lib/services/events/invite-token-helpers";
import { formatEventDateForOrganizer } from "@/actions/events/utils";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { buildEmailQrImageUrl } from "@/lib/services/events/qr";
import logger from "@/lib/utils/logger";

const GENERIC_MESSAGE =
  "We've sent a link to the email associated with this invitation. Check your inbox.";

// PUBLIC ACTION — no auth by design (token-scoped: inviteToken validated below; always returns generic message to avoid enumeration)
export async function requestInviteResend(
  token: string,
): Promise<{ success: boolean; message: string }> {
  const normalizedToken = normalizeOpaqueToken(token);
  if (!normalizedToken) {
    return { success: true, message: GENERIC_MESSAGE };
  }

  const [row] = await db
    .select({
      guest: {
        id: guests.id,
        email: guests.email,
        name: guests.name,
        inviteToken: guests.inviteToken,
        inviteTokenState: guests.inviteTokenState,
        guestToken: guests.guestToken,
        rsvpStatus: guests.rsvpStatus,
        rsvpNote: guests.rsvpNote,
      },
      event: {
        id: events.id,
        title: events.title,
        slug: events.slug,
        username: events.username,
        date: events.date,
        timezone: events.timezone,
        createdBy: events.createdBy,
        locationName: events.locationName,
        locationLink: events.locationLink,
        locationType: events.locationType,
      },
    })
    .from(guests)
    .innerJoin(events, eq(guests.eventId, events.id))
    .where(eq(guests.inviteToken, normalizedToken))
    .limit(1);

  if (!row) {
    return { success: true, message: GENERIC_MESSAGE };
  }

  const guestEmail = row.guest.email?.trim().toLowerCase() ?? "";
  if (!guestEmail) {
    return { success: true, message: GENERIC_MESSAGE };
  }

  const state = row.guest.inviteTokenState;
  if (state !== "used" && state !== "expired") {
    return { success: true, message: GENERIC_MESSAGE };
  }

  const baseUrl = getAppBaseUrl();
  const tz = row.event.timezone ?? undefined;

  const [organizerRow] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, row.event.createdBy))
    .limit(1);

  try {
    if (state === "used" && row.guest.guestToken && row.guest.rsvpStatus) {
      const guestPath = getPublicEventGuestPath(
        row.event.username,
        row.event.slug,
        row.guest.guestToken,
      );
      const manageLink = `${baseUrl}${guestPath}`;
      const qrImageUrl = buildEmailQrImageUrl(manageLink);

      await sendRsvpConfirmationEmail({
        to: guestEmail,
        guestName: row.guest.name,
        eventTitle: row.event.title,
        rsvpStatus: row.guest.rsvpStatus as "yes" | "no" | "maybe",
        eventDate: formatEventDate(row.event.date, { timezone: tz }),
        eventTime: formatEventTime(row.event.date, { timezone: tz }),
        eventPageLink: manageLink,
        qrImageUrl,
        organizerName: organizerRow?.name ?? undefined,
        rsvpNote: row.guest.rsvpNote,
        locationName: row.event.locationName ?? undefined,
        locationLink: row.event.locationLink ?? undefined,
        locationType: row.event.locationType ?? undefined,
      });
    } else {
      const hadTokenBefore = !!row.guest.inviteToken;
      const freshToken = await prepareInviteToken({
        id: row.guest.id,
        inviteToken: row.guest.inviteToken,
      });
      const inviteLink = `${baseUrl}${getPublicEventInvitePath(
        row.event.username,
        row.event.slug,
        freshToken,
      )}`;

      const eventDateFormatted = await formatEventDateForOrganizer(
        row.event.date,
        row.event.createdBy,
        row.event.timezone,
      );

      try {
        await sendInviteEmail({
          to: guestEmail,
          guestName: row.guest.name,
          eventTitle: row.event.title,
          rsvpLink: inviteLink,
          eventDate: eventDateFormatted,
          organizerName: organizerRow?.name ?? undefined,
        });
      } catch (error) {
        await rollbackInviteToken(row.guest.id, hadTokenBefore);
        throw error;
      }
    }

    logger.info("Invite resend requested", {
      guestId: row.guest.id,
      tokenState: state,
    });
  } catch (error) {
    logger.error("Failed to resend invite", error, {
      guestId: row.guest.id,
    });
  }

  return { success: true, message: GENERIC_MESSAGE };
}
