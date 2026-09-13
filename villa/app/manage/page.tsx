"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, newId, type CollectionKey } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import { FLOOR_META } from "@/lib/seed/spaces";
import { SCOPE_TEMPLATES } from "@/lib/seed/scope-templates";
import { seedBuildUp } from "@/lib/model/costing";
import { rollup, itemsForFloor, itemsForSpace, houseWideItems } from "@/lib/model/derive";
import { inr, dimsLabel, areaSqft } from "@/lib/model/costing";
import type { FloorId, Space, ScopeItem, SpaceKind } from "@/lib/model/types";
import { PageTitle, Eyebrow, Tabs, Sheet, Field } from "@/components/ui";
import { EntityEditor } from "@/components/EntityEditor";

type Scope = FloorId | "house";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "outdoor", label: "Outdoor" },
  { id: "ground", label: "Ground floor" },
  { id: "first", label: "First floor" },
  { id: "second", label: "Second floor" },
  { id: "house", label: "House-wide" },
];

/**
 * Sixteen collections is the truth of the model, but it is not a usable menu.
 * They are grouped into five headings that match how people actually think
 * about a room — what it is, what it needs, what is being decided, what is
 * happening on site, and what has been written down.
 */
interface Group { label: string; keys: CollectionKey[] }

const FLOOR_GROUPS: Group[] = [
  { label: "Spaces", keys: ["spaces"] },
  { label: "Scope", keys: ["items"] },
  { label: "Design", keys: ["ideas", "options", "decisions"] },
  { label: "Site", keys: ["tasks", "snags", "siteUpdates"] },
  { label: "Records", keys: ["notes", "docs", "comments"] },
];

const GLOBAL_GROUPS: Group[] = [
  { label: "Scope", keys: ["items"] },
  { label: "Vendors", keys: ["vendors", "quotations"] },
  { label: "Money", keys: ["payments"] },
  { label: "Records", keys: ["docs", "notes", "comments"] },
  { label: "Team", keys: ["people", "scenarios"] },
];

/**
 * The editing console.
 *
 * Everything in the project, reachable floor by floor. The floor rail narrows
 * the whole screen at once — pick First Floor and every tab below shows only
 * what belongs to it — because "edit the villa" is almost always really "edit
 * this part of the villa".
 */
