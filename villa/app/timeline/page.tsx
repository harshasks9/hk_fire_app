"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { AddButton, RowActions, EntityLink, useEntity } from "@/components/Entity";
import { isLate, criticalTaskIds, daysBetween } from "@/lib/model/derive";
import { PageTitle, Eyebrow, Chip, Empty, Stat, Tabs, fmtDay, relative, useToast, type Tone } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { Task } from "@/lib/model/types";

const TABS = ["Timeline", "Chains", "List"] as const;
type Tab = (typeof TABS)[number];

/** How a task reads at a glance — one tone for the bar, the chip and the legend. */
type TaskState = "done" | "late" | "blocked" | "critical" | "float";
const STATE_LABEL: Record<TaskState, string> = {
  critical: "On the critical path", float: "Has float", blocked: "Blocked", late: "Late", done: "Done",
};
const STATE_TONE: Record<TaskState, Tone> = {
  done: "good", late: "bad", blocked: "warn", critical: "accent", float: "neutral",
};
const BAR_FILL: Record<TaskState, string> = {
  critical: "var(--color-accent)",
  float: "color-mix(in srgb, var(--color-ink-3) 32%, var(--color-paper-3))",
  // Hatched, so a blocked bar never reads as the brass of the critical path.
  blocked: "repeating-linear-gradient(135deg, var(--color-warn) 0 3px, var(--color-warn-soft) 3px 6px)",
  late: "var(--color-bad)",
  done: "color-mix(in srgb, var(--color-good) 62%, var(--color-paper-3))",
};

