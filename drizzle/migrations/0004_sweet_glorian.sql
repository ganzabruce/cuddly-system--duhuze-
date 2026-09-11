ALTER TABLE "event_settings" ADD COLUMN "whatsapp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "phone_number" varchar(50);--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "whatsapp_invitation_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "whatsapp_invitation_sent_at" timestamp;