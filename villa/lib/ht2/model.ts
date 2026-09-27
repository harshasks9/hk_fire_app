import type { Config, Study, Subs } from "@/lib/ht/pareto";
import { P, FIXED, CAT_LABEL2 } from "./prices";

/**
 * Every coherent India-sourced system from a menu of choices, costed from
 * dealer prices and scored by an explicit, physics-first model. Nothing here
 * is hand-scored per system: each sub-score is computed from the parts, so
 * the frontier is a consequence of the assumptions, which are shown and can
 * be challenged on the page.
 */

const L = 1e5;
const log10 = Math.log10;

/* ============================================================== geometry */

/** Distance loss to each row in a treated small room: inverse square, less ~3 dB of room support. */
const LOSS = { row1: 20 * log10(2.9) - 3, row2: 20 * log10(4.9) - 3 };
/** Woven AT fabric in front of the L/C/R. */
const AT_LOSS = 1;
/**
 * Reference peaks are 105 dB per channel. Most people watch films 5–10 dB
 * below reference, so full marks at reference −5 dB in row 2.
 */
const ROW2_TARGET = 100;

/* ================================================================= menus */

export interface Choice { id: string; label: string; short: string; parts: Record<string, number> }

export interface Projector extends Choice { hdr: number }
export const PICTURE: Projector[] = [
  { id: "P1", label: "Epson LS12000", short: "LS12000", parts: { LS12: 1 }, hdr: 58 },
  { id: "P2", label: "Sony XW5100 (Bravia 7)", short: "Bravia 7", parts: { XW51: 1 }, hdr: 72 },
  { id: "P3", label: "JVC NZ500", short: "NZ500", parts: { NZ5: 1 }, hdr: 84 },
  { id: "P4", label: "JVC NZ700", short: "NZ700", parts: { NZ7: 1 }, hdr: 89 },
];

export interface Speakers extends Choice {
  /** Measured sensitivity of the L/C/R where published (else spec less ~3 dB), dB at 2.83 V / 1 m. */
  sens: number;
  /** Clarity and tonal quality of the L/C/R before headroom. */
  clarity: number;
  immersion: number;
  layout: "7.x.4" | "5.x.4";
  horn: boolean;
  /** Too deep for the 0.60 m stage: ports must be plugged and the towers crowd the front subs. */
  deep: boolean;
  /** Surrounds are bookshelf boxes that stand ~0.3 m off the side walls at head height over the aisles. */
  boxy: boolean;
}
export const SPEAKERS: Speakers[] = [
  { id: "S1", label: "JBL Stage 2 · 7.x.4", short: "JBL Stage 2", parts: { J250: 3.5, J280: 4 }, sens: 85, clarity: 72, immersion: 74, layout: "7.x.4", horn: false, deep: false, boxy: true },
  { id: "S2", label: "Polk Reserve · 7.x.4", short: "Polk Reserve", parts: { PR2: 1.5, PR1: 2, PRC: 2 }, sens: 86.5, clarity: 80, immersion: 76, layout: "7.x.4", horn: false, deep: false, boxy: true },
  { id: "S3", label: "KEF Q Concerto Meta · 7.x.4", short: "KEF Q Concerto", parts: { KQC: 3.5, KCI: 4 }, sens: 87, clarity: 82, immersion: 83, layout: "7.x.4", horn: false, deep: false, boxy: true },
  { id: "S4", label: "Klipsch RP-6000F II · 7.x.4", short: "Klipsch RP-6000F", parts: { K6F: 1.5, K5S: 2, KCI: 4 }, sens: 90.5, clarity: 80, immersion: 80, layout: "7.x.4", horn: true, deep: false, boxy: false },
  { id: "S5", label: "Klipsch RP-8000F II · 7.x.4", short: "Klipsch RP-8000F", parts: { K8F: 1.5, K5S: 2, KCI: 4 }, sens: 91.7, clarity: 81, immersion: 80, layout: "7.x.4", horn: true, deep: true, boxy: false },
  { id: "S6", label: "Klipsch RP-6000F II · 5.x.4", short: "Klipsch 5.x.4", parts: { K6F: 1.5, K5S: 1, KCI: 4 }, sens: 90.5, clarity: 80, immersion: 72, layout: "5.x.4", horn: true, deep: false, boxy: false },
];

