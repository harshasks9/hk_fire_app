import type { Component, Option } from "@/lib/ht/types";
import { P } from "./prices";

/**
 * The /ht2 system: a movie-first theatre under ₹30 L, every part sold in India
 * with an Indian warranty. Prices are Indian street prices (September 2026);
 * `est` marks anything not seen on a live listing.
 */

const p = (k: string, q = 1) => Math.round(P[k].price * q);

const surrounds = (label: string): Option[] => [
  {
    id: "kef-qc", tier: "recommended", name: "KEF Q Concerto Meta (pair)", price: p("KQC"), priceNote: "₹1,24,800 a pair at VPLAK", buy: "india",
    specs: [["Type", "Uni-Q coaxial with MAT, standmount"], ["Role", `${label} on low-profile tilting wall brackets`], ["Match", "The same speaker as the L/C/R"], ["Depth", "~0.33 m off the wall — keep it above the aisles"]],
    perf: "The baseline: a pan from the screen to the side walls keeps exactly the same voice, and the coaxial driver sounds the same on and off axis — which matters when the nearest seat is 0.6 m away and the farthest 3 m.",
    service: "Passive. KEF India warranty through the dealer.",
    attrs: { directivity: "Coaxial, even on and off axis", reliability: "Simple passive", warranty: "KEF India", import: "None", fit: "Timbre-matched to the fronts; protrudes into the aisles" },
  },
  {
    id: "k-rp500sa", tier: "alternative", name: "Klipsch RP-500SA II (pair)", price: p("K5S"), priceNote: "₹85,500 a pair at VPLAK (MRP ₹99,800)", buy: "india",
    specs: [["Type", "Slim on-wall, Tractrix horn tweeter"], ["Depth", "~0.15 m"], ["Match", "Pairs with Klipsch RP-6000F II fronts"]],
    perf: "The choice if the fronts are Klipsch: same horn voice, half the depth off the wall and ₹0.39 L less a pair. The model rates it a tie with the KEF system.",
    attrs: { directivity: "90° horn — easy to aim across the room", fit: "Only with Klipsch fronts" },
  },
  {
    id: "polk-r100", tier: "alternative", name: "Polk Reserve R100 (pair)", price: p("PR1"), priceNote: "₹69,500 a pair", buy: "india",
    specs: [["Type", "Bookshelf, ring-radiator tweeter"], ["Sensitivity", "~86 dB"]],
    perf: "Smooth and neutral, but a different voice from KEF fronts. You'd hear pans change colour.",
    attrs: { fit: "Only with Polk fronts" },
  },
  {
    id: "jbl-250b", tier: "alternative", name: "JBL Stage 250B (pair)", price: p("J250"), priceNote: "₹37,800–40,500 a pair (AV Shack)", buy: "india",
    specs: [["Type", "Bookshelf, HDI-style waveguide"], ["Sensitivity", "~86 dB"]],
    perf: "A third of the price and well measured for the money; less output and a different voice from the fronts.",
    attrs: { fit: "Budget option" },
  },
  {
    id: "k-rp502s", tier: "avoid", name: "Klipsch RP-502S II (pair)", price: 85000, priceNote: "Price on request at ProHiFi / Cinebels (est.)", est: true, buy: "india",
    specs: [["Type", "Bipole, two Tractrix horns"], ["Power", "100 W / 400 W peak"]],
    perf: "Bipole spreads sound diffusely. Pleasant for 5.1 mixes, but it blurs Atmos objects that should come from a point.",
    attrs: { directivity: "Bipole — wide and diffuse", fit: "Better for 5.1 than for Atmos" },
  },
];

