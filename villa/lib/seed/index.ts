import type { ProjectState, Scenario, ScopeItem } from "../model/types";
import { SPACES } from "./spaces";
import { buildItems, buildTwinItems, enforceLadderStage } from "./build";
import { buildContent, PEOPLE, VENDORS } from "./content";
import { round } from "../model/costing";
import { BUILTIN_CATEGORIES } from "../model/categories";
import { forecastOf } from "../model/derive";

/**
 * Scenario planning.
 *
 * A scenario is not a separate copy of the project — it is a lens: a set of
 * multipliers and overrides applied over the same scope. That way "what if we
 * did this at ₹2 Cr" never forks the data, and switching back loses nothing.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "sc-practical",
    name: "Practical",
    subtitle: "Everything works, nothing is imported",
    note:
      "Indian brands throughout, laminate instead of veneer, porcelain instead of natural stone outside the foyer, manual curtains, lighting automation limited to the ground floor. Nothing here is a bad decision — it is the version that spends money only where it is used.",
    categoryMultipliers: {
      stone: 0.55, "loose-furniture": 0.72, "bespoke-furniture": 0.7, lighting: 0.62,
      sanitaryware: 0.6, automation: 0.35, av: 0.55, curtains: 0.7, wardrobe: 0.78,
      kitchen: 0.68, art: 0.4, "wall-finish": 0.65, elevator: 0.7, "soft-furnishing": 0.7,
      rugs: 0.55, appliances: 0.7,
    },
    overrides: {},
  },
  {
    id: "sc-premium",
    name: "Premium",
    subtitle: "The brief as designed",
    note:
      "The scheme as currently specified: veneer joinery, natural stone in the foyer and master, a wired automation backbone, decorative lighting and a proper home theatre. This is the baseline every other number on the dashboard is measured against.",
    categoryMultipliers: {},
    overrides: {},
  },
  {
    id: "sc-nocompromise",
    name: "No compromise",
    subtitle: "Imported where it is felt",
    note:
      "Imported CP and ceramics, German kitchen carcass, book-matched marble in the foyer and master bathroom, full Control4 across three floors, motorised curtains throughout, and a properly treated theatre. The honest question this version asks is whether the extra is felt daily or only on the invoice.",
    categoryMultipliers: {
      stone: 1.65, "loose-furniture": 1.5, "bespoke-furniture": 1.45, lighting: 1.7,
      sanitaryware: 1.64, automation: 1.85, av: 1.8, curtains: 1.55, wardrobe: 1.3,
      kitchen: 1.36, art: 2.2, "wall-finish": 1.5, elevator: 1.4, appliances: 1.45,
      "soft-furnishing": 1.5, rugs: 1.8, glass: 1.3, doors: 1.35,
    },
    overrides: {},
  },
];

/** Named A/B comparisons the homeowner is likely to want. Shown in the planner. */
export const TRADE_OFFS: {
  id: string; label: string; question: string;
  a: { label: string; categoryMultipliers: Record<string, number> };
  b: { label: string; categoryMultipliers: Record<string, number> };
  note: string;
}[] = [
  {
    id: "to-stone", label: "Tile vs marble",
    question: "Porcelain tile or natural marble in the foyer, living and master?",
    a: { label: "Porcelain tile", categoryMultipliers: { stone: 0.45 } },
    b: { label: "Natural marble", categoryMultipliers: { stone: 1.0 } },
    note: "Marble is the single biggest swing in the finishes budget. It is also the thing guests notice first and the thing that stains if you are careless with turmeric.",
  },
  {
    id: "to-veneer", label: "Laminate vs veneer",
    question: "Laminate or natural veneer on wardrobes and carpentry?",
    a: { label: "Laminate", categoryMultipliers: { wardrobe: 0.78, carpentry: 0.8, "bespoke-furniture": 0.82 } },
    b: { label: "Veneer + PU polish", categoryMultipliers: { wardrobe: 1.0, carpentry: 1.0, "bespoke-furniture": 1.0 } },
    note: "Laminate is more durable; veneer is more beautiful and can be repolished. The mistake is mixing them within sight of each other.",
  },
  {
    id: "to-cp", label: "Indian vs imported sanitaryware",
    question: "Jaquar throughout, or Grohe/Kohler in the main suites?",
    a: { label: "Indian — Jaquar", categoryMultipliers: { sanitaryware: 1.0 } },
    b: { label: "Imported", categoryMultipliers: { sanitaryware: 1.64 } },
    note: "Eight bathrooms. Imported everywhere is hard to justify; imported in the three you actually use is easy to.",
  },
  {
    id: "to-light", label: "Standard vs premium lighting",
    question: "Project-grade fixtures or specified decorative lighting?",
    a: { label: "Standard", categoryMultipliers: { lighting: 0.62 } },
    b: { label: "Premium", categoryMultipliers: { lighting: 1.0 } },
    note: "Lighting is the cheapest way to change how a room feels and the most expensive thing to redo after the ceiling closes.",
  },
  {
    id: "to-curtain", label: "Manual vs automated curtains",
    question: "Hand-drawn curtains, or motorised tracks?",
    a: { label: "Manual", categoryMultipliers: { curtains: 1.0, automation: 1.0 } },
    b: { label: "Motorised", categoryMultipliers: { curtains: 1.35, automation: 1.25 } },
    note: "Worth it in the master and the double-height foyer, hard to justify in the maid room. This is not an all-or-nothing choice.",
  },
  {
    id: "to-kitchen", label: "Kitchen brand",
    question: "Sleek, Hafele or Nolte?",
    a: { label: "Hafele", categoryMultipliers: { kitchen: 1.0 } },
    b: { label: "Nolte — imported", categoryMultipliers: { kitchen: 1.36 } },
    note: "Nolte is the better kitchen. Its 14-week lead is the reason it may still be the wrong answer.",
  },
  {
    id: "to-auto", label: "Automation system",
    question: "Wireless retrofit, or a wired backbone?",
    a: { label: "Wireless retrofit", categoryMultipliers: { automation: 0.46 } },
    b: { label: "Wired — full house", categoryMultipliers: { automation: 1.0 } },
    note: "The only one of these you cannot defer. The cable either goes in before the ceilings close or it does not go in.",
  },
];

