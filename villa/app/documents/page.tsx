"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { PageTitle, Empty, fmtDay } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { AddButton, RowActions, EntityLink } from "@/components/Entity";
import type { Doc } from "@/lib/model/types";

const GROUPS: { label: string; kinds: Doc["kind"][] }[] = [
  { label: "Drawings", kinds: ["floor-plan", "electrical", "lighting", "ceiling", "plumbing", "furniture", "joinery", "elevation"] },
  { label: "Visuals", kinds: ["render"] },
  { label: "Commercial", kinds: ["boq", "quote", "po", "contract", "invoice", "receipt"] },
  { label: "Handover", kinds: ["spec", "warranty", "manual"] },
];
const KNOWN = new Set(GROUPS.flatMap((g) => g.kinds));

const KIND_LABEL: Partial<Record<Doc["kind"], string>> = { boq: "BOQ", po: "Purchase order", "floor-plan": "Floor plan" };
const kindLabel = (k: string) => KIND_LABEL[k as Doc["kind"]] ?? (k ? k.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()) : "Document");

/** Only open links that are web addresses — a stored link is typed by a person. */
const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : undefined);

/**
 * Documents.
 *
 * A repository exists, but it is the fallback. Documents appear where they are
 * relevant — the joinery drawing inside the room, the quote inside the
 * comparison, the warranty inside the item — and this page is only for when you
 * know you want the file and not the context.
 */
export default function DocumentsPage() {
  const { state } = useProject();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");

  const spaceName = (id: string) => state.spaces.find((s) => s.id === id)?.name ?? id;
  const groups = useMemo(
    () => [...GROUPS, { label: "Other", kinds: [] as Doc["kind"][] }].map((g) => ({
      ...g,
      match: (d: Doc) => (g.label === "Other" ? !KNOWN.has(d.kind) : g.kinds.includes(d.kind)),
    })),
    [],
  );
  const searched = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.docs
      .filter((d) => !needle || `${d.title} ${d.kind} ${kindLabel(d.kind)} ${d.revision ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt));
  }, [state.docs, q]);
  const visible = groups.filter((g) => group === "all" || g.label === group);
  const shown = searched.filter((d) => visible.some((g) => g.match(d)));

  return (
    <div>
      <PageTitle
        title="Documents"
        sub="Everything filed. Most of the time you will meet these inside the room or the item they belong to rather than here."
        right={<AddButton on="docs" label="Add a document" className="btn btn-primary" />}
      />

      {state.docs.length === 0 ? (
        <Empty icon="documents" title="Nothing filed yet"
          hint="Drawings, quotes, purchase orders, invoices, warranties and manuals all live here — and show up inside the room or item they belong to."
          action={<AddButton on="docs" label="Add a document" className="btn btn-primary" />} />
      ) : (
        <>
          <div className="grid gap-3 mb-6">
            <label className="input flex items-center gap-2 max-w-xl">
              <Icon name="search" size={17} className="text-ink-4 shrink-0" />
              <input className="w-full bg-transparent outline-none" placeholder="Search by title, kind or revision"
                aria-label="Search documents" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter documents by group">
              <button className="pill" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
                All <span className="count">{searched.length}</span>
              </button>
              {groups.map((g) => {
                const n = searched.filter(g.match).length;
                if (g.label === "Other" && !state.docs.some(g.match)) return null;
                return (
                  <button key={g.label} className="pill" aria-pressed={group === g.label} onClick={() => setGroup(g.label)}>
                    {g.label} <span className="count">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!shown.length ? (
            <Empty icon="search" title="No documents match."
              hint={q.trim() ? <>Nothing{group !== "all" ? ` in ${group.toLowerCase()}` : ""} matches &ldquo;{q.trim()}&rdquo;.</> : `Nothing is filed under ${group.toLowerCase()} yet.`}
              action={<button className="btn btn-sm" onClick={() => { setQ(""); setGroup("all"); }}>Clear filters</button>} />
          ) : (
            <div className="space-y-8">
              {visible.map((g) => {
                const list = shown.filter(g.match);
                if (!list.length) return null;
                return (
                  <section key={g.label}>
                    <h2 className="text-[17px] leading-tight mb-3 flex items-baseline gap-2">
                      {g.label} <span className="text-[13px] font-normal text-ink-3 tnum">{list.length}</span>
                    </h2>
                    <div className="card divide-y divide-line">
                      {list.map((d) => {
                        const url = safeUrl(d.url);
                        return (
                          <div key={d.id} id={d.id} className="px-4 py-3 flex items-start sm:items-center gap-3 group scroll-mt-24 target:bg-accent-soft/50">
                            <span className="hidden sm:flex w-9 h-9 rounded-lg bg-paper-2 text-ink-3 items-center justify-center shrink-0">
                              <Icon name={g.label === "Drawings" ? "drawings" : g.label === "Commercial" ? "rupee" : "documents"} size={17} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2">
                                <span className="text-[14.5px] text-ink leading-snug">{d.title}</span>
                                {d.revision && <span className="text-[12px] font-mono text-ink-2 rounded bg-paper-2 px-1.5 py-px">{d.revision}</span>}
                              </div>
                              <div className="text-[13px] text-ink-3 mt-0.5 flex flex-wrap items-center gap-x-1.5 leading-relaxed">
                                <span>{kindLabel(d.kind)}</span>
                                <span aria-hidden>·</span>
                                <span>{d.addedBy} · {fmtDay(d.addedAt)}</span>
                                {d.spaceIds.map((id) => (
                                  <React.Fragment key={id}>
                                    <span aria-hidden>·</span><EntityLink on="spaces" id={id} label={spaceName(id)} />
                                  </React.Fragment>
                                ))}
                                {d.vendorId && <><span aria-hidden>·</span><EntityLink on="vendors" id={d.vendorId} /></>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {url && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm"
                                  aria-label={`Open ${d.title} in a new tab`}>
                                  <Icon name="open" size={15} /><span className="hidden sm:inline">Open</span>
                                </a>
                              )}
                              <RowActions on="docs" id={d.id} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="text-[13px] text-ink-3 mt-8 leading-relaxed max-w-2xl">
        Revisions are never overwritten. A superseded drawing stays on the record with its
        revision mark, so it is always possible to see what was approved at the time a
        decision was taken.
      </p>
    </div>
  );
}
