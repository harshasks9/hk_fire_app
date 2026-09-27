"use client";

import React, { useState } from "react";
import { useHt } from "./data";
import type { Assumption } from "@/lib/ht/dataset";

const V: Record<Assumption["verdict"], { label: string; color: string }> = {
  kept: { label: "Kept", color: "var(--agree)" },
  changed: { label: "Changed", color: "var(--qualified)" },
  rejected: { label: "Rejected", color: "var(--disagree)" },
};

/** Every inherited assumption, re-derived from first principles, with its verdict. */
export function AssumptionsView() {
  const { assumptions = [] } = useHt();
  const [filter, setFilter] = useState<Assumption["verdict"] | "all">("all");
  const areas = Array.from(new Set(assumptions.map((a) => a.area)));
  const count = (v: Assumption["verdict"]) => assumptions.filter((a) => a.verdict === v).length;
  const shown = assumptions.filter((a) => filter === "all" || a.verdict === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by verdict">
        <button className="toggle" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All {assumptions.length}</button>
        {(Object.keys(V) as Assumption["verdict"][]).map((v) => (
          <button key={v} className="toggle" aria-pressed={filter === v} onClick={() => setFilter(v)}>
            <span className="dot" style={{ background: V[v].color }} />{V[v].label} {count(v)}
          </button>
        ))}
      </div>
      {areas.map((area) => {
        const rows = shown.filter((a) => a.area === area);
        if (!rows.length) return null;
        return (
          <section key={area}>
            <h3 className="eyebrow mb-3">{area}</h3>
            <div className="grid lg:grid-cols-2 gap-3">
              {rows.map((a) => (
                <article key={a.id} className="card p-5" style={{ boxShadow: `inset 3px 0 0 ${V[a.verdict].color}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-medium leading-snug">{a.claim}</p>
                    <span className="verdict shrink-0" style={{ color: V[a.verdict].color }}>{V[a.verdict].label}</span>
                  </div>
                  <p className="t2 text-[14px] leading-relaxed mt-2.5">{a.reasoning}</p>
                  {a.numbers && <p className="mono text-[12.5px] brass mt-3 leading-relaxed">{a.numbers}</p>}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
