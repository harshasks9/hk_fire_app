"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { forecastOf } from "@/lib/model/derive";
import { inr, computeCost } from "@/lib/model/costing";
import { CATEGORY_LABEL, UNIT_LABEL, type ScopeItem, type FloorId } from "@/lib/model/types";
import { FLOOR_META } from "@/lib/seed/spaces";
import { Eyebrow, StageChip, Chip, NumberInput, Empty, Assumed } from "./ui";
import { RowActions, EntityLink } from "./Entity";
import { catLabel } from "@/lib/model/categories";

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
  const [floor, setFloor] = useState<FloorId | "all" | "house">("all");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [query, setQuery] = useState("");

  const APPROVED = ["approved", "boq", "quoted", "ordered", "in-transit", "delivered", "installed", "inspected", "complete"];

  const rows = useMemo(() => {
    const spaceById = new Map(state.spaces.map((s) => [s.id, s]));
    return state.items
      .filter((i) => i.stage !== "not-applicable")
      .filter((i) => (approvedOnly ? APPROVED.includes(i.stage) : true))
      .filter((i) => {
        if (floor === "all") return true;
        if (floor === "house") return !i.spaceId;
        return i.spaceId && spaceById.get(i.spaceId)?.floor === floor;
      })
      .filter((i) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
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
    const out = new Map<string, Map<string, Map<string, ScopeItem[]>>>();
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

  const total = rows.reduce((a, i) => a + forecastOf(i), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="input w-auto" value={floor} onChange={(e) => setFloor(e.target.value as any)}>
          <option value="all">Whole villa</option>
          <option value="ground">Ground floor</option>
          <option value="first">First floor</option>
          <option value="second">Second floor</option>
          <option value="outdoor">Outdoor</option>
          <option value="house">House-wide</option>
        </select>
        <input className="input w-auto flex-1 min-w-[180px]" placeholder="Filter lines…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="flex items-center gap-2 text-[12.5px] text-ink-2 cursor-pointer">
          <input type="checkbox" checked={approvedOnly} onChange={(e) => setApprovedOnly(e.target.checked)} />
          Approved scope only
        </label>
        <div className="ml-auto text-right">
          <div className="eyebrow">BOQ total</div>
          <div className="tnum text-[18px]" style={{ fontFamily: "var(--font-display)" }}>{inr(total)}</div>
        </div>
      </div>

      {!rows.length && (
        <Empty
          title="Nothing in the BOQ for this filter."
          hint={approvedOnly ? "The BOQ is built from approved scope. Untick the filter to see everything that is still being decided." : undefined}
        />
      )}

      <div className="space-y-5">
        {Array.from(tree.entries()).map(([f, rooms]) => {
          const floorTotal = Array.from(rooms.values()).flatMap((c) => Array.from(c.values()).flat()).reduce((a, i) => a + forecastOf(i), 0);
          return (
            <div key={f}>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-[16px]">{f === "house" ? "House-wide" : FLOOR_META[f]?.label ?? f}</h3>
                <span className="tnum text-[13.5px]">{inr(floorTotal)}</span>
              </div>
              <div className="space-y-3">
                {Array.from(rooms.entries()).map(([roomId, cats]) => {
                  const room = state.spaces.find((s) => s.id === roomId);
                  const roomTotal = Array.from(cats.values()).flat().reduce((a, i) => a + forecastOf(i), 0);
                  return (
                    <div key={roomId} className="card overflow-hidden">
                      <div className="px-4 py-2.5 bg-paper-2/70 flex items-baseline justify-between border-b border-line">
                        <span className="text-[13px] font-medium">{room?.name ?? "House-wide"}</span>
                        <span className="tnum text-[12.5px]">{inr(roomTotal)}</span>
                      </div>
                      {Array.from(cats.entries()).map(([c, list]) => (
                        <div key={c}>
                          <div className="px-4 pt-2.5 pb-1">
                            <Eyebrow>{catLabel(state, c as keyof typeof CATEGORY_LABEL)}</Eyebrow>
                          </div>
                          <div className="overflow-x-auto thin-scroll">
                            <table className="w-full text-[12.5px] min-w-[700px]">
                              <thead>
                                <tr className="text-ink-3 text-[10.5px] uppercase tracking-wider">
                                  <th className="text-left font-medium px-4 py-1.5 w-[34%]">Description</th>
                                  <th className="text-right font-medium px-2 py-1.5">Qty</th>
                                  <th className="text-left font-medium px-2 py-1.5">Unit</th>
                                  <th className="text-right font-medium px-2 py-1.5">Rate</th>
                                  <th className="text-right font-medium px-2 py-1.5">Material</th>
                                  <th className="text-right font-medium px-2 py-1.5">Labour</th>
                                  <th className="text-right font-medium px-2 py-1.5">Tax</th>
                                  <th className="text-right font-medium px-4 py-1.5">Total</th>
                                  <th className="w-[86px]" />
                                </tr>
                              </thead>
                              <tbody>
                                {list.map((i) => <BoqRow key={i.id} item={i} onOpen={onOpen} />)}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11.5px] text-ink-3 mt-5 leading-relaxed max-w-2xl">
        Every line here is the same object you saw as an idea, an option and a decision —
        the BOQ is a view of the project, not a second copy of it. Edit a quantity or a rate
        and it changes everywhere. Lines with no vendor quote use an{" "}
        <Assumed>indicative rate</Assumed>.
      </p>
    </div>
  );
}

function BoqRow({ item, onOpen }: { item: ScopeItem; onOpen: (i: ScopeItem) => void }) {
  const { state, dispatch } = useProject();
  const b = computeCost(item.cost);
  const vendor = state.vendors.find((v) => v.id === item.vendorId);
  const quoted = item.ladder.quoted ?? item.ladder.approved;

  return (
    <tr className="border-t border-line/70 hover:bg-paper-2/50 group">
      <td className="px-4 py-2">
        <button onClick={() => onOpen(item)} className="text-left w-full">
          <div className="text-ink">{item.title}</div>
          {item.spec && <div className="text-[11px] text-ink-3 line-clamp-1">{item.spec}</div>}
          <div className="flex items-center gap-1.5 mt-1">
            <StageChip stage={item.stage} small />
          </div>
        </button>
        {vendor && (
          <div className="text-[10.5px] text-ink-3 mt-0.5">
            <EntityLink on="vendors" id={vendor.id} />
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-right">
        <input
          className="w-[62px] text-right bg-transparent tnum rounded px-1 py-0.5 hover:bg-paper-2 focus:bg-white focus:outline-1 focus:outline-clay"
          value={item.cost.qty}
          onChange={(e) => dispatch({ type: "item/cost", id: item.id, cost: { qty: parseFloat(e.target.value) || 0 } })}
        />
      </td>
      <td className="px-2 py-2 text-ink-3 text-[11.5px]">{UNIT_LABEL[item.cost.unit]}</td>
      <td className="px-2 py-2 text-right">
        <input
          className="w-[74px] text-right bg-transparent tnum rounded px-1 py-0.5 hover:bg-paper-2 focus:bg-white focus:outline-1 focus:outline-clay"
          value={item.cost.rate}
          onChange={(e) => dispatch({ type: "item/cost", id: item.id, cost: { rate: parseFloat(e.target.value) || 0 } })}
        />
      </td>
      <td className="px-2 py-2 text-right tnum text-ink-2">{inr(b.base + b.wastage, { compact: true })}</td>
      <td className="px-2 py-2 text-right tnum text-ink-2">{b.labour ? inr(b.labour, { compact: true }) : "—"}</td>
      <td className="px-2 py-2 text-right tnum text-ink-2">{b.tax ? inr(b.tax, { compact: true }) : "—"}</td>
      <td className="px-4 py-2 text-right tnum font-medium">{inr(forecastOf(item))}</td>
      <td className="px-2 py-2 text-right"><RowActions on="items" id={item.id} /></td>
    </tr>
  );
}
