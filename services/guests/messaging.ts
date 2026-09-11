import { env } from "@/lib/env";
import { sendWhatsAppMessage, type WhatsAppSendResult } from "@/lib/services/notifications/whatsapp";

export interface WhatsAppInviteInput {
  guestName: string;
  guestPhone: string;
  organizerName: string;
  eventTitle: string;
  eventDate: string;
  rsvpLink: string;
}

/** Strips the origin so only the `<user>/events/...` path is sent as the template variable. */
function toGuestPath(link: string): string {
  return link.replace(/^https?:\/\/[^/]+\/u\//, "");
}

export async function sendWhatsAppInvitation(
  input: WhatsAppInviteInput,
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage({
    to: input.guestPhone,
    templateSid: env.TWILIO_WHATSAPP_INVITE_TEMPLATE_SID,
    variables: {
      "1": input.guestName,
      "2": input.organizerName,
      "3": input.eventTitle,
      "4": input.eventDate,
      "5": toGuestPath(input.rsvpLink),
    },
    logContext: { kind: "invitation", guestPhone: input.guestPhone },
  });
}

export interface WhatsAppRsvpConfirmationInput {
  guestName: string;
  guestPhone: string;
  guestResponseMessage: string;
  eventTitle: string;
  eventDateTime: string;
  guestLink: string;
}

const RSVP_RESPONSE_MESSAGES: Record<"yes" | "no" | "maybe", string> = {
  yes: "Thank you for confirming your attendance!",
  no: "Sorry you can't make it. Thanks for letting us know.",
  maybe: "Thanks for your response — we hope you can make it!",
};

export function getRsvpResponseMessage(status: "yes" | "no" | "maybe"): string {
  return RSVP_RESPONSE_MESSAGES[status];
}

export async function sendWhatsAppRsvpConfirmation(
  input: WhatsAppRsvpConfirmationInput,
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage({
    to: input.guestPhone,
    templateSid: env.TWILIO_WHATSAPP_RESPONSE_TEMPLATE_SID,
    variables: {
      "1": input.guestName,
      "2": input.guestResponseMessage,
      "3": input.eventTitle,
      "4": input.eventDateTime,
      "5": toGuestPath(input.guestLink),
    },
    logContext: { kind: "rsvp_confirmation", guestPhone: input.guestPhone },
  });
}
