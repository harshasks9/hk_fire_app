CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "ai_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"purpose" text NOT NULL,
	"input_chars" integer DEFAULT 0 NOT NULL,
	"output_chars" integer DEFAULT 0 NOT NULL,
	"ok" boolean DEFAULT true NOT NULL,
	"error" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"name" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"data" text,
	"storage_url" text,
	"duration_seconds" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changes" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"entity_id" text,
	"label" text NOT NULL,
	"old_value" text NOT NULL,
	"new_value" text NOT NULL,
	"description" text NOT NULL,
	"source_note_id" text,
	"previous_note_id" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"text" text NOT NULL,
	"kind" text NOT NULL,
	"by_whom" text DEFAULT 'Me' NOT NULL,
	"counterparty_entity_id" text,
	"company_entity_id" text,
	"source_note_id" text,
	"source_excerpt" text,
	"due_hint" text,
	"due_at" timestamp with time zone,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contexts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"description" text,
	"ai_scope" text DEFAULT 'isolated' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contexts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "decision_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"decision_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"statement" text NOT NULL,
	"kind" text NOT NULL,
	"source_note_id" text,
	"source_excerpt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL,
	"context" text,
	"reasoning" text,
	"alternatives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"topic_entity_id" text,
	"company_entity_id" text,
	"source_note_id" text,
	"source_excerpt" text,
	"ai_generated" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"text" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"provider" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" text,
	"summary_updated_at" timestamp with time zone,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp with time zone,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relations" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"from_type" text NOT NULL,
	"from_id" text NOT NULL,
	"to_type" text NOT NULL,
	"to_id" text NOT NULL,
	"relation" text NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"source_note_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facts" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"numeric_value" double precision,
	"unit" text,
	"source_note_id" text,
	"source_excerpt" text,
	"observed_at" timestamp with time zone NOT NULL,
	"superseded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"entity_id" text,
	"score" double precision DEFAULT 0.5 NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"location" text,
	"note_id" text,
	"company_entity_id" text,
	"summary" jsonb,
	"follow_up_email" text,
	"executive_readout" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"excerpt" text,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'note' NOT NULL,
	"status" text DEFAULT 'processed' NOT NULL,
	"privacy" text DEFAULT 'normal' NOT NULL,
	"content_json" jsonb,
	"content_text" text DEFAULT '' NOT NULL,
	"summary" jsonb,
	"meeting_id" text,
	"research_project_id" text,
	"favorite" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'editor' NOT NULL,
	"source_url" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"ai_processed_at" timestamp with time zone,
	"processing_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"question" text,
	"synthesis" text,
	"synthesis_updated_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text,
	"url" text,
	"domain" text,
	"extracted_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"title" text NOT NULL,
	"owner" text DEFAULT 'Me' NOT NULL,
	"owner_entity_id" text,
	"entity_id" text,
	"source_note_id" text,
	"source_excerpt" text,
	"due_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"ai_generated" boolean DEFAULT true NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" text PRIMARY KEY NOT NULL,
	"context_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"note_id" text,
	"meeting_id" text,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"segments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'en',
	"source" text DEFAULT 'live' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "attachments_note" ON "attachments" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "changes_context" ON "changes" USING btree ("context_id","detected_at");--> statement-breakpoint
CREATE INDEX "commitments_context_status" ON "commitments" USING btree ("context_id","status");--> statement-breakpoint
CREATE INDEX "decision_revisions_decision" ON "decision_revisions" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "decisions_context" ON "decisions" USING btree ("context_id","decided_at");--> statement-breakpoint
CREATE INDEX "embeddings_owner" ON "embeddings" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "embeddings_context" ON "embeddings" USING btree ("context_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entities_ctx_type_slug" ON "entities" USING btree ("context_id","type","slug");--> statement-breakpoint
CREATE INDEX "entities_type" ON "entities" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "relations_unique" ON "entity_relations" USING btree ("from_type","from_id","to_type","to_id","relation");--> statement-breakpoint
CREATE INDEX "relations_from" ON "entity_relations" USING btree ("from_id");--> statement-breakpoint
CREATE INDEX "relations_to" ON "entity_relations" USING btree ("to_id");--> statement-breakpoint
CREATE INDEX "facts_entity" ON "facts" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "facts_label" ON "facts" USING btree ("entity_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "insights_dedupe" ON "insights" USING btree ("context_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "meetings_context_start" ON "meetings" USING btree ("context_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "note_entities_pair" ON "note_entities" USING btree ("note_id","entity_id");--> statement-breakpoint
CREATE INDEX "note_entities_entity" ON "note_entities" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "notes_context" ON "notes" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX "notes_updated" ON "notes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "notes_meeting" ON "notes" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "sources_note" ON "sources" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "tasks_context_status" ON "tasks" USING btree ("context_id","status");--> statement-breakpoint
CREATE INDEX "tasks_source" ON "tasks" USING btree ("source_note_id");--> statement-breakpoint
CREATE INDEX "timeline_entity_time" ON "timeline_events" USING btree ("entity_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "timeline_dedupe" ON "timeline_events" USING btree ("entity_id","kind","ref_id");