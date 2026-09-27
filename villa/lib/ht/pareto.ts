/**
 * Two independent Pareto studies of complete theatre systems, cost against
 * modelled performance, and the arithmetic to explore them: re-weighting,
 * the frontier, its knee, the best system under a budget, and what each
 * single-component upgrade buys.
 *
 * Study A — "Home Theater Pareto Frontier: Thirty Full-System Configurations"
 *   (the uploaded deep-research report). Scored for this room: 2.55 m ceiling,
 *   120″ AT screen, 7.4.4. Sub-scores are on 0–10 in the report; stored ×10.
 * Study B — the 27-configuration study with an itemised Indian price table.
 *   It assumed a 14 × 20 ft room with a 12 ft ceiling and a 130″ 2.35:1 screen.
 */

export type SubKey = "dialogue" | "bass" | "immersion" | "hdr" | "upgrade" | "synergy";
export const SUB_KEYS: SubKey[] = ["dialogue", "bass", "immersion", "hdr", "upgrade", "synergy"];
export type Subs = Record<SubKey, number>;
export type Weights = Record<SubKey, number>;

export type Dim = "speakers" | "subs" | "processing" | "picture" | "extras";

export interface Config {
  id: string;
  name: string;
  layout: string;
  /** Rupees. */
  cost: number;
  /** The study's own overall score. */
  stated: number;
  sub: Subs;
  /** The study's own frontier call. */
  statedPareto: boolean;
  /** One value per dimension — what changes between configurations. */
  dims: Partial<Record<Dim, string>>;
  /** Itemised components, Study B only: code → quantity. */
  parts?: Record<string, number>;
  tier?: string;
  rationale?: string;
  tradeoffs?: string;
  critique?: string;
}

export interface Callout { id: string; tag: string; dx: number; dy: number; anchor?: "start" | "end" | "middle" }

export interface Study {
  id: "A" | "B";
  title: string;
  short: string;
  scoreName: string;
  labels: Record<SubKey, string>;
  weights: Weights;
  uncertainty: number;
  fitsRoom: boolean;
  roomNote: string;
  common: string;
  /** The knee the study itself names. */
  knee: string;
  /** Where the study itself says diminishing returns turn severe (₹). */
  severeFrom: number;
  callouts: Callout[];
  dimLabels: Partial<Record<Dim, string>>;
  /** Longer descriptions of each dimension value. */
  describe: Record<string, string>;
  configs: Config[];
  verdict: string;
}

const L = 1e5;

/* ================================================================ Study A */

