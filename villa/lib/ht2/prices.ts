import type { PriceItem } from "@/lib/ht/pareto";

/**
 * Indian street prices, September 2026, all from authorised dealers with an
 * Indian warranty unless noted. `est` marks a figure that could not be seen on
 * a live listing (price on request, dealer quote from a forum, or derived).
 * Rupees, GST included.
 */
export const P: Record<string, PriceItem> = {
  /* picture */
  LS12: { name: "Epson EH-LS12000B", price: 449000, cat: "picture", source: "AVStore sale" },
  XW51: { name: "Sony VPL-XW5100 (Bravia Projector 7)", price: 530000, cat: "picture", source: "VPLAK / AVStore" },
  NZ5: { name: "JVC DLA-NZ500", price: 575000, cat: "picture", est: true, source: "List ₹6.49–6.59 L; ~11% authorised-dealer discount assumed. Forum quotes of ₹4.19–5.0 L may be grey stock without JVC India warranty" },
  NZ7: { name: "JVC DLA-NZ700", price: 950000, cat: "picture", est: true, source: "List ₹10.7 L (SH Digital); ~11% authorised-dealer discount assumed" },
  GVW: { name: "Grandview Prestige fixed frame, AW6 woven AT, 120″ 16:9", price: 100000, cat: "room", est: true, source: "AV-Vision Hyderabad — price on request" },

  /* processing */
  X38: { name: "Denon AVC-X3800H", price: 141000, cat: "processing", source: "AVStore sale (₹1.05 L seen at HiFi Fever)" },
  X68: { name: "Denon AVC-X6800H", price: 239800, cat: "processing", source: "VPLAK" },
  A1H: { name: "Denon AVC-A1H", price: 429800, cat: "processing", source: "VPLAK" },
  BA3: { name: "Emotiva BasX A3 (3-ch amp for L/C/R)", price: 92000, cat: "processing", source: "AV Shack ₹89.5–94k" },
  DRC: { name: "Dirac Live Room Correction + Bass Control + ART", price: 83000, cat: "processing", est: true, source: "Dirac store $799 at card forex (~₹88) + 18% IGST on imported digital services" },

  /* speakers */
  J250: { name: "JBL Stage 250B (pair)", price: 39000, cat: "speakers", source: "AV Shack ₹37.8–40.5k" },
  J280: { name: "JBL Stage 280CSA angled in-ceiling (each)", price: 25990, cat: "speakers", source: "AV Shack" },
  PR2: { name: "Polk Reserve R200 (pair)", price: 84500, cat: "speakers", source: "AV Shack" },
  PR1: { name: "Polk Reserve R100 (pair)", price: 69500, cat: "speakers", source: "WattHiFi" },
  PRC: { name: "Polk RC80i in-ceiling (pair)", price: 28500, cat: "speakers", source: "Ooberpad" },
  KQC: { name: "KEF Q Concerto Meta (pair)", price: 124800, cat: "speakers", source: "VPLAK offer" },
  K6F: { name: "Klipsch RP-6000F II (pair)", price: 175300, cat: "speakers", source: "VPLAK" },
  K8F: { name: "Klipsch RP-8000F II (pair)", price: 211000, cat: "speakers", source: "VPLAK offer" },
  K5S: { name: "Klipsch RP-500SA II (pair)", price: 85500, cat: "speakers", source: "VPLAK" },
  KCI: { name: "KEF Ci200ER in-ceiling (each)", price: 24500, cat: "speakers", source: "ProHiFi (₹16.1k at VPLAK)" },

  /* subwoofers */
  SPL12: { name: "Klipsch SPL-120", price: 76300, cat: "subs", source: "VPLAK" },
  SPL15: { name: "Klipsch SPL-150", price: 128900, cat: "subs", source: "VPLAK" },
  SB1P: { name: "SVS SB-1000 Pro", price: 90000, cat: "subs", source: "₹82k (HTE sale) – ₹99.5k (AVStore)" },
  PB1P: { name: "SVS PB-1000 Pro", price: 146600, cat: "subs", source: "Audio Visual Kart (ProHiFi ₹1.56 L)" },
  PB2P: { name: "SVS PB-2000 Pro", price: 218500, cat: "subs", source: "AVStore list; dealers discount" },
  SB2P: { name: "SVS SB-2000 Pro (sealed)", price: 189500, cat: "subs", source: "AVStore" },

  /* room, sources and infrastructure — the same in every system */
  ATV: { name: "Apple TV 4K 128 GB", price: 31900, cat: "room", source: "Apple India" },
  UB8: { name: "Panasonic DP-UB820", price: 98000, cat: "room", source: "AVStore" },
  UMK: { name: "miniDSP UMIK-1", price: 13400, cat: "room", source: "Avenue Sound (₹15.9k Amazon.in)" },
  BAF: { name: "Black absorptive baffle wall + 250 mm speaker plinths", price: 60000, cat: "room", est: true, source: "Ply frame, 50 mm wool, black fabric, carpenter (est.)" },
  HSH: { name: "Projector hush box (ventilated, damped, open front)", price: 25000, cat: "room", est: true, source: "Carpenter-built (est.)" },
  ERT: { name: "Dedicated earth pit + neutral–earth check", price: 15000, cat: "room", est: true, source: "Electrician (est.)" },
  CTG: { name: "Contingency held back inside the cap", price: 100000, cat: "room", source: "Released only when every estimate is a written quote" },
  UPS: { name: "APC Easy UPS SRV3KI (3 kVA online) + rack PDU + Type-2 SPD", price: 57000, cat: "room", source: "UPS ₹39.5–42k IndiaMART; PDU/SPD est." },
  RCK: { name: "24U 600×800 floor rack + fan tray", price: 25000, cat: "room", est: true, source: "Netrack 32U ₹18.5k" },
  CAB: { name: "Fibre HDMI ×2, 12 AWG Canare, sub RCA runs, mounts", price: 95800, cat: "room", source: "UGREEN 15 m ₹12.9k; Canare ₹195/m; mounts est." },
  NET: { name: "Network switch + RF/IP remote", price: 20000, cat: "room", est: true },
  INS: { name: "Installation labour", price: 100000, cat: "room", est: true, source: "₹0.75–1.5 L typical" },
  CAL: { name: "Calibration: audio (REW + Dirac) and video", price: 80000, cat: "room", est: true, source: "₹40–80k audio + ₹30–60k video" },
  TP: { name: "Acoustic treatment — typical contractor package (9–12 mm PET panels, foam traps)", price: 150000, cat: "room", est: true, source: "₹250–400/sq ft installed (est.)" },
  TD: { name: "Acoustic treatment — to a written spec, carpenter-built (48 kg/m³ wool, fabric)", price: 140000, cat: "room", est: true, source: "Rockwool/Twiga ₹245/m² per 50 mm in Hyderabad; AT fabric ₹440–480/m; carpentry (est.)" },
  TC: { name: "Acoustic treatment — to a written spec, specialist-built and measured", price: 260000, cat: "room", est: true, source: "₹350–600/sq ft installed (est.)" },
};

export const CAT_LABEL2 = {
  picture: "Projector",
  speakers: "Speakers",
  subs: "Subwoofers",
  processing: "Processing & amps",
  room: "Screen, sources, treatment, install",
};

/** Items every system carries, whatever else changes. */
export const FIXED: Record<string, number> = { GVW: 1, ATV: 1, UB8: 1, UMK: 1, UPS: 1, RCK: 1, CAB: 1, NET: 1, INS: 1, CAL: 1, BAF: 1, HSH: 1, ERT: 1, CTG: 1 };

export const fixedCost = () => Object.entries(FIXED).reduce((a, [k, q]) => a + P[k].price * q, 0);
