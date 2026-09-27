/**
 * The room around the /ht2 system, surface by surface: what each surface has
 * to do acoustically, how it is built layer by layer, and how to check it.
 *
 * Orientation, facing the screen: the screen (front) wall is the glazed south
 * wall; the left wall is the east wall to the lobby, with the door; the right
 * wall is the glazed west wall; the rear wall is the north wall to the
 * laundry. The slab above is the open terrace. Numbers come from
 * lib/ht/geometry.ts; the villa's own theatre spec (lib/specs/theatre.ts)
 * covers the same room room-wide, and this follows it except where the /ht2
 * design differs (thick rear absorption instead of diffusion, no ceiling
 * clouds under the speakers, the baffle wall, the sealed rear subs).
 */

export type Stage = "civil" | "carcass" | "fitout" | "handover";
export const STAGE_LABEL: Record<Stage, string> = {
  civil: "1 · Civil and waterproofing",
  carcass: "2 · Before the ceiling and walls close",
  fitout: "3 · Fit-out",
  handover: "4 · Before you pay",
};

export interface Layer {
  /** Name of the layer, outside → inside the room. */
  name: string;
  /** Thickness, mm (0 for a membrane, sealant or finish). */
  mm: number;
  kind: "structure" | "air" | "wool" | "board" | "damping" | "finish" | "timber" | "fabric" | "membrane";
  note?: string;
}

export interface Surface {
  id: string;
  name: string;
  /** Where it is, in the room's own words. */
  where: string;
  /** What the sound (and the picture) does at this surface, and what the surface must do about it. */
  acoustics: string[];
  /** Section through the surface, from the house side to the room side. */
  layers: Layer[];
  /** Everything else the surface carries. */
  details: { k: string; v: string }[];
  /** Indian materials and trades. */
  india: string;
  /** What usually goes wrong. */
  avoid: string[];
  /** How to check it before it is closed up and before it is paid for. */
  verify: string[];
  /** Target numbers. */
  targets: { k: string; v: string }[];
  /** Construction cost, outside the ₹30 L AV cap unless `inAv`. */
  cost: { lo: number; hi: number; note: string };
  stage: Stage;
  /** Section-drawing callout number. */
  n: number;
}

const L = 1e5;

