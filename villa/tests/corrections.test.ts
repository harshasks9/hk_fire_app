import { describe, it, expect } from "vitest";
import { buildProject } from "@/lib/seed";
import { SPACES } from "@/lib/seed/spaces";
import { CORRECTIONS, pendingCorrections } from "@/lib/seed/corrections";
import { reducer } from "@/lib/reducer";
import { describe as describeAction } from "@/lib/journal";
import type { ProjectState, Space } from "@/lib/model/types";

/** A project as it would have been saved before any of the corrections. */
function oldProject(): ProjectState {
  const p = buildProject();
  const spaces = p.spaces.map((s): Space => {
    const olds = CORRECTIONS.filter((c) => c.spaceId === s.id);
    let x: Space = { ...s };
    for (const c of olds) {
      const v = c.from[0];
      if (v === null) delete (x as unknown as Record<string, unknown>)[c.field];
      else x = { ...x, [c.field]: v } as Space;
    }
    return x;
  });
  return { ...p, spaces };
}

const apply = (s: ProjectState) =>
  pendingCorrections(s).reduce((st, c) => reducer(st, { type: "space/correct", id: c.id, patch: c.patch, why: c.why }), s);

describe("corrections to the villa model", () => {
  it("has nothing to do for a project seeded today", () => {
    expect(pendingCorrections(buildProject())).toEqual([]);
  });

  it("brings a project saved before the fixes up to the current seed", () => {
    const fixed = apply(oldProject());
    const seed = new Map(SPACES.map((s) => [s.id, s]));
    for (const c of CORRECTIONS) {
      const sp = fixed.spaces.find((x) => x.id === c.spaceId)!;
      expect(sp[c.field as keyof Space], `${c.spaceId}.${c.field}`).toEqual(seed.get(c.spaceId)![c.field as keyof Space]);
    }
  });

  it("corrects the compass words, the kitchen and the office", () => {
    const fixed = apply(oldProject());
    const by = (id: string) => fixed.spaces.find((s) => s.id === id)!;
    expect(by("ff-master").note).toMatch(/South-west/);
    expect(by("out-entrance").note).toMatch(/east road/);
    expect(by("out-side-garden-east").name).toBe("Side garden — north");
    expect(by("gf-wet-kitchen").parentId).toBe("gf-kitchen");
    expect(by("sf-bed5").name).toBe("Home office");
    expect(by("sf-powder").dims).toMatchObject({ widthFt: 6, widthIn: 3 });
  });

  it("never overwrites a field someone has edited", () => {
    const p = oldProject();
    const edited = { ...p, spaces: p.spaces.map((s) => (s.id === "ff-master" ? { ...s, note: "Our room. Morning tea on the sit-out." } : s)) };
    const fixed = apply(edited);
    expect(fixed.spaces.find((s) => s.id === "ff-master")!.note).toBe("Our room. Morning tea on the sit-out.");
  });

  it("leaves re-measured dimensions alone", () => {
    const p = oldProject();
    const measured = { ...p, spaces: p.spaces.map((s) => (s.id === "sf-powder" ? { ...s, dims: { ...s.dims!, source: "site-measured" as const } } : s)) };
    expect(pendingCorrections(measured).find((c) => c.id === "sf-powder")?.patch.dims).toBeUndefined();
  });

  it("is idempotent: applied once, nothing is left pending", () => {
    const once = apply(oldProject());
    expect(pendingCorrections(once)).toEqual([]);
    expect(apply(once)).toEqual(once);
  });

  it("groups each room's fixes into one change, with its reason", () => {
    const pend = pendingCorrections(oldProject());
    const ids = pend.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const office = pend.find((c) => c.id === "sf-bed5")!;
    expect(Object.keys(office.patch).sort()).toEqual(["name", "note"]);
    expect(office.why).toMatch(/home office/);
  });

  it("records each correction in the history with its reason", () => {
    const p = oldProject();
    const c = pendingCorrections(p).find((x) => x.id === "ff-master")!;
    const { summary } = describeAction(p, { type: "space/correct", id: c.id, patch: c.patch, why: c.why });
    expect(summary).toMatch(/^Corrected “Master bedroom” in the villa model — the road is to the east/);
  });

  it("only names rooms that exist, and only replaces values the seed no longer holds", () => {
    const seed = new Map(SPACES.map((s) => [s.id, s]));
    for (const c of CORRECTIONS) {
      expect(seed.has(c.spaceId), c.spaceId).toBe(true);
      const now = seed.get(c.spaceId)![c.field as keyof Space];
      for (const v of c.from) expect(JSON.stringify(v ?? undefined)).not.toBe(JSON.stringify(now));
    }
  });
});
