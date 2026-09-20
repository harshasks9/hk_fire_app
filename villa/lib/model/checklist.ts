import type { ProjectState, ScopeItem, Space, Stage } from "./types";
import { SCOPE_TEMPLATES } from "../seed/scope-templates";
import { MASTER_SCOPE } from "../seed/master-scope";
import { STAGE_PROGRESS } from "./types";
import { measureSpace } from "./measure";
import { forecastOf, budgetOf } from "./derive";
import { isBought } from "./purchase";

/**
 * The planning checklist.
 *
 * The completeness engine in `derive.ts` answers "what is wrong right now".
 * This answers a different and, while you are still planning, more useful
 * question: "walk me through this room and tell me whether I have thought
 * about everything."
 *
 * So it is deliberately exhaustive and deliberately ordered. Every room gets
 * the same seven sections in the same sequence, because that is the sequence a
 * fit-out actually runs in, and a section you have not finished is a section
 * whose downstream work is being done on a guess. Every line says why it is
 * there — a checklist nobody understands is a checklist nobody completes.
 */

export type CheckState = "done" | "partial" | "todo" | "na";

export interface Check {
  id: string;
  label: string;
  /** Why this line exists. Shown on every row: no unexplained obligations. */
  why: string;
  state: CheckState;
  critical?: boolean;
  /** Live evidence from the project — "4 of 7 estimated". */
  detail?: string;
  scopeItemId?: string;
  href?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  blurb: string;
  /** The phase this section belongs to, so the two views agree. */
  phaseId: string;
  checks: Check[];
  done: number;
  open: number;
  total: number;
  pct: number;
  criticalOpen: number;
}

export interface Checklist {
  spaceId?: string;
  name: string;
  sections: ChecklistSection[];
  done: number;
  total: number;
  pct: number;
  criticalOpen: number;
  /** The single next thing to do, for the room card and the dashboard. */
  next?: Check;
}

/* ---------------------------------------------------------------- matching */

