import type { Category, ProjectState, ScopeItem, Stage } from "./types";
import { STAGE_PROGRESS } from "./types";
import { forecastOf } from "./derive";
import { supplyOf } from "./purchase";

/**
 * Phases.
 *
 * A fit-out is not one job, it is twelve, and almost every expensive mistake
 * is a phase done out of order: marble ordered before the room was measured,
 * the false ceiling closed before the AC drain was pressure-tested, the
 * wardrobe fitted before the floor was laid so the shutters now foul the skirting.
 *
 * Each phase below says what it is for, what actually has to happen in it, and
 * — the part people skip — what must be true before the next one may start.
 * The week numbers are indicative for a villa of this size and are there to
 * show the shape of the programme, not to promise a date.
 */

export interface PhaseStep {
  title: string;
  detail: string;
  /** Skipping this one costs money later, not just time. */
  critical?: boolean;
}

export interface Phase {
  id: string;
  n: number;
  name: string;
  /** One sentence: what this phase is for. */
  goal: string;
  /** Indicative weeks from mobilisation, inclusive. */
  weeks: [number, number];
  steps: PhaseStep[];
  /** What must be true before the next phase may start. */
  exit: string[];
  /** The trades whose work sits in this phase. Empty for planning phases.
   * Every trade belongs to exactly one, so an item is never in two places. */
  categories: Category[];
  /** Trades this phase touches that are owned by a later one — display only. */
  alsoTouches?: Category[];
  /** True for the phase measured against everything that has to be ordered. */
  purchases?: boolean;
  /** Scope items at or beyond this stage have cleared the phase. */
  clears?: Stage;
  /** The mistake this phase exists to prevent. */
  trap: string;
}

