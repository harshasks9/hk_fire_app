CREATE TABLE "notebooks" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	CONSTRAINT "notebooks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notebook_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'owner' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "contexts" ADD COLUMN "notebook_id" text DEFAULT 'nb_default' NOT NULL;
--> statement-breakpoint
ALTER TABLE "contexts" DROP CONSTRAINT IF EXISTS "contexts_slug_unique";
--> statement-breakpoint
ALTER TABLE "ai_calls" ADD COLUMN "notebook_id" text;
--> statement-breakpoint
-- Backfill: an existing single-owner installation becomes the "Primary" notebook, its user its owner and the platform admin.
INSERT INTO "notebooks" ("id", "slug", "name", "owner_user_id")
SELECT 'nb_default', 'primary', 'Primary', (SELECT "id" FROM "users" ORDER BY "created_at" LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "users") AND NOT EXISTS (SELECT 1 FROM "notebooks" WHERE "id" = 'nb_default');
--> statement-breakpoint
UPDATE "users" SET "notebook_id" = 'nb_default' WHERE "notebook_id" IS NULL;
--> statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE "id" = (SELECT "id" FROM "users" ORDER BY "created_at" LIMIT 1);
--> statement-breakpoint
UPDATE "contexts" SET "notebook_id" = 'nb_default' WHERE "notebook_id" IS NULL OR "notebook_id" = '';
--> statement-breakpoint
CREATE UNIQUE INDEX "contexts_notebook_slug_idx" ON "contexts" USING btree ("notebook_id","slug");
--> statement-breakpoint
CREATE INDEX "users_notebook_idx" ON "users" USING btree ("notebook_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"notebook_id" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'member' NOT NULL,
	"token_hash" text NOT NULL,
	"created_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "invites_notebook_idx" ON "invites" USING btree ("notebook_id");
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"notebook_id" text NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"token_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "api_tokens_notebook_idx" ON "api_tokens" USING btree ("notebook_id");
--> statement-breakpoint
CREATE TABLE "note_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content_json" jsonb NOT NULL,
	"content_text" text DEFAULT '' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"reason" text DEFAULT 'save' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "note_versions_note_idx" ON "note_versions" USING btree ("note_id","created_at");
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"notebook_id" text NOT NULL,
	"note_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"token" text NOT NULL,
	"created_by" text,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"views" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "share_links_note_idx" ON "share_links" USING btree ("note_id");
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"notebook_id" text,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"kind" text DEFAULT 'note' NOT NULL,
	"content_json" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "templates_notebook_idx" ON "templates" USING btree ("notebook_id");
--> statement-breakpoint
CREATE TABLE "admin_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_name" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"target_name" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_events_created_idx" ON "admin_events" USING btree ("created_at");
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"week_start" text NOT NULL,
	"narrative" text,
	"provider" text,
	"facts" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_reviews_ctx_week_idx" ON "weekly_reviews" USING btree ("context_id","week_start");
