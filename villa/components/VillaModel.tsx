"use client";

import React, { useId, useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { STACK, PLOT, PLATE, isSite, type PlanFloor } from "@/lib/plans/geometry";
import { spaceMetrics, overlayIntensity, rollup, itemsForFloor, type OverlayKey } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import type { FloorId } from "@/lib/model/types";
import { finishFill, PlanDefs } from "./PlanArt";
import { RAMPS, mix, type ViewKey } from "./FloorPlan";

/**
 * The villa, stacked.
 *
 * Three floor plates in axonometric projection, lifted apart so you can see
 * into all of them at once — the model an architect builds out of card, with
 * the project's data painted onto it. Hover a room to read it, click it to
 * open it, click a plate to bring that floor down into the plan below.
 *
 * The projection is the only clever part: screen x is (x - y)·cos30 and screen
 * y is (x + y)·sin30 - z, so height is a pure vertical translation. That means
 * the plates can be pulled apart and pushed together with a CSS transition
 * instead of re-projecting every polygon on every frame.
 */

const K = 0.866, J = 0.5;
const px = (x: number, y: number) => (x - y) * K;
const py = (x: number, y: number) => (x + y) * J;
const pt = (x: number, y: number) => `${px(x, y).toFixed(1)},${py(x, y).toFixed(1)}`;

/** A rectangle's top face, as an isometric polygon. */
const face = (x: number, y: number, w: number, h: number) =>
  `${pt(x, y)} ${pt(x + w, y)} ${pt(x + w, y + h)} ${pt(x, y + h)}`;

/** A vertical quad standing on one edge of a rectangle, `t` tall. */
function wall(x1: number, y1: number, x2: number, y2: number, t: number) {
  return `${pt(x1, y1)} ${pt(x2, y2)} ${px(x2, y2).toFixed(1)},${(py(x2, y2) - t).toFixed(1)} ${px(x1, y1).toFixed(1)},${(py(x1, y1) - t).toFixed(1)}`;
}

const SLAB = 14;
const BACK_WALL = 52;
const KERB = 9;

export function VillaModel({
  floor, overlay, selectedId, onFloor, onSelect, exploded = true,
}: {
  floor: FloorId;
  overlay: ViewKey;
  selectedId?: string | null;
  onFloor: (f: FloorId) => void;
  onSelect?: (spaceId: string | null) => void;
  exploded?: boolean;
}) {
  const { state } = useProject();
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const spaceById = useMemo(() => new Map(state.spaces.map((s) => [s.id, s])), [state.spaces]);
  const data = overlay !== "none";
  const [from, to] = RAMPS[overlay] ?? RAMPS.completion;
  const gap = exploded ? 196 : 124;

  // The whole site, projected, tells us how big the drawing is.
  const box = useMemo(() => {
    // the site gives the width; the top plate, lifted, gives the height
    const xs = [px(0, 0), px(PLOT.w, 0), px(PLOT.w, PLOT.h), px(0, PLOT.h)];
    const top = py(PLATE.x, PLATE.y) - gap * 2 - BACK_WALL - 26;
    const bottom = py(PLOT.w, PLOT.h) + SLAB + 18;
    return { x: Math.min(...xs) - 196, y: top, w: Math.max(...xs) - Math.min(...xs) + 232, h: bottom - top };
  }, [gap]);

  const active = selectedId ?? hover;

  return (
    <div className="relative">
      <svg
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        className="w-full h-auto block select-none overflow-visible"
        style={{ maxHeight: "min(62vh, 600px)" }}
        role="img"
        aria-label="Isometric model of the villa"
      >
        <PlanDefs uid={uid} />
        <defs>
          <radialGradient id={`${uid}-gshadow`}>
            <stop offset="0%" stopColor="#6b5a44" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#6b5a44" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* the ground the model stands on */}
        <ellipse cx={px(PLOT.w / 2, PLOT.h / 2)} cy={py(PLOT.w / 2, PLOT.h / 2) + 26} rx={PLOT.w * 0.62} ry={PLOT.h * 0.30} fill={`url(#${uid}-gshadow)`} />

        {STACK.map((plan, i) => {
          const lift = i * gap;
          const on = plan.floor === floor || (floor === "outdoor" && i === 0);
          return (
            <g
              key={plan.floor}
              style={{
                transform: `translateY(${mounted ? -lift : -lift + 26}px)`,
                opacity: mounted ? 1 : 0,
                transition: `transform .6s cubic-bezier(.22,1,.36,1) ${i * 70}ms, opacity .5s ease ${i * 70}ms`,
              }}
            >
              <Plate
                plan={plan} uid={uid} lit={on} data={data} from={from} to={to}
                overlay={overlay} state={state} spaceById={spaceById} active={active}
                showSite={i === 0 && (floor === "outdoor" || floor === "ground")}
                onHoverRoom={setHover}
                onPickRoom={(id) => { onFloor(plan.floor); onSelect?.(id === selectedId ? null : id); }}
                onPickFloor={() => onFloor(plan.floor)}
              />
              <FloorTag plan={plan} state={state} lit={on} onClick={() => onFloor(plan.floor)} />
            </g>
          );
        })}
      </svg>

      {active && spaceById.get(active) && (
        <div className="absolute left-2 bottom-2 card px-3 py-2 shadow-lg pointer-events-none animate-fade max-w-[220px]">
          <div className="text-[12.5px] font-medium leading-tight">{spaceById.get(active)!.name}</div>
          <div className="text-[10.5px] text-ink-3 mt-0.5">Click to open · {Math.round(spaceMetrics(state, active).completionPct)}% complete</div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- plates */

function Plate({
  plan, uid, lit, data, from, to, overlay, state, spaceById, active, showSite, onHoverRoom, onPickRoom, onPickFloor,
}: {
  plan: PlanFloor; uid: string; lit: boolean; data: boolean; from: string; to: string;
  overlay: ViewKey; state: ReturnType<typeof useProject>["state"];
  spaceById: Map<string, { id: string; name: string }>;
  active: string | null; showSite: boolean;
  onHoverRoom: (id: string | null) => void;
  onPickRoom: (id: string) => void;
  onPickFloor: () => void;
}) {
  const p = plan.plate;
  const shown = plan.rooms.filter((r) => spaceById.has(r.spaceId) && (showSite || !isSite(r)));
  // Site shapes go down before the plate, so the building oversails them.
  const site = shown.filter(isSite);
  const rooms = shown.filter((r) => !isSite(r));
  const opacity = lit ? 1 : 0.9;

  return (
    <g style={{ opacity, transition: "opacity .3s ease" }}>
      {/* the site sits under the ground plate */}
      {showSite && plan.plot && (
        <g>
          <polygon points={face(0, 0, plan.plot.w, plan.plot.h)} fill={`url(#${uid}-grass)`} stroke="#c3d1b4" strokeWidth="1.5" />
          <polygon points={wall(0, plan.plot.h, plan.plot.w, plan.plot.h, SLAB * 0.6)} fill="#c2cdb4" />
          <polygon points={wall(plan.plot.w, 0, plan.plot.w, plan.plot.h, SLAB * 0.6)} fill="#b7c3a8" />
        </g>
      )}

      {site.map((r) => (
        <polygon key={r.spaceId} points={face(r.x, r.y, r.w, r.h)} fill={finishFill(uid, r.finish, true)}
          stroke="#c3bbaa" strokeWidth="0.8" style={{ cursor: "pointer" }}
          onMouseEnter={() => onHoverRoom(r.spaceId)} onMouseLeave={() => onHoverRoom(null)}
          onClick={(e) => { e.stopPropagation(); onPickRoom(r.spaceId); }}>
          <title>{spaceById.get(r.spaceId)?.name}</title>
        </polygon>
      ))}

      {/* a soft shadow so each storey reads as floating above the last */}
      <polygon points={face(p.x + 10, p.y + 10, p.w, p.h)} fill="#6a5a44" opacity="0.10"
        transform={`translate(0 ${SLAB + 16})`} style={{ filter: "blur(6px)" }} />

      {/* slab edges give the plate its thickness */}
      <polygon points={wall(p.x, p.y + p.h, p.x + p.w, p.y + p.h, SLAB)} fill="#b0a390" stroke="#9b8f7d" strokeWidth="0.8" />
      <polygon points={wall(p.x + p.w, p.y, p.x + p.w, p.y + p.h, SLAB)} fill="#9c907e" stroke="#8b8070" strokeWidth="0.8" />

      {/* the plate itself — clicking bare floor selects this storey */}
      <polygon
        points={face(p.x, p.y, p.w, p.h)}
        fill="#f4f1ea"
        stroke={lit ? "#b0603a" : "#a89c8a"}
        strokeWidth={lit ? 3 : 1.2}
        style={{ cursor: "pointer", transition: "stroke .25s ease, stroke-width .25s ease" }}
        onClick={onPickFloor}
      />

      {/* the two far walls, so the plate reads as a storey rather than a tray */}
      <polygon points={wall(p.x, p.y, p.x + p.w, p.y, BACK_WALL)} fill="#f2ece1" stroke="#b5a996" strokeWidth="1.2" />
      <polygon points={wall(p.x, p.y, p.x, p.y + p.h, BACK_WALL)} fill="#e6dfd2" stroke="#b5a996" strokeWidth="1.2" />
      {/* the top edge of those walls, which is what catches the light */}
      <polyline
        points={`${px(p.x + p.w, p.y).toFixed(1)},${(py(p.x + p.w, p.y) - BACK_WALL).toFixed(1)} ${px(p.x, p.y).toFixed(1)},${(py(p.x, p.y) - BACK_WALL).toFixed(1)} ${px(p.x, p.y + p.h).toFixed(1)},${(py(p.x, p.y + p.h) - BACK_WALL).toFixed(1)}`}
        fill="none" stroke="#a2957f" strokeWidth="1.4" />

      {rooms.map((r) => {
        const m = spaceMetrics(state, r.spaceId);
        const { v } = data ? overlayIntensity(m, overlay as OverlayKey) : { v: 0 };
        const isOn = active === r.spaceId;
        const fill = data && v > 0.02 ? mix(from, to, v) : finishFill(uid, r.finish, true);
        return (
          <polygon
            key={r.spaceId}
            points={face(r.x, r.y, r.w, r.h)}
            fill={fill}
            stroke={isOn ? "#b0603a" : "#b3a897"}
            strokeWidth={isOn ? 3.2 : 0.9}
            style={{ cursor: "pointer", transition: "fill .35s ease, stroke-width .15s ease" }}
            onMouseEnter={() => onHoverRoom(r.spaceId)}
            onMouseLeave={() => onHoverRoom(null)}
            onClick={(e) => { e.stopPropagation(); onPickRoom(r.spaceId); }}
          >
            <title>{spaceById.get(r.spaceId)?.name}</title>
          </polygon>
        );
      })}

      {/* a low kerb along the near edges: encloses the floor without hiding it */}
      <polygon points={wall(p.x, p.y + p.h, p.x + p.w, p.y + p.h, KERB)} fill="#ded7cb" stroke="#c0b5a4" strokeWidth="0.8" />
      <polygon points={wall(p.x + p.w, p.y, p.x + p.w, p.y + p.h, KERB)} fill="#d5cec1" stroke="#c0b5a4" strokeWidth="0.8" />
    </g>
  );
}

/** The floor's name and headline numbers, floating off its south-east corner. */
function FloorTag({
  plan, state, lit, onClick,
}: { plan: PlanFloor; state: ReturnType<typeof useProject>["state"]; lit: boolean; onClick: () => void }) {
  const r = rollup(itemsForFloor(state, plan.floor), state.decisions);
  const p = plan.plate;
  // anchored off the plot's south-east corner so the three tags line up in a column
  const x = px(0, PLOT.h) - 12;
  const y = py(p.x, p.y + p.h) - 6;
  const label = plan.floor === "ground" ? "Ground floor" : plan.floor === "first" ? "First floor" : "Second floor";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} opacity={lit ? 1 : 0.7} role="button" tabIndex={0} aria-label={`Show the ${label.toLowerCase()}`} aria-pressed={lit}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      <line x1={x + 8} y1={y - 4} x2={px(p.x, p.y + p.h) - 4} y2={y + 4} stroke="#cdc3b2" strokeWidth="1.2" />
      <circle cx={px(p.x, p.y + p.h) - 2} cy={y + 5} r="2.6" fill={lit ? "#8a672b" : "#c2b7a6"} />
      <text x={x} y={y} textAnchor="end" style={{ fontFamily: "var(--font-sans)", paintOrder: "stroke" }}
        stroke="rgba(255,255,255,.85)" strokeWidth="5" strokeLinejoin="round" fill="#1b211e">
        <tspan x={x} fontSize="28" fontWeight={lit ? 700 : 550}>{label}</tspan>
        <tspan x={x} dy="26" fontSize="21" fill="#58625d" fontWeight={500}>
          {Math.round(r.completionPct)}% · {inr(r.forecast, { compact: true })}
        </tspan>
        {r.decisionsOutstanding > 0 && (
          <tspan x={x} dy="24" fontSize="20" fill="#8a672b" fontWeight={600}>{r.decisionsOutstanding} to decide</tspan>
        )}
      </text>
    </g>
  );
}