/** Estimated CEA-2010 output (2 m RMS) at 20, 25 and 31.5 Hz, per sub. */
const OUT: Record<string, [number, number, number]> = {
  SPL12: [97, 103, 108],
  SPL15: [100, 107, 112],
  SB1P: [92, 100, 105],
  SB2P: [99, 105, 110],
  PB1P: [104, 108, 111],
  PB2P: [108, 112, 115],
};
export const BASS_FREQS = [20, 25, 31.5] as const;
/** Pressure-vessel gain in a rigid brick/RCC room, rising below the 28 Hz length mode. */
const ROOM_GAIN = [7, 5, 3];
/** Peaks needed at the seats: reference LFE, plus redirected bass from the mains at 25 Hz and up. */
const BASS_NEED = [115, 118, 118];

export interface Subwoofers extends Choice {
  n: number;
  /** Price key of each sub, front pair first. */
  models: string[];
  svs: boolean;
  /** A ported sub stands on the riser within arm's length of row 2. */
  portedRear: boolean;
}
const subs = (id: string, label: string, short: string, front: string, rear: string | null, svs: boolean, portedRear: boolean): Subwoofers => ({
  id, label, short, svs, portedRear,
  parts: rear === null ? { [front]: 2 } : front === rear ? { [front]: 4 } : { [front]: 2, [rear]: 2 },
  n: rear === null ? 2 : 4,
  models: rear === null ? [front, front] : [front, front, rear, rear],
});
export const SUBS: Subwoofers[] = [
  subs("B1", "2× Klipsch SPL-120", "2× SPL-120", "SPL12", null, false, false),
  subs("B2", "2× SVS PB-1000 Pro", "2× PB-1000 Pro", "PB1P", null, true, false),
  subs("B3", "2× SVS PB-2000 Pro", "2× PB-2000 Pro", "PB2P", null, true, false),
  subs("B4", "4× SVS SB-1000 Pro (sealed)", "4× SB-1000 Pro", "SB1P", "SB1P", true, false),
  subs("B5", "4× Klipsch SPL-150", "4× SPL-150", "SPL15", "SPL15", false, true),
  subs("B6", "4× SVS PB-1000 Pro", "4× PB-1000 Pro", "PB1P", "PB1P", true, true),
  subs("B7", "4× SVS PB-2000 Pro", "4× PB-2000 Pro", "PB2P", "PB2P", true, true),
  subs("B8", "2× SVS PB-1000 Pro front + 2× SB-1000 Pro rear (sealed)", "2× PB-1000 + 2× SB-1000", "PB1P", "SB1P", true, false),
  subs("B9", "2× SVS PB-1000 Pro front + 2× SB-2000 Pro rear (sealed)", "2× PB-1000 + 2× SB-2000", "PB1P", "SB2P", true, false),
];

export interface Processing extends Choice { amps: number; watts: number; dirac: boolean; upgrade: number }
/**
 * watts: dynamic power per channel with the mains high-passed at 80 Hz and
 * two or three channels peaking together — how films actually load an AVR —
 * not the all-channels-driven worst case.
 */
export const PROCESSING: Processing[] = [
  { id: "A1", label: "Denon X3800H (Audyssey only)", short: "X3800H, Audyssey", parts: { X38: 1 }, amps: 9, watts: 105, dirac: false, upgrade: 66 },
  { id: "A2", label: "Denon X3800H + Dirac", short: "X3800H + Dirac", parts: { X38: 1, DRC: 1 }, amps: 9, watts: 105, dirac: true, upgrade: 70 },
  { id: "A3", label: "Denon X6800H + Dirac", short: "X6800H + Dirac", parts: { X68: 1, DRC: 1 }, amps: 11, watts: 140, dirac: true, upgrade: 78 },
  { id: "A4", label: "Denon A1H + Dirac", short: "A1H + Dirac", parts: { A1H: 1, DRC: 1 }, amps: 15, watts: 150, dirac: true, upgrade: 82 },
];
const EXT_AMP_WATTS = 200;

export interface Treatment extends Choice { d: number; b: number; i: number; p: number }
export const TREATMENT: Treatment[] = [
  { id: "T0", label: "No acoustic treatment", short: "No treatment", parts: {}, d: -5, b: -4, i: -2, p: -3 },
  { id: "T1", label: "Typical contractor package (thin PET panels)", short: "Thin-panel package", parts: { TP: 1 }, d: -1, b: -3, i: -1, p: 0 },
  { id: "T2", label: "Thick absorbers to a written spec, carpenter-built", short: "Spec'd, carpenter-built", parts: { TD: 1 }, d: 1, b: 2, i: 1, p: 1 },
  { id: "T3", label: "Thick absorbers to a written spec, specialist-built and measured", short: "Spec'd, specialist-built", parts: { TC: 1 }, d: 2, b: 3, i: 1, p: 1 },
];

