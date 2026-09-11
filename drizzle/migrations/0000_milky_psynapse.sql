CREATE TYPE "public"."contribution_collection_mode_enum" AS ENUM('offline', 'platform', 'optional');--> statement-breakpoint
CREATE TYPE "public"."event_location_type_enum" AS ENUM('online', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."event_status_enum" AS ENUM('draft', 'published', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."rsvp_access_mode_enum" AS ENUM('open_rsvp', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."attendance_status_enum" AS ENUM('not_started', 'not_arrived', 'checked_in', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invite_token_state_enum" AS ENUM('pending', 'used', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status_enum" AS ENUM('yes', 'no', 'maybe');--> statement-breakpoint
CREATE TYPE "public"."notification_type_enum" AS ENUM('event_created', 'event_updated', 'guest_added', 'guests_imported', 'invitations_sent', 'reminders_sent', 'rsvp_received', 'rsvp_updated');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle_enum" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."event_payment_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."event_withdrawal_status_enum" AS ENUM('processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose_enum" AS ENUM('new_subscription', 'renewal', 'plan_change');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."plan_enum" AS ENUM('free', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'grace_period', 'canceled', 'expired', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."announcement_variant" AS ENUM('default', 'accent', 'destructive');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(255),
	"profile_image_url" text,
	"cover_image_url" text,
	"public_email" varchar(255),
	"phone_number" varchar(50),
	"whatsapp_phone_number" varchar(50),
	"whatsapp_consent_at" timestamp,
	"tagline" varchar(160),
	"bio" text,
	"website_url" varchar(255),
	"socials" jsonb,
	"location" jsonb,
	"preferred_currency" varchar(3),
	"timezone" varchar(100),
	"preferences" jsonb,
	"status" varchar(20) DEFAULT 'ok' NOT NULL,
	"suspended_at" timestamp,
	"suspended_reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "event_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"guest_capacity" integer,
	"rsvp_deadline" timestamp,
	"require_approval" boolean DEFAULT false NOT NULL,
	"contribution_collection_mode" "contribution_collection_mode_enum" DEFAULT 'offline' NOT NULL,
	"contribution_amount" integer,
	"contribution_payment_info" text,
	"currency" varchar(3) DEFAULT 'RWF' NOT NULL,
	"visibility" varchar(50) DEFAULT 'private' NOT NULL,
	"custom_questions" jsonb,
	"attendee_categories" jsonb,
	"rsvp_access_mode" "rsvp_access_mode_enum" DEFAULT 'open_rsvp' NOT NULL,
	"allow_additional_guests" boolean DEFAULT false NOT NULL,
	"max_additional_guests" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "event_settings_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(60),
	"date" timestamp NOT NULL,
	"end_date" timestamp,
	"location_type" "event_location_type_enum" DEFAULT 'online' NOT NULL,
	"location_name" varchar(255) DEFAULT 'Online' NOT NULL,
	"location_link" varchar(255),
	"image" text,
	"created_by" integer NOT NULL,
	"username" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"visibility" varchar(20) DEFAULT 'private' NOT NULL,
	"total_collected" integer DEFAULT 0 NOT NULL,
	"available_balance" integer DEFAULT 0 NOT NULL,
	"total_withdrawals" integer DEFAULT 0 NOT NULL,
	"status" "event_status_enum" DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"guest_id" integer NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"checked_in_by" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"rsvp_status" "rsvp_status_enum",
	"rsvp_note" text,
	"additional_guest_count" integer DEFAULT 0 NOT NULL,
	"responded_at" timestamp,
	"invitation_sent" boolean DEFAULT false NOT NULL,
	"invitation_sent_at" timestamp,
	"invitation_opened" boolean DEFAULT false NOT NULL,
	"invitation_opened_at" timestamp,
	"reminder_sent_at" timestamp,
	"vip" boolean DEFAULT false NOT NULL,
	"custom_question_responses" jsonb,
	"invite_token" varchar(48),
	"invite_token_state" "invite_token_state_enum" DEFAULT 'pending' NOT NULL,
	"invite_token_expires_at" timestamp,
	"invite_token_used_at" timestamp,
	"confirmation_token" varchar(48),
	"guest_token" varchar(48),
	"attendance_status" "attendance_status_enum" DEFAULT 'not_started' NOT NULL,
	"checked_in_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rsvp_additional_guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"guest_id" integer NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"category_id" varchar(64),
	"category_label" varchar(120),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type_enum" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"payload" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"guest_id" integer NOT NULL,
	"organizer_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'RWF' NOT NULL,
	"status" "event_payment_status_enum" DEFAULT 'pending' NOT NULL,
	"provider_name" varchar(50),
	"request_transaction_id" varchar(255),
	"provider_transaction_id" varchar(255),
	"provider_reference_no" varchar(255),
	"provider_status_code" varchar(50),
	"raw_provider_status" jsonb,
	"payer_phone" varchar(50),
	"payer_name" varchar(255),
	"paid_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"organizer_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'RWF' NOT NULL,
	"destination_phone" varchar(50) NOT NULL,
	"status" "event_withdrawal_status_enum" DEFAULT 'processing' NOT NULL,
	"provider_name" varchar(50),
	"request_transaction_id" varchar(255),
	"provider_reference_id" varchar(255),
	"provider_status_code" varchar(50),
	"raw_provider_status" jsonb,
	"reason" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subscription_id" integer,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'RWF' NOT NULL,
	"status" "payment_status_enum" DEFAULT 'pending' NOT NULL,
	"purpose" "payment_purpose_enum" NOT NULL,
	"plan" "plan_enum" NOT NULL,
	"billing_cycle" "billing_cycle_enum" NOT NULL,
	"provider_name" varchar(50),
	"request_transaction_id" varchar(255),
	"provider_transaction_id" varchar(255),
	"provider_reference_no" varchar(255),
	"provider_status_code" varchar(50),
	"raw_provider_status" jsonb,
	"payer_phone" varchar(50),
	"payer_name" varchar(255),
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan" "plan_enum" DEFAULT 'free' NOT NULL,
	"billing_cycle" "billing_cycle_enum" DEFAULT 'monthly' NOT NULL,
	"status" "subscription_status_enum" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"grace_period_ends_at" timestamp,
	"canceled_at" timestamp,
	"provider_name" varchar(50),
	"provider_customer_id" varchar(255),
	"provider_subscription_id" varchar(255),
	"source" varchar(50) DEFAULT 'admin' NOT NULL,
	"notes" text,
	"admin_assigned_by_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50),
	"target_id" varchar(255),
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_by" integer NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_password_resets_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"password_hash" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "announcement_status" DEFAULT 'draft' NOT NULL,
	"message" text NOT NULL,
	"link_text" varchar(100),
	"link_href" varchar(500),
	"variant" "announcement_variant" DEFAULT 'default' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "app_error_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"context" jsonb,
	"source" varchar(100),
	"user_id" integer,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signup_promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan" varchar(20) NOT NULL,
	"duration_months" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"stopped_at" timestamp,
	"started_by_email" varchar(255) NOT NULL,
	"stopped_by_email" varchar(255),
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_additional_guests" ADD CONSTRAINT "rsvp_additional_guests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_additional_guests" ADD CONSTRAINT "rsvp_additional_guests_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payments" ADD CONSTRAINT "event_payments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payments" ADD CONSTRAINT "event_payments_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payments" ADD CONSTRAINT "event_payments_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_withdrawals" ADD CONSTRAINT "event_withdrawals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_withdrawals" ADD CONSTRAINT "event_withdrawals_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_password_resets" ADD CONSTRAINT "admin_password_resets_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_error_log" ADD CONSTRAINT "app_error_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "events_visibility_idx" ON "events" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "events_username_slug_idx" ON "events" USING btree ("username","slug");--> statement-breakpoint
CREATE INDEX "attendees_event_id_idx" ON "attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "attendees_guest_id_idx" ON "attendees" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "attendees_checked_in_at_idx" ON "attendees" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "guests_event_id_idx" ON "guests" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "guests_email_event_idx" ON "guests" USING btree ("email","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_event_email_ci_idx" ON "guests" USING btree ("event_id",lower("email"));--> statement-breakpoint
CREATE INDEX "guests_rsvp_status_idx" ON "guests" USING btree ("rsvp_status");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_invite_token_idx" ON "guests" USING btree ("invite_token");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_confirmation_token_idx" ON "guests" USING btree ("confirmation_token");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_guest_token_idx" ON "guests" USING btree ("guest_token");--> statement-breakpoint
CREATE INDEX "guests_invite_token_state_idx" ON "guests" USING btree ("invite_token_state");--> statement-breakpoint
CREATE INDEX "guests_attendance_status_idx" ON "guests" USING btree ("attendance_status");--> statement-breakpoint
CREATE INDEX "guests_invitation_sent_idx" ON "guests" USING btree ("invitation_sent");--> statement-breakpoint
CREATE INDEX "guests_invitation_sent_at_idx" ON "guests" USING btree ("invitation_sent_at");--> statement-breakpoint
CREATE INDEX "guests_reminder_sent_at_idx" ON "guests" USING btree ("reminder_sent_at");--> statement-breakpoint
CREATE INDEX "guests_responded_at_idx" ON "guests" USING btree ("responded_at");--> statement-breakpoint
CREATE INDEX "rsvp_additional_guests_guest_id_idx" ON "rsvp_additional_guests" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "notifications_user_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_at_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "event_payments_event_id_idx" ON "event_payments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_payments_guest_id_idx" ON "event_payments" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "event_payments_organizer_id_idx" ON "event_payments" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "event_payments_status_idx" ON "event_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_payments_provider_transaction_id_idx" ON "event_payments" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_payments_request_transaction_id_idx" ON "event_payments" USING btree ("request_transaction_id");--> statement-breakpoint
CREATE INDEX "event_withdrawals_event_id_idx" ON "event_withdrawals" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_withdrawals_organizer_id_idx" ON "event_withdrawals" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "event_withdrawals_status_idx" ON "event_withdrawals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_withdrawals_request_transaction_id_idx" ON "event_withdrawals" USING btree ("request_transaction_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_subscription_id_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_plan_idx" ON "payments" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "payments_provider_transaction_id_idx" ON "payments" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE INDEX "payments_provider_reference_no_idx" ON "payments" USING btree ("provider_reference_no");--> statement-breakpoint
CREATE INDEX "payments_provider_status_code_idx" ON "payments" USING btree ("provider_status_code");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_request_transaction_id_idx" ON "payments" USING btree ("request_transaction_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_period_end_idx" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "subscriptions_grace_period_ends_idx" ON "subscriptions" USING btree ("grace_period_ends_at");--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_log_admin_email_idx" ON "admin_audit_log" USING btree ("admin_email");--> statement-breakpoint
CREATE INDEX "admin_invites_email_idx" ON "admin_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_invites_status_idx" ON "admin_invites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_password_resets_admin_id_idx" ON "admin_password_resets" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "app_error_log_created_at_idx" ON "app_error_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "app_error_log_level_idx" ON "app_error_log" USING btree ("level");--> statement-breakpoint
CREATE INDEX "app_error_log_resolved_idx" ON "app_error_log" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "app_error_log_source_idx" ON "app_error_log" USING btree ("source");--> statement-breakpoint
CREATE INDEX "signup_promotions_is_active_idx" ON "signup_promotions" USING btree ("is_active");