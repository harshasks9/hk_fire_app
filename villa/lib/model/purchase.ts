import type { Category, ProjectState, ScopeItem, Space, Unit } from "./types";
import { STAGE_PROGRESS, STAGE_LABEL } from "./types";
import { forecastOf } from "./derive";
import { catDef, catLabel, LEAD_WEEKS } from "./categories";

/**
 * The purchase list.
 *
 * A fit-out programme mixes three kinds of work and they behave completely
 * differently, so the app keeps them apart:
 *
 *  - **Bought.** Goods that arrive in a lorry against a purchase order. They
 *    have a supplier, a lead time, an advance, a delivery date and a risk of
 *    arriving damaged. These are what you shop for.
 *  - **Made.** Things fabricated to this villa's dimensions — wardrobes, the
 *    kitchen, bespoke furniture. Also ordered, also long-lead, but they cannot
 *    be ordered until the room has been measured on site.
 *  - **Done.** Labour and site work — plaster, paint, waterproofing, wiring.
 *    There is nothing to buy; there is a contractor to book.
 *
 * The list below is the shopping list: bought and made, never labour. It is
 * separate from the BOQ on purpose. The BOQ is what the project costs; this is
 * what somebody has to go and order, in what order, by when.
 */

export type Supply = "bought" | "made" | "done";

export const SUPPLY_LABEL: Record<Supply, string> = {
  bought: "Bought in",
  made: "Made to measure",
  done: "Site work",
};

export const SUPPLY_BLURB: Record<Supply, string> = {
  bought: "Ordered from a supplier and delivered. Has a lead time, an advance and a delivery date.",
  made: "Fabricated to this villa's dimensions. Cannot be ordered until the room is measured on site.",
  done: "Labour and site work. Nothing to purchase — a contractor to book and a date to hold.",
};

/** How each trade is procured. The one place this judgement is recorded. */
export const SUPPLY: Record<string, Supply> = {
  /* bought in */
  stone: "bought", flooring: "bought", glass: "bought", hardware: "bought",
  sanitaryware: "bought", "loose-furniture": "bought", lighting: "bought",
  fans: "bought", appliances: "bought", av: "bought", automation: "bought",
  networking: "bought", security: "bought", elevator: "bought",
  "power-backup": "bought", water: "bought", curtains: "bought", rugs: "bought",
  art: "bought", accessories: "bought", "soft-furnishing": "bought",
  windows: "bought", hvac: "bought", safety: "bought",
  /* made to measure */
  wardrobe: "made", kitchen: "made", carpentry: "made", "bespoke-furniture": "made",
  bathroom: "made", doors: "made", staircase: "made",
  /* site work */
  civil: "done", waterproofing: "done", ceiling: "done", paint: "done",
  "wall-finish": "done", electrical: "done", plumbing: "done", landscape: "done",
  facade: "done", styling: "done", cleaning: "done", handover: "done",
};

export function supplyOf(category: Category): Supply {
  return SUPPLY[category] ?? "bought";
}

/** True for anything that has to be ordered from somebody — bought or made. */
export function isBought(category: Category): boolean {
  return supplyOf(category) !== "done";
}

/* ----------------------------------------------------------------- a line */

export type BuyStatus =
  | "undecided"   // nothing chosen yet — cannot be ordered
  | "to-order"    // decided and approved, waiting for a purchase order
  | "ordered"
  | "in-transit"
  | "delivered"
  | "installed";

export const BUY_STATUS_LABEL: Record<BuyStatus, string> = {
  undecided: "Not yet decided", "to-order": "Ready to order", ordered: "Ordered",
  "in-transit": "In transit", delivered: "Delivered", installed: "Installed",
};

export const BUY_STATUS_TONE: Record<BuyStatus, "accent" | "warn" | "info" | "good" | "neutral"> = {
  undecided: "accent", "to-order": "warn", ordered: "info",
  "in-transit": "info", delivered: "good", installed: "good",
};

