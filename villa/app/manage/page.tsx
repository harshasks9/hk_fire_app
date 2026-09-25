"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, newId, type CollectionKey } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import { FLOOR_META } from "@/lib/seed/spaces";
import { SCOPE_TEMPLATES } from "@/lib/seed/scope-templates";
import { buildUpFromCategory } from "@/lib/model/categories";
import { rollup, itemsForFloor, itemsForSpace, houseWideItems } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import type { FloorId, Space, ScopeItem, SpaceKind } from "@/lib/model/types";
import { PageTitle, Tabs, Sheet, Field, NumberInput, useToast, fmtDate } from "@/components/ui";
import { Icon } from "@/components/Icon";
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
  // /manage?settings=1 opens the project settings — Home links here to set the budget.
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("settings")) setShowMeta(true);
  }, []);

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

  const room = roomFilter ? state.spaces.find((s) => s.id === roomFilter) : undefined;

  return (
    <div>
      <PageTitle
        title="Manage"
        sub="Create, edit and delete anything in the project, floor by floor. Deleting something also cleans up whatever pointed at it."
        right={
          <button className="btn" onClick={() => setShowMeta(true)}>
            <Icon name="admin" size={16} /> Project settings
          </button>
        }
      />

      {/* ------------------------------------------------------ floor rail */}
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Floor">
        {SCOPES.map((s) => {
          const on = s.id === scope;
          const n = s.id === "house"
            ? houseWideItems(state).length
            : state.spaces.filter((x) => x.floor === s.id).length;
          return (
            <button
              key={s.id}
              aria-pressed={on}
              onClick={() => { setScope(s.id); setRoomFilter(""); }}
              className="pill"
              title={s.id === "house" ? `${n} house-wide scope items` : `${n} rooms`}
            >
              {s.label}
              <span className="count">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-5 text-[13.5px] text-ink-3">
        <span><strong className="text-ink font-semibold tnum">{r.live}</strong> scope items</span>
        <span><strong className="text-ink font-semibold tnum">{inr(r.forecast, { compact: true })}</strong> forecast</span>
        <span><strong className="text-ink font-semibold tnum">{Math.round(r.completionPct)}%</strong> complete</span>
        {r.notApplicable > 0 && <span><span className="tnum">{r.notApplicable}</span> not applicable</span>}
        {r.decisionsOutstanding > 0 && (
          <Link href="/decisions" className="inline-flex items-center gap-1.5 text-warn font-medium hover:underline">
            <Icon name="decisions" size={15} />
            <span className="tnum">{r.decisionsOutstanding}</span> awaiting a decision
          </Link>
        )}
      </div>

      {/* ------------------------------------------------------ room filter */}
      {!isHouse && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <select
            className="input w-auto flex-1 min-w-[200px] sm:max-w-[360px]"
            aria-label="Room"
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
          {room && (
            <>
              <Link href={`/villa/${room.id}`} className="btn btn-sm">
                <Icon name="open" size={15} /> Open {room.name}
              </Link>
              <button className="btn btn-sm" onClick={() => setMerge(room)}>
                <Icon name="compare" size={15} /> Combine…
              </button>
            </>
          )}
          <button className="btn btn-sm sm:ml-auto" onClick={() => setAddSpace(true)} title="A new room, born with the checklist its kind implies">
            <Icon name="plus" size={15} strokeWidth={2} /> Add a room with its checklist
          </button>
        </div>
      )}

      <Tabs
        tabs={groups.map((g) => g.label)}
        active={group.label}
        label="Kind of record"
        onChange={(label) => {
          const g = groups.find((x) => x.label === label);
          if (g) setTab(g.keys[0]);
        }}
      />

      {group.keys.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label={group.label}>
          {group.keys.map((k) => (
            <button key={k} onClick={() => setTab(k)} className="pill" aria-pressed={k === activeTab}>
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
      {merge && <MergeSpace from={merge} onClose={() => setMerge(null)} onDone={() => { setMerge(null); setRoomFilter(""); }} />}
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
  const toast = useToast();
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [kind, setKind] = useState<SpaceKind>("bedroom");
  const [withScope, setWithScope] = useState(true);
  const [wFt, setWFt] = useState(0); const [wIn, setWIn] = useState(0);
  const [lFt, setLFt] = useState(0); const [lIn, setLIn] = useState(0);

  const template = SCOPE_TEMPLATES[kind] ?? [];
  const floorName = FLOOR_META[floor].label.toLowerCase();

  const create = () => {
    setTried(true);
    if (!name.trim()) return;
    const id = newId("space");
    const space: Space = {
      id, name: name.trim(), floor, kind,
      dims: wFt || lFt ? { widthFt: wFt, widthIn: wIn, lengthFt: lFt, lengthIn: lIn, source: "site-measured" } : undefined,
    };
    dispatch({ type: "create", on: "spaces", row: space });
    const n = withScope ? template.length : 0;
    if (withScope) {
      template.forEach((t, i) => {
        const item: ScopeItem = {
          id: `${id}--${i}`,
          title: t.title,
          spaceId: id,
          category: t.category,
          stage: "not-started",
          spec: t.spec,
          cost: buildUpFromCategory(state, t.category, space, t.qty),
          ladder: {},
          tags: t.critical ? ["critical"] : [],
        };
        if (t.unit) item.cost.unit = t.unit;
        dispatch({ type: "create", on: "items", row: item });
      });
    }
    toast(n ? `${space.name} added with ${n} scope items` : `${space.name} added`);
    onClose();
  };

  return (
    <Sheet
      open onClose={onClose} title={`Add a room to the ${floorName}`}
      description="A new room arrives with the checklist its kind implies, like every room from the drawings."
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={create}>
            <Icon name="plus" size={15} strokeWidth={2} /> Add room{withScope && template.length ? ` and ${template.length} items` : ""}
          </button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <Field label="Name" required error={tried && !name.trim() ? "Give the room a name, like “Guest bedroom”." : undefined}>
          <input
            className="input" value={name} onChange={(e) => setName(e.target.value)} data-autofocus
            aria-invalid={tried && !name.trim()} placeholder="Guest bedroom, store, pooja niche…"
          />
        </Field>
        <Field label="Kind" hint="Decides which checklist the room starts with.">
          <select className="input capitalize" value={kind} onChange={(e) => setKind(e.target.value as SpaceKind)}>
            {Object.keys(SCOPE_TEMPLATES).map((k) => (
              <option key={k} value={k}>{k.replace(/-/g, " ")}</option>
            ))}
          </select>
        </Field>
        <fieldset>
          <legend className="text-[13px] font-semibold text-ink-2 mb-1.5">Size</legend>
          <div className="grid grid-cols-2 gap-3">
            <FtIn label="Width" ft={wFt} inch={wIn} onFt={setWFt} onIn={setWIn} />
            <FtIn label="Length" ft={lFt} inch={lIn} onFt={setLFt} onIn={setLIn} />
          </div>
          <p className="text-[13px] text-ink-3 mt-2 leading-relaxed">
            Leave at zero if it has not been measured — quantities then start at 1. Anything entered is
            recorded as a site measurement, not a plan dimension.
          </p>
        </fieldset>
        <label className="flex items-start gap-2.5 text-[14px] cursor-pointer rounded-lg bg-paper-2 px-3.5 py-3">
          <input type="checkbox" checked={withScope} onChange={(e) => setWithScope(e.target.checked)} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Start it with a scope checklist</span>
            <span className="block text-[13px] text-ink-3 mt-0.5">
              {template.length} items for a {kind.replace(/-/g, " ")}, so the new room is not a blank page.
            </span>
          </span>
        </label>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Sheet>
  );
}

function FtIn({
  label, ft, inch, onFt, onIn,
}: { label: string; ft: number; inch: number; onFt: (n: number) => void; onIn: (n: number) => void }) {
  return (
    <div>
      <div className="text-[13px] text-ink-3 mb-1">{label}</div>
      <div className="flex gap-1.5">
        <NumberInput value={ft} onChange={onFt} suffix="ft" className="flex-1 min-w-0" />
        <NumberInput value={inch} onChange={onIn} suffix="in" className="flex-1 min-w-0" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- combine spaces */

function MergeSpace({ from, onClose, onDone }: { from: Space; onClose: () => void; onDone: () => void }) {
  const { state, dispatch } = useProject();
  const toast = useToast();
  const [into, setInto] = useState("");
  const candidates = state.spaces.filter((s) => s.id !== from.id);
  const moving = itemsForSpace(state, from.id).length;
  const target = state.spaces.find((s) => s.id === into);

  return (
    <Sheet
      open onClose={onClose} title={`Combine ${from.name} into another space`}
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!into}
            onClick={() => {
              dispatch({ type: "space/merge", fromId: from.id, intoId: into });
              toast(`${from.name} combined into ${target?.name ?? "the chosen space"}`);
              onDone();
            }}
          >
            {target ? `Combine into ${target.name}` : "Combine"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-[14.5px] text-ink-2 leading-relaxed">
          Everything belonging to <strong className="font-semibold text-ink">{from.name}</strong> — {moving} scope
          item{moving === 1 ? "" : "s"}, plus its tasks, snags, site updates, notes and documents — moves to
          the space you choose. {from.name} itself is then removed; nothing else is deleted.
        </p>
        <Field label="Combine into">
          <select className="input" value={into} onChange={(e) => setInto(e.target.value)}>
            <option value="">Choose a space…</option>
            {candidates.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {FLOOR_META[s.floor].label}</option>
            ))}
          </select>
        </Field>
      </div>
    </Sheet>
  );
}

/* -------------------------------------------------------- project settings */

/**
 * The project's own facts. Budget comes first because it is what people come
 * here for — Home's "Set the budget" lands straight on it.
 */
function ProjectSettings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useProject();
  const m = state.meta;
  const set = (patch: Partial<typeof m>) => dispatch({ type: "meta/patch", patch });
  // A cleared date field must not blank the project's dates.
  const setDate = (key: "startDate" | "targetHandover" | "lastOwnerVisit", v: string) => {
    if (!v) return;
    const d = new Date(v);
    if (!Number.isNaN(+d)) set({ [key]: d.toISOString() });
  };
  const contingency = m.originalBudget * (m.contingencyPct / 100);

  return (
    <Sheet
      open onClose={onClose} title="Project settings" wide
      description="Changes save as you type."
      footer={
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      }
    >
      <div className="space-y-7">
        <section aria-labelledby="ps-money">
          <h3 id="ps-money" className="eyebrow mb-3">Budget</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Budget"
              hint={m.originalBudget
                ? `${inr(m.originalBudget)} — Home and Costs measure everything against this.`
                : "Not set yet. Home and Costs measure everything against this."}
            >
              <NumberInput id="ps-budget" value={m.originalBudget || undefined} onChange={(n) => set({ originalBudget: n })} prefix="₹" />
            </Field>
            <Field
              label="Contingency"
              hint={m.originalBudget ? `${inr(contingency, { compact: true })} held back for surprises.` : "A share of the budget held back for surprises."}
            >
              <NumberInput value={m.contingencyPct} onChange={(n) => set({ contingencyPct: n })} suffix="% of budget" />
            </Field>
          </div>
        </section>

        <section aria-labelledby="ps-dates">
          <h3 id="ps-dates" className="eyebrow mb-3">Dates</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start date">
              <input type="date" className="input" value={m.startDate.slice(0, 10)} onChange={(e) => setDate("startDate", e.target.value)} />
            </Field>
            <Field label="Target handover" hint={`Currently ${fmtDate(m.targetHandover)}.`}>
              <input type="date" className="input" value={m.targetHandover.slice(0, 10)} onChange={(e) => setDate("targetHandover", e.target.value)} />
            </Field>
            <Field label="Last owner visit" hint="Home lists everything that changed since this date.">
              <input type="date" className="input" value={m.lastOwnerVisit.slice(0, 10)} onChange={(e) => setDate("lastOwnerVisit", e.target.value)} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="ps-site">
          <h3 id="ps-site" className="eyebrow mb-3">The project</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Project name">
              <input className="input" value={m.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Address">
              <input className="input" value={m.address} onChange={(e) => set({ address: e.target.value })} />
            </Field>
            <Field label="Plot width">
              <NumberInput value={m.plotWidthFt} onChange={(n) => set({ plotWidthFt: n })} suffix="ft" />
            </Field>
            <Field label="Plot depth">
              <NumberInput value={m.plotDepthFt} onChange={(n) => set({ plotDepthFt: n })} suffix="ft" />
            </Field>
          </div>
        </section>

        <p className="text-[13px] text-ink-3 leading-relaxed">
          To start over, go to <Link href="/admin?tab=Danger%20zone" className="link">Settings → Danger zone</Link>.
          Every change here is also in <Link href="/history" className="link">History</Link>.
        </p>
      </div>
    </Sheet>
  );
}
