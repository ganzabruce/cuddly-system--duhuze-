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
import { events } from "./events";
import { guests } from "./guests";

export const planEnum = pgEnum("plan_enum", ["free", "standard", "premium"]);

export const billingCycleEnum = pgEnum("billing_cycle_enum", [
  "monthly",
  "yearly",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status_enum", [
  "active",
  "grace_period",
  "canceled",
  "expired",
  "past_due",
]);

export const paymentStatusEnum = pgEnum("payment_status_enum", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const paymentPurposeEnum = pgEnum("payment_purpose_enum", [
  "new_subscription",
  "renewal",
  "plan_change",
  "promo_activation",
  "test",
]);

export const eventPaymentStatusEnum = pgEnum("event_payment_status_enum", [
  "pending",
  "succeeded",
  "failed",
  "expired",
]);

export const eventWithdrawalStatusEnum = pgEnum(
  "event_withdrawal_status_enum",
  ["processing", "succeeded", "failed"],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: planEnum("plan").default("free").notNull(),
    billingCycle: billingCycleEnum("billing_cycle").default("monthly").notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    gracePeriodEndsAt: timestamp("grace_period_ends_at"),
    canceledAt: timestamp("canceled_at"),
    providerName: varchar("provider_name", { length: 50 }),
    providerCustomerId: varchar("provider_customer_id", { length: 255 }),
    providerSubscriptionId: varchar("provider_subscription_id", {
      length: 255,
    }),
    source: varchar("source", { length: 50 }).default("admin").notNull(),
    notes: text("notes"),
    adminAssignedByEmail: varchar("admin_assigned_by_email", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_status_idx").on(table.status),
    index("subscriptions_period_end_idx").on(table.currentPeriodEnd),
    index("subscriptions_grace_period_ends_idx").on(table.gracePeriodEndsAt),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: integer("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    purpose: paymentPurposeEnum("purpose").notNull(),
    plan: planEnum("plan").notNull(),
    billingCycle: billingCycleEnum("billing_cycle").notNull(),
    providerName: varchar("provider_name", { length: 50 }),
    requestTransactionId: varchar("request_transaction_id", { length: 255 }),
    providerTransactionId: varchar("provider_transaction_id", { length: 255 }),
    providerReferenceNo: varchar("provider_reference_no", { length: 255 }),
    providerStatusCode: varchar("provider_status_code", { length: 50 }),
    rawProviderStatus: jsonb("raw_provider_status"),
    payerPhone: varchar("payer_phone", { length: 50 }),
    payerName: varchar("payer_name", { length: 255 }),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_user_id_idx").on(table.userId),
    index("payments_subscription_id_idx").on(table.subscriptionId),
    index("payments_status_idx").on(table.status),
    index("payments_plan_idx").on(table.plan),
    index("payments_provider_transaction_id_idx").on(
      table.providerTransactionId,
    ),
    index("payments_provider_reference_no_idx").on(table.providerReferenceNo),
    index("payments_provider_status_code_idx").on(table.providerStatusCode),
    uniqueIndex("payments_request_transaction_id_idx").on(
      table.requestTransactionId,
    ),
  ],
);

export const eventPayments = pgTable(
  "event_payments",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    organizerId: integer("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
    status: eventPaymentStatusEnum("status").default("pending").notNull(),
    providerName: varchar("provider_name", { length: 50 }),
    requestTransactionId: varchar("request_transaction_id", { length: 255 }),
    providerTransactionId: varchar("provider_transaction_id", { length: 255 }),
    providerReferenceNo: varchar("provider_reference_no", { length: 255 }),
    providerStatusCode: varchar("provider_status_code", { length: 50 }),
    rawProviderStatus: jsonb("raw_provider_status"),
    rsvpContext: jsonb("rsvp_context"),
    payerPhone: varchar("payer_phone", { length: 50 }),
    payerName: varchar("payer_name", { length: 255 }),
    paidAt: timestamp("paid_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("event_payments_event_id_idx").on(table.eventId),
    index("event_payments_guest_id_idx").on(table.guestId),
    index("event_payments_organizer_id_idx").on(table.organizerId),
    index("event_payments_status_idx").on(table.status),
    index("event_payments_provider_transaction_id_idx").on(
      table.providerTransactionId,
    ),
    uniqueIndex("event_payments_request_transaction_id_idx").on(
      table.requestTransactionId,
    ),
  ],
);

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    plan: varchar("plan", { length: 20 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endsAt: timestamp("ends_at").notNull(),
    stoppedAt: timestamp("stopped_at"),
    startedByEmail: varchar("started_by_email", { length: 255 }).notNull(),
    stoppedByEmail: varchar("stopped_by_email", { length: 255 }),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("promotions_slug_idx").on(t.slug),
    index("promotions_is_active_idx").on(t.isActive),
  ],
);

export const eventWithdrawals = pgTable(
  "event_withdrawals",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    organizerId: integer("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
    destinationPhone: varchar("destination_phone", { length: 50 }).notNull(),
    status: eventWithdrawalStatusEnum("status").default("processing").notNull(),
    providerName: varchar("provider_name", { length: 50 }),
    requestTransactionId: varchar("request_transaction_id", { length: 255 }),
    providerReferenceId: varchar("provider_reference_id", { length: 255 }),
    providerStatusCode: varchar("provider_status_code", { length: 50 }),
    rawProviderStatus: jsonb("raw_provider_status"),
    reason: text("reason"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("event_withdrawals_event_id_idx").on(table.eventId),
    index("event_withdrawals_organizer_id_idx").on(table.organizerId),
    index("event_withdrawals_status_idx").on(table.status),
    uniqueIndex("event_withdrawals_request_transaction_id_idx").on(
      table.requestTransactionId,
    ),
  ],
);
