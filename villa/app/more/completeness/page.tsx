"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { EntityLink } from "@/components/Entity";
import { findGaps, bucketOf, COMPLETENESS_BUCKETS, type Gap, type GapSeverity } from "@/lib/model/derive";
import { FLOOR_META } from "@/lib/seed/spaces";
import { PageTitle, Chip, Empty, Section, LegendDot, toneInk } from "@/components/ui";
import { Icon } from "@/components/Icon";

const SEVERITIES: GapSeverity[] = ["blocker", "risk", "gap", "nudge"];
const SEV_LABEL: Record<GapSeverity, string> = {
  blocker: "Blocker", risk: "Risk", gap: "Gap", nudge: "Not budgeted",
};
const SEV_PLURAL: Record<GapSeverity, string> = {
  blocker: "blockers", risk: "risks", gap: "gaps", nudge: "not budgeted",
};
const SEV_TONE: Record<GapSeverity, "bad" | "warn" | "accent" | "neutral"> = {
  blocker: "bad", risk: "warn", gap: "accent", nudge: "neutral",
};

/** One colour per stage bucket — from nothing yet, through deciding, to done. */
const BUCKET_FILL: Record<string, string> = {
  "not-started": "var(--color-paper-3)",
  considering: "color-mix(in srgb, var(--color-warn) 40%, var(--color-paper-2))",
  decided: "color-mix(in srgb, var(--color-info) 45%, var(--color-paper-2))",
  approved: "var(--color-info)",
  ordered: "color-mix(in srgb, var(--color-good) 45%, var(--color-paper-2))",
  installed: "color-mix(in srgb, var(--color-good) 75%, var(--color-paper-2))",
  verified: "var(--color-good)",
  na: "var(--color-line)",
};

const FIRST = 5;   // rows shown when a group opens
const STEP = 25;   // rows added by "show more"

type GroupBy = "room" | "severity";
interface Group { key: string; eyebrow?: string; title: string; href?: string; gaps: Gap[] }

/**
 * The completeness engine, made visible.
 *
 * The purpose is not to report what has been entered. It is to surface what has
 * not yet been thought about — the sequencing trap, the unowned warranty, the
 * long-lead item nobody has decided, the allowance that was never put against
 * acoustic treatment.
 *
 * On an untouched villa that is well over a thousand lines, so it is grouped
 * and folded: a room at a time, the worst first, a few lines at a time.
 */
