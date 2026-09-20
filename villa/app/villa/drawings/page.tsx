"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DRAWINGS } from "@/lib/plans/geometry";
import { PageTitle, Eyebrow, Sheet } from "@/components/ui";
import { ROOM_DRAWINGS } from "@/lib/plans/room-drawings";
import { RoomDrawings } from "@/components/RoomDrawings";

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
        sub="The issued set the villa was built from, plus the sheets drawn for a single room. The app's room list and dimensions are taken from these — nothing here was invented."
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

      {ROOM_DRAWINGS.length > 0 && (
        <div className="mt-8">
          <div className="flex items-end justify-between gap-3 mb-2.5">
            <Eyebrow>Drawings for a single room</Eyebrow>
            <span className="text-[11.5px] text-ink-3 hidden sm:block">Also shown inside the room they belong to.</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROOM_DRAWINGS.map((d) => (
              <div key={d.id}>
                <RoomDrawings spaceId={d.spaceId} compact />
                <Link href={`/villa/${d.spaceId}`} className="text-[11.5px] text-clay hover:underline mt-1.5 inline-block">
                  Open the room →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card px-5 py-4 mt-5 max-w-3xl">
        <Eyebrow>Source of record</Eyebrow>
        <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">
          <span className="font-mono text-[12px]">HALLMARK_IMPERIA_EAST_FACING SITE-06-03-20.dwg</span> — the
          construction set, revised 06-03-2023. It carries the working floor plans, the four elevations,
          sections A–E, the beam and slab framing, the column centreline and brick-marking plans, and the site plan.
          The app&rsquo;s <Link href="/villa" className="text-clay hover:underline">CAD view</Link> is drawn
          straight from it; where it disagrees with the presentation plans above, the DWG wins.
        </p>
        <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-ink-3">
          <div><strong className="text-ink font-medium">Plot</strong> 17 980 × 19 890 mm (59&prime;0&Prime; × 65&prime;3&Prime;)</div>
          <div><strong className="text-ink font-medium">Block</strong> 13 970 × 13 767 mm (45&prime;10&Prime; × 45&prime;2&Prime;)</div>
          <div><strong className="text-ink font-medium">Setbacks</strong> 1520 S · 2490 N · 2740 W · 3380 E</div>
          <div><strong className="text-ink font-medium">Facing</strong> east — the porch and road are on the east</div>
        </div>
        <p className="text-[11.5px] text-ink-3 mt-3 leading-relaxed">
          Four rooms were re-dimensioned from it: the ground-floor bathroom (1680 not 1780 wide), the car
          porch (5484 not 5130), and both second-floor wet rooms (1900 wide). The plans are drawn with the
          road at the bottom of the sheet, which means north points right — the compass on the plan now says so.
        </p>
      </div>

      <div className="card-quiet px-4 py-3 mt-4 text-[12px] text-ink-3 leading-relaxed max-w-2xl">
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
