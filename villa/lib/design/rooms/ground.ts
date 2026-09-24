import type { Layout, RoomDesign } from "../types";
import {
  bed, bedside, wardrobe, tall, shelf, low, sofa, sofaLen, armchair, chair, stool, table,
  dining, rug, zone, pendant, plant, counter, vanity, wc,
} from "../pieces";

/**
 * The ground floor: arrival, gathering, and your parents' home.
 * Positions are room-local millimetres on the sheet — x left to right
 * (south to north), y top to bottom (west to east).
 */

const L = (spaceId: string, key: Layout["key"], rest: Omit<Layout, "id" | "spaceId" | "key">): Layout =>
  ({ id: `${spaceId}:${key}`, spaceId, key, ...rest });

const COOKING = "Assumes daily Indian cooking with frying — not yet confirmed.";

const designs: RoomDesign[] = [
  /* ------------------------------------------------------------------ foyer */
  {
    spaceId: "gf-foyer",
    brief: "The arrival: a double-height room seen from both floors. Shoes and bags have to disappear here, because the foyer is only 6'0\" × 8'6\".",
    layouts: [
      L("gf-foyer", "A", {
        name: "Shoe wall and a bench",
        idea: "A full-height cabinet swallows shoes and coats; a bench to sit on while taking them off; a pendant hung in the void.",
        recommended: true,
        pieces: [
          tall(150, 0, 1529, "top", 380, "Shoe and coat cabinet 1529 × 380, full height"),
          low("bench", 650, 2191, 1100, 400, "bottom", "Bench 1100 × 400, shoe drawers under"),
          rug(1030, 760, 799, 1100, "Recessed door mat 800 × 1100"),
          pendant(915, 1350, 700, "Pendant, hung in the double-height void"),
        ],
        dims: [{ from: [915, 380], to: [915, 2191], label: "1811 clear" }],
        pros: ["Nothing on the floor, ever — the cabinet takes the whole family's shoes", "A place to sit, which your parents will use every day", "The void stays empty and tall, which is the foyer's point"],
        cons: ["The cabinet is 380 deep, so boots need their own shelf height"],
        costDelta: 0,
      }),
      L("gf-foyer", "B", {
        name: "A console only; shoes at the corridor drop zone",
        idea: "Keep the foyer almost empty, and move shoes and bags to the drop zone on the corridor wall just inside.",
        pieces: [
          low("console", 400, 2291, 1000, 300, "bottom", "Console 1000 × 300, mirror above"),
          plant(150, 150, 500),
          pendant(915, 1350, 700, "Pendant, hung in the double-height void"),
        ],
        pros: ["The purest arrival — one piece of furniture and the double height", "Cheaper"],
        cons: ["Shoes travel further into the house before they're off", "Nowhere to sit"],
        costDelta: -45000,
      }),
    ],
  },

  /* ----------------------------------------------------------- drawing room */
  {
    spaceId: "gf-drawing",
    brief: "Formal receiving that doubles as a quiet reading room. Open on three sides — the foyer, the dining room and the porch — so only the south wall can take furniture.",
    layouts: [
      L("gf-drawing", "A", {
        name: "A receiving group for five",
        idea: "A sofa on the south wall, the one solid wall, facing the foyer; two chairs across a slim table. Art above the sofa is the first thing a visitor sees.",
        recommended: true,
        pieces: [
          rug(500, 700, 2300, 2200, "Rug 2300 × 2200"),
          sofaLen(0, 800, 2200, "left", 850, "3-seat sofa 2200 × 850"),
          table("coffee", 1200, 1300, 450, 1200, "Coffee table 1200 × 450"),
          { ...armchair(2000, 1150, "right", "Armchair 700 × 700"), w: 700, d: 700 },
          { ...armchair(2000, 1950, "right", "Armchair 700 × 700"), w: 700, d: 700 },
        ],
        dims: [{ from: [850, 1900], to: [1200, 1900], label: "350" }, { from: [1650, 1900], to: [2000, 1900], label: "350" }],
        pros: ["Seats five", "Visitors see art and a welcoming sofa from the foyer arch", "Leaves the way to the dining room and the porch slider clear"],
        cons: ["Knee room at the table is 350 — right for a formal room, tight for lounging", "No TV, deliberately"],
        costDelta: 0,
      }),
      L("gf-drawing", "B", {
        name: "The library",
        idea: "Books floor to ceiling on the south wall, and two deep reading chairs facing each other across a lamp table.",
        pieces: [
          rug(500, 600, 1800, 2500, "Rug 1800 × 2500"),
          shelf(0, 200, 3044, "left", 350, "Bookshelves 3044 × 350, full height"),
          armchair(700, 700, "top", "Reading chair 800 × 800"),
          armchair(700, 2100, "bottom", "Reading chair 800 × 800"),
          table("side", 850, 1600, 500, 400, "Lamp table 500 × 400"),
        ],
        pros: ["The quietest room on the ground floor becomes somewhere to read", "Books are the most Scandinavian-Indian thing you can put on a wall"],
        cons: ["Seats two, three with a stool — formal visitors move to the living room", "Joinery costs more than loose furniture"],
        costDelta: 110000,
      }),
    ],
  },

  /* ----------------------------------------------------------- living room */
  {
    spaceId: "gf-living",
    brief: "The downstairs everyday room: mostly your parents', with the TV, and where small gatherings of 6–10 sit. Glazed west, opening north onto the deck; the east wall is solid.",
    layouts: [
      L("gf-living", "A", {
        name: "TV on the east wall, conversation around it",
        idea: "The solid east wall takes the TV; a sofa faces it and two supportive armchairs face each other across the table, so the room works for TV and for talking.",
        recommended: true,
        pieces: [
          rug(1000, 3200, 3364, 2500, "Rug 3364 × 2500"),
          low("media", 1282, 6103, 2800, 450, "bottom", "Media unit 2800 × 450"),
          { kind: "tv", x: 1857, y: 6493, w: 1650, d: 60, label: "65-inch TV, wall-mounted" },
          sofa(3, 1582, 3000, "top"),
          table("side", 1082, 3250, 450, 450, "Side table"),
          table("side", 3832, 3250, 450, 450, "Side table"),
          table("coffee", 2082, 4350, 1200, 650, "Coffee table 1200 × 650"),
          armchair(700, 4280, "left", "Armchair with arms 800 × 800 — easy to rise from"),
          armchair(3864, 4280, "right", "Armchair with arms 800 × 800 — easy to rise from"),
        ],
        dims: [{ from: [2682, 3950], to: [2682, 6493], label: "2543 to the screen" }, { from: [4300, 0], to: [4300, 3000], label: "3000 walkway to the deck" }],
        pros: ["Seats seven", "Your parents get armchairs with arms — far easier to rise from than a deep sofa", "The walk from the dining arch to the deck stays open behind the sofa"],
        cons: ["The armchairs sit side-on to the TV"],
        costDelta: 0,
      }),
      L("gf-living", "B", {
        name: "An L-shaped sofa for family movie nights",
        idea: "A large L faces the TV, for lounging six-deep on a Sunday afternoon.",
        pieces: [
          rug(1000, 3200, 3564, 2500, "Rug 3564 × 2500"),
          low("media", 1282, 6103, 2800, 450, "bottom", "Media unit 2800 × 450"),
          { kind: "tv", x: 1857, y: 6493, w: 1650, d: 60, label: "65-inch TV, wall-mounted" },
          sofa(3, 1382, 3000, "top"),
          sofaLen(3582, 3000, 2000, "right", 950, "Chaise return 2000 × 950"),
          table("coffee", 1882, 4350, 1200, 650, "Coffee table 1200 × 650"),
          armchair(700, 4280, "left"),
        ],
        pros: ["The most comfortable room in the house for watching something together", "Seats seven lounging"],
        cons: ["Deep, low L-sofas are hard for older knees", "Reads as a family room rather than a living room"],
        costDelta: 60000,
      }),
      L("gf-living", "C", {
        name: "Two rooms in one: a TV snug and a conversation corner",
        idea: "Split the room. A TV snug with two recliners on the east half; a quiet conversation corner by the west window.",
        pieces: [
          rug(1000, 3700, 3664, 1600, "Rug 3664 × 1600"),
          low("media", 1282, 6103, 2800, 450, "bottom", "Media unit 2800 × 450"),
          { kind: "tv", x: 1957, y: 6493, w: 1450, d: 60, label: "55-inch TV, wall-mounted" },
          sofa(2, 1832, 3700, "top", "Loveseat 1700 × 900"),
          { ...armchair(700, 3700, "top", "Recliner 900 × 900"), kind: "recliner", w: 900, d: 900 },
          { ...armchair(3764, 3700, "top", "Recliner 900 × 900"), kind: "recliner", w: 900, d: 900 },
          rug(1100, 1100, 3400, 1500, "Rug 3400 × 1500"),
          armchair(700, 1400, "left", "Armchair 800 × 800"),
          armchair(3864, 1400, "right", "Armchair 800 × 800"),
          table("coffee", 2082, 1500, 1200, 600, "Coffee table 1200 × 600"),
        ],
        dims: [{ from: [2682, 4600], to: [2682, 6493], label: "1893 to the screen" }],
        pros: ["Your parents can watch TV while someone else talks or reads", "Recliners are the most comfortable TV seat there is"],
        cons: ["Two half-rooms rather than one generous one", "Recliners need 700 extra behind them when reclined"],
        costDelta: 85000,
      }),
    ],
  },

  /* ------------------------------------------------------------ dining room */
  {
    spaceId: "gf-dining",
    brief: "The hub between kitchen, living and drawing rooms. No window of its own — it borrows light from the living room, so the table's light matters.",
    assumedOpenings: [{ kind: "arch", edge: "right", from: 0, to: 2134 }],
    layouts: [
      L("gf-dining", "A", {
        name: "Six every day, eight for guests",
        idea: "An extending oak table centred in the room under a linear pendant, with a sideboard on the south wall for serving.",
        recommended: true,
        pieces: [
          dining(6, 1233, 1367, "x"),
          low("sideboard", 0, 1392, 2000, 450, "left", "Sideboard 2000 × 450"),
          pendant(2133, 2392, 1200, "Linear pendant over the table"),
        ],
        dims: [{ from: [450, 2392], to: [1233, 2392], label: "783" }, { from: [3033, 2392], to: [4267, 2392], label: "1234 walkway" }],
        pros: ["Seats all six of you daily, and extends to eight", "Leaves a clear walkway from the living room to the kitchen side"],
        cons: ["At eight, the table end comes within 500 of the sideboard"],
        costDelta: 0,
        assumptions: ["The opening to the living room is taken to be on the north side — the plan draws it slightly off this room."],
      }),
      L("gf-dining", "B", {
        name: "A built-in banquette for eight",
        idea: "A banquette along the south wall seats three without chairs; the rest of the room stays open.",
        pieces: [
          sofaLen(0, 1192, 2400, "left", 600, "Built-in banquette 2400 × 600"),
          table("table", 700, 1492, 900, 1800, "Table 1800 × 900"),
          chair(1700, 1592, 450), chair(1700, 2167, 450), chair(1700, 2742, 450),
          chair(925, 950, 450), chair(925, 3392, 450),
          low("sideboard", 3817, 2400, 1700, 450, "right", "Bar cabinet 1700 × 450"),
          pendant(1150, 2392, 900, "Pendant over the table"),
        ],
        pros: ["Seats eight in less floor", "Children love a banquette", "Frees the north half of the room"],
        cons: ["Getting out of the middle of a banquette is awkward for your parents", "Built-in, so it can't be rearranged"],
        costDelta: 55000,
        assumptions: ["The opening to the living room is taken to be on the north side — the plan draws it slightly off this room."],
      }),
    ],
  },

  /* ---------------------------------------------------------------- kitchen */
  {
    spaceId: "gf-kitchen",
    merge: ["gf-wet-kitchen"],
    brief: "One room now the wall is out: about 20'6\" × 12'10\". Hot work at the south end, where the wet kitchen was; clean work, the island and breakfast at the north end.",
    layouts: [
      L("gf-kitchen", "A", {
        name: "Hob on the south wall, vented into the side yard",
        idea: "A U of counters at the hot end with the hob on the outside wall, so the chimney ducts straight out where nobody sees it; an island and tall units at the clean end.",
        pieces: [
          counter(0, 0, 3901, "left", "Counter 3901 × 600"),
          { kind: "sink", x: 0, y: 1300, w: 600, d: 900, label: "Sink under the south window" },
          { kind: "hob", x: 0, y: 2950, w: 600, d: 900, label: "Hob 900 — chimney ducted out through the south wall" },
          counter(600, 0, 1838, "top", "Counter 1838 × 600"),
          counter(600, 3301, 1838, "bottom", "Counter 1838 × 600"),
          { kind: "island", x: 2800, y: 1400, w: 1800, d: 1000, label: "Island 1800 × 1000" },
          stool(3000, 950), stool(3600, 950), stool(4200, 950),
          tall(5648, 150, 1800, "right", 600, "Tall units 1800 × 600: pantry, ovens"),
          { kind: "fridge", x: 5498, y: 2050, w: 750, d: 900, back: "right", tall: true, label: "Fridge 900 × 750" },
          counter(2438, 3301, 3060, "bottom", "Counter 3060 × 600 under the east window"),
        ],
        dims: [{ from: [3700, 2400], to: [3700, 3301], label: "901" }, { from: [600, 1950], to: [2438, 1950], label: "1838 hot-end U" }],
        pros: ["Smoke leaves through the outside wall, where the wet kitchen always vented", "Cooks at the hot end are out of the way of breakfast at the island"],
        cons: ["The cook faces south, which Vaastu doesn't favour", "Nothing stops the smell of frying reaching the dining room"],
        costDelta: 0,
        assumptions: [COOKING],
      }),
      L("gf-kitchen", "B", {
        name: "Vaastu: the cook faces east",
        idea: "Move the hob to the hot end's east wall, so whoever cooks faces east. The chimney then vents on the front of the house.",
        pieces: [
          counter(0, 0, 3901, "left", "Counter 3901 × 600"),
          { kind: "sink", x: 0, y: 1300, w: 600, d: 900, label: "Sink under the south window" },
          counter(600, 0, 1838, "top", "Counter 1838 × 600"),
          counter(600, 3301, 1838, "bottom", "Counter 1838 × 600"),
          { kind: "hob", x: 1100, y: 3301, w: 900, d: 600, label: "Hob 900 — cook faces east; chimney vents to the front garden" },
          { kind: "island", x: 2800, y: 1400, w: 1800, d: 1000, label: "Island 1800 × 1000" },
          stool(3000, 950), stool(3600, 950), stool(4200, 950),
          tall(5648, 150, 1800, "right", 600, "Tall units 1800 × 600: pantry, ovens"),
          { kind: "fridge", x: 5498, y: 2050, w: 750, d: 900, back: "right", tall: true, label: "Fridge 900 × 750" },
          counter(2438, 3301, 3060, "bottom", "Counter 3060 × 600 under the east window"),
        ],
        pros: ["Follows Vaastu for the cook's direction", "Frees the south counter for washing up and prep"],
        cons: ["The chimney outlet is on the front of the house, towards the entrance", "Slightly longer duct run"],
        costDelta: 15000,
        assumptions: [COOKING],
      }),
      L("gf-kitchen", "C", {
        name: "Layout A, with a glass screen for frying days",
        idea: "Layout A plus a sliding glazed screen between the hot and clean ends: open most of the day, closed while frying.",
        recommended: true,
        pieces: [
          counter(0, 0, 3901, "left", "Counter 3901 × 600"),
          { kind: "sink", x: 0, y: 1300, w: 600, d: 900, label: "Sink under the south window" },
          { kind: "hob", x: 0, y: 2950, w: 600, d: 900, label: "Hob 900 — chimney ducted out through the south wall" },
          counter(600, 0, 1838, "top", "Counter 1838 × 600"),
          counter(600, 3301, 1838, "bottom", "Counter 1838 × 600"),
          { kind: "partition", x: 2408, y: 600, w: 60, d: 2701, soft: true, label: "Sliding glass screen, floor to ceiling" },
          { kind: "island", x: 2800, y: 1400, w: 1800, d: 1000, label: "Island 1800 × 1000" },
          stool(3000, 950), stool(3600, 950), stool(4200, 950),
          tall(5648, 150, 1800, "right", 600, "Tall units 1800 × 600: pantry, ovens"),
          { kind: "fridge", x: 5498, y: 2050, w: 750, d: 900, back: "right", tall: true, label: "Fridge 900 × 750" },
          counter(2438, 3301, 3060, "bottom", "Counter 3060 × 600 under the east window"),
        ],
        pros: ["The open kitchen you built, with the wet kitchen's separation back when you need it", "Keeps frying smells out of the dining room"],
        cons: ["Costs about ₹1.2L for the glazing and track", "One more thing to keep clean"],
        costDelta: 120000,
        assumptions: [COOKING],
      }),
    ],
  },

  /* ------------------------------------------------------ grandparents' suite */
  {
    spaceId: "gf-bedroom",
    brief: "Your parents' home within the house, in the quiet south-west corner by the lift. Glazed west and south, so it takes the afternoon sun.",
    layouts: [
      L("gf-bedroom", "A", {
        name: "Queen bed, head to the east",
        idea: "The bed's head on the east wall, as Vaastu prefers; a reading chair by the west window; a clear turning space kept in the middle.",
        recommended: true,
        pieces: [
          rug(300, 1800, 2000, 1400, "Rug 2000 × 1400"),
          bedside(37, 3959), bed("queen", 487, 2279, "bottom"), bedside(2012, 3959),
          armchair(3700, 150, "top", "Reading chair 800 × 800"),
          low("dresser", 4122, 2100, 1200, 450, "right", "Dresser 1200 × 450"),
          zone(2150, 700, 1500, 1500, "1500 clear to turn, if it's ever needed"),
        ],
        dims: [{ from: [1250, 0], to: [1250, 2279], label: "2279 to the bed foot" }],
        pros: ["Head east, which Vaastu favours and which keeps morning light behind you", "A reading chair in the light", "Clear floor to move around, now and later"],
        cons: ["A queen rather than a king — the east wall between the corner and the door isn't long enough for a king with bedsides"],
        costDelta: 0,
      }),
      L("gf-bedroom", "B", {
        name: "Twin beds, head to the east",
        idea: "Two singles either side of one bedside table, which can be pushed together or apart.",
        pieces: [
          bed("single", 150, 2379, "bottom"), bedside(1065, 3959), bed("single", 1515, 2379, "bottom"),
          armchair(3700, 150, "top", "Reading chair 800 × 800"),
          low("dresser", 4122, 2100, 1200, 450, "right", "Dresser 1200 × 450"),
          zone(2150, 700, 1500, 1500, "1500 clear to turn, if it's ever needed"),
        ],
        pros: ["Each of you sleeps undisturbed", "Easier to make, and to get in and out of"],
        cons: ["Only one bedside table"],
        costDelta: 10000,
      }),
    ],
  },

  /* -------------------------------------------------------- their bathroom */
  {
    spaceId: "gf-bedroom-bath",
    brief: "Your parents' bathroom. The plumbing stays where it's drawn; what changes is how safe it is.",
    layouts: [
      L("gf-bedroom-bath", "A", {
        name: "As drawn, made safe",
        idea: "Wall-hung WC and vanity where the plan has them; the shower made level-access, with a fold-down seat.",
        pieces: [
          vanity(0, 150, 800, "left"),
          wc(0, 1950, "left"),
          { kind: "shower", x: 950, y: 700, w: 818, d: 1700, label: "Level walk-in shower 1700 × 818, fold-down seat" },
        ],
        pros: ["No change to the plumbing", "No step into the shower"],
        cons: ["The door still opens inwards — see B"],
        costDelta: 0,
      }),
      L("gf-bedroom-bath", "B", {
        name: "The door opens outwards",
        idea: "Everything in A, with the door hung to open out. Someone who falls inside can't then block it.",
        recommended: true,
        doors: [{ edge: "left", at: 1400, becomes: "swing-out" }],
        pieces: [
          vanity(0, 150, 800, "left"),
          wc(0, 1950, "left"),
          { kind: "shower", x: 950, y: 700, w: 818, d: 1700, label: "Level walk-in shower 1700 × 818, fold-down seat" },
        ],
        pros: ["The single most important safety change for a bathroom used by people in their seventies", "Frees floor inside the room"],
        cons: ["The door swings into their walk-in closet, so the hanging rail beside it has to stop short of its arc"],
        costDelta: 8000,
      }),
    ],
  },

  /* ---------------------------------------------------------- helper's room */
  {
    spaceId: "gf-maid",
    brief: "The helper's own room, beside the kitchen. It should feel like a room, not a store.",
    layouts: [
      L("gf-maid", "A", {
        name: "Bed along the east wall",
        idea: "Bed against the solid east wall, wardrobe on the west, a small table under the south window.",
        recommended: true,
        pieces: [
          bed("single", 1098, 1462, "right"),
          wardrobe(150, 0, 1200, "top"),
          low("table", 0, 700, 1000, 500, "left", "Table 1000 × 500"),
          chair(600, 950, 450),
        ],
        pros: ["The bed is away from the window and the door", "A table to eat or write at"],
        cons: ["Tight between the table and the bed"],
        costDelta: 0,
      }),
      L("gf-maid", "B", {
        name: "A day bed, so it's a sitting room by day",
        idea: "A day bed with storage under it along the south wall, the wardrobe on the east wall, and a table in the middle.",
        pieces: [
          { kind: "daybed", x: 0, y: 397, w: 915, d: 1980, back: "left", label: "Day bed 915 × 1980, storage under" },
          wardrobe(2478, 150, 1600, "right"),
          table("table", 1300, 800, 500, 500, "Table 500 × 500"),
          chair(1325, 1400, 450),
        ],
        pros: ["The room reads as somewhere to sit, not just somewhere to sleep", "More storage"],
        cons: ["A day bed is narrower than a proper single"],
        costDelta: 15000,
      }),
    ],
  },

  /* ------------------------------------------------------------ powder room */
  {
    spaceId: "gf-powder",
    brief: "The guest WC, reached through the family side — so it has to be finished to guest standard. At 7'6\" × 3'6\", its door can't swing in without hitting the WC.",
    layouts: [
      L("gf-powder", "A", {
        name: "A pocket door",
        idea: "The door slides into the wall, freeing the room; WC on the far wall, basin on the long wall.",
        recommended: true,
        doors: [{ edge: "left", at: 600, becomes: "pocket" }],
        pieces: [
          wc(1636, 200, "right"),
          vanity(800, 0, 700, "top", 450),
        ],
        pros: ["Nothing swings into the room or the corridor", "The WC is the last thing you see, not the first"],
        cons: ["Moves the WC to the far end — about 1.5 m of new soil pipe in the plinth"],
        costDelta: 0,
      }),
      L("gf-powder", "B", {
        name: "The door opens outwards",
        idea: "The same fittings, with a hinged door opening out into the passage.",
        doors: [{ edge: "left", at: 600, becomes: "swing-out" }],
        pieces: [
          wc(1636, 200, "right"),
          vanity(800, 0, 700, "top", 450),
        ],
        pros: ["Cheaper than a pocket door"],
        cons: ["The door swings into the passage outside"],
        costDelta: -13000,
      }),
    ],
  },
  /* ------------------------------------------------------------------- deck */
  {
    spaceId: "out-deck",
    brief: "A small deck off the living room's north sliders — north-facing, so shaded most of the day. Your parents' outdoor room.",
    layouts: [
      L("out-deck", "A", {
        name: "Two chairs and a low table",
        idea: "Two outdoor armchairs facing the garden with a low table between them, the slider kept clear.",
        recommended: true,
        pieces: [
          armchair(700, 300, "left", "Outdoor armchair 800 × 800"),
          table("side", 900, 1150, 450, 300, "Low table"),
          armchair(700, 1500, "left", "Outdoor armchair 800 × 800"),
          plant(1600, 1850, 450),
        ],
        pros: ["Tea outside without a step or a stair", "Shaded all afternoon"],
        cons: ["Seats two"],
        costDelta: 0,
      }),
      L("out-deck", "B", {
        name: "A built-in bench and planters",
        idea: "A timber bench along the garden edge seats four, with planters at each end.",
        pieces: [
          sofaLen(1473, 400, 1600, "right", 600, "Built-in bench 1600 × 600"),
          { kind: "planter", x: 1473, y: 0, w: 600, d: 380, label: "Planter" },
          { kind: "planter", x: 1473, y: 1997, w: 600, d: 380, label: "Planter" },
          table("side", 800, 900, 500, 500, "Low table"),
        ],
        pros: ["Seats four", "Nothing to bring in during the monsoon"],
        cons: ["A bench has no back support unless it's built with one"],
        costDelta: 20000,
      }),
    ],
  },
];

export default designs;
