ALTER TABLE "meetings" ADD COLUMN "ingest_status" text;
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "ingest_error" text;
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "ingest_stage_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "recording_attachment_id" text;
--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "duration_seconds" double precision;
--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "speaker_map" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "attachment_id" text;
--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "duration_seconds" double precision;
