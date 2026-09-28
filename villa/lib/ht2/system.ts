import { H, ROOM, RISER, SCREEN, type Marker } from "@/lib/ht/geometry";
import type { RackUnit, FlowNode, FlowEdge, Scenario, MarketPrice } from "@/lib/ht/system";

/* ============================================================ layout 7.4.4 */

const TOP_Y = [1.1, 3.03];
const LR_Y = 0.85;

/**
 * 7.4.4 after the independent review: L/C/R on stands behind a baffle wall,
 * front subs clear of them, sides lowered and aimed across, overheads moved
 * to Dolby's 45° for row 1 with a near-overhead pair for row 2, and a sealed
 * rear sub pair.
 */
export const MARKERS2: Marker[] = [
  { id: "L", component: "lcr", role: "lcr", label: "L", bottom: 0.92, top: 1.40, x: 0.33, y: LR_Y, z: 1.18, on: "front" },
  { id: "C", component: "lcr", role: "lcr", label: "C", bottom: 0.92, top: 1.40, x: 0.33, y: SCREEN.cy, z: 1.18, on: "front" },
  { id: "R", component: "lcr", role: "lcr", label: "R", bottom: 0.92, top: 1.40, x: 0.33, y: ROOM.W - LR_Y, z: 1.18, on: "front" },
  { id: "Lss", component: "sides", role: "side", label: "Lss", x: 4.4, y: 0, z: 1.65, on: "left" },
  { id: "Rss", component: "sides", role: "side", label: "Rss", x: 4.4, y: ROOM.W, z: 1.65, on: "right" },
  { id: "Lrs", component: "rears", role: "rear", label: "Lrs", x: 5.9, y: 0, z: 2.0, on: "left" },
  { id: "Rrs", component: "rears", role: "rear", label: "Rrs", x: 5.9, y: ROOM.W, z: 2.0, on: "right" },
  { id: "Ltf", component: "atmos", role: "top", label: "Ltf", x: 2.1, y: TOP_Y[0], z: H, on: "ceiling" },
  { id: "Rtf", component: "atmos", role: "top", label: "Rtf", x: 2.1, y: TOP_Y[1], z: H, on: "ceiling" },
  { id: "Ltr", component: "atmos", role: "top", label: "Ltr", x: 4.95, y: TOP_Y[0], z: H, on: "ceiling" },
  { id: "Rtr", component: "atmos", role: "top", label: "Rtr", x: 4.95, y: TOP_Y[1], z: H, on: "ceiling" },
  { id: "SW1", component: "subs", role: "sub", label: "SW1", x: 0.28, y: 1.25, z: 0.15, on: "floor" },
  { id: "SW2", component: "subs", role: "sub", label: "SW2", x: 0.28, y: 2.9, z: 0.15, on: "floor" },
  { id: "SW3", component: "subs", role: "sub", label: "SW3", x: 5.82, y: 0.25, z: RISER.height, on: "riser" },
  { id: "SW4", component: "subs", role: "sub", label: "SW4", x: 5.82, y: ROOM.W - 0.25, z: RISER.height, on: "riser" },
];

/* ================================================================== rack */