const A_ROWS: [string, string, string, string, string, number, number[], number, boolean][] = [
  ["C01", "Arendal 1961", "2× PB-2000 Pro", "X3900H + Hypex + ART", "Epson LS12000", 22.1, [8.31, 8.20, 8.55, 8.25, 9.14, 8.29], 83.8, true],
  ["C02", "Arendal 1961", "2× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ500", 23.9, [8.31, 8.20, 8.55, 9.10, 9.10, 8.44], 85.8, true],
  ["C03", "Arendal 1961", "4× SB-2000 Pro", "X3900H + Hypex + ART", "Epson LS12000", 24.9, [8.31, 8.82, 8.55, 8.25, 9.14, 8.54], 85.5, false],
  ["C04", "Arendal 1961", "4× PB-2000 Pro", "X3900H + Hypex + ART", "Epson LS12000", 25.2, [8.31, 9.25, 8.55, 8.25, 9.14, 8.60], 86.5, true],
  ["C05", "Arendal 1961", "4× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ500", 27.0, [8.31, 9.25, 8.55, 9.10, 9.10, 8.82], 88.6, true],
  ["C06", "Arendal 1961", "4× HSU VTF-TN1", "X3900H + Hypex + ART", "JVC NZ500", 28.2, [8.31, 9.56, 8.55, 9.10, 8.80, 8.65], 88.8, true],
  ["C07", "Arendal 1723 S", "2× PB-2000 Pro", "X3900H + Hypex + ART", "Epson LS12000", 26.4, [8.93, 8.20, 8.87, 8.25, 9.16, 8.47], 85.7, false],
  ["C08", "Arendal 1723 S", "4× PB-2000 Pro", "X3900H + Hypex + ART", "Epson LS12000", 29.5, [8.93, 9.25, 8.87, 8.25, 9.16, 8.84], 88.5, false],
  ["C09", "Arendal 1723 S", "4× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ500", 31.3, [8.93, 9.25, 8.87, 9.10, 9.12, 9.12], 90.6, true],
  ["C10", "Arendal 1723 S", "2× PB-3000 R", "X3900H + Hypex + ART", "JVC NZ500", 31.6, [8.93, 8.74, 8.87, 9.10, 9.12, 8.87], 89.2, false],
  ["C11", "Arendal 1723 S", "4× PB-3000 R", "X3900H + Hypex + ART", "JVC NZ500", 38.2, [8.93, 9.64, 8.87, 9.10, 9.12, 9.17], 91.6, false],
  ["C12", "Arendal 1723 S", "4× PB-2000 Pro", "X6800H + Hypex + ART", "JVC NZ500", 32.2, [8.94, 9.27, 8.89, 9.10, 9.19, 9.13], 90.8, true],
  ["C13", "Arendal 1723 S", "4× PB-2000 Pro", "Anthem MRX 1140 / ARC", "JVC NZ500", 32.3, [8.91, 9.15, 8.84, 9.10, 9.14, 9.08], 90.3, false],
  ["C14", "Arendal 1723", "4× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ500", 32.6, [9.19, 9.25, 9.03, 9.10, 9.12, 9.24], 91.6, true],
  ["C15", "Arendal 1723", "4× PB-2000 Pro", "X6800H + Hypex + ART", "JVC NZ500", 33.5, [9.21, 9.27, 9.05, 9.10, 9.19, 9.25], 91.7, true],
  ["C16", "JBL Synthesis SCL", "4× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ500", 34.0, [9.37, 9.25, 9.19, 9.10, 9.08, 9.32], 92.2, true],
  ["C17", "KEF R Meta", "4× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ500", 34.3, [8.93, 9.25, 9.35, 9.10, 9.10, 9.23], 91.6, false],
  ["C18", "JBL Synthesis SCL", "4× PB-3000 R", "X3900H + Hypex + ART", "JVC NZ500", 40.9, [9.37, 9.64, 9.19, 9.10, 9.08, 9.39], 93.2, false],
  ["C19", "JBL Synthesis SCL", "4× PB-2000 Pro", "X3900H + Hypex + ART", "JVC NZ700", 37.5, [9.37, 9.25, 9.19, 9.60, 9.08, 9.43], 93.5, true],
  ["C20", "Arendal 1723", "4× PB-3000 R", "X3900H + Hypex + ART", "JVC NZ700", 43.0, [9.19, 9.64, 9.03, 9.60, 9.12, 9.41], 93.7, false],
  ["C21", "JBL Synthesis SCL", "4× PB-3000 R", "X6800H + Hypex + ART", "JVC NZ700", 45.2, [9.38, 9.66, 9.21, 9.60, 9.15, 9.53], 94.6, true],
  ["C22", "KEF R Meta", "4× PB-3000 R", "X6800H + Hypex + ART", "JVC NZ700", 45.5, [8.94, 9.66, 9.37, 9.60, 9.17, 9.43], 94.0, false],
  ["C23", "JBL Synthesis SCL", "4× Arendal 1723 1V", "X3900H + Hypex + ART", "JVC NZ700", 41.7, [9.37, 9.41, 9.19, 9.60, 8.96, 9.47], 93.8, true],
  ["C24", "JBL Synthesis SCL", "4× PB-3000 R", "StormAudio Core 16 + amps + ART", "JVC NZ700", 59.8, [9.43, 9.75, 9.29, 9.60, 9.16, 9.67], 95.2, true],
  ["C25", "JBL Synthesis SCL", "4× PB-3000 R", "Trinnov + amps", "JVC NZ700", 67.8, [9.46, 9.78, 9.34, 9.60, 9.24, 9.70], 95.5, false],
  ["C26", "Perlisten R", "4× PB-3000 R", "X6800H + Hypex + ART", "JVC NZ700", 62.0, [9.65, 9.66, 9.61, 9.60, 9.21, 9.74], 96.1, true],
  ["C27", "Perlisten R", "4× PB-3000 R", "StormAudio Core 16 + amps + ART", "JVC NZ700", 76.6, [9.69, 9.75, 9.69, 9.60, 9.22, 9.87], 96.7, true],
  ["C28", "Perlisten R", "4× PB-3000 R", "Trinnov + amps", "JVC NZ800", 90.8, [9.72, 9.78, 9.74, 9.80, 9.28, 9.95], 97.5, true],
  ["C29", "JBL Synthesis SCL", "4× PB-3000 R", "Trinnov + amps", "JVC NZ800", 74.0, [9.46, 9.78, 9.34, 9.80, 9.22, 9.74], 96.0, false],
  ["C30", "Perlisten R", "4× PB-3000 R", "Trinnov + amps", "Sony Bravia Projector 8", 92.6, [9.72, 9.78, 9.74, 9.45, 9.28, 9.84], 96.6, false],
];

const A_NOTES: Record<string, Partial<Config>> = {
  C05: { tier: "Best lower-cost", critique: "Shows how little it takes to reach a serious dedicated cinema. The weakness is speaker headroom and scale against the JBL and 1723 systems, not bass and not picture." },
  C06: { critique: "On the frontier by arithmetic only: +0.2 over C05 for four imported HSU cabinets with worse freight, service and warranty. Practically dominated." },
  C12: { critique: "The X6800H adds a sliver for channel capacity and flexibility. The X3900H processes exactly 7.4.4 with the full Dirac suite. Practically dominated." },
  C15: { critique: "Same as C12: the X6800H premium buys flexibility, not sound, at 7.4.4. Practically dominated." },
  C16: { tier: "The 90% system", critique: "Probably the best pure engineering answer: SCL-6, 7 and 8 are one matched horn family, with angled SCL-8 overheads that suit the lowered ceiling. It wins only if the full SCL package lands at or below about ₹14.5–15 L; above that, switch to Arendal 1723 (C14)." },
  C18: { critique: "Dominated by C19. Seven lakh on bigger subs buys less than ₹3.5 L on the NZ700 once four competent subs are in." },
  C19: { tier: "The knee", critique: "C16 with the NZ700. Native contrast doubles on the specification (40k → 80k:1), and that shows exactly where a black room exposes it: fades, night scenes, highlights on black." },
  C21: { tier: "Upper practical", critique: "Where the slope starts collapsing. Bigger subs and the X6800H add headroom and flexibility this 7.4.4 room doesn't need." },
  C28: { tier: "Reference", critique: "Objectively better, not a better purchase: about 2.7× C16's cost for +5.3 EPI. The difference shows as refinement at extreme levels, not a theatre that feels twice as convincing." },
};

