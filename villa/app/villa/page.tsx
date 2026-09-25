"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { FloorPlan, OVERLAYS, type ViewKey } from "@/components/FloorPlan";
import { VillaModel } from "@/components/VillaModel";
import { FLOOR_META } from "@/lib/seed/spaces";
import { rollup, itemsForFloor, spaceMetrics } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { DimsShort } from "@/components/Measure";
import { roomLens } from "@/lib/model/lens";
import { measureSpace } from "@/lib/model/measure";
import type { FloorId } from "@/lib/model/types";
import { PageTitle, Chip, Section } from "@/components/ui";
import { Icon } from "@/components/Icon";

const FLOORS: FloorId[] = ["ground", "first", "second", "outdoor"];

/**
 * The rooms.
 *
 * Pick a floor, and everything on the page follows it: the plan drawn flat
 * and at size, the house as a model beside it, and the rooms as tiles below.
 * Every room is already here from the architect's plans, each carrying its
 * own scope — nobody should ever have to type a room into this app.
 */
export default function VillaPage() {
  const { state, hydrated, role, meId } = useProject();
  const sees = roomLens(state, role, meId);
  const [floor, setFloor] = useState<FloorId>("ground");
  const [overlay, setOverlay] = useState<ViewKey>("completion");
  const [selected, setSelected] = useState<string | null>(null);
  const [exploded, setExploded] = useState(true);
  const [base, setBase] = useState<"stylised" | "cad">("stylised");
  const [cadGrid, setCadGrid] = useState(false);

  // On an untouched project every overlay reads zero, which says nothing. Open
  // on the drawing instead, until the reader chooses otherwise.
  const chosen = React.useRef(false);
  React.useEffect(() => {
    if (!hydrated || chosen.current) return;
    chosen.current = true;
    if (!state.items.some((i) => i.stage !== "not-started")) setOverlay("none");
  }, [hydrated, state.items]);

  const spaces = state.spaces.filter((s) => s.floor === floor && !s.archived && sees(s.id));
  const floorArea = spaces.reduce((a, s2) => a + (measureSpace(s2)?.areaSqft ?? 0), 0);
  const undimensioned = spaces.filter((s2) => !s2.dims).length;
  const hint = OVERLAYS.find((o) => o.key === overlay)?.hint;

  return (
    <div>
      <PageTitle
        title="Rooms"
        sub="Every room from the architect’s drawings, each already carrying its own scope. Pick a floor, then open any room."
        right={<Link href="/villa/drawings" className="btn"><Icon name="drawings" size={17} /> Architect&rsquo;s drawings</Link>}
      />

      {/* ------------------------------------------------ floor + colour by */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label="Floor" style={{ scrollbarWidth: "none" }}>
          {FLOORS.map((f) => {
            const r = rollup(itemsForFloor(state, f), state.decisions);
            const on = f === floor;
            return (
              <button key={f} className="pill shrink-0" aria-pressed={on}
                onClick={() => { setFloor(f); setSelected(null); }}>
                {FLOOR_META[f].label}
                <span className="count">{Math.round(r.completionPct)}%</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-3">
          <span className="shrink-0">Colour rooms by</span>
          <select className="input w-auto min-w-[180px]" value={overlay}
            onChange={(e) => { chosen.current = true; setOverlay(e.target.value as ViewKey); }}>
            <optgroup label="Status">
              {OVERLAYS.filter((o) => o.group === "status").map((o) => <option key={o.key} value={o.key}>{o.key === "none" ? "Nothing — just the plan" : o.label}</option>)}
            </optgroup>
            <optgroup label="Services">
              {OVERLAYS.filter((o) => o.group === "services").map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </optgroup>
          </select>
        </label>
      </div>

      {/* ------------------------------------------------- plan + room list */}
      <div className="grid xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)] gap-4 mb-10 items-start">
        <div className="card px-3 sm:px-5 pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-[16px]">{FLOOR_META[floor].label}</h2>
              {overlay !== "none" && hint && <p className="text-[13px] text-ink-3">{hint}</p>}
            </div>
            <div className="flex items-center gap-2">
              {base === "cad" && (
                <label className="flex items-center gap-1.5 text-[13px] text-ink-3 cursor-pointer">
                  <input type="checkbox" checked={cadGrid} onChange={(e) => setCadGrid(e.target.checked)} />
                  Column grid
                </label>
              )}
              <div className="flex gap-1" role="group" aria-label="Drawn as">
                {(["stylised", "cad"] as const).map((b) => (
                  <button key={b} className="pill" aria-pressed={base === b} onClick={() => setBase(b)}
                    title={b === "cad" ? "The architect's own CAD linework, straight from the DWG" : "The app's redrawing — simplified and easier to read"}>
                    {b === "cad" ? "CAD" : "Redrawing"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <FloorPlan floor={floor} overlay={overlay} selectedId={selected} onSelect={setSelected} base={base} cadGrid={cadGrid} />
        </div>

        {/* The rooms on this floor, beside the plan: hover one to find it. */}
        <div className="card overflow-hidden xl:sticky xl:top-6">
          <div className="px-4 pt-4 pb-3 border-b border-line">
            <h2 className="text-[16px]">{spaces.length} rooms</h2>
            <p className="text-[13px] text-ink-3 tnum">
              {floorArea > 0 && <>{Math.round(floorArea).toLocaleString("en-IN")} sq ft dimensioned</>}
              {undimensioned > 0 && <> · {undimensioned} not dimensioned</>}
            </p>
          </div>
          <ul className="divide-y divide-line xl:max-h-[calc(100dvh-180px)] xl:overflow-y-auto thin-scroll">
            {spaces.map((s) => {
              const m = spaceMetrics(state, s.id);
              const on = selected === s.id;
              return (
                <li key={s.id}>
                  <Link
                    href={`/villa/${s.id}`}
                    onMouseEnter={() => setSelected(s.id)}
                    onMouseLeave={() => setSelected(null)}
                    onFocus={() => setSelected(s.id)}
                    onBlur={() => setSelected(null)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors group ${on ? "bg-paper" : "hover:bg-paper"}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[14.5px] font-semibold leading-snug truncate group-hover:text-accent-strong">{s.name}</span>
                        <span className="tnum text-[12.5px] text-ink-3 shrink-0">{Math.round(m.completionPct)}%</span>
                      </span>
                      <span className="block text-[12.5px] text-ink-3 mt-0.5 truncate">
                        <DimsShort sp={s} /> · {m.liveCount} items · {inr(m.forecast, { compact: true })}
                      </span>
                      {(m.decisionsOpen > 0 || m.snagsOpen > 0 || m.procurementRisk > 0) && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {m.decisionsOpen > 0 && <Chip tone="accent" small>{m.decisionsOpen} to decide</Chip>}
                          {m.snagsOpen > 0 && <Chip tone="bad" small>{m.snagsOpen} snag{m.snagsOpen > 1 ? "s" : ""}</Chip>}
                          {m.procurementRisk > 0 && <Chip tone="warn" small>{m.procurementRisk} at risk</Chip>}
                        </span>
                      )}
                    </span>
                    <Icon name="chevron-right" size={16} className="text-ink-4 shrink-0 group-hover:text-ink" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------------ model */}
      <Section
        title="The house, floor by floor"
        action={
          <button onClick={() => setExploded((v) => !v)} className="btn btn-sm" aria-pressed={!exploded}>
            {exploded ? "Stack the floors" : "Pull them apart"}
          </button>
        }
      >
        <div className="card px-3 sm:px-5 pt-3 pb-2 overflow-hidden">
          <p className="text-[13px] text-ink-3 mb-1">Click a floor to switch to it; the colours follow &ldquo;Colour rooms by&rdquo;.</p>
          <VillaModel floor={floor} overlay={overlay} selectedId={selected} exploded={exploded}
            onFloor={(f) => { setFloor(f); setSelected(null); }} onSelect={setSelected} />
        </div>
      </Section>
    </div>
  );
}
