ALTER TABLE "signup_promotions" RENAME TO "promotions";--> statement-breakpoint
DROP INDEX "signup_promotions_is_active_idx";--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "slug" varchar(100);--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "ends_at" timestamp;--> statement-breakpoint
UPDATE "promotions" SET slug = 'legacy-' || id::text, ends_at = started_at + (duration_months * interval '1 month') WHERE slug IS NULL;--> statement-breakpoint
ALTER TABLE "promotions" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ALTER COLUMN "ends_at" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_slug_idx" ON "promotions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "promotions_is_active_idx" ON "promotions" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "promotions" DROP COLUMN "duration_months";