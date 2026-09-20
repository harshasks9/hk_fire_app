import type { FloorId } from "../model/types";

/**
 * The villa, as drawn.
 *
 * This is a redrawing of the architect's three plans — ground, first and
 * second — in one coordinate system, so that a room is a shape you can click
 * rather than a hotspot floating over a bitmap. The original drawings are kept
 * alongside it in `public/plans` and shown under Villa → Drawings; this file is
 * the machine-readable twin of them.
 *
 * UNITS are tenths of a foot, and the ORIGIN is the north-west corner of the
 * plot for every floor. That matters: because all three floors share one
 * origin, the plates stack correctly in the isometric model without any
 * per-floor fudging, and a room on the second floor sits exactly above the one
 * that carries its structure on the ground.
 *
 *   plot          59'0" x 65'3"      (590 x 652.5)
 *   built plate   45'10" x 45'2"     (458.3 x 451.7) — set back 5'0" W, 9'0" N
 *
 * The room rectangles carry the dimensions printed on the plans. Where the
 * drawing and a tidy rectangle disagree — a splayed wall, a wardrobe niche —
 * the rectangle loses: `lib/seed/spaces.ts` holds the authoritative dimensions
 * and is what the app costs from. Nothing here is ever measured off.
 */

/** Feet and inches to plan units. */
const ft = (feet: number, inches = 0) => Math.round((feet + inches / 12) * 10);

export const PLOT = { w: ft(59), h: ft(65, 3) };
export const PLATE = { x: ft(5), y: ft(9), w: ft(45, 10), h: ft(45, 2) };
/** Floor-to-floor, for the stacked model. */
export const FLOOR_HEIGHT = ft(11);
/** Interior partitions read as this thick; rooms are drawn inset by half of it. */
export const WALL = 5;

export type Finish =
  | "wood" | "stone" | "tile" | "deck" | "paving" | "grass" | "service" | "void" | "water";

/** Furniture and fixtures, in absolute plan coordinates. */
export type Fit =
  | { t: "bed"; x: number; y: number; w: number; h: number; face: Dir }
  | { t: "sofa"; x: number; y: number; w: number; h: number; face: Dir }
  | { t: "lsofa"; x: number; y: number; w: number; h: number; face: Dir }
  | { t: "chair"; x: number; y: number; s?: number }
  | { t: "table"; x: number; y: number; w: number; h: number; round?: boolean }
  | { t: "run"; x: number; y: number; w: number; h: number; kind?: "wardrobe" | "counter" }
  | { t: "island"; x: number; y: number; w: number; h: number }
  | { t: "wc"; x: number; y: number; face: Dir }
  | { t: "basin"; x: number; y: number; face: Dir }
  | { t: "shower"; x: number; y: number; w: number; h: number }
  | { t: "tub"; x: number; y: number; w: number; h: number }
  | { t: "car"; x: number; y: number; w: number; h: number }
  | { t: "tree"; x: number; y: number; r: number }
  | { t: "planter"; x: number; y: number; w: number; h: number }
  | { t: "screen"; x: number; y: number; w: number; h: number; face: Dir }
  | { t: "stair"; x: number; y: number; w: number; h: number; dir: Dir; steps?: number; split?: boolean }
  | { t: "lift"; x: number; y: number; w: number; h: number }
  | { t: "appliance"; x: number; y: number; w: number; h: number; label?: string };

export type Dir = "n" | "s" | "e" | "w";

/** Openings cut into the walls: the glazing runs and doors from the plans. */
export interface Opening {
  k: "window" | "slider" | "door" | "dbldoor" | "arch";
  x: number;
  y: number;
  /** Length along the wall. */
  len: number;
  dir: "h" | "v";
  /** Which way a door swings open: +1 is south/east of the wall, -1 north/west. */
  swing?: 1 | -1;
  /** Which end the door is hinged on. */
  hinge?: 0 | 1;
}

export interface PlanRoom {
  spaceId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  finish: Finish;
  /** Open to below / above — drawn as a void rather than a floor. */
  void?: boolean;
  /** Outside the building envelope. */
  outdoor?: boolean;
  /** Sits inside another room's rectangle on purpose (a zone, not a room). */
  nested?: boolean;
  /** Nudge the label off the fixtures. */
  labelDx?: number;
  labelDy?: number;
  fit?: Fit[];
}

