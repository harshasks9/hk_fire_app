import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DESIGNS, NO_LAYOUT, designFor, layoutById, recommendedOf } from "@/lib/design";
import { frameFor, frameOf } from "@/lib/design/frame";
import { problems } from "@/lib/design/validate";
import { roomLens } from "@/lib/model/lens";
import { SPACES } from "@/lib/seed/spaces";
import { buildProject } from "@/lib/seed";
import { reducer } from "@/lib/reducer";
import { describe as describeAction } from "@/lib/journal";
import { RoomLayout } from "@/components/RoomLayout";
import type { Layout, RoomDesign } from "@/lib/design/types";

const all = DESIGNS.flatMap((d) => d.layouts.map((l) => ({ d, l })));

describe("room layouts — the design data", () => {
  it("covers every principal room in the villa", () => {
    const principal = SPACES.filter((s) =>
      ["bedroom", "master-bedroom", "living", "drawing", "dining", "family-lounge", "kitchen", "home-theatre",
        "puja", "foyer", "maid-room", "laundry", "terrace", "balcony", "deck"].includes(s.kind) && s.floor !== undefined);
    for (const s of principal) {
      if (s.id === "ff-foyer-void") continue; // the void over the foyer is designed with the foyer
      expect(designFor(s.id), `${s.id} has no layouts`).toBeTruthy();
    }
  });

  it("accounts for every bathroom, walk-in and powder room: layouts, or a reason for none", () => {
    for (const s of SPACES.filter((x) => ["bathroom", "wic", "powder", "utility"].includes(x.kind))) {
      expect(!!designFor(s.id) || !!NO_LAYOUT[s.id], `${s.id} has neither layouts nor a reason`).toBe(true);
    }
    for (const id of Object.keys(NO_LAYOUT)) {
      expect(SPACES.some((s) => s.id === id)).toBe(true);
      expect(designFor(id), `${id} is both laid out and excused`).toBeUndefined();
    }
  });

  it("gives every room two or three options, keyed A, B, C, with exactly one recommended", () => {
    for (const d of DESIGNS) {
      expect(d.layouts.length, d.spaceId).toBeGreaterThanOrEqual(2);
      expect(d.layouts.length).toBeLessThanOrEqual(3);
      expect(d.layouts.map((l) => l.key)).toEqual(["A", "B", "C"].slice(0, d.layouts.length));
      expect(d.layouts.filter((l) => l.recommended).length, d.spaceId).toBe(1);
      for (const l of d.layouts) expect(l.id).toBe(`${d.spaceId}:${l.key}`);
    }
  });

  it("explains every option: an idea, what it's good at, what it costs you", () => {
    for (const { l } of all) {
      expect(l.idea.length, l.id).toBeGreaterThan(20);
      expect(l.pros.length, l.id).toBeGreaterThan(0);
      expect(l.cons.length, l.id).toBeGreaterThan(0);
      if (l.key === "A") expect(l.costDelta ?? 0).toBe(0);
    }
  });

  it("puts every room on the real plan geometry", () => {
    for (const d of DESIGNS) {
      const f = frameOf(d);
      expect(f.W).toBeGreaterThan(900);
      expect(f.H).toBeGreaterThan(700);
    }
  });

  it("the one-room kitchen is drawn as one room, without the old dividing door", () => {
    const k = designFor("gf-wet-kitchen")!;
    expect(k.spaceId).toBe("gf-kitchen");
    const f = frameOf(k);
    expect(f.W).toBeGreaterThan(6000);
    expect(f.openings.filter((o) => o.kind === "door")).toHaveLength(1);
  });

  it.each(all.map(({ d, l }) => [l.id, d, l] as const))("%s fits: inside the room, nothing overlapping, no door or window blocked", (_id, d, l) => {
    expect(problems(frameFor(d as RoomDesign, l as Layout), l as Layout)).toEqual([]);
  });
});

