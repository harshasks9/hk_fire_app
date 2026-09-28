import { describe, expect, it } from "vitest";
import { recommended } from "@/lib/ht/catalog";
import { evaluate, frontier } from "@/lib/ht/pareto";
import { ROOM, SCREEN } from "@/lib/ht/geometry";
import { allBuilt, allConfigs, bassAtSeats, costOf, idOf, row2Level, CAP, RECOMMENDED_ID, SUBS, WEIGHTS, PICTURE, SPEAKERS, PROCESSING, TREATMENT } from "@/lib/ht2/model";
import { P, FIXED } from "@/lib/ht2/prices";
import { CATALOG2 } from "@/lib/ht2/catalog";
import { MARKERS2, RACK2, RACK2_U, AUDIO2, VIDEO2, SCENARIOS2, LOW_RETURN2, CHAINS2 } from "@/lib/ht2/system";
import { ASSUMPTIONS } from "@/lib/ht2/assumptions";
import { ROBUST, ROBUST_PICK, MAX_BREAK, recRisk } from "@/lib/ht2/robust";
import { HT2_DATA, STUDY2 } from "@/lib/ht2/data";

const ids = new Set(CATALOG2.map((c) => c.id));
const catalogTotal = CATALOG2.reduce((a, c) => a + recommended(c).price, 0);
const rec = allBuilt().find((b) => idOf(b) === RECOMMENDED_ID)!;

describe("/ht2 budget", () => {
  it("keeps the recommended system, with its ₹1 L contingency, strictly under ₹30 L", () => {
    expect(costOf(rec.parts)).toBeLessThan(CAP);
    expect(FIXED.CTG).toBe(1);
    expect(P.CTG.price).toBe(100000);
  });

  it("prices the catalog's recommended parts to the same rupee as the model, contingency aside", () => {
    expect(catalogTotal + P.CTG.price).toBe(costOf(rec.parts));
    expect(HT2_DATA.contingency).toBe(P.CTG.price);
  });

  it("stays under the cap even at the NZ500's full list price", () => {
    expect(costOf(rec.parts) - P.NZ5.price + 649000).toBeLessThan(CAP);
  });

  it("has a price for every part the model uses", () => {
    for (const b of allBuilt()) for (const k of Object.keys(b.parts)) expect(P[k], k).toBeDefined();
  });
});

describe("/ht2 model", () => {
  const study = STUDY2;
  const pts = evaluate(study, WEIGHTS);
  const front = frontier(pts);

  it("enumerates every combination once", () => {
    const configs = allConfigs();
    expect(new Set(configs.map((c) => c.id)).size).toBe(configs.length);
    expect(configs.length).toBe(PICTURE.length * SPEAKERS.length * SUBS.length * PROCESSING.length * TREATMENT.length);
    expect(configs.length).toBe(6300);
  });

  it("puts the recommendation on the frontier", () => {
    expect(front.map((p) => p.id)).toContain(RECOMMENDED_ID);
  });

  it("recommends the most frequent winner among systems that almost never break the cap", () => {
    expect(ROBUST_PICK.id).toBe(RECOMMENDED_ID);
    expect(recRisk.breaks).toBeLessThanOrEqual(MAX_BREAK);
    for (const w of ROBUST.wins) {
      if (w.share <= ROBUST_PICK.share) break;
      expect(ROBUST.risk[w.id].breaks, w.id).toBeGreaterThan(MAX_BREAK);
    }
  });

  it("reaches reference −8 dB or better in row 2 with the KEF fronts, and more with the Klipsch", () => {
    expect(row2Level(rec)).toBeGreaterThan(96);
    const klipsch = allBuilt().find((b) => idOf(b) === RECOMMENDED_ID.replace("S3", "S4"))!;
    expect(row2Level(klipsch)).toBeGreaterThan(row2Level(rec) + 3);
  });

  it("meets the bass need at 20, 25 and 31.5 Hz with the mixed sealed-rear array", () => {
    const b8 = SUBS.find((s) => s.id === "B8")!;
    const need = [115, 118, 118];
    bassAtSeats(b8).forEach((lvl, i) => expect(lvl).toBeGreaterThanOrEqual(need[i]));
  });

  it("names callouts and a knee that exist", () => {
    for (const c of study.callouts) expect(pts.find((p) => p.id === c.id), c.id).toBeDefined();
    expect(pts.find((p) => p.id === study.knee)).toBeDefined();
  });
});

