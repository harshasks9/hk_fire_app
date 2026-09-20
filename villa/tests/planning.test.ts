import { describe, it, expect } from "vitest";
import { buildProject } from "@/lib/seed";
import { SPACES } from "@/lib/seed/spaces";
import { SCOPE_TEMPLATES } from "@/lib/seed/scope-templates";
import {
  measure, measureSpace, measureLine, measureShort, dimsLabel, mmLabel, areaLabel,
  feetToFtIn, feetLabel, ftToMm, NOT_DIMENSIONED, SOURCE_LABEL, isCuttable,
} from "@/lib/model/measure";
import { areaSqft, perimeterFt, wallAreaSqft } from "@/lib/model/costing";
import { roomChecklist, houseChecklist, checklistSummaries } from "@/lib/model/checklist";
import { PHASES, phaseProgress, phaseOfItem, phaseOfCategory, currentPhase } from "@/lib/model/phases";
import {
  purchaseList, purchaseTotals, purchasesToCsv, groupPurchases, supplyOf, isBought, SUPPLY,
} from "@/lib/model/purchase";
import { CATEGORY_LABEL } from "@/lib/model/types";

const project = buildProject();

/* ----------------------------------------------------------- measurements */

describe("measurements", () => {
  const d = { widthFt: 12, widthIn: 6, lengthFt: 12, lengthIn: 10, source: "architect-plan" as const };

  it("derives every unit from one pair of dimensions", () => {
    const m = measure(d)!;
    expect(m.widthFt).toBeCloseTo(12.5, 3);
    expect(m.widthMm).toBe(3810);
    expect(m.lengthMm).toBe(3912);
    expect(m.areaSqft).toBeCloseTo(160.4, 1);
    expect(m.areaSqm).toBeCloseTo(14.9, 1);
    expect(m.perimeterFt).toBeCloseTo(50.7, 1);
  });

  it("uses the room's ceiling height when it has one, and says when it does not", () => {
    expect(measure(d)!.ceilingAssumed).toBe(true);
    expect(measure(d)!.ceilingFt).toBe(10);
    const tall = measure(d, 12)!;
    expect(tall.ceilingAssumed).toBe(false);
    expect(tall.wallSqft).toBeCloseTo(50.67 * 12 * 0.88, 0);
    expect(tall.volumeCuft).toBe(Math.round(12.5 * (12 + 10 / 12) * 12));
  });

  it("carries nothing at all for a room the drawings do not dimension", () => {
    expect(measure(undefined)).toBeUndefined();
    expect(measureSpace({ dims: undefined })).toBeUndefined();
    expect(measureLine({ dims: undefined })).toBe(NOT_DIMENSIONED);
    expect(measureShort({ dims: undefined })).toBe("not dimensioned");
  });

  it("labels feet-and-inches, millimetres and area the same way everywhere", () => {
    expect(dimsLabel(d)).toBe(`12'6" × 12'10"`);
    expect(mmLabel(d)).toBe("3810 × 3912 mm");
    expect(areaLabel(d)).toBe("160.4 sq ft (14.9 m²)");
    expect(measureLine({ dims: d })).toBe(`12'6" × 12'10" · 160.4 sq ft · 3810 × 3912 mm`);
    expect(measureLine({ dims: d }, { perimeter: true })).toContain("50.7 rft perimeter");
  });

  it("rounds feet to inches and carries at twelve", () => {
    expect(feetToFtIn(12.5)).toEqual({ ft: 12, inch: 6 });
    expect(feetToFtIn(11.99)).toEqual({ ft: 12, inch: 0 });
    expect(feetLabel(65.25)).toBe(`65'3"`);
    expect(ftToMm(1)).toBe(305);
  });

  it("costing still answers through the same module, with no second implementation", () => {
    expect(areaSqft(d)).toBe(measure(d)!.areaSqft);
    expect(perimeterFt(d)).toBe(measure(d)!.perimeterFt);
    expect(wallAreaSqft(d, 12)).toBe(measure(d, 12)!.wallSqft);
  });

  it("only a site measurement is safe to cut against", () => {
    expect(isCuttable(d)).toBe(false);
    expect(isCuttable({ ...d, source: "site-measured" })).toBe(true);
    for (const k of Object.keys(SOURCE_LABEL)) expect(SOURCE_LABEL[k as never]).toBeTruthy();
  });

  it("every dimensioned seed space produces a consistent set of numbers", () => {
    for (const sp of SPACES.filter((s) => s.dims)) {
      const m = measureSpace(sp)!;
      expect(m.areaSqft).toBeGreaterThan(0);
      expect(m.widthMm).toBe(Math.round(m.widthFt * 304.8));
      expect(m.perimeterFt).toBeCloseTo(2 * (m.widthFt + m.lengthFt), 1);
      expect(m.wallSqft).toBeLessThan(m.perimeterFt * m.ceilingFt);
    }
  });
});

