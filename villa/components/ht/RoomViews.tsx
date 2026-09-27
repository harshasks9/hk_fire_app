"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  ROOM, H, STAGE, SCREEN, RISER, ROWS, DOOR, PROJECTOR, MARKERS, SUB_SIZE, SEATED,
  sightline, elevation, projectorStudy, type Marker,
} from "@/lib/ht/geometry";
import { Hit } from "./bits";

export type Layer = "speakers" | "atmos" | "subs" | "treatment" | "hvac" | "dims" | "sight";
export type Layers = Record<Layer, boolean>;
export const ALL_LAYERS: Layers = { speakers: true, atmos: true, subs: true, treatment: true, hvac: false, dims: true, sight: true };

export const LAYER_ITEMS: { id: Layer; label: string; color: string }[] = [
  { id: "speakers", label: "Speakers", color: "var(--g-speakers)" },
  { id: "atmos", label: "Atmos", color: "#f0cf8e" },
  { id: "subs", label: "Subwoofers", color: "var(--g-bass)" },
  { id: "treatment", label: "Acoustic treatment", color: "#4fa79c" },
  { id: "hvac", label: "HVAC", color: "#8fb8ff" },
  { id: "sight", label: "Sightlines & beam", color: "var(--g-picture)" },
  { id: "dims", label: "Dimensions", color: "var(--text-3)" },
];

const T = {
  absorb: "#4fa79c",
  diffuse: "#d6b06a",
  hybrid: "#a898f2",
  trap: "#e5825a",
  hvac: "#8fb8ff",
  screen: "#67bde0",
  top: "#f0cf8e",
  spk: "#d6b06a",
  sub: "#e5825a",
};

interface ViewProps {
  layers: Layers;
  active?: string | null;
  onPick: (component: string) => void;
}

const roleColor = (m: Marker) => (m.role === "top" ? T.top : m.role === "sub" ? T.sub : T.spk);
const visible = (m: Marker, l: Layers) => (m.role === "top" ? l.atmos : m.role === "sub" ? l.subs : l.speakers);

/* ================================================================ helpers */

function Dim({ x1, y1, x2, y2, label, off = 0, vertical }: { x1: number; y1: number; x2: number; y2: number; label: string; off?: number; vertical?: boolean }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const t = 5;
  return (
    <g className="svg-mono" fill="var(--text-3)" stroke="var(--text-3)" strokeWidth={1} opacity={0.9}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} />
        </>
      )}
      <text
        x={vertical ? mx + 8 + off : mx} y={vertical ? my + 4 : my - 7 + off}
        textAnchor={vertical ? "start" : "middle"} fontSize={11} stroke="none" fill="var(--text-2)"
        className="svg-mono"
      >{label}</text>
    </g>
  );
}

function Hatch({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill={color} opacity={0.12} />
      <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" opacity={0.55} />
    </pattern>
  );
}