describe("/ht2 room and rack", () => {
  it("places every marker on a catalog component, inside the room", () => {
    for (const m of MARKERS2) {
      expect(ids.has(m.component), m.id).toBe(true);
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThanOrEqual(ROOM.L);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeLessThanOrEqual(ROOM.W);
    }
  });

  it("keeps the front subs clear of the L and R stands", () => {
    const lr = MARKERS2.filter((m) => m.id === "L" || m.id === "R");
    const subs = MARKERS2.filter((m) => m.role === "sub" && m.x < 1);
    for (const s of subs) for (const m of lr) expect(Math.abs(s.y - m.y), `${s.id}/${m.id}`).toBeGreaterThan(0.36);
  });

  it("keeps L and R within the picture's width", () => {
    const [l, r] = ["L", "R"].map((id) => MARKERS2.find((m) => m.id === id)!);
    expect(l.y).toBeGreaterThan(SCREEN.left - 0.2);
    expect(r.y).toBeLessThan(SCREEN.right + 0.2);
  });

  it("fills the rack with no overlaps", () => {
    const used = new Set<number>();
    for (const r of RACK2) for (let u = r.u; u < r.u + r.h; u++) {
      expect(used.has(u), `U${u}`).toBe(false);
      used.add(u);
    }
    expect(Math.max(...used)).toBeLessThanOrEqual(RACK2_U);
    expect(used.size).toBe(RACK2_U);
    for (const r of RACK2) if (r.component) expect(ids.has(r.component), r.label).toBe(true);
  });

  it("wires flows between real nodes and real components", () => {
    for (const f of [AUDIO2, VIDEO2]) {
      const nodes = new Set(f.nodes.map((n) => n.id));
      for (const e of f.edges) { expect(nodes.has(e.from), e.from).toBe(true); expect(nodes.has(e.to), e.to).toBe(true); }
      for (const n of f.nodes) if (n.component) expect(ids.has(n.component), n.id).toBe(true);
    }
  });

  it("points every scenario, low-return row and chain step at a component", () => {
    for (const s of SCENARIOS2) for (const m of s.moves) expect(ids.has(m.component), m.to).toBe(true);
    for (const r of LOW_RETURN2) expect(ids.has(r.component), r.move).toBe(true);
    for (const c of CHAINS2) for (const [id] of c.steps) expect(ids.has(id), id).toBe(true);
  });

  it("has unique assumption ids", () => {
    expect(new Set(ASSUMPTIONS.map((a) => a.id)).size).toBe(ASSUMPTIONS.length);
  });
});

describe("/ht2 page weight", () => {
  it("sends the generated systems as a recipe, not as data", () => {
    const size = JSON.stringify(HT2_DATA).length;
    expect(HT2_DATA.studies[0].configs).toHaveLength(0);
    expect(size).toBeLessThan(250_000);
  });
});

describe("/ht2 add-ons", async () => {
  const { ADDONS, basket, singles, ladder } = await import("@/lib/ht2/addons");

  it("starts from the recommended system at the same cost and score", () => {
    const b = basket([]);
    expect(b.cost).toBe(costOf(rec.parts));
    expect(b.score).toBeCloseTo(b.base.score, 1);
  });

  it("points every add-on at a catalog component, with unique ids", () => {
    expect(new Set(ADDONS.map((a) => a.id)).size).toBe(ADDONS.length);
    for (const a of ADDONS) expect(ids.has(a.component), a.id).toBe(true);
  });

  it("prices each add-on as the difference it makes to the whole system", () => {
    const base = basket([]).cost;
    for (const s of singles()) expect(s.cost, s.id).toBe(basket([s.id]).cost - base);
  });

  it("scores the external amp through the model: more row-2 headroom, better dialogue", () => {
    const amp = singles().find((s) => s.id === "amp")!;
    expect(amp.dSub.dialogue).toBeGreaterThan(1);
    expect(amp.cost).toBe(P.BA3.price);
  });

  it("never combines two add-ons that replace the same part", () => {
    const steps = ladder().steps.map((s) => s.id);
    expect(steps.filter((id) => id === "rearSB2" || id === "pb4").length).toBeLessThanOrEqual(1);
  });

  it("finds a best-first set that fits the headroom with the contingency intact", () => {
    const fit = ladder().steps.filter((s) => s.cost < CAP);
    expect(fit.length).toBeGreaterThan(0);
  });
});

describe("/ht2 room build", async () => {
  const { SURFACES, SEQUENCE } = await import("@/lib/ht2/build");

  it("numbers each surface once and describes it fully", () => {
    expect(new Set(SURFACES.map((s) => s.id)).size).toBe(SURFACES.length);
    expect(SURFACES.map((s) => s.n).sort((a, b) => a - b)).toEqual(SURFACES.map((_, i) => i + 1));
    for (const s of SURFACES) {
      expect(s.acoustics.length, s.id).toBeGreaterThan(0);
      expect(s.layers.length, s.id).toBeGreaterThan(0);
      expect(s.verify.length, s.id).toBeGreaterThan(0);
      expect(s.cost.hi, s.id).toBeGreaterThanOrEqual(s.cost.lo);
      for (const l of s.layers) expect(l.mm, l.name).toBeGreaterThanOrEqual(0);
    }
  });

  it("puts every build step on a real surface", () => {
    const ids = new Set(SURFACES.map((s) => s.id));
    for (const st of SEQUENCE) for (const it of st.items) expect(ids.has(it.surface), it.t).toBe(true);
  });
});