export const CATALOG2: Component[] = [
  /* ================================================================ LCR */
  {
    id: "lcr", name: "Front L / C / R", group: "speakers", qty: 3,
    placement: "Three identical KEF Q Concerto Meta on 0.77 m dense stands on the 0.15 m stage, so the Uni-Q drivers sit at about 1.18 m — behind the lower third of the picture, clear of row-1 heads on the way to row 2. Fronts flush with a black absorptive baffle wall 100 mm behind the woven screen; ports into the wool-filled baffle cavity (or foam-plugged — the mains are high-passed at 80 Hz). L and R at 0.85 m from each side wall, just inside the picture edges, toed in towards the centre of row 1; C straight ahead.",
    why: "The review changed this. The first draft chose RP-8000F II towers for their sensitivity, but they are ~0.48 m deep and rear-ported on a 0.60 m stage, and the L tower collided with a front sub. Re-modelled with measured sensitivities, the 80 Hz high-pass and the X6800H's dynamic power, the KEF reaches ~97 dB peaks in row 2 (reference −8 dB) and ~101 dB in row 1, against ~100 dB in row 2 for the Klipsch RP-6000F II. Across 250 Monte Carlo runs the KEF system won more often than any other; the Klipsch system is a statistical tie at the same price. The KEF's lower distortion and seven identical speakers around the room decided it.",
    upgrade: "If you often watch at reference from row 2: 3× Klipsch RP-6000F II with RP-500SA II surrounds, same money. Beyond ₹30 L: the JBL Synthesis SCL family, on quote.",
    options: [
      {
        id: "kef-qc-lcr", tier: "recommended", name: "3× KEF Q Concerto Meta + stands", price: p("KQC", 1.5), priceNote: "₹1,24,800 a pair at VPLAK; the third from a second pair (the spare goes to the surrounds package) — stands in the baffle budget", buy: "india",
        specs: [["Type", "Uni-Q coaxial with MAT, standmount"], ["Sensitivity", "~86–87 dB (spec 86; est. measured)"], ["Depth", "~0.33 m — fits the stage with the baffle"], ["Row-2 peaks", "~97 dB on the X6800H (est.)"]],
        perf: "The baseline.",
        importNote: "KEF India dealers: VPLAK, ProHiFi, Ooberpad; ask AV-Vision or Ojas in Hyderabad to match.",
        service: "Passive; KEF India warranty.",
        attrs: { measured: "Very low distortion; even coaxial dispersion (Erin's Audio Corner)", spl: "~101 dB at row 1, ~97 dB at row 2 (est.)", distortion: "Lowest of the options", directivity: "Coaxial — even across six seats", reliability: "Simple passive", warranty: "KEF India", import: "None", fit: "Fits the 0.60 m stage" },
      },
      {
        id: "rp6000", tier: "alternative", name: "3× Klipsch RP-6000F II on plinths", price: p("K6F", 1.5), priceNote: "₹1,75,300 a pair at VPLAK; single on request (est.)", est: true, buy: "india",
        specs: [["Drivers", "2× 6.5\" woofers, 90° Tractrix horn"], ["Sensitivity", "~90.5 dB (est. measured)"], ["Depth", "~0.38 m; horn at ~1.17 m on a 0.30 m plinth"]],
        perf: "The tie. ~3.5 dB more in row 2, horn directivity keeps energy off the near side walls; less refined and a hotter top end that the AT screen and Dirac must tame. Pair it with RP-500SA II surrounds.",
        attrs: { spl: "~100 dB at row 2 (est.)", directivity: "90° horn: controlled", fit: "If you listen loud from row 2" },
      },
      {
        id: "rp8000", tier: "avoid", name: "3× Klipsch RP-8000F II", price: p("K8F", 1.5), priceNote: "₹2,11,000 a pair at VPLAK", buy: "india",
        specs: [["Depth", "~0.48 m, rear-ported"], ["Sensitivity", "91.7 dB measured (Erin)"]],
        perf: "The first draft's pick, withdrawn. Too deep for the stage: the ports would have to be plugged, the L tower collides with a front sub, and above 80 Hz it adds ~1 dB over the RP-6000F II for ₹0.54 L more.",
        attrs: { fit: "Doesn't fit the stage" },
      },
      {
        id: "polk-r200", tier: "alternative", name: "3× Polk Reserve R200", price: p("PR2", 1.5), priceNote: "₹84,500 a pair at AV Shack", buy: "india",
        specs: [["Measured", "86 dB, flat listening window; ring tweeter beams above 5 kHz (ASR)"]],
        perf: "Neutral and smooth; the Polk package is ₹2.1 L less for 1.6 points. The value knee of the whole study uses it.",
        attrs: { spl: "~96 dB at row 2 (est.)", fit: "The value choice" },
      },
      {
        id: "jbl-250b-lcr", tier: "alternative", name: "3× JBL Stage 250B", price: p("J250", 1.5), priceNote: "₹37,800–40,500 a pair", buy: "india",
        specs: [["Type", "Bookshelf, waveguide"], ["Sensitivity", "~85 dB"]],
        perf: "The cheapest credible front stage; small woofers and limited headroom in a two-row room.",
        attrs: { spl: "Limited", fit: "Only if the budget is gone" },
      },
      {
        id: "jbl-scl", tier: "reference", name: "JBL Synthesis SCL-4 / SCL-6", price: 840000, priceNote: "SCL-4 ₹2.8 L listed (each?); SCL-6 on quote (est.)", est: true, buy: "india",
        specs: [["Type", "In-wall, compression driver + HDI horn"]],
        perf: "Studio-grade horn directivity and headroom, far outside ₹30 L.",
      },
    ],
    review: {
      verdict: "qualified",
      headline: "A statistical tie with the Klipsch horns — the KEF wins on refinement and fit; the Klipsch on loudness at row 2.",
      right: "Yes, at the levels people actually watch. Row 1 is the primary seat and gets ~101 dB peaks.",
      overkill: "No.",
      under: "At full reference in row 2, yes: ~97 dB against 105. At reference −8 dB and below it is clean.",
      better: "Klipsch RP-6000F II for ~3.5 dB more at row 2, same money. Audition both at a dealer before ordering.",
      premium: "None over the Klipsch; the choice is voicing, not price.",
      notice: "Against the Klipsch: in loud action from row 2, yes. Quietly, the KEF sounds cleaner.",
      elsewhere: "No.",
      integrator: "They'd build the baffle wall first, set the stands so the Uni-Q is at ~1.18 m, and check that the line from each driver to a row-2 ear passes above row-1 headrests.",
    },
  },

  /* ========================================================= surrounds */
  {
    id: "sides", name: "Side surrounds", group: "speakers", qty: 2,
    placement: "On the side walls at x = 4.40 m, 1.65 m high (lowered from 1.9 m after the review), each aimed across the room at the far row-1 seat so the off-axis drop evens out the near and far seats. Row 1 hears them at about 114°. The left one is 0.25 m past the door jamb: the door must open outward.",
    why: "The same speaker as the fronts, so pans across the room keep one voice. The review showed row 2 hears these at ~62° and the rears at ~100°, so row 1 is the primary listening position and levels are set there.",
    upgrade: "None needed at 1–2.5 m.",
    options: surrounds("Side surrounds"),
    review: {
      verdict: "qualified", headline: "Right speaker; aim it at the far seat and mind the aisle.",
      right: "Yes.", overkill: "No.", under: "No — 1–2.5 m from ears.", better: "Klipsch RP-500SA II if the fronts are Klipsch: half the depth off the wall.",
      premium: "₹0.39 L a pair over the Klipsch for timbre match.", notice: "Timbre match on pans, yes.", elsewhere: "No.",
      integrator: "They'd specify an outward-opening, solid-core, sealed door (or hinge it at the front jamb) and check no one standing in the aisle can walk into a box at 1.65 m.",
    },
  },
  {
    id: "rears", name: "Rear surrounds (rear-sides)", group: "speakers", qty: 2,
    placement: "Moved off the rear wall: on the side walls at x = 5.9 m, 2.0 m high over the riser, aimed forward and across at the far row-1 seat. Row 1 hears them at about 139°, inside Dolby's 135–150° rear window; row 2 almost beside it (~101°).",
    why: "Row 2 sits only 0.22 m from the rear wall. Speakers there would be about 9 dB louder for the outer row-2 seats than for row 1. On the side walls, aimed across, the imbalance falls to about 3–4 dB — still uneven for row 2's outer seats, which is why row 1 is the reference position.",
    upgrade: "None.",
    options: surrounds("Rear surrounds"),
    review: {
      verdict: "qualified", headline: "The right compromise for a back row against the wall — not a perfect one.",
      right: "Yes.", overkill: "No.", under: "No.", better: "A position, not a product — and this is it.",
      premium: "None.", notice: "Row 2 will, as better balance.", elsewhere: "No.",
      integrator: "They'd accept a less 'behind' image for row 1 in exchange for evenness, and specify wall-hugger recliners for row 2 (0.22 m to the wall).",
    },
  },

  /* ============================================================= atmos */
  {
    id: "atmos", name: "Atmos overheads", group: "speakers", qty: 4,
    placement: "Four KEF Ci200ER flush in the 2.55 m ceiling, pairs at x = 2.10 m and 4.95 m (moved from 2.3 / 4.6 m after the review), 1.10 m and 3.03 m from the left wall. Row 1: front pair ~46° ahead, rear pair ~45° behind — Dolby's ideal top-front / top-rear. Row 2 now gets a near-overhead pair (~62°) instead of two pairs in front of it.",
    why: "With the ceiling at 2.55 m and row 2 only 1.0 m below it, wide, even dispersion matters more than output. The 8″ Uni-Q coaxial spreads evenly, so the seat nearest a speaker isn't blasted, and it is the same driver family as the Q Concerto fronts. Six overheads were rejected: two more speakers and channels mostly benefit row 2, at the cost of amps the X6800H doesn't have.",
    upgrade: "Six overheads later (the X6800H processes 13 channels) with a 2-channel amp.",
    options: [
      {
        id: "kef-ci200er", tier: "recommended", name: "4× KEF Ci200ER", price: p("KCI", 4), priceNote: "₹24,500 each at ProHiFi (₹16,100 seen at VPLAK)", buy: "india",
        specs: [["Driver", "8″ Uni-Q coaxial, in-ceiling"], ["Dispersion", "Wide and even"], ["Mounting", "Flush; check depth against the ceiling void and ducts"]],
        perf: "The baseline.",
        attrs: { directivity: "Wide coaxial — even across six seats", reliability: "Simple passive", warranty: "KEF India", import: "None", fit: "Right for a 2.55 m ceiling" },
      },
      {
        id: "jbl-280csa", tier: "alternative", name: "4× JBL Stage 280CSA (angled)", price: p("J280", 4), priceNote: "₹25,990 each at AV Shack", buy: "india",
        specs: [["Driver", "8″ 2-way, angled baffle"]],
        perf: "The angled baffle aims sound at the seats — useful here. Similar result for similar money.",
        attrs: { directivity: "Angled towards the seats", fit: "Equal choice" },
      },
      {
        id: "polk-rc80i", tier: "alternative", name: "4× Polk RC80i", price: p("PRC", 2), priceNote: "₹28,500 a pair at Ooberpad", buy: "india",
        specs: [["Driver", "8″ 2-way, pivoting tweeter"]],
        perf: "Half the price; less refined but serviceable for effects.",
        attrs: { fit: "Budget" },
      },
      {
        id: "klipsch-cdt", tier: "alternative", name: "4× Klipsch CDT-5800-C II", price: 120000, priceNote: "On Amazon.in, no price seen (est. ₹25–40k each)", est: true, buy: "india",
        specs: [["Driver", "8″, pivoting horn tweeter"]],
        perf: "The match if you choose Klipsch fronts; narrower dispersion from a horn means the nearest seat hears it hotter at 1.0 m.",
        attrs: { directivity: "Horn — narrower", fit: "Timbre match, less even coverage" },
      },
      {
        id: "six-tops", tier: "step-up", name: "6× KEF Ci200ER + 2-channel amp", price: p("KCI", 6) + 60000, priceNote: "+2 speakers and a small amp (est.)", est: true, buy: "india",
        specs: [["Layout", "7.x.6 at x = 2.0 / 3.9 / 5.4 m"]],
        perf: "Gives row 2 an overhead of its own. A small gain for ₹1.1 L more.",
      },
      {
        id: "on-ceiling", tier: "avoid", name: "Angled on-ceiling boxes", price: p("K5S", 2), priceNote: "e.g. 4× RP-500SA II on brackets", buy: "india",
        specs: [["Drop", "150–200 mm below the ceiling"]],
        perf: "Steals headroom the lowered ceiling already took; nothing may hang over the riser walkway.",
      },
    ],
    review: {
      verdict: "qualified", headline: "Four is right under ₹30 L, at positions that finally work for both rows.",
      right: "Yes — wide dispersion at 1.0–1.45 m from ears.", overkill: "No.", under: "No.",
      better: "JBL 280CSA is a coin-flip alternative with an angled baffle.",
      premium: "None.", notice: "Four vs six: row 1 wouldn't; row 2 slightly.", elsewhere: "Yes — six overheads are the wrong place for the next ₹1.1 L.",
      integrator: "They'd confirm the void above the 2.55 m ceiling has room for the backboxes clear of ducts and isolation hangers, and keep any ceiling absorber clouds away from the speaker cut-outs.",
    },
  },

  /* ============================================================== subs */
  {
    id: "subs", name: "Subwoofers", group: "bass", qty: 4,
    placement: "Front pair: SVS PB-1000 Pro in the baffle cavity at 1.25 m and 2.90 m from the left wall, turned sideways so their 0.51 m depth runs along the wall — clear of the L and R stands. Rear pair: sealed SB-1000 Pro in the riser's rear corners, standing on the slab through cutouts so they can't drum the hollow riser. Each on its own Denon sub output, set by Dirac Bass Control.",
    why: "Front and rear subs cancel the 28 Hz length mode that makes row 2 boom and row 1 thin; the front pair near the quarter points tames the 41.5 Hz width mode. The review changed the rear pair: a ported sub 0.5 m from row-2 ears puts port noise within arm's length and drums a timber riser. Small sealed boxes fix both, and ₹1.1 L cheaper. Modelled at 20, 25 and 31.5 Hz with pressure-vessel gain and a 3 dB loss for joint optimisation, the mixed array reaches ~116 / 119 / 120.5 dB against a 115–118 dB need.",
    upgrade: "The same array with SB-2000 Pro at the rear (+₹2.0 L) or four PB-1000 Pro (+₹1.1 L): +0.2–0.3 points each, and either breaks the contingency.",
    options: [
      {
        id: "mixed-sealed", tier: "recommended", name: "2× SVS PB-1000 Pro (front) + 2× SB-1000 Pro (rear, sealed)", price: p("PB1P", 2) + p("SB1P", 2), priceNote: "PB-1000 Pro ₹1,46,600 each (Audio Visual Kart); SB-1000 Pro ₹82k–99.5k each", buy: "india",
        specs: [["Front", "12″ ported, 325 W — ~104 dB at 20 Hz each (est.)"], ["Rear", "12″ sealed, 325 W, 0.33 m cube — ~92 dB at 20 Hz each (est.)"], ["Array at the seats", "~116 / 119 / 120.5 dB at 20 / 25 / 31.5 Hz (est.)"], ["Control", "SVS app: PEQ, phase, room gain"]],
        perf: "The baseline.",
        importNote: "AVStore is SVS's official partner; 5-year Indian warranty.",
        service: "SVS India, 5 years.",
        attrs: { spl: "~116 dB at 20 Hz with room gain (est.)", bass: "Ported front, sealed rear", distortion: "Low within its limits", reliability: "Good", warranty: "SVS India, 5 years", import: "None", fit: "Rear pair fits riser cutouts" },
      },
      {
        id: "4pb1000", tier: "alternative", name: "4× SVS PB-1000 Pro", price: p("PB1P", 4), priceNote: "₹1,46,600 each at Audio Visual Kart", buy: "india",
        specs: [["Array at the seats", "~120 / 122 / 123 dB (est.)"]],
        perf: "The first draft's pick. 4 dB more at 20 Hz, but ported subs on the riser beside row 2 bring port noise and riser buzz. +₹1.1 L, and it uses up the contingency.",
        attrs: { spl: "~120 dB at 20 Hz (est.)", fit: "Only with a solid, filled riser" },
      },
      {
        id: "sealed-2000", tier: "step-up", name: "2× PB-1000 Pro + 2× SB-2000 Pro (sealed)", price: p("PB1P", 2) + p("SB2P", 2), priceNote: "SB-2000 Pro ₹1,89,500 each (AVStore)", buy: "india",
        specs: [["Rear", "12″ sealed, 500 W, 0.36 m cube"], ["Array", "~118 / 121 / 122.5 dB (est.)"]],
        perf: "The reviewer's suggestion: 2 dB more with the same sealed rear. +₹2.0 L — first in line if the cap rises.",
      },
      {
        id: "4spl150", tier: "alternative", name: "4× Klipsch SPL-150", price: p("SPL15", 4), priceNote: "₹1,28,900 each at VPLAK", buy: "india",
        specs: [["Driver", "15″ ported, 400 W"], ["Array", "~116 / 121 / 124 dB (est.)"]],
        perf: "More at 25–31.5 Hz, no app EQ, and still ported at the riser. +₹0.4 L.",
        attrs: { warranty: "Klipsch India", fit: "Ported rear pair" },
      },
      {
        id: "4sb1000", tier: "alternative", name: "4× SVS SB-1000 Pro (sealed)", price: p("SB1P", 4), priceNote: "₹82k–99.5k each", buy: "india",
        specs: [["Array", "~108 / 114 / 117 dB (est.)"]],
        perf: "Compact and tight, but 7 dB short at 20 Hz at reference. Fine if you watch quietly.",
        attrs: { fit: "Quiet listeners" },
      },
      {
        id: "2pb2000", tier: "alternative", name: "2× SVS PB-2000 Pro", price: p("PB2P", 2), priceNote: "₹2,18,500 each at AVStore", buy: "india",
        specs: [["Driver", "12″ ported, 550 W"]],
        perf: "Plenty of output, but two subs leave large seat-to-seat swings across two rows.",
        attrs: { bass: "Deep but uneven across six seats", fit: "Wrong architecture" },
      },
      {
        id: "diy18", tier: "avoid", name: "4× DIY 18″ (Lavoce / B&C pro drivers, Crown XLS amps)", price: 280000, priceNote: "Drivers ₹22–32k each (IndiaMART, one seller in Hyderabad) + boxes + amps + DSP (est.)", est: true, buy: "india",
        specs: [["Drivers", "Pro-audio 18″, tuned for 40 Hz and up"]],
        perf: "The drivers sold in India are PA designs: they want large ported boxes and heavy EQ to reach 20 Hz, and the boxes don't fit this room. True home-cinema 18s must be imported.",
      },
    ],
    review: {
      verdict: "agree", headline: "Four subs is still the most important decision under ₹30 L; the review made the rear pair sealed.",
      right: "Yes.", overkill: "No.", under: "Only at full reference at 20 Hz, by ~1 dB after optimisation losses (est.).",
      better: "SB-2000 Pro at the rear for 2 dB more, if the cap rises.",
      premium: "Over 2× PB-2000 Pro: yes, because evenness across six seats beats output at one.",
      notice: "Two vs four: yes, at every seat.", elsewhere: "No.",
      integrator: "They'd measure before fixing positions, run long RCA lines with a common earth (dedicated earth pit, neutral–earth under 2 V), and fill or decouple the riser so it doesn't sing.",
    },
  },

  /* ========================================================= projector */
  {
    id: "projector", name: "Projector", group: "picture", qty: 1,
    placement: "On a shelf on the rear wall in a lined, ventilated hush box, lens at 2.40 m, centred: 5.02 m throw, ratio 1.89 (NZ500 zoom 1.35–2.16), 50% vertical lens shift (limit ±70%).",
    why: "In a black room, native contrast decides the picture. Measured native contrast per lakh: NZ500 ~5,000:1 at a warranted price, Sony XW5100 ~2,700:1, Epson ~1,100:1. It won 90% of the Monte Carlo runs; the NZ700 won the rest, only when the other prices fell.",
    upgrade: "NZ700 (list ₹10.7 L) when the cap allows: +1.3 points for about ₹3.75 L.",
    options: [
      {
        id: "nz500", tier: "recommended", name: "JVC DLA-NZ500", price: p("NZ5"), priceNote: "Budgeted at ₹5.75 L — list ₹6.49–6.59 L less ~11% from an authorised dealer (est.). Forum quotes of ₹4.19–5.0 L may be grey stock without JVC India warranty", est: true, buy: "india",
        specs: [["Panel", "Native 4K D-ILA, laser"], ["Native contrast", "~23–40k:1 measured (Projector Central, Projector Reviews)"], ["Brightness", "~1,450–1,800 lm calibrated"], ["Throw / shift", "1.35–2.16 · V ±70%, H ±28%, motorised"], ["Warranty", "3 years, JVC India"]],
        perf: "The baseline.",
        importNote: "AV-Vision India (Hyderabad) and SH Digital stock it. Insist on a GST invoice and JVC India warranty card; anything under ₹5 L, ask why.",
        service: "Universal voltage; JVC India 3-year warranty.",
        attrs: { measured: "Native ~23–40k:1", hdr: "~105 nits on 120″ (est.) with Frame Adapt HDR", black: "Deep", reliability: "Sealed laser engine", warranty: "JVC India, 3 years", import: "None", fit: "Throw 1.89 mid-zoom" },
      },
      {
        id: "xw5100", tier: "alternative", name: "Sony VPL-XW5100 (Bravia Projector 7)", price: p("XW51"), priceNote: "₹5.30–5.99 L (VPLAK, AVStore); launch ₹6.5 L", buy: "india",
        specs: [["Native contrast", "~13–15k:1 measured"], ["Brightness", "~1,800 lm (Reference)"]],
        perf: "Excellent processing and motion, but visibly lighter blacks in every letterboxed film. Costs more.",
        attrs: { black: "About 2.5× lighter than the NZ500", hdr: "Good", warranty: "Sony India 3 yr, laser 3 yr / 5,000 h", fit: "Better with some room light" },
      },
      {
        id: "xw5000", tier: "alternative", name: "Sony VPL-XW5000ES", price: 430000, priceNote: "₹4.30 L at AV Shack (backordered); ₹4.85–5.5 L VPLAK", buy: "india",
        specs: [["Native contrast", "~8.7–13k:1 measured"]],
        perf: "Cheaper but greyer still; availability uncertain.",
        attrs: { black: "Grey in a black room" },
      },
      {
        id: "ls12000", tier: "alternative", name: "Epson EH-LS12000B", price: p("LS12"), priceNote: "₹4.49 L sale at AVStore", buy: "india",
        specs: [["Native contrast", "~4.5–5.3k:1"], ["Lens", "1.35–2.84, huge shift"]],
        perf: "Cheaper and flexible, but blacks are grey in a black room.",
        attrs: { black: "Grey", fit: "Wrong trade" },
      },
      {
        id: "nz700", tier: "step-up", name: "JVC DLA-NZ700", price: p("NZ7"), priceNote: "List ₹10.7 L at SH Digital; ~₹9.5 L assumed after discount (est.)", est: true, buy: "india",
        specs: [["Native contrast", "~33–50k:1"], ["Brightness", "~1,900 lm"]],
        perf: "Deeper blacks and a better lens, but it breaks the ₹30 L cap unless you give up two subs or the treatment — both bigger losses.",
      },
      {
        id: "dlp", tier: "avoid", name: "BenQ W5800 / Valerion VisionMaster Max", price: 494000, priceNote: "₹4.71 L / ₹5.17 L (VPLAK)", buy: "india",
        specs: [["Native contrast", "~1.5–4.3k:1"]],
        perf: "DLP-class blacks: wrong for a black room at this price.",
      },
    ],
    review: {
      verdict: "agree", headline: "The clearest decision in the system — budgeted at a warranted price, not the forum quote.",
      right: "Yes.", overkill: "No.", under: "No for SDR; HDR at ~105 nits is good for projection.",
      better: "No at this price in India.", premium: "NZ700's +₹3.75 L buys 1.3 points; not inside the cap.",
      notice: "Against Sony/Epson: every dark scene.", elsewhere: "No.",
      integrator: "They'd get the NZ500 price in writing with the warranty (even at full list the system is ₹29.4 L with the contingency intact) and build a damped hush box, open at the front, with ducted intake and exhaust — the chassis is 0.9 m above row-2 heads, and Hyderabad summers are hot.",
    },
  },

  /* ============================================================ screen */
  {
    id: "screen", name: "Screen", group: "picture", qty: 1,
    placement: "Fixed frame at the front of the stage, 2.66 × 1.49 m, bottom edge at 0.90 m, top at 2.39 m; black velvet border; 150 mm to the ceiling.",
    why: "Woven AT loses 1–2 dB of treble (fixable) where perforated fabric risks moiré with row 1 at 2.9 m. Grandview is stocked by AV-Vision in Hyderabad.",
    upgrade: "Stewart through Sunlite Systems (Delhi) if a sample of the Grandview shows its weave from row 1.",
    options: [
      {
        id: "grandview-aw6", tier: "recommended", name: "Grandview Prestige fixed frame, AW6 woven AT, 120″ 16:9", price: p("GVW"), priceNote: "Price on request at AV-Vision India, Hyderabad (est. ₹0.6–1.2 L)", est: true, buy: "india",
        specs: [["Material", "Woven acoustically transparent"], ["Gain", "~1.0 (est.)"], ["Dealer", "AV-Vision India, Hyderabad"]],
        perf: "The baseline.",
        attrs: { black: "No gain penalty", import: "None — local dealer", fit: "Test a sample at 2.9 m" },
      },
      {
        id: "elite-aeon", tier: "alternative", name: "Elite Aeon AcousticPro UHD", price: 160000, priceNote: "Listed at Ooberpad, price on request (est. ₹1.2–2 L)", est: true, buy: "india",
        specs: [["Material", "4K woven AT"], ["Measured", "High gain and sharp; weaker acoustics (Pixel Home Theater)"]],
        perf: "Sharper, brighter, but more treble loss — the centre speaker needs more EQ.",
        attrs: { fit: "Picture-first alternative" },
      },
      {
        id: "elite-sable", tier: "alternative", name: "Elite Sable AcousticPro1080P3", price: 40000, priceNote: "₹40,000 at AVStore", buy: "india",
        specs: [["Material", "Perforated AT"]],
        perf: "Cheapest; the perforation is visible from row 1 at 2.9 m.",
        attrs: { fit: "Visible texture from row 1" },
      },
      {
        id: "stewart", tier: "step-up", name: "Stewart fixed frame AT (via Sunlite Systems)", price: 450000, priceNote: "On quote (est. ₹3–6 L)", est: true, buy: "india",
        specs: [["Material", "Stewart woven/microperf options"]],
        perf: "Reference uniformity, far past the cap.",
      },
      {
        id: "prime-perf", tier: "avoid", name: "Generic perforated AT (e.g. 'Prime')", price: 75000, priceNote: "₹65–84.5k at AV Shack", buy: "india",
        specs: [["Material", "Perforated"]],
        perf: "Moiré risk with native 4K at 2.9 m, and more treble loss.",
      },
    ],
    review: {
      verdict: "qualified", headline: "Right type; the price and the weave both need checking with a sample.",
      right: "Yes — woven AT at gain ~1.0.", overkill: "No.", under: "No.",
      better: "Only if the sample shows texture; then the Elite Aeon.",
      premium: "None.", notice: "Weave from row 1: that is the test.", elsewhere: "No.",
      integrator: "They'd view a sample with the actual projector at 2.9 m before ordering, and confirm the frame's top border clears the 2.55 m ceiling.",
    },
  },

  /* ========================================================= processing */
  {
    id: "avr", name: "AV receiver", group: "electronics", qty: 1, rack: "U12–U16",
    placement: "Rack U12–U16 on a shelf, 1U gaps above and below. HDMI in from the sources, fibre HDMI out to the projector; 11 internal amps drive L/C/R, four surrounds and four overheads; four sub outputs to the four SVS subs.",
    why: "Eleven amplified channels cover 7.x.4 without an external amp, four independent sub outputs feed Dirac Bass Control and ART, and 13.4 processing leaves room for six overheads later. At ₹2.40 L it ties with an X3800H plus a 3-channel amp and is simpler.",
    upgrade: "Add a 2-channel amp for 7.x.6 later; the A1H only adds channels.",
    options: [
      {
        id: "x6800h", tier: "recommended", name: "Denon AVC-X6800H", price: p("X68"), priceNote: "₹2,39,800 at VPLAK (₹2.49 L AV Shack; MRP ₹4.70 L)", buy: "india",
        specs: [["Channels", "13.4 processing, 11 × 140 W"], ["Sub outputs", "4, independent"], ["Room correction", "Audyssey XT32; Dirac RC, Bass Control, ART as licences"]],
        perf: "The baseline.",
        service: "Denon India warranty.",
        attrs: { roomcorr: "Full Dirac suite", reliability: "Runs warm — needs rack airflow", warranty: "Denon India", import: "None", fit: "Exactly 7.x.4 on its own amps" },
      },
      {
        id: "x3800h-a3", tier: "alternative", name: "Denon AVC-X3800H + Emotiva BasX A3", price: p("X38") + p("BA3"), priceNote: "₹1.41 L (AVStore; ₹1.05 L seen) + ₹0.92 L", buy: "india",
        specs: [["Channels", "11.4 processing, 9 amps + 3 external"], ["Row-2 L/C/R", "+1.5 dB"]],
        perf: "The same Dirac and sub handling, +1.5 dB on the fronts, two boxes, one trigger. A tie on value; it becomes the better buy if the X3800H is found near ₹1.05 L. Check stock: the X3900H has replaced it.",
        attrs: { roomcorr: "Identical", fit: "Tie" },
      },
      {
        id: "x4800h-a3", tier: "alternative", name: "Denon AVC-X4800H + Emotiva BasX A3", price: 146500 + p("BA3"), priceNote: "₹1.47 L at AV Shack + ₹0.92 L", buy: "india",
        specs: [["Channels", "11.4 processing, 9 × 125 W + 3 external"]],
        perf: "Same as above for about the same money.",
      },
      {
        id: "cinema50", tier: "alternative", name: "Marantz Cinema 50 + 2-channel amp", price: 226000 + 60000, priceNote: "₹2.26 L (MRP ₹3.0 L) + amp (est.)", est: true, buy: "india",
        specs: [["Channels", "11.4 processing, 9 amps"], ["Room correction", "Full Dirac options"]],
        perf: "Warmer voicing, same platform; needs extra amplification for 7.x.4.",
      },
      {
        id: "a1h", tier: "reference", name: "Denon AVC-A1H", price: 429800, priceNote: "₹4,29,800 at VPLAK", buy: "india",
        specs: [["Channels", "15.4, 15 × 150 W"]],
        perf: "Four channels you won't use under a 2.55 m ceiling; +0.2 points for ₹1.9 L.",
      },
      {
        id: "yamaha", tier: "avoid", name: "Yamaha RX-A series / Onkyo TX-RZ50", price: 210000, priceNote: "Yamaha India lists its AVRs as discontinued; RZ50 ₹2.1 L", buy: "india",
        specs: [["Subs", "2 outputs — no 4-sub joint optimisation"]],
        perf: "No path to four independently optimised subs.",
      },
    ],
    review: {
      verdict: "qualified", headline: "Right platform; X6800H vs X3800H + amp is a coin toss — buy whichever is in stock and cheaper on the day.",
      right: "Yes.", overkill: "No.", under: "No.",
      better: "X3800H + BasX A3 if the X3800H is found near ₹1.05 L.",
      premium: "Over the X3800H alone: you need 11 amps, so no.",
      notice: "Between the two: no.", elsewhere: "The A1H's extra ₹1.9 L definitely is.",
      integrator: "They'd insist on an authorised invoice (warranty), the 1U gaps, and a cooled closet in a Hyderabad summer.",
    },
  },
  {
    id: "roomcorr", name: "Room correction", group: "electronics", qty: 1, qtyLabel: "Licence bundle",
    placement: "Runs in the Denon; measured from a laptop with the UMIK-1 at 13+ positions across both rows; two presets (row 1, all seats).",
    why: "Four subs only work as a system when their delays, levels and EQ are set together for every seat — that's Dirac Bass Control. ART shortens bass decay using the other speakers.",
    upgrade: "None.",
    options: [
      {
        id: "dirac", tier: "recommended", name: "Dirac Live RC + Bass Control + ART", price: p("DRC"), priceNote: "$799 bundle at card forex (~₹88) + 18% IGST ≈ ₹83k (est.); Dirac online store, international card needed", est: true, buy: "india",
        specs: [["Needs", "4 independent sub outputs — X3800H and up"], ["Target", "Flat 200 Hz–2 kHz, +4–6 dB below 100 Hz, −2–3 dB at 10 kHz"], ["ART", "Confirm the X6800H firmware supports it before buying the bundle; if not, buy RC + Bass Control now and ART later"]],
        perf: "The baseline.",
        attrs: { roomcorr: "Best multi-sub correction available", import: "Digital licence", fit: "Essential" },
      },
      {
        id: "audyssey", tier: "alternative", name: "Audyssey MultEQ XT32 (+ MultEQ-X app)", price: 19000, priceNote: "Built in; MultEQ-X app ~$199 (est.)", est: true, buy: "india",
        specs: [["Subs", "Measures subs, no joint per-seat optimisation"]],
        perf: "Competent; can't make four subs even across six seats the way Bass Control does.",
      },
    ],
    review: {
      verdict: "agree", headline: "₹83k that does more for bass evenness than any sub upgrade — though the review halved the credit the first draft gave it.",
      right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "Justified.",
      notice: "Yes, seat to seat.", elsewhere: "No.",
      integrator: "They'd correct only below ~500 Hz and verify every change in REW.",
    },
  },

  /* =========================================================== sources */
  {
    id: "streamer", name: "Streamer", group: "electronics", qty: 1, rack: "U18–U19 (shelf)",
    placement: "Rack shelf; HDMI to the Denon; wired Ethernet; RF/IP remote.",
    why: "Frame-rate and dynamic-range matching, every Indian service.",
    upgrade: "None.",
    options: [
      { id: "atv", tier: "recommended", name: "Apple TV 4K 128 GB", price: p("ATV"), priceNote: "₹31,900 on Apple India (after the 2026 price rise)", buy: "india", specs: [["Key setting", "Match frame rate and range ON"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "firetv", tier: "alternative", name: "Fire TV Stick 4K Max", price: 7000, priceNote: "~₹7,000", est: true, buy: "india", specs: [["Form", "Stick"]], perf: "Fine picture, weaker frame-rate handling." },
      { id: "shield", tier: "alternative", name: "Nvidia Shield TV Pro", price: 42800, priceNote: "~₹42,800 (Amazon.in, import seller)", buy: "india", specs: [["Plays", "Local lossless files"]], perf: "Ageing hardware; no warranty route." },
    ],
    review: { verdict: "agree", headline: "Right, and now expensive — still the best streamer.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "Fine.", notice: "Frame-rate matching, yes.", elsewhere: "No.", integrator: "They'd test the remote through the isolated wall." },
  },
  {
    id: "player", name: "Disc player", group: "electronics", qty: 1, rack: "U18–U19 (shelf)",
    placement: "Rack shelf beside the Apple TV; HDMI to the Denon.",
    why: "UHD Blu-ray is the only legal route to lossless Atmos and full-bitrate picture — the material this room is built for.",
    upgrade: "None.",
    options: [
      { id: "ub820", tier: "recommended", name: "Panasonic DP-UB820", price: p("UB8"), priceNote: "₹98,000 at AVStore (import pricing)", buy: "india", specs: [["Formats", "UHD Blu-ray, HDR10+, Dolby Vision"], ["Audio", "Lossless Atmos bitstream"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "z9x", tier: "alternative", name: "Zidoo Z9X Pro", price: 54900, priceNote: "₹54,900 (Melody Media, AV Shack, VPLAK)", buy: "india", specs: [["Plays", "Remux files of your discs"]], perf: "Same quality, ₹43k cheaper, no discs — a copyright grey area in India." },
      { id: "none", tier: "alternative", name: "Streaming only", price: 0, priceNote: "—", buy: "india", specs: [["Audio", "Lossy Atmos (DD+)"]], perf: "Saves ₹98k; you lose lossless audio and give up bitrate in dark scenes." },
    ],
    review: { verdict: "qualified", headline: "₹98k is import pricing; if you stream 90% of the time, this is the first line to cut to stay under the cap.", right: "Yes for a movie-first room.", overkill: "No.", under: "No.", better: "Zidoo is cheaper but grey.", premium: "High for what it is.", notice: "Disc vs streaming: yes, in loud and dark scenes.", elsewhere: "If prices move, cut this before the subs.", integrator: "They'd make sure it goes into the Denon, not the projector." },
  },
  {
    id: "mic", name: "Measurement mic", group: "electronics", qty: 1,
    placement: "Tripod at ear height for each measurement position.",
    why: "Dirac supports it; it lets you re-measure after any change.",
    upgrade: "None.",
    options: [
      { id: "umik1", tier: "recommended", name: "miniDSP UMIK-1", price: p("UMK"), priceNote: "₹13,400 (Avenue Sound); ₹15,899 Amazon.in", buy: "india", specs: [["Type", "USB, per-serial calibration file"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "umik2", tier: "alternative", name: "miniDSP UMIK-2", price: 17000, priceNote: "₹17,000 (Techgenie)", buy: "india", specs: [["Type", "Higher max SPL"]], perf: "Headroom you won't use." },
    ],
    review: { verdict: "agree", headline: "Cheap and essential.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.", notice: "It keeps the room calibrated.", elsewhere: "No.", integrator: "They'd use their own reference mic for handover." },
  },

  /* ==================================================== infrastructure */
  {
    id: "treatment", name: "Acoustic treatment", group: "infrastructure", qty: 1, qtyLabel: "To a written spec",
    placement: "Rear wall: 100–150 mm of 48 kg/m³ mineral wool, full width from 0.6 to 2.2 m, behind row 2. Side walls: 50 mm panels on a 50 mm air gap at the first reflections for both rows. Front wall: the black baffle cavity filled with wool. Front corners: floor-to-ceiling 150 mm traps. No ceiling clouds where the in-ceiling speakers go.",
    why: "Untreated, this room would ring for about 0.6 s. Row-2 ears are ~0.57 m from the rear wall, so the reflection arrives 1.14 m late and cancels around 150 Hz — a notch no room correction can fill. Only thick absorption at the rear wall removes it. The review's point: 'treatment packages' sold in India are usually 9–12 mm PET panels and foam, which work only above ~1 kHz, dull the treble and leave the mid-bass untouched. So the spec is written into the contract, with a measured RT60 of 0.25–0.35 s, flat from 125 Hz to 4 kHz, before and after.",
    upgrade: "Specialist-built and measured (+₹1.2 L) for finish and a guaranteed result; rear-wall diffusion above 1.9 m later.",
    options: [
      { id: "spec-diy", tier: "recommended", name: "Thick absorbers to a written spec, carpenter-built", price: p("TD"), priceNote: "Rockwool/Twiga 48 kg/m³ ~₹245/m² per 50 mm; AT fabric ₹440–480/m; carpentry (est.)", est: true, buy: "india", specs: [["Rear wall", "100–150 mm wool, ~7 m²"], ["Reflections", "50 mm on a 50 mm gap, ~10 m²"], ["Target", "RT60 0.25–0.35 s, 125 Hz–4 kHz, measured with the UMIK-1 in REW"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "spec-pro", tier: "step-up", name: "The same spec, specialist-built and measured", price: p("TC"), priceNote: "₹350–600/sq ft installed (est.)", est: true, buy: "india", specs: [["Adds", "Finish, fibre containment, before-and-after RT60 report"]], perf: "+0.4 in the model for ₹1.2 L; it eats the contingency, so only once prices are in writing." },
      { id: "thin-pet", tier: "avoid", name: "Typical 'acoustic package' (9–12 mm PET panels, foam traps)", price: p("TP"), priceNote: "₹250–400/sq ft installed (est.)", est: true, buy: "india", specs: [["Works above", "~1 kHz only"]], perf: "Costs more than the spec'd build and is worse: dull treble, boomy mid-bass, the 150 Hz notch untouched." },
      { id: "none-t", tier: "avoid", name: "No treatment", price: 0, priceNote: "—", buy: "india", specs: [["RT60", "~0.6 s (est.)"]], perf: "Boomy, bright, smeared dialogue: −4 points in the model." },
    ],
    review: { verdict: "agree", headline: "Non-negotiable — and only if the spec is in the contract.", right: "Yes.", overkill: "No.", under: "No.", better: "The specialist-built version if the budget allows.", premium: "Carpenter vs specialist: ₹1.2 L for finish and certainty.", notice: "Yes — everything sounds clearer, especially row 2.", elsewhere: "No.", integrator: "They'd measure RT60 before and after, in REW, and not pay the final instalment until it's in range." },
  },
  {
    id: "ups", name: "UPS & power", group: "infrastructure", qty: 1, qtyLabel: "UPS + PDU + surge",
    placement: "Tower UPS in the rack's base bay, PDU above it. Dedicated circuits: rack (via UPS), projector outlet at the rear shelf (via UPS), and a subwoofer circuit to the four sub outlets on the same earth as the rack.",
    why: "Online double conversion rides through Hyderabad's sags and switchovers; 3 kVA covers the Denon, sources and projector with room to spare.",
    upgrade: "APC Smart-UPS SRT for hot-swap batteries.",
    options: [
      { id: "apc-srv3ki", tier: "recommended", name: "APC Easy UPS SRV3KI + rack PDU + Type-2 SPD", price: p("UPS"), priceNote: "UPS ₹39.5–42k (IndiaMART); PDU/SPD est.", buy: "india", specs: [["Topology", "Online double conversion, 3 kVA"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "vertiv", tier: "alternative", name: "Vertiv GXT-MT 3 kVA", price: 43500, priceNote: "₹28,500 + PDU/SPD", buy: "india", specs: [["Topology", "Online"]], perf: "Equivalent." },
      { id: "furman", tier: "avoid", name: "Furman PL-8C E conditioner", price: 62445, priceNote: "₹62,445 (Reynold's)", buy: "india", specs: [["Does", "Surge + filtering; no regulation, no backup"]], perf: "Costs more than the UPS and does less." },
    ],
    review: { verdict: "agree", headline: "Cheap insurance.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.", notice: "The first time the power blips.", elsewhere: "No.", integrator: "They'd check neutral-to-earth under 2 V and put the subs on the same earth." },
  },
  {
    id: "rack", name: "Rack", group: "infrastructure", qty: 1,
    placement: "24U, 600 × 800 floor rack in the AV closet outside the left wall, with a fan tray; the tower UPS stands in its base.",
    why: "Keeps heat and fans out of the room; the closet needs an exhaust fan or AC in summer.",
    upgrade: "None.",
    options: [
      { id: "rack24", tier: "recommended", name: "24U 600×800 floor rack + fan tray", price: p("RCK"), priceNote: "Netrack/Rackom class (est.)", est: true, buy: "india", specs: [["Depth", "800 mm"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "rack18", tier: "alternative", name: "18U wall/floor rack", price: 12000, priceNote: "₹7.5–17k (IndiaMART)", buy: "india", specs: [["Space", "No room for a tower UPS"]], perf: "Too small once the UPS is inside." },
    ],
    review: { verdict: "agree", headline: "Local rack; spend on the closet's cooling instead.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.", notice: "Only if it overheats.", elsewhere: "Closet ventilation.", integrator: "They'd add a temperature alert." },
  },
  {
    id: "cabling", name: "Cabling, mounts, baffle & hush box", group: "infrastructure", qty: 1, qtyLabel: "Set",
    placement: "Two 15 m fibre HDMI (one spare) through the ceiling void; 12 AWG to all speakers; four shielded RCA runs to the subs; the black absorptive baffle wall 100 mm behind the screen, with the L/C/R stands; the projector shelf inside a ventilated, damped hush box.",
    why: "Fibre is the only reliable 48 Gbps link over 15 m; the RCA sub runs need good shielding and a common earth. The baffle wall hides the speakers, stops reflections off the front wall and gives the ports somewhere to go; the hush box keeps the projector fan off row 2.",
    upgrade: "None.",
    options: [
      { id: "cables", tier: "recommended", name: "Fibre HDMI ×2, Canare 12 AWG, shielded RCA, mounts + baffle wall + hush box", price: p("CAB") + p("BAF") + p("HSH"), priceNote: "HDMI ₹12,904 each; Canare ₹195/m; baffle ₹0.6 L and hush box ₹0.25 L carpenter-built (est.)", est: true, buy: "india", specs: [["Speaker cable", "~200 m 12 AWG"], ["Baffle", "Ply frame, 50 mm wool, black fabric, full width"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "audiophile", tier: "avoid", name: "Audiophile cables", price: 300000, priceNote: "₹2–5 L", est: true, buy: "india", specs: [["Claim", "Better sound"]], perf: "No audible difference." },
    ],
    review: { verdict: "agree", headline: "Correct; never spend more here.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.", notice: "No.", elsewhere: "Yes.", integrator: "They'd test 4K120 HDR on the fibre before the ceiling closes." },
  },
  {
    id: "network", name: "Network & control", group: "infrastructure", qty: 1, qtyLabel: "Switch + remote",
    placement: "Managed switch in the rack; RF/IP remote hub.",
    why: "Wired control and firmware for the Denon, sources and projector; a remote that works through the isolated wall.",
    upgrade: "None.",
    options: [
      { id: "switch", tier: "recommended", name: "8-port managed switch + RF/IP remote", price: p("NET"), priceNote: "(est.)", est: true, buy: "india", specs: [["Remote", "RF/IP hub"]], perf: "The baseline.", attrs: { fit: "Right" } },
    ],
    review: { verdict: "agree", headline: "Test the remote through the finished wall.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.", notice: "On night one if it doesn't reach.", elsewhere: "No.", integrator: "Fixed IP for the projector." },
  },
  {
    id: "install", name: "Installation", group: "infrastructure", qty: 1, qtyLabel: "Labour + earthing",
    placement: "Pre-wire before the ceiling closes; mount, terminate and commission after. A dedicated earth pit for the AV circuits.",
    why: "Cable routes, speaker cut-outs and the projector shelf are done once. Four long sub runs hum if the earth is poor: check neutral–earth voltage is under 2 V before anything is powered.",
    upgrade: "None.",
    options: [
      { id: "installer", tier: "recommended", name: "Local installer + electrician (earth pit)", price: p("INS") + p("ERT"), priceNote: "₹0.75–1.5 L typical + ₹15k earth pit (est.)", est: true, buy: "india", specs: [["Quotes", "Ojas Home Cinema, AV Central, Edomotics, AV-Vision"]], perf: "The baseline.", attrs: { fit: "Right" } },
    ],
    review: { verdict: "agree", headline: "Get three quotes in Hyderabad.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.", notice: "Only if done badly.", elsewhere: "No.", integrator: "They'd pre-wire six overhead positions even if you install four." },
  },
  {
    id: "calibration", name: "Calibration", group: "infrastructure", qty: 1, qtyLabel: "One visit",
    placement: "After treatment, seats and carpet are in: audio first (REW + Dirac), then video (JVC Auto Cal / ISF).",
    why: "The last 10% that makes the rest pay off: crossovers, sub phase, levels, HDR tone mapping.",
    upgrade: "Remote 3D LUT calibration for the JVC.",
    options: [
      { id: "cal", tier: "recommended", name: "HAA audio + video calibration", price: p("CAL"), priceNote: "₹40–80k audio + ₹30–60k video (est.)", est: true, buy: "india", specs: [["Who", "HAA-certified in South India (e.g. Madurai), plus video"]], perf: "The baseline.", attrs: { fit: "Right" } },
      { id: "self", tier: "alternative", name: "Self-calibration", price: 0, priceNote: "Your time", buy: "india", specs: [["Needs", "UMIK-1, REW, Dirac, JVC Auto Cal meter"]], perf: "85–90% with patience." },
    ],
    review: { verdict: "agree", headline: "Pay for it once, after the room is finished.", right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "Justified.", notice: "Yes.", elsewhere: "No.", integrator: "They'd refuse to calibrate before the carpet and seats are in." },
  },
];
