"use client";

import React, { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { planFor, isSite, WALL, type PlanRoom } from "@/lib/plans/geometry";
import { spaceMetrics, overlayIntensity, type OverlayKey } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { dimsLabel, measureShort } from "@/lib/model/measure";
import { DimsShort } from "./Measure";
import type { FloorId } from "@/lib/model/types";
import { PlanDefs, Fixture, OpeningMark, finishFill, WALL_FILL } from "./PlanArt";
import { CadLayer, useCad } from "./CadPlan";
import { Bar, Chip } from "./ui";

/**
 * The floor plan as an interface.
 *
 * The plans are not documents filed under a Files tab: every room is a shape
 * you can click into its own workspace, and the same shape carries whichever
 * overlay you are reading the house through — completion, money, decisions,
 * risk, or one of the services layers. "Drawing" turns the data off entirely
 * and leaves the architecture, which is the view you want when you are talking
 * to the designer rather than to the budget.
 */

export type ViewKey = OverlayKey | "none";

export const OVERLAYS: { key: ViewKey; label: string; group: "status" | "services"; hint: string }[] = [
  { key: "none", label: "Drawing", group: "status", hint: "The plan on its own, with no data over it." },
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
export const RAMPS: Record<string, [string, string]> = {
  completion: ["#e9e3d8", "#5f7a5f"],
  budget: ["#efe7d9", "#a8763f"],
  overrun: ["#eee7dd", "#a04a3c"],
  decisions: ["#efe8dd", "#b0603a"],
  procurement: ["#efe8dd", "#a04a3c"],
  issues: ["#efe8dd", "#8d3a2c"],
  electrical: ["#eee9e0", "#7a6a3a"],
  lighting: ["#f0e9dc", "#ab8534"],
  automation: ["#eae9e6", "#5a6672"],
  furniture: ["#eee9e0", "#8a6a4a"],
  hvac: ["#e9ecee", "#5a7682"],
};

export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * Math.max(0, Math.min(1, t)));
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
}

