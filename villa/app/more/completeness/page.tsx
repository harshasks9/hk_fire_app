"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { EntityLink } from "@/components/Entity";
import { findGaps, bucketOf, COMPLETENESS_BUCKETS, itemsForSpace, type GapSeverity } from "@/lib/model/derive";
import { FLOOR_META } from "@/lib/seed/spaces";
import { PageTitle, Eyebrow, Chip, Stat, Empty, Tabs } from "@/components/ui";

const SEV_LABEL: Record<GapSeverity, string> = {
  blocker: "Blocker", risk: "Risk", gap: "Gap", nudge: "Not budgeted",
};
const SEV_TONE: Record<GapSeverity, "rust" | "ochre" | "clay" | "neutral"> = {
  blocker: "rust", risk: "ochre", gap: "clay", nudge: "neutral",
};

/**
 * The completeness engine, made visible.
 *
 * The purpose is not to report what has been entered. It is to surface what has
 * not yet been thought about — the sequencing trap, the unowned warranty, the
 * long-lead item nobody has decided, the allowance that was never put against
 * acoustic treatment.
 */
export default function CompletenessPage() {
  const { state } = useProject();
  const [sev, setSev] = useState<GapSeverity | "all">("all");
  const gaps = useMemo(() => findGaps(state), [state]);
  const filtered = sev === "all" ? gaps : gaps.filter((g) => g.severity === sev);

  const counts = (["blocker", "risk", "gap", "nudge"] as GapSeverity[]).map((s) => ({
    s, n: gaps.filter((g) => g.severity === s).length,
  }));

  // State of every scope item across the eight buckets.
  const buckets = COMPLETENESS_BUCKETS.map((b) => ({
    ...b, n: state.items.filter((i) => bucketOf(i.stage) === b.key).length,
  }));
  const total = state.items.length;

  const byRoom = useMemo(() => {
    const m = new Map<string, typeof gaps>();
    for (const g of filtered) {
      const k = g.spaceId ?? "house";
      m.set(k, [...(m.get(k) ?? []), g]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Completeness</div>
      <PageTitle
        title="What has not been thought about"
        sub="Every room and system checked against what it needs. This is not a progress report — it is a list of the things that are still invisible."
      />

      <div className="card px-5 py-5 mb-6">
        <Eyebrow className="mb-3">Every scope item in the villa</Eyebrow>
        <div className="flex h-3 rounded-full overflow-hidden bg-paper-3 mb-3">
          {buckets.map((b, i) => {
            const colors = ["#ded7cc", "#e0cfa8", "#c9c3b0", "#a9bda6", "#8fae8b", "#6d9169", "#4e7549", "#efece7"];
            return b.n ? (
              <div key={b.key} style={{ width: `${(b.n / total) * 100}%`, background: colors[i] }} title={`${b.label}: ${b.n}`} />
            ) : null;
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {buckets.map((b) => (
            <div key={b.key}>
              <div className="tnum text-[19px]" style={{ fontFamily: "var(--font-display)" }}>{b.n}</div>
              <div className="text-[10.5px] text-ink-3 leading-snug">{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setSev("all")} className="btn btn-sm"
          style={{ background: sev === "all" ? "var(--color-ink)" : undefined, color: sev === "all" ? "var(--color-paper)" : undefined }}>
          Everything {gaps.length}
        </button>
        {counts.map(({ s, n }) => (
          <button key={s} onClick={() => setSev(s)} className="btn btn-sm"
            style={{ background: sev === s ? "var(--color-ink)" : undefined, color: sev === s ? "var(--color-paper)" : undefined }}>
            {SEV_LABEL[s]} {n}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <Empty title="Nothing flagged at this level." />
      ) : (
        <div className="space-y-4">
          {byRoom.map(([spaceId, list]) => {
            const space = state.spaces.find((s) => s.id === spaceId);
            return (
              <div key={spaceId}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <Eyebrow>
                    {space ? `${FLOOR_META[space.floor].label} · ${space.name}` : "House-wide"}
                  </Eyebrow>
                  {space && <Link href={`/villa/${space.id}`} className="text-[11.5px] text-clay hover:underline">Open room →</Link>}
                </div>
                <div className="card divide-y divide-line">
                  {list.map((g) => (
                    <div key={g.id} className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <Chip tone={SEV_TONE[g.severity]}>{SEV_LABEL[g.severity]}</Chip>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] leading-snug">
                            {space ? g.title.replace(`${space.name} — `, "") : g.title}
                          </div>
                          <p className="text-[12px] text-ink-3 mt-1 leading-relaxed">{g.detail}</p>
                          {g.action && (
                            <p className="text-[12px] mt-1.5" style={{ color: "#9c5333" }}>{g.action}</p>
                          )}
                        </div>
                        {g.scopeItemId ? (
                          <EntityLink on="items" id={g.scopeItemId} className="btn btn-sm shrink-0">Open</EntityLink>
                        ) : g.spaceId ? (
                          <EntityLink on="spaces" id={g.spaceId} className="btn btn-sm shrink-0">Open</EntityLink>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
