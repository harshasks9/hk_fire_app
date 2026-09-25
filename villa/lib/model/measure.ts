import type { Dimensions, Space } from "./types";

/**
 * Measurements — the single source of truth for every number with a unit.
 *
 * Before this file the app computed area in one place, the feet-and-inches
 * label in another, and printed whichever of the two a given screen happened to
 * import. A room therefore read `12'6" × 12'10"` on the plan, `160 sq ft` on the
 * card and nothing at all in the sheet.
 *
 * Every measurement anywhere in the app now comes from `measure()`, is rendered
 * by one of the labels below, and carries its provenance. Three rules:
 *
 *  1. Feet-and-inches is what the family speaks and the architect drew, so it
 *     leads. Millimetres follow, because that is what the construction set,
 *     every joinery shop and every stone yard works in.
 *  2. A derived number is never stored. Area, perimeter, wall area and volume
 *     are computed here, every time, from the one pair of dimensions.
 *  3. A room the drawings do not dimension has no dimension. We never estimate
 *     one, and every screen says so in the same words.
 */

export const MM_PER_FT = 304.8;
export const MM_PER_IN = 25.4;
export const SQM_PER_SQFT = 0.09290304;

/** Nominal opening allowance deducted from gross wall area. */
export const OPENING_ALLOWANCE_PCT = 12;
/** Used where a room has no confirmed ceiling height yet. */
export const DEFAULT_CEILING_FT = 10;

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------- conversions */

export function dimsToFeet(d: Dimensions): { w: number; l: number } {
  return { w: d.widthFt + d.widthIn / 12, l: d.lengthFt + d.lengthIn / 12 };
}

export function ftToMm(ft: number): number {
  return Math.round(ft * MM_PER_FT);
}

/** 12.5 → { ft: 12, inch: 6 }. Rounds to the nearest inch, carrying at 12. */
export function feetToFtIn(ft: number): { ft: number; inch: number } {
  let whole = Math.floor(ft);
  let inch = Math.round((ft - whole) * 12);
  if (inch === 12) { whole += 1; inch = 0; }
  return { ft: whole, inch };
}

/* ----------------------------------------------------------------- the type */

export type MeasureSource = Dimensions["source"];

export interface Measure {
  widthFt: number;
  lengthFt: number;
  widthMm: number;
  lengthMm: number;
  areaSqft: number;
  areaSqm: number;
  perimeterFt: number;
  perimeterMm: number;
  ceilingFt: number;
  /** True when the ceiling height is the app's assumption, not a confirmed one. */
  ceilingAssumed: boolean;
  /** Perimeter × ceiling height, less the opening allowance. */
  wallSqft: number;
  volumeCuft: number;
  source: MeasureSource;
  dims: Dimensions;
}

/** Everything derivable from one pair of dimensions. The only way in. */
export function measure(d?: Dimensions, ceilingHeightFt?: number): Measure | undefined {
  if (!d) return undefined;
  const { w, l } = dimsToFeet(d);
  const ceilingAssumed = ceilingHeightFt === undefined || ceilingHeightFt <= 0;
  const ceilingFt = ceilingAssumed ? DEFAULT_CEILING_FT : ceilingHeightFt!;
  const perimeterFt = 2 * (w + l);
  return {
    widthFt: w,
    lengthFt: l,
    widthMm: ftToMm(w),
    lengthMm: ftToMm(l),
    areaSqft: round(w * l, 1),
    areaSqm: round(w * l * SQM_PER_SQFT, 1),
    perimeterFt: round(perimeterFt, 1),
    perimeterMm: ftToMm(perimeterFt),
    ceilingFt,
    ceilingAssumed,
    wallSqft: round(perimeterFt * ceilingFt * (1 - OPENING_ALLOWANCE_PCT / 100), 1),
    volumeCuft: round(w * l * ceilingFt, 0),
    source: d.source,
  dims: d,
  };
}

/** `measure()` for a space, honouring its own ceiling height. */
export function measureSpace(sp?: Pick<Space, "dims" | "ceilingHeightFt">): Measure | undefined {
  if (!sp) return undefined;
  return measure(sp.dims, sp.ceilingHeightFt);
}

/* -------------------------------------------------------------------- labels */

/** 12, 6 → `12'6"`. Zero inches are still written, so columns line up. */
export function ftIn(ft: number, inch: number): string {
  return `${ft}'${inch}"`;
}

export function feetLabel(ft: number): string {
  const p = feetToFtIn(ft);
  return ftIn(p.ft, p.inch);
}

