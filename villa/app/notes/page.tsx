"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, newId } from "@/lib/store";
import { PageTitle, Chip, Empty, Avatar, fmtDate, Field, Sheet, useToast, TONE, type Tone } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { RowActions, EntityLink } from "@/components/Entity";
import { DESIGNS } from "@/lib/design";
import type { Note } from "@/lib/model/types";

const KINDS: Note["kind"][] = ["meeting", "site-visit", "call", "vendor-meeting", "observation", "measurement", "idea", "follow-up"];
const KIND_LABEL: Record<Note["kind"], string> = {
  meeting: "Meeting", "site-visit": "Site visit", call: "Call", "vendor-meeting": "Vendor meeting",
  observation: "Observation", measurement: "Measurement", idea: "Idea", "follow-up": "Follow-up",
};
const SPAWN_LABEL: Record<NonNullable<Note["spawned"]>[number]["kind"], string> = {
  task: "Task", decision: "Decision", snag: "Snag", procurement: "Procurement", "follow-up": "Follow-up",
};

/**
 * A note's title is often just the start of its body, cut short with an
 * ellipsis. Showing both says the same thing twice, so work out which of the
 * two is worth showing.
 */
function headline(n: Note): { title?: string; body?: string } {
  const title = n.title.trim();
  const body = n.body.trim();
  if (!body) return { title };
  const stem = title.replace(/(…|\.\.\.)$/, "").trim();
  const repeats = !!stem && (body === title || body.startsWith(stem));
  if (!repeats) return { title, body };
  // Short enough to be its own headline: show it once, in full.
  if (body.length <= 160 && !body.includes("\n")) return { title: body };
  return { body };
}

/**
 * Notes.
 *
 * A note is a first-class object, not a comment field. One note can be about a
 * room and a vendor and a decision and a task at once, and it can spawn any of
 * them — which is what turns a conversation into something the project
 * remembers rather than something somebody half-recalls in three months.
 */
