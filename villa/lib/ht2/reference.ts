import type { Config, Subs } from "@/lib/ht/pareto";
import {
  build, toConfig, scoreOf, overall, costOf, row2Level, bassAtSeats, idOf,
  PICTURE, SPEAKERS, SUBS, PROCESSING, TREATMENT, RECOMMENDED,
  type Built,
} from "./model";
import { P } from "./prices";

/**
 * A reference theatre from a video: Focal Theva N3 L/C/R, Focal in-wall
 * surrounds and in-ceiling tops, 2× SVS PB-2000 Pro, Marantz AV7706 with
 * MM8077 + MM7055 amps, a Sony XW5000, a 200″ 1.4-gain woven screen and
 * Crestron control.
 *
 * Its projector, speakers and processor are menu options in the study, so
 * they compete like any other choice; these labelled reference points show
 * each part swapped into the recommendation, and the whole system with its
 * Crestron control. The 200″ screen can't fit a 4.13 m wall, so the
 * reference keeps the 120″ screen.
 */

const pick = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id)!;
export const XW5000 = pick(PICTURE, "P5");
export const FOCAL = pick(SPEAKERS, "S7");
export const MARANTZ = pick(PROCESSING, "A5");

const find = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id)!;
const rec = () => ({
  pic: find(PICTURE, RECOMMENDED.pic), spk: find(SPEAKERS, RECOMMENDED.spk), sub: find(SUBS, RECOMMENDED.sub),
  proc: find(PROCESSING, RECOMMENDED.proc), trt: find(TREATMENT, RECOMMENDED.trt),
});
const make = (o: Partial<ReturnType<typeof rec>>, extra: Record<string, number> = {}): Built => {
  const r = { ...rec(), ...o };
  const b = build(r.pic, r.spk, r.sub, r.proc, r.trt);
  return { ...b, parts: { ...b.parts, ...extra } };
};

interface Ref {
  id: string;
  label: string;
  part: string;
  replaces: string;
  built: Built;
  note: string;
}

function refs(): Ref[] {
  const B3 = find(SUBS, "B3");
  return [
    { id: "REF-VIDEO", label: "Video theatre", part: "The whole system", replaces: "Everything",
      built: make({ pic: XW5000, spk: FOCAL, sub: B3, proc: MARANTZ }, { CRS: 1 }),
      note: "Scored in this room with a 120″ screen (the 200″ is 4.43 m wide; the wall is 4.13 m) and the same treatment, sources and contingency." },
    { id: "REF-PIC", label: "+ Sony XW5000", part: "Sony VPL-XW5000", replaces: "JVC NZ500",
      built: make({ pic: XW5000 }),
      note: "About a third of the NZ500's native contrast (~9–13k:1 measured against ~23–40k:1): greyer blacks in every dark scene." },
    { id: "REF-SPK", label: "+ Focal speakers", part: "Focal Theva N3 L/C/R, 100 ICW6 surrounds and tops", replaces: "KEF Q Concerto Meta + Ci200ER",
      built: make({ spk: FOCAL }),
      note: "More sensitive than the KEF (91 dB rated), and in-wall surrounds free the aisles; but the surrounds and tops are a different line from the Theva fronts, and it costs more." },
    { id: "REF-SUB", label: "+ 2× PB-2000 Pro", part: "2× SVS PB-2000 Pro", replaces: "2× PB-1000 Pro + 2× SB-1000 Pro",
      built: make({ sub: B3 }),
      note: "About 4 dB more at 20 Hz, but two subs can't even out six seats across two rows." },
    { id: "REF-PROC", label: "+ Marantz separates", part: "Marantz AV7706 + MM8077 + MM7055", replaces: "Denon X6800H + Dirac",
      built: make({ proc: MARANTZ }),
      note: "More amplifier power (+1.3 dB at row 2), but no Dirac and only two independent sub outputs — four subs can't be optimised together. Discontinued: old stock only." },
    { id: "REF-CTRL", label: "+ Crestron", part: "Crestron control", replaces: "RF/IP remote",
      built: make({}, { CRS: 1 }),
      note: "One-touch scenes and lighting control. Convenience only: no change to sound or picture in the model." },
  ];
}

/** Chart labels, placed clear of the callouts around the recommendation. */
const TAGS: Record<string, Config["refTag"]> = {
  "REF-PIC": { text: "Sony XW5000", dx: -8, dy: 19, anchor: "start" },
  "REF-SUB": { text: "2× PB-2000 Pro", dx: 10, dy: 14, anchor: "start" },
  "REF-SPK": { text: "Focal speakers", dx: -6, dy: 18, anchor: "end" },
  "REF-PROC": { text: "Marantz separates", dx: 10, dy: 4, anchor: "start" },
};

export function referenceConfigs(): Config[] {
  return refs().map((r) => {
    const c = toConfig(r.built);
    return { ...c, id: r.id, ref: r.label, refTag: TAGS[r.id], name: `${r.label} — ${c.name}${r.built.parts.CRS ? " · Crestron" : ""}` };
  });
}

export interface ReferenceRow {
  id: string;
  part: string;
  replaces: string;
  cost: number;
  dCost: number;
  score: number;
  dScore: number;
  dSub: Subs;
  note: string;
}

/** Each of the video's parts as a single swap into the recommended system, plus the whole system. */
export function referenceTable() {
  const base = make({});
  const s0 = scoreOf(base);
  const c0 = costOf(base.parts);
  const o0 = overall(s0);
  const rows: ReferenceRow[] = refs().map((r) => {
    const s = scoreOf(r.built);
    const cost = costOf(r.built.parts);
    return {
      id: r.id, part: r.part, replaces: r.replaces, cost, dCost: cost - c0, score: overall(s),
      dScore: Math.round((overall(s) - o0) * 10) / 10,
      dSub: Object.fromEntries((Object.keys(s) as (keyof Subs)[]).map((k) => [k, Math.round((s[k] - s0[k]) * 10) / 10])) as unknown as Subs,
      note: r.note,
    };
  });
  const video = refs()[0].built;
  return {
    base: { id: idOf(base), cost: c0, score: o0, row2: row2Level(base), bass: bassAtSeats(base.sub) },
    video: { row2: row2Level(video), bass: bassAtSeats(video.sub) },
    rows,
    unpriced: [
      { part: "200″ 1.4-gain woven screen", why: "4.43 m wide — it doesn't fit a 4.13 m wall. On a 200″ screen the same light gives about 61 nits, against about 114 on the 120″." },
    ],
  };
}

export const PRICED = ["XW50", "TH3", "F100", "AV77", "MM87", "MM75", "CRS"].map((k) => ({ k, ...P[k] }));
