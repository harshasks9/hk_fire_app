"use client";

import type { Space } from "@/lib/model/types";
import {
  measureSpace, dimsLabel, NOT_DIMENSIONED, NOT_DIMENSIONED_NOTE,
  SOURCE_LABEL, SOURCE_NOTE, SOURCE_TONE,
} from "@/lib/model/measure";
import { Chip, Eyebrow } from "./ui";

/**
 * Measurement display.
 *
 * One component, three densities. Every screen that shows how big something is
 * uses one of these, so a room reads identically on the plan, the room card,
 * the room header, the sheet and the BOQ — and always says where the number
 * came from.
 */

type Sp = Pick<Space, "dims" | "ceilingHeightFt">;

/** Where the number came from. Shown next to every dimension in the app. */
export function SourceChip({ sp, small }: { sp?: Sp; small?: boolean }) {
  const src = sp?.dims?.source;
  if (!src) return null;
  return (
    <Chip tone={SOURCE_TONE[src]} title={SOURCE_NOTE[src]}>
      {small ? SOURCE_LABEL[src].replace("Architect's plan", "Plan").replace("Measured on site", "Site") : SOURCE_LABEL[src]}
    </Chip>
  );
}

/**
 * The one-line form: `12'6" × 12'10" · 160.4 sq ft · 3810 × 3912 mm`.
 * Used under a room name anywhere there is a line of text to spare.
 */
export function Dims({
  sp, mm = true, perimeter = false, source = true, className = "",
}: { sp?: Sp; mm?: boolean; perimeter?: boolean; source?: boolean; className?: string }) {
  const m = measureSpace(sp);
  if (!m) return <span className={`text-ink-3 ${className}`}>{NOT_DIMENSIONED}</span>;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className="tabular-nums">{dimsLabel(m.dims)}</span>
      <span className="text-ink-3">·</span>
      <span className="tabular-nums">{m.areaSqft} sq ft</span>
      {mm && (
        <>
          <span className="text-ink-3">·</span>
          <span className="tabular-nums text-ink-3">{m.widthMm} × {m.lengthMm} mm</span>
        </>
      )}
      {perimeter && (
        <>
          <span className="text-ink-3">·</span>
          <span className="tabular-nums text-ink-3">{m.perimeterFt} rft perimeter</span>
        </>
      )}
      {source && <SourceChip sp={sp} small />}
    </span>
  );
}

/** The compact form for a card or a chip: size and area, nothing else. */
export function DimsShort({ sp, className = "" }: { sp?: Sp; className?: string }) {
  const m = measureSpace(sp);
  if (!m) return <span className={`text-ink-3 ${className}`}>{NOT_DIMENSIONED}</span>;
  return (
    <span className={`tabular-nums ${className}`}>
      {dimsLabel(m.dims)} · {m.areaSqft} sq ft
    </span>
  );
}

const ROWS: { k: string; get: (m: NonNullable<ReturnType<typeof measureSpace>>) => string; note?: string }[] = [
  { k: "Width", get: (m) => `${m.dims.widthFt}'${m.dims.widthIn}"  ·  ${m.widthMm} mm` },
  { k: "Length", get: (m) => `${m.dims.lengthFt}'${m.dims.lengthIn}"  ·  ${m.lengthMm} mm` },
  { k: "Floor area", get: (m) => `${m.areaSqft} sq ft  ·  ${m.areaSqm} m²`, note: "Flooring, false ceiling and tile are priced off this." },
  { k: "Perimeter", get: (m) => `${m.perimeterFt} rft  ·  ${m.perimeterMm} mm`, note: "Skirting, cornice and curtain track run this length." },
  { k: "Ceiling", get: (m) => `${m.ceilingFt}'0"  ·  ${Math.round(m.ceilingFt * 304.8)} mm` },
  { k: "Wall area", get: (m) => `${m.wallSqft} sq ft`, note: "Perimeter × ceiling, less 12% for doors and windows. Paint and panelling price off this." },
  { k: "Volume", get: (m) => `${m.volumeCuft} cu ft`, note: "AC tonnage and air changes are sized off this." },
];

/**
 * The full table. Shown on the room workspace and in the item sheet, so the
 * number a quantity was derived from is always one click from the quantity.
 */
export function MeasureTable({ sp, title = "Measurements" }: { sp?: Sp; title?: string }) {
  const m = measureSpace(sp);
  if (!m) {
    return (
      <div className="card-quiet px-3.5 py-3">
        <Eyebrow>{title}</Eyebrow>
        <p className="text-[11.5px] text-ink-3 mt-2 leading-relaxed">{NOT_DIMENSIONED_NOTE}</p>
      </div>
    );
  }
  return (
    <div className="card-quiet px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Eyebrow>{title}</Eyebrow>
        <SourceChip sp={sp} />
      </div>
      <dl className="space-y-1">
        {ROWS.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between gap-3 text-[12px]" title={r.note}>
            <dt className="text-ink-3 shrink-0">{r.k}</dt>
            <dd className="tabular-nums text-right">{r.get(m)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-ink-3 mt-2.5 leading-relaxed">
        {SOURCE_NOTE[m.source]}
        {m.ceilingAssumed && " Ceiling height is the app's 10'0\" assumption until it is confirmed on site."}
      </p>
    </div>
  );
}