export interface PurchaseLine {
  itemId: string;
  title: string;
  category: Category;
  categoryLabel: string;
  supply: Supply;
  spaceId?: string;
  where: string;
  floor: Space["floor"] | "house";
  product?: string;
  brand?: string;
  spec?: string;
  qty: number;
  unit: Unit;
  rate?: number;
  /** Money this line is expected to cost, from the same ladder as everywhere. */
  value: number;
  vendorId?: string;
  vendor?: string;
  leadWeeks: number;
  longLead: boolean;
  status: BuyStatus;
  stageLabel: string;
  orderedOn?: string;
  expectedDelivery?: string;
  /** Last date this can be ordered and still land for its target date. */
  orderBy?: string;
  /** Days late against orderBy. Positive means overdue. */
  overdueDays?: number;
  /** Blocking it: what has to happen before a purchase order can go out. */
  blockedBy?: string;
}

/** Anything at or beyond this many weeks drives the programme, not the reverse. */
export const LONG_LEAD_WEEKS = 8;

function statusOf(i: ScopeItem): BuyStatus {
  const p = STAGE_PROGRESS[i.stage];
  const ps = i.procurement?.status;
  if (i.stage === "installed" || i.stage === "inspected" || i.stage === "complete" || ps === "installed" || ps === "verified") return "installed";
  if (i.stage === "delivered" || ps === "delivered") return "delivered";
  if (i.stage === "in-transit" || ps === "in-transit") return "in-transit";
  if (i.stage === "ordered" || ps === "ordered" || i.procurement?.orderedOn) return "ordered";
  if (p >= STAGE_PROGRESS.approved) return "to-order";
  return "undecided";
}

function blockedBy(i: ScopeItem, sp?: Space): string | undefined {
  const p = STAGE_PROGRESS[i.stage];
  if (p >= STAGE_PROGRESS.ordered) return undefined;
  if (p < STAGE_PROGRESS.decided) return "no choice made yet";
  if (p < STAGE_PROGRESS.approved) return "decided but not approved";
  if (supplyOf(i.category) === "made" && sp && sp.dims?.source !== "site-measured") {
    return "room not measured on site — cannot cut to a plan dimension";
  }
  if (!i.vendorId) return "no supplier named";
  return undefined;
}

