CREATE TABLE "ai_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"purpose" text NOT NULL,
	"request_summary" text,
	"response_summary" text,
	"ok" boolean NOT NULL,
	"error" text,
	"grounding_urls" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule" text NOT NULL,
	"position_id" integer,
	"symbol" text,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"message" text NOT NULL,
	"deep_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"send_status" text DEFAULT 'pending' NOT NULL,
	"send_error" text
);
--> statement-breakpoint
CREATE TABLE "deviations" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer,
	"rule_broken" text NOT NULL,
	"rule_said" text NOT NULL,
	"action_taken" text NOT NULL,
	"reason" text,
	"outcome_usd" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"symbol" text PRIMARY KEY NOT NULL,
	"shares" double precision NOT NULL,
	"avg_price" double precision,
	"asset_class" text DEFAULT 'non_reit' NOT NULL,
	"tax_free_shares" double precision DEFAULT 0 NOT NULL,
	"taxed_shares" double precision DEFAULT 0 NOT NULL,
	"annual_dividend" double precision DEFAULT 0 NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hypothesis_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"verdict" text NOT NULL,
	"narrative" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"strike" double precision NOT NULL,
	"expiry" date NOT NULL,
	"lots" integer NOT NULL,
	"credit_per_contract" double precision NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"outcome" text,
	"realised_pnl" double precision,
	"entry_spot" double precision,
	"entry_delta" double precision,
	"entry_iv" double precision,
	"base_rate_at_entry" double precision,
	"is_deviation" boolean DEFAULT false NOT NULL,
	"screenshot_url" text,
	"sleeve" text DEFAULT 'weekly' NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"date" date NOT NULL,
	"close" double precision NOT NULL,
	"source_url" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"stale" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickers" (
	"symbol" text PRIMARY KEY NOT NULL,
	"group" text DEFAULT 'holding' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"blocked_reason" text,
	"call_lot" integer,
	"put_lot" integer,
	"seed_iv" double precision,
	"strike_increment" double precision,
	"allows_calls" boolean DEFAULT true NOT NULL,
	"allows_puts" boolean DEFAULT true NOT NULL,
	"chain_liquidity" text DEFAULT 'none' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_id" integer NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"strike" double precision NOT NULL,
	"expiry" date NOT NULL,
	"lots" integer NOT NULL,
	"modelled_credit" double precision NOT NULL,
	"modelled_delta" double precision NOT NULL,
	"base_rate" double precision,
	"base_rate_windows" integer,
	"disagreement_flag" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"decline_reason" text,
	"approved_at" timestamp with time zone,
	"position_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sessions_since_approval" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valuations" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	"v1_range_position" double precision,
	"v2_analyst_upside" double precision,
	"v3_pe_vs_median" double precision,
	"v4_yield_vs_median" double precision,
	"v5_thesis" double precision,
	"v5_rationale" text,
	"inputs_populated" integer NOT NULL,
	"composite" double precision,
	"band" text,
	"gate" text NOT NULL,
	"provisional" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vol_estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"realized_21d" double precision,
	"calibrated_iv" double precision,
	"calibration_fills" integer DEFAULT 0 NOT NULL,
	"blended" double precision NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_number" integer NOT NULL,
	"friday_date" date NOT NULL,
	"completed_at" timestamp with time zone,
	"tickets_written" integer,
	"credit" double precision,
	"missed" boolean DEFAULT false NOT NULL,
	"progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deviations" ADD CONSTRAINT "deviations_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "positions_symbol" ON "positions" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "positions_open" ON "positions" USING btree ("closed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prices_symbol_date" ON "prices" USING btree ("symbol","date");--> statement-breakpoint
CREATE INDEX "prices_symbol" ON "prices" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "tickets_week" ON "tickets" USING btree ("week_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weeks_number" ON "weeks" USING btree ("week_number");