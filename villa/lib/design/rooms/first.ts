import type { Layout, RoomDesign } from "../types";
import {
  bed, bedside, wardrobe, tall, shelf, low, sofa, sofaLen, armchair, chair, taskChair,
  table, rug, zone, plant, vanity, wc,
} from "../pieces";

/** The first floor: the family's own. Room-local mm, road-down, north to the right. */

const L = (spaceId: string, key: Layout["key"], rest: Omit<Layout, "id" | "spaceId" | "key">): Layout =>
  ({ id: `${spaceId}:${key}`, spaceId, key, ...rest });

const MASTER_DOOR = "The master bedroom's entry door isn't in the villa model; it's taken to be on the east wall, off the lobby.";
const CHILD = "Drawn for a child of 6 or 8, to last to 16 without rebuilding. Which child has which room isn't decided yet.";

const designs: RoomDesign[] = [
  /* ---------------------------------------------------------------- master */
  {
    spaceId: "ff-master",
    brief: "The largest bedroom in the house, in the south-west corner: glazed west and south, so it takes the afternoon sun. The walk-in and bathroom run along the west wall beyond it.",
    assumedOpenings: [{ kind: "door", edge: "bottom", from: 4700, to: 5600, swingIn: true }],
    layouts: [
      L("ff-master", "A", {
        name: "King bed, head to the east, a reading corner",
        idea: "The bed's head on the long east wall, as Vaastu prefers; a reading chair in the south window's light; a bench at the bed foot.",
        recommended: true,
        pieces: [
          rug(1000, 1400, 2800, 2600, "Rug 2800 × 2600"),
          bedside(1000, 3959), bed("king", 1450, 2279, "bottom"), bedside(3280, 3959),
          low("bench", 1600, 1779, 1530, 450, "bottom", "Bench 1530 × 450 at the bed foot"),
          armchair(150, 1400, "left", "Reading chair 800 × 800"),
          table("side", 150, 2250, 450, 450, "Side table"),
          low("dresser", 5737, 2100, 1200, 450, "right", "Dresser 1200 × 450"),
        ],
        dims: [{ from: [2365, 0], to: [2365, 1779], label: "1779 to the bench" }],
        pros: ["Head east, which Vaastu favours, with the morning light behind you", "The afternoon sun lands on the reading chair, not the bed", "Calm: no TV"],
        cons: ["The chair is by the hottest window in the room — it needs the solar screen"],
        costDelta: 0,
        assumptions: [MASTER_DOOR],
      }),
      L("ff-master", "B", {
        name: "A private sitting room at the foot of the bed",
        idea: "The same bed, with a loveseat and table facing it under the west window, and a writing desk in the south window.",
        pieces: [
          bedside(1000, 3959), bed("king", 1450, 2279, "bottom"), bedside(3280, 3959),
          sofa(2, 1500, 150, "top", "Loveseat 1700 × 900"),
          table("coffee", 1900, 1250, 900, 500, "Coffee table 900 × 500"),
          low("desk", 0, 1100, 1400, 600, "left", "Writing desk 1400 × 600"),
          chair(650, 1500, 550, "Desk chair"),
          low("dresser", 5737, 2100, 1200, 450, "right", "Dresser 1200 × 450"),
        ],
        pros: ["Somewhere of your own to sit away from the family lounge", "A desk for the paperwork that never gets done at the dining table"],
        cons: ["A fuller room", "The loveseat faces the west window's glare in the afternoon"],
        costDelta: 45000,
        assumptions: [MASTER_DOOR],
      }),
    ],
  },

  /* ------------------------------------------------------------ master WIC */
  {
    spaceId: "ff-master-wic",
    brief: "The walk-in between the bedroom and the bathroom, with a west window. The plan draws hanging along both long walls — one of them across the window.",
    layouts: [
      L("ff-master-wic", "A", {
        name: "Hanging on the east wall, drawers under the window",
        idea: "Full-height hanging along the solid wall; drawers and a dressing table under the window so the daylight stays.",
        recommended: true,
        pieces: [
          wardrobe(0, 2143, 3109, "bottom"),
          low("dresser", 1280, 0, 1524, 500, "top", "Drawers and dressing table 1524 × 500, under the window"),
          tall(0, 0, 1200, "top", 450, "Shoe and bag tower 1200 × 450"),
        ],
        dims: [{ from: [2300, 500], to: [2300, 2143], label: "1643 between" }],
        pros: ["Keeps the only daylight in the walk-in", "A dressing table in natural light"],
        cons: ["Less hanging than the plan's two full walls"],
        costDelta: 0,
      }),
      L("ff-master-wic", "B", {
        name: "Open hanging, no doors",
        idea: "The same arrangement with open rails and shelves instead of shuttered wardrobes.",
        pieces: [
          { ...wardrobe(0, 2143, 3109, "bottom"), label: "Open hanging rail and shelves 3109 × 600" },
          low("dresser", 1280, 0, 1524, 500, "top", "Drawers 1524 × 500, under the window"),
          tall(0, 0, 1200, "top", 450, "Shoe shelves 1200 × 450, open"),
        ],
        pros: ["Much cheaper", "Everything visible at once"],
        cons: ["Hyderabad dust settles on everything open", "Needs discipline to look good"],
        costDelta: -60000,
      }),
    ],
  },

  /* ----------------------------------------------------------- master bath */
  {
    spaceId: "ff-master-bath",
    brief: "The master bathroom, entered through the walk-in. No window, so ventilation is mechanical.",
    ignoreOpenings: [{ edge: "right", at: 1300, why: "The villa model puts Bedroom 3's bathroom door on this wall; the two bathrooms aren't connected." }],
    layouts: [
      L("ff-master-bath", "A", {
        name: "As drawn",
        idea: "Vanity, WC and shower where the plan puts them.",
        pieces: [
          vanity(0, 100, 800, "left"),
          wc(0, 1850, "left"),
          { kind: "shower", x: 1097, y: 914, w: 1037, d: 1300, label: "Shower 1300 × 1037" },
        ],
        pros: ["No change to the plumbing"],
        cons: ["A single basin in a couple's bathroom"],
        costDelta: 0,
      }),
      L("ff-master-bath", "B", {
        name: "A double vanity and a walk-in shower",
        idea: "Two basins on the west wall and a larger walk-in shower, with the WC where it is.",
        recommended: true,
        pieces: [
          vanity(700, 0, 1434, "top"),
          wc(0, 1850, "left"),
          { kind: "shower", x: 1100, y: 1300, w: 1034, d: 1443, label: "Walk-in shower 1443 × 1034" },
        ],
        pros: ["Two of you can get ready at once", "A bigger shower with no door to clean"],
        cons: ["Moves the basin supplies and waste — about a day's plumbing"],
        costDelta: 55000,
      }),
    ],
  },

  /* ------------------------------------------------------------- bedroom 3 */
  {
    spaceId: "ff-bed3",
    brief: "A child's room in the north-west, lit by a north slider — the coolest bedroom in the house. A fitted wardrobe, not a walk-in.",
    layouts: [
      L("ff-bed3", "A", {
        name: "Bed head to the east, a desk in the north light",
        idea: "Wardrobe along the west wall, the bed's head on the east, and a desk facing the north slider — the best study light in the house.",
        recommended: true,
        pieces: [
          rug(700, 700, 1100, 2000, "Play rug"),
          wardrobe(700, 0, 3000, "top"),
          bedside(1500, 3105), bed("double", 1950, 1475, "bottom"), bedside(3320, 3105),
          low("desk", 4764, 700, 1200, 600, "right", "Desk 1200 × 600, facing the north light"),
          taskChair(4000, 975),
          low("console", 3900, 3055, 1300, 450, "bottom", "Low book and toy storage 1300 × 450"),
        ],
        pros: ["A 4'6\" bed that lasts to 16", "North light for homework with no glare", "The desk faces north, as Vaastu prefers for study"],
        cons: ["Less open floor for play"],
        costDelta: 0,
        assumptions: [CHILD],
      }),
      L("ff-bed3", "B", {
        name: "A single bed along the wall, and a big play floor",
        idea: "A single bed with a trundle for sleepovers, lengthwise against the east wall, leaving the middle of the room to play in.",
        pieces: [
          rug(1000, 800, 2800, 1600, "Play rug 2800 × 1600"),
          wardrobe(700, 0, 3000, "top"),
          { kind: "daybed", x: 1600, y: 2590, w: 1980, d: 915, back: "bottom", label: "Single bed with trundle 915 × 1980" },
          low("desk", 4764, 700, 1200, 600, "right", "Desk 1200 × 600, facing the north light"),
          taskChair(4000, 975),
          low("console", 3900, 3055, 1300, 450, "bottom", "Low book and toy storage 1300 × 450"),
        ],
        pros: ["Twice the floor to play on", "Sleepovers without a spare room"],
        cons: ["A single bed will feel small by 14"],
        costDelta: -20000,
        assumptions: [CHILD],
      }),
    ],
  },

  /* ------------------------------------------------------------- bedroom 4 */
  {
    spaceId: "ff-bed4",
    brief: "A child's room: long and narrow, with the window at its east end and a walk-in and bathroom off its south side. It shares its north wall with the family lounge and its TV.",
    assumedOpenings: [
      { kind: "door", edge: "left", from: 701, to: 1554, swingIn: true },
      { kind: "arch", edge: "left", from: 3400, to: 4300 },
    ],
    layouts: [
      L("ff-bed4", "A", {
        name: "Bed head to the south; shelving as a sound wall",
        idea: "The bed's head on the solid south wall, a study at the east window, and full-height shelves along the lounge wall to stop the TV coming through.",
        recommended: true,
        pieces: [
          bed("double", 0, 1600, "left"), bedside(0, 2990),
          shelf(3460, 1000, 4400, "right", 350, "Full-height shelving on the lounge wall — books, and sound insulation"),
          rug(600, 3600, 2600, 1800, "Play rug"),
          low("desk", 1000, 5618, 1400, 600, "bottom", "Desk 1400 × 600, facing the east window"),
          taskChair(1375, 4850),
        ],
        pros: ["Solves the TV-through-the-wall problem with something useful", "The desk faces east — morning light, and Vaastu's preferred direction for study", "Head south, as Vaastu prefers"],
        cons: ["Only one bedside table fits beside the bed"],
        costDelta: 0,
        assumptions: [CHILD, "The doors to its bathroom and walk-in aren't in the villa model; they're taken to be on the south wall."],
      }),
      L("ff-bed4", "B", {
        name: "Single bed at the window end, a long desk on the south wall",
        idea: "A single bed tucked into the east corner and a long desk against the south wall, leaving the middle clear.",
        pieces: [
          bed("single", 2880, 4238, "bottom"),
          shelf(3460, 600, 3500, "right", 350, "Full-height shelving on the lounge wall"),
          low("desk", 0, 1650, 1700, 600, "left", "Long desk 1700 × 600"),
          taskChair(700, 2175),
          rug(800, 2800, 2400, 1800, "Play rug"),
        ],
        pros: ["A long desk for two to do homework together", "More open floor"],
        cons: ["The bed's head is under the window's morning sun", "Less shelving on the lounge wall, so more TV noise"],
        costDelta: -15000,
        assumptions: [CHILD, "The doors to its bathroom and walk-in aren't in the villa model; they're taken to be on the south wall."],
      }),
    ],
  },

  /* ---------------------------------------------------------- family lounge */
  {
    spaceId: "ff-family",
    brief: "The everyday heart of the house, with the main TV. It opens east onto the sit-out and has the puja off it. Its south wall is Bedroom 4's.",
    layouts: [
      L("ff-family", "A", {
        name: "TV on the north wall, away from Bedroom 4",
        idea: "The TV goes on the north wall, so the sound travels away from the child's bedroom; the sofa faces it with the sit-out to one side.",
        recommended: true,
        pieces: [
          rug(1500, 400, 2800, 3000, "Rug 2800 × 3000"),
          low("media", 4671, 300, 2600, 450, "right", "Media unit 2600 × 450"),
          { kind: "tv", x: 5061, y: 875, w: 60, d: 1450, label: "65-inch TV, wall-mounted" },
          sofa(3, 1800, 650, "left"),
          table("coffee", 3000, 1150, 600, 1200, "Coffee table 1200 × 600"),
          armchair(3100, 3000, "bottom"),
          low("console", 0, 700, 2400, 450, "left", "Low toy storage 2400 × 450"),
        ],
        dims: [{ from: [2750, 1600], to: [5061, 1600], label: "2311 to the screen" }],
        pros: ["The TV faces away from Bedroom 4", "The sit-out stays open and the puja door clear", "Toys live in the lounge, where the children actually play"],
        cons: ["The TV is side-on to the sit-out's light, so screens can catch glare in the morning"],
        costDelta: 0,
      }),
      L("ff-family", "B", {
        name: "An L-shaped sofa for movie nights",
        idea: "The same TV wall with a big L, for the whole family on the sofa at once.",
        pieces: [
          rug(1500, 400, 2800, 3000, "Rug 2800 × 3000"),
          low("media", 4671, 300, 2600, 450, "right", "Media unit 2600 × 450"),
          { kind: "tv", x: 5061, y: 875, w: 60, d: 1450, label: "65-inch TV, wall-mounted" },
          sofa(3, 1800, 650, "left"),
          sofaLen(1800, 2850, 2000, "bottom", 950, "Chaise return 2000 × 950"),
          table("coffee", 3000, 1150, 600, 1200, "Coffee table 1200 × 600"),
          low("console", 0, 700, 2400, 450, "left", "Low toy storage 2400 × 450"),
        ],
        pros: ["All five of you on one sofa", "The best room in the house for a film"],
        cons: ["The chaise sits in front of half the sit-out slider"],
        costDelta: 50000,
      }),
    ],
  },

  /* ------------------------------------------------------------------ puja */
  {
    spaceId: "ff-puja",
    brief: "Off the family lounge in the north-east corner, with a north window. Used daily and simply.",
    layouts: [
      L("ff-puja", "A", {
        name: "The mandir on the east wall, so you face east",
        idea: "The mandir against the east wall, so whoever prays faces east; a floor mat and a low stool for those who can't sit on the floor.",
        recommended: true,
        pieces: [
          rug(400, 900, 1000, 800, "Floor mat"),
          low("altar", 300, 1836, 1200, 450, "bottom", "Mandir 1200 × 450 — you face east to pray"),
          { kind: "bench", x: 700, y: 1000, w: 500, d: 350, label: "Low stool" },
          tall(0, 0, 700, "top", 400, "Tall cupboard for puja things 700 × 400"),
        ],
        pros: ["Facing east while praying, as Vaastu prefers", "A stool for your parents"],
        cons: ["Moves the mandir from where the plan draws it"],
        costDelta: 0,
      }),
      L("ff-puja", "B", {
        name: "As drawn, along the west wall",
        idea: "The mandir along the west wall, where the plan has it.",
        pieces: [
          rug(400, 900, 1000, 800, "Floor mat"),
          low("altar", 150, 0, 1500, 450, "top", "Mandir 1500 × 450 along the west wall"),
        ],
        pros: ["A longer mandir"],
        cons: ["Whoever prays faces west, which most Vaastu practice avoids"],
        costDelta: -10000,
      }),
    ],
  },

  /* --------------------------------------------------------------- sit-out */
  {
    spaceId: "ff-sitout",
    brief: "A covered sit-out off the family lounge, facing east over the porch, shaded by the floor above.",
    layouts: [
      L("ff-sitout", "A", {
        name: "Morning coffee for two",
        idea: "Two outdoor lounge chairs facing east with a small table between them, and planters along the rail.",
        recommended: true,
        pieces: [
          armchair(1100, 800, "top", "Outdoor lounge chair 800 × 800"),
          table("side", 1950, 1000, 500, 500, "Side table"),
          armchair(2500, 800, "top", "Outdoor lounge chair 800 × 800"),
          { kind: "planter", x: 200, y: 1947, w: 4629, d: 400, label: "Planter along the rail 4629 × 400" },
          plant(4300, 200, 500),
        ],
        pros: ["Facing the morning sun, under cover by midday", "Easy to keep"],
        cons: ["Two seats"],
        costDelta: 0,
      }),
      L("ff-sitout", "B", {
        name: "A jhoola",
        idea: "A swing seat hung from the slab above, with room to swing and planters along the rail.",
        pieces: [
          zone(1500, 700, 1900, 1100, "Swing clearance"),
          sofaLen(1700, 900, 1500, "top", 700, "Swing seat (jhoola) 1500 × 700, hung from the slab"),
          { kind: "planter", x: 200, y: 1947, w: 4629, d: 400, label: "Planter along the rail 4629 × 400" },
          plant(4300, 200, 500),
        ],
        pros: ["The seat the children — and your parents — will fight over", "Very much of this house and this city"],
        cons: ["The slab above needs a structural check for the hook", "Seats two"],
        costDelta: 25000,
        assumptions: ["The slab above can take a swing's load. Needs the structural consultant's confirmation."],
      }),
    ],
  },
];

export default designs;
