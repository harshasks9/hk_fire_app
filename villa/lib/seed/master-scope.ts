import type { Category, Unit } from "../model/types";

/**
 * House-wide scope — the things that belong to no single room.
 *
 * The brief listed most of these. The ones marked `added: true` were not in the
 * brief but belong in any honest model of a three-storey Hyderabad villa
 * fit-out, and are exactly the omissions that surface late and expensively:
 * water hardness, sanctioned electrical load, condensate routing, rainwater
 * harvesting (statutory on this plot size in Telangana), Wi-Fi across three
 * slabs, gated-community working-hours rules, and whether a three-seater sofa
 * physically fits up a 5'6" x 5'0" lift.
 */

export interface MasterItem {
  title: string;
  category: Category;
  unit?: Unit;
  qty?: number;
  spec?: string;
  critical?: boolean;
  /** Not in the original brief; reasoned in because the villa needs it. */
  added?: boolean;
}

export const MASTER_SCOPE: MasterItem[] = [
  /* -------------------------------------------------- enabling & statutory */
  { title: "Interior works NOC from the gated community", category: "civil", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Most Hyderabad gated communities cap working hours, restrict weekend work and require a deposit. Get this before mobilising." },
  { title: "Working hours, noise & debris rules — agreed with the association", category: "civil", unit: "ls", qty: 1, added: true },
  { title: "Structural sign-off for civil modifications", category: "civil", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Any wall removal or new opening needs the structural consultant's written approval." },
  { title: "Vaastu review & sign-off", category: "civil", unit: "ls", qty: 1, added: true,
    spec: "Cheaper to resolve before the puja room, main door and kitchen hob positions are built." },
  { title: "Site insurance during works", category: "safety", unit: "ls", qty: 1, added: true },
  { title: "Debris removal & site logistics", category: "civil", unit: "ls", qty: 1, added: true },
  { title: "Material storage on site — secured & dry", category: "civil", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Marble, veneer and shutters delivered early need a dry, lockable store. Monsoon damage is not covered by most vendors." },
  { title: "Furniture access plan — lift, stair and crane", category: "handover", unit: "ls", qty: 1, critical: true, added: true,
    spec: "The lift car is 5'6\" x 5'0\". Large sofas, the theatre recliners and slab countertops must be checked against the lift, the stair turn and the balcony openings BEFORE ordering. Crane hire if not." },

  /* --------------------------------------------------------------- civil */
  { title: "Civil modifications & wall alterations", category: "civil", unit: "ls", qty: 1 },
  { title: "Masonry & plastering making good", category: "civil", unit: "sqft" },
  { title: "Anti-termite pre-treatment", category: "safety", unit: "sqft", critical: true, added: true },
  { title: "Expansion & movement joint treatment", category: "civil", unit: "rft", added: true },

  /* ------------------------------------------------------- waterproofing */
  { title: "Waterproofing — all wet areas", category: "waterproofing", unit: "sqft", critical: true },
  { title: "Waterproofing — terrace & balconies", category: "waterproofing", unit: "sqft", critical: true,
    spec: "Name the responsible contractor and the warranty length. This is the single most common source of villa disputes." },
  { title: "Waterproofing warranty & flood-test sign-off", category: "waterproofing", unit: "ls", qty: 1, critical: true, added: true },

  /* ------------------------------------------------------------ finishes */
  { title: "Flooring — house-wide supply", category: "flooring", unit: "sqft", critical: true },
  { title: "Stone & marble — slab selection and reservation", category: "stone", unit: "sqft", critical: true,
    spec: "Slabs must be selected, photographed, numbered and reserved at the yard. Book-matching cannot be decided from a sample tile." },
  { title: "False ceilings — house-wide", category: "ceiling", unit: "sqft" },
  { title: "Painting — interior", category: "paint", unit: "sqft" },
  { title: "Painting — exterior", category: "paint", unit: "sqft" },
  { title: "Wall finishes & textures", category: "wall-finish", unit: "sqft" },
  { title: "Wallpaper", category: "wall-finish", unit: "sqft" },
  { title: "Decorative wall panelling", category: "wall-finish", unit: "sqft" },

  /* ----------------------------------------------------- openings & glass */
  { title: "Internal doors — house set", category: "doors", unit: "nos", qty: 18, critical: true },
  { title: "Main entrance door", category: "doors", unit: "nos", qty: 1, critical: true },
  { title: "Windows — review, repair & finish", category: "windows", unit: "ls", qty: 1 },
  { title: "Mosquito mesh to all openable windows", category: "windows", unit: "sqft", added: true,
    spec: "Retrofitting mesh after curtains and pelmets are up is far more disruptive." },
  { title: "Glass — shower partitions, railings, mirrors", category: "glass", unit: "sqft" },
  { title: "Door & window hardware schedule", category: "hardware", unit: "ls", qty: 1 },

  /* ---------------------------------------------------------- carpentry */
  { title: "Custom carpentry — house-wide", category: "carpentry", unit: "sqft" },
  { title: "Wardrobes — all bedrooms", category: "wardrobe", unit: "sqft", critical: true },
  { title: "Kitchen — main", category: "kitchen", unit: "rft", critical: true },
  { title: "Kitchen — wet", category: "kitchen", unit: "rft" },
  { title: "Joinery shop drawings & approval", category: "carpentry", unit: "ls", qty: 1, critical: true,
    spec: "Nothing goes to the factory before a signed shop drawing. This is the gate that prevents rework." },

  /* ---------------------------------------------------------- bathrooms */
  { title: "Bathrooms — sanitaryware & CP package", category: "sanitaryware", unit: "set", qty: 8, critical: true },
  { title: "Bathroom vanities & storage", category: "bathroom", unit: "nos", qty: 8 },

  /* ---------------------------------------------------------- furniture */
  { title: "Loose furniture package", category: "loose-furniture", unit: "ls", qty: 1 },
  { title: "Bespoke furniture package", category: "bespoke-furniture", unit: "ls", qty: 1 },

  /* ----------------------------------------------------------- lighting */
  { title: "Lighting design & layout", category: "lighting", unit: "ls", qty: 1, critical: true },
  { title: "Architectural & cove lighting", category: "lighting", unit: "nos", qty: 120 },
  { title: "Decorative lighting package", category: "lighting", unit: "nos", qty: 24 },
  { title: "Lighting control & dimming strategy", category: "automation", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Dimmable drivers must be specified with the fixtures. Retrofitting dimming means replacing drivers." },

  /* ------------------------------------------------------- MEP & systems */
  { title: "Electrical — rewiring, DBs and points", category: "electrical", unit: "ls", qty: 1, critical: true },
  { title: "Sanctioned electrical load review & upgrade", category: "electrical", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Five ACs, a lift, a home theatre, an EV point and induction cooking will exceed a standard villa sanction. Check before the DB schedule is frozen." },
  { title: "Earthing & lightning protection", category: "electrical", unit: "ls", qty: 1, critical: true, added: true },
  { title: "Plumbing — supply & drainage", category: "plumbing", unit: "ls", qty: 1, critical: true },
  { title: "HVAC — five-bedroom villa package", category: "hvac", unit: "nos", qty: 9, critical: true },
  { title: "AC outdoor unit positions, support & condensate routing", category: "hvac", unit: "ls", qty: 1, critical: true, added: true,
    spec: "ODU placement affects the facade, the neighbour's noise complaint and the drain fall. Fix it on a drawing, not on site." },
  { title: "Ceiling fans — house set", category: "fans", unit: "nos", qty: 12 },
  { title: "Home automation system", category: "automation", unit: "ls", qty: 1, critical: true },
  { title: "Wi-Fi & structured networking", category: "networking", unit: "ls", qty: 1, critical: true },
  { title: "Wi-Fi coverage plan across three slabs", category: "networking", unit: "nos", qty: 4, critical: true, added: true,
    spec: "Concrete slabs kill mesh. Access points need cabled backhaul and their positions fixed before ceilings close." },
  { title: "Network rack & NVR location", category: "networking", unit: "nos", qty: 1, added: true },
  { title: "CCTV", category: "security", unit: "nos", qty: 8 },
  { title: "Video doorbell", category: "security", unit: "nos", qty: 1 },
  { title: "Access control & smart locks", category: "security", unit: "nos", qty: 3 },
  { title: "Intercom between floors", category: "security", unit: "nos", qty: 3, added: true },
  { title: "Burglar alarm & sensors", category: "security", unit: "ls", qty: 1 },
  { title: "Safe / strong-room provision", category: "security", unit: "nos", qty: 1, added: true },

  /* ------------------------------------------------------------ AV & TV */
  { title: "AV design & distribution", category: "av", unit: "ls", qty: 1 },
  { title: "Home theatre system", category: "av", unit: "ls", qty: 1, critical: true },
  { title: "Televisions — house set", category: "av", unit: "nos", qty: 5 },
  { title: "Speakers — distributed audio", category: "av", unit: "nos", qty: 12 },
  { title: "DTH / cable routing", category: "av", unit: "ls", qty: 1, added: true },

  /* ------------------------------------------------- soft & decorative */
  { title: "Curtains & sheers — house-wide", category: "curtains", unit: "rft", critical: true },
  { title: "Blinds", category: "curtains", unit: "sqft" },
  { title: "Curtain pelmet / ceiling coordination", category: "curtains", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Pelmet depth must be cut into the false ceiling design. The classic clash is a curtain track fouling an AC grille." },
  { title: "Soft furnishings — cushions, throws, bedlinen", category: "soft-furnishing", unit: "ls", qty: 1 },
  { title: "Rugs", category: "rugs", unit: "nos", qty: 8 },
  { title: "Art package", category: "art", unit: "ls", qty: 1 },
  { title: "Accessories & props", category: "accessories", unit: "ls", qty: 1 },
  { title: "Final styling & photography", category: "styling", unit: "ls", qty: 1 },

  /* --------------------------------------------------------- appliances */
  { title: "Appliance package", category: "appliances", unit: "ls", qty: 1, critical: true },
  { title: "Appliance electrical & plumbing coordination", category: "appliances", unit: "ls", qty: 1, critical: true, added: true },

  /* ------------------------------------------- vertical circulation & shell */
  { title: "Elevator interior finish", category: "elevator", unit: "ls", qty: 1 },
  { title: "Lift pit waterproofing & machine access", category: "elevator", unit: "ls", qty: 1, critical: true, added: true },
  { title: "Staircase finishes", category: "staircase", unit: "ls", qty: 1 },
  { title: "Railings & balustrades", category: "staircase", unit: "rft" },
  { title: "Terrace access ladder & safety", category: "safety", unit: "nos", qty: 1, added: true },

  /* ------------------------------------------------- special rooms */
  { title: "Puja room interiors", category: "carpentry", unit: "ls", qty: 1 },
  { title: "Bar fit-out", category: "bespoke-furniture", unit: "ls", qty: 1 },
  { title: "Laundry fit-out", category: "carpentry", unit: "ls", qty: 1 },

  /* ------------------------------------------------------------ outdoor */
  { title: "Terrace fit-out", category: "landscape", unit: "ls", qty: 1 },
  { title: "Facade elements", category: "facade", unit: "ls", qty: 1 },
  { title: "Landscaping — soft & hard", category: "landscape", unit: "sqft", critical: true },
  { title: "Irrigation system", category: "landscape", unit: "ls", qty: 1 },
  { title: "Outdoor furniture", category: "loose-furniture", unit: "ls", qty: 1 },
  { title: "Exterior lighting", category: "lighting", unit: "nos", qty: 30 },
  { title: "Driveway & paving", category: "landscape", unit: "sqft" },
  { title: "Gates & gate automation", category: "security", unit: "nos", qty: 2 },

  /* ------------------------------------------------ power, water, safety */
  { title: "Solar PV — feasibility & install", category: "power-backup", unit: "ls", qty: 1 },
  { title: "Solar water heater", category: "water", unit: "nos", qty: 1, added: true,
    spec: "Commonly required or incentivised in Telangana; also the cheapest hot water for five bathrooms." },
  { title: "UPS / inverter & battery bank", category: "power-backup", unit: "ls", qty: 1, critical: true },
  { title: "DG set / backup sizing review", category: "power-backup", unit: "ls", qty: 1, added: true },
  { title: "Sump, overhead tank & pumps", category: "water", unit: "ls", qty: 1, critical: true, added: true },
  { title: "Water level controller", category: "water", unit: "nos", qty: 1, added: true },
  { title: "Water softener", category: "water", unit: "nos", qty: 1, critical: true, added: true,
    spec: "Hyderabad borewell water is hard. Without softening, CP fittings, glass and the geysers scale within a year." },
  { title: "Water purifier — drinking", category: "water", unit: "nos", qty: 2 },
  { title: "Rainwater harvesting pit", category: "water", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Statutory on plots of this size in Telangana. Confirm whether the builder already provided one." },
  { title: "Fire extinguishers & smoke detectors", category: "safety", unit: "nos", qty: 8, critical: true, added: true },
  { title: "Gas leak detector", category: "safety", unit: "nos", qty: 2, added: true },
  { title: "Pest control — pre-handover", category: "safety", unit: "ls", qty: 1 },

  /* ---------------------------------------------------------- handover */
  { title: "Deep cleaning", category: "cleaning", unit: "ls", qty: 1 },
  { title: "Snagging & rectification", category: "handover", unit: "ls", qty: 1, critical: true },
  { title: "As-built & as-installed drawings", category: "handover", unit: "ls", qty: 1, critical: true, added: true,
    spec: "Concealed plumbing and wiring routes, photographed before closing. Worth more than any other handover document." },
  { title: "Warranty pack", category: "handover", unit: "ls", qty: 1, critical: true },
  { title: "AMC register — lift, HVAC, automation, water systems", category: "handover", unit: "ls", qty: 1, critical: true },
  { title: "Key & access schedule", category: "handover", unit: "ls", qty: 1, added: true },
  { title: "Operating manuals & handover walkthrough", category: "handover", unit: "ls", qty: 1 },
  { title: "Defect liability period — agreed and dated", category: "handover", unit: "ls", qty: 1, critical: true, added: true },
  { title: "Retention release schedule", category: "handover", unit: "ls", qty: 1, added: true },
];