export interface PlanFloor {
  floor: Exclude<FloorId, "outdoor">;
  /** Tight to this floor's content, for the 2D view. */
  viewBox: string;
  /** The built plate. Shared by all three floors. */
  plate: { x: number; y: number; w: number; h: number };
  /** Drawn only on the ground floor. */
  plot?: { x: number; y: number; w: number; h: number };
  /** Parts of the plate that are open to the sky on this floor. */
  openToSky?: { x: number; y: number; w: number; h: number }[];
  rooms: PlanRoom[];
  openings: Opening[];
  site?: { kind: "lawn" | "road" | "paving" | "hedge" | "kerb"; x: number; y: number; w: number; h: number }[];
  caption: string;
  /** Level above the ground floor slab, for the stacked model. */
  level: number;
}

/* ------------------------------------------------------------------- ground */

export const GROUND: PlanFloor = {
  floor: "ground",
  level: 0,
  viewBox: "-14 -14 618 700",
  plot: { x: 0, y: 0, w: PLOT.w, h: PLOT.h },
  plate: PLATE,
  caption: 'Ground floor · plot 59\'0" × 65\'3" · built plate 45\'10" × 45\'2" · east facing, road to the east',
  site: [
    { kind: "lawn", x: 0, y: 0, w: PLOT.w, h: ft(9) },
    { kind: "lawn", x: 0, y: ft(9), w: ft(5), h: ft(45, 2) },
    { kind: "lawn", x: ft(50, 10), y: ft(9), w: ft(8, 2), h: ft(45, 2) },
    { kind: "lawn", x: 0, y: ft(54, 2), w: PLOT.w, h: ft(11, 1) },
    { kind: "hedge", x: 0, y: 0, w: PLOT.w, h: 14 },
    { kind: "hedge", x: 0, y: PLOT.h - 14, w: PLOT.w, h: 14 },
    { kind: "hedge", x: 0, y: 0, w: 14, h: PLOT.h },
    { kind: "hedge", x: PLOT.w - 14, y: 0, w: 14, h: PLOT.h },
    { kind: "kerb", x: 0, y: PLOT.h, w: PLOT.w, h: 12 },
    { kind: "road", x: 0, y: PLOT.h + 12, w: PLOT.w, h: 48 },
  ],
  rooms: [
    // ---- north band: the accessible guest suite, and the living room
    {
      spaceId: "gf-bedroom", x: 50, y: 90, w: 150, h: 143, finish: "wood", labelDy: 34,
      fit: [
        { t: "bed", x: 78, y: 96, w: 62, h: 74, face: "s" },
        { t: "run", x: 52, y: 205, w: 100, h: 14, kind: "wardrobe" },
        { t: "chair", x: 168, y: 118, s: 17 },
      ],
    },
    {
      spaceId: "gf-bedroom-wic", x: 200, y: 90, w: 50, h: 90, finish: "wood",
      fit: [{ t: "run", x: 202, y: 92, w: 46, h: 13, kind: "wardrobe" }, { t: "run", x: 202, y: 165, w: 46, h: 13, kind: "wardrobe" }],
    },
    {
      spaceId: "gf-bedroom-bath", x: 250, y: 90, w: 58, h: 90, finish: "tile",
      fit: [{ t: "wc", x: 254, y: 152, face: "e" }, { t: "basin", x: 254, y: 96, face: "e" }, { t: "shower", x: 284, y: 120, w: 22, h: 40 }],
    },
    { spaceId: "gf-lift", x: 253, y: 183, w: 55, h: 50, finish: "service", fit: [{ t: "lift", x: 256, y: 186, w: 49, h: 44 }] },
    {
      spaceId: "gf-living", x: 332, y: 90, w: 176, h: 215, finish: "stone", labelDy: -28,
      fit: [
        { t: "lsofa", x: 344, y: 104, w: 96, h: 78, face: "s" },
        { t: "table", x: 372, y: 196, w: 46, h: 30 },
        { t: "chair", x: 452, y: 130, s: 19 },
        { t: "chair", x: 452, y: 166, s: 19 },
        { t: "run", x: 346, y: 272, w: 84, h: 16, kind: "counter" },
      ],
    },
    // ---- west band: services and the maid's room
    { spaceId: "gf-maid-bath", x: 50, y: 243, w: 40, h: 75, finish: "tile", fit: [{ t: "wc", x: 54, y: 286, face: "e" }, { t: "basin", x: 54, y: 249, face: "e" }] },
    { spaceId: "gf-powder", x: 95, y: 243, w: 75, h: 35, finish: "tile", fit: [{ t: "wc", x: 99, y: 250, face: "e" }, { t: "basin", x: 140, y: 247, face: "s" }] },
    {
      spaceId: "gf-stair", x: 151, y: 282, w: 40, h: 90, finish: "stone",
      fit: [{ t: "stair", x: 153, y: 284, w: 36, h: 86, dir: "n", steps: 11 }],
    },
    { spaceId: "gf-maid", x: 50, y: 325, w: 101, h: 78, finish: "stone", fit: [{ t: "bed", x: 56, y: 332, w: 44, h: 62, face: "e" }] },
    // ---- centre: dining, drawing, foyer
    {
      spaceId: "gf-dining", x: 192, y: 235, w: 140, h: 157, finish: "stone",
      fit: [
        { t: "table", x: 226, y: 288, w: 72, h: 52, round: false },
        { t: "chair", x: 212, y: 296, s: 16 }, { t: "chair", x: 302, y: 296, s: 16 },
        { t: "chair", x: 232, y: 268, s: 16 }, { t: "chair", x: 274, y: 268, s: 16 },
        { t: "chair", x: 232, y: 346, s: 16 }, { t: "chair", x: 274, y: 346, s: 16 },
      ],
    },
    { spaceId: "gf-circulation", x: 336, y: 312, w: 172, h: 70, finish: "stone" },
    {
      spaceId: "gf-drawing", x: 270, y: 395, w: 110, h: 113, finish: "stone",
      fit: [
        { t: "sofa", x: 282, y: 462, w: 78, h: 30, face: "n" },
        { t: "table", x: 300, y: 428, w: 42, h: 26 },
        { t: "chair", x: 278, y: 410, s: 17 }, { t: "chair", x: 344, y: 410, s: 17 },
      ],
    },
    { spaceId: "gf-foyer", x: 385, y: 405, w: 60, h: 85, finish: "stone", labelDy: 6 },
    // ---- south band: the kitchens
    {
      spaceId: "gf-wet-kitchen", x: 50, y: 410, w: 75, h: 128, finish: "tile",
      fit: [{ t: "run", x: 52, y: 412, w: 14, h: 124, kind: "counter" }, { t: "run", x: 66, y: 520, w: 57, h: 16, kind: "counter" }],
    },
    {
      spaceId: "gf-kitchen", x: 130, y: 410, w: 125, h: 128, finish: "tile",
      fit: [
        { t: "run", x: 132, y: 412, w: 121, h: 16, kind: "counter" },
        { t: "run", x: 132, y: 428, w: 15, h: 108, kind: "counter" },
        { t: "island", x: 168, y: 466, w: 70, h: 34 },
      ],
    },
    { spaceId: "gf-utility", x: 6, y: 410, w: 40, h: 100, finish: "service", outdoor: true, fit: [{ t: "appliance", x: 10, y: 418, w: 30, h: 26 }] },
    // ---- outside
    { spaceId: "out-deck", x: 512, y: 240, w: 68, h: 78, finish: "deck", outdoor: true, fit: [{ t: "table", x: 530, y: 262, w: 30, h: 30, round: true }, { t: "chair", x: 518, y: 296, s: 16 }, { t: "chair", x: 556, y: 296, s: 16 }] },
    {
      spaceId: "out-parking", x: 270, y: 510, w: 168, h: 125, finish: "paving", outdoor: true,
      fit: [{ t: "car", x: 282, y: 520, w: 62, h: 106 }, { t: "car", x: 358, y: 520, w: 62, h: 106 }],
    },
    { spaceId: "out-driveway", x: 444, y: 540, w: 86, h: 105, finish: "paving", outdoor: true },
    { spaceId: "out-entrance", x: 448, y: 470, w: 62, h: 58, finish: "paving", outdoor: true, fit: [{ t: "stair", x: 452, y: 476, w: 54, h: 46, dir: "n", steps: 4 }] },
    { spaceId: "out-front-garden", x: 22, y: 552, w: 236, h: 88, finish: "grass", outdoor: true, fit: [{ t: "tree", x: 60, y: 596, r: 26 }, { t: "tree", x: 150, y: 600, r: 20 }, { t: "tree", x: 228, y: 592, r: 24 }] },
    { spaceId: "out-rear-garden", x: 20, y: 18, w: 550, h: 62, finish: "grass", outdoor: true, fit: [{ t: "tree", x: 84, y: 48, r: 22 }, { t: "tree", x: 300, y: 46, r: 18 }, { t: "tree", x: 500, y: 48, r: 22 }] },
    { spaceId: "out-side-garden-west", x: 18, y: 96, w: 28, h: 300, finish: "grass", outdoor: true },
    { spaceId: "out-side-garden-east", x: 514, y: 330, w: 62, h: 200, finish: "grass", outdoor: true, fit: [{ t: "tree", x: 546, y: 430, r: 24 }] },
    { spaceId: "out-entrance-landscape", x: 514, y: 96, w: 62, h: 132, finish: "grass", outdoor: true, fit: [{ t: "tree", x: 546, y: 150, r: 22 }] },
  ],
  openings: [
    // north elevation
    { k: "window", x: 92, y: 90, len: 56, dir: "h" },
    { k: "window", x: 360, y: 90, len: 92, dir: "h" },
    // east elevation — the living room opening to the deck
    { k: "slider", x: 508, y: 118, len: 70, dir: "v" },
    { k: "slider", x: 508, y: 214, len: 70, dir: "v" },
    // west elevation
    { k: "window", x: 50, y: 116, len: 62, dir: "v" },
    { k: "window", x: 50, y: 340, len: 48, dir: "v" },
    { k: "window", x: 50, y: 436, len: 66, dir: "v" },
    // south elevation
    { k: "window", x: 150, y: 538, len: 74, dir: "h" },
    { k: "slider", x: 288, y: 508, len: 74, dir: "h" },
    // the front door, off the porch
    { k: "dbldoor", x: 445, y: 430, len: 36, dir: "v", swing: -1 },
    // internal doors
    { k: "door", x: 200, y: 124, len: 28, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 250, y: 124, len: 28, dir: "v", swing: 1, hinge: 1 },
    { k: "door", x: 132, y: 233, len: 30, dir: "h", swing: 1, hinge: 0 },
    { k: "door", x: 90, y: 252, len: 26, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 96, y: 325, len: 30, dir: "h", swing: -1, hinge: 0 },
    { k: "door", x: 176, y: 410, len: 32, dir: "h", swing: -1, hinge: 0 },
    { k: "door", x: 125, y: 452, len: 30, dir: "v", swing: 1, hinge: 0 },
    { k: "arch", x: 332, y: 150, len: 84, dir: "v" },
    { k: "arch", x: 300, y: 392, len: 54, dir: "h" },
    { k: "arch", x: 385, y: 430, len: 44, dir: "v" },
  ],
};