/** Apply a scenario to an item and return its adjusted forecast. */
export function scenarioForecast(item: ScopeItem, scenario?: Scenario): number {
  const base = forecastOf(item);
  if (!scenario) return base;
  const o = scenario.overrides[item.id];
  if (o?.amount !== undefined) return o.amount;
  if (o?.multiplier !== undefined) return round(base * o.multiplier);
  const m = scenario.categoryMultipliers?.[item.category];
  // Money already committed cannot be re-scenarioed away.
  if (item.ladder.committed) return base;
  return m ? round(base * m) : base;
}

export function scenarioTotal(items: ScopeItem[], scenario?: Scenario): number {
  return round(items.reduce((a, i) => a + (i.stage === "not-applicable" ? 0 : scenarioForecast(i, scenario)), 0));
}

/* ------------------------------------------------------------ the project */

export function buildProject(): ProjectState {
  const items = buildItems();
  const content = buildContent(items);
  // Curated content moves items between stages, so re-assert the invariant that
  // no money figure may sit ahead of the stage the item has actually reached.
  items.forEach(enforceLadderStage);

  // The original budget is the round number the owner set at the start. It is
  // deliberately a little under where the project is now heading — which is the
  // normal condition of every fit-out and the whole reason this app exists.
  const forecast = items.reduce((a, i) => a + forecastOf(i), 0);
  const originalBudget = Math.round((forecast * 0.955) / 500000) * 500000;

  return {
    meta: {
      name: "The Villa",
      address: "Villa 14, Hyderabad",
      plotWidthFt: 59,
      plotDepthFt: 65.25,
      startDate: new Date("2026-06-01").toISOString(),
      targetHandover: new Date("2027-02-14").toISOString(),
      originalBudget,
      contingencyPct: 7.5,
      currency: "INR",
      lastOwnerVisit: new Date("2026-09-08").toISOString(),
    },
    categories: BUILTIN_CATEGORIES.map((c) => ({ ...c })),
    people: PEOPLE,
    spaces: SPACES,
    items,
    ideas: content.ideas,
    options: content.options,
    decisions: content.decisions,
    comments: content.comments,
    vendors: VENDORS,
    quotations: content.quotations,
    tasks: content.tasks,
    snags: content.snags,
    notes: content.notes,
    payments: content.payments,
    docs: content.docs,
    siteUpdates: content.siteUpdates,
    scenarios: SCENARIOS,
    activeScenarioId: "sc-premium",
  };
}

/**
 * The empty twin: the villa itself, and nothing that has happened in it.
 *
 * Every room from the drawings with its real dimensions, the category list
 * and rate card, and each room's scope checklist at "not started" with
 * quantities taken from the geometry. No people, no vendors, no ideas,
 * decisions, tasks, money or notes — those are yours to enter. This is what
 * a new project starts as; the sample villa is loaded deliberately.
 */
export function buildTwin(): ProjectState {
  const categories = BUILTIN_CATEGORIES.map((c) => ({ ...c }));
  return {
    meta: {
      name: "The Villa",
      address: "",
      plotWidthFt: 59,
      plotDepthFt: 65.25,
      startDate: new Date().toISOString(),
      targetHandover: new Date(Date.now() + 365 * 86400000).toISOString(),
      originalBudget: 0,
      contingencyPct: 7.5,
      currency: "INR",
      lastOwnerVisit: new Date().toISOString(),
    },
    categories,
    people: [],
    spaces: SPACES.map((s) => ({ ...s })),
    items: buildTwinItems({ categories } as ProjectState),
    ideas: [], options: [], decisions: [], comments: [],
    vendors: [], quotations: [], tasks: [], snags: [], notes: [], payments: [], docs: [], siteUpdates: [],
    scenarios: [],
    activeScenarioId: undefined,
  };
}
