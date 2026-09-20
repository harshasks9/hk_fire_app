import type { CostBuildUp, Category, Unit, Dimensions, Space } from "./types";

/**
 * Costing.
 *
 * Two rules govern this file.
 *
 *  1. Every number is a build-up of named, editable parts. There is no opaque
 *     "cost" field anywhere — a rate is always `qty x rate` plus adders you can
 *     see and change.
 *  2. Defaults are *assumptions*, not quotes. `DEFAULT_RATES` are indicative
 *     Hyderabad ballparks for a premium villa fit-out, carried so the app is not
 *     a blank page. The UI must always render them as editable assumptions and
 *     never as market pricing.
 */

/**
 * Geometry lives in `./measure` — one module owns every number with a unit, so
 * a room reads the same on the plan, the card, the sheet and the BOQ. These
 * re-exports keep costing a single import for the screens that price off area.
 */
export {
  MM_PER_FT,
  SQM_PER_SQFT,
  OPENING_ALLOWANCE_PCT,
  DEFAULT_CEILING_FT,
  dimsToFeet,
  measure,
  measureSpace,
  measureLine,
  measureShort,
  areaSqft,
  perimeterFt,
  wallAreaSqft,
  dimsLabel,
  ftIn,
  round,
  NOT_DIMENSIONED,
  SOURCE_LABEL,
} from "./measure";

import { areaSqft, perimeterFt, wallAreaSqft, round } from "./measure";

export const FT_PER_M = 3.28084;

/* -------------------------------------------------------------- the build-up */

export interface CostBreakdown {
  base: number;
  wastage: number;
  labour: number;
  installation: number;
  freight: number;
  tax: number;
  other: number;
  total: number;
}

/**
 * base      = qty x rate
 * wastage   = base x wastage%              (material over-order: tiles, stone, fabric)
 * labour    = qty x labourRate + labourLumpSum
 * install   = (base + wastage) x install%
 * freight   = flat
 * tax       = (everything so far) x tax%
 * other     = flat
 */
export function computeCost(c: CostBuildUp): CostBreakdown {
  const base = (c.qty || 0) * (c.rate || 0);
  const wastage = base * ((c.wastagePct || 0) / 100);
  const labour = (c.qty || 0) * (c.labourRate || 0) + (c.labourLumpSum || 0);
  const installation = (base + wastage) * ((c.installationPct || 0) / 100);
  const freight = c.freight || 0;
  const preTax = base + wastage + labour + installation + freight;
  const tax = preTax * ((c.taxPct || 0) / 100);
  const other = c.otherCharges || 0;
  return {
    base: round(base),
    wastage: round(wastage),
    labour: round(labour),
    installation: round(installation),
    freight: round(freight),
    tax: round(tax),
    other: round(other),
    total: round(preTax + tax + other),
  };
}

/* ------------------------------------------------------------ default rates */

export interface RateDefault {
  unit: Unit;
  /** Indicative supply rate. Editable everywhere it is used. */
  rate: number;
  wastagePct?: number;
  labourRate?: number;
  installationPct?: number;
  freight?: number;
  taxPct?: number;
  /** What the rate is taken to include, shown as a tooltip. */
  assumption: string;
  /** How to derive the default quantity from a room, when we can. */
  basis?: "floor-area" | "wall-area" | "perimeter" | "count" | "manual";
}

/**
 * Indicative Hyderabad rates, mid-2026, premium residential fit-out.
 * These are STARTING ASSUMPTIONS the homeowner and designer are expected to
 * overwrite with real quotes. They are never presented as quotations.
 */
