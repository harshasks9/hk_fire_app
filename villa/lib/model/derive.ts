import type {
  ProjectState, ScopeItem, Space, Stage, Category, FloorId, Decision, Task, Snag, Payment,
} from "./types";
import { STAGE_PROGRESS } from "./types";
import { computeCost, round } from "./costing";

/* ------------------------------------------------------------ money per item */

/**
 * The single best estimate of what an item will finally cost.
 * Later, harder numbers always beat earlier, softer ones.
 */
export function forecastOf(item: ScopeItem): number {
  if (item.stage === "not-applicable") return 0;
  const l = item.ladder;
  return (
    l.committed ??
    l.approved ??
    l.quoted ??
    l.designerEstimate ??
    l.initialEstimate ??
    computeCost(item.cost).total
  );
}

/** What the item is currently budgeted at — the last *approved* position. */
export function budgetOf(item: ScopeItem): number {
  if (item.stage === "not-applicable") return 0;
  const l = item.ladder;
  return l.approved ?? l.designerEstimate ?? l.initialEstimate ?? 0;
}

export function paidOf(item: ScopeItem): number {
  return item.ladder.paid ?? 0;
}

export function committedOf(item: ScopeItem): number {
  return item.ladder.committed ?? 0;
}

/** Money on a signed PO that has not yet been paid. */
export function remainingCommitmentOf(item: ScopeItem): number {
  return Math.max(0, committedOf(item) - paidOf(item));
}

/** Forecast money on items nobody has committed to yet. */
export function uncommittedOf(item: ScopeItem): number {
  return committedOf(item) > 0 ? 0 : forecastOf(item);
}

export function varianceOf(item: ScopeItem): number {
  const b = item.ladder.initialEstimate ?? item.ladder.designerEstimate ?? 0;
  return b ? forecastOf(item) - b : 0;
}

/* --------------------------------------------------------------- roll-ups */

export interface Rollup {
  count: number;
  live: number;
  notApplicable: number;
  initialEstimate: number;
  approvedBudget: number;
  committed: number;
  paid: number;
  remainingCommitment: number;
  uncommittedEstimate: number;
  forecast: number;
  variance: number;
  completionPct: number;
  decisionsOutstanding: number;
}

export function rollup(items: ScopeItem[], decisions: Decision[] = []): Rollup {
  const live = items.filter((i) => i.stage !== "not-applicable");
  let initialEstimate = 0, approvedBudget = 0, committed = 0, paid = 0;
  let remainingCommitment = 0, uncommittedEstimate = 0, forecast = 0;
  let weighted = 0, weight = 0;

  for (const i of live) {
    initialEstimate += i.ladder.initialEstimate ?? 0;
    approvedBudget += budgetOf(i);
    committed += committedOf(i);
    paid += paidOf(i);
    remainingCommitment += remainingCommitmentOf(i);
    uncommittedEstimate += uncommittedOf(i);
    const f = forecastOf(i);
    forecast += f;
    // Completion is weighted by money so a ₹12L kitchen counts more than a ₹3k hook.
    const w = Math.max(f, 1);
    weighted += w * STAGE_PROGRESS[i.stage];
    weight += w;
  }

  const ids = new Set(live.map((i) => i.id));
  const decisionsOutstanding = decisions.filter(
    (d) => ids.has(d.scopeItemId) && (d.status === "awaiting-owner" || d.status === "changes-requested"),
  ).length;

  return {
    count: items.length,
    live: live.length,
    notApplicable: items.length - live.length,
    initialEstimate: round(initialEstimate),
    approvedBudget: round(approvedBudget),
    committed: round(committed),
    paid: round(paid),
    remainingCommitment: round(remainingCommitment),
    uncommittedEstimate: round(uncommittedEstimate),
    forecast: round(forecast),
    variance: round(forecast - approvedBudget),
    completionPct: weight ? round((weighted / weight) * 100, 1) : 0,
    decisionsOutstanding,
  };
}

export function itemsForSpace(s: ProjectState, spaceId: string): ScopeItem[] {
  return s.items.filter((i) => i.spaceId === spaceId);
}

export function itemsForFloor(s: ProjectState, floor: FloorId): ScopeItem[] {
  const ids = new Set(s.spaces.filter((sp) => sp.floor === floor).map((sp) => sp.id));
  return s.items.filter((i) => i.spaceId && ids.has(i.spaceId));
}

