import { describe, expect, it } from "vitest";
import { evaluate, frontier, bestUnder, moves, type Dim } from "@/lib/ht/pareto";
import { referenceConfigs, referenceTable } from "@/lib/ht2/reference";
import { STUDY2 } from "@/lib/ht2/data";
import { RECOMMENDED_ID, CAP, WEIGHTS } from "@/lib/ht2/model";
import { P } from "@/lib/ht2/prices";

describe("/ht2 reference theatre (from the video)", () => {
  const pts = evaluate(STUDY2, WEIGHTS);
  const refs = pts.filter((p) => p.ref);

  it("adds the whole system and one point per swapped part", () => {
    expect(referenceConfigs().map((c) => c.id)).toEqual(["REF-VIDEO", "REF-PIC", "REF-SPK", "REF-SUB", "REF-PROC", "REF-CTRL"]);
    expect(refs).toHaveLength(6);
  });

  it("never joins the frontier, never pushes a study system off it, never wins the budget", () => {
    for (const r of refs) expect(r.pareto, r.id).toBe(false);
    const without = evaluate({ ...STUDY2, configs: STUDY2.configs.filter((c) => !c.ref) }, WEIGHTS);
    expect(frontier(pts).map((p) => p.id)).toEqual(frontier(without).map((p) => p.id));
    expect(frontier(pts).map((p) => p.id)).toContain(RECOMMENDED_ID);
    expect(bestUnder(pts, 40e5)?.ref).toBeUndefined();
    expect(moves(pts, ["picture", "speakers", "subs", "processing", "extras"] as Dim[]).every((m) => !m.pairs.some(([a, b]) => a.startsWith("REF") || b.startsWith("REF")))).toBe(true);
  });

  it("prices the video's system from Indian listings and scores it below the recommendation", () => {
    const t = referenceTable();
    const video = t.rows.find((r) => r.id === "REF-VIDEO")!;
    expect(video.cost).toBeGreaterThan(CAP);
    expect(video.score).toBeLessThan(t.base.score);
    const spk = t.rows.find((r) => r.id === "REF-SPK")!;
    expect(spk.dCost).toBe(1.5 * P.TH3.price + 8 * P.F100.price - (3.5 * P.KQC.price + 4 * P.KCI.price));
    expect(t.rows.find((r) => r.id === "REF-CTRL")!.dScore).toBe(0);
  });
});