/* -------------------------------------------------------------------- first */

export const FIRST: PlanFloor = {
  floor: "first",
  level: 1,
  viewBox: "26 66 506 500",
  plate: PLATE,
  caption: 'First floor · 45\'10" × 45\'2" · master suite to the west, sit-out over the porch',
  rooms: [
    {
      spaceId: "ff-master", x: 50, y: 90, w: 203, h: 143, finish: "wood", labelDy: 30,
      fit: [
        { t: "bed", x: 96, y: 96, w: 66, h: 78, face: "s" },
        { t: "chair", x: 186, y: 108, s: 19 }, { t: "chair", x: 186, y: 144, s: 19 },
        { t: "table", x: 170, y: 128, w: 20, h: 20, round: true },
        { t: "run", x: 60, y: 210, w: 120, h: 15, kind: "counter" },
      ],
    },
    {
      spaceId: "ff-master-wic", x: 258, y: 90, w: 102, h: 90, finish: "wood",
      fit: [{ t: "run", x: 260, y: 92, w: 98, h: 14, kind: "wardrobe" }, { t: "run", x: 260, y: 164, w: 98, h: 14, kind: "wardrobe" }],
    },
    {
      spaceId: "ff-master-bath", x: 364, y: 90, w: 70, h: 90, finish: "tile",
      fit: [{ t: "wc", x: 368, y: 150, face: "e" }, { t: "basin", x: 368, y: 96, face: "e" }, { t: "shower", x: 400, y: 120, w: 30, h: 42 }],
    },
    {
      spaceId: "ff-bed3-bath", x: 438, y: 90, w: 60, h: 90, finish: "tile",
      fit: [{ t: "wc", x: 442, y: 150, face: "e" }, { t: "basin", x: 442, y: 96, face: "e" }, { t: "shower", x: 470, y: 122, w: 24, h: 40 }],
    },
    { spaceId: "ff-lift", x: 258, y: 185, w: 55, h: 50, finish: "service", fit: [{ t: "lift", x: 261, y: 188, w: 49, h: 44 }] },
    { spaceId: "ff-circulation", x: 316, y: 185, w: 14, h: 50, finish: "wood", fit: [{ t: "run", x: 317, y: 188, w: 12, h: 44, kind: "wardrobe" }] },
    {
      spaceId: "ff-bed3", x: 332, y: 190, w: 176, h: 115, finish: "stone", labelDy: -18,
      fit: [
        { t: "bed", x: 346, y: 196, w: 64, h: 76, face: "s" },
        { t: "chair", x: 452, y: 226, s: 18 }, { t: "chair", x: 452, y: 260, s: 18 },
        { t: "table", x: 436, y: 244, w: 18, h: 18, round: true },
      ],
    },
    {
      spaceId: "ff-stair", x: 61, y: 240, w: 127, h: 75, finish: "stone",
      fit: [{ t: "stair", x: 63, y: 242, w: 123, h: 71, dir: "e", steps: 12, split: true }],
    },
    { spaceId: "ff-lobby", x: 195, y: 240, w: 130, h: 75, finish: "stone" },
    {
      spaceId: "ff-bed4-bath", x: 60, y: 320, w: 75, h: 98, finish: "tile",
      fit: [{ t: "wc", x: 64, y: 384, face: "e" }, { t: "basin", x: 64, y: 326, face: "e" }, { t: "shower", x: 100, y: 352, w: 32, h: 42 }],
    },
    {
      spaceId: "ff-bed4", x: 148, y: 327, w: 125, h: 204, finish: "stone", labelDy: -30,
      fit: [
        { t: "bed", x: 160, y: 356, w: 74, h: 64, face: "e" },
        { t: "chair", x: 214, y: 452, s: 18 }, { t: "chair", x: 214, y: 488, s: 18 },
        { t: "table", x: 196, y: 470, w: 18, h: 18, round: true },
      ],
    },
    { spaceId: "ff-bed4-wic", x: 60, y: 425, w: 75, h: 105, finish: "wood", fit: [{ t: "run", x: 62, y: 427, w: 14, h: 100, kind: "wardrobe" }, { t: "run", x: 76, y: 514, w: 57, h: 14, kind: "wardrobe" }] },
    {
      spaceId: "ff-family", x: 280, y: 320, w: 168, h: 140, finish: "stone",
      fit: [
        { t: "lsofa", x: 350, y: 330, w: 92, h: 74, face: "w" },
        { t: "table", x: 300, y: 372, w: 44, h: 30 },
      ],
    },
    { spaceId: "ff-foyer-void", x: 448, y: 310, w: 60, h: 85, finish: "void", void: true },
    { spaceId: "ff-puja", x: 448, y: 400, w: 60, h: 75, finish: "stone", fit: [{ t: "run", x: 452, y: 404, w: 52, h: 16, kind: "counter" }] },
    {
      spaceId: "ff-sitout", x: 280, y: 465, w: 165, h: 77, finish: "deck", outdoor: true,
      fit: [{ t: "chair", x: 296, y: 492, s: 20 }, { t: "chair", x: 330, y: 492, s: 20 }, { t: "table", x: 366, y: 492, w: 26, h: 26, round: true }],
    },
  ],
  openings: [
    { k: "window", x: 96, y: 90, len: 74, dir: "h" },
    { k: "window", x: 300, y: 90, len: 50, dir: "h" },
    { k: "window", x: 50, y: 116, len: 76, dir: "v" },
    { k: "window", x: 50, y: 440, len: 70, dir: "v" },
    { k: "slider", x: 508, y: 210, len: 76, dir: "v" },
    { k: "window", x: 508, y: 410, len: 54, dir: "v" },
    { k: "slider", x: 300, y: 465, len: 120, dir: "h" },
    { k: "window", x: 176, y: 531, len: 66, dir: "h" },
    { k: "door", x: 258, y: 120, len: 30, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 364, y: 120, len: 28, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 438, y: 120, len: 28, dir: "v", swing: 1, hinge: 1 },
    { k: "door", x: 200, y: 320, len: 30, dir: "h", swing: 1, hinge: 0 },
    { k: "door", x: 135, y: 350, len: 28, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 448, y: 424, len: 28, dir: "v", swing: -1, hinge: 0 },
    { k: "arch", x: 332, y: 220, len: 60, dir: "v" },
    { k: "arch", x: 330, y: 315, len: 70, dir: "h" },
  ],
};

