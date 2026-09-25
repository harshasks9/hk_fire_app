"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { newId } from "@/lib/reducer";
import { designFor, recommendedOf } from "@/lib/design";
import type { Layout, RoomDesign } from "@/lib/design/types";
import type { Note } from "@/lib/model/types";
import { inr } from "@/lib/model/costing";
import { Icon } from "./Icon";
import { RoomLayout, pieceList } from "./RoomLayout";
import { RowActions } from "./Entity";
import { Chip, Eyebrow, relative, useToast } from "./ui";

/**
 * A room's layouts, side by side.
 *
 * Every option is drawn to scale on the room as the plan geometry has it,
 * with what it's good and bad at, what it costs against layout A, and what it
 * takes for granted. Anyone on the project can write notes under an option;
 * choosing one records it against the room, in the history, as its decision.
 */
export function LayoutsPanel({ spaceId }: { spaceId: string }) {
  const { state } = useProject();
  const design = designFor(spaceId);
  if (!design) return null;

  if (design.spaceId !== spaceId) {
    const host = state.spaces.find((s) => s.id === design.spaceId);
    return (
      <div className="card-quiet px-4 py-4 text-[14px] text-ink-2 leading-relaxed">
        This is part of one room now: its layouts are drawn with the whole{" "}
        <Link href={`/villa/${design.spaceId}?tab=Layouts`} className="text-accent hover:underline">{host?.name ?? "room"}</Link>.
      </div>
    );
  }
  return <Panel design={design} />;
}

