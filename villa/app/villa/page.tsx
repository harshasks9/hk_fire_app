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
import { measureSpace } from "@/lib/model/measure";
import type { FloorId } from "@/lib/model/types";
import { PageTitle, Eyebrow, Bar, Chip } from "@/components/ui";

const FLOORS: FloorId[] = ["ground", "first", "second", "outdoor"];

/**
 * The villa.
 *
 * The model at the top is the house itself — three plates you can turn the
 * data on and off over, and click straight into. Below it the same floor is
 * drawn flat and at full size. Both are the same geometry, taken from the
 * architect's plans, and both are pre-populated: the layout is fixed, so
 * nobody should ever have to type a room into this app.
 */
export default function VillaPage() {
  const { state, hydrated } = useProject();
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
  const pickOverlay = (k: ViewKey) => { chosen.current = true; setOverlay(k); };

  const spaces = state.spaces.filter((s) => s.floor === floor && !s.archived);

  const floorArea = spaces.reduce((a, s2) => a + (measureSpace(s2)?.areaSqft ?? 0), 0);

  const undimensioned = spaces.filter((s2) => !s2.dims).length;

  return (
    <div>
      <PageTitle
        title="The villa"
        sub="Every room from the architect\u2019s drawings, already carrying its own scope. Read it as our redrawing or as the CAD itself, and click any room."
        right={<Link href="/villa/drawings" className="btn">Architect&rsquo;s drawings</Link>}
      />

      {/* ------------------------------------------------------------ model */}
      <div className="card px-3 sm:px-5 pt-4 pb-3 mb-5 overflow-hidden" style={{ background: "linear-gradient(170deg,#fffdfa,#f6f2eb)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <Eyebrow>The house, floor by floor</Eyebrow>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setExploded((v) => !v)} className="btn btn-sm" title="Pull the floors apart or stack them">
              {exploded ? "Stack" : "Pull apart"}
            </button>
          </div>
        </div>
        <VillaModel
          floor={floor} overlay={overlay} selectedId={selected} exploded={exploded}
          onFloor={(f) => setFloor(f)} onSelect={setSelected}
        />
      </div>

      {/* ------------------------------------------------ floor + overlay bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        {FLOORS.map((f) => {
          const r = rollup(itemsForFloor(state, f), state.decisions);
          const on = f === floor;
          return (
            <button
              key={f}
              onClick={() => { setFloor(f); setSelected(null); }}
              className="rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-all border flex items-center gap-2"
              style={{
                background: on ? "var(--color-ink)" : "var(--color-card)",
                color: on ? "var(--color-paper)" : "var(--color-ink-2)",
                borderColor: on ? "var(--color-ink)" : "var(--color-line)",
              }}
            >
              {FLOOR_META[f].label}
              <span className="tnum text-[11px]" style={{ opacity: 0.7 }}>{Math.round(r.completionPct)}%</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <span className="eyebrow mr-1">Read as</span>
        {OVERLAYS.filter((o) => o.group === "status").map((o) => (
          <OverlayBtn key={o.key} o={o} active={overlay === o.key} onClick={() => pickOverlay(o.key)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="eyebrow mr-1">Services</span>
        {OVERLAYS.filter((o) => o.group === "services").map((o) => (
          <OverlayBtn key={o.key} o={o} active={overlay === o.key} onClick={() => pickOverlay(o.key)} />
        ))}
      </div>

      {/* ------------------------------------------------------------- plan */}
      <div className="card px-3 sm:px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="eyebrow mr-1">Drawn as</span>
            {(["stylised", "cad"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBase(b)}
                title={b === "cad"
                  ? "The architect's own CAD linework, straight from the DWG"
                  : "The app's redrawing — simplified, textured, easier to read at a glance"}
                className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors border"
                style={{
                  background: base === b ? "var(--color-ink)" : "var(--color-card)",
                  color: base === b ? "var(--color-paper)" : "var(--color-ink-2)",
                  borderColor: base === b ? "var(--color-ink)" : "var(--color-line)",
                }}
              >
                {b === "cad" ? "Architect's CAD" : "Redrawing"}
              </button>
            ))}
          </div>
          {base === "cad" && (
            <label className="flex items-center gap-1.5 text-[11.5px] text-ink-3 cursor-pointer">
              <input type="checkbox" checked={cadGrid} onChange={(e) => setCadGrid(e.target.checked)} />
              Column grid
            </label>
          )}
        </div>
        <FloorPlan floor={floor} overlay={overlay} selectedId={selected} onSelect={setSelected}
          base={base} cadGrid={cadGrid} />
      </div>

      {/* -------------------------------------------------------- room list */}
      <div className="mt-6">
        <div className="flex items-end justify-between gap-3 mb-2.5">
          <Eyebrow>
            {FLOOR_META[floor].label} — {spaces.length} spaces
            {floorArea > 0 && <> · {Math.round(floorArea)} sq ft dimensioned</>}
            {undimensioned > 0 && <> · {undimensioned} not dimensioned</>}
          </Eyebrow>
          <span className="text-[11.5px] text-ink-3 hidden sm:block">Every one already has its own scope checklist.</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {spaces.map((s) => {
            const m = spaceMetrics(state, s.id);
            return (
              <Link
                key={s.id}
                href={`/villa/${s.id}`}
                onMouseEnter={() => setSelected(s.id)}
                onMouseLeave={() => setSelected(null)}
                className="card px-3.5 py-3 hover:border-ink-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13.5px] leading-snug">{s.name}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">
                      <DimsShort sp={s} />
                    </div>
                  </div>
                  <span className="tnum text-[12px] text-ink-3 shrink-0">{Math.round(m.completionPct)}%</span>
                </div>
                <div className="mt-2"><Bar pct={m.completionPct} height={4} /></div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-ink-3 tnum">{m.liveCount} items</span>
                  <span className="text-[11px] text-ink-4">·</span>
                  <span className="text-[11px] text-ink-3 tnum">{inr(m.forecast, { compact: true })}</span>
                  {m.decisionsOpen > 0 && <Chip tone="clay">{m.decisionsOpen} to decide</Chip>}
                  {m.snagsOpen > 0 && <Chip tone="rust">{m.snagsOpen} snag{m.snagsOpen > 1 ? "s" : ""}</Chip>}
                  {m.procurementRisk > 0 && <Chip tone="ochre">{m.procurementRisk} at risk</Chip>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OverlayBtn({
  o, active, onClick,
}: { o: { key: ViewKey; label: string; hint: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={o.hint}
      className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors border"
      style={{
        background: active ? "var(--color-clay)" : "var(--color-card)",
        color: active ? "#fff" : "var(--color-ink-2)",
        borderColor: active ? "var(--color-clay)" : "var(--color-line)",
      }}
    >
      {o.label}
    </button>
  );
}
