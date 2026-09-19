"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject, newId } from "@/lib/store";
import { PageTitle, Eyebrow, Chip, Empty, Avatar, fmtDate, Field, Sheet } from "@/components/ui";
import { AddButton, RowActions, EntityLink, EmptyWithAdd } from "@/components/Entity";
import type { Note } from "@/lib/model/types";

const KINDS: Note["kind"][] = ["meeting", "site-visit", "call", "vendor-meeting", "observation", "measurement", "idea", "follow-up"];
const KIND_LABEL: Record<Note["kind"], string> = {
  meeting: "Meeting", "site-visit": "Site visit", call: "Call", "vendor-meeting": "Vendor meeting",
  observation: "Observation", measurement: "Measurement", idea: "Idea", "follow-up": "Follow-up",
};

/**
 * Notes.
 *
 * A note is a first-class object, not a comment field. One note can be about a
 * room and a vendor and a decision and a task at once, and it can spawn any of
 * them — which is what turns a conversation into something the project
 * remembers rather than something somebody half-recalls in three months.
 */
export default function NotesPage() {
  const { state, dispatch, me } = useProject();
  const [kind, setKind] = useState<Note["kind"] | "all">("all");
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);

  const notes = useMemo(() => {
    return state.notes
      .filter((n) => kind === "all" || n.kind === kind)
      .filter((n) => !q.trim() || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [state.notes, kind, q]);

  const spaceName = (id: string) => state.spaces.find((s) => s.id === id)?.name ?? id;
  const vendorName = (id: string) => state.vendors.find((v) => v.id === id)?.name ?? id;

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Notes</div>
      <PageTitle
        title="Project notes"
        sub="Meetings, site visits, calls, measurements and observations — tagged to everything they touch, so nothing has to be remembered."
        right={<button className="btn btn-accent" onClick={() => setComposing(true)}>New note</button>}
      />

      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <input className="input w-auto flex-1 min-w-[180px]" placeholder="Search the project's memory…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={() => setKind("all")} className="btn btn-sm"
          style={{ background: kind === "all" ? "var(--color-ink)" : undefined, color: kind === "all" ? "var(--color-paper)" : undefined }}>All</button>
        {KINDS.map((k) => {
          const n = state.notes.filter((x) => x.kind === k).length;
          if (!n) return null;
          return (
            <button key={k} onClick={() => setKind(k)} className="btn btn-sm"
              style={{ background: kind === k ? "var(--color-ink)" : undefined, color: kind === k ? "var(--color-paper)" : undefined }}>
              {KIND_LABEL[k]} {n}
            </button>
          );
        })}
      </div>

      {!notes.length ? (
        <EmptyWithAdd on="notes" title="No notes match."
          hint="Meetings, site visits, calls and measurements. Tag a note to a room, a vendor or a decision and it shows up there too." />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const person = state.people.find((p) => p.name === n.author);
            return (
              <div key={n.id} id={n.id} className="card px-4 sm:px-5 py-4 scroll-mt-24 group">
                <div className="flex items-start gap-3">
                  <Avatar name={n.author} tone={person?.avatarTone} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="ghost">{KIND_LABEL[n.kind]}</Chip>
                      <span className="text-[11.5px] text-ink-3">{n.author} · {fmtDate(n.at)}</span>
                      <span className="ml-auto"><RowActions on="notes" id={n.id} /></span>
                    </div>
                    <h3 className="text-[16px] mt-1.5">{n.title}</h3>
                    <p className="text-[13px] text-ink-2 mt-2 leading-relaxed whitespace-pre-wrap">{n.body}</p>

                    {(n.spaceIds.length || n.vendorIds.length || n.decisionIds.length || n.taskIds.length || n.scopeItemIds.length) > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10.5px] text-ink-4 uppercase tracking-wider mr-0.5">Tagged</span>
                        {n.spaceIds.map((id) => (
                          <Link key={id} href={`/villa/${id}`}><Chip tone="slate">{spaceName(id)}</Chip></Link>
                        ))}
                        {n.vendorIds.map((id) => (
                          <Link key={id} href={`/vendors#${id}`}><Chip tone="neutral">{vendorName(id)}</Chip></Link>
                        ))}
                        {n.decisionIds.map((id) => (
                          <Link key={id} href={`/decisions#${id}`}><Chip tone="clay">{state.decisions.find((d) => d.id === id)?.title ?? "Decision"}</Chip></Link>
                        ))}
                        {n.taskIds.map((id) => (
                          <EntityLink key={id} on="tasks" id={id} className="">
                            <Chip tone="ochre">{state.tasks.find((t) => t.id === id)?.title ?? "Task"}</Chip>
                          </EntityLink>
                        ))}
                        {n.scopeItemIds.map((id) => {
                          const it = state.items.find((i) => i.id === id);
                          return it ? (
                            <EntityLink key={id} on="items" id={id} className=""><Chip tone="ghost">{it.title}</Chip></EntityLink>
                          ) : null;
                        })}
                      </div>
                    )}

                    {n.spawned && n.spawned.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-line">
                        <Eyebrow>This note created</Eyebrow>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {n.spawned.map((s) => (
                            <span key={s.id} className="chip" style={{ background: "#f2e2d9", color: "#9c5333" }}>
                              {s.kind} · {s.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Compose open={composing} onClose={() => setComposing(false)} />
    </div>
  );
}

function Compose({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, me } = useProject();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Note["kind"]>("meeting");
  const [spaceIds, setSpaceIds] = useState<string[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [spawnTask, setSpawnTask] = useState(false);

  const toggle = (arr: string[], set: (x: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const submit = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const spawned: Note["spawned"] = [];
    if (spawnTask) {
      const tid = newId("t");
      dispatch({ type: "task/add", task: { id: tid, title: `Follow up — ${title}`, owner: me, spaceId: spaceIds[0], dependsOn: [], status: "todo" } });
      spawned.push({ kind: "task", id: tid, label: `Follow up — ${title}` });
    }
    dispatch({
      type: "note/add",
      note: {
        id: newId("n"), title, body, kind, at: now, author: me,
        spaceIds, scopeItemIds: [], vendorIds, decisionIds: [], taskIds: [],
        spawned: spawned.length ? spawned : undefined,
      },
    });
    setTitle(""); setBody(""); setSpaceIds([]); setVendorIds([]); setSpawnTask(false);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="New note" wide>
      <div className="space-y-4">
        <Field label="Title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="What is this about?" />
        </Field>
        <Field label="Kind">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button key={k} onClick={() => setKind(k)} className="btn btn-sm"
                style={{ background: kind === k ? "var(--color-ink)" : undefined, color: kind === k ? "var(--color-paper)" : undefined }}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Note">
          <textarea className="input min-h-[160px] resize-y leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Field label="Rooms this touches" hint="A note can belong to several at once.">
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto thin-scroll">
            {state.spaces.map((s) => (
              <button key={s.id} onClick={() => toggle(spaceIds, setSpaceIds, s.id)} className="chip"
                style={{ background: spaceIds.includes(s.id) ? "#f2e2d9" : "#f4f1ec", color: spaceIds.includes(s.id) ? "#9c5333" : "#857b70" }}>
                {s.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Vendors">
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto thin-scroll">
            {state.vendors.map((v) => (
              <button key={v.id} onClick={() => toggle(vendorIds, setVendorIds, v.id)} className="chip"
                style={{ background: vendorIds.includes(v.id) ? "#e5e9ed" : "#f4f1ec", color: vendorIds.includes(v.id) ? "#4c5763" : "#857b70" }}>
                {v.name}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-[13px] cursor-pointer">
          <input type="checkbox" checked={spawnTask} onChange={(e) => setSpawnTask(e.target.checked)} />
          Also create a follow-up task
        </label>
        <button className="btn btn-accent w-full justify-center" onClick={submit} disabled={!title.trim()}>Save note</button>
      </div>
    </Sheet>
  );
}
