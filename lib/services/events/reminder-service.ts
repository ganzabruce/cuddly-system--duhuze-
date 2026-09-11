import { eq, and, inArray, isNull } from "drizzle-orm";
import { isValidEmail } from "@/lib/utils";
import { prepareInviteTokens } from "./invite-token-helpers";
import db from "@/lib/db";
import { guests, users } from "@/lib/db/schema";
import { sendReminderEmails } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/utils/url";
import { NotFoundError } from "@/lib/utils/errors";
import logger from "@/lib/utils/logger";
import { generateOpaqueToken } from "@/lib/utils/tokens";
import { buildEmailQrImageUrl } from "@/lib/services/events/qr";
import { getEventById, getEventByIdForSystem } from "@/actions/events/get-events";
import { z } from "zod";
import { formatEventDateForOrganizer } from "@/actions/events/utils";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventGuestsLink } from "@/lib/services/notifications/links";
import {
  getPublicEventGuestPath,
  getPublicEventInvitePath,
} from "@/lib/constants/events/profile-paths";

export const sendRemindersSchema = z.object({
  eventId: z.number().int().positive("Valid event ID is required"),
  guestIds: z
    .array(z.number().int().positive())
    .min(1, "At least one guest is required")
    .max(100, "Maximum 100 reminders can be sent at once")
    .optional(),
});

export type SendRemindersData = z.infer<typeof sendRemindersSchema>;

export interface ReminderResult {
  sentCount: number;
  failedCount: number;
  errors?: Array<{ guestId: number; email: string | null; error: string }>;
}

type ReminderGuestRow = {
  id: number;
  rsvpStatus: "yes" | "no" | "maybe" | null;
  guestToken: string | null;
  confirmationToken: string | null;
  inviteToken: string | null;
};

function hasResponded(rsvpStatus: "yes" | "no" | "maybe" | null): boolean {
  return rsvpStatus === "yes" || rsvpStatus === "no" || rsvpStatus === "maybe";
}

async function ensureGuestManageTokens(guestRows: ReminderGuestRow[]): Promise<void> {
  const guestTokenUpdates: Array<{ id: number; token: string }> = [];

  for (const guest of guestRows) {
    if (hasResponded(guest.rsvpStatus) && !guest.guestToken) {
      const manageToken = guest.confirmationToken ?? generateOpaqueToken();
      guestTokenUpdates.push({ id: guest.id, token: manageToken });
      guest.guestToken = manageToken;
    }
  }

  if (guestTokenUpdates.length > 0) {
    await Promise.all(
      guestTokenUpdates.map(({ id, token }) =>
        db.update(guests).set({ guestToken: token }).where(eq(guests.id, id)),
      ),
    );
  }
}

export async function sendReminders(
    data: unknown,
    userId: number,
  ): Promise<ReminderResult> {
    const validated = sendRemindersSchema.parse(data);
    const { eventId, guestIds } = validated;

    const event = await getEventById(eventId, userId);

    const baseUrl = getAppBaseUrl();

    const eventDateFormatted = await formatEventDateForOrganizer(
      event.date,
      event.createdBy,
      event.timezone,
    );

    const [organizerRow] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, event.createdBy))
      .limit(1);
    const organizerName = organizerRow?.name ?? undefined;

    const guestCondition = guestIds?.length
      ? and(eq(guests.eventId, eventId), inArray(guests.id, guestIds))
      : eq(guests.eventId, eventId);

    const guestRows = await db
      .select({
        id: guests.id,
        name: guests.name,
        email: guests.email,
        rsvpStatus: guests.rsvpStatus,
        guestToken: guests.guestToken,
        confirmationToken: guests.confirmationToken,
        inviteToken: guests.inviteToken,
      })
      .from(guests)
      .where(guestCondition);

    if (!guestRows.length) {
      throw new NotFoundError("No guests found to send reminders");
    }

    const invalidGuests = guestRows.filter((g) => !isValidEmail(g.email));
    const validGuests = guestRows.filter((g) => isValidEmail(g.email));

    if (!validGuests.length) {
      return {
        sentCount: 0,
        failedCount: invalidGuests.length,
        errors: invalidGuests.map((g) => ({
          guestId: g.id,
          email: g.email,
          error: "Invalid or missing email address",
        })),
      };
    }

    const notRespondedGuests = validGuests.filter((g) => !hasResponded(g.rsvpStatus));
    const inviteTokenMap = await prepareInviteTokens(notRespondedGuests);
    await ensureGuestManageTokens(validGuests);

    const params = validGuests.map((guest) => {
      const eventUsername = event.username!;
      const guestLink = hasResponded(guest.rsvpStatus)
        ? `${baseUrl}${getPublicEventGuestPath(eventUsername, event.slug, (guest.guestToken ?? guest.confirmationToken)!)}`
        : `${baseUrl}${getPublicEventInvitePath(eventUsername, event.slug, inviteTokenMap.get(guest.id)!)}`;
      return {
        to: guest.email!,
        guestName: guest.name,
        eventTitle: event.title,
        rsvpLink: guestLink,
        eventDate: eventDateFormatted,
        qrImageUrl: buildEmailQrImageUrl(guestLink),
        organizerName,
      };
    });

    const result = await sendReminderEmails(params, {
      batchValidation: "permissive",
    });

    const emailErrors: Array<{ guestId: number; email: string | null; error: string }> = (
      result.errors ?? []
    ).map((e) => ({
      guestId: validGuests[e.index]!.id,
      email: validGuests[e.index]!.email,
      error: e.message,
    }));

    const errors = [
      ...invalidGuests.map((g) => ({
        guestId: g.id,
        email: g.email,
        error: "Invalid or missing email address",
      })),
      ...emailErrors,
    ];

    const failedIndices = new Set((result.errors ?? []).map((e) => e.index));
    const successfulIds = validGuests
      .filter((_, i) => !failedIndices.has(i))
      .map((g) => g.id);
    if (successfulIds.length > 0) {
      await db
        .update(guests)
        .set({ reminderSentAt: new Date() })
        .where(inArray(guests.id, successfulIds));
    }

    if (result.sentCount > 0) {
      logger.info(
        `Reminders sent for event ${eventId}: ${result.sentCount} to guests`,
      );
    }
    if (errors.length > 0) {
      logger.warn("Some reminder emails failed", {
        eventId,
        failedCount: errors.length,
        errors,
      });
    }

    if (result.sentCount > 0) {
      await publishNotification(
        {
          type: "reminders_sent",
          recipientUserIds: [event.createdBy],
          actorUserId: userId,
          context: {
            eventId: event.id,
            eventSlug: event.slug,
            eventTitle: event.title,
            eventDate: event.date,
            link: dashboardEventGuestsLink(event.slug),
            count: result.sentCount,
          },
        },
      );
    }

    return {
      sentCount: result.sentCount,
      failedCount: errors.length,
      ...(errors.length > 0 && { errors }),
    };
}