export function houseWideItems(s: ProjectState): ScopeItem[] {
  return s.items.filter((i) => !i.spaceId);
}

export function byCategory(items: ScopeItem[]): Map<Category, ScopeItem[]> {
  const m = new Map<Category, ScopeItem[]>();
  for (const i of items) {
    const arr = m.get(i.category) ?? [];
    arr.push(i);
    m.set(i.category, arr);
  }
  return m;
}

/* ------------------------------------------------------------ project level */

export interface ProjectFinance extends Rollup {
  originalBudget: number;
  contingency: number;
  contingencyRemaining: number;
  forecastWithContingency: number;
  budgetVariance: number;
  /** Percentage of the original budget already spent. */
  paidPct: number;
}

export function projectFinance(s: ProjectState): ProjectFinance {
  const r = rollup(s.items, s.decisions);
  const contingency = round(s.meta.originalBudget * (s.meta.contingencyPct / 100));
  // Overrun eats the contingency before it eats the budget.
  const overrun = Math.max(0, r.forecast - s.meta.originalBudget);
  return {
    ...r,
    originalBudget: s.meta.originalBudget,
    contingency,
    contingencyRemaining: round(Math.max(0, contingency - overrun)),
    forecastWithContingency: round(r.forecast + Math.max(0, contingency - overrun)),
    budgetVariance: round(r.forecast - s.meta.originalBudget),
    paidPct: s.meta.originalBudget ? round((r.paid / s.meta.originalBudget) * 100, 1) : 0,
  };
}

/* ------------------------------------------------------------ completeness */

export type GapSeverity = "blocker" | "risk" | "gap" | "nudge";

export interface Gap {
  id: string;
  severity: GapSeverity;
  spaceId?: string;
  scopeItemId?: string;
  title: string;
  detail: string;
  /** What the user should do about it. */
  action?: string;
}

/**
 * The completeness engine.
 *
 * Its job is not to report what has been entered — it is to notice what has
 * NOT been thought about. Three passes:
 *   1. Items that are still blank where the room cannot finish without them.
 *   2. Sequencing traps: a downstream trade about to close over an undecided
 *      upstream one (tiles before the diverter body, ceiling before the pelmet).
 *   3. Whole-house systems with no owner.
 */
