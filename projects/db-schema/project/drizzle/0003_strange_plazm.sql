CREATE TABLE "currency_exchange_league_currency" (
	"id" uuid PRIMARY KEY NOT NULL,
	"history_id" uuid NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"from_volume" bigint NOT NULL,
	"to_volume" bigint NOT NULL,
	"lowest_ratio" double precision NOT NULL,
	"highest_ratio" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_exchange_history" (
	"id" uuid NOT NULL,
	"realm" text NOT NULL,
	"league_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"next_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currency_exchange_history_realm_league_id_timestamp_pk" PRIMARY KEY("realm","league_id","timestamp"),
	CONSTRAINT "currency_exchange_history_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "league" (
	"id" uuid NOT NULL,
	"league_id" text NOT NULL,
	"league_name" text,
	"realm" text NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	CONSTRAINT "league_realm_league_id_pk" PRIMARY KEY("realm","league_id"),
	CONSTRAINT "league_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "currency_exchange_league_currency" ADD CONSTRAINT "currency_exchange_league_currency_history_id_currency_exchange_history_id_fk" FOREIGN KEY ("history_id") REFERENCES "public"."currency_exchange_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_league_currency_history_id" ON "currency_exchange_league_currency" USING btree ("history_id");--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_history_timestamp" ON "currency_exchange_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_history_league" ON "currency_exchange_history" USING btree ("league_id");