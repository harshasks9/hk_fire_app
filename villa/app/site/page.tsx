"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, newId } from "@/lib/store";
import { openSnags, spaceMetrics } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { CATEGORY_LABEL, type Severity, type SnagStatus, type Category } from "@/lib/model/types";
import { FLOOR_META } from "@/lib/seed/spaces";
import {
  PageTitle, Eyebrow, Chip, Empty, PhotoBlock, Stat, Tabs, Field, fmtDay, Sheet, Bar,
} from "@/components/ui";
import { categoryOptions } from "@/lib/model/categories";

const TABS = ["Capture", "Snag list", "Progress"] as const;
type Tab = (typeof TABS)[number];

type Action = "photo" | "issue" | "note" | "task" | "progress" | "compare";

const ACTIONS: { id: Action; label: string; sub: string; icon: string }[] = [
  { id: "photo", label: "Take photo", sub: "Files itself to this room", icon: "camera" },
  { id: "issue", label: "Add issue", sub: "Snag with a photo pin", icon: "flag" },
  { id: "note", label: "Add note", sub: "Anything worth remembering", icon: "note" },
  { id: "task", label: "Create task", sub: "Someone must do something", icon: "check" },
  { id: "progress", label: "Record progress", sub: "How far this room has got", icon: "chart" },
  { id: "compare", label: "Compare with design", sub: "Site against the approved scheme", icon: "split" },
];

/**
 * Site mode.
 *
 * Designed for one hand, standing in a half-built room, in bad light. Pick the
 * room once at the top and everything captured afterwards files itself there —
 * no form asks you where you are, because you already said.
 */
