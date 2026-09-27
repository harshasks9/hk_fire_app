"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { HtDataset } from "@/lib/ht/dataset";
import type { Buy, Component } from "@/lib/ht/types";
import type { RackUnit } from "@/lib/ht/system";
import { recommended } from "@/lib/ht/catalog";
import type { Config } from "@/lib/ht/pareto";
import { allConfigs as ht2Configs } from "@/lib/ht2/model";

const Ctx = createContext<HtDataset | null>(null);

/**
 * Studies with thousands of generated systems arrive without them (they
 * would add megabytes to the page) and are rebuilt here from the same model.
 */
const GENERATORS: Record<string, () => Config[]> = { ht2: ht2Configs };

export function HtDataProvider({ data, children }: { data: HtDataset; children: React.ReactNode }) {
  const value = useMemo(
    () => ({ ...data, studies: data.studies.map((s) => (s.gen && !s.configs.length ? { ...s, configs: GENERATORS[s.gen]() } : s)) }),
    [data],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const ORDER: Buy[] = ["india", "usa", "singapore", "hongkong", "china", "thailand", "threshold", "do-not-import"];

/** The current app's data, plus the lookups every screen needs. */
export function useHt() {
  const d = useContext(Ctx);
  if (!d) throw new Error("useHt outside HtDataProvider");
  return useMemo(() => {
    const byId = (id: string): Component => d.catalog.find((c) => c.id === id)!;
    const total = d.catalog.reduce((a, c) => a + recommended(c).price, 0);
    const groups = new Map<Buy, { component: Component; option: ReturnType<typeof recommended> }[]>(ORDER.map((b) => [b, []]));
    for (const c of d.catalog) { const o = recommended(c); groups.get(o.buy)!.push({ component: c, option: o }); }
    const procurement = ORDER.map((b) => ({ buy: b, lines: groups.get(b)! }));
    return { ...d, byId, total, procurement, power: rackPowerOf(d.rack, d.projectorWatts, d.upsCapacity) };
  }, [d]);
}

export function rackPowerOf(rack: RackUnit[], projector: [number, number], capacity: number) {
  const onUps = rack.filter((r) => r.ups && r.watts);
  const typ = onUps.reduce((a, r) => a + r.watts![0], 0) + projector[0];
  const peak = onUps.reduce((a, r) => a + r.watts![1], 0) + projector[1];
  const subs = rack.filter((r) => r.component === "subamps" && r.watts).reduce((a, r) => a + r.watts![1], 0);
  const heat = rack.filter((r) => r.watts).reduce((a, r) => a + r.watts![0], 0);
  return { typ, peak, capacity, subsPeak: subs, heatW: heat, heatBtu: Math.round(heat * 3.412) };
}
