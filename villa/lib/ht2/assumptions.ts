import type { Assumption } from "@/lib/ht/dataset";
import { ROBUST, recRisk, recWinShare, dimShare, MAX_BREAK } from "./robust";

const pct = (v: number) => `${Math.round(v)}%`;

/**
 * Every assumption inherited from the first design, re-derived for a
 * ₹30 L, India-only, movie-first build — and the flaws an independent
 * review found in this page's own first draft. Numbers come from
 * lib/ht/geometry.ts and lib/ht2/model.ts.
 */
export const ASSUMPTIONS: Assumption[] = [
  /* ------------------------------------------------------------ method */
  { id: "a-method", area: "How this was checked", verdict: "changed",
    claim: "One scoring run is enough to pick a system.",
    reasoning: `Review correction: the model's constants are judgements (±2–3 points), and half the prices are estimates. The first draft rejected upgrades on gaps smaller than that error. Now the constants and prices are perturbed together ${ROBUST.samples} times; a system is chosen by how often it wins with the ₹1 L contingency intact, not by the edge of a single run. Rerun correction: winning most often on its own rewards systems parked at the cap — the most frequent winner of the rerun broke ₹30 L in ${pct(ROBUST.risk[ROBUST.wins[0].id]?.breaks ?? 0)} of runs — so the rule is now the most frequent winner among systems that break the cap in no more than ${MAX_BREAK}% of runs.`,
    numbers: `Recommended: ${pct(recWinShare)} of runs, the most of any system inside the ${MAX_BREAK}% rule, across ${ROBUST.candidates} contenders · NZ500 ${pct(dimShare("picture", "P3"))} · X6800H + Dirac ${pct(dimShare("processing", "A3"))} · specialist-built treatment ${pct(dimShare("extras", "T3"))}` },
  { id: "a-rerun", area: "How this was checked", verdict: "changed",
    claim: "The first price list and menu are good enough.",
    reasoning: `Rerun: prices were re-checked at Indian dealers (the SVS subs came down — PB-1000 Pro ₹1.09 L at VPLAK, SB-1000 Pro ₹85k, SB-2000 Pro ₹1.32 L — and the Sony XW5100 to ₹5.08 L), and the parts of a reference theatre from a video joined the menus as real options: Focal Theva N3 with Focal in-wall surrounds, 2× PB-2000 Pro, Marantz AV7706 with MM8077 + MM7055, and the Sony XW5000. ${ROBUST.candidates} contenders out of 6,300 systems. The video's parts won almost nothing (Focal ${pct(dimShare("speakers", "S7"))}, Sony XW5000 and Marantz 0%). The cheaper subs freed ₹0.85 L, and the analysis spends it on having the treatment built and measured by a specialist.`,
    numbers: "Recommendation: same hardware, treatment specialist-built · ₹29.02 L with contingency, 84.0" },
  { id: "a-sources", area: "How this was checked", verdict: "changed",
    claim: "Retail reviews (e.g. Audio Advice) confirm the choices.",
    reasoning: "They were meant to be a cross-check, but this build environment's network policy blocks audioadvice.com (and several Indian dealer sites; prices came from search listings instead). The review therefore leaned on published measurements — Erin's Audio Corner, Audio Science Review, Projector Central, CEA-2010 sub data — and first-principles acoustics. Retailer reviews sell what they stock; measurements are the better evidence anyway, but a listening audition at a Hyderabad dealer is still worth an afternoon." },

  /* ------------------------------------------------------------ money */
  { id: "a-cap", area: "Money", verdict: "changed",
    claim: "₹28.4 L is safely under ₹30 L.",
    reasoning: "Review correction: the first draft left 5% headroom and costed the NZ500 at a forum quote (₹4.19–5.0 L) that is probably grey stock without JVC India warranty. The system is now costed at a warranted ₹5.75 L, Dirac at card forex plus 18% IGST, and carries a ₹1 L contingency inside the cap — so the planned spend is ₹28.0 L.",
    numbers: `₹29.02 L with contingency · NZ500 at full list ₹29.76 L · chance the spend eats into the contingency ${pct(recRisk.eats)}, breaks the cap ${pct(recRisk.breaks)}` },
  { id: "a-import", area: "Money", verdict: "rejected",
    claim: "Buying abroad saves money.",
    reasoning: "Everything recommended is sold in India with an Indian warranty; Indian street prices for Denon, JVC, KEF and SVS sit at or below US prices after conversion, and baggage duty is 35% above ₹75,000. The only overseas purchase is the Dirac licence, online." },
  { id: "a-disc", area: "Money", verdict: "kept",
    claim: "A disc player is worth ₹98k.",
    reasoning: "For a movie-first room, UHD Blu-ray is the only legal route to lossless Atmos and full-bitrate picture. But ₹98k is import pricing and the UB820 is scarce — confirm stock. If you mostly stream, it's the first line to cut." },

  /* ------------------------------------------------------------ the room */
  { id: "a-treat", area: "Room acoustics", verdict: "changed",
    claim: "Acoustic treatment is a room-construction cost, and any 'package' will do.",
    reasoning: "It is inside the ₹30 L cap now. Review correction: the draft said 'contractor package', and in India that usually means 9–12 mm PET panels and foam, which work only above ~1 kHz. Row-2 ears are 0.57 m from the rear wall, so the rear-wall reflection cancels around 150 Hz — only 100–150 mm of wool there removes it. The spec (48 kg/m³ wool, 50 mm panels on 50 mm gaps, RT60 0.25–0.35 s from 125 Hz to 4 kHz, measured) goes into the contract. Rerun: the recommendation now has a specialist build it and measure it (₹2.6 L est.), with the carpenter-built version (₹1.4 L, −0.4) as the first cut if prices come in high.",
    numbers: "343 / (2 × 1.14 m) ≈ 150 Hz notch · RT60 ≈ 0.6 s bare" },
  { id: "a-height", area: "Room acoustics", verdict: "kept",
    claim: "The lowered ceiling changes the bass.",
    reasoning: "The first height mode moves from 62 Hz to 67 Hz, and both rows' ears sit near its null at 1.27 m, so both lose a little around 67 Hz. Floor subs can't fix a height null; ceiling-corner traps and Dirac ART help.",
    numbers: "343 / (2 × 2.547) = 67.3 Hz" },
  { id: "a-screen", area: "Picture", verdict: "kept",
    claim: "A 120″ 16:9 screen is the right size and shape.",
    reasoning: "Row 1 sees 49° and row 2 30.5° — immersive for row 1 without being too much, and above SMPTE's 30° minimum for row 2. A 2.35:1 scope screen as wide as the wall allows would put row 1 near 58°; 110″ would drop row 2 below 30°.",
    numbers: "2·atan(1.33 / 2.90) = 49.2° · 2·atan(1.33 / 4.88) = 30.5°" },
  { id: "a-sight", area: "Picture", verdict: "changed",
    claim: "A 0.45 m riser gives row 2 a clear view.",
    reasoning: "Review correction: the line from a row-2 eye to the bottom of the picture clears row-1 heads by only 40–66 mm depending on the recliner's headrest, against ~120 mm recommended. Mock it up with the actual recliners before the riser is built; if it's short, raise the riser to 0.55 m (row-2 heads then 0.9 m below the ceiling). This is a construction cost, outside the AV budget." },
  { id: "a-proj-noise", area: "Picture", verdict: "changed",
    claim: "A projector on the rear shelf is out of the way.",
    reasoning: "Review correction: the chassis is ~0.9 m above row-2 heads and ~60 mm below the ceiling. At 24–26 dB of fan noise and several hundred watts of heat in a Hyderabad summer, it needs a damped, ventilated hush box, open at the front — now in the budget (₹25k est.)." },

  /* ------------------------------------------------------------ layout */
  { id: "a-layout", area: "Speaker layout", verdict: "kept",
    claim: "7.x.4 is the right layout.",
    reasoning: "Dolby treats 7.1.4 as the reference home layout. 5.x.4 leaves row 1 with nothing between the sides and the overheads and scores about 1.4 lower. Wides (9.x.x) help only row 1 and need more amps." },
  { id: "a-rears", area: "Speaker layout", verdict: "changed",
    claim: "Rear surrounds go on the rear wall, and both rows are equal.",
    reasoning: "Row 2's seat backs are 0.22 m from the rear wall, so rear-wall speakers would be ~9 dB louder for the outer row-2 seats than for row 1; they move onto the side walls at x = 5.9 m. Review correction: even so, row 2 hears the sides at ~62° and the rears at ~100° — no real rear image — and each rear is 1.2 m from one outer row-2 seat and 3.1 m from the other. Row 1 is the primary listening position; surrounds aim across the room at the far row-1 seat so the off-axis drop evens out the near seats.",
    numbers: "Row 1: sides ~114°, rears ~139° · Row 2: sides ~62°, rears ~101°" },
  { id: "a-sides", area: "Speaker layout", verdict: "changed",
    claim: "Side surrounds at 1.9 m.",
    reasoning: "Review correction: lowered to 1.65 m so row 1 hears them closer to ear level. The left one is 0.25 m past the door jamb, so the door must open outward (or be hinged at the front jamb), solid-core with seals." },
  { id: "a-tops", area: "Speaker layout", verdict: "changed",
    claim: "Overheads at x = 2.3 and 4.6 m.",
    reasoning: "Review correction: those gave row 1 textbook angles but left row 2 with both pairs in front of it (17° and 49°). Moved to 2.1 and 4.95 m: row 1 gets Dolby's ideal ~46° / 45°, and row 2 a near-overhead pair at ~62°. Four, not six: a middle pair costs ₹1.1 L and an extra amp, and is pre-wired instead.",
    numbers: "atan(1.447 / 1.40) = 45.9° · atan(1.447 / 1.45) = 44.9° · row 2 atan(0.997 / 0.53) = 62°" },

  /* ------------------------------------------------------------ front stage */
  { id: "a-towers", area: "Front speakers", verdict: "rejected",
    claim: "Klipsch RP-8000F II towers fit the stage.",
    reasoning: "Review correction: at ~0.48 m deep and rear-ported, they need ~0.62 m with screen and port clearance on a 0.60 m stage, and the L tower overlapped a front sub. Above the 80 Hz crossover they add ~1 dB over the RP-6000F II for ₹0.5 L more. Withdrawn." },
  { id: "a-headroom", area: "Front speakers", verdict: "changed",
    claim: "Only 90 dB+ horns can reach the row-2 target.",
    reasoning: "Review correction: the first draft mixed spec and measured sensitivities and assumed all-channels-driven power. With the mains high-passed at 80 Hz, a receiver delivers far more per channel on film peaks. Re-modelled, the KEF Q Concerto reaches ~97 dB peaks at row 2 (reference −8 dB) and ~101 dB at row 1 on the X6800H; the Klipsch RP-6000F II ~100 dB at row 2. The penalty for the shortfall is now 1 point per dB, capped at 8.",
    numbers: "87 + 10·log(140) − (20·log(4.9) − 3) − 1 ≈ 96.7 dB" },
  { id: "a-kef", area: "Front speakers", verdict: "changed",
    claim: "Horns beat the KEF Q Concerto for a two-row room.",
    reasoning: `With the corrected headroom model, the two are a statistical tie at the same price. The KEF system wins more of the Monte Carlo runs (${pct(dimShare("speakers", "S3"))} vs ${pct(dimShare("speakers", "S4") + dimShare("speakers", "S5"))} for the two Klipsch systems together): lower distortion, one voice in all seven positions, and a coaxial driver that sounds the same to the seat 0.6 m away as to the one 3 m away. Choose the Klipsch RP-6000F II + RP-500SA II if you often watch near reference from row 2. Audition both.` },
  { id: "a-amp", area: "Front speakers", verdict: "rejected",
    claim: "An external amp is needed for the L/C/R.",
    reasoning: "The X6800H has exactly the 11 amplifiers a 7.x.4 layout needs. The X3800H + Emotiva BasX A3 route ties on value, but Emotiva's Indian warranty route is unconfirmed — ask the dealer before choosing it." },

  /* ------------------------------------------------------------ bass */
  { id: "a-subs-n", area: "Bass", verdict: "kept",
    claim: "Four subwoofers, not two.",
    reasoning: "Two rows, one of them against the rear wall where the 28 Hz length mode peaks. Harman's multi-sub work (Welti) shows four subs cut seat-to-seat variation far more than two. Dropping to two costs 3.6 points for ₹1.7 L saved — the worst cut available.",
    numbers: "Length modes 28.3 / 56.7 / 85 Hz · width 41.5 Hz" },
  { id: "a-bass-model", area: "Bass", verdict: "changed",
    claim: "Four subs sum perfectly, and 20 Hz is all that matters.",
    reasoning: "Review correction: the draft added every sub in phase plus a flat 6 dB of room gain, and scored only 20 Hz. Joint optimisation deliberately sets the front and rear pairs against each other on the 28 Hz mode, costing ~3 dB. Output is now scored at 20, 25 and 31.5 Hz with pressure-vessel gain that rises below the 28 Hz mode, and Dirac Bass Control's credit is cut from 9 to 5 points.",
    numbers: "Recommended array ≈ 116 / 119 / 120.5 dB vs 115 / 118 / 118 needed" },
  { id: "a-rear-subs", area: "Bass", verdict: "changed",
    claim: "Rear subs can be the same ported model, on the riser.",
    reasoning: "Review correction: a ported 12″ sub 0.5 m from row-2 ears puts port noise and distortion at arm's length, and it drums a hollow timber riser. The rear pair is now the sealed SB-1000 Pro, standing on the slab through cutouts in the riser. It is ₹0.48 L cheaper than two more PB-1000 Pro, which score only 0.2 higher despite 4 dB more at 20 Hz, and the front ported pair carries the deep bass." },
  { id: "a-diy", area: "Bass", verdict: "rejected",
    claim: "DIY 18″ subs are the value king.",
    reasoning: "In India the 18″ drivers you can buy locally are pro-audio designs (Lavoce, B&C), tuned for 40 Hz and up. They need large ported boxes and heavy EQ to reach 20 Hz, and the boxes don't fit this room." },

  /* ------------------------------------------------------------ electronics */
  { id: "a-dirac", area: "Electronics", verdict: "kept",
    claim: "Dirac Live Bass Control + ART is worth ₹83k.",
    reasoning: "Four subs only become even across six seats when their delays, levels and EQ are set together per seat. Even at the reduced credit it is worth more than any sub upgrade. Confirm ART runs on the X6800H's current firmware before paying for the full bundle." },
  { id: "a-avr", area: "Electronics", verdict: "kept",
    claim: "The X6800H, not a flagship.",
    reasoning: `It has exactly the 11 amps 7.x.4 needs, four independent sub outputs, the full Dirac suite and 13-channel processing for six overheads later. It won ${pct(dimShare("processing", "A3"))} of the Monte Carlo runs. The A1H adds four unused channels for ₹1.9 L (+0.2).` },
  { id: "a-power", area: "Electronics", verdict: "changed",
    claim: "Power is just a UPS.",
    reasoning: "Review addition: four long sub runs hum on a poor earth. A dedicated earth pit for the AV circuits and a neutral–earth check (under 2 V) are now in the installation scope (₹15k est.)." },

  /* ------------------------------------------------------------ picture */
  { id: "a-jvc", area: "Picture", verdict: "kept",
    claim: "JVC's native contrast is worth it over Sony or Epson.",
    reasoning: `In a black room, native contrast is the picture. Even at a warranted ₹5.75 L, the NZ500 won ${pct(dimShare("picture", "P3"))} of the Monte Carlo runs. The Sony XW5100 saves ₹0.67 L and scores 3.1 points lower; the XW5000 from the video saves ₹1.45 L and scores 3.9 lower.` },
  { id: "a-nz700", area: "Picture", verdict: "rejected",
    claim: "The NZ700 fits under ₹30 L.",
    reasoning: "At ~₹9.5 L (list ₹10.7 L) it adds 1.3 points for ₹3.75 L and puts the system at ₹32.8 L. Fitting it means two subs or no treatment, both larger losses. It's the first upgrade if the cap rises." },
  { id: "a-woven", area: "Picture", verdict: "changed",
    claim: "An imported Seymour screen is needed.",
    reasoning: "A 120″ Seymour lands at about ₹4 L with freight and duty. Grandview's woven AT is stocked by AV-Vision in Hyderabad at an estimated ₹0.6–1.2 L. View a sample at 2.9 m with the projector first; if the weave shows, the Elite Aeon AcousticPro UHD is the local fallback." },
];