export default function ManagePage() {
  const { state, dispatch, me } = useProject();
  const [scope, setScope] = useState<Scope>("ground");
  const [tab, setTab] = useState<CollectionKey>("spaces");
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [addSpace, setAddSpace] = useState(false);
  const [merge, setMerge] = useState<Space | null>(null);
  const [showMeta, setShowMeta] = useState(false);

  const isHouse = scope === "house";
  const groups = isHouse ? GLOBAL_GROUPS : FLOOR_GROUPS;
  const group = groups.find((g) => g.keys.includes(tab)) ?? groups[0];
  const activeTab = group.keys.includes(tab) ? tab : group.keys[0];

  const floorSpaces = useMemo(
    () => (isHouse ? [] : state.spaces.filter((s) => s.floor === scope)),
    [state.spaces, scope, isHouse],
  );
  const spaceIds = useMemo(() => new Set(floorSpaces.map((s) => s.id)), [floorSpaces]);
  const inRoom = (id?: string) => (roomFilter ? id === roomFilter : id !== undefined && spaceIds.has(id));

  const scopedItems = useMemo(() => {
    if (isHouse) return houseWideItems(state);
    return state.items.filter((i) => inRoom(i.spaceId));
  }, [state, scope, roomFilter, isHouse, spaceIds]);
  const itemIds = useMemo(() => new Set(scopedItems.map((i) => i.id)), [scopedItems]);

  /** Rows for the active tab, already narrowed to the chosen floor and room. */
  const rows = useMemo((): Record<string, unknown>[] => {
    const byItem = <T extends { scopeItemId?: string }>(list: T[]) =>
      list.filter((x) => (x.scopeItemId ? itemIds.has(x.scopeItemId) : isHouse));
    switch (activeTab) {
      case "spaces": return floorSpaces as unknown as Record<string, unknown>[];
      case "items": return scopedItems as unknown as Record<string, unknown>[];
      case "ideas": return byItem(state.ideas) as unknown as Record<string, unknown>[];
      case "options": return byItem(state.options) as unknown as Record<string, unknown>[];
      case "decisions": return byItem(state.decisions) as unknown as Record<string, unknown>[];
      case "tasks":
        return (isHouse
          ? state.tasks.filter((t) => !t.spaceId)
          : state.tasks.filter((t) => inRoom(t.spaceId) || (t.scopeItemId && itemIds.has(t.scopeItemId)))
        ) as unknown as Record<string, unknown>[];
      case "snags":
        return (isHouse ? [] : state.snags.filter((s) => inRoom(s.spaceId))) as unknown as Record<string, unknown>[];
      case "siteUpdates":
        return (isHouse ? [] : state.siteUpdates.filter((u) => inRoom(u.spaceId))) as unknown as Record<string, unknown>[];
      case "notes":
        return (isHouse
          ? state.notes.filter((n) => !n.spaceIds.length)
          : state.notes.filter((n) => n.spaceIds.some((x) => (roomFilter ? x === roomFilter : spaceIds.has(x))))
        ) as unknown as Record<string, unknown>[];
      case "docs":
        return (isHouse
          ? state.docs.filter((d) => !d.spaceIds.length)
          : state.docs.filter((d) => d.spaceIds.some((x) => (roomFilter ? x === roomFilter : spaceIds.has(x))))
        ) as unknown as Record<string, unknown>[];
      case "comments": {
        const ideaIds = new Set(state.ideas.filter((x) => itemIds.has(x.scopeItemId)).map((x) => x.id));
        const optIds = new Set(state.options.filter((x) => itemIds.has(x.scopeItemId)).map((x) => x.id));
        const decIds = new Set(state.decisions.filter((x) => itemIds.has(x.scopeItemId)).map((x) => x.id));
        return state.comments.filter((c) =>
          (c.targetType === "item" && itemIds.has(c.targetId)) ||
          (c.targetType === "idea" && ideaIds.has(c.targetId)) ||
          (c.targetType === "option" && optIds.has(c.targetId)) ||
          (c.targetType === "decision" && decIds.has(c.targetId)),
        ) as unknown as Record<string, unknown>[];
      }
      case "vendors": return state.vendors as unknown as Record<string, unknown>[];
      case "quotations": return state.quotations as unknown as Record<string, unknown>[];
      case "payments": return state.payments as unknown as Record<string, unknown>[];
      case "people": return state.people as unknown as Record<string, unknown>[];
      case "scenarios": return state.scenarios as unknown as Record<string, unknown>[];
      default: return [];
    }
  }, [activeTab, state, floorSpaces, scopedItems, itemIds, spaceIds, roomFilter, isHouse]);

  const r = isHouse
    ? rollup(houseWideItems(state), state.decisions)
    : rollup(itemsForFloor(state, scope as FloorId), state.decisions);

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Manage</div>
      <PageTitle
        title="Manage the project"
        sub="Everything in the villa, floor by floor. Deleting cleans up whatever pointed at it."
        right={<button className="btn" onClick={() => setShowMeta(true)}>Project settings</button>}
      />

      {/* ------------------------------------------------------ floor rail */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SCOPES.map((s) => {
          const on = s.id === scope;
          const n = s.id === "house"
            ? houseWideItems(state).length
            : state.spaces.filter((x) => x.floor === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => { setScope(s.id); setRoomFilter(""); }}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium border transition-colors"
              style={{
                background: on ? "var(--color-ink)" : "var(--color-card)",
                color: on ? "var(--color-paper)" : "var(--color-ink-2)",
                borderColor: on ? "var(--color-ink)" : "var(--color-line)",
              }}
            >
              {s.label}
              <span className="ml-1.5 tnum text-[11px] opacity-65">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5 text-[12.5px] text-ink-3">
        <span className="tnum"><strong className="text-ink font-medium">{r.live}</strong> scope items</span>
        <span className="tnum"><strong className="text-ink font-medium">{inr(r.forecast, { compact: true })}</strong> forecast</span>
        <span className="tnum"><strong className="text-ink font-medium">{Math.round(r.completionPct)}%</strong> complete</span>
        {r.notApplicable > 0 && <span className="tnum">{r.notApplicable} not applicable</span>}
        {r.decisionsOutstanding > 0 && (
          <span className="tnum" style={{ color: "#9c5333" }}>{r.decisionsOutstanding} awaiting decision</span>
        )}
      </div>

      {/* ------------------------------------------------------ room filter */}
      {!isHouse && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            className="input w-auto flex-1 min-w-[190px]"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">All {floorSpaces.length} rooms on this floor</option>
            {floorSpaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {itemsForSpace(state, s.id).length} items
              </option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={() => setAddSpace(true)}>Add a space</button>
          {roomFilter && (
            <>
              <Link href={`/villa/${roomFilter}`} className="btn btn-sm">Open workspace</Link>
              <button className="btn btn-sm" onClick={() => setMerge(state.spaces.find((s) => s.id === roomFilter) ?? null)}>
                Combine
              </button>
            </>
          )}
        </div>
      )}

      <Tabs
        tabs={groups.map((g) => g.label)}
        active={group.label}
        onChange={(label) => {
          const g = groups.find((x) => x.label === label);
          if (g) setTab(g.keys[0]);
        }}
      />

      {group.keys.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {group.keys.map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="chip"
              style={{
                background: k === activeTab ? "#f2e2d9" : "#f4f1ec",
                color: k === activeTab ? "#9c5333" : "#857b70",
              }}
            >
              {SCHEMAS[k].label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        <EntityEditor
          collection={activeTab}
          rows={rows}
          spaceId={roomFilter || (isHouse ? undefined : floorSpaces[0]?.id)}
        />
      </div>

      {addSpace && <AddSpace floor={scope as FloorId} onClose={() => setAddSpace(false)} />}
      {merge && <MergeSpace from={merge} onClose={() => { setMerge(null); setRoomFilter(""); }} />}
      {showMeta && <ProjectSettings onClose={() => setShowMeta(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------ add a space */

/**
 * Creating a space is not just a row: a new room should arrive carrying the
 * checklist its kind implies, exactly as the seeded rooms did.
 */
function AddSpace({ floor, onClose }: { floor: FloorId; onClose: () => void }) {
  const { state, dispatch } = useProject();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SpaceKind>("bedroom");
  const [withScope, setWithScope] = useState(true);
  const [wFt, setWFt] = useState(0); const [wIn, setWIn] = useState(0);
  const [lFt, setLFt] = useState(0); const [lIn, setLIn] = useState(0);

  const template = SCOPE_TEMPLATES[kind] ?? [];

  const create = () => {
    if (!name.trim()) return;
    const id = newId("space");
    const space: Space = {
      id, name: name.trim(), floor, kind,
      dims: wFt || lFt ? { widthFt: wFt, widthIn: wIn, lengthFt: lFt, lengthIn: lIn, source: "site-measured" } : undefined,
    };
    dispatch({ type: "create", on: "spaces", row: space });
    if (withScope) {
      template.forEach((t, n) => {
        const item: ScopeItem = {
          id: `${id}--${n}`,
          title: t.title,
          spaceId: id,
          category: t.category,
          stage: "not-started",
          spec: t.spec,
          cost: seedBuildUp(t.category, space, t.qty),
          ladder: {},
          tags: t.critical ? ["critical"] : [],
        };
        if (t.unit) item.cost.unit = t.unit;
        dispatch({ type: "create", on: "items", row: item });
      });
    }
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`Add a space to the ${FLOOR_META[floor].label.toLowerCase()}`}>
      <div className="space-y-4">
        <Field label="Name *">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Guest bedroom, store, pooja niche…" />
        </Field>
        <Field label="Kind" hint="This decides which checklist the room is born with.">
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as SpaceKind)}>
            {Object.keys(SCOPE_TEMPLATES).map((k) => (
              <option key={k} value={k}>{k.replace(/-/g, " ")}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Width ft"><input className="input tnum" type="number" value={wFt} onChange={(e) => setWFt(+e.target.value)} /></Field>
          <Field label="in"><input className="input tnum" type="number" value={wIn} onChange={(e) => setWIn(+e.target.value)} /></Field>
          <Field label="Length ft"><input className="input tnum" type="number" value={lFt} onChange={(e) => setLFt(+e.target.value)} /></Field>
          <Field label="in"><input className="input tnum" type="number" value={lIn} onChange={(e) => setLIn(+e.target.value)} /></Field>
        </div>
        <p className="text-[11.5px] text-ink-3 leading-relaxed">
          Leave the dimensions at zero if you have not measured it. They will be recorded as a site
          measurement rather than a plan dimension, and quantities will start at 1.
        </p>
        <label className="flex items-start gap-2.5 text-[13px] cursor-pointer">
          <input type="checkbox" checked={withScope} onChange={(e) => setWithScope(e.target.checked)} className="mt-0.5" />
          <span>
            Pre-populate its scope checklist
            <span className="block text-[11.5px] text-ink-3">
              {template.length} items for a {kind.replace(/-/g, " ")}, so the new room is not a blank page either.
            </span>
          </span>
        </label>
        <button className="btn btn-accent w-full justify-center" onClick={create} disabled={!name.trim()}>
          Create space{withScope && template.length ? ` and ${template.length} scope items` : ""}
        </button>
      </div>
    </Sheet>
  );
}

/* --------------------------------------------------------- combine spaces */

function MergeSpace({ from, onClose }: { from: Space; onClose: () => void }) {
  const { state, dispatch } = useProject();
  const [into, setInto] = useState("");
  const candidates = state.spaces.filter((s) => s.id !== from.id);
  const moving = itemsForSpace(state, from.id).length;

  return (
    <Sheet open onClose={onClose} title={`Combine ${from.name} into another space`}>
      <p className="text-[13px] text-ink-2 leading-relaxed mb-4">
        Everything belonging to <strong className="font-medium">{from.name}</strong> — {moving} scope
        item{moving === 1 ? "" : "s"}, plus its tasks, snags, site updates, notes and documents — moves to
        the space you choose. {from.name} is then removed. Nothing is deleted.
      </p>
      <Field label="Combine into">
        <select className="input" value={into} onChange={(e) => setInto(e.target.value)}>
          <option value="">Choose a space…</option>
          {candidates.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {FLOOR_META[s.floor].label}</option>
          ))}
        </select>
      </Field>
      <button
        className="btn btn-accent w-full justify-center mt-4"
        disabled={!into}
        onClick={() => { dispatch({ type: "space/merge", fromId: from.id, intoId: into }); onClose(); }}
      >
        Combine
      </button>
    </Sheet>
  );
}

/* -------------------------------------------------------- project settings */

function ProjectSettings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useProject();
  const m = state.meta;
  const set = (patch: Partial<typeof m>) => dispatch({ type: "meta/patch", patch });

  return (
    <Sheet open onClose={onClose} title="Project settings" wide>
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="Project name">
          <input className="input" value={m.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Address">
          <input className="input" value={m.address} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        <Field label="Plot width (ft)">
          <input className="input tnum" type="number" value={m.plotWidthFt} onChange={(e) => set({ plotWidthFt: +e.target.value })} />
        </Field>
        <Field label="Plot depth (ft)">
          <input className="input tnum" type="number" value={m.plotDepthFt} onChange={(e) => set({ plotDepthFt: +e.target.value })} />
        </Field>
        <Field label="Start date">
          <input type="date" className="input" value={m.startDate.slice(0, 10)}
            onChange={(e) => set({ startDate: new Date(e.target.value).toISOString() })} />
        </Field>
        <Field label="Target handover">
          <input type="date" className="input" value={m.targetHandover.slice(0, 10)}
            onChange={(e) => set({ targetHandover: new Date(e.target.value).toISOString() })} />
        </Field>
        <Field label="Original budget" hint="Everything on the dashboard is measured against this.">
          <input className="input tnum" type="number" value={m.originalBudget}
            onChange={(e) => set({ originalBudget: +e.target.value })} />
        </Field>
        <Field label="Contingency %">
          <input className="input tnum" type="number" value={m.contingencyPct}
            onChange={(e) => set({ contingencyPct: +e.target.value })} />
        </Field>
        <Field label="Last owner visit" hint="Drives the “since you were last here” list on the dashboard.">
          <input type="date" className="input" value={m.lastOwnerVisit.slice(0, 10)}
            onChange={(e) => set({ lastOwnerVisit: new Date(e.target.value).toISOString() })} />
        </Field>
      </div>
      <p className="text-[11.5px] text-ink-3 mt-4 leading-relaxed">
        Changes save as you type and persist in this browser. “Reset to seeded project” under More
        puts everything back.
      </p>
    </Sheet>
  );
}
