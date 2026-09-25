"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { specLines, specProgress, WHEN_LABEL, type RoomSpec, type SpecLine } from "@/lib/specs";
import { Bar, Chip, Empty, useToast } from "./ui";
import { Icon } from "./Icon";

type Filter = "all" | "open" | "critical";

/**
 * A room's material specification as a checklist people work through on site.
 * The spec text is always visible; why it matters here, how to check it and
 * what to refuse fold out beneath it. Ticks are saved on the room and show up
 * in History with the name of whoever ticked them.
 */
export function SpecChecklist({ spec }: { spec: RoomSpec }) {
  const { state, dispatch } = useProject();
  const toast = useToast();
  const space = state.spaces.find((s) => s.id === spec.spaceId);
  const checks = space?.specChecks ?? {};
  const [filter, setFilter] = useState<Filter>("all");
  const p = specProgress(spec, checks);

  const set = (line: SpecLine, value?: "done" | "na") =>
    dispatch({ type: "space/spec", id: spec.spaceId, key: line.id, value, label: line.title });

  const visible = (l: SpecLine) =>
    filter === "all" ? true
      : filter === "open" ? checks[l.id] !== "done" && checks[l.id] !== "na"
        : !!l.critical && checks[l.id] !== "done" && checks[l.id] !== "na";

  const copy = async () => {
    const text = asText(spec, checks);
    try {
      await navigator.clipboard.writeText(text);
      toast("Specification copied — paste it into WhatsApp or an email");
    } catch {
      toast("Couldn't copy here. Select the text on the page instead.", { tone: "bad" });
    }
  };

  const anyVisible = spec.sections.some((s) => s.lines.some(visible));

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------- summary */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
        <div className="card px-5 py-5">
          <h2 className="text-[17px]">{spec.title}</h2>
          <p className="text-[14px] text-ink-2 leading-relaxed mt-1.5">{spec.intro}</p>
          <div className="mt-4 flex items-center gap-3">
            <Bar pct={p.pct} height={6} label="Specification ticked off" />
            <span className="text-[13px] text-ink-2 tnum shrink-0">{p.done} of {p.total}</span>
          </div>
          <p className="text-[13px] mt-1.5 text-ink-3">
            {p.criticalOpen > 0
              ? <><span className="font-semibold text-accent-strong">{p.criticalOpen} critical</span> still open — these cost the most to put right later.</>
              : "Every critical line is ticked off."}
          </p>
          <details className="mt-4 group">
            <summary className="list-none cursor-pointer text-[13.5px] link inline-flex items-center gap-1">
              Written for these conditions
              <Icon name="chevron-down" size={14} className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink-2 leading-relaxed list-disc pl-5">
              {spec.context.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </details>
        </div>
        <div className="card px-5 py-5">
          <div className="eyebrow mb-2.5">The finished room has to measure</div>
          <dl className="divide-y divide-line">
            {spec.targets.map((t) => (
              <div key={t.k} className="py-2 grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.6fr)] gap-3 text-[13.5px]">
                <dt className="text-ink-3">{t.k}</dt>
                <dd className="text-ink leading-snug">{t.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ----------------------------------------------------------- toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Show">
          <button className="pill" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            Everything <span className="count">{specLines(spec).length}</span>
          </button>
          <button className="pill" aria-pressed={filter === "open"} onClick={() => setFilter("open")}>
            Still open <span className="count">{p.total - p.done}</span>
          </button>
          <button className="pill" aria-pressed={filter === "critical"} onClick={() => setFilter("critical")}>
            Critical, open <span className="count">{p.criticalOpen}</span>
          </button>
        </div>
        <button className="btn btn-sm" onClick={() => void copy()}>
          <Icon name="documents" size={15} /> Copy as text
        </button>
      </div>

      {/* ---------------------------------------------------------- sections */}
      {!anyVisible ? (
        <Empty icon="check" title={filter === "critical" ? "No critical lines left open." : "Everything is ticked off."}
          action={<button className="btn btn-sm" onClick={() => setFilter("all")}>Show everything</button>} />
      ) : spec.sections.map((sec, i) => {
        const lines = sec.lines.filter(visible);
        if (!lines.length) return null;
        const secDone = sec.lines.filter((l) => checks[l.id] === "done").length;
        const secLive = sec.lines.filter((l) => checks[l.id] !== "na").length;
        return (
          <section key={sec.id} aria-labelledby={`spec-${sec.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h3 id={`spec-${sec.id}`} className="text-[16px]">
                <span className="text-ink-3 font-mono text-[13px] mr-2">{String(i + 1).padStart(2, "0")}</span>{sec.title}
              </h3>
              <span className="text-[13px] text-ink-3 tnum">{secDone} of {secLive}</span>
            </div>
            <p className="text-[13.5px] text-ink-3 leading-relaxed mb-3 max-w-3xl">{sec.blurb}</p>
            <ul className="card divide-y divide-line overflow-hidden">
              {lines.map((l) => <Line key={l.id} line={l} value={checks[l.id]} onSet={(v) => set(l, v)} />)}
            </ul>
          </section>
        );
      })}

      <p className="text-[13px] text-ink-3 leading-relaxed max-w-3xl">{spec.caveat}</p>
    </div>
  );
}

function Line({ line: l, value, onSet }: { line: SpecLine; value?: "done" | "na"; onSet: (v?: "done" | "na") => void }) {
  const [open, setOpen] = useState(false);
  const done = value === "done";
  const na = value === "na";
  const hasMore = !!(l.india || l.verify || l.avoid);
  return (
    <li className={`px-4 sm:px-5 py-4 ${na ? "bg-paper" : ""}`}>
      <div className="flex items-start gap-3.5">
        <button
          role="checkbox" aria-checked={done} aria-label={`${l.title}${done ? ", done" : ""}`}
          disabled={na}
          onClick={() => onSet(done ? undefined : "done")}
          className={`mt-0.5 w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${done ? "bg-good border-good text-white" : "border-ink-4 hover:border-ink bg-card"} disabled:opacity-40`}
        >
          {done && <Icon name="check" size={15} strokeWidth={2.4} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-[15px] font-semibold leading-snug ${done || na ? "text-ink-3" : ""} ${na ? "line-through" : ""}`}>{l.title}</span>
            {l.critical && !done && !na && <Chip tone="accent" small>critical</Chip>}
            <Chip tone="ghost" small>{WHEN_LABEL[l.when]}</Chip>
            {na && <Chip tone="neutral" small>not needed here</Chip>}
          </div>
          <p className={`text-[14px] leading-relaxed mt-1.5 ${done || na ? "text-ink-3" : "text-ink-2"}`}>{l.spec}</p>

          <button className="link text-[13px] mt-2 inline-flex items-center gap-1" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Less" : hasMore ? "Why here, how to check" : "More"}
            <Icon name="chevron-down" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-3 grid gap-3 animate-fade">
              {l.india && <Note label="Why it matters here" tone="info">{l.india}</Note>}
              {l.verify && <Note label="Check on site" tone="good">{l.verify}</Note>}
              {l.avoid && <Note label="Don't accept" tone="bad">{l.avoid}</Note>}
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => onSet(na ? undefined : "na")}>
                  {na ? "Needed after all" : "Not needed in this room"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function Note({ label, tone, children }: { label: string; tone: "info" | "good" | "bad"; children: React.ReactNode }) {
  return (
    <div className="rounded-lg px-3.5 py-2.5 border-l-[3px]" style={{ background: `var(--color-${tone}-soft)`, borderColor: `var(--color-${tone})` }}>
      <div className="eyebrow" style={{ color: `var(--color-${tone})` }}>{label}</div>
      <p className="text-[13.5px] text-ink-2 leading-relaxed mt-1">{children}</p>
    </div>
  );
}

/** Plain text for WhatsApp or email: one line per item, ticks shown. */
function asText(spec: RoomSpec, checks: Record<string, "done" | "na">): string {
  const out: string[] = [spec.title.toUpperCase(), "", "TARGETS"];
  for (const t of spec.targets) out.push(`- ${t.k}: ${t.v}`);
  spec.sections.forEach((sec, i) => {
    out.push("", `${i + 1}. ${sec.title.toUpperCase()}`);
    for (const l of sec.lines) {
      const mark = checks[l.id] === "done" ? "[x]" : checks[l.id] === "na" ? "[n/a]" : "[ ]";
      out.push(`${mark} ${l.title}${l.critical ? " (CRITICAL)" : ""} — ${WHEN_LABEL[l.when]}`);
      out.push(`    Use: ${l.spec}`);
      if (l.verify) out.push(`    Check: ${l.verify}`);
      if (l.avoid) out.push(`    Don't accept: ${l.avoid}`);
    }
  });
  out.push("", spec.caveat);
  return out.join("\n");
}

/** For tests and other screens: the spec's progress, from the room. */
export function useSpecProgress(spec: RoomSpec) {
  const { state } = useProject();
  const checks = state.spaces.find((s) => s.id === spec.spaceId)?.specChecks;
  return useMemo(() => specProgress(spec, checks), [spec, checks]);
}