export const SURFACES: Surface[] = [
  /* ================================================================ ceiling */
  {
    id: "ceiling", n: 1, name: "Roof slab and ceiling",
    where: "The whole 6.05 × 4.13 m ceiling, finished at 2.547 m — 203 mm lower than first drawn. Above it is the terrace slab.",
    acoustics: [
      "The ceiling is the largest surface in the room and the one closest to row 2 — heads there are only a metre below it. Sound leaving the room upward goes straight into the terrace slab and out across the top floor, so the ceiling has to be a second, heavy, independent lid: mass that isn't screwed to the slab.",
      "Inside, the ceiling carries the four Atmos speakers, the projector's exhaust path and the air supply. The only first reflection that matters up here is the one from the L/C/R to row 1, which lands at about x = 1.9 m — just ahead of the top-front speakers. One absorber goes there and nowhere else: clouds over the rest of the ceiling would sit under the overheads and muffle them.",
      "The height mode moves from 62 to 67 Hz with the lower ceiling, and both rows' ears sit near its null (1.27 m). A floor sub can't fix a height null; the corner traps and Dirac ART take some of it out.",
    ],
    layers: [
      { name: "Terrace screed + PU / APP membrane + heat-reflective coat", mm: 50, kind: "membrane", note: "Turned up 300 mm at the parapet; ponding-tested" },
      { name: "RCC roof slab", mm: 150, kind: "structure" },
      { name: "Void: isolation hangers, lined ducts, cable trays", mm: 128, kind: "air", note: "At least 203 mm overall — check the slab soffit on site" },
      { name: "Mineral wool 48 kg/m³, laid on the board", mm: 75, kind: "wool", note: "Isolation and roof heat" },
      { name: "Gypsum board 12.5 mm", mm: 12.5, kind: "board" },
      { name: "Damping layer / 5 kg/m² MLV", mm: 2, kind: "damping" },
      { name: "Gypsum board 12.5 mm, joints staggered", mm: 12.5, kind: "board" },
      { name: "Matt charcoal paint; velvet on the front third", mm: 1, kind: "finish" },
    ],
    details: [
      { k: "Hangers", v: "Neoprene or spring isolation hangers on a GI grid at ~1.2 m centres. The grid stops 10 mm short of every wall and the gap is filled with non-hardening acoustic sealant — never plaster or cornice." },
      { k: "Atmos speakers", v: "Four KEF Ci200ER at x = 2.10 and 4.95 m, 1.10 and 3.03 m from the left wall. Each in a fire-rated acoustic back-box sealed to the board. Pre-wire two more positions at x ≈ 3.5 m for a later 7.x.6, with back-boxes fitted and blanked." },
      { k: "Reflection absorber", v: "One 50 mm fabric-wrapped wool panel, ~1.2 × 2.4 m, flush-mounted between x = 1.3 and 1.95 m, centred on the screen — stopping 150 mm short of the top-front speakers." },
      { k: "Projector exhaust", v: "The hush box on the rear wall vents into a lined 100 mm duct with a quiet inline fan, run through the void to the AC return — not dumped into the sealed void." },
      { k: "Air", v: "No supply grille above row 2 (heads 1.0 m below). Linear slots in the side walls' front half instead (see Air)." },
      { k: "Lights", v: "Keep downlights few; cove or wall-wash light is better. Any downlight gets a fire-rated acoustic hood." },
    ],
    india: "Saint-Gobain Gyproc and USG Boral gypsum board and GI sections are stocked in Hyderabad; Rockwool and Twiga wool too. Isolation hangers must be named in the order — false-ceiling teams hang on rigid GI rod by default. MLV is sold by acoustic suppliers; true damping compounds are harder to find.",
    avoid: [
      "A single layer of grid tiles or mineral-fibre board — treatment, not isolation.",
      "Rigid GI rods from the slab: they carry every bass note into the terrace.",
      "Closing the ceiling before the terrace has passed a ponding test.",
      "Absorber clouds under the overhead speakers.",
    ],
    verify: [
      "48–72 hour ponding test on the terrace, photographed at start and end.",
      "Count the hangers against the drawing; photograph the wool and the perimeter gap before the second board.",
      "Pour a bucket into the AC drip tray before the ceiling closes.",
    ],
    targets: [
      { k: "Finished height", v: "2.547 m" },
      { k: "Height mode", v: "67.3 Hz" },
      { k: "Sound kept in", v: "≥ 50 dB to the rooms around (with the walls and door)" },
    ],
    cost: { lo: 0.7 * L, hi: 1.1 * L, note: "~25 m² hung double-board ceiling with wool and hangers (est.); waterproofing extra if the terrace needs it" },
    stage: "carcass",
  },

  /* ============================================================ front wall */
  {
    id: "front", n: 2, name: "Screen wall, stage and baffle",
    where: "The south wall (glazed) behind the 120″ screen: the 0.60 m deep, 0.15 m high stage, the three L/C/R speakers and the front subwoofers.",
    acoustics: [
      "Sound from the L/C/R goes backwards as well as forwards. Off a hard wall 0.3 m behind them it comes back 2–3 ms late and combs the dialogue — a hollow, phasey centre. A black, absorptive baffle wall flush with the speaker fronts removes that reflection, and the whole cavity behind it is filled with wool so the speakers' ports and the subs have somewhere to go.",
      "The front corners are where every room mode has a pressure peak. Floor-to-ceiling traps 150 mm deep in both front corners, hidden in the baffle cavity, do the most bass work per rupee in the room.",
      "Optically, the screen is woven and see-through: anything behind it that is lit or shiny shows as a ghost in dark scenes. Everything behind the screen is matt black.",
    ],
    layers: [
      { name: "Brick wall; south window infilled with brick, plastered", mm: 230, kind: "structure", note: "Window gone: light and road noise out" },
      { name: "Corner traps + wool on the wall, 48 kg/m³", mm: 150, kind: "wool" },
      { name: "Cavity: speakers on stands, subs turned sideways", mm: 220, kind: "air" },
      { name: "Baffle: 18 mm BWP frame, cut-outs for L/C/R", mm: 18, kind: "timber" },
      { name: "50 mm wool on the baffle face", mm: 50, kind: "wool" },
      { name: "Matt black acoustic fabric", mm: 1, kind: "fabric" },
      { name: "Air gap to the screen", mm: 100, kind: "air" },
      { name: "Woven AT screen, Grandview AW6", mm: 1, kind: "fabric" },
    ],
    details: [
      { k: "Stage", v: "0.60 m deep, 0.15 m high. Treated-timber or GI frame on 10 mm neoprene pads, the cavity filled with wool, deck 2 × 18 mm BWP. The front subs stand on isolation feet on the deck." },
      { k: "L/C/R", v: "KEF Q Concerto Meta on 0.77 m dense (sand-filled) stands, Uni-Q at ~1.18 m. L and R 0.85 m from each side wall, toed in to the centre of row 1. Ports face into the wool (or foam-plugged — they're high-passed at 80 Hz)." },
      { k: "Front subs", v: "PB-1000 Pro at 1.25 m and 2.90 m from the left wall, turned sideways so their 0.51 m depth runs along the wall; 100 mm clear of the stands." },
      { k: "Screen", v: "120″ 16:9, 2.66 × 1.49 m, bottom edge +0.90 m, top +2.39 m, fixed to the baffle framing with 100 mm clear behind it." },
      { k: "Access", v: "Make one baffle panel removable (magnetic catches) to reach the subs and speaker terminals." },
    ],
    india: "BWP (IS 710) plywood for the baffle and stage, stamped on every sheet; MR grade delaminates in a sealed, AC-cycled room. Black polyester acoustic fabric holds tension through the monsoon; cotton sags.",
    avoid: [
      "A hard, painted wall behind the speakers.",
      "Glossy screws, brackets or cable jackets that catch light through the screen.",
      "The subs or speakers touching the baffle — they'll buzz it.",
    ],
    verify: [
      "Projector on a black frame: nothing behind the screen visible from row 1.",
      "Knock test on the baffle: dull, not drummy.",
      "Blow test on the fabric: breath passes easily.",
    ],
    targets: [
      { k: "First width mode", v: "41.5 Hz — tamed by the subs at 1.25 / 2.90 m" },
      { k: "Speaker-to-baffle", v: "Flush, ≤ 10 mm proud" },
    ],
    cost: { lo: 0.4 * L, hi: 0.7 * L, note: "Stage and window infill (est.); the baffle wall and plinths are in the AV budget" },
    stage: "carcass",
  },

  /* ============================================================ side walls */
  {
    id: "sides", n: 3, name: "Side walls",
    where: "Left: the east wall to the lobby, with the door at x = 3.25–4.15 m. Right: the glazed west wall to the outside.",
    acoustics: [
      "In a 4.13 m wide room the outer seats are 0.5–0.8 m from a side wall. The first reflection of each front speaker arrives at the ear barely 1 ms after the direct sound and blurs the stereo image and dialogue. 50 mm of wool held 50 mm off the wall absorbs it down to ~250 Hz — thin PET panels would only stop the treble and leave a boxy, bright room.",
      "The lobby side is the one that leaks: the bar lounge is next door. That wall gets a second, independent stud wall 25 mm off the brick, touching it nowhere — mass, air, mass. The west wall is external brick; infilling the window is enough.",
      "The surrounds hang on these walls, aimed across the room at the far row-1 seat. Their brackets need solid blocking inside the stud wall — decided before the board goes on.",
    ],
    layers: [
      { name: "Brick wall (lobby side)", mm: 230, kind: "structure" },
      { name: "Air gap — nothing touches the brick", mm: 25, kind: "air" },
      { name: "GI studs 50 mm, cavity filled with 48 kg/m³ wool", mm: 50, kind: "wool" },
      { name: "Gypsum board 12.5 mm", mm: 12.5, kind: "board" },
      { name: "5 kg/m² MLV, joints taped", mm: 2, kind: "damping" },
      { name: "Gypsum board 12.5 mm, joints staggered", mm: 12.5, kind: "board" },
      { name: "Air gap behind the panels", mm: 50, kind: "air" },
      { name: "Reflection panels: 50 mm wool", mm: 50, kind: "wool" },
      { name: "Dark polyester acoustic fabric", mm: 1, kind: "fabric" },
    ],
    details: [
      { k: "Panels", v: "From x = 1.6 m to the rear corner on the right wall, 0.9–1.9 m high for row 1 and 1.2–2.2 m for row 2; on the left, from 1.6 m to the door and from the door to the rear corner. ~10 m² in all." },
      { k: "Surrounds", v: "Side pair at x = 4.40 m, 1.65 m high; rear pair at x = 5.90 m, 2.0 m high — on low-profile tilting brackets through the panels into timber blocking. Aim at the far row-1 seat." },
      { k: "Width lost", v: "Panels stand 100 mm proud: the left aisle narrows from 0.80 to ~0.70 m." },
      { k: "West window", v: "Infilled with brick and plastered (or a gasketed, removable plug of wool behind two boards). Either way, totally blacked out." },
      { k: "Front third", v: "Black velvet on the side walls from the screen to x ≈ 2.0 m stops light bouncing back onto the picture (add-on, ₹35k)." },
    ],
    india: "GI stud systems from Gyproc / USG Boral; Rockwool / Twiga wool at 48 kg/m³ (IS 8183). MLV is the local substitute for damping compound. Fabric: FR polyester with a BS 5867 / NFPA 701 certificate for the specific fabric.",
    avoid: [
      "Board screwed to battens fixed to the brick — looks identical, isolates almost nothing.",
      "9–12 mm PET 'acoustic panels' as the main treatment.",
      "Back-to-back sockets across the lobby wall.",
    ],
    verify: [
      "Photos of the 25 mm gap and the full wool fill before the second board.",
      "A datasheet showing absorption at 250 Hz, not just 1 kHz; weigh a panel — 50 mm wool is noticeably heavy.",
      "Every back-box sealed with putty pads.",
    ],
    targets: [
      { k: "RT60", v: "0.25–0.35 s, flat 125 Hz–4 kHz (whole room)" },
      { k: "Lobby isolation", v: "≥ 50 dB with the door" },
    ],
    cost: { lo: 0.6 * L, hi: 1.0 * L, note: "~15 m² independent wall on the lobby side + west window infill (est.); panels are in the AV treatment line" },
    stage: "carcass",
  },

  /* ============================================================= rear wall */
  {
    id: "rear", n: 4, name: "Rear wall and projector",
    where: "The north wall to the laundry, 0.57 m behind row-2 ears and 0.22 m behind the seat backs. The projector shelf and hush box are on it at 2.40 m.",
    acoustics: [
      "This is the surface that most decides how row 2 sounds. The reflection off a hard rear wall travels 1.14 m further than the direct sound and cancels it at ~150 Hz — a notch in the upper bass and lower voice range that no room correction can fill, because boosting a cancellation just cancels more.",
      "Only thick absorption fixes it: 100–150 mm of wool across the full width from 0.6 to 2.2 m, which works down to ~150 Hz. Diffusion is wrong here — a diffuser needs 2 m or more between it and the listener to work, and row 2 is 0.57 m away.",
      "The laundry is behind it: a washing machine on a spin cycle is exactly the kind of low-frequency noise that travels through a slab. If the drawings' slider into the laundry exists, it is removed and the opening bricked up.",
    ],
    layers: [
      { name: "Brick wall; any slider to the laundry bricked up", mm: 230, kind: "structure", note: "Verify on site" },
      { name: "Air gap", mm: 25, kind: "air" },
      { name: "GI studs + 48 kg/m³ wool", mm: 50, kind: "wool" },
      { name: "2 × 12.5 mm gypsum board", mm: 25, kind: "board" },
      { name: "Thick absorber: 48 kg/m³ wool", mm: 125, kind: "wool", note: "0.6–2.2 m high, full width" },
      { name: "Dark polyester acoustic fabric", mm: 1, kind: "fabric" },
    ],
    details: [
      { k: "Rear corners", v: "Floor-to-ceiling traps behind the riser corners (add-on, ₹40k) where length and height modes pile up behind row 2." },
      { k: "Projector shelf", v: "Steel shelf on the rear wall at lens height 2.40 m, 5.02 m throw, fixed through isolation pads so the fan doesn't drum the wall." },
      { k: "Hush box", v: "12–18 mm BWP lined with 25 mm wool, open at the lens, with a low intake and a ducted exhaust to the AC return through a quiet inline fan. Keeps the 24–26 dB fan and 340–400 W of heat away from row 2." },
      { k: "Recliners", v: "Wall-hugger recliners for row 2 — the backs are 0.22 m from the wall, and the absorber takes 150 mm of that." },
    ],
    india: "The same GI/board system as the lobby wall. A carpenter can build the hush box; specify BWP and FR fabric.",
    avoid: [
      "A diffuser behind row 2.",
      "The projector on a shelf screwed straight to the wall with no isolation.",
      "Venting the hush box into the sealed ceiling void.",
    ],
    verify: [
      "REW measurement at row 2 before and after: no deep notch between 120 and 180 Hz.",
      "Listen at the projector with the room silent: fan inaudible from row 2.",
    ],
    targets: [
      { k: "Rear-wall notch", v: "≈ 150 Hz without treatment" },
      { k: "Absorber depth", v: "100–150 mm" },
    ],
    cost: { lo: 0.4 * L, hi: 0.7 * L, note: "~10 m² independent wall + opening infill (est.); absorber and hush box are in the AV budget" },
    stage: "carcass",
  },

  /* ========================================================== floor, riser */
  {
    id: "floor", n: 5, name: "Floor and riser",
    where: "The second-floor slab, with the 0.45 m riser for row 2 from x = 4.16 m to the rear wall, and carpet throughout.",
    acoustics: [
      "Bass goes through a slab far more easily than through air: the rooms below will hear the subs before anyone hears the dialogue. Nothing that makes bass is fixed rigidly to the slab — the stage and riser sit on neoprene pads and the subs on isolation feet.",
      "A hollow timber riser is a drum under row 2. Filled with wool or sand and decoupled, it stops ringing between 40 and 100 Hz and stops the rear subs shaking it. The two rear subs don't stand on it at all: they go down through cut-outs to the slab.",
      "Carpet on felt underlay is the room's biggest high-frequency absorber after the panels, and dark carpet stops the screen's light bouncing up into the picture.",
    ],
    layers: [
      { name: "RCC floor slab (rooms below)", mm: 150, kind: "structure" },
      { name: "Anti-termite treatment at the wall–floor line", mm: 0, kind: "membrane" },
      { name: "Neoprene isolation pads under the riser frame", mm: 10, kind: "damping" },
      { name: "Riser frame; cavity filled with wool or sand", mm: 392, kind: "wool" },
      { name: "Deck: 2 × 18 mm BWP, joints staggered, glued and screwed", mm: 36, kind: "timber" },
      { name: "Felt underlay 8–10 mm", mm: 9, kind: "damping" },
      { name: "Solution-dyed nylon carpet tiles, dark", mm: 8, kind: "fabric" },
    ],
    details: [
      { k: "Riser", v: "0.45 m high, two steps of 0.225 m with lit nosings, rated 300 kg per recliner. Carpeted edges." },
      { k: "Sub cut-outs", v: "Two ~0.40 × 0.40 m openings in the rear corners down to the slab for the sealed SB-1000 Pro (0.33 m cube), on isolation feet, tops below the deck." },
      { k: "Cables in the riser", v: "Recliner power from floor boxes, and — if you want tactile transducers — speaker cable to each of the six seat positions before the deck closes." },
      { k: "Air return", v: "A grille in the riser front for the AC return, lined behind." },
      { k: "Sightline", v: "Mock up the actual recliners before building: row 2 clears row-1 heads by only 40–66 mm. If it's short, 0.55 m instead of 0.45 m." },
    ],
    india: "BWP ply (IS 710) and treated timber; anti-termite treatment to IS 6313 with a 5-year warranty before any timber goes down. Carpet tiles let you replace a stained patch.",
    avoid: [
      "A single 12 mm deck over an empty frame.",
      "Polypropylene carpet — it crushes in a year.",
      "Timber on the slab without anti-termite treatment.",
    ],
    verify: [
      "Walk the riser before carpeting: no drumming, no creaks.",
      "Play a 30–60 Hz sweep and listen in the room below.",
    ],
    targets: [
      { k: "Riser height", v: "0.45 m (0.55 m if the sightline fails)" },
      { k: "Load", v: "300 kg per seat" },
    ],
    cost: { lo: 1.2 * L, hi: 1.8 * L, note: "Riser + steps + carpet ~25 m² (est.); filling it is a ₹30k add-on" },
    stage: "carcass",
  },

  /* ================================================================== door */
  {
    id: "door", n: 6, name: "Door",
    where: "East wall, x = 3.25–4.15 m, into the lobby, just in front of the riser. Opens outward.",
    acoustics: [
      "Isolation is only as good as its weakest part, and it's almost always the door. A 50 dB wall with a 30 dB door is a 30 dB room — and the gaps around a normal door leak more than the leaf.",
      "It must open outward: the left side surround hangs 0.25 m past the jamb, and in an emergency the way out is a push.",
    ],
    layers: [
      { name: "Corridor side: laminate or veneer", mm: 4, kind: "finish" },
      { name: "Solid core, 45–50 mm", mm: 46, kind: "timber" },
      { name: "Room side: dark fabric panel matching the wall", mm: 1, kind: "fabric" },
    ],
    details: [
      { k: "Seals", v: "Compression seals on three sides and an automatic drop seal at the threshold." },
      { k: "Frame", v: "Treated hardwood (teak or sal) or pressed steel, sealed to the stud wall with acoustic sealant." },
      { k: "Hardware", v: "Lever handle, quiet latch, a door closer set gently. No vision panel." },
    ],
    india: "Many local 'soundproof doors' are flush doors with foam inside and no test data. Ask for a lab report stating STC or Rw.",
    avoid: ["Hollow or honeycomb flush doors.", "No drop seal.", "MDF frames — they swell each monsoon."],
    verify: ["Light test: room lit, lobby dark — no light round the closed door.", "The lab report for the exact door set."],
    targets: [{ k: "Door rating", v: "STC 40–45 or better" }],
    cost: { lo: 0.8 * L, hi: 1.5 * L, note: "Tested acoustic door set (est.)" },
    stage: "fitout",
  },

  /* =================================================================== air */
  {
    id: "air", n: 7, name: "Air conditioning and fresh air",
    where: "A ducted unit outside the room, supply slots in the side walls' front half, return low through the riser.",
    acoustics: [
      "The loudest thing in most Indian theatres is the AC. A wall split at 40 dB(A) is audible in every quiet scene; the room's target is NC 25 (~30 dB(A)) at the seats with the AC running.",
      "Noise comes from the fan and from air speed at the grilles, so the unit lives outside the room, the ducts are lined, and air leaves slowly — under 2 m/s — through long slots rather than small fast grilles.",
    ],
    layers: [
      { name: "Ducted inverter unit, outside the room", mm: 0, kind: "structure" },
      { name: "Flexible connector + lined duct + silencer bend", mm: 0, kind: "wool" },
      { name: "Linear slot diffusers, side walls, front half", mm: 0, kind: "finish" },
    ],
    details: [
      { k: "Capacity", v: "About 2 TR: six people (~600 W), the projector (340–400 W), the receiver and a sun-baked slab. Confirm with a heat-load calculation." },
      { k: "Supply", v: "Side-wall linear slots in the front half; nothing blows on heads or at the screen, and nothing above row 2." },
      { k: "Return", v: "Low, through a lined grille in the riser front." },
      { k: "Fresh air + humidity", v: "A small energy-recovery ventilator with a MERV 8 filter, and a dehumidifying mode to hold 45–55% RH through the monsoon." },
      { k: "Condensate", v: "Pipes in 13–19 mm nitrile insulation; the drain falls away from the rack and projector, with a drip tray." },
    ],
    india: "Dealers quote tonnage and star rating, rarely noise: ask for the indoor unit's sound pressure at low speed.",
    avoid: ["A wall split on the screen wall or above row 2.", "Unlined sheet-metal ducts.", "No fresh air — CO₂ puts people to sleep."],
    verify: ["Sound level at the seats with the AC on normal: ≤ 30 dB(A).", "A hygrometer in the room through the first monsoon."],
    targets: [{ k: "Background noise", v: "NC 25 / ~30 dB(A)" }, { k: "Humidity", v: "45–55% RH" }],
    cost: { lo: 2.0 * L, hi: 3.2 * L, note: "Ducted inverter + lined ducts + ERV (est.)" },
    stage: "carcass",
  },

  /* ========================================================= power, lights */
  {
    id: "power", n: 8, name: "Power and lighting",
    where: "Dedicated circuits to the rack, projector, AC and recliners; a dedicated AV earth; dimmable warm lighting.",
    acoustics: [
      "Hum is the power's contribution to the sound: four long subwoofer runs and a poor earth make a 50 Hz buzz that no amount of acoustics removes. A dedicated earth pit and a neutral-to-earth check under 2 V prevent it.",
      "Cheap LED drivers flicker when dimmed and whine audibly in a quiet room. Mount them outside the seating area and choose flicker-free ones.",
    ],
    layers: [
      { name: "Dedicated MCB circuits + 30 mA RCCB + Type 2 SPD", mm: 0, kind: "structure" },
      { name: "FRLS copper in heavy-gauge conduit; power and signal 300 mm apart", mm: 0, kind: "membrane" },
      { name: "Online UPS for AV and recliners", mm: 0, kind: "finish" },
    ],
    details: [
      { k: "Earth", v: "Dedicated earth pit to IS 3043, ≤ 1 Ω; neutral–earth < 2 V at the rack (in the AV budget)." },
      { k: "Spare conduit", v: "One empty 32 mm conduit with a pull cord from rack to projector — the next HDMI standard." },
      { k: "Lighting", v: "2700 K, CRI 90+, dimming smoothly to 1%: cove or wall-wash, riser step lights, no light on the screen." },
      { k: "Safety", v: "Optical smoke detector (and in the void if deeper than 800 mm), 2 kg CO₂ extinguisher by the door, emergency light on the UPS." },
    ],
    india: "ISI-marked FRLS cable (IS 694) and conduit (IS 9537). Monsoon surges kill receivers: surge protection at the board and at the rack.",
    avoid: ["AV on raw mains.", "Power and speaker cable in the same conduit.", "Dry-powder extinguishers near electronics."],
    verify: ["Earth-resistance record, megger and RCCB trip tests, signed.", "Mains off during a film: nothing blinks."],
    targets: [{ k: "Earth", v: "≤ 1 Ω" }, { k: "Neutral–earth", v: "< 2 V" }],
    cost: { lo: 0.8 * L, hi: 1.5 * L, note: "Circuits, lighting and controls (est.); earth pit and UPS are in the AV budget" },
    stage: "civil",
  },
];

/** Everything to settle, in order, with the surface it belongs to. */
export const SEQUENCE: { stage: Stage; items: { surface: string; t: string }[] }[] = [
  { stage: "civil", items: [
    { surface: "ceiling", t: "Terrace waterproofing, ponding test, heat-reflective coat" },
    { surface: "floor", t: "Anti-termite treatment at the floor–wall line" },
    { surface: "front", t: "South and west windows bricked up (or plugged) and plastered" },
    { surface: "rear", t: "Confirm and brick up any slider into the laundry" },
    { surface: "power", t: "Earth pit, dedicated circuits, conduits with a spare to the projector" },
    { surface: "sides", t: "Plaster cured 28 days, walls primed and dry" },
  ] },
  { stage: "carcass", items: [
    { surface: "sides", t: "Independent stud walls on the lobby and laundry sides, blocking for the surround brackets" },
    { surface: "air", t: "Ducted AC, lined ducts, condensate drain tested" },
    { surface: "ceiling", t: "Hangers, wool, double board; back-boxes for 4 (+2) overheads; projector exhaust duct" },
    { surface: "floor", t: "Mock up the recliners; build the riser on pads, filled, with sub cut-outs and seat cables" },
    { surface: "front", t: "Stage on pads, corner traps, baffle frame" },
    { surface: "ceiling", t: "Photograph every cavity before it is boarded" },
  ] },
  { stage: "fitout", items: [
    { surface: "sides", t: "Reflection panels on 50 mm gaps; velvet on the front third" },
    { surface: "rear", t: "125 mm rear-wall absorber; projector shelf and hush box" },
    { surface: "door", t: "Tested acoustic door set, seals and drop seal" },
    { surface: "floor", t: "Underlay and carpet tiles" },
    { surface: "front", t: "Speakers, subs, baffle fabric, then the screen" },
  ] },
  { stage: "handover", items: [
    { surface: "sides", t: "Isolation test: ≥ 50 dB to the lobby and office" },
    { surface: "rear", t: "RT60 0.25–0.35 s from 125 Hz to 4 kHz, both rows; no rear-wall notch" },
    { surface: "air", t: "Background noise ≤ 30 dB(A) with the AC on" },
    { surface: "power", t: "Electrical test records; UPS changeover with the projector running" },
    { surface: "front", t: "Calibration: Dirac, then the JVC" },
  ] },
];
