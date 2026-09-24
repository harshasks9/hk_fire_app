import type { Edge, Piece } from "./types";

/**
 * Furniture at real sizes, so a layout reads as a list of things you could buy.
 * Every helper takes the top-left corner of the footprint and the side its back
 * is on, and works out the footprint from the piece's real dimensions.
 */

const along = (back: Edge) => back === "top" || back === "bottom";

/** A piece whose length runs along its back wall and whose depth comes off it. */
function oriented(kind: Piece["kind"], x: number, y: number, len: number, depth: number, back: Edge, extra: Partial<Piece> = {}): Piece {
  return along(back)
    ? { kind, x, y, w: len, d: depth, back, ...extra }
    : { kind, x, y, w: depth, d: len, back, ...extra };
}

export const BED = { king: [1830, 2080], queen: [1525, 2080], single: [915, 1980], double: [1370, 2030] } as const;

/** A bed with its headboard on `back`: length runs away from the wall. */
export function bed(size: keyof typeof BED, x: number, y: number, back: Edge, label?: string): Piece {
  const [wd, len] = BED[size];
  return along(back)
    ? { kind: "bed", x, y, w: wd, d: len, back, label: label ?? `${cap(size)} bed ${wd} × ${len}` }
    : { kind: "bed", x, y, w: len, d: wd, back, label: label ?? `${cap(size)} bed ${wd} × ${len}` };
}

export const bedside = (x: number, y: number): Piece => ({ kind: "bedside", x, y, w: 450, d: 400, label: "Bedside 450 × 400" });

export const wardrobe = (x: number, y: number, len: number, back: Edge, depth = 600) =>
  oriented("wardrobe", x, y, len, depth, back, { tall: true, label: `Wardrobe ${len} × ${depth}, full height` });

export const tall = (x: number, y: number, len: number, back: Edge, depth: number, label: string) =>
  oriented("tall", x, y, len, depth, back, { tall: true, label });

export const shelf = (x: number, y: number, len: number, back: Edge, depth = 350, label?: string) =>
  oriented("shelf", x, y, len, depth, back, { tall: true, label: label ?? `Shelving ${len} × ${depth}, full height` });

export const low = (kind: Piece["kind"], x: number, y: number, len: number, depth: number, back: Edge, label: string) =>
  oriented(kind, x, y, len, depth, back, { label });

const SOFA = { 2: [1700, 900], 3: [2200, 950], 4: [2700, 950] } as const;
export function sofa(seats: 2 | 3 | 4, x: number, y: number, back: Edge, label?: string): Piece {
  const [len, depth] = SOFA[seats];
  return oriented("sofa", x, y, len, depth, back, { label: label ?? `${seats}-seat sofa ${len} × ${depth}` });
}

/** A sofa of a given length, for returns and banquettes. */
export const sofaLen = (x: number, y: number, len: number, back: Edge, depth: number, label: string) =>
  oriented("sofa", x, y, len, depth, back, { label });

export const armchair = (x: number, y: number, back: Edge, label = "Armchair 800 × 800") =>
  ({ kind: "armchair", x, y, w: 800, d: 800, back, label } as Piece);

export const recliner = (x: number, y: number, back: Edge) =>
  ({ kind: "recliner", x, y, w: 900, d: 900, back, label: "Recliner 900 × 900 (1650 reclined)" } as Piece);

export const chair = (x: number, y: number, size = 550, label = "Chair") => ({ kind: "chair", x, y, w: size, d: size, label } as Piece);
export const taskChair = (x: number, y: number) => ({ kind: "task-chair", x, y, w: 650, d: 650, label: "Task chair" } as Piece);
export const stool = (x: number, y: number) => ({ kind: "stool", x, y, w: 400, d: 400, label: "Stool" } as Piece);

export const table = (kind: Piece["kind"], x: number, y: number, w: number, d: number, label: string): Piece => ({ kind, x, y, w, d, label });

/**
 * A dining table with chairs on both long sides, footprint including the chairs.
 * `long` is the axis the table's length runs along.
 */
export function dining(seats: 4 | 6 | 8 | 10, x: number, y: number, long: "x" | "y", tableWidth = 950): Piece {
  const len = (seats / 2) * 600;
  const across = tableWidth + 2 * 550;
  return long === "x"
    ? { kind: "dining", x, y, w: len, d: across, seats, long, label: `${seats}-seat dining table ${len} × ${tableWidth}` }
    : { kind: "dining", x, y, w: across, d: len, seats, long, label: `${seats}-seat dining table ${len} × ${tableWidth}` };
}

export const rug = (x: number, y: number, w: number, d: number, label?: string): Piece =>
  ({ kind: "rug", x, y, w, d, soft: true, label: label ?? `Rug ${w} × ${d}` });

export const zone = (x: number, y: number, w: number, d: number, label: string): Piece =>
  ({ kind: "zone", x, y, w, d, soft: true, label });

export const pendant = (cx: number, cy: number, dia = 600, label = "Pendant"): Piece =>
  ({ kind: "pendant", x: cx - dia / 2, y: cy - dia / 2, w: dia, d: dia, soft: true, label });

export const plant = (x: number, y: number, size = 500): Piece => ({ kind: "plant", x, y, w: size, d: size, label: "Plant" });

export const counter = (x: number, y: number, len: number, back: Edge, label = `Counter ${len} × 600`) =>
  oriented("counter", x, y, len, 600, back, { label });

export const vanity = (x: number, y: number, len: number, back: Edge, depth = 500) =>
  oriented("vanity", x, y, len, depth, back, { label: `Vanity ${len} × ${depth}` });

export const wc = (x: number, y: number, back: Edge): Piece =>
  oriented("wc", x, y, 400, 650, back, { label: "Wall-hung WC" });

function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }
