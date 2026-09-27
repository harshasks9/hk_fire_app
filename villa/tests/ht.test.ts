import { describe, expect, it } from "vitest";
import {
  H, ROOM, SCREEN, RISER, PROJECTOR, MARKERS, sightline, throwRatio, lensShift, elevation, axialModes, projectorStudy, beamBottomAt, ROWS, SEATED, ceilingImpact,
} from "@/lib/ht/geometry";
import { CATALOG, recommended, systemTotal, formatINR, byId } from "@/lib/ht/catalog";
import { RACK, RACK_U, rackPower, AUDIO_FLOW, VIDEO_FLOW, SCENARIOS, procurementGroups, LOW_RETURN, EVALUATOR_REBALANCE } from "@/lib/ht/system";

describe("room geometry after the 8-inch ceiling drop", () => {
  it("drops the finished ceiling by 203 mm", () => {
    expect(ROOM.ceilingBefore - H).toBeCloseTo(0.2032, 4);
    expect(H).toBeCloseTo(2.547, 3);
  });

  it("keeps the picture clear of the ceiling with room for a border", () => {
    expect(H - SCREEN.top).toBeGreaterThan(0.12);
  });

  it("row 2 still sees the bottom of the picture over row 1, and the riser change is what restores it", () => {
    const now = sightline();
    const lowered = sightline(SCREEN.bottom, RISER.heightBefore);
    expect(now.clearance).toBeGreaterThan(0.05);
    expect(now.clearance).toBeGreaterThan(lowered.clearance);
  });

  it("puts the projector inside the JVC zoom and lens-shift range", () => {
    expect(throwRatio()).toBeGreaterThanOrEqual(PROJECTOR.throwRange[0]);
    expect(throwRatio()).toBeLessThanOrEqual(PROJECTOR.throwRange[1]);
    expect(lensShift()).toBeLessThanOrEqual(PROJECTOR.verticalShiftMax);
  });

  it("keeps the beam above seated row-2 heads, and shows why the mid-room mount no longer works", () => {
    expect(beamBottomAt(ROWS[1].earX)).toBeGreaterThan(RISER.height + SEATED.headTop);
    expect(projectorStudy().midRoom.headroom).toBeLessThan(0);
  });

  it("gives row 1 Dolby-range angles for the front and rear overheads", () => {
    const tf = MARKERS.find((m) => m.id === "Ltf")!;
    const tr = MARKERS.find((m) => m.id === "Ltr")!;
    expect(elevation(tf, 0).deg).toBeGreaterThanOrEqual(30);
    expect(elevation(tf, 0).deg).toBeLessThanOrEqual(55);
    expect(elevation(tf, 0).where).toBe("ahead");
    expect(elevation(tr, 0).where).toBe("behind");
  });

  it("raises the height mode as the ceiling comes down", () => {
    expect(axialModes(H, 1)[0]).toBeGreaterThan(axialModes(ROOM.ceilingBefore, 1)[0]);
    expect(ceilingImpact().length).toBeGreaterThanOrEqual(10);
  });
});

describe("the catalogue", () => {
  it("has exactly one recommended option per component and at least one alternative", () => {
    for (const c of CATALOG) {
      expect(c.options.filter((o) => o.tier === "recommended")).toHaveLength(1);
      expect(c.options.filter((o) => o.tier !== "recommended").length).toBeGreaterThan(0);
      expect(c.review.headline.length).toBeGreaterThan(10);
    }
  });

  it("covers every part of the system the brief lists", () => {
    for (const id of ["lcr", "sides", "rears", "atmos", "subs", "projector", "screen", "avr", "amps", "streamer", "roomcorr", "mic", "ups", "rack", "cabling"]) {
      expect(byId(id)).toBeTruthy();
    }
  });

  it("does not simply agree with itself", () => {
    expect(CATALOG.some((c) => c.review.verdict === "disagree")).toBe(true);
  });

  it("gives every threshold import a threshold", () => {
    for (const c of CATALOG) for (const o of c.options) if (o.buy === "threshold") expect(o.threshold).toBeGreaterThan(0);
  });

  it("adds up to a plausible total", () => {
    expect(systemTotal()).toBeGreaterThan(40e5);
    expect(systemTotal()).toBeLessThan(55e5);
    expect(formatINR(4614000)).toBe("₹46.1 L");
    expect(formatINR(-395000, { sign: true })).toBe("−₹3.95 L");
    expect(formatINR(17000)).toBe("₹17k");
  });

  it("every marker opens a real component", () => {
    for (const m of MARKERS) expect(byId(m.component)).toBeTruthy();
  });
});

describe("rack, flow, budget and procurement", () => {
  it("fills the rack exactly, with no overlaps", () => {
    const used = new Set<number>();
    for (const r of RACK) for (let u = r.u; u < r.u + r.h; u++) { expect(used.has(u)).toBe(false); used.add(u); }
    expect(used.size).toBe(RACK_U);
  });

  it("keeps the UPS load inside its capacity", () => {
    const p = rackPower();
    expect(p.peak).toBeLessThan(p.capacity);
  });

  it("connects only nodes that exist", () => {
    for (const f of [AUDIO_FLOW, VIDEO_FLOW]) {
      const ids = new Set(f.nodes.map((n) => n.id));
      for (const e of f.edges) { expect(ids.has(e.from)).toBe(true); expect(ids.has(e.to)).toBe(true); }
      for (const n of f.nodes) if (n.component) expect(byId(n.component)).toBeTruthy();
    }
  });

  it("points every budget move at a real component", () => {
    for (const s of SCENARIOS) for (const m of s.moves) expect(byId(m.component)).toBeTruthy();
    for (const r of LOW_RETURN) expect(byId(r.component)).toBeTruthy();
    const net = [...EVALUATOR_REBALANCE.cut, ...EVALUATOR_REBALANCE.add].reduce((a, m) => a + m.delta, 0);
    expect(Math.abs(net)).toBeLessThan(1e5);
  });

  it("places every recommended item in exactly one procurement group", () => {
    const n = procurementGroups().reduce((a, g) => a + g.lines.length, 0);
    expect(n).toBe(CATALOG.length);
    expect(procurementGroups().find((g) => g.buy === "do-not-import")!.lines).toHaveLength(0);
    expect(CATALOG.every((c) => recommended(c).buy !== "do-not-import")).toBe(true);
  });
});
