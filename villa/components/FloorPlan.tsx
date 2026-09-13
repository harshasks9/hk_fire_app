"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/lib/store";
import { planFor, type PlanRoom } from "@/lib/plans/geometry";
import { spaceMetrics, overlayIntensity, type OverlayKey } from "@/lib/model/derive";
import { dimsLabel, areaSqft, inr } from "@/lib/model/costing";
import type { FloorId } from "@/lib/model/types";

/**
 * The floor plan as an interface.
 *
 * The plans are not documents in a Files tab. Every room is a shape you can
 * click into its workspace, and the same shape carries whichever overlay you
 * are reading the house through — completion, money, decisions, risk, or one
 * of the services layers. The point is that the homeowner should be able to
 * understand the whole project without opening a spreadsheet.
 */

export const OVERLAYS: { key: OverlayKey; label: string; group: "status" | "services"; hint: string }[] = [
  { key: "completion", label: "Completion", group: "status", hint: "How far each room has travelled through the workflow, weighted by cost." },
  { key: "budget", label: "Cost", group: "status", hint: "Forecast final cost per room." },
  { key: "overrun", label: "Overrun", group: "status", hint: "Forecast against approved budget, as a percentage." },
  { key: "decisions", label: "Awaiting decision", group: "status", hint: "Decisions sitting with the homeowner." },
  { key: "procurement", label: "Procurement risk", group: "status", hint: "Long-lead items still undecided." },
  { key: "issues", label: "Snags", group: "status", hint: "Open snags per room." },
  { key: "electrical", label: "Electrical", group: "services", hint: "Electrical scope items per room." },
  { key: "lighting", label: "Lighting", group: "services", hint: "Lighting scope items per room." },
  { key: "automation", label: "Automation", group: "services", hint: "Automation, networking and security points." },
  { key: "furniture", label: "Furniture", group: "services", hint: "Loose, bespoke and fitted joinery." },
  { key: "hvac", label: "HVAC", group: "services", hint: "Air conditioning, ventilation and fans." },
];

/** Warm ramps, so a full plan never reads as a traffic-light dashboard. */
const RAMPS: Record<string, [string, string]> = {
  completion: ["#eee9e0", "#5f7a5f"],
  budget: ["#f0eae0", "#a8763f"],
  overrun: ["#eeeae2", "#a04a3c"],
  decisions: ["#efeae1", "#b0603a"],
  procurement: ["#efeae1", "#a04a3c"],
  issues: ["#efeae1", "#8d3a2c"],
  electrical: ["#eee9e0", "#7a6a3a"],
  lighting: ["#eee9e0", "#ab8534"],
  automation: ["#eae9e6", "#5a6672"],
  furniture: ["#eee9e0", "#8a6a4a"],
  hvac: ["#e9ecee", "#5a7682"],
};

function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * Math.max(0, Math.min(1, t)));
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
}