export async function sendScheduledReminders(
    eventId: number,
  ): Promise<ReminderResult> {
    const event = await getEventByIdForSystem(eventId);

    const baseUrl = getAppBaseUrl();
    const eventDateFormatted = await formatEventDateForOrganizer(
      event.date,
      event.createdBy,
      event.timezone,
    );

    const [scheduledOrganizerRow] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, event.createdBy))
      .limit(1);
    const scheduledOrganizerName = scheduledOrganizerRow?.name ?? undefined;

    const guestRows = await db
      .select({
        id: guests.id,
        name: guests.name,
        email: guests.email,
        rsvpStatus: guests.rsvpStatus,
        guestToken: guests.guestToken,
        confirmationToken: guests.confirmationToken,
        inviteToken: guests.inviteToken,
      })
      .from(guests)
      .where(
        and(
          eq(guests.eventId, eventId),
          eq(guests.invitationSent, true),
          isNull(guests.reminderSentAt),
        ),
      );

    if (guestRows.length === 0) {
      return { sentCount: 0, failedCount: 0 };
    }

    const invalidScheduledGuests = guestRows.filter((g) => !isValidEmail(g.email));
    const validScheduledGuests = guestRows.filter((g) => isValidEmail(g.email));

    if (!validScheduledGuests.length) {
      return {
        sentCount: 0,
        failedCount: invalidScheduledGuests.length,
        errors: invalidScheduledGuests.map((g) => ({
          guestId: g.id,
          email: g.email,
          error: "Invalid or missing email address",
        })),
      };
    }

    const notRespondedScheduled = validScheduledGuests.filter((g) => !hasResponded(g.rsvpStatus));
    const scheduledInviteTokenMap = await prepareInviteTokens(notRespondedScheduled);
    await ensureGuestManageTokens(validScheduledGuests);

    const params = validScheduledGuests.map((guest) => {
      const eventUsername = event.username!;
      const guestLink = hasResponded(guest.rsvpStatus)
        ? `${baseUrl}${getPublicEventGuestPath(eventUsername, event.slug, (guest.guestToken ?? guest.confirmationToken)!)}`
        : `${baseUrl}${getPublicEventInvitePath(eventUsername, event.slug, scheduledInviteTokenMap.get(guest.id)!)}`;
      return {
        to: guest.email!,
        guestName: guest.name,
        eventTitle: event.title,
        rsvpLink: guestLink,
        eventDate: eventDateFormatted,
        qrImageUrl: buildEmailQrImageUrl(guestLink),
        organizerName: scheduledOrganizerName,
      };
    });

    const result = await sendReminderEmails(params, {
      batchValidation: "permissive",
    });

    const scheduledEmailErrors: Array<{ guestId: number; email: string | null; error: string }> = (
      result.errors ?? []
    ).map((e) => ({
      guestId: validScheduledGuests[e.index]!.id,
      email: validScheduledGuests[e.index]!.email,
      error: e.message,
    }));

    const errors = [
      ...invalidScheduledGuests.map((g) => ({
        guestId: g.id,
        email: g.email,
        error: "Invalid or missing email address",
      })),
      ...scheduledEmailErrors,
    ];

    const failedIndices = new Set((result.errors ?? []).map((e) => e.index));
    const successfulIds = validScheduledGuests
      .filter((_, i) => !failedIndices.has(i))
      .map((g) => g.id);
    if (successfulIds.length > 0) {
      await db
        .update(guests)
        .set({ reminderSentAt: new Date() })
        .where(inArray(guests.id, successfulIds));
    }

    if (result.sentCount > 0) {
      logger.info(
        `Scheduled reminders sent for event ${eventId}: ${result.sentCount} guests`,
      );

      await publishNotification(
        {
          type: "reminders_sent",
          recipientUserIds: [event.createdBy],
          context: {
            eventId: event.id,
            eventSlug: event.slug,
            eventTitle: event.title,
            eventDate: event.date,
            link: dashboardEventGuestsLink(event.slug),
            count: result.sentCount,
          },
        },
      );
    }

    return {
      sentCount: result.sentCount,
      failedCount: errors.length,
      ...(errors.length > 0 && { errors }),
    };
}
