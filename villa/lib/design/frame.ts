import { PLANS } from "../plans/geometry";
import type { PlanRoom } from "../plans/geometry";
import type { Edge, FrameOpening, Layout, OpeningKind, RoomDesign, RoomFrame } from "./types";

/** Plan units are tenths of a foot. */
const MM = 30.48;
/** How far off a room's edge an opening may sit and still belong to it, in plan units. */
const TOL = 8;

function roomsOf(spaceId: string): { floor: keyof typeof PLANS; rects: PlanRoom[] } | undefined {
  for (const [floor, plan] of Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]) {
    const r = plan.rooms.find((x) => x.spaceId === spaceId);
    if (r) return { floor, rects: [r] };
  }
  return undefined;
}

/**
 * The room as the layouts see it, read from the plan geometry: its size in mm,
 * its finish, and every window, slider, door and arch on its walls. A merged
 * room (the one-room kitchen) is the bounding box of its parts.
 */
export function frameOf(design: Pick<RoomDesign, "spaceId" | "merge" | "assumedOpenings" | "ignoreOpenings">): RoomFrame {
  const found = roomsOf(design.spaceId);
  if (!found) throw new Error(`No plan geometry for ${design.spaceId}`);
  const plan = PLANS[found.floor];
  const rects = [found.rects[0], ...(design.merge ?? []).map((id) => plan.rooms.find((r) => r.spaceId === id)!).filter(Boolean)];
  const x0 = Math.min(...rects.map((r) => r.x)), y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w)), y1 = Math.max(...rects.map((r) => r.y + r.h));
  const W = Math.round((x1 - x0) * MM), H = Math.round((y1 - y0) * MM);

  const openings: FrameOpening[] = [];
  for (const o of plan.openings) {
    const span = o.dir === "h" ? [o.x, o.x + o.len] : [o.y, o.y + o.len];
    const lim = o.dir === "h" ? [x0, x1] : [y0, y1];
    const lo = Math.max(span[0], lim[0]), hi = Math.min(span[1], lim[1]);
    if (hi - lo < 2) continue;
    let edge: Edge | undefined;
    if (o.dir === "h") edge = Math.abs(o.y - y0) <= TOL ? "top" : Math.abs(o.y - y1) <= TOL ? "bottom" : undefined;
    else edge = Math.abs(o.x - x0) <= TOL ? "left" : Math.abs(o.x - x1) <= TOL ? "right" : undefined;
    if (!edge) continue;
    const base = o.dir === "h" ? x0 : y0;
    const from = Math.round((lo - base) * MM), to = Math.round((hi - base) * MM);
    const kind = o.k as OpeningKind;
    const swingIn = kind === "door" || kind === "dbldoor"
      ? ((edge === "left" || edge === "top") ? o.swing === 1 : o.swing === -1)
      : undefined;
    if (design.ignoreOpenings?.some((g) => g.edge === edge && g.at >= from && g.at <= to)) continue;
    openings.push({ kind, edge, from, to, swingIn, hingeAtFrom: (o.hinge ?? 0) === 0 });
  }
  for (const a of design.assumedOpenings ?? []) {
    openings.push({ kind: a.kind, edge: a.edge, from: a.from, to: a.to, swingIn: a.swingIn, hingeAtFrom: true, assumed: !a.known });
  }
  return {
    spaceId: design.spaceId,
    floor: found.floor,
    W, H,
    finish: found.rects[0].finish,
    outdoor: !!found.rects[0].outdoor,
    openings,
  };
}

/** The frame as a particular layout would build it: its door changes applied. */
export function frameFor(design: Pick<RoomDesign, "spaceId" | "merge" | "assumedOpenings" | "ignoreOpenings">, layout?: Pick<Layout, "doors">): RoomFrame {
  const f = frameOf(design);
  if (!layout?.doors?.length) return f;
  return {
    ...f,
    openings: f.openings.map((o) => {
      const c = layout.doors!.find((d) => d.edge === o.edge && d.at >= o.from && d.at <= o.to && (o.kind === "door" || o.kind === "dbldoor"));
      if (!c) return o;
      if (c.becomes === "pocket") return { ...o, pocket: true, swingIn: false, changed: true };
      return { ...o, swingIn: c.becomes === "swing-in", changed: true };
    }),
  };
}