function stateOf(t: Task, critical: Set<string>): TaskState {
  if (t.status === "done") return "done";
  if (isLate(t)) return "late";
  if (t.status === "blocked") return "blocked";
  if (critical.has(t.id)) return "critical";
  return "float";
}

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
  const { state } = useProject();
  const [tab, setTab] = useState<Tab>("Timeline");
  const [flash, setFlash] = useState<string | null>(null);

  const tasks = state.tasks;
  const critical = useMemo(() => criticalTaskIds(tasks), [tasks]);
  const late = tasks.filter((t) => isLate(t));
  const blocked = tasks.filter((t) => t.status === "blocked");
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const dated = tasks.filter((t) => t.start && t.finish);

  // Links elsewhere point at /timeline#<task>. The task only exists as a row
  // on the List tab, so open that tab and bring the row into view.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !tasks.some((t) => t.id === id)) return;
      setTab("List");
      setFlash(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
      setTimeout(() => setFlash(null), 2400);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [tasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const daysLeft = daysBetween(new Date(), state.meta.targetHandover);

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
        right={<AddButton on="tasks" label="Add a task" className="btn btn-primary" />}
      />

      <div className="card stat-strip mb-8">
        <Stat
          label="Target handover"
          value={fmtDay(state.meta.targetHandover)}
          sub={state.meta.targetHandover ? (daysLeft >= 0 ? `${daysLeft} days away` : `${-daysLeft} days ago`) : "not set"}
          large
        />
        <Stat label="Late" value={tasks.length ? late.length : "—"} tone={late.length ? "bad" : undefined} sub="past their finish date" large />
        <Stat label="Blocked" value={tasks.length ? blocked.length : "—"} tone={blocked.length ? "warn" : undefined} sub="waiting on something else" large />
        <Stat label="On the critical path" value={tasks.length ? critical.size : "—"} sub="delay these and handover moves" large />
      </div>

      {tasks.length === 0 ? (
        <Empty
          icon="timeline"
          title="No tasks on the programme yet"
          hint={
            <>
              The timeline draws every task with a start and finish date against today, marks the critical
              path — the chain that moves handover if any link slips — and flags what is late or blocked.
              Add a task with its dates and what it waits on, and it appears here.
            </>
          }
          action={<AddButton on="tasks" label="Add a task" className="btn btn-primary" />}
        />
      ) : (
        <>
          <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ List: tasks.length }} label="Timeline views" />

          <div className="mt-6">
            {tab === "Timeline" && (
              dated.length === 0 ? (
                <Empty
                  icon="calendar"
                  title="No task has dates yet"
                  hint={`${tasks.length === 1 ? "The task on the programme has" : `All ${tasks.length} tasks have`} no start and finish date, so there is nothing to draw. Give a task its dates and it appears on the chart.`}
                  action={<button className="btn" onClick={() => setTab("List")}>Open the task list</button>}
                />
              ) : (
                <Gantt tasks={dated} undated={tasks.length - dated.length} critical={critical} onUndated={() => setTab("List")} />
              )
            )}

            {tab === "Chains" && (
              <div className="grid gap-4">
                <div className="card divide-y divide-line">
                  {CHAINS.map((c, i) => {
                    const present = c.ids.map((id) => byId.get(id)).filter(Boolean) as Task[];
                    return (
                      <div key={i} className="px-4 sm:px-5 py-4">
                        <h3 className="text-[15.5px] leading-snug">{c.title}</h3>
                        <p className="text-[14px] text-ink-3 mt-1 leading-relaxed max-w-3xl">{c.why}</p>
                        {present.length ? (
                          <ol className="mt-3 flex flex-wrap items-center gap-1.5">
                            {present.map((t, n) => {
                              const st = stateOf(t, critical);
                              return (
                                <li key={t.id} className="inline-flex items-center gap-1.5">
                                  {n > 0 && <Icon name="arrow-right" size={14} className="text-ink-4" />}
                                  <span title={`${t.owner} · ${fmtDay(t.start)} → ${fmtDay(t.finish)} · ${STATE_LABEL[st]}`}>
                                    <Chip tone={st === "float" ? "neutral" : STATE_TONE[st]} dot={st !== "float"}>{t.title}</Chip>
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                        ) : (
                          <p className="mt-3 text-[13px] text-ink-3">None of this chain&rsquo;s tasks are on the programme yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
                  {(["late", "blocked", "critical", "done"] as TaskState[]).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5">
                      <span className="rounded-full w-2 h-2" style={{ background: BAR_FILL[s] }} />{STATE_LABEL[s]}
                    </span>
                  ))}
                </div>
                <div className="rounded-lg bg-paper-2 px-4 py-3.5">
                  <Eyebrow>Why it is shown this way</Eyebrow>
                  <p className="text-[14px] text-ink-2 mt-1.5 leading-relaxed max-w-3xl">
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
                  <TaskRow key={t.id} t={t} critical={critical.has(t.id)} byId={byId} flash={flash === t.id} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** The chart: one bar per dated task against the months, with today marked. */
function Gantt({
  tasks, undated, critical, onUndated,
}: { tasks: Task[]; undated: number; critical: Set<string>; onUndated: () => void }) {
  const { edit } = useEntity();
  const min = Math.min(...tasks.map((t) => +new Date(t.start!)));
  const max = Math.max(...tasks.map((t) => +new Date(t.finish!)));
  const span = max - min || 1;
  const pos = (d: string) => ((+new Date(d) - min) / span) * 100;
  const todayPct = ((Date.now() - min) / span) * 100;

  const months = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const d = new Date(min);
    d.setDate(1);
    while (+d <= max) {
      const pct = ((+d - min) / span) * 100;
      if (pct >= 0) out.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), pct });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [min, max, span]);

  return (
    <div className="card">
      <div className="px-4 sm:px-5 pt-5 pb-3 overflow-x-auto thin-scroll">
        <div className="min-w-[720px] pr-40">
          {/* month scale */}
          <div className="relative h-5 mb-2 border-b border-line">
            {months.map((m, i) => (
              <div key={i} className="absolute top-0 bottom-0" style={{ left: `${m.pct}%` }}>
                <span className="absolute left-0 bottom-0 h-1.5 w-px bg-line-2" />
                <span className="absolute left-1 -top-0.5 text-[12px] text-ink-3 whitespace-nowrap">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="relative pb-7">
            {todayPct >= 0 && todayPct <= 100 && (
              <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                <div className="w-px h-[calc(100%-22px)] bg-accent" />
                <div className="absolute bottom-0 -translate-x-1/2 text-[12px] text-accent-strong font-semibold bg-accent-soft px-1.5 py-px rounded whitespace-nowrap">
                  Today, {fmtDay(new Date())}
                </div>
              </div>
            )}
            <ul className="space-y-[2px]">
              {tasks.map((t) => {
                const left = pos(t.start!);
                const width = Math.max(1.2, pos(t.finish!) - left);
                const st = stateOf(t, critical);
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => edit("tasks", t.id)}
                      className="relative block w-full h-[28px] rounded hover:bg-paper-2 focus-visible:bg-paper-2 text-left"
                      title={`${t.title} · ${t.owner} · ${fmtDay(t.start)} → ${fmtDay(t.finish)}`}
                      aria-label={`${t.title}, ${fmtDay(t.start)} to ${fmtDay(t.finish)}, ${STATE_LABEL[st]}. Edit task.`}
                    >
                      <span
                        className="absolute top-[7px] h-[14px] rounded-[4px]"
                        style={{ left: `${left}%`, width: `${width}%`, background: BAR_FILL[st] }}
                      >
                        {t.milestone && (
                          <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 rotate-45 bg-ink" style={{ width: 9, height: 9 }} />
                        )}
                      </span>
                      <span
                        className={`absolute top-[5px] text-[12.5px] whitespace-nowrap ${st === "late" ? "text-bad font-medium" : "text-ink-2"}`}
                        style={{ left: `calc(${left}% + ${width}% + 8px)` }}
                      >
                        {t.title}
                        {st === "critical" && <span className="text-accent-strong ml-1.5 text-[12px] font-medium">critical</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-5 py-3 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
        {(["critical", "float", "blocked", "late", "done"] as TaskState[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="rounded-sm" style={{ width: 12, height: 8, background: BAR_FILL[s] }} />{STATE_LABEL[s]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="rotate-45 bg-ink inline-block" style={{ width: 8, height: 8 }} /> Milestone</span>
        {undated > 0 && (
          <button className="link sm:ml-auto" onClick={onUndated}>
            {undated} undated task{undated === 1 ? "" : "s"} not drawn
          </button>
        )}
      </div>
    </div>
  );
}

function TaskRow({ t, critical, byId, flash }: { t: Task; critical: boolean; byId: Map<string, Task>; flash?: boolean }) {
  const { state, dispatch } = useProject();
  const toast = useToast();
  const lateT = isLate(t);
  const done = t.status === "done";
  const deps = t.dependsOn.map((d) => byId.get(d)).filter(Boolean) as Task[];
  const space = state.spaces.find((s) => s.id === t.spaceId);

  const toggle = () => {
    const before = t.status;
    dispatch({ type: "task/patch", id: t.id, patch: { status: done ? "todo" : "done" } });
    toast(done ? `“${t.title}” reopened` : `“${t.title}” marked done`, {
      action: { label: "Undo", run: () => dispatch({ type: "task/patch", id: t.id, patch: { status: before } }) },
    });
  };

  return (
    <div id={t.id} className={`px-4 py-3.5 flex items-start gap-3 group scroll-mt-24 transition-colors ${flash ? "bg-accent-soft" : ""}`}>
      <button
        onClick={toggle}
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark “${t.title}” not done` : `Mark “${t.title}” done`}
        className={`shrink-0 mt-[1px] w-[22px] h-[22px] rounded-md border flex items-center justify-center transition-colors ${done ? "bg-good border-good text-white" : "border-line-2 bg-card hover:border-ink-4"}`}
      >
        {done && <Icon name="check" size={15} strokeWidth={2.2} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-[14.5px] leading-snug ${done ? "line-through decoration-ink-4 text-ink-3" : "text-ink"}`}>{t.title}</span>
          {t.milestone && <Chip tone="info" small>Milestone</Chip>}
          {critical && !done && <Chip tone="accent" small>Critical path</Chip>}
          {t.status === "blocked" && <Chip tone="warn" small>Blocked</Chip>}
          {lateT && <Chip tone="bad" small>Late</Chip>}
        </div>
        <div className="text-[13px] text-ink-3 mt-0.5 leading-relaxed">
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
        {t.notes && <div className="text-[13px] text-ink-2 mt-1 leading-relaxed">{t.notes}</div>}
        <div className={`sm:hidden text-[13px] mt-1 tnum ${lateT ? "text-bad font-semibold" : "text-ink-2"}`}>
          {t.finish ? <>Finish {fmtDay(t.finish)}{!done && <span className={lateT ? "" : "text-ink-3 font-normal"}> · {relative(t.finish)}</span>}</> : "No date"}
        </div>
      </div>
      <div className="text-right shrink-0 flex items-start gap-1.5">
        <div className="hidden sm:block">
          <div className={`text-[13px] tnum ${lateT ? "text-bad font-semibold" : "text-ink-2"}`}>{t.finish ? fmtDay(t.finish) : "No date"}</div>
          {t.finish && !done && <div className={`text-[12px] ${lateT ? "text-bad" : "text-ink-3"}`}>{relative(t.finish)}</div>}
        </div>
        <RowActions on="tasks" id={t.id} />
      </div>
    </div>
  );
}
