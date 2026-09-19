import { pgTable, text, integer, timestamp, jsonb, serial, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Storage.
 *
 * A project is one JSON document plus its journal. That is not laziness: the
 * whole state is under a megabyte, it is read in full on every load, and the
 * reducer already produces whole-state transitions — a normalised schema with
 * seventeen tables would buy nothing but migrations. The `projects` table is
 * keyed so that a second project is a row, not a redesign.
 */

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  /** The current state of the plan. */
  state: jsonb("state").notNull(),
  /** Bumps on every accepted action; a client sending a stale version is refused. */
  version: integer("version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per accepted action. This IS the version history. */
export const revisions = pgTable(
  "revisions",
  {
    id: serial("id").primaryKey(),
    projectId: text("project_id").notNull(),
    v: integer("v").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    by: text("by").notNull().default(""),
    byId: text("by_id"),
    action: jsonb("action").notNull(),
    summary: text("summary").notNull().default(""),
    touches: jsonb("touches").notNull().default({}),
  },
  (t) => [uniqueIndex("revisions_project_v").on(t.projectId, t.v), index("revisions_project_at").on(t.projectId, t.at)],
);

/**
 * Full snapshots every so often, so restoring to an old version does not
 * replay the whole journal from the beginning.
 */
export const checkpoints = pgTable(
  "checkpoints",
  {
    id: serial("id").primaryKey(),
    projectId: text("project_id").notNull(),
    v: integer("v").notNull(),
    state: jsonb("state").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("checkpoints_project_v").on(t.projectId, t.v)],
);