export const STUDY_A: Study = {
  id: "A",
  title: "Study A · 30 configurations",
  short: "A",
  scoreName: "EPI",
  labels: { dialogue: "Dialogue & dynamics", bass: "Bass & six-seat evenness", immersion: "Imaging & immersion", hdr: "HDR & black level", upgrade: "Upgradeability & reliability", synergy: "System synergy" },
  weights: { dialogue: 18, bass: 22, immersion: 18, hdr: 22, upgrade: 8, synergy: 12 },
  uncertainty: 1.5,
  knee: "C19",
  fitsRoom: true,
  roomNote: "Scored for this room: 6.20 × 4.37 m shell, 2.55 m finished ceiling, two rows, 120″ AT screen, 7.4.4.",
  common: "All 30 share 7.4.4, a 120″ Seymour XD AT screen (UF2 if the weave shows from row 1), Apple TV 4K, UMIK + REW, a ventilated rack, online UPS and calibration — a common ₹3.5 L allowance.",
  severeFrom: 45 * L,
  callouts: [
    { id: "C05", tag: "Best lower-cost", dx: 12, dy: 22, anchor: "start" },
    { id: "C16", tag: "90% system", dx: -12, dy: -14, anchor: "end" },
    { id: "C19", tag: "Knee", dx: -4, dy: -18, anchor: "middle" },
    { id: "C21", tag: "Upper practical", dx: 12, dy: 24, anchor: "start" },
    { id: "C28", tag: "Reference", dx: -12, dy: 22, anchor: "end" },
  ],
  dimLabels: { speakers: "Speakers", subs: "Subwoofers", processing: "Processing", picture: "Projector" },
  describe: {
    "Arendal 1961": "3× 1961 Monitor (LCR, vertical behind the screen) · 4× 1961 Surround · 4× 1961 Height",
    "Arendal 1723 S": "3× 1723 Monitor S THX · 4× 1723 Surround S · 4× heights",
    "Arendal 1723": "3× 1723 Monitor THX · 4× 1723 Surround · 4× heights",
    "JBL Synthesis SCL": "3× SCL-6 (LCR, compression driver + HDI horn) · 4× SCL-7 (sides, rears) · 4× SCL-8 angled in-ceiling",
    "KEF R Meta": "KEF R Meta L/C/R and surrounds · KEF in-ceilings",
    "Perlisten R": "3× R5m · 4× R4s · 4× R3ic in-ceiling (THX Dominus-class output)",
    "X3900H + Hypex + ART": "Denon X3900H (11-channel processing, 9 amps) · 3-channel Hypex/Purifi amp on L/C/R · Dirac Live + Bass Control + ART ($799)",
    "X6800H + Hypex + ART": "Denon X6800H (13.4 processing) · Hypex/Purifi L/C/R amp · full Dirac suite",
    "Anthem MRX 1140 / ARC": "Anthem MRX 1140 · ARC Genesis (no ART)",
    "StormAudio Core 16 + amps + ART": "StormAudio ISP Core 16 (Dirac RC + Bass Control + ART) · external amps",
    "Trinnov + amps": "Trinnov Altitude-class processor · premium external multichannel amps",
  },
  configs: A_ROWS.map(([id, speakers, subs, processing, picture, cost, s, stated, p]) => ({
    id, name: `${speakers} · ${subs} · ${processing.split(" + ")[0]} · ${picture}`,
    layout: "7.4.4", cost: Math.round(cost * L), stated, statedPareto: p,
    sub: { dialogue: s[0] * 10, bass: s[1] * 10, immersion: s[2] * 10, hdr: s[3] * 10, upgrade: s[4] * 10, synergy: s[5] * 10 },
    dims: { speakers, subs, processing, picture },
    ...A_NOTES[id],
  })),
  verdict: "Build C16 (₹34 L) for rational spending, or C19 (₹37.5 L) if picture matters enough for ₹3.5 L more. Past ~₹45 L each lakh buys very little.",
};

/* ================================================================ Study B */

