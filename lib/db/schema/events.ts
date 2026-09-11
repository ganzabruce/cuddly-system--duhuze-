import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  boolean,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const eventStatusEnum = pgEnum("event_status_enum", [
  "draft",
  "published",
  "completed",
  "cancelled",
]);

export const eventLocationTypeEnum = pgEnum("event_location_type_enum", [
  "online",
  "in_person",
]);

export const imageFormatEnum = pgEnum("image_format_enum", [
  "square",
  "portrait",
  "tall",
  "landscape",
]);

export const contributionCollectionModeEnum = pgEnum(
  "contribution_collection_mode_enum",
  ["offline", "platform", "optional"],
);

export const rsvpAccessModeEnum = pgEnum("rsvp_access_mode_enum", [
  "open_rsvp",
  "invite_only",
]);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 60 }),
    date: timestamp("date").notNull(),
    endDate: timestamp("end_date"),
    locationType: eventLocationTypeEnum("location_type")
      .default("online")
      .notNull(),
    locationName: varchar("location_name", { length: 255 })
      .default("Online")
      .notNull(),
    locationLink: varchar("location_link", { length: 255 }),
    image: text("image"),
    imageFormat: imageFormatEnum("image_format").default("square").notNull(),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    username: varchar("username", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    visibility: varchar("visibility", { length: 20 })
      .default("private")
      .notNull(),
    totalCollected: integer("total_collected").default(0).notNull(),
    availableBalance: integer("available_balance").default(0).notNull(),
    totalWithdrawals: integer("total_withdrawals").default(0).notNull(),
    status: eventStatusEnum("status").default("published").notNull(),
    timezone: varchar("timezone", { length: 100 }).default("Africa/Kigali").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("events_created_by_idx").on(table.createdBy),
    index("events_date_idx").on(table.date),
    index("events_visibility_idx").on(table.visibility),
    index("events_status_idx").on(table.status),
    uniqueIndex("events_username_slug_idx").on(table.username, table.slug),
  ],
);

export const eventSettings = pgTable("event_settings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" })
    .unique(),
  guestCapacity: integer("guest_capacity"),
  rsvpDeadline: timestamp("rsvp_deadline"),
  requireApproval: boolean("require_approval").default(false).notNull(),
  contributionCollectionMode: contributionCollectionModeEnum(
    "contribution_collection_mode",
  )
    .default("offline")
    .notNull(),
  contributionAmount: integer("contribution_amount"),
  contributionPaymentInfo: text("contribution_payment_info"),
  currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
  visibility: varchar("visibility", { length: 50 })
    .default("private")
    .notNull(),
  customQuestions: jsonb("custom_questions"),
  attendeeCategories: jsonb("attendee_categories"),
  rsvpAccessMode: rsvpAccessModeEnum("rsvp_access_mode")
    .default("open_rsvp")
    .notNull(),
  allowAdditionalGuests: boolean("allow_additional_guests")
    .default(false)
    .notNull(),
  maxAdditionalGuests: integer("max_additional_guests"),
  whatsappEnabled: boolean("whatsapp_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
