import type { ChannelHandler } from "@/types/notifications";

export const pushChannel: ChannelHandler = {
  async send() {
    return { channel: "push", status: "skipped" };
  },
};

