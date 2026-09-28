import type { Subs } from "@/lib/ht/pareto";
import { build, costOf, overall, scoreOf, PICTURE, SPEAKERS, SUBS, PROCESSING, TREATMENT, RECOMMENDED, CAP, WEIGHTS } from "./model";
import { P } from "./prices";

/**
 * Small additions to the recommended /ht2 room, each priced in India and
 * scored the same way as the whole-system study. Where the room model covers
 * the change (an amp, a sub swap, the treatment build, a receiver or a
 * projector) the whole system is re-scored through it; where it doesn't
 * (tactile transducers, velvet, a 3D LUT…) the add-on carries a stated
 * judgement of its sub-score change, and says so.
 */

export type Area = "sound" | "bass" | "picture";
export const AREA_LABEL: Record<Area, string> = { sound: "Sound & immersion", bass: "Bass", picture: "Picture" };

export type Timing = "plug-in" | "pre-wire" | "build" | "any";
export const TIMING_LABEL: Record<Timing, string> = {
  "plug-in": "Plug in any time",
  "pre-wire": "Pre-wire before the ceiling closes",
  build: "Only while the room is being built",
  any: "Any time",
};

export interface AddOn {
  id: string;
  name: string;
  short: string;
  area: Area;
  /** Extra cost over the recommended system, ₹. */
  cost: number;
  est: boolean;
  priceNote: string;
  timing: Timing;
  /** Who notices it: 0 = no one, 1 = some, 2 = clearly. Judgement. */
  rows: [number, number];
  /** The room model's change, if it covers this add-on. */
  model?: { pic?: string; sub?: string; proc?: string; trt?: string; amp?: boolean };
  /** A judgement of the sub-score change, where the model has no term for it. */
  judged?: Partial<Subs>;
  /** Add-ons that replace the same part and can't be combined. */
  group?: string;
  what: string;
  caveat: string;
  /** The catalog component it changes (opens its details). */
  component: string;
  /** Beyond the "small additions" scale — shown for reference. */
  big?: boolean;
}

