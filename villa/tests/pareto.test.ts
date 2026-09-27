import { describe, expect, it } from "vitest";
import { STUDIES, STUDY_A, STUDY_B, evaluate, frontier, knee, bestUnder, steps, moves, partsCost, type Dim } from "@/lib/ht/pareto";

describe("Pareto studies", () => {
  for (const s of STUDIES) {
    it(`${s.title}: weighted sub-scores reproduce the study's own scores`, () => {
      for (const p of evaluate(s, s.weights)) expect(Math.abs(p.score - p.stated)).toBeLessThanOrEqual(0.15);
    });
    it(`${s.title}: the computed frontier matches the study's own calls`, () => {
      for (const p of evaluate(s, s.weights)) expect({ id: p.id, pareto: p.pareto }).toEqual({ id: p.id, pareto: p.statedPareto });
    });
    it(`${s.title}: callouts name real configurations`, () => {
      for (const c of s.callouts) expect(s.configs.some((x) => x.id === c.id)).toBe(true);
    });
  }

  it("Study A has 30 systems and Study B 27", () => {
    expect(STUDY_A.configs).toHaveLength(30);
    expect(STUDY_B.configs).toHaveLength(27);
  });

  it("Study B's itemised parts add up to its stated totals", () => {
    for (const c of STUDY_B.configs) expect(Math.abs(partsCost(c.parts!) - c.cost)).toBeLessThan(5000);
  });

  it("finds a knee on the frontier, and the best system inside a budget", () => {
    const pts = evaluate(STUDY_A, STUDY_A.weights);
    const f = frontier(pts);
    expect(f).toContain(knee(f));
    expect(bestUnder(pts, 35e5)!.id).toBe("C16");
    expect(steps(f).every((st) => st.dCost > 0)).toBe(true);
  });

  it("re-weighting moves the frontier", () => {
    const picture = { dialogue: 5, bass: 5, immersion: 5, hdr: 40, upgrade: 0, synergy: 5 };
    const a = evaluate(STUDY_A, STUDY_A.weights).filter((p) => p.pareto).map((p) => p.id).join();
    const b = evaluate(STUDY_A, picture).filter((p) => p.pareto).map((p) => p.id).join();
    expect(a).not.toBe(b);
  });

  it("isolates single-component upgrades, with two to four subs among the best", () => {
    const m = moves(evaluate(STUDY_A, STUDY_A.weights), Object.keys(STUDY_A.dimLabels) as Dim[]);
    const subs = m.find((x) => x.dim === "subs" && x.from === "2× PB-2000 Pro" && x.to === "4× PB-2000 Pro")!;
    expect(subs.pairs.map((p) => p.join(">"))).toContain("C02>C05");
    expect(subs.perLakh).toBeGreaterThan(0.5);
  });
});
