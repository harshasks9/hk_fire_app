ALTER TABLE "notes" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "manual_tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
CREATE INDEX "notes_tags_idx" ON "notes" USING gin ("tags");
--> statement-breakpoint
CREATE INDEX "notes_manual_tags_idx" ON "notes" USING gin ("manual_tags");
