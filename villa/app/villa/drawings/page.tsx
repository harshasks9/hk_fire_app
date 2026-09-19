"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DRAWINGS } from "@/lib/plans/geometry";
import { PageTitle, Eyebrow, Sheet } from "@/components/ui";

/**
 * The architect's drawings, as issued.
 *
 * The app's plan is a redrawing — useful because it is clickable, but it is
 * not the document. These are. Everything in the villa was read off them, and
 * when a dimension is argued about on site this is what settles it.
 */
export default function DrawingsPage() {
  const [open, setOpen] = useState<string | null>(null);
  const shown = DRAWINGS.find((d) => d.id === open);

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3">
        <Link href="/villa" className="hover:text-clay">Villa</Link> / Drawings
      </div>
      <PageTitle
        title="Architect's drawings"
        sub="The issued set the villa was built from. The app's room list and dimensions are taken from these — nothing here was invented."
        right={<Link href="/villa" className="btn">Back to the model</Link>}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        {DRAWINGS.map((d) => (
          <button key={d.id} onClick={() => setOpen(d.id)} className="card overflow-hidden text-left hover:border-ink-4 transition-colors group">
            <div className="bg-paper-2 overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.src} alt={d.label} loading="lazy"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
            </div>
            <div className="px-4 py-3">
              <div className="text-[14px]" style={{ fontFamily: "var(--font-display)" }}>{d.label}</div>
              <div className="text-[11.5px] text-ink-3 mt-0.5 leading-snug">{d.note}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="card-quiet px-4 py-3 mt-5 text-[12px] text-ink-3 leading-relaxed max-w-2xl">
        The plot is 59&prime;0&Prime; × 65&prime;3&Prime; and the built plate 45&prime;10&Prime; × 45&prime;2&Prime;, set back
        9&prime;0&Prime; at the rear and 11&prime;1&Prime; to the road. Room dimensions in the app are the ones printed on
        these plans; where a room is not dimensioned here it is not dimensioned there either.
      </div>

      <Sheet open={!!shown} onClose={() => setOpen(null)} title={shown?.label} wide>
        {shown && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.src} alt={shown.label} className="w-full h-auto rounded-lg" />
            <p className="text-[12px] text-ink-3 mt-3">{shown.note}</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