export default function NotesPage() {
  const { state } = useProject();
  const [kind, setKind] = useState<Note["kind"] | "all">("all");
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);

  const notes = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.notes
      .filter((n) => kind === "all" || n.kind === kind)
      .filter((n) => !needle || `${n.title} ${n.body} ${n.author}`.toLowerCase().includes(needle))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [state.notes, kind, q]);

  const spaceName = (id: string) => state.spaces.find((s) => s.id === id)?.name ?? id;
  const vendorName = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? id;
  const layoutOf = (id: string) => {
    for (const d of DESIGNS) {
      const l = d.layouts.find((x) => x.id === id);
      if (l) return { spaceId: d.spaceId, label: `${spaceName(d.spaceId)} — layout ${l.key}` };
    }
    return null;
  };
  const filtering = kind !== "all" || !!q.trim();
  const clear = () => { setKind("all"); setQ(""); };

  return (
    <div>
      <PageTitle
        title="Project notes"
        sub="Meetings, site visits, calls, measurements and observations — tagged to everything they touch, so nothing has to be remembered."
        right={
          <button className="btn btn-primary" onClick={() => setComposing(true)}>
            <Icon name="plus" size={16} strokeWidth={2} /> New note
          </button>
        }
      />

      {state.notes.length > 0 && (
        <div className="grid gap-3 mb-5">
          <label className="input flex items-center gap-2 max-w-xl">
            <Icon name="search" size={17} className="text-ink-4 shrink-0" />
            <input className="w-full bg-transparent outline-none" placeholder="Search notes"
              aria-label="Search notes" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter notes by kind">
            <button onClick={() => setKind("all")} className="pill" aria-pressed={kind === "all"}>
              All <span className="count">{state.notes.length}</span>
            </button>
            {KINDS.map((k) => {
              const n = state.notes.filter((x) => x.kind === k).length;
              if (!n) return null;
              return (
                <button key={k} onClick={() => setKind(k)} className="pill" aria-pressed={kind === k}>
                  {KIND_LABEL[k]} <span className="count">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!state.notes.length ? (
        <Empty
          icon="notes"
          title="No notes yet"
          hint="Meetings, site visits, calls and measurements. Tag a note to a room, a vendor or a decision and it shows up there too."
          action={<button className="btn btn-primary" onClick={() => setComposing(true)}><Icon name="plus" size={16} strokeWidth={2} /> New note</button>}
        />
      ) : !notes.length ? (
        <Empty
          icon="search"
          title="No notes match."
          hint={q.trim() ? <>Nothing{kind !== "all" ? ` in ${KIND_LABEL[kind as Note["kind"]].toLowerCase()} notes` : ""} mentions &ldquo;{q.trim()}&rdquo;.</> : undefined}
          action={filtering ? <button className="btn btn-sm" onClick={clear}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="card divide-y divide-line">
          {notes.map((n) => {
            const person = state.people.find((p) => p.name === n.author);
            const h = headline(n);
            const layouts = (n.layoutIds ?? []).map(layoutOf).filter(Boolean) as { spaceId: string; label: string }[];
            const tagged = n.spaceIds.length + n.vendorIds.length + n.decisionIds.length + n.taskIds.length + n.scopeItemIds.length + layouts.length;
            return (
              <article key={n.id} id={n.id} className="px-4 sm:px-5 py-4 scroll-mt-24 group target:bg-accent-soft/50">
                <div className="flex items-start gap-3">
                  <Avatar name={n.author} tone={person?.avatarTone} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
                        <span className="font-semibold text-ink-2">{n.author}</span>
                        <span aria-hidden>·</span>
                        <time dateTime={n.at}>{fmtDate(n.at)}</time>
                        <Chip tone="ghost" small>{KIND_LABEL[n.kind]}</Chip>
                      </div>
                      <RowActions on="notes" id={n.id} />
                    </div>
                    {h.title && <h3 className="text-[16px] leading-snug mt-1">{h.title}</h3>}
                    {h.body && (
                      <p className={`text-[14.5px] text-ink-2 leading-relaxed whitespace-pre-wrap ${h.title ? "mt-1.5" : "mt-1"}`}>{h.body}</p>
                    )}

                    {tagged > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="eyebrow mr-0.5">Tagged</span>
                        {n.spaceIds.map((id) => (
                          <Link key={id} href={`/villa/${id}`} className="hover:opacity-80"><Tag tone="info">{spaceName(id)}</Tag></Link>
                        ))}
                        {layouts.map((l, i) => (
                          <Link key={`l${i}`} href={`/villa/${l.spaceId}?tab=Layouts`} className="hover:opacity-80"><Tag tone="info">{l.label}</Tag></Link>
                        ))}
                        {n.vendorIds.map((id) => (
                          <Link key={id} href={`/vendors#${id}`} className="hover:opacity-80"><Tag tone="neutral">{vendorName(id)}</Tag></Link>
                        ))}
                        {n.decisionIds.map((id) => (
                          <Link key={id} href={`/decisions#${id}`} className="hover:opacity-80"><Tag tone="accent">{state.decisions.find((d) => d.id === id)?.title ?? "Decision"}</Tag></Link>
                        ))}
                        {n.taskIds.map((id) => (
                          <EntityLink key={id} on="tasks" id={id} className="hover:opacity-80">
                            <Tag tone="warn">{state.tasks.find((t) => t.id === id)?.title ?? "Task"}</Tag>
                          </EntityLink>
                        ))}
                        {n.scopeItemIds.map((id) => {
                          const it = state.items.find((i) => i.id === id);
                          return it ? (
                            <EntityLink key={id} on="items" id={id} className="hover:opacity-80"><Tag tone="ghost">{it.title}</Tag></EntityLink>
                          ) : null;
                        })}
                      </div>
                    )}

                    {n.spawned && n.spawned.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center gap-1.5">
                        <span className="eyebrow mr-0.5">This note created</span>
                        {n.spawned.map((s) => (
                          <Tag key={s.id} tone="accent">
                            <span className="font-semibold">{SPAWN_LABEL[s.kind] ?? s.kind}</span> · {s.label}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {composing && <Compose onClose={() => setComposing(false)} />}
    </div>
  );
}

/**
 * A tag that may be long — a task or item title — so unlike a status chip it
 * wraps instead of pushing the page sideways on a phone.
 */
function Tag({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  const [bg, fg] = TONE[tone];
  return (
    <span className="chip whitespace-normal max-w-full text-left"
      style={{ background: bg, color: fg, borderColor: tone === "ghost" ? "var(--color-line-2)" : "transparent" }}>
      <span className="min-w-0">{children}</span>
    </span>
  );
}

function Compose({ onClose }: { onClose: () => void }) {
  const { state, dispatch, me } = useProject();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Note["kind"]>("meeting");
  const [spaceIds, setSpaceIds] = useState<string[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [spawnTask, setSpawnTask] = useState(false);
  const [tried, setTried] = useState(false);
  const titleError = tried && !title.trim() ? "Give the note a title so it can be found later." : undefined;

  const toggle = (arr: string[], set: (x: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const submit = () => {
    setTried(true);
    const t = title.trim();
    if (!t) return;
    const now = new Date().toISOString();
    const spawned: Note["spawned"] = [];
    if (spawnTask) {
      const tid = newId("t");
      dispatch({ type: "task/add", task: { id: tid, title: `Follow up — ${t}`, owner: me, spaceId: spaceIds[0], dependsOn: [], status: "todo" } });
      spawned.push({ kind: "task", id: tid, label: `Follow up — ${t}` });
    }
    dispatch({
      type: "note/add",
      note: {
        id: newId("n"), title: t, body, kind, at: now, author: me,
        spaceIds, scopeItemIds: [], vendorIds, decisionIds: [], taskIds: [],
        spawned: spawned.length ? spawned : undefined,
      },
    });
    toast(spawnTask ? "Note saved, and a follow-up task created" : "Note saved");
    onClose();
  };

  return (
    <Sheet
      open onClose={onClose} title="New note" wide
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Save note</button>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Title" required error={titleError}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!titleError} placeholder="What is this about?" />
        </Field>
        <Field label="Kind">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kind of note">
            {KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className="pill" aria-pressed={kind === k}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Note">
          <textarea className="input min-h-[160px] resize-y leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Field label={`Rooms this touches${spaceIds.length ? ` · ${spaceIds.length} chosen` : ""}`} hint="A note can belong to several at once.">
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto thin-scroll p-0.5" role="group" aria-label="Rooms">
            {state.spaces.map((s) => (
              <button key={s.id} type="button" onClick={() => toggle(spaceIds, setSpaceIds, s.id)} className="pill" aria-pressed={spaceIds.includes(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </Field>
        {state.vendors.length > 0 && (
          <Field label={`Vendors${vendorIds.length ? ` · ${vendorIds.length} chosen` : ""}`}>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto thin-scroll p-0.5" role="group" aria-label="Vendors">
              {state.vendors.map((v) => (
                <button key={v.id} type="button" onClick={() => toggle(vendorIds, setVendorIds, v.id)} className="pill" aria-pressed={vendorIds.includes(v.id)}>
                  {v.name}
                </button>
              ))}
            </div>
          </Field>
        )}
        <label className="flex items-center gap-2.5 text-[14px] text-ink-2 cursor-pointer">
          <input type="checkbox" checked={spawnTask} onChange={(e) => setSpawnTask(e.target.checked)} />
          Also create a follow-up task on the timeline
        </label>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
