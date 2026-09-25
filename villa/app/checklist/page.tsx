"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { roomChecklist, houseChecklist, checklistSummaries, type Checklist } from "@/lib/model/checklist";
import { ChecklistBody } from "@/components/Checklist";
import { FLOOR_META } from "@/lib/seed/spaces";
import { DimsShort } from "@/components/Measure";
import { roomLens } from "@/lib/model/lens";
import { PageTitle, Chip, Stat, Bar, Empty, Sheet } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { FloorId } from "@/lib/model/types";

/**
 * The planning checklist.
 *
 * One room at a time, the whole list, in the order a fit-out actually runs.
 * Its job is to make it impossible to arrive at handover and discover that
 * nobody ever thought about the AC drain, the loft access or the warranty.
 */

type FloorKey = FloorId | "house";
const FLOORS: FloorKey[] = ["outdoor", "ground", "first", "second", "house"];
const FLOOR_LABEL = (f: FloorKey) => (f === "house" ? "House-wide" : FLOOR_META[f].label);

type Sort = "house" | "least" | "critical";

export default function ChecklistPage() {
  const { state, role, meId } = useProject();
  const [open, setOpen] = useState<string | null>(null);
  const [floor, setFloor] = useState<FloorKey | "all">("all");
  const [sort, setSort] = useState<Sort>("house");

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
        <Empty icon="checklist" title="No rooms yet." hint="Add the villa's rooms and every one of them arrives with its own full checklist." />
      </div>
    );
  }

  const houseRow = { spaceId: "house", name: "House-wide scope", floor: "house" as const, pct: house.pct, done: house.done, total: house.total, criticalOpen: house.criticalOpen, next: house.next };
  const order = (rows: typeof summaries) => {
    if (sort === "least") return [...rows].sort((a, b) => a.pct - b.pct);
    if (sort === "critical") return [...rows].sort((a, b) => b.criticalOpen - a.criticalOpen);
    return rows;
  };

  return (
    <div>
      <PageTitle
        title="Checklist"
        sub="Every room, every line a good designer would work through — including the boring, invisible, expensive ones. A line is never deleted, only marked not applicable with a reason."
        right={<Link href="/phases" className="btn">What happens when <Icon name="arrow-right" size={15} /></Link>}
      />

      <div className="card stat-strip mb-8">
        <Stat label="Checked off" value={`${total ? Math.round((done / total) * 100) : 0}%`} sub={`${done.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} lines`} />
        <Stat label="Critical open" value={criticalOpen || "None"} tone={criticalOpen ? "accent" : undefined}
          sub={criticalOpen ? "these hold up other work" : "nothing critical open"} />
        <Stat label="Rooms complete" value={`${roomsClear} of ${summaries.length}`} />
        <Stat label="House-wide" value={`${Math.round(house.pct)}%`} sub={`${house.done} of ${house.total} lines`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label="Floor" style={{ scrollbarWidth: "none" }}>
          <button className="pill shrink-0" aria-pressed={floor === "all"} onClick={() => setFloor("all")}>Everywhere</button>
          {FLOORS.map((f) => (
            <button key={f} className="pill shrink-0" aria-pressed={floor === f} onClick={() => setFloor(f)}>{FLOOR_LABEL(f)}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-3">
          Sort
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="house">As the house is laid out</option>
            <option value="least">Least done first</option>
            <option value="critical">Most critical first</option>
          </select>
        </label>
      </div>

      {FLOORS.filter((f) => floor === "all" || floor === f).map((f) => {
        const rows = f === "house" ? [houseRow] : order(summaries.filter((s) => s.floor === f));
        if (!rows.length) return null;
        return (
          <section key={f} className="mb-8" aria-labelledby={`fl-${f}`}>
            <div className="flex items-baseline justify-between mb-2">
              <h2 id={`fl-${f}`} className="text-[16px]">{f === "house" ? "Belongs to no single room" : FLOOR_LABEL(f)}</h2>
              <span className="text-[13px] text-ink-3">{rows.length} {rows.length === 1 ? "list" : "rooms"}</span>
            </div>
            <div className="card divide-y divide-line overflow-hidden">
              {rows.map((r) => {
                const sp = state.spaces.find((x) => x.id === r.spaceId);
                return (
                  <button
                    key={r.spaceId}
                    onClick={() => setOpen(r.spaceId)}
                    className="w-full text-left grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.3fr)_minmax(140px,1fr)_minmax(0,1.3fr)_auto] items-center gap-x-5 gap-y-2 px-4 sm:px-5 py-3.5 hover:bg-paper transition-colors group"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-snug truncate group-hover:text-accent-strong">{r.name}</span>
                      <span className="block text-[12.5px] text-ink-3 truncate">{sp ? <DimsShort sp={sp} /> : "Enabling works, systems and statutory"}</span>
                    </span>
                    <span className="md:order-none order-3 col-span-2 md:col-span-1 flex items-center gap-2.5">
                      <Bar pct={r.pct} height={5} label={`${r.name} checklist`} />
                      <span className="tnum text-[13px] text-ink-2 shrink-0 w-[70px] text-right">{r.done} / {r.total}</span>
                    </span>
                    <span className="hidden md:flex items-center gap-2 min-w-0 text-[13px] text-ink-3">
                      {r.criticalOpen > 0 && <Chip tone="accent" small>{r.criticalOpen} critical</Chip>}
                      {r.next && <span className="truncate">Next: <span className="text-ink-2">{r.next.label}</span></span>}
                    </span>
                    <span className="flex items-center gap-2 justify-self-end">
                      <span className="md:hidden">{r.criticalOpen > 0 && <Chip tone="accent" small>{r.criticalOpen} critical</Chip>}</span>
                      <Icon name="chevron-right" size={17} className="text-ink-4 group-hover:text-ink" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <Sheet
        open={!!active} onClose={() => setOpen(null)} wide
        title={active?.name}
        description={active ? <>
          {active.done} of {active.total} checked · {Math.round(active.pct)}%
          {active.criticalOpen > 0 && <> · <span className="text-accent-strong font-semibold">{active.criticalOpen} critical open</span></>}
        </> : undefined}
        footer={active?.spaceId ? (
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={() => setOpen(null)}>Close</button>
            <Link href={`/villa/${active.spaceId}?tab=Checklist`} className="btn btn-primary">Open the room <Icon name="arrow-right" size={15} /></Link>
          </div>
        ) : undefined}
      >
        {active && <ChecklistBody list={active} />}
      </Sheet>
    </div>
  );
}

