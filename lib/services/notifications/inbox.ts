import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import db from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import type {
  NotificationCounts,
  NotificationFilter,
  NotificationInboxItem,
} from "@/types/notifications";

export type { NotificationCounts, NotificationFilter, NotificationInboxItem };

export async function listNotifications(
  userId: number,
  filter: NotificationFilter = "all",
  limit = 25,
): Promise<NotificationInboxItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const where =
    filter === "unread"
      ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
      : filter === "read"
        ? and(eq(notifications.userId, userId), isNotNull(notifications.readAt))
        : eq(notifications.userId, userId);

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      link: notifications.link,
      payload: notifications.payload,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(safeLimit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
    isRead: row.readAt != null,
  }));
}

export async function getNotificationCounts(userId: number): Promise<NotificationCounts> {
  const [allRows, unreadRows, readRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNotNull(notifications.readAt))),
  ]);

  return {
    all: allRows[0]?.count ?? 0,
    unread: unreadRows[0]?.count ?? 0,
    read: readRows[0]?.count ?? 0,
  };
}

export async function markNotificationRead(
  userId: number,
  notificationId: number,
): Promise<boolean> {
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });

  return updated.length > 0;
}