/** `12'6" × 12'10"` — the label the family and the architect both use. */
export function dimsLabel(d?: Dimensions): string | undefined {
  if (!d) return undefined;
  return `${ftIn(d.widthFt, d.widthIn)} × ${ftIn(d.lengthFt, d.lengthIn)}`;
}

/** `3810 × 3912 mm` — what the construction set and every workshop uses. */
export function mmLabel(d?: Dimensions): string | undefined {
  const m = measure(d);
  if (!m) return undefined;
  return `${m.widthMm} × ${m.lengthMm} mm`;
}

/** `160 sq ft` with the metric equivalent, because tile is sold in both. */
export function areaLabel(d?: Dimensions, metric = true): string | undefined {
  const m = measure(d);
  if (!m) return undefined;
  return metric ? `${m.areaSqft} sq ft (${m.areaSqm} m²)` : `${m.areaSqft} sq ft`;
}

export function perimeterLabel(d?: Dimensions): string | undefined {
  const m = measure(d);
  if (!m) return undefined;
  return `${m.perimeterFt} rft perimeter`;
}

/**
 * The canonical one-line measurement, used wherever a room is named and there
 * is room for a line of text under it. Identical on every screen, by design.
 */
export function measureLine(
  sp?: Pick<Space, "dims" | "ceilingHeightFt">,
  opts: { mm?: boolean; perimeter?: boolean } = {},
): string {
  const m = measureSpace(sp);
  if (!m) return NOT_DIMENSIONED;
  const parts = [dimsLabel(m.dims)!, `${m.areaSqft} sq ft`];
  if (opts.mm !== false) parts.push(`${m.widthMm} × ${m.lengthMm} mm`);
  if (opts.perimeter) parts.push(`${m.perimeterFt} rft perimeter`);
  return parts.join(" · ");
}

/** The short form for a plan label or a chip, where two facts is the limit. */
export function measureShort(sp?: Pick<Space, "dims" | "ceilingHeightFt">): string {
  const m = measureSpace(sp);
  if (!m) return "not dimensioned";
  return `${dimsLabel(m.dims)} · ${m.areaSqft} sq ft`;
}

/** The same sentence everywhere a room has no dimension. Never an estimate. */
export const NOT_DIMENSIONED = "Not dimensioned on the architect's plan";

export const NOT_DIMENSIONED_NOTE =
  "The drawings do not dimension this space, so the app carries no size for it. " +
  "Quantities start at 1 and must be measured on site — nothing is invented from a drawing that does not carry the number.";

/* ---------------------------------------------------------------- provenance */

export const SOURCE_LABEL: Record<MeasureSource, string> = {
  "architect-plan": "Architect's plan",
  "site-measured": "Measured on site",
  estimated: "Estimated",
  unknown: "Unverified",
};

export const SOURCE_NOTE: Record<MeasureSource, string> = {
  "architect-plan":
    "Read off the issued drawing. Good enough to design and budget with; re-measure on site before any joinery or stone is cut.",
  "site-measured":
    "Taken on site with a laser. This is the number to cut to.",
  estimated:
    "An estimate, not a measurement. Anything priced off it carries that risk.",
  unknown:
    "Provenance unrecorded. Confirm where this number came from before ordering against it.",
};

export const SOURCE_TONE: Record<MeasureSource, "good" | "info" | "warn" | "accent"> = {
  "site-measured": "good",
  "architect-plan": "info",
  estimated: "warn",
  unknown: "accent",
};

/** True once a dimension is safe to cut joinery or stone against. */
export function isCuttable(d?: Dimensions): boolean {
  return d?.source === "site-measured";
}

/* ------------------------------------------- compatibility with older calls */

export function areaSqft(d?: Dimensions): number | undefined {
  return measure(d)?.areaSqft;
}

export function perimeterFt(d?: Dimensions): number | undefined {
  return measure(d)?.perimeterFt;
}

export function wallAreaSqft(
  d?: Dimensions,
  ceilingHeightFt = DEFAULT_CEILING_FT,
  openingAllowancePct = OPENING_ALLOWANCE_PCT,
): number | undefined {
  const m = measure(d, ceilingHeightFt);
  if (!m) return undefined;
  if (openingAllowancePct === OPENING_ALLOWANCE_PCT) return m.wallSqft;
  return round(2 * (m.widthFt + m.lengthFt) * ceilingHeightFt * (1 - openingAllowancePct / 100), 1);
}