function Defs() {
  return (
    <defs>
      <Hatch id="h-absorb" color={T.absorb} />
      <Hatch id="h-hybrid" color={T.hybrid} />
      <Hatch id="h-trap" color={T.trap} />
      <pattern id="h-diffuse" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill={T.diffuse} opacity={0.1} />
        <rect x="0" y="0" width="4" height="4" fill={T.diffuse} opacity={0.35} />
        <rect x="4" y="4" width="4" height="4" fill={T.diffuse} opacity={0.2} />
      </pattern>
      <linearGradient id="g-beam" x1="1" x2="0" y1="0" y2="0">
        <stop offset="0" stopColor={T.screen} stopOpacity="0.28" />
        <stop offset="1" stopColor={T.screen} stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="g-screen" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#274a5c" />
        <stop offset="1" stopColor="#10222b" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

function Speaker({ cx, cy, m, active, onPick, r = 11 }: { cx: number; cy: number; m: Marker; active: boolean; onPick: (c: string) => void; r?: number }) {
  const c = roleColor(m);
  const isTop = m.role === "top";
  return (
    <Hit label={`${m.label} — open ${m.component}`} onClick={() => onPick(m.component)}>
      <circle className="hit-ring" cx={cx} cy={cy} r={r + 6} fill="none" stroke={c} strokeWidth={1.5} opacity={active ? 1 : undefined} style={active ? { opacity: 1 } : undefined} />
      <circle className="hit-body" cx={cx} cy={cy} r={r} fill={isTop ? "#1d1a12" : c} stroke={c} strokeWidth={isTop ? 2 : 0} strokeDasharray={isTop ? "3 2" : undefined} />
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={r > 10 ? 9.5 : 8.5} fontWeight={700} fill={isTop ? c : "#16130c"}>{m.label}</text>
    </Hit>
  );
}

/* ================================================================== plan */

export function PlanView({ layers, active, onPick, closet = true }: ViewProps & { closet?: boolean }) {
  const S = 100;
  const pad = { l: 56, t: 78, r: 40, b: closet ? 170 : 70 };
  const W = ROOM.W, L = ROOM.L;
  const X = (x: number) => pad.l + x * S;
  const Y = (y: number) => pad.t + (W - y) * S;
  const vw = pad.l + L * S + pad.r;
  const vh = pad.t + W * S + pad.b;
  const wall = 0.12 * S;
  const is = (c: string) => active === c;

  const beamL = { x: SCREEN.x, y: SCREEN.left }, beamR = { x: SCREEN.x, y: SCREEN.right };
  const r1 = ROWS[0], r2 = ROWS[1];

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto block" role="img" aria-label="Top-down plan of the theatre">
      <Defs />
      {/* walls */}
      <rect x={X(0) - wall} y={Y(W) - wall} width={L * S + 2 * wall} height={W * S + 2 * wall} rx={4} fill="var(--room-wall)" />
      <rect x={X(0)} y={Y(W)} width={L * S} height={W * S} fill="var(--room-floor)" />
      {/* door opening on the left (east) wall, drawn at the bottom */}
      <rect x={X(DOOR.x0)} y={Y(0) - 1} width={(DOOR.x1 - DOOR.x0) * S} height={wall + 2} fill="var(--room-floor)" />
      <path d={`M ${X(DOOR.x1)} ${Y(0) + wall} L ${X(DOOR.x1)} ${Y(0) + wall + 0.9 * S} A ${0.9 * S} ${0.9 * S} 0 0 1 ${X(DOOR.x0)} ${Y(0) + wall}`} fill="none" stroke="var(--room-line)" strokeDasharray="4 3" />
      <line x1={X(DOOR.x1)} y1={Y(0) + wall} x2={X(DOOR.x1)} y2={Y(0) + wall + 0.9 * S} stroke="var(--text-3)" strokeWidth={2} />
      <text x={X((DOOR.x0 + DOOR.x1) / 2)} y={Y(0) + wall + 0.55 * S} textAnchor="middle" fontSize={10.5} fill="var(--text-3)">Door opens out</text>

      {/* treatment */}
      {layers.treatment && (
        <g>
          <rect x={X(0)} y={Y(W)} width={0.12 * S} height={W * S} fill="url(#h-absorb)" />
          <polygon points={`${X(0)},${Y(W)} ${X(0.5)},${Y(W)} ${X(0)},${Y(W - 0.5)}`} fill="url(#h-trap)" stroke={T.trap} strokeOpacity={0.6} />
          <polygon points={`${X(0)},${Y(0)} ${X(0.5)},${Y(0)} ${X(0)},${Y(0.5)}`} fill="url(#h-trap)" stroke={T.trap} strokeOpacity={0.6} />
          <rect x={X(0.6)} y={Y(W)} width={3.6 * S} height={0.09 * S} fill="url(#h-absorb)" />
          <rect x={X(0.6)} y={Y(0.09)} width={(DOOR.x0 - 0.6) * S} height={0.09 * S} fill="url(#h-absorb)" />
          <rect x={X(4.2)} y={Y(W)} width={(L - 4.2) * S} height={0.09 * S} fill="url(#h-hybrid)" />
          <rect x={X(4.2)} y={Y(0.09)} width={(L - 4.2) * S} height={0.09 * S} fill="url(#h-hybrid)" />
          <rect x={X(L - 0.1)} y={Y(W - 0.4)} width={0.1 * S} height={(W - 0.8) * S} fill="url(#h-absorb)" />
          <rect x={X(1.0)} y={Y(W - 0.35)} width={3.2 * S} height={(W - 0.7) * S} fill="none" stroke={T.absorb} strokeDasharray="6 4" strokeOpacity={0.55} rx={6} />
          <text x={X(1.1)} y={Y(W - 0.35) + 16} textAnchor="start" fontSize={10.5} fill={T.absorb} opacity={0.9}>Ceiling clouds overhead</text>
        </g>
      )}

      {/* stage + screen */}
      <rect x={X(0)} y={Y(W)} width={STAGE.depth * S} height={W * S} fill="#161a1f" opacity={0.9} />
      <text x={X(0.3)} y={Y(W) + 14} textAnchor="middle" fontSize={9.5} fill="var(--text-3)" className="svg-mono">STAGE</text>

      {/* riser + steps */}
      <rect x={X(RISER.x0)} y={Y(W)} width={(L - RISER.x0) * S} height={W * S} fill="#15191e" stroke="var(--room-line)" />
      <text x={X(RISER.x0) + 8} y={Y(W / 2) + 4} fontSize={10} fill="var(--text-3)" className="svg-mono" transform={`rotate(-90 ${X(RISER.x0) + 12} ${Y(W / 2)})`} textAnchor="middle">RISER +{RISER.height.toFixed(2)} m</text>
      {[0, 1].map((i) => (
        <rect key={i} x={X(RISER.x0 - 0.5 + i * 0.25)} y={Y(0.8)} width={0.25 * S} height={0.72 * S} fill={i ? "#1a1f25" : "#171b20"} stroke="var(--room-line)" />
      ))}

      {/* beam */}
      {layers.sight && (
        <g>
          <polygon points={`${X(PROJECTOR.lensX)},${Y(PROJECTOR.lensY)} ${X(beamL.x)},${Y(beamL.y)} ${X(beamR.x)},${Y(beamR.y)}`} fill="url(#g-beam)" />
          <line x1={X(r1.earX)} y1={Y(SCREEN.cy)} x2={X(SCREEN.x)} y2={Y(SCREEN.left)} stroke={T.screen} strokeOpacity={0.35} strokeDasharray="3 3" />
          <line x1={X(r1.earX)} y1={Y(SCREEN.cy)} x2={X(SCREEN.x)} y2={Y(SCREEN.right)} stroke={T.screen} strokeOpacity={0.35} strokeDasharray="3 3" />
        </g>
      )}

      {/* seats */}
      {ROWS.map((r) => r.ys.map((y, i) => (
        <g key={`${r.id}-${i}`}>
          <rect x={X(r.x0)} y={Y(y + r.seatW / 2 - 0.03)} width={(r.x1 - r.x0) * S} height={(r.seatW - 0.06) * S} rx={10} fill="var(--seat)" stroke="var(--seat-line)" />
          <rect x={X(r.x1 - 0.22)} y={Y(y + r.seatW / 2 - 0.06)} width={0.18 * S} height={(r.seatW - 0.12) * S} rx={6} fill="#30373f" />
          <circle cx={X(r.earX)} cy={Y(y)} r={3} fill="var(--text-3)" />
        </g>
      )))}
      <text x={X(r1.x0 + 0.5)} y={Y(r1.ys[0] - r1.seatW / 2) + 16} textAnchor="middle" fontSize={11} fill="var(--text-2)" fontWeight={600}>Row 1</text>
      <text x={X(r2.x0 + 0.5)} y={Y(r2.ys[0] - r2.seatW / 2) + 16} textAnchor="middle" fontSize={11} fill="var(--text-2)" fontWeight={600}>Row 2 · riser</text>

      {/* screen */}
      <Hit label="Screen — open details" onClick={() => onPick("screen")}>
        <line className="hit-ring" x1={X(SCREEN.x)} y1={Y(SCREEN.left) + 8} x2={X(SCREEN.x)} y2={Y(SCREEN.right) - 8} stroke={T.screen} strokeWidth={14} strokeOpacity={0.25} />
        <line x1={X(SCREEN.x)} y1={Y(SCREEN.left)} x2={X(SCREEN.x)} y2={Y(SCREEN.right)} stroke={T.screen} strokeWidth={5} filter="url(#glow)" strokeLinecap="round" opacity={is("screen") ? 1 : 0.9} />
        <text x={X(SCREEN.x) + 10} y={Y(SCREEN.cy) - 30} fontSize={10.5} fill={T.screen} transform={`rotate(-90 ${X(SCREEN.x) + 10} ${Y(SCREEN.cy) - 30})`} textAnchor="middle">120″ AT screen</text>
      </Hit>

      {/* projector */}
      <Hit label="Projector — open details" onClick={() => onPick("projector")}>
        <rect className="hit-ring" x={X(5.55) - 5} y={Y(PROJECTOR.lensY + 0.25) - 5} width={0.5 * S + 10} height={0.5 * S + 10} rx={8} fill="none" stroke={T.screen} strokeWidth={1.5} style={is("projector") ? { opacity: 1 } : undefined} />
        <rect className="hit-body" x={X(5.55)} y={Y(PROJECTOR.lensY + 0.25)} width={0.5 * S} height={0.5 * S} rx={6} fill="#132530" stroke={T.screen} strokeDasharray="4 3" />
        <circle cx={X(PROJECTOR.lensX)} cy={Y(PROJECTOR.lensY)} r={4} fill={T.screen} />
        <text x={X(5.8)} y={Y(PROJECTOR.lensY) + 4} textAnchor="middle" fontSize={9} fill={T.screen} fontWeight={600}>JVC</text>
      </Hit>

      {/* subs */}
      {layers.subs && MARKERS.filter((m) => m.role === "sub").map((m) => (
        <Hit key={m.id} label={`${m.label} subwoofer — open details`} onClick={() => onPick("subs")}>
          <rect className="hit-ring" x={X(m.x - SUB_SIZE.d / 2) - 5} y={Y(m.y + SUB_SIZE.w / 2) - 5} width={SUB_SIZE.d * S + 10} height={SUB_SIZE.w * S + 10} rx={8} fill="none" stroke={T.sub} strokeWidth={1.5} style={is("subs") ? { opacity: 1 } : undefined} />
          <rect className="hit-body" x={X(m.x - SUB_SIZE.d / 2)} y={Y(m.y + SUB_SIZE.w / 2)} width={SUB_SIZE.d * S} height={SUB_SIZE.w * S} rx={5} fill="#2a1a13" stroke={T.sub} strokeWidth={1.5} />
          <text x={m.x < 1 ? X(m.x + SUB_SIZE.d / 2) + 6 : X(m.x - SUB_SIZE.d / 2) - 6} y={Y(m.y) + 4} textAnchor={m.x < 1 ? "start" : "end"} fontSize={9.5} fontWeight={700} fill={T.sub}>{m.label}</text>
        </Hit>
      ))}

      {/* speakers */}
      {MARKERS.filter((m) => m.role !== "sub" && visible(m, layers)).map((m) => {
        const inset = m.on === "left" ? 0.14 : m.on === "right" ? -0.14 : 0;
        const xin = m.on === "rear" ? -0.14 : 0;
        return <Speaker key={m.id} m={m} cx={X(m.x + xin)} cy={Y(m.y + inset)} active={is(m.component)} onPick={onPick} r={m.role === "top" ? 10 : 11} />;
      })}

      {/* HVAC */}
      {layers.hvac && (
        <g stroke={T.hvac} fill={T.hvac}>
          {[0.16, W - 0.16].map((y) => (
            <g key={y}>
              <line x1={X(1.0)} y1={Y(y)} x2={X(3.0)} y2={Y(y)} strokeWidth={4} strokeDasharray="10 4" opacity={0.8} />
              <path d={`M ${X(3.1)} ${Y(y)} l -8 -5 l 0 10 z`} stroke="none" />
            </g>
          ))}
          <rect x={X(RISER.x0) - 3} y={Y(1.3)} width={6} height={0.5 * S} opacity={0.9} />
          <text x={X(2.0)} y={Y(W - 0.16) + 16} textAnchor="middle" fontSize={10} stroke="none">Supply slots at ceiling (front half)</text>
          <text x={X(RISER.x0) - 8} y={Y(1.05) + 4} textAnchor="end" fontSize={10} stroke="none">Return in riser face</text>
        </g>
      )}

      {/* AV closet */}
      {closet && (
        <Hit label="AV rack closet — open rack details" onClick={() => onPick("rack")}>
          <rect className="hit-ring" x={X(4.35) - 5} y={Y(0) + wall + 34 - 5} width={1.4 * S + 10} height={0.95 * S + 10} rx={10} fill="none" stroke="var(--g-infrastructure)" strokeWidth={1.5} style={is("rack") ? { opacity: 1 } : undefined} />
          <rect className="hit-body" x={X(4.35)} y={Y(0) + wall + 34} width={1.4 * S} height={0.95 * S} rx={8} fill="#122019" stroke="var(--g-infrastructure)" />
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={X(4.35) + 16} y={Y(0) + wall + 44 + i * 12} width={1.4 * S - 32} height={8} rx={2} fill="var(--g-infrastructure)" opacity={0.18 + (i % 3) * 0.12} />
          ))}
          <text x={X(5.05)} y={Y(0) + wall + 34 + 0.95 * S + 16} textAnchor="middle" fontSize={11} fill="var(--g-infrastructure)" fontWeight={600}>AV closet · 27U rack</text>
        </Hit>
      )}
      {closet && (
        <path d={`M ${X(4.6)} ${Y(0) + wall + 34} C ${X(4.6)} ${Y(0) + 10}, ${X(4.9)} ${Y(0.3)}, ${X(4.9)} ${Y(0.6)}`} fill="none" stroke="var(--g-infrastructure)" strokeDasharray="3 4" opacity={0.7} />
      )}

      {/* dimensions */}
      {layers.dims && (
        <g>
          <Dim x1={X(0)} y1={Y(W) - wall - 50} x2={X(L)} y2={Y(W) - wall - 50} label={`${L.toFixed(2)} m finished length`} />
          <Dim x1={X(0)} y1={Y(W) - wall - 18} x2={X(SCREEN.x)} y2={Y(W) - wall - 18} label="0.60" />
          <Dim x1={X(SCREEN.x)} y1={Y(W) - wall - 18} x2={X(r1.earX)} y2={Y(W) - wall - 18} label={`${(r1.earX - SCREEN.x).toFixed(2)} screen → row-1 ears`} />
          <Dim x1={X(r1.earX)} y1={Y(W) - wall - 18} x2={X(r2.earX)} y2={Y(W) - wall - 18} label={`${(r2.earX - r1.earX).toFixed(2)} pitch`} />
          <Dim x1={X(r2.x1)} y1={Y(W) - wall - 18} x2={X(L)} y2={Y(W) - wall - 18} label={`${(L - r2.x1).toFixed(2)}`} />
          <Dim x1={X(0) - wall - 18} y1={Y(W)} x2={X(0) - wall - 18} y2={Y(0)} label="" vertical />
          <text x={X(0) - wall - 24} y={Y(W / 2)} fontSize={11} fill="var(--text-2)" textAnchor="middle" transform={`rotate(-90 ${X(0) - wall - 24} ${Y(W / 2)})`} className="svg-mono">{W.toFixed(2)} m clear</text>
          <Dim x1={X(2.7)} y1={Y(0)} x2={X(2.7)} y2={Y(r1.ys[0] - r1.seatW / 2)} label="" vertical />
          <text x={X(2.7) - 8} y={Y(0.4) + 4} textAnchor="end" fontSize={11} fill="var(--text-2)" className="svg-mono">0.80 aisle</text>
        </g>
      )}

      <text x={X(0)} y={vh - 10} fontSize={10.5} fill="var(--text-3)">Screen on the left · the door (east) wall runs along the bottom</text>
    </svg>
  );
}