/** Movies first: picture and bass carry the most weight. */
export const WEIGHTS = { dialogue: 20, bass: 22, immersion: 16, hdr: 26, upgrade: 6, synergy: 10 };

/* ============================================================== scoring */

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

export interface Built {
  pic: Projector; spk: Speakers; sub: Subwoofers; proc: Processing; trt: Treatment;
  parts: Record<string, number>;
  /** Whether an external 3-channel amp is added for the L/C/R. */
  lcrAmp: boolean;
}

export function build(pic: Projector, spk: Speakers, sub: Subwoofers, proc: Processing, trt: Treatment, forceAmp = false): Built {
  const channels = spk.layout === "7.x.4" ? 11 : 9;
  const lcrAmp = forceAmp || channels > proc.amps;
  const parts: Record<string, number> = { ...FIXED };
  for (const c of [pic, spk, sub, proc, trt]) for (const [k, q] of Object.entries(c.parts)) parts[k] = (parts[k] ?? 0) + q;
  if (lcrAmp) parts.BA3 = 1;
  return { pic, spk, sub, proc, trt, parts, lcrAmp };
}

/**
 * Offsets to the model's hand-set constants, keyed like "hdr:P3" or
 * "out:PB1P". Empty for the nominal model; the Monte Carlo fills it.
 */
export type Knobs = Record<string, number>;

/** Peak level of the L/C/R at row 2, dB. */
export const row2Level = (b: Built, k: Knobs = {}) =>
  b.spk.sens + (k[`sens:${b.spk.id}`] ?? 0) + 10 * log10(b.lcrAmp ? EXT_AMP_WATTS : b.proc.watts) - LOSS.row2 - AT_LOSS;

/** Peak level of the L/C/R at row 1, dB. */
export const row1Level = (b: Built, k: Knobs = {}) => row2Level(b, k) + LOSS.row2 - LOSS.row1;

/**
 * Array output at the seats per frequency: pressure sum of the subs, plus
 * room gain, less what joint optimisation gives up — front and rear pairs
 * fight each other on the 28 Hz length mode, so four subs lose ~3 dB.
 */
export function bassAtSeats(sub: Subwoofers, k: Knobs = {}) {
  const loss = (sub.n === 4 ? 3 : 1) + (k.optLoss ?? 0);
  return BASS_FREQS.map((_, f) => {
    const p = sub.models.reduce((a, m) => a + 10 ** ((OUT[m][f] + (k[`out:${m}`] ?? 0)) / 20), 0);
    return 20 * log10(p) + ROOM_GAIN[f] - loss;
  });
}

export function scoreOf(b: Built, k: Knobs = {}): Subs {
  const j = (key: string) => k[key] ?? 0;
  const t = { d: b.trt.d * (1 + j(`trt:${b.trt.id}`)), b: b.trt.b * (1 + j(`trt:${b.trt.id}`)), i: b.trt.i, p: b.trt.p };

  const headroom = Math.min(8, Math.max(0, ROW2_TARGET - row2Level(b, k)));
  const dialogue = b.spk.clarity + j(`clar:${b.spk.id}`) + (b.proc.dirac ? 2 : 0) + t.d - headroom;

  const out = bassAtSeats(b.sub, k).reduce((a, lvl, f) => {
    const m = lvl - BASS_NEED[f];
    return a + (m >= 0 ? Math.min(1, m * 0.25) : m * 1.2);
  }, 0);
  const dsp = b.proc.dirac ? (b.sub.n === 4 ? 5 + j("dirac4") : 3) : 0;
  const bass = (b.sub.n === 4 ? 78 : 66 - j("twoSubGap")) + out + dsp + t.b;

  const immersion = b.spk.immersion + j(`imm:${b.spk.id}`) + t.i;
  const hdr = b.pic.hdr + j(`hdr:${b.pic.id}`) + t.p;
  const upgrade = b.proc.upgrade + (b.sub.svs ? 3 : 0);

  let synergy = 80;
  if (b.sub.n === 2) synergy -= 4;                       // two rows, two subs
  if (!b.proc.dirac && b.sub.n === 4) synergy -= 3;      // four subs without joint optimisation
  if (b.spk.horn && b.trt.id === "T0") synergy -= 4;     // horns in a bare room
  if (b.pic.id === "P1") synergy -= 3;                   // 3LCD blacks in a black room
  if (b.pic.hdr >= 88 && bass <= 80) synergy -= 3;       // picture far ahead of bass
  if (b.proc.amps - (b.spk.layout === "7.x.4" ? 11 : 9) >= 4) synergy -= 1; // channels paid for, unused
  if (b.spk.deep) synergy -= 2;                          // towers too deep for the stage: ports plugged, crowding the subs
  if (b.sub.portedRear) synergy -= 2;                    // port noise and riser buzz at arm's length from row 2
  if (b.spk.boxy) synergy -= 1;                          // deep surround boxes over the aisles at head height

  return { dialogue: clamp(dialogue), bass: clamp(bass), immersion: clamp(immersion), hdr: clamp(hdr), upgrade: clamp(upgrade), synergy: clamp(synergy) };
}

