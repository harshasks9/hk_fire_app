import type { Layout, RoomDesign } from "../types";
import {
  wardrobe, tall, shelf, low, sofa, sofaLen, armchair, chair, stool, taskChair,
  table, dining, rug, zone, plant, counter,
} from "../pieces";

/** The second floor: work by day, play by night. Room-local mm, road-down, north to the right. */

const L = (spaceId: string, key: Layout["key"], rest: Omit<Layout, "id" | "spaceId" | "key">): Layout =>
  ({ id: `${spaceId}:${key}`, spaceId, key, ...rest });

const OFFICE_DOOR = "The office's entry door isn't in the villa model; it's taken to be on the west wall at its north end, with the opening to the store on the south wall.";
const THEATRE_WALL = "The villa model draws a slider and a door on the theatre's north wall, into the laundry; the theatre sheet treats that wall as solid. Verify on site.";

const designs: RoomDesign[] = [
  /* ---------------------------------------------------------------- office */
  {
    spaceId: "sf-bed5",
    brief: "Your office: 18'10\" × 12'6\", glazed east and opening north onto the terrace. A full-time workplace for long days and video calls, with a single sofa-bed for an overflow guest.",
    assumedOpenings: [
      { kind: "door", edge: "top", from: 4600, to: 5500, swingIn: true },
      { kind: "arch", edge: "left", from: 800, to: 1600 },
    ],
    layouts: [
      L("sf-bed5", "A", {
        name: "Facing east, back to the joinery",
        idea: "From the office proposal: a sit-stand desk floating in front of a full-height oak wall, north light from the left, the joinery as the call background. The sofa-bed on the south wall.",
        recommended: true,
        pieces: [
          zone(4500, 0, 1230, 3749, "Terrace zone — kept clear"),
          zone(0, 1700, 1900, 2000, "Sofa-bed opened"),
          rug(2200, 1400, 2900, 1900, "Rug 2900 × 1900"),
          tall(0, 0, 4200, "top", 600, "Joinery 4200 × 600, full height — storage and the call background"),
          { kind: "desk", x: 2700, y: 2000, w: 1800, d: 800, label: "Sit-stand desk 1800 × 800" },
          { kind: "tv", x: 3150, y: 2720, w: 900, d: 40, label: "Monitor on an arm" },
          taskChair(3275, 1175),
          { kind: "daybed", x: 0, y: 1700, w: 900, d: 2000, back: "left", label: "Single sofa-bed 2000 × 900 (1900 deep opened)" },
        ],
        dims: [{ from: [3600, 600], to: [3600, 1500], label: "900 to the joinery" }, { from: [4500, 2400], to: [5730, 2400], label: "1230 to the terrace" }],
        pros: ["The camera sees lit oak, not a window", "North light as a soft key light from your left", "A four-metre view east for your eyes between screens"],
        cons: ["The east window's edge sits behind the monitor from about 6:30 to 10 am — the solar screen handles it"],
        costDelta: 0,
        assumptions: [OFFICE_DOOR],
      }),
      L("sf-bed5", "B", {
        name: "Facing west, the studio corner",
        idea: "The desk turned to face the joinery, so no daylight is ever in your sight line; drapery across the east wall becomes the call background.",
        pieces: [
          zone(0, 1600, 1900, 2000, "Sofa-bed opened"),
          tall(0, 0, 4200, "top", 600, "Joinery 4200 × 600, full height — monitors against it"),
          { kind: "desk", x: 2400, y: 600, w: 1800, d: 800, label: "Sit-stand desk 1800 × 800" },
          { kind: "tv", x: 2850, y: 640, w: 900, d: 40, label: "Monitor on an arm" },
          taskChair(2975, 1525),
          { kind: "partition", x: 0, y: 3649, w: 5730, d: 100, soft: true, label: "Full-height drapery across the east wall" },
          { kind: "daybed", x: 0, y: 1600, w: 900, d: 2000, back: "left", label: "Single sofa-bed 2000 × 900 (1900 deep opened)" },
        ],
        pros: ["No screen glare at any hour", "The terrace route is entirely clear"],
        cons: ["You face a wall a metre away all day — no distance focus", "About ₹85,000 of drapery, and the east window stops being a window"],
        costDelta: 85000,
        assumptions: [OFFICE_DOOR],
      }),
    ],
  },

  /* ---------------------------------------------------------- office store */
  {
    spaceId: "sf-bed5-wic",
    brief: "The office's walk-in becomes its service room, so the office itself stays clear. It has a south window, which helps ventilate the UPS.",
    assumedOpenings: [{ kind: "arch", edge: "right", from: 739, to: 1539 }],
    layouts: [
      L("sf-bed5-wic", "A", {
        name: "Store, printer and UPS",
        idea: "Full-height shelving on the west wall, a printer and shipping counter on the east, and the UPS and network rack in the corner by the window.",
        recommended: true,
        pieces: [
          shelf(0, 0, 2134, "top", 450, "Shelving 2134 × 450, full height"),
          counter(0, 2600, 1500, "bottom", "Printer and shipping counter 1500 × 600"),
          tall(1534, 2600, 600, "right", 600, "UPS and network rack 600 × 600, ventilated"),
        ],
        pros: ["The printer, the noise of the UPS and the paper live out of sight", "Ventilated by the window"],
        cons: ["No hanging for a guest using the sofa-bed"],
        costDelta: 0,
        assumptions: ["The opening from the office is taken to be on this room's north side."],
      }),
      L("sf-bed5-wic", "B", {
        name: "A walk-in for the office's guest",
        idea: "Hanging along the west wall for whoever sleeps on the sofa-bed, drawers on the east, and the UPS in the corner.",
        pieces: [
          wardrobe(0, 0, 2134, "top"),
          low("dresser", 0, 2700, 1400, 500, "bottom", "Drawers 1400 × 500"),
          tall(1534, 2600, 600, "right", 600, "UPS and network rack 600 × 600, ventilated"),
        ],
        pros: ["Makes the office a proper guest room when it's needed"],
        cons: ["Office stores and the printer go back into the office"],
        costDelta: 20000,
        assumptions: ["The opening from the office is taken to be on this room's north side."],
      }),
    ],
  },

  /* --------------------------------------------------------------- theatre */
  {
    spaceId: "sf-theatre",
    brief: "The family's theatre, in the south-west corner of the top floor. Glazed west and south, so both windows are infilled or blacked out.",
    ignoreOpenings: [
      { edge: "right", at: 1300, why: THEATRE_WALL },
    ],
    assumedOpenings: [{ kind: "door", edge: "bottom", from: 4300, to: 5200, swingIn: false }],
    layouts: [
      L("sf-theatre", "A", {
        name: "The 7.2.4 layout from the theatre sheet",
        idea: "A 120-inch acoustically transparent screen on the south wall, three recliners at floor level and three more on a 0.40 m riser — transcribed from the provisional theatre drawing.",
        recommended: true,
        pieces: [
          zone(120, 120, 480, 4119, "Stage: L/C/R and two subs"),
          zone(4157, 120, 1860, 4119, "Riser +0.40 m, filled with mineral wool"),
          { kind: "screen", x: 520, y: 645, w: 80, d: 2660, label: "120-inch AT screen, 2.66 m wide" },
          { kind: "recliner", x: 2850, y: 500, w: 1000, d: 950, back: "right", label: "Recliner 950 × 1000" },
          { kind: "recliner", x: 2850, y: 1500, w: 1000, d: 950, back: "right", label: "Recliner 950 × 1000" },
          { kind: "recliner", x: 2850, y: 2500, w: 1000, d: 950, back: "right", label: "Recliner 950 × 1000" },
          { kind: "recliner", x: 4830, y: 500, w: 1000, d: 950, back: "right", label: "Wall-hugger recliner 950 × 1000" },
          { kind: "recliner", x: 4830, y: 1500, w: 1000, d: 950, back: "right", label: "Wall-hugger recliner 950 × 1000" },
          { kind: "recliner", x: 4830, y: 2500, w: 1000, d: 950, back: "right", label: "Wall-hugger recliner 950 × 1000" },
        ],
        dims: [{ from: [600, 3700], to: [3500, 3700], label: "2900 to row 1 ears" }, { from: [3500, 3950], to: [5480, 3950], label: "1980 row pitch" }],
        pros: ["The layout already worked out on the theatre sheet", "Six seats, every one with a clear sightline"],
        cons: ["The dearest room in the house per square foot", "A dedicated room — it doesn't double as anything else"],
        costDelta: 0,
        assumptions: [THEATRE_WALL, "The acoustic door is on the east wall, as the theatre sheet assumes. Verify on site."],
      }),
      L("sf-theatre", "B", {
        name: "A lounge theatre: one row, no riser",
        idea: "One big modular sofa facing a 110-inch screen, with a drinks counter at the back — a family room that happens to have a great screen.",
        pieces: [
          { kind: "screen", x: 520, y: 750, w: 80, d: 2440, label: "110-inch screen, 2.44 m wide" },
          sofaLen(3000, 300, 3600, "right", 1000, "Modular sofa 3600 × 1000, chaise ends"),
          { kind: "ottoman", x: 2200, y: 1400, w: 600, d: 1200, label: "Ottoman 1200 × 600" },
          counter(5587, 300, 1800, "right", "Drinks counter 1800 × 600, fridge under"),
        ],
        pros: ["Far cheaper", "Lounging, not rows — better for children", "The room still works with the lights on"],
        cons: ["One row: seats five or six on the sofa", "5.1 rather than 7.2.4"],
        costDelta: -350000,
        assumptions: [THEATRE_WALL],
      }),
    ],
  },

  /* ---------------------------------------------------- lounge and bar */
  {
    spaceId: "sf-lobby",
    merge: ["sf-bar"],
    brief: "The second floor's lounge, with the bar counter against the office wall and a slider onto the terrace. A family room most of the year that converts for the New Year party.",
    layouts: [
      L("sf-lobby", "A", {
        name: "A family room that serves the terrace",
        idea: "A sofa facing the terrace, two armchairs, a games table, and the bar counter with stools — lived in every week, not just at New Year.",
        recommended: true,
        pieces: [
          rug(1000, 1200, 2800, 2600, "Rug 2800 × 2600"),
          sofa(3, 650, 1300, "left"),
          table("coffee", 1850, 1800, 600, 1200, "Coffee table 1200 × 600"),
          armchair(2600, 1450, "right"), armchair(2600, 2550, "right"),
          table("table", 1600, 250, 900, 900, "Games table 900 × 900"),
          chair(1100, 475, 450), chair(2550, 475, 450), chair(1825, 1150, 450),
          { kind: "bar", x: 1067, y: 4917, w: 2438, d: 600, label: "Bar counter 2438 × 600" },
          stool(1300, 4450), stool(1900, 4450), stool(2500, 4450), stool(3000, 4450),
        ],
        pros: ["A room the children use for board games, not a bar used four times a year", "The terrace slider stays open"],
        cons: ["For the party, the sofa and games table have to be moved — see B"],
        costDelta: 0,
      }),
      L("sf-lobby", "B", {
        name: "Party mode, for New Year",
        idea: "Seating pushed to the west wall, three high tables, the bar open — standing room for about thirty, spilling onto the terrace.",
        pieces: [
          zone(600, 1100, 3300, 3500, "Standing room for about thirty"),
          sofa(3, 800, 0, "top"),
          table("table", 1200, 2000, 700, 700, "High table 700 × 700"),
          table("table", 2400, 2400, 700, 700, "High table 700 × 700"),
          table("table", 1300, 3400, 700, 700, "High table 700 × 700"),
          { kind: "bar", x: 1067, y: 4917, w: 2438, d: 600, label: "Bar counter 2438 × 600" },
          stool(1300, 4450), stool(1900, 4450), stool(2500, 4450), stool(3000, 4450),
        ],
        pros: ["The same room, set up for the one night it has to hold a crowd", "Food and drink flow straight out onto the terrace"],
        cons: ["It's a setting, not a layout: someone moves the furniture twice a year"],
        costDelta: 30000,
      }),
    ],
  },

  /* ---------------------------------------------------------------- laundry */
  {
    spaceId: "sf-laundry",
    brief: "The laundry, beside the terrace where things dry. The children's clothes come up from the first floor and go back down, so it has to work as a folding room too.",
    ignoreOpenings: [
      { edge: "left", at: 1300, why: "The villa model draws the laundry opening into the theatre; it's taken to open towards the terrace instead. Verify on site." },
    ],
    assumedOpenings: [{ kind: "door", edge: "right", from: 900, to: 1800, swingIn: false }],
    layouts: [
      L("sf-laundry", "A", {
        name: "Stacked washer-dryer and a folding counter",
        idea: "Washer and dryer stacked in one corner, a long counter for sorting and folding with a sink at its end, and a tall cupboard for the ironing board.",
        recommended: true,
        pieces: [
          { kind: "washer", x: 0, y: 0, w: 700, d: 700, tall: true, label: "Washer and dryer, stacked 700 × 700" },
          counter(0, 800, 1900, "left", "Folding counter 1900 × 600"),
          { kind: "sink", x: 0, y: 2100, w: 600, d: 600, label: "Utility sink" },
          tall(1076, 0, 600, "top", 600, "Tall cupboard 600 × 600: ironing board, detergents"),
        ],
        pros: ["Folding happens where the clothes come out, not on a bed", "The most counter in the least space"],
        cons: ["A stacked dryer is at head height for loading"],
        costDelta: 0,
        assumptions: ["The laundry's door is taken to be on its north side, towards the terrace."],
      }),
      L("sf-laundry", "B", {
        name: "Side by side under one counter",
        idea: "Washer and dryer side by side under a counter the full length of the room, and an airer for delicates.",
        pieces: [
          counter(0, 0, 2743, "left", "Counter 2743 × 600 over the washer and dryer"),
          { kind: "washer", x: 0, y: 100, w: 600, d: 600, label: "Washer" },
          { kind: "washer", x: 0, y: 750, w: 600, d: 600, label: "Dryer" },
          { kind: "sink", x: 0, y: 2000, w: 600, d: 600, label: "Utility sink" },
          zone(800, 1900, 876, 843, "Airer for delicates"),
        ],
        pros: ["Everything at counter height — easier on the back"],
        cons: ["Less storage"],
        costDelta: 10000,
        assumptions: ["The laundry's door is taken to be on its north side, towards the terrace."],
      }),
    ],
  },

  /* ---------------------------------------------------------------- terrace */
  {
    spaceId: "sf-terrace",
    brief: "The largest space in the villa: 774 sq ft of open deck along the north. Three zones: drying by the laundry, the party in the middle off the lounge, a quiet garden at the east end off your office.",
    assumedOpenings: [
      { kind: "slider", edge: "left", from: 4877, to: 7620, known: true },
      { kind: "slider", edge: "left", from: 10668, to: 13106, known: true },
    ],
    layouts: [
      L("sf-terrace", "A", {
        name: "Three zones: drying, party, garden",
        idea: "A slatted screen hides the drying at the west end; a pergola over an eight-seat table and a lounge set in the middle; loungers and trees in the garden outside your office.",
        recommended: true,
        pieces: [
          zone(0, 0, 5364, 2700, "Drying — screened, by the laundry"),
          { kind: "partition", x: 0, y: 2700, w: 5364, d: 80, soft: true, label: "Slatted timber screen" },
          { kind: "pergola", x: 900, y: 3600, w: 4000, d: 5200, soft: true, label: "Pergola 4000 × 5200" },
          dining(8, 1400, 4200, "y"),
          sofaLen(4200, 7200, 2200, "right", 900, "Outdoor sofa 2200 × 900"),
          armchair(1800, 7400, "left", "Outdoor armchair 800 × 800"),
          armchair(1800, 8400, "left", "Outdoor armchair 800 × 800"),
          table("coffee", 2900, 7700, 800, 1200, "Outdoor coffee table 1200 × 800"),
          { kind: "planter", x: 4964, y: 3000, w: 400, d: 4000, label: "Planter along the parapet" },
          { kind: "tree", x: 4200, y: 9900, w: 1000, d: 1000, label: "Tree in a planter" },
          { kind: "lounger", x: 2600, y: 11000, w: 1900, d: 700, back: "left", label: "Lounger 1900 × 700" },
          { kind: "lounger", x: 2600, y: 11900, w: 1900, d: 700, back: "left", label: "Lounger 1900 × 700" },
          { kind: "tree", x: 600, y: 12000, w: 900, d: 900, label: "Tree in a planter" },
          { kind: "planter", x: 1600, y: 12950, w: 3764, d: 400, label: "Planter along the parapet" },
        ],
        pros: ["Washing never shares the view with guests", "Shade over the table, which the terrace otherwise lacks", "Your office looks out on a garden, not a party"],
        cons: ["A pergola over the terrace needs fixing through the waterproofing — detail it with the roof insulation"],
        costDelta: 0,
      }),
      L("sf-terrace", "B", {
        name: "An open deck for the party",
        idea: "Built-in benches along the parapet and three high tables, leaving the middle open for forty people; a small pergola over an outdoor bar at the east end.",
        pieces: [
          zone(0, 0, 5364, 2700, "Drying — screened, by the laundry"),
          { kind: "partition", x: 0, y: 2700, w: 5364, d: 80, soft: true, label: "Slatted timber screen" },
          zone(600, 3200, 4000, 6000, "Open floor for about forty, standing"),
          sofaLen(4764, 3200, 6000, "right", 600, "Built-in bench 6000 × 600 along the parapet"),
          table("table", 1600, 4200, 700, 700, "High table 700 × 700"),
          table("table", 3000, 6000, 700, 700, "High table 700 × 700"),
          table("table", 1600, 7800, 700, 700, "High table 700 × 700"),
          { kind: "pergola", x: 1600, y: 9600, w: 3764, d: 2600, soft: true, label: "Pergola over the outdoor bar" },
          { kind: "bar", x: 4764, y: 9800, w: 600, d: 2200, label: "Outdoor bar counter 2200 × 600" },
          { kind: "tree", x: 600, y: 12000, w: 900, d: 900, label: "Tree in a planter" },
        ],
        pros: ["Holds the New Year party with room to spare", "Built-in benches seat twenty without any furniture to store"],
        cons: ["Emptier the other 364 days", "Less shade"],
        costDelta: 60000,
      }),
    ],
  },
];

export default designs;