/** Unit prices in rupees (INR incl. GST). INS and ACT are priced per lakh of allowance. */
export const B_PRICES: Record<string, { name: string; price: number; cat: "processing" | "speakers" | "subs" | "picture" | "room"; est?: boolean }> = {
  X38: { name: "Denon AVR-X3800H", price: 110000, cat: "processing", est: true },
  X48: { name: "Denon AVR-X4800H", price: 146500, cat: "processing" },
  X68: { name: "Denon AVC-X6800H", price: 239800, cat: "processing" },
  A1H: { name: "Denon AVC-A1H", price: 430000, cat: "processing" },
  C30: { name: "Marantz Cinema 30", price: 490900, cat: "processing" },
  AV10: { name: "Marantz AV10", price: 1159900, cat: "processing" },
  AMP10: { name: "Marantz AMP10", price: 950000, cat: "processing", est: true },
  AVM: { name: "Anthem AVM 90 + MCA 525/325", price: 2200000, cat: "processing", est: true },
  TRN: { name: "Trinnov Altitude CI-16 + mic", price: 1500000, cat: "processing", est: true },
  DLBC: { name: "Dirac Live Full + Bass Control", price: 80000, cat: "processing", est: true },
  XPA3: { name: "Emotiva XPA-3 Gen3 (LCR amp)", price: 170000, cat: "processing", est: true },
  HYP: { name: "Hypex/Purifi multichannel amps (16 ch)", price: 500000, cat: "processing", est: true },
  KQC: { name: "KEF Q Concerto Meta pair", price: 124800, cat: "speakers" },
  KQ6: { name: "KEF Q6 Meta centre", price: 55000, cat: "speakers", est: true },
  QAS: { name: "Q Acoustics surround pair", price: 40000, cat: "speakers", est: true },
  QI80: { name: "Q Acoustics QI 80CP in-ceiling pair", price: 62700, cat: "speakers" },
  K8F: { name: "Klipsch RP-8000F II pair", price: 210000, cat: "speakers" },
  K5C: { name: "Klipsch RP-504C II", price: 75000, cat: "speakers", est: true },
  K5S: { name: "Klipsch RP-502S II pair", price: 60000, cat: "speakers", est: true },
  P7: { name: "Polk Reserve R700 pair", price: 297000, cat: "speakers" },
  P4: { name: "Polk Reserve R400", price: 90000, cat: "speakers" },
  P2: { name: "Polk Reserve R200 pair", price: 84500, cat: "speakers" },
  KR7: { name: "KEF R7 Meta pair", price: 450000, cat: "speakers", est: true },
  KR6: { name: "KEF R6 Meta", price: 200000, cat: "speakers", est: true },
  KR3: { name: "KEF R3 Meta pair", price: 150000, cat: "speakers", est: true },
  KCI: { name: "KEF Ci in-ceiling pair", price: 60000, cat: "speakers", est: true },
  PRO: { name: "Pro-cinema speaker package (JBL SCL / Perlisten class)", price: 2200000, cat: "speakers", est: true },
  PB2P: { name: "SVS PB-2000 Pro", price: 127000, cat: "subs" },
  SB3: { name: "SVS SB-3000", price: 232500, cat: "subs" },
  TAC: { name: "Tactile transducers (6 seats)", price: 150000, cat: "subs", est: true },
  LS12: { name: "Epson EH-LS12000B", price: 340000, cat: "picture" },
  XW5: { name: "Sony VPL-XW5000ES", price: 420000, cat: "picture", est: true },
  NZ5: { name: "JVC DLA-NZ500", price: 460000, cat: "picture" },
  B7: { name: "Sony Bravia Projector 7", price: 507800, cat: "picture" },
  VMX: { name: "Valerion VisionMaster Max (import)", price: 491000, cat: "picture" },
  W58: { name: "BenQ W5800", price: 550000, cat: "picture", est: true },
  NZ7: { name: "JVC DLA-NZ700", price: 750000, cat: "picture", est: true },
  NZ8: { name: "JVC DLA-NZ800", price: 1619000, cat: "picture" },
  NZ9: { name: "JVC DLA-NZ900", price: 2800000, cat: "picture", est: true },
  OLED: { name: "LG 97″ OLED", price: 2000000, cat: "picture", est: true },
  ENVY: { name: "madVR Envy Core", price: 750000, cat: "picture" },
  SCE: { name: "Fixed 16:9 120″ screen", price: 60000, cat: "picture", est: true },
  SCAT: { name: "Grandview 2.35:1 130″ AT woven", price: 140000, cat: "picture", est: true },
  SCP: { name: "Seymour/Stewart premium AT 2.35:1", price: 400000, cat: "picture", est: true },
  SRC1: { name: "Apple TV", price: 15000, cat: "room", est: true },
  SRC2: { name: "Apple TV + Zidoo", price: 50000, cat: "room", est: true },
  SRC3: { name: "Apple TV + Zidoo + UB820 (carried in)", price: 105000, cat: "room", est: true },
  SRC4: { name: "Apple TV + Zidoo + UB9000", price: 130000, cat: "room", est: true },
  INS: { name: "Installation, cabling, mounts (per lakh)", price: 100000, cat: "room" },
  ACT: { name: "Acoustic treatment (per lakh)", price: 100000, cat: "room" },
};

export const CAT_LABEL = { processing: "Processing & amps", speakers: "Speakers", subs: "Subwoofers", picture: "Projector & screen", room: "Sources, install, acoustics" } as const;
export type Cat = keyof typeof CAT_LABEL;

type BRow = {
  id: string; name: string; tier: string; layout: string; parts: Record<string, number>; total: number; overall: number;
  sub: [number, number, number, number, number, number]; pareto: boolean; rationale: string; tradeoffs: string; critique: string;
};

const B_ROWS: BRow[] = [
  { id: "C01", name: "KEF Q entry + Epson", tier: "Entry", layout: "5.1.2", parts: { X38: 1, KQC: 1, KQ6: 1, QAS: 1, QI80: 1, PB2P: 1, LS12: 1, SCE: 1, SRC1: 1, INS: 0.6, ACT: 0.5 }, total: 1045000, overall: 63.1, sub: [68, 60, 60, 62, 60, 70], pareto: true,
    rationale: "Lowest-cost system that is still a real theatre; Q Concerto's Uni-Q gives good dispersion; Epson is the cheapest credible laser projector.", tradeoffs: "One sub cannot even out two rows; 5,000:1-class native contrast is grey in a black room; only 2 heights.", critique: "A starter, not a destination. Put the next ₹1.3 L into a second sub before anything else." },
  { id: "C02", name: "Klipsch RP + Epson, 1 sub", tier: "Entry", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 1, LS12: 1, SCE: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1377000, overall: 66.4, sub: [74, 62, 68, 62, 62, 70], pareto: true,
    rationale: "High-sensitivity horns give effortless dialogue dynamics on AVR power; 4 heights for Atmos.", tradeoffs: "Horn-coloured treble in a bright room; single sub; no AT screen.", critique: "Treat the room first: Klipsch in an untreated room is fatiguing." },
  { id: "C03", name: "Klipsch RP + Epson, dual subs", tier: "Entry+", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 2, LS12: 1, SCE: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1504000, overall: 68.6, sub: [74, 72, 68, 62, 62, 72], pareto: true,
    rationale: "The second sub fixes the worst seat-to-seat problem for ₹1.27 L.", tradeoffs: "Picture remains the weak link.", critique: "Good audio, mediocre blacks: the budget leans too far towards sound for a movie-first room." },
  { id: "C04", name: "Klipsch RP + Sony XW5000ES + AT scope", tier: "Value", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 2, XW5: 1, SCAT: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1664000, overall: 71.5, sub: [75, 72, 71, 70, 62, 73], pareto: true,
    rationale: "Native 4K SXRD, and the AT screen puts the centre on the screen axis.", tradeoffs: "XW5000ES availability in India uncertain; weaker native contrast than JVC; no motorised lens memory for scope.", critique: "Only worth it below ₹4.2 L; otherwise C05 is ₹40k more for clearly better blacks." },
  { id: "C05", name: "Klipsch RP + JVC NZ500 + AT scope", tier: "Value (knee 1)", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 2, NZ5: 1, SCAT: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1704000, overall: 73.9, sub: [75, 72, 71, 79, 62, 74], pareto: true,
    rationale: "JVC's 22–50k:1 measured native contrast plus Frame Adapt HDR is the biggest picture gain per rupee.", tradeoffs: "X3800H limits you to 9 channels; NZ500 has no frame interpolation (BFI only).", critique: "Best lower-cost system. Motion purists may notice judder on pans, but for film that is correct." },
  { id: "C06", name: "C05 with Valerion VisionMaster Max (import)", tier: "Value", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 2, VMX: 1, SCAT: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1735000, overall: 68.7, sub: [75, 72, 71, 60, 62, 70], pareto: false,
    rationale: "Bright RGB laser and Dolby Vision support.", tradeoffs: "3,419:1 measured native; relies on dynamic EBL; import plus 35% duty and no warranty.", critique: "Rejected: costs more than an NZ500 once landed, with about a tenth of the native contrast." },
  { id: "C07", name: "C05 with BenQ W5800", tier: "Value", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 2, W58: 1, SCAT: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1794000, overall: 68.7, sub: [75, 72, 71, 60, 62, 70], pareto: false,
    rationale: "Sharp DLP with good out-of-box colour.", tradeoffs: "DLP-class blacks in a dark room.", critique: "Rejected: pays more for less black-level performance." },
  { id: "C08", name: "C05 with Sony Bravia Projector 7", tier: "Value", layout: "5.1.4", parts: { X38: 1, K8F: 1, K5C: 1, K5S: 1, QI80: 2, PB2P: 2, B7: 1, SCAT: 1, SRC2: 1, INS: 1.0, ACT: 1.2 }, total: 1752000, overall: 73.1, sub: [75, 72, 71, 76, 62, 74], pareto: false,
    rationale: "Excellent XR processing and tone mapping, sharp native 4K.", tradeoffs: "About 14–16k:1 native contrast against the JVC's 22k+; manual lens; no 3D.", critique: "A fine projector, but in a light-controlled room the JVC's black floor wins, and the JVC is cheaper in India." },
  { id: "C11", name: "Polk Reserve 5.2.4 + X4800H + NZ500", tier: "Mid", layout: "5.2.4", parts: { X48: 1, P7: 1, P4: 1, P2: 1, QI80: 2, PB2P: 2, NZ5: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 2102000, overall: 75.6, sub: [77, 74, 73, 79, 68, 76], pareto: true,
    rationale: "Smoother Polk voicing, better treatment, Dirac-upgradable AVR.", tradeoffs: "Only 5 ear-level channels in a 20 ft room leaves a gap behind the rear row.", critique: "On the frontier by arithmetic, but C09 adds side and rear surrounds for ₹27k more. Skip." },
  { id: "C09", name: "Klipsch RP 7.2.4 + X6800H + NZ500", tier: "Mid", layout: "7.2.4", parts: { X68: 1, K8F: 1, K5C: 1, K5S: 2, QI80: 2, PB2P: 2, NZ5: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 2129000, overall: 76.8, sub: [78, 74, 77, 79, 72, 76], pareto: true,
    rationale: "Full 7.x.4 bed; high-sensitivity LCR gives near-reference headroom on AVR power.", tradeoffs: "Klipsch tonal signature; dual subs only.", critique: "Statistically tied with C10. Choose on voicing: Klipsch for punch, Polk for smoothness." },
  { id: "C10", name: "Polk Reserve 7.2.4 + X6800H + dual PB-2000 Pro + NZ500 (prior rec.)", tier: "Mid", layout: "7.2.4", parts: { X68: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 2, NZ5: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 2280000, overall: 77.2, sub: [78, 74, 78, 79, 72, 78], pareto: true,
    rationale: "Balanced, well-integrated system; every part sold with Indian warranty.", tradeoffs: "Two subs in a two-row room on a riser leave audible seat-to-seat variation.", critique: "Sound, but not the knee. The next ₹5.2 L (two more subs, A1H, Dirac) is worth more than a projector upgrade." },
  { id: "C12", name: "C10 with JVC NZ700", tier: "Mid+", layout: "7.2.4", parts: { X68: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 2, NZ7: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 2570000, overall: 78.4, sub: [78, 74, 78, 84, 72, 78], pareto: true,
    rationale: "Gen3 panels, about 20–25% more real light, P3 filter.", tradeoffs: "NZ700 India price is an estimate; bass is still the bottleneck.", critique: "Spends ₹2.9 L on picture while bass stays mediocre. C13 is the better way to spend it." },
  { id: "C13", name: "Polk 7.4.4 + Denon A1H + Dirac LBC + quad PB-2000 Pro + NZ500", tier: "Upper-mid (knee 2, recommended)", layout: "7.4.4", parts: { A1H: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 4, DLBC: 1, NZ5: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 2804000, overall: 81.1, sub: [80, 86, 80, 79, 78, 82], pareto: true,
    rationale: "Four subs at mid-wall and corners with Dirac Bass Control give even bass across both rows; the A1H's 15 channels leave room for 9.4.6.", tradeoffs: "The ₹4.3 L A1H price is a backordered listing; four subs need floor space.", critique: "Best overall value. Get the A1H price in writing; at MRP this falls back towards C10's value." },
  { id: "C16", name: "C13 with Sony Bravia 7", tier: "Upper-mid", layout: "7.4.4", parts: { A1H: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 4, DLBC: 1, B7: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 2852000, overall: 80.3, sub: [80, 86, 80, 76, 78, 82], pareto: false,
    rationale: "Sony processing.", tradeoffs: "Lower native contrast, higher price.", critique: "Rejected." },
  { id: "C14", name: "C13 with JVC NZ700", tier: "Upper-mid", layout: "7.4.4", parts: { A1H: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 4, DLBC: 1, NZ7: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 3094000, overall: 82.3, sub: [80, 86, 80, 84, 78, 82], pareto: true,
    rationale: "Brightness headroom for the AT screen and an ageing laser.", tradeoffs: "₹2.9 L for about 1.2 points.", critique: "Best step-up if you value HDR punch; get a firm NZ700 dealer quote." },
  { id: "C15", name: "C14 with Marantz Cinema 30", tier: "Upper-mid", layout: "7.4.4", parts: { C30: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 4, DLBC: 1, NZ7: 1, SCAT: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 3155000, overall: 82.3, sub: [80, 86, 80, 84, 78, 82], pareto: false,
    rationale: "Same platform, Marantz voicing, 11 channels.", tradeoffs: "Fewer channels than the A1H for more money.", critique: "Rejected unless the A1H deal disappears." },
  { id: "C17", name: "KEF R Meta 7.4.4 + A1H + Dirac + quad PB-2000 Pro + NZ700", tier: "High", layout: "7.4.4", parts: { A1H: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 2, PB2P: 4, DLBC: 1, NZ7: 1, SCAT: 1, SRC3: 1, INS: 2.0, ACT: 3.0 }, total: 3583000, overall: 84.1, sub: [84, 86, 84, 84, 78, 84], pareto: true,
    rationale: "Uni-Q point-source dispersion covers both rows evenly; timbre-matched surrounds improve pans.", tradeoffs: "KEF R prices are estimates; ~87 dB sensitivity limits rear-row headroom on AVR power.", critique: "A real clarity upgrade over Polk, especially off-axis for row 2." },
  { id: "C18", name: "C17 + Emotiva XPA-3 on LCR", tier: "High (90% point)", layout: "7.4.4", parts: { A1H: 1, XPA3: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 2, PB2P: 4, DLBC: 1, NZ7: 1, SCAT: 1, SRC3: 1, INS: 2.0, ACT: 3.0 }, total: 3753000, overall: 84.6, sub: [86, 86, 84, 84, 78, 85], pareto: true,
    rationale: "External LCR power fixes the −6 dB headroom shortfall and frees A1H channels for 7.4.6 later.", tradeoffs: "Imported amp, no Indian warranty, 120/230 V selection needed.", critique: "About 90% of maximum at about 34% of the flagship's cost. The rational stopping point for most buyers." },
  { id: "C26", name: "C13 with a 97″ OLED instead of the projector", tier: "Alt display", layout: "7.4.4", parts: { A1H: 1, P7: 1, P4: 1, P2: 2, QI80: 2, PB2P: 4, DLBC: 1, OLED: 1, SRC3: 1, INS: 1.5, ACT: 2.5 }, total: 4204000, overall: 80.0, sub: [80, 86, 72, 86, 74, 72], pareto: false,
    rationale: "Perfect blacks and far higher HDR peak brightness.", tradeoffs: "97″ is small at 11 ft; the centre can't sit behind the screen; TVs are excluded from the baggage allowance.", critique: "Rejected for a dedicated cinema: loses scale and on-axis dialogue for ₹14 L more." },
  { id: "C19", name: "KEF R 7.4.6 + A1H + amp + quad SB-3000 + NZ700", tier: "High+", layout: "7.4.6", parts: { A1H: 1, XPA3: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 3, SB3: 4, DLBC: 1, NZ7: 1, SCAT: 1, SRC3: 1, INS: 2.0, ACT: 3.0 }, total: 4235000, overall: 85.8, sub: [86, 90, 86, 84, 78, 85], pareto: true,
    rationale: "Sealed 13″ subs give tighter transients and more headroom; six heights suit a 12 ft ceiling.", tradeoffs: "₹4.2 L on subs for tactile tightness more than depth.", critique: "For someone sensitive to bass quality; otherwise stop at C18." },
  { id: "C20", name: "C19 with JVC NZ800", tier: "Premium", layout: "7.4.6", parts: { A1H: 1, XPA3: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 3, SB3: 4, DLBC: 1, NZ8: 1, SCAT: 1, SRC3: 1, INS: 2.0, ACT: 3.0 }, total: 5104000, overall: 87.3, sub: [86, 90, 86, 90, 78, 85], pareto: true,
    rationale: "Brighter laser, better lens and 8K e-shift; the best practical JVC.", tradeoffs: "₹8.7 L for 1.5 points.", critique: "Diminishing returns turn severe from here." },
  { id: "C21", name: "Marantz AV10 + AMP10, KEF R 7.4.6, quad SB-3000, NZ800", tier: "Premium", layout: "7.4.6", parts: { AV10: 1, AMP10: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 3, SB3: 4, DLBC: 1, NZ8: 1, SCAT: 1, SRC3: 1, INS: 2.0, ACT: 3.0 }, total: 6614000, overall: 87.9, sub: [88, 90, 86, 90, 80, 86], pareto: true,
    rationale: "200 W/ch across 16 channels, separates.", tradeoffs: "Same DSP family as the A1H; ₹15 L for 0.6 points.", critique: "Poor value; the headroom gain is marginal at this size." },
  { id: "C27", name: "Anthem AVM 90 + MCA, KEF R 7.4.6, quad SB-3000, NZ800", tier: "Premium", layout: "7.4.6", parts: { AVM: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 3, SB3: 4, NZ8: 1, SCAT: 1, SRC3: 1, INS: 2.0, ACT: 3.0 }, total: 6624000, overall: 87.5, sub: [88, 90, 86, 90, 72, 86], pareto: false,
    rationale: "ARC Genesis is strong for bass.", tradeoffs: "Thin India service network; estimated pricing.", critique: "Rejected." },
  { id: "C22", name: "Trinnov Altitude CI-16 + Hypex/Purifi, KEF R 7.4.6, quad SB-3000, NZ800, premium AT", tier: "Flagship-entry", layout: "7.4.6", parts: { TRN: 1, HYP: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 3, SB3: 4, NZ8: 1, SCP: 1, SRC4: 1, INS: 3.5, ACT: 6.0 }, total: 7159000, overall: 89.9, sub: [89, 93, 89, 90, 84, 90], pareto: true,
    rationale: "Trinnov's 3D-mic optimiser and speaker remapping, with pro-designed acoustics.", tradeoffs: "Trinnov CI India price is an estimate; needs a Trinnov-competent calibrator.", critique: "The best processor upgrade, but only with the room acoustics done properly. A used Altitude 16 was listed in Hyderabad — worth checking." },
  { id: "C25", name: "C22 + madVR Envy Core", tier: "Flagship", layout: "7.4.6", parts: { TRN: 1, HYP: 1, KR7: 1, KR6: 1, KR3: 2, KCI: 3, SB3: 4, NZ8: 1, ENVY: 1, SCP: 1, SRC4: 1, INS: 3.5, ACT: 6.0 }, total: 7909000, overall: 90.9, sub: [89, 93, 89, 94, 84, 90], pareto: true,
    rationale: "Best-in-class HDR tone mapping.", tradeoffs: "Imported, no Indian warranty.", critique: "The most cost-effective flagship picture upgrade — better value than moving to the NZ900." },
  { id: "C24", name: "Trinnov + pro-cinema speakers + NZ800 + Envy + Stewart + full acoustics + tactile", tier: "Flagship", layout: "7.4.6", parts: { TRN: 1, HYP: 1.2, PRO: 1, SB3: 4, NZ8: 1, ENVY: 1, SCP: 1.5, SRC4: 1, INS: 4.0, ACT: 10.0, TAC: 1 }, total: 9879000, overall: 93.1, sub: [93, 95, 93, 94, 84, 92], pareto: true,
    rationale: "Cinema-grade constant-directivity LCR behind the AT screen.", tradeoffs: "All prices are estimates; long lead times.", critique: "For buyers without a budget ceiling." },
  { id: "C23", name: "C24 with JVC NZ900", tier: "Flagship max", layout: "7.4.6", parts: { TRN: 1, HYP: 1.2, PRO: 1, SB3: 4, NZ9: 1, ENVY: 1, SCP: 1.5, SRC4: 1, INS: 4.0, ACT: 10.0, TAC: 1 }, total: 11060000, overall: 93.9, sub: [93, 95, 93, 97, 84, 92], pareto: true,
    rationale: "Top JVC for peak contrast and brightness.", tradeoffs: "₹11.8 L for 0.8 points over C24.", critique: "Maximum performance, minimum value." },
];

/** A category's parts as a stable label, for spotting single-component swaps. */
function catSig(parts: Record<string, number>, cat: Cat) {
  return Object.entries(parts)
    .filter(([k]) => B_PRICES[k].cat === cat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, q]) => (k === "INS" ? `Install ₹${q} L` : k === "ACT" ? `Acoustics ₹${q} L` : `${q !== 1 ? `${q}× ` : ""}${B_PRICES[k].name}`))
    .join(" + ");
}

export function partsCost(parts: Record<string, number>) {
  return Object.entries(parts).reduce((a, [k, q]) => a + B_PRICES[k].price * q, 0);
}

export function costByCat(parts: Record<string, number>): Record<Cat, number> {
  const out = { processing: 0, speakers: 0, subs: 0, picture: 0, room: 0 } as Record<Cat, number>;
  for (const [k, q] of Object.entries(parts)) out[B_PRICES[k].cat] += B_PRICES[k].price * q;
  return out;
}

export const STUDY_B: Study = {
  id: "B",
  title: "Study B · 27 configurations",
  short: "B",
  scoreName: "Score",
  labels: { dialogue: "Dialogue & dynamics", bass: "Bass & seat consistency", immersion: "Imaging & immersion", hdr: "HDR & black level", upgrade: "Upgradeability & reliability", synergy: "System synergy" },
  weights: { dialogue: 20, bass: 20, immersion: 20, hdr: 25, upgrade: 5, synergy: 10 },
  uncertainty: 3,
  knee: "C13",
  fitsRoom: false,
  roomNote: "Assumed a 14 × 20 ft room with a 12 ft ceiling and a 130″ 2.35:1 AT screen. This room's finished ceiling is 2.55 m (8.4 ft) and its screen is 120″ 16:9, so the six-height layouts (its C19 and above) and its screen-size reasoning don't transfer. Its itemised Indian prices are the more detailed of the two.",
  common: "Seating, riser, HVAC and lighting excluded (budget ₹2.5–6 L separately). Installation and acoustic-treatment allowances scale by tier and are included.",
  severeFrom: 51 * L,
  callouts: [
    { id: "C05", tag: "Knee 1", dx: -12, dy: -14, anchor: "end" },
    { id: "C13", tag: "Knee 2 · recommended", dx: -12, dy: -16, anchor: "end" },
    { id: "C18", tag: "90% point", dx: 12, dy: 22, anchor: "start" },
    { id: "C20", tag: "Severe returns begin", dx: 12, dy: 22, anchor: "start" },
    { id: "C23", tag: "Maximum", dx: -12, dy: 22, anchor: "end" },
  ],
  dimLabels: { speakers: "Speakers", subs: "Subwoofers", processing: "Processing & amps", picture: "Projector & screen", extras: "Sources, install, acoustics" },
  describe: {},
  configs: B_ROWS.map((r) => ({
    id: r.id, name: r.name, layout: r.layout, cost: r.total, stated: r.overall, statedPareto: r.pareto,
    sub: { dialogue: r.sub[0], bass: r.sub[1], immersion: r.sub[2], hdr: r.sub[3], upgrade: r.sub[4], synergy: r.sub[5] },
    parts: r.parts, tier: r.tier, rationale: r.rationale, tradeoffs: r.tradeoffs, critique: r.critique,
    dims: {
      speakers: catSig(r.parts, "speakers"),
      subs: catSig(r.parts, "subs"),
      processing: catSig(r.parts, "processing"),
      picture: catSig(r.parts, "picture"),
      extras: catSig(r.parts, "room"),
    },
  })),
  verdict: "Build C13 (₹28 L) if the ₹4.3 L A1H price holds in writing; C18 (₹37.5 L) is its 90% point. Never accept a DLP or 3LCD projector in a black room when an NZ500 costs within ₹1 L.",
};

export const STUDIES = [STUDY_A, STUDY_B];

/* =========================================================== arithmetic */

export function score(sub: Subs, w: Weights) {
  const total = SUB_KEYS.reduce((a, k) => a + w[k], 0) || 1;
  return Math.round((SUB_KEYS.reduce((a, k) => a + sub[k] * w[k], 0) / total) * 10) / 10;
}

export interface Point extends Config { score: number; pareto: boolean }

export function evaluate(study: Study, w: Weights): Point[] {
  const pts = study.configs.map((c) => ({ ...c, score: score(c.sub, w), pareto: false }));
  // Strictly dominated: another option costs no more and scores at least as much, better on one.
  for (const p of pts) {
    p.pareto = !pts.some((q) => q !== p && q.cost <= p.cost && q.score >= p.score && (q.cost < p.cost || q.score > p.score));
  }
  return pts;
}

export const frontier = (pts: Point[]) => pts.filter((p) => p.pareto).sort((a, b) => a.cost - b.cost);

/** The frontier point furthest above the straight line from its cheapest to its best point. */
export function knee(front: Point[]) {
  if (front.length < 3) return front[front.length - 1];
  const a = front[0], b = front[front.length - 1];
  const nx = (p: Point) => (p.cost - a.cost) / (b.cost - a.cost);
  const ny = (p: Point) => (p.score - a.score) / (b.score - a.score || 1);
  return front.reduce((best, p) => (ny(p) - nx(p) > ny(best) - nx(best) ? p : best), front[0]);
}

export function bestUnder(pts: Point[], budget: number) {
  return pts.filter((p) => p.cost <= budget).sort((a, b) => b.score - a.score || a.cost - b.cost)[0];
}

/** Points gained per ₹1 lakh for each step along the frontier. */
export function steps(front: Point[]) {
  return front.slice(1).map((p, i) => {
    const q = front[i];
    return { from: q, to: p, dCost: p.cost - q.cost, dScore: Math.round((p.score - q.score) * 10) / 10, perLakh: (p.score - q.score) / ((p.cost - q.cost) / L) };
  });
}

export interface Move {
  dim: Dim;
  from: string;
  to: string;
  pairs: [string, string][];
  dCost: number;
  dScore: number;
  perLakh: number;
}

/**
 * Every single-component swap in the study: two configurations that differ in
 * exactly one dimension. Identical swaps seen in several places are averaged.
 */
export function moves(pts: Point[], dims: Dim[]): Move[] {
  const map = new Map<string, { dim: Dim; from: string; to: string; pairs: [string, string][]; dc: number[]; ds: number[] }>();
  for (const a of pts) for (const b of pts) {
    if (a === b || b.cost <= a.cost) continue;
    const diff = dims.filter((d) => (a.dims[d] ?? "") !== (b.dims[d] ?? ""));
    if (diff.length !== 1) continue;
    const d = diff[0];
    const key = `${d}|${a.dims[d]}|${b.dims[d]}`;
    const m = map.get(key) ?? { dim: d, from: a.dims[d] ?? "", to: b.dims[d] ?? "", pairs: [], dc: [], ds: [] };
    m.pairs.push([a.id, b.id]); m.dc.push(b.cost - a.cost); m.ds.push(b.score - a.score);
    map.set(key, m);
  }
  return [...map.values()].map((m) => {
    const dCost = m.dc.reduce((x, y) => x + y, 0) / m.dc.length;
    const dScore = m.ds.reduce((x, y) => x + y, 0) / m.ds.length;
    return { dim: m.dim, from: m.from, to: m.to, pairs: m.pairs, dCost, dScore: Math.round(dScore * 10) / 10, perLakh: dScore / (dCost / L) };
  }).sort((a, b) => b.perLakh - a.perLakh);
}

export const sameWeights = (a: Weights, b: Weights) => SUB_KEYS.every((k) => a[k] === b[k]);
