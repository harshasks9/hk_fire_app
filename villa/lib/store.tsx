"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type {
  ProjectState, ScopeItem, Stage, Idea, DesignOption, Comment, Decision, Task,
  Snag, Note, Space, Role, CostBuildUp, CostLadder, Payment, SiteUpdate,
} from "./model/types";
import { buildProject } from "./seed";

const STORAGE_KEY = "villa-fitout:v1";

/* ------------------------------------------------------------------ actions */

export type Action =
  | { type: "reset" }
  | { type: "hydrate"; state: ProjectState }
  | { type: "item/stage"; id: string; stage: Stage; naReason?: string }
  | { type: "item/patch"; id: string; patch: Partial<ScopeItem> }
  | { type: "item/cost"; id: string; cost: Partial<CostBuildUp> }
  | { type: "item/ladder"; id: string; ladder: Partial<CostLadder> }
  | { type: "item/add"; item: ScopeItem }
  | { type: "idea/add"; idea: Idea }
  | { type: "idea/shortlist"; id: string }
  | { type: "option/add"; option: DesignOption }
  | { type: "comment/add"; comment: Comment }
  | { type: "comment/react"; id: string; emoji: string; by: string }
  | { type: "decision/add"; decision: Decision }
  | { type: "decision/act"; id: string; action: "approved" | "rejected" | "changes-requested" | "held"; by: string; note?: string; optionId?: string }
  | { type: "task/add"; task: Task }
  | { type: "task/patch"; id: string; patch: Partial<Task> }
  | { type: "snag/add"; snag: Snag }
  | { type: "snag/patch"; id: string; patch: Partial<Snag> }
  | { type: "note/add"; note: Note }
  | { type: "payment/paid"; id: string; on: string }
  | { type: "site/add"; update: SiteUpdate }
  | { type: "space/add"; space: Space }
  | { type: "space/patch"; id: string; patch: Partial<Space> }
  | { type: "scenario/set"; id: string };

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
      return buildProject();

    case "hydrate":
      return a.state;

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

    case "space/patch":
      return { ...s, spaces: s.spaces.map((x) => (x.id === a.id ? { ...x, ...a.patch } : x)) };

    case "scenario/set":
      return { ...s, activeScenarioId: a.id };

    default:
      return s;
  }
}

/* ------------------------------------------------------------------ context */

interface Ctx {
  state: ProjectState;
  dispatch: React.Dispatch<Action>;
  role: Role;
  setRole: (r: Role) => void;
  me: string;
  hydrated: boolean;
}

const ProjectCtx = createContext<Ctx | null>(null);

function load(): ProjectState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: number; state: ProjectState };
    if (parsed.v !== 1 || !parsed.state?.items?.length) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  // Always render the seeded project first so server and client agree, then
  // swap in saved work after mount. Avoids a hydration mismatch.
  const [state, dispatch] = useReducer(reducer, undefined, buildProject);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRoleState] = useState<Role>("homeowner");

  useEffect(() => {
    const saved = load();
    if (saved) dispatch({ type: "hydrate", state: saved });
    setHydrated(true);
    const r = window.localStorage.getItem(STORAGE_KEY + ":role") as Role | null;
    if (r) setRoleState(r);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, state }));
    } catch {
      /* quota or private mode — the app still works, it just will not remember. */
    }
  }, [state, hydrated]);

  const setRole = (r: Role) => {
    setRoleState(r);
    try { window.localStorage.setItem(STORAGE_KEY + ":role", r); } catch { /* ignore */ }
  };

  const me = role === "homeowner" ? "Harsha" : role === "designer" ? "Ananya Rao" : "Vendor";

  const value = useMemo(() => ({ state, dispatch, role, setRole, me, hydrated }), [state, role, hydrated, me]);
  return <ProjectCtx.Provider value={value}>{children}</ProjectCtx.Provider>;
}

export function useProject(): Ctx {
  const c = useContext(ProjectCtx);
  if (!c) throw new Error("useProject must be used inside ProjectProvider");
  return c;
}

/* ------------------------------------------------------------------- helpers */

export function useSpace(spaceId: string) {
  const { state } = useProject();
  return state.spaces.find((s) => s.id === spaceId);
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
