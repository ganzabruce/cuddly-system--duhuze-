import { env } from "@/lib/env";
import { sendWhatsAppMessage } from "@/lib/services/notifications/whatsapp";
import type { ChannelHandler } from "@/types/notifications";

function buildTemplateVariables(
  input: Parameters<ChannelHandler["send"]>[0],
): Record<string, string> {
  const guestName = input.context.guestName?.trim() || "A guest";
  const status = String(input.context.rsvpStatus ?? "pending").toUpperCase();
  const eventTitle = input.context.eventTitle?.trim() || "your event";
  const eventSlug = input.context.eventSlug?.trim() || "";
  const notifLabel = input.type === "rsvp_updated" ? "Update" : "Response";

  return {
    "1": notifLabel,
    "2": guestName,
    "3": status,
    "4": eventTitle,
    "5": eventSlug ? `${eventSlug}/guests` : "",
  };
}

export const whatsappChannel: ChannelHandler = {
  async send(input) {
    const result = await sendWhatsAppMessage({
      to: input.recipient.whatsappPhoneNumber ?? "",
      templateSid: env.TWILIO_WHATSAPP_NOTIFY_TEMPLATE_SID,
      variables: buildTemplateVariables(input),
      logContext: {
        kind: "notification",
        type: input.type,
        recipientUserId: input.recipient.userId,
      },
    });

    return { channel: "whatsapp", ...result };
  },
};
