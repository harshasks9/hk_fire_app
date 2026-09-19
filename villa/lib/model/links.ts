import type { ProjectState } from "./types";
import type { CollectionKey } from "../reducer";
import { SCHEMAS } from "./schema";

/**
 * Where each kind of record lives.
 *
 * Every reference in the app — a vendor named on a quote, the room a snag is
 * in, the item a decision decides — should be a way to get to the thing it
 * names. That only works if there is one answer to "where does a task open?",
 * so it is written down once here rather than guessed at each call site.
 */
export function hrefFor(on: CollectionKey, id: string, state: ProjectState): string | undefined {
  const row = (state[on] as unknown as { id: string }[]).find((r) => r.id === id);
  if (!row) return undefined;
  switch (on) {
    case "spaces":
      return `/villa/${id}`;
    case "items": {
      const it = state.items.find((i) => i.id === id)!;
      // A scope item opens inside its room; house-wide scope has no room, so it
      // opens on the BOQ, which is the one screen that lists it.
      return it.spaceId ? `/villa/${it.spaceId}?item=${id}` : `/costs?item=${id}`;
    }
    case "ideas":
    case "options": {
      const sid = (row as { scopeItemId?: string }).scopeItemId;
      const it = sid ? state.items.find((i) => i.id === sid) : undefined;
      return it?.spaceId ? `/villa/${it.spaceId}?item=${it.id}` : "/design";
    }
    case "decisions":
      return `/decisions#${id}`;
    case "vendors":
      return `/vendors#${id}`;
    case "quotations": {
      const q = row as { vendorId?: string };
      return q.vendorId ? `/vendors#${q.vendorId}` : "/vendors";
    }
    case "tasks":
      return `/timeline#${id}`;
    case "snags":
      return `/site#${id}`;
    case "notes":
      return `/notes#${id}`;
    case "docs":
      return `/documents#${id}`;
    case "payments":
      return `/costs?view=payments#${id}`;
    case "siteUpdates":
      return `/site#${id}`;
    case "people":
      return "/admin?tab=People";
    case "categories":
      return "/admin?tab=Categories%20%26%20rates";
    case "scenarios":
      return "/costs?view=scenarios";
    case "comments":
      return undefined;
    default:
      return undefined;
  }
}

/** The human name of a row, from its own schema. */
export function labelFor(on: CollectionKey, id: string, state: ProjectState): string | undefined {
  const row = (state[on] as unknown as Record<string, unknown>[]).find((r) => r.id === id);
  return row ? SCHEMAS[on].title(row, state) : undefined;
}

/** Everything that points at this row, so a record can show its own neighbourhood. */
export interface Related { on: CollectionKey; ids: string[] }

export function relatedTo(on: CollectionKey, id: string, state: ProjectState): Related[] {
  const out: Related[] = [];
  const push = (k: CollectionKey, ids: string[]) => { if (ids.length) out.push({ on: k, ids }); };

  if (on === "items") {
    push("ideas", state.ideas.filter((r) => r.scopeItemId === id).map((r) => r.id));
    push("options", state.options.filter((r) => r.scopeItemId === id).map((r) => r.id));
    push("decisions", state.decisions.filter((r) => r.scopeItemId === id).map((r) => r.id));
    push("tasks", state.tasks.filter((r) => r.scopeItemId === id).map((r) => r.id));
    push("snags", state.snags.filter((r) => r.scopeItemId === id).map((r) => r.id));
    push("quotations", state.quotations.filter((r) => r.scopeItemIds?.includes(id)).map((r) => r.id));
    push("docs", state.docs.filter((r) => r.scopeItemIds?.includes(id)).map((r) => r.id));
  }
  if (on === "spaces") {
    push("items", state.items.filter((r) => r.spaceId === id).map((r) => r.id));
    push("snags", state.snags.filter((r) => r.spaceId === id).map((r) => r.id));
    push("notes", state.notes.filter((r) => r.spaceIds?.includes(id)).map((r) => r.id));
    push("docs", state.docs.filter((r) => r.spaceIds?.includes(id)).map((r) => r.id));
  }
  if (on === "vendors") {
    push("quotations", state.quotations.filter((r) => r.vendorId === id).map((r) => r.id));
    push("items", state.items.filter((r) => r.procurement?.vendorId === id).map((r) => r.id));
    push("payments", state.payments.filter((r) => r.vendorId === id).map((r) => r.id));
    push("tasks", state.tasks.filter((r) => r.vendorId === id).map((r) => r.id));
  }
  if (on === "decisions") {
    const d = state.decisions.find((r) => r.id === id);
    if (d?.scopeItemId) push("items", [d.scopeItemId]);
    push("options", state.options.filter((o) => o.scopeItemId === d?.scopeItemId).map((o) => o.id));
  }
  return out;
}