export function FloorPlan({
  floor, overlay, selectedId, onSelect, compact, base = "stylised", cadGrid, cadText = true,
}: {
  floor: FloorId;
  overlay: ViewKey;
  selectedId?: string | null;
  onSelect?: (spaceId: string | null) => void;
  compact?: boolean;
  /** "cad" swaps the redrawing for the architect's own linework. */
  base?: "stylised" | "cad";
  cadGrid?: boolean;
  cadText?: boolean;
}) {
  const { state } = useProject();
  const uid = useId().replace(/:/g, "");
  const plan = planFor(floor);
  const [hover, setHover] = useState<string | null>(null);
  const { cad, loading: cadLoading, failed: cadFailed } = useCad();
  const onCad = base === "cad" && !!cad;

  const spaceById = useMemo(() => new Map(state.spaces.map((s) => [s.id, s])), [state.spaces]);
  const metrics = useMemo(() => {
    const m = new Map<string, ReturnType<typeof spaceMetrics>>();
    for (const r of plan.rooms) m.set(r.spaceId, spaceMetrics(state, r.spaceId));
    return m;
  }, [state, plan]);

  const data = overlay !== "none";
  const [from, to] = RAMPS[overlay] ?? RAMPS.completion;
  const drawn = plan.rooms.filter((r) => spaceById.has(r.spaceId));
  const rooms = [...drawn.filter(isSite), ...drawn.filter((r) => !isSite(r))];
  // On the Outdoor layer the landscape is lit and the building is context.
  const faded = (r: PlanRoom) => floor === "outdoor" && !r.outdoor;
  const active = selectedId ?? hover;

  const renderRoom = (r: PlanRoom) => {
          const sp = spaceById.get(r.spaceId)!;
          const m = metrics.get(r.spaceId)!;
          const dim = faded(r);
          const isOn = active === r.spaceId;
          const { v, label } = data ? overlayIntensity(m, overlay as OverlayKey) : { v: 0, label: "—" };
          const x = r.x, y = r.y, w = r.w, h = r.h;

          return (
            <g
              key={r.spaceId}
              onMouseEnter={() => setHover(r.spaceId)}
              onMouseLeave={() => setHover(null)}
              onClick={(e) => { e.stopPropagation(); onSelect?.(r.spaceId === selectedId ? null : r.spaceId); }}
              style={{ cursor: "pointer" }}
              tabIndex={0}
              role="button"
              aria-label={`${sp.name}${sp.dims ? `, ${dimsLabel(sp.dims)}` : ""}`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(r.spaceId); } }}
            >
              {/* floor finish */}
              {!onCad && (
                <rect x={x} y={y} width={w} height={h} rx={r.outdoor ? 3 : 1}
                  fill={finishFill(uid, r.finish)} opacity={dim ? 0.45 : 1} />
              )}
              {/* the data wash, laid over the drawing rather than replacing it */}
              {data && !dim && v > 0.02 && (
                <rect x={x} y={y} width={w} height={h} rx={r.outdoor ? 3 : 1}
                  fill={mix(from, to, v)} opacity={onCad ? 0.3 : 0.44}
                  style={{ transition: "fill .35s ease, opacity .35s ease" }} />
              )}
              {/* fittings — the CAD carries its own, so ours stand down */}
              {!onCad && (
                <g opacity={dim ? 0.28 : 0.88} style={{ transition: "opacity .3s ease" }}>
                  {r.fit?.map((f, i) => <Fixture key={i} f={f} />)}
                </g>
              )}
              {/* room line */}
              <rect x={x} y={y} width={w} height={h} rx={r.outdoor ? 3 : 1}
                fill="none"
                stroke={isOn ? "#b0603a" : onCad ? "transparent" : r.outdoor ? "#b9b3a5" : WALL_FILL}
                strokeWidth={isOn ? 4.5 : r.outdoor ? 1.2 : WALL / 2}
                style={{ transition: "stroke .15s ease, stroke-width .15s ease" }} />
              {(!onCad || (data && label !== "—")) && (
                <RoomLabel r={r} name={sp.name} dims={onCad ? undefined : sp.dims ? dimsLabel(sp.dims) : undefined}
                  metric={data && label !== "—" ? label : undefined} dark={data && v > 0.78} dim={dim}
                  nameless={onCad} />
              )}
            </g>
          );
        };

  return (
    <div className="relative">
      <svg
        viewBox={plan.viewBox}
        className="w-full h-auto select-none mx-auto block"
        style={{ maxHeight: compact ? 380 : "min(74vh, 820px)" }}
        role="img"
        aria-label={`${floor} floor plan`}
      >
        <PlanDefs uid={uid} />

        {/* ---------------------------------------------------------- site */}
        {plan.plot && (
          <g>
            <rect x={plan.plot.x} y={plan.plot.y} width={plan.plot.w} height={plan.plot.h} fill="#eef0e8" />
            {plan.site?.map((d, i) => (
              <rect
                key={i}
                x={d.x} y={d.y} width={d.w} height={d.h}
                rx={d.kind === "road" || d.kind === "kerb" ? 0 : 3}
                fill={
                  d.kind === "lawn" ? `url(#${uid}-grass)`
                  : d.kind === "hedge" ? `url(#${uid}-hedge)`
                  : d.kind === "road" ? "#e3e1de"
                  : d.kind === "kerb" ? "#d7d4ce"
                  : `url(#${uid}-paving)`
                }
              />
            ))}
            <rect x={plan.plot.x} y={plan.plot.y} width={plan.plot.w} height={plan.plot.h}
              fill="none" stroke="#b9b0a0" strokeWidth="2" strokeDasharray="10 7" />
          </g>
        )}

        {/* -------------------------------------------------- outdoor shapes */}
        {rooms.filter(isSite).map((r) => renderRoom(r))}

        {/* ------------------------------------------------------ the plate */}
        <g filter={onCad ? undefined : `url(#${uid}-soft)`}>
          <rect x={plan.plate.x} y={plan.plate.y} width={plan.plate.w} height={plan.plate.h}
            fill={onCad ? "#fdfcf9" : "#f1ede5"} rx="1" />
        </g>
        {/* The exterior wall, drawn heavy the way a plan draws it. */}
        {!onCad && (
          <rect x={plan.plate.x} y={plan.plate.y} width={plan.plate.w} height={plan.plate.h}
            fill="none" stroke={WALL_FILL} strokeWidth={WALL * 1.7} />
        )}

        {/* --------------------------------------------------------- rooms */}
        {rooms.filter((r) => !isSite(r)).map((r) => renderRoom(r))}

        {/* -------------------------------------------- the architect's CAD */}
        {onCad && cad && <CadLayer floor={floor} cad={cad} showGrid={cadGrid} showText={cadText} dim={floor === "outdoor"} />}

        {/* ------------------------------------------------------ openings */}
        {!onCad && <g>{plan.openings.map((o, i) => <OpeningMark key={i} o={o} wall={WALL} />)}</g>}

        {/* the outer face of the wall, drawn last so nothing sits over it */}
        {!onCad && (
          <rect x={plan.plate.x - WALL * 0.85} y={plan.plate.y - WALL * 0.85}
            width={plan.plate.w + WALL * 1.7} height={plan.plate.h + WALL * 1.7}
            fill="none" stroke="#35302a" strokeWidth="1.3" />
        )}

        {plan.plot && <NorthPoint x={plan.plot.w - 42} y={38} />}
      </svg>

      {active && <PeekCard spaceId={active} overlay={overlay} onClose={() => { onSelect?.(null); setHover(null); }} />}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-ink-3 leading-snug max-w-sm">
          {plan.caption}
          {base === "cad" && (cadLoading ? " · loading the CAD…" : cadFailed ? " · the CAD could not be loaded" : " · drawn from the architect's DWG")}
        </p>
        {data && <Legend from={from} to={to} overlay={overlay as OverlayKey} />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- labels */

/**
 * A label is only drawn where the room can actually hold one. A name spilling
 * over its own walls is worse than no name — the plan is readable either way,
 * and the hover card carries the detail.
 */
function RoomLabel({
  r, name, dims, metric, dark, dim, nameless,
}: { r: PlanRoom; name: string; dims?: string; metric?: string; dark: boolean; dim: boolean; nameless?: boolean }) {
  const short = shortName(name, r.w * r.h < 16000);
  const big = r.w * r.h > 17000;
  const size = big ? 13 : 10.5;
  const fits = short.length * size * 0.58 < r.w - 10;
  if (!fits || r.h < 34) return null;
  const cx = r.x + r.w / 2 + (r.labelDx ?? 0);
  const cy = r.y + r.h / 2 + (r.labelDy ?? 0);
  const lines = (big && dims ? 1 : 0) + (metric ? 1 : 0);
  const top = cy - lines * 6;
  if (nameless) {
    // The CAD names its own rooms; only the number we are overlaying is ours.
    return metric ? (
      <text x={cx} y={cy + 9} textAnchor="middle"
        style={{ pointerEvents: "none", fontFamily: "var(--font-sans)", paintOrder: "stroke" }}
        fill={dark ? "#ffffff" : "#3f3931"} stroke={dark ? "rgba(60,52,42,.35)" : "rgba(255,255,255,.85)"}
        strokeWidth={2.4} strokeLinejoin="round" fontSize={big ? 12 : 10} fontWeight={700}>
        {metric}
      </text>
    ) : null;
  }
  return (
    <text
      textAnchor="middle" x={cx} y={top}
      style={{ pointerEvents: "none", fontFamily: "var(--font-sans)", paintOrder: "stroke" }}
      fill={dim ? "#8d8478" : dark ? "#ffffff" : "#3f3931"}
      stroke={dark ? "rgba(60,52,42,.35)" : "rgba(255,255,255,.82)"}
      strokeWidth={dark ? 2 : 2.6}
      strokeLinejoin="round"
    >
      <tspan x={cx} fontSize={size} fontWeight={600}>{short}</tspan>
      {big && dims && <tspan x={cx} dy="12.5" fontSize="9.5" fontWeight={450} opacity="0.75">{dims}</tspan>}
      {metric && <tspan x={cx} dy={big && dims ? "12.5" : "12"} fontSize={big ? 11.5 : 10} fontWeight={700}>{metric}</tspan>}
    </text>
  );
}

const ABBREV: Record<string, string> = {
  "Master bathroom": "M. bath", "Master WIC": "M. WIC",
  "Bedroom 3 bathroom": "Bath 3", "Bedroom 4 bathroom": "Bath 4",
  "Bedroom 4 WIC": "WIC 4", "Bedroom 5 bathroom": "Bath 5", "Bedroom 5 WIC": "WIC 5",
  "Ground-floor bathroom": "Bath", "Ground-floor bedroom WIC": "WIC",
  "Ground-floor bedroom": "Bedroom", "Double-height foyer": "Foyer",
  "Double-height foyer void": "Void", "Powder room — second": "Powder",
  "Maid bathroom": "WC", "Covered sit-out / balcony": "Sit-out",
  "Outdoor deck / sit-out": "Deck", "Terrace landscaping & outdoor furniture": "Planting",
  "Entrance landscaping": "Planting", "Side garden — north": "Side garden",
  "Side garden — south": "Side garden", "Driveway & apron": "Driveway",
  "Bar counter": "Bar", "Two-car parking": "Parking", "Main entrance": "Entrance",
  "Wet kitchen": "Wet kit.", "Powder room": "Powder", "Maid room": "Maid",
  "Drawing room": "Drawing", "Main living room": "Living", "Dining room": "Dining",
  "Home theatre": "Theatre", "Family lounge": "Family", "Master bedroom": "Master",
  "Lobby — first": "Lobby", "Staircase — ground": "Stair", "Staircase — first": "Stair",
  "Staircase — second": "Stair", "Open terrace": "Terrace",
};

function shortName(n: string, small = false): string {
  if (small && ABBREV[n]) return ABBREV[n];
  const t = n
    .replace(" — ground", "").replace(" — first", "").replace(" — second", "")
    .replace("Ground-floor ", "").replace("Double-height ", "")
    .replace(" / outdoor furniture", "").replace("Corridors & circulation", "Circulation")
    .replace("Lobby / entertainment area", "Lobby").replace(" / sit-out", "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * North is to the right.
 *
 * The plans are drawn the way the architect presents them, with the road at
 * the bottom of the sheet — and the road is to the EAST, because this is the
 * east-facing unit. So the sheet is the site turned a quarter turn: the top
 * of the page is west and north lies to the right. The DWG settles it —
 * the setbacks it dimensions are 1520 south, 2490 north, 2740 west, 3380 east.
 */
function NorthPoint({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.55">
      <circle r="17" fill="#ffffff" stroke="#c4bbab" strokeWidth="1.2" />
      <g transform="rotate(90)">
        <path d="M0 -12L5 4L0 0L-5 4Z" fill="#6f6558" />
      </g>
      <text x="21" y="4" textAnchor="middle" fontSize="9" fill="#6f6558" fontWeight={700} style={{ fontFamily: "var(--font-sans)" }}>N</text>
    </g>
  );
}

/* -------------------------------------------------------------- peek card */

/** Click a room and it opens here: what it is, where it stands, and a way in. */
function PeekCard({ spaceId, overlay, onClose }: { spaceId: string; overlay: ViewKey; onClose: () => void }) {
  const { state } = useProject();
  const sp = state.spaces.find((s) => s.id === spaceId);
  const m = spaceMetrics(state, spaceId);
  if (!sp) return null;
  return (
    <div className="absolute top-2 right-2 card px-4 py-3.5 shadow-xl max-w-[264px] animate-rise z-10" style={{ background: "rgba(255,253,250,.97)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[15px] leading-tight" style={{ fontFamily: "var(--font-display)" }}>{sp.name}</div>
          <div className="text-[11px] text-ink-3 mt-0.5">
            <DimsShort sp={sp} />
          </div>
        </div>
        <button onClick={onClose} className="text-ink-4 hover:text-ink text-[15px] leading-none shrink-0 -mt-0.5" aria-label="Close">×</button>
      </div>

      <div className="mt-2.5"><Bar pct={m.completionPct} height={4} /></div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px]">
        <Kv k="Complete" v={`${Math.round(m.completionPct)}%`} />
        <Kv k="Forecast" v={inr(m.forecast, { compact: true })} />
        <Kv k="Scope" v={`${m.liveCount} items`} />
        <Kv k="Decisions" v={m.decisionsOpen ? String(m.decisionsOpen) : "—"} />
      </div>
      {(m.snagsOpen > 0 || m.procurementRisk > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.snagsOpen > 0 && <Chip tone="rust">{m.snagsOpen} snag{m.snagsOpen > 1 ? "s" : ""}</Chip>}
          {m.procurementRisk > 0 && <Chip tone="ochre">{m.procurementRisk} at risk</Chip>}
        </div>
      )}
      {sp.note && <p className="text-[11.5px] text-ink-3 leading-snug mt-2.5">{sp.note}</p>}
      <Link href={`/villa/${sp.id}`} className="btn btn-accent btn-sm w-full justify-center mt-3">Open the room →</Link>
      <div className="text-[10px] text-ink-4 mt-1.5 text-center">Reading the plan as {OVERLAYS.find((o) => o.key === overlay)?.label.toLowerCase()}</div>
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
    completion: ["Not started", "Complete"], budget: ["Low", "High"],
    overrun: ["On budget", "Over"], decisions: ["None", "Several"],
    procurement: ["Clear", "At risk"], issues: ["None", "Several"],
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
