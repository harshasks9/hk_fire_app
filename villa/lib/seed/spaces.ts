import type { Space, Dimensions } from "../model/types";

/**
 * The villa, as drawn.
 *
 * Every dimension below is transcribed from the architect's plans (plot 59'0" x
 * 65'3"; upper-floor footprint 45'10" x 45'2"). Spaces the plans do not
 * dimension — gardens, the deck, the utility yard, circulation — carry no
 * dimension at all rather than an invented one. `source` records where each
 * number came from so a site measurement can later supersede a plan figure
 * without anyone losing track of which is which.
 */

const plan = (widthFt: number, widthIn: number, lengthFt: number, lengthIn: number): Dimensions => ({
  widthFt,
  widthIn,
  lengthFt,
  lengthIn,
  source: "architect-plan",
});

export const SPACES: Space[] = [
  /* ------------------------------------------------------------- outdoor */
  { id: "out-entrance", name: "Main entrance", floor: "outdoor", kind: "entrance",
    note: "Approach from the east road, past the compound gate and parking apron." },
  { id: "out-driveway", name: "Driveway & apron", floor: "outdoor", kind: "driveway",
    note: "Paved apron between the gate and the parking bay." },
  { id: "out-parking", name: "Two-car parking", floor: "outdoor", kind: "parking",
    dims: plan(18, 0, 12, 6), note: "Car porch, 5484 × 3805 on the construction drawing: a foot wider than the presentation plan. Covered by the first-floor balcony." },
  { id: "out-entrance-landscape", name: "Entrance landscaping", floor: "outdoor", kind: "garden",
    note: "Planter beds and hedging flanking the approach." },
  { id: "out-front-garden", name: "Front garden", floor: "outdoor", kind: "garden",
    note: "East lawn between the compound wall and the built edge, within the 11'1\" front setback." },
  { id: "out-side-garden-east", name: "Side garden — north", floor: "outdoor", kind: "garden",
    note: "8'2\" side setback strip along the living-room elevation." },
  { id: "out-side-garden-west", name: "Side garden — south", floor: "outdoor", kind: "garden",
    note: "5'0\" side setback strip along the kitchen and utility elevation." },
  { id: "out-rear-garden", name: "Rear garden", floor: "outdoor", kind: "garden",
    note: "9'0\" rear setback behind the bedroom and living block." },
  { id: "out-deck", name: "Outdoor deck / sit-out", floor: "outdoor", kind: "deck",
    note: "Raised timber deck off the living room, north side." },
  { id: "out-pathways", name: "Pathways", floor: "outdoor", kind: "pathway",
    note: "Stepping-stone runs around the side and rear setbacks." },
  { id: "out-external-lighting", name: "External lighting", floor: "outdoor", kind: "external-lighting",
    note: "Facade wash, bollards, step lights, tree uplighters, gate lighting." },
  { id: "out-facade", name: "Facade finishes", floor: "outdoor", kind: "facade",
    note: "Render, stone cladding to the plinth, timber-batten screen, glass balustrade to the first-floor balcony." },

  /* -------------------------------------------------------------- ground */
  { id: "gf-foyer", name: "Double-height foyer", floor: "ground", kind: "foyer",
    dims: plan(6, 0, 8, 6), note: "Open to the first floor above; the villa's arrival moment." },
  { id: "gf-drawing", name: "Drawing room", floor: "ground", kind: "drawing",
    dims: plan(11, 0, 11, 3), note: "Formal receiving room off the foyer, screened from the main living." },
  { id: "gf-living", name: "Main living room", floor: "ground", kind: "living",
    dims: plan(17, 8, 21, 6), note: "The largest ground-floor volume; glazed west, and opens north onto the deck." },
  { id: "gf-dining", name: "Dining room", floor: "ground", kind: "dining",
    dims: plan(14, 0, 15, 8), note: "Central, between the kitchen and the living room." },
  { id: "gf-kitchen", name: "Kitchen", floor: "ground", kind: "kitchen",
    dims: plan(12, 6, 12, 10),
    note: "One room since the wall to the wet kitchen was taken out \u2014 about 20'6\" \u00d7 12'10\" overall. " +
      "This is its north, clean end: prep, island and breakfast, nearest the dining room. East window." },
  { id: "gf-wet-kitchen", name: "Kitchen \u2014 hot end", floor: "ground", kind: "wet-kitchen",
    dims: plan(7, 6, 12, 10), parentId: "gf-kitchen",
    note: "The south end of the one kitchen, where the wet kitchen stood before its wall came out. " +
      "Hob, chimney and washing-up; external south wall and window, utility yard beyond." },
  { id: "gf-utility", name: "Utility", floor: "ground", kind: "utility",
    note: "South-side service yard off the kitchen's hot end. Not dimensioned on the plan." },
  { id: "gf-bedroom", name: "Ground-floor bedroom", floor: "ground", kind: "bedroom",
    dims: plan(15, 0, 14, 4), note: "Guest / elder bedroom with lift access — the accessible suite." },
  { id: "gf-bedroom-wic", name: "Ground-floor bedroom WIC", floor: "ground", kind: "wic",
    dims: plan(5, 0, 9, 0), parentId: "gf-bedroom" },
  { id: "gf-bedroom-bath", name: "Ground-floor bathroom", floor: "ground", kind: "bathroom",
    dims: plan(5, 6, 9, 0), parentId: "gf-bedroom",
    note: "1680 × 2745 on the construction drawing — 4 inches narrower than the presentation plan said." },
  { id: "gf-powder", name: "Powder room", floor: "ground", kind: "powder",
    dims: plan(7, 6, 3, 6), note: "Guest WC off the circulation core." },
  { id: "gf-maid", name: "Maid room", floor: "ground", kind: "maid-room",
    dims: plan(10, 1, 7, 10) },
  { id: "gf-maid-bath", name: "Maid bathroom", floor: "ground", kind: "bathroom",
    dims: plan(4, 0, 7, 6), parentId: "gf-maid" },
  { id: "gf-stair", name: "Staircase — ground", floor: "ground", kind: "staircase",
    note: "Main flight, ground to first. Finish and railing are a house-wide decision." },
  { id: "gf-lift", name: "Lift — ground", floor: "ground", kind: "lift",
    dims: plan(5, 6, 5, 0), note: "Home lift serving all three floors." },
  { id: "gf-circulation", name: "Corridors & circulation — ground", floor: "ground", kind: "corridor",
    note: "Passage linking foyer, dining, kitchen and the bedroom wing." },

  /* --------------------------------------------------------------- first */
  { id: "ff-master", name: "Master bedroom", floor: "first", kind: "master-bedroom",
    dims: plan(20, 4, 14, 4), note: "South-west corner, glazed west and south; the largest bedroom in the villa." },
  { id: "ff-master-wic", name: "Master WIC", floor: "first", kind: "wic",
    dims: plan(10, 2, 9, 0), parentId: "ff-master", note: "Double-sided hanging run between bedroom and bathroom." },
  { id: "ff-master-bath", name: "Master bathroom", floor: "first", kind: "bathroom",
    dims: plan(7, 0, 9, 0), parentId: "ff-master" },
  { id: "ff-bed3", name: "Bedroom 3", floor: "first", kind: "bedroom",
    dims: plan(17, 8, 12, 6), note: "North-west bedroom, lit by a north slider. The plan shows a fitted wardrobe run, not a walk-in." },
  { id: "ff-bed3-bath", name: "Bedroom 3 bathroom", floor: "first", kind: "bathroom",
    dims: plan(6, 0, 9, 0), parentId: "ff-bed3" },
  { id: "ff-bed4", name: "Bedroom 4", floor: "first", kind: "bedroom",
    dims: plan(12, 6, 20, 9), note: "South-east bedroom, the deepest plan on this floor. East window." },
  { id: "ff-bed4-wic", name: "Bedroom 4 WIC", floor: "first", kind: "wic",
    dims: plan(7, 6, 10, 6), parentId: "ff-bed4" },
  { id: "ff-bed4-bath", name: "Bedroom 4 bathroom", floor: "first", kind: "bathroom",
    dims: plan(7, 6, 9, 10), parentId: "ff-bed4" },
  { id: "ff-family", name: "Family lounge", floor: "first", kind: "family-lounge",
    dims: plan(16, 10, 14, 0), note: "The household's everyday room; opens onto the covered sit-out." },
  { id: "ff-puja", name: "Puja room", floor: "first", kind: "puja",
    dims: plan(6, 0, 7, 6), note: "Off the family lounge, in the north-east corner. North window." },
  { id: "ff-sitout", name: "Covered sit-out / balcony", floor: "first", kind: "balcony",
    dims: plan(17, 6, 7, 8), note: "East-facing, sheltered by the second-floor overhang." },
  { id: "ff-foyer-void", name: "Double-height foyer void", floor: "first", kind: "foyer",
    dims: plan(6, 0, 8, 6), note: "Overlooks the ground-floor foyer. Chandelier and balustrade belong here." },
  { id: "ff-lobby", name: "Lobby — first", floor: "first", kind: "lobby",
    dims: plan(13, 0, 7, 6) },
  { id: "ff-stair", name: "Staircase — first", floor: "first", kind: "staircase",
    note: "Mid-flight landing; the flight continues to the second floor." },
  { id: "ff-lift", name: "Lift — first", floor: "first", kind: "lift",
    dims: plan(5, 6, 5, 0) },
  { id: "ff-circulation", name: "Circulation — first", floor: "first", kind: "corridor" },

  /* -------------------------------------------------------------- second */
  { id: "sf-bed5", name: "Home office", floor: "second", kind: "bedroom",
    dims: plan(18, 10, 12, 6),
    note: "5746 \u00d7 3820 on the construction drawing. South-EAST corner, not south-west as an earlier note said: " +
      "the window faces east over the front setback and the slider opens north onto the terrace. " +
      "Bedroom 5 on the drawings, now the home office, with a single sofa-bed for an overflow guest." },
  { id: "sf-bed5-wic", name: "Bedroom 5 WIC", floor: "second", kind: "wic",
    dims: plan(7, 0, 10, 6), parentId: "sf-bed5" },
  { id: "sf-bed5-bath", name: "Bedroom 5 bathroom", floor: "second", kind: "bathroom",
    dims: plan(6, 3, 9, 10), parentId: "sf-bed5",
    note: "1900 × 3000 on the construction drawing." },
  { id: "sf-theatre", name: "Home theatre", floor: "second", kind: "home-theatre",
    dims: plan(20, 4, 14, 4), note: "Drawn as HOME THEATRE | BAR LOUNGE — the acoustically critical room in the villa." },
  { id: "sf-lobby", name: "Lobby / entertainment area", floor: "second", kind: "lobby",
    dims: plan(13, 0, 15, 8), note: "The second floor's social heart, linking theatre, bar and terrace." },
  { id: "sf-bar", name: "Bar counter", floor: "second", kind: "bar",
    note: "Counter off the lobby. The plan draws it but does not dimension it." },
  { id: "sf-powder", name: "Powder room — second", floor: "second", kind: "powder",
    dims: plan(6, 3, 7, 10), note: "1900 × 2390 on the construction drawing." },
  { id: "sf-laundry", name: "Laundry", floor: "second", kind: "laundry",
    dims: plan(5, 6, 9, 0), note: "Washing machine position shown on plan; drying is a terrace question." },
  { id: "sf-terrace", name: "Open terrace", floor: "second", kind: "terrace",
    dims: plan(17, 8, 43, 10), note: "The single largest space in the villa — 774 sq ft of open deck." },
  { id: "sf-terrace-landscape", name: "Terrace landscaping & outdoor furniture", floor: "second", kind: "garden",
    parentId: "sf-terrace", note: "Planters, pergola, seating and lighting on the open terrace." },
  { id: "sf-stair", name: "Staircase — second", floor: "second", kind: "staircase",
    note: "Head of the main flight, plus the ladder to the roof shown on the plan." },
  { id: "sf-lift", name: "Lift — second", floor: "second", kind: "lift",
    dims: plan(5, 6, 5, 0) },
  { id: "sf-circulation", name: "Circulation — second", floor: "second", kind: "corridor" },
];

export const FLOOR_META: Record<string, { label: string; short: string; caption: string }> = {
  second: { label: "Second Floor", short: "02", caption: "Theatre, bedroom 5, bar & the open terrace" },
  first: { label: "First Floor", short: "01", caption: "Master suite, two bedrooms, family lounge & puja" },
  ground: { label: "Ground Floor", short: "00", caption: "Living, dining, kitchens, guest suite & foyer" },
  outdoor: { label: "Outdoor", short: "—", caption: "Gardens, driveway, deck, facade & external lighting" },
};