function addWeeks(iso: string, weeks: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Every line somebody has to go and order, newest risk first.
 * Labour-only trades are excluded by construction — that is the whole point.
 */
export function purchaseList(s: ProjectState, today = new Date()): PurchaseLine[] {
  const spaceById = new Map(s.spaces.map((x) => [x.id, x]));
  const vendorById = new Map(s.vendors.map((v) => [v.id, v.name]));

  const lines = s.items
    .filter((i) => i.stage !== "not-applicable" && isBought(i.category))
    .map((i): PurchaseLine => {
      const sp = i.spaceId ? spaceById.get(i.spaceId) : undefined;
      const def = catDef(s, i.category);
      const lead = i.procurement?.leadTimeWeeks ?? def?.leadTimeWeeks ?? LEAD_WEEKS[i.category] ?? 3;
      const target = i.procurement?.installationDate ?? i.targetDate;
      const orderBy = target ? addWeeks(target, lead) : undefined;
      const status = statusOf(i);
      const overdueDays =
        orderBy && status === "undecided" || orderBy && status === "to-order"
          ? Math.round((today.getTime() - new Date(orderBy).getTime()) / 86400000)
          : undefined;
      return {
        itemId: i.id,
        title: i.title,
        category: i.category,
        categoryLabel: catLabel(s, i.category),
        supply: supplyOf(i.category),
        spaceId: i.spaceId,
        where: sp?.name ?? "House-wide",
        floor: sp?.floor ?? "house",
        product: i.procurement?.product,
        brand: i.procurement?.brand,
        spec: i.spec,
        qty: i.procurement?.qty ?? i.cost.qty ?? 1,
        unit: i.cost.unit,
        rate: i.cost.rate,
        value: i.procurement?.orderAmount ?? forecastOf(i),
        vendorId: i.vendorId ?? i.procurement?.vendorId,
        vendor: vendorById.get(i.vendorId ?? i.procurement?.vendorId ?? ""),
        leadWeeks: lead,
        longLead: lead >= LONG_LEAD_WEEKS,
        status,
        stageLabel: STAGE_LABEL[i.stage],
        orderedOn: i.procurement?.orderedOn,
        expectedDelivery: i.procurement?.expectedDelivery,
        orderBy,
        overdueDays: overdueDays !== undefined && overdueDays > 0 ? overdueDays : undefined,
        blockedBy: blockedBy(i, sp),
      };
    });

  /* Risk first: overdue, then long-lead not yet ordered, then by value. */
  const rank = (l: PurchaseLine) =>
    l.overdueDays ? 0 : l.longLead && (l.status === "undecided" || l.status === "to-order") ? 1 : l.status === "to-order" ? 2 : 3;
  return lines.sort((a, b) => rank(a) - rank(b) || b.value - a.value);
}

export interface PurchaseTotals {
  lines: number;
  value: number;
  toOrder: number;
  toOrderValue: number;
  undecided: number;
  ordered: number;
  delivered: number;
  longLead: number;
  longLeadUnordered: number;
  overdue: number;
  committed: number;
}

export function purchaseTotals(lines: PurchaseLine[]): PurchaseTotals {
  const n = (f: (l: PurchaseLine) => boolean) => lines.filter(f).length;
  return {
    lines: lines.length,
    value: lines.reduce((a, l) => a + l.value, 0),
    toOrder: n((l) => l.status === "to-order"),
    toOrderValue: lines.filter((l) => l.status === "to-order").reduce((a, l) => a + l.value, 0),
    undecided: n((l) => l.status === "undecided"),
    ordered: n((l) => l.status === "ordered" || l.status === "in-transit"),
    delivered: n((l) => l.status === "delivered" || l.status === "installed"),
    longLead: n((l) => l.longLead),
    longLeadUnordered: n((l) => l.longLead && (l.status === "undecided" || l.status === "to-order")),
    overdue: n((l) => !!l.overdueDays),
    committed: lines.filter((l) => l.status !== "undecided" && l.status !== "to-order").reduce((a, l) => a + l.value, 0),
  };
}

/** Grouped for the page, in the order somebody would actually shop. */
export function groupPurchases(
  lines: PurchaseLine[],
  by: "category" | "room" | "supplier" | "status",
): { key: string; label: string; lines: PurchaseLine[]; value: number }[] {
  const map = new Map<string, { label: string; lines: PurchaseLine[] }>();
  for (const l of lines) {
    const [key, label] =
      by === "category" ? [l.category, l.categoryLabel]
      : by === "room" ? [l.spaceId ?? "house", l.where]
      : by === "supplier" ? [l.vendorId ?? "none", l.vendor ?? "No supplier named"]
      : [l.status, BUY_STATUS_LABEL[l.status]];
    const g = map.get(key) ?? { label, lines: [] };
    g.lines.push(l);
    map.set(key, g);
  }
  return [...map.entries()]
    .map(([key, g]) => ({ key, label: g.label, lines: g.lines, value: g.lines.reduce((a, l) => a + l.value, 0) }))
    .sort((a, b) => b.value - a.value);
}

/** The list as a spreadsheet, so it can be sent to whoever is doing the buying. */
export function purchasesToCsv(lines: PurchaseLine[]): string {
  const head = [
    "Item", "Room", "Floor", "Trade", "Supply", "Product", "Brand", "Qty", "Unit",
    "Rate", "Value", "Supplier", "Lead (weeks)", "Order by", "Status", "Ordered on",
    "Expected delivery", "Blocked by", "Specification",
  ];
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = lines.map((l) => [
    l.title, l.where, l.floor, l.categoryLabel, SUPPLY_LABEL[l.supply], l.product, l.brand,
    l.qty, l.unit, l.rate, Math.round(l.value), l.vendor, l.leadWeeks, l.orderBy,
    BUY_STATUS_LABEL[l.status], l.orderedOn, l.expectedDelivery, l.blockedBy, l.spec,
  ]);
  return [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