export function findGaps(s: ProjectState): Gap[] {
  const gaps: Gap[] = [];
  const spaceById = new Map(s.spaces.map((sp) => [sp.id, sp]));
  const nameOf = (id?: string) => (id ? spaceById.get(id)?.name ?? "House-wide" : "House-wide");

  const untouched = (i: ScopeItem) => i.stage === "not-started";
  const undecided = (i: ScopeItem) =>
    ["not-started", "idea", "options", "estimated", "discussion"].includes(i.stage);

  /* --- 1. critical scope with nothing on it ------------------------------ */
  for (const i of s.items) {
    if (i.stage === "not-applicable") continue;
    const critical = i.tags?.includes("critical");
    if (critical && untouched(i)) {
      gaps.push({
        id: `gap-blank-${i.id}`,
        severity: "blocker",
        spaceId: i.spaceId,
        scopeItemId: i.id,
        title: `${nameOf(i.spaceId)} — ${i.title.toLowerCase()} has no selection.`,
        detail: "This is on the critical list for this space and nothing has been proposed against it yet.",
        action: "Add an idea or mark it Not Applicable.",
      });
    }
    if (!critical && untouched(i) && !i.ladder.initialEstimate) {
      gaps.push({
        id: `gap-unbudgeted-${i.id}`,
        severity: "nudge",
        spaceId: i.spaceId,
        scopeItemId: i.id,
        title: `${nameOf(i.spaceId)} — ${i.title.toLowerCase()} is not budgeted.`,
        detail: "No estimate has been put against this item, so it is invisible in the forecast.",
        action: "Put an allowance against it, or mark it Not Applicable.",
      });
    }
  }

  /* --- 2. sequencing traps ---------------------------------------------- */
  const bySpace = new Map<string, ScopeItem[]>();
  for (const i of s.items) {
    if (!i.spaceId) continue;
    const a = bySpace.get(i.spaceId) ?? [];
    a.push(i);
    bySpace.set(i.spaceId, a);
  }

  for (const [spaceId, items] of bySpace) {
    const sp = spaceById.get(spaceId);
    if (!sp) continue;
    const find = (t: string) => items.find((i) => i.title.toLowerCase().includes(t));
    const isDone = (i?: ScopeItem) =>
      i ? ["approved", "boq", "quoted", "ordered", "in-transit", "delivered", "installed", "inspected", "complete", "not-applicable"].includes(i.stage) : false;

    // Concealed diverter bodies must be bought before the wall closes.
    const diverter = find("diverter");
    const wallTile = find("wall tile");
    if (diverter && wallTile && undecided(diverter) && isDone(wallTile)) {
      gaps.push({
        id: `gap-seq-diverter-${spaceId}`,
        severity: "blocker",
        spaceId,
        scopeItemId: diverter.id,
        title: `${sp.name} — wall tiling is moving but the concealed diverter is not chosen.`,
        detail: "The diverter body is cast into the wall. Tiling over an unchosen body means breaking it open again.",
        action: "Freeze the CP brand and order the concealed bodies now.",
      });
    }

    // Ceiling closing over undecided services.
    const ceiling = find("false ceiling") ?? find("ceiling");
    if (ceiling && isDone(ceiling)) {
      for (const key of ["curtain track", "ac ", "air conditioning", "chandelier", "cable management"]) {
        const svc = items.find((i) => i.title.toLowerCase().includes(key));
        if (svc && undecided(svc)) {
          gaps.push({
            id: `gap-seq-ceiling-${svc.id}`,
            severity: "risk",
            spaceId,
            scopeItemId: svc.id,
            title: `${sp.name} — ceiling is progressing ahead of "${svc.title}".`,
            detail: "Anything concealed above the ceiling has to be fixed before the boards close, or it means cutting them open.",
            action: "Decide this before the ceiling is boarded.",
          });
        }
      }
    }

    // Waterproofing before tiles in a wet room.
    if (["bathroom", "powder", "laundry", "utility", "terrace", "balcony"].includes(sp.kind)) {
      const wp = find("waterproofing");
      const floor = find("floor tile") ?? find("flooring");
      if (wp && undecided(wp) && floor && !undecided(floor)) {
        gaps.push({
          id: `gap-seq-wp-${spaceId}`,
          severity: "blocker",
          spaceId,
          scopeItemId: wp.id,
          title: `${sp.name} — flooring is ahead of waterproofing.`,
          detail: "Waterproofing goes under the tile. Once the floor is laid the only fix is to take it up.",
          action: "Settle the waterproofing scope, applicator and warranty first.",
        });
      }
      if (wp && !wp.owner) {
        gaps.push({
          id: `gap-wp-owner-${spaceId}`,
          severity: "risk",
          spaceId,
          scopeItemId: wp.id,
          title: `${sp.name} — waterproofing responsibility is unassigned.`,
          detail: "No owner is named against the waterproofing, so no one is answerable for the warranty.",
          action: "Name the responsible contractor and record the warranty length.",
        });
      }
    }

    // Appliances that need a DEDICATED service point, not just a general
    // socket run. Anything served by the room's generic points is excluded, or
    // this check drowns the report in noise.
    for (const appliance of ["dishwasher", "washing machine", "geyser"]) {
      const a = items.find((i) => i.title.toLowerCase().includes(appliance));
      if (!a || a.stage === "not-applicable") continue;
      const point = items.find(
        (i) =>
          (i.category === "electrical" || i.category === "plumbing") &&
          i.title.toLowerCase().includes(appliance),
      );
      if (!point && !undecided(a)) {
        gaps.push({
          id: `gap-point-${a.id}`,
          severity: "risk",
          spaceId,
          scopeItemId: a.id,
          title: `${sp.name} — ${appliance} electrical/plumbing point is not confirmed.`,
          detail: "The appliance is being progressed but there is no matching service point in the scope for this room.",
          action: "Confirm the point on the electrical drawing before plastering.",
        });
      }
    }

    // Bedrooms without an AC specification.
    if (["bedroom", "master-bedroom"].includes(sp.kind)) {
      const ac = items.find((i) => i.category === "hvac" && i.title.toLowerCase().includes("air conditioning"));
      if (ac && ac.stage !== "not-applicable" && !ac.spec) {
        gaps.push({
          id: `gap-ac-spec-${spaceId}`,
          severity: "gap",
          spaceId,
          scopeItemId: ac.id,
          title: `${sp.name} — no AC specification.`,
          detail: "Tonnage, indoor unit position and drain route are all unstated. All three affect the ceiling design.",
          action: "Get the HVAC consultant to specify tonnage and unit position.",
        });
      }
      const curtains = items.find((i) => i.category === "curtains" && i.title.toLowerCase().includes("blackout"));
      if (curtains && untouched(curtains)) {
        gaps.push({
          id: `gap-curtain-${spaceId}`,
          severity: "gap",
          spaceId,
          scopeItemId: curtains.id,
          title: `${sp.name} — curtains have no selection.`,
          detail: "No fabric, no track and no measurement recorded. Curtains are a 6–8 week lead item.",
          action: "Shortlist fabric and book the site measurement.",
        });
      }
    }

    // Theatre acoustics unbudgeted.
    if (sp.kind === "home-theatre") {
      const ac = items.filter((i) => i.title.toLowerCase().includes("acoustic"));
      if (ac.length && ac.every((i) => !i.ladder.initialEstimate && !i.ladder.designerEstimate)) {
        gaps.push({
          id: `gap-acoustics-${spaceId}`,
          severity: "risk",
          spaceId,
          scopeItemId: ac[0].id,
          title: `${sp.name} — acoustic treatment is not yet budgeted.`,
          detail: "Acoustic treatment is routinely left out of the first budget and then arrives as a surprise at 8–12% of the room cost.",
          action: "Put an allowance against wall and ceiling treatment now.",
        });
      }
    }
  }

  /* --- 3. whole-house systems with no owner ----------------------------- */
  for (const i of houseWideItems(s)) {
    if (i.stage === "not-applicable") continue;
    if (i.tags?.includes("critical") && !i.owner) {
      gaps.push({
        id: `gap-owner-${i.id}`,
        severity: "risk",
        scopeItemId: i.id,
        title: `${i.title} — responsibility unassigned.`,
        detail: "A critical house-wide item with no named owner is a gap nobody is watching.",
        action: "Assign an owner.",
      });
    }
  }

  /* --- 4. long-lead items still undecided ------------------------------- */
  const today = new Date();
  for (const i of s.items) {
    const lead = i.procurement?.leadTimeWeeks ?? 0;
    if (lead < LONG_LEAD_WEEKS || forecastOf(i) < LONG_LEAD_VALUE || i.stage === "not-applicable") continue;
    if (undecided(i)) {
      gaps.push({
        id: `gap-leadtime-${i.id}`,
        severity: "risk",
        spaceId: i.spaceId,
        scopeItemId: i.id,
        title: `${nameOf(i.spaceId)} — ${i.title.toLowerCase()} is a ${lead}-week lead item and still undecided.`,
        detail: `Ordering this late pushes installation by up to ${lead} weeks.`,
        action: "Escalate to a decision this week.",
      });
    }
  }

  /* --- 5. decisions past their date ------------------------------------- */
  for (const d of s.decisions) {
    if (d.status !== "awaiting-owner" || !d.decideBy) continue;
    if (new Date(d.decideBy) < today) {
      const item = s.items.find((i) => i.id === d.scopeItemId);
      gaps.push({
        id: `gap-overdue-${d.id}`,
        severity: "blocker",
        spaceId: item?.spaceId,
        scopeItemId: d.scopeItemId,
        title: `Decision overdue — ${d.title}`,
        detail: d.consequence ?? "This decision is past the date the programme assumed.",
        action: "Decide now.",
      });
    }
  }

  const order: Record<GapSeverity, number> = { blocker: 0, risk: 1, gap: 2, nudge: 3 };
  return gaps.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* --------------------------------------------------------- decision ranking */

/**
 * Rank what the homeowner should look at first. Urgency (how soon it bites)
 * times impact (how much money and schedule rides on it).
 */
export function decisionUrgency(d: Decision, item?: ScopeItem, today = new Date()): number {
  let score = 0;
  if (d.decideBy) {
    const days = (new Date(d.decideBy).getTime() - today.getTime()) / 86400000;
    score += days < 0 ? 100 : days < 7 ? 60 : days < 21 ? 35 : 15;
  } else {
    score += 10;
  }
  const money = Math.abs(d.costDeltaVsBudget ?? 0) + (item ? forecastOf(item) * 0.1 : 0);
  score += Math.min(40, money / 25000);
  score += Math.min(25, (d.scheduleImpactDays ?? 0) * 1.5);
  const lead = item?.procurement?.leadTimeWeeks ?? 0;
  score += Math.min(20, lead * 1.5);
  if (d.status === "changes-requested") score += 8;
  return round(score, 1);
}

export function openDecisions(s: ProjectState): Decision[] {
  const itemById = new Map(s.items.map((i) => [i.id, i]));
  return s.decisions
    .filter((d) => d.status === "awaiting-owner" || d.status === "changes-requested" || d.status === "on-hold")
    .sort((a, b) => decisionUrgency(b, itemById.get(b.scopeItemId)) - decisionUrgency(a, itemById.get(a.scopeItemId)));
}

/* -------------------------------------------------------------- schedule */

export function isLate(t: Task, today = new Date()): boolean {
  return t.status !== "done" && !!t.finish && new Date(t.finish) < today;
}

/**
 * Tasks whose slippage would move handover, found by walking the dependency graph.
 * Finished work cannot delay anything, so it is excluded.
 */
export function criticalTaskIds(allTasks: Task[]): Set<string> {
  const tasks = allTasks.filter((t) => t.status !== "done");
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const memo = new Map<string, number>();
  const depth = (id: string, seen = new Set<string>()): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const t = byId.get(id);
    if (!t) return 0;
    const dependents = tasks.filter((x) => x.dependsOn.includes(id));
    const d = dependents.length ? 1 + Math.max(...dependents.map((x) => depth(x.id, seen))) : 0;
    memo.set(id, d);
    return d;
  };
  const scored = tasks.map((t) => ({ id: t.id, d: depth(t.id) }));
  const max = Math.max(0, ...scored.map((x) => x.d));
  return new Set(scored.filter((x) => x.d >= Math.max(2, max - 1)).map((x) => x.id));
}

