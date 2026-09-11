import { inArray } from "drizzle-orm";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { parseUserPreferences } from "@/types/auth";
import logger from "@/lib/utils/logger";
import { notificationCatalog } from "./catalog";
import { inAppChannel } from "./channels/in-app";
import { emailChannel } from "./channels/email";
import { pushChannel } from "./channels/push";
import { whatsappChannel } from "./channels/whatsapp";
import { isChannelEnabledForRecipient } from "./preferences";
import type {
  ChannelHandler,
  NotificationChannel,
  NotificationRecipient,
  PublishNotificationInput,
} from "@/types/notifications";

const channelHandlers: Partial<Record<NotificationChannel, ChannelHandler>> = {
  in_app: inAppChannel,
  email: emailChannel,
  push: pushChannel,
  whatsapp: whatsappChannel,
};

export async function publishNotification(input: PublishNotificationInput): Promise<void> {
  try {
    const definition = notificationCatalog[input.type];
    if (!definition) {
      logger.warn("Notification publish skipped: unknown type", { type: input.type });
      return;
    }

    const recipientIds = Array.from(new Set(input.recipientUserIds.filter((id) => Number.isInteger(id) && id > 0)));
    if (recipientIds.length === 0) return;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        preferences: users.preferences,
        whatsappPhoneNumber: users.whatsappPhoneNumber,
        whatsappConsentAt: users.whatsappConsentAt,
      })
      .from(users)
      .where(inArray(users.id, recipientIds));

    if (rows.length === 0) return;

    const context = input.context ?? {};
    const content = definition.buildContent(context);

    const recipients: NotificationRecipient[] = rows.map((row) => ({
      userId: row.id,
      email: row.email,
      name: row.name ?? null,
      preferences: parseUserPreferences(row.preferences),
      whatsappPhoneNumber: row.whatsappPhoneNumber ?? null,
      whatsappConsentAt:
        row.whatsappConsentAt instanceof Date
          ? row.whatsappConsentAt.toISOString()
          : row.whatsappConsentAt
            ? String(row.whatsappConsentAt)
            : null,
    }));

    for (const recipient of recipients) {
      for (const channel of definition.channels) {
        const handler = channelHandlers[channel];
        if (!handler) continue;
        if (!isChannelEnabledForRecipient(channel, input.type, recipient)) continue;

        try {
          const result = await handler.send({
            type: input.type,
            channel,
            recipient,
            content,
            context,
            actorUserId: input.actorUserId ?? null,
          });

          if (result.status === "failed") {
            logger.warn("Notification channel failed", {
              type: input.type,
              channel,
              recipientUserId: recipient.userId,
              error: result.error,
            });
          }
        } catch (error) {
          logger.warn("Notification channel threw", {
            type: input.type,
            channel,
            recipientUserId: recipient.userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  } catch (error) {
    logger.warn("Notification publish failed", {
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
