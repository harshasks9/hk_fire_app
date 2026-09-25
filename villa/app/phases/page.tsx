"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { PHASES, phaseProgress, currentPhase, phaseOfItem, type PhaseProgress } from "@/lib/model/phases";
import { catLabel } from "@/lib/model/categories";
import { inr } from "@/lib/model/costing";
import { PageTitle, Eyebrow, Chip, Stat, Bar, Section, LegendDot } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * Phases.
 *
 * Twelve phases, in order, each with what to do in it and what must be true
 * before the next one starts. The project's own scope is laid over the top, so
 * this is both the method and the position — not a static article about how
 * fit-outs work, but where this villa actually is inside one.
 */
export default function PhasesPage() {
  const { state } = useProject();
  const progress = useMemo(() => phaseProgress(state), [state]);
  const now = useMemo(() => currentPhase(state), [state]);
  const [open, setOpen] = useState<string | null>(now.phase.id);

  const live = state.items.filter((i) => i.stage !== "not-applicable");
  const totalWeeks = PHASES[PHASES.length - 1].weeks[1];
  const complete = progress.filter((p) => p.status === "complete").length;

  // A link to /phases#<phase> opens that phase and brings it into view.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && PHASES.some((p) => p.id === id)) show(id);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  function show(id: string) {
    setOpen(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div>
      <PageTitle
        title="Phases"
        sub="Twelve phases, in the order a fit-out actually runs. Almost every expensive mistake on a villa is a phase done out of order, so each one states what must be true before the next may start."
        right={
          <Link href="/checklist" className="btn">
            Room checklists <Icon name="arrow-right" size={15} />
          </Link>
        }
      />

      <div className="card stat-strip mb-10">
        <Stat label="Currently in" value={`Phase ${now.phase.n}`} sub={now.phase.name} />
        <Stat label="Indicative programme" value={`${totalWeeks} weeks`} sub="from mobilisation to handover" />
        <Stat label="Scope placed" value={live.length.toLocaleString("en-IN")} sub="items sitting in a phase" />
        <Stat label="Phases complete" value={`${complete} of ${PHASES.length}`} tone={complete === PHASES.length ? "good" : undefined} />
      </div>

      {/* ------------------------------------------------------ the programme */}
      <Section title="The programme at a glance">
        <div className="card px-4 sm:px-5 py-4">
          <ol className="divide-y divide-line sm:divide-y-0">
            {progress.map((p) => (
              <li key={p.phase.id}>
                <ProgrammeRow p={p} now={p.phase.id === now.phase.id} totalWeeks={totalWeeks} onPick={() => show(p.phase.id)} />
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
            <LegendDot color="var(--color-accent)" label="The phase you are in" />
            <LegendDot color="var(--color-good)" label="Share of the phase's scope cleared" />
            <LegendDot color="var(--color-paper-3)" label="Weeks the phase runs" />
          </div>
          <p className="text-[13px] text-ink-3 mt-3 leading-relaxed max-w-3xl">
            Weeks are indicative for a villa of this size and overlap on purpose — design development runs
            while long-lead goods are being ordered. They show the shape of the programme, not a promised date.
            Real dates live on the <Link href="/timeline" className="link">timeline</Link>.
          </p>
        </div>
      </Section>

      {/* ---------------------------------------------------------- the phases */}
      <Section title="Phase by phase">
        <div className="card divide-y divide-line overflow-hidden">
          {progress.map((p) => (
            <PhaseRow key={p.phase.id} p={p} now={now.phase.id === p.phase.id}
              open={open === p.phase.id} onToggle={() => setOpen(open === p.phase.id ? null : p.phase.id)}
              items={state.items.filter((i) => i.stage !== "not-applicable" && phaseOfItem(i).id === p.phase.id)}
              label={(c: string) => catLabel(state, c)} />
          ))}
        </div>
      </Section>
    </div>
  );
}

/**
 * One line of the programme: the weeks the phase runs as a bar, how much of
 * its scope has cleared as a fill inside it. On a phone the bar drops below
 * the name so nothing has to scroll sideways.
 */
function ProgrammeRow({
  p, now, totalWeeks, onPick,
}: { p: PhaseProgress; now: boolean; totalWeeks: number; onPick: () => void }) {
  const [a, b] = p.phase.weeks;
  const done = p.status === "complete";
  const fill = done ? 100 : p.items ? p.pct : 0;
  return (
    <button
      onClick={onPick}
      className="w-full grid grid-cols-[1.25rem_minmax(0,1fr)_auto_2.75rem] sm:grid-cols-[1.25rem_13rem_minmax(0,1fr)_4.5rem_2.75rem] lg:grid-cols-[1.25rem_15.5rem_minmax(0,1fr)_4.5rem_2.75rem] items-center gap-x-2.5 gap-y-1.5 py-2 sm:py-[5px] text-left group rounded-md hover:bg-paper-2/60 -mx-1.5 px-1.5"
      aria-label={`Phase ${p.phase.n}, ${p.phase.name}, weeks ${a} to ${b}${p.items ? `, ${Math.round(p.pct)}% cleared` : ""}. Show details.`}
    >
      <span className="text-[12px] text-ink-3 tnum text-right">{p.phase.n}</span>
      <span className={`text-[13.5px] truncate group-hover:text-accent-strong ${now ? "font-semibold text-ink" : "text-ink-2"}`}>
        {p.phase.name}
      </span>
      <span className="relative h-3.5 rounded bg-paper-2 col-start-2 col-span-3 row-start-2 sm:col-start-3 sm:col-span-1 sm:row-start-1" aria-hidden>
        <span
          className="absolute inset-y-0 rounded overflow-hidden"
          style={{
            left: `${(a / totalWeeks) * 100}%`,
            width: `${((b - a) / totalWeeks) * 100}%`,
            background: now ? "color-mix(in srgb, var(--color-accent) 30%, var(--color-paper-3))" : "var(--color-paper-3)",
            boxShadow: now ? "inset 0 0 0 1.5px var(--color-accent)" : undefined,
          }}
        >
          <span className="absolute inset-y-0 left-0" style={{ width: `${fill}%`, background: now ? "var(--color-accent)" : "var(--color-good)" }} />
        </span>
      </span>
      <span className="text-[12px] text-ink-3 tnum text-right whitespace-nowrap">wk {a}–{b}</span>
      <span className="text-[12px] text-ink-3 tnum text-right">{p.items ? `${Math.round(p.pct)}%` : "—"}</span>
    </button>
  );
}

function PhaseRow({
  p, now, open, onToggle, items, label,
}: {
  p: PhaseProgress; now: boolean; open: boolean; onToggle: () => void;
  items: { id: string; title: string; spaceId?: string; category: string }[];
  label: (c: string) => string;
}) {
  const [limit, setLimit] = useState(8);
  const shown = items.slice(0, limit);
  const bodyId = `${p.phase.id}-detail`;
  return (
    <div id={p.phase.id} className={`scroll-mt-20 relative ${now ? "bg-accent-soft/40" : ""}`}>
      {now && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" aria-hidden />}
      <button onClick={onToggle} aria-expanded={open} aria-controls={bodyId}
        className="w-full text-left px-4 sm:px-5 py-4 hover:bg-paper/70 transition-colors group">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Phase {p.phase.n} · weeks {p.phase.weeks[0]}–{p.phase.weeks[1]}</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1">
              <span className="text-[16px] font-semibold leading-snug text-ink">{p.phase.name}</span>
              {now && <Chip tone="accent" dot>You are here</Chip>}
              {p.status === "complete" && p.items > 0 && <Chip tone="good">Complete</Chip>}
              {!p.ready && p.status !== "complete" && (
                <Chip tone="warn" title="An earlier phase has not cleared. Starting here means building on something unfinished.">
                  Earlier phase unfinished
                </Chip>
              )}
            </div>
            <p className="text-[14px] text-ink-3 mt-1 leading-relaxed max-w-3xl">{p.phase.goal}</p>
            {p.items > 0 && (
              <div className="mt-3 flex items-center gap-3 max-w-xl">
                <Bar pct={p.pct} height={4} label={`Phase ${p.phase.n} scope cleared`} />
                <span className="text-[12.5px] text-ink-3 tnum whitespace-nowrap">
                  {p.cleared.toLocaleString("en-IN")} of {p.items.toLocaleString("en-IN")} cleared · {inr(p.value, { compact: true })}
                </span>
              </div>
            )}
          </div>
          <Icon name="chevron-down" size={18}
            className={`text-ink-4 group-hover:text-ink mt-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div id={bodyId} className="px-4 sm:px-5 pb-5 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 animate-rise">
          <div>
            <Eyebrow className="mb-2.5">What happens in this phase</Eyebrow>
            <ol className="space-y-3">
              {p.phase.steps.map((st, n) => (
                <li key={st.title} className="flex gap-3">
                  <span className="text-[12px] text-ink-3 tnum shrink-0 mt-[3px] w-4 text-right">{n + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-medium text-ink leading-snug">
                      {st.title}
                      {st.critical && <span className="ml-2 align-middle"><Chip tone="accent" small>Critical</Chip></span>}
                    </div>
                    <p className="text-[13.5px] text-ink-3 mt-0.5 leading-relaxed">{st.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="rounded-lg bg-warn-soft/60 px-4 py-3 mt-5 flex gap-3">
              <Icon name="alert" size={17} className="text-warn shrink-0 mt-0.5" />
              <div>
                <Eyebrow>The trap this phase exists to prevent</Eyebrow>
                <p className="text-[14px] text-ink-2 mt-1 leading-relaxed">{p.phase.trap}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 content-start">
            <div className="rounded-lg border border-line px-4 py-3">
              <Eyebrow>Before the next phase starts</Eyebrow>
              <ul className="mt-2 space-y-2">
                {p.phase.exit.map((e) => (
                  <li key={e} className="text-[13.5px] text-ink-2 leading-snug flex gap-2">
                    <span className="mt-[3px] w-3.5 h-3.5 rounded-[3px] border border-line-2 shrink-0" aria-hidden />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>

            {(p.phase.categories.length > 0 || (p.phase.alsoTouches?.length ?? 0) > 0) && (
              <div className="rounded-lg border border-line px-4 py-3">
                <Eyebrow>{p.phase.categories.length ? "Trades working" : "Trades to order from"}</Eyebrow>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(p.phase.categories.length ? p.phase.categories : p.phase.alsoTouches ?? [])
                    .map((c) => <Chip key={c} tone="ghost">{label(c)}</Chip>)}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-line px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>Sitting here right now</Eyebrow>
                {items.length > 0 && <span className="text-[12px] text-ink-3 tnum">{items.length.toLocaleString("en-IN")}</span>}
              </div>
              {items.length === 0 ? (
                <p className="text-[13.5px] text-ink-3 mt-1.5 leading-relaxed">
                  Nothing in the project is waiting on this phase.
                </p>
              ) : (
                <>
                  <ul className="mt-1.5 space-y-1">
                    {shown.map((i) => (
                      <li key={i.id}>
                        <Link href={i.spaceId ? `/villa/${i.spaceId}` : "/costs"}
                          className="block text-[13.5px] text-ink-2 leading-snug hover:text-accent-strong hover:underline truncate">
                          {i.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {items.length > 8 && (
                    <div className="flex gap-4 mt-2 text-[13px]">
                      {limit < items.length && (
                        <button className="link" onClick={() => setLimit(limit + 40)}>
                          Show {Math.min(40, items.length - limit)} more
                          <span className="text-ink-3 font-normal"> of {(items.length - limit).toLocaleString("en-IN")} left</span>
                        </button>
                      )}
                      {limit > 8 && <button className="link" onClick={() => setLimit(8)}>Show fewer</button>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