export function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/* ------------------------------------------------------------- procurement */

/**
 * Long-lead items worth escalating.
 *
 * A nominal lead time is not by itself a programme risk — a ₹3,000 towel rail
 * with an eight-week catalogue lead never delayed a villa. The threshold is
 * lead time AND enough money on the line to be worth the homeowner's attention.
 */
export const LONG_LEAD_WEEKS = 8;
export const LONG_LEAD_VALUE = 75000;

export function longLeadItems(s: ProjectState): ScopeItem[] {
  return s.items
    .filter(
      (i) =>
        (i.procurement?.leadTimeWeeks ?? 0) >= LONG_LEAD_WEEKS &&
        forecastOf(i) >= LONG_LEAD_VALUE &&
        i.stage !== "not-applicable" &&
        i.stage !== "complete",
    )
    .sort((a, b) => (b.procurement?.leadTimeWeeks ?? 0) - (a.procurement?.leadTimeWeeks ?? 0));
}

export function upcomingPayments(s: ProjectState, withinDays = 30, today = new Date()): Payment[] {
  return s.payments
    .filter((p) => !p.paidOn && daysBetween(today, p.dueOn) <= withinDays)
    .sort((a, b) => +new Date(a.dueOn) - +new Date(b.dueOn));
}

export function openSnags(s: ProjectState): Snag[] {
  return s.snags.filter((x) => x.status !== "closed");
}

