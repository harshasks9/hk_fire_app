"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { AddButton, RowActions, EntityLink, EmptyWithAdd } from "@/components/Entity";
import { forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { PageTitle, Eyebrow, Empty, Tabs, PhotoBlock, Chip, Swatch, Avatar, fmtDay, Stat } from "@/components/ui";
import { OptionTile, DecisionCard } from "@/components/DecisionCard";
import { Comments } from "@/components/Comments";
import { LayoutsOverview } from "@/components/LayoutsOverview";
import { DESIGNS } from "@/lib/design";

const TABS = ["Layouts", "Moodboard", "Options", "Revisions", "Client feedback"] as const;
type Tab = (typeof TABS)[number];

/**
 * Design.
 *
 * The designer's own surface, and the homeowner's window onto it. Every idea,
 * option and drawing in the project, gathered across rooms so the scheme can be
 * read as one thing rather than forty.
 */
export default function DesignPage() {
  const { state, role } = useProject();
  const [tab, setTab] = useState<Tab>("Layouts");
  const [floor, setFloor] = useState<string>("all");

  const spaceById = useMemo(() => new Map(state.spaces.map((s) => [s.id, s])), [state.spaces]);
  const itemById = useMemo(() => new Map(state.items.map((i) => [i.id, i])), [state.items]);
  const spaceOf = (scopeItemId: string) => {
    const it = itemById.get(scopeItemId);
    return it?.spaceId ? spaceById.get(it.spaceId) : undefined;
  };

  const inFloor = (scopeItemId: string) =>
    floor === "all" || spaceOf(scopeItemId)?.floor === floor;

  const ideas = state.ideas.filter((i) => inFloor(i.scopeItemId));
  const options = state.options.filter((o) => inFloor(o.scopeItemId));
  const decisions = state.decisions.filter((d) => inFloor(d.scopeItemId));
  const renders = state.docs.filter((d) => ["render", "joinery", "elevation", "ceiling", "lighting", "electrical", "plumbing", "furniture"].includes(d.kind));

  // Everything the homeowner has said, newest first.
  const feedback = state.comments
    .filter((c) => state.people.find((p) => p.name === c.author)?.role === "homeowner")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const awaiting = decisions.filter((d) => d.status === "awaiting-owner" || d.status === "changes-requested");

  return (
    <div>
      <PageTitle
        title="Design"
        sub={
          role === "designer"
            ? "Your work across the villa — moodboards, options, revisions and everything the client has come back on."
            : "The scheme as it stands: what has been proposed, what is being weighed, and what has been settled."
        }
        right={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <select className="input w-auto" aria-label="Floor" value={floor} onChange={(e) => setFloor(e.target.value)}>
              <option value="all">Whole villa</option>
              <option value="ground">Ground floor</option>
              <option value="first">First floor</option>
              <option value="second">Second floor</option>
              <option value="outdoor">Outdoor</option>
            </select>
            <AddButton on="options" label="Add an option" />
            <AddButton on="ideas" label="Add an idea" accent />
          </div>
        }
      />


      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ Layouts: DESIGNS.length, Moodboard: ideas.length, Options: options.length, Revisions: renders.length, "Client feedback": feedback.length }} />

      <div className="mt-6">
        {awaiting.length > 0 && tab !== "Layouts" && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-3 mb-5 text-[14px] text-ink-2">
            <strong className="font-semibold text-ink">{awaiting.length} awaiting the client.</strong>
            <Link href="/decisions" className="link ml-auto">Open decisions</Link>
          </div>
        )}
        {tab === "Layouts" && <LayoutsOverview floor={floor} />}
        {tab === "Moodboard" && (
          ideas.length ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {ideas.map((idea) => {
                const sp = spaceOf(idea.scopeItemId);
                const a = idea.attachments[0];
                return (
                  <div key={idea.id} className="break-inside-avoid mb-3 group">
                    <div className="card overflow-hidden relative">
                      <RowActions on="ideas" id={idea.id} className="absolute top-2 right-2 z-10" />
                      <PhotoBlock
                        tone={a?.swatch ?? "#c3b6a4"}
                        ratio={idea.attachments.length > 1 ? "3 / 4" : "4 / 3"}
                        label={a?.label}
                        className="rounded-none border-0"
                      />
                      <div className="px-3 py-2.5">
                        <div className="text-[13.5px] leading-snug">{idea.title}</div>
                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          {sp ? (
                            <Link href={`/villa/${sp.id}`} className="text-[12px] text-ink-3 hover:text-accent truncate">{sp.name}</Link>
                          ) : <span className="text-[12px] text-ink-4">House-wide</span>}
                          {idea.shortlisted && <span className="text-accent text-[12.5px]">★</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyWithAdd on="ideas" title="No ideas collected for this floor yet."
              hint="References, swatches, tear sheets — anything that shows what a room should feel like before it is specified." />
          )
        )}

        {tab === "Options" && (
          options.length ? (
            <div className="space-y-7">
              {Array.from(new Set(options.map((o) => o.scopeItemId))).map((sid) => {
                const item = itemById.get(sid);
                const sp = spaceOf(sid);
                const set = options.filter((o) => o.scopeItemId === sid);
                const dec = state.decisions.find((d) => d.scopeItemId === sid);
                return (
                  <div key={sid}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
                      <div>
                        <Eyebrow>{sp?.name ?? "House-wide"}</Eyebrow>
                        <h3 className="text-[17px] mt-0.5">{item?.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {dec && <Chip tone={dec.status === "approved" ? "good" : "accent"}>{dec.status.replace(/-/g, " ")}</Chip>}
                        <span className="text-[13px] text-ink-3 tnum">
                          {inr(Math.min(...set.map((o) => o.estimate ?? 0)), { compact: true })} – {inr(Math.max(...set.map((o) => o.estimate ?? 0)), { compact: true })}
                        </span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {set.map((o) => <OptionTile key={o.id} option={o} recommended={o.designerRecommended} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyWithAdd on="options" title="No options prepared for this floor yet."
              hint="An option is one costed way of doing an item, so that a decision is a choice between real alternatives rather than a yes or no." />
          )
        )}

        {tab === "Revisions" && (
          <div className="card divide-y divide-line">
            {renders.map((d) => (
              <div key={d.id} className="px-4 py-3.5 flex items-center gap-3">
                <Chip tone="ghost">{d.kind.replace(/-/g, " ")}</Chip>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] truncate">{d.title}</div>
                  <div className="text-[12.5px] text-ink-3">
                    {d.addedBy} · {fmtDay(d.addedAt)}
                    {d.spaceIds.length > 0 && ` · ${d.spaceIds.map((s) => spaceById.get(s)?.name).filter(Boolean).join(", ")}`}
                  </div>
                </div>
                {d.revision && (
                  <Chip tone="neutral">{d.revision}</Chip>
                )}
              </div>
            ))}
            <div className="px-4 py-3 text-[12.5px] text-ink-3">
              Every revision is kept. A superseded drawing is never overwritten — it moves down the list.
            </div>
          </div>
        )}

        {tab === "Client feedback" && (
          feedback.length ? (
            <div className="space-y-3">
              {feedback.map((c) => {
                const target =
                  c.targetType === "option" ? state.options.find((o) => o.id === c.targetId)
                    : c.targetType === "idea" ? state.ideas.find((i) => i.id === c.targetId)
                    : undefined;
                const sid = (target as any)?.scopeItemId;
                const sp = sid ? spaceOf(sid) : undefined;
                const person = state.people.find((p) => p.name === c.author);
                return (
                  <div key={c.id} className="card px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={c.author} tone={person?.avatarTone} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[14px] font-medium">{c.author}</span>
                          <span className="text-[12.5px] text-ink-4">{fmtDay(c.createdAt)}</span>
                          {sp && <Link href={`/villa/${sp.id}`} className="text-[12.5px] text-accent hover:underline">{sp.name}</Link>}
                          {(target as any)?.headline && <Chip tone="ghost">{(target as any).headline}</Chip>}
                        </div>
                        <p className="text-[14px] text-ink-2 leading-relaxed mt-1.5">{c.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyWithAdd on="comments" title="No client feedback yet."
              hint="Comments attach to an item or a design option, and stay with it as it moves through the workflow." />
          )
        )}
      </div>
    </div>
  );
}
