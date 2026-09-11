import { eq, and, inArray } from "drizzle-orm";
import db from "@/lib/db";
import { guests, users } from "@/lib/db/schema";
import { sendInviteEmail } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/utils/url";
import { NotFoundError } from "@/lib/utils/errors";
import logger from "@/lib/utils/logger";
import { getEventById } from "@/actions/events/get-events";
import { z } from "zod";
import { formatEventDateForOrganizer } from "@/actions/events/utils";
import { publishNotification } from "@/lib/services/notifications/service";
import { dashboardEventGuestsLink } from "@/lib/services/notifications/links";
import { getPublicEventInvitePath } from "@/lib/constants/events/profile-paths";
import { sendWhatsAppInvitation } from "@/lib/services/guests/messaging";
import { assertCanUseBillingFeature } from "@/lib/services/billing/entitlements";
import { withRetry } from "@/lib/utils/retry";
import { isValidEmail } from "@/lib/utils";
import { prepareInviteToken, rollbackInviteToken } from "./invite-token-helpers";

export const sendInvitationsSchema = z.object({
  eventId: z.number().int().positive("Valid event ID is required"),
  guestIds: z
    .array(z.number().int().positive())
    .min(1, "At least one guest is required")
    .max(100, "Maximum 100 invitations can be sent at once")
    .optional(),
});

export type SendInvitationsData = z.infer<typeof sendInvitationsSchema>;

export interface InvitationResult {
  sentCount: number;
  failedCount: number;
  whatsappSentCount?: number;
  whatsappSkippedCount?: number;
  errors?: Array<{ guestId: number; email: string; error: string }>;
}

export async function sendInvitations(
  data: unknown,
  userId: number,
): Promise<InvitationResult> {
    const validated = sendInvitationsSchema.parse(data);
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

    let whatsappEnabled = event.whatsappEnabled ?? false;

    if (whatsappEnabled) {
      try {
        await assertCanUseBillingFeature(userId, "whatsappInvitations");
      } catch {
        whatsappEnabled = false;
        logger.warn("WhatsApp invitations disabled: user lacks billing entitlement", { userId, eventId });
      }
    }

    const guestCondition = guestIds?.length
      ? and(eq(guests.eventId, eventId), inArray(guests.id, guestIds))
      : eq(guests.eventId, eventId);

    const guestRows = await db
      .select({
        id: guests.id,
        name: guests.name,
        email: guests.email,
        phoneNumber: guests.phoneNumber,
        inviteToken: guests.inviteToken,
      })
      .from(guests)
      .where(guestCondition);

    if (!guestRows.length) {
      throw new NotFoundError("No guests found to send invitations");
    }

    let sentCount = 0;
    let whatsappSentCount = 0;
    let whatsappSkippedCount = 0;
    const errors: Array<{ guestId: number; email: string; error: string }> = [];
    const successfulGuestIds: number[] = [];
    const whatsappSuccessfulGuestIds: number[] = [];

    for (const guest of guestRows) {
      const email = guest.email?.trim() ?? "";
      const hasEmail = isValidEmail(email);
      const hasPhone = !!guest.phoneNumber;

      if (!hasEmail && !hasPhone) {
        errors.push({ guestId: guest.id, email: "", error: "No email or phone number" });
        continue;
      }

      const hadTokenBefore = !!guest.inviteToken;
      const inviteToken = await prepareInviteToken(guest);
      const guestLink = `${baseUrl}${getPublicEventInvitePath(event.username, event.slug, inviteToken)}`;

      // Send email if guest has a valid email
      if (hasEmail) {
        try {
          const result = await sendInviteEmail({
            to: email,
            guestName: guest.name,
            eventTitle: event.title,
            rsvpLink: guestLink,
            eventDate: eventDateFormatted,
            organizerName,
          });

          if (result.ok) {
            successfulGuestIds.push(guest.id);
            sentCount++;
          } else {
            await rollbackInviteToken(guest.id, hadTokenBefore);
            errors.push({ guestId: guest.id, email, error: result.error ?? "Unknown error" });
            logger.warn("Invitation email failed", { guestId: guest.id, eventId, error: result.error });
            continue;
          }
        } catch (error) {
          await rollbackInviteToken(guest.id, hadTokenBefore);
          errors.push({ guestId: guest.id, email, error: error instanceof Error ? error.message : "Unknown error" });
          logger.error("Failed to send invitation", error, { guestId: guest.id, eventId });
          continue;
        }
      }

      // Send WhatsApp if enabled and guest has a phone number
      if (whatsappEnabled && hasPhone) {
        try {
          const waResult = await withRetry(() => sendWhatsAppInvitation({
            guestName: guest.name,
            guestPhone: guest.phoneNumber!,
            organizerName: organizerName ?? "Your host",
            eventTitle: event.title,
            eventDate: eventDateFormatted,
            rsvpLink: guestLink,
          }));
          if (waResult.status === "sent") {
            whatsappSuccessfulGuestIds.push(guest.id);
            whatsappSentCount++;
            if (!hasEmail) {
              // Phone-only guest — count WhatsApp as a successful invitation
              successfulGuestIds.push(guest.id);
              sentCount++;
            }
          } else {
            logger.warn("WhatsApp invitation failed", { guestId: guest.id, eventId, error: waResult.error });
            if (!hasEmail) {
              errors.push({ guestId: guest.id, email: "", error: "WhatsApp invitation failed" });
            }
          }
        } catch (error) {
          logger.warn("WhatsApp invitation error", { guestId: guest.id, eventId, error });
          if (!hasEmail) {
            errors.push({ guestId: guest.id, email: "", error: "WhatsApp invitation failed" });
          }
        }
      } else if (!hasEmail && !whatsappEnabled) {
        // Phone-only guest but WhatsApp is off — nothing to send
        await rollbackInviteToken(guest.id, hadTokenBefore);
        logger.info("Skipped phone-only guest (WhatsApp disabled)", { guestId: guest.id, eventId });
      } else if (whatsappEnabled && !hasPhone) {
        whatsappSkippedCount++;
      }
    }

    // Batch update all successful guests
    if (successfulGuestIds.length > 0) {
      await db
        .update(guests)
        .set({
          invitationSent: true,
          invitationSentAt: new Date(),
        })
        .where(inArray(guests.id, successfulGuestIds));
    }

    // Batch update WhatsApp sent status
    if (whatsappSuccessfulGuestIds.length > 0) {
      await db
        .update(guests)
        .set({
          whatsappInvitationSent: true,
          whatsappInvitationSentAt: new Date(),
        })
        .where(inArray(guests.id, whatsappSuccessfulGuestIds));
    }

    logger.info(
      `Invitations sent for event ${eventId}: ${sentCount} successful, ${errors.length} failed`,
    );

    if (sentCount > 0) {
      await publishNotification(
        {
          type: "invitations_sent",
          recipientUserIds: [event.createdBy],
          actorUserId: userId,
          context: {
            eventId: event.id,
            eventSlug: event.slug,
            eventTitle: event.title,
            eventDate: event.date,
            link: dashboardEventGuestsLink(event.slug),
            count: sentCount,
          },
        },
      );
    }

    return {
      sentCount,
      failedCount: errors.length,
      ...(whatsappEnabled && { whatsappSentCount, whatsappSkippedCount }),
      ...(errors.length > 0 && { errors }),
    };
}