const norm = (s: string) =>
  s.toLowerCase().replace(/[—–-]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/** A template line is covered by an item whose title matches, loosely. */
function matchItem(items: ScopeItem[], title: string): ScopeItem | undefined {
  const t = norm(title);
  const exact = items.find((i) => norm(i.title) === t);
  if (exact) return exact;
  const head = t.split(" ").slice(0, 3).join(" ");
  return items.find((i) => {
    const n = norm(i.title);
    return n.startsWith(head) || t.startsWith(n.split(" ").slice(0, 3).join(" "));
  });
}

const LIVE = (i: ScopeItem) => i.stage !== "not-applicable";
const STARTED = (i: ScopeItem) => i.stage !== "not-started" && i.stage !== "not-applicable";
const atLeast = (stage: Stage, floor: Stage) => STAGE_PROGRESS[stage] >= STAGE_PROGRESS[floor];

function section(
  id: string, title: string, blurb: string, phaseId: string, checks: Check[],
): ChecklistSection {
  const counted = checks.filter((c) => c.state !== "na");
  const done = counted.filter((c) => c.state === "done").length;
  return {
    id, title, blurb, phaseId, checks,
    done,
    open: counted.length - done,
    total: counted.length,
    pct: counted.length ? (done / counted.length) * 100 : 100,
    criticalOpen: counted.filter((c) => c.critical && c.state !== "done").length,
  };
}

/** done when all, partial when some, todo when none. The workhorse. */
function ratio(
  id: string, label: string, why: string,
  passed: number, of: number,
  opts: { critical?: boolean; href?: string; unit?: string } = {},
): Check {
  const unit = opts.unit ?? "items";
  return {
    id, label, why,
    state: of === 0 ? "na" : passed === of ? "done" : passed > 0 ? "partial" : "todo",
    critical: opts.critical,
    detail: of === 0 ? "nothing in scope yet" : `${passed} of ${of} ${unit}`,
    href: opts.href,
  };
}

function bool(
  id: string, label: string, why: string, ok: boolean,
  opts: { critical?: boolean; detail?: string; href?: string } = {},
): Check {
  return { id, label, why, state: ok ? "done" : "todo", critical: opts.critical, detail: opts.detail, href: opts.href };
}

/* ------------------------------------------------------------- the builder */

export function roomChecklist(s: ProjectState, spaceId: string): Checklist | undefined {
  const sp = s.spaces.find((x) => x.id === spaceId);
  if (!sp) return undefined;

  const items = s.items.filter((i) => i.spaceId === spaceId);
  const live = items.filter(LIVE);
  const critical = live.filter((i) => i.tags?.includes("critical"));
  const itemIds = new Set(items.map((i) => i.id));
  const ideas = s.ideas.filter((i) => itemIds.has(i.scopeItemId));
  const decisions = s.decisions.filter((d) => itemIds.has(d.scopeItemId));
  const docs = s.docs.filter((d) => d.spaceIds.includes(spaceId));
  const notes = s.notes.filter((n) => n.spaceIds?.includes(spaceId));
  const tasks = s.tasks.filter((t) => t.spaceId === spaceId);
  const snags = s.snags.filter((x) => x.spaceId === spaceId);
  const updates = s.siteUpdates.filter((u) => u.spaceId === spaceId);
  const m = measureSpace(sp);
  const href = `/villa/${spaceId}`;

  const sections: ChecklistSection[] = [];

  /* 1 ------------------------------------------------------------ measure */
  sections.push(section("measure", "Measured and understood",
    "Nothing downstream is safe until the room's own numbers are right. A wardrobe cut to a plan dimension is a wardrobe cut twice.",
    "survey", [
      bool("dim", "Room is dimensioned", "Every quantity in this room is derived from its width and length. Without them the app refuses to guess and every quantity starts at 1.",
        !!sp.dims, { critical: true, detail: m ? `${m.widthMm} × ${m.lengthMm} mm` : "no dimension carried", href: "/manage" }),
      bool("site", "Dimensions confirmed on site", "The architect's plan is a design intent, not an as-built. Joinery, stone and glass must be cut to a laser measurement taken in the finished shell.",
        sp.dims?.source === "site-measured", { critical: true, detail: sp.dims ? `currently: ${sp.dims.source.replace("-", " ")}` : undefined, href: "/manage" }),
      bool("ceiling", "Ceiling height recorded", "Wall area, panelling, curtain drop, AC tonnage and the false-ceiling drop all price off it. Until it is entered the app assumes 10'0\".",
        !!sp.ceilingHeightFt, { detail: sp.ceilingHeightFt ? `${sp.ceilingHeightFt}'0"` : "assuming 10'0\"", href: "/manage" }),
      bool("survey", "Existing services and levels noted", "Where the beams, drains, shafts and existing points actually are. This is what turns a drawing into a buildable room.",
        notes.length > 0 || updates.length > 0, { detail: `${notes.length} notes · ${updates.length} site updates`, href: "/notes" }),
    ]));

  /* 2 -------------------------------------------------------------- brief */
  sections.push(section("brief", "Brief and intent",
    "What this room is for, who uses it and how it should feel — agreed before anything is specified, so options can be judged against something.",
    "concept", [
      bool("use", "Brief written down", "An unwritten brief is re-litigated at every review. Put it in a note against the room.",
        notes.length > 0, { detail: notes.length ? `${notes.length} note${notes.length > 1 ? "s" : ""}` : undefined, href: "/notes" }),
      bool("idea", "At least one direction on the table", "A room with no idea against it has not been designed, only scheduled.",
        ideas.length > 0, { critical: true, detail: `${ideas.length} ideas`, href }),
      bool("ref", "Reference images or a render", "Words do not settle a finish. Something visual has to exist before a decision means anything.",
        docs.some((d) => ["render", "elevation", "furniture", "joinery"].includes(d.kind)) ||
        ideas.some((i) => i.attachments.length > 0),
        { detail: `${docs.length} files`, href: "/documents" }),
      bool("layout", "Furniture layout fits the room", "A three-seater that does not turn the stair, or a bed that blocks the wardrobe swing, is discovered on delivery day otherwise.",
        docs.some((d) => d.kind === "furniture" || d.kind === "floor-plan"), { href: "/documents" }),
    ]));

  /* 3 ------------------------------------------------------------- scope */
  const template = SCOPE_TEMPLATES[sp.kind] ?? [];
  const scopeChecks: Check[] = template.map((t, n) => {
    const it = matchItem(items, t.title);
    const state: CheckState = !it ? "todo" : it.stage === "not-applicable" ? "na" : STARTED(it) ? "done" : "partial";
    return {
      id: `tpl-${n}`,
      label: t.title,
      why: t.spec ?? `Standard scope for a ${sp.kind.replace("-", " ")}. Every room of this kind needs it considered, even if the answer is no.`,
      state,
      critical: t.critical,
      detail: !it ? "not on the list for this room" : it.stage === "not-applicable" ? (it.naReason ?? "marked not applicable") : it.stage.replace("-", " "),
      scopeItemId: it?.id,
      href,
    };
  });
  // Anything the owner added beyond the template still counts as covered scope.
  const extra = live.filter((i) => !template.some((t) => matchItem([i], t.title)));
  if (extra.length) {
    scopeChecks.push({
      id: "tpl-extra", label: `${extra.length} line${extra.length > 1 ? "s" : ""} added beyond the standard checklist`,
      why: "Scope this room needs that the template did not predict. Listed so it is visible, never to be pruned.",
      state: "done", detail: extra.slice(0, 3).map((i) => i.title).join(", "), href,
    });
  }
  sections.push(section("scope", "Scope on the list",
    `The full checklist for a ${sp.kind.replace("-", " ")} — including the boring, invisible, expensive things: concealed plumbing, exhaust, waterproofing upstands, data points, pelmet depth, AC drain routing, loft access. A line is never deleted, only marked not applicable with a reason.`,
    "concept", scopeChecks));

  /* 4 -------------------------------------------------- spec and decisions */
  const specced = live.filter((i) => !!i.spec).length;
  const criticalSpecced = critical.filter((i) => !!i.spec).length;
  const openDec = decisions.filter((d) => d.status !== "approved" && d.status !== "rejected").length;
  sections.push(section("spec", "Specified and decided",
    "A decision that is not written down as a specification is a decision that will be made again, differently, by whoever is on site that day.",
    "design", [
      ratio("spec-crit", "Every critical line is specified", "Make, model, finish, size and code. This is what a vendor quotes and a site team builds from — anything left to interpretation gets interpreted.",
        criticalSpecced, critical.length, { critical: true, href }),
      ratio("spec-all", "Everything else is specified", "The unglamorous lines — skirting profile, socket plate finish, grout colour — are where a premium room quietly becomes an ordinary one.",
        specced, live.length, { href }),
      bool("dec-open", "No decision left hanging", "An undecided choice holds up everything that closes over it. Tiles cannot be laid over an undecided diverter body.",
        openDec === 0, { critical: true, detail: openDec ? `${openDec} awaiting a decision` : "all settled", href: "/decisions" }),
      ratio("opts", "Options were compared, not assumed", "At least one alternative considered, so the chosen thing was chosen and not defaulted into.",
        live.filter((i) => atLeast(i.stage, "decided")).length, live.length, { href }),
    ]));

  /* 5 --------------------------------------------------------------- cost */
  const estimated = live.filter((i) => forecastOf(i) > 0).length;
  const approved = live.filter((i) => atLeast(i.stage, "approved")).length;
  const budget = live.reduce((a, i) => a + budgetOf(i), 0);
  const forecast = live.reduce((a, i) => a + forecastOf(i), 0);
  sections.push(section("cost", "Costed and approved",
    "Every line carries a number before any of them is ordered. A room that is 80% costed is a room with an unknown 20% still to land.",
    "budget", [
      ratio("est", "Every line carries a number", "An un-costed line is invisible in the forecast, which means the overrun arrives as a surprise rather than a choice.",
        estimated, live.length, { critical: true, href: "/costs" }),
      ratio("appr", "Approved to proceed", "Approval is what converts an estimate into money the project has agreed to spend.",
        approved, live.length, { href: "/costs" }),
      bool("budget", "Room has a budget to measure against", "Without an approved budget for the room there is nothing for the forecast to be over or under.",
        budget > 0, { detail: budget > 0 ? undefined : "no approved budget", href: "/costs" }),
      bool("var", "Forecast is inside the budget", "Caught here it is a trade-off. Caught at invoice it is a bill.",
        budget === 0 || forecast <= budget * 1.05,
        { detail: budget > 0 ? `${Math.round((forecast / budget) * 100)}% of budget` : undefined, href: "/costs" }),
    ]));

  /* 6 -------------------------------------------------------- procurement */
  const buys = live.filter((i) => isBought(i.category));
  const ordered = buys.filter((i) => atLeast(i.stage, "ordered") || !!i.procurement?.orderedOn).length;
  const vendored = live.filter((i) => !!i.vendorId).length;
  sections.push(section("buy", "Bought and on its way",
    "Long-lead goods decide the handover date. Stone, wardrobes, the kitchen and the lift are ordered months before they are wanted.",
    "procure", [
      ratio("vendor", "A supplier is named against each line", "Unassigned scope is scope nobody is making.", vendored, live.length, { href: "/vendors" }),
      ratio("order", "Purchases actually ordered", "Selected is not ordered. A selected sofa has no delivery date.",
        ordered, buys.length, { critical: true, href: "/purchases" }),
      bool("lead", "Long-lead items ordered in time", "Anything eight weeks or longer has to be on order before the room is ready for it, not when it is.",
        buys.every((i) => (i.procurement?.leadTimeWeeks ?? 0) < 8 || atLeast(i.stage, "ordered")),
        { critical: true, href: "/purchases" }),
      bool("access", "It physically gets into the room", "Lift car, stair turn and door width. A slab worktop or a theatre recliner that does not fit is a re-order, not a delay.",
        docs.some((d) => d.kind === "furniture") || notes.length > 0, { href: "/documents" }),
    ]));

  /* 7 ------------------------------------------------------------ execute */
  const installed = live.filter((i) => atLeast(i.stage, "installed")).length;
  const openSnag = snags.filter((x) => x.status !== "closed").length;
  sections.push(section("execute", "Built, checked and handed over",
    "The room is not finished when it is installed. It is finished when it has been inspected, snagged, cleaned and signed off.",
    "handover", [
      bool("sched", "Work is on the programme", "A room with no dated task is a room nobody has committed to finishing.",
        tasks.length > 0, { detail: `${tasks.length} tasks`, href: "/timeline" }),
      ratio("inst", "Everything installed", "The physical work done and in place. Until every line is installed the room cannot be inspected as a whole, only in pieces.", installed, live.length, { href }),
      bool("snag", "No open defects", "A snag list that is still open at handover becomes a snag list that is never closed.",
        openSnag === 0, { detail: openSnag ? `${openSnag} open` : "clear", href: "/site" }),
      bool("insp", "Inspected and signed off", "Someone has walked the room against the specification with the lights on and the water running.",
        live.length > 0 && live.every((i) => atLeast(i.stage, "inspected")), { href }),
      bool("docs", "Warranties and manuals filed", "The warranty you cannot find is a warranty you do not have.",
        docs.some((d) => d.kind === "warranty" || d.kind === "manual"), { href: "/documents" }),
    ]));

  return assemble(sp.name, sections, spaceId);
}

/* ------------------------------------------------------------- house-wide */

export function houseChecklist(s: ProjectState): Checklist {
  const items = s.items.filter((i) => !i.spaceId);
  const live = items.filter(LIVE);
  const checks: Check[] = MASTER_SCOPE.map((t, n) => {
    const it = matchItem(items, t.title);
    return {
      id: `ms-${n}`,
      label: t.title,
      why: t.spec ?? (t.added
        ? "Not in the original brief. Reasoned in because a three-storey Hyderabad villa needs it, and these are exactly the omissions that surface late and expensively."
        : "House-wide scope that belongs to no single room, which is why it is the scope most often forgotten."),
      state: !it ? "todo" : it.stage === "not-applicable" ? "na" : STARTED(it) ? "done" : "partial",
      critical: t.critical,
      detail: !it ? "not on the list" : it.stage === "not-applicable" ? (it.naReason ?? "not applicable") : it.stage.replace("-", " "),
      scopeItemId: it?.id,
      href: "/costs",
    };
  });
  const extra = live.filter((i) => !MASTER_SCOPE.some((t) => matchItem([i], t.title)));
  if (extra.length) {
    checks.push({
      id: "ms-extra", label: `${extra.length} house-wide line${extra.length > 1 ? "s" : ""} added beyond the standard list`,
      why: "Scope added for this villa specifically.", state: "done",
      detail: extra.slice(0, 3).map((i) => i.title).join(", "), href: "/costs",
    });
  }
  const sections = [section("house", "House-wide scope",
    "Enabling works, statutory approvals, systems and the things that cross every room. This is the list that no room checklist would ever catch.",
    "survey", checks)];
  return assemble("House-wide", sections);
}

function assemble(name: string, sections: ChecklistSection[], spaceId?: string): Checklist {
  const done = sections.reduce((a, x) => a + x.done, 0);
  const total = sections.reduce((a, x) => a + x.total, 0);
  const open = sections.flatMap((x) => x.checks).filter((c) => c.state !== "done" && c.state !== "na");
  return {
    spaceId, name, sections, done, total,
    pct: total ? (done / total) * 100 : 100,
    criticalOpen: sections.reduce((a, x) => a + x.criticalOpen, 0),
    next: open.find((c) => c.critical) ?? open[0],
  };
}

/* -------------------------------------------------------------- summaries */

export interface ChecklistSummary {
  spaceId: string;
  name: string;
  floor: Space["floor"];
  pct: number;
  done: number;
  total: number;
  criticalOpen: number;
  next?: Check;
}

/** One row per room, for the overview page and the room cards. */
export function checklistSummaries(s: ProjectState): ChecklistSummary[] {
  return s.spaces
    .filter((sp) => !sp.archived)
    .map((sp) => {
      const c = roomChecklist(s, sp.id)!;
      return {
        spaceId: sp.id, name: sp.name, floor: sp.floor,
        pct: c.pct, done: c.done, total: c.total, criticalOpen: c.criticalOpen, next: c.next,
      };
    });
}
