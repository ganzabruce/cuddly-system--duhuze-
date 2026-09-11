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
import { sql } from "drizzle-orm";
import { events } from "./events";
import { users } from "./users";

export const rsvpStatusEnum = pgEnum("rsvp_status_enum", [
  "yes",
  "no",
  "maybe",
]);

export const attendanceStatusEnum = pgEnum("attendance_status_enum", [
  "not_started",
  "not_arrived",
  "checked_in",
  "cancelled",
]);

export const inviteTokenStateEnum = pgEnum("invite_token_state_enum", [
  "pending",
  "used",
  "expired",
  "revoked",
]);

export const guests = pgTable(
  "guests",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 50 }),
    rsvpStatus: rsvpStatusEnum("rsvp_status"),
    rsvpNote: text("rsvp_note"),
    additionalGuestCount: integer("additional_guest_count")
      .default(0)
      .notNull(),
    respondedAt: timestamp("responded_at"),
    invitationSent: boolean("invitation_sent").default(false).notNull(),
    invitationSentAt: timestamp("invitation_sent_at"),
    invitationOpened: boolean("invitation_opened").default(false).notNull(),
    invitationOpenedAt: timestamp("invitation_opened_at"),
    reminderSentAt: timestamp("reminder_sent_at"),
    whatsappInvitationSent: boolean("whatsapp_invitation_sent")
      .default(false)
      .notNull(),
    whatsappInvitationSentAt: timestamp("whatsapp_invitation_sent_at"),

    customQuestionResponses: jsonb("custom_question_responses"),
    inviteToken: varchar("invite_token", { length: 48 }),
    inviteTokenState: inviteTokenStateEnum("invite_token_state"),
    inviteTokenExpiresAt: timestamp("invite_token_expires_at"),
    inviteTokenUsedAt: timestamp("invite_token_used_at"),
    confirmationToken: varchar("confirmation_token", { length: 48 }),
    guestToken: varchar("guest_token", { length: 48 }),
    attendanceStatus: attendanceStatusEnum("attendance_status")
      .default("not_started")
      .notNull(),
    checkedInAt: timestamp("checked_in_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("guests_event_id_idx").on(table.eventId),
    index("guests_email_event_idx").on(table.email, table.eventId),
    uniqueIndex("guests_event_email_ci_idx")
      .on(table.eventId, sql`lower(${table.email})`)
      .where(sql`${table.email} IS NOT NULL`),
    uniqueIndex("guests_event_phone_idx")
      .on(table.eventId, table.phoneNumber)
      .where(sql`${table.phoneNumber} IS NOT NULL AND ${table.email} IS NULL`),
    index("guests_rsvp_status_idx").on(table.rsvpStatus),
    uniqueIndex("guests_invite_token_idx").on(table.inviteToken),
    uniqueIndex("guests_confirmation_token_idx").on(table.confirmationToken),
    uniqueIndex("guests_guest_token_idx").on(table.guestToken),
    index("guests_invite_token_state_idx").on(table.inviteTokenState),
    index("guests_attendance_status_idx").on(table.attendanceStatus),
    index("guests_invitation_sent_idx").on(table.invitationSent),
    index("guests_invitation_sent_at_idx").on(table.invitationSentAt),
    index("guests_reminder_sent_at_idx").on(table.reminderSentAt),
    index("guests_responded_at_idx").on(table.respondedAt),
  ],
);

export const rsvpAdditionalGuests = pgTable(
  "rsvp_additional_guests",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    categoryId: varchar("category_id", { length: 64 }),
    categoryLabel: varchar("category_label", { length: 120 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("rsvp_additional_guests_guest_id_idx").on(table.guestId),
  ],
);

export const attendees = pgTable(
  "attendees",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
    checkedInBy: integer("checked_in_by").references(() => users.id),
    notes: text("notes"),
  },
  (table) => [
    index("attendees_event_id_idx").on(table.eventId),
    index("attendees_guest_id_idx").on(table.guestId),
    index("attendees_checked_in_at_idx").on(table.checkedInAt),
  ],
);
