import { getAppBaseUrl } from "@/lib/utils/url";
import { sendOrganizerNotificationEmail } from "@/lib/email/send";
import type { OrganizerNotificationAction, RsvpStatusLabel } from "@/lib/email/types";
import type { ChannelHandler } from "@/types/notifications";

function toOrganizerAction(type: string): OrganizerNotificationAction | null {
  if (type === "rsvp_received") return "rsvp_new";
  if (type === "rsvp_updated") return "rsvp_updated";
  return null;
}

export const emailChannel: ChannelHandler = {
  async send(input) {
    const action = toOrganizerAction(input.type);
    if (!action) {
      return { channel: "email", status: "skipped" };
    }

    const eventTitle = input.context.eventTitle?.trim();
    const guestName = input.context.guestName?.trim();
    const guestEmail = input.context.guestEmail?.trim();

    if (!eventTitle || !guestName || !guestEmail) {
      return { channel: "email", status: "skipped" };
    }

    const baseUrl = getAppBaseUrl();
    const relativeLink = input.content.link ?? (input.context.eventSlug
      ? `/app/events/${input.context.eventSlug}/guests`
      : "/app/guests");
    const dashboardLink = relativeLink.startsWith("http")
      ? relativeLink
      : `${baseUrl}${relativeLink}`;

    const result = await sendOrganizerNotificationEmail({
      to: input.recipient.email,
      organizerName: input.recipient.name ?? "Organizer",
      guestName,
      guestEmail,
      eventTitle,
      eventDate:
        typeof input.context.eventDate === "string"
          ? input.context.eventDate
          : undefined,
      action,
      rsvpStatus: input.context.rsvpStatus as RsvpStatusLabel | undefined,
      additionalGuestCount:
        typeof input.context.additionalGuestCount === "number"
          ? input.context.additionalGuestCount
          : undefined,
      dashboardLink,
    });

    if (!result.ok) {
      return {
        channel: "email",
        status: "failed",
        error: result.error ?? "Unknown email send failure",
      };
    }

    return { channel: "email", status: "sent" };
  },
};