export const ADDONS: AddOn[] = [
  {
    id: "amp", component: "lcr", name: "Emotiva BasX A3 amplifier on the L/C/R", short: "External L/C/R amp", area: "sound",
    cost: P.BA3.price, est: false, priceNote: "₹89.5–94k at AV Shack", timing: "plug-in", rows: [1, 2],
    model: { amp: true },
    what: "Takes the three front channels off the Denon's amplifier: about +1.5 dB of peak level at row 2 (~98 dB, reference −7), and the X6800H's supply is left for the other eight channels.",
    caveat: "Headroom, not a different sound — you only hear it within ~6 dB of reference. Confirm Emotiva's Indian warranty route with the dealer first.",
  },
  {
    id: "tops6", component: "atmos", name: "Six overheads: two more KEF Ci200ER + a 2-channel amp", short: "Six overheads", area: "sound",
    cost: 2 * P.KCI.price + 60000, est: true, priceNote: "2× ₹24,500 + a small 2-channel amp (est.)", timing: "pre-wire", rows: [1, 2],
    judged: { immersion: 2 },
    what: "A top-middle pair over the row-1/row-2 gap turns 7.x.4 into 7.x.6: overhead pans stop jumping from front pair to rear pair, and row 2 gets overhead effects of its own. The X6800H processes 13 channels.",
    caveat: "Pull the two cables and fit the back-boxes before the ceiling closes (~₹5k), even if the speakers come later.",
  },
  {
    id: "rearSB2", component: "subs", name: "SVS SB-2000 Pro at the rear instead of SB-1000 Pro", short: "Bigger sealed rear subs", area: "bass", group: "subs",
    cost: 2 * (P.SB2P.price - P.SB1P.price), est: false, priceNote: "₹1,31,950 each at HiFi Fever, less the two SB-1000 Pro", timing: "plug-in", rows: [2, 2],
    model: { sub: "B9" },
    what: "+2 dB across 20–31.5 Hz from the same sealed boxes on the slab (0.36 m cube): the array goes from just meeting reference at 20 Hz to clearing it.",
    caveat: "Only audible in the deepest, loudest scenes.",
  },
  {
    id: "pb4", component: "subs", name: "Two more PB-1000 Pro instead of the sealed rear pair", short: "4× PB-1000 Pro", area: "bass", group: "subs",
    cost: 2 * (P.PB1P.price - P.SB1P.price), est: false, priceNote: "₹1,08,900 each at VPLAK, less the two SB-1000 Pro", timing: "plug-in", rows: [1, 1],
    model: { sub: "B6" },
    what: "+4 dB at 20 Hz — the most output per rupee.",
    caveat: "Ported boxes on the riser half a metre from row-2 ears: port noise and riser buzz. The model docks it for that; only with a filled riser.",
  },
  {
    id: "tactile", component: "subs", name: "Tactile transducers under all six seats", short: "Tactile transducers", area: "bass",
    cost: 60000, est: true, priceNote: "6× Dayton Audio TT25 + two small amps via Amazon.in (est.); Buttkicker LFE kits ~₹1.5 L", timing: "pre-wire", rows: [2, 2],
    judged: { bass: 2 },
    what: "Puts the 20–40 Hz you would otherwise need 125 dB to feel into the seat frames, at normal listening levels — the cheapest way to 'feel' the bass without disturbing the rest of the house.",
    caveat: "A taste thing: some love it, some find it gimmicky. Pull speaker cable to each seat position before the carpet and riser are finished.",
  },
  {
    id: "traps", component: "treatment", name: "Extra bass traps in the rear ceiling corners", short: "Rear corner traps", area: "bass",
    cost: 40000, est: true, priceNote: "150–200 mm wool, carpenter-built (est.)", timing: "any", rows: [1, 2],
    judged: { bass: 1 },
    what: "More absorption where the length and height modes pile up behind row 2: shorter decay around 56 and 67 Hz, which both rows share.",
    caveat: "Measure first — Dirac and four subs may already have it under control.",
  },
  {
    id: "riser", component: "treatment", name: "Fill and decouple the riser", short: "Filled riser", area: "bass",
    cost: 30000, est: true, priceNote: "Wool or sand fill + isolation pads (est.)", timing: "build", rows: [0, 2],
    judged: { bass: 0.7, synergy: 1 },
    what: "A hollow timber riser is a drum under row 2: filled and decoupled, it stops ringing at 40–100 Hz and stops the rear subs shaking it.",
    caveat: "Only while the riser is being built.",
  },
  {
    id: "velvet", component: "treatment", name: "Black velvet on the front third: ceiling and side walls", short: "Black velvet front third", area: "picture",
    cost: 35000, est: true, priceNote: "~15 m² of velvet + fixing (est.)", timing: "build", rows: [2, 2],
    judged: { hdr: 1.5 },
    what: "Light from bright scenes bounces off pale surfaces near the screen and back onto it, greying the JVC's blacks in mixed scenes. Velvet around the screen keeps the contrast the projector actually makes.",
    caveat: "Fold it into the treatment fabric order — the same carpenter fits both.",
  },
  {
    id: "lut", component: "calibration", name: "3D LUT calibration for the JVC", short: "3D LUT calibration", area: "picture",
    cost: 30000, est: true, priceNote: "Remote Calman session (est.)", timing: "any", rows: [1, 1],
    judged: { hdr: 0.7 },
    what: "Goes beyond JVC Auto Cal: a measured 3D colour table for SDR and HDR, tightening skin tones and saturated colours.",
    caveat: "Do it after 100–200 hours on the laser.",
  },
  {
    id: "a1h", component: "avr", name: "Denon A1H instead of the X6800H", short: "Denon A1H", area: "sound",
    cost: P.A1H.price - P.X68.price, est: false, priceNote: "₹4,29,800 at VPLAK, less the X6800H", timing: "plug-in", rows: [0, 1],
    model: { proc: "A4" },
    what: "Fifteen amplifiers and 15.4 processing: six overheads without an external amp.",
    caveat: "Channels this room doesn't use.",
  },
  {
    id: "nz700", component: "projector", name: "JVC NZ700 instead of the NZ500", short: "JVC NZ700", area: "picture", big: true,
    cost: P.NZ7.price - P.NZ5.price, est: true, priceNote: "~₹9.5 L vs ₹5.75 L (est.)", timing: "plug-in", rows: [2, 2],
    model: { pic: "P4" },
    what: "Deeper native contrast and a better lens: visible in every dark scene.",
    caveat: "Not a small addition — breaks the cap. Shown for scale.",
  },
];

