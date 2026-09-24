import type {
  ProjectState, ScopeItem, Stage, Idea, DesignOption, Comment, Decision, Task,
  Snag, Note, Space, CostBuildUp, CostLadder, Payment, SiteUpdate,
  Vendor, Quotation, Doc, Scenario, Person, ProjectMeta, CategoryDef,
} from "./model/types";
import { BUILTIN_CATEGORIES } from "./model/categories";
import { buildProject, buildTwin } from "./seed";

/**
 * The reducer, on its own.
 *
 * Kept free of React so the same code runs in three places: the browser
 * (where it drives the UI), the server (where every accepted action is
 * replayed against the stored project before it is written), and the tests.
 * If the three ever disagree the journal would stop being a faithful record,
 * so there is exactly one copy.
 */

/* ------------------------------------------------------------------ actions */

/**
 * Every collection that supports uniform create / update / delete.
 *
 * Typing them as a map means one set of three actions covers the whole project
 * — no entity can quietly end up read-only because someone forgot to write its
 * reducer case, which is exactly how vendors, quotations and documents became
 * uneditable the first time round.
 */
export interface Collections {
  categories: CategoryDef;
  spaces: Space;
  items: ScopeItem;
  ideas: Idea;
  options: DesignOption;
  decisions: Decision;
  comments: Comment;
  vendors: Vendor;
  quotations: Quotation;
  tasks: Task;
  snags: Snag;
  notes: Note;
  payments: Payment;
  docs: Doc;
  siteUpdates: SiteUpdate;
  scenarios: Scenario;
  people: Person;
}
export type CollectionKey = keyof Collections;

export const COLLECTION_KEYS = [
  "categories", "spaces", "items", "ideas", "options", "decisions", "comments", "vendors",
  "quotations", "tasks", "snags", "notes", "payments", "docs", "siteUpdates",
  "scenarios", "people",
] as const;

type CreateAction = { [K in CollectionKey]: { type: "create"; on: K; row: Collections[K] } }[CollectionKey];
type UpdateAction = { [K in CollectionKey]: { type: "update"; on: K; id: string; patch: Partial<Collections[K]> } }[CollectionKey];

export type Action =
  | { type: "reset"; to?: "sample" | "twin" }
  | { type: "hydrate"; state: ProjectState }
  | { type: "meta/patch"; patch: Partial<ProjectMeta> }
  /* data lifecycle */
  | { type: "data/clear"; keep: KeepOptions }
  | { type: "data/import"; state: ProjectState }
  /* uniform CRUD over any collection */
  | CreateAction
  | UpdateAction
  | { type: "remove"; on: CollectionKey; id: string }
  | { type: "removeMany"; on: CollectionKey; ids: string[] }
  /* space-specific */
  | { type: "space/delete"; id: string; withItems: boolean }
  | { type: "space/merge"; fromId: string; intoId: string }
  /* scope-item workflow — these carry business rules, not just field writes */
  | { type: "item/stage"; id: string; stage: Stage; naReason?: string }
  | { type: "item/patch"; id: string; patch: Partial<ScopeItem> }
  | { type: "item/cost"; id: string; cost: Partial<CostBuildUp> }
  | { type: "item/ladder"; id: string; ladder: Partial<CostLadder> }
  | { type: "item/add"; item: ScopeItem }
  | { type: "item/duplicate"; id: string; newId: string }
  | { type: "item/bulkStage"; ids: string[]; stage: Stage }
  | { type: "item/move"; ids: string[]; spaceId?: string }
  /* the design conversation */
  | { type: "idea/add"; idea: Idea }
  | { type: "idea/shortlist"; id: string }
  | { type: "option/add"; option: DesignOption }
  | { type: "comment/add"; comment: Comment }
  | { type: "comment/react"; id: string; emoji: string; by: string }
  | { type: "decision/add"; decision: Decision }
  | { type: "decision/act"; id: string; action: "approved" | "rejected" | "changes-requested" | "held"; by: string; note?: string; optionId?: string }
  /* execution */
  | { type: "task/add"; task: Task }
  | { type: "task/patch"; id: string; patch: Partial<Task> }
  | { type: "snag/add"; snag: Snag }
  | { type: "snag/patch"; id: string; patch: Partial<Snag> }
  | { type: "note/add"; note: Note }
  | { type: "payment/paid"; id: string; on: string }
  | { type: "site/add"; update: SiteUpdate }
  | { type: "space/add"; space: Space }
  | { type: "space/patch"; id: string; patch: Partial<Space> }
  /** A fact about the building corrected in the model, carried into a saved project. */
  | { type: "space/correct"; id: string; patch: Partial<Space>; why: string }
  /** Choose one of a room's layouts, or clear the choice. */
  | { type: "space/layout"; id: string; layoutId?: string; name?: string }
  | { type: "scenario/set"; id: string };

