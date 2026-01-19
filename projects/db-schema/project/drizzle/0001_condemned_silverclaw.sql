ALTER TABLE "user_token" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_token" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "scope" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "token_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
DROP TYPE "public"."user_token_type";