function Panel({ design }: { design: RoomDesign }) {
  const { state, dispatch } = useProject();
  const toast = useToast();
  const space = state.spaces.find((s) => s.id === design.spaceId);
  const chosenId = space?.layoutId;
  const rec = recommendedOf(design);
  const chosen = design.layouts.find((l) => l.id === chosenId);

  const choose = (l?: Layout) => {
    const before = chosen;
    dispatch({ type: "space/layout", id: design.spaceId, layoutId: l?.id, name: l?.name });
    toast(l ? `Layout ${l.key} chosen for ${space?.name ?? "this room"}` : "Choice cleared", {
      action: { label: "Undo", run: () => dispatch({ type: "space/layout", id: design.spaceId, layoutId: before?.id, name: before?.name }) },
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <p className="text-[14px] text-ink-2 leading-relaxed max-w-3xl">{design.brief}</p>
        <div className="shrink-0">
          {chosen
            ? <Chip tone="accent">Chosen: {chosen.key} — {chosen.name}</Chip>
            : <Chip tone="neutral">Not chosen yet · I recommend {rec.key}</Chip>}
        </div>
      </div>

      {design.ignoreOpenings?.map((g) => (
        <p key={g.edge + g.at} className="text-[12.5px] text-ink-3 mb-3 leading-relaxed">
          <span className="text-accent">Note on the plan:</span> {g.why}
        </p>
      ))}

      {/* thumbnails, to compare at a glance and jump to one */}
      {design.layouts.length > 1 && (
        <div className="flex gap-2.5 mb-5 overflow-x-auto thin-scroll pb-1">
          {design.layouts.map((l) => (
            <a key={l.id} href={`#layout-${l.key}`}
              className="card px-2 pt-2 pb-1.5 shrink-0 hover:border-ink-4 transition-colors"
              style={{ width: 150, borderColor: l.id === chosenId ? "var(--color-accent)" : undefined }}>
              <RoomLayout design={design} layout={l} compact maxHeight={120} />
              <div className="text-[12.5px] mt-1 leading-tight truncate">
                <strong className="font-semibold">{l.key}</strong> {l.name}
              </div>
            </a>
          ))}
        </div>
      )}

      <div className={`grid gap-5 ${design.layouts.length > 1 ? "xl:grid-cols-2" : ""}`}>
        {design.layouts.map((l) => (
          <LayoutCard key={l.id} design={design} layout={l} chosen={l.id === chosenId}
            onChoose={() => choose(l.id === chosenId ? undefined : l)} />
        ))}
      </div>

      <p className="text-[12.5px] text-ink-3 mt-5 leading-relaxed max-w-3xl">
        Drawn to scale on the room as the villa model has it, road-down with north to the right. Walls, windows and doors
        come from the plan; anything dashed in clay is assumed and needs checking on site. Costs are indicative differences
        against layout A, not quotes.
      </p>
    </div>
  );
}

function costLine(l: Layout): string {
  if (l.key === "A" || !l.costDelta) return l.key === "A" ? "The baseline for this room's costs" : "About the same as A";
  const amt = Math.abs(l.costDelta) >= 100000 ? inr(Math.abs(l.costDelta), { compact: true }) : `₹${Math.abs(l.costDelta).toLocaleString("en-IN")}`;
  return `About ${amt} ${l.costDelta > 0 ? "more" : "less"} than A`;
}

function LayoutCard({ design, layout: l, chosen, onChoose }: { design: RoomDesign; layout: Layout; chosen: boolean; onChoose: () => void }) {
  const [showPieces, setShowPieces] = useState(false);
  return (
    <section id={`layout-${l.key}`} className="card px-4 sm:px-5 py-4 scroll-mt-24"
      style={chosen ? { borderColor: "var(--color-accent)", boxShadow: "0 0 0 1px var(--color-accent)" } : undefined}>
      <header className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[13px] font-semibold"
              style={{ background: chosen ? "var(--color-accent)" : "var(--color-paper-2)", color: chosen ? "#fff" : "var(--color-ink-2)" }}>{l.key}</span>
            <h3 className="text-[16px] leading-snug">{l.name}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {l.recommended && <Chip tone="good">Recommended</Chip>}
            {chosen && <Chip tone="accent">Chosen</Chip>}
            <Chip tone="ghost">{costLine(l)}</Chip>
          </div>
        </div>
        <button onClick={onChoose} className="btn btn-sm" aria-pressed={chosen}>
          {chosen ? <><Icon name="close" size={14} /> Undo choice</> : <><Icon name="check" size={15} strokeWidth={2} /> Choose this layout</>}
        </button>
      </header>

      <div className="rounded-lg overflow-hidden border border-line" style={{ background: "#fffdfa" }}>
        <RoomLayout design={design} layout={l} maxHeight={560} />
      </div>

      <p className="text-[14px] text-ink-2 mt-3 leading-relaxed">{l.idea}</p>

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <Eyebrow>Good at</Eyebrow>
          <ul className="mt-1.5 space-y-1">
            {l.pros.map((p) => <li key={p} className="text-[13px] text-ink-2 leading-snug flex gap-1.5"><span className="text-good shrink-0">+</span><span>{p}</span></li>)}
          </ul>
        </div>
        <div>
          <Eyebrow>Costs you</Eyebrow>
          <ul className="mt-1.5 space-y-1">
            {l.cons.map((c) => <li key={c} className="text-[13px] text-ink-2 leading-snug flex gap-1.5"><span className="text-accent shrink-0">−</span><span>{c}</span></li>)}
          </ul>
        </div>
      </div>

      {l.assumptions?.length ? (
        <div className="card-quiet px-3 py-2 mt-3">
          <div className="text-[12.5px] text-accent font-medium">Assumes</div>
          <ul className="mt-0.5 space-y-0.5">
            {l.assumptions.map((a) => <li key={a} className="text-[12.5px] text-ink-3 leading-snug">{a}</li>)}
          </ul>
        </div>
      ) : null}

      <button className="text-[12.5px] text-accent hover:underline mt-3" onClick={() => setShowPieces((v) => !v)}>
        {showPieces ? "Hide" : "What's in it"} ({pieceList(l).length})
      </button>
      {showPieces && (
        <ul className="mt-1.5 grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {pieceList(l).map((p) => <li key={p} className="text-[12.5px] text-ink-3 leading-snug">· {p}</li>)}
        </ul>
      )}

      <LayoutNotes layout={l} spaceId={design.spaceId} />
    </section>
  );
}

/** Notes under one layout: anyone on the project, attributed and dated, kept in the history. */
function LayoutNotes({ layout, spaceId }: { layout: Layout; spaceId: string }) {
  const { state, dispatch, me } = useProject();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const notes = useMemo(
    () => state.notes.filter((n) => n.layoutIds?.includes(layout.id)).sort((a, b) => b.at.localeCompare(a.at)),
    [state.notes, layout.id],
  );

  function add() {
    const body = draft.trim();
    if (!body) return;
    const firstLine = body.split("\n")[0];
    const row: Note = {
      id: newId("note"),
      title: firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine,
      body,
      kind: "idea",
      at: new Date().toISOString(),
      author: me,
      spaceIds: [spaceId],
      scopeItemIds: [], vendorIds: [], decisionIds: [], taskIds: [],
      layoutIds: [layout.id],
    };
    dispatch({ type: "create", on: "notes", row });
    setDraft("");
    toast(`Note added to layout ${layout.key}`);
  }

  return (
    <div className="mt-4 pt-3 border-t border-line">
      <Eyebrow>Notes on {layout.key}{notes.length ? ` · ${notes.length}` : ""}</Eyebrow>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-2.5">
          {notes.map((n) => (
            <li key={n.id} className="group">
              <p className="text-[13.5px] text-ink-2 leading-relaxed whitespace-pre-wrap">{n.body}</p>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-[12.5px] text-ink-3">{n.author || "Someone"} · {relative(n.at)}</span>
                <RowActions on="notes" id={n.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
        <textarea aria-label={`A note on layout ${layout.key}`}
          className="input text-[13.5px] flex-1 min-h-[42px]"
          rows={2}
          placeholder={`A note on layout ${layout.key} — as ${me}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }}
        />
        <button className="btn btn-sm self-end sm:self-stretch" onClick={add} disabled={!draft.trim()}>Add note</button>
      </div>
    </div>
  );
}