/** What survives a wipe. Everything not listed here is emptied. */
export interface KeepOptions {
  /** The villa itself. Its layout is fixed by the drawings, so it is not really data. */
  spaces?: boolean;
  /** The taxonomy and rate card — almost always worth keeping. */
  categories?: boolean;
  /** Names and roles. */
  people?: boolean;
  /** The vendor directory, which outlives any one project. */
  vendors?: boolean;
  /** Project name, address, budget, dates. */
  settings?: boolean;
  /** The three costing scenarios. */
  scenarios?: boolean;
}

const BLANK_META: ProjectMeta = {
  name: "New project",
  address: "",
  plotWidthFt: 0,
  plotDepthFt: 0,
  startDate: new Date().toISOString(),
  targetHandover: new Date(Date.now() + 365 * 86400000).toISOString(),
  originalBudget: 0,
  contingencyPct: 7.5,
  currency: "INR",
  lastOwnerVisit: new Date().toISOString(),
};

/**
 * An empty project you can actually start from.
 *
 * Wiping the content should not wipe the scaffolding. Without a category list
 * you cannot create a single scope item, and the villa's own rooms came off the
 * architect's drawings rather than from anyone's typing — so the taxonomy and
 * the house are both kept by default. Everything else is a choice.
 */
export function emptyProject(current: ProjectState, keep: KeepOptions): ProjectState {
  return {
    meta: keep.settings ? current.meta : { ...BLANK_META, currency: current.meta.currency },
    categories: keep.categories ? current.categories : BUILTIN_CATEGORIES.map((c) => ({ ...c })),
    people: keep.people ? current.people : [],
    vendors: keep.vendors ? current.vendors : [],
    scenarios: keep.scenarios ? current.scenarios : [],
    activeScenarioId: keep.scenarios ? current.activeScenarioId : undefined,
    spaces: keep.spaces ? current.spaces : [],
    items: [], ideas: [], options: [], decisions: [], comments: [],
    quotations: [], tasks: [], snags: [], notes: [], payments: [], docs: [], siteUpdates: [],
  };
}

/** Rows in every collection carry a string `id`. */
const rowsOf = (s: ProjectState, on: CollectionKey): { id: string }[] =>
  s[on] as unknown as { id: string }[];

const setRows = (s: ProjectState, on: CollectionKey, rows: unknown[]): ProjectState =>
  ({ ...s, [on]: rows }) as ProjectState;

/**
 * Deleting a row must not leave dangling references behind it.
 * Each collection declares what else has to be cleaned up.
 */
/** Cascade the consequences of a deletion, then remove the row itself. */
function removeRow(s: ProjectState, on: CollectionKey, id: string): ProjectState {
  const cascaded = cascadeDelete(s, on, id);
  return setRows(cascaded, on, rowsOf(cascaded, on).filter((r) => r.id !== id));
}

