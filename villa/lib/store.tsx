"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { ProjectState, Role } from "./model/types";
import { BUILTIN_CATEGORIES } from "./model/categories";
import { reducer, type Action } from "./reducer";
import { newJournal, append, describe, stateAt, EPOCH_ACTIONS, UNJOURNALED, type Journal, type Revision } from "./journal";
import { buildProject, buildTwin } from "./seed";

export * from "./reducer";

const STORAGE_KEY = "villa-fitout:v1";

/* ------------------------------------------------------------------ context */

interface Ctx {
  state: ProjectState;
  dispatch: React.Dispatch<Action>;
  /** The lens the app is showing — follows the current person's role. */
  role: Role;
  setRole: (r: Role) => void;
  /** Display name of whoever is using the app right now. */
  me: string;
  /** The person record behind `me`, if one has been chosen. */
  meId?: string;
  setMe: (personId?: string) => void;
  hydrated: boolean;
  /** Every change to the plan since the journal began. */
  journal: Journal;
  /** Roll the project back to how it stood after revision `v`. Recorded as a revision itself. */
  restoreTo: (v: number) => Promise<void>;
  /** Where the data actually lives right now. */
  storage: StorageStatus;
  /** Offer the shared password to a locked server. */
  unlock: (password: string) => Promise<boolean>;
}

export interface StorageStatus {
  mode: "browser" | "server" | "unknown";
  /** Server version, when synced. */
  version?: number;
  lastSyncAt?: string;
  error?: string;
  /** Changes made here that the server has not yet accepted. */
  pending?: number;
  /** The server wants the shared password before it will talk. */
  locked?: boolean;
}

/** One change waiting to go to the server. */
interface Outbound {
  action: Action;
  by: string;
  byId?: string;
  summary: string;
  touches: Revision["touches"];
}

const ProjectCtx = createContext<Ctx | null>(null);

function load(): ProjectState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: number; state: ProjectState };
    // Validate the SHAPE, not the contents. A project someone has deliberately
    // emptied has zero items, and treating that as "nothing saved" would
    // re-seed the sample villa over their fresh start on every reload.
    if (parsed.v !== 1) return null;
    const st = parsed.state;
    if (!st || !Array.isArray(st.items) || !Array.isArray(st.spaces) || !st.meta) return null;
    // A backup taken before the taxonomy moved into state still has to load.
    if (!Array.isArray(st.categories) || !st.categories.length) {
      st.categories = BUILTIN_CATEGORIES.map((c) => ({ ...c }));
    }
    return st;
  } catch {
    return null;
  }
}

const JOURNAL_KEY = STORAGE_KEY + ":journal";