/* ------------------------------------------------------------------- second */

export const SECOND: PlanFloor = {
  floor: "second",
  level: 2,
  viewBox: "26 66 506 500",
  plate: PLATE,
  openToSky: [{ x: 332, y: 90, w: 176, h: 438 }],
  caption: 'Second floor · theatre, bar lounge and guest suite west · open terrace to the north-east',
  rooms: [
    {
      spaceId: "sf-theatre", x: 50, y: 90, w: 203, h: 143, finish: "wood", labelDy: 26,
      fit: [
        { t: "screen", x: 60, y: 96, w: 12, h: 100, face: "e" },
        { t: "lsofa", x: 104, y: 100, w: 86, h: 118, face: "w" },
        { t: "table", x: 196, y: 140, w: 34, h: 30 },
      ],
    },
    { spaceId: "sf-laundry", x: 258, y: 90, w: 55, h: 90, finish: "tile", fit: [{ t: "appliance", x: 262, y: 96, w: 34, h: 30, label: "WM" }, { t: "run", x: 262, y: 150, w: 47, h: 14, kind: "counter" }] },
    { spaceId: "sf-lift", x: 258, y: 185, w: 55, h: 50, finish: "service", fit: [{ t: "lift", x: 261, y: 188, w: 49, h: 44 }] },
    {
      spaceId: "sf-terrace", x: 332, y: 90, w: 176, h: 438, finish: "paving", outdoor: true, labelDy: -90,
      fit: [],
    },
    {
      spaceId: "sf-terrace-landscape", x: 346, y: 388, w: 150, h: 126, finish: "grass", outdoor: true, nested: true,
      fit: [{ t: "planter", x: 352, y: 394, w: 138, h: 22 }, { t: "tree", x: 386, y: 460, r: 22 }, { t: "chair", x: 448, y: 452, s: 20 }, { t: "chair", x: 448, y: 486, s: 20 }],
    },
    { spaceId: "sf-stair", x: 61, y: 240, w: 127, h: 70, finish: "stone", fit: [{ t: "stair", x: 63, y: 242, w: 123, h: 66, dir: "e", steps: 12 }] },
    { spaceId: "sf-lobby", x: 195, y: 235, w: 130, h: 157, finish: "stone", labelDy: -16 },
    { spaceId: "sf-bed5-bath", x: 60, y: 315, w: 67, h: 98, finish: "tile", fit: [{ t: "wc", x: 64, y: 380, face: "e" }, { t: "basin", x: 64, y: 321, face: "e" }, { t: "shower", x: 96, y: 348, w: 28, h: 40 }] },
    { spaceId: "sf-powder", x: 132, y: 318, w: 58, h: 78, finish: "tile", fit: [{ t: "wc", x: 136, y: 362, face: "e" }, { t: "basin", x: 136, y: 324, face: "e" }] },
    { spaceId: "sf-bar", x: 230, y: 392, w: 80, h: 24, finish: "wood", fit: [{ t: "run", x: 232, y: 394, w: 76, h: 20, kind: "counter" }] },
    { spaceId: "sf-circulation", x: 195, y: 396, w: 32, h: 20, finish: "stone" },
    {
      spaceId: "sf-bed5", x: 130, y: 418, w: 188, h: 123, finish: "stone", labelDy: 22,
      fit: [
        { t: "bed", x: 176, y: 424, w: 66, h: 76, face: "s" },
        { t: "chair", x: 268, y: 448, s: 19 }, { t: "chair", x: 268, y: 484, s: 19 },
        { t: "table", x: 250, y: 466, w: 18, h: 18, round: true },
      ],
    },
    { spaceId: "sf-bed5-wic", x: 55, y: 420, w: 70, h: 105, finish: "wood", fit: [{ t: "run", x: 57, y: 422, w: 13, h: 100, kind: "wardrobe" }, { t: "run", x: 70, y: 509, w: 53, h: 14, kind: "wardrobe" }] },
  ],
  openings: [
    { k: "window", x: 92, y: 90, len: 80, dir: "h" },
    { k: "window", x: 50, y: 116, len: 74, dir: "v" },
    { k: "window", x: 50, y: 440, len: 60, dir: "v" },
    { k: "slider", x: 253, y: 120, len: 84, dir: "v" },
    { k: "slider", x: 318, y: 250, len: 90, dir: "v" },
    { k: "slider", x: 318, y: 440, len: 80, dir: "v" },
    { k: "window", x: 180, y: 541, len: 76, dir: "h" },
    { k: "door", x: 258, y: 120, len: 28, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 132, y: 344, len: 28, dir: "v", swing: 1, hinge: 0 },
    { k: "door", x: 60, y: 340, len: 28, dir: "h", swing: 1, hinge: 0 },
    { k: "arch", x: 195, y: 300, len: 60, dir: "v" },
  ],
};

