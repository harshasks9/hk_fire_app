"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, useRevisions } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import type { CollectionKey } from "@/lib/store";
import { PageTitle, Eyebrow, Empty, Avatar, Sheet, Chip, fmtDate } from "@/components/ui";

/**
 * History.
 *
 * Every change to the plan, newest first, in plain sentences — who, when,
 * what. Filter it down to a room, a person or a kind of record, and restore
 * the project to any point. A restore is recorded as a change in its own
 * right, so history only ever grows: nothing that happened is erased.
 */
export default function HistoryPage() {
  const { state, restoreTo, storage } = useProject();
  const { revisions, startedAt, loading } = useRevisions();
  const [who, setWho] = useState("");
  const [room, setRoom] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<number | null>(null);

  const people = useMemo(() => Array.from(new Set(revisions.map((r) => r.by).filter(Boolean))), [revisions]);
  const kinds = useMemo(() => Array.from(new Set(revisions.map((r) => r.touches.collection).filter(Boolean))) as CollectionKey[], [revisions]);

  const list = useMemo(() => {
    return revisions
      .filter((r) => !who || r.by === who)
      .filter((r) => !room || r.touches.spaceId === room)
      .filter((r) => !kind || r.touches.collection === kind)
      .filter((r) => !q.trim() || r.summary.toLowerCase().includes(q.toLowerCase()))
      .slice()
      .reverse();
  }, [revisions, who, room, kind, q]);

  // Group by calendar day for scanning.
  const days = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const r of list) {
      const d = r.at.slice(0, 10);
      m.set(d, [...(m.get(d) ?? []), r]);
    }
    return Array.from(m.entries());
  }, [list]);

  const head = revisions.at(-1)?.v ?? 0;

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / History</div>
      <PageTitle
        title="History"
        sub={`${revisions.length.toLocaleString("en-IN")} changes since ${fmtDate(startedAt)}. Restore to any point; the restore is itself recorded.`}
      />

      {storage.mode === "browser" && (
        <div className="card-quiet px-4 py-3 mb-4 text-[12.5px] text-ink-2 leading-relaxed">
          History is being kept in this browser. Connect a database (Admin → Overview) and it is shared
          across everyone on the project and survives clearing site data.
        </div>
      )}
      {storage.mode === "server" && (
        <div className="card-quiet px-4 py-3 mb-4 text-[12.5px] text-ink-2 leading-relaxed">
          Shared history from the server — every change by everyone on the project, at version {storage.version ?? 0}.
          {loading ? " Loading…" : ""}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input className="input w-auto flex-1 min-w-[160px]" placeholder="Search changes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Anyone</option>
          {people.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-auto" value={room} onChange={(e) => setRoom(e.target.value)}>
          <option value="">Any room</option>
          {state.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input w-auto" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Any kind</option>
          {kinds.map((k) => <option key={k} value={k}>{SCHEMAS[k]?.label ?? k}</option>)}
        </select>
      </div>

      {!days.length ? (
        <Empty title="No changes recorded yet." hint="Every edit made from here on will appear in this list with who made it." />
      ) : (
        <div className="space-y-6">
          {days.map(([day, revs]) => (
            <div key={day}>
              <Eyebrow className="mb-2">{fmtDate(day)}</Eyebrow>
              <div className="card divide-y divide-line">
                {revs.map((r) => {
                  const person = state.people.find((p) => p.id === r.byId || p.name === r.by);
                  const sp = r.touches.spaceId ? state.spaces.find((s) => s.id === r.touches.spaceId) : undefined;
                  return (
                    <div key={r.v} className="px-4 py-3 flex items-start gap-3">
                      <Avatar name={r.by || "?"} tone={person?.avatarTone} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-ink leading-relaxed">{r.summary}</div>
                        <div className="text-[11px] text-ink-3 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span className="font-medium text-ink-2">{r.by || "Unattributed"}</span>
                          <span>{new Date(r.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          {sp && <Link href={`/villa/${sp.id}`} className="text-clay hover:underline">{sp.name}</Link>}
                          {r.touches.itemId && sp && (
                            <Link href={`/villa/${sp.id}?item=${r.touches.itemId}`} className="text-clay hover:underline">open item</Link>
                          )}
                          <span className="tnum text-ink-4">v{r.v}</span>
                        </div>
                      </div>
                      {r.v < head && (
                        <button className="btn btn-sm shrink-0" onClick={() => setConfirm(r.v)}>Restore to here</button>
                      )}
                      {r.v === head && <Chip tone="sage">Current</Chip>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm !== null && (
        <Sheet open onClose={() => setConfirm(null)} title={`Restore the project to v${confirm}?`}>
          <p className="text-[13.5px] text-ink leading-relaxed">
            The plan goes back to exactly how it stood after change v{confirm}. The{" "}
            {head - confirm} change{head - confirm === 1 ? "" : "s"} made since are undone —
            but not erased. The restore lands as a new entry on top, and you can restore forward again.
          </p>
          <div className="flex gap-2 mt-4">
            <button className="btn flex-1 justify-center" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-accent flex-1 justify-center" onClick={() => { void restoreTo(confirm); setConfirm(null); }}>
              Restore to v{confirm}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
