import { describe, it, expect } from "vitest";
import { buildTwin, buildProject } from "@/lib/seed";
import { reducer } from "@/lib/reducer";
import { projectFinance, findGaps } from "@/lib/model/derive";
import { search } from "@/lib/search";

describe("the empty twin", () => {
  const twin = buildTwin();
  it("has the house but nothing that happened in it", () => {
    expect(twin.spaces.map((s) => s.id)).toEqual(buildProject().spaces.map((s) => s.id));
    expect(twin.people).toEqual([]);
    expect(twin.vendors).toEqual([]);
    expect(twin.ideas).toEqual([]);
    expect(twin.decisions).toEqual([]);
    expect(twin.notes).toEqual([]);
    expect(twin.payments).toEqual([]);
    expect(twin.scenarios).toEqual([]);
    expect(twin.meta.originalBudget).toBe(0);
    expect(twin.categories.length).toBeGreaterThan(10);
  });
  it("carries every room's scope checklist at not-started with no money on the ladder", () => {
    expect(twin.items.length).toBeGreaterThan(300);
    expect(twin.items.every((i) => i.stage === "not-started")).toBe(true);
    expect(twin.items.every((i) => Object.keys(i.ladder).length === 0)).toBe(true);
    expect(twin.items.every((i) => i.cost.qty > 0)).toBe(true);
    const ht = twin.spaces.find((s) => /theat/i.test(s.name));
    expect(ht).toBeDefined();
    expect(twin.items.filter((i) => i.spaceId === ht!.id).length).toBeGreaterThan(3);
  });
  it("is deterministic", () => {
    const a = buildTwin(), b = buildTwin();
    expect(a.items).toEqual(b.items);
  });
  it("the derived screens cope with it", () => {
    const fin = projectFinance(twin);
    expect(fin.committed).toBe(0);
    expect(fin.forecast).toBeGreaterThan(0);
    expect(() => findGaps(twin)).not.toThrow();
    expect(() => search(twin, "kitchen")).not.toThrow();
  });
  it("reset defaults to the twin and can load the sample explicitly", () => {
    const s = reducer(buildProject(), { type: "reset" });
    expect(s.people).toEqual([]);
    const sample = reducer(twin, { type: "reset", to: "sample" });
    expect(sample.people.length).toBeGreaterThan(0);
  });
});