export const PLANS: Record<Exclude<FloorId, "outdoor">, PlanFloor> = {
  ground: GROUND,
  first: FIRST,
  second: SECOND,
};

/** The floors of the model, bottom first. */
export const STACK: PlanFloor[] = [GROUND, FIRST, SECOND];

/**
 * Site shapes lie outside the building and are drawn under it, so that where
 * the house oversails them — the parking under the first-floor overhang — the
 * wall covers the car rather than the other way round. A covered sit-out or a
 * terrace is "outdoor" but sits on the plate, so it is not one of these.
 */
export function isSite(r: PlanRoom): boolean {
  if (!r.outdoor) return false;
  const inside =
    r.x >= PLATE.x - 2 && r.y >= PLATE.y - 2 &&
    r.x + r.w <= PLATE.x + PLATE.w + 2 && r.y + r.h <= PLATE.y + PLATE.h + 2;
  return !inside;
}

export function planFor(floor: FloorId): PlanFloor {
  if (floor === "outdoor") return GROUND;
  return PLANS[floor];
}

/** Every space that has been drawn, by id. */
export const DRAWN = new Set(STACK.flatMap((f) => f.rooms.map((r) => r.spaceId)));

/** The original drawings, kept as they were issued. */
export const DRAWINGS = [
  { id: "ground", label: "Ground floor plan", src: "/plans/ground.webp", note: 'Plot 59\'0" × 65\'3". East facing — the porch and road are on the east, so north is to the right of the sheet.' },
  { id: "first", label: "First floor plan", src: "/plans/first.jpg", note: 'Built plate 45\'10" × 45\'2".' },
  { id: "second", label: "Second floor plan", src: "/plans/second.jpg", note: 'Theatre / bar lounge, guest suite and the open terrace.' },
  { id: "elevation", label: "Street elevation", src: "/plans/elevation.webp", note: "The villa as rendered by the architect." },
] as const;

/**
 * The construction set the app is drawn from.
 *
 * The presentation plans above are what the family was sold; this is what is
 * being built. Where the two disagree — four rooms, so far — this one wins,
 * and the app says so on the room.
 */
export const CAD_SOURCE = {
  file: "HALLMARK_IMPERIA_EAST_FACING SITE-06-03-20.dwg",
  revised: "2023-03-06",
  plotMm: [17980, 19890] as const,
  blockMm: [13970, 13767] as const,
  /** south, north, west, east */
  setbacksMm: { south: 1520, north: 2490, west: 2740, east: 3380 },
  facing: "east" as const,
  /** Where north points on these sheets, in degrees clockwise from up. */
  northDeg: 90,
};
