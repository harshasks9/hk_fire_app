import type { RoomSpec } from "./types";

/**
 * Home theatre — material specification for a second-floor room in Hyderabad.
 *
 * Written for the room the app carries: a 6.20 × 4.37 m shell (20'4" × 14'4"),
 * a 7.2.4 layout behind a 120" acoustically transparent screen, two rows of
 * three, with the home office on the same floor. The climate and supply
 * conditions below are what make an Indian theatre different from the one in
 * the brochure: a monsoon that puts the air at 80% humidity for four months,
 * top-floor heat, dust, termites, and power that dips, surges and cuts out.
 */
export const THEATRE_SPEC: RoomSpec = {
  spaceId: "sf-theatre",
  title: "Home theatre — materials and performance",
  intro:
    "What every material in this room has to be, and how to check it before it is paid for. " +
    "Hand this to the acoustic contractor, the carpenter, the electrician and the AC installer; " +
    "each line is written so it can be ticked on site.",
  context: [
    "Hyderabad: summer days of 40–44 °C; a monsoon from June to September with relative humidity of 70–90%; dry, dusty spells in between.",
    "Second floor, so the slab above may be the roof. Sun on the slab adds heat, and a roof leak lands in the ceiling void.",
    "The home office is on the same floor, so sound kept in matters as much as sound in the room.",
    "Mains power that fluctuates, surges in storms and cuts out. Expect a changeover to an inverter or DG.",
    "Subterranean termites are common. Any timber, plywood or board in contact with walls or floor is at risk.",
    "The Indian market sells many “acoustic” and “soundproof” products with no test data. Ask for a test report or certificate for every performance claim.",
  ],
  targets: [
    { k: "Reverberation (RT60)", v: "0.25–0.35 s across 500 Hz–2 kHz, measured with the room finished and furnished" },
    { k: "Sound kept in", v: "At least 50 dB lower in the home office than in the theatre, measured with pink noise" },
    { k: "Background noise", v: "NC 25 or lower (about 30 dB(A)) at the seats, with the AC running on its normal setting" },
    { k: "Climate in the room", v: "22–25 °C, relative humidity 45–55%, all year, including the monsoon" },
    { k: "Screen", v: "120\" 16:9 acoustically transparent, 2.66 m wide, bottom edge at +0.95 m" },
    { k: "AV earth", v: "Dedicated earth; resistance of 1 Ω or less as measured; neutral-to-earth under 2 V at the rack" },
    { k: "Power to AV", v: "Online double-conversion UPS with a surge protection device upstream; no AV directly on raw mains" },
  ],
  sections: [
    /* ------------------------------------------------------------------ */
    {
      id: "shell", title: "Shell, waterproofing and damp",
      blurb: "Nothing that follows survives a leak or a damp wall. Settle these before any batten goes up.",
      lines: [
        {
          id: "roof-wp", title: "Roof or terrace above is waterproofed and ponding-tested", critical: true, when: "civil",
          spec: "If the slab above is the roof or open terrace: a polyurethane or APP-modified bitumen membrane, turned up at least 300 mm at parapets, with a protective screed. It must pass a 48–72 hour ponding test before the ceiling is built.",
          india: "Monsoon rain on a flat roof is the most common cause of ruined theatre ceilings in India. A leak above a sealed acoustic ceiling is found late and costs the whole ceiling.",
          verify: "Dated photos of the ponding test with the water level marked at the start and at the end. No damp patches on the slab underside after the first heavy rain.",
          avoid: "Brush-on cementitious coating as the only layer on an exposed roof slab.",
        },
        {
          id: "anti-termite", title: "Anti-termite treatment before any timber goes in", critical: true, when: "civil",
          spec: "Chemical anti-termite treatment to IS 6313 at the floor–wall junction and along the skirting line (drill-and-fill if the floor is already finished), with a written warranty of at least 5 years.",
          india: "The riser, wall battens, diffusers and door frame are all food for subterranean termites. Treatment after the room is closed means drilling through finished walls.",
          verify: "Applicator's certificate naming the chemical, its concentration and the treated area; keep it in Documents.",
        },
        {
          id: "dry-walls", title: "Plaster fully cured and dry before it is covered", when: "civil",
          spec: "At least 28 days of plaster curing, then an alkali-resistant primer on every wall and on the slab soffit before battens, studs or boards are fixed.",
          india: "Walls closed in during or just after the monsoon trap moisture behind the boards. The result is mould on the fabric and a musty room by the next monsoon.",
          verify: "Moisture-meter readings in the dry band on the meter's plaster scale, taken on every wall, recorded and photographed.",
        },
        {
          id: "heat-roof", title: "Heat from the roof slab kept out", when: "before-ceiling",
          spec: "If the slab above is the roof: 75–100 mm of mineral wool in the ceiling void (the same layer used for isolation), and a reflective or heat-reflective coating on the terrace side.",
          india: "In a Hyderabad summer the underside of a sunlit slab radiates heat into the room all evening, which is exactly when the room is used, and the AC works harder and louder.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "isolation", title: "Sound isolation — keeping sound in",
      blurb: "Mass, a gap, and no rigid path between the room and the house. This is the expensive part to redo, so specify it exactly.",
      lines: [
        {
          id: "iso-walls", title: "Independent inner wall on the walls shared with the office and lobby", critical: true, when: "before-ceiling",
          spec: "A GI stud wall (50–75 mm studs) standing free of the brick wall with a 25 mm gap, touching it nowhere. The cavity is filled with 50 mm mineral wool at 48–64 kg/m³ (IS 8183). The face is two layers of 12.5 mm gypsum board (IS 2095) with staggered joints and a damping layer or 5 kg/m² mass-loaded vinyl between them.",
          india: "Gypsum-and-GI systems from the major Indian manufacturers are easy to get in Hyderabad. Damping compounds are harder to find, so MLV is the usual substitute and works if the joints are taped.",
          verify: "Before the second board goes on: photos showing the gap, the wool filling the whole cavity, and no screws into the brick wall.",
          avoid: "Board screwed straight onto battens fixed to the brick wall. It looks the same when finished and isolates almost nothing.",
        },
        {
          id: "iso-ceiling", title: "Ceiling hung on isolation hangers", critical: true, when: "before-ceiling",
          spec: "A GI grid hung from the slab on acoustic isolation hangers (neoprene or spring), carrying two layers of 12.5 mm gypsum board with 75 mm mineral wool above. It stops 10 mm short of the walls, and that gap is filled with non-hardening acoustic sealant.",
          india: "Local false-ceiling teams hang ceilings on rigid GI rod and angle by default. Isolation hangers have to be named in the order, or they will not be used.",
          verify: "Count the hangers against the drawing. Check the perimeter gap before it is sealed.",
          avoid: "A single layer of mineral-fibre or grid tiles. They are fine as treatment but do nothing for isolation.",
        },
        {
          id: "iso-door", title: "Acoustic door set", critical: true, when: "purchase",
          spec: "Solid-core door, 45–50 mm, with a tested rating of STC 40–45 or better. Treated hardwood (teak or sal) or pressed-steel frame, compression seals on three sides, an automatic drop seal at the threshold, and the door opening outward.",
          india: "Many “soundproof doors” sold locally are flush doors with foam glued inside and no test data. Termites and monsoon swelling ruin untreated frames and MDF cores.",
          verify: "Ask for the lab test report that states the STC or Rw. With the room lit and the corridor dark, no light should show round the closed door.",
          avoid: "A hollow or honeycomb flush door, a door without a drop seal, an MDF frame.",
        },
        {
          id: "iso-openings", title: "Any window or vent blanked or upgraded", when: "before-ceiling",
          spec: "Each window either gets a removable plug (mineral wool behind two layers of board, gasketed) or is replaced with 6.38 mm laminated acoustic glass in a double-glazed unit (safety glass to IS 2553). It must be fully blacked out.",
          india: "Road noise and daylight both come in through the glass. A plug is cheaper and better if the view is not needed.",
        },
        {
          id: "iso-penetrations", title: "Every penetration sealed", when: "before-ceiling",
          spec: "Every back box, conduit, AC pipe and duct gets non-hardening acoustic sealant or putty pads. Sockets are never placed back-to-back across a shared wall.",
          verify: "Check the sealing at every box before the board goes on, then photograph it.",
        },
        {
          id: "iso-subs", title: "Subwoofers and riser decoupled from the structure", when: "before-ceiling",
          spec: "Subwoofers stand on isolation platforms, and the riser frame sits on rubber isolation pads. No rigid fixing to the slab carries low bass.",
          india: "The rooms below are lived in, and bass travels through the slab far more easily than through the air.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "treatment", title: "Acoustic treatment — how it sounds",
      blurb: "Absorb the first reflections, trap the bass, spread the rear. Thin decorative panels do not do this.",
      lines: [
        {
          id: "treat-panels", title: "First-reflection absorbers on the side walls and ceiling", critical: true, when: "purchase",
          spec: "50 mm absorber panels with a mineral-wool or glass-wool core at 48–96 kg/m³, NRC 0.8 or better, wrapped in fabric, at the first-reflection points on the side walls and ceiling for both rows.",
          india: "The 9–12 mm polyester (PET) panels sold everywhere as “acoustic panels” absorb only the high frequencies. They stop flutter echo but leave the room boomy and harsh with film sound.",
          verify: "The datasheet shows absorption at 250 Hz as well as at 1 kHz. Weigh a sample panel: a 50 mm mineral-wool panel is noticeably heavy.",
          avoid: "12 mm PET or foam egg-crate as the main treatment.",
        },
        {
          id: "treat-bass", title: "Bass traps in the corners", when: "purchase",
          spec: "Floor-to-ceiling corner traps 100–150 mm deep of dense mineral wool, or tuned membrane traps, in the front corners behind the screen and in the rear corners.",
          india: "Small rooms with brick walls, which is most Indian rooms, have strong bass build-up. The subwoofers will boom without corner traps.",
        },
        {
          id: "treat-rear", title: "Rear-wall diffuser", when: "purchase",
          spec: "A quadratic-residue or skyline diffuser behind row two, made from treated hardwood or HDHMR board with all edges sealed.",
          avoid: "Plain MDF. It swells in the monsoon, and the wells go out of true.",
        },
        {
          id: "treat-fabric", title: "Fabric: acoustically open, flame-retardant, stable in humidity", critical: true, when: "purchase",
          spec: "Polyester or FR-polyester acoustic fabric, dark (charcoal, navy or deep brown), stretched on aluminium or treated-timber frames. Flame-retardant, with a certificate to BS 5867-2 Type B, NFPA 701 or EN 13501-1 Class B.",
          india: "Cotton and viscose absorb moisture and sag visibly each monsoon. Polyester holds its tension.",
          verify: "Blow test: you should easily feel your breath through the fabric. Get the fire certificate for the specific fabric, not for the range.",
        },
        {
          id: "treat-front", title: "Front wall behind the screen is black and absorbent", when: "before-ceiling",
          spec: "The whole wall behind the acoustically transparent screen is covered in matt black fabric over absorber, with the L/C/R speaker baffles fixed rigidly and wrapped black.",
          verify: "With the projector on, nothing behind the screen is visible through it.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "joinery", title: "Riser, joinery and board",
      blurb: "Anything made of wood in a closed, humid, air-conditioned room has to be the right grade and treated.",
      lines: [
        {
          id: "ply-grade", title: "Plywood grade: BWP for structure, BWR at minimum everywhere else", critical: true, when: "purchase",
          spec: "BWP (IS 710, marine) plywood for the riser deck, steps, speaker baffles and screen frame; BWR (IS 303) at minimum for panel backs and frames. All of it glue-line treated against borers and termites, ISI-marked, with the maker's warranty.",
          india: "MR (moisture-resistant) plywood is the cheap default in Indian carpentry. It de-laminates in a sealed, humid room that is air-conditioned on and off.",
          verify: "The ISI mark and grade are stamped on every sheet. Photograph the stamps before cutting.",
          avoid: "MR-grade plywood, plain MDF, particle board.",
        },
        {
          id: "riser", title: "Riser: 0.40 m, damped and decoupled", critical: true, when: "before-ceiling",
          spec: "A treated-timber or GI frame on rubber pads, the cavity filled with mineral wool, and a deck of two layers of 18 mm BWP with staggered joints. It must carry at least 300 kg per recliner position. Nosings are lit and the edges carpeted.",
          verify: "Walk on it before carpeting: there should be no drumming or creaking. Check the step height and nosing contrast for safe use in the dark.",
          avoid: "A single 12 mm deck over an empty frame, which drums with every footstep and every bass note.",
        },
        {
          id: "fixings", title: "Stainless fixings", when: "purchase",
          spec: "SS 304 screws and brackets for panels, frames and the riser. Hot-dip galvanised or stainless steel for anything fixed to masonry.",
          india: "Mild-steel screws rust in monsoon humidity and stain fabric panels from behind.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "floor", title: "Floor and seating",
      blurb: "Soft, dark and replaceable underfoot; seats that survive the heat and a power cut.",
      lines: [
        {
          id: "carpet", title: "Carpet: solution-dyed nylon or wool-nylon on a felt underlay", when: "purchase",
          spec: "Cut-pile carpet, preferably tiles, in solution-dyed nylon or 80/20 wool-nylon, dark, with an 8–10 mm felt or PU underlay. Flame-retardant certificate, anti-microbial backing.",
          india: "Dust gets tracked in, so tiles let you replace a stained patch instead of the whole room. An anti-microbial backing resists monsoon mustiness.",
          avoid: "Cheap polypropylene carpet, which crushes flat in the aisles within a year and has poor fire behaviour.",
        },
        {
          id: "recliners", title: "Recliners: real leather or performance fabric, with a manual override", critical: true, when: "purchase",
          spec: "Motorised recliners with a hardwood or steel frame, high-resilience foam at 32–40 kg/m³ or denser, flame-retardant (BS 5852), upholstered in top-grain leather or performance fabric. Each seat needs a battery pack or manual release, and the motors run through the UPS.",
          india: "PU “leatherette” peels and flakes within two to three Hyderabad summers. In a power cut, a motorised recliner without a battery or release stays stuck in the reclined position.",
          verify: "Ask the supplier which upholstery is real leather and which is PU; the label must say. Check dimensions against the lift car (5'6\" × 5'0\") and the stair turn before ordering; crane-in through the terrace is the fallback.",
          avoid: "PU or “bonded” leather, and seats with no local service centre.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "hvac", title: "Air conditioning, fresh air and humidity",
      blurb: "The loudest thing in most Indian theatres is the AC. Specify it by noise, not only by tonnage.",
      lines: [
        {
          id: "ac-unit", title: "Low-noise inverter AC, sized by heat load", critical: true, when: "design",
          spec: "A ducted or cassette inverter unit, roughly 2 TR for six people, the projector, the amplifiers and a top-floor slab; confirm with a heat-load calculation. The indoor unit must be no louder than 30 dB(A) at low speed at the seats, with air outlets away from the screen and not blowing onto heads.",
          india: "A wall-mounted split above the seats at 40+ dB is audible in every quiet scene. Dealers quote tonnage and star rating, rarely noise.",
          verify: "Ask for the indoor unit's sound pressure figure at low fan speed. Measure it at the seats after installation.",
          avoid: "A wall split mounted on the screen wall or above row two.",
        },
        {
          id: "ac-ducts", title: "Lined, slow ducts", when: "before-ceiling",
          spec: "Internally lined ducts, a flexible connector at the unit, a silencer or lined bend before each grille, and supply-air speed under 2 m/s at the grilles.",
        },
        {
          id: "ac-pipes", title: "Pipes insulated, condensate drained safely", critical: true, when: "before-ceiling",
          spec: "Copper refrigerant pipes in closed-cell nitrile rubber insulation, 13–19 mm thick, joints taped. Condensate drain at a steady fall with a trap, running away from the rack and projector, with a drip tray under the indoor unit.",
          india: "In the monsoon, un-insulated or badly jointed pipes sweat, and the drip lands on the ceiling board or the equipment.",
          verify: "Pour a bucket of water into the drain tray before the ceiling closes; it must clear without backing up.",
        },
        {
          id: "fresh-air", title: "Fresh air and humidity control", when: "design",
          spec: "A small energy-recovery ventilator or fresh-air fan with a filter (MERV 8 or better) for six people in a sealed room, plus a dehumidifying mode or a dehumidifier to hold 45–55% relative humidity.",
          india: "A sealed room at 80% monsoon humidity grows mould on the fabric, fogs the projector lens and softens the speaker surrounds. Without fresh air, CO₂ builds up and people doze off during films.",
          verify: "Put a hygrometer in the room and check it through the first monsoon.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "power", title: "Power, earthing and cabling",
      blurb: "Clean, protected power and cable you can replace without opening a finished wall.",
      lines: [
        {
          id: "circuits", title: "Dedicated circuits and protection", critical: true, when: "design",
          spec: "Separate MCB circuits (IS/IEC 60898) for the AV rack, the projector, the AC and the recliners. RCCB protection at 30 mA (IS 12640) on the socket circuits. Type 2 surge protection at the distribution board, and point-of-use surge protection at the rack.",
          india: "Monsoon lightning and grid switching cause surges that kill AV receivers and projector power supplies. Most home distribution boards have no surge protection.",
        },
        {
          id: "ups", title: "Online UPS and stabiliser for the AV", critical: true, when: "purchase",
          spec: "An online double-conversion UPS (typically 3 kVA; size it to the equipment list) feeding the projector, the AV rack and the recliners, with enough runtime for the laser projector to shut down properly. A servo stabiliser ahead of it if the incoming voltage swings outside 200–250 V.",
          india: "Power cuts and changeovers to the inverter or DG are routine. A laser projector or AV receiver that loses power mid-film can be damaged, and the line-interactive inverters common in Indian homes do not give clean power.",
          verify: "Switch off the mains during a test film. Nothing should blink or reboot.",
        },
        {
          id: "earth", title: "Dedicated earth for AV", critical: true, when: "civil",
          spec: "A dedicated earth pit or clean earth for the AV circuits, designed to IS 3043, measured at 1 Ω or less, and a neutral-to-earth voltage under 2 V at the rack.",
          india: "Shared or poor earths are the usual cause of hum, buzz and ground loops in Indian installations.",
          verify: "Earth-resistance test record from an earth tester, signed and filed.",
        },
        {
          id: "wiring", title: "FRLS copper wiring in heavy-gauge conduit", when: "civil",
          spec: "ISI-marked FRLS copper cable (IS 694): 2.5 mm² for sockets, 4 mm² for the AC. Heavy-gauge PVC conduit (IS 9537) in the walls. Power and signal run in separate conduits at least 300 mm apart and cross only at right angles.",
          avoid: "Non-ISI cable, or thin-wall conduit shared by power and speaker cable.",
        },
        {
          id: "speaker-cable", title: "Speaker cable for 11 channels", when: "before-ceiling",
          spec: "Oxygen-free copper speaker cable, in-wall rated (CL2 or CL3). 14 AWG (2.5 mm²) for runs up to 10 m, 12 AWG beyond that. Each run labelled at both ends. Runs to all 7 floor-level positions, both subwoofers and all 4 ceiling (Atmos) positions, plus spares.",
        },
        {
          id: "video-cable", title: "Projector and control cabling, with a spare conduit", critical: true, when: "before-ceiling",
          spec: "A certified 48 Gbps HDMI 2.1 active optical (fibre) cable to the projector, Cat6A to the projector and the rack, and one empty 32 mm conduit with a pull cord from rack to projector.",
          india: "Every format change means a new cable. Without the spare conduit, replacing one means cutting open a finished acoustic ceiling.",
          avoid: "Passive copper HDMI over 5 m for 4K/120, and cables with no certification label.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "av", title: "Screen, projector and rack",
      blurb: "Buy through the Indian channel. A grey import has no warranty here.",
      lines: [
        {
          id: "screen", title: "Acoustically transparent screen", when: "purchase",
          spec: "120\" 16:9 fixed-frame, tensioned, woven acoustically transparent material, gain about 1.0, with a moiré-free weave for 4K. Aluminium frame, bottom edge at +0.95 m.",
          india: "Humidity slackens poorly tensioned screens. A woven material stays flat and passes sound better than a cheap perforated vinyl.",
          verify: "No visible weave pattern or moiré from row one, and no sag at the corners after the first monsoon.",
        },
        {
          id: "projector", title: "Laser 4K projector with an Indian warranty", critical: true, when: "purchase",
          spec: "A laser light source (no lamp replacements), native or pixel-shifted 4K, with a sealed optical engine, bought through the maker's authorised Indian distributor. Its throw ratio must suit a ~4.2 m throw to a 2.66 m-wide image.",
          india: "Dust gets into unsealed optics and leaves permanent blobs on the image. Grey-market imports are cheaper but carry no warranty in India, and projector repairs are costly.",
          verify: "The invoice must show GST and the distributor name, and the serial number must be registered for warranty.",
        },
        {
          id: "rack", title: "Ventilated rack, reachable from behind", when: "design",
          spec: "An equipment rack in a ventilated closet or out of the room, with a thermostatic exhaust fan and rear access, kept at 20–27 °C.",
          india: "Amplifiers in a closed cabinet in a Hyderabad summer run hot and fail early. Fans in the room add noise.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "finishes", title: "Lighting and finishes",
      blurb: "Dark, matt and quiet, so the only bright thing in the room is the picture.",
      lines: [
        {
          id: "lighting", title: "Dimmable, flicker-free, warm lighting", when: "purchase",
          spec: "LED at 2700 K, CRI 90 or better, with flicker-free drivers that dim smoothly to 1% (trailing-edge or DALI/0–10 V). Drivers mounted where they can be reached and heard from outside the seating. Step lights on the riser, and no light spill onto the screen.",
          india: "Cheap LED drivers flicker when dimmed and hum audibly in a quiet room. Voltage dips make it worse.",
          verify: "Dim to the lowest setting and point a phone camera at the light: no bands or flicker. Listen for driver hum with the room silent.",
        },
        {
          id: "paint", title: "Matt, dark, low-VOC, anti-fungal paint", when: "purchase",
          spec: "Matt emulsion on the ceiling and the front half of the walls, dark (light reflectance value 10 or below). Low-VOC (under 50 g/L), with an anti-fungal additive.",
          india: "Sheen and light colours near the screen wash out the picture. The anti-fungal additive matters in a sealed room during the monsoon.",
          avoid: "Satin or gloss finishes, brass or chrome trim facing the screen.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "fire", title: "Fire safety",
      blurb: "A closed room full of fabric, foam and electronics, with the only way out in the dark.",
      lines: [
        {
          id: "fire-materials", title: "Certificates for every fabric, foam and panel", critical: true, when: "purchase",
          spec: "Flame-retardant certificates for the fabrics (BS 5867-2 Type B, NFPA 701 or EN 13501-1 Class B), the seat foam (BS 5852) and the carpet. Acoustic panels Class 1 surface spread of flame (BS 476-7) or Euroclass B. Filed in Documents.",
          india: "NBC 2016 Part 4 expects this in assembly spaces. A home is not policed the same way, which is why it has to be written into the order.",
        },
        {
          id: "fire-detect", title: "Smoke detection and the right extinguisher", when: "before-ceiling",
          spec: "An optical smoke detector in the room, and in the ceiling void if it is deeper than 800 mm, installed to IS 2189. A 2 kg CO₂ extinguisher by the door and rack.",
          avoid: "Dry-powder extinguishers near the electronics: the powder ruins them.",
        },
        {
          id: "egress", title: "A way out in the dark", when: "handover",
          spec: "The door opens outward. The step lights and an emergency light run on battery or the UPS. Fire-stopping wherever cables pass through walls or the slab.",
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: "tests", title: "Checks before you close up and before you pay",
      blurb: "Measured, not assumed. Most of these need a free app, a measurement microphone and an hour.",
      lines: [
        {
          id: "photos", title: "Photograph every cavity before it is boarded", critical: true, when: "before-ceiling",
          spec: "Dated photos of every wall and ceiling cavity: studs, wool, hangers, cable routes, sealed boxes. Filed against the room.",
          india: "In a year's time this is the only record of where the cables and hangers are.",
        },
        {
          id: "test-isolation", title: "Isolation test", critical: true, when: "handover",
          spec: "Pink noise at about 100 dB in the theatre, measured in the home office and the lobby: a difference of 50 dB or more.",
        },
        {
          id: "test-rt60", title: "Reverberation and frequency response", when: "handover",
          spec: "RT60 of 0.25–0.35 s (500 Hz–2 kHz) measured with REW and a calibrated measurement microphone at both rows. Bass response within ±6 dB from 30–120 Hz at the main seat after subwoofer integration.",
        },
        {
          id: "test-noise", title: "Background noise with the AC on", when: "handover",
          spec: "NC 25 or lower (about 30 dB(A)) at the seats, with the AC on its normal setting and the rack running.",
        },
        {
          id: "test-electrical", title: "Electrical tests on record", critical: true, when: "handover",
          spec: "Insulation-resistance (megger) test, earth resistance, RCCB trip test, and a UPS changeover test with the projector running, all written down and signed.",
        },
        {
          id: "calibration", title: "Calibration and paperwork", when: "handover",
          spec: "Room correction run and saved, with before and after graphs. GST invoices, warranty cards registered in the owner's name, manuals, and the cavity photos, all in Documents.",
        },
      ],
    },
  ],
  caveat:
    "Performance targets are the brief to the acoustic consultant and installer, not a substitute for their design. Numbers such as air-conditioning capacity and UPS rating must be confirmed against the final equipment list.",
};
