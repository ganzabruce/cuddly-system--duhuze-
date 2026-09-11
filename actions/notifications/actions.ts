"use server";

import { getCurrentUser } from "@/lib/services/auth/auth";
import {
  getNotificationCounts,
  listNotifications,
  markNotificationRead,
} from "@/lib/services/notifications/inbox";

export async function markNotificationReadAction(
  notificationId: number,
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  const success = await markNotificationRead(user.id, notificationId);
  return { success };
}

export async function getNotificationsSnapshotAction(): Promise<{
  success: boolean;
  notifications: Awaited<ReturnType<typeof listNotifications>>;
  counts: Awaited<ReturnType<typeof getNotificationCounts>>;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      notifications: [],
      counts: { all: 0, unread: 0, read: 0 },
    };
  }

  const [notifications, counts] = await Promise.all([
    listNotifications(user.id, "all", 25),
    getNotificationCounts(user.id),
  ]);

  return { success: true, notifications, counts };
}

export async function getNotificationCountsAction(): Promise<{
  success: boolean;
  counts: Awaited<ReturnType<typeof getNotificationCounts>>;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      counts: { all: 0, unread: 0, read: 0 },
    };
  }

  const counts = await getNotificationCounts(user.id);
  return { success: true, counts };
}
