import type { FloorId } from "../model/types";

/**
 * Floor-plate geometry.
 *
 * Each floor is redrawn as SVG from the architect's plans so that every room is
 * a first-class, clickable, fillable shape rather than an invisible box floating
 * over a bitmap. Coordinates are in tenths of a foot, taken from the plans:
 * the plot is 59'0" x 65'3" and the upper-floor footprint is 45'10" x 45'2".
 *
 * The shapes are a faithful diagram of the plan, not a CAD trace — the
 * authoritative dimensions live in `lib/seed/spaces.ts` and are what the app
 * costs from. Nothing is measured off these rectangles.
 */

export interface PlanRoom {
  spaceId: string;
  /** x, y, width, height in plan units (10 units = 1 foot). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Nudge the label when the room is too small to hold it. */
  labelDx?: number;
  labelDy?: number;
  /** Rooms that are voids / open to below get a lighter treatment. */
  void?: boolean;
  /** Outdoor shapes render in the landscape palette. */
  outdoor?: boolean;
}

export interface PlanFloor {
  floor: FloorId;
  viewBox: string;
  /** The built envelope, drawn as the heavy wall line. */
  envelope: { x: number; y: number; w: number; h: number };
  /** The plot boundary, ground floor only. */
  plot?: { x: number; y: number; w: number; h: number };
  rooms: PlanRoom[];
  /** Decoration: stair treads, terrace paving, road. Not interactive. */
  decor?: {
    kind: "stair" | "paving" | "road" | "hedge" | "lawn";
    x: number;
    y: number;
    w: number;
    h: number;
    dir?: "h" | "v";
  }[];
  /** Compass north, in degrees clockwise from up. */
  northDeg: number;
  caption: string;
}

const f = (n: number) => Math.round(n * 10);

export const GROUND: PlanFloor = {
  floor: "ground",
  viewBox: "0 0 590 700",
  plot: { x: 0, y: 0, w: f(59), h: f(65.25) },
  envelope: { x: f(5), y: f(9), w: f(45.83), h: f(45.17) },
  northDeg: 0,
  caption: 'Plot 59\'0" × 65\'3" · built footprint 45\'10" × 45\'2" · road to the south',
  decor: [
    { kind: "lawn", x: 0, y: 0, w: f(59), h: f(9) },
    { kind: "lawn", x: 0, y: f(9), w: f(5), h: f(45.17) },
    { kind: "lawn", x: f(50.83), y: f(9), w: f(8.17), h: f(45.17) },
    { kind: "lawn", x: 0, y: f(54.17), w: f(59), h: f(11.08) },
    { kind: "road", x: 0, y: f(65.25), w: f(59), h: f(4.5) },
    { kind: "stair", x: f(16.5), y: f(27.5), w: f(4.5), h: f(9), dir: "h" },
  ],
  rooms: [
    { spaceId: "gf-bedroom", x: f(5), y: f(9), w: f(15), h: f(14.33) },
    { spaceId: "gf-bedroom-wic", x: f(20), y: f(9), w: f(5), h: f(9), labelDy: -6 },
    { spaceId: "gf-bedroom-bath", x: f(25), y: f(9), w: f(5.83), h: f(9), labelDy: -6 },
    { spaceId: "gf-living", x: f(33), y: f(9), w: f(17.83), h: f(21.5) },
    { spaceId: "gf-lift", x: f(25.33), y: f(18), w: f(5.5), h: f(5) },
    { spaceId: "gf-maid-bath", x: f(5), y: f(23.33), w: f(4), h: f(7.5), labelDy: -6 },
    { spaceId: "gf-powder", x: f(9), y: f(23.33), w: f(7.5), h: f(3.5), labelDy: -4 },
    { spaceId: "gf-stair", x: f(16.5), y: f(27.5), w: f(4.5), h: f(9), labelDy: -6 },
    { spaceId: "gf-maid", x: f(5), y: f(31.5), w: f(10.08), h: f(7.83) },
    { spaceId: "gf-dining", x: f(21.5), y: f(23.5), w: f(14), h: f(15.67) },
    { spaceId: "gf-circulation", x: f(36), y: f(31), w: f(14.83), h: f(7), labelDy: -4 },
    { spaceId: "gf-drawing", x: f(27), y: f(39.5), w: f(11), h: f(11.25) },
    { spaceId: "gf-foyer", x: f(38.5), y: f(40.5), w: f(6), h: f(8.5), labelDy: -6 },
    { spaceId: "gf-wet-kitchen", x: f(5), y: f(40.5), w: f(7.5), h: f(12.83) },
    { spaceId: "gf-kitchen", x: f(13), y: f(40.5), w: f(12.5), h: f(12.83) },
    { spaceId: "gf-utility", x: f(0.5), y: f(41), w: f(4), h: f(10), outdoor: true, labelDy: -6 },
    { spaceId: "out-deck", x: f(51.5), y: f(24), w: f(6.5), h: f(11), outdoor: true, labelDy: -6 },
    { spaceId: "out-parking", x: f(26), y: f(53.5), w: f(16.83), h: f(12.5), outdoor: true },
    { spaceId: "out-driveway", x: f(43.5), y: f(53.5), w: f(9), h: f(11.5), outdoor: true, labelDy: -6 },
    { spaceId: "out-entrance", x: f(45), y: f(48), w: f(6), h: f(5), outdoor: true, labelDy: -4 },
    { spaceId: "out-front-garden", x: f(2), y: f(55), w: f(22), h: f(9.5), outdoor: true },
    { spaceId: "out-rear-garden", x: f(2), y: f(1), w: f(55), h: f(7), outdoor: true },
    { spaceId: "out-side-garden-west", x: f(0.5), y: f(10), w: f(4), h: f(28), outdoor: true, labelDy: -6 },
    { spaceId: "out-side-garden-east", x: f(51.5), y: f(37), w: f(6.5), h: f(15), outdoor: true, labelDy: -6 },
    { spaceId: "out-entrance-landscape", x: f(51.5), y: f(10), w: f(6.5), h: f(12), outdoor: true, labelDy: -6 },
  ],
};