export const PHASES: Phase[] = [
  {
    id: "survey", n: 1, name: "Survey & handover of the shell",
    goal: "Know exactly what you have been given, in millimetres, before designing anything for it.",
    weeks: [0, 2],
    categories: [],
    trap: "Designing to the architect's plan. The as-built is never the drawing — a room 40 mm out makes a fitted wardrobe unfittable.",
    steps: [
      { title: "Laser-measure every room", critical: true, detail: "Width, length, ceiling height, diagonal for square, sill and lintel heights. Record against each room and change its dimension source from the plan to site-measured." },
      { title: "Mark every existing service", critical: true, detail: "Drain and waste positions, water inlets, the electrical panel and sanctioned load, gas line, shafts, beam soffits and slab drops." },
      { title: "Snag the builder's shell", critical: true, detail: "Damp, level, plumb, window operation, terrace falls. Anything raised now is the builder's; anything raised later is yours." },
      { title: "Photograph everything before it is covered", detail: "Walls before plaster, slabs before ceiling. The photograph is what you will drill against in four years." },
      { title: "Agree community rules", detail: "Working hours, lift use, debris routes, deposit and the NOC. Hyderabad gated communities enforce these and a stop-work order costs a week." },
    ],
    exit: [
      "Every room carries a site-measured dimension, not a plan dimension.",
      "Ceiling heights recorded and the false-ceiling drop decided in principle.",
      "Shell defects raised in writing with the builder.",
      "Community NOC in hand and working hours agreed.",
    ],
  },
  {
    id: "concept", n: 2, name: "Brief & concept",
    goal: "Settle what each room is for and how it should feel, so options can be judged against something.",
    weeks: [1, 5],
    categories: [],
    clears: "idea",
    trap: "Choosing finishes before agreeing the brief. You end up with eleven beautiful rooms that do not belong to the same house.",
    steps: [
      { title: "Write the brief, room by room", critical: true, detail: "Who uses it, when, for what, and what it must never be. Two paragraphs a room beats a hundred reference images." },
      { title: "Agree the material palette for the whole house", critical: true, detail: "Three woods, two stones, a metal and a paint family. Every room draws from it. This is what makes a house read as one house." },
      { title: "Fix the layouts", critical: true, detail: "Furniture plan for every room at scale, with circulation checked. A bed that blocks a wardrobe swing is cheap to move now." },
      { title: "Vaastu review", detail: "Before the puja room, main door and hob positions are built. Vastly cheaper to resolve on paper." },
      { title: "Set the budget by room and by trade", detail: "A number per room, not one number for the villa. Otherwise the first three rooms eat the last eight." },
    ],
    exit: [
      "Brief written and signed off for every room.",
      "House-wide material palette agreed.",
      "Furniture layouts approved.",
      "Budget allocated room by room.",
    ],
  },
  {
    id: "design", n: 3, name: "Design development & specification",
    goal: "Turn every agreed idea into something a vendor can quote and a site team can build without asking a question.",
    weeks: [4, 12],
    categories: [],
    clears: "decided",
    trap: "A specification that says 'marble' rather than a named slab at a named yard. Vague specs are quoted low and built cheap.",
    steps: [
      { title: "Produce working drawings", critical: true, detail: "Floor, ceiling (reflected), electrical, plumbing and elevation drawings per room. Dimensioned in millimetres off the site survey." },
      { title: "Write the specification for every line", critical: true, detail: "Make, model, finish, size, code. Not 'good quality veneer' — the species, the cut, the sheet size and the polish." },
      { title: "Select and reserve the stone", critical: true, detail: "Slabs chosen, photographed, numbered and blocked at the yard. Book-matching cannot be decided from a sample tile." },
      { title: "Coordinate services against joinery", critical: true, detail: "Every socket, switch, data point, light, drain, diverter and AC drain marked on the drawing before a single wall is chased." },
      { title: "Check that everything physically gets in", critical: true, detail: "Lift car 5'6\" × 5'0\", the stair turn and the door widths against every large item. Crane hire if not." },
    ],
    exit: [
      "Every critical line carries a written specification.",
      "Working drawings issued for all three floors.",
      "Stone reserved at the yard.",
      "No decision left open on anything with a lead time.",
    ],
  },
  {
    id: "budget", n: 4, name: "BOQ, quotations & approval",
    goal: "Put a real, quoted number against the specification and get it approved before anything is ordered.",
    weeks: [8, 14],
    categories: [],
    clears: "approved",
    trap: "Comparing quotes that are not like for like. The cheapest kitchen quote is usually the one that left out the appliances.",
    steps: [
      { title: "Build the BOQ from the approved scope", critical: true, detail: "Quantities off the site measurements, not the plan. Every line with its unit, rate, wastage, labour and tax visible." },
      { title: "Get three quotes on the big trades", critical: true, detail: "Joinery, stone, electrical, HVAC, kitchen. Issue the same specification to all three or the comparison is meaningless." },
      { title: "Normalise the quotes before comparing", critical: true, detail: "Same scope, same inclusions, same tax treatment. The app flags quotes that are not like for like." },
      { title: "Agree payment terms and retention", detail: "Advance, stage payments against milestones, and 5–10% retained until snags are closed. Never pay to a schedule that runs ahead of the work." },
      { title: "Approve the budget room by room", critical: true, detail: "Approval is what turns an estimate into money the project has agreed to spend. Nothing is ordered before it." },
    ],
    exit: [
      "BOQ complete and quantities tied to site measurements.",
      "Quotes received, normalised and awarded.",
      "Contracts signed with payment terms and retention.",
      "Budget approved; forecast inside it.",
    ],
  },
  {
    id: "procure", n: 5, name: "Long-lead procurement",
    goal: "Order everything whose delivery date, not the site, decides the handover date.",
    weeks: [10, 18],
    categories: [],
    purchases: true,
    alsoTouches: ["stone", "wardrobe", "kitchen", "bespoke-furniture", "elevator", "av", "sanitaryware", "doors", "loose-furniture"],
    clears: "ordered",
    trap: "Ordering long-lead goods after site work starts. A twelve-week kitchen ordered in week twenty is a twelve-week delay, not a twelve-week lead time.",
    steps: [
      { title: "Order everything at eight weeks or longer, now", critical: true, detail: "Stone, wardrobes, kitchen, bespoke furniture, the lift, AV, sanitaryware, doors. These set the programme." },
      { title: "Confirm every order against a site measurement", critical: true, detail: "Made-to-measure goods cut to a plan dimension are scrap. The room must be surveyed before the order goes out." },
      { title: "Get a dated delivery commitment in writing", detail: "A lead time is an estimate. A committed delivery date with a penalty is a date." },
      { title: "Arrange dry, lockable storage on site", critical: true, detail: "Marble, veneer and shutters delivered early need somewhere dry. Monsoon damage is not covered by most vendors." },
      { title: "Inspect on delivery, before signing", critical: true, detail: "Photograph and check against the specification at the gate. Damage found after the lorry leaves is your damage." },
    ],
    exit: [
      "Every item at eight weeks or longer is ordered with a committed date.",
      "Advances paid and recorded against each order.",
      "Storage arranged and secured.",
    ],
  },
  {
    id: "enabling", n: 6, name: "Site enabling & civil",
    goal: "Get the shell into the shape the design assumed, and make the mess before anything clean goes in.",
    weeks: [14, 20],
    categories: ["civil", "waterproofing", "safety"],
    clears: "installed",
    trap: "Waterproofing rushed to keep the programme. It is the single most common source of villa disputes and it cannot be fixed from above afterwards.",
    steps: [
      { title: "Set up the site", detail: "Protection to floors, lift and stairs, a store, power, water, waste route, and safety kit. Cheaper than the damage it prevents." },
      { title: "Civil modifications", critical: true, detail: "Wall removals, new openings, niches, sunken slabs. With the structural consultant's written approval, never without." },
      { title: "Anti-termite treatment", critical: true, detail: "Pre-treatment before flooring. Retro-fitting after joinery is installed costs several times as much and works less well." },
      { title: "Waterproof every wet area and the terrace", critical: true, detail: "Bathrooms, balconies, utility, terrace. Named contractor, stated warranty, and a 48-hour flood test signed off before anything is laid over it." },
      { title: "Plaster and make good", detail: "Level, plumb, square. Everything laid over bad plaster looks like bad plaster." },
    ],
    exit: [
      "Structural work signed off.",
      "Flood test passed and waterproofing warranty issued in writing.",
      "Surfaces true enough for the finishes that follow.",
    ],
  },
  {
    id: "firstfix", n: 7, name: "MEP first fix",
    goal: "Every wire, pipe, duct and drain in place and tested while the walls are still open.",
    weeks: [18, 24],
    categories: ["electrical", "plumbing", "hvac", "networking", "security", "automation", "water", "power-backup"],
    clears: "installed",
    trap: "Closing a ceiling over an untested AC condensate line. The stain appears on the new paint in the first monsoon.",
    steps: [
      { title: "Electrical first fix", critical: true, detail: "Conduit, wiring, boxes, DB and load balancing against the sanctioned load. Every point from the approved electrical drawing, nothing improvised on site." },
      { title: "Plumbing first fix", critical: true, detail: "Concealed supply and waste, diverter bodies, shower mixers, flush tanks. Set to the exact tile thickness, which means the tile must already be chosen." },
      { title: "HVAC, ducting and condensate", critical: true, detail: "Indoor unit positions, refrigerant lines, and a condensate route with fall that does not depend on a pump if it can be helped." },
      { title: "Data, AV and automation cabling", detail: "Cat6 to every room across three slabs, speaker runs, control wiring. Retro-fitting a cable through a finished ceiling is a demolition job." },
      { title: "Pressure-test and record everything", critical: true, detail: "Water pressure test, insulation resistance, condensate fall. Photograph every wall and ceiling before it is closed, with a scale in shot." },
    ],
    exit: [
      "All services tested and results recorded.",
      "As-installed photographs taken of every wall and ceiling before closing.",
      "No point outstanding from the approved drawings.",
    ],
  },
  {
    id: "finishes", n: 8, name: "Ceilings, flooring & finishes",
    goal: "Close the building up and lay the surfaces, in the order that protects them.",
    weeks: [22, 30],
    categories: ["ceiling", "flooring", "stone", "paint", "wall-finish", "glass", "windows", "facade"],
    clears: "installed",
    trap: "Painting before the joinery is in, then painting again. Sequence the messy work so the clean work happens once.",
    steps: [
      { title: "False ceilings", critical: true, detail: "Only after every service above them is tested and signed off. Access panels at every serviceable point — valve, damper, driver, junction box." },
      { title: "Flooring and stone", critical: true, detail: "Laid to the agreed pattern with the slabs numbered at the yard. Protect it the hour it is laid; the floor is the thing everything else is dropped on." },
      { title: "Wall finishes and panelling", detail: "Veneer, cladding, wallpaper, texture. Substrate must be dry — moisture-test before anything is stuck to a wall." },
      { title: "First coat of paint", detail: "Primer and first coat before joinery so the wall behind the wardrobe is finished. Final coat comes after second fix." },
      { title: "Glass, mirrors and shower enclosures", detail: "Measured after the tiling, never before. Templated on site." },
    ],
    exit: [
      "Ceilings closed with access panels where they are needed.",
      "Floors laid, grouted, sealed and protected.",
      "Surfaces ready to receive joinery.",
    ],
  },
  {
    id: "joinery", n: 9, name: "Joinery & fixed installation",
    goal: "Install everything made to measure, against the surfaces it was measured from.",
    weeks: [28, 36],
    categories: ["wardrobe", "kitchen", "carpentry", "bespoke-furniture", "bathroom", "doors", "staircase"],
    clears: "installed",
    trap: "Fitting wardrobes before the floor is laid. The shutters then foul the new skirting and the whole run has to come down.",
    steps: [
      { title: "Re-measure before each installation", critical: true, detail: "The finished floor and the finished wall have moved the opening. Check before the van is loaded, not after." },
      { title: "Wardrobes and storage", detail: "Carcass, shutters, internals, loft access, soft-close throughout. Check every shutter swings clear of every other." },
      { title: "Kitchen and utility", critical: true, detail: "Carcass, worktop templated on site after the carcass is level, splashback, appliance cut-outs to the actual appliance, not the brochure." },
      { title: "Doors, frames and hardware", detail: "Handles, hinges, locks, stoppers, and the floor clearance checked against the finished floor plus any rug." },
      { title: "Bathroom vanities and mirrors", detail: "Installed after the tiling, against the concealed plumbing set in first fix." },
    ],
    exit: [
      "All fixed joinery installed, levelled and adjusted.",
      "Every shutter, drawer and door operates cleanly.",
      "Damage from installation made good.",
    ],
  },
  {
    id: "secondfix", n: 10, name: "Second fix & commissioning",
    goal: "Fit everything that plugs in, screws on or switches, and prove all of it works.",
    weeks: [34, 40],
    categories: ["lighting", "sanitaryware", "fans", "appliances", "av", "elevator", "hardware"],
    clears: "inspected",
    trap: "Treating commissioning as a formality. An untested system is an unknown system, and the handover is the last moment anybody else will fix it for free.",
    steps: [
      { title: "Light fittings, switches and sockets", critical: true, detail: "Every fitting on its intended circuit, every switch labelled, dimming and scenes set and demonstrated." },
      { title: "Sanitaryware and CP fittings", detail: "WCs, basins, mixers, showers, health faucets. Every joint run for ten minutes and checked underneath." },
      { title: "Appliances and AV", detail: "Installed, connected, commissioned, and the warranty registered in the owner's name — not the contractor's." },
      { title: "Commission every system", critical: true, detail: "HVAC, water treatment, backup power, automation, network, CCTV, lift. Each tested under load with the result recorded." },
      { title: "Final coat of paint and touch-up", detail: "After everything that could scuff a wall has stopped moving through the house." },
    ],
    exit: [
      "Every system commissioned with a recorded result.",
      "Warranties registered to the owner.",
      "Paintwork final and clean.",
    ],
  },
  {
    id: "styling", n: 11, name: "Furnishing & styling",
    goal: "Move in the things that are not screwed down, and make the house look like the brief.",
    weeks: [38, 43],
    categories: ["loose-furniture", "curtains", "soft-furnishing", "rugs", "art", "accessories", "styling", "landscape"],
    clears: "installed",
    trap: "Ordering curtains before the final floor level is known, so every one of them hangs an inch short.",
    steps: [
      { title: "Curtains and blinds", critical: true, detail: "Measured after the flooring and the pelmet are in. The drop is from the finished track to the finished floor, and nothing else." },
      { title: "Loose furniture", detail: "Delivered in the order rooms are finished, not the order it arrives. Check the lift and stair before the lorry, every single time." },
      { title: "Rugs, art and accessories", detail: "The layer that makes eleven finished rooms look lived in rather than handed over." },
      { title: "Landscape and outdoor", detail: "Planting, irrigation, external lighting, deck oiling. Last, because everything else has been walked through it." },
      { title: "Style and photograph", detail: "Worth a day. It is also the record of how the house was meant to look." },
    ],
    exit: [
      "Every room furnished to the approved layout.",
      "Curtains hanging correctly against the finished floor.",
      "Outdoor complete and irrigation running.",
    ],
  },
  {
    id: "handover", n: 12, name: "Snagging, cleaning & handover",
    goal: "Close every defect, collect every document, and take the house over properly.",
    weeks: [42, 46],
    categories: ["handover", "cleaning"],
    clears: "complete",
    trap: "Releasing retention before the snag list is closed. After the final payment, a snag becomes a favour.",
    steps: [
      { title: "Walk every room against the specification", critical: true, detail: "Lights on, water running, every drawer opened. Photograph and log each defect against its room with an owner and a date." },
      { title: "Close the snags and re-inspect", critical: true, detail: "Fixed is not closed. Somebody has to go back and verify each one, and the app should show it verified." },
      { title: "Deep clean", detail: "Post-construction clean, then a second clean after the snags are closed. Grout haze, paint flecks, glass, ducts." },
      { title: "Collect the handover file", critical: true, detail: "As-installed drawings and photographs, warranties in the owner's name, manuals, paint codes, tile and stone batch numbers, spare tiles, vendor contacts, AMC terms." },
      { title: "Release retention only after sign-off", critical: true, detail: "Retention is the only leverage that survives handover. Hold it until the list is genuinely closed." },
    ],
    exit: [
      "Snag list closed and verified room by room.",
      "Handover file complete and in the owner's hands.",
      "Warranties and AMCs live.",
      "Retention released against a signed sign-off.",
    ],
  },
];

