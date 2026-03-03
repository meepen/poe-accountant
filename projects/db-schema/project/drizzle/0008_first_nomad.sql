ALTER TABLE "user_leagues" DROP CONSTRAINT "user_leagues_user_id_league_id_pk";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'user_leagues'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "user_leagues" DROP CONSTRAINT "user_leagues_pkey";--> statement-breakpoint
ALTER TABLE "user_leagues" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "league" ADD COLUMN "rules" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "user_leagues" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_leagues" ADD CONSTRAINT "unq_user_leagues_user_id_league_id" UNIQUE("user_id","league_id");