export const costOf = (parts: Record<string, number>, e: Record<string, number> = {}) =>
  Math.round(Object.entries(parts).reduce((a, [k, q]) => a + P[k].price * q * (1 + (e[k] ?? 0)), 0));

const W = WEIGHTS;
export const overall = (s: Subs, w: typeof WEIGHTS = W) => {
  const t = w.dialogue + w.bass + w.immersion + w.hdr + w.upgrade + w.synergy;
  return Math.round(((s.dialogue * w.dialogue + s.bass * w.bass + s.immersion * w.immersion + s.hdr * w.hdr + s.upgrade * w.upgrade + s.synergy * w.synergy) / t) * 10) / 10;
};

/* ============================================================ enumerate */

export const idOf = (b: Pick<Built, "pic" | "spk" | "sub" | "proc" | "trt">) => `${b.pic.id}${b.spk.id}${b.sub.id}${b.proc.id}${b.trt.id}`;

export function toConfig(b: Built): Config {
  const s = scoreOf(b);
  return {
    id: idOf(b),
    name: `${b.pic.short} · ${b.spk.short} · ${b.sub.short} · ${b.proc.short}${b.lcrAmp ? " + L/C/R amp" : ""} · ${b.trt.short}`,
    layout: b.spk.layout.replace("x", b.sub.n === 4 ? "4" : "2"),
    cost: costOf(b.parts),
    stated: overall(s),
    sub: s,
    statedPareto: false,
    dims: {
      picture: b.pic.label,
      speakers: b.spk.label,
      subs: b.sub.label,
      processing: b.proc.label + (b.lcrAmp ? " + Emotiva BasX A3" : ""),
      extras: b.trt.label,
    },
    parts: b.parts,
  };
}

export function allBuilt(): Built[] {
  const out: Built[] = [];
  for (const pic of PICTURE) for (const spk of SPEAKERS) for (const sub of SUBS) for (const proc of PROCESSING) for (const trt of TREATMENT) {
    out.push(build(pic, spk, sub, proc, trt));
  }
  return out;
}

export const allConfigs = (): Config[] => allBuilt().map(toConfig);

/** The system /ht2 recommends. */
export const RECOMMENDED = { pic: "P3", spk: "S3", sub: "B8", proc: "A3", trt: "T2" };
export const RECOMMENDED_ID = `${RECOMMENDED.pic}${RECOMMENDED.spk}${RECOMMENDED.sub}${RECOMMENDED.proc}${RECOMMENDED.trt}`;

export const CAP = 30 * L;

export function makeStudy(configs: Config[], extra: Partial<Study> = {}): Study {
  return {
    id: "X",
    title: `Every combination · ${configs.length} systems`,
    short: "Built from Indian dealer prices and a physics-first scoring model",
    scoreName: "Score",
    labels: { dialogue: "Dialogue & dynamics", bass: "Bass & six-seat evenness", immersion: "Immersion", hdr: "HDR & black level", upgrade: "Upgradeability & service", synergy: "System synergy" },
    weights: WEIGHTS,
    uncertainty: 2,
    knee: RECOMMENDED_ID,
    fitsRoom: true,
    roomNote: "Every system is built only from parts sold in India with an Indian warranty (Dirac licences are bought online), for this room: 6.05 × 4.13 m, 2.55 m ceiling, 120″ woven AT screen, rear-wall projector shelf.",
    common: `Every system also carries the same screen, sources, UPS, rack, cabling, baffle wall, hush box, earthing, installation, calibration, measurement mic and the ₹1 L contingency (₹${(Object.entries(FIXED).reduce((a, [k, q]) => a + P[k].price * q, 0) / L).toFixed(1)} L together).`,
    severeFrom: CAP,
    callouts: [],
    dimLabels: { picture: "Projector", speakers: "Speakers", subs: "Subwoofers", processing: "Processing", extras: "Acoustic treatment" },
    describe: {},
    configs,
    verdict: "",
    prices: P,
    catLabels: CAT_LABEL2,
    defaultSel: [RECOMMENDED_ID],
    defaultBudget: CAP,
    cap: CAP,
    ...extra,
  };
}

