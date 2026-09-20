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
    id: "rd-office-layout",
    spaceId: "sf-bed5",
    label: "Home office \u2014 layouts A and B, and the point schedule",
    src: "/drawings/office-layouts.png",
    kind: "furniture",
    revision: "Provisional",
    by: "Harsha",
    at: "2026-09-20",
    note: "Bedroom 5 converted to a home office. Two arrangements compared at 1:50, plus the electrical and data point schedule.",
    caveats: [
      "Provisional \u2014 not for construction. Issued to settle the layout, not to build from.",
      "Drawn in millimetres to match the construction set; the rest of the app reads feet and inches with millimetres alongside.",
      "The room's own note said south-west. The DWG setbacks put it south-EAST: window east, slider north onto the terrace. Confirm with a compass on site.",
    ],
    facts: [
      { k: "Room", v: "5746 \u00d7 3820 mm (18'10\" \u00d7 12'6\") \u00b7 21.95 m\u00b2 \u00b7 236 sq ft" },
      { k: "Glazing", v: "East window ~2316 mm wide; north slider to the terrace ~2438 mm" },
      { k: "Recommended layout", v: "A \u2014 desk facing east, back to a 4200 mm joinery wall, north light from the left" },
      { k: "Desk", v: "1800 \u00d7 800 sit-stand at X 2700\u20134500, Y 2000\u20132800; monitor on an arm at 950 mm" },
      { k: "Clearances", v: "900 behind the chair, 1020 east walkway, 1246 across the north end" },
      { k: "Services", v: "Dedicated 20 A desk circuit, 4 UPS-backed sockets, 4 \u00d7 Cat6A, 2 \u00d7 25 mm spare conduit" },
      { k: "Climate", v: "Top floor \u2014 roof insulation is the largest single gain. 1.5 TR slim ducted, under 35 dB(A) at the desk" },
      { k: "Budget", v: "Fit-for-purpose \u20b913.45L \u00b7 recommended \u20b921.12L \u00b7 the \u20b912.0L estimate needs a defined cut list" },
    ],
    verify: [
      "Compass bearing taken in the room \u2014 the whole daylight and heat strategy turns on it.",
      "Entry door position, width and swing. The villa model carries no opening into this room, so the door on the drawing is assumed.",
      "Finished ceiling height: the brief says ~10 ft, the villa model carries 11 ft. Decides whether ducted AC fits.",
      "Both room diagonals, to establish whether the shell is square before joinery is scribed.",
      "Column positions and any beam soffit drop across the joinery wall.",
      "Road noise at the east window, listened to at 9 am and 6 pm, before deciding on the DGU upgrade.",
    ],
  },
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
