"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DRAWINGS } from "@/lib/plans/geometry";
import { PageTitle, Sheet, Section } from "@/components/ui";
import { Icon } from "@/components/Icon";
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
      <PageTitle
        title="Architect's drawings"
        sub="The issued set the villa was built from, plus the sheets drawn for a single room. Every room and dimension in the app is taken from these."
      />

      <Section title="The issued set">
        <div className="grid sm:grid-cols-2 gap-4">
          {DRAWINGS.map((d) => (
            <button
              key={d.id}
              onClick={() => setOpen(d.id)}
              className="card card-link overflow-hidden text-left group"
              aria-label={`Open ${d.label} full size`}
            >
              <div className="bg-paper-2 overflow-hidden border-b border-line" style={{ aspectRatio: "1 / 1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.src} alt="" loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="px-4 py-3.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[15.5px] font-semibold leading-snug">{d.label}</div>
                  <div className="text-[13.5px] text-ink-3 mt-0.5 leading-snug">{d.note}</div>
                </div>
                <Icon name="open" size={17} className="text-ink-4 group-hover:text-ink transition-colors mt-0.5 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </Section>

      {ROOM_DRAWINGS.length > 0 && (
        <Section
          title="Drawings for a single room"
          action={<span className="text-[13px] text-ink-3 hidden sm:block">Also shown inside the room they belong to.</span>}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {ROOM_DRAWINGS.map((d) => (
              <div key={d.id}>
                <RoomDrawings spaceId={d.spaceId} compact />
                <Link href={`/villa/${d.spaceId}`} className="link text-[13.5px] mt-2 inline-flex items-center gap-1">
                  Open the room <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Source of record">
        <div className="card px-5 py-5 max-w-3xl">
          <p className="text-[14.5px] text-ink-2 leading-relaxed">
            <span className="font-mono text-[13px] text-ink break-all">HALLMARK_IMPERIA_EAST_FACING SITE-06-03-20.dwg</span> — the
            construction set, revised 06-03-2023. It carries the working floor plans, the four elevations,
            sections A–E, the beam and slab framing, the column centreline and brick-marking plans, and the site plan.
            The app&rsquo;s <Link href="/villa" className="link">CAD view</Link> is drawn
            straight from it; where it disagrees with the presentation plans above, the DWG wins.
          </p>
          <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3 hairline pt-4">
            {[
              ["Plot", <>17 980 × 19 890 mm (59&prime;0&Prime; × 65&prime;3&Prime;)</>],
              ["Block", <>13 970 × 13 767 mm (45&prime;10&Prime; × 45&prime;2&Prime;)</>],
              ["Setbacks", "1520 S · 2490 N · 2740 W · 3380 E"],
              ["Facing", "East — the porch and road are on the east"],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="eyebrow">{k}</dt>
                <dd className="text-[14px] text-ink mt-0.5 tnum">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[13.5px] text-ink-3 mt-4 leading-relaxed">
            Four rooms were re-dimensioned from it: the ground-floor bathroom (1680 not 1780 wide), the car
            porch (5484 not 5130), and both second-floor wet rooms (1900 wide). The plans are drawn with the
            road at the bottom of the sheet, which means north points right — the compass on the plan says so.
          </p>
        </div>
        <p className="text-[13.5px] text-ink-3 leading-relaxed max-w-3xl mt-4">
          The plot is 59&prime;0&Prime; × 65&prime;3&Prime; and the built plate 45&prime;10&Prime; × 45&prime;2&Prime;, set back
          9&prime;0&Prime; at the rear and 11&prime;1&Prime; to the road. Room dimensions in the app are the ones printed on
          these plans; where a room is not dimensioned here, it is not dimensioned in the app either.
        </p>
      </Section>

      <Sheet
        open={!!shown} onClose={() => setOpen(null)} title={shown?.label} description={shown?.note} wide
        footer={shown && (
          <div className="flex justify-end gap-2">
            <a href={shown.src} target="_blank" rel="noreferrer" className="btn">
              <Icon name="open" size={16} /> Open full size
            </a>
            <button className="btn btn-primary" onClick={() => setOpen(null)}>Done</button>
          </div>
        )}
      >
        {shown && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown.src} alt={`${shown.label} — ${shown.note}`} className="w-full h-auto rounded-lg border border-line" />
        )}
      </Sheet>
    </div>
  );
}
