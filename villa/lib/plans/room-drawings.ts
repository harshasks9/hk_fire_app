import type { Doc } from "../model/types";

/**
 * Room drawings.
 *
 * The architect's set in `geometry.ts` covers the whole villa. These are the
 * sheets produced for a single room — a theatre layout, a joinery elevation, a
 * kitchen plan — and they are held here rather than only as document rows
 * because a drawing nobody can open is not filed, it is merely mentioned.
 *
 * Each sheet carries the caveats printed on it. A provisional layout that
 * quietly loses its "verify on site" note is worse than no layout at all: it
 * gets built.
 */

export interface RoomDrawing {
  id: string;
  spaceId: string;
  label: string;
  src: string;
  kind: Doc["kind"];
  revision?: string;
  by: string;
  at: string;
  /** One line under the thumbnail. */
  note: string;
  /** Printed on the sheet itself, and therefore never dropped. */
  caveats: string[];
  /** The numbers the sheet settles, so they can be read without opening it. */
  facts: { k: string; v: string }[];
  /** Everything the sheet marks in red as needing confirmation on site. */
  verify: string[];
}

export const ROOM_DRAWINGS: RoomDrawing[] = [
  {
    id: "rd-theatre-layout",
    spaceId: "sf-theatre",
    label: "Theatre layout & long section",
    src: "/drawings/theatre-layout.png",
    kind: "furniture",
    revision: "Provisional",
    by: "Harsha",
    at: "2026-09-20",
    note: "Balanced option — 7.2.4 with a 120\" 16:9 acoustically transparent screen, two rows of three on a 0.40 m riser.",
    caveats: [
      "Dimensions are in metres. The rest of the app is in feet and inches with millimetres alongside; these are the drawing's own numbers, left as drawn.",
      "Provisional. The floor plan for this room had not been received when it was drawn, so the door and window positions are assumptions.",
      "Everything the sheet marks in red has to be confirmed on site before anything is ordered or cut.",
    ],
    facts: [
      { k: "Shell", v: "6.20 × 4.37 m (20'4\" × 14'4\") — matches the room the app carries" },
      { k: "Net width after treatment", v: "≈4.13 m (≈120 mm each side, 170 mm at the rear)" },
      { k: "Screen", v: "120\" 16:9 acoustically transparent, 2.66 m wide, 1.49 m image, bottom at +0.95 m" },
      { k: "Layout", v: "7.2.4 — L/C/R behind the screen, two subs in the front corners, side and rear surrounds, four ceiling" },
      { k: "Seating", v: "Row 1 three recliners at floor level, row 2 three wall-huggers on a +0.40 m riser, two steps" },
      { k: "Sightlines", v: "Row 1 ear +1.05 m, row 2 ear +1.45 m; row 2 sees ≈1.25 m at row 1 heads" },
      { k: "Distances", v: "0.60 m stage · 2.90 m screen to row 1 ears · 1.98 m row pitch · 5.43 m screen to rear finish" },
      { k: "Projector", v: "Ceiling, lens ≈+2.60 m in a pocket, 4.20 m throw — inside the NZ500's ≈3.56–5.69 m range at 120\"" },
      { k: "Heights", v: "Ceiling 2.75 m under a 3.00 m slab · 2.08 m clear under the projector · 2.35 m headroom over the riser" },
      { k: "Also shown", v: "Acoustic door 0.9 m, AV rack outside the room, riser filled with mineral wool, 0.65 m aisle" },
    ],
    verify: [
      "Shell dimensions — the 6.20 m length is off the sales plan, not a site measurement.",
      "Slab at 3.00 m and finished ceiling at 2.75 m.",
      "Door position and swing — assumed, because the floor plan was not available.",
      "Whether the existing window is infilled or plugged.",
      "Row 2 sightline at 1.25 m over row 1 heads, once the actual seats are chosen.",
      "Seat dimensions — the recliner and wall-hugger footprints are nominal.",
    ],
  },
];

export function drawingsForSpace(spaceId: string): RoomDrawing[] {
  return ROOM_DRAWINGS.filter((d) => d.spaceId === spaceId);
}