export function FloorPlan({
  floor, overlay, onHover, selectedId, compact,
}: {
  floor: FloorId;
  overlay: OverlayKey;
  onHover?: (spaceId: string | null) => void;
  selectedId?: string;
  compact?: boolean;
}) {
  const { state } = useProject();
  const router = useRouter();
  const plan = planFor(floor);
  const [hover, setHover] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const m = new Map<string, ReturnType<typeof spaceMetrics>>();
    for (const r of plan.rooms) m.set(r.spaceId, spaceMetrics(state, r.spaceId));
    return m;
  }, [state, plan]);

  const spaceById = useMemo(() => new Map(state.spaces.map((s) => [s.id, s])), [state.spaces]);
  const [from, to] = RAMPS[overlay] ?? RAMPS.completion;

  // On the Outdoor "floor" only the landscape shapes are lit; the building is context.
  const dimmed = (r: PlanRoom) => floor === "outdoor" && !r.outdoor;

  const rooms = plan.rooms.filter((r) => spaceById.has(r.spaceId));

  return (
    <div className="relative">
      <svg
        viewBox={plan.viewBox}
        className="w-full h-auto select-none mx-auto block"
        style={{ maxHeight: compact ? 400 : "min(72vh, 760px)", maxWidth: compact ? 460 : undefined }}
        role="img"
        aria-label={`${floor} floor plan`}
      >
        <defs>
          <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#c7bcab" strokeWidth="1.4" />
          </pattern>
        </defs>

        {/* plot, lawn, road */}
        {plan.plot && (
          <rect x={plan.plot.x} y={plan.plot.y} width={plan.plot.w} height={plan.plot.h}
            fill="#f6f3ee" stroke="#d9d1c4" strokeWidth="2" strokeDasharray="8 6" rx="3" />
        )}
        {plan.decor?.map((d, i) => {
          const fill = d.kind === "lawn" ? "#e6ece0" : d.kind === "road" ? "#e8e6e3" : d.kind === "paving" ? "#e9ecee" : "transparent";
          if (d.kind === "stair") {
            const n = 11;
            return (
              <g key={i} opacity={0.5}>
                {Array.from({ length: n }).map((_, k) =>
                  d.dir === "v" ? (
                    <line key={k} x1={d.x} y1={d.y + (d.h / n) * k} x2={d.x + d.w} y2={d.y + (d.h / n) * k} stroke="#c2b7a6" strokeWidth="1.4" />
                  ) : (
                    <line key={k} x1={d.x + (d.w / n) * k} y1={d.y} x2={d.x + (d.w / n) * k} y2={d.y + d.h} stroke="#c2b7a6" strokeWidth="1.4" />
                  ),
                )}
              </g>
            );
          }
          return <rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} fill={fill} rx={d.kind === "road" ? 0 : 4} />;
        })}

        {/* built envelope */}
        <rect x={plan.envelope.x} y={plan.envelope.y} width={plan.envelope.w} height={plan.envelope.h}
          fill="#fdfcfa" stroke="#8c8071" strokeWidth="4.5" rx="3" />

        {/* rooms */}
        {rooms.map((r) => {
          const sp = spaceById.get(r.spaceId)!;
          const m = metrics.get(r.spaceId)!;
          const { v, label } = overlayIntensity(m, overlay);
          const isHover = hover === r.spaceId;
          const isSel = selectedId === r.spaceId;
          const faded = dimmed(r);
          const fill = faded ? "#f2efe9" : r.void ? "url(#hatch)" : mix(from, to, v * 0.92);
          // Units are tenths of a foot, so 18000 is roughly 180 sq ft — the point
          // at which a room can carry its dimension and its metric as well as its name.
          const big = r.w * r.h > 18000;
          const name = shortName(sp.name, !big);
          // Roughly 0.55em per character at this weight: a label that would spill
          // past its own walls is worse than no label, so it simply is not drawn.
          const fits = name.length * (big ? 13 : 10) * 0.55 < r.w - 6;
          const roomy = r.h > 42 && fits;

          return (
            <g
              key={r.spaceId}
              onMouseEnter={() => { setHover(r.spaceId); onHover?.(r.spaceId); }}
              onMouseLeave={() => { setHover(null); onHover?.(null); }}
              onClick={() => router.push(`/villa/${r.spaceId}`)}
              style={{ cursor: "pointer" }}
              tabIndex={0}
              role="button"
              aria-label={`${sp.name}${dimsLabel(sp.dims) ? `, ${dimsLabel(sp.dims)}` : ""}`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/villa/${r.spaceId}`); } }}
            >
              <rect
                x={r.x} y={r.y} width={r.w} height={r.h} rx="3"
                fill={fill}
                stroke={isSel || isHover ? "#b0603a" : "#b4a99a"}
                strokeWidth={isSel || isHover ? 3.4 : 1.6}
                style={{ transition: "fill .3s ease, stroke .15s ease", opacity: faded ? 0.55 : 1 }}
              />
              {/* label — only where the shape can actually hold one */}
              {roomy ? (
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 + (r.labelDy ?? 0) - (big ? 8 : 3)}
                  textAnchor="middle"
                  style={{ pointerEvents: "none", fontFamily: "var(--font-sans)" }}
                  fill={v > 0.6 && !faded ? "#ffffff" : "#463f36"}
                >
                  <tspan x={r.x + r.w / 2} fontSize={big ? 13 : 10} fontWeight={600}>
                    {name}
                  </tspan>
                  {big && sp.dims && (
                    <tspan x={r.x + r.w / 2} dy="13" fontSize="9.5" opacity="0.7">
                      {dimsLabel(sp.dims)}
                    </tspan>
                  )}
                  {label !== "—" && (
                    <tspan x={r.x + r.w / 2} dy={big && sp.dims ? "13" : "11.5"} fontSize={big ? 11.5 : 9.5} fontWeight={700} opacity="0.95">
                      {label}
                    </tspan>
                  )}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* hover card */}
      {hover && !compact && <HoverCard spaceId={hover} overlay={overlay} />}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-ink-3 leading-snug max-w-md">{plan.caption}</p>
        <Legend from={from} to={to} overlay={overlay} />
      </div>
    </div>
  );
}

/** Small rooms get the short form; big rooms keep their proper name. */
const ABBREV: Record<string, string> = {
  "Master bathroom": "M. bath",
  "Master WIC": "M. WIC",
  "Bedroom 3 bathroom": "Bath 3",
  "Bedroom 4 bathroom": "Bath 4",
  "Bedroom 4 WIC": "WIC 4",
  "Bedroom 5 bathroom": "Bath 5",
  "Bedroom 5 WIC": "WIC 5",
  "Ground-floor bathroom": "Bath",
  "Ground-floor bedroom WIC": "WIC",
  "Double-height foyer": "Foyer",
  "Double-height foyer void": "Foyer void",
  "Powder room — second": "Powder",
  "Maid bathroom": "Maid WC",
  "Covered sit-out / balcony": "Sit-out",
  "Outdoor deck / sit-out": "Deck",
  "Terrace landscaping & outdoor furniture": "Planting",
  "Entrance landscaping": "Planting",
  "Side garden — east": "Side garden",
  "Side garden — west": "Side garden",
  "Driveway & apron": "Driveway",
  "Bar counter": "Bar",
};

function shortName(n: string, small = false): string {
  if (small && ABBREV[n]) return ABBREV[n];
  return n
    .replace(" — ground", "").replace(" — first", "").replace(" — second", "")
    .replace("Ground-floor ", "GF ").replace("Double-height ", "Dbl-ht ")
    .replace(" / outdoor furniture", "").replace("Corridors & circulation", "Circulation")
    .replace("Lobby / entertainment area", "Lobby");
}

function HoverCard({ spaceId, overlay }: { spaceId: string; overlay: OverlayKey }) {
  const { state } = useProject();
  const sp = state.spaces.find((s) => s.id === spaceId);
  const m = spaceMetrics(state, spaceId);
  if (!sp) return null;
  const area = areaSqft(sp.dims);
  return (
    <div className="absolute top-2 right-2 card px-3.5 py-3 shadow-lg pointer-events-none max-w-[250px] animate-fade">
      <div className="text-[14px]" style={{ fontFamily: "var(--font-display)" }}>{sp.name}</div>
      <div className="text-[11px] text-ink-3 mt-0.5">
        {sp.dims ? `${dimsLabel(sp.dims)} · ${area} sq ft` : "Not dimensioned on the plan"}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px]">
        <Kv k="Complete" v={`${Math.round(m.completionPct)}%`} />
        <Kv k="Forecast" v={inr(m.forecast, { compact: true })} />
        <Kv k="Scope items" v={String(m.liveCount)} />
        <Kv k="Decisions" v={m.decisionsOpen ? String(m.decisionsOpen) : "—"} />
        {m.snagsOpen > 0 && <Kv k="Snags" v={String(m.snagsOpen)} />}
        {m.procurementRisk > 0 && <Kv k="At risk" v={String(m.procurementRisk)} />}
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-ink-3 text-[10px] uppercase tracking-wider">{k}</div>
      <div className="tnum text-ink font-medium">{v}</div>
    </div>
  );
}

function Legend({ from, to, overlay }: { from: string; to: string; overlay: OverlayKey }) {
  const o = OVERLAYS.find((x) => x.key === overlay);
  const ends: Record<string, [string, string]> = {
    completion: ["Not started", "Complete"],
    budget: ["Low", "High"],
    overrun: ["On budget", "Over"],
    decisions: ["None", "Several"],
    procurement: ["Clear", "At risk"],
    issues: ["None", "Several"],
  };
  const [lo, hi] = ends[overlay] ?? ["Few", "Many"];
  return (
    <div className="flex items-center gap-2 shrink-0" title={o?.hint}>
      <span className="text-[10.5px] text-ink-3">{lo}</span>
      <div className="h-2 w-20 rounded-full" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <span className="text-[10.5px] text-ink-3">{hi}</span>
    </div>
  );
}
