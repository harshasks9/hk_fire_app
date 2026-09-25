"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProject } from "@/lib/store";
import { forecastOf } from "@/lib/model/derive";
import { inr, computeCost } from "@/lib/model/costing";
import { UNIT_LABEL, type ScopeItem, type FloorId, type Category } from "@/lib/model/types";
import { FLOOR_META } from "@/lib/seed/spaces";
import { StageChip, Empty, Assumed } from "./ui";
import { Icon } from "./Icon";
import { RowActions, EntityLink } from "./Entity";
import { catLabel } from "@/lib/model/categories";

const APPROVED = ["approved", "boq", "quoted", "ordered", "in-transit", "delivered", "installed", "inspected", "complete"];
/** Above this many lines the rooms start folded, so the page stays a page. */
const OPEN_ALL_BELOW = 80;
const OPEN_FIRST = 2;

type FloorFilter = FloorId | "all" | "house";

/**
 * The BOQ.
 *
 * Built automatically from approved scope, hierarchically as Floor → Room →
 * Category → Item. It is editable in place like a spreadsheet — click a rate,
 * type, move on — without looking like one: no grid lines shouting, no
 * cell references, no formula bar.
 */
export function BoqTable({ onOpen }: { onOpen: (i: ScopeItem) => void }) {
  const { state } = useProject();
  const [floor, setFloor] = useState<FloorFilter>("all");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [query, setQuery] = useState("");
  /** Rooms the reader has opened or closed by hand; everything else follows the default. */
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const spaceById = new Map(state.spaces.map((s) => [s.id, s]));
    const q = query.trim().toLowerCase();
    return state.items
      .filter((i) => i.stage !== "not-applicable")
      .filter((i) => (approvedOnly ? APPROVED.includes(i.stage) : true))
      .filter((i) => {
        if (floor === "all") return true;
        if (floor === "house") return !i.spaceId;
        return !!i.spaceId && spaceById.get(i.spaceId)?.floor === floor;
      })
      .filter((i) => {
        if (!q) return true;
        return (
          i.title.toLowerCase().includes(q) ||
          (i.spec ?? "").toLowerCase().includes(q) ||
          (i.spaceId ? spaceById.get(i.spaceId)?.name ?? "" : "house-wide").toLowerCase().includes(q)
        );
      });
  }, [state, floor, approvedOnly, query]);

  // Group Floor → Room → Category.
  const tree = useMemo(() => {
    const spaceById = new Map(state.spaces.map((s) => [s.id, s]));
    const out = new Map<string, Map<string, Map<Category, ScopeItem[]>>>();
    for (const i of rows) {
      const sp = i.spaceId ? spaceById.get(i.spaceId) : undefined;
      const f = sp?.floor ?? "house";
      const roomKey = sp?.id ?? "house";
      if (!out.has(f)) out.set(f, new Map());
      const rooms = out.get(f)!;
      if (!rooms.has(roomKey)) rooms.set(roomKey, new Map());
      const cats = rooms.get(roomKey)!;
      const arr = cats.get(i.category) ?? [];
      arr.push(i);
      cats.set(i.category, arr);
    }
    return out;
  }, [rows, state.spaces]);

  const roomOrder = useMemo(() => Array.from(tree.values()).flatMap((rooms) => Array.from(rooms.keys())), [tree]);
  const openByDefault = (roomKey: string) =>
    rows.length <= OPEN_ALL_BELOW || !!query.trim() || roomOrder.indexOf(roomKey) < OPEN_FIRST;
  const isOpen = (roomKey: string) => toggled[roomKey] ?? openByDefault(roomKey);
  const allOpen = roomOrder.every(isOpen);
  const setAll = (open: boolean) => setToggled(Object.fromEntries(roomOrder.map((k) => [k, open])));

  const total = rows.reduce((a, i) => a + forecastOf(i), 0);
  const filtered = floor !== "all" || !!query.trim();
  const clear = () => { setFloor("all"); setQuery(""); };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end gap-x-4 gap-y-3 mb-5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="input flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:min-w-[200px] sm:max-w-md">
            <Icon name="search" size={16} className="text-ink-3 shrink-0" />
            <input
              className="w-full min-w-0 bg-transparent outline-none" type="search" aria-label="Search the BOQ"
              placeholder="Search lines, specs or rooms" value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="input w-auto" aria-label="Floor" value={floor} onChange={(e) => setFloor(e.target.value as FloorFilter)}>
            <option value="all">Whole villa</option>
            <option value="ground">Ground floor</option>
            <option value="first">First floor</option>
            <option value="second">Second floor</option>
            <option value="outdoor">Outdoor</option>
            <option value="house">House-wide</option>
          </select>
          <div className="flex items-center gap-1.5" role="group" aria-label="Which scope">
            <button className="pill" aria-pressed={approvedOnly} onClick={() => setApprovedOnly(true)}>Approved scope</button>
            <button className="pill" aria-pressed={!approvedOnly} onClick={() => setApprovedOnly(false)}>All scope</button>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-3 lg:block lg:text-right shrink-0">
          <div className="eyebrow">BOQ total · <span className="tnum">{rows.length}</span> lines</div>
          <div className="text-[20px] font-semibold tracking-[-0.02em] lg:mt-0.5">{inr(total)}</div>
        </div>
      </div>

      {!rows.length ? (
        filtered ? (
          <Empty icon="search" title="No lines match."
            hint={approvedOnly ? "Nothing approved matches this floor and search. Clear them, or include scope that is still being decided." : "Nothing matches this floor and search."}
            action={<>
              <button className="btn btn-sm" onClick={clear}>Clear filters</button>
              {approvedOnly && <button className="btn btn-sm" onClick={() => setApprovedOnly(false)}>Include undecided scope</button>}
            </>} />
        ) : approvedOnly ? (
          <Empty icon="sheet" title="Nothing approved yet."
            hint="The BOQ is built from approved scope. Show everything to see the lines that are still being decided."
            action={<button className="btn btn-primary btn-sm" onClick={() => setApprovedOnly(false)}>Show all scope</button>} />
        ) : (
          <Empty icon="sheet" title="No scope in the BOQ."
            hint="Every scope item with a cost appears here, room by room." />
        )
      ) : (
        <>
          {roomOrder.length > 1 && (
            <div className="flex justify-end mb-2 -mt-1">
              <button className="btn btn-ghost btn-sm" onClick={() => setAll(!allOpen)}>
                <Icon name="chevron-down" size={15} className={`transition-transform ${allOpen ? "rotate-180" : ""}`} />
                {allOpen ? "Collapse all rooms" : "Expand all rooms"}
              </button>
            </div>
          )}
          <div className="space-y-8">
            {Array.from(tree.entries()).map(([f, rooms]) => {
              const floorTotal = Array.from(rooms.values()).flatMap((c) => Array.from(c.values()).flat()).reduce((a, i) => a + forecastOf(i), 0);
              return (
                <section key={f}>
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <h3 className="text-[17px]">{f === "house" ? "House-wide" : FLOOR_META[f as FloorId]?.label ?? f}</h3>
                    <span className="tnum text-[14.5px] font-medium">{inr(floorTotal)}</span>
                  </div>
                  <div className="space-y-2.5">
                    {Array.from(rooms.entries()).map(([roomId, cats]) => (
                      <RoomBlock
                        key={roomId}
                        roomId={roomId}
                        name={state.spaces.find((s) => s.id === roomId)?.name ?? "House-wide"}
                        cats={cats}
                        open={isOpen(roomId)}
                        onToggle={() => setToggled((t) => ({ ...t, [roomId]: !isOpen(roomId) }))}
                        onOpen={onOpen}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      <p className="text-[12.5px] text-ink-3 mt-6 leading-relaxed max-w-2xl">
        Every line here is the same object you saw as an idea, an option and a decision —
        the BOQ is a view of the project, not a second copy of it. Edit a quantity or a rate
        and it changes everywhere. Lines with no vendor quote use an{" "}
        <Assumed>indicative rate</Assumed>.
      </p>
    </div>
  );
}

function RoomBlock({
  roomId, name, cats, open, onToggle, onOpen,
}: {
  roomId: string; name: string; cats: Map<Category, ScopeItem[]>; open: boolean; onToggle: () => void;
  onOpen: (i: ScopeItem) => void;
}) {
  const { state } = useProject();
  const all = Array.from(cats.values()).flat();
  const roomTotal = all.reduce((a, i) => a + forecastOf(i), 0);
  const bodyId = `boq-room-${roomId}`;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle} aria-expanded={open} aria-controls={bodyId}
        className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-paper transition-colors ${open ? "border-b border-line bg-paper-2/50" : ""}`}
      >
        <Icon name="chevron-right" size={16} className={`text-ink-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="text-[14.5px] font-semibold min-w-0 flex-1 truncate">{name}</span>
        <span className="text-[13px] text-ink-3 tnum shrink-0 hidden sm:inline">{all.length} line{all.length === 1 ? "" : "s"}</span>
        <span className="tnum text-[14px] font-medium shrink-0">{inr(roomTotal)}</span>
      </button>

      {open && (
        <div id={bodyId}>
          {/* desk: one table per room, categories as sub-heads */}
          <div className="hidden md:block overflow-x-auto thin-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-[36%]">Description</th>
                  <th className="num">Qty</th>
                  <th>Unit</th>
                  <th className="num">Rate</th>
                  <th className="num">Material</th>
                  <th className="num">Labour</th>
                  <th className="num">Tax</th>
                  <th className="num">Total</th>
                  <th className="w-[84px]"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {Array.from(cats.entries()).map(([c, list]) => (
                  <React.Fragment key={c}>
                    <tr>
                      <td colSpan={9} className="!bg-paper/60 !py-2">
                        <span className="eyebrow">{catLabel(state, c)}</span>
                      </td>
                    </tr>
                    {list.map((i) => <BoqRow key={i.id} item={i} onOpen={onOpen} />)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* phone: one card per line */}
          <div className="md:hidden">
            {Array.from(cats.entries()).map(([c, list]) => (
              <div key={c}>
                <div className="px-4 py-2 bg-paper/60 border-b border-line"><span className="eyebrow">{catLabel(state, c)}</span></div>
                <div className="divide-y divide-line border-b border-line last:border-b-0">
                  {list.map((i) => <BoqCard key={i.id} item={i} onOpen={onOpen} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BoqRow({ item, onOpen }: { item: ScopeItem; onOpen: (i: ScopeItem) => void }) {
  const { state, dispatch } = useProject();
  const b = computeCost(item.cost);
  const vendor = state.vendors.find((v) => v.id === item.vendorId);

  return (
    <tr className="group">
      <td>
        <button onClick={() => onOpen(item)} className="text-left w-full group/title">
          <span className="block text-ink font-medium group-hover/title:text-accent-strong group-hover/title:underline underline-offset-2">{item.title}</span>
          {item.spec && <span className="block text-[12.5px] text-ink-3 line-clamp-1 mt-0.5">{item.spec}</span>}
        </button>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
          <StageChip stage={item.stage} />
          {vendor && <span className="text-[12.5px] text-ink-3"><EntityLink on="vendors" id={vendor.id} /></span>}
        </div>
      </td>
      <td className="num">
        <CellNumber value={item.cost.qty} label={`Quantity for ${item.title}`} width={64}
          onChange={(n) => dispatch({ type: "item/cost", id: item.id, cost: { qty: n } })} />
      </td>
      <td className="text-ink-3 text-[13px] whitespace-nowrap">{UNIT_LABEL[item.cost.unit]}</td>
      <td className="num">
        <CellNumber value={item.cost.rate} label={`Rate for ${item.title}`} width={84}
          onChange={(n) => dispatch({ type: "item/cost", id: item.id, cost: { rate: n } })} />
      </td>
      <td className="num text-ink-2 whitespace-nowrap">{inr(b.base + b.wastage, { compact: true })}</td>
      <td className="num text-ink-2 whitespace-nowrap">{b.labour ? inr(b.labour, { compact: true }) : "—"}</td>
      <td className="num text-ink-2 whitespace-nowrap">{b.tax ? inr(b.tax, { compact: true }) : "—"}</td>
      <td className="num font-semibold whitespace-nowrap">{inr(forecastOf(item))}</td>
      <td className="text-right"><RowActions on="items" id={item.id} /></td>
    </tr>
  );
}

function BoqCard({ item, onOpen }: { item: ScopeItem; onOpen: (i: ScopeItem) => void }) {
  const { dispatch } = useProject();
  return (
    <div className="px-4 py-3.5 group">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <button onClick={() => onOpen(item)} className="text-left block w-full">
            <span className="block text-[14.5px] font-medium leading-snug">{item.title}</span>
            {item.spec && <span className="block text-[13px] text-ink-3 line-clamp-2 mt-0.5">{item.spec}</span>}
          </button>
          <div className="mt-1.5"><StageChip stage={item.stage} /></div>
        </div>
        <span className="tnum text-[14.5px] font-semibold shrink-0">{inr(forecastOf(item), { compact: true })}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[13px] text-ink-3">
        <CellNumber value={item.cost.qty} label={`Quantity for ${item.title}`} width={60} boxed
          onChange={(n) => dispatch({ type: "item/cost", id: item.id, cost: { qty: n } })} />
        <span className="whitespace-nowrap">{UNIT_LABEL[item.cost.unit]} ×</span>
        <CellNumber value={item.cost.rate} label={`Rate for ${item.title}`} width={88} boxed
          onChange={(n) => dispatch({ type: "item/cost", id: item.id, cost: { rate: n } })} />
        <RowActions on="items" id={item.id} className="ml-auto" />
      </div>
    </div>
  );
}

/**
 * A number typed straight into a cell. Keeps what you type (so "12." and an
 * empty cell are allowed on the way to a number) and reports numbers only.
 * Local to the BOQ: the shared NumberInput is a full form control.
 */
function CellNumber({
  value, onChange, label, width, boxed,
}: { value: number; onChange: (n: number) => void; label: string; width: number; boxed?: boolean }) {
  const [text, setText] = useState(String(value ?? ""));
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) { last.current = value; setText(String(value ?? "")); }
  }, [value]);
  return (
    <input
      inputMode="decimal" aria-label={label} value={text}
      style={{ width }}
      className={`text-right tnum rounded-md px-1.5 py-1 outline-none focus:bg-card focus:ring-2 focus:ring-accent/40 ${boxed ? "border border-line-2 bg-card text-ink min-h-[36px]" : "bg-transparent hover:bg-paper-2 -my-1"}`}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = parseFloat(t);
        if (!Number.isNaN(n)) { last.current = n; onChange(n); }
        else if (t === "") { last.current = 0; onChange(0); }
      }}
      onBlur={() => setText(String(last.current ?? ""))}
    />
  );
}
