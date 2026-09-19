"use client";

import React from "react";
import type { Fit, Finish, Opening } from "@/lib/plans/geometry";

/**
 * The parts of a plan that are drawing rather than data: floor textures, the
 * furniture layer, and the openings cut into the walls.
 *
 * A plan without its fittings is a diagram of rectangles — you cannot tell a
 * bedroom from a store, and nothing about it feels like the house. The beds,
 * counters, stairs and glazing here are traced from the architect's drawings
 * for one reason: so that the room you click is recognisably the room you
 * stood in.
 */

export const INK = "#6f6558";
export const WALL_FILL = "#4b453d";

const FINISH_FILL: Record<Finish, string> = {
  wood: "#dcc0996b", stone: "#f0ede6", tile: "#e2e7e8", deck: "#cba9826b",
  paving: "#e7e4de", grass: "#dae6cc", service: "#ddd8ce", void: "#efece6", water: "#d8e6ea",
};

/** Floor textures. Ids are scoped so two plans can share a page. */
export function PlanDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <pattern id={`${uid}-wood`} width="52" height="16" patternUnits="userSpaceOnUse">
        <rect width="52" height="16" fill="#dfc59f" />
        <path d="M0 0h52M0 16h52" stroke="#cdac83" strokeWidth="0.7" />
        <path d="M26 0v16" stroke="#cdac83" strokeWidth="0.6" opacity="0.7" />
      </pattern>
      <pattern id={`${uid}-tile`} width="17" height="17" patternUnits="userSpaceOnUse">
        <rect width="17" height="17" fill="#e8e8e4" />
        <path d="M0 0h17M0 0v17" stroke="#d5d5cd" strokeWidth="0.8" />
      </pattern>
      <pattern id={`${uid}-stone`} width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="#f2efe9" />
        <path d="M-6 18c14 6 26-4 40 2s20 0 32 6" stroke="#e5e0d5" strokeWidth="1" fill="none" />
        <path d="M-6 46c16-5 24 5 38 1s18-6 34-2" stroke="#e8e3d9" strokeWidth="0.9" fill="none" />
      </pattern>
      <pattern id={`${uid}-deck`} width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#cfae89" />
        <path d="M0 13.4h14" stroke="#b18e68" strokeWidth="1.1" />
      </pattern>
      <pattern id={`${uid}-paving`} width="26" height="26" patternUnits="userSpaceOnUse">
        <rect width="26" height="26" fill="#e9e6e0" />
        <path d="M0 0h26M0 0v26" stroke="#d8d3c9" strokeWidth="0.9" />
      </pattern>
      <pattern id={`${uid}-grass`} width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#dde8cf" />
        <path d="M4 14c1-3 2-4 2-6M11 17c1-3 2-5 2-7M16 11c1-2 1-4 1-5" stroke="#c2d4ac" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </pattern>
      <pattern id={`${uid}-service`} width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#dfdad0" />
      </pattern>
      <pattern id={`${uid}-void`} width="13" height="13" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="13" height="13" fill="#efece6" />
        <line x1="0" y1="0" x2="0" y2="13" stroke="#c9bfae" strokeWidth="1.5" />
      </pattern>
      <pattern id={`${uid}-water`} width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#dbe8ec" />
      </pattern>
      <pattern id={`${uid}-hedge`} width="11" height="11" patternUnits="userSpaceOnUse">
        <rect width="11" height="11" fill="#b9cfa6" />
        <circle cx="5.5" cy="5.5" r="3.4" fill="#a8c294" />
      </pattern>
      <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6a5b47" floodOpacity="0.16" />
      </filter>
      <filter id={`${uid}-lift`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#5c4a33" floodOpacity="0.3" />
      </filter>
    </defs>
  );
}

export const finishFill = (uid: string, f: Finish, flat = false) =>
  flat ? FINISH_FILL[f] : `url(#${uid}-${f})`;

/* --------------------------------------------------------------- fixtures */

const S = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const SOFT = "#ffffffcc";

