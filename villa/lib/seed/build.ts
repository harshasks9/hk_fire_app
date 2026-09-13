import type { ScopeItem, Space, Stage, Category, CostLadder } from "../model/types";
import { seedBuildUp, computeCost, round, areaSqft, perimeterFt, wallAreaSqft } from "../model/costing";
import { SCOPE_TEMPLATES, type TemplateItem } from "./scope-templates";
import { MASTER_SCOPE } from "./master-scope";
import { SPACES } from "./spaces";

/** Deterministic PRNG so the seeded project is identical on every load. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 46);
}

/**
 * How far a given part of the house has got. The villa is mid-flight: the
 * ground floor is being executed, the first floor is in approvals, the second
 * floor and the garden are still being designed. That is what makes the
 * seeded project legible — every stage of the workflow is visible at once.
 */
const FLOOR_MATURITY: Record<string, number> = {
  ground: 0.82,
  first: 0.55,
  second: 0.26,
  outdoor: 0.16,
};

const LADDER_BY_STAGE: Stage[] = [
  "not-started", "idea", "options", "estimated", "discussion", "decided",
  "approved", "boq", "quoted", "ordered", "in-transit", "delivered",
  "installed", "inspected", "complete",
];

/** Pick a plausible stage for an item given how mature its part of the house is. */
function pickStage(seed: string, maturity: number, critical: boolean): Stage {
  const r = rng(seed);
  const roll = r();
  // Critical items run slightly ahead: they are the ones people chase.
  const m = Math.min(0.97, maturity + (critical ? 0.1 : 0));
  // Spread items across the pipeline, centred on the maturity point. The small
  // negative offset matters: it means a genuinely untouched tail exists in the
  // less mature parts of the house, which is what the completeness engine is for.
  const pos = Math.max(0, Math.min(1, m * (0.2 + roll * 1.45) - 0.045));
  const idx = Math.round(pos * (LADDER_BY_STAGE.length - 1));
  // A small tail is deliberately marked Not Applicable, so the audit trail is visible.
  if (r() < 0.035) return "not-applicable";
  return LADDER_BY_STAGE[idx];
}

const STAGE_INDEX = new Map(LADDER_BY_STAGE.map((s, i) => [s, i]));
const reached = (stage: Stage, target: Stage) =>
  stage !== "not-applicable" && (STAGE_INDEX.get(stage) ?? 0) >= (STAGE_INDEX.get(target) ?? 0);

/**
 * The money ladder must never run ahead of the workflow.
 *
 * An item sitting at "options" cannot have been paid for; one that is merely
 * "estimated" cannot carry a vendor quotation. Any figure ahead of the item's
 * actual stage is stripped, so the forecast can never be quietly driven by a
 * number that does not yet exist in the real world.
 */
export function enforceLadderStage(item: ScopeItem): ScopeItem {
  const l = { ...item.ladder };
  if (item.stage === "not-applicable") {
    item.ladder = {};
    return item;
  }
  if (!reached(item.stage, "estimated")) delete l.designerEstimate;
  if (!reached(item.stage, "boq")) delete l.quoted;
  if (!reached(item.stage, "approved")) delete l.approved;
  if (!reached(item.stage, "ordered")) { delete l.committed; delete l.paid; }
  item.ladder = l;
  return item;
}

/**
 * Fill in the money ladder consistently with how far the item has travelled.
 * Each step drifts a little from the last, the way real projects do: the
 * designer's number beats the planning allowance, the quote beats the
 * designer, and the negotiated price lands a little under the quote.
 */
function buildLadder(seed: string, computed: number, stage: Stage): CostLadder {
  const r = rng(seed + ":money");
  const l: CostLadder = {};
  if (stage === "not-applicable") return l;
  if (stage === "not-started") {
    // Roughly two-thirds of untouched items still carry a planning allowance.
    if (r() < 0.65) l.initialEstimate = round(computed * (0.88 + r() * 0.2), -2);
    return l;
  }
  l.initialEstimate = round(computed * (0.86 + r() * 0.18), -2);
  if (reached(stage, "estimated")) l.designerEstimate = round(computed * (0.95 + r() * 0.16), -2);
  if (reached(stage, "quoted") || reached(stage, "boq")) {
    l.quoted = round((l.designerEstimate ?? computed) * (0.98 + r() * 0.18), -2);
  }
  if (reached(stage, "approved")) {
    l.approved = round((l.quoted ?? l.designerEstimate ?? computed) * (0.93 + r() * 0.09), -2);
  }
  if (reached(stage, "ordered")) l.committed = l.approved ?? round(computed, -2);
  if (reached(stage, "ordered")) {
    const adv = reached(stage, "delivered") ? 0.6 + r() * 0.4 : 0.3 + r() * 0.25;
    l.paid = round((l.committed ?? 0) * adv, -2);
  }
  if (reached(stage, "complete")) l.paid = l.committed;
  return l;
}

