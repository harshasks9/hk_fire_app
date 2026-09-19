import { describe, it, expect } from "vitest";
import { buildProject, scenarioForecast, SCENARIOS } from "@/lib/seed";
import { SPACES } from "@/lib/seed/spaces";
import { PLANS } from "@/lib/plans/geometry";
import { computeCost, areaSqft, perimeterFt, inr, dimsLabel } from "@/lib/model/costing";
import {
  forecastOf, rollup, projectFinance, findGaps, itemsForSpace, openDecisions, longLeadItems,
  LONG_LEAD_WEEKS, LONG_LEAD_VALUE,
} from "@/lib/model/derive";
import { reducer } from "@/lib/store";
import { search } from "@/lib/search";
import { STAGES } from "@/lib/model/types";

const project = buildProject();

/* ------------------------------------------------------------------ costing */

describe("cost build-up", () => {
  it("stacks base, wastage, labour, installation, freight and tax in order", () => {
    const b = computeCost({
      qty: 100, unit: "sqft", rate: 200, wastagePct: 10, labourRate: 50,
      installationPct: 5, freight: 1000, taxPct: 18,
    });
    expect(b.base).toBe(20000);
    expect(b.wastage).toBe(2000);
    expect(b.labour).toBe(5000);
    expect(b.installation).toBe(1100); // 5% of (base + wastage)
    // tax applies to everything before it, not just the base
    expect(b.tax).toBe(Math.round((20000 + 2000 + 5000 + 1100 + 1000) * 0.18));
    expect(b.total).toBe(20000 + 2000 + 5000 + 1100 + 1000 + b.tax);
  });

  it("is a pure function of its inputs — the total is never typed in", () => {
    const a = computeCost({ qty: 10, unit: "nos", rate: 1000 });
    const b = computeCost({ qty: 10, unit: "nos", rate: 1000 });
    expect(a.total).toBe(b.total);
    expect(a.total).toBe(10000);
  });

  it("formats money in the Indian numbering system", () => {
    expect(inr(12345678)).toBe("₹1,23,45,678");
    expect(inr(1500)).toBe("₹1,500");
    expect(inr(undefined)).toBe("—");
    expect(inr(15000000, { compact: true })).toBe("₹1.5 Cr");
  });
});

/* ------------------------------------------------------------------- spaces */

describe("the villa as drawn", () => {
  it("carries every space named in the brief", () => {
    const names = SPACES.map((s) => s.name.toLowerCase());
    for (const expected of [
      "master bedroom", "master wic", "master bathroom", "bedroom 3", "bedroom 4", "bedroom 5",
      "home theatre", "puja room", "bar counter", "laundry", "open terrace", "kitchen",
      "wet kitchen", "utility", "maid room", "powder room", "drawing room", "main living room",
      "dining room", "double-height foyer", "family lounge",
    ]) {
      expect(names.some((n) => n.includes(expected)), `missing ${expected}`).toBe(true);
    }
  });

  it("has five bedrooms, matching a 5 BHK", () => {
    const beds = SPACES.filter((s) => s.kind === "bedroom" || s.kind === "master-bedroom");
    expect(beds).toHaveLength(5);
  });

  it("only ever claims a dimension it took from the architect's plan", () => {
    for (const s of SPACES) {
      if (!s.dims) continue;
      expect(s.dims.source, `${s.name} has an unsourced dimension`).toBe("architect-plan");
      expect(s.dims.widthFt).toBeGreaterThan(0);
      expect(s.dims.lengthFt).toBeGreaterThan(0);
    }
  });

  it("leaves undimensioned spaces genuinely blank rather than guessing", () => {
    const blank = SPACES.filter((s) => !s.dims).map((s) => s.name);
    // Gardens, deck, utility yard and circulation are not dimensioned on the plans.
    expect(blank.length).toBeGreaterThan(0);
    for (const s of SPACES.filter((x) => !x.dims)) {
      expect(areaSqft(s.dims)).toBeUndefined();
    }
  });

  it("reproduces specific dimensions from the plans exactly", () => {
    const by = (id: string) => SPACES.find((s) => s.id === id)!;
    expect(dimsLabel(by("ff-master").dims)).toBe(`20'4" × 14'4"`);
    expect(dimsLabel(by("sf-theatre").dims)).toBe(`20'4" × 14'4"`);
    expect(dimsLabel(by("sf-terrace").dims)).toBe(`17'8" × 43'10"`);
    expect(dimsLabel(by("gf-living").dims)).toBe(`17'8" × 21'6"`);
    expect(dimsLabel(by("gf-kitchen").dims)).toBe(`12'6" × 12'10"`);
    expect(dimsLabel(by("gf-lift").dims)).toBe(`5'6" × 5'0"`);
    // 17'8" x 43'10" is the single largest space in the villa
    expect(Math.round(areaSqft(by("sf-terrace").dims)!)).toBe(774);
  });

  it("draws only rooms that actually exist", () => {
    const ids = new Set(SPACES.map((s) => s.id));
    for (const plan of Object.values(PLANS)) {
      for (const room of plan.rooms) {
        expect(ids.has(room.spaceId), `plan references unknown space ${room.spaceId}`).toBe(true);
      }
    }
  });
});

