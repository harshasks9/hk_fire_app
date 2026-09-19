import { describe, it, expect, beforeAll } from "vitest";
import { buildTwin, buildProject } from "@/lib/seed";
import { resetDbForTests } from "@/lib/db";
import { init, head, submit, revisions, stateAt } from "@/lib/server/project";
import { reducer, type Action } from "@/lib/reducer";
import { describe as describeAction } from "@/lib/journal";

process.env.PGLITE_MEMORY = "1";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;

const send = async (base: number, action: Action, by = "Tester") => {
  const h = (await head())!;
  const { summary, touches } = describeAction(h.state, action);
  return submit({ base, action, by, summary, touches });
};

describe("server project store", () => {
  beforeAll(() => resetDbForTests());

  it("starts empty, then adopts the first client's state as version 0", async () => {
    expect(await head()).toBeNull();
    const h = await init(buildTwin());
    expect(h.version).toBe(0);
    expect(h.state.people).toEqual([]);
    expect(h.state.spaces.length).toBeGreaterThan(50);
    // init is idempotent
    const again = await init(buildProject());
    expect(again.version).toBe(0);
    expect(again.state.people).toEqual([]);
  });

  it("applies an action with the same reducer the browser used, and bumps the version", async () => {
    const h = (await head())!;
    const item = h.state.items[0];
    const a: Action = { type: "item/cost", id: item.id, cost: { rate: 999 } };
    const r = await send(0, a);
    expect(r.ok).toBe(true);
    const h2 = (await head())!;
    expect(h2.version).toBe(1);
    expect(h2.state.items[0].cost.rate).toBe(999);
    expect(h2.state).toEqual(reducer(h.state, a));
  });

  it("refuses a stale base and hands back the current head", async () => {
    const item = (await head())!.state.items[1];
    const r = await send(0, { type: "item/cost", id: item.id, cost: { rate: 5 } });
    expect(r.ok).toBe(false);
    if (r.ok || !r.conflict) throw new Error("expected conflict");
    expect(r.head.version).toBe(1);
    expect((await head())!.version).toBe(1);
  });

  it("records who did what, filterable by item", async () => {
    const item = (await head())!.state.items[2];
    await send(1, { type: "item/patch", id: item.id, patch: { title: "Renamed" } }, "Meera");
    const all = await revisions();
    expect(all.map((r) => r.v)).toEqual([2, 1]);
    expect(all[0].by).toBe("Meera");
    expect(all[0].summary).toMatch(/Renamed/);
    const mine = await revisions({ itemId: item.id });
    expect(mine.length).toBe(1);
    expect(mine[0].v).toBe(2);
  });

  it("reconstructs any past version from checkpoints plus replay", async () => {
    const h = (await head())!;
    const item = h.state.items[0];
    for (let v = h.version; v < 60; v++) {
      const r = await send(v, { type: "item/cost", id: item.id, cost: { rate: 1000 + v } });
      expect(r.ok).toBe(true);
    }
    expect((await head())!.version).toBe(60);
    const at30 = await stateAt(30);
    expect(at30!.items[0].cost.rate).toBe(1000 + 29);
    const at0 = await stateAt(0);
    expect(at0!.items[0].cost.rate).not.toBe(999);
    expect(at0!.items[0].cost.rate).toBe(buildTwin().items[0].cost.rate);
    const at1 = await stateAt(1);
    expect(at1!.items[0].cost.rate).toBe(999);
  });

  it("stores an import as a checkpoint, and a wipe is recomputed server-side", async () => {
    const sample = buildProject();
    const r = await send(60, { type: "data/import", state: sample }, "Owner");
    expect(r.ok).toBe(true);
    expect((await head())!.state.people.length).toBe(sample.people.length);
    expect((await stateAt(61))!.people.length).toBe(sample.people.length);
    expect((await stateAt(60))!.people.length).toBe(0);
    const w = await send(61, { type: "data/clear", keep: { categories: true } });
    expect(w.ok).toBe(true);
    const h = (await head())!;
    expect(h.state.items).toEqual([]);
    expect(h.state.categories.length).toBeGreaterThan(10);
    const list = await revisions({ limit: 2 });
    expect(list[0].action.type).toBe("data/clear");
    expect(list[1].action.type).toBe("data/import");
    // the import payload is not duplicated into the revision row
    expect((list[1].action as { state?: unknown }).state).toBeUndefined();
  });
});
