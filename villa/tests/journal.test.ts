import { describe, it, expect } from "vitest";
import { buildProject } from "@/lib/seed";
import { reducer, emptyProject } from "@/lib/store";
import { newJournal, append, describe as describeAction, stateAt, JOURNAL_CAP, JOURNAL_FOLD, EPOCH_ACTIONS } from "@/lib/journal";
import type { Action } from "@/lib/store";

const base = buildProject();
const rev = (j: ReturnType<typeof newJournal>, a: Action, by = "Tester") => {
  const before = stateAt(j, j.revisions.at(-1)?.v ?? 0);
  const { summary, touches } = describeAction(before, a);
  return append(j, { at: new Date().toISOString(), by, action: a, summary, touches });
};

describe("the journal", () => {
  it("numbers revisions contiguously from one", () => {
    let j = newJournal(base);
    const item = base.items[0];
    j = rev(j, { type: "item/stage", id: item.id, stage: "idea" });
    j = rev(j, { type: "item/stage", id: item.id, stage: "options" });
    j = rev(j, { type: "item/stage", id: item.id, stage: "estimated" });
    expect(j.revisions.map((r) => r.v)).toEqual([1, 2, 3]);
  });

  it("reconstructs any past version exactly by replaying from the base", () => {
    let j = newJournal(base);
    const item = base.items.find((i) => i.stage === "not-started")!;
    j = rev(j, { type: "item/stage", id: item.id, stage: "idea" });
    j = rev(j, { type: "item/cost", id: item.id, cost: { rate: 4242 } });
    j = rev(j, { type: "item/stage", id: item.id, stage: "approved" });

    const at0 = stateAt(j, 0), at1 = stateAt(j, 1), at2 = stateAt(j, 2), at3 = stateAt(j, 3);
    const of = (s: typeof base) => s.items.find((i) => i.id === item.id)!;
    expect(of(at0).stage).toBe("not-started");
    expect(of(at1).stage).toBe("idea");
    expect(of(at2).cost.rate).toBe(4242);
    expect(of(at2).stage).toBe("idea");
    expect(of(at3).stage).toBe("approved");
    // and the live state is what the reducer would have produced directly
    const direct = [
      { type: "item/stage", id: item.id, stage: "idea" },
      { type: "item/cost", id: item.id, cost: { rate: 4242 } },
      { type: "item/stage", id: item.id, stage: "approved" },
    ].reduce((s, a) => reducer(s, a as Action), base);
    expect(JSON.stringify(at3)).toBe(JSON.stringify(direct));
  });

  it("records who made each change", () => {
    let j = newJournal(base);
    j = rev(j, { type: "item/stage", id: base.items[0].id, stage: "idea" }, "Ananya Rao");
    j = rev(j, { type: "item/stage", id: base.items[0].id, stage: "options" }, "Harsha");
    expect(j.revisions.map((r) => r.by)).toEqual(["Ananya Rao", "Harsha"]);
  });

  it("folds old history into the base once it grows past the cap, without losing state", () => {
    let j = newJournal(base);
    const item = base.items[0];
    const n = JOURNAL_CAP + 10;
    for (let k = 0; k < n; k++) {
      j = append(j, { at: "", by: "t", action: { type: "item/cost", id: item.id, cost: { rate: k } }, summary: "", touches: {} });
    }
    expect(j.revisions.length).toBe(n - JOURNAL_FOLD);
    // the folded-away changes are baked into the base
    expect(j.base.items.find((i) => i.id === item.id)!.cost.rate).toBe(JOURNAL_FOLD - 1);
    // and the head is still right
    expect(stateAt(j, j.revisions.at(-1)!.v).items.find((i) => i.id === item.id)!.cost.rate).toBe(n - 1);
  });

  it("treats a wipe, reset or import as a new beginning", () => {
    expect(EPOCH_ACTIONS.has("data/clear")).toBe(true);
    expect(EPOCH_ACTIONS.has("reset")).toBe(true);
    expect(EPOCH_ACTIONS.has("data/import")).toBe(true);
    expect(EPOCH_ACTIONS.has("item/stage")).toBe(false);
  });
});

describe("change summaries read like something a person wrote", () => {
  const item = base.items.find((i) => i.spaceId === "ff-master" && /flooring/i.test(i.title))!;

  it("names the room and the item when a stage moves", () => {
    const { summary, touches } = describeAction(base, { type: "item/stage", id: item.id, stage: "approved" });
    expect(summary).toMatch(/Master bedroom › Flooring/);
    expect(summary).toMatch(/to Approved/);
    expect(touches.spaceId).toBe("ff-master");
    expect(touches.itemId).toBe(item.id);
  });

  it("quotes the old and new value when a rate changes, in rupees", () => {
    const { summary } = describeAction(base, { type: "item/cost", id: item.id, cost: { rate: 999 } });
    expect(summary).toMatch(/rate: ₹\d[\d,]* → ₹999/);
  });

  it("says who approved what, and which option", () => {
    const d = base.decisions.find((x) => x.recommendedOptionId)!;
    const { summary } = describeAction(base, { type: "decision/act", id: d.id, action: "approved", by: "Harsha", optionId: d.recommendedOptionId });
    expect(summary).toMatch(/^Approved “/);
    expect(summary).toContain(d.title);
    const opt = base.options.find((o) => o.id === d.recommendedOptionId)!;
    expect(summary).toContain(opt.headline);
  });

  it("describes a deletion by what was deleted, not by its id", () => {
    const v = base.vendors[0];
    const { summary } = describeAction(base, { type: "remove", on: "vendors", id: v.id });
    expect(summary).toBe(`Deleted vendor “${v.name}”`);
  });

  it("lists only the fields that actually changed on an edit", () => {
    const sp = base.spaces[0];
    const { summary } = describeAction(base, { type: "update", on: "spaces", id: sp.id, patch: { name: sp.name, note: "new note" } });
    expect(summary).toContain("note:");
    expect(summary).not.toContain("name:");
  });

  it("marks not-applicable with its reason", () => {
    const { summary } = describeAction(base, { type: "item/stage", id: item.id, stage: "not-applicable", naReason: "Carpet instead" });
    expect(summary).toMatch(/not applicable — Carpet instead/);
  });

  it("copes with an empty project", () => {
    const empty = emptyProject(base, { categories: true });
    expect(() => describeAction(empty, { type: "meta/patch", patch: { name: "X" } })).not.toThrow();
  });
});
