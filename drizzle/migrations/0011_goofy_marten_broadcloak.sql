ALTER TABLE "announcements" ADD COLUMN "message_fr" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "link_text_fr" varchar(100);--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "vip";