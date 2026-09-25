"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, useRevisions } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import type { CollectionKey } from "@/lib/store";
import { PageTitle, Empty, Avatar, Chip, Confirm, useToast, fmtDate } from "@/components/ui";
import { Icon } from "@/components/Icon";

/** How many changes to draw at once; the rest are a click away. */
const PAGE = 150;

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
  const toast = useToast();
  const [who, setWho] = useState("");
  const [room, setRoom] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [confirm, setConfirm] = useState<number | null>(null);

  const people = useMemo(() => Array.from(new Set(revisions.map((r) => r.by).filter(Boolean))), [revisions]);
  const kinds = useMemo(() => Array.from(new Set(revisions.map((r) => r.touches.collection).filter(Boolean))) as CollectionKey[], [revisions]);
  const rooms = useMemo(() => {
    const touched = new Set(revisions.map((r) => r.touches.spaceId).filter(Boolean));
    return state.spaces.filter((s) => touched.has(s.id));
  }, [revisions, state.spaces]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return revisions
      .filter((r) => !who || r.by === who)
      .filter((r) => !room || r.touches.spaceId === room)
      .filter((r) => !kind || r.touches.collection === kind)
      .filter((r) => !needle || r.summary.toLowerCase().includes(needle))
      .slice()
      .reverse();
  }, [revisions, who, room, kind, q]);

  // Group by calendar day for scanning.
  const days = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const r of list.slice(0, shown)) {
      const d = localDay(r.at);
      m.set(d, [...(m.get(d) ?? []), r]);
    }
    return Array.from(m.entries());
  }, [list, shown]);

  const head = revisions.at(-1)?.v ?? 0;
  const filtering = !!(who || room || kind || q.trim());
  const clear = () => { setWho(""); setRoom(""); setKind(""); setQ(""); };

  const restore = async (v: number) => {
    setConfirm(null);
    await restoreTo(v);
    toast(`Project restored to how it stood at v${v}`);
  };

  return (
    <div>
      <PageTitle
        title="History"
        sub={
          revisions.length
            ? `${revisions.length.toLocaleString("en-IN")} change${revisions.length === 1 ? "" : "s"} since ${fmtDate(startedAt)}. Restore the project to how it stood at any point.`
            : "Every change to the project, who made it and when. Restore to any point."
        }
      />

      {storage.mode !== "unknown" && <div className="flex items-start gap-3 rounded-lg bg-paper-2 px-4 py-3 mb-5 text-[13.5px] text-ink-2 leading-relaxed">
        <Icon name={storage.mode === "server" ? "cloud" : "info"} size={18} className="text-ink-3 shrink-0 mt-0.5" />
        {storage.mode === "server" ? (
          <p>
            Shared history from the database — every change by everyone on the project, now at version{" "}
            <span className="tnum">{storage.version ?? 0}</span>.{loading ? " Loading…" : ""}
          </p>
        ) : (
          <p>
            History is kept in this browser only. <Link href="/admin?tab=Overview" className="link">Connect a database</Link>{" "}
            and it is shared with everyone on the project and survives clearing site data.
          </p>
        )}
      </div>}

      {/* ------------------------------------------------------------ filters */}
      {revisions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
            <input
              className="input" style={{ paddingLeft: 34 }} placeholder="Search changes…" aria-label="Search changes"
              value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
            />
          </div>
          <select className="input w-auto flex-1 sm:flex-none min-w-[130px]" aria-label="Who made the change" value={who} onChange={(e) => { setWho(e.target.value); setShown(PAGE); }}>
            <option value="">Anyone</option>
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input w-auto flex-1 sm:flex-none min-w-[130px] sm:max-w-[220px]" aria-label="Room" value={room} onChange={(e) => { setRoom(e.target.value); setShown(PAGE); }}>
            <option value="">Any room</option>
            {rooms.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input w-auto flex-1 sm:flex-none min-w-[130px]" aria-label="Kind of record" value={kind} onChange={(e) => { setKind(e.target.value); setShown(PAGE); }}>
            <option value="">Any kind</option>
            {kinds.map((k) => <option key={k} value={k}>{SCHEMAS[k]?.label ?? k}</option>)}
          </select>
          {filtering && (
            <button className="btn btn-ghost btn-sm" onClick={clear}>
              <Icon name="close" size={15} /> Clear
            </button>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- list */}
      {!revisions.length ? (
        loading ? (
          <div className="card px-5 py-8 text-center text-[14px] text-ink-3">Loading history…</div>
        ) : (
          <Empty
            icon="history"
            title="No changes recorded yet."
            hint="Every edit made from now on appears here, with who made it and when — and you can restore the project to any of them."
            action={<Link href="/sheet" className="btn btn-sm">Start in the Sheet</Link>}
          />
        )
      ) : !list.length ? (
        <Empty
          icon="search"
          title="No changes match these filters."
          hint="Try a different person, room or kind of record, or clear the filters to see everything."
          action={<button className="btn btn-sm" onClick={clear}>Clear filters</button>}
        />
      ) : (
        <div className="space-y-7">
          {filtering && (
            <p className="text-[13px] text-ink-3 -mt-2 tnum">
              {list.length.toLocaleString("en-IN")} of {revisions.length.toLocaleString("en-IN")} changes
            </p>
          )}
          {days.map(([day, revs]) => (
            <section key={day} aria-label={dayLabel(day)}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className="eyebrow">{dayLabel(day)}</h2>
                <span className="text-[12.5px] text-ink-3 tnum">{revs.length} change{revs.length === 1 ? "" : "s"}</span>
              </div>
              <ol className="card divide-y divide-line">
                {revs.map((r) => {
                  const person = state.people.find((p) => p.id === r.byId || p.name === r.by);
                  const sp = r.touches.spaceId ? state.spaces.find((s) => s.id === r.touches.spaceId) : undefined;
                  const kindLabel = r.touches.collection ? SCHEMAS[r.touches.collection as CollectionKey]?.label : undefined;
                  const isHead = r.v === head;
                  return (
                    <li key={r.v} className="group px-4 py-3.5 flex items-start gap-3">
                      <Avatar name={r.by || "?"} tone={person?.avatarTone} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] text-ink leading-snug break-words">{r.summary}</div>
                        <div className="text-[13px] text-ink-3 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-medium text-ink-2">{r.by || "Unattributed"}</span>
                          <span aria-hidden>·</span>
                          <time dateTime={r.at} className="tnum">{timeOf(r.at)}</time>
                          {sp && (
                            <>
                              <span aria-hidden>·</span>
                              <Link href={r.touches.itemId ? `/villa/${sp.id}?item=${r.touches.itemId}` : `/villa/${sp.id}`} className="link">
                                {sp.name}{r.touches.itemId ? " — open item" : ""}
                              </Link>
                            </>
                          )}
                          {kindLabel && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{kindLabel}</span>
                            </>
                          )}
                          <span aria-hidden>·</span>
                          <span className="font-mono text-[12px] tnum" title={`Version ${r.v}`}>v{r.v}</span>
                        </div>
                      </div>
                      <div className="shrink-0 self-center">
                        {isHead ? (
                          <Chip tone="good" dot>Current</Chip>
                        ) : (
                          <button
                            className="btn btn-sm max-sm:btn-icon max-sm:w-[38px] max-sm:px-0 lg:opacity-70 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            onClick={() => setConfirm(r.v)}
                            aria-label={`Restore the project to v${r.v}: ${r.summary}`}
                          >
                            <Icon name="history" size={15} /> <span className="max-sm:hidden">Restore</span>
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {list.length > shown && (
            <div className="flex justify-center">
              <button className="btn" onClick={() => setShown((n) => n + PAGE)}>
                Show older changes <span className="text-ink-3 tnum">({(list.length - shown).toLocaleString("en-IN")} more)</span>
              </button>
            </div>
          )}
        </div>
      )}

      <Confirm
        open={confirm !== null}
        title={`Restore the project to v${confirm ?? ""}?`}
        confirmLabel={`Restore to v${confirm ?? ""}`}
        danger={false}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confirm !== null) void restore(confirm); }}
      >
        {confirm !== null && (
          <>
            <p>
              The whole project goes back to exactly how it stood after change v{confirm}. The{" "}
              <strong className="font-semibold text-ink">{head - confirm} change{head - confirm === 1 ? "" : "s"}</strong>{" "}
              made since then {head - confirm === 1 ? "is" : "are"} undone{storage.mode === "server" ? " for everyone" : ""}.
            </p>
            <p className="text-ink-3 text-[14px]">
              {storage.mode !== "browser"
                ? "Nothing is erased: the restore is added as a new change on top, so you can restore forward again from this page."
                : "History in this browser starts again from the restored point. Download a backup from Settings → Data first if you might want today's version back."}
            </p>
          </>
        )}
      </Confirm>
    </div>
  );
}

/** The calendar day a change happened on, in local time. */
function localDay(at: string): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(day: string): string {
  const today = localDay(new Date().toISOString());
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (day === today) return "Today";
  if (day === localDay(y.toISOString())) return "Yesterday";
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function timeOf(at: string): string {
  return new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
