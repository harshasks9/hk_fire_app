import type { Layout, RoomDesign } from "./types";
import ground from "./rooms/ground";
import first from "./rooms/first";
import second from "./rooms/second";

/**
 * Every room's layouts, in the order a walk through the house would meet them.
 * Rooms without layouts are ones whose arrangement is fixed by plumbing or
 * structure — see NO_LAYOUT for each one's reason.
 */
export const DESIGNS: RoomDesign[] = [...ground, ...first, ...second];

const BY_SPACE = new Map<string, RoomDesign>();
for (const d of DESIGNS) {
  BY_SPACE.set(d.spaceId, d);
  for (const m of d.merge ?? []) BY_SPACE.set(m, d);
}
const BY_ID = new Map<string, Layout>(DESIGNS.flatMap((d) => d.layouts.map((l) => [l.id, l] as const)));

/** The design a room belongs to — for a merged room, the room it was merged into. */
export function designFor(spaceId: string): RoomDesign | undefined {
  return BY_SPACE.get(spaceId);
}

export function layoutById(id?: string): Layout | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function recommendedOf(d: RoomDesign): Layout {
  return d.layouts.find((l) => l.recommended) ?? d.layouts[0];
}

/** Why a room has no layouts of its own. */
export const NO_LAYOUT: Record<string, string> = {
  "gf-maid-bath": "A small shower room whose plumbing stays where it's drawn.",
  "ff-bed3-bath": "The plumbing stays where it's drawn; its finishes are in the room's checklist.",
  "ff-bed4-bath": "The plumbing stays where it's drawn; its finishes are in the room's checklist.",
  "sf-bed5-bath": "The plumbing stays where it's drawn; its finishes are in the room's checklist.",
  "sf-powder": "The plumbing stays where it's drawn; its finishes are in the room's checklist.",
  "gf-bedroom-wic": "A walk-through between the bedroom and bathroom; two hanging runs, as drawn.",
  "ff-bed4-wic": "Its hanging is as drawn; the plan shows no window to work around.",
  "gf-utility": "An outdoor service yard: the washer point and a drying line, as drawn.",
};
