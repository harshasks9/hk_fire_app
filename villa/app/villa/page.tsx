"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { FloorPlan, OVERLAYS } from "@/components/FloorPlan";
import { FLOOR_META } from "@/lib/seed/spaces";
import { rollup, itemsForFloor, spaceMetrics, openDecisions } from "@/lib/model/derive";
import { inr, dimsLabel, areaSqft } from "@/lib/model/costing";
import type { FloorId } from "@/lib/model/types";
import type { OverlayKey } from "@/lib/model/derive";
import { PageTitle, Eyebrow, Bar, Chip, Money } from "@/components/ui";

const FLOORS: FloorId[] = ["second", "first", "ground", "outdoor"];

/**
 * The villa.
 *
 * A stack of three floors plus the outdoor layer, read top-down the way the
 * building actually sits. Pick a floor and the plan opens; pick a room and its
 * workspace opens. The overlay control changes what the plan is *about* without
 * changing where you are.
 */
export default function VillaPage() {
  const { state } = useProject();
  const [floor, setFloor] = useState<FloorId>("ground");
  const [overlay, setOverlay] = useState<OverlayKey>("completion");
  const [hovered, setHovered] = useState<string | null>(null);

  const floorRollup = (f: FloorId) => rollup(itemsForFloor(state, f), state.decisions);
  const spaces = state.spaces.filter((s) => s.floor === floor && !s.archived);

  return (
    <div>
      <PageTitle
        title="The villa"
        sub="Every room in the house, already carrying its own scope. Click a floor, then a room."
      />

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* ------------------------------------------------------ floor stack */}
        <div className="lg:sticky lg:top-6">
          <Eyebrow className="mb-2.5">Floors</Eyebrow>
          <div className="space-y-1.5">
            {FLOORS.map((f, idx) => {
              const meta = FLOOR_META[f];
              const r = floorRollup(f);
              const on = f === floor;
              return (
                <button
                  key={f}
                  onClick={() => setFloor(f)}
                  className="w-full text-left card px-3.5 py-3 transition-all"
                  style={{
                    borderColor: on ? "var(--color-clay)" : "var(--color-line)",
                    background: on ? "#fff" : "color-mix(in srgb, #fff 55%, transparent)",
                    transform: on ? "translateX(3px)" : undefined,
                    boxShadow: on ? "0 2px 10px rgba(176,96,58,.10)" : undefined,
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px]" style={{ fontFamily: "var(--font-display)" }}>{meta.label}</span>
                    <span className="tnum text-[11px] text-ink-3">{Math.round(r.completionPct)}%</span>
                  </div>
                  <div className="mt-1.5"><Bar pct={r.completionPct} height={4} tone={on ? "#b0603a" : "#8f9d8c"} /></div>
                  <div className="text-[11px] text-ink-3 mt-1.5 leading-snug">{meta.caption}</div>
                  <div className="text-[11px] text-ink-4 mt-1 tnum">
                    {r.live} items · {inr(r.forecast, { compact: true })}
                    {r.decisionsOutstanding > 0 && <span className="text-clay"> · {r.decisionsOutstanding} to decide</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- plan */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="eyebrow mr-1">Read the plan as</span>
            {OVERLAYS.filter((o) => o.group === "status").map((o) => (
              <OverlayBtn key={o.key} o={o} active={overlay === o.key} onClick={() => setOverlay(o.key)} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="eyebrow mr-1">Services</span>
            {OVERLAYS.filter((o) => o.group === "services").map((o) => (
              <OverlayBtn key={o.key} o={o} active={overlay === o.key} onClick={() => setOverlay(o.key)} />
            ))}
          </div>

          <div className="card px-4 sm:px-6 py-5">
            <FloorPlan floor={floor} overlay={overlay} onHover={setHovered} selectedId={hovered ?? undefined} />
          </div>

          {/* ------------------------------------------------------ room list */}
          <div className="mt-6">
            <div className="flex items-end justify-between gap-3 mb-2.5">
              <Eyebrow>{FLOOR_META[floor].label} — {spaces.length} spaces</Eyebrow>
              <span className="text-[11.5px] text-ink-3">Every one already has its own scope checklist.</span>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {spaces.map((s) => {
                const m = spaceMetrics(state, s.id);
                const area = areaSqft(s.dims);
                return (
                  <Link
                    key={s.id}
                    href={`/villa/${s.id}`}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="card px-3.5 py-3 hover:border-ink-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13.5px] leading-snug">{s.name}</div>
                        <div className="text-[11px] text-ink-3 mt-0.5">
                          {s.dims ? `${dimsLabel(s.dims)} · ${area} sq ft` : "Not dimensioned"}
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
      </div>
    </div>
  );
}

function OverlayBtn({
  o, active, onClick,
}: { o: { key: OverlayKey; label: string; hint: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={o.hint}
      className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors border"
      style={{
        background: active ? "var(--color-ink)" : "var(--color-card)",
        color: active ? "var(--color-paper)" : "var(--color-ink-2)",
        borderColor: active ? "var(--color-ink)" : "var(--color-line)",
      }}
    >
      {o.label}
    </button>
  );
}
