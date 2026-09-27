import { CATALOG } from "./catalog";
import { MARKERS, H, ceilingImpact } from "./geometry";
import {
  RACK, RACK_U, PROJECTOR_WATTS, AUDIO_FLOW, VIDEO_FLOW, SCENARIOS, LOW_RETURN, EVALUATOR_REBALANCE,
  IMPORT_RULES, MARKET_PRICES, DO_NOT_IMPORT, OPPORTUNISTIC,
} from "./system";
import { STUDIES } from "./pareto";
import type { HtDataset } from "./dataset";

/** The original Home Theater Room (/ht): the 9.4.6 recommendation. */
export const HT_DATA: HtDataset = {
  key: "ht",
  basePath: "/ht",
  title: "Home Theater Room",
  tagline: "Villa 14 · 9.4.6",
  hero: {
    eyebrow: "Villa 14 · second floor · south-west corner · Hyderabad",
    lead: "A 9.4.6 private cinema on a 120-inch screen, ",
    accent: "tuned for six seats",
    tail: ", not one.",
    body: `Arendal THX fronts behind an acoustically transparent screen. Four sealed 18-inch subwoofers placed to cancel the room's bass modes. A JVC native-4K laser projector on the rear wall. A Denon A1H with Dirac Live Bass Control and ART. Everything below is recalculated for the finished ceiling at ${H.toFixed(2)} m, 8 inches lower than planned.`,
    kpis: [],
  },
  catalog: CATALOG,
  markers: MARKERS,
  rack: RACK,
  rackUnits: RACK_U,
  upsCapacity: 2700,
  projectorWatts: PROJECTOR_WATTS,
  flows: { audio: AUDIO_FLOW, video: VIDEO_FLOW },
  flowNotes: [
    { title: "HDMI path", body: "Every source goes into the Denon, never straight to the projector, so audio always bitstreams and there is one video path to debug. One 15 m fibre HDMI (directional, labelled at both ends) runs through the ceiling void to the rear shelf; a second is pulled as a spare before the ceiling closes." },
    { title: "Subwoofer outputs", body: "The Denon's four sub outputs are set independently by Dirac Bass Control and go to one amplifier channel each. The high-pass (12–15 Hz) and limiter for each sealed 18″ live in the amplifiers' DSP, not the Denon." },
    { title: "Power & triggers", body: "The Denon's 12 V trigger wakes the Buckeye and the sequenced PDU, and the PDU brings the sub amps up last and drops them first — no thump. The rack and projector run through the online UPS; the sub amps sit on their own 20 A circuit, off the UPS." },
  ],
  chains: [
    { t: "Sound", steps: [["streamer", "Apple TV · UB820"], ["avr", "Denon A1H + Dirac"], ["amps", "Buckeye · NX6000D"], ["lcr", "9 speakers · 6 overheads · 4 subs"]] },
    { t: "Picture", steps: [["streamer", "Apple TV · UB820"], ["avr", "Denon A1H"], ["projector", "JVC NZ700"], ["screen", "120″ Seymour XD"]] },
    { t: "Power", steps: [["ups", "Dedicated circuits"], ["ups", "3 kVA online UPS"], ["ups", "Sequenced PDU"], ["rack", "27U rack, closet"]] },
  ],
  impact: ceilingImpact(),
  scenarios: SCENARIOS,
  lowReturn: LOW_RETURN,
  rebalance: EVALUATOR_REBALANCE,
  importRules: IMPORT_RULES,
  marketPrices: MARKET_PRICES,
  doNotImport: DO_NOT_IMPORT,
  opportunistic: OPPORTUNISTIC,
  studies: STUDIES,
  heads: {
    pareto: { eyebrow: "Pareto options", title: "Every complete system, cost against performance", sub: "Two independent studies of whole-system options. Find the frontier and its knee, set a budget, re-weight what matters to you, see what each single upgrade buys, and compare any three systems side by side." },
    room: { eyebrow: "Room views", title: "Where everything goes, to the centimetre", sub: `Plan, front and side elevations and a 3D model at the revised ${H.toFixed(2)} m ceiling. Turn layers on and off; click any speaker, sub, the screen or the projector.` },
    flow: { eyebrow: "Signal flow", title: "Every cable, from source to seat", sub: "HDMI, line level, speaker runs, subwoofer outputs, Ethernet, 12 V triggers and power — with cable types, lengths and where each box lives." },
    rack: { eyebrow: "AV rack", title: "The 27U rack, unit by unit", sub: "Physical order, vent gaps, power budget, heat and cable management. Click a unit for its product details." },
    compare: { eyebrow: "Compare", title: "Put two or three options side by side", sub: "Price, output, distortion, directivity, bass, HDR, blacks, room correction, reliability, warranty and import — each as a plain statement of the difference." },
    budget: { eyebrow: "Budget impact", title: "What more money actually buys", sub: "Where the next ₹2 L, ₹5 L and ₹10 L make the biggest difference — and where spending more changes almost nothing." },
    buy: { eyebrow: "Procurement", title: "What to buy, and where", sub: "Organised by country, with the saving thresholds for imports and the list of things never to import." },
  },
  footer: "Prices are landed estimates at ₹96/USD (late September 2026); items marked est. could not be checked against a live listing. Measurements come from Audio Science Review, Erin's Audio Corner, spinorama.org, data-bass, Audioholics, Projector Central, Projector Reviews and Simple Home Cinema, via their published reviews. Room geometry and acoustics are computed from the finished dimensions; confirm on site before ordering.",
  compareDefault: { component: "projector", ids: ["jvc-nz700", "jvc-nz500", "jvc-nz800"] },
  backLink: { href: "/villa/sf-theatre", label: "Villa app ↗" },
};
