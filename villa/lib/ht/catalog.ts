import type { Component, Option } from "./types";

/**
 * Every component in the theatre, with the recommendation, its closest
 * alternatives, the step-up and the reference choice, and an independent
 * evaluator's review of the recommendation.
 *
 * Prices are landed rupees for the component's full quantity at ₹96/USD,
 * ₹75/SGD, ₹12.3/HKD, ₹2.9/THB, ₹14.3/CNY (late September 2026). Anything
 * marked `est` could not be checked against a live listing — confirm before
 * paying. Imports above the ₹75,000 baggage allowance carry about 35% duty
 * (courier personal imports about 31%).
 */

/* ------------------------------------------------------ surround family */

const surroundFamily = (qty: number, spot: string): Option[] => [
  {
    id: "arendal-surround-s", tier: "recommended", name: "Arendal 1723 Surround S THX",
    price: qty * 112500, priceNote: "~$800 each, landed in the same air-cargo shipment as the L/C/R", est: true,
    buy: "threshold", threshold: 35,
    specs: [
      ["Type", "On-wall, switchable monopole / dipole"],
      ["Sensitivity", "87 dB (2.83 V / 1 m)"],
      ["Depth", "17 cm (38 × 37 × 17 cm, 13.7 kg)"],
      ["Output at the seats", `~104–108 dB peak ${spot} (est.)`],
      ["Certification", "THX"],
    ],
    perf: "The baseline: the same voicing as the L/C/R, so pans between them sound seamless.",
    importNote: "Ships with the L/C/R from Arendal. Indian dealer prices run about 2× US.",
    service: "Passive. Warranty means shipping back to Arendal.",
    attrs: {
      measured: "Smooth, well-behaved on and off axis (Arendal/THX data)",
      spl: "~108 dB at 1 m from the Denon's 150 W — plenty at 1–2.5 m",
      directivity: "Monopole for Atmos-era imaging; dipole as a fallback",
      reliability: "Simple passive",
      warranty: "Return to Arendal",
      import: "Consolidated air cargo; threshold 35%",
      fit: "Matches the fronts; 17 cm depth costs width in a 4.13 m room",
    },
  },
  {
    id: "jbl-scl7", tier: "alternative", name: "JBL Synthesis SCL-7 (in-wall)",
    price: qty * 140000, priceNote: "~$1,200 each; India via Harman dealers (est.)", est: true, buy: "india",
    specs: [["Type", "In-wall, 2 × 5.25\" + tweeter"], ["Designed for", "Surround and width channels"], ["Depth", "Flush — inside the wall lining"]],
    perf: "Flush with the wall, so each side gives back 120 mm next to seats that are only 0.48–0.80 m from the walls. Similar output. Its timbre matches JBL fronts better than the Arendal L/C/R.",
    importNote: "Sold in India through Harman; no import.",
    service: "Local Harman warranty.",
    attrs: { spl: "Comparable", directivity: "Controlled, wall-flush", warranty: "Harman India", import: "None needed", fit: "Better fit physically; slightly weaker timbre match to Arendal fronts" },
  },
  {
    id: "perlisten-s4i", tier: "alternative", name: "Perlisten S4i (in-wall)",
    price: qty * 225000, priceNote: "~$2,300 each (est.); India distributor in Chennai, dealer in Hyderabad", est: true, buy: "india",
    specs: [["Type", "In-wall, DPC array"], ["Certification", "THX Dominus (surround)"], ["Peak output", "112 dB"]],
    perf: "More output and tighter vertical dispersion. At 1–2.5 m from the seats, that headroom is never used.",
    service: "Local distributor.",
    attrs: { spl: "112 dB peak — far more than needed", directivity: "DPC array narrows vertical spread", fit: "Overkill at this distance" },
  },
  {
    id: "arendal-surround-full", tier: "step-up", name: "Arendal 1723 Surround THX (full size)",
    price: qty * 145000, priceNote: "~$1,000 each, landed (est.)", est: true, buy: "threshold", threshold: 35,
    specs: [["Type", "On-wall, 8\" + waveguide tweeter, 4\" dipole side drivers"], ["Sensitivity", "87 dB"], ["Power handling", "300 W"]],
    perf: "Deeper bass extension that the 80–100 Hz crossover throws away. You would not hear it.",
    attrs: { spl: "A few dB more", fit: "Bigger box for no audible gain" },
  },
  {
    id: "jbl-scl6", tier: "reference", name: "JBL Synthesis SCL-6",
    price: qty * 250000, priceNote: "~$2,500 each (est.)", est: true, buy: "india",
    specs: [["Type", "In-wall, 4 × 5.25\" + compression driver"], ["Sensitivity", "91 dB"], ["Dispersion", "80° × 80° (2–17 kHz)"]],
    perf: "Horn-controlled surrounds for an all-JBL room. Only meaningful paired with SCL-2 fronts.",
    attrs: { directivity: "80° × 80° horn — the most controlled", fit: "Reference system only" },
  },
];

/* ------------------------------------------------------------ catalogue */