/* ========================================================== Monte Carlo */

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Robustness {
  samples: number;
  candidates: number;
  /** Share of samples in which each system is the best that keeps the contingency under the cap. */
  wins: { id: string; share: number }[];
  /** The same, per choice in each dimension. */
  byDim: Record<"picture" | "speakers" | "subs" | "processing" | "extras", { id: string; label: string; share: number }[]>;
  /** For each candidate: chance the planned spend eats into the contingency, and chance it breaks the cap even after spending it. */
  risk: Record<string, { eats: number; breaks: number }>;
}

/**
 * The model's constants are opinions (±2–3 points) and half the prices are
 * estimates (±12%). Perturb both together, many times, and count which
 * system comes out best under the cap with the ₹1 L contingency intact.
 */
export function monteCarlo(samples = 250, seed = 20260927): Robustness {
  const r = mulberry32(seed);
  const g = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const built = allBuilt();
  const nominal = built.map((b) => ({ b, id: idOf(b), cost: costOf(b.parts), score: overall(scoreOf(b)) }));
  const bestUnder = Math.max(...nominal.filter((x) => x.cost < CAP).map((x) => x.score));
  const cands = nominal.filter((x) => x.cost < CAP * 1.08 && x.score >= bestUnder - 4);
  const ctg = P.CTG.price;

  const wins: Record<string, number> = {};
  const risk: Record<string, { eats: number; breaks: number }> = {};
  for (const c of cands) risk[c.id] = { eats: 0, breaks: 0 };

  for (let s = 0; s < samples; s++) {
    const k: Knobs = { dirac4: 1.5 * g(), twoSubGap: 2 * g(), optLoss: g() };
    for (const p of PICTURE) k[`hdr:${p.id}`] = 2 * g();
    for (const sp of SPEAKERS) { k[`clar:${sp.id}`] = 2 * g(); k[`imm:${sp.id}`] = 2 * g(); k[`sens:${sp.id}`] = g(); }
    for (const m of Object.keys(OUT)) k[`out:${m}`] = 1.5 * g();
    for (const t of TREATMENT) k[`trt:${t.id}`] = 0.3 * g();
    const e: Record<string, number> = {};
    for (const [key, item] of Object.entries(P)) if (key !== "CTG") e[key] = (item.est ? 0.12 : 0.04) * g();

    let best: { id: string; v: number } | null = null;
    for (const c of cands) {
      const cost = costOf(c.b.parts, e);
      const spend = cost - ctg;
      if (spend > CAP - ctg) risk[c.id].eats++;
      if (spend > CAP) risk[c.id].breaks++;
      if (cost >= CAP) continue;
      const v = overall(scoreOf(c.b, k));
      if (!best || v > best.v) best = { id: c.id, v };
    }
    if (best) wins[best.id] = (wins[best.id] ?? 0) + 1;
  }

  const share = (n: number) => Math.round((n / samples) * 1000) / 10;
  const byDim = {} as Robustness["byDim"];
  const dims = [["picture", PICTURE, 0], ["speakers", SPEAKERS, 2], ["subs", SUBS, 4], ["processing", PROCESSING, 6], ["extras", TREATMENT, 8]] as const;
  for (const [dim, menu, at] of dims) {
    byDim[dim] = (menu as readonly Choice[])
      .map((c) => ({ id: c.id, label: c.label, share: share(Object.entries(wins).filter(([id]) => id.slice(at, at + 2) === c.id).reduce((a, [, n]) => a + n, 0)) }))
      .filter((x) => x.share > 0)
      .sort((a, b) => b.share - a.share);
  }
  for (const id of Object.keys(risk)) risk[id] = { eats: share(risk[id].eats), breaks: share(risk[id].breaks) };

  return {
    samples,
    candidates: cands.length,
    wins: Object.entries(wins).map(([id, n]) => ({ id, share: share(n) })).sort((a, b) => b.share - a.share),
    byDim,
    risk,
  };
}
