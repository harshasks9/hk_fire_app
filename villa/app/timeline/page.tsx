"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { AddButton, RowActions, EntityLink, EmptyWithAdd } from "@/components/Entity";
import { isLate, criticalTaskIds, daysBetween } from "@/lib/model/derive";
import { PageTitle, Eyebrow, Chip, Empty, Stat, Tabs, fmtDay, relative } from "@/components/ui";
import type { Task } from "@/lib/model/types";

const TABS = ["Timeline", "Chains", "List"] as const;
type Tab = (typeof TABS)[number];

/**
 * The programme.
 *
 * Built around the dependencies that actually govern an interior fit-out —
 * waterproofing before tiles before sanitaryware before glass; ceiling before
 * electrical before lighting before paint; carpentry dimensions before shop
 * drawings before manufacturing before installation — and deliberately not
 * presented as a Gantt chart the homeowner has to learn to read.
 */
export default function TimelinePage() {
  const { state, dispatch } = useProject();
  const [tab, setTab] = useState<Tab>("Timeline");

  const tasks = state.tasks;
  const critical = useMemo(() => criticalTaskIds(tasks), [tasks]);
  const late = tasks.filter((t) => isLate(t));
  const blocked = tasks.filter((t) => t.status === "blocked");
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const dated = tasks.filter((t) => t.start && t.finish);
  const min = Math.min(...dated.map((t) => +new Date(t.start!)));
  const max = Math.max(...dated.map((t) => +new Date(t.finish!)));
  const span = max - min || 1;
  const pos = (d: string) => ((+new Date(d) - min) / span) * 100;
  const todayPct = ((Date.now() - min) / span) * 100;

  const months = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const d = new Date(min);
    d.setDate(1);
    while (+d <= max) {
      out.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), pct: ((+d - min) / span) * 100 });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [min, max, span]);

  const handover = tasks.find((t) => t.id === "t-handover");

  // The chains that matter on an interiors job, expressed in plain language.
  const CHAINS: { title: string; why: string; ids: string[] }[] = [
    {
      title: "Design freeze → BOQ → quotation → approval → manufacturing → installation",
      why: "The spine of the whole project. Every week lost at the front is a week lost at the end.",
      ids: ["t-design-freeze", "t-boq-gf", "t-quote-gf", "t-kitchen-award", "t-kitchen-mfg", "t-kitchen-install"],
    },
    {
      title: "Waterproofing → bathroom tiles → sanitaryware → glass",
      why: "Waterproofing goes under the tile and the concealed bodies go inside the wall. Neither can be revisited afterwards without breaking something.",
      ids: ["t-wp-ff", "t-tile-ff"],
    },
    {
      title: "False ceiling → electrical → lighting → paint",
      why: "Anything concealed above the ceiling must be fixed before the boards close. This is the deadline that catches people out.",
      ids: ["t-ceiling-gf", "t-elec-gf", "t-paint-gf", "t-light-gf"],
    },
    {
      title: "Carpentry dimensions → shop drawings → approval → manufacturing → installation",
      why: "The factory works from the signed drawing, not the design. A late signature is a late wardrobe.",
      ids: ["t-wic-shop", "t-wic-mfg", "t-wic-install"],
    },
  ];

  return (
    <div>
      <PageTitle
        title="Timeline"
        sub="The order things have to happen in, and what is currently capable of moving handover."
        right={<AddButton on="tasks" label="Add a task" accent />}
      />

      <div className="card px-5 py-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat
          label="Target handover"
          value={fmtDay(state.meta.targetHandover)}
          sub={`${daysBetween(new Date(), state.meta.targetHandover)} days away`}
          large
        />
        <Stat label="Late" value={late.length || "—"} tone={late.length ? "rust" : "sage"} sub="past their finish date" large />
        <Stat label="Blocked" value={blocked.length || "—"} tone={blocked.length ? "ochre" : undefined} sub="waiting on something else" large />
        <Stat label="On the critical path" value={critical.size} sub="delay these and handover moves" large />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "Timeline" && (
          <div className="card px-4 sm:px-5 py-5 overflow-x-auto thin-scroll">
            <div className="min-w-[680px]">
              {/* month scale */}
              <div className="relative h-5 mb-2">
                {months.map((m, i) => (
                  <div key={i} className="absolute text-[10.5px] text-ink-3" style={{ left: `${m.pct}%` }}>
                    <span className="absolute -translate-x-1/2">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="relative">
                {/* today */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                    <div className="w-px h-full bg-clay/60" />
                    <div className="absolute -top-1 -translate-x-1/2 text-[9.5px] text-clay font-semibold bg-paper px-1">today</div>
                  </div>
                )}
                <div className="space-y-[3px]">
                  {dated.map((t) => {
                    const left = pos(t.start!);
                    const width = Math.max(1.2, pos(t.finish!) - left);
                    const isCrit = critical.has(t.id);
                    const lateT = isLate(t);
                    const color =
                      t.status === "done" ? "#a8b5a3"
                        : lateT ? "#a04a3c"
                        : t.status === "blocked" ? "#c69a4c"
                        : isCrit ? "#b0603a"
                        : "#8b9a92";
                    return (
                      <div key={t.id} className="relative h-[26px] group">
                        <div className="absolute inset-0 hover:bg-paper-2/70 rounded" />
                        <div
                          className="absolute top-[6px] h-[13px] rounded-[4px] flex items-center transition-all"
                          style={{ left: `${left}%`, width: `${width}%`, background: color, opacity: t.status === "done" ? 0.55 : 1 }}
                          title={`${t.title} · ${t.owner} · ${fmtDay(t.start)} → ${fmtDay(t.finish)}`}
                        >
                          {t.milestone && (
                            <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 rotate-45 bg-ink" style={{ width: 9, height: 9 }} />
                          )}
                        </div>
                        <div
                          className="absolute top-[3px] text-[11.5px] whitespace-nowrap pointer-events-none"
                          style={{ left: `calc(${left}% + ${width}% + 8px)`, color: lateT ? "#8d3a2c" : "var(--color-ink-2)" }}
                        >
                          {t.title}
                          {isCrit && <span className="text-clay ml-1.5 text-[10px]">critical</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-ink-3">
              <Legend c="#b0603a" l="On the critical path" />
              <Legend c="#8b9a92" l="Has float" />
              <Legend c="#c69a4c" l="Blocked" />
              <Legend c="#a04a3c" l="Late" />
              <Legend c="#a8b5a3" l="Done" />
              <span className="inline-flex items-center gap-1.5"><span className="rotate-45 bg-ink inline-block" style={{ width: 8, height: 8 }} /> Milestone</span>
            </div>
          </div>
        )}

        {tab === "Chains" && (
          <div className="space-y-4">
            {CHAINS.map((c, i) => (
              <div key={i} className="card px-4 sm:px-5 py-4">
                <h3 className="text-[15px] leading-snug">{c.title}</h3>
                <p className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed">{c.why}</p>
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  {c.ids.map((id, n) => {
                    const t = byId.get(id);
                    if (!t) return null;
                    const done = t.status === "done";
                    const lateT = isLate(t);
                    return (
                      <React.Fragment key={id}>
                        {n > 0 && <span className="text-ink-4 text-[12px]">→</span>}
                        <span
                          className="chip"
                          style={{
                            background: done ? "#e4ebe2" : lateT ? "#f6e1dc" : t.status === "blocked" ? "#f5ecd8" : "#f1ede7",
                            color: done ? "#41603f" : lateT ? "#8d3a2c" : t.status === "blocked" ? "#8a6a20" : "#514941",
                          }}
                          title={`${t.owner} · ${fmtDay(t.start)} → ${fmtDay(t.finish)}`}
                        >
                          {t.title}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="card-quiet px-4 py-4">
              <Eyebrow>Why it is shown this way</Eyebrow>
              <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">
                You should not need to read a Gantt chart to know what matters. These four chains
                are where interiors projects actually lose time, and each one has a single gate:
                the signature, the flood test, the ceiling closing, the shop drawing. Everything
                else has slack.
              </p>
            </div>
          </div>
        )}

        {tab === "List" && (
          <div className="card divide-y divide-line">
            {[...tasks].sort((a, b) => +new Date(a.finish ?? 0) - +new Date(b.finish ?? 0)).map((t) => (
              <TaskRow key={t.id} t={t} critical={critical.has(t.id)} byId={byId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="rounded-sm" style={{ width: 11, height: 8, background: c }} />{l}</span>;
}

function TaskRow({ t, critical, byId }: { t: Task; critical: boolean; byId: Map<string, Task> }) {
  const { state, dispatch } = useProject();
  const lateT = isLate(t);
  const deps = t.dependsOn.map((d) => byId.get(d)).filter(Boolean) as Task[];
  const space = state.spaces.find((s) => s.id === t.spaceId);
  return (
    <div id={t.id} className="px-4 py-3 flex items-start gap-3 group scroll-mt-24">
      <button
        onClick={() => dispatch({ type: "task/patch", id: t.id, patch: { status: t.status === "done" ? "todo" : "done" } })}
        className="shrink-0 mt-0.5 rounded-md border transition-colors"
        style={{
          width: 17, height: 17,
          background: t.status === "done" ? "#5f7a5f" : "transparent",
          borderColor: t.status === "done" ? "#5f7a5f" : "var(--color-line-2)",
        }}
        aria-label="Toggle done"
      >
        {t.status === "done" && <svg viewBox="0 0 16 16" width="15" height="15"><path d="m4 8 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[13.5px] ${t.status === "done" ? "line-through text-ink-4" : ""}`}>{t.title}</span>
          {t.milestone && <Chip tone="slate">Milestone</Chip>}
          {critical && t.status !== "done" && <Chip tone="clay">Critical path</Chip>}
          {t.status === "blocked" && <Chip tone="ochre">Blocked</Chip>}
          {lateT && <Chip tone="rust">Late</Chip>}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-0.5">
          {t.owner}
          {space && <> · <EntityLink on="spaces" id={space.id} label={space.name} /></>}
          {t.vendorId && <> · <EntityLink on="vendors" id={t.vendorId} /></>}
          {t.scopeItemId && <> · <EntityLink on="items" id={t.scopeItemId} label="the item" /></>}
          {deps.length > 0 && (
            <> · after {deps.map((d, i) => (
              <React.Fragment key={d.id}>{i > 0 && ", "}<EntityLink on="tasks" id={d.id} label={d.title} /></React.Fragment>
            ))}</>
          )}
        </div>
        {t.notes && <div className="text-[11.5px] text-ink-3 mt-1 italic">{t.notes}</div>}
      </div>
      <div className="text-right shrink-0 flex items-start gap-2">
        <div>
          <div className="text-[12px] tnum" style={{ color: lateT ? "#8d3a2c" : undefined }}>{fmtDay(t.finish)}</div>
          {t.finish && t.status !== "done" && <div className="text-[10.5px] text-ink-4">{relative(t.finish)}</div>}
        </div>
        <RowActions on="tasks" id={t.id} />
      </div>
    </div>
  );
}
