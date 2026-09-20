"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { PHASES, phaseProgress, currentPhase, phaseOfItem, type PhaseProgress } from "@/lib/model/phases";
import { catLabel } from "@/lib/model/categories";
import { inr } from "@/lib/model/costing";
import { PageTitle, Eyebrow, Chip, Stat, Bar } from "@/components/ui";

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

  return (
    <div>
      <PageTitle
        title="Phases"
        sub="Twelve phases, in the order a fit-out actually runs. Almost every expensive mistake on a villa is a phase done out of order, so each one states what must be true before the next may start."
        right={<Link href="/checklist" className="btn btn-sm">Room checklists →</Link>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Currently in" value={`Phase ${now.phase.n}`} sub={now.phase.name} />
        <Stat label="Indicative programme" value={`${totalWeeks} weeks`} sub="from mobilisation to handover" />
        <Stat label="Scope placed" value={live.length} sub="items sitting in a phase" />
        <Stat label="Phases complete" value={`${progress.filter((p) => p.status === "complete").length} / ${PHASES.length}`} />
      </div>

      {/* ------------------------------------------------------ the programme */}
      <div className="card px-4 py-4 mb-6 overflow-x-auto thin-scroll">
        <Eyebrow className="mb-3">The programme at a glance</Eyebrow>
        <div className="min-w-[640px] space-y-1">
          {progress.map((p) => {
            const [a, b] = p.phase.weeks;
            return (
              <button key={p.phase.id} onClick={() => setOpen(p.phase.id)}
                className="w-full flex items-center gap-2 group text-left">
                <span className="text-[11px] text-ink-3 tnum w-5 shrink-0 text-right">{p.phase.n}</span>
                <span className="text-[11.5px] w-44 shrink-0 truncate group-hover:text-clay"
                  style={{ fontWeight: p.phase.id === now.phase.id ? 600 : 400 }}>{p.phase.name}</span>
                <span className="relative flex-1 h-4 rounded" style={{ background: "#f4f0ea" }}>
                  <span className="absolute inset-y-0 rounded" title={`Weeks ${a}–${b}`}
                    style={{
                      left: `${(a / totalWeeks) * 100}%`,
                      width: `${((b - a) / totalWeeks) * 100}%`,
                      background: p.status === "complete" ? "#a9bda4" : p.phase.id === now.phase.id ? "#c07a52" : "#d8cfc2",
                    }}
                  />
                </span>
                <span className="text-[10.5px] text-ink-3 tnum w-16 shrink-0 text-right">w{a}–{b}</span>
                <span className="text-[10.5px] text-ink-3 tnum w-10 shrink-0 text-right">
                  {p.items ? `${Math.round(p.pct)}%` : "—"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-3 mt-3 leading-relaxed max-w-3xl">
          Weeks are indicative for a villa of this size and overlap on purpose — design development runs
          while long-lead goods are being ordered. They show the shape of the programme, not a promised date.
          Real dates live on the <Link href="/timeline" className="text-clay hover:underline">timeline</Link>.
        </p>
      </div>

      {/* ---------------------------------------------------------- the cards */}
      <div className="space-y-2.5">
        {progress.map((p) => (
          <PhaseCard key={p.phase.id} p={p} now={now.phase.id === p.phase.id}
            open={open === p.phase.id} onToggle={() => setOpen(open === p.phase.id ? null : p.phase.id)}
            items={state.items.filter((i) => i.stage !== "not-applicable" && phaseOfItem(i).id === p.phase.id)}
            label={(c: string) => catLabel(state, c)} />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({
  p, now, open, onToggle, items, label,
}: {
  p: PhaseProgress; now: boolean; open: boolean; onToggle: () => void;
  items: { id: string; title: string; spaceId?: string; category: string }[];
  label: (c: string) => string;
}) {
  const tone = p.status === "complete" ? "sage" : now ? "clay" : "neutral";
  return (
    <div id={p.phase.id} className="card px-4 sm:px-5 py-4 scroll-mt-20" style={now ? { borderColor: "var(--color-clay)" } : undefined}>
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-ink-3 tnum">Phase {p.phase.n}</span>
              <span className="text-[16px]" style={{ fontFamily: "var(--font-display)" }}>{p.phase.name}</span>
              {now && <Chip tone="clay">you are here</Chip>}
              {p.status === "complete" && p.items > 0 && <Chip tone="sage">complete</Chip>}
              {!p.ready && p.status !== "complete" && (
                <Chip tone="ochre" title="An earlier phase has not cleared. Starting here means building on something unfinished.">runs ahead of an unfinished phase</Chip>
              )}
            </div>
            <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed max-w-3xl">{p.phase.goal}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-ink-3 tnum">weeks {p.phase.weeks[0]}–{p.phase.weeks[1]}</div>
            {p.items > 0 && (
              <div className="text-[11px] text-ink-3 tnum mt-0.5">{p.cleared} / {p.items} cleared · {inr(p.value, { compact: true })}</div>
            )}
          </div>
        </div>
        {p.items > 0 && <div className="mt-2.5"><Bar pct={p.pct} height={4} /></div>}
      </button>

      {open && (
        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_280px] gap-5 animate-rise">
          <div>
            <Eyebrow className="mb-2">What happens in this phase</Eyebrow>
            <ol className="space-y-2.5">
              {p.phase.steps.map((st, n) => (
                <li key={st.title} className="flex gap-2.5">
                  <span className="text-[11px] text-ink-3 tnum shrink-0 mt-0.5 w-4 text-right">{n + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] leading-snug">
                      {st.title}
                      {st.critical && <span className="ml-1.5"><Chip tone="clay">critical</Chip></span>}
                    </div>
                    <p className="text-[11.5px] text-ink-3 mt-0.5 leading-relaxed">{st.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="card-quiet px-3.5 py-3 mt-4">
              <Eyebrow>The trap this phase exists to prevent</Eyebrow>
              <p className="text-[12px] text-ink-2 mt-1.5 leading-relaxed">{p.phase.trap}</p>
            </div>
          </div>

          <div>
            <div className="card-quiet px-3.5 py-3">
              <Eyebrow>Before the next phase starts</Eyebrow>
              <ul className="mt-2 space-y-1.5">
                {p.phase.exit.map((e) => (
                  <li key={e} className="text-[11.5px] text-ink-2 leading-snug flex gap-1.5">
                    <span className="text-ink-4 shrink-0">□</span><span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>

            {(p.phase.categories.length > 0 || p.phase.alsoTouches?.length) && (
              <div className="card-quiet px-3.5 py-3 mt-3">
                <Eyebrow>{p.phase.categories.length ? "Trades working" : "Trades to order from"}</Eyebrow>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(p.phase.categories.length ? p.phase.categories : p.phase.alsoTouches ?? [])
                    .map((c) => <Chip key={c} tone="ghost">{label(c)}</Chip>)}
                </div>
              </div>
            )}

            <div className="card-quiet px-3.5 py-3 mt-3">
              <Eyebrow>Sitting here right now</Eyebrow>
              {items.length === 0 ? (
                <p className="text-[11.5px] text-ink-3 mt-1.5 leading-relaxed">
                  Nothing in the project is waiting on this phase.
                </p>
              ) : (
                <>
                  <div className="mt-1.5 space-y-1">
                    {items.slice(0, 8).map((i) => (
                      <Link key={i.id} href={i.spaceId ? `/villa/${i.spaceId}` : "/costs"}
                        className="block text-[11.5px] text-ink-2 leading-snug hover:text-clay truncate">
                        {i.title}
                      </Link>
                    ))}
                  </div>
                  {items.length > 8 && (
                    <div className="text-[11px] text-ink-3 mt-1.5 tnum">and {items.length - 8} more</div>
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