function loadJournal(): Journal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(JOURNAL_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Journal;
    if (!j?.base || !Array.isArray(j.revisions)) return null;
    return j;
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  // Always render the empty twin first so server and client agree, then swap
  // in saved work after mount. Avoids a hydration mismatch.
  const [state, rawDispatch] = useReducer(reducer, undefined, buildTwin);
  const [journal, setJournal] = useState<Journal>(() => newJournal(buildTwin()));
  const [hydrated, setHydrated] = useState(false);
  const [role, setRoleState] = useState<Role>("homeowner");
  const [meId, setMeIdState] = useState<string | undefined>(undefined);
  const [storage, setStorage] = useState<StorageStatus>({ mode: "unknown" });

  // The reducer is only ever reached through here, so nothing changes the plan
  // without a line in the journal saying who did it and what it was.
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const meRef = React.useRef({ me: "", meId: undefined as string | undefined });
  // A one-shot caption for the next epoch action, so a restore says which version it went back to.
  const labelRef = React.useRef<string | null>(null);

  // ---- server sync -------------------------------------------------------
  // Changes apply locally first and go to the server in order. The server
  // accepts an action only against the version it was made on; if someone
  // else got there first we take their state, replay what is still pending
  // here on top of it, and carry on. Nothing is lost on either side.
  const sync = React.useRef({
    mode: "unknown" as StorageStatus["mode"],
    version: 0,
    queue: [] as Outbound[],
    draining: false,
    locked: false,
    backoff: 0,
  });

  const setSyncStatus = React.useCallback((patch: Partial<StorageStatus>) => {
    setStorage((st) => ({ ...st, mode: sync.current.mode, version: sync.current.version, pending: sync.current.queue.length, ...patch }));
  }, []);

  const adopt = React.useCallback((serverState: ProjectState, version: number) => {
    sync.current.version = version;
    rawDispatch({ type: "hydrate", state: serverState });
    setJournal(newJournal(serverState));
    // Replay what is still waiting here on top of what the server has.
    for (const o of sync.current.queue) rawDispatch(o.action);
    setSyncStatus({ lastSyncAt: new Date().toISOString(), error: undefined });
  }, [setSyncStatus]);

  const drain = React.useCallback(async () => {
    const c = sync.current;
    if (c.draining || c.mode !== "server" || c.locked) return;
    c.draining = true;
    try {
      while (c.queue.length) {
        const o = c.queue[0];
        const body: Record<string, unknown> = { base: c.version, ...o };
        let res: Response;
        try {
          res = await fetch("/api/project/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        } catch {
          // Offline. Keep the change and try again shortly.
          c.backoff = Math.min((c.backoff || 4000) * 2, 60000);
          setSyncStatus({ error: "offline" });
          setTimeout(() => { c.draining = false; void drain(); }, c.backoff);
          return;
        }
        if (res.status === 401) { c.locked = true; setSyncStatus({ locked: true }); return; }
        if (res.status === 409) {
          const { head } = (await res.json()) as { head: { version: number; state: ProjectState } };
          adopt(head.state, head.version);
          continue; // same action, now against the new version
        }
        if (!res.ok) {
          c.backoff = Math.min((c.backoff || 4000) * 2, 60000);
          setSyncStatus({ error: `server ${res.status}` });
          setTimeout(() => { c.draining = false; void drain(); }, c.backoff);
          return;
        }
        const { version } = (await res.json()) as { version: number };
        c.version = version;
        c.backoff = 0;
        c.queue.shift();
        setSyncStatus({ lastSyncAt: new Date().toISOString(), error: undefined });
      }
    } finally {
      c.draining = false;
    }
  }, [adopt, setSyncStatus]);

  const enqueue = React.useCallback((o: Outbound) => {
    if (sync.current.mode !== "server") return;
    sync.current.queue.push(o);
    setSyncStatus({});
    void drain();
  }, [drain, setSyncStatus]);

  const dispatch = React.useCallback((a: Action) => {
    if (UNJOURNALED.has(a.type)) { rawDispatch(a); return; }
    if (EPOCH_ACTIONS.has(a.type)) {
      // A wipe, reset or import is a new beginning, not a change to record.
      const next = reducer(stateRef.current, a);
      setJournal(newJournal(next));
      rawDispatch(a);
      const label = labelRef.current ?? (a.type === "reset" ? (a.to === "sample" ? "Loaded the sample villa" : "Reset to the empty twin")
        : a.type === "data/clear" ? "Emptied the project" : "Imported a project file");
      labelRef.current = null;
      enqueue({ action: a, by: meRef.current.me, byId: meRef.current.meId, summary: label, touches: {} });
      return;
    }
    const before = stateRef.current;
    const { summary, touches } = describe(before, a);
    const rev = { at: new Date().toISOString(), by: meRef.current.me, byId: meRef.current.meId, action: a, summary, touches };
    setJournal((j) => append(j, rev));
    rawDispatch(a);
    enqueue({ action: a, by: rev.by, byId: rev.byId, summary, touches });
  }, [enqueue]);

  // Ask the server what it has. Called on mount, on focus, and every so often.
  const pull = React.useCallback(async (first = false) => {
    const c = sync.current;
    if (c.locked && !first) return;
    let res: Response;
    try {
      res = await fetch(`/api/project${c.mode === "server" ? `?v=${c.version}` : ""}`, { cache: "no-store" });
    } catch {
      if (first) { c.mode = "browser"; setSyncStatus({ error: "offline" }); }
      return;
    }
    const data = (await res.json()) as {
      mode: "browser" | "server"; locked?: boolean; unchanged?: boolean; version?: number;
      project?: { version: number; state: ProjectState } | null;
    };
    if (data.mode === "browser") { c.mode = "browser"; setSyncStatus({}); return; }
    c.mode = "server";
    if (data.locked && !data.project) { c.locked = true; setSyncStatus({ locked: true }); return; }
    c.locked = false;
    if (data.unchanged) { setSyncStatus({ lastSyncAt: new Date().toISOString(), locked: false }); return; }
    if (data.project === null) {
      // First arrival: what this browser has becomes the project.
      const r = await fetch("/api/project", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: stateRef.current }) });
      if (r.ok) {
        const { project } = (await r.json()) as { project: { version: number; state: ProjectState } };
        adopt(project.state, project.version);
      }
      return;
    }
    if (data.project) {
      if (c.queue.length && !first) return; // ours will 409 and reconcile if needed
      adopt(data.project.state, data.project.version);
      void drain();
    }
  }, [adopt, drain, setSyncStatus]);

  useEffect(() => {
    const saved = load();
    if (saved) rawDispatch({ type: "hydrate", state: saved });
    const j = loadJournal();
    setJournal(j ?? newJournal(saved ?? stateRef.current));
    setHydrated(true);
    const r = window.localStorage.getItem(STORAGE_KEY + ":role") as Role | null;
    if (r) setRoleState(r);
    const m = window.localStorage.getItem(STORAGE_KEY + ":me");
    if (m) setMeIdState(m);
    void pull(true);
    const onFocus = () => { if (document.visibilityState === "visible") void pull(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    const t = setInterval(() => void pull(), 45000);
    return () => { document.removeEventListener("visibilitychange", onFocus); window.removeEventListener("focus", onFocus); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, state }));
      window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
    } catch {
      /* quota or private mode — the app still works, it just will not remember. */
    }
  }, [state, journal, hydrated]);

  const restoreTo = React.useCallback(async (v: number) => {
    // Restoring is itself a change: it lands as a new revision on top, so the
    // history stays linear and nothing that happened is ever erased.
    if (sync.current.mode === "server") {
      const r = await fetch(`/api/project/state?v=${v}`, { cache: "no-store" });
      if (!r.ok) { setSyncStatus({ error: "restore failed" }); return; }
      const { state: target } = (await r.json()) as { state: ProjectState };
      labelRef.current = `Restored the project to how it stood at v${v}`;
      dispatch({ type: "data/import", state: target });
      return;
    }
    labelRef.current = `Restored the project to how it stood at v${v}`;
    dispatch({ type: "data/import", state: stateAt(journal, v) });
  }, [journal, dispatch, setSyncStatus]);

  const unlock = React.useCallback(async (password: string) => {
    const r = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (!r.ok) return false;
    sync.current.locked = false;
    setSyncStatus({ locked: false });
    await pull(true);
    void drain();
    return true;
  }, [pull, drain, setSyncStatus]);

  const setRole = (r: Role) => {
    setRoleState(r);
    try { window.localStorage.setItem(STORAGE_KEY + ":role", r); } catch { /* ignore */ }
  };

  const setMe = (id?: string) => {
    setMeIdState(id);
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY + ":me", id);
      else window.localStorage.removeItem(STORAGE_KEY + ":me");
    } catch { /* ignore */ }
    // Choosing a person also chooses the lens: a contractor sees the contractor view.
    const p = state.people.find((x) => x.id === id);
    if (p) setRole(p.role);
  };

  // Whoever is signed in, by name; otherwise the role, so an unattributed
  // change still says something truthful rather than a fabricated person.
  const person = state.people.find((p) => p.id === meId);
  const me = person?.name ?? (role === "homeowner" ? "Homeowner" : role === "designer" ? "Designer" : "Contractor");
  meRef.current = { me, meId };

  const value = useMemo(
    () => ({ state, dispatch, role, setRole, me, meId, setMe, hydrated, journal, restoreTo, storage, unlock }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, role, hydrated, me, meId, journal, restoreTo, storage, unlock],
  );
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

