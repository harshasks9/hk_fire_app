"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { DESIGNS, NO_LAYOUT, recommendedOf } from "@/lib/design";
import { roomLens } from "@/lib/model/lens";
import { FLOOR_META } from "@/lib/seed/spaces";
import type { FloorId } from "@/lib/model/types";
import { RoomLayout } from "./RoomLayout";
import { DimsShort } from "./Measure";
import { Chip, Eyebrow, Stat } from "./ui";

/**
 * Every room's layouts across the house: the chosen one where a choice has
 * been made, the recommended one where it hasn't, and how many notes each
 * room's options have gathered.
 */
export function LayoutsOverview({ floor = "all" }: { floor?: string }) {
  const { state, role, meId } = useProject();
  const sees = roomLens(state, role, meId);

  const rows = useMemo(() => DESIGNS.map((d) => {
    const space = state.spaces.find((s) => s.id === d.spaceId);
    const chosen = d.layouts.find((l) => l.id === space?.layoutId);
    const notes = state.notes.filter((n) => n.layoutIds?.some((id) => d.layouts.some((l) => l.id === id))).length;
    return { d, space, chosen, shown: chosen ?? recommendedOf(d), notes };
  }).filter((r) => r.space && !r.space.archived && sees(r.d.spaceId)), [state.spaces, state.notes, sees]);

  const visible = floor === "all" ? rows : rows.filter((r) => r.space!.floor === floor);
  const chosenCount = rows.filter((r) => r.chosen).length;
  const layouts = rows.reduce((a, r) => a + r.d.layouts.length, 0);
  const notes = rows.reduce((a, r) => a + r.notes, 0);
  const floors: FloorId[] = ["ground", "first", "second", "outdoor"];

  return (
    <div>
      <div className="card stat-strip mb-8">
        <Stat label="Rooms laid out" value={rows.length} />
        <Stat label="Layouts to choose from" value={layouts} />
        <Stat label="Chosen" value={`${chosenCount} of ${rows.length}`} tone={chosenCount < rows.length ? undefined : "good"} />
        <Stat label="Notes on layouts" value={notes || "None yet"} />
      </div>

      {floors.map((f) => {
        const here = visible.filter((r) => r.space!.floor === f);
        if (!here.length) return null;
        return (
          <section key={f} className="mb-7">
            <h2 className="text-[16px] mb-3">{FLOOR_META[f].label}</h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {here.map(({ d, space, chosen, shown, notes: n }) => (
                <Link key={d.spaceId} href={`/villa/${d.spaceId}?tab=Layouts`}
                  className="card card-link px-4 pt-3.5 pb-3.5 flex flex-col group"
                  style={chosen ? { borderColor: "var(--color-accent)" } : undefined}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold leading-snug group-hover:text-accent-strong">{space!.name}</div>
                      <div className="text-[12.5px] text-ink-3 mt-0.5"><DimsShort sp={space!} /></div>
                    </div>
                    <span className="text-[12.5px] text-ink-3 shrink-0">{d.layouts.length} options</span>
                  </div>
                  <div className="mt-2 rounded-md overflow-hidden flex-1 flex items-center" style={{ background: "#fffdfa" }}>
                    <RoomLayout design={d} layout={shown} compact maxHeight={220} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {chosen
                      ? <Chip tone="accent">Chosen {chosen.key} — {chosen.name}</Chip>
                      : <Chip tone="neutral">Recommended {shown.key} · not chosen</Chip>}
                    {n > 0 && <Chip tone="ghost">{n} note{n > 1 ? "s" : ""}</Chip>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="card-quiet px-4 py-3 max-w-3xl">
        <Eyebrow>Rooms without layouts of their own</Eyebrow>
        <ul className="mt-2 space-y-1">
          {Object.entries(NO_LAYOUT).filter(([id]) => sees(id)).map(([id, why]) => {
            const s = state.spaces.find((x) => x.id === id);
            if (!s) return null;
            return <li key={id} className="text-[13px] text-ink-2 leading-snug"><Link href={`/villa/${id}`} className="hover:text-accent">{s.name}</Link> <span className="text-ink-3">— {why}</span></li>;
          })}
        </ul>
        <p className="text-[12.5px] text-ink-3 mt-2 leading-relaxed">
          Stairs, lifts, corridors and the gardens are designed as part of the whole-house concept rather than as rooms.
        </p>
      </div>
    </div>
  );
}