/* -------------------------------------------------------------------- scope */

describe("pre-populated scope", () => {
  it("gives every space a checklist, so no room is ever a blank page", () => {
    for (const s of SPACES) {
      expect(itemsForSpace(project, s.id).length, `${s.name} has no scope`).toBeGreaterThan(0);
    }
  });

  it("covers the bedroom checklist the brief asked for", () => {
    const titles = itemsForSpace(project, "ff-master").map((i) => i.title.toLowerCase());
    for (const t of [
      "flooring", "skirting", "false ceiling", "wall treatment", "bed", "mattress",
      "bedside", "headboard", "feature wall", "tv unit", "dresser", "wardrobe",
      "mirror", "curtain", "sheer", "blind", "air conditioning", "ceiling fan",
      "socket", "usb", "data", "artwork", "rug", "door",
    ]) {
      expect(titles.some((x) => x.includes(t)), `master bedroom missing "${t}"`).toBe(true);
    }
  });

  it("covers the bathroom checklist, concealed work included", () => {
    const titles = itemsForSpace(project, "ff-master-bath").map((i) => i.title.toLowerCase());
    for (const t of [
      "waterproofing", "floor tile", "wall tile", "vanity", "countertop", "basin", "wc",
      "shower", "shower glass", "diverter", "health faucet", "concealed plumbing", "drain",
      "geyser", "mirror", "niche", "towel", "exhaust",
    ]) {
      expect(titles.some((x) => x.includes(t)), `bathroom missing "${t}"`).toBe(true);
    }
  });

  it("covers the kitchen checklist including the appliance services", () => {
    const titles = itemsForSpace(project, "gf-kitchen").map((i) => i.title.toLowerCase());
    for (const t of [
      "carcass", "shutter", "hardware", "countertop", "backsplash", "island", "sink",
      "faucet", "hob", "chimney", "oven", "microwave", "refrigerator", "dishwasher",
      "water purifier", "pantry", "tall unit", "gas", "ventilation", "wet-kitchen",
    ]) {
      expect(titles.some((x) => x.includes(t)), `kitchen missing "${t}"`).toBe(true);
    }
  });

  it("keeps house-wide scope that belongs to no single room", () => {
    const house = project.items.filter((i) => !i.spaceId).map((i) => i.title.toLowerCase());
    for (const t of ["waterproofing", "automation", "cctv", "warranty", "amc", "solar", "landscaping"]) {
      expect(house.some((x) => x.includes(t)), `house-wide missing "${t}"`).toBe(true);
    }
  });

  it("marks items not applicable rather than deleting them, keeping the reason", () => {
    const na = project.items.filter((i) => i.stage === "not-applicable");
    expect(na.length).toBeGreaterThan(0);
    for (const i of na) expect(i.naReason).toBeTruthy();
  });
});

/* ------------------------------------------------------------------- money */

describe("the money ladder", () => {
  it("never lets a figure sit ahead of the stage the item has reached", () => {
    const idx = (s: string) => STAGES.indexOf(s as never);
    for (const i of project.items) {
      const at = idx(i.stage);
      if (i.stage === "not-applicable") {
        expect(Object.keys(i.ladder), `${i.id} is N/A but carries money`).toHaveLength(0);
        continue;
      }
      if (i.ladder.paid || i.ladder.committed) {
        expect(at, `${i.id} is "${i.stage}" but has been committed/paid`).toBeGreaterThanOrEqual(idx("ordered"));
      }
      if (i.ladder.approved) {
        expect(at, `${i.id} is "${i.stage}" but has an approved price`).toBeGreaterThanOrEqual(idx("approved"));
      }
      if (i.ladder.designerEstimate) {
        expect(at, `${i.id} is "${i.stage}" but has a designer estimate`).toBeGreaterThanOrEqual(idx("estimated"));
      }
    }
  });

  it("prefers the hardest number available when forecasting", () => {
    const base = project.items[0];
    const item = { ...base, stage: "complete" as const, ladder: {} };
    expect(forecastOf({ ...item, ladder: { initialEstimate: 100 } })).toBe(100);
    expect(forecastOf({ ...item, ladder: { initialEstimate: 100, designerEstimate: 200 } })).toBe(200);
    expect(forecastOf({ ...item, ladder: { initialEstimate: 100, designerEstimate: 200, quoted: 300 } })).toBe(300);
    expect(forecastOf({ ...item, ladder: { designerEstimate: 200, approved: 250 } })).toBe(250);
    expect(forecastOf({ ...item, ladder: { approved: 250, committed: 240 } })).toBe(240);
  });

  it("costs a not-applicable item at nothing", () => {
    const item = { ...project.items[0], stage: "not-applicable" as const, ladder: { approved: 99999 } };
    expect(forecastOf(item)).toBe(0);
  });

  it("rolls up so the parts sum to the whole", () => {
    const fin = projectFinance(project);
    const sum = project.items.reduce((a, i) => a + forecastOf(i), 0);
    expect(fin.forecast).toBeCloseTo(Math.round(sum), -1);
    expect(fin.paid).toBeLessThanOrEqual(fin.committed);
    expect(fin.contingencyRemaining).toBeLessThanOrEqual(fin.contingency);
  });

  it("erodes the contingency as the forecast passes the budget", () => {
    const fin = projectFinance(project);
    if (fin.forecast > fin.originalBudget) {
      expect(fin.contingencyRemaining).toBeLessThan(fin.contingency);
    }
  });
});

