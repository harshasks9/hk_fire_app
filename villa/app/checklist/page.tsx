"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { roomChecklist, houseChecklist, checklistSummaries, type Checklist, type Check } from "@/lib/model/checklist";
import { FLOOR_META } from "@/lib/seed/spaces";
import { DimsShort } from "@/components/Measure";
import { roomLens } from "@/lib/model/lens";
import { PageTitle, Eyebrow, Chip, Stat, Bar, Empty } from "@/components/ui";
import type { FloorId } from "@/lib/model/types";

/**
 * The planning checklist.
 *
 * One room at a time, the whole list, in the order a fit-out actually runs.
 * Its job is to make it impossible to arrive at handover and discover that
 * nobody ever thought about the AC drain, the loft access or the warranty.
 */

const FLOORS: (FloorId | "house")[] = ["outdoor", "ground", "first", "second", "house"];

const STATE_MARK: Record<Check["state"], { mark: string; tone: string; label: string }> = {
  done: { mark: "✓", tone: "#41603f", label: "Done" },
  partial: { mark: "◐", tone: "#8a6a20", label: "Started" },
  todo: { mark: "○", tone: "#9c5333", label: "Not yet" },
  na: { mark: "–", tone: "#a9a196", label: "Not applicable" },
};

export default function ChecklistPage() {
  const { state, role, meId } = useProject();
  const [open, setOpen] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);

  const summaries = useMemo(() => {
    const sees = roomLens(state, role, meId);
    return checklistSummaries(state).filter((s) => sees(s.spaceId));
  }, [state, role, meId]);
  const house = useMemo(() => houseChecklist(state), [state]);
  const active: Checklist | undefined = useMemo(
    () => (open === "house" ? house : open ? roomChecklist(state, open) : undefined),
    [open, state, house],
  );

  const done = summaries.reduce((a, s) => a + s.done, 0) + house.done;
  const total = summaries.reduce((a, s) => a + s.total, 0) + house.total;
  const criticalOpen = summaries.reduce((a, s) => a + s.criticalOpen, 0) + house.criticalOpen;
  const roomsClear = summaries.filter((s) => s.pct >= 100).length;

  if (!state.spaces.length) {
    return (
      <div>
        <PageTitle title="Checklist" sub="A room-by-room list of everything that has to be thought about." />
        <Empty title="No rooms yet." hint="Add the villa's spaces and every one of them arrives with its own full checklist." />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Planning checklist"
        sub="Every room, every line a good designer would work through — including the boring, invisible, expensive ones. A line is never deleted, only marked not applicable with a reason."
        right={<Link href="/phases" className="btn btn-sm">What happens when →</Link>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Checked off" value={`${total ? Math.round((done / total) * 100) : 0}%`} sub={`${done} of ${total} lines`} />
        <Stat label="Critical outstanding" value={criticalOpen || "—"} tone={criticalOpen ? "clay" : undefined}
          sub={criticalOpen ? "these hold up other work" : "nothing critical open"} />
        <Stat label="Rooms complete" value={`${roomsClear} / ${summaries.length}`} />
        <Stat label="House-wide" value={`${Math.round(house.pct)}%`} sub={`${house.done} of ${house.total} lines`} />
      </div>

      {FLOORS.map((f) => {
        const rows = f === "house"
          ? [{ spaceId: "house", name: "House-wide scope", floor: "house" as const, pct: house.pct, done: house.done, total: house.total, criticalOpen: house.criticalOpen, next: house.next }]
          : summaries.filter((s) => s.floor === f);
        if (!rows.length) return null;
        return (
          <div key={f} className="mb-6">
            <Eyebrow className="mb-2">
              {f === "house" ? "Belongs to no single room" : FLOOR_META[f as FloorId].label}
            </Eyebrow>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {rows.map((r) => {
                const sp = state.spaces.find((x) => x.id === r.spaceId);
                const on = open === r.spaceId;
                return (
                  <button
                    key={r.spaceId}
                    onClick={() => setOpen(on ? null : r.spaceId)}
                    className="card px-3.5 py-3 text-left hover:border-ink-4 transition-colors"
                    style={on ? { borderColor: "var(--color-ink)" } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13.5px] leading-snug">{r.name}</div>
                        <div className="text-[11px] text-ink-3 mt-0.5">
                          {sp ? <DimsShort sp={sp} /> : "Enabling works, systems and statutory"}
                        </div>
                      </div>
                      <span className="tnum text-[12px] text-ink-3 shrink-0">{Math.round(r.pct)}%</span>
                    </div>
                    <div className="mt-2"><Bar pct={r.pct} height={4} /></div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-ink-3 tnum">{r.done} / {r.total}</span>
                      {r.criticalOpen > 0 && <Chip tone="clay">{r.criticalOpen} critical</Chip>}
                    </div>
                    {r.next && (
                      <div className="text-[11px] text-ink-3 mt-1.5 leading-snug">
                        Next: <span className="text-ink-2">{r.next.label}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {active && (
        <div className="card px-4 sm:px-5 py-5 mt-2 animate-rise">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
            <div>
              <div className="text-[19px]" style={{ fontFamily: "var(--font-display)" }}>{active.name}</div>
              <div className="text-[12px] text-ink-3 mt-0.5 tnum">
                {active.done} of {active.total} checked · {Math.round(active.pct)}%
                {active.criticalOpen > 0 && <> · {active.criticalOpen} critical outstanding</>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm" onClick={() => setHideDone((v) => !v)}>
                {hideDone ? "Show completed" : "Hide completed"}
              </button>
              {active.spaceId && <Link href={`/villa/${active.spaceId}`} className="btn btn-sm">Open the room →</Link>}
              <button className="btn btn-sm" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {active.sections.map((sec) => {
              const checks = hideDone ? sec.checks.filter((c) => c.state !== "done") : sec.checks;
              if (!checks.length) return null;
              return (
                <section key={sec.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[14.5px]" style={{ fontFamily: "var(--font-display)" }}>{sec.title}</h3>
                    <span className="text-[11.5px] text-ink-3 tnum">
                      {sec.done} / {sec.total}
                      {sec.criticalOpen > 0 && <span className="text-clay"> · {sec.criticalOpen} critical</span>}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-ink-3 mt-1 mb-2.5 leading-relaxed max-w-3xl">{sec.blurb}</p>
                  <ul className="space-y-0.5">
                    {checks.map((c) => <CheckRow key={c.id} c={c} />)}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckRow({ c }: { c: Check }) {
  const [open, setOpen] = useState(false);
  const m = STATE_MARK[c.state];
  return (
    <li className="border-b border-ink-6 last:border-0">
      <div className="flex items-start gap-2.5 py-1.5">
        <span className="text-[13px] leading-5 shrink-0 w-3.5 text-center" style={{ color: m.tone }} title={m.label}>{m.mark}</span>
        <button className="text-left min-w-0 flex-1" onClick={() => setOpen((v) => !v)}>
          <span className={`text-[12.5px] leading-snug ${c.state === "na" ? "text-ink-3 line-through" : c.state === "done" ? "text-ink-2" : ""}`}>
            {c.label}
          </span>
          {c.critical && c.state !== "done" && c.state !== "na" && <span className="ml-1.5"><Chip tone="clay">critical</Chip></span>}
          {c.detail && <span className="text-[11px] text-ink-3 ml-1.5 tnum">— {c.detail}</span>}
        </button>
        {c.href && (
          <Link href={c.href} className="text-[11px] text-clay hover:underline shrink-0 mt-0.5">open →</Link>
        )}
      </div>
      {open && c.why && (
        <p className="text-[11.5px] text-ink-3 leading-relaxed pl-6 pb-2 pr-2 max-w-3xl">{c.why}</p>
      )}
    </li>
  );
}
