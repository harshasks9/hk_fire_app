import { describe, it, expect } from "vitest";
import { buildProject } from "@/lib/seed";
import { reducer, COLLECTION_KEYS, type CollectionKey } from "@/lib/store";
import { SCHEMAS, readField, writeField } from "@/lib/model/schema";
import type { ProjectState } from "@/lib/model/types";

const base = buildProject();

/** Every id referenced anywhere must still exist. */
function danglingRefs(s: ProjectState): string[] {
  const bad: string[] = [];
  const spaces = new Set(s.spaces.map((x) => x.id));
  const items = new Set(s.items.map((x) => x.id));
  const vendors = new Set(s.vendors.map((x) => x.id));
  const tasks = new Set(s.tasks.map((x) => x.id));
  const options = new Set(s.options.map((x) => x.id));
  const decisions = new Set(s.decisions.map((x) => x.id));

  const ck = (ok: boolean, what: string) => { if (!ok) bad.push(what); };

  for (const i of s.items) {
    if (i.spaceId) ck(spaces.has(i.spaceId), `item ${i.id} -> space ${i.spaceId}`);
    if (i.vendorId) ck(vendors.has(i.vendorId), `item ${i.id} -> vendor ${i.vendorId}`);
    if (i.chosenOptionId) ck(options.has(i.chosenOptionId), `item ${i.id} -> option ${i.chosenOptionId}`);
  }
  for (const x of s.ideas) ck(items.has(x.scopeItemId), `idea ${x.id} -> item`);
  for (const x of s.options) ck(items.has(x.scopeItemId), `option ${x.id} -> item`);
  for (const d of s.decisions) {
    ck(items.has(d.scopeItemId), `decision ${d.id} -> item`);
    if (d.recommendedOptionId) ck(options.has(d.recommendedOptionId), `decision ${d.id} -> option`);
    for (const o of d.alternativeOptionIds) ck(options.has(o), `decision ${d.id} -> alt option ${o}`);
  }
  for (const t of s.tasks) {
    if (t.spaceId) ck(spaces.has(t.spaceId), `task ${t.id} -> space`);
    if (t.scopeItemId) ck(items.has(t.scopeItemId), `task ${t.id} -> item`);
    if (t.vendorId) ck(vendors.has(t.vendorId), `task ${t.id} -> vendor`);
    for (const d of t.dependsOn) ck(tasks.has(d), `task ${t.id} -> dep ${d}`);
  }
  for (const x of s.snags) {
    ck(spaces.has(x.spaceId), `snag ${x.id} -> space`);
    if (x.vendorId) ck(vendors.has(x.vendorId), `snag ${x.id} -> vendor`);
    if (x.scopeItemId) ck(items.has(x.scopeItemId), `snag ${x.id} -> item`);
  }
  for (const u of s.siteUpdates) ck(spaces.has(u.spaceId), `site update ${u.id} -> space`);
  for (const n of s.notes) {
    for (const x of n.spaceIds) ck(spaces.has(x), `note ${n.id} -> space ${x}`);
    for (const x of n.scopeItemIds) ck(items.has(x), `note ${n.id} -> item ${x}`);
    for (const x of n.vendorIds) ck(vendors.has(x), `note ${n.id} -> vendor ${x}`);
    for (const x of n.decisionIds) ck(decisions.has(x), `note ${n.id} -> decision ${x}`);
    for (const x of n.taskIds) ck(tasks.has(x), `note ${n.id} -> task ${x}`);
  }
  for (const d of s.docs) {
    for (const x of d.spaceIds) ck(spaces.has(x), `doc ${d.id} -> space ${x}`);
    for (const x of d.scopeItemIds) ck(items.has(x), `doc ${d.id} -> item ${x}`);
    if (d.vendorId) ck(vendors.has(d.vendorId), `doc ${d.id} -> vendor`);
  }
  for (const p of s.payments) {
    ck(vendors.has(p.vendorId), `payment ${p.id} -> vendor`);
    for (const x of p.scopeItemIds) ck(items.has(x), `payment ${p.id} -> item ${x}`);
  }
  for (const q of s.quotations) {
    ck(vendors.has(q.vendorId), `quote ${q.id} -> vendor`);
    for (const x of q.scopeItemIds) ck(items.has(x), `quote ${q.id} -> item ${x}`);
  }
  return bad;
}