/* --------------------------------------------------------------- workflow */

describe("one object through the whole workflow", () => {
  it("moves the scope item into the BOQ when its decision is approved", () => {
    const decision = project.decisions.find((d) => d.status === "awaiting-owner" && d.recommendedOptionId)!;
    const option = project.options.find((o) => o.id === decision.recommendedOptionId)!;
    const before = project.items.find((i) => i.id === decision.scopeItemId)!;
    expect(before.stage).not.toBe("approved");

    const after = reducer(project, {
      type: "decision/act", id: decision.id, action: "approved", by: "Harsha", optionId: option.id,
    });
    const item = after.items.find((i) => i.id === decision.scopeItemId)!;

    // The same object advanced. It was not re-created anywhere.
    expect(item.id).toBe(before.id);
    expect(item.stage).toBe("approved");
    expect(item.chosenOptionId).toBe(option.id);
    expect(item.ladder.approved).toBe(option.estimate);
    expect(after.items).toHaveLength(project.items.length);
    expect(after.decisions.find((d) => d.id === decision.id)!.status).toBe("approved");
  });

  it("timestamps and keeps every approval", () => {
    const d = project.decisions.find((x) => x.status === "awaiting-owner")!;
    const after = reducer(project, { type: "decision/act", id: d.id, action: "approved", by: "Harsha", note: "ok" });
    const hist = after.decisions.find((x) => x.id === d.id)!.history;
    expect(hist.length).toBe(d.history.length + 1);
    expect(hist.at(-1)!.by).toBe("Harsha");
    expect(hist.at(-1)!.note).toBe("ok");
    expect(Date.parse(hist.at(-1)!.at)).not.toBeNaN();
  });

  it("advances untouched scope to Idea the moment an idea lands on it", () => {
    const target = project.items.find((i) => i.stage === "not-started")!;
    const after = reducer(project, {
      type: "idea/add",
      idea: { id: "x", scopeItemId: target.id, title: "t", attachments: [], createdBy: "me", createdAt: new Date().toISOString() },
    });
    expect(after.items.find((i) => i.id === target.id)!.stage).toBe("idea");
  });

  it("keeps a not-applicable item on the record with its reason", () => {
    const target = project.items[5];
    const after = reducer(project, { type: "item/stage", id: target.id, stage: "not-applicable", naReason: "Not needed" });
    const item = after.items.find((i) => i.id === target.id)!;
    expect(after.items).toHaveLength(project.items.length); // nothing deleted
    expect(item.naReason).toBe("Not needed");
  });
});

/* ------------------------------------------------------------- scenarios */

describe("scenario planning", () => {
  it("never scenarios away money already committed", () => {
    const committed = project.items.find((i) => (i.ladder.committed ?? 0) > 0)!;
    const practical = SCENARIOS.find((s) => s.id === "sc-practical")!;
    expect(scenarioForecast(committed, practical)).toBe(forecastOf(committed));
  });

  it("puts Practical below the designed scheme and No-compromise above it", () => {
    const live = project.items.filter((i) => i.stage !== "not-applicable");
    const total = (id: string) =>
      live.reduce((a, i) => a + scenarioForecast(i, SCENARIOS.find((s) => s.id === id)), 0);
    expect(total("sc-practical")).toBeLessThan(total("sc-premium"));
    expect(total("sc-nocompromise")).toBeGreaterThan(total("sc-premium"));
  });
});

/* ---------------------------------------------------------- completeness */

