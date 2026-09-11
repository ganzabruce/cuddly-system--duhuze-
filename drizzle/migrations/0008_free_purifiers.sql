CREATE TYPE "public"."image_format_enum" AS ENUM('square', 'portrait', 'landscape');--> statement-breakpoint
ALTER TABLE "event_settings" ALTER COLUMN "whatsapp_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "image_format" "image_format_enum" DEFAULT 'square' NOT NULL;