/** One piece of furniture or sanitaryware, drawn in plan. */
export function Fixture({ f }: { f: Fit }) {
  switch (f.t) {
    case "bed": {
      // The pillow band sits at the head, opposite the way the bed faces.
      const head =
        f.face === "s" ? { x: f.x, y: f.y, w: f.w, h: f.h * 0.2 }
        : f.face === "n" ? { x: f.x, y: f.y + f.h * 0.8, w: f.w, h: f.h * 0.2 }
        : f.face === "e" ? { x: f.x, y: f.y, w: f.w * 0.2, h: f.h }
        : { x: f.x + f.w * 0.8, y: f.y, w: f.w * 0.2, h: f.h };
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="4" fill={SOFT} {...S} />
          <rect {...head} rx="3" fill="#e9e1d4" stroke={INK} strokeWidth="1.2" />
          <rect
            x={f.face === "e" ? f.x + f.w * 0.42 : f.x + 3}
            y={f.face === "s" ? f.y + f.h * 0.42 : f.face === "n" ? f.y + 3 : f.y + 3}
            width={f.face === "e" || f.face === "w" ? f.w * 0.56 : f.w - 6}
            height={f.face === "n" || f.face === "s" ? f.h * 0.54 : f.h - 6}
            rx="3" fill="#f4efe6" stroke={INK} strokeWidth="1"
          />
        </g>
      );
    }
    case "sofa":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="5" fill={SOFT} {...S} />
          <rect x={f.x + 3} y={f.face === "n" ? f.y + f.h - 11 : f.y + 3} width={f.w - 6} height="8" rx="3" fill="#e9e1d4" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "lsofa": {
      const armW = Math.min(30, f.w * 0.34);
      const west = f.face === "w";
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h * 0.42} rx="5" fill={SOFT} {...S} />
          <rect x={west ? f.x + f.w - armW : f.x} y={f.y} width={armW} height={f.h} rx="5" fill={SOFT} {...S} />
          <rect x={f.x + 4} y={f.y + 3} width={f.w - 8} height="7" rx="3" fill="#e9e1d4" stroke={INK} strokeWidth="1" />
        </g>
      );
    }
    case "chair":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.s ?? 18} height={f.s ?? 18} rx="4" fill={SOFT} {...S} />
        </g>
      );
    case "table":
      return f.round ? (
        <circle cx={f.x + f.w / 2} cy={f.y + f.h / 2} r={Math.min(f.w, f.h) / 2} fill={SOFT} {...S} />
      ) : (
        <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="3" fill={SOFT} {...S} />
      );
    case "island":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="3" fill="#efe7da" {...S} />
          <rect x={f.x + f.w * 0.34} y={f.y + f.h * 0.3} width={f.w * 0.3} height={f.h * 0.4} rx="2" fill="none" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "run": {
      const vertical = f.h > f.w;
      const n = Math.max(2, Math.round((vertical ? f.h : f.w) / 13));
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#e7ded0" stroke={INK} strokeWidth="1.2" />
          {f.kind === "wardrobe" &&
            Array.from({ length: n }).map((_, i) =>
              vertical ? (
                <line key={i} x1={f.x + 1.5} y1={f.y + ((i + 0.5) * f.h) / n} x2={f.x + f.w - 1.5} y2={f.y + ((i + 0.5) * f.h) / n} stroke={INK} strokeWidth="0.8" opacity="0.75" />
              ) : (
                <line key={i} x1={f.x + ((i + 0.5) * f.w) / n} y1={f.y + 1.5} x2={f.x + ((i + 0.5) * f.w) / n} y2={f.y + f.h - 1.5} stroke={INK} strokeWidth="0.8" opacity="0.75" />
              ),
            )}
        </g>
      );
    }
    case "wc": {
      const w = 15, h = 21;
      return (
        <g transform={`translate(${f.x} ${f.y})`}>
          <rect x="0" y="0" width={w} height="5" rx="1.5" fill="#f6f2ea" stroke={INK} strokeWidth="1.1" />
          <ellipse cx={w / 2} cy={h * 0.6} rx={w * 0.42} ry={h * 0.36} fill={SOFT} stroke={INK} strokeWidth="1.2" />
        </g>
      );
    }
    case "basin":
      return (
        <g transform={`translate(${f.x} ${f.y})`}>
          <rect x="0" y="0" width="20" height="14" rx="3" fill={SOFT} stroke={INK} strokeWidth="1.2" />
          <circle cx="10" cy="7" r="4.2" fill="none" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "shower":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="2" fill="#eaf0f1" stroke={INK} strokeWidth="1.2" />
          <line x1={f.x} y1={f.y} x2={f.x + f.w} y2={f.y + f.h} stroke={INK} strokeWidth="0.8" opacity="0.55" />
          <circle cx={f.x + f.w / 2} cy={f.y + f.h / 2} r="2.4" fill="none" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "tub":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="6" fill={SOFT} {...S} />
          <rect x={f.x + 4} y={f.y + 4} width={f.w - 8} height={f.h - 8} rx="5" fill="none" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "car":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="14" fill="#f3f1ec" stroke={INK} strokeWidth="1.4" />
          <rect x={f.x + 6} y={f.y + f.h * 0.2} width={f.w - 12} height={f.h * 0.22} rx="5" fill="#e2ded5" stroke={INK} strokeWidth="1" />
          <rect x={f.x + 6} y={f.y + f.h * 0.52} width={f.w - 12} height={f.h * 0.26} rx="5" fill="#e2ded5" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "tree":
      return (
        <g>
          <circle cx={f.x} cy={f.y} r={f.r} fill="#bfd6a9" stroke="#9dba86" strokeWidth="1.2" />
          <circle cx={f.x} cy={f.y} r={f.r * 0.62} fill="none" stroke="#a9c493" strokeWidth="1" />
          <circle cx={f.x} cy={f.y} r="2.4" fill="#8aa473" />
        </g>
      );
    case "planter":
      return <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="4" fill="#c6daaf" stroke="#9dba86" strokeWidth="1.2" />;
    case "screen":
      return <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="2" fill="#4b453d" opacity="0.8" />;
    case "lift":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="2" fill="#e6e2d9" stroke={INK} strokeWidth="1.2" />
          <path d={`M${f.x} ${f.y}L${f.x + f.w} ${f.y + f.h}M${f.x + f.w} ${f.y}L${f.x} ${f.y + f.h}`} stroke={INK} strokeWidth="0.9" opacity="0.6" />
        </g>
      );
    case "appliance":
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx="2.5" fill="#f1ede5" stroke={INK} strokeWidth="1.2" />
          <circle cx={f.x + f.w / 2} cy={f.y + f.h / 2} r={Math.min(f.w, f.h) * 0.3} fill="none" stroke={INK} strokeWidth="1" />
        </g>
      );
    case "stair": {
      const n = f.steps ?? 11;
      const horiz = f.dir === "e" || f.dir === "w";
      const lines = Array.from({ length: n }).map((_, i) => {
        const t = (i + 1) / (n + 1);
        return horiz ? (
          <line key={i} x1={f.x + f.w * t} y1={f.y} x2={f.x + f.w * t} y2={f.y + f.h} stroke={INK} strokeWidth="1" opacity="0.65" />
        ) : (
          <line key={i} x1={f.x} y1={f.y + f.h * t} x2={f.x + f.w} y2={f.y + f.h * t} stroke={INK} strokeWidth="1" opacity="0.65" />
        );
      });
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#efece4" stroke={INK} strokeWidth="1.2" />
          {lines}
          {f.split && horiz && <line x1={f.x} y1={f.y + f.h / 2} x2={f.x + f.w} y2={f.y + f.h / 2} stroke={INK} strokeWidth="1.6" />}
          {f.split && !horiz && <line x1={f.x + f.w / 2} y1={f.y} x2={f.x + f.w / 2} y2={f.y + f.h} stroke={INK} strokeWidth="1.6" />}
          <Arrow x={f.x} y={f.y} w={f.w} h={f.h} dir={f.dir} />
        </g>
      );
    }
    default:
      return null;
  }
}