describe("the seeded project starts sound", () => {
  it("has no dangling references", () => {
    expect(danglingRefs(base)).toEqual([]);
  });
});

describe("every collection is fully editable", () => {
  it("has a schema for each collection the store knows about", () => {
    for (const k of COLLECTION_KEYS) {
      expect(SCHEMAS[k], `no schema for "${k}"`).toBeDefined();
      expect(SCHEMAS[k].fields.length, `schema "${k}" has no fields`).toBeGreaterThan(0);
      expect(SCHEMAS[k].fields.some((f) => f.inTable), `schema "${k}" shows no columns`).toBe(true);
    }
  });

  it("supports create, update and delete on every collection", () => {
    for (const k of COLLECTION_KEYS) {
      const schema = SCHEMAS[k];
      const row = schema.blank({ id: `test-${k}`, me: "Tester", state: base, spaceId: base.spaces[0].id });

      const created = reducer(base, { type: "create", on: k, row } as never);
      const list = () => (created[k] as unknown as { id: string }[]);
      expect(list().length, `create failed on ${k}`).toBe((base[k] as unknown[]).length + 1);
      expect(list().some((r) => r.id === `test-${k}`)).toBe(true);

      const field = schema.fields.find((f) => f.type === "text" && !f.key.includes("."))!;
      const updated = reducer(created, {
        type: "update", on: k, id: `test-${k}`, patch: { [field.key]: "Edited" },
      } as never);
      const found = (updated[k] as unknown as Record<string, unknown>[]).find((r) => r.id === `test-${k}`)!;
      expect(readField(found, field.key), `update failed on ${k}.${field.key}`).toBe("Edited");

      const removed = reducer(updated, { type: "remove", on: k, id: `test-${k}` });
      expect((removed[k] as unknown[]).length, `delete failed on ${k}`).toBe((base[k] as unknown[]).length);
    }
  });

  it("exposes every model field that a person could reasonably need to change", () => {
    // The fields most likely to be forgotten, per collection.
    const mustHave: Partial<Record<CollectionKey, string[]>> = {
      spaces: ["name", "floor", "kind", "dims.widthFt", "dims.source"],
      items: ["title", "spaceId", "category", "stage", "spec", "owner", "vendorId",
        "cost.qty", "cost.rate", "cost.taxPct", "ladder.approved", "ladder.paid"],
      vendors: ["name", "trade", "rating", "notes"],
      quotations: ["vendorId", "total", "inclusions", "exclusions", "comparabilityFlags"],
      tasks: ["title", "owner", "status", "finish", "dependsOn"],
      snags: ["title", "spaceId", "severity", "status", "vendorId"],
      payments: ["vendorId", "amount", "dueOn", "paidOn"],
      decisions: ["title", "status", "decideBy", "costDeltaVsBudget"],
      docs: ["title", "kind", "revision"],
      notes: ["title", "body", "kind"],
    };
    for (const [k, keys] of Object.entries(mustHave)) {
      const present = new Set(SCHEMAS[k as CollectionKey].fields.map((f) => f.key));
      for (const key of keys!) {
        expect(present.has(key), `${k} is missing an editor for "${key}"`).toBe(true);
      }
    }
  });
});

