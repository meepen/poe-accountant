CREATE TABLE "user_inventory_snapshot" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"realm" text NOT NULL,
	"league_id" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"r2_object_key" text NOT NULL,
	"total_value" numeric(30, 10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_inventory_snapshot_r2_object_key_unique" UNIQUE("r2_object_key")
);
--> statement-breakpoint
CREATE TABLE "user_leagues" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"league_id" uuid,
	CONSTRAINT "user_leagues_user_id_league_id_pk" UNIQUE("user_id","league_id")
);
--> statement-breakpoint
DROP TABLE "user_jobs" CASCADE;--> statement-breakpoint
ALTER TABLE "user_inventory_snapshot" ADD CONSTRAINT "user_inventory_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory_snapshot" ADD CONSTRAINT "user_inventory_snapshot_league_fk" FOREIGN KEY ("realm","league_id") REFERENCES "public"."league"("realm","league_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_leagues" ADD CONSTRAINT "user_leagues_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_leagues" ADD CONSTRAINT "user_leagues_league_id_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_inventory_snapshot_user_generated_at" ON "user_inventory_snapshot" USING btree ("user_id","generated_at");--> statement-breakpoint
CREATE INDEX "idx_user_inventory_snapshot_league" ON "user_inventory_snapshot" USING btree ("realm","league_id");