function cascadeDelete(s: ProjectState, on: CollectionKey, id: string): ProjectState {
  switch (on) {
    case "items": {
      // Children are removed through their own cascades, not filtered out from
      // under them — otherwise a note still points at a decision that is gone.
      let next = s;
      for (const x of s.ideas.filter((x) => x.scopeItemId === id)) next = removeRow(next, "ideas", x.id);
      for (const x of s.options.filter((x) => x.scopeItemId === id)) next = removeRow(next, "options", x.id);
      for (const x of s.decisions.filter((x) => x.scopeItemId === id)) next = removeRow(next, "decisions", x.id);
      for (const x of s.comments.filter((c) => c.targetType === "item" && c.targetId === id)) {
        next = removeRow(next, "comments", x.id);
      }
      s = next;
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.scopeItemId === id ? { ...t, scopeItemId: undefined } : t)),
        snags: s.snags.map((x) => (x.scopeItemId === id ? { ...x, scopeItemId: undefined } : x)),
        notes: s.notes.map((n) => ({ ...n, scopeItemIds: n.scopeItemIds.filter((x) => x !== id) })),
        docs: s.docs.map((d) => ({ ...d, scopeItemIds: d.scopeItemIds.filter((x) => x !== id) })),
        payments: s.payments.map((p) => ({ ...p, scopeItemIds: p.scopeItemIds.filter((x) => x !== id) })),
        quotations: s.quotations
          .map((q) => ({ ...q, scopeItemIds: q.scopeItemIds.filter((x) => x !== id), lines: q.lines.filter((l) => l.scopeItemId !== id) }))
          .filter((q) => q.scopeItemIds.length > 0),
      };
    }
    case "ideas":
      return { ...s, comments: s.comments.filter((c) => !(c.targetType === "idea" && c.targetId === id)) };
    case "options": {
      const next = { ...s, comments: s.comments.filter((c) => !(c.targetType === "option" && c.targetId === id)) };
      return {
        ...next,
        decisions: next.decisions.map((d) => ({
          ...d,
          recommendedOptionId: d.recommendedOptionId === id ? undefined : d.recommendedOptionId,
          alternativeOptionIds: d.alternativeOptionIds.filter((x) => x !== id),
        })),
        items: next.items.map((i) => (i.chosenOptionId === id ? { ...i, chosenOptionId: undefined } : i)),
      };
    }
    case "decisions":
      return {
        ...s,
        comments: s.comments.filter((c) => !(c.targetType === "decision" && c.targetId === id)),
        notes: s.notes.map((n) => ({ ...n, decisionIds: n.decisionIds.filter((x) => x !== id) })),
      };
    case "vendors":
      return {
        ...s,
        items: s.items.map((i) => (i.vendorId === id ? { ...i, vendorId: undefined } : i)),
        tasks: s.tasks.map((t) => (t.vendorId === id ? { ...t, vendorId: undefined } : t)),
        snags: s.snags.map((x) => (x.vendorId === id ? { ...x, vendorId: undefined } : x)),
        docs: s.docs.map((d) => (d.vendorId === id ? { ...d, vendorId: undefined } : d)),
        notes: s.notes.map((n) => ({ ...n, vendorIds: n.vendorIds.filter((x) => x !== id) })),
        quotations: s.quotations.filter((q) => q.vendorId !== id),
        payments: s.payments.filter((p) => p.vendorId !== id),
        comments: s.comments.filter(
          (c) => !(c.targetType === "quote" && s.quotations.some((q) => q.vendorId === id && q.id === c.targetId)),
        ),
      };
    case "quotations":
      return { ...s, comments: s.comments.filter((c) => !(c.targetType === "quote" && c.targetId === id)) };
    case "tasks":
      return {
        ...s,
        tasks: s.tasks.map((t) => ({ ...t, dependsOn: t.dependsOn.filter((x) => x !== id) })),
        notes: s.notes.map((n) => ({ ...n, taskIds: n.taskIds.filter((x) => x !== id) })),
      };
    case "snags":
    case "notes":
      return { ...s, comments: s.comments.filter((c) => !((c.targetType === "snag" || c.targetType === "note") && c.targetId === id)) };
    case "comments":
      // A deleted parent takes its replies with it.
      return { ...s, comments: s.comments.filter((c) => c.parentId !== id) };
    case "categories": {
      // Items keep working: they fall back to the first surviving category
      // rather than pointing at a trade that no longer exists.
      const fallback = s.categories.find((c) => c.id !== id && !c.archived)?.id;
      return {
        ...s,
        items: s.items.map((i) => (i.category === id ? { ...i, category: fallback ?? i.category } : i)),
        snags: s.snags.map((x) => (x.category === id ? { ...x, category: fallback ?? x.category } : x)),
        vendors: s.vendors.map((v) => ({ ...v, trade: v.trade.filter((t) => t !== id) })),
      };
    }
    case "scenarios":
      return { ...s, activeScenarioId: s.activeScenarioId === id ? undefined : s.activeScenarioId };
    default:
      return s;
  }
}

const mapItem = (s: ProjectState, id: string, fn: (i: ScopeItem) => ScopeItem): ProjectState => ({
  ...s,
  items: s.items.map((i) => (i.id === id ? fn(i) : i)),
});

/**
 * The workflow lives here.
 *
 * Approving a decision does not just stamp the decision — it moves the scope
 * item it belongs to onto the next stage and records the chosen option against
 * it. That is the mechanism by which one object travels the whole pipeline
 * instead of being re-created in a BOQ module.
 */
