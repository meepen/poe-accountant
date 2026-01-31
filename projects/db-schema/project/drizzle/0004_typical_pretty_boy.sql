CREATE TABLE "currency_exchange_league_snapshot_data" (
	"history_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"valued_at" numeric(30, 10) NOT NULL,
	"stable_currency" text NOT NULL,
	"direct_market_rate" numeric(30, 10),
	"confidence_score" double precision NOT NULL,
	"liquidity" bigint NOT NULL,
	"data_staleness" timestamp with time zone NOT NULL,
	"calculation_path" jsonb NOT NULL,
	CONSTRAINT "currency_exchange_league_snapshot_data_history_id_currency_pk" PRIMARY KEY("history_id","currency")
);
--> statement-breakpoint
ALTER TABLE "currency_exchange_league_snapshot_data" ADD CONSTRAINT "currency_exchange_league_snapshot_data_history_id_currency_exchange_history_id_fk" FOREIGN KEY ("history_id") REFERENCES "public"."currency_exchange_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_league_snapshot_data_history_id" ON "currency_exchange_league_snapshot_data" USING btree ("history_id");--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_league_snapshot_data_currency" ON "currency_exchange_league_snapshot_data" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_league_currency_from_currency" ON "currency_exchange_league_currency" USING btree ("from_currency");--> statement-breakpoint
CREATE INDEX "idx_currency_exchange_league_currency_to_currency" ON "currency_exchange_league_currency" USING btree ("to_currency");--> statement-breakpoint
ALTER TABLE "currency_exchange_league_currency" ADD CONSTRAINT "currency_exchange_league_currency_history_id_from_currency_to_currency_unique" UNIQUE("history_id","from_currency","to_currency");