export default function CompletenessPage() {
  const { state } = useProject();
  const [sev, setSev] = useState<GapSeverity | "all">("all");
  const [by, setBy] = useState<GroupBy>("room");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, number>>({});

  const gaps = useMemo(() => findGaps(state), [state]);
  const spaceById = useMemo(() => new Map(state.spaces.map((s) => [s.id, s])), [state.spaces]);
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () => gaps.filter((g) => (sev === "all" || g.severity === sev)
      && (!needle || `${g.title} ${g.detail} ${g.action ?? ""}`.toLowerCase().includes(needle))),
    [gaps, sev, needle],
  );

  // State of every scope item across the eight buckets.
  const buckets = COMPLETENESS_BUCKETS.map((b) => ({
    ...b, n: state.items.filter((i) => bucketOf(i.stage) === b.key).length,
  }));
  const total = state.items.length;

  const groups: Group[] = useMemo(() => {
    if (by === "severity") {
      return SEVERITIES.map((s) => ({ key: `sev:${s}`, title: SEV_LABEL[s], gaps: filtered.filter((g) => g.severity === s) }))
        .filter((g) => g.gaps.length);
    }
    const m = new Map<string, Gap[]>();
    for (const g of filtered) {
      const k = g.spaceId && spaceById.has(g.spaceId) ? g.spaceId : "house";
      m.set(k, [...(m.get(k) ?? []), g]);
    }
    const weight = (list: Gap[]) => list.filter((g) => g.severity === "blocker").length * 1000 + list.length;
    return Array.from(m.entries())
      .sort((a, b) => weight(b[1]) - weight(a[1]))
      .map(([k, list]) => {
        const space = spaceById.get(k);
        return {
          key: k,
          eyebrow: space ? FLOOR_META[space.floor].label : "Whole house",
          title: space ? space.name : "House-wide",
          href: space ? `/villa/${space.id}` : undefined,
          gaps: list,
        };
      });
  }, [by, filtered, spaceById]);

  // The first group starts open unless someone has said otherwise.
  const isOpen = (k: string, i: number) => open[`${by}:${k}`] ?? i === 0;
  const setGroupOpen = (k: string, v: boolean) => setOpen((o) => ({ ...o, [`${by}:${k}`]: v }));
  const allOpen = groups.length > 0 && groups.every((g, i) => isOpen(g.key, i));
  const setAll = (v: boolean) => setOpen((o) => ({ ...o, ...Object.fromEntries(groups.map((g) => [`${by}:${g.key}`, v])) }));
  const filtering = sev !== "all" || !!needle;

  return (
    <div>
      <PageTitle
        title="What has not been thought about"
        sub="Every room and system checked against what it needs. This is not a progress report — it is a list of the things that are still invisible."
      />

      {/* --------------------------------------------------------- the scope */}
      <Section title="Every scope item in the villa">
        <div className="card px-5 py-5">
          <div className="flex h-3 rounded-full overflow-hidden bg-paper-3 gap-px mb-4" role="img"
            aria-label={buckets.filter((b) => b.n).map((b) => `${b.label} ${b.n}`).join(", ")}>
            {buckets.map((b) => (b.n && total ? (
              <div key={b.key} style={{ width: `${(b.n / total) * 100}%`, background: BUCKET_FILL[b.key] }} title={`${b.label}: ${b.n}`} />
            ) : null))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-3">
            {buckets.map((b) => (
              <div key={b.key} className="min-w-0">
                <div className={`text-[20px] font-semibold leading-none tracking-[-0.01em] ${b.n ? "text-ink" : "text-ink-3"}`}>
                  {b.n.toLocaleString("en-IN")}
                </div>
                <div className="text-[12.5px] text-ink-3 mt-1.5 leading-snug">
                  <LegendDot color={BUCKET_FILL[b.key]} label={b.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- the gaps */}
      <Section
        title={<span className="inline-flex items-baseline gap-2">What is missing <span className="text-[13px] font-normal text-ink-3 tnum">{gaps.length.toLocaleString("en-IN")}</span></span>}
      >
        {gaps.length === 0 ? (
          <Empty icon="check" title="Nothing is missing."
            hint="Every room has what it needs against it, nothing is waiting to be closed over, and every whole-house system has an owner." />
        ) : (
          <>
            <div className="grid gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <label className="input flex items-center gap-2 flex-1 min-w-[220px] max-w-xl">
                  <Icon name="search" size={17} className="text-ink-4 shrink-0" />
                  <input className="w-full bg-transparent outline-none" placeholder="Search, e.g. waterproofing"
                    aria-label="Search what is missing" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
                </label>
                <div className="flex items-center gap-1.5" role="group" aria-label="Group by">
                  <span className="text-[13px] text-ink-3 mr-1">Group by</span>
                  <button className="pill" aria-pressed={by === "room"} onClick={() => setBy("room")}>Room</button>
                  <button className="pill" aria-pressed={by === "severity"} onClick={() => setBy("severity")}>Severity</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by severity">
                <button onClick={() => setSev("all")} className="pill" aria-pressed={sev === "all"}>
                  Everything <span className="count">{gaps.length.toLocaleString("en-IN")}</span>
                </button>
                {SEVERITIES.map((s) => (
                  <button key={s} onClick={() => setSev(s)} className="pill" aria-pressed={sev === s}>
                    <span className="w-2 h-2 rounded-full" style={{ background: s === "nudge" ? "var(--color-ink-4)" : toneInk(SEV_TONE[s]) }} aria-hidden />
                    {SEV_LABEL[s]} <span className="count">{gaps.filter((g) => g.severity === s).length.toLocaleString("en-IN")}</span>
                  </button>
                ))}
              </div>
            </div>

            {!filtered.length ? (
              <Empty icon="search" title="Nothing matches."
                hint={needle ? <>No {sev === "all" ? "line" : SEV_LABEL[sev].toLowerCase()} mentions &ldquo;{q.trim()}&rdquo;.</> : `No ${SEV_PLURAL[sev as GapSeverity]} flagged.`}
                action={filtering ? <button className="btn btn-sm" onClick={() => { setSev("all"); setQ(""); }}>Clear filters</button> : undefined} />
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5 text-[13px] text-ink-3">
                  <span className="tnum">
                    {filtered.length.toLocaleString("en-IN")} line{filtered.length === 1 ? "" : "s"} in {groups.length} {by === "room" ? (groups.length === 1 ? "place" : "places") : (groups.length === 1 ? "group" : "groups")}
                    {by === "room" && " · rooms with blockers first"}
                  </span>
                  {groups.length > 1 && (
                    <button className="link" onClick={() => setAll(!allOpen)}>{allOpen ? "Collapse all" : "Expand all"}</button>
                  )}
                </div>
                <div className="card divide-y divide-line overflow-hidden">
                  {groups.map((grp, i) => (
                    <GapGroup
                      key={`${by}:${grp.key}`} group={grp} by={by}
                      open={isOpen(grp.key, i)} onToggle={() => setGroupOpen(grp.key, !isOpen(grp.key, i))}
                      limit={limits[`${by}:${grp.key}`] ?? FIRST}
                      setLimit={(n) => setLimits((l) => ({ ...l, [`${by}:${grp.key}`]: n }))}
                      spaceName={(id) => (id ? spaceById.get(id)?.name : undefined)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Section>
    </div>
  );
}

function GapGroup({
  group, by, open, onToggle, limit, setLimit, spaceName,
}: {
  group: Group; by: GroupBy; open: boolean; onToggle: () => void;
  limit: number; setLimit: (n: number) => void; spaceName: (id?: string) => string | undefined;
}) {
  const panelId = `gaps-${group.key.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const counts = SEVERITIES.map((s) => ({ s, n: group.gaps.filter((g) => g.severity === s).length })).filter((c) => c.n);
  const shown = group.gaps.slice(0, limit);
  const left = group.gaps.length - shown.length;

  return (
    <section>
      <div className="flex items-center">
        <button onClick={onToggle} aria-expanded={open} aria-controls={panelId}
          className="flex-1 min-w-0 flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-paper transition-colors group">
          <Icon name="chevron-right" size={17} className={`text-ink-4 group-hover:text-ink shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
          <span className="min-w-0 flex-1">
            {group.eyebrow && <span className="eyebrow block">{group.eyebrow}</span>}
            <span className="block text-[15.5px] font-semibold text-ink leading-snug truncate">{group.title}</span>
          </span>
          <span className="hidden sm:flex flex-wrap justify-end gap-1.5 shrink-0">
            {by === "room" && counts.map(({ s, n }) => (
              <Chip key={s} tone={SEV_TONE[s]} small>{n} {n === 1 ? SEV_LABEL[s].toLowerCase() : SEV_PLURAL[s]}</Chip>
            ))}
          </span>
          <span className="text-[13px] text-ink-3 tnum shrink-0 w-12 text-right">{group.gaps.length.toLocaleString("en-IN")}</span>
        </button>
        {group.href && (
          <Link href={group.href} className="btn btn-ghost btn-icon btn-sm mr-2 sm:mr-3 shrink-0" aria-label={`Open ${group.title}`} title={`Open ${group.title}`}>
            <Icon name="open" size={16} />
          </Link>
        )}
      </div>
      {by === "room" && counts.length > 0 && !open && (
        <div className="sm:hidden flex flex-wrap gap-1.5 px-4 pb-3 -mt-1.5 pl-11">
          {counts.map(({ s, n }) => (
            <Chip key={s} tone={SEV_TONE[s]} small>{n} {n === 1 ? SEV_LABEL[s].toLowerCase() : SEV_PLURAL[s]}</Chip>
          ))}
        </div>
      )}

      {open && (
        <div id={panelId} className="border-t border-line bg-paper/40">
          <ul className="divide-y divide-line">
            {shown.map((g) => {
              const room = spaceName(g.spaceId);
              const prefix = `${room ?? "House-wide"} — `;
              const title = g.title.startsWith(prefix) ? g.title.slice(prefix.length) : g.title;
              return (
                <li key={g.id} className="px-4 sm:px-5 py-3.5 sm:pl-12 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                      {by === "room"
                        ? <Chip tone={SEV_TONE[g.severity]} small>{SEV_LABEL[g.severity]}</Chip>
                        : <span className="text-[13px] text-ink-3">{room ?? "House-wide"}</span>}
                    </div>
                    <div className="text-[14.5px] text-ink leading-snug">{title.replace(/^./, (c) => c.toUpperCase())}</div>
                    <p className="text-[13.5px] text-ink-3 mt-1 leading-relaxed">{g.detail}</p>
                    {g.action && (
                      <p className="text-[13.5px] text-accent-strong mt-1.5 leading-relaxed flex gap-1.5">
                        <Icon name="arrow-right" size={15} className="shrink-0 mt-[3px]" /> <span>{g.action}</span>
                      </p>
                    )}
                  </div>
                  {g.scopeItemId ? (
                    <EntityLink on="items" id={g.scopeItemId} className="btn btn-sm shrink-0">
                      Open<span className="sr-only"> {title}</span>
                    </EntityLink>
                  ) : g.spaceId ? (
                    <EntityLink on="spaces" id={g.spaceId} className="btn btn-sm shrink-0">
                      Open<span className="sr-only"> {room}</span>
                    </EntityLink>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {(left > 0 || limit > FIRST) && (
            <div className="px-4 sm:px-5 sm:pl-12 py-3 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px]">
              {left > 0 && (
                <button className="link" onClick={() => setLimit(limit + STEP)}>
                  Show {Math.min(STEP, left)} more
                </button>
              )}
              {left > STEP && (
                <button className="link" onClick={() => setLimit(group.gaps.length)}>Show all {group.gaps.length.toLocaleString("en-IN")}</button>
              )}
              {limit > FIRST && <button className="link" onClick={() => setLimit(FIRST)}>Show fewer</button>}
              <span className="text-ink-3 tnum sm:ml-auto">Showing {shown.length.toLocaleString("en-IN")} of {group.gaps.length.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