export const RACK2_U = 24;
export const RACK2: RackUnit[] = [
  { u: 24, h: 1, label: "Fan tray", sub: "Thermostatic, exhausts up", kind: "fan", component: "rack", watts: [20, 30], ups: true },
  { u: 23, h: 1, label: "Network switch", sub: "8-port managed + RF/IP remote hub", kind: "network", component: "network", watts: [12, 15], ups: true },
  { u: 22, h: 1, label: "Patch panel", sub: "Fibre HDMI, Cat6, sub RCA runs", kind: "cable", component: "cabling" },
  { u: 21, h: 1, label: "Vent panel", kind: "vent" },
  { u: 19, h: 2, label: "Source shelf", sub: "Apple TV 4K · Panasonic DP-UB820", kind: "shelf", component: "streamer", watts: [25, 35], ups: true },
  { u: 18, h: 1, label: "Vent gap", sub: "Heat from the receiver rises here", kind: "vent" },
  { u: 13, h: 5, label: "Denon AVC-X6800H", sub: "13.4 · 11 × 140 W · Dirac Live + Bass Control + ART", kind: "device", component: "avr", watts: [300, 780], ups: true },
  { u: 12, h: 1, label: "Vent gap", kind: "vent" },
  { u: 11, h: 1, label: "Rack PDU + surge", sub: "Type-2 SPD at the distribution board", kind: "power", component: "ups", watts: [5, 5], ups: true },
  { u: 10, h: 1, label: "Brush panel", sub: "Cable management, service loop", kind: "cable", component: "cabling" },
  { u: 9, h: 1, label: "Vent / spare", sub: "Room for a 2-channel amp for six overheads later", kind: "vent" },
  { u: 1, h: 8, label: "APC SRV3KI tower UPS bay", sub: "3 kVA online, stands in the rack base", kind: "power", component: "ups", watts: [60, 120], ups: false },
];

/* ============================================================ signal flow */

export const AUDIO2: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: "atv", label: "Apple TV 4K", component: "streamer", loc: "Rack U19–20", x: 20, y: 40 },
    { id: "ub820", label: "Panasonic UB820", component: "player", loc: "Rack U19–20", x: 20, y: 130 },
    { id: "switch", label: "Network switch", component: "network", loc: "Rack U23", x: 20, y: 250 },
    { id: "umik", label: "UMIK-1 + laptop", sub: "Dirac Live", component: "mic", loc: "In the room", x: 20, y: 340 },
    { id: "avr", label: "Denon AVC-X6800H", sub: "11 amps · Dirac BC + ART", component: "avr", loc: "Rack U13–17", x: 250, y: 170, w: 190 },
    { id: "lcr", label: "L / C / R", sub: "KEF Q Concerto Meta", component: "lcr", loc: "Stage, behind screen", x: 520, y: 0 },
    { id: "sides", label: "Side surrounds", sub: "x 4.4 m, 1.65 m high", component: "sides", loc: "Side walls", x: 520, y: 70 },
    { id: "rears", label: "Rear surrounds", sub: "x 5.9 m", component: "rears", loc: "Side walls", x: 520, y: 140 },
    { id: "atmos", label: "4 × Atmos", sub: "KEF Ci200ER", component: "atmos", loc: "Ceiling", x: 520, y: 210 },
    { id: "sw12", label: "SW1 + SW2", sub: "PB-1000 Pro, ported", component: "subs", loc: "Baffle cavity", x: 520, y: 300 },
    { id: "sw34", label: "SW3 + SW4", sub: "SB-1000 Pro, sealed", component: "subs", loc: "Riser corners, on the slab", x: 520, y: 380 },
    { id: "subpwr", label: "Sub circuit", sub: "Dedicated earth pit", component: "install", loc: "In-room outlets", x: 760, y: 340 },
    { id: "ups", label: "APC 3 kVA UPS", component: "ups", loc: "Rack base", x: 250, y: 440, w: 190 },
    { id: "pdu", label: "Rack PDU", component: "ups", loc: "Rack U11", x: 250, y: 340, w: 190 },
  ],
  edges: [
    { from: "atv", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "ub820", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "switch", to: "avr", kind: "network", label: "Cat6" },
    { from: "umik", to: "avr", kind: "network", label: "Wi-Fi / LAN" },
    { from: "avr", to: "lcr", kind: "speaker", label: "12 AWG, ~12 m" },
    { from: "avr", to: "sides", kind: "speaker", label: "12 AWG, ~9 m" },
    { from: "avr", to: "rears", kind: "speaker", label: "12 AWG, ~8 m" },
    { from: "avr", to: "atmos", kind: "speaker", label: "12 AWG, 8–12 m" },
    { from: "avr", to: "sw12", kind: "sub", label: "Sub out 1+2, shielded RCA ~13 m" },
    { from: "avr", to: "sw34", kind: "sub", label: "Sub out 3+4, shielded RCA ~8 m" },
    { from: "subpwr", to: "sw12", kind: "power", label: "Dedicated circuit" },
    { from: "subpwr", to: "sw34", kind: "power", label: "Dedicated circuit" },
    { from: "ups", to: "pdu", kind: "power", label: "UPS output" },
    { from: "pdu", to: "avr", kind: "power", label: "UPS-backed" },
  ],
};

