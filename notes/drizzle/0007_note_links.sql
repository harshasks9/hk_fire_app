-- Note-to-note links ([[wiki links]]), derived from each note's document on save.
CREATE TABLE IF NOT EXISTS "note_links" (
  "id" text PRIMARY KEY NOT NULL,
  "from_note_id" text NOT NULL,
  "to_note_id" text NOT NULL,
  "label" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "note_links_pair" ON "note_links" ("from_note_id", "to_note_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_links_to" ON "note_links" ("to_note_id");