export const CATALOG: Component[] = [
  /* ================================================================ LCR */
  {
    id: "lcr", name: "Front L / C / R", group: "speakers", qty: 3,
    placement: "Behind the acoustically transparent screen on the 0.60 m stage. All three mounted vertically, with tweeters at 1.32 m, between row-1 ears (1.10 m) and row-2 ears (1.55 m). L and R sit 0.20 m inside the picture edges (1.10 m and 3.36 m from the left wall). They are toed in about 16° towards the centre seat between the rows. C faces straight ahead.",
    why: "Measured THX Ultra output (89.9 dB at 2.83 V) and a waveguide tweeter give controlled dispersion, which matters because the side walls are only 0.5–0.8 m from the outer seats. At about ₹1.9 L each landed, they reach reference level (105 dB peaks) at row 1 and about 3 dB below it at row 2. That is louder than almost anyone plays a film.",
    upgrade: "Procella P8 in a hard baffle wall (+₹5.2 L) for reference level at row 2 with room to spare. JBL Synthesis SCL-2 is the ceiling.",
    options: [
      {
        id: "arendal-monitor-thx", tier: "recommended", name: "Arendal 1723 Monitor THX",
        price: 570000, priceNote: "$1,300 each; three landed with freight and ~31–35% duty (est.)", est: true,
        buy: "threshold", threshold: 35,
        specs: [
          ["Drivers", "2 × 8\" woofers, 28 mm tweeter in a waveguide"],
          ["Sensitivity", "89.9 dB (2.83 V / 1 m, measured)"],
          ["Certification", "THX Ultra"],
          ["Size / weight", "63.5 × 27.5 × 40 cm, 26.7 kg"],
          ["Peak at row 1 / row 2", "~106 / ~102 dB (est.)"],
          ["Crossover", "80 Hz to the subwoofers"],
        ],
        perf: "The baseline.",
        importNote: "Arendal sells direct from Norway and the US; Indian dealers charge about 2×. Three boxes of ~32 kg each go as one consolidated air-cargo shipment. Duty is about 31–35%.",
        service: "Passive, so voltage doesn't matter. Warranty means shipping a 27 kg box back, but drivers rarely fail. Keep one spare tweeter.",
        attrs: {
          measured: "Flat on axis, smooth directivity (spinorama.org, Audio Science Review)",
          spl: "~113 dB peak at 1 m → ~106 dB row 1, ~102 dB row 2",
          distortion: "Low at normal levels; the first to compress near reference at row 2",
          directivity: "Waveguide, moderately controlled",
          bass: "Crossed to the subs at 80 Hz",
          reliability: "Simple passive, good track record",
          warranty: "Manufacturer; return to Arendal",
          import: "One air-cargo shipment; import if 35%+ under the Indian price",
          fit: "Right size for a 64 m³ room and a 0.60 m stage",
        },
      },
      {
        id: "arendal-monitor-s", tier: "alternative", name: "Arendal 1723 Monitor S THX",
        price: 440000, priceNote: "~$1,000 each, landed (est.)", est: true, buy: "threshold", threshold: 35,
        specs: [["Sensitivity", "88.7 dB (measured)"], ["Size / weight", "56.9 × 24.5 × 32 cm, 18.7 kg"], ["Certification", "THX"]],
        perf: "About 2–3 dB less headroom. You can't tell them apart below about 8 dB under reference. Saves ₹1.3 L.",
        attrs: { measured: "88.7 dB measured; smooth spin (Erin's Audio Corner)", distortion: "Compresses 2–3 dB earlier", bass: "Crossed to subs at 80 Hz", reliability: "Simple passive", import: "Same shipment as the rest; threshold 35%", spl: "~2–3 dB less than the Monitor THX", directivity: "Same waveguide family", fit: "Fine if you never listen loud" },
      },
      {
        id: "kef-ci3160", tier: "alternative", name: "KEF Ci3160RLM-THX (in-wall)",
        price: 700000, priceNote: "~$2,000 each; sold in India through KEF dealers (est.)", est: true, buy: "india",
        specs: [["Drivers", "3-way Uni-Q coaxial + 2 × 6.5\" woofers"], ["Sensitivity", "89 dB rated, 87.3 dB measured"], ["Max SPL", "116 dB (KEF spec)"], ["Dispersion", "~150° — wide"]],
        perf: "Built for a baffle wall, and the Uni-Q images beautifully. But its 150° dispersion throws more energy at side walls 0.5 m from the outer seats, so you'd need more treatment. Slightly less output.",
        importNote: "Local warranty, no import.",
        attrs: { measured: "87.3 dB measured (Erin's Audio Corner, RL version)", distortion: "Low", bass: "Crossed to subs at 80 Hz", reliability: "Simple passive", spl: "116 dB (spec)", directivity: "Very wide — works against this narrow room", warranty: "KEF India", import: "None needed", fit: "Good speaker, wrong dispersion for this width" },
      },
      {
        id: "jbl-scl3", tier: "alternative", name: "JBL Synthesis SCL-3 (in-wall)",
        price: 1100000, priceNote: "~$3,300–4,600 each at retail (est.)", est: true, buy: "india",
        specs: [["Drivers", "2 × 5.25\" + 2409H compression driver on an HDI waveguide"], ["Sensitivity", "87.7 dB (vendor)"], ["Low end", "−6 dB at 59 Hz"]],
        perf: "Horn clarity and very controlled directivity, but small woofers. No more output than the Arendal for twice the money.",
        attrs: { measured: "87.7 dB (vendor data on spinorama.org)", distortion: "Compression driver: low at high level", bass: "−6 dB at 59 Hz; crossed at 80 Hz", warranty: "Harman India", import: "None needed", spl: "Similar to the Arendal", directivity: "HDI horn, tightly controlled", fit: "Pays for horn directivity it can't fully use at this size" },
      },
      {
        id: "procella-p8", tier: "step-up", name: "Procella P8 (in a hard baffle wall)",
        price: 1090000, priceNote: "$2,599 each, landed (est.); baffle wall carpentry extra", est: true, buy: "threshold", threshold: 35,
        specs: [["Sensitivity", "92 dB (1 W / 1 m)"], ["Output", "116 dB continuous / 122 dB peak free-standing; 122 / 126 dB in a baffle (spec)"], ["Build", "Cinema-grade, designed for baffle walls"]],
        perf: "Reference level at row 2 with 6–8 dB to spare, and effortless dynamics in the loudest scenes. More than about 5 dB below reference, you'd struggle to tell it from the Arendal.",
        attrs: { measured: "92 dB sensitivity; 122 dB peak (spec)", bass: "Crossed to subs at 80 Hz", reliability: "Cinema-grade", warranty: "Return to Sweden; check for an Indian dealer", import: "Air cargo; threshold 35%", spl: "~114 dB row 1, ~111 dB row 2 before it strains", distortion: "Lower at high level — never compresses in this room", directivity: "Cinema horn pattern", fit: "Only if you listen near reference" },
      },
      {
        id: "jbl-scl2", tier: "reference", name: "JBL Synthesis SCL-2",
        price: 2200000, priceNote: "$5,618 each; India via Harman dealers (est.)", est: true, buy: "india",
        specs: [["Drivers", "2.5-way: 3 × 8\" + D2415K dual 1.5\" compression driver on an HDI horn"], ["Sensitivity", "92 dB"], ["Recommended power", "445 W"]],
        perf: "Studio-cinema headroom and horn directivity. In this room it's barely different from the P8, and only audibly different from the Arendal at high level.",
        attrs: { measured: "92 dB; 57 Hz–25 kHz (−6 dB) (spec)", bass: "Crossed at 80 Hz", reliability: "Install-grade", warranty: "Harman India", import: "None needed", spl: "Reference with large margin", distortion: "Very low at any level you'd use", directivity: "HDI horn", fit: "Built for bigger rooms" },
      },
    ],
    review: {
      verdict: "qualified",
      headline: "The right speaker — but build the baffle wall even in the base system.",
      right: "Yes. Its waveguide, THX Ultra output and dual 8\" woofers suit a 64 m³ room with seats 0.5–0.8 m from the side walls.",
      overkill: "No.",
      under: "Slightly, for row 2 at reference level: about 3 dB short. Few people listen there, but if you do, this is the first component to feel it.",
      better: "Not at this price. The Procella P8 is better on dynamics, not on tone.",
      premium: "Importing is justified: Indian dealer pricing is about twice the US price, which is well past the 35% threshold.",
      notice: "Against the P8, only in the loudest scenes near reference level. Against the Monitor S, rarely.",
      elsewhere: "Yes. A ₹1 L hard baffle wall does more for these speakers than any speaker upgrade: 3–6 dB more low-frequency efficiency, and no front-wall cancellation dip between 100 and 200 Hz.",
      integrator: "An integrator would ask why a free-standing hi-fi cabinet sits behind an AT screen without a baffle. They would want all three at exactly the same height and depth. They would also question importing 80 kg of speakers with no local support.",
    },
  },

  /* ============================================================== wides */
  {
    id: "wides", name: "Wide surrounds", group: "speakers", qty: 2,
    placement: "On the side walls at x = 1.90 m (about 55–60° from row 1), 1.30 m high, aimed at the centre seat of row 1.",
    why: "Row 1 sits close (a 49° screen). L and R are at about ±21° and the side surrounds at about 110°, which leaves an 85° gap. The wides fill it so pans from screen to side stay continuous. Row 2 barely benefits.",
    upgrade: "In-wall JBL SCL-7 to win back 120 mm of width on each side.",
    options: surroundFamily(2, "at row 1"),
    review: {
      verdict: "qualified",
      headline: "Worth it for row 1 only. Wire for them now, buy them last.",
      right: "The product is right. Whether the channel is right depends on who sits in row 1.",
      overkill: "For row 2, yes. From row 2 they sit at about 28°, almost where L and R already are.",
      under: "No.",
      better: "In-wall models (JBL SCL-7) would be better here physically: an on-wall 17 cm box beside a seat that's 0.48 m from the wall is tight.",
      premium: "₹2.25 L, plus the jump from the X4800H to the A1H (~₹4 L), because 9.4.6 needs 15 channels. That makes the true cost of the wides about ₹6 L.",
      notice: "From row 1's outer seats, yes, on fly-bys and sideways pans. From row 2, no.",
      elsewhere: "Probably. ₹6 L puts you most of the way to the NZ800, which everyone in both rows sees in every film.",
      integrator: "They'd ask if the family actually sits in row 1. If the main seat is row 2 centre, drop the wides, run 7.4.6 on the X4800H and move the money to the picture.",
    },
  },

  /* ============================================================== sides */
  {
    id: "sides", name: "Side surrounds", group: "speakers", qty: 2,
    placement: "On the side walls at x = 4.40 m, just past the door frame on the left. Mounted 1.90 m high, angled down about 10° and across towards the far seats, in monopole mode. Row 1 hears them at about 110°, row 2 at about 65°.",
    why: "They sit between the rows so that both rows get a real side image. The height puts them above the nearest heads, so the outer seats aren't blasted by a speaker 0.5 m away.",
    upgrade: "In-wall JBL SCL-7 for a flush fit, or full-size Arendal Surround THX (not audibly better).",
    options: surroundFamily(2, "at both rows"),
    review: {
      verdict: "qualified",
      headline: "Right speaker; use monopole mode and consider going in-wall.",
      right: "Yes, and the timbre matches the fronts.",
      overkill: "No.",
      under: "No. At 1.5–2.5 m they need about 105 dB peak, which they deliver.",
      better: "An in-wall model gives back about 120 mm per side in a room where the right-hand seats are 0.48 m from the wall.",
      premium: "There's no premium to justify.",
      notice: "The monopole vs dipole choice is audible: monopole gives sharper Atmos objects. Using dipole to tame the hot outer seat blurs images.",
      elsewhere: "No. These are cheap for what they do.",
      integrator: "They'd check the left one doesn't clash with the door architrave, and insist on aiming across to the far seat rather than straight out from the wall.",
    },
  },

  /* ============================================================== rears */
  {
    id: "rears", name: "Rear surrounds", group: "speakers", qty: 2,
    placement: "In the rear-wall corners, 0.35 m from each side wall, 2.05 m high, aimed at the centre seat of row 1 (about 145° for row 1).",
    why: "Dolby places rear surrounds behind the last row. Here there's only 0.22 m behind row 2, so the corners at head height plus 0.5 m are the only place left.",
    upgrade: "Trinnov's remapping, or moving them onto the side walls as 'rear sides'.",
    options: [
      ...surroundFamily(2, "at row 1"),
      {
        id: "rear-sides", tier: "alternative", name: "Same speakers, moved to the side walls at x = 5.9 m",
        price: 225000, priceNote: "Same speakers, a different position", est: true, buy: "threshold", threshold: 35,
        specs: [["Position", "Side walls, x = 5.9 m, 2.0 m high, aimed forward and across"], ["Row 1 angle", "~130°"], ["Row 2", "Beside, not behind"]],
        perf: "Evens out the level between rows (row 2 gets a less overpowering source) at the cost of a less 'behind' image for row 1.",
        attrs: { directivity: "Aimed across the room", fit: "More even across both rows" },
      },
    ],
    review: {
      verdict: "disagree",
      headline: "This is the weakest point of the room: row 2 sits 1.2 m from these, row 1 sits 3.3 m.",
      right: "The speaker is fine; the geometry isn't. A 0.22 m gap behind row 2 means no position truly serves both rows.",
      overkill: "No.",
      under: "No. If anything they're too loud for row 2's outer seats.",
      better: "A position rather than a product: the side walls at x = 5.9 m, or pulling row 2 forward 0.18 m by cutting the row pitch to 1.80 m.",
      premium: "No premium involved.",
      notice: "Yes. With row 1 as the main seat, the outer seats of row 2 hear the rears about 9 dB hotter than row 1 does. Calibration can only favour one row.",
      elsewhere: "A Trinnov's remapping is the only electronics that genuinely helps here, and it costs ₹40 L+. Better: save two Dirac presets (row 1 and row 2) and switch between them.",
      integrator: "They'd challenge the room layout rather than the speaker. They'd ask whether two rows of three is essential, or whether a 1.80 m pitch and slimmer wall-hugger recliners could buy 0.4 m behind row 2.",
    },
  },

  /* ============================================================== atmos */
  {
    id: "atmos", name: "Atmos overheads", group: "speakers", qty: 6,
    placement: "Flush in the ceiling in three pairs at x = 2.0 / 3.9 / 5.4 m, in line with L and R (1.10 m and 3.36 m from the left wall).\n• Front pair: about 44° above row 1.\n• Middle pair: overhead for row 1 and about 32° ahead of row 2.\n• Rear pair: about 37° behind row 1, and directly above row 2 at 1.0 m.",
    why: "With the lower ceiling, row 2's ears are only 1.0 m below it. Four overheads would put both pairs in front of row 2. Six gives row 2 an overhead, and gives row 1 a proper front, middle and rear. Coaxial (Uni-Q) drivers spread evenly, so the seat directly underneath isn't blasted.",
    upgrade: "KEF Ci200RR-THX if you want THX certification — not audible at this distance.",
    options: [
      {
        id: "kef-ci200-2cr", tier: "recommended", name: "KEF Ci200.2CR (in-ceiling Uni-Q)",
        price: 390000, priceNote: "~₹65,000 each through KEF India (est.; confirm the current model code)", est: true, buy: "india",
        specs: [["Driver", "8\" Uni-Q coaxial, in-ceiling"], ["Dispersion", "Wide and even — suits speakers 1.0–1.5 m from ears"], ["Mounting", "Flush; check depth against the 203 mm ceiling void"], ["Crossover", "100 Hz to the subwoofers"]],
        perf: "The baseline.",
        importNote: "Sold in India, local warranty.",
        service: "Passive. KEF India warranty.",
        attrs: {
          spl: "~107 dB at 1–1.5 m from the Denon's amps — enough",
          directivity: "Very wide coaxial: even coverage for seats off-axis",
          reliability: "Simple passive",
          warranty: "KEF India",
          import: "None",
          fit: "Right for a 2.55 m ceiling",
        },
      },
      {
        id: "four-tops", tier: "alternative", name: "Four overheads instead of six (same KEF), at x = 2.3 and 4.6 m",
        price: 260000, priceNote: "4 × ₹65,000 (est.)", est: true, buy: "india",
        specs: [["Row 1", "Textbook Dolby top-front (~50°) and top-rear (~53°)"], ["Row 2", "Both pairs ahead of the listener"], ["Channels", "7.4.4 — the X4800H can run it"]],
        perf: "Row 1 gets textbook top-front and top-rear angles. Row 2 hears both pairs in front of it. Saves ₹1.3 L and two amp channels, which also opens the door to the cheaper X4800H.",
        attrs: { directivity: "Same", fit: "Row 1 perfect, row 2 compromised" },
      },
      {
        id: "jbl-scl5", tier: "alternative", name: "JBL Synthesis SCL-5 (in-ceiling)",
        price: 500000, priceNote: "~$1,300 each (est.)", est: true, buy: "india",
        specs: [["Driver", "7\" 2-way, in-ceiling"], ["Sensitivity", "86 dB"], ["Coverage", "Consistent to 60° off axis"]],
        perf: "Matches JBL fronts in timbre. Low sensitivity doesn't matter at 1–1.5 m. Against the KEF: no audible gain.",
        attrs: { directivity: "±60°, controlled", fit: "Pick if the fronts are JBL" },
      },
      {
        id: "kef-ci200rr-thx", tier: "step-up", name: "KEF Ci200RR-THX",
        price: 810000, priceNote: "$1,199.99 each US; ~₹1.35 L each in India (est.)", est: true, buy: "india",
        specs: [["Certification", "THX Ultra in-ceiling"], ["Driver", "Uni-Q + dedicated woofer"]],
        perf: "More output than this room needs at 1.0–1.5 m. The step up is barely audible.",
        attrs: { spl: "Reference output — unused here", fit: "Overkill" },
      },
      {
        id: "kef-ci250rrm", tier: "reference", name: "KEF Ci250RRM-THX",
        price: 1740000, priceNote: "$2,999.99 each US (est. landed)", est: true, buy: "india",
        specs: [["Max SPL", "111 dB"], ["Certification", "THX Extreme"]],
        perf: "Built for large rooms. Pointless at this distance.",
        attrs: { spl: "111 dB", fit: "Wrong scale" },
      },
      {
        id: "angled-boxes", tier: "avoid", name: "On-ceiling angled boxes (e.g. Arendal 1723 S on brackets)",
        price: 675000, priceNote: "6 × ~$800 landed (est.)", est: true, buy: "threshold", threshold: 35,
        specs: [["Drop", "150–200 mm below the ceiling"], ["Headroom on the riser", "Falls below 1.95 m"]],
        perf: "Better timbre match, but it eats the headroom the ceiling drop already took. Nothing may hang over the riser.",
        attrs: { fit: "Doesn't fit the lowered ceiling" },
      },
    ],
    review: {
      verdict: "qualified",
      headline: "Six is right, but the rear pair will be hot for row 2 — and four is a defensible saving.",
      right: "The KEF is right: wide dispersion is exactly what speakers 1.0–1.5 m from ears need.",
      overkill: "No.",
      under: "No.",
      better: "Not a better product, but a different count: four well-placed tops (x = 2.3 and 4.6 m) give row 1 textbook Dolby angles and save ₹1.3 L plus two channels.",
      premium: "The extra pair costs about ₹1.3 L plus, via the 15-channel requirement, the A1H over the X4800H.",
      notice: "Row 2 would notice the middle-to-rear overhead pan. Row 1 wouldn't notice four vs six.",
      elsewhere: "If the main seat is row 1: yes, take four and put the money into the projector.",
      integrator: "They'd measure the rear pair's level at row 2's outer seats. At 1.0 m, the seat directly under a rear top hears it about 3 dB hotter than its neighbour. They'd also check each can clears the ducts and isolation hangers in the void.",
    },
  },

  /* ============================================================== subs */
  {
    id: "subs", name: "Subwoofers", group: "bass", qty: 4,
    placement: "Front pair on the stage behind the screen at ¼ and ¾ of the room width (1.03 m and 3.10 m from the left wall). Rear pair on the riser in the rear corners beside row 2, which needs row-2 recliners no wider than 0.90 m. Each sub has its own amplifier channel and its own Denon sub output, set by Dirac Live Bass Control.",
    why: "Front and rear subs in phase cancel the 28 Hz length mode, which otherwise makes row 2 boomy and row 1 thin. The front pair at the quarter points cancel the 41.5 Hz width mode. With the room's natural gain, four sealed 18\" drivers give about 120 dB at the seats from 20 to 80 Hz, clean down to 15 Hz. That costs less than two branded flagships.",
    upgrade: "Rythmik F18 × 4 for a finished, warrantied product (not a better sound).",
    options: [
      {
        id: "diy-um18", tier: "recommended", name: "4 × DIY sealed 18\": Dayton Audio UMII18-22 in ~150 L boxes",
        price: 330000, priceNote: "~$330 per driver shipped and dutied, plus ₹25,000 per box built in Hyderabad (est.)", est: true, buy: "usa",
        specs: [
          ["Driver", "Dayton UMII18-22, 18\" long-throw, dual 2 Ω voice coils"],
          ["Box", "~150 L sealed, 25 mm BWP marine ply, doubled baffle, braced"],
          ["Footprint", "~0.45 × 0.55 × 0.55 m — slim enough for the rear corners"],
          ["Output (all four)", "~120 dB at the seats 20–80 Hz; usable to 15 Hz (est.)"],
          ["Protection", "12–15 Hz high-pass and a limiter per sub, in the amp's DSP"],
        ],
        perf: "The baseline.",
        importNote: "Drivers only (~25 kg each boxed): a courier personal import (~31%) or checked bags.",
        service: "Passive drivers; only the amps can fail. Use BWP ply because MDF swells in the monsoon and termites eat it.",
        attrs: {
          measured: "data-bass has measured this driver sealed; two sealed 18s lead most branded 15s",
          spl: "~120 dB at the seats with four; room gain adds more below 25 Hz",
          distortion: "Low when sealed and below its excursion limit",
          bass: "Flat in-room to ~15 Hz (sealed roll-off meets room gain)",
          reliability: "Depends on the build; drivers are robust",
          warranty: "Driver warranty via Parts Express only",
          import: "Easy: compact boxes",
          fit: "Best output per rupee for this room",
        },
      },
      {
        id: "svs-pb2000", tier: "alternative", name: "4 × SVS PB-2000 Pro (bought in India)",
        price: 600000, priceNote: "₹1.5 L each on sale at AVStore (list ₹2.19 L); 5-year India warranty", buy: "india",
        specs: [["Driver", "12\" ported, 550 W"], ["Warranty", "5 years, India"]],
        perf: "Turnkey, finished and under warranty. About 6–8 dB less headroom below 20 Hz, and the ports can chuff at high level. Fine unless you want very deep bass at reference level.",
        attrs: { measured: "Audioholics-tested SVS family; ported 12\"", distortion: "Low until the port chuffs at high level", reliability: "Good", spl: "~6–8 dB less below 20 Hz than the DIY 18s", bass: "Ported, strong to ~18 Hz", warranty: "5 years, India", import: "None", fit: "The sensible no-DIY choice" },
      },
      {
        id: "rythmik-fv15", tier: "alternative", name: "4 × Rythmik FV15HP (bought in India)",
        price: 1250000, priceNote: "₹2.85–3.42 L each in India", buy: "india",
        specs: [["Driver", "15\" servo, ported, 600 W"], ["Output", "~115 dB at 31.5 Hz each (data-bass)"]],
        perf: "Excellent, with servo control, but Indian pricing is about twice the US price.",
        attrs: { measured: "~115 dB at 31.5 Hz each (data-bass)", spl: "Similar to the DIY build above 25 Hz", bass: "Ported, deep", reliability: "Good; servo", import: "None — bought in India", distortion: "Servo control keeps it low", warranty: "Indian dealer", fit: "Overpriced here" },
      },
      {
        id: "rythmik-f18", tier: "step-up", name: "4 × Rythmik F18 (sealed 18\", servo), imported",
        price: 1210000, priceNote: "~$2,100 each + air freight (~200 kg) + ~35% duty; insist on 230 V amps (est.)", est: true, buy: "threshold", threshold: 40,
        specs: [["Driver", "18\" sealed, servo feedback"], ["Amp", "Hypex-based plate amp"]],
        perf: "Similar output to the DIY build, lower distortion and a proper finish. You pay ₹8.8 L for convenience and warranty, not for sound.",
        attrs: { measured: "data-bass: F18 ≥8 dB over F12 at 20 Hz", spl: "Similar to the DIY build", bass: "Sealed, flat in-room to ~15 Hz", reliability: "Good; Hypex plate amp", distortion: "Servo — lowest of the turnkey options", warranty: "Rythmik (US), impractical from India", import: "Heavy; air cargo", fit: "Same result, finished" },
      },
      {
        id: "psa-s3612", tier: "reference", name: "4 × PSA S3612 (dual opposed 18\" sealed)",
        price: 1800000, priceNote: "~$2,800 each + sea freight + duty (est.)", est: true, buy: "threshold", threshold: 40,
        specs: [["Drivers", "2 × 18\" B&C, force-cancelling"], ["Amp", "1,920 W"]],
        perf: "Huge headroom down to 10 Hz — felt more than heard. Each weighs 80 kg or more, so they ship by sea only.",
        attrs: { distortion: "Very low; force-cancelling", reliability: "Good", warranty: "PSA (US), impractical from India", import: "Sea freight only — 80 kg+ each", spl: "~8–10 dB beyond the DIY build", bass: "To ~10 Hz at level", fit: "Far beyond this room's needs" },
      },
      {
        id: "two-pb4000", tier: "avoid", name: "2 × SVS PB-4000 (bought in India)",
        price: 830000, priceNote: "₹4.15 L each at ProHiFi", buy: "india",
        specs: [["Driver", "13.5\" ported, 1,200 W"], ["Output", "112 dB at 20 Hz each (Audioholics, 2 m RMS)"]],
        perf: "Two flagships measure well at one seat, but they leave seat-to-seat swings of ±6–10 dB that DSP can't fix. In this room, four modest subs beat two big ones.",
        attrs: { measured: "112.3 dB at 20 Hz each (Audioholics, 2 m RMS)", spl: "Plenty at one seat", warranty: "SVS India, 5 years", import: "None", bass: "Deep, but uneven across six seats", fit: "Wrong architecture" },
      },
    ],
    review: {
      verdict: "agree",
      headline: "Four subs is the single best decision in this design. DIY is a value choice, not a sound choice.",
      right: "Yes: four sealed subs, front and rear, in a small room with an obvious length mode.",
      overkill: "On output, slightly. That's fine: headroom in bass is cheap and makes distortion inaudible.",
      under: "No.",
      better: "Not for sound. For finish and warranty, 4 × SVS PB-2000 Pro bought in India (₹6 L) is the sensible no-DIY choice.",
      premium: "Rythmik F18s cost 3.7× the DIY build for the same bass.",
      notice: "Four subs vs two: yes, at every seat. DIY vs F18: no.",
      elsewhere: "No. This is where the money works hardest.",
      integrator: "They'd worry about build quality: box finish, grille, internal bracing, and a sub rattling the riser. They'd also point out that the rear corner subs are close to row 2's outer seats and will dominate there unless Dirac Bass Control trims them. And they'd ask who fixes it in five years.",
    },
  },

  /* ============================================================ sub amps */
  {
    id: "subamps", name: "Subwoofer amplifiers", group: "bass", qty: 2, rack: "U9, U7",
    placement: "Rack U9 and U7, outside the room. One channel per sub, fed from the Denon's four independent sub outputs. Powered through the sequenced PDU on the dedicated subwoofer circuit, not the UPS.",
    why: "Pro class-D amps put about 1,500 W into each 18\" driver for a fraction of hi-fi prices. Their built-in DSP supplies the high-pass and limiter a sealed 18\" needs. In a rack outside the room, fan noise doesn't matter.",
    upgrade: "Crown XLS 2502 for a stronger reliability record.",
    options: [
      {
        id: "nx6000d", tier: "recommended", name: "Behringer NX6000D",
        price: 120000, priceNote: "~₹60,000 each in India (est.)", est: true, buy: "india",
        specs: [["Channels", "2, class D"], ["Power", "~1,600 W on one channel (forum bench test)"], ["DSP", "High-pass, limiter, delay"], ["Rack", "1U, 230 V Indian model"]],
        perf: "The baseline.",
        service: "Sold and serviced in India.",
        attrs: { spl: "Enough to reach the drivers' excursion limit", reliability: "Adequate; fans in the rack", warranty: "India", import: "None", fit: "Right tool" },
      },
      {
        id: "crown-xls2502", tier: "alternative", name: "Crown XLS 2502",
        price: 140000, priceNote: "$645 US; ~₹70,000 each in India (est.)", est: true, buy: "india",
        specs: [["Power", "2 × 775 W / 4 Ω"], ["SINAD (ASR)", "71 dB — fine for subs"], ["DSP", "Built-in crossover and limiter"]],
        perf: "Same audible result, with a better reliability reputation. Slightly less power.",
        attrs: { reliability: "Stronger track record", fit: "Equal" },
      },
      {
        id: "nx3000d", tier: "alternative", name: "Behringer NX3000D",
        price: 70000, priceNote: "~₹35,000 each (est.)", est: true, buy: "india",
        specs: [["Power", "About half the NX6000D"]],
        perf: "Enough for moderate levels. Runs out first at reference level below 20 Hz.",
        attrs: { spl: "~3 dB less", fit: "Only if you never play loud" },
      },
      {
        id: "powersoft", tier: "reference", name: "Powersoft Quattrocanali 4804 DSP+D",
        price: 450000, priceNote: "Install amplifier (est.)", est: true, buy: "india",
        specs: [["Channels", "4, with full DSP"], ["Build", "Install-grade"]],
        perf: "Bulletproof and elegant. No audible gain.",
        attrs: { reliability: "Install-grade", fit: "Overkill" },
      },
    ],
    review: {
      verdict: "agree",
      headline: "Pro amps are the right tool. The NX6000D is enough and costs a fraction of hi-fi amps.",
      right: "Yes.",
      overkill: "No.",
      under: "No, for four 18\" sealed drivers.",
      better: "The Crown XLS 2502 is equal on sound and has a better reliability record.",
      premium: "No premium to justify.",
      notice: "No.",
      elsewhere: "No.",
      integrator: "They'd set gain structure carefully so the Denon's sub outputs don't clip before the amps, and check the amp fans don't carry into the room through the wall.",
    },
  },

  /* ========================================================== projector */
  {
    id: "projector", name: "Projector", group: "picture", qty: 1,
    placement: "On a shelf on the rear wall above row 2, inside a ventilated, lined hush box that exhausts into the ceiling void. Lens at x 5.62 m, 2.40 m high, centred on the screen. That gives a 5.02 m throw, a 1.89 throw ratio and 50% vertical lens shift. Moved from the ceiling because of the lower ceiling: see the ceiling-drop table.",
    why: "Measured native contrast on JVC is 2–3× Sony's and 5–10× Epson's. In a black room, that is what you see: letterbox bars that stay black, space that isn't grey. The NZ700 adds the better lens and about 1.4× the NZ500's native contrast for about ₹1.7 L. The longer throw from the rear wall also raises measured contrast.",
    upgrade: "NZ800: the one upgrade in the whole system you'd see in every dark scene.",
    options: [
      {
        id: "jvc-nz700", tier: "recommended", name: "JVC DLA-NZ700",
        price: 630000, priceNote: "US $8,999.95; India est. ₹6–6.5 L at dealer discount (Indian JVC prices run ~30% under US)", est: true, buy: "india",
        specs: [
          ["Panel", "Native 4K D-ILA, laser"],
          ["Native contrast", "32–36k:1 calibrated, up to ~50k (measured)"],
          ["Brightness", "~1,700 lm calibrated; ~1,450 at this throw (est.)"],
          ["Throw ratio", "1.34–2.14 (this room needs 1.89)"],
          ["Lens shift", "V ±70%, H ±28% (this room needs 50%)"],
          ["HDR", "Frame Adapt HDR (HDR10); no Dolby Vision"],
          ["Power", "100–240 V, 50/60 Hz"],
        ],
        perf: "The baseline.",
        importNote: "Buy in India. Dealer prices sit about 30% under US street, and the JVC warranty is only valid where the unit was bought.",
        service: "Universal voltage. JVC India warranty (confirm the term; typically 3 years). Laser rated around 20,000 hours.",
        attrs: {
          measured: "Native 32–36k:1 calibrated",
          hdr: "~110 nits on this screen at full laser; Frame Adapt HDR tone mapping is excellent",
          black: "Deep; letterbox bars read as black in a black room",
          reliability: "Sealed laser engine; good",
          warranty: "JVC India, only for Indian units",
          import: "Don't — India is cheaper",
          fit: "Mid-zoom at 1.89, near ideal",
        },
      },
      {
        id: "jvc-nz500", tier: "alternative", name: "JVC DLA-NZ500",
        price: 460000, priceNote: "₹4.2–5 L dealer quotes (list ₹6.5–6.6 L)", buy: "india",
        specs: [["Native contrast", "22–25k:1 calibrated; up to ~40k at long throw (measured)"], ["Brightness", "~1,715 lm at 6500 K"], ["Lens", "Smaller; same zoom range"]],
        perf: "About 90% of the NZ700: slightly greyer blacks in fades and space scenes, and a smaller lens. Saves about ₹1.7 L. The long rear-wall throw works in its favour.",
        attrs: { measured: "Native 22–25k:1 calibrated; ~40k at long throw (Projector Central)", reliability: "Same sealed laser engine as the NZ700", warranty: "JVC India, only for Indian units", import: "Don't — India is cheaper", black: "Slightly greyer in the darkest scenes", hdr: "Similar brightness", fit: "The value pick" },
      },
      {
        id: "sony-xw5100", tier: "alternative", name: "Sony VPL-XW5100 (Bravia Projector 7)",
        price: 650000, priceNote: "₹6.5 L; official India warranty 3 years, laser 3 years / 5,000 h", buy: "india",
        specs: [["Panel", "Native 4K SXRD, laser"], ["Native contrast", "~14k:1 (measured)"], ["Brightness", "~1,800 lm Reference"]],
        perf: "Excellent processing and motion, but blacks are visibly lighter. In a black room you'd see it in every letterboxed film.",
        attrs: { measured: "Native ~14k:1 (Projector Central)", reliability: "Sealed laser engine; good", import: "Don't — India has official stock", black: "About 2.5× lighter blacks than the NZ700", hdr: "Good, bright", warranty: "Strong in India", fit: "Better suited to a room with some light" },
      },
      {
        id: "epson-qb1000", tier: "alternative", name: "Epson QB1000",
        price: 485000, priceNote: "₹4.84–4.86 L street", buy: "india",
        specs: [["Panel", "3LCD, pixel-shift 4K"], ["Brightness", "3,380 lm (measured)"], ["Native contrast", "~5–9k:1"]],
        perf: "Twice the brightness, a third of the contrast. The wrong trade for a dark room.",
        attrs: { measured: "Native ~5–9k:1; 3,380 lm (Projector Central)", reliability: "Laser; good", warranty: "Epson India", import: "Don't — India is cheaper", hdr: "Brightest here", black: "Grey — visible in every dark scene", fit: "Wrong trade-off" },
      },
      {
        id: "jvc-nz800", tier: "step-up", name: "JVC DLA-NZ800",
        price: 1300000, priceNote: "US $18,999.95 (from 1 Sep 2026); India est. ₹12.5–14 L", est: true, buy: "india",
        specs: [["Native contrast", "41k (lens) to 80–100k:1 (measured)"], ["Brightness", "~2,000 lm calibrated"], ["Lens", "100 mm, 2× zoom 1.39–2.78"]],
        perf: "Visibly deeper blacks and about 20% brighter HDR. The single most visible upgrade available.",
        attrs: { measured: "Native 41k (lens) to 80–100k:1 (Simple Home Cinema, TechRadar)", reliability: "Sealed laser engine; good", warranty: "JVC India, only for Indian units", import: "Don't — regional warranty", black: "Roughly twice the NZ700's native contrast", hdr: "~130 nits", fit: "Ideal" },
      },
      {
        id: "jvc-nz900", tier: "reference", name: "JVC DLA-NZ900",
        price: 2450000, priceNote: "US $32,999.95; India est. ₹23–26 L", est: true, buy: "india",
        specs: [["Brightness", "~3,300 lm"], ["Native contrast", "Up to ~160k:1 (aperture closed, telephoto)"]],
        perf: "Brighter again. The extra contrast shows mainly in fades to black.",
        attrs: { measured: "~3,300 lm; up to ~160k:1 native (Projector Reviews)", warranty: "JVC India", import: "Don't", hdr: "~200 nits", black: "Best available", fit: "Beyond this screen's needs" },
      },
      {
        id: "lifestyle-lasers", tier: "avoid", name: "Valerion VisionMaster Max / BenQ W5850 / UST lasers",
        price: 400000, priceNote: "$4–7k (est.)", est: true, buy: "usa",
        specs: [["Native contrast", "~1,100–4,100:1 (measured)"], ["Throw", "Can't reach 1.89"]],
        perf: "Built for living rooms. Grey blacks in a black room, and the wrong throw.",
        attrs: { black: "Grey", fit: "Doesn't fit" },
      },
    ],
    review: {
      verdict: "qualified",
      headline: "Right brand, right tier. Decide now whether the NZ800 is in reach — it's the one upgrade you'd see.",
      right: "Yes. In a black room, native contrast decides the picture, and JVC leads.",
      overkill: "No.",
      under: "For HDR, slightly: about 110 nits at this throw. Good for projection, but the NZ800's extra 20% is visible in bright highlights.",
      better: "The NZ500 gets 90% for ₹1.7 L less. The NZ800 is the material step.",
      premium: "NZ500 → NZ700: yes, in a treated black room. NZ700 → NZ800: yes, if the budget allows. NZ800 → NZ900: marginal.",
      notice: "NZ700 vs NZ500: in fades and night scenes, yes. NZ800 vs NZ700: in every dark scene.",
      elsewhere: "No. The picture is half the experience, and the projector is the picture.",
      integrator: "They'd challenge the rear-shelf position: fan noise sits 0.3–0.5 m behind row 2's heads, so the hush box needs lined intake and exhaust. They'd also check the lens-shift figure against the unit's real limit at the long end of the zoom.",
    },
  },

  /* ============================================================= screen */
  {
    id: "screen", name: "Screen", group: "picture", qty: 1,
    placement: "Fixed frame at x = 0.60 m (the front of the stage). 2.66 × 1.49 m, bottom edge at 0.90 m, top at 2.39 m. 75 mm black velvet border, 150 mm clear to the ceiling.",
    why: "Woven acoustically transparent fabric loses 1–2 dB of treble, which is easily corrected. Microperforated screens lose 3–6 dB and risk moiré with native 4K at 2.9 m. Gain of about 1.0 means no hot-spotting and no black-level penalty.",
    upgrade: "Screen Excellence Reference Enlightor 4K, with masking for 2.39:1 films at the reference tier.",
    options: [
      {
        id: "seymour-xd", tier: "recommended", name: "Seymour Center Stage XD, 120\" 16:9 fixed frame",
        price: 400000, priceNote: "~$2,500 + air freight + duty (est.)", est: true, buy: "usa",
        specs: [["Material", "Woven AT"], ["Gain", "~1.0"], ["Treble loss", "~1–2 dB at 10–16 kHz (est.)"], ["Size", "2.66 × 1.49 m viewable"]],
        perf: "The baseline.",
        importNote: "The frame kit ships in a ~2.8 m box: air cargo ~$300–800, plus duty. Order samples first and view them from 2.9 m.",
        service: "No electrics. Keep the fabric clean and dry; the room's 45–55% humidity target protects it.",
        attrs: { measured: "Low HF loss for a woven AT", hdr: "Neutral gain keeps colour accurate", black: "No gain penalty", import: "Air cargo, one long box", fit: "Row 1 at 2.9 m is near the weave limit — test samples" },
      },
      {
        id: "seymour-uf", tier: "alternative", name: "Seymour Center Stage UF",
        price: 430000, priceNote: "~$2,800 landed (est.)", est: true, buy: "usa",
        specs: [["Weave", "Finer — invisible from ~2.5 m"], ["Treble loss", "~3–4 dB (est.)"]],
        perf: "A finer weave, invisible from row 1 even in bright scenes, at 1–2 dB more treble loss. A treble shelf in the Denon fixes that.",
        attrs: { measured: "More HF loss, EQ-able", fit: "Safer choice for row 1 at 2.9 m" },
      },
      {
        id: "se-enlightor", tier: "alternative", name: "Screen Excellence Enlightor 4K",
        price: 520000, priceNote: "~$3–4k + freight (est.)", est: true, buy: "usa",
        specs: [["Weave", "Very fine, designed for 4K close seating"], ["Gain", "~1.0"]],
        perf: "Comparable to the XD, with a finer weave. Slightly lower treble loss.",
        attrs: { fit: "Excellent" },
      },
      {
        id: "xy-screens", tier: "alternative", name: "XY Screens woven AT (China)",
        price: 100000, priceNote: "~$600–900 including freight (est.)", est: true, buy: "china",
        specs: [["Material", "Woven AT"], ["Frame", "Aluminium, variable finish"]],
        perf: "A fraction of the price, but weave uniformity and frame quality vary. Fine in a budget room; a gamble in this one.",
        attrs: { reliability: "Variable", import: "Cheap to ship", fit: "Budget only" },
      },
      {
        id: "se-reference", tier: "step-up", name: "Screen Excellence Reference Enlightor 4K",
        price: 700000, priceNote: "(est.)", est: true, buy: "usa",
        specs: [["Weave", "Reference-grade"]],
        perf: "Marginally better transparency and uniformity. Hard to see.",
      },
      {
        id: "se-masked", tier: "reference", name: "SE Reference Enlightor 4K with 2.39:1 masking",
        price: 1000000, priceNote: "(est.)", est: true, buy: "usa",
        specs: [["Masking", "Motorised top and bottom"]],
        perf: "Scope films framed in black on all four sides. Striking, but the lowered ceiling leaves only 150 mm for the top mask's housing.",
      },
      {
        id: "microperf", tier: "avoid", name: "Stewart StudioTek 130 G4 Microperf / any ALR screen",
        price: 800000, priceNote: "(est.)", est: true, buy: "usa",
        specs: [["Gain", "1.3"], ["Treble loss", "~3–6 dB"]],
        perf: "1.3 gain hot-spots, 3–6 dB of treble loss and a moiré risk. Ambient-light-rejecting screens are for lit rooms.",
      },
    ],
    review: {
      verdict: "qualified",
      headline: "The right type of material. The sample test from row 1 decides between XD and UF.",
      right: "Yes: woven AT at a gain of about 1.0.",
      overkill: "No.",
      under: "No.",
      better: "The UF or Enlightor if the XD's weave shows from 2.9 m. That's a real risk this close.",
      premium: "The ₹3 L premium over XY Screens buys uniformity you'll see in bright scenes.",
      notice: "A visible weave from row 1, yes. The treble difference, no, once corrected.",
      elsewhere: "No.",
      integrator: "They'd insist on samples viewed with the actual projector at the actual distance. They'd also check the frame's black velvet border matches the ceiling edge, which is now only 150 mm above.",
    },
  },

  /* ================================================================ AVR */
  {
    id: "avr", name: "AV receiver / processor", group: "electronics", qty: 1, rack: "U14–U19",
    placement: "Rack U14–U19, with 1U gaps above and below. HDMI in from the sources, fibre HDMI out to the projector. Its four sub outputs feed the sub amps; eight channels of pre-out feed the Buckeye; its own amps drive the rears and the six overheads.",
    why: "15.4 channels, which is exactly 9.4.6, with four independent sub outputs and Dirac Live Bass Control + ART available. Bought in India it costs less than a US unit before duty, runs on 230 V and carries a local warranty.",
    upgrade: "StormAudio or Trinnov only for remapping or more than 16 channels. Neither is audible in this room.",
    options: [
      {
        id: "denon-a1h", tier: "recommended", name: "Denon AVC-A1H",
        price: 550000, priceNote: "Indian quotes ₹4.3 L (verify — may be stale or grey stock); list ₹7.99 L; budget ₹5.5 L", est: true, buy: "india",
        specs: [
          ["Channels", "15.4 processing, 15 × 150 W (8 Ω)"],
          ["Subwoofer outputs", "4, independently set"],
          ["Room correction", "Audyssey XT32 built in; Dirac Live, Bass Control and ART as paid licences"],
          ["Formats", "Dolby Atmos, DTS:X Pro, Auro-3D, IMAX Enhanced"],
          ["Video", "HDMI 2.1, 8K / 4K120 pass-through"],
        ],
        perf: "The baseline.",
        importNote: "Buy in India. A US unit is $7,199 (₹6.9 L), runs only on 120 V and adds 35% duty.",
        service: "230 V Indian model; Denon India warranty (confirm the term). Denon is now owned by Harman.",
        attrs: {
          measured: "Strong amplifier section; the pre-outs are clean enough for external amps",
          roomcorr: "Dirac Live + Bass Control + ART, the best available at any price for four subs",
          reliability: "Runs hot — needs the rack's airflow",
          warranty: "Denon India",
          import: "Don't — India is cheaper",
          fit: "Exactly 9.4.6",
        },
      },
      {
        id: "denon-x4800h", tier: "alternative", name: "Denon AVC-X4800H",
        price: 155000, priceNote: "₹1.47–1.54 L street (list ₹2.99 L)", buy: "india",
        specs: [["Channels", "13.4 processing (up to 7.4.6), 9 × 125 W"], ["Subwoofer outputs", "4, independent"], ["Room correction", "Same Dirac options"]],
        perf: "The same processing, the same Dirac and the same bass management. It drops the wides (7.4.6) and has weaker internal amps, so the 8-channel Buckeye covers more channels. Saves about ₹4 L.",
        attrs: { measured: "Same processing platform as the A1H", reliability: "Runs cooler than the A1H", warranty: "Denon India", import: "Don't — India is cheaper", roomcorr: "Identical", fit: "Perfect for 7.4.6" },
      },
      {
        id: "marantz-av20", tier: "alternative", name: "Marantz AV 20 (processor only)",
        price: 720000, priceNote: "₹7.19 L in India", buy: "india",
        specs: [["Type", "Pre-processor, no amps"], ["Room correction", "Same Dirac options"]],
        perf: "Needs amps for every channel. Its cleaner analogue stage brings no audible gain here.",
        attrs: { measured: "Cleaner analogue stage; inaudible after the amps", reliability: "Good", warranty: "Marantz India", import: "None", fit: "Costs more for the same result" },
      },
      {
        id: "anthem-mrx1140", tier: "alternative", name: "Anthem MRX 1140",
        price: 450000, priceNote: "$4,199 US (est. landed)", est: true, buy: "threshold", threshold: 35,
        specs: [["Channels", "15.4 processing, 11 amps"], ["Room correction", "ARC Genesis; 4 sub outputs, auto-aligned"]],
        perf: "Excellent correction, but no ART and little presence in India.",
        attrs: { roomcorr: "ARC Genesis — very good, no ART", warranty: "Weak in India", fit: "Good" },
      },
      {
        id: "tonewinner-at600", tier: "alternative", name: "ToneWinner AT-600",
        price: 260000, priceNote: "$2,350 including Dirac Room Correction + Bass Control + ART", est: true, buy: "china",
        specs: [["Channels", "16 processing"], ["Room correction", "Dirac RC + BC + ART included"]],
        perf: "16 channels with ART for half the price. Support and firmware come from China, with no Indian service.",
        attrs: { roomcorr: "Full Dirac included", warranty: "China only", import: "220 V, light — easy", fit: "For tinkerers" },
      },
      {
        id: "storm-core16", tier: "step-up", name: "StormAudio ISP Core 16",
        price: 1450000, priceNote: "$13,999 with Dirac RC + BC + ART included (est. landed)", est: true, buy: "threshold", threshold: 30,
        specs: [["Channels", "16"], ["Upmixer", "StormXT"], ["Room correction", "Dirac with ART included"]],
        perf: "A better upmixer and more flexible bass management. In blind listening here, very hard to tell from the Denon.",
        attrs: { measured: "Same Dirac engine; StormXT upmixer", reliability: "Good; boutique support", warranty: "Dealer", import: "Only if >30% under an Indian dealer", roomcorr: "Same Dirac engine", fit: "Needs amps for everything" },
      },
      {
        id: "trinnov-a32", tier: "reference", name: "Trinnov Altitude 32",
        price: 4500000, priceNote: "$42,000 + tariff US; India via dealer (est.)", est: true, buy: "india",
        specs: [["Channels", "Up to 32"], ["Room correction", "Trinnov Optimizer with 3D microphone"], ["Remapping", "Renders to the real, measured speaker positions"]],
        perf: "Remapping to the actual speaker positions is its one real advantage here: it helps the compromised rear surrounds. Everything else, you wouldn't hear.",
        attrs: { measured: "Trinnov Optimizer + 3D mic", reliability: "Excellent", warranty: "Indian dealer", import: "Buy locally for calibration support", roomcorr: "Optimizer + remapping", fit: "Built for rooms with 20+ speakers" },
      },
    ],
    review: {
      verdict: "disagree",
      headline: "The A1H buys two channels. Unless the wides are a firm yes, the X4800H does the same job for ₹4 L less.",
      right: "It's right for 9.4.6, but 9.4.6 itself is the question.",
      overkill: "For 7.4.6, yes. The X4800H processes exactly that, with the same Dirac and four sub outputs.",
      under: "No.",
      better: "Denon AVC-X4800H plus the 8-channel Buckeye (front L/C/R, sides, rears) for 7.4.6.",
      premium: "About ₹4 L for two wide channels that only row 1 benefits from.",
      notice: "Processing: no. The wides: only in row 1.",
      elsewhere: "Yes: ₹4 L goes most of the way from the NZ700 to the NZ800.",
      integrator: "They'd be suspicious of the ₹4.3 L Indian quote (list is ₹7.99 L) and would want an authorised invoice for warranty. They'd also note the A1H's heat and insist on the 1U gaps above and below.",
    },
  },

  /* ========================================================== power amp */
  {
    id: "amps", name: "Power amplifier", group: "electronics", qty: 1, rack: "U11–U12",
    placement: "Rack U11–U12. Drives L/C/R, the wides and the side surrounds, with one channel spare. Switched on by the Denon's 12 V trigger.",
    why: "Hypex NC502MP modules deliver 350 W into 8 Ω with distortion below audibility (Audio Science Review measured SINAD above 96 dB). They take the heavy load off the Denon's internal amps. They switch between 115 and 230 V automatically, so a US unit works here without a transformer.",
    upgrade: "None needed. Purifi monoblocks measure better on paper and sound the same here.",
    options: [
      {
        id: "buckeye-nc502mp-8", tier: "recommended", name: "Buckeye NC502MP, 8-channel (Hypex)",
        price: 300000, priceNote: "$2,500 US + ~35% duty above the ₹75,000 allowance", est: true, buy: "usa",
        specs: [["Power", "8 × 350 W / 8 Ω, 500 W / 4 Ω"], ["Measurements", "ASR: SINAD above 96 dB at 5 W"], ["Mains", "Universal 115 / 230 V"], ["Control", "12 V trigger in"]],
        perf: "The baseline.",
        importNote: "About 15 kg — goes as checked baggage. Duty is roughly 35% on the value above ₹75,000.",
        service: "No service in India. Hypex modules are reliable and swappable, and Buckeye ships spare modules.",
        attrs: { measured: "Transparent (ASR)", spl: "Drives the fronts to their own limits", distortion: "Far below audibility", reliability: "Hypex modules — proven", warranty: "Buckeye (US), module swap", import: "Checked baggage", fit: "Right" },
      },
      {
        id: "buckeye-nc252mp-8", tier: "alternative", name: "Buckeye NC252MP, 8-channel",
        price: 150000, priceNote: "~$1,300 (est.)", est: true, buy: "usa",
        specs: [["Power", "8 × 150 W / 8 Ω"]],
        perf: "Plenty for the surrounds. About 3 dB less headroom for the L/C/R. Fine if you listen 5 dB or more below reference.",
        attrs: { spl: "~3 dB less for L/C/R", fit: "Value pick" },
      },
      {
        id: "savoy", tier: "alternative", name: "AudioControl Savoy G3",
        price: 400000, priceNote: "$3,000–3,500 (est. landed)", est: true, buy: "usa",
        specs: [["Power", "7 × 200 W, class H"], ["Weight", "Heavy; runs warm"]],
        perf: "Heavy and warm-running. No audible benefit.",
      },
      {
        id: "emotiva-xpa", tier: "alternative", name: "Emotiva XPA Gen3 (100–250 V)",
        price: 350000, priceNote: "(est.)", est: true, buy: "usa",
        specs: [["Mains", "100–250 V"], ["Build", "Modular class AB/H"]],
        perf: "Modular and universal-voltage, but heavier and hotter. A similar audible result.",
      },
      {
        id: "purifi-mono", tier: "step-up", name: "3 × Buckeye Purifi 1ET9040 monoblocks (L/C/R) + NC502MP 5-channel",
        price: 560000, priceNote: "$1,195–1,295 each + 5-channel (est.)", est: true, buy: "usa",
        specs: [["Modules", "Purifi Eigentakt"]],
        perf: "Lower distortion on paper. Inaudible at these levels.",
      },
      {
        id: "ati-544", tier: "reference", name: "2 × ATI AT544NC",
        price: 900000, priceNote: "~$3,995 each (est.)", est: true, buy: "usa",
        specs: [["Power", "4 × 500 W / 8 Ω each"], ["Mains", "Auto-senses 117 / 230 V"]],
        perf: "Bulletproof. No audible gain.",
      },
      {
        id: "monolith-7x200", tier: "avoid", name: "Monoprice Monolith 7×200",
        price: 250000, priceNote: "~$2,000–2,233", est: true, buy: "do-not-import",
        specs: [["Mains", "115 V only"]],
        perf: "US-only 115 V. It would need a step-down transformer and still misbehave at 50 Hz.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "Measurably transparent at a fair price. Spend no more here.",
      right: "Yes.",
      overkill: "For the surrounds, a little. It doesn't matter.",
      under: "No.",
      better: "No.",
      premium: "No premium.",
      notice: "Against a ₹50,000 amp at normal levels: no. Near reference on the L/C/R: the headroom shows.",
      elsewhere: "Any amp upgrade beyond this is better spent on the projector.",
      integrator: "They'd plan for a failure with no local service: know which Hypex module to order, and keep the Denon's internal amps as a temporary fallback.",
    },
  },

  /* =========================================================== streamer */
  {
    id: "streamer", name: "Streamer", group: "electronics", qty: 1, rack: "U21–U22 (shelf)",
    placement: "Rack shelf U21–U22. HDMI to the Denon, wired Ethernet. Controlled by RF or IP remote, because a Bluetooth remote may not reach through the isolated wall.",
    why: "The best streaming box for HDR and Atmos. It matches the display to each title's frame rate and dynamic range, and it has every service used in India: Netflix, Prime Video, JioHotstar, Apple TV+ and more.",
    upgrade: "Kaleidescape for lossless downloads, if its store works in India.",
    options: [
      {
        id: "apple-tv", tier: "recommended", name: "Apple TV 4K (128 GB, Ethernet)",
        price: 17000, priceNote: "~₹17,000 in India (est.)", est: true, buy: "india",
        specs: [["Video", "4K HDR10 / Dolby Vision / HDR10+"], ["Audio", "Dolby Atmos (lossy, over streaming)"], ["Key setting", "Match frame rate and dynamic range: ON"]],
        perf: "The baseline. JVC has no Dolby Vision, so the Apple TV sends HDR10 instead.",
        service: "Apple India.",
        attrs: { hdr: "Passes HDR10 and Dolby Vision cleanly; frame-rate matching", reliability: "Excellent", warranty: "Apple India", import: "Inside the ₹75,000 allowance either way", fit: "Right" },
      },
      {
        id: "shield", tier: "alternative", name: "Nvidia Shield TV Pro",
        price: 25000, priceNote: "~$200 (est.)", est: true, buy: "usa",
        specs: [["Strength", "Plays local lossless files"], ["Weakness", "Ageing hardware; weaker frame-rate matching"]],
        perf: "Handles local lossless files, but streaming apps and frame-rate matching are weaker.",
      },
      {
        id: "fire-tv", tier: "alternative", name: "Amazon Fire TV Stick 4K Max",
        price: 7000, priceNote: "~₹7,000", est: true, buy: "india",
        specs: [["Form", "HDMI stick"]],
        perf: "Fine picture, weaker frame-rate handling. A stick doesn't belong in a rack.",
      },
      {
        id: "kaleidescape", tier: "reference", name: "Kaleidescape Strato V + Terra Prime",
        price: 900000, priceNote: "~$9,000+ (est.); movie store availability in India unverified", est: true, buy: "usa",
        specs: [["Content", "Lossless picture and sound, bit-for-bit disc quality"]],
        perf: "Disc-quality picture and lossless Atmos without discs. Pointless if its store doesn't sell to India.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "Right choice; just plan the remote.",
      right: "Yes.",
      overkill: "No.",
      under: "For lossless audio, yes. Streaming Atmos is compressed; that's what the disc player is for.",
      better: "No.",
      premium: "None.",
      notice: "Streaming vs disc: yes, on the loudest scenes and on shadow detail.",
      elsewhere: "No.",
      integrator: "They'd test the Apple TV remote from row 2 through the isolated wall before signing off. They'd probably specify an RF hub or an IR repeater.",
    },
  },

  /* ============================================================= player */
  {
    id: "player", name: "Disc / media player", group: "electronics", qty: 1, rack: "U21–U22 (shelf)",
    placement: "Rack shelf U21–U22, next to the Apple TV. HDMI to the Denon.",
    why: "UHD Blu-ray is the only legal route in India to lossless Atmos and the full-bitrate picture. That's the material that shows off this room.",
    upgrade: "Panasonic DP-UB9000 for its tone mapping and build.",
    options: [
      {
        id: "ub820", tier: "recommended", name: "Panasonic DP-UB820",
        price: 50000, priceNote: "~₹45–55,000 (est.)", est: true, buy: "india",
        specs: [["Formats", "UHD Blu-ray, HDR10, HDR10+, Dolby Vision"], ["Audio", "Bitstream Atmos / DTS:X (lossless)"], ["HDR optimiser", "Built in"]],
        perf: "The baseline.",
        attrs: { hdr: "Its HDR optimiser complements JVC's Frame Adapt HDR", reliability: "Good", warranty: "India", import: "None", fit: "Right" },
      },
      {
        id: "zidoo", tier: "alternative", name: "Zidoo UHD8000 media player",
        price: 100000, priceNote: "~$1,000 in China / HK (est.)", est: true, buy: "china",
        specs: [["Plays", "Rips of your own discs, full quality"], ["Legal", "Personal-backup copies are a grey area in India"]],
        perf: "The same picture and sound as the disc, without the discs. A copyright grey area in India.",
        attrs: { import: "Light — baggage", fit: "Convenient; legally grey" },
      },
      {
        id: "magnetar", tier: "alternative", name: "Magnetar UDP900",
        price: 90000, priceNote: "~$900 in China (est.)", est: true, buy: "china",
        specs: [["Formats", "UHD Blu-ray and files"]],
        perf: "A disc player and a file player in one. Build and support vary.",
      },
      {
        id: "ub9000", tier: "step-up", name: "Panasonic DP-UB9000",
        price: 110000, priceNote: "~₹1.1 L (est.)", est: true, buy: "india",
        specs: [["Build", "Flagship chassis, better analogue stage"]],
        perf: "Better tone mapping options. Through a JVC with Frame Adapt HDR, the difference is small.",
      },
    ],
    review: {
      verdict: "qualified",
      headline: "Buy a disc player rather than a media server, for the legal route in India.",
      right: "Yes.",
      overkill: "No.",
      under: "No.",
      better: "The Zidoo is more convenient but relies on ripping. The disc is the legal route.",
      premium: "The UB9000 isn't worth ₹60,000 more here.",
      notice: "Disc vs streaming, yes. Player vs player, no.",
      elsewhere: "No.",
      integrator: "They'd check the player sits HDMI-in to the Denon, not the projector, so audio always bitstreams.",
    },
  },

  /* ==================================================== room correction */
  {
    id: "roomcorr", name: "Room correction", group: "electronics", qty: 1, qtyLabel: "1 licence bundle",
    placement: "Runs inside the Denon. Measured from a laptop over the network, with the UMIK-1 at 13 or more positions spanning all six seats. Two saved presets: row 1 and all seats.",
    why: "For ₹77,000 this does more for the sound than any speaker upgrade. It EQs the room below 500 Hz. It sets all four subs' delay, level and EQ together for every seat (Bass Control). And it uses the other speakers to shorten bass decay (ART).",
    upgrade: "Nothing meaningful. StormAudio includes the same Dirac engine; Trinnov's Optimizer is different, not better, here.",
    options: [
      {
        id: "dirac-bundle", tier: "recommended", name: "Dirac Live Room Correction (full) + Bass Control + ART",
        price: 77000, priceNote: "$799 bundle from the Dirac online store (licence tied to the Denon's serial)", buy: "india",
        specs: [["Room Correction", "Full range, mixed phase"], ["Bass Control", "All four subs optimised jointly across all seats"], ["ART", "Active Room Treatment: shortens bass decay"], ["Target", "Flat 200 Hz–2 kHz, +4–6 dB below 100 Hz, −2–3 dB at 10 kHz"]],
        perf: "The baseline.",
        importNote: "Bought online in USD from India; no shipping.",
        service: "Licence is tied to the unit. It doesn't transfer to a replacement AVR.",
        attrs: { roomcorr: "The best multi-sub correction at any price", reliability: "Software", warranty: "Dirac", import: "None", fit: "Essential" },
      },
      {
        id: "audyssey-mso", tier: "alternative", name: "Audyssey MultEQ XT32 (built in) + REW / MSO by hand",
        price: 0, priceNote: "Free", buy: "india",
        specs: [["Correction", "Built into the Denon"], ["Subs", "Hand-tuned with REW and Multi-Sub Optimizer"]],
        perf: "Free and competent. It can't treat four subs as one system per seat the way Dirac Bass Control does; hand tuning gets close with patience.",
        attrs: { roomcorr: "Good; multi-sub needs hand work", fit: "Fallback" },
      },
      {
        id: "dirac-rc", tier: "alternative", name: "Dirac Live Room Correction (full) only",
        price: 34000, priceNote: "$349", buy: "india",
        specs: [["Missing", "Bass Control and ART"]],
        perf: "Leaves the four-sub optimisation to you, which is the most valuable part.",
        attrs: { roomcorr: "Correction without multi-sub", fit: "False economy" },
      },
      {
        id: "trinnov-opt", tier: "reference", name: "Trinnov Optimizer (with an Altitude processor)",
        price: 0, priceNote: "Included with Trinnov (see AVR)", buy: "india",
        specs: [["Microphone", "3D, measures speaker positions"], ["Remapping", "Yes"]],
        perf: "Different, not better, for sound in this room. Remapping is its unique trick.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "The most cost-effective line in the system.",
      right: "Yes.",
      overkill: "No.",
      under: "No.",
      better: "No.",
      premium: "₹77,000 for the biggest bass improvement after the subs themselves.",
      notice: "Yes: bass evenness across six seats, and dialogue clarity after the stage is corrected.",
      elsewhere: "No.",
      integrator: "They'd calibrate only after all treatment, seats and carpet are in. They'd limit full correction to below 500 Hz, and they'd verify the result with REW rather than trust Dirac's predicted curve.",
    },
  },

  /* ================================================================ mic */
  {
    id: "mic", name: "Measurement mic & meter", group: "electronics", qty: 2, qtyLabel: "Mic + colour meter",
    placement: "On a tripod at ear height for each measurement position. The colour meter hangs at the screen for JVC Auto Calibration.",
    why: "The UMIK-1 is the microphone Dirac supports, and it's enough for bass work in REW. The Calibrite Display Plus HL runs JVC's automatic calibration through the actual screen.",
    upgrade: "Hire a calibrator's Klein K10-A and spectroradiometer once, rather than buying.",
    options: [
      {
        id: "umik1-calibrite", tier: "recommended", name: "miniDSP UMIK-1 + Calibrite Display Plus HL",
        price: 40000, priceNote: "$110 + ~$300 (est.)", est: true, buy: "usa",
        specs: [["Mic", "USB, calibration file per serial"], ["Meter", "Supported by JVC Auto Calibration"]],
        perf: "The baseline.",
        importNote: "Both fit in a suitcase, inside the ₹75,000 allowance.",
        attrs: { measured: "Fine to 20 Hz with its calibration file", import: "Suitcase", fit: "Right" },
      },
      {
        id: "umik2", tier: "alternative", name: "miniDSP UMIK-2 + Calibrite",
        price: 50000, priceNote: "$200 + ~$300 (est.)", est: true, buy: "usa",
        specs: [["Mic", "Higher maximum SPL, 24-bit"]],
        perf: "More headroom for very loud measurements, which you won't use.",
      },
      {
        id: "emm6", tier: "alternative", name: "Dayton EMM-6 + USB audio interface",
        price: 20000, priceNote: "(est.)", est: true, buy: "usa",
        specs: [["Mic", "XLR measurement mic"]],
        perf: "Works for REW. Dirac prefers the UMIK.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "Cheap, correct, and yours to re-measure after every change.",
      right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.",
      notice: "Having it means the room gets re-checked when something changes.",
      elsewhere: "No.",
      integrator: "They'd use their own reference kit for the handover measurements, and keep yours for later checks.",
    },
  },

  /* =========================================================== UPS/power */
  {
    id: "ups", name: "UPS & power", group: "infrastructure", qty: 3, qtyLabel: "UPS + sequenced PDU + surge protection",
    placement: "UPS at rack U1–U2 (heaviest at the bottom), sequenced PDU at U5. Three dedicated circuits: the rack through the UPS; the subwoofer amps through the PDU but not the UPS; and the projector's UPS-backed outlet at the rear shelf. A Type-2 surge protection device at the distribution board.",
    why: "Hyderabad sees summer voltage sags, monsoon outages and inverter/genset switching. An online double-conversion UPS rebuilds clean 230 V and rides through outages. At 3 kVA it carries the Denon, the Buckeye, the sources and the projector with headroom. The sub amps' peaks stay off it.",
    upgrade: "APC Smart-UPS SRT for a longer life and hot-swap batteries.",
    options: [
      {
        id: "apc-srv3k", tier: "recommended", name: "APC Easy UPS On-Line SRV 3 kVA (rack) + 230 V sequenced PDU + Type-2 SPD",
        price: 110000, priceNote: "UPS ₹55–80,000; PDU ~₹30,000; SPD ~₹10,000 (est.)", est: true, buy: "india",
        specs: [["Topology", "Online double conversion"], ["Rating", "3 kVA / 2.7 kW"], ["Load", "~1 kW typical, ~2.1 kW peak including the projector (see Rack)"], ["Sequencing", "12 V trigger from the Denon"]],
        perf: "The baseline.",
        service: "APC India service; replace batteries every 3–5 years.",
        attrs: { reliability: "Good; batteries are the wear part", warranty: "APC India", import: "Never import — batteries and weight", fit: "Right size" },
      },
      {
        id: "vertiv", tier: "alternative", name: "Vertiv Liebert GXT-MT+ 3 kVA",
        price: 90000, priceNote: "₹50–90,000 (est.)", est: true, buy: "india",
        specs: [["Topology", "Online double conversion"]],
        perf: "Equivalent.",
      },
      {
        id: "eaton-9e", tier: "alternative", name: "Eaton 9E 3 kVA",
        price: 100000, priceNote: "₹60–90,000 (est.)", est: true, buy: "india",
        specs: [["Topology", "Online double conversion"]],
        perf: "Equivalent.",
      },
      {
        id: "apc-srt", tier: "step-up", name: "APC Smart-UPS SRT3KXLI",
        price: 220000, priceNote: "₹1.5–2.2 L", est: true, buy: "india",
        specs: [["Batteries", "Hot-swappable; extended runtime option"]],
        perf: "Longer life and easier battery changes. The same clean power.",
      },
      {
        id: "torus", tier: "reference", name: "Torus isolation transformer + APC SRT 5 kVA",
        price: 500000, priceNote: "(est.)", est: true, buy: "india",
        specs: [["Isolation", "Balanced / isolated mains"]],
        perf: "Belt and braces. Solves problems the online UPS already solves.",
      },
    ],
    review: {
      verdict: "qualified",
      headline: "An online UPS is right for Hyderabad. Keep the sub amps off it, and give the closet air.",
      right: "Yes.",
      overkill: "No.",
      under: "No, as long as the sub amps stay off it.",
      better: "No.",
      premium: "The SRT's premium buys battery convenience, not sound.",
      notice: "You'd notice not having it the first time the power dips mid-film.",
      elsewhere: "No.",
      integrator: "They'd measure neutral-to-earth voltage at the rack (under 2 V), use a star earth to avoid hum loops, and check the UPS's fan noise stays inside the closet.",
    },
  },

  /* =============================================================== rack */
  {
    id: "rack", name: "Rack", group: "infrastructure", qty: 1,
    placement: "In a small AV closet outside the left (east) wall, beside the door. Cable runs to the room are 8–15 m. 27U, 800 mm deep, with a thermostatic fan tray exhausting at the top and perforated front and rear doors. The closet needs its own ventilation or AC.",
    why: "Keeps heat, fans and blinking lights out of the theatre. Hyderabad summers above 40 °C mean the closet must be cooled: a loud film puts about 600–900 W of heat into it.",
    upgrade: "Middle Atlantic with thermostatic fan control, if you want a branded rack.",
    options: [
      {
        id: "rack-27u", tier: "recommended", name: "27U, 800 mm deep vented floor rack (local) + fan tray",
        price: 60000, priceNote: "~₹45,000 rack + ₹15,000 fans and accessories (est.)", est: true, buy: "india",
        specs: [["Height", "27U"], ["Depth", "800 mm"], ["Cooling", "Top fan tray, thermostatic; 1U vent gaps between hot units"], ["Doors", "Perforated front and rear"]],
        perf: "The baseline.",
        attrs: { reliability: "Steel; nothing to fail but fans", import: "Never import", fit: "Right" },
      },
      {
        id: "middle-atlantic", tier: "alternative", name: "Middle Atlantic BGR-27",
        price: 220000, priceNote: "Imported (est.)", est: true, buy: "do-not-import",
        specs: [["Build", "Premium, better cable management"]],
        perf: "Nicer to work in. The equipment doesn't care.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "A local rack is fine. The closet's cooling matters more than the rack.",
      right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "None.",
      notice: "Only if it overheats. The Denon throttles or shuts down when it's hot.",
      elsewhere: "Spend on the closet's cooling, not the rack's brand.",
      integrator: "They'd want a temperature sensor with an alert, rear access, and enough service loop to slide the Denon out.",
    },
  },

  /* ============================================================ cabling */
  {
    id: "cabling", name: "Cabling", group: "infrastructure", qty: 1, qtyLabel: "Full set",
    placement: "Rack to room through two 50 mm conduits plus two spare. Speaker cables run in the wall and ceiling voids. Fibre HDMI goes through the ceiling void to the rear shelf.",
    why: "Fibre HDMI is the only reliable way to carry 48 Gbps over 15 m. 12 AWG oxygen-free copper keeps losses negligible on 10–15 m runs to the fronts and subs. Spare conduit is the cheapest insurance in the build.",
    upgrade: "None audible.",
    options: [
      {
        id: "cable-set", tier: "recommended", name: "Fibre HDMI 2.1 + 12/14 AWG OFC + Canare interconnects + Cat6",
        price: 120000, priceNote: "~₹1.2 L all in (est.)", est: true, buy: "india",
        specs: [
          ["HDMI", "2 × 15 m HDMI 2.1 fibre (AOC), directional; one spare pulled"],
          ["Speaker", "12 AWG OFC to L/C/R, wides, sides and subs (~220 m); 14 AWG to rears and overheads (~120 m)"],
          ["Interconnect", "Canare L-4E6S balanced, inside the rack"],
          ["Network", "4 × Cat6 to the room: projector, spare, control, spare"],
          ["Conduit", "2 in use + 2 spare, 50 mm"],
        ],
        perf: "The baseline.",
        attrs: { reliability: "Fibre HDMI is directional — label both ends", import: "None", fit: "Right" },
      },
      {
        id: "copper-hdmi", tier: "avoid", name: "15 m passive copper HDMI",
        price: 8000, priceNote: "~₹8,000", est: true, buy: "india",
        specs: [["Limit", "Unreliable above ~5 m at 48 Gbps"]],
        perf: "Sparkles, dropouts or no 4K HDR at all.",
      },
      {
        id: "audiophile", tier: "avoid", name: "Premium audiophile cables (AudioQuest and similar)",
        price: 400000, priceNote: "₹2–5 L", est: true, buy: "india",
        specs: [["Claim", "Better sound"]],
        perf: "No audible difference over correctly sized copper.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "Correct and sufficient. Never spend more here.",
      right: "Yes.", overkill: "No.", under: "No.", better: "No.",
      premium: "Any premium over this is wasted.",
      notice: "No.",
      elsewhere: "Yes: anything above this goes elsewhere.",
      integrator: "They'd test the fibre HDMI at 4K120 HDR before the ceiling closes, and pull a second one as a spare.",
    },
  },

  /* ============================================================ network */
  {
    id: "network", name: "Network & control", group: "infrastructure", qty: 2, qtyLabel: "Switch + remote hub", rack: "U25",
    placement: "Managed gigabit switch at rack U25, uplinked to the house router. RF/IP remote hub in the rack; the remote works from any seat.",
    why: "Wired Ethernet for the Denon (Dirac and firmware), the sources and the projector (control and firmware). An RF or IP remote because the rack is behind an isolated wall that infrared and Bluetooth may not get through.",
    upgrade: "Control4 or similar for one-button scenes (lights, projector, AVR).",
    options: [
      {
        id: "switch-remote", tier: "recommended", name: "8-port managed gigabit switch + RF remote hub (e.g. SofaBaton X2)",
        price: 25000, priceNote: "~₹10,000 switch + ~₹15,000 remote (est.)", est: true, buy: "india",
        specs: [["Switch", "8-port managed gigabit, rack-mounted"], ["Remote", "RF/IP hub; one remote for everything"]],
        perf: "The baseline.",
        attrs: { reliability: "Good", import: "None", fit: "Right" },
      },
      {
        id: "ir-repeater", tier: "alternative", name: "IR repeater kit (Xantech or similar)",
        price: 12000, priceNote: "(est.)", est: true, buy: "india",
        specs: [["How", "IR receiver in the room, emitters in the rack"]],
        perf: "Works with the stock remotes. More wiring, and the Apple TV's remote is Bluetooth/IR.",
      },
      {
        id: "control4", tier: "step-up", name: "Control4 / Crestron-lite automation",
        price: 300000, priceNote: "(est.)", est: true, buy: "india",
        specs: [["Scenes", "Lights, projector and AVR on one button"]],
        perf: "Lovely to use. Zero effect on sound or picture.",
      },
    ],
    review: {
      verdict: "qualified",
      headline: "Test the remotes through the finished wall before the closet is sealed.",
      right: "Yes.", overkill: "No.", under: "No.",
      better: "Automation is lovely, but it's comfort, not performance.",
      premium: "None.",
      notice: "You'll notice if the remote doesn't reach, on the first night.",
      elsewhere: "No.",
      integrator: "They'd put the switch on the UPS and give the projector a fixed IP address.",
    },
  },

  /* ======================================================== calibration */
  {
    id: "calibration", name: "Calibration service", group: "infrastructure", qty: 1, qtyLabel: "One visit, audio + video",
    placement: "After the room is finished, furnished and treated. Audio calibration first, then the projector, through the actual screen.",
    why: "Dirac and JVC's automatic calibration get close. An experienced calibrator checks them against REW and a reference meter, sets sub and speaker crossovers by measurement, and tunes the HDR tone mapping. It's the last 10% that makes the rest pay off.",
    upgrade: "A THX- or ISF-certified calibrator flown in from Mumbai or Bangalore.",
    options: [
      {
        id: "pro-cal", tier: "recommended", name: "Professional audio + video calibration visit",
        price: 150000, priceNote: "₹1–1.5 L (est.)", est: true, buy: "india",
        specs: [["Audio", "Dirac + REW verification; crossovers and sub phase by measurement; 2 presets"], ["Video", "JVC Auto Cal + manual check; SDR 50–60 nits; HDR Frame Adapt with screen gain entered"]],
        perf: "The baseline.",
        attrs: { fit: "Right" },
      },
      {
        id: "self-cal", tier: "alternative", name: "Self-calibration with Dirac + JVC Auto Calibration",
        price: 0, priceNote: "Your time", buy: "india",
        specs: [["Needs", "UMIK-1, REW, Calibrite meter"]],
        perf: "Gets 85–90% of the way with patience.",
      },
      {
        id: "thx-isf", tier: "step-up", name: "THX / ISF-certified calibrator, flown in",
        price: 300000, priceNote: "(est.)", est: true, buy: "india",
        specs: [["Includes", "Reference instruments, a full report"]],
        perf: "The best result, with a report you can repeat against later.",
      },
    ],
    review: {
      verdict: "agree",
      headline: "Pay for it once, after the room is finished.",
      right: "Yes.", overkill: "No.", under: "No.", better: "No.", premium: "Justified.",
      notice: "Yes: a bad crossover or sub phase shows up as thin dialogue or boom at some seats.",
      elsewhere: "No.",
      integrator: "They'd refuse to calibrate before the carpet, seats and treatment are in.",
    },
  },
];

export const byId = (id: string) => CATALOG.find((c) => c.id === id)!;
export const recommended = (c: Component) => c.options.find((o) => o.tier === "recommended")!;

/** The recommended system's total, in rupees. */
export const systemTotal = () => CATALOG.reduce((a, c) => a + recommended(c).price, 0);

export function formatINR(n: number, opts: { sign?: boolean } = {}) {
  const sign = opts.sign && n > 0 ? "+" : n < 0 ? "−" : "";
  const v = Math.abs(n);
  if (v === 0) return "₹0";
  if (v >= 1e7) return `${sign}₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(v >= 1e6 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")} L`;
  return `${sign}₹${Math.round(v / 1000)}k`;
}