export const VIDEO2: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: "atv", label: "Apple TV 4K", sub: "Match frame rate + range", component: "streamer", loc: "Rack U19–20", x: 20, y: 30 },
    { id: "ub820", label: "Panasonic UB820", sub: "UHD Blu-ray", component: "player", loc: "Rack U19–20", x: 20, y: 130 },
    { id: "avr", label: "Denon AVC-X6800H", sub: "HDMI 2.1 switching", component: "avr", loc: "Rack U13–17", x: 250, y: 80, w: 190 },
    { id: "proj", label: "JVC DLA-NZ500", sub: "Lens 2.40 m, throw 5.02 m", component: "projector", loc: "Hush box, rear shelf", x: 500, y: 80, w: 170 },
    { id: "screen", label: "120″ woven AT", sub: "Grandview AW6", component: "screen", loc: "x 0.60 m", x: 740, y: 80 },
    { id: "switch", label: "Network switch", component: "network", loc: "Rack U23", x: 250, y: 200, w: 190 },
    { id: "ups", label: "UPS-backed outlet", component: "ups", loc: "At the rear shelf", x: 500, y: 200, w: 170 },
  ],
  edges: [
    { from: "atv", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "ub820", to: "avr", kind: "hdmi", label: "HDMI 2.1, 1 m" },
    { from: "avr", to: "proj", kind: "hdmi", label: "Fibre HDMI 2.1, 15 m (spare pulled)" },
    { from: "proj", to: "screen", kind: "light", label: "5.02 m throw · ~105 nits HDR" },
    { from: "switch", to: "proj", kind: "network", label: "Cat6 via ceiling void" },
    { from: "ups", to: "proj", kind: "power", label: "Dedicated circuit" },
  ],
};

export const FLOW_NOTES2 = [
  { title: "HDMI path", body: "Both sources go into the Denon, never straight to the projector, so audio always bitstreams. One 15 m fibre HDMI runs through the ceiling void to the rear shelf, with a spare pulled before the ceiling closes; label both ends — fibre is directional." },
  { title: "Subwoofer lines", body: "The four subs are powered, so each gets a long line-level run from its own Denon sub output: shielded coax RCA (no XLR on the SVS Pro subs). Power them from a dedicated circuit on the AV earth pit, shared with the rack, and check neutral–earth is under 2 V — or the long runs will hum." },
  { title: "No external amps", body: "The X6800H's 11 amplifiers drive all eleven speakers, so there is no amp, trigger or sequencer to fail. A spare rack bay is left for a 2-channel amp if six overheads are ever added." },
];

/* ================================================================ budget */

const L = 1e5;

