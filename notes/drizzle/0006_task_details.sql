-- Tasks carry rich details (editor JSON + text projection); attachments and share links can belong to a task.
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "details" jsonb;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "details_text" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "attachments" ALTER COLUMN "note_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN IF NOT EXISTS "task_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_task" ON "attachments" ("task_id");
--> statement-breakpoint
ALTER TABLE "share_links" ALTER COLUMN "note_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "task_id" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_links_task_idx" ON "share_links" ("task_id");