/* ------------------------------------------------------- heatmap fuel */

export type OverlayKey =
  | "status" | "completion" | "budget" | "overrun" | "decisions" | "procurement"
  | "issues" | "electrical" | "lighting" | "automation" | "furniture" | "hvac";

export interface SpaceMetrics {
  spaceId: string;
  completionPct: number;
  forecast: number;
  budget: number;
  variance: number;
  overrunPct: number;
  decisionsOpen: number;
  snagsOpen: number;
  longLead: number;
  procurementRisk: number;
  itemCount: number;
  liveCount: number;
  notStarted: number;
  categoryCount: (c: Category[]) => number;
}

export function spaceMetrics(s: ProjectState, spaceId: string): SpaceMetrics {
  const items = itemsForSpace(s, spaceId);
  const r = rollup(items, s.decisions);
  const ids = new Set(items.map((i) => i.id));
  const decisionsOpen = s.decisions.filter(
    (d) => ids.has(d.scopeItemId) && (d.status === "awaiting-owner" || d.status === "changes-requested"),
  ).length;
  const snagsOpen = s.snags.filter((x) => x.spaceId === spaceId && x.status !== "closed").length;
  const longLead = items.filter(
    (i) => (i.procurement?.leadTimeWeeks ?? 0) >= LONG_LEAD_WEEKS && forecastOf(i) >= LONG_LEAD_VALUE,
  ).length;
  const atRisk = items.filter(
    (i) =>
      (i.procurement?.leadTimeWeeks ?? 0) >= LONG_LEAD_WEEKS &&
      forecastOf(i) >= LONG_LEAD_VALUE &&
      ["not-started", "idea", "options", "estimated", "discussion"].includes(i.stage),
  ).length;
  return {
    spaceId,
    completionPct: r.completionPct,
    forecast: r.forecast,
    budget: r.approvedBudget,
    variance: r.variance,
    overrunPct: r.approvedBudget ? round((r.variance / r.approvedBudget) * 100, 1) : 0,
    decisionsOpen,
    snagsOpen,
    longLead,
    procurementRisk: atRisk,
    itemCount: items.length,
    liveCount: r.live,
    notStarted: items.filter((i) => i.stage === "not-started").length,
    categoryCount: (cats: Category[]) =>
      items.filter((i) => cats.includes(i.category) && i.stage !== "not-applicable").length,
  };
}