export const SCENARIOS2: Scenario[] = [
  {
    amount: 198500,
    title: "The ₹2.0 L margin",
    summary: "₹1 L is contingency and stays untouched until every estimate is a written quote. The other ₹0.98 L is real headroom — spend it on the room, not the boxes.",
    moves: [
      { component: "treatment", to: "Black velvet on the front third of the ceiling and side walls", delta: 35000, est: true, room: true, what: "+0.39 in the model: the JVC's blacks survive bright scenes. The best value of any add-on." },
      { component: "treatment", to: "Fill and decouple the riser", delta: 30000, est: true, room: true, what: "+0.26: row 2's floor stops drumming. Only while the riser is being built." },
    ],
    alt: "If prices come in high, cut in this order: carpenter-built treatment to the same spec (−₹1.2 L, −0.4), the UB820 for a Zidoo (−₹0.43 L, grey area), the Polk Reserve speaker package (−₹2.1 L, −1.6). Never drop to two subs (−3.6) and never skip treatment (−4.5).",
  },
  {
    amount: 5 * L,
    title: "If the cap were ₹35 L",
    summary: "Put it into the picture first.",
    moves: [
      { component: "projector", to: "JVC NZ700 instead of the NZ500", delta: 375000, est: true, what: "Deeper blacks and a better lens: +1.3 in the model, visible in every dark scene." },
      { component: "subs", to: "SB-2000 Pro at the rear instead of SB-1000 Pro", delta: 93900, what: "+2 dB at 20 Hz from the same sealed boxes: +0.3." },
    ],
    alt: "Do not fit the NZ700 inside ₹30 L by dropping to two subs or skipping treatment: both cost more points than the projector adds.",
  },
  {
    amount: 10 * L,
    title: "If the cap were ₹40 L",
    summary: "Picture, then the room, then the extras.",
    moves: [
      { component: "projector", to: "JVC NZ700", delta: 375000, est: true, what: "Blacks and HDR: +1.3." },
      { component: "subs", to: "SB-2000 Pro at the rear", delta: 93900, what: "+2 dB at 20 Hz: +0.3." },
      { component: "treatment", to: "Velvet, a filled riser and rear corner traps", delta: 105000, est: true, room: true, what: "+0.9 together: contrast, a quiet riser and tighter bass decay." },
      { component: "subs", to: "Tactile transducers under all six seats", delta: 60000, est: true, what: "Bass you feel at normal levels: +0.44 (judgement)." },
      { component: "atmos", to: "Six overheads + 2-channel amp", delta: 109000, est: true, what: "Row 2 gets overhead effects of its own: +0.3." },
    ],
  },
];

export const LOW_RETURN2 = [
  { component: "avr", move: "Denon A1H instead of the X6800H", delta: "+₹1.9 L", why: "Four more channels you won't use under a 2.55 m ceiling: +0.2 in the model." },
  { component: "avr", move: "Marantz AV7706 + MM8077 + MM7055 (the video's electronics)", delta: "+₹3.0 L", why: "More amplifier power, but no Dirac and two sub outputs: −2.0 in the model." },
  { component: "lcr", move: "Focal Theva N3 package (the video's speakers)", delta: "+₹2.3 L", why: "In-wall surrounds and more sensitivity, but a mixed-line package: −0.2 — a tie at a higher price." },
  { component: "subs", move: "4× PB-1000 Pro instead of the sealed rear pair", delta: "+₹0.48 L", why: "+0.2 in the model, eats the contingency, and puts port noise beside row 2." },
  { component: "subs", move: "4× PB-2000 Pro", delta: "+₹4.9 L", why: "Headroom the room doesn't need: +0.2. Breaks the cap." },
  { component: "projector", move: "Sony Bravia 7 instead of the NZ500", delta: "−₹0.67 L", why: "Saves a little and scores 3.1 points lower: lighter blacks in every dark scene." },
  { component: "treatment", move: "A typical 'acoustic package' of thin PET panels", delta: "−₹1.1 L", why: "Scores 2.5 lower — and costs more than the carpenter-built version of the real spec." },
  { component: "lcr", move: "Klipsch RP-8000F II towers", delta: "+₹0.5 L", why: "Too deep for the stage; ~1 dB over the RP-6000F II above 80 Hz." },
  { component: "cabling", move: "Audiophile cables or a Furman conditioner", delta: "+₹0.6–5 L", why: "No audible difference; the online UPS already regulates." },
];

/* =========================================================== procurement */

