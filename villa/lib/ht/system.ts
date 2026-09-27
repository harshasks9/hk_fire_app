import { CATALOG, byId, recommended } from "./catalog";
import type { Buy, Component } from "./types";

/* ================================================================= rack */

export type RackKind = "device" | "vent" | "fan" | "cable" | "power" | "network" | "shelf";

export interface RackUnit {
  /** Lowest rack unit it occupies (1 = bottom). */
  u: number;
  h: number;
  label: string;
  sub?: string;
  kind: RackKind;
  component?: string;
  /** Watts drawn: typical during a loud film / maximum. */
  watts?: [number, number];
  /** Whether it runs through the UPS. */
  ups?: boolean;
}

export const RACK_U = 27;

export const RACK: RackUnit[] = [
  { u: 27, h: 1, label: "Fan tray", sub: "Thermostatic, exhausts up and out of the closet", kind: "fan", component: "rack", watts: [20, 30], ups: true },
  { u: 26, h: 1, label: "Vent panel", kind: "vent" },
  { u: 25, h: 1, label: "Network switch", sub: "8-port managed gigabit + RF remote hub", kind: "network", component: "network", watts: [12, 15], ups: true },
  { u: 24, h: 1, label: "Patch panel", sub: "Cat6 × 4 and fibre HDMI bulkheads to the room", kind: "cable", component: "cabling" },
  { u: 23, h: 1, label: "Vent panel", kind: "vent" },
  { u: 21, h: 2, label: "Source shelf", sub: "Apple TV 4K · Panasonic DP-UB820", kind: "shelf", component: "streamer", watts: [25, 35], ups: true },
  { u: 20, h: 1, label: "Vent gap", sub: "Heat from the AVR rises here", kind: "vent" },
  { u: 14, h: 6, label: "Denon AVC-A1H", sub: "15.4 AV receiver · Dirac Live + Bass Control + ART", kind: "device", component: "avr", watts: [300, 710], ups: true },
  { u: 13, h: 1, label: "Vent gap", kind: "vent" },
  { u: 11, h: 2, label: "Buckeye NC502MP", sub: "8 × 350 W · L/C/R, wides, sides", kind: "device", component: "amps", watts: [200, 900], ups: true },
  { u: 10, h: 1, label: "Vent gap", kind: "vent" },
  { u: 9, h: 1, label: "Behringer NX6000D #1", sub: "SW1 front-left · SW2 front-right", kind: "device", component: "subamps", watts: [150, 1500], ups: false },
  { u: 8, h: 1, label: "Vent gap", kind: "vent" },
  { u: 7, h: 1, label: "Behringer NX6000D #2", sub: "SW3 rear-left · SW4 rear-right", kind: "device", component: "subamps", watts: [150, 1500], ups: false },
  { u: 6, h: 1, label: "Vent gap", kind: "vent" },
  { u: 5, h: 1, label: "Sequenced PDU", sub: "230 V, 12 V trigger from the Denon; sub amps on their own circuit", kind: "power", component: "ups", watts: [5, 5], ups: true },
  { u: 4, h: 1, label: "Brush panel", sub: "Cable management, rear service loop", kind: "cable", component: "cabling" },
  { u: 3, h: 1, label: "Vent gap", kind: "vent" },
  { u: 1, h: 2, label: "APC SRV 3 kVA online UPS", sub: "Heaviest at the bottom · batteries internal", kind: "power", component: "ups", watts: [60, 120], ups: false },
];

/** The projector sits in the room but draws from the rack UPS through its own circuit. */
export const PROJECTOR_WATTS: [number, number] = [380, 440];

export function rackPower() {
  const onUps = RACK.filter((r) => r.ups && r.watts);
  const typ = onUps.reduce((a, r) => a + r.watts![0], 0) + PROJECTOR_WATTS[0];
  const peak = onUps.reduce((a, r) => a + r.watts![1], 0) + PROJECTOR_WATTS[1];
  const subs = RACK.filter((r) => r.component === "subamps").reduce((a, r) => a + r.watts![1], 0);
  const heat = RACK.filter((r) => r.watts).reduce((a, r) => a + r.watts![0], 0);
  return { typ, peak, capacity: 2700, subsPeak: subs, heatW: heat, heatBtu: Math.round(heat * 3.412) };
}

/* ========================================================== signal flow */