const byId = (id: string) => ADDONS.find((a) => a.id === id)!;
const find = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id)!;

const wSum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export interface Basket {
  ids: string[];
  /** Whole system with the add-ons (₹, includes the ₹1 L contingency). */
  cost: number;
  score: number;
  sub: Subs;
  base: { cost: number; score: number; sub: Subs };
}

/** Score and cost of the recommended system with a set of add-ons. */
export function basket(ids: string[]): Basket {
  const chosen = ids.map(byId);
  const pick = { ...RECOMMENDED } as Record<string, string>;
  let amp = false;
  for (const a of chosen) {
    if (a.model?.pic) pick.pic = a.model.pic;
    if (a.model?.sub) pick.sub = a.model.sub;
    if (a.model?.proc) pick.proc = a.model.proc;
    if (a.model?.trt) pick.trt = a.model.trt;
    if (a.model?.amp) amp = true;
  }
  const make = (p: Record<string, string>, forceAmp: boolean) =>
    build(find(PICTURE, p.pic), find(SPEAKERS, p.spk), find(SUBS, p.sub), find(PROCESSING, p.proc), find(TREATMENT, p.trt), forceAmp);
  const b0 = make(RECOMMENDED, false);
  const b = make(pick, amp);
  const sub = { ...scoreOf(b) };
  for (const a of chosen) for (const [k, v] of Object.entries(a.judged ?? {})) sub[k as keyof Subs] = clamp(sub[k as keyof Subs] + (v as number));
  const extra = chosen.filter((a) => !a.model).reduce((s, a) => s + a.cost, 0);
  const s0 = scoreOf(b0);
  return {
    ids,
    cost: costOf(b.parts) + extra,
    score: Math.round(((Object.keys(WEIGHTS) as (keyof Subs)[]).reduce((s, k) => s + sub[k] * WEIGHTS[k], 0) / wSum) * 100) / 100,
    sub,
    base: { cost: costOf(b0.parts), score: overall(s0), sub: s0 },
  };
}

export interface Single {
  id: string;
  cost: number;
  gain: number;
  perLakh: number;
  dSub: Subs;
}

/** Each add-on on its own, on top of the recommended system. */
export function singles(): Single[] {
  const base = basket([]);
  return ADDONS.map((a) => {
    const b = basket([a.id]);
    const dSub = Object.fromEntries((Object.keys(b.sub) as (keyof Subs)[]).map((k) => [k, Math.round((b.sub[k] - base.sub[k]) * 10) / 10])) as unknown as Subs;
    const gain = Math.round((b.score - base.score) * 100) / 100;
    return { id: a.id, cost: b.cost - base.cost, gain, perLakh: gain / ((b.cost - base.cost) / 1e5), dSub };
  });
}

/** Best-first: at each step add whichever remaining add-on buys the most points per lakh, given what is already in. */
export function ladder(pool: string[] = ADDONS.filter((a) => !a.big).map((a) => a.id)) {
  const steps: { id: string; cost: number; score: number }[] = [];
  let cur: string[] = [];
  let b = basket(cur);
  const start = { cost: b.cost, score: b.score };
  for (;;) {
    const taken = new Set(cur.map((id) => byId(id).group).filter(Boolean));
    let best: { id: string; b: Basket; v: number } | null = null;
    for (const id of pool) {
      if (cur.includes(id)) continue;
      const g = byId(id).group;
      if (g && taken.has(g)) continue;
      const nb = basket([...cur, id]);
      const gain = nb.score - b.score;
      if (gain <= 0) continue;
      const v = gain / Math.max(1, nb.cost - b.cost);
      if (!best || v > best.v) best = { id, b: nb, v };
    }
    if (!best) break;
    cur = [...cur, best.id];
    b = best.b;
    steps.push({ id: best.id, cost: b.cost, score: b.score });
  }
  return { start, steps };
}

export { CAP };
export const CONTINGENCY = P.CTG.price;
