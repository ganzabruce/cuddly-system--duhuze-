ALTER TABLE "admin_invites" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_password_resets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin_invites" CASCADE;--> statement-breakpoint
DROP TABLE "admin_password_resets" CASCADE;--> statement-breakpoint
DROP TABLE "admin_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_unique" UNIQUE("user_id");