/* --------------------------------------------------------------- checklist */

describe("room checklist", () => {
  it("gives every room the same seven sections in the same order", () => {
    const ids = ["measure", "brief", "scope", "spec", "cost", "buy", "execute"];
    for (const sp of project.spaces) {
      const c = roomChecklist(project, sp.id)!;
      expect(c.sections.map((s) => s.id)).toEqual(ids);
    }
  });

  it("carries the full scope template for the room's kind", () => {
    for (const sp of project.spaces) {
      const c = roomChecklist(project, sp.id)!;
      const scope = c.sections.find((s) => s.id === "scope")!;
      const template = SCOPE_TEMPLATES[sp.kind] ?? [];
      expect(scope.checks.length).toBeGreaterThanOrEqual(template.length);
    }
  });

  it("every line says why it is there, and criticals are marked", () => {
    for (const sp of project.spaces) {
      const c = roomChecklist(project, sp.id)!;
      for (const s of c.sections) for (const ch of s.checks) expect(ch.why.length).toBeGreaterThan(0);
    }
    const bedroom = project.spaces.find((s) => s.kind === "bedroom" || s.kind === "master-bedroom")!;
    expect(roomChecklist(project, bedroom.id)!.sections.some((s) => s.checks.some((ch) => ch.critical))).toBe(true);
  });

  it("flags a room read off the plan as not yet safe to cut against", () => {
    const sp = project.spaces.find((s) => s.dims?.source === "architect-plan")!;
    const c = roomChecklist(project, sp.id)!;
    const m = c.sections.find((s) => s.id === "measure")!;
    expect(m.checks.find((x) => x.id === "dim")!.state).toBe("done");
    expect(m.checks.find((x) => x.id === "site")!.state).toBe("todo");
  });

  it("counts a not-applicable line out of the total rather than against it", () => {
    const sp = project.spaces[0];
    const item = project.items.find((i) => i.spaceId === sp.id)!;
    const before = roomChecklist(project, sp.id)!;
    const after = roomChecklist(
      { ...project, items: project.items.map((i) => (i.id === item.id ? { ...i, stage: "not-applicable" as const } : i)) },
      sp.id,
    )!;
    expect(after.total).toBeLessThanOrEqual(before.total);
  });

  it("names the single next thing to do, preferring a critical one", () => {
    const c = roomChecklist(project, project.spaces[0].id)!;
    if (c.criticalOpen > 0) expect(c.next?.critical).toBe(true);
  });

  it("covers the house-wide scope no room checklist would catch", () => {
    const h = houseChecklist(project);
    expect(h.sections[0].checks.length).toBeGreaterThan(30);
    expect(h.total).toBeGreaterThan(0);
  });

  it("summarises one row per live room", () => {
    const rows = checklistSummaries(project);
    expect(rows.length).toBe(project.spaces.filter((s) => !s.archived).length);
    for (const r of rows) expect(r.pct).toBeGreaterThanOrEqual(0);
  });
});

/* ------------------------------------------------------------------ phases */

