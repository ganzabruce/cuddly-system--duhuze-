DROP INDEX "guests_event_email_ci_idx";--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "guests_event_phone_idx" ON "guests" USING btree ("event_id","phone_number") WHERE "guests"."phone_number" IS NOT NULL AND "guests"."email" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "guests_event_email_ci_idx" ON "guests" USING btree ("event_id",lower("email")) WHERE "guests"."email" IS NOT NULL;