export type EdgeKind = "hdmi" | "line" | "speaker" | "sub" | "network" | "trigger" | "power" | "light";

export const EDGE_LABEL: Record<EdgeKind, string> = {
  hdmi: "HDMI",
  line: "Line level (balanced)",
  speaker: "Speaker cable",
  sub: "Subwoofer line / speaker",
  network: "Ethernet",
  trigger: "12 V trigger",
  power: "Mains power",
  light: "Light",
};

export interface FlowNode {
  id: string;
  label: string;
  sub?: string;
  component?: string;
  loc: string;
  x: number; y: number; w?: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  label?: string;
}

/** Sources → processor → amplification → speakers and subwoofers. */
export const AUDIO_FLOW: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: "atv", label: "Apple TV 4K", component: "streamer", loc: "Rack U21–22", x: 20, y: 60 },
    { id: "ub820", label: "Panasonic UB820", component: "player", loc: "Rack U21–22", x: 20, y: 150 },
    { id: "switch", label: "Network switch", component: "network", loc: "Rack U25", x: 20, y: 300 },
    { id: "umik", label: "UMIK-1 + laptop", sub: "Dirac Live app", component: "mic", loc: "In the room", x: 20, y: 390 },
    { id: "avr", label: "Denon AVC-A1H", sub: "Dirac Live + DLBC + ART", component: "avr", loc: "Rack U14–19", x: 250, y: 180, w: 170 },
    { id: "buckeye", label: "Buckeye NC502MP", sub: "8 × 350 W", component: "amps", loc: "Rack U11–12", x: 500, y: 40 },
    { id: "internal", label: "A1H internal amps", sub: "8 of 15 channels used", component: "avr", loc: "Rack U14–19", x: 500, y: 190 },
    { id: "nx1", label: "NX6000D #1", component: "subamps", loc: "Rack U9", x: 500, y: 330 },
    { id: "nx2", label: "NX6000D #2", component: "subamps", loc: "Rack U7", x: 500, y: 410 },
    { id: "lcr", label: "L / C / R", sub: "Behind the screen", component: "lcr", loc: "Stage", x: 740, y: 0 },
    { id: "wides", label: "Wides", sub: "x 1.9 m", component: "wides", loc: "Side walls", x: 740, y: 60 },
    { id: "sides", label: "Side surrounds", sub: "x 4.4 m", component: "sides", loc: "Side walls", x: 740, y: 120 },
    { id: "rears", label: "Rear surrounds", component: "rears", loc: "Rear corners", x: 740, y: 190 },
    { id: "atmos", label: "6 × Atmos", component: "atmos", loc: "Ceiling", x: 740, y: 250 },
    { id: "sw12", label: "SW1 + SW2", sub: "Front, on the stage", component: "subs", loc: "Stage", x: 740, y: 330 },
    { id: "sw34", label: "SW3 + SW4", sub: "Rear corners, on the riser", component: "subs", loc: "Riser", x: 740, y: 410 },
    { id: "pdu", label: "Sequenced PDU", component: "ups", loc: "Rack U5", x: 250, y: 400, w: 170 },
    { id: "ups", label: "APC 3 kVA UPS", component: "ups", loc: "Rack U1–2", x: 250, y: 480, w: 170 },
  ],
  edges: [
    { from: "atv", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "ub820", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "switch", to: "avr", kind: "network", label: "Cat6" },
    { from: "umik", to: "avr", kind: "network", label: "Wi-Fi / LAN" },
    { from: "avr", to: "buckeye", kind: "line", label: "Pre-outs × 7, 1 m" },
    { from: "avr", to: "internal", kind: "line", label: "Internal" },
    { from: "avr", to: "nx1", kind: "sub", label: "Sub out 1 + 2" },
    { from: "avr", to: "nx2", kind: "sub", label: "Sub out 3 + 4" },
    { from: "avr", to: "buckeye", kind: "trigger", label: "12 V" },
    { from: "avr", to: "pdu", kind: "trigger", label: "12 V" },
    { from: "buckeye", to: "lcr", kind: "speaker", label: "12 AWG, ~12 m" },
    { from: "buckeye", to: "wides", kind: "speaker", label: "12 AWG, ~11 m" },
    { from: "buckeye", to: "sides", kind: "speaker", label: "12 AWG, ~9 m" },
    { from: "internal", to: "rears", kind: "speaker", label: "14 AWG, ~10 m" },
    { from: "internal", to: "atmos", kind: "speaker", label: "14 AWG, 8–13 m" },
    { from: "nx1", to: "sw12", kind: "sub", label: "12 AWG / Speakon, ~13 m" },
    { from: "nx2", to: "sw34", kind: "sub", label: "12 AWG / Speakon, ~8 m" },
    { from: "ups", to: "pdu", kind: "power", label: "UPS output" },
    { from: "pdu", to: "avr", kind: "power", label: "UPS-backed" },
    { from: "pdu", to: "nx1", kind: "power", label: "Sub circuit, not UPS" },
    { from: "pdu", to: "nx2", kind: "power", label: "Sub circuit, not UPS" },
  ],
};

/** Sources → processor → projector → screen. */
export const VIDEO_FLOW: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: "atv", label: "Apple TV 4K", sub: "Match frame rate + range", component: "streamer", loc: "Rack U21–22", x: 20, y: 30 },
    { id: "ub820", label: "Panasonic UB820", sub: "UHD Blu-ray", component: "player", loc: "Rack U21–22", x: 20, y: 130 },
    { id: "avr", label: "Denon AVC-A1H", sub: "HDMI 2.1 switching", component: "avr", loc: "Rack U14–19", x: 250, y: 80, w: 170 },
    { id: "proj", label: "JVC DLA-NZ700", sub: "Lens 2.40 m, throw 5.02 m", component: "projector", loc: "Rear-wall shelf", x: 500, y: 80, w: 170 },
    { id: "screen", label: "120\" AT screen", sub: "Seymour XD, gain ~1.0", component: "screen", loc: "x 0.60 m", x: 740, y: 80 },
    { id: "switch", label: "Network switch", component: "network", loc: "Rack U25", x: 250, y: 200, w: 170 },
    { id: "ups", label: "UPS-backed outlet", component: "ups", loc: "At the rear shelf", x: 500, y: 200, w: 170 },
  ],
  edges: [
    { from: "atv", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "ub820", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "avr", to: "proj", kind: "hdmi", label: "Fibre HDMI 2.1, 15 m (spare pulled)" },
    { from: "proj", to: "screen", kind: "light", label: "5.02 m throw · ~110 nits HDR" },
    { from: "switch", to: "proj", kind: "network", label: "Cat6 via ceiling void" },
    { from: "ups", to: "proj", kind: "power", label: "Dedicated circuit" },
  ],
};

/* =============================================================== budget */

export interface Move {
  component: string;
  to: string;
  delta: number;
  est?: boolean;
  what: string;
  /** Outside the AV equipment budget (room construction). */
  room?: boolean;
}

export interface Scenario {
  amount: number;
  title: string;
  summary: string;
  moves: Move[];
  alt?: string;
}

export const SCENARIOS: Scenario[] = [
  {
    amount: 200000,
    title: "₹2 L more",
    summary: "Put it into the room, not the equipment: bass decay and the speakers' mounting.",
    moves: [
      { component: "subs", to: "Deeper bass trapping: ceiling-corner pressure traps in the 203 mm void, 450 mm superchunks in the front corners, a vented riser", delta: 100000, est: true, room: true,
        what: "Tighter, faster bass everywhere, and less of the 67 Hz dip both rows now share because of the lower ceiling. Subs and Dirac can't fix decay; traps can." },
      { component: "lcr", to: "Hard baffle wall for the L/C/R", delta: 100000, est: true, room: true,
        what: "3–6 dB more low-frequency efficiency from the same speakers, and no front-wall cancellation dip around 100–200 Hz. Dialogue gains body." },
    ],
    alt: "If it has to be equipment: Seymour UF instead of XD (+₹30k) for an invisible weave from row 1, plus the rest into calibration.",
  },
  {
    amount: 500000,
    title: "₹5 L more",
    summary: "Nothing at exactly ₹5 L changes the experience as much as the next projector, so stretch or wait.",
    moves: [
      { component: "projector", to: "JVC DLA-NZ800 instead of the NZ700", delta: 670000, est: true,
        what: "Roughly twice the native contrast and about 20% brighter HDR. Letterbox bars, space and night scenes go visibly blacker, in every film, from every seat." },
    ],
    alt: "Held strictly to ₹5 L: Procella P8 fronts (+₹5.2 L), which you hear only near reference level. Or do the ₹2 L room package and keep ₹3 L towards the NZ800.",
  },
  {
    amount: 1000000,
    title: "₹10 L more",
    summary: "The room package plus the projector plus the finer screen: better bass, blacker picture, invisible weave.",
    moves: [
      { component: "subs", to: "The ₹2 L room package (bass traps + baffle wall)", delta: 200000, est: true, room: true,
        what: "Bass decay and front-speaker efficiency." },
      { component: "projector", to: "JVC DLA-NZ800", delta: 670000, est: true,
        what: "Blacks and HDR you see in every film." },
      { component: "screen", to: "Screen Excellence Enlightor 4K", delta: 120000, est: true,
        what: "Finer weave at 2.9 m and slightly less treble loss." },
    ],
    alt: "Loud-listening version: NZ800 + Procella P8 fronts in the baffle wall (≈₹11.9 L).",
  },
];

/** Upgrades that cost real money and change little in this room. */
export const LOW_RETURN: { component: string; move: string; delta: string; why: string }[] = [
  { component: "avr", move: "StormAudio or Trinnov instead of the Denon", delta: "+₹9–40 L", why: "The same Dirac engine or an equivalent. In a treated 64 m³ room with four subs, not reliably audible in films." },
  { component: "projector", move: "NZ900 instead of the NZ800", delta: "+₹11.5 L", why: "The contrast gain shows mainly in fades to black. The extra brightness is surplus on a 120\" screen in a dark room." },
  { component: "subs", move: "Rythmik F18 × 4 instead of the DIY 18s", delta: "+₹8.8 L", why: "Same output, same room. You're buying finish and warranty." },
  { component: "lcr", move: "JBL Synthesis SCL-2 instead of the Arendal", delta: "+₹16 L", why: "Headroom you'll use only near reference; the P8 gives most of it for a third of the premium." },
  { component: "atmos", move: "KEF THX in-ceilings instead of the standard Uni-Q", delta: "+₹4.2 L", why: "More output at 1.0–1.5 m, where it's never needed." },
  { component: "amps", move: "Purifi monoblocks or ATI instead of the Hypex 8-channel", delta: "+₹2.6–6 L", why: "Both are transparent. You won't hear a difference." },
  { component: "cabling", move: "Audiophile cables", delta: "+₹2–5 L", why: "No audible difference over correctly sized copper." },
  { component: "streamer", move: "Kaleidescape", delta: "+₹9 L", why: "Disc quality you can already get from the ₹50,000 disc player — if its store even sells to India." },
  { component: "ups", move: "APC SRT instead of the SRV", delta: "+₹1.1 L", why: "Battery convenience, not cleaner power." },
];

/** The evaluator's leaner build: what they'd cut, and where they'd put it. */
export const EVALUATOR_REBALANCE = {
  cut: [
    { component: "avr", move: "Denon AVC-X4800H instead of the A1H", delta: -395000 },
    { component: "wides", move: "Drop the wides (pre-wire them)", delta: -225000 },
  ],
  add: [{ component: "projector", move: "JVC NZ800 instead of the NZ700", delta: 670000 }],
  note: "7.4.6 on the X4800H keeps every bit of the processing, Dirac and four-sub control. The ₹6.2 L saved pays for most of the NZ800 — a difference every seat sees, against wides only row 1 hears.",
};

/* ========================================================= procurement */

export const IMPORT_RULES = [
  { k: "Duty-free baggage allowance", v: "₹75,000 per passenger (Baggage Rules 2026); cannot be pooled" },
  { k: "Baggage duty above the allowance", v: "35% (some sources still show 38.5%)" },
  { k: "Courier personal import", v: "10% basic duty + surcharge + 18% GST ≈ 31% (confirm with the courier)" },
  { k: "Projectors", v: "GST fell from 28% to 18% in Sep 2025; Indian street prices now sit ~30% under US street" },
  { k: "Warranty", v: "JVC, Sony, Epson, Denon/Marantz: regional. An imported unit is effectively unsupported in India" },
  { k: "Rule of thumb", v: "Import only if (overseas × 1.35 + freight + 10% warranty risk) < Indian price — roughly a 40% gap for heavy items" },
  { k: "Voltage", v: "SG, HK, CN, TH: 220–230 V / 50 Hz, no transformer. From the US, only universal-voltage items (projector, Hypex amps, streamers, mics)" },
];

