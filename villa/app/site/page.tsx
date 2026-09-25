"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useProject, newId } from "@/lib/store";
import { openSnags, spaceMetrics } from "@/lib/model/derive";
import { type Severity, type SnagStatus, type Category, type Snag } from "@/lib/model/types";
import { FLOOR_META } from "@/lib/seed/spaces";
import {
  PageTitle, Eyebrow, Chip, Empty, PhotoBlock, Tabs, Field, fmtDay, Sheet, Bar, useToast,
  SEVERITY_TONE, SNAG_TONE,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { categoryOptions } from "@/lib/model/categories";
import { RowActions, EntityLink } from "@/components/Entity";

const TABS = ["Capture", "Snag list", "Progress"] as const;
type Tab = (typeof TABS)[number];

type Action = "photo" | "issue" | "note" | "task" | "progress" | "compare";

const ACTIONS: { id: Action; label: string; sub: string; icon: string }[] = [
  { id: "issue", label: "Raise a snag", sub: "A defect someone must put right", icon: "flag" },
  { id: "photo", label: "Log a photo", sub: "A dated record of what you can see", icon: "camera" },
  { id: "note", label: "Add a note", sub: "Anything worth remembering", icon: "notes" },
  { id: "task", label: "Create a task", sub: "Someone has to do something", icon: "task" },
  { id: "progress", label: "Record progress", sub: "How far this room has got", icon: "progress" },
  { id: "compare", label: "Compare with design", sub: "Site against the approved scheme", icon: "compare" },
];

/** Stand-in photo tones, stored with the record until real photos are kept. */
const PHOTO_SWATCH = { raised: "#bdb2a2", site: "#c2b6a6", fixed: "#c4bcae" };

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const SNAG_STATUSES: SnagStatus[] = ["open", "assigned", "fixed", "verify", "closed"];
const STATUS_LABEL: Record<SnagStatus, string> = {
  open: "Open", assigned: "Assigned", fixed: "Fixed", verify: "To verify", closed: "Closed",
};
const NEXT: Record<SnagStatus, SnagStatus | null> = {
  open: "assigned", assigned: "fixed", fixed: "verify", verify: "closed", closed: null,
};
const NEXT_LABEL: Record<SnagStatus, string> = {
  open: "Mark assigned", assigned: "Mark fixed", fixed: "Ready to verify", verify: "Verify and close", closed: "",
};
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/**
 * Site mode.
 *
 * Designed for one hand, standing in a half-built room, in bad light. Pick the
 * room once at the top and everything captured afterwards files itself there —
 * no form asks you where you are, because you already said.
 */
export default function SitePage() {
  const { state } = useProject();
  const [tab, setTab] = useState<Tab>("Capture");
  const [room, setRoom] = useState<string>(() => state.spaces.find((s) => s.floor === "ground")?.id ?? state.spaces[0]?.id ?? "");
  const [action, setAction] = useState<Action | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const space = state.spaces.find((s) => s.id === room);
  const snags = openSnags(state);
  const roomSnags = state.snags.filter((s) => s.spaceId === room && s.status !== "closed");
  const updates = state.siteUpdates.filter((u) => u.spaceId === room);
  const m = space ? spaceMetrics(state, room) : null;

  // The first render can come before the project loads; settle on a real room once it has.
  useEffect(() => {
    if (!space && state.spaces.length) setRoom(state.spaces.find((s) => s.floor === "ground")?.id ?? state.spaces[0].id);
  }, [space, state.spaces]);

  const showSnag = (id: string) => {
    setTab("Snag list");
    setFlash(id);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    setTimeout(() => setFlash(null), 2400);
  };

  // Links elsewhere point at /site#<snag> or /site#<site update>.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      if (state.snags.some((s) => s.id === id)) showSnag(id);
      else {
        const u = state.siteUpdates.find((x) => x.id === id);
        if (u) { setTab("Capture"); setRoom(u.spaceId); }
      }
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [state.snags.length, state.siteUpdates.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageTitle
        title="Site"
        sub="For walking the villa. Pick the room once — everything you capture files itself there."
      />

      {/* --------------------------------------------------- room selector */}
      <div className={`card px-4 py-3.5 mb-6 z-20 backdrop-blur bg-card/95 ${tab === "Capture" ? "sticky top-[60px] lg:top-4" : ""}`}>
        <label className="eyebrow block mb-2" htmlFor="site-room">I am standing in</label>
        <select id="site-room" className="input text-[15px]" value={room} onChange={(e) => setRoom(e.target.value)}>
          {(["ground", "first", "second", "outdoor"] as const).map((f) => (
            <optgroup key={f} label={FLOOR_META[f].label}>
              {state.spaces.filter((s) => s.floor === f).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {m && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2.5 text-[13px] text-ink-3">
            <span className="tnum">{Math.round(m.completionPct)}% complete</span>
            <span aria-hidden>·</span>
            <span className="tnum">{m.liveCount} items</span>
            {m.snagsOpen > 0 && <><span aria-hidden>·</span><span className="text-bad font-medium">{m.snagsOpen} open snag{m.snagsOpen > 1 ? "s" : ""}</span></>}
            <Link href={`/villa/${room}`} className="link ml-auto inline-flex items-center gap-1">
              Open the room <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        )}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ "Snag list": snags.length }} label="Site views" />

      <div className="mt-6">
        {tab === "Capture" && (
          <>
            <ul className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ACTIONS.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setAction(a.id)}
                    className="card card-link w-full h-full flex items-center gap-3 px-3.5 py-3 text-left group"
                  >
                    <span className="w-10 h-10 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center shrink-0">
                      <Icon name={a.icon} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold text-ink leading-snug">{a.label}</span>
                      <span className="block text-[13px] text-ink-3 leading-snug mt-0.5">{a.sub}</span>
                    </span>
                    <Icon name="chevron-right" size={17} className="text-ink-4 group-hover:text-ink shrink-0" />
                  </button>
                </li>
              ))}
            </ul>

            <section className="mt-9">
              <h2 className="text-[17px] leading-tight mb-3">Open in {space?.name ?? "this room"}</h2>
              {roomSnags.length ? (
                <div className="card divide-y divide-line overflow-hidden">
                  {roomSnags.map((s) => (
                    <button key={s.id} onClick={() => showSnag(s.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-paper transition-colors group">
                      <Chip tone={SEVERITY_TONE[s.severity]} small>{cap(s.severity)}</Chip>
                      <span className="min-w-0 flex-1 text-[14px] text-ink truncate">{s.title}</span>
                      <Chip tone={SNAG_TONE[s.status]} small>{STATUS_LABEL[s.status]}</Chip>
                      <Icon name="chevron-right" size={16} className="text-ink-4 group-hover:text-ink shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <Empty compact title="No open snags in this room."
                  action={<button className="btn btn-sm" onClick={() => setAction("issue")}><Icon name="plus" size={15} strokeWidth={2} />Raise a snag</button>} />
              )}
            </section>

            <section className="mt-9">
              <h2 className="text-[17px] leading-tight mb-3">Recent in {space?.name ?? "this room"}</h2>
              {updates.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {updates.slice(0, 3).map((u) => (
                    <figure key={u.id}>
                      <PhotoBlock tone={u.photoSwatch} ratio="4 / 3" label={fmtDay(u.at)} />
                      <figcaption className="text-[13px] text-ink-2 mt-1.5 leading-relaxed line-clamp-3">
                        {u.progressPct !== undefined && <span className="font-semibold text-ink tnum">{u.progressPct}% · </span>}
                        {u.body}
                        <span className="block text-[12px] text-ink-3 mt-0.5">{u.by}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <Empty compact title="Nothing recorded here yet."
                  hint="Photos and progress you log in this room show up here, newest first."
                  action={<button className="btn btn-sm" onClick={() => setAction("photo")}><Icon name="camera" size={15} />Log a photo</button>} />
              )}
            </section>
          </>
        )}

        {tab === "Snag list" && <SnagList flash={flash} onRaise={() => { setTab("Capture"); setAction("issue"); }} />}
        {tab === "Progress" && <ProgressTab onPick={(id) => { setRoom(id); setTab("Capture"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
      </div>

      {action && <CaptureSheet key={`${action}-${room}`} action={action} room={room} onClose={() => setAction(null)} />}
    </div>
  );
}

function CaptureSheet({ action, room, onClose }: { action: Action; room: string; onClose: () => void }) {
  const { state, dispatch, me } = useProject();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [category, setCategory] = useState<Category>("flooring");
  const [vendorId, setVendorId] = useState("");
  const [pct, setPct] = useState(() => {
    const last = state.siteUpdates.find((u) => u.spaceId === room && u.progressPct !== undefined);
    return last?.progressPct ?? 50;
  });
  const [tried, setTried] = useState(false);
  const space = state.spaces.find((s) => s.id === room);
  const roomName = space?.name ?? "this room";
  const needsTitle = action === "issue" || action === "task" || action === "note";
  const titleError = tried && needsTitle && !title.trim() ? "Give it a short title so it can be found later." : undefined;

  const submit = () => {
    setTried(true);
    if (needsTitle && !title.trim()) return;
    const now = new Date().toISOString();
    if (action === "issue") {
      dispatch({
        type: "snag/add",
        snag: {
          id: newId("snag"), spaceId: room, title: title.trim(), description: body, category, severity,
          vendorId: vendorId || undefined, raisedBy: me, raisedAt: now, status: "open",
          photoSwatch: PHOTO_SWATCH.raised,
          dueBy: new Date(Date.now() + 12 * 86400000).toISOString(),
        },
      });
      toast(`Snag raised in ${roomName}`);
    } else if (action === "task") {
      dispatch({ type: "task/add", task: { id: newId("t"), title: title.trim(), owner: me, spaceId: room, dependsOn: [], status: "todo", notes: body || undefined } });
      toast("Task created — it is on the timeline");
    } else if (action === "note") {
      dispatch({
        type: "note/add",
        note: { id: newId("n"), title: title.trim(), body, kind: "site-visit", at: now, author: me, spaceIds: [room], scopeItemIds: [], vendorIds: [], decisionIds: [], taskIds: [] },
      });
      toast(`Note saved to ${roomName}`);
    } else if (action === "photo" || action === "progress") {
      dispatch({
        type: "site/add",
        update: {
          id: newId("su"), spaceId: room, at: now, by: me,
          body: [title.trim(), body.trim()].filter(Boolean).join(" — ") || (action === "progress" ? `Progress at ${pct}%` : "Site photo"),
          progressPct: action === "progress" ? pct : undefined,
          photoSwatch: PHOTO_SWATCH.site,
        },
      });
      toast(action === "progress" ? `Progress recorded for ${roomName}` : `Photo logged in ${roomName}`);
    }
    onClose();
  };

  const labels: Record<Action, string> = {
    photo: "Log a photo", issue: "Raise a snag", note: "Add a note",
    task: "Create a task", progress: "Record progress", compare: "Compare with design",
  };
  const saveLabel: Record<Action, string> = {
    photo: "Save to the room's log", issue: "Raise snag", note: "Save note",
    task: "Create task", progress: "Save progress", compare: "",
  };

  if (action === "compare") {
    const approved = state.items.filter(
      (i) => i.spaceId === room && ["approved", "boq", "ordered", "delivered", "installed", "inspected", "complete"].includes(i.stage),
    );
    const update = state.siteUpdates.find((u) => u.spaceId === room);
    return (
      <Sheet open onClose={onClose} title={`${roomName} — site against design`} wide
        footer={<div className="flex justify-end"><button className="btn" onClick={onClose}>Done</button></div>}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div>
            <Eyebrow className="mb-2">As approved</Eyebrow>
            <PhotoBlock ratio="4 / 3" label="Approved scheme" />
          </div>
          <div>
            <Eyebrow className="mb-2">On site, latest</Eyebrow>
            <PhotoBlock tone={update?.photoSwatch} ratio="4 / 3" label={update ? fmtDay(update.at) : "No photo yet"} />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <Eyebrow>What was approved for this room</Eyebrow>
          {approved.length > 14 && <span className="text-[12px] text-ink-3">First 14 of {approved.length}</span>}
        </div>
        {approved.length ? (
          <div className="card divide-y divide-line">
            {approved.slice(0, 14).map((i) => (
              <div key={i.id} className="px-4 py-2.5">
                <div className="text-[14px] text-ink">{i.title}</div>
                {i.spec && <div className="text-[13px] text-ink-3 mt-0.5 line-clamp-2">{i.spec}</div>}
              </div>
            ))}
          </div>
        ) : (
          <Empty compact title="Nothing approved in this room yet."
            hint="Once an item here is approved, its specification appears so you can check the work against it." />
        )}
      </Sheet>
    );
  }

  return (
    <Sheet
      open onClose={onClose} title={labels[action]}
      description={<>Files itself to <strong className="font-semibold text-ink-2">{roomName}</strong>.</>}
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>{saveLabel[action]}</button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {action === "photo" && (
          <div className="flex gap-3 rounded-lg bg-paper-2 px-3.5 py-3 text-[13.5px] text-ink-2 leading-relaxed">
            <Icon name="info" size={17} className="text-ink-3 shrink-0 mt-0.5" />
            <p>Photo files are not stored yet. Describe what you can see and it is saved as a dated entry in {roomName}&rsquo;s log.</p>
          </div>
        )}

        {action === "progress" && (
          <Field label={`How complete is ${roomName}?`} hint="Your judgement from walking it — the room's own figure comes from its items.">
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(parseInt(e.target.value))}
                className="flex-1" style={{ accentColor: "var(--color-accent)" }} aria-label="Completion percentage" />
              <span className="text-[15px] font-semibold tnum w-12 text-right">{pct}%</span>
            </div>
          </Field>
        )}

        <Field
          label={action === "progress" ? "What changed" : action === "photo" ? "What the photo shows" : "Title"}
          required={needsTitle}
          error={titleError}
        >
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!titleError}
            placeholder={
              action === "issue" ? "What is wrong?" : action === "task" ? "What needs doing?"
                : action === "photo" ? "e.g. East wall after first coat" : action === "progress" ? "e.g. Tiling finished, grouting next" : "Short title"
            } />
        </Field>

        {action === "issue" && (
          <>
            <Field label="Severity">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Severity">
                {SEVERITIES.map((sv) => (
                  <button key={sv} type="button" onClick={() => setSeverity(sv)} className="pill" aria-pressed={severity === sv}>
                    {cap(sv)}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
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
            </div>
          </>
        )}

        <Field label={action === "issue" ? "Detail" : "Notes"}>
          <textarea className="input resize-y" value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Measurements, where exactly, what you saw." />
        </Field>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

function SnagList({ flash, onRaise }: { flash: string | null; onRaise: () => void }) {
  const { state, dispatch, me } = useProject();
  const toast = useToast();
  const [filter, setFilter] = useState<SnagStatus | "all">("all");
  const list = state.snags.filter((s) => filter === "all" || s.status === filter);
  const vendorName = (id?: string) => state.vendors.find((v) => v.id === id)?.name;

  const advance = (s: Snag) => {
    const to = NEXT[s.status];
    if (!to) return;
    const before: Partial<Snag> = { status: s.status, closedAt: s.closedAt, verifiedBy: s.verifiedBy, rectificationSwatch: s.rectificationSwatch };
    dispatch({
      type: "snag/patch", id: s.id,
      patch: {
        status: to,
        ...(to === "closed" ? { closedAt: new Date().toISOString(), verifiedBy: me } : {}),
        ...(to === "fixed" ? { rectificationSwatch: PHOTO_SWATCH.fixed } : {}),
      },
    });
    toast(to === "closed" ? `“${s.title}” verified and closed` : `“${s.title}” moved to ${STATUS_LABEL[to].toLowerCase()}`, {
      action: { label: "Undo", run: () => dispatch({ type: "snag/patch", id: s.id, patch: before }) },
    });
  };

  if (!state.snags.length) {
    return (
      <Empty icon="flag" title="No snags raised yet."
        hint="Snags raised on site land in this list with the room they were raised in, and move from open to verified and closed."
        action={<button className="btn btn-primary" onClick={onRaise}><Icon name="plus" size={16} strokeWidth={2} />Raise a snag</button>} />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filter snags by status">
        <button onClick={() => setFilter("all")} className="pill" aria-pressed={filter === "all"}>
          All <span className="count">{state.snags.length}</span>
        </button>
        {SNAG_STATUSES.map((st) => {
          const n = state.snags.filter((s) => s.status === st).length;
          return (
            <button key={st} onClick={() => setFilter(st)} className="pill" aria-pressed={filter === st}>
              {STATUS_LABEL[st]} <span className="count">{n}</span>
            </button>
          );
        })}
      </div>

      {!list.length ? (
        <Empty icon="flag" title={`No snags are ${STATUS_LABEL[filter as SnagStatus].toLowerCase()}.`}
          action={<button className="btn btn-sm" onClick={() => setFilter("all")}>Clear filter</button>} />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {list.map((s) => {
            const to = NEXT[s.status];
            return (
              <article key={s.id} id={s.id}
                className={`px-4 py-4 scroll-mt-28 group flex gap-3.5 sm:gap-4 transition-colors ${flash === s.id ? "bg-accent-soft" : ""}`}>
                <div className="w-20 sm:w-32 shrink-0 grid gap-2 content-start">
                  <PhotoBlock tone={s.photoSwatch} ratio="4 / 3" label="Raised">
                    {s.pins?.map((p, i) => (
                      <span key={i} title={p.label} className="absolute rounded-full ring-2 ring-white bg-bad"
                        style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 12, height: 12, transform: "translate(-50%,-50%)" }} />
                    ))}
                  </PhotoBlock>
                  {s.rectificationSwatch && <PhotoBlock tone={s.rectificationSwatch} ratio="4 / 3" label="Fixed" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Chip tone={SEVERITY_TONE[s.severity]} small>{cap(s.severity)}</Chip>
                        <Chip tone={SNAG_TONE[s.status]} small>{STATUS_LABEL[s.status]}</Chip>
                        {s.spaceId && <span className="text-[13px]"><EntityLink on="spaces" id={s.spaceId} /></span>}
                      </div>
                      <h3 className="text-[15.5px] font-semibold leading-snug">{s.title}</h3>
                    </div>
                    <RowActions on="snags" id={s.id} />
                  </div>
                  {s.description && <p className="text-[14px] text-ink-2 mt-1 leading-relaxed">{s.description}</p>}
                  <div className="text-[13px] text-ink-3 mt-1.5 leading-relaxed">
                    Raised by {s.raisedBy} · {fmtDay(s.raisedAt)}
                    {vendorName(s.vendorId) && ` · ${vendorName(s.vendorId)}`}
                    {s.dueBy && s.status !== "closed" && ` · due ${fmtDay(s.dueBy)}`}
                    {s.closedAt && ` · verified by ${s.verifiedBy} on ${fmtDay(s.closedAt)}`}
                  </div>
                  {to && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
                      <button className="btn btn-sm" onClick={() => advance(s)}>
                        {s.status === "verify" && <Icon name="check" size={15} />}
                        {NEXT_LABEL[s.status]}
                      </button>
                      {s.status === "fixed" && (
                        <span className="text-[13px] text-ink-3">
                          A vendor marking it fixed does not close it — someone has to verify.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="mt-4">
        <button className="btn btn-sm" onClick={onRaise}><Icon name="plus" size={15} strokeWidth={2} />Raise a snag</button>
      </div>
    </div>
  );
}

function ProgressTab({ onPick }: { onPick: (id: string) => void }) {
  const { state } = useProject();
  return (
    <div className="space-y-7">
      {(["ground", "first", "second", "outdoor"] as const).map((f) => {
        const rooms = state.spaces.filter((s) => s.floor === f);
        if (!rooms.length) return null;
        return (
          <section key={f}>
            <Eyebrow className="mb-2">{FLOOR_META[f].label}</Eyebrow>
            <div className="card divide-y divide-line overflow-hidden">
              {rooms.map((s) => {
                const m = spaceMetrics(state, s.id);
                const last = state.siteUpdates.find((u) => u.spaceId === s.id);
                return (
                  <div key={s.id} className="flex items-center hover:bg-paper transition-colors group">
                    <button onClick={() => onPick(s.id)} className="min-w-0 flex-1 px-4 py-3 flex items-center gap-3 text-left"
                      aria-label={`${s.name}, ${Math.round(m.completionPct)}% complete. Capture in this room.`}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-ink">{s.name}</span>
                        <span className="block text-[13px] text-ink-3 truncate">
                          {last ? `${last.by} · ${fmtDay(last.at)} · ${last.body}` : "No site record yet"}
                        </span>
                      </span>
                      <span className="w-16 sm:w-28 shrink-0"><Bar pct={m.completionPct} height={5} label={`${s.name} complete`} /></span>
                      <span className="tnum text-[13px] text-ink-2 w-10 text-right shrink-0">{Math.round(m.completionPct)}%</span>
                    </button>
                    <Link href={`/villa/${s.id}`} className="btn btn-ghost btn-icon btn-sm mr-2 shrink-0" aria-label={`Open ${s.name}`} title={`Open ${s.name}`}>
                      <Icon name="open" size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
