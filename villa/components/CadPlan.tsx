"use client";

import React, { useEffect, useState } from "react";
import type { FloorId } from "@/lib/model/types";

/**
 * The architect's CAD, drawn.
 *
 * Everything else in this app is a redrawing. This is the drawing itself:
 * the walls, columns, door swings, glazing, stair treads and site-office
 * notes lifted straight out of HALLMARK_IMPERIA_EAST_FACING SITE-06-03-20.dwg
 * and projected into the same coordinate system as the rest of the villa —
 * so a room's hit area, its overlay colour and its CAD outline all land on
 * top of each other to the millimetre.
 *
 * It is fetched rather than bundled: 120 KB of polylines is worth loading
 * when someone asks for the CAD, and not before.
 */

export interface CadFloor {
  strokes: Record<string, number[][]>;
  texts: { s: string; x: number; y: number; h: number; r: number }[];
}
export type CadData = Record<string, CadFloor>;

/** Drawn heaviest first: structure, then openings, then the annotation. */
export const CAD_ORDER = [
  "hatch", "grid", "site", "detail", "furniture", "line",
  "stair", "service", "parapet", "window", "door", "column", "wall", "text",
] as const;

const INK = {
  wall: "#2f2a24", column: "#2f2a24", parapet: "#4a443c", window: "#3d6d88",
  door: "#8a5a2b", stair: "#6e6252", line: "#6b6154", detail: "#a99e8c",
  furniture: "#8e8477", hatch: "#c4baa8", service: "#5f7a8a", site: "#8b9c7a",
  grid: "#c9bfad", text: "#9a8f80",
} as Record<string, string>;

const WIDTH = {
  wall: 2.6, column: 2.4, parapet: 1.6, window: 1.5, door: 1.3, stair: 0.85,
  line: 0.75, detail: 0.6, furniture: 0.7, hatch: 0.5, service: 1.1,
  site: 0.9, grid: 0.5, text: 0.6,
} as Record<string, number>;

let cache: CadData | null = null;

export function useCad(): { cad: CadData | null; loading: boolean; failed: boolean } {
  const [cad, setCad] = useState<CadData | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (cache) return;
    let live = true;
    fetch("/plans/cad.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: CadData) => { cache = d; if (live) { setCad(d); setLoading(false); } })
      .catch(() => { if (live) { setFailed(true); setLoading(false); } });
    return () => { live = false; };
  }, []);
  return { cad, loading, failed };
}

/** The CAD linework for one floor, in app plan units. */
export function CadLayer({
  floor, cad, showGrid, showText, dim,
}: { floor: FloorId; cad: CadData; showGrid?: boolean; showText?: boolean; dim?: boolean }) {
  const key = floor === "outdoor" ? "ground" : floor;
  const f = cad[key];
  if (!f) return null;
  return (
    <g opacity={dim ? 0.45 : 1} style={{ transition: "opacity .25s ease" }}>
      {CAD_ORDER.map((g) => {
        const ss = f.strokes[g];
        if (!ss || (g === "grid" && !showGrid)) return null;
        return (
          <g key={g} stroke={INK[g] ?? "#6b6154"} strokeWidth={WIDTH[g] ?? 0.8}
            fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={g === "grid" ? "14 6 2 6" : undefined}>
            {ss.map((p, i) => (
              <polyline key={i} points={pointsOf(p)} />
            ))}
          </g>
        );
      })}
      {showText && f.texts.map((t, i) => (
        <text
          key={i} x={t.x} y={t.y}
          fontSize={Math.max(3.4, Math.min(t.h, 9))}
          fill="#7a6a58"
          transform={t.r ? `rotate(${-t.r} ${t.x} ${t.y})` : undefined}
          style={{ pointerEvents: "none", fontFamily: "var(--font-sans)" }}
        >
          {t.s.split("\n")[0].slice(0, 30)}
        </text>
      ))}
    </g>
  );
}

function pointsOf(p: number[]): string {
  let s = "";
  for (let i = 0; i < p.length; i += 2) s += `${p[i]},${p[i + 1]} `;
  return s;
}