export const IMPORT_RULES2 = [
  { k: "Everything recommended is sold in India", v: "With an Indian warranty, through authorised dealers. The only thing bought abroad is the Dirac licence, online, in USD." },
  { k: "Why not import", v: "Baggage duty is 35% above the ₹75,000 allowance; Indian street prices for Denon, JVC and SVS already sit at or below US prices after conversion; and warranties are regional." },
  { k: "Get it in writing", v: "The NZ500 is budgeted at ₹5.75 L — a warranted authorised-dealer price, not the ₹4.19–5.0 L forum quotes, which may be grey stock. The Grandview screen (price on request), the Dirac licence (USD, card forex + 18% IGST) and the treatment build are the other estimates. The ₹1 L contingency covers them; at NZ500 full list the system is still ₹29.8 L." },
  { k: "Where to ask in Hyderabad", v: "AV-Vision India (JVC, Grandview), Cinebels (Klipsch), Ojas Home Cinema, AV Central, Edomotics; online: VPLAK, AV Shack, AVStore (SVS partner), ProHiFi, Audio Visual Kart." },
  { k: "Dealer discounts", v: "Street prices run 8–25% under MRP; AV Shack and VPLAK listings are often the floor to negotiate from." },
];

export const MARKET2: Record<string, MarketPrice[]> = {
  projector: [
    { market: "india", local: "₹4.19–5.0 L", inr: 480000, note: "Forum quotes (HiFiVision) — warranty unconfirmed" },
    { market: "india", local: "₹5.75 L", inr: 575000, note: "Budgeted: warranted, authorised dealer (est.)" },
    { market: "india", local: "₹6.49–6.59 L", inr: 649000, note: "List / SH Digital, 8mm.in" },
  ],
  avr: [
    { market: "india", local: "₹2,39,800", inr: 239800, note: "VPLAK" },
    { market: "india", local: "₹2,49,000", inr: 249000, note: "AV Shack" },
    { market: "india", local: "₹2,79,000", inr: 279000, note: "AVStore" },
  ],
  subs: [
    { market: "india", local: "₹1,08,900", inr: 108900, note: "PB-1000 Pro, VPLAK" },
    { market: "india", local: "₹1,55,500", inr: 155500, note: "PB-1000 Pro, AVStore / ProHiFi list" },
    { market: "india", local: "₹85,000", inr: 85000, note: "SB-1000 Pro, ProHiFi" },
  ],
  lcr: [
    { market: "india", local: "₹1,24,800 / pair", inr: 124800, note: "KEF Q Concerto Meta, VPLAK offer" },
  ],
};

export const DO_NOT_IMPORT2 = [
  { component: "projector", what: "Projectors", why: "JVC's warranty is regional, and Indian dealer prices beat US street after the GST cut." },
  { component: "subs", what: "Subwoofers (Rythmik, Arendal, SVS from abroad)", why: "Heavy; 35% duty plus freight; SVS India gives 5 years." },
  { component: "lcr", what: "Arendal and other direct-only brands", why: "No authorised Indian channel; grey sellers charge about 2× with no warranty." },
  { component: "avr", what: "US-market receivers", why: "120 V only and a regional warranty." },
];

export const OPPORTUNISTIC2: Record<string, string> = {
  usa: "Nothing needed. A UMIK-1 or HDMI cable fits the ₹75,000 allowance if you're travelling, but Indian prices are close.",
  singapore: "Nothing needed.",
  hongkong: "Nothing needed.",
  china: "Nothing needed. The Zidoo player is sold in India at ₹54,900.",
  thailand: "Nothing needed.",
  threshold: "Nothing in this system is an import candidate.",
};

export const CHAINS2: { t: string; steps: [string, string][] }[] = [
  { t: "Sound", steps: [["streamer", "Apple TV · UB820"], ["avr", "X6800H + Dirac"], ["lcr", "7 KEF Q Concerto + 4 KEF Ci200ER"], ["subs", "2× PB-1000 Pro + 2× SB-1000 Pro"]] },
  { t: "Picture", steps: [["streamer", "Apple TV · UB820"], ["avr", "X6800H"], ["projector", "JVC NZ500"], ["screen", "120″ Grandview AT"]] },
  { t: "Room", steps: [["treatment", "Treatment to a written spec"], ["cabling", "Baffle wall + hush box"], ["calibration", "Calibration"], ["ups", "3 kVA online UPS"]] },
];

export { L };