export const FIRST: PlanFloor = {
  floor: "first",
  viewBox: "0 0 470 470",
  envelope: { x: f(0.5), y: f(0.5), w: f(45.83), h: f(45.17) },
  northDeg: 0,
  caption: 'Footprint 45\'10" × 45\'2" · sit-out to the south, master suite to the north-west',
  decor: [{ kind: "stair", x: f(2), y: f(15), w: f(11.5), h: f(12), dir: "v" }],
  rooms: [
    { spaceId: "ff-master", x: f(0.5), y: f(0.5), w: f(20.33), h: f(14.33) },
    { spaceId: "ff-master-wic", x: f(21), y: f(0.5), w: f(10.17), h: f(9) },
    { spaceId: "ff-master-bath", x: f(31.5), y: f(0.5), w: f(7), h: f(9), labelDy: -6 },
    { spaceId: "ff-bed3-bath", x: f(38.8), y: f(0.5), w: f(6), h: f(9), labelDy: -6 },
    { spaceId: "ff-bed3", x: f(27), y: f(10), w: f(17.83), h: f(12.5) },
    { spaceId: "ff-lift", x: f(21), y: f(14.8), w: f(5.5), h: f(5), labelDy: -4 },
    { spaceId: "ff-stair", x: f(2), y: f(15), w: f(11.5), h: f(12), labelDy: -6 },
    { spaceId: "ff-lobby", x: f(14), y: f(20.5), w: f(13), h: f(7.5), labelDy: -4 },
    { spaceId: "ff-bed4-bath", x: f(2), y: f(27.5), w: f(7.5), h: f(9.83), labelDy: -6 },
    { spaceId: "ff-bed4", x: f(10), y: f(24.4), w: f(12.5), h: f(20.77) },
    { spaceId: "ff-bed4-wic", x: f(2), y: f(37.6), w: f(7.5), h: f(7.57), labelDy: -6 },
    { spaceId: "ff-family", x: f(23.5), y: f(25.5), w: f(16), h: f(12) },
    { spaceId: "ff-foyer-void", x: f(39.8), y: f(23.5), w: f(6), h: f(8.5), void: true, labelDy: -6 },
    { spaceId: "ff-puja", x: f(39.8), y: f(32.5), w: f(6), h: f(7.5), labelDy: -4 },
    { spaceId: "ff-sitout", x: f(23), y: f(37.5), w: f(17.5), h: f(7.67), outdoor: true },
    { spaceId: "ff-circulation", x: f(27.5), y: f(22.8), w: f(11.5), h: f(2.4), labelDy: -2 },
  ],
};

export const SECOND: PlanFloor = {
  floor: "second",
  viewBox: "0 0 470 470",
  envelope: { x: f(0.5), y: f(0.5), w: f(45.83), h: f(45.17) },
  northDeg: 0,
  caption: 'Built block to the west, 774 sq ft open terrace to the east',
  decor: [
    { kind: "paving", x: f(28), y: f(0.5), w: f(17.83), h: f(43.83) },
    { kind: "stair", x: f(1), y: f(15), w: f(12), h: f(9), dir: "v" },
  ],
  rooms: [
    { spaceId: "sf-theatre", x: f(1), y: f(0.5), w: f(20.33), h: f(14.33) },
    { spaceId: "sf-laundry", x: f(22), y: f(0.5), w: f(5.5), h: f(9), labelDy: -6 },
    { spaceId: "sf-lift", x: f(22), y: f(9.8), w: f(5.5), h: f(5), labelDy: -4 },
    { spaceId: "sf-terrace", x: f(28), y: f(0.5), w: f(17.83), h: f(43.83) },
    { spaceId: "sf-terrace-landscape", x: f(29.5), y: f(33), w: f(14.83), h: f(9.5), outdoor: true, labelDy: -6 },
    { spaceId: "sf-stair", x: f(1), y: f(15), w: f(12), h: f(9), labelDy: -6 },
    { spaceId: "sf-lobby", x: f(13.5), y: f(15), w: f(13), h: f(15.67) },
    { spaceId: "sf-bed5-bath", x: f(1), y: f(25), w: f(6.67), h: f(9.83), labelDy: -6 },
    { spaceId: "sf-powder", x: f(8), y: f(25), w: f(5.75), h: f(7.83), labelDy: -6 },
    { spaceId: "sf-bar", x: f(15), y: f(31), w: f(8), h: f(3), labelDy: -3 },
    { spaceId: "sf-bed5", x: f(8), y: f(34.5), w: f(18.83), h: f(10.67) },
    { spaceId: "sf-bed5-wic", x: f(1), y: f(35.5), w: f(6.5), h: f(9.67), labelDy: -6 },
    { spaceId: "sf-circulation", x: f(13.5), y: f(31), w: f(1.2), h: f(3), labelDy: -2 },
  ],
};

/** The outdoor "floor" reuses the ground plate but lights only the landscape. */
export const PLANS: Record<Exclude<FloorId, "outdoor">, PlanFloor> = {
  ground: GROUND,
  first: FIRST,
  second: SECOND,
};

export function planFor(floor: FloorId): PlanFloor {
  if (floor === "outdoor") return GROUND;
  return PLANS[floor];
}
