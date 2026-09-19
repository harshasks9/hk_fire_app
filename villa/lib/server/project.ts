import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { reducer, type Action } from "../reducer";
import type { ProjectState } from "../model/types";
import type { Revision } from "../journal";

/**
 * The project on the server.
 *
 * One row holds the current state and a version number. Every accepted
 * action becomes a revision row and bumps the version; a client that sends
 * an action against a version that is no longer current is refused and told
 * the truth, so two people editing at once cannot silently overwrite each
 * other. The server replays the action itself with the same reducer the
 * browser used, so what is stored is never just what a client claimed.
 */

export const PROJECT_ID = process.env.PROJECT_ID ?? "villa";
/** A full snapshot this often, so restoring to an old version stays quick. */
const CHECKPOINT_EVERY = 50;

export interface Head { version: number; state: ProjectState; name: string; updatedAt: string }

export interface Submit {
  base: number;
  action: Action;
  by: string;
  byId?: string;
  summary: string;
  touches: Revision["touches"];
  /** For epoch actions (import, wipe, reset) the client sends the resulting state. */
  state?: ProjectState;
}

export type SubmitResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true; head: Head }
  | { ok: false; conflict?: false; error: string };

export async function available(): Promise<boolean> {
  return (await getDb()) !== null;
}

export async function head(): Promise<Head | null> {
  const db = await getDb();
  if (!db) return null;
  const row = await db.query.projects.findFirst({ where: eq(schema.projects.id, PROJECT_ID) });
  if (!row) return null;
  return { version: row.version, state: row.state as ProjectState, name: row.name, updatedAt: row.updatedAt.toISOString() };
}

/** Create the project if it does not exist. Returns the head either way. */
export async function init(state: ProjectState): Promise<Head> {
  const db = await getDb();
  if (!db) throw new Error("no database");
  const existing = await head();
  if (existing) return existing;
  await db.insert(schema.projects).values({ id: PROJECT_ID, name: state.meta.name, state, version: 0 }).onConflictDoNothing();
  await db.insert(schema.checkpoints).values({ projectId: PROJECT_ID, v: 0, state }).onConflictDoNothing();
  return (await head())!;
}

export async function submit(s: Submit): Promise<SubmitResult> {
  const db = await getDb();
  if (!db) return { ok: false, error: "no database" };
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(schema.projects).where(eq(schema.projects.id, PROJECT_ID)).for("update");
    const row = rows[0];
    if (!row) return { ok: false, error: "no project" };
    if (row.version !== s.base) {
      return { ok: false, conflict: true, head: { version: row.version, state: row.state as ProjectState, name: row.name, updatedAt: row.updatedAt.toISOString() } };
    }
    const epoch = s.action.type === "data/import" || s.action.type === "data/clear" || s.action.type === "reset";
    // Imports carry the state in the action itself; wipes and resets are
    // recomputed here, so a client can never smuggle in a state the reducer
    // would not have produced.
    const next = epoch && s.action.type === "data/import" ? s.action.state : reducer(row.state as ProjectState, s.action);
    const v = row.version + 1;
    await tx.update(schema.projects)
      .set({ state: next, version: v, name: next.meta.name, updatedAt: new Date() })
      .where(eq(schema.projects.id, PROJECT_ID));
    await tx.insert(schema.revisions).values({
      projectId: PROJECT_ID, v, by: s.by, byId: s.byId ?? null,
      // Imports are stored without their payload: the checkpoint has it.
      action: s.action.type === "data/import" ? { type: "data/import" } : s.action,
      summary: s.summary, touches: s.touches ?? {},
    });
    if (epoch || v % CHECKPOINT_EVERY === 0) {
      await tx.insert(schema.checkpoints).values({ projectId: PROJECT_ID, v, state: next }).onConflictDoNothing();
    }
    return { ok: true, version: v };
  });
}

export interface RevisionQuery { before?: number; limit?: number; itemId?: string; spaceId?: string }

export async function revisions(q: RevisionQuery = {}): Promise<Revision[]> {
  const db = await getDb();
  if (!db) return [];
  const limit = Math.min(Math.max(q.limit ?? 500, 1), 2000);
  const where = [eq(schema.revisions.projectId, PROJECT_ID)];
  if (q.before !== undefined) where.push(sql`${schema.revisions.v} < ${q.before}`);
  if (q.itemId) where.push(sql`${schema.revisions.touches} ->> 'itemId' = ${q.itemId}`);
  if (q.spaceId) where.push(sql`${schema.revisions.touches} ->> 'spaceId' = ${q.spaceId}`);
  const rows = await db.select().from(schema.revisions).where(and(...where)).orderBy(desc(schema.revisions.v)).limit(limit);
  return rows.map((r) => ({
    v: r.v, at: r.at.toISOString(), by: r.by, byId: r.byId ?? undefined,
    action: r.action as Action, summary: r.summary, touches: (r.touches ?? {}) as Revision["touches"],
  }));
}

/** The project as it stood after version `v`: nearest checkpoint, then replay. */
export async function stateAt(v: number): Promise<ProjectState | null> {
  const db = await getDb();
  if (!db) return null;
  const cp = (await db.select().from(schema.checkpoints)
    .where(and(eq(schema.checkpoints.projectId, PROJECT_ID), lte(schema.checkpoints.v, v)))
    .orderBy(desc(schema.checkpoints.v)).limit(1))[0];
  if (!cp) return null;
  const revs = await db.select().from(schema.revisions)
    .where(and(eq(schema.revisions.projectId, PROJECT_ID), gt(schema.revisions.v, cp.v), lte(schema.revisions.v, v)))
    .orderBy(schema.revisions.v);
  let s = cp.state as ProjectState;
  for (const r of revs) {
    const a = r.action as Action;
    // An import's state lives in its checkpoint, which is always the one we start from.
    if (a.type === "data/import") continue;
    s = reducer(s, a);
  }
  return s;
}
