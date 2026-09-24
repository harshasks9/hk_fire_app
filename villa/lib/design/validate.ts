import type { Edge, FrameOpening, Layout, Piece, RoomFrame } from "./types";

/**
 * The checks every layout must pass before it is shown to anyone. They catch
 * the mistakes that make a plan unbuildable rather than merely ugly: furniture
 * through a wall, two things in one place, a door that can't open, a wardrobe
 * in front of a window, a terrace door you can't walk through.
 */

type Rect = { x: number; y: number; w: number; d: number };
const EPS = 5;

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w - EPS && b.x < a.x + a.w - EPS && a.y < b.y + b.d - EPS && b.y < a.y + a.d - EPS;

/** Things that are meant to sit over or tuck under another piece. */
const TUCKS: Record<string, string[]> = {
  "task-chair": ["desk", "table"], chair: ["desk", "dining", "table", "island", "bar", "vanity"], stool: ["island", "bar", "counter"],
  hob: ["counter", "island"], sink: ["counter", "island"], tv: ["media", "console", "sideboard", "shelf", "tall", "desk"],
  ottoman: ["coffee"], washer: ["counter"],
};
const tucks = (a: Piece, b: Piece) => (TUCKS[a.kind] ?? []).includes(b.kind) || (TUCKS[b.kind] ?? []).includes(a.kind);

/** The clear space an opening needs inside the room. */
export function keepClear(f: RoomFrame, o: FrameOpening): Rect[] {
  const len = o.to - o.from;
  const depth = (o.kind === "door" || o.kind === "dbldoor") && o.swingIn && !o.pocket
    ? (o.kind === "dbldoor" ? len / 2 : len)
    : o.kind === "window" ? 0 : 600;
  if (depth <= 0) return [];
  if (o.kind === "slider") return []; // checked separately: somewhere along it must be walkable
  return [strip(f, o.edge, o.from, o.to, depth)];
}

function strip(f: RoomFrame, edge: Edge, from: number, to: number, depth: number): Rect {
  switch (edge) {
    case "top": return { x: from, y: 0, w: to - from, d: depth };
    case "bottom": return { x: from, y: f.H - depth, w: to - from, d: depth };
    case "left": return { x: 0, y: from, w: depth, d: to - from };
    case "right": return { x: f.W - depth, y: from, w: depth, d: to - from };
  }
}

export function problems(f: RoomFrame, l: Layout): string[] {
  const out: string[] = [];
  const solid = l.pieces.filter((p) => !p.soft);
  const name = (p: Piece) => p.label ?? p.kind;

  for (const p of l.pieces) {
    if (p.x < -EPS || p.y < -EPS || p.x + p.w > f.W + EPS || p.y + p.d > f.H + EPS) {
      out.push(`${name(p)} is outside the room (${f.W} × ${f.H})`);
    }
  }
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const a = solid[i], b = solid[j];
    if (overlaps(a, b) && !tucks(a, b)) out.push(`${name(a)} overlaps ${name(b)}`);
  }
  for (const o of f.openings) {
    for (const zone of keepClear(f, o)) {
      for (const p of solid) {
        if (overlaps(p, zone)) out.push(`${name(p)} blocks the ${o.assumed ? "assumed " : ""}${o.kind} on the ${o.edge} wall`);
      }
    }
    if (o.kind === "slider") {
      // A slider needs a 900-wide, 600-deep clear approach somewhere along it.
      let ok = false;
      for (let s = o.from; s + 900 <= o.to + EPS && !ok; s += 50) {
        const z = strip(f, o.edge, s, Math.min(s + 900, o.to), 600);
        if (!solid.some((p) => overlaps(p, z))) ok = true;
      }
      if (!ok && o.to - o.from >= 900) out.push(`nothing leaves a clear way through the slider on the ${o.edge} wall`);
    }
    if (o.kind === "window" || o.kind === "slider") {
      for (const p of solid.filter((q) => q.tall)) {
        const against = o.edge === "top" ? p.y < 150 : o.edge === "bottom" ? p.y + p.d > f.H - 150
          : o.edge === "left" ? p.x < 150 : p.x + p.w > f.W - 150;
        const along = o.edge === "top" || o.edge === "bottom"
          ? Math.min(p.x + p.w, o.to) - Math.max(p.x, o.from)
          : Math.min(p.y + p.d, o.to) - Math.max(p.y, o.from);
        if (against && along > EPS) out.push(`${name(p)} stands in front of the ${o.kind} on the ${o.edge} wall`);
      }
    }
  }
  return out;
}