export const FX = { USD: 96, SGD: 75, HKD: 12.3, THB: 2.9, CNY: 14.3 };

export interface MarketPrice { market: Buy; local: string; inr: number; note?: string }

/** Street prices found by market for the big-ticket items, for the procurement view. */
export const MARKET_PRICES: Record<string, MarketPrice[]> = {
  avr: [
    { market: "india", local: "₹4.3–5.5 L", inr: 550000, note: "Verify the ₹4.3 L quote; list ₹7.99 L" },
    { market: "usa", local: "$7,199", inr: 691000, note: "120 V only" },
    { market: "singapore", local: "S$9,999", inr: 750000 },
    { market: "hongkong", local: "HK$28.7–39.8k", inr: 430000, note: "Market prices; +35% duty makes it ₹5.3 L+" },
    { market: "thailand", local: "฿189,000", inr: 548000, note: "Promo; list ฿280,000" },
    { market: "china", local: "¥41,989", inr: 600000 },
  ],
  projector: [
    { market: "india", local: "~₹6–6.5 L", inr: 630000, note: "NZ700, est. from the NZ500's India/US ratio" },
    { market: "usa", local: "$8,999.95", inr: 864000 },
  ],
  amps: [{ market: "usa", local: "$2,500", inr: 240000, note: "Not sold in India" }],
  subs: [
    { market: "usa", local: "~$330 / driver", inr: 32000, note: "Parts Express; boxes built locally" },
    { market: "india", local: "SVS PB-4000 ₹4.15 L", inr: 415000, note: "vs $2,400 (₹2.3 L) in the US — don't import a 70 kg sub" },
  ],
  lcr: [
    { market: "usa", local: "$1,300 each", inr: 125000, note: "Arendal direct" },
    { market: "india", local: "~₹2.5–3.7 L each (dealer)", inr: 300000, note: "About 2× US" },
  ],
};

export interface ProcureLine { component: Component; option: ReturnType<typeof recommended> }

export function procurementGroups() {
  const order: Buy[] = ["india", "usa", "singapore", "hongkong", "china", "thailand", "threshold", "do-not-import"];
  const groups = new Map<Buy, ProcureLine[]>(order.map((b) => [b, []]));
  for (const c of CATALOG) {
    const o = recommended(c);
    groups.get(o.buy)!.push({ component: c, option: o });
  }
  return order.map((b) => ({ buy: b, lines: groups.get(b)! }));
}

/** Items the evaluator would never import, drawn from the alternatives. */
export const DO_NOT_IMPORT = [
  { component: "projector", what: "Any projector", why: "India is ~30% cheaper than US street after the GST cut, and the JVC/Sony/Epson warranty is regional." },
  { component: "avr", what: "Denon / Marantz receivers", why: "Indian street price beats the US before duty, US units are 120 V only, and the warranty is regional." },
  { component: "subs", what: "Branded subwoofers (SVS, Rythmik, Arendal)", why: "40–90 kg each. Freight plus 35% duty erases most of the saving, and SVS India gives a 5-year warranty." },
  { component: "ups", what: "UPS and batteries", why: "Heavy, airline-restricted batteries, and local service matters." },
  { component: "rack", what: "Racks", why: "Heavy and cheap locally." },
  { component: "amps", what: "Any 115 V-only amplifier (e.g. Monolith 7×200)", why: "Needs a transformer and still misbehaves at 50 Hz." },
];

/** What's worth buying in markets with nothing on the recommended list. */
export const OPPORTUNISTIC: Partial<Record<Buy, string>> = {
  singapore: "Nothing on the list. Denon's A1H is S$9,999 (~₹7.5 L), worse than India. 9% GST is refundable on departure, but not enough to beat Indian dealers. Handy for small items inside the ₹75,000 allowance.",
  hongkong: "No sales tax. The Zidoo player and the ToneWinner processor are cheaper here or in China. Trinnov's Altitude CI starts at HK$79,800 (~₹9.8 L) — relevant only for a reference build.",
  thailand: "Nothing on the list. The A1H promo at ฿189,000 (~₹5.5 L) matches India before duty, so it loses after. The VAT refund is ~5–6% net.",
};

export const componentName = (id: string) => byId(id).name;
