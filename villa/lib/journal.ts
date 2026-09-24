import type { ProjectState } from "./model/types";
import { STAGE_LABEL } from "./model/types";
import type { Action, CollectionKey } from "./reducer";
import { reducer } from "./reducer";
import { SCHEMAS } from "./model/schema";
import { inr } from "./model/costing";

/**
 * The journal: every change to the plan, in order, with who made it and why.
 *
 * It works because the reducer is pure. Rather than storing a copy of the
 * project after every edit, we store the starting point once and then the
 * actions themselves — a patch is a few bytes, a snapshot is a megabyte. Any
 * past version is `base` replayed forward to that point, exactly.
 */

export interface Revision {
  /** 1-based, contiguous. */
  v: number;
  at: string;
  by: string;
  byId?: string;
  action: Action;
  /** Human-readable, in the past tense: "Changed rate on Flooring from ₹180 to ₹220". */
  summary: string;
  /** What it touched, so history can be filtered by room, item or collection. */
  touches: { spaceId?: string; itemId?: string; collection?: string; id?: string };
}

export interface Journal {
  /** The state when this journal began — after a seed, wipe or import. */
  base: ProjectState;
  revisions: Revision[];
  startedAt: string;
}

/** Actions that restart history rather than being part of it. */
export const EPOCH_ACTIONS = new Set<Action["type"]>(["reset", "data/clear", "data/import"]);
/** View preferences, not changes to the plan. */
export const UNJOURNALED = new Set<Action["type"]>(["hydrate", "scenario/set"]);

/** Beyond this, the oldest revisions are folded into `base` to keep storage bounded. */
export const JOURNAL_CAP = 2000;
export const JOURNAL_FOLD = 500;

export function newJournal(base: ProjectState): Journal {
  return { base, revisions: [], startedAt: new Date().toISOString() };
}

/** The project as it stood after revision `v` (0 = the base). */
export function stateAt(j: Journal, v: number): ProjectState {
  let s = j.base;
  for (const r of j.revisions) {
    if (r.v > v) break;
    s = reducer(s, r.action);
  }
  return s;
}

/** Append one revision, folding old history into the base if it has grown too long. */
export function append(j: Journal, rev: Omit<Revision, "v">): Journal {
  const v = (j.revisions.at(-1)?.v ?? 0) + 1;
  let base = j.base;
  let revisions = [...j.revisions, { ...rev, v }];
  if (revisions.length > JOURNAL_CAP) {
    const fold = revisions.slice(0, JOURNAL_FOLD);
    for (const r of fold) base = reducer(base, r.action);
    revisions = revisions.slice(JOURNAL_FOLD);
  }
  return { ...j, base, revisions };
}

/* ------------------------------------------------------------- describe */

const singular = (on: CollectionKey) => SCHEMAS[on]?.singular ?? on;
const titleOf = (on: CollectionKey, row: Record<string, unknown> | undefined, s: ProjectState) =>
  row ? SCHEMAS[on]?.title(row, s) ?? String(row.id) : "a record";

function findRow(s: ProjectState, on: CollectionKey, id: string): Record<string, unknown> | undefined {
  return (s[on] as unknown as Record<string, unknown>[]).find((r) => r.id === id);
}

function fmt(v: unknown, key?: string): string {
  if (v === undefined || v === null || v === "") return "blank";
  if (typeof v === "number") {
    if (key && /rate|estimate|quoted|approved|committed|paid|amount|total|freight|charges|lump/i.test(key)) return inr(v);
    return String(v);
  }
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  const str = String(v);
  return str.length > 40 ? `${str.slice(0, 40)}…` : str;
}

/** Flatten a patch into "field: old → new" fragments, skipping untouched keys. */
function diff(before: Record<string, unknown> | undefined, patch: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (k === "id") continue;
    const old = before?.[k];
    if (v && typeof v === "object" && !Array.isArray(v) && old && typeof old === "object" && !Array.isArray(old)) {
      out.push(...diff(old as Record<string, unknown>, v as Record<string, unknown>, `${prefix}${k}.`));
      continue;
    }
    if (JSON.stringify(old) === JSON.stringify(v)) continue;
    out.push(`${prefix}${k}: ${fmt(old, k)} → ${fmt(v, k)}`);
  }
  return out;
}

const itemName = (s: ProjectState, id: string) => {
  const i = s.items.find((x) => x.id === id);
  if (!i) return "an item";
  const sp = s.spaces.find((x) => x.id === i.spaceId);
  return sp ? `${sp.name} › ${i.title}` : i.title;
};

/**
 * Turn an action into a sentence, using the state BEFORE it applied so the old
 * values are still there to quote.
 */
