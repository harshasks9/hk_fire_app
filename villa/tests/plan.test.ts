import { describe, it, expect } from "vitest";
import { STACK, PLATE, PLOT, DRAWN, WALL, type PlanRoom } from "@/lib/plans/geometry";
import { SPACES } from "@/lib/seed/spaces";
import { buildTwin } from "@/lib/seed";
import { areaSqft } from "@/lib/model/costing";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The drawing has to stay honest.
 *
 * These are the mistakes that make a plan look broken rather than simplified:
 * two rooms occupying the same square feet, a room outside the walls, a shape
 * whose area is nothing like the dimension printed on it, or a rectangle for a
 * room that no longer exists. None of them are visible in a diff.
 */

const inset = (r: PlanRoom, by: number) => ({ x: r.x + by, y: r.y + by, w: r.w - by * 2, h: r.h - by * 2 });
const overlaps = (a: ReturnType<typeof inset>, b: ReturnType<typeof inset>) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const spaceById = new Map(SPACES.map((s) => [s.id, s]));

describe("the plans", () => {
  it("draws only rooms that exist, and every drawn id is unique", () => {
    for (const f of STACK) {
      const ids = f.rooms.map((r) => r.spaceId);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(spaceById.has(id), `${id} is drawn but not in the space list`).toBe(true);
    }
  });

  it("puts every enclosed room inside the walls", () => {
    for (const f of STACK) {
      for (const r of f.rooms) {
        if (r.outdoor) continue;
        expect(r.x, `${r.spaceId} starts west of the plate`).toBeGreaterThanOrEqual(PLATE.x - 1);
        expect(r.y, `${r.spaceId} starts north of the plate`).toBeGreaterThanOrEqual(PLATE.y - 1);
        expect(r.x + r.w, `${r.spaceId} runs past the east wall`).toBeLessThanOrEqual(PLATE.x + PLATE.w + 1);
        expect(r.y + r.h, `${r.spaceId} runs past the south wall`).toBeLessThanOrEqual(PLATE.y + PLATE.h + 1);
      }
    }
  });

  it("keeps everything on the plot", () => {
    for (const r of STACK[0].rooms) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(PLOT.w);
      // the parking apron and driveway run to the road edge
      expect(r.y + r.h).toBeLessThanOrEqual(PLOT.h + 1);
    }
  });

  it("never puts two rooms in the same square feet", () => {
    for (const f of STACK) {
      const rooms = f.rooms.filter((r) => !r.nested);
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          const a = inset(rooms[i], WALL / 2), b = inset(rooms[j], WALL / 2);
          expect(overlaps(a, b), `${rooms[i].spaceId} overlaps ${rooms[j].spaceId} on the ${f.floor} floor`).toBe(false);
        }
      }
    }
  });

  it("draws each room at roughly the area its dimensions claim", () => {
    for (const f of STACK) {
      for (const r of f.rooms) {
        const sp = spaceById.get(r.spaceId)!;
        const stated = areaSqft(sp.dims);
        if (!stated) continue;
        const drawn = (r.w / 10) * (r.h / 10);
        const ratio = drawn / stated;
        expect(ratio, `${r.spaceId} is drawn at ${Math.round(drawn)} sq ft but is dimensioned ${stated} sq ft`)
          .toBeGreaterThan(0.72);
        expect(ratio, `${r.spaceId} is drawn at ${Math.round(drawn)} sq ft but is dimensioned ${stated} sq ft`)
          .toBeLessThan(1.4);
      }
    }
  });

  it("stacks: all three floors share one plate and one origin", () => {
    for (const f of STACK) expect(f.plate).toEqual(PLATE);
    expect(STACK.map((f) => f.level)).toEqual([0, 1, 2]);
  });

  it("keeps openings on a wall line rather than floating in a room", () => {
    for (const f of STACK) {
      for (const o of f.openings) {
        expect(o.len).toBeGreaterThan(10);
        const onPlate =
          o.x >= PLATE.x - 2 && o.x <= PLATE.x + PLATE.w + 2 && o.y >= PLATE.y - 2 && o.y <= PLATE.y + PLATE.h + 2;
        expect(onPlate, `an opening on the ${f.floor} floor is off the plate`).toBe(true);
      }
    }
  });

  it("draws every room of the villa that a homeowner would look for", () => {
    const mustBeDrawn = SPACES.filter(
      (s) => s.floor !== "outdoor" && !["gf-circulation", "ff-circulation", "sf-circulation"].includes(s.id),
    );
    for (const s of mustBeDrawn) expect(DRAWN.has(s.id), `${s.name} is not on any plan`).toBe(true);
  });

  it("is pre-populated: a brand new project already has the whole house", () => {
    const twin = buildTwin();
    for (const id of DRAWN) {
      expect(twin.spaces.some((s) => s.id === id), `${id} is drawn but missing from a new project`).toBe(true);
    }
    // the whole schedule, dimensions included, before anyone has typed anything
    expect(twin.spaces.length).toBe(SPACES.length);
    expect(twin.spaces.filter((s) => s.dims).length).toBe(SPACES.filter((s) => s.dims).length);
  });
});