export const PHASE_BY_ID = new Map(PHASES.map((p) => [p.id, p]));

/** The execution phase a trade belongs to. Planning phases own no trade. */
const PHASE_OF_CATEGORY = new Map<Category, string>();
for (const p of PHASES) for (const c of p.categories) if (!PHASE_OF_CATEGORY.has(c)) PHASE_OF_CATEGORY.set(c, p.id);

export function phaseOfCategory(c: Category): Phase | undefined {
  const id = PHASE_OF_CATEGORY.get(c);
  return id ? PHASE_BY_ID.get(id) : undefined;
}

/**
 * Where an item sits: the phase it must pass through next. An item still being
 * decided is in a planning phase whatever its trade; once approved it belongs
 * to the phase of its trade.
 */
export function phaseOfItem(i: ScopeItem): Phase {
  const p = STAGE_PROGRESS[i.stage];
  if (p < STAGE_PROGRESS.idea) return PHASE_BY_ID.get("concept")!;
  if (p < STAGE_PROGRESS.decided) return PHASE_BY_ID.get("design")!;
  if (p < STAGE_PROGRESS.approved) return PHASE_BY_ID.get("budget")!;
  if (p < STAGE_PROGRESS.ordered && supplyOf(i.category) !== "done") return PHASE_BY_ID.get("procure")!;
  return phaseOfCategory(i.category) ?? PHASE_BY_ID.get("secondfix")!;
}