export function reducer(s: ProjectState, a: Action): ProjectState {
  switch (a.type) {
    case "reset":
      return a.to === "sample" ? buildProject() : buildTwin();

    case "hydrate":
      return a.state;

    case "meta/patch":
      return { ...s, meta: { ...s.meta, ...a.patch } };

    case "data/clear":
      return emptyProject(s, a.keep);

    case "data/import":
      return a.state;

    /* ------------------------------------------------- uniform CRUD */
    case "create":
      return setRows(s, a.on, [...rowsOf(s, a.on), a.row as { id: string }]);

    case "update":
      return setRows(
        s, a.on,
        rowsOf(s, a.on).map((r) => (r.id === a.id ? { ...r, ...(a.patch as object) } : r)),
      );

    case "remove":
      return removeRow(s, a.on, a.id);

    case "removeMany": {
      let next = s;
      for (const id of a.ids) next = removeRow(next, a.on, id);
      return next;
    }

    /* --------------------------------------------------------- spaces */
    case "space/delete": {
      const doomed = s.items.filter((i) => i.spaceId === a.id).map((i) => i.id);
      let next = s;
      if (a.withItems) {
        for (const id of doomed) next = removeRow(next, "items", id);
      } else {
        // Keep the scope but let it fall back to house-wide rather than vanish.
        next = { ...next, items: next.items.map((i) => (i.spaceId === a.id ? { ...i, spaceId: undefined } : i)) };
      }
      return {
        ...next,
        spaces: next.spaces.filter((x) => x.id !== a.id).map((x) => (x.parentId === a.id ? { ...x, parentId: undefined } : x)),
        tasks: next.tasks.map((t) => (t.spaceId === a.id ? { ...t, spaceId: undefined } : t)),
        snags: next.snags.filter((x) => x.spaceId !== a.id),
        siteUpdates: next.siteUpdates.filter((u) => u.spaceId !== a.id),
        notes: next.notes.map((n) => ({ ...n, spaceIds: n.spaceIds.filter((x) => x !== a.id) })),
        docs: next.docs.map((d) => ({ ...d, spaceIds: d.spaceIds.filter((x) => x !== a.id) })),
      };
    }

    /** Combine two spaces: everything belonging to `from` moves to `into`. */
    case "space/merge": {
      if (a.fromId === a.intoId) return s;
      const re = (id?: string) => (id === a.fromId ? a.intoId : id);
      const reList = (ids: string[]) => Array.from(new Set(ids.map((x) => (x === a.fromId ? a.intoId : x))));
      return {
        ...s,
        spaces: s.spaces.filter((x) => x.id !== a.fromId).map((x) => ({ ...x, parentId: re(x.parentId) })),
        items: s.items.map((i) => ({ ...i, spaceId: re(i.spaceId) })),
        tasks: s.tasks.map((t) => ({ ...t, spaceId: re(t.spaceId) })),
        snags: s.snags.map((x) => ({ ...x, spaceId: re(x.spaceId)! })),
        siteUpdates: s.siteUpdates.map((u) => ({ ...u, spaceId: re(u.spaceId)! })),
        notes: s.notes.map((n) => ({ ...n, spaceIds: reList(n.spaceIds) })),
        docs: s.docs.map((d) => ({ ...d, spaceIds: reList(d.spaceIds) })),
      };
    }

    case "item/duplicate": {
      const src = s.items.find((i) => i.id === a.id);
      if (!src) return s;
      const copy: ScopeItem = {
        ...src,
        id: a.newId,
        title: `${src.title} (copy)`,
        seeded: false,
        procurement: src.procurement ? { ...src.procurement, scopeItemId: a.newId } : undefined,
      };
      const at = s.items.findIndex((i) => i.id === a.id);
      return { ...s, items: [...s.items.slice(0, at + 1), copy, ...s.items.slice(at + 1)] };
    }

    case "item/bulkStage": {
      const ids = new Set(a.ids);
      return {
        ...s,
        items: s.items.map((i) => (ids.has(i.id) ? { ...i, stage: a.stage } : i)),
      };
    }

    case "item/move": {
      const ids = new Set(a.ids);
      return { ...s, items: s.items.map((i) => (ids.has(i.id) ? { ...i, spaceId: a.spaceId } : i)) };
    }

    case "item/stage":
      return mapItem(s, a.id, (i) => ({
        ...i,
        stage: a.stage,
        naReason: a.stage === "not-applicable" ? a.naReason ?? i.naReason ?? "Marked not applicable." : undefined,
      }));

    case "item/patch":
      return mapItem(s, a.id, (i) => ({ ...i, ...a.patch }));

    case "item/cost":
      return mapItem(s, a.id, (i) => ({ ...i, cost: { ...i.cost, ...a.cost } }));

    case "item/ladder":
      return mapItem(s, a.id, (i) => ({ ...i, ladder: { ...i.ladder, ...a.ladder } }));

    case "item/add":
      return { ...s, items: [...s.items, a.item] };

    case "idea/add": {
      const next = { ...s, ideas: [a.idea, ...s.ideas] };
      // An idea against untouched scope moves it to "Idea" — the first step of the flow.
      return mapItem(next, a.idea.scopeItemId, (i) =>
        i.stage === "not-started" ? { ...i, stage: "idea" } : i,
      );
    }

    case "idea/shortlist":
      return { ...s, ideas: s.ideas.map((i) => (i.id === a.id ? { ...i, shortlisted: !i.shortlisted } : i)) };

    case "option/add": {
      const next = { ...s, options: [...s.options, a.option] };
      return mapItem(next, a.option.scopeItemId, (i) =>
        ["not-started", "idea"].includes(i.stage) ? { ...i, stage: "options" } : i,
      );
    }

    case "comment/add": {
      const next = { ...s, comments: [...s.comments, a.comment] };
      if (a.comment.targetType === "option" || a.comment.targetType === "idea") {
        const target =
          a.comment.targetType === "option"
            ? s.options.find((o) => o.id === a.comment.targetId)?.scopeItemId
            : s.ideas.find((i) => i.id === a.comment.targetId)?.scopeItemId;
        if (target) {
          return mapItem(next, target, (i) =>
            ["options", "estimated"].includes(i.stage) ? { ...i, stage: "discussion" } : i,
          );
        }
      }
      return next;
    }

    case "comment/react":
      return {
        ...s,
        comments: s.comments.map((c) => {
          if (c.id !== a.id) return c;
          const r = { ...(c.reactions ?? {}) };
          const who = r[a.emoji] ?? [];
          r[a.emoji] = who.includes(a.by) ? who.filter((x) => x !== a.by) : [...who, a.by];
          if (!r[a.emoji].length) delete r[a.emoji];
          return { ...c, reactions: r };
        }),
      };

    case "decision/add": {
      const next = { ...s, decisions: [...s.decisions, a.decision] };
      return mapItem(next, a.decision.scopeItemId, (i) => ({ ...i, stage: "discussion" }));
    }

    case "decision/act": {
      const d = s.decisions.find((x) => x.id === a.id);
      if (!d) return s;
      const statusMap = {
        approved: "approved", rejected: "rejected",
        "changes-requested": "changes-requested", held: "on-hold",
      } as const;
      const next: ProjectState = {
        ...s,
        decisions: s.decisions.map((x) =>
          x.id !== a.id
            ? x
            : {
                ...x,
                status: statusMap[a.action],
                history: [
                  ...x.history,
                  { at: new Date().toISOString(), by: a.by, action: a.action, note: a.note, optionId: a.optionId },
                ],
              },
        ),
      };
      if (a.action !== "approved") return next;
      // Approval is the moment the item becomes real: it enters the BOQ carrying
      // the chosen option's price as its approved cost.
      const optionId = a.optionId ?? d.recommendedOptionId;
      const option = s.options.find((o) => o.id === optionId);
      return mapItem(next, d.scopeItemId, (i) => ({
        ...i,
        stage: "approved",
        chosenOptionId: optionId,
        spec: option ? `${option.headline} — ${option.description}` : i.spec,
        ladder: { ...i.ladder, approved: option?.estimate ?? i.ladder.approved ?? i.ladder.designerEstimate },
      }));
    }

    case "task/add":
      return { ...s, tasks: [...s.tasks, a.task] };

    case "task/patch":
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, ...a.patch } : t)) };

    case "snag/add":
      return { ...s, snags: [a.snag, ...s.snags] };

    case "snag/patch":
      return { ...s, snags: s.snags.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) };

    case "note/add":
      return { ...s, notes: [a.note, ...s.notes] };

    case "payment/paid":
      return { ...s, payments: s.payments.map((p) => (p.id === a.id ? { ...p, paidOn: a.on } : p)) };

    case "site/add":
      return { ...s, siteUpdates: [a.update, ...s.siteUpdates] };

    case "space/add":
      return { ...s, spaces: [...s.spaces, a.space] };

    case "space/layout":
      return { ...s, spaces: s.spaces.map((x) => (x.id === a.id ? { ...x, layoutId: a.layoutId } : x)) };

    case "space/patch":
    case "space/correct":
      return { ...s, spaces: s.spaces.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) };

    case "scenario/set":
      return { ...s, activeScenarioId: a.id };

    default:
      return s;
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