/* ======================================================== front elevation */

export function FrontView({ layers, active, onPick }: ViewProps) {
  const S = 120;
  const pad = { l: 84, t: 36, r: 90, b: 40 };
  const W = ROOM.W;
  const top = ROOM.ceilingBefore + 0.08;
  const X = (y: number) => pad.l + y * S;
  const Z = (z: number) => pad.t + (top - z) * S;
  const vw = pad.l + W * S + pad.r, vh = pad.t + top * S + pad.b;
  const lcr = MARKERS.filter((m) => m.role === "lcr");
  const is = (c: string) => active === c;
  const border = 0.075;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto block" role="img" aria-label="Front elevation looking at the screen">
      <Defs />
      <rect x={X(0)} y={Z(H)} width={W * S} height={H * S} fill="var(--room-floor)" />
      {layers.treatment && <rect x={X(0)} y={Z(H)} width={W * S} height={H * S} fill="url(#h-absorb)" opacity={0.6} />}
      {/* ceilings */}
      <line x1={X(0)} y1={Z(ROOM.ceilingBefore)} x2={X(W)} y2={Z(ROOM.ceilingBefore)} stroke="var(--disagree)" strokeDasharray="6 5" opacity={0.7} />
      <text x={X(0) - 14} y={Z(ROOM.ceilingBefore) + 4} textAnchor="end" fontSize={10.5} fill="var(--disagree)" className="svg-mono">was 2.75</text>
      <rect x={X(0)} y={Z(H) - 6} width={W * S} height={6} fill="var(--room-wall)" />
      <text x={X(0) - 14} y={Z(H) + 8} textAnchor="end" fontSize={10.5} fill="var(--text)" className="svg-mono">{H.toFixed(3)} m</text>
      {/* walls + floor */}
      <rect x={X(0) - 10} y={Z(H) - 6} width={10} height={H * S + 6} fill="var(--room-wall)" />
      <rect x={X(W)} y={Z(H) - 6} width={10} height={H * S + 6} fill="var(--room-wall)" />
      <rect x={X(0) - 10} y={Z(0)} width={W * S + 20} height={8} fill="var(--room-wall)" />
      <rect x={X(0)} y={Z(STAGE.height)} width={W * S} height={STAGE.height * S} fill="#1b2026" />

      {/* LCR and subs behind the screen */}
      {layers.speakers && lcr.map((m) => (
        <Hit key={m.id} label={`${m.label} speaker — open details`} onClick={() => onPick("lcr")}>
          <rect className="hit-body" x={X(m.y) - 0.1375 * S} y={Z(1.4)} width={0.275 * S} height={0.635 * S} rx={4} fill="#2a2415" stroke={T.spk} strokeDasharray={is("lcr") ? undefined : "4 3"} strokeWidth={is("lcr") ? 2 : 1} />
          <circle cx={X(m.y)} cy={Z(1.32)} r={5} fill={T.spk} />
          <circle cx={X(m.y)} cy={Z(1.1)} r={10} fill="none" stroke={T.spk} opacity={0.6} />
          <circle cx={X(m.y)} cy={Z(0.9)} r={10} fill="none" stroke={T.spk} opacity={0.6} />
          <text x={X(m.y)} y={Z(1.4) - 6} textAnchor="middle" fontSize={10} fill={T.spk} fontWeight={700}>{m.label}</text>
        </Hit>
      ))}
      {layers.subs && MARKERS.filter((m) => m.role === "sub" && m.x < 1).map((m) => (
        <Hit key={m.id} label={`${m.label} — open subwoofers`} onClick={() => onPick("subs")}>
          <rect className="hit-body" x={X(m.y) - (SUB_SIZE.w / 2) * S} y={Z(STAGE.height + SUB_SIZE.h)} width={SUB_SIZE.w * S} height={SUB_SIZE.h * S} rx={4} fill="#2a1a13" stroke={T.sub} strokeDasharray="4 3" />
          <text x={X(m.y)} y={Z(STAGE.height + SUB_SIZE.h / 2) + 4} textAnchor="middle" fontSize={10} fill={T.sub} fontWeight={700}>{m.label}</text>
        </Hit>
      ))}

      {/* screen */}
      <Hit label="Screen — open details" onClick={() => onPick("screen")}>
        <rect x={X(SCREEN.left) - (border / 2) * S} y={Z(SCREEN.top) - (border / 2) * S} width={(SCREEN.width + border) * S} height={(SCREEN.height + border) * S} fill="none" stroke="#050607" strokeWidth={border * S} />
        <rect className="hit-body" x={X(SCREEN.left)} y={Z(SCREEN.top)} width={SCREEN.width * S} height={SCREEN.height * S} fill="url(#g-screen)" fillOpacity={0.55} stroke={T.screen} strokeOpacity={is("screen") ? 1 : 0.4} />
        <text x={X(SCREEN.cy)} y={Z(SCREEN.top) + 58} textAnchor="middle" fontSize={12} fill="#cfe9f5" opacity={0.9}>120″ · 2.66 × 1.49 m · acoustically transparent</text>
        <text x={X(SCREEN.cy)} y={Z(SCREEN.top) + 76} textAnchor="middle" fontSize={10.5} fill="#cfe9f5" opacity={0.6}>L / C / R and the front subs sit behind it</text>
      </Hit>

      {/* side-wall speakers */}
      {layers.speakers && MARKERS.filter((m) => m.role === "wide" || m.role === "side").map((m) => {
        const cx = m.on === "left" ? X(0) + 12 : X(W) - 12;
        return <Speaker key={m.id} m={m} cx={cx} cy={Z(m.z)} active={is(m.component)} onPick={onPick} r={10} />;
      })}
      {layers.atmos && [MARKERS.find((m) => m.id === "Ltf")!, MARKERS.find((m) => m.id === "Rtf")!].map((m) => (
        <Hit key={m.id} label="Atmos overheads — open details" onClick={() => onPick("atmos")}>
          <rect className="hit-body" x={X(m.y) - 18} y={Z(H)} width={36} height={7} rx={2} fill={T.top} />
          <text x={X(m.y)} y={Z(H) - 8} textAnchor="middle" fontSize={10} fill={T.top}>3 overheads</text>
        </Hit>
      ))}

      {/* projector lens position */}
      {layers.sight && (
        <Hit label="Projector — open details" onClick={() => onPick("projector")}>
          <circle cx={X(PROJECTOR.lensY)} cy={Z(PROJECTOR.lensZ)} r={7} fill="none" stroke={T.screen} strokeWidth={2} />
          <circle cx={X(PROJECTOR.lensY)} cy={Z(PROJECTOR.lensZ)} r={2.5} fill={T.screen} />
          <text x={X(PROJECTOR.lensY)} y={Z(PROJECTOR.lensZ) + 24} textAnchor="middle" fontSize={10.5} fill={T.screen}>projector lens 2.40 m — on the rear wall, behind you</text>
        </Hit>
      )}

      {layers.dims && (
        <g>
          <Dim x1={X(W) + 36} y1={Z(0)} x2={X(W) + 36} y2={Z(SCREEN.bottom)} label={SCREEN.bottom.toFixed(2)} vertical />
          <Dim x1={X(W) + 36} y1={Z(SCREEN.bottom)} x2={X(W) + 36} y2={Z(SCREEN.top)} label={SCREEN.height.toFixed(2)} vertical />
          <Dim x1={X(W) + 36} y1={Z(SCREEN.top)} x2={X(W) + 36} y2={Z(H)} label={`${Math.round((H - SCREEN.top) * 1000)} mm`} vertical />
          <Dim x1={X(0) - 36} y1={Z(0)} x2={X(0) - 36} y2={Z(1.32)} label="" vertical />
          <text x={X(0) - 44} y={Z(0.66)} fontSize={11} fill="var(--text-2)" textAnchor="middle" transform={`rotate(-90 ${X(0) - 44} ${Z(0.66)})`} className="svg-mono">tweeters 1.32</text>
          <Dim x1={X(SCREEN.left)} y1={Z(SCREEN.bottom) + 16} x2={X(SCREEN.right)} y2={Z(SCREEN.bottom) + 16} label={`${SCREEN.width.toFixed(2)} m`} off={24} />
        </g>
      )}
      <text x={X(0) + 4} y={vh - 12} fontSize={10.5} fill="var(--text-3)">← Left wall (east, door)</text>
      <text x={X(W) - 4} y={vh - 12} fontSize={10.5} fill="var(--text-3)" textAnchor="end">Right wall (west) →</text>
    </svg>
  );
}

