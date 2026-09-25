import type { RoomSpec, SpecLine } from "./types";
import { THEATRE_SPEC } from "./theatre";

export * from "./types";

/** Rooms that carry a written material specification, by space id. */
export const SPECS: Record<string, RoomSpec> = {
  [THEATRE_SPEC.spaceId]: THEATRE_SPEC,
};

export function specFor(spaceId: string): RoomSpec | undefined {
  return SPECS[spaceId];
}

export function specLines(spec: RoomSpec): SpecLine[] {
  return spec.sections.flatMap((s) => s.lines);
}

/** Progress through a spec, given the room's ticks. Not-applicable lines drop out of the total. */
export function specProgress(spec: RoomSpec, checks: Record<string, "done" | "na"> = {}) {
  const lines = specLines(spec);
  const live = lines.filter((l) => checks[l.id] !== "na");
  const done = live.filter((l) => checks[l.id] === "done").length;
  const criticalOpen = live.filter((l) => l.critical && checks[l.id] !== "done").length;
  return { total: live.length, done, criticalOpen, pct: live.length ? (done / live.length) * 100 : 0 };
}