/** 0..1 intensity for a given overlay, used to paint the floor plan. */
export function overlayIntensity(m: SpaceMetrics, overlay: OverlayKey): { v: number; label: string } {
  switch (overlay) {
    case "completion":
      return { v: m.completionPct / 100, label: `${Math.round(m.completionPct)}%` };
    case "budget": {
      const v = Math.min(1, m.forecast / 2_500_000);
      return { v, label: m.forecast ? compact(m.forecast) : "—" };
    }
    case "overrun": {
      const v = Math.max(0, Math.min(1, m.overrunPct / 30));
      return { v, label: m.variance ? `${m.overrunPct > 0 ? "+" : ""}${m.overrunPct}%` : "—" };
    }
    case "decisions":
      return { v: Math.min(1, m.decisionsOpen / 3), label: m.decisionsOpen ? String(m.decisionsOpen) : "—" };
    case "procurement":
      return { v: Math.min(1, m.procurementRisk / 3), label: m.procurementRisk ? String(m.procurementRisk) : "—" };
    case "issues":
      return { v: Math.min(1, m.snagsOpen / 4), label: m.snagsOpen ? String(m.snagsOpen) : "—" };
    case "electrical":
      return countOverlay(m, ["electrical"], 12);
    case "lighting":
      return countOverlay(m, ["lighting"], 8);
    case "automation":
      return countOverlay(m, ["automation", "networking", "security"], 4);
    case "furniture":
      return countOverlay(m, ["loose-furniture", "bespoke-furniture", "carpentry", "wardrobe"], 6);
    case "hvac":
      return countOverlay(m, ["hvac", "fans"], 3);
    case "status":
    default:
      return { v: m.completionPct / 100, label: `${Math.round(m.completionPct)}%` };
  }
}

function countOverlay(m: SpaceMetrics, cats: Category[], scale: number) {
  const n = m.categoryCount(cats);
  return { v: Math.min(1, n / scale), label: n ? String(n) : "—" };
}

function compact(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}k`;
  return `₹${Math.round(n)}`;
}

/* ------------------------------------------------------------ stage buckets */

export const COMPLETENESS_BUCKETS: { key: string; label: string; stages: Stage[] }[] = [
  { key: "not-started", label: "Not started", stages: ["not-started"] },
  { key: "considering", label: "Being considered", stages: ["idea", "options", "estimated", "discussion"] },
  { key: "decided", label: "Decided", stages: ["decided"] },
  { key: "approved", label: "Approved", stages: ["approved", "boq", "quoted"] },
  { key: "ordered", label: "Ordered", stages: ["ordered", "in-transit"] },
  { key: "installed", label: "Installed", stages: ["delivered", "installed", "snagged"] },
  { key: "verified", label: "Verified", stages: ["inspected", "complete"] },
  { key: "na", label: "Not applicable", stages: ["not-applicable"] },
];

export function bucketOf(stage: Stage): string {
  return COMPLETENESS_BUCKETS.find((b) => b.stages.includes(stage))?.key ?? "not-started";
}
