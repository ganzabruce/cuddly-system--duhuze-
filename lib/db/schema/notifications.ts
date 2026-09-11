import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type_enum", [
  "event_created",
  "event_updated",
  "guest_added",
  "guests_imported",
  "invitations_sent",
  "reminders_sent",
  "rsvp_received",
  "rsvp_updated",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    link: text("link"),
    payload: jsonb("payload"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_created_at_idx").on(table.userId, table.createdAt),
    index("notifications_user_read_at_idx").on(table.userId, table.readAt),
    index("notifications_type_idx").on(table.type),
  ],
);