function Arrow({ x, y, w, h, dir }: { x: number; y: number; w: number; h: number; dir: "n" | "s" | "e" | "w" }) {
  const cx = x + w / 2, cy = y + h / 2;
  const len = (dir === "e" || dir === "w" ? w : h) * 0.34;
  const p =
    dir === "n" ? `M${cx} ${cy + len}L${cx} ${cy - len}M${cx - 4} ${cy - len + 6}L${cx} ${cy - len}L${cx + 4} ${cy - len + 6}`
    : dir === "s" ? `M${cx} ${cy - len}L${cx} ${cy + len}M${cx - 4} ${cy + len - 6}L${cx} ${cy + len}L${cx + 4} ${cy + len - 6}`
    : dir === "e" ? `M${cx - len} ${cy}L${cx + len} ${cy}M${cx + len - 6} ${cy - 4}L${cx + len} ${cy}L${cx + len - 6} ${cy + 4}`
    : `M${cx + len} ${cy}L${cx - len} ${cy}M${cx - len + 6} ${cy - 4}L${cx - len} ${cy}L${cx - len + 6} ${cy + 4}`;
  return <path d={p} stroke="#8a7f70" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

/* --------------------------------------------------------------- openings */

/** Windows, sliders, doors and cased openings, drawn into the wall line. */
export function OpeningMark({ o, wall }: { o: Opening; wall: number }) {
  const t = wall + 1.5;
  const horiz = o.dir === "h";
  const box = horiz
    ? { x: o.x, y: o.y - t / 2, w: o.len, h: t }
    : { x: o.x - t / 2, y: o.y, w: t, h: o.len };

  if (o.k === "window" || o.k === "slider") {
    const lines = o.k === "slider" ? 3 : 2;
    return (
      <g>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#eef4f6" stroke="#93a3ac" strokeWidth="0.9" />
        {Array.from({ length: lines }).map((_, i) =>
          horiz ? (
            <line key={i} x1={box.x} y1={box.y + ((i + 1) * box.h) / (lines + 1)} x2={box.x + box.w} y2={box.y + ((i + 1) * box.h) / (lines + 1)} stroke="#7d96a3" strokeWidth="0.9" />
          ) : (
            <line key={i} x1={box.x + ((i + 1) * box.w) / (lines + 1)} y1={box.y} x2={box.x + ((i + 1) * box.w) / (lines + 1)} y2={box.y + box.h} stroke="#7d96a3" strokeWidth="0.9" />
          ),
        )}
      </g>
    );
  }

  if (o.k === "arch") {
    return <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#f4f1ea" />;
  }

  // A door: the leaf swung open, with its arc.
  const sw = o.swing ?? 1;
  const pair = o.k === "dbldoor";
  const leaf = pair ? o.len / 2 : o.len;
  const doors = pair ? [0, 1] : [o.hinge ?? 0];
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#f4f1ea" />
      {doors.map((h, i) => {
        // hinge point, then the leaf standing open at 90 degrees
        const hx = horiz ? (pair ? (i === 0 ? o.x : o.x + o.len) : h ? o.x + o.len : o.x) : o.x;
        const hy = horiz ? o.y : pair ? (i === 0 ? o.y : o.y + o.len) : h ? o.y + o.len : o.y;
        const sgn = pair ? (i === 0 ? 1 : -1) : h ? -1 : 1;
        const ex = horiz ? hx + sgn * leaf * 0 : hx + sw * leaf;
        const ey = horiz ? hy + sw * leaf : hy + sgn * leaf * 0;
        const ax = horiz ? hx + sgn * leaf : hx;
        const ay = horiz ? hy : hy + sgn * leaf;
        return (
          <g key={i}>
            <path d={`M${ax} ${ay}A${leaf} ${leaf} 0 0 ${(sgn * sw > 0) === horiz ? 1 : 0} ${ex} ${ey}`} fill="none" stroke="#a79c8b" strokeWidth="1" strokeDasharray="4 3" />
            <line x1={hx} y1={hy} x2={ex} y2={ey} stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}