describe("deleting never leaves a dangling reference", () => {
  it("holds when a vendor with awarded scope is deleted", () => {
    const vendor = base.vendors.find((v) => base.items.some((i) => i.vendorId === v.id))!;
    const after = reducer(base, { type: "remove", on: "vendors", id: vendor.id });
    expect(after.vendors.some((v) => v.id === vendor.id)).toBe(false);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("holds when a scope item carrying a decision is deleted", () => {
    const d = base.decisions[0];
    const after = reducer(base, { type: "remove", on: "items", id: d.scopeItemId });
    expect(after.decisions.some((x) => x.id === d.id)).toBe(false);
    expect(after.ideas.some((x) => x.scopeItemId === d.scopeItemId)).toBe(false);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("holds when an option someone already chose is deleted", () => {
    const approved = reducer(base, {
      type: "decision/act", id: base.decisions[0].id, action: "approved", by: "Harsha",
      optionId: base.decisions[0].recommendedOptionId,
    });
    const optId = base.decisions[0].recommendedOptionId!;
    expect(approved.items.find((i) => i.chosenOptionId === optId)).toBeDefined();
    const after = reducer(approved, { type: "remove", on: "options", id: optId });
    expect(after.items.some((i) => i.chosenOptionId === optId)).toBe(false);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("holds when a task other tasks depend on is deleted", () => {
    const dep = base.tasks.find((t) => base.tasks.some((x) => x.dependsOn.includes(t.id)))!;
    const after = reducer(base, { type: "remove", on: "tasks", id: dep.id });
    expect(after.tasks.some((t) => t.dependsOn.includes(dep.id))).toBe(false);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("holds for every collection, deleting the first row of each", () => {
    for (const k of COLLECTION_KEYS) {
      const rows = base[k] as unknown as { id: string }[];
      if (!rows.length) continue;
      const after = k === "spaces"
        ? reducer(base, { type: "space/delete", id: rows[0].id, withItems: true })
        : reducer(base, { type: "remove", on: k, id: rows[0].id });
      expect(danglingRefs(after), `deleting a ${k} row left dangling references`).toEqual([]);
    }
  });
});

describe("spaces", () => {
  const space = base.spaces.find((s) => base.items.some((i) => i.spaceId === s.id))!;

  it("deletes its scope items when asked to", () => {
    const n = base.items.filter((i) => i.spaceId === space.id).length;
    const after = reducer(base, { type: "space/delete", id: space.id, withItems: true });
    expect(after.items.length).toBe(base.items.length - n);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("keeps the scope as house-wide when asked to", () => {
    const n = base.items.filter((i) => i.spaceId === space.id).length;
    const after = reducer(base, { type: "space/delete", id: space.id, withItems: false });
    expect(after.items.length).toBe(base.items.length);
    expect(after.items.filter((i) => !i.spaceId).length)
      .toBe(base.items.filter((i) => !i.spaceId).length + n);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("combines one space into another without losing anything", () => {
    const into = base.spaces.find((s) => s.id !== space.id)!;
    const before = base.items.filter((i) => i.spaceId === space.id || i.spaceId === into.id).length;
    const after = reducer(base, { type: "space/merge", fromId: space.id, intoId: into.id });
    expect(after.spaces.some((s) => s.id === space.id)).toBe(false);
    expect(after.items.length).toBe(base.items.length);
    expect(after.items.filter((i) => i.spaceId === into.id).length).toBe(before);
    expect(danglingRefs(after)).toEqual([]);
  });

  it("refuses to merge a space into itself", () => {
    const after = reducer(base, { type: "space/merge", fromId: space.id, intoId: space.id });
    expect(after.spaces.length).toBe(base.spaces.length);
  });
});

describe("project settings are editable", () => {
  it("changes the budget everything else is measured against", () => {
    const after = reducer(base, { type: "meta/patch", patch: { originalBudget: 12345678 } });
    expect(after.meta.originalBudget).toBe(12345678);
    expect(after.meta.name).toBe(base.meta.name);
  });
});

describe("nested field writes", () => {
  it("writes a nested key without mutating the original", () => {
    const row = { id: "x", cost: { qty: 1, rate: 2 } };
    const next = writeField(row, "cost.rate", 99);
    expect(readField(next, "cost.rate")).toBe(99);
    expect(readField(row, "cost.rate")).toBe(2);
    expect(readField(next, "cost.qty")).toBe(1);
  });

  it("creates the parent object when it is missing", () => {
    const next = writeField({ id: "x" }, "dims.widthFt", 12);
    expect(readField(next, "dims.widthFt")).toBe(12);
  });
});
