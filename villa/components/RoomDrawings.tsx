"use client";

import React, { useState } from "react";
import { drawingsForSpace, type RoomDrawing } from "@/lib/plans/room-drawings";
import { Eyebrow, Chip, Sheet, fmtDay } from "./ui";

/**
 * Drawings issued for one room.
 *
 * Shown as the sheet itself, not a filename. The caveats printed on the
 * drawing travel with it everywhere it appears, because a provisional layout
 * that loses its "verify on site" note is the one that gets built.
 */
export function RoomDrawings({ spaceId, compact }: { spaceId: string; compact?: boolean }) {
  const drawings = drawingsForSpace(spaceId);
  const [open, setOpen] = useState<string | null>(null);
  if (!drawings.length) return null;
  const shown = drawings.find((d) => d.id === open);

  return (
    <div>
      {!compact && <Eyebrow className="mb-2.5">Drawings for this room</Eyebrow>}
      <div className={`grid gap-3 ${drawings.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {drawings.map((d) => (
          <button key={d.id} onClick={() => setOpen(d.id)}
            className="card overflow-hidden text-left hover:border-ink-4 transition-colors group">
            <div className="bg-paper-2 overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.src} alt={d.label} loading="lazy"
                className="w-full h-full object-contain object-top transition-transform duration-500 group-hover:scale-[1.02]" />
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px]" style={{ fontFamily: "var(--font-display)" }}>{d.label}</span>
                {d.revision && <Chip tone="ochre">{d.revision}</Chip>}
              </div>
              <p className="text-[11.5px] text-ink-3 mt-1 leading-snug">{d.note}</p>
              <div className="text-[11px] text-ink-4 mt-1.5">{d.by} · {fmtDay(d.at)} · {d.verify.length} items to verify on site</div>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!shown} onClose={() => setOpen(null)} title={shown?.label} wide>
        {shown && <DrawingDetail d={shown} />}
      </Sheet>
    </div>
  );
}

function DrawingDetail({ d }: { d: RoomDrawing }) {
  return (
    <div>
      <a href={d.src} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.src} alt={d.label} className="w-full h-auto rounded-lg border border-ink-6" />
      </a>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {d.revision && <Chip tone="ochre">{d.revision}</Chip>}
        <span className="text-[11.5px] text-ink-3">{d.by} · {fmtDay(d.at)}</span>
        <a href={d.src} target="_blank" rel="noreferrer" className="text-[11.5px] text-clay hover:underline ml-auto">
          Open full size →
        </a>
      </div>

      <p className="text-[12.5px] text-ink-2 mt-3 leading-relaxed">{d.note}</p>

      <div className="grid lg:grid-cols-2 gap-3 mt-4">
        <div className="card-quiet px-3.5 py-3">
          <Eyebrow>What the sheet settles</Eyebrow>
          <dl className="mt-2 space-y-1.5">
            {d.facts.map((f) => (
              <div key={f.k} className="text-[11.5px] leading-snug">
                <dt className="text-ink-3 inline">{f.k}: </dt>
                <dd className="inline text-ink-2">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <div className="card-quiet px-3.5 py-3" style={{ borderColor: "#e4c8bf" }}>
            <Eyebrow>Verify on site before ordering</Eyebrow>
            <ul className="mt-2 space-y-1.5">
              {d.verify.map((v) => (
                <li key={v} className="text-[11.5px] text-ink-2 leading-snug flex gap-1.5">
                  <span className="text-clay shrink-0">□</span><span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-quiet px-3.5 py-3 mt-3">
            <Eyebrow>Read this drawing knowing</Eyebrow>
            <ul className="mt-2 space-y-1.5">
              {d.caveats.map((c) => (
                <li key={c} className="text-[11.5px] text-ink-3 leading-relaxed">· {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
