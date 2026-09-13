CREATE TABLE IF NOT EXISTS "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"state" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"v" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"by" text DEFAULT '' NOT NULL,
	"by_id" text,
	"action" jsonb NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"touches" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"v" integer NOT NULL,
	"state" jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "revisions_project_v" ON "revisions" ("project_id","v");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revisions_project_at" ON "revisions" ("project_id","at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "checkpoints_project_v" ON "checkpoints" ("project_id","v");