/**
 * The CAD extract.
 *
 * The linework shipped in public/plans/cad.json is projected from the
 * architect's DWG into the same coordinate system as everything else. If that
 * projection ever drifts, the drawing will silently sit beside the building
 * rather than on it — which looks like a rendering bug and is actually a
 * survey error. These pin the registration.
 */
describe("the architect's CAD", () => {
  const cad = JSON.parse(
    readFileSync(join(process.cwd(), "public/plans/cad.json"), "utf8"),
  ) as Record<string, { strokes: Record<string, number[][]>; texts: { s: string; x: number; y: number }[] }>;

  it("ships a layer of real linework for all three floors", () => {
    for (const f of ["ground", "first", "second"]) {
      expect(cad[f], `${f} is missing from the CAD extract`).toBeDefined();
      const n = Object.values(cad[f].strokes).reduce((a, s) => a + s.length, 0);
      expect(n, `${f} has almost no linework`).toBeGreaterThan(300);
      expect(cad[f].strokes.wall?.length ?? 0, `${f} has no walls`).toBeGreaterThan(40);
    }
  });

  it("registers on the same plate as the redrawing", () => {
    for (const f of ["ground", "first", "second"]) {
      const xs: number[] = [], ys: number[] = [];
      for (const ss of Object.values(cad[f].strokes)) {
        for (const p of ss) for (let i = 0; i < p.length; i += 2) { xs.push(p[i]); ys.push(p[i + 1]); }
      }
      // the CAD must straddle the built plate, not sit somewhere else on the sheet
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const px = PLATE.x + PLATE.w / 2, py = PLATE.y + PLATE.h / 2;
      expect(Math.abs(cx - px), `${f} CAD is off the plate in x`).toBeLessThan(90);
      expect(Math.abs(cy - py), `${f} CAD is off the plate in y`).toBeLessThan(150);
    }
  });

  it("names the rooms the schedule names, in the place the schedule puts them", () => {
    // a room label from the DWG should land inside the rectangle we drew for it
    const checks: [string, string][] = [
      ["ground", "LIVING"], ["ground", "DINING"], ["ground", "KITCHEN"],
      ["first", "MASTER BEDROOM"], ["first", "FAMILY LOUNGE"],
      ["second", "HOME THEATRE"], ["second", "LOBBY"],
    ];
    const idFor: Record<string, string> = {
      LIVING: "gf-living", DINING: "gf-dining", KITCHEN: "gf-kitchen",
      "MASTER BEDROOM": "ff-master", "FAMILY LOUNGE": "ff-family",
      "HOME THEATRE": "sf-theatre", LOBBY: "sf-lobby",
    };
    for (const [floor, label] of checks) {
      const t = cad[floor].texts.find((t) => t.s.toUpperCase().startsWith(label));
      expect(t, `${label} is not labelled on the ${floor} CAD`).toBeDefined();
      const room = STACK.find((s) => s.floor === floor)!.rooms.find((r) => r.spaceId === idFor[label])!;
      expect(room, `${idFor[label]} is not drawn`).toBeDefined();
      const inside =
        t!.x >= room.x - 12 && t!.x <= room.x + room.w + 12 &&
        t!.y >= room.y - 12 && t!.y <= room.y + room.h + 12;
      expect(inside, `${label} label at (${t!.x},${t!.y}) is outside ${idFor[label]}`).toBe(true);
    }
  });

  it("agrees with the room schedule on the dimensions it prints", () => {
    // every "NNNN X NNNN" on the CAD, in mm, against the schedule in feet
    const mmOf = (s: NonNullable<(typeof SPACES)[number]["dims"]>) =>
      [(s.widthFt * 12 + (s.widthIn ?? 0)) * 25.4, (s.lengthFt * 12 + (s.lengthIn ?? 0)) * 25.4];
    const pairs: [string, string][] = [
      ["gf-living", "LIVING"], ["gf-dining", "DINING"], ["gf-kitchen", "KITCHEN"],
      ["gf-bedroom-bath", "TOILET"], ["ff-master", "MASTER BEDROOM"], ["sf-powder", "P.RM."],
    ];
    for (const [id, label] of pairs) {
      const sp = SPACES.find((s) => s.id === id)!;
      if (!sp.dims) continue;
      const floor = sp.floor === "outdoor" ? "ground" : sp.floor;
      const t = cad[floor].texts.find((t) => t.s.toUpperCase().startsWith(label) && /\d{3,4}\s*[Xx]\s*\d{3,4}/.test(t.s));
      if (!t) continue;
      const m = /(\d{3,4})\s*[Xx]\s*(\d{3,4})/.exec(t.s)!;
      const [w, d] = mmOf(sp.dims);
      const got = [Number(m[1]), Number(m[2])];
      expect(Math.abs(got[0] - w), `${id} width: CAD ${got[0]}mm vs schedule ${Math.round(w)}mm`).toBeLessThan(40);
      expect(Math.abs(got[1] - d), `${id} depth: CAD ${got[1]}mm vs schedule ${Math.round(d)}mm`).toBeLessThan(40);
    }
  });
});