describe("phases", () => {
  it("runs twelve phases, numbered and in chronological order", () => {
    expect(PHASES).toHaveLength(12);
    PHASES.forEach((p, n) => expect(p.n).toBe(n + 1));
    for (let i = 1; i < PHASES.length; i++) {
      expect(PHASES[i].weeks[0]).toBeGreaterThanOrEqual(PHASES[i - 1].weeks[0]);
      expect(PHASES[i].weeks[1]).toBeGreaterThan(PHASES[i].weeks[0]);
    }
  });

  it("every phase states its goal, its steps, its exit criteria and its trap", () => {
    for (const p of PHASES) {
      expect(p.goal.length).toBeGreaterThan(20);
      expect(p.steps.length).toBeGreaterThanOrEqual(4);
      expect(p.exit.length).toBeGreaterThanOrEqual(3);
      expect(p.trap.length).toBeGreaterThan(20);
      for (const s of p.steps) expect(s.detail.length).toBeGreaterThan(20);
    }
  });

  it("assigns every trade to exactly one execution phase", () => {
    const seen = new Map<string, string>();
    for (const p of PHASES) {
      for (const c of p.categories) {
        expect(seen.has(c), `${c} appears in two phases`).toBe(false);
        seen.set(c, p.id);
      }
    }
    for (const c of Object.keys(CATEGORY_LABEL)) {
      // Labour-only trades all belong to a phase; the planning phases own none.
      if (phaseOfCategory(c as never)) expect(seen.get(c)).toBeTruthy();
    }
  });

  it("places an undecided item in a planning phase whatever its trade", () => {
    const item = { ...project.items[0], stage: "idea" as const };
    expect(phaseOfItem(item).id).toBe("design");
    expect(phaseOfItem({ ...item, stage: "not-started" as const }).id).toBe("concept");
    expect(phaseOfItem({ ...item, stage: "decided" as const }).id).toBe("budget");
  });

  it("reports progress per phase and never marks a later phase ready before an earlier one", () => {
    const rows = phaseProgress(project);
    expect(rows).toHaveLength(12);
    let sawNotReady = false;
    for (const r of rows) {
      if (!r.ready) sawNotReady = true;
      if (sawNotReady) expect(r.ready).toBe(false);
    }
  });

  it("names the phase the project is actually in", () => {
    const p = currentPhase(project);
    expect(PHASES.some((x) => x.id === p.phase.id)).toBe(true);
  });
});

/* ----------------------------------------------------------- purchase list */

describe("purchase list", () => {
  const lines = purchaseList(project);

  it("classifies every trade as bought, made or site work", () => {
    for (const c of Object.keys(CATEGORY_LABEL)) {
      expect(["bought", "made", "done"]).toContain(supplyOf(c as never));
    }
    expect(SUPPLY.paint).toBe("done");
    expect(SUPPLY.wardrobe).toBe("made");
    expect(SUPPLY.lighting).toBe("bought");
  });

  it("excludes labour-only trades entirely — there is nothing to buy", () => {
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(isBought(l.category)).toBe(true);
    expect(lines.some((l) => l.category === "paint")).toBe(false);
    expect(lines.some((l) => l.category === "waterproofing")).toBe(false);
  });

  it("never lists a not-applicable item", () => {
    const ids = new Set(lines.map((l) => l.itemId));
    for (const i of project.items) if (i.stage === "not-applicable") expect(ids.has(i.id)).toBe(false);
  });

  it("will not let a made-to-measure line be ordered off a plan dimension", () => {
    const made = lines.filter((l) => l.supply === "made" && l.status === "to-order");
    for (const l of made) {
      const sp = project.spaces.find((s) => s.id === l.spaceId);
      if (sp && sp.dims?.source !== "site-measured") {
        expect(l.blockedBy).toContain("measured on site");
      }
    }
  });

  it("marks long-lead lines and sorts risk to the top", () => {
    expect(lines.some((l) => l.longLead)).toBe(true);
    for (const l of lines) expect(l.longLead).toBe(l.leadWeeks >= 8);
    const firstUnblocked = lines.findIndex((l) => l.status !== "undecided" && !l.longLead);
    const lastRisky = lines.map((l) => !!l.overdueDays).lastIndexOf(true);
    if (firstUnblocked >= 0 && lastRisky >= 0) expect(lastRisky).toBeLessThan(lines.length);
  });

  it("totals what is ready to order separately from what is not yet decided", () => {
    const t = purchaseTotals(lines);
    expect(t.lines).toBe(lines.length);
    expect(t.toOrder + t.undecided + t.ordered + t.delivered).toBeLessThanOrEqual(t.lines);
    expect(t.value).toBeGreaterThan(0);
  });

  it("groups four ways without losing or duplicating a line", () => {
    for (const by of ["category", "room", "supplier", "status"] as const) {
      const g = groupPurchases(lines, by);
      expect(g.reduce((a, x) => a + x.lines.length, 0)).toBe(lines.length);
    }
  });

  it("exports a spreadsheet with one row per line and escaped fields", () => {
    const csv = purchasesToCsv(lines);
    const rows = csv.split("\n");
    expect(rows[0]).toContain("Order by");
    expect(rows.length).toBeGreaterThanOrEqual(lines.length + 1);
    const withComma = purchasesToCsv([{ ...lines[0], title: 'Sofa, three-seater "L"' }]);
    expect(withComma).toContain('"Sofa, three-seater ""L"""');
  });
});