/**
 * The change history, oldest first, from wherever it is kept: the server
 * when there is one (so everyone's changes appear), otherwise this browser's
 * journal.
 */
export function useRevisions(filter: { itemId?: string; spaceId?: string } = {}): { revisions: Revision[]; startedAt: string; loading: boolean } {
  const { journal, storage } = useProject();
  const [remote, setRemote] = useState<Revision[] | null>(null);
  const [loading, setLoading] = useState(false);
  const server = storage.mode === "server" && !storage.locked;
  const { itemId, spaceId } = filter;
  useEffect(() => {
    if (!server) { setRemote(null); return; }
    let live = true;
    setLoading(true);
    const p = new URLSearchParams();
    if (itemId) p.set("itemId", itemId);
    if (spaceId) p.set("spaceId", spaceId);
    fetch(`/api/project/revisions?${p}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { revisions: [] }))
      .then((d: { revisions: Revision[] }) => { if (live) setRemote(d.revisions.slice().reverse()); })
      .catch(() => { if (live) setRemote([]); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [server, storage.version, itemId, spaceId]);

  if (server) {
    return { revisions: remote ?? [], startedAt: remote?.[0]?.at ?? new Date().toISOString(), loading };
  }
  const local = journal.revisions.filter((r) => (!itemId || r.touches.itemId === itemId) && (!spaceId || r.touches.spaceId === spaceId));
  return { revisions: local, startedAt: journal.startedAt, loading: false };
}