export const DEFAULT_RATES: Partial<Record<Category, RateDefault>> = {
  flooring: {
    unit: "sqft",
    rate: 180,
    wastagePct: 8,
    labourRate: 55,
    taxPct: 18,
    basis: "floor-area",
    assumption: "Vitrified tile supply; adhesive and skirting costed separately.",
  },
  stone: {
    unit: "sqft",
    rate: 420,
    wastagePct: 12,
    labourRate: 120,
    taxPct: 18,
    basis: "floor-area",
    assumption: "Imported marble slab, unpolished rate; edge polishing extra.",
  },
  ceiling: {
    unit: "sqft",
    rate: 95,
    wastagePct: 5,
    labourRate: 45,
    taxPct: 18,
    basis: "floor-area",
    assumption: "Gypsum board on GI framing, single level; cove and profile lighting extra.",
  },
  paint: {
    unit: "sqft",
    rate: 24,
    wastagePct: 5,
    labourRate: 18,
    taxPct: 18,
    basis: "wall-area",
    assumption: "Two coats premium emulsion over putty and primer on wall area net of openings.",
  },
  "wall-finish": {
    unit: "sqft",
    rate: 260,
    wastagePct: 10,
    installationPct: 20,
    taxPct: 18,
    basis: "manual",
    assumption: "Decorative panelling / textured finish; substrate preparation included.",
  },
  wardrobe: {
    unit: "sqft",
    rate: 1650,
    installationPct: 8,
    taxPct: 18,
    basis: "manual",
    assumption: "Per sq ft of wardrobe shutter face. BWP ply carcass, laminate shutter, soft-close.",
  },
  kitchen: {
    unit: "rft",
    rate: 3200,
    installationPct: 10,
    taxPct: 18,
    basis: "manual",
    assumption: "Per running foot of base unit. Marine ply carcass, acrylic shutter, basic hardware.",
  },
  carpentry: {
    unit: "sqft",
    rate: 1400,
    installationPct: 10,
    taxPct: 18,
    basis: "manual",
    assumption: "Site carpentry, per sq ft of finished face. Veneer and polish extra.",
  },
  "bespoke-furniture": {
    unit: "nos",
    rate: 45000,
    taxPct: 18,
    basis: "count",
    assumption: "Made-to-order piece from a joinery drawing; upholstery costed in fabric.",
  },
  "loose-furniture": {
    unit: "nos",
    rate: 38000,
    freight: 2500,
    taxPct: 18,
    basis: "count",
    assumption: "Retail loose piece, delivered. Model-specific once selected.",
  },
  lighting: {
    unit: "nos",
    rate: 3200,
    labourRate: 250,
    taxPct: 18,
    basis: "count",
    assumption: "Per decorative or architectural fixture, supply and fix. Driver included.",
  },
  electrical: {
    unit: "nos",
    rate: 1150,
    labourRate: 380,
    taxPct: 18,
    basis: "count",
    assumption: "Per point — conduit, wire, modular plate. Distribution board separate.",
  },
  plumbing: {
    unit: "nos",
    rate: 4200,
    labourRate: 900,
    taxPct: 18,
    basis: "count",
    assumption: "Per plumbing point, concealed CPVC/UPVC. Fixture cost separate.",
  },
  sanitaryware: {
    unit: "set",
    rate: 78000,
    installationPct: 12,
    taxPct: 18,
    basis: "count",
    assumption: "Per bathroom set: WC, basin, mixer set, shower, health faucet. Mid-premium brand.",
  },
  hvac: {
    unit: "nos",
    rate: 62000,
    installationPct: 14,
    taxPct: 18,
    basis: "count",
    assumption: "Per 1.5 ton inverter hi-wall split, supply and install, standard copper run.",
  },
  fans: {
    unit: "nos",
    rate: 9500,
    labourRate: 400,
    taxPct: 18,
    basis: "count",
    assumption: "Designer BLDC ceiling fan with remote.",
  },
  curtains: {
    unit: "rft",
    rate: 1450,
    wastagePct: 10,
    installationPct: 10,
    taxPct: 18,
    basis: "manual",
    assumption: "Per running foot of track: sheer + blackout, pelmet and track included.",
  },
  automation: {
    unit: "nos",
    rate: 7800,
    installationPct: 12,
    taxPct: 18,
    basis: "count",
    assumption: "Per automated circuit / device node including hub share.",
  },
  waterproofing: {
    unit: "sqft",
    rate: 110,
    labourRate: 40,
    taxPct: 18,
    basis: "floor-area",
    assumption: "Two-coat polymer membrane with 300 mm upstand; warranty terms vary by applicator.",
  },
  landscape: {
    unit: "sqft",
    rate: 320,
    taxPct: 18,
    basis: "floor-area",
    assumption: "Soft landscaping with soil bed preparation; hardscape and irrigation separate.",
  },
  av: {
    unit: "ls",
    rate: 0,
    taxPct: 18,
    basis: "manual",
    assumption: "System-level lump sum from the AV consultant's design.",
  },
  appliances: {
    unit: "nos",
    rate: 55000,
    taxPct: 18,
    basis: "count",
    assumption: "Per appliance, model-specific once selected.",
  },
  doors: {
    unit: "nos",
    rate: 32000,
    installationPct: 10,
    taxPct: 18,
    basis: "count",
    assumption: "Per door: engineered shutter, frame, hardware, finish.",
  },
  glass: {
    unit: "sqft",
    rate: 620,
    wastagePct: 8,
    installationPct: 15,
    taxPct: 18,
    basis: "manual",
    assumption: "12 mm toughened, cut to size, with standard fittings.",
  },
};

/** A room-shaped default quantity, used to pre-fill a build-up. */
export function defaultQtyFor(
  category: Category,
  space: Space | undefined,
  ceilingHeightFt = 10,
): number | undefined {
  const def = DEFAULT_RATES[category];
  if (!def || !space?.dims) return undefined;
  switch (def.basis) {
    case "floor-area":
      return areaSqft(space.dims);
    case "wall-area":
      return wallAreaSqft(space.dims, ceilingHeightFt);
    case "perimeter":
      return perimeterFt(space.dims);
    default:
      return undefined;
  }
}

/** Build a starting cost build-up for a category in a room. */
export function seedBuildUp(category: Category, space?: Space, qtyOverride?: number, ceilingHeightFt = 10): CostBuildUp {
  const def = DEFAULT_RATES[category];
  const qty = qtyOverride ?? defaultQtyFor(category, space, ceilingHeightFt) ?? 1;
  return {
    qty: round(qty, 1),
    unit: def?.unit ?? "ls",
    rate: def?.rate ?? 0,
    wastagePct: def?.wastagePct,
    labourRate: def?.labourRate,
    installationPct: def?.installationPct,
    freight: def?.freight,
    taxPct: def?.taxPct ?? 18,
    assumption: def?.assumption,
  };
}

/* ----------------------------------------------------------------- currency */

/** Indian numbering: 1,23,45,678. */
export function inr(n: number | undefined, opts: { compact?: boolean; blank?: string } = {}): string {
  if (n === undefined || n === null || Number.isNaN(n)) return opts.blank ?? "—";
  const neg = n < 0;
  const v = Math.abs(Math.round(n));
  if (opts.compact) {
    if (v >= 1e7) return `${neg ? "-" : ""}₹${trimZeros(v / 1e7)} Cr`;
    if (v >= 1e5) return `${neg ? "-" : ""}₹${trimZeros(v / 1e5)} L`;
    if (v >= 1e3) return `${neg ? "-" : ""}₹${trimZeros(v / 1e3)}k`;
    return `${neg ? "-" : ""}₹${v}`;
  }
  const s = String(v);
  if (s.length <= 3) return `${neg ? "-" : ""}₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}₹${grouped},${last3}`;
}

function trimZeros(n: number): string {
  const r = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
  return r.replace(/\.?0+$/, "");
}