export interface PhaseProgress {
  phase: Phase;
  /** Items whose trade sits in this phase (execution phases only). */
  items: number;
  cleared: number;
  pct: number;
  value: number;
  /** Items sitting in this phase right now and not moving past it. */
  waiting: number;
  /** True once every earlier phase has cleared — safe to start. */
  ready: boolean;
  status: "not-started" | "in-progress" | "complete";
}

export function phaseProgress(s: ProjectState): PhaseProgress[] {
  const live = s.items.filter((i) => i.stage !== "not-applicable");
  const out: PhaseProgress[] = [];
  let priorComplete = true;

  for (const phase of PHASES) {
    const mine = phase.purchases
      ? live.filter((i) => supplyOf(i.category) !== "done")
      : phase.categories.length
        ? live.filter((i) => phaseOfCategory(i.category)?.id === phase.id)
        : live;
    const floor = phase.clears ? STAGE_PROGRESS[phase.clears] : STAGE_PROGRESS.approved;
    const cleared = mine.filter((i) => STAGE_PROGRESS[i.stage] >= floor).length;
    const pct = mine.length ? (cleared / mine.length) * 100 : 0;
    const waiting = live.filter((i) => phaseOfItem(i).id === phase.id).length;
    out.push({
      phase,
      items: mine.length,
      cleared,
      pct,
      value: mine.reduce((a, i) => a + forecastOf(i), 0),
      waiting,
      ready: priorComplete,
      status: mine.length === 0 ? "not-started" : cleared === mine.length ? "complete" : cleared > 0 ? "in-progress" : "not-started",
    });
    priorComplete = priorComplete && (mine.length === 0 || cleared === mine.length);
  }
  return out;
}

/** The phase the project is actually in: the earliest one not yet cleared. */
export function currentPhase(s: ProjectState): PhaseProgress {
  const all = phaseProgress(s);
  return all.find((p) => p.status !== "complete") ?? all[all.length - 1];
}
