import type { Dimensions, ProjectState, Space } from "../model/types";
import { SPACES } from "./spaces";

/**
 * Corrections to the villa model, carried into projects that already exist.
 *
 * The room list is seeded once, when a project is created, and after that it
 * is the project's own data. So when a fact about the building is corrected
 * here — a room re-dimensioned from the construction DWG, a compass word that
 * was a quarter-turn out, a wall that has since come down — a project saved
 * before the fix would go on showing the old fact for ever.
 *
 * This closes that gap, under two rules:
 *
 *  1. **Only a value the seed put there is replaced.** Each correction lists
 *     the exact values earlier seeds wrote. If the field holds anything else,
 *     someone has edited it, and their words win.
 *  2. **The new value is always the current seed's.** It is read from SPACES,
 *     never repeated here, so a correction cannot disagree with the model.
 *
 * Corrections go through the normal change history as `space/correct`, each
 * with its reason, so the History page says what changed and why. Applying them
 * is idempotent: once a field holds the new value, nothing is pending.
 */

type Field = "name" | "note" | "parentId" | "dims";

export interface Correction {
  spaceId: string;
  field: Field;
  /** Values earlier seeds wrote. `null` means the field was absent. */
  from: (string | Dimensions | null)[];
  why: string;
}

const COMPASS = "the road is to the east, so the old wording was a quarter-turn out";
const DWG = "re-dimensioned from the construction drawing";
const KITCHEN = "the wall between the kitchens has come down, so the wet kitchen is now the hot end of one kitchen";
const OFFICE = "Bedroom 5 is now the home office";

const dims = (widthFt: number, widthIn: number, lengthFt: number, lengthIn: number): Dimensions =>
  ({ widthFt, widthIn, lengthFt, lengthIn, source: "architect-plan" });

export const CORRECTIONS: Correction[] = [
  /* ------------------------------------------------ compass, a quarter-turn */
  { spaceId: "out-entrance", field: "note", why: COMPASS,
    from: ["Approach from the south road, past the compound gate and parking apron."] },
  { spaceId: "out-front-garden", field: "note", why: COMPASS,
    from: ["South lawn between the compound wall and the built edge, within the 11'1\" front setback."] },
  { spaceId: "out-side-garden-east", field: "name", why: COMPASS, from: ["Side garden — east"] },
  { spaceId: "out-side-garden-west", field: "name", why: COMPASS, from: ["Side garden — west"] },
  { spaceId: "out-deck", field: "note", why: COMPASS,
    from: ["Raised timber deck off the living room, east side."] },
  { spaceId: "gf-living", field: "note", why: COMPASS,
    from: ["The largest ground-floor volume; opens to the east deck."] },
  { spaceId: "gf-utility", field: "note", why: COMPASS,
    from: ["West-side service yard off the wet kitchen. Not dimensioned on the plan."] },
  { spaceId: "ff-master", field: "note", why: COMPASS,
    from: ["North-west corner; the largest bedroom in the villa."] },
  { spaceId: "ff-bed3", field: "note", why: COMPASS,
    from: ["North-east bedroom. The plan shows a fitted wardrobe run, not a walk-in."] },
  { spaceId: "ff-bed4", field: "note", why: COMPASS,
    from: ["South-west bedroom, the deepest plan on this floor."] },
  { spaceId: "ff-puja", field: "note", why: COMPASS, from: ["Off the family lounge, east side."] },
  { spaceId: "ff-sitout", field: "note", why: COMPASS,
    from: ["South-facing, sheltered by the second-floor overhang."] },
  { spaceId: "sf-theatre", field: "note", why: COMPASS,
    from: ["North-west; the acoustically critical room in the villa."] },

  /* --------------------------------------------------------- one kitchen */
  { spaceId: "gf-kitchen", field: "note", why: KITCHEN,
    from: ["Main dry kitchen with island; opens to the wet kitchen."] },
  { spaceId: "gf-wet-kitchen", field: "name", why: KITCHEN, from: ["Wet kitchen"] },
  { spaceId: "gf-wet-kitchen", field: "note", why: KITCHEN,
    from: ["Heavy cooking, washing-up and ventilation-critical work."] },
  { spaceId: "gf-wet-kitchen", field: "parentId", why: KITCHEN, from: [null] },

  /* ------------------------------------------------------------- office */
  { spaceId: "sf-bed5", field: "name", why: OFFICE, from: ["Bedroom 5"] },
  { spaceId: "sf-bed5", field: "note", why: COMPASS,
    from: [
      "South-west; opens toward the terrace.",
      "5746 × 3820 on the construction drawing. South-EAST corner, not south-west as an earlier note said: " +
        "the window faces east over the front setback and the slider opens north onto the terrace. " +
        "Earmarked to become the home office.",
    ] },

  /* -------------------------------------------- re-dimensioned from the DWG */
  { spaceId: "out-parking", field: "dims", why: DWG, from: [dims(16, 10, 12, 6)] },
  { spaceId: "out-parking", field: "note", why: DWG, from: ["Covered bay under the first-floor overhang."] },
  { spaceId: "gf-bedroom-bath", field: "dims", why: DWG, from: [dims(5, 10, 9, 0)] },
  { spaceId: "gf-bedroom-bath", field: "note", why: DWG, from: [null] },
  { spaceId: "sf-bed5-bath", field: "dims", why: DWG, from: [dims(6, 8, 9, 10)] },
  { spaceId: "sf-bed5-bath", field: "note", why: DWG, from: [null] },
  { spaceId: "sf-powder", field: "dims", why: DWG, from: [dims(5, 9, 7, 10)] },
  { spaceId: "sf-powder", field: "note", why: DWG, from: [null] },
];

const SEED = new Map(SPACES.map((s) => [s.id, s]));

function sameDims(a?: Dimensions, b?: Dimensions): boolean {
  if (!a || !b) return false;
  return a.widthFt === b.widthFt && a.widthIn === b.widthIn && a.lengthFt === b.lengthFt &&
    a.lengthIn === b.lengthIn && a.source === b.source;
}

function holds(sp: Space, field: Field, v: string | Dimensions | null): boolean {
  const cur = sp[field as keyof Space] as unknown;
  if (v === null) return cur === undefined || cur === null || cur === "";
  if (field === "dims") return sameDims(cur as Dimensions | undefined, v as Dimensions);
  return cur === v;
}

export interface PendingCorrection {
  id: string;
  patch: Partial<Space>;
  why: string;
}

/**
 * What still needs correcting in this project, one patch per space. Empty for
 * a project seeded after the fixes, and for any field someone has edited.
 */
export function pendingCorrections(state: ProjectState): PendingCorrection[] {
  const bySpace = new Map<string, PendingCorrection>();
  for (const c of CORRECTIONS) {
    const sp = state.spaces.find((x) => x.id === c.spaceId);
    const seed = SEED.get(c.spaceId);
    if (!sp || !seed) continue;
    if (!c.from.some((v) => holds(sp, c.field, v))) continue;
    const next = seed[c.field as keyof Space];
    const p = bySpace.get(c.spaceId) ?? { id: c.spaceId, patch: {}, why: c.why };
    (p.patch as Record<string, unknown>)[c.field] = next;
    if (!p.why.includes(c.why)) p.why = `${p.why}; ${c.why}`;
    bySpace.set(c.spaceId, p);
  }
  return [...bySpace.values()];
}
