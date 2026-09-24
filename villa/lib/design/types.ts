import type { FloorId } from "../model/types";

/**
 * Room layouts — the room-by-room design, as data.
 *
 * Every configuration is a list of real pieces of furniture and joinery in
 * real millimetres, placed on the room as the plan geometry draws it, so the
 * same data renders the drawing, lists the pieces, and is checked by the tests
 * for pieces outside the room, pieces on top of each other, and pieces in the
 * way of a door or in front of a window.
 *
 * COORDINATES are room-local millimetres on the sheet as the architect drew
 * it, road-down: x runs left to right (south to north), y runs top to bottom
 * (west to east). The origin is the room's top-left corner — its south-west.
 */

export type Edge = "top" | "bottom" | "left" | "right";

export type PieceKind =
  | "bed" | "bunk" | "daybed" | "bedside" | "wardrobe" | "tall" | "shelf" | "dresser"
  | "desk" | "task-chair" | "chair" | "stool" | "armchair" | "recliner" | "sofa" | "ottoman"
  | "coffee" | "side" | "console" | "sideboard" | "media" | "tv" | "screen" | "bench"
  | "dining" | "table" | "partition" | "island" | "counter" | "hob" | "sink" | "fridge" | "washer"
  | "wc" | "vanity" | "shower" | "tub" | "altar" | "bar"
  | "rug" | "zone" | "pendant" | "plant" | "planter" | "tree" | "lounger" | "pergola";

export interface Piece {
  kind: PieceKind;
  /** Footprint on the sheet, mm: x and w along the sheet's width, y and d down it. */
  x: number;
  y: number;
  w: number;
  d: number;
  /** Which side of the footprint is its back — the headboard, the sofa back, the wall side. */
  back?: Edge;
  /** What it is, for the drawing and the piece list. */
  label?: string;
  /** Taller than a window sill: must not stand in front of glass. */
  tall?: boolean;
  /** Rugs, zones and pendants: drawn beneath, and allowed under other pieces. */
  soft?: boolean;
  /** A dining table's seats; chairs are drawn inside the footprint. */
  seats?: number;
  /** A dining table's long axis. */
  long?: "x" | "y";
}

/** A dimension or clearance worth showing on the drawing. */
export interface Dim {
  from: [number, number];
  to: [number, number];
  label: string;
}

/** An opening the plan geometry does not carry, drawn dashed and labelled. */
export interface AssumedOpening {
  kind: "door" | "arch" | "slider";
  /** True when the opening is real but the geometry records it on the neighbouring room's wall. */
  known?: boolean;
  edge: Edge;
  from: number;
  to: number;
  swingIn?: boolean;
}

export interface Layout {
  /** `${spaceId}:${key}` — notes and the chosen layout are keyed on this. */
  id: string;
  spaceId: string;
  key: "A" | "B" | "C";
  name: string;
  /** One sentence: the idea behind this arrangement. */
  idea: string;
  pieces: Piece[];
  dims?: Dim[];
  pros: string[];
  cons: string[];
  /** Indicative ₹ difference against layout A. A itself is 0. */
  costDelta?: number;
  recommended?: boolean;
  /** Anything this layout takes as given that isn't on the drawing. */
  assumptions?: string[];
  /** Doors this layout changes: the one whose span contains `at` becomes a pocket door or swings the other way. */
  doors?: { edge: Edge; at: number; becomes: "pocket" | "swing-out" | "swing-in" }[];
}

export interface RoomDesign {
  spaceId: string;
  /** Other spaces drawn as part of this one — the kitchen's hot end. */
  merge?: string[];
  assumedOpenings?: AssumedOpening[];
  /** Openings the plan geometry puts on this room that the design sets aside, each with its reason. */
  ignoreOpenings?: { edge: Edge; at: number; why: string }[];
  /** What the room has to do, in a sentence or two. */
  brief: string;
  layouts: Layout[];
}

export type OpeningKind = "window" | "slider" | "door" | "dbldoor" | "arch";

export interface FrameOpening {
  kind: OpeningKind;
  edge: Edge;
  from: number;
  to: number;
  swingIn?: boolean;
  hingeAtFrom?: boolean;
  assumed?: boolean;
  /** Set when a layout turns this door into a pocket (sliding) door. */
  pocket?: boolean;
  /** Set when a layout changes this door from how it is drawn. */
  changed?: boolean;
}

/** A room as the layouts see it: its size, finish and openings, in local mm. */
export interface RoomFrame {
  spaceId: string;
  floor: Exclude<FloorId, "outdoor">;
  W: number;
  H: number;
  finish: string;
  outdoor: boolean;
  openings: FrameOpening[];
}