const PROC_BY_STAGE: Record<string, string> = {
  "not-started": "to-select",
  idea: "to-select",
  options: "to-select",
  estimated: "selected",
  discussion: "selected",
  decided: "selected",
  approved: "approved",
  boq: "approved",
  quoted: "quote-requested",
  ordered: "ordered",
  "in-transit": "in-transit",
  delivered: "delivered",
  installed: "installed",
  inspected: "verified",
  complete: "verified",
};

/** Lead times that actually matter on an Indian villa fit-out. */
const LEAD_WEEKS: Partial<Record<Category, number>> = {
  stone: 9, wardrobe: 10, kitchen: 12, "bespoke-furniture": 10, carpentry: 8,
  "loose-furniture": 9, sanitaryware: 8, lighting: 7, curtains: 6, glass: 4,
  av: 10, elevator: 14, automation: 8, appliances: 6, doors: 8, hvac: 4,
};

const PURCHASABLE: Category[] = [
  "sanitaryware", "lighting", "loose-furniture", "bespoke-furniture", "appliances",
  "av", "curtains", "rugs", "art", "accessories", "fans", "hvac", "kitchen",
  "wardrobe", "stone", "flooring", "doors", "glass", "automation", "security",
  "networking", "elevator", "water", "power-backup",
];

function qtyFor(t: TemplateItem, space: Space | undefined, ceiling: number): number {
  if (t.qty !== undefined) return t.qty;
  if (!space?.dims) return 1;
  switch (t.basis) {
    case "floor-area": return areaSqft(space.dims) ?? 1;
    case "wall-area": return wallAreaSqft(space.dims, ceiling) ?? 1;
    case "perimeter": return perimeterFt(space.dims) ?? 1;
    default: return 1;
  }
}

export function buildItems(): ScopeItem[] {
  const items: ScopeItem[] = [];

  /* ------------------------------------------------ room scope from templates */
  for (const space of SPACES) {
    const template = SCOPE_TEMPLATES[space.kind] ?? [];
    const maturity = FLOOR_MATURITY[space.floor] ?? 0.4;
    const ceiling = space.ceilingHeightFt ?? 10;

    template.forEach((t, n) => {
      const id = `${space.id}--${slug(t.title)}-${n}`;
      const qty = qtyFor(t, space, ceiling);
      const cost = seedBuildUp(t.category, space, qty, ceiling);
      if (t.unit) cost.unit = t.unit;
      const computed = computeCost(cost).total;
      const stage = pickStage(id, maturity, !!t.critical);
      const lead = LEAD_WEEKS[t.category];
      const item: ScopeItem = {
        id,
        title: t.title,
        spaceId: space.id,
        category: t.category,
        stage,
        spec: t.spec,
        cost,
        ladder: buildLadder(id, computed, stage),
        seeded: true,
        tags: t.critical ? ["critical"] : [],
        naReason: stage === "not-applicable" ? "Not required in this space — reviewed and excluded." : undefined,
      };
      if (PURCHASABLE.includes(t.category)) {
        item.procurement = {
          scopeItemId: id,
          status: (PROC_BY_STAGE[stage] ?? "to-select") as never,
          qty: t.basis === "count" ? qty : undefined,
          leadTimeWeeks: lead,
          orderAmount: item.ladder.committed,
        };
      }
      items.push(item);
    });
  }

  /* --------------------------------------------------------- house-wide scope */
  MASTER_SCOPE.forEach((m, n) => {
    const id = `house--${slug(m.title)}-${n}`;
    const cost = seedBuildUp(m.category, undefined, m.qty ?? 1);
    if (m.unit) cost.unit = m.unit;
    // House-wide lump sums are a scale above a single room's line.
    if (cost.unit === "ls") cost.rate = Math.max(cost.rate, 120000);
    const computed = computeCost(cost).total;
    const stage = pickStage(id, 0.5, !!m.critical);
    items.push({
      id,
      title: m.title,
      category: m.category,
      stage,
      spec: m.spec,
      cost,
      ladder: buildLadder(id, computed, stage),
      seeded: true,
      tags: [...(m.critical ? ["critical"] : []), ...(m.added ? ["beyond-brief"] : [])],
      naReason: stage === "not-applicable" ? "Reviewed and excluded from this project." : undefined,
    });
  });

  return items;
}
