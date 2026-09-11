import db from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import type { ChannelHandler } from "@/types/notifications";

export const inAppChannel: ChannelHandler = {
  async send(input) {
    await db.insert(notifications).values({
      userId: input.recipient.userId,
      type: input.type,
      title: input.content.title,
      body: input.content.body,
      link: input.content.link,
      payload: input.content.payload ?? (Object.keys(input.context).length > 0 ? input.context : null),
    });

    return { channel: "in_app", status: "sent" };
  },
};