export function describe(before: ProjectState, a: Action): { summary: string; touches: Revision["touches"] } {
  const t = (partial: Revision["touches"]) => partial;
  switch (a.type) {
    case "create": {
      const row = a.row as unknown as Record<string, unknown>;
      return {
        summary: `Added ${singular(a.on)} “${titleOf(a.on, row, before)}”`,
        touches: t({ collection: a.on, id: String(row.id), spaceId: row.spaceId as string | undefined }),
      };
    }
    case "update": {
      const row = findRow(before, a.on, a.id);
      const changes = diff(row, a.patch as Record<string, unknown>);
      return {
        summary: `Edited ${singular(a.on)} “${titleOf(a.on, row, before)}”${changes.length ? ` — ${changes.slice(0, 3).join("; ")}${changes.length > 3 ? ` (+${changes.length - 3} more)` : ""}` : ""}`,
        touches: t({ collection: a.on, id: a.id, spaceId: row?.spaceId as string | undefined, itemId: a.on === "items" ? a.id : (row?.scopeItemId as string | undefined) }),
      };
    }
    case "remove": {
      const row = findRow(before, a.on, a.id);
      return {
        summary: `Deleted ${singular(a.on)} “${titleOf(a.on, row, before)}”`,
        touches: t({ collection: a.on, id: a.id, spaceId: row?.spaceId as string | undefined }),
      };
    }
    case "removeMany":
      return { summary: `Deleted ${a.ids.length} ${SCHEMAS[a.on]?.label.toLowerCase() ?? a.on}`, touches: t({ collection: a.on }) };

    case "item/stage": {
      const i = before.items.find((x) => x.id === a.id);
      return {
        summary: a.stage === "not-applicable"
          ? `Marked ${itemName(before, a.id)} not applicable${a.naReason ? ` — ${a.naReason}` : ""}`
          : `Moved ${itemName(before, a.id)} from ${i ? STAGE_LABEL[i.stage] : "?"} to ${STAGE_LABEL[a.stage]}`,
        touches: t({ itemId: a.id, spaceId: i?.spaceId, collection: "items", id: a.id }),
      };
    }
    case "item/patch": {
      const i = before.items.find((x) => x.id === a.id);
      const changes = diff(i as unknown as Record<string, unknown>, a.patch as Record<string, unknown>);
      return {
        summary: `Edited ${itemName(before, a.id)}${changes.length ? ` — ${changes.slice(0, 3).join("; ")}` : ""}`,
        touches: t({ itemId: a.id, spaceId: i?.spaceId, collection: "items", id: a.id }),
      };
    }
    case "item/cost": {
      const i = before.items.find((x) => x.id === a.id);
      const changes = diff(i?.cost as unknown as Record<string, unknown>, a.cost as Record<string, unknown>);
      return {
        summary: `Changed costing on ${itemName(before, a.id)}${changes.length ? ` — ${changes.join("; ")}` : ""}`,
        touches: t({ itemId: a.id, spaceId: i?.spaceId, collection: "items", id: a.id }),
      };
    }
    case "item/ladder": {
      const i = before.items.find((x) => x.id === a.id);
      const changes = diff(i?.ladder as unknown as Record<string, unknown>, a.ladder as Record<string, unknown>);
      return {
        summary: `Updated money on ${itemName(before, a.id)}${changes.length ? ` — ${changes.join("; ")}` : ""}`,
        touches: t({ itemId: a.id, spaceId: i?.spaceId, collection: "items", id: a.id }),
      };
    }
    case "item/add":
      return { summary: `Added scope item “${a.item.title}”${a.item.spaceId ? ` to ${before.spaces.find((s) => s.id === a.item.spaceId)?.name ?? "a room"}` : ""}`, touches: t({ itemId: a.item.id, spaceId: a.item.spaceId, collection: "items", id: a.item.id }) };
    case "item/duplicate":
      return { summary: `Duplicated ${itemName(before, a.id)}`, touches: t({ itemId: a.newId, collection: "items", id: a.newId }) };
    case "item/bulkStage":
      return { summary: `Moved ${a.ids.length} items to ${STAGE_LABEL[a.stage]}`, touches: t({ collection: "items" }) };
    case "item/move":
      return { summary: `Moved ${a.ids.length} items to ${a.spaceId ? before.spaces.find((s) => s.id === a.spaceId)?.name ?? "a room" : "house-wide"}`, touches: t({ collection: "items", spaceId: a.spaceId }) };

    case "idea/add":
      return { summary: `Added idea “${a.idea.title}” to ${itemName(before, a.idea.scopeItemId)}`, touches: t({ itemId: a.idea.scopeItemId, collection: "ideas", id: a.idea.id }) };
    case "idea/shortlist": {
      const i = before.ideas.find((x) => x.id === a.id);
      return { summary: `${i?.shortlisted ? "Removed from shortlist" : "Shortlisted"} “${i?.title ?? "an idea"}”`, touches: t({ itemId: i?.scopeItemId, collection: "ideas", id: a.id }) };
    }
    case "option/add":
      return { summary: `Added ${a.option.label} — ${a.option.headline} to ${itemName(before, a.option.scopeItemId)}`, touches: t({ itemId: a.option.scopeItemId, collection: "options", id: a.option.id }) };
    case "comment/add":
      return { summary: `Commented: “${a.comment.body.slice(0, 60)}${a.comment.body.length > 60 ? "…" : ""}”`, touches: t({ collection: "comments", id: a.comment.id }) };
    case "comment/react":
      return { summary: `Reacted ${a.emoji} to a comment`, touches: t({ collection: "comments", id: a.id }) };
    case "decision/add":
      return { summary: `Raised decision “${a.decision.title}”`, touches: t({ itemId: a.decision.scopeItemId, collection: "decisions", id: a.decision.id }) };
    case "decision/act": {
      const d = before.decisions.find((x) => x.id === a.id);
      const verb = { approved: "Approved", rejected: "Rejected", "changes-requested": "Requested changes on", held: "Put on hold" }[a.action];
      const opt = a.optionId ? before.options.find((o) => o.id === a.optionId) : undefined;
      return {
        summary: `${verb} “${d?.title ?? "a decision"}”${opt ? ` — ${opt.label}, ${opt.headline}` : ""}${a.note ? ` — “${a.note}”` : ""}`,
        touches: t({ itemId: d?.scopeItemId, collection: "decisions", id: a.id }),
      };
    }
    case "task/add":
      return { summary: `Added task “${a.task.title}”`, touches: t({ spaceId: a.task.spaceId, collection: "tasks", id: a.task.id }) };
    case "task/patch": {
      const x = before.tasks.find((y) => y.id === a.id);
      const changes = diff(x as unknown as Record<string, unknown>, a.patch as Record<string, unknown>);
      return { summary: `Updated task “${x?.title ?? "?"}”${changes.length ? ` — ${changes.join("; ")}` : ""}`, touches: t({ spaceId: x?.spaceId, collection: "tasks", id: a.id }) };
    }
    case "snag/add":
      return { summary: `Raised snag “${a.snag.title}” in ${before.spaces.find((s) => s.id === a.snag.spaceId)?.name ?? "a room"}`, touches: t({ spaceId: a.snag.spaceId, collection: "snags", id: a.snag.id }) };
    case "snag/patch": {
      const x = before.snags.find((y) => y.id === a.id);
      const changes = diff(x as unknown as Record<string, unknown>, a.patch as Record<string, unknown>);
      return { summary: `Updated snag “${x?.title ?? "?"}”${changes.length ? ` — ${changes.join("; ")}` : ""}`, touches: t({ spaceId: x?.spaceId, collection: "snags", id: a.id }) };
    }
    case "note/add":
      return { summary: `Wrote note “${a.note.title}”`, touches: t({ spaceId: a.note.spaceIds[0], collection: "notes", id: a.note.id }) };
    case "payment/paid": {
      const p = before.payments.find((x) => x.id === a.id);
      return { summary: `Marked paid: ${p?.label ?? "a payment"}${p ? ` (${inr(p.amount)})` : ""}`, touches: t({ collection: "payments", id: a.id }) };
    }
    case "site/add":
      return { summary: `Site update in ${before.spaces.find((s) => s.id === a.update.spaceId)?.name ?? "a room"}: ${a.update.body.slice(0, 50)}`, touches: t({ spaceId: a.update.spaceId, collection: "siteUpdates", id: a.update.id }) };
    case "space/add":
      return { summary: `Added space “${a.space.name}”`, touches: t({ spaceId: a.space.id, collection: "spaces", id: a.space.id }) };
    case "space/patch": {
      const sp = before.spaces.find((x) => x.id === a.id);
      const changes = diff(sp as unknown as Record<string, unknown>, a.patch as Record<string, unknown>);
      return { summary: `Edited space “${sp?.name ?? "?"}”${changes.length ? ` — ${changes.join("; ")}` : ""}`, touches: t({ spaceId: a.id, collection: "spaces", id: a.id }) };
    }
    case "space/correct": {
      const sp = before.spaces.find((x) => x.id === a.id);
      return { summary: `Corrected \u201c${sp?.name ?? "?"}\u201d in the villa model \u2014 ${a.why}`, touches: t({ spaceId: a.id, collection: "spaces", id: a.id }) };
    }
    case "space/delete": {
      const sp = before.spaces.find((x) => x.id === a.id);
      const n = before.items.filter((i) => i.spaceId === a.id).length;
      return { summary: `Deleted space “${sp?.name ?? "?"}”${a.withItems ? ` and its ${n} scope items` : ` (kept ${n} scope items as house-wide)`}`, touches: t({ spaceId: a.id, collection: "spaces", id: a.id }) };
    }
    case "space/merge": {
      const from = before.spaces.find((x) => x.id === a.fromId)?.name ?? "?";
      const into = before.spaces.find((x) => x.id === a.intoId)?.name ?? "?";
      return { summary: `Combined “${from}” into “${into}”`, touches: t({ spaceId: a.intoId, collection: "spaces", id: a.intoId }) };
    }
    case "meta/patch": {
      const changes = diff(before.meta as unknown as Record<string, unknown>, a.patch as Record<string, unknown>);
      return { summary: `Changed project settings${changes.length ? ` — ${changes.join("; ")}` : ""}`, touches: t({}) };
    }
    default:
      return { summary: `${(a as Action).type}`, touches: t({}) };
  }
}
