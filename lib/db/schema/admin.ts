import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";


import { users } from "./users";

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: serial("id").primaryKey(),
    adminEmail: varchar("admin_email", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    targetType: varchar("target_type", { length: 50 }),
    targetId: varchar("target_id", { length: 255 }),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("admin_audit_log_created_at_idx").on(table.createdAt),
    index("admin_audit_log_admin_email_idx").on(table.adminEmail),
  ],
);

export const appErrorLog = pgTable(
  "app_error_log",
  {
    id: serial("id").primaryKey(),
    level: varchar("level", { length: 10 }).notNull(),
    message: text("message").notNull(),
    stack: text("stack"),
    context: jsonb("context"),
    source: varchar("source", { length: 100 }),
    userId: integer("user_id").references(() => users.id),
    resolved: boolean("resolved").default(false).notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: varchar("resolved_by", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("app_error_log_created_at_idx").on(table.createdAt),
    index("app_error_log_level_idx").on(table.level),
    index("app_error_log_resolved_idx").on(table.resolved),
    index("app_error_log_source_idx").on(table.source),
  ],
);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcementStatusEnum = pgEnum("announcement_status", [
  "draft",
  "active",
  "archived",
]);

export const announcementVariantEnum = pgEnum("announcement_variant", [
  "default",
  "accent",
  "destructive",
]);

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    status: announcementStatusEnum("status").notNull().default("draft"),
    message: text("message").notNull(),
    linkText: varchar("link_text", { length: 100 }),
    linkHref: varchar("link_href", { length: 500 }),
    variant: announcementVariantEnum("variant").notNull().default("default"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    activatedAt: timestamp("activated_at"),
  },
  (t) => [index("announcements_status_idx").on(t.status)],
);