export default function SitePage() {
  const { state, dispatch, me } = useProject();
  const [tab, setTab] = useState<Tab>("Capture");
  const [room, setRoom] = useState<string>(() => state.spaces.find((s) => s.floor === "ground")?.id ?? state.spaces[0]?.id ?? "");
  const [action, setAction] = useState<Action | null>(null);

  const space = state.spaces.find((s) => s.id === room);
  const snags = openSnags(state);
  const roomSnags = state.snags.filter((s) => s.spaceId === room);
  const updates = state.siteUpdates.filter((u) => u.spaceId === room);
  const m = space ? spaceMetrics(state, room) : null;

  return (
    <div>
      <PageTitle
        title="Site"
        sub="For walking the villa. Pick the room once — everything you capture files itself there."
      />

      {/* --------------------------------------------------- room selector */}
      <div className="card px-4 py-3.5 mb-5 sticky top-[60px] lg:top-4 z-20 backdrop-blur bg-paper/95">
        <Eyebrow className="mb-2">I am standing in</Eyebrow>
        <select className="input text-[15px] py-2.5" value={room} onChange={(e) => setRoom(e.target.value)}>
          {(["ground", "first", "second", "outdoor"] as const).map((f) => (
            <optgroup key={f} label={FLOOR_META[f].label}>
              {state.spaces.filter((s) => s.floor === f).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {m && (
          <div className="flex items-center gap-3 mt-2.5 text-[11.5px] text-ink-3">
            <span className="tnum">{Math.round(m.completionPct)}% complete</span>
            <span>·</span>
            <span className="tnum">{m.liveCount} items</span>
            {m.snagsOpen > 0 && <><span>·</span><span className="text-rust">{m.snagsOpen} open snag{m.snagsOpen > 1 ? "s" : ""}</span></>}
            <Link href={`/villa/${room}`} className="ml-auto text-clay hover:underline">Open workspace →</Link>
          </div>
        )}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ "Snag list": snags.length }} />

      <div className="mt-5">
        {tab === "Capture" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAction(a.id)}
                  className="card px-4 py-6 text-center hover:border-clay transition-colors active:scale-[0.98]"
                >
                  <div className="mx-auto mb-2.5 text-clay"><BigIcon name={a.icon} /></div>
                  <div className="text-[14.5px] font-medium">{a.label}</div>
                  <div className="text-[11px] text-ink-3 mt-1 leading-snug">{a.sub}</div>
                </button>
              ))}
            </div>

            {updates.length > 0 && (
              <div className="mt-7">
                <Eyebrow className="mb-2.5">Recent in {space?.name}</Eyebrow>
                <div className="grid sm:grid-cols-3 gap-3">
                  {updates.slice(0, 3).map((u) => (
                    <div key={u.id}>
                      <PhotoBlock tone={u.photoSwatch} ratio="4 / 3" label={fmtDay(u.at)} />
                      <p className="text-[12px] text-ink-2 mt-1.5 leading-relaxed line-clamp-3">{u.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roomSnags.length > 0 && (
              <div className="mt-7">
                <Eyebrow className="mb-2.5">Open in this room</Eyebrow>
                <div className="card divide-y divide-line">
                  {roomSnags.filter((s) => s.status !== "closed").map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                      <Chip tone={s.severity === "critical" || s.severity === "high" ? "rust" : "ochre"}>{s.severity}</Chip>
                      <div className="min-w-0 flex-1 text-[13px] truncate">{s.title}</div>
                      <Chip tone="ghost">{s.status}</Chip>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "Snag list" && <SnagList />}
        {tab === "Progress" && <ProgressTab />}
      </div>

      <CaptureSheet action={action} room={room} onClose={() => setAction(null)} />
    </div>
  );
}

function BigIcon({ name }: { name: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const p: Record<string, React.ReactNode> = {
    camera: <><rect x="3" y="7" width="22" height="16" rx="3" {...s} /><circle cx="14" cy="15" r="5" {...s} /><path d="M10 7l2-3h4l2 3" {...s} /></>,
    flag: <><path d="M7 25V4M7 5h14l-3 5 3 5H7" {...s} /></>,
    note: <><rect x="5" y="4" width="18" height="21" rx="3" {...s} /><path d="M9 11h10M9 15h10M9 19h6" {...s} /></>,
    check: <><rect x="4" y="5" width="20" height="20" rx="4" {...s} /><path d="m9 15 3.5 3.5L20 11" {...s} /></>,
    chart: <><path d="M5 23V13M12 23V7M19 23v-6M25 23H3" {...s} /></>,
    split: <><rect x="3" y="6" width="10" height="17" rx="2" {...s} /><rect x="16" y="6" width="10" height="17" rx="2" {...s} /></>,
  };
  return <svg viewBox="0 0 28 28" width="30" height="30" aria-hidden>{p[name]}</svg>;
}

function CaptureSheet({ action, room, onClose }: { action: Action | null; room: string; onClose: () => void }) {
  const { state, dispatch, me } = useProject();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [category, setCategory] = useState<Category>("flooring");
  const [vendorId, setVendorId] = useState("");
  const [pct, setPct] = useState(50);
  const space = state.spaces.find((s) => s.id === room);
  const now = new Date().toISOString();

  const reset = () => { setTitle(""); setBody(""); onClose(); };

  const submit = () => {
    if (action === "issue") {
      if (!title.trim()) return;
      dispatch({
        type: "snag/add",
        snag: {
          id: newId("snag"), spaceId: room, title, description: body, category, severity,
          vendorId: vendorId || undefined, raisedBy: me, raisedAt: now, status: "open",
          photoSwatch: "#bdb2a2",
          dueBy: new Date(Date.now() + 12 * 86400000).toISOString(),
        },
      });
    } else if (action === "task") {
      if (!title.trim()) return;
      dispatch({ type: "task/add", task: { id: newId("t"), title, owner: me, spaceId: room, dependsOn: [], status: "todo", notes: body || undefined } });
    } else if (action === "note") {
      if (!title.trim()) return;
      dispatch({
        type: "note/add",
        note: { id: newId("n"), title, body, kind: "site-visit", at: now, author: me, spaceIds: [room], scopeItemIds: [], vendorIds: [], decisionIds: [], taskIds: [] },
      });
    } else if (action === "photo" || action === "progress") {
      dispatch({
        type: "site/add",
        update: {
          id: newId("su"), spaceId: room, at: now, by: me,
          body: body || title || "Site photo", progressPct: action === "progress" ? pct : undefined,
          photoSwatch: "#c2b6a6",
        },
      });
    }
    reset();
  };

  if (!action) return null;
  const labels: Record<Action, string> = {
    photo: "Take a photo", issue: "Raise an issue", note: "Add a note",
    task: "Create a task", progress: "Record progress", compare: "Compare with design",
  };

  if (action === "compare") {
    const approved = state.items.filter(
      (i) => i.spaceId === room && ["approved", "boq", "ordered", "delivered", "installed", "inspected", "complete"].includes(i.stage),
    );
    const update = state.siteUpdates.find((u) => u.spaceId === room);
    return (
      <Sheet open onClose={onClose} title={`${space?.name} — site vs design`} wide>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <Eyebrow className="mb-2">As approved</Eyebrow>
            <PhotoBlock tone="#cfc2ad" ratio="4 / 3" label="Approved scheme" />
          </div>
          <div>
            <Eyebrow className="mb-2">On site today</Eyebrow>
            <PhotoBlock tone={update?.photoSwatch ?? "#b5ab9c"} ratio="4 / 3" label={update ? fmtDay(update.at) : "No photo yet"} />
          </div>
        </div>
        <Eyebrow className="mb-2">What was approved for this room</Eyebrow>
        <div className="card divide-y divide-line">
          {approved.slice(0, 14).map((i) => (
            <div key={i.id} className="px-3.5 py-2.5">
              <div className="text-[13px]">{i.title}</div>
              {i.spec && <div className="text-[11.5px] text-ink-3 mt-0.5 line-clamp-2">{i.spec}</div>}
            </div>
          ))}
          {!approved.length && <div className="px-3.5 py-4 text-[12.5px] text-ink-3">Nothing approved in this room yet.</div>}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title={`${labels[action]} — ${space?.name}`}>
      <div className="space-y-4">
        {(action === "photo" || action === "progress") && (
          <PhotoBlock tone="#c2b6a6" ratio="4 / 3" label="Camera would open here" />
        )}

        {action !== "photo" && (
          <Field label={action === "progress" ? "What changed" : "Title"}>
            <input className="input text-[15px] py-2.5" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              placeholder={action === "issue" ? "What is wrong?" : action === "task" ? "What needs doing?" : "Short title"} />
          </Field>
        )}

        {action === "progress" && (
          <Field label={`Completion — ${pct}%`}>
            <input type="range" min={0} max={100} value={pct} onChange={(e) => setPct(parseInt(e.target.value))} className="w-full accent-[#b0603a]" />
            <div className="mt-2"><Bar pct={pct} /></div>
          </Field>
        )}

        {action === "issue" && (
          <>
            <Field label="Severity">
              <div className="flex gap-2">
                {(["low", "medium", "high", "critical"] as Severity[]).map((sv) => (
                  <button key={sv} onClick={() => setSeverity(sv)} className="btn flex-1 justify-center"
                    style={{
                      background: severity === sv ? "var(--color-ink)" : undefined,
                      color: severity === sv ? "var(--color-paper)" : undefined,
                      borderColor: severity === sv ? "var(--color-ink)" : undefined,
                    }}>
                    {sv}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Trade">
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {categoryOptions(state).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Responsible vendor">
              <select className="input" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">Not yet assigned</option>
                {state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
          </>
        )}

        <Field label="Notes">
          <textarea className="input min-h-[90px] resize-y" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Detail, measurements, what you saw." />
        </Field>

        <button className="btn btn-accent w-full justify-center py-3 text-[15px]" onClick={submit}>
          Save to {space?.name}
        </button>
      </div>
    </Sheet>
  );
}

function SnagList() {
  const { state, dispatch, me } = useProject();
  const [filter, setFilter] = useState<SnagStatus | "all">("all");
  const NEXT: Record<SnagStatus, SnagStatus | null> = {
    open: "assigned", assigned: "fixed", fixed: "verify", verify: "closed", closed: null,
  };
  const spaceName = (id: string) => state.spaces.find((s) => s.id === id)?.name ?? id;
  const list = state.snags.filter((s) => filter === "all" || s.status === filter);
  const counts = (["open", "assigned", "fixed", "verify", "closed"] as SnagStatus[]).map((st) => ({
    st, n: state.snags.filter((s) => s.status === st).length,
  }));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setFilter("all")} className="btn btn-sm" style={{ background: filter === "all" ? "var(--color-ink)" : undefined, color: filter === "all" ? "var(--color-paper)" : undefined }}>
          All {state.snags.length}
        </button>
        {counts.map(({ st, n }) => (
          <button key={st} onClick={() => setFilter(st)} className="btn btn-sm"
            style={{ background: filter === st ? "var(--color-ink)" : undefined, color: filter === st ? "var(--color-paper)" : undefined }}>
            {st} {n}
          </button>
        ))}
      </div>

      {!list.length ? <Empty title="Nothing here." /> : (
        <div className="space-y-3">
          {list.map((s) => (
            <div key={s.id} id={s.id} className="card px-4 py-4 scroll-mt-24">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-36 shrink-0 flex sm:block gap-2">
                  <PhotoBlock tone={s.photoSwatch} ratio="4 / 3" label="Raised" className="flex-1">
                    {s.pins?.map((p, i) => (
                      <span key={i} title={p.label} className="absolute rounded-full ring-2 ring-white"
                        style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 13, height: 13, background: "#b0603a", transform: "translate(-50%,-50%)" }} />
                    ))}
                  </PhotoBlock>
                  {s.rectificationSwatch && <PhotoBlock tone={s.rectificationSwatch} ratio="4 / 3" label="Fixed" className="flex-1 sm:mt-2" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Chip tone={s.severity === "critical" || s.severity === "high" ? "rust" : "ochre"}>{s.severity}</Chip>
                    <Chip tone={s.status === "closed" ? "sage" : s.status === "open" ? "rust" : "slate"}>{s.status}</Chip>
                    <Link href={`/villa/${s.spaceId}`} className="text-[11.5px] text-ink-3 hover:text-clay">{spaceName(s.spaceId)}</Link>
                  </div>
                  <div className="text-[14.5px]">{s.title}</div>
                  {s.description && <p className="text-[12.5px] text-ink-3 mt-1 leading-relaxed">{s.description}</p>}
                  <div className="text-[11px] text-ink-3 mt-2">
                    {s.raisedBy} · {fmtDay(s.raisedAt)}
                    {s.vendorId && ` · ${state.vendors.find((v) => v.id === s.vendorId)?.name}`}
                    {s.dueBy && ` · due ${fmtDay(s.dueBy)}`}
                    {s.closedAt && ` · verified by ${s.verifiedBy} on ${fmtDay(s.closedAt)}`}
                  </div>
                  {NEXT[s.status] && (
                    <div className="flex gap-2 mt-3">
                      <button
                        className="btn btn-sm"
                        onClick={() => dispatch({
                          type: "snag/patch", id: s.id,
                          patch: {
                            status: NEXT[s.status]!,
                            ...(NEXT[s.status] === "closed" ? { closedAt: new Date().toISOString(), verifiedBy: me } : {}),
                            ...(NEXT[s.status] === "fixed" ? { rectificationSwatch: "#c4bcae" } : {}),
                          },
                        })}
                      >
                        Move to {NEXT[s.status]}
                      </button>
                      {s.status === "fixed" && (
                        <span className="text-[11px] text-ink-3 self-center">
                          A vendor marking it fixed does not close it — someone has to verify.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressTab() {
  const { state } = useProject();
  return (
    <div className="space-y-5">
      {(["ground", "first", "second", "outdoor"] as const).map((f) => (
        <div key={f}>
          <Eyebrow className="mb-2">{FLOOR_META[f].label}</Eyebrow>
          <div className="card divide-y divide-line">
            {state.spaces.filter((s) => s.floor === f).map((s) => {
              const m = spaceMetrics(state, s.id);
              const last = state.siteUpdates.find((u) => u.spaceId === s.id);
              return (
                <Link key={s.id} href={`/villa/${s.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-paper-2/60">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">{s.name}</div>
                    <div className="text-[11px] text-ink-3 truncate">
                      {last ? `${last.by} · ${fmtDay(last.at)} · ${last.body}` : "No site record yet"}
                    </div>
                  </div>
                  <div className="w-24 shrink-0"><Bar pct={m.completionPct} height={5} /></div>
                  <span className="tnum text-[12px] text-ink-3 w-9 text-right shrink-0">{Math.round(m.completionPct)}%</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
