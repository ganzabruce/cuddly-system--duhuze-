import { env } from "@/lib/env";
import { toE164 } from "@/lib/utils/phone";
import logger from "@/lib/utils/logger";

export type WhatsAppSendStatus = "sent" | "skipped" | "failed";

export interface WhatsAppSendResult {
  status: WhatsAppSendStatus;
  error?: string;
}

export interface SendWhatsAppMessageInput {
  /** Recipient phone number in E.164 form (without the `whatsapp:` prefix). */
  to: string;
  /** Twilio approved template (Content) SID. */
  templateSid: string | null | undefined;
  /** Template variables, keyed by their `{{n}}` index as a string. */
  variables: Record<string, string>;
  /** Extra fields attached to the failure log for debugging. */
  logContext?: Record<string, unknown>;
}

function getTwilioCredentials() {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_WHATSAPP_FROM
  ) {
    return null;
  }

  return {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    from: env.TWILIO_WHATSAPP_FROM,
  };
}

/**
 * Low-level Twilio WhatsApp send. Every WhatsApp message (invitations, RSVP
 * confirmations, organizer notifications) goes through here — callers only
 * supply the recipient, template SID, and variables. Returns `skipped` when
 * Twilio isn't configured or the recipient/template is missing, so callers
 * never have to guard for that themselves.
 */
export async function sendWhatsAppMessage(
  input: SendWhatsAppMessageInput,
): Promise<WhatsAppSendResult> {
  const credentials = getTwilioCredentials();
  // Normalize the recipient to E.164 (Twilio's required format). This also covers
  // legacy rows stored before phone numbers were normalized on write.
  const to = toE164(input.to);
  if (!credentials || !input.templateSid || !to) {
    return { status: "skipped", error: "WhatsApp not configured or missing recipient/template" };
  }

  const body = new URLSearchParams({
    From: `whatsapp:${credentials.from}`,
    To: `whatsapp:${to}`,
    ContentSid: input.templateSid,
    ContentVariables: JSON.stringify(input.variables),
  });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn("WhatsApp message send failed", {
        ...input.logContext,
        status: response.status,
        error: errorText,
      });
      return { status: "failed", error: `Twilio responded with ${response.status}` };
    }

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "WhatsApp send failed",
    };
  }
}