describe("the layout checks catch real mistakes", () => {
  const office = designFor("sf-bed5")!;
  const living = designFor("gf-living")!;
  const withPiece = (d: RoomDesign, p: object) => {
    const l = d.layouts[0];
    return problems(frameFor(d, l), { ...l, pieces: [...l.pieces, p as never] });
  };

  it("a wardrobe in front of a window", () => {
    expect(withPiece(office, { kind: "wardrobe", x: 2000, y: 3149, w: 1200, d: 600, tall: true, label: "W" }).join()).toMatch(/in front of the window/);
  });
  it("a sofa across an arch", () => {
    expect(withPiece(living, { kind: "sofa", x: 100, y: 2500, w: 900, d: 1500, label: "S" }).join()).toMatch(/blocks the arch/);
  });
  it("a piece through the wall", () => {
    expect(withPiece(living, { kind: "desk", x: 5000, y: 100, w: 800, d: 600, label: "D" }).join()).toMatch(/outside the room/);
  });
  it("furniture in a door's swing, assumed or drawn", () => {
    expect(withPiece(office, { kind: "armchair", x: 4700, y: 100, w: 700, d: 700, label: "C" }).join()).toMatch(/blocks the assumed door/);
  });
  it("a terrace slider nobody can walk through", () => {
    expect(withPiece(office, { kind: "sideboard", x: 5130, y: 600, w: 600, d: 2600, label: "B" }).join()).toMatch(/clear way through the slider/);
  });
});

describe("choosing a layout, and notes on it", () => {
  it("records the choice on the room, in the history, and can be undone", () => {
    const p = buildProject();
    const l = layoutById("gf-living:B")!;
    const a = { type: "space/layout", id: "gf-living", layoutId: l.id, name: l.name } as const;
    const next = reducer(p, a);
    expect(next.spaces.find((s) => s.id === "gf-living")!.layoutId).toBe("gf-living:B");
    expect(describeAction(p, a).summary).toBe(`Chose layout B for “Main living room” — ${l.name}`);
    const cleared = reducer(next, { type: "space/layout", id: "gf-living" });
    expect(cleared.spaces.find((s) => s.id === "gf-living")!.layoutId).toBeUndefined();
    expect(describeAction(next, { type: "space/layout", id: "gf-living" }).summary).toMatch(/^Cleared the chosen layout/);
  });

  it("keeps a note's layout tag through an edit", () => {
    const p = buildProject();
    const row = { id: "n-test", title: "Too tight", body: "Too tight by the sideboard", kind: "idea" as const, at: new Date().toISOString(),
      author: "Harsha", spaceIds: ["gf-dining"], scopeItemIds: [], vendorIds: [], decisionIds: [], taskIds: [], layoutIds: ["gf-dining:A"] };
    const added = reducer(p, { type: "create", on: "notes", row });
    const edited = reducer(added, { type: "update", on: "notes", id: "n-test", patch: { body: "Fine once extended" } });
    const n = edited.notes.find((x) => x.id === "n-test")!;
    expect(n.layoutIds).toEqual(["gf-dining:A"]);
    expect(n.body).toBe("Fine once extended");
  });
});

describe("the contractor lens", () => {
  const p = buildProject();
  const withPerson = (spaceIds?: string[]) => ({
    ...p, people: [...p.people, { id: "c1", name: "Ravi", role: "vendor" as const, spaceIds }],
  });

  it("shows everything to the family and the designer", () => {
    const see = roomLens(withPerson(["gf-kitchen"]), "homeowner", "c1");
    expect(see("gf-living")).toBe(true);
  });
  it("shows a contractor with no rooms assigned the whole villa", () => {
    expect(roomLens(withPerson([]), "vendor", "c1")("gf-living")).toBe(true);
  });
  it("limits a contractor to their rooms, and the rooms that belong to them", () => {
    const see = roomLens(withPerson(["gf-kitchen"]), "vendor", "c1");
    expect(see("gf-kitchen")).toBe(true);
    expect(see("gf-wet-kitchen")).toBe(true);
    expect(see("gf-living")).toBe(false);
  });
});

describe("drawing every layout", () => {
  it.each(all.map(({ d, l }) => [l.id, d, l] as const))("%s renders to an SVG with its pieces", (_id, d, l) => {
    const html = renderToStaticMarkup(React.createElement(RoomLayout, { design: d as RoomDesign, layout: l as Layout }));
    expect(html.startsWith("<svg")).toBe(true);
    expect((html.match(/<title>/g) ?? []).length).toBe((l as Layout).pieces.length);
  });
  it("marks the recommended option, and a merged room points at its host", () => {
    expect(recommendedOf(designFor("gf-kitchen")!).key).toBe("C");
  });
});