/* ========================================================= side elevation */

export function SideView({ layers, active, onPick }: ViewProps) {
  const S = 100;
  const pad = { l: 40, t: 70, r: 70, b: 56 };
  const L = ROOM.L;
  const top = ROOM.ceilingBefore + 0.1;
  const X = (x: number) => pad.l + x * S;
  const Z = (z: number) => pad.t + (top - z) * S;
  const vw = pad.l + L * S + pad.r, vh = pad.t + top * S + pad.b;
  const is = (c: string) => active === c;
  const sl = sightline();
  const study = projectorStudy();
  const r1 = ROWS[0], r2 = ROWS[1];

  const seat = (x0: number, base: number, key: string) => (
    <g key={key} fill="var(--seat)" stroke="var(--seat-line)">
      <rect x={X(x0)} y={Z(base + 0.45)} width={0.95 * S} height={0.45 * S} rx={8} />
      <rect x={X(x0 + 0.72)} y={Z(base + 1.02)} width={0.26 * S} height={0.6 * S} rx={9} />
      <rect x={X(x0 + 0.05)} y={Z(base + 0.62)} width={0.18 * S} height={0.2 * S} rx={5} />
    </g>
  );
  const head = (x: number, ear: number) => (
    <g>
      <circle cx={X(x)} cy={Z(ear + 0.02)} r={0.1 * S} fill="#39414b" />
      <circle cx={X(x) - 2} cy={Z(ear)} r={2.5} fill="var(--text-3)" />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto block" role="img" aria-label="Side section through the theatre">
      <Defs />
      <rect x={X(0)} y={Z(H)} width={L * S} height={H * S} fill="var(--room-floor)" />

      {/* treatment on the left wall */}
      {layers.treatment && (
        <g>
          <rect x={X(0)} y={Z(H)} width={0.12 * S} height={H * S} fill="url(#h-absorb)" />
          <rect x={X(0.6)} y={Z(2.2)} width={3.6 * S} height={1.6 * S} fill="url(#h-absorb)" rx={3} />
          <rect x={X(4.2)} y={Z(1.8)} width={(L - 4.3) * S} height={1.3 * S} fill="url(#h-hybrid)" rx={3} />
          <rect x={X(4.2)} y={Z(H - 0.05)} width={(L - 4.3) * S} height={(H - 0.05 - 1.85) * S} fill="url(#h-diffuse)" rx={3} />
          <rect x={X(L) - 0.1 * S} y={Z(1.9)} width={0.1 * S} height={0.9 * S} fill="url(#h-absorb)" />
          <rect x={X(L) - 0.1 * S} y={Z(H - 0.05)} width={0.1 * S} height={(H - 0.05 - 1.9) * S} fill="url(#h-diffuse)" />
          <rect x={X(1.0)} y={Z(H)} width={3.2 * S} height={ROOM.ceilingTreatment * S} fill="url(#h-absorb)" />
          <rect x={X(L - 0.4)} y={Z(H)} width={0.4 * S} height={0.3 * S} fill="url(#h-trap)" />
          <text x={X(2.4)} y={Z(2.2) + 14} textAnchor="middle" fontSize={10} fill={T.absorb}>Absorption 50–100 mm</text>
          <text x={X(5.1)} y={Z(1.8) + 14} textAnchor="middle" fontSize={10} fill={T.hybrid}>Hybrid (slotted oak)</text>
        </g>
      )}

      {/* door on the left wall */}
      <rect x={X(DOOR.x0)} y={Z(DOOR.height)} width={(DOOR.x1 - DOOR.x0) * S} height={DOOR.height * S} fill="none" stroke="var(--text-3)" strokeDasharray="5 4" rx={2} />
      <text x={X((DOOR.x0 + DOOR.x1) / 2)} y={Z(DOOR.height) + 14} textAnchor="middle" fontSize={10} fill="var(--text-3)">Door (left wall)</text>

      {/* ceilings */}
      <line x1={X(0)} y1={Z(ROOM.ceilingBefore)} x2={X(L)} y2={Z(ROOM.ceilingBefore)} stroke="var(--disagree)" strokeDasharray="6 5" opacity={0.7} />
      <text x={X(L) + 6} y={Z(ROOM.ceilingBefore) + 4} fontSize={10.5} fill="var(--disagree)" className="svg-mono">2.75 was</text>
      <rect x={X(0)} y={Z(H) - 6} width={L * S} height={6} fill="var(--room-wall)" />
      <text x={X(L) + 6} y={Z(H) + 6} fontSize={10.5} fill="var(--text)" className="svg-mono">{H.toFixed(3)}</text>
      <rect x={X(0) - 8} y={Z(H) - 6} width={8} height={H * S + 6} fill="var(--room-wall)" />
      <rect x={X(L)} y={Z(H) - 6} width={8} height={H * S + 6} fill="var(--room-wall)" />
      <rect x={X(0) - 8} y={Z(0)} width={L * S + 16} height={8} fill="var(--room-wall)" />

      {/* stage, riser, steps */}
      <rect x={X(0)} y={Z(STAGE.height)} width={STAGE.depth * S} height={STAGE.height * S} fill="#1b2026" />
      <rect x={X(RISER.x0)} y={Z(RISER.height)} width={(L - RISER.x0) * S} height={RISER.height * S} fill="#1a1f25" stroke="var(--room-line)" />
      <rect x={X(RISER.x0 - 0.5)} y={Z(RISER.stepRise)} width={0.25 * S} height={RISER.stepRise * S} fill="#1a1f25" opacity={0.6} stroke="var(--room-line)" />
      <rect x={X(RISER.x0 - 0.25)} y={Z(RISER.stepRise * 2)} width={0.25 * S} height={RISER.stepRise * 2 * S} fill="#1a1f25" opacity={0.6} stroke="var(--room-line)" />

      {/* beam + sightline */}
      {layers.sight && (
        <g>
          <polygon points={`${X(PROJECTOR.lensX)},${Z(PROJECTOR.lensZ)} ${X(SCREEN.x)},${Z(SCREEN.top)} ${X(SCREEN.x)},${Z(SCREEN.bottom)}`} fill="url(#g-beam)" />
          <line x1={X(r2.earX)} y1={Z(sl.eyeZ)} x2={X(SCREEN.x)} y2={Z(SCREEN.bottom)} stroke="#f0cf8e" strokeDasharray="5 4" />
          <text x={X(r1.earX) - 8} y={Z(sl.zAtRow1) - 10} fontSize={10.5} fill="#f0cf8e" textAnchor="middle">{Math.round(sl.clearance * 1000)} mm over row-1 heads</text>
          {/* the old mid-room mount, for comparison */}
          <rect x={X(study.midRoom.lensX - 0.25)} y={Z(H)} width={0.5 * S} height={(H - study.midRoom.boxBottom) * S} fill="none" stroke="var(--disagree)" strokeDasharray="4 3" opacity={0.8} />
          <text x={X(study.midRoom.lensX - 0.25)} y={Z(study.midRoom.boxBottom) + 13} textAnchor="start" fontSize={9.5} fill="var(--disagree)">✕ old mount hits heads</text>
          {/* standing on the riser */}
          <g opacity={0.8}>
            <line x1={X(4.5)} y1={Z(RISER.height)} x2={X(4.5)} y2={Z(RISER.height + SEATED.standing - 0.2)} stroke="var(--text-3)" strokeWidth={3} strokeLinecap="round" />
            <circle cx={X(4.5)} cy={Z(RISER.height + SEATED.standing - 0.1)} r={0.1 * S} fill="none" stroke="var(--text-3)" strokeWidth={2} />
          </g>
        </g>
      )}

      {/* seats */}
      {seat(r1.x0 - 0.05, 0, "s1")}{head(r1.earX, r1.earZ)}
      {seat(r2.x0 - 0.05, RISER.height, "s2")}{head(r2.earX, r2.earZ)}

      {/* screen */}
      <Hit label="Screen — open details" onClick={() => onPick("screen")}>
        <line x1={X(SCREEN.x)} y1={Z(SCREEN.bottom)} x2={X(SCREEN.x)} y2={Z(SCREEN.top)} stroke={T.screen} strokeWidth={5} filter="url(#glow)" opacity={is("screen") ? 1 : 0.85} />
      </Hit>

      {/* LCR + front subs */}
      {layers.speakers && (
        <Hit label="L/C/R — open details" onClick={() => onPick("lcr")}>
          <rect className="hit-body" x={X(0.1)} y={Z(1.4)} width={0.4 * S} height={0.635 * S} rx={4} fill="#2a2415" stroke={T.spk} strokeWidth={is("lcr") ? 2 : 1} />
          <text x={X(0.3)} y={Z(1.4) - 6} textAnchor="middle" fontSize={10} fill={T.spk} fontWeight={700}>LCR</text>
        </Hit>
      )}
      {layers.subs && (
        <>
          <Hit label="Front subwoofers — open details" onClick={() => onPick("subs")}>
            <rect className="hit-body" x={X(0.05)} y={Z(STAGE.height + SUB_SIZE.h)} width={SUB_SIZE.d * S} height={SUB_SIZE.h * S} rx={4} fill="#2a1a13" stroke={T.sub} />
            <text x={X(0.32)} y={Z(STAGE.height + 0.25)} textAnchor="middle" fontSize={9.5} fill={T.sub} fontWeight={700}>SW1·2</text>
          </Hit>
          <Hit label="Rear subwoofers — open details" onClick={() => onPick("subs")}>
            <rect className="hit-body" x={X(L - SUB_SIZE.d - 0.02)} y={Z(RISER.height + SUB_SIZE.h)} width={SUB_SIZE.d * S} height={SUB_SIZE.h * S} rx={4} fill="#2a1a13" stroke={T.sub} strokeDasharray="4 3" />
            <text x={X(L - 0.3)} y={Z(RISER.height + 0.25)} textAnchor="middle" fontSize={9.5} fill={T.sub} fontWeight={700}>SW3·4</text>
          </Hit>
        </>
      )}

      {/* wall speakers */}
      {layers.speakers && MARKERS.filter((m) => m.id === "Lw" || m.id === "Lss" || m.id === "Lrs").map((m) => (
        <Speaker key={m.id} m={m} cx={X(m.on === "rear" ? m.x - 0.12 : m.x)} cy={Z(m.z)} active={is(m.component)} onPick={onPick} r={11} />
      ))}

      {/* Atmos */}
      {layers.atmos && MARKERS.filter((m) => m.role === "top" && m.label.startsWith("L")).map((m) => {
        const e1 = elevation(m, 0), e2 = elevation(m, 1);
        return (
          <g key={m.id}>
            {layers.sight && (
              <>
                <line x1={X(m.x)} y1={Z(H)} x2={X(r1.earX)} y2={Z(r1.earZ)} stroke={T.top} strokeOpacity={0.25} />
                <line x1={X(m.x)} y1={Z(H)} x2={X(r2.earX)} y2={Z(r2.earZ)} stroke={T.top} strokeOpacity={0.18} strokeDasharray="3 3" />
              </>
            )}
            <Hit label={`${m.label.replace(/^L/, "")} overhead pair — open Atmos`} onClick={() => onPick("atmos")}>
              <rect className="hit-body" x={X(m.x) - 16} y={Z(H)} width={32} height={8} rx={2} fill={T.top} stroke={is("atmos") ? "#fff" : "none"} />
              <text x={X(m.x)} y={Z(ROOM.ceilingBefore) - 26} textAnchor="middle" fontSize={10.5} fill={T.top} fontWeight={600}>{m.label.slice(1).toUpperCase()}</text>
              <text x={X(m.x)} y={Z(ROOM.ceilingBefore) - 12} textAnchor="middle" fontSize={9.5} fill="var(--text-3)" className="svg-mono">R1 {e1.deg}°{e1.where === "behind" ? " back" : ""} · R2 {e2.deg}°{e2.where === "behind" ? " back" : ""}</text>
            </Hit>
          </g>
        );
      })}

      {/* projector */}
      <Hit label="Projector — open details" onClick={() => onPick("projector")}>
        <rect className="hit-body" x={X(L - 0.5)} y={Z(H)} width={0.5 * S} height={(H - PROJECTOR.boxBottom) * S} rx={4} fill="#132530" stroke={T.screen} strokeWidth={is("projector") ? 2 : 1} />
        <circle cx={X(PROJECTOR.lensX)} cy={Z(PROJECTOR.lensZ)} r={4} fill={T.screen} />
        <text x={X(L - 0.2)} y={Z(PROJECTOR.boxBottom) - 8} textAnchor="middle" fontSize={9.5} fill={T.screen} fontWeight={700}>JVC</text>
      </Hit>

      {/* HVAC */}
      {layers.hvac && (
        <g stroke={T.hvac} fill={T.hvac}>
          <line x1={X(1.0)} y1={Z(H) + 10} x2={X(3.0)} y2={Z(H) + 10} strokeWidth={3} strokeDasharray="8 4" />
          <path d={`M ${X(3.15)} ${Z(H) + 10} l -9 -5 l 0 10 z`} stroke="none" />
          <text x={X(2)} y={Z(H) + 26} textAnchor="middle" fontSize={10} stroke="none">Supply along the ceiling, front half</text>
          <path d={`M ${X(RISER.x0) - 30} ${Z(0.22)} L ${X(RISER.x0) - 2} ${Z(0.22)}`} strokeWidth={2} />
          <path d={`M ${X(RISER.x0)} ${Z(0.22)} l -9 -5 l 0 10 z`} stroke="none" />
          <text x={X(RISER.x0) - 34} y={Z(0.22) + 4} textAnchor="end" fontSize={10} stroke="none">Return into riser</text>
        </g>
      )}

      {layers.dims && (
        <g>
          <Dim x1={X(SCREEN.x)} y1={Z(0) + 22} x2={X(r1.earX)} y2={Z(0) + 22} label={`${(r1.earX - SCREEN.x).toFixed(2)}`} off={24} />
          <Dim x1={X(r1.earX)} y1={Z(0) + 22} x2={X(r2.earX)} y2={Z(0) + 22} label={`${(r2.earX - r1.earX).toFixed(2)}`} off={24} />
          <Dim x1={X(r2.earX)} y1={Z(0) + 22} x2={X(L)} y2={Z(0) + 22} label={`${(L - r2.earX).toFixed(2)}`} off={24} />
          <Dim x1={X(L) + 36} y1={Z(0)} x2={X(L) + 36} y2={Z(RISER.height)} label={RISER.height.toFixed(2)} vertical />
          <Dim x1={X(4.5) - 22} y1={Z(RISER.height + SEATED.standing)} x2={X(4.5) - 22} y2={Z(H)} label="" vertical />
          <text x={X(4.5) - 30} y={Z(H - 0.22)} textAnchor="end" fontSize={10.5} fill="var(--text-2)" className="svg-mono">{Math.round((H - RISER.height - SEATED.standing) * 1000)} mm</text>
        </g>
      )}
    </svg>
  );
}

