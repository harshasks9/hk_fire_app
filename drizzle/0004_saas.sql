ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "plan_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "stripe_subscription_id" text;
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "auth_tokens_user_idx" ON "auth_tokens" USING btree ("user_id");
--> statement-breakpoint
-- Accounts that exist before self-service registration were created by the administrator: treat them as verified.
UPDATE "users" SET "email_verified_at" = now() WHERE "email_verified_at" IS NULL;
--> statement-breakpoint
-- The Primary notebook (the platform owner's) is on the top plan.
UPDATE "notebooks" SET "plan" = 'team' WHERE "id" = 'nb_default';