describe("the completeness engine", () => {
  const gaps = findGaps(project);

  it("finds things nobody has thought about", () => {
    expect(gaps.length).toBeGreaterThan(0);
    for (const g of gaps) {
      expect(g.title).toBeTruthy();
      expect(g.detail).toBeTruthy();
    }
  });

  it("flags the home theatre's unbudgeted acoustic treatment", () => {
    expect(gaps.some((g) => /acoustic/i.test(g.title))).toBe(true);
  });

  it("flags waterproofing that nobody owns", () => {
    expect(gaps.some((g) => /waterproofing responsibility is unassigned/i.test(g.title))).toBe(true);
  });

  it("ranks blockers above nudges", () => {
    const first = gaps.findIndex((g) => g.severity === "blocker");
    const last = gaps.findIndex((g) => g.severity === "nudge");
    if (first >= 0 && last >= 0) expect(first).toBeLessThan(last);
  });

  it("only calls an item long-lead when the money justifies the fuss", () => {
    for (const i of longLeadItems(project)) {
      expect(i.procurement!.leadTimeWeeks!).toBeGreaterThanOrEqual(LONG_LEAD_WEEKS);
      expect(forecastOf(i)).toBeGreaterThanOrEqual(LONG_LEAD_VALUE);
    }
  });
});

/* ---------------------------------------------------------------- search */

describe("search answers questions", () => {
  it("answers how much is being spent on a category", () => {
    const hits = search(project, "how much are we spending on wardrobes?");
    const answer = hits.find((h) => h.kind === "answer");
    expect(answer).toBeDefined();
    expect(answer!.answer).toMatch(/₹/);
  });

  it("answers what is delayed", () => {
    const hits = search(project, "which items are delayed?");
    expect(hits.some((h) => h.kind === "answer" && /late/i.test(h.title))).toBe(true);
  });

  it("answers what payments are due", () => {
    const hits = search(project, "what payments are due this month?");
    const a = hits.find((h) => h.kind === "answer" && /payments due/i.test(h.title));
    expect(a).toBeDefined();
  });

  it("finds a room by name", () => {
    const hits = search(project, "master bathroom");
    expect(hits.some((h) => h.kind === "space" && /master bathroom/i.test(h.title))).toBe(true);
  });

  it("returns nothing for an empty query rather than everything", () => {
    expect(search(project, "   ")).toHaveLength(0);
  });
});

/* -------------------------------------------------------------- content */

describe("seeded project content", () => {
  it("hangs every idea, option and decision off a real scope item", () => {
    const ids = new Set(project.items.map((i) => i.id));
    for (const x of project.ideas) expect(ids.has(x.scopeItemId), `idea ${x.id}`).toBe(true);
    for (const x of project.options) expect(ids.has(x.scopeItemId), `option ${x.id}`).toBe(true);
    for (const x of project.decisions) expect(ids.has(x.scopeItemId), `decision ${x.id}`).toBe(true);
  });

  it("points every snag, task and payment at something that exists", () => {
    const spaces = new Set(project.spaces.map((s) => s.id));
    const vendors = new Set(project.vendors.map((v) => v.id));
    for (const s of project.snags) {
      expect(spaces.has(s.spaceId), `snag ${s.id}`).toBe(true);
      if (s.vendorId) expect(vendors.has(s.vendorId)).toBe(true);
    }
    for (const t of project.tasks) {
      if (t.spaceId) expect(spaces.has(t.spaceId), `task ${t.id} space`).toBe(true);
      if (t.vendorId) expect(vendors.has(t.vendorId), `task ${t.id} vendor`).toBe(true);
      for (const d of t.dependsOn) {
        expect(project.tasks.some((x) => x.id === d), `task ${t.id} depends on missing ${d}`).toBe(true);
      }
    }
    for (const p of project.payments) expect(vendors.has(p.vendorId), `payment ${p.id}`).toBe(true);
  });

  it("shows every stage of the workflow at once, so the whole flow is visible", () => {
    const stages = new Set(project.items.map((i) => i.stage));
    for (const s of ["not-started", "idea", "approved", "ordered", "installed", "complete", "not-applicable"]) {
      expect(stages.has(s as never), `no item is at stage "${s}"`).toBe(true);
    }
  });

  it("flags quotations that are not like-for-like", () => {
    const flagged = project.quotations.filter((q) => q.comparabilityFlags?.length);
    expect(flagged.length).toBeGreaterThan(0);
  });

  it("has open decisions ranked with the most urgent first", () => {
    const open = openDecisions(project);
    expect(open.length).toBeGreaterThan(0);
    expect(open[0].status).not.toBe("approved");
  });

  it("is deterministic — two builds produce the same project", () => {
    const a = buildProject();
    const b = buildProject();
    expect(a.items.length).toBe(b.items.length);
    expect(projectFinance(a).forecast).toBe(projectFinance(b).forecast);
  });
});
