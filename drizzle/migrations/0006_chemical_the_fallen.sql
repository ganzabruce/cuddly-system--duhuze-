ALTER TABLE "guests" ALTER COLUMN "invite_token_state" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guests" ALTER COLUMN "invite_token_state" DROP NOT NULL;