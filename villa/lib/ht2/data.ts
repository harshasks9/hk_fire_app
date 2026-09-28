import type { HtDataset } from "@/lib/ht/dataset";
import { ceilingImpact, H } from "@/lib/ht/geometry";
import { evaluate, frontier, knee } from "@/lib/ht/pareto";
import { CATALOG2 } from "./catalog";
import { allConfigs, makeStudy, RECOMMENDED_ID, CAP, PICTURE, SPEAKERS, SUBS, PROCESSING, TREATMENT } from "./model";
import { P } from "./prices";
import { ROBUST, recRisk, recWinShare } from "./robust";
import {
  MARKERS2, RACK2, RACK2_U, AUDIO2, VIDEO2, FLOW_NOTES2, SCENARIOS2, LOW_RETURN2, IMPORT_RULES2,
  MARKET2, DO_NOT_IMPORT2, OPPORTUNISTIC2, CHAINS2,
} from "./system";
import { ASSUMPTIONS } from "./assumptions";
import { referenceConfigs, referenceTable, PRICED } from "./reference";

const L = 1e5;
const lakh = (v: number) => `₹${(v / L).toFixed(2)} L`;
const configs = allConfigs();
const draft = makeStudy(configs);
const pts = evaluate(draft, draft.weights);
const front = frontier(pts);
const valueKnee = knee(front);
const rec = pts.find((p) => p.id === RECOMMENDED_ID)!;
const edge = pts.filter((p) => p.cost < CAP).sort((a, b) => b.score - a.score)[0];
const klipsch = pts.find((p) => p.id === RECOMMENDED_ID.replace("S3", "S4"))!;
const nz700 = pts.find((p) => p.id === RECOMMENDED_ID.replace(/^P3/, "P4"))!;
const CONTINGENCY = P.CTG.price;

const menu: Record<string, { id: string; label: string; short: string }[]> = { picture: PICTURE, speakers: SPEAKERS, subs: SUBS, processing: PROCESSING, extras: TREATMENT };
const pick: Record<string, string> = { picture: RECOMMENDED_ID.slice(0, 2), speakers: RECOMMENDED_ID.slice(2, 4), subs: RECOMMENDED_ID.slice(4, 6), processing: RECOMMENDED_ID.slice(6, 8), extras: RECOMMENDED_ID.slice(8, 10) };
const dimTitle: Record<string, string> = { picture: "Projector", speakers: "Speakers", subs: "Subwoofers", processing: "Processing", extras: "Acoustic treatment" };

const REF = referenceTable();
const refVideo = REF.rows[0];

export const STUDY2 = makeStudy(configs, {
  configs: [...configs, ...referenceConfigs()],
  knee: RECOMMENDED_ID,
  reference: {
    title: "The theatre from the video, scored part by part",
    note: `Each of its parts swapped into the recommended system on its own, then the whole system — all scored by the same room model, in this room, at Indian dealer prices. Its 200″ screen can't fit the 4.13 m wall, so the whole-system score keeps the 120″ screen. As built here it lands at ${lakh(refVideo.cost)} and ${refVideo.score.toFixed(1)}, against ${lakh(REF.base.cost)} and ${REF.base.score.toFixed(1)} for the recommendation.`,
    base: { cost: REF.base.cost, score: REF.base.score },
    rows: REF.rows,
    unpriced: REF.unpriced,
    prices: PRICED.map((p) => ({ name: p.name, price: p.price, source: p.source, est: p.est })),
  },
  callouts: [
    { id: "REF-VIDEO", tag: "Video theatre (reference)", dx: 12, dy: 18, anchor: "start" },
    { id: RECOMMENDED_ID, tag: "Recommended", dx: -14, dy: -20, anchor: "end" },
    { id: valueKnee.id, tag: "Value knee", dx: -12, dy: 20, anchor: "end" },
    ...(edge.id !== RECOMMENDED_ID ? [{ id: edge.id, tag: "Best at the cap (no margin)", dx: 12, dy: -14, anchor: "start" as const }] : []),
    { id: nz700.id, tag: "Same with NZ700 (over the cap)", dx: 12, dy: 24, anchor: "start" },
  ],
  verdict: `Build ${RECOMMENDED_ID}: JVC NZ500, KEF Q Concerto Meta 7.x.4 with KEF Ci200ER overheads, 2× SVS PB-1000 Pro in front and 2× sealed SB-1000 Pro at the rear, Denon X6800H + Dirac, and treatment built to a written spec — ${lakh(rec.cost - CONTINGENCY)} planned, ${lakh(rec.cost)} with the ₹1 L contingency. It is on the frontier and the single most frequent winner when the model and prices are perturbed. ${edge.id !== RECOMMENDED_ID ? `The system that scores highest at the cap (${edge.id}, ${lakh(edge.cost)}) is only ${(edge.score - rec.score).toFixed(1)} ahead and would eat the contingency in ${Math.round(ROBUST.risk[edge.id]?.eats ?? 0)}% of runs. ` : ""}The Klipsch RP-6000F II version (${klipsch.id}) is a tie at the same price; choose it if you watch near reference from row 2. The value knee (${valueKnee.id}, ${lakh(valueKnee.cost)}) swaps in Polk speakers for ${(rec.score - valueKnee.score).toFixed(1)} points less.`,
  robustness: {
    samples: ROBUST.samples,
    note: `Each run nudges every hand-set constant in the model (±2 points on picture, clarity and immersion; ±1 dB on sensitivity; ±1.5 dB on sub output; ±1.5 on Dirac's credit; ±1 dB of optimisation loss) and every price (±12% on estimates, ±4% on listed prices), then picks the best system that keeps the ₹1 L contingency under ₹30 L. Across ${ROBUST.candidates} contenders the recommended system won ${Math.round(recWinShare)}% of runs — more than any other — and these are the choices that won in each slot.`,
    dims: Object.keys(dimTitle).map((dim) => ({
      label: dimTitle[dim],
      rows: ROBUST.byDim[dim as keyof typeof ROBUST.byDim].filter((r) => r.share >= 1).slice(0, 4).map((r) => ({
        label: menu[dim].find((m) => m.id === r.id)?.short ?? r.id,
        share: r.share,
        pick: r.id === pick[dim],
      })),
    })),
    risk: `Price risk for the recommended system: the spend eats into the contingency in ${Math.round(recRisk.eats)}% of runs and breaks ₹30 L in ${Math.round(recRisk.breaks)}%.`,
  },
});

const impact = ceilingImpact().map((r) =>
  r.k === "Atmos" ? { ...r, note: "Four flush overheads at x = 2.1 and 4.95 m: Dolby's ~45° top-front and top-rear for row 1, and a near-overhead pair (~62°) for row 2. No angled boxes: nothing may hang over the riser walkway." } : r,
);

export const HT2_DATA: HtDataset = {
  key: "ht2",
  basePath: "/ht2",
  title: "Home Theater Room · India",
  tagline: "7.4.4 · under ₹30 L · India-sourced",
  hero: {
    eyebrow: "Rerun from scratch · every part sold in India · strictly under ₹30 L",
    lead: "A 7.4.4 cinema for six seats that ",
    accent: "stays under ₹30 lakh",
    tail: " — and spends it where you'll hear and see it.",
    body: `JVC's native-contrast projector on a 120″ woven AT screen. Seven identical KEF coaxials around the room and four in the ceiling. Four SVS subwoofers — sealed at the back, beside row 2 — tuned together with Dirac Live Bass Control. Treatment built to a measured spec. All from Indian dealers with Indian warranties, at a finished ceiling of ${H.toFixed(2)} m, with ₹1 L held back.`,
    kpis: [
      { k: "With contingency", v: lakh(rec.cost), sub: `${lakh(CAP - rec.cost)} under ₹30 L, after holding ₹1 L back` },
      { k: "Price risk", v: `${Math.round(recRisk.breaks)}%`, sub: `Chance of breaking ₹30 L in ${ROBUST.samples} perturbed runs` },
      { k: "Channels", v: "7.4.4", sub: "Rear pair on the side walls" },
    ],
  },
  catalog: CATALOG2,
  markers: MARKERS2,
  rack: RACK2,
  rackUnits: RACK2_U,
  upsCapacity: 2700,
  projectorWatts: [340, 400],
  flows: { audio: AUDIO2, video: VIDEO2 },
  flowNotes: FLOW_NOTES2,
  chains: CHAINS2,
  impact,
  scenarios: SCENARIOS2,
  lowReturn: LOW_RETURN2,
  importRules: IMPORT_RULES2,
  marketPrices: MARKET2,
  doNotImport: DO_NOT_IMPORT2,
  opportunistic: OPPORTUNISTIC2,
  studies: [{ ...STUDY2, configs: [], gen: "ht2" }],
  assumptions: ASSUMPTIONS,
  addons: true,
  budgetCap: CAP,
  contingency: CONTINGENCY,
  acoustics: {
    target: "0.25–0.35 s, flat 125 Hz–4 kHz, measured",
    legend: [
      ["#4fa79c", "Absorption: baffle cavity at the front; 50 mm panels on a 50 mm gap at the side-wall reflections; 100–150 mm of 48 kg/m³ wool across the rear wall"],
      ["#e5825a", "Bass traps: front corners, floor to ceiling"],
    ],
  },
  budgetNote: "Includes the screen, sources, UPS, rack, cabling, baffle wall, hush box, treatment, installation, earthing and calibration. Excludes civil works, isolation, HVAC, seating and the riser. Figures marked est. need a written quote.",
  heads: {
    assumptions: { eyebrow: "Assumptions tested", title: "Every assumption re-derived — and the flaws the review found", sub: "What the first design took for granted, checked from first principles for a ₹30 L India-only build. Items marked 'Review correction' are flaws an independent review found in this page's own first draft, and how they were fixed." },
    pareto: { eyebrow: "Pareto options", title: `All ${configs.length} combinations, cost against performance`, sub: "Every coherent system from the menu of India-available parts, costed at Indian street prices and scored by an explicit model. The red line is the ₹30 L cap. Re-weight what matters, set a budget, and compare any three." },
    addons: { eyebrow: "Room build & add-ons", title: "The room around the system, and what to add to it", sub: "Surface by surface — the terrace slab and ceiling, the screen wall, the side and rear walls, the floor and riser, the door, the air and the power: what the sound does at each one, how it is built layer by layer, and how to check it before it's paid for. Then twelve small add-ons, priced and scored against the ₹30 L cap." },
    room: { eyebrow: "Room views", title: "Where everything goes", sub: `Plan, front and side elevations and a 3D model at the ${H.toFixed(2)} m ceiling — 7.4.4 with the rear pair on the side walls, L/C/R on stands behind a baffle wall, and overheads at Dolby's 45° for row 1.` },
    flow: { eyebrow: "Signal flow", title: "Every cable, from source to seat", sub: "One receiver drives all eleven speakers; four powered subs on their own sub outputs and a dedicated earth; the picture path through the receiver to the projector." },
    rack: { eyebrow: "AV rack", title: `The ${RACK2_U}U rack, unit by unit`, sub: "Physical order, vent gaps, the tower UPS in the base, power budget and heat." },
    compare: { eyebrow: "Compare", title: "Put two or three options side by side", sub: "Every alternative here is sold in India. Each row says what the difference actually is." },
    budget: { eyebrow: "Budget impact", title: "Inside the cap, with ₹1 L held back", sub: "What the margin is for, what to cut first if prices move, and what ₹35 L or ₹40 L would change." },
    buy: { eyebrow: "Procurement", title: "Everything from Indian dealers", sub: "Where to buy each part, the prices that decide the cap, and what never to import." },
  },
  footer: "Prices are Indian street prices from dealer listings and quotes, September 2026, GST included; items marked est. could not be seen on a live listing — get them in writing. Measurements from Erin's Audio Corner, Audio Science Review, Projector Central, Projector Reviews and published CEA-2010 subwoofer data. Scores come from an explicit model of the room (lib/ht2/model.ts), not from listening in it. An independent review of the first draft found thirteen flaws; the fixes are listed under Assumptions tested.",
  compareDefault: { component: "lcr", ids: ["kef-qc-lcr", "rp6000", "polk-r200"] },
  backLink: { href: "/ht", label: "Original /ht ↗" },
};