/* =============================================================== 3D view */

type V3 = [number, number, number];
interface Face { pts: V3[]; fill: string; stroke?: string; opacity?: number; component?: string; label?: string }

function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, fill: string, extra: Partial<Face> = {}): Face[] {
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  return [
    { pts: [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], fill, ...extra },
    { pts: [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)], fill, ...extra, opacity: (extra.opacity ?? 1) * 0.85 },
    { pts: [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)], fill, ...extra, opacity: (extra.opacity ?? 1) * 0.85 },
    { pts: [p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, z1), p(x0, y0, z1)], fill, ...extra, opacity: (extra.opacity ?? 1) * 0.7 },
    { pts: [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)], fill, ...extra, opacity: (extra.opacity ?? 1) * 0.7 },
  ];
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
}

export function View3D({ layers, active, onPick }: ViewProps) {
  const [yaw, setYaw] = useState(0.62);
  const [pitch, setPitch] = useState(0.52);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const L = ROOM.L, W = ROOM.W;

  const faces = useMemo(() => {
    const f: Face[] = [];
    f.push(...box(0, 0, 0, STAGE.depth, W, STAGE.height, "#1d2229"));
    f.push(...box(RISER.x0, 0, 0, L, W, RISER.height, "#1b2027"));
    f.push(...box(RISER.x0 - 0.5, 0.05, 0, RISER.x0 - 0.25, 0.8, RISER.stepRise, "#1b2027"));
    f.push(...box(RISER.x0 - 0.25, 0.05, 0, RISER.x0, 0.8, RISER.stepRise * 2, "#1b2027"));
    for (const r of ROWS) for (const y of r.ys) {
      f.push(...box(r.x0, y - r.seatW / 2 + 0.04, r.base, r.x1, y + r.seatW / 2 - 0.04, r.base + 0.45, "#2a3038"));
      f.push(...box(r.x1 - 0.25, y - r.seatW / 2 + 0.06, r.base + 0.45, r.x1, y + r.seatW / 2 - 0.06, r.base + 1.05, "#303740"));
    }
    f.push({ pts: [[SCREEN.x, SCREEN.left, SCREEN.bottom], [SCREEN.x, SCREEN.right, SCREEN.bottom], [SCREEN.x, SCREEN.right, SCREEN.top], [SCREEN.x, SCREEN.left, SCREEN.top]], fill: "#2c5a70", stroke: T.screen, component: "screen", label: "Screen" });
    f.push(...box(L - 0.5, PROJECTOR.lensY - 0.25, PROJECTOR.boxBottom, L, PROJECTOR.lensY + 0.25, H, "#16303d", { component: "projector", label: "Projector", stroke: T.screen }));
    if (layers.speakers) {
      for (const m of MARKERS.filter((m) => m.role === "lcr")) f.push(...box(0.1, m.y - 0.14, 0.77, 0.5, m.y + 0.14, 1.4, "#5d4b25", { component: "lcr", label: m.label, stroke: T.spk }));
      for (const m of MARKERS.filter((m) => ["wide", "side", "rear"].includes(m.role))) {
        const [x0, x1] = m.on === "rear" ? [L - 0.17, L] : [m.x - 0.19, m.x + 0.19];
        const [y0, y1] = m.on === "left" ? [0, 0.17] : m.on === "right" ? [W - 0.17, W] : [m.y - 0.19, m.y + 0.19];
        f.push(...box(x0, y0, m.z - 0.19, x1, y1, m.z + 0.19, "#6b5528", { component: m.component, label: m.label, stroke: T.spk }));
      }
    }
    if (layers.atmos) for (const m of MARKERS.filter((m) => m.role === "top")) {
      f.push({ pts: [[m.x - 0.13, m.y - 0.13, H - 0.005], [m.x + 0.13, m.y - 0.13, H - 0.005], [m.x + 0.13, m.y + 0.13, H - 0.005], [m.x - 0.13, m.y + 0.13, H - 0.005]], fill: T.top, component: "atmos", label: m.label });
    }
    if (layers.subs) for (const m of MARKERS.filter((m) => m.role === "sub")) {
      f.push(...box(m.x - SUB_SIZE.d / 2, m.y - SUB_SIZE.w / 2, m.z, m.x + SUB_SIZE.d / 2, m.y + SUB_SIZE.w / 2, m.z + SUB_SIZE.h, "#5a3322", { component: "subs", label: m.label, stroke: T.sub }));
    }
    return f;
  }, [layers.speakers, layers.atmos, layers.subs, L, W]);

  const S = 78;
  const cx = 360, cy = 250;
  const proj = (p: V3) => {
    const px = p[1] - W / 2, py = L / 2 - p[0], pz = p[2] - H / 2;
    const x1 = px * Math.cos(yaw) - py * Math.sin(yaw);
    const y1 = px * Math.sin(yaw) + py * Math.cos(yaw);
    const up = pz * Math.cos(pitch) + y1 * Math.sin(pitch);
    const depth = y1 * Math.cos(pitch) - pz * Math.sin(pitch);
    return { x: cx + x1 * S, y: cy - up * S, d: depth };
  };

  const ordered = faces
    .map((f) => {
      const pp = f.pts.map(proj);
      return { f, pp, d: pp.reduce((a, q) => a + q.d, 0) / pp.length };
    })
    .sort((a, b) => b.d - a.d);

  // Room shell: floor, plus the walls on the far side of the camera.
  const corners: V3[] = [[0, 0, 0], [L, 0, 0], [L, W, 0], [0, W, 0]];
  const walls: { pts: V3[]; name: string }[] = [
    { name: "front", pts: [[0, 0, 0], [0, W, 0], [0, W, H], [0, 0, H]] },
    { name: "rear", pts: [[L, 0, 0], [L, W, 0], [L, W, H], [L, 0, H]] },
    { name: "left", pts: [[0, 0, 0], [L, 0, 0], [L, 0, H], [0, 0, H]] },
    { name: "right", pts: [[0, W, 0], [L, W, 0], [L, W, H], [0, W, H]] },
  ];
  const centre = proj([L / 2, W / 2, H / 2]).d;
  const backWalls = walls.filter((w) => w.pts.map(proj).reduce((a, q) => a + q.d, 0) / 4 > centre);
  const pathOf = (pp: { x: number; y: number }[]) => `M ${pp.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" L ")} Z`;

  const onDown = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, yaw, pitch }; };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.008);
    setPitch(Math.max(0.05, Math.min(1.45, drag.current.pitch + (e.clientY - drag.current.y) * 0.006)));
  };
  const onUp = () => { drag.current = null; };

  const beam = [proj([PROJECTOR.lensX, PROJECTOR.lensY, PROJECTOR.lensZ]), proj([SCREEN.x, SCREEN.left, SCREEN.bottom]), proj([SCREEN.x, SCREEN.right, SCREEN.bottom]), proj([SCREEN.x, SCREEN.right, SCREEN.top]), proj([SCREEN.x, SCREEN.left, SCREEN.top])];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[
          { l: "From the rear corner", y: 0.62, p: 0.52 },
          { l: "From above", y: 0, p: 1.42 },
          { l: "From the door", y: 1.5, p: 0.35 },
          { l: "Behind row 2", y: 0, p: 0.3 },
        ].map((v) => (
          <button key={v.l} className="btn btn-sm" onClick={() => { setYaw(v.y); setPitch(v.p); }}>{v.l}</button>
        ))}
        <span className="t3 text-[12.5px] ml-1">Drag to orbit</span>
      </div>
      <svg
        viewBox="0 0 720 500" className="w-full h-auto block touch-none select-none rounded-xl" style={{ background: "radial-gradient(closest-side, #14181d, #0b0c0e)", cursor: drag.current ? "grabbing" : "grab" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        role="img" aria-label="3D view of the theatre; drag to rotate"
      >
        <Defs />
        <path d={pathOf(corners.map(proj))} fill="#111418" stroke="#2f3640" />
        {backWalls.map((w) => (
          <path key={w.name} d={pathOf(w.pts.map(proj))} fill={w.name === "front" && layers.treatment ? "#12201f" : "#15191e"} stroke="#2f3640" opacity={0.92} />
        ))}
        {/* ceiling outline, before and after */}
        <path d={pathOf(corners.map((c) => proj([c[0], c[1], H])))} fill="none" stroke="#3b434e" strokeDasharray="4 4" />
        <path d={pathOf(corners.map((c) => proj([c[0], c[1], ROOM.ceilingBefore])))} fill="none" stroke="var(--disagree)" strokeOpacity={0.4} strokeDasharray="2 6" />
        {ordered.map(({ f, pp }, i) => {
          const body = <path d={pathOf(pp)} fill={f.fill.startsWith("#") ? shade(f.fill, 0.75 + 0.25 * (f.opacity ?? 1)) : f.fill} stroke={f.stroke ?? "#0c0e11"} strokeWidth={0.8} strokeOpacity={f.stroke ? 0.8 : 0.6} opacity={active && f.component && f.component !== active ? 0.55 : 1} />;
          return f.component ? (
            <Hit key={i} label={`${f.label} — open ${f.component}`} onClick={() => onPick(f.component!)}>{body}</Hit>
          ) : <g key={i}>{body}</g>;
        })}
        {layers.sight && (
          <g opacity={0.9}>
            {beam.slice(1).map((q, i) => <line key={i} x1={beam[0].x} y1={beam[0].y} x2={q.x} y2={q.y} stroke={T.screen} strokeOpacity={0.3} />)}
          </g>
        )}
      </svg>
    </div>
  );
}
