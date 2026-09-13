import type { Category, SpaceKind, Unit } from "../model/types";

/**
 * Room scope templates.
 *
 * The product's central promise is that no room starts as a blank page and that
 * nothing important can quietly go missing. So every space is born already
 * carrying the full checklist a good designer would work through for that kind
 * of room — including the boring, invisible, expensive things people forget:
 * concealed plumbing, exhaust, waterproofing upstands, data points, curtain
 * pelmet depth, AC drain routing, wardrobe loft access.
 *
 * Items are never deleted, only marked Not Applicable with a reason. The
 * checklist is therefore also an audit trail of what was *considered*.
 */

export interface TemplateItem {
  title: string;
  category: Category;
  /** How to pre-fill quantity. */
  basis?: "floor-area" | "wall-area" | "perimeter" | "count" | "manual";
  qty?: number;
  unit?: Unit;
  spec?: string;
  /** Marked so the completeness engine can shout louder about these. */
  critical?: boolean;
  /** Trade that must finish first — feeds the dependency graph. */
  after?: Category[];
}

const FINISHES = (opts: { ceiling?: boolean } = {}): TemplateItem[] => [
  { title: "Flooring", category: "flooring", basis: "floor-area", critical: true },
  { title: "Skirting", category: "flooring", basis: "perimeter", unit: "rft" },
  ...(opts.ceiling === false
    ? []
    : [{ title: "False ceiling", category: "ceiling" as Category, basis: "floor-area" as const, critical: true }]),
  { title: "Ceiling & wall paint", category: "paint", basis: "wall-area", after: ["ceiling"] },
  { title: "Wall treatment / feature finish", category: "wall-finish", basis: "manual" },
];

const ELECTRICAL_BASE: TemplateItem[] = [
  { title: "Switches & switch plate finish", category: "electrical", basis: "count", qty: 6 },
  { title: "Power sockets", category: "electrical", basis: "count", qty: 6 },
  { title: "Lighting circuits & wiring", category: "electrical", basis: "count", qty: 4, critical: true, after: ["ceiling"] },
];

const LIGHTING_BASE: TemplateItem[] = [
  { title: "Ambient / cove lighting", category: "lighting", basis: "count", qty: 6, after: ["ceiling"] },
  { title: "Task & accent lighting", category: "lighting", basis: "count", qty: 3 },
  { title: "Decorative light fixture", category: "lighting", basis: "count", qty: 1 },
];

const WINDOW_BASE: TemplateItem[] = [
  { title: "Curtain track / pelmet", category: "curtains", basis: "perimeter", unit: "rft" },
  { title: "Curtains — blackout", category: "curtains", basis: "manual", unit: "rft" },
  { title: "Sheers", category: "curtains", basis: "manual", unit: "rft" },
  { title: "Blinds", category: "curtains", basis: "manual", unit: "sqft" },
  { title: "Window glass & mesh review", category: "windows", basis: "manual" },
];

const DOOR_BASE: TemplateItem[] = [
  { title: "Door shutter & frame finish", category: "doors", basis: "count", qty: 1 },
  { title: "Door hardware — handle, hinges, lock, stopper", category: "hardware", basis: "count", qty: 1 },
];

const BEDROOM_TEMPLATE: TemplateItem[] = [
  ...FINISHES(),
  ...DOOR_BASE,
  { title: "Wardrobe — carcass & shutters", category: "wardrobe", basis: "manual", critical: true },
  { title: "Wardrobe internal accessories", category: "wardrobe", basis: "manual", spec: "Pull-out trays, tie/belt rack, drawer inserts, hanging rods, loft access." },
  { title: "Wardrobe loft storage", category: "wardrobe", basis: "manual" },
  { title: "Bed", category: "loose-furniture", basis: "count", qty: 1, critical: true },
  { title: "Mattress", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Headboard / bed-back panelling", category: "bespoke-furniture", basis: "manual" },
  { title: "Bedside tables", category: "loose-furniture", basis: "count", qty: 2 },
  { title: "Bedside lighting", category: "lighting", basis: "count", qty: 2 },
  { title: "Feature wall", category: "wall-finish", basis: "manual" },
  { title: "TV unit / console", category: "bespoke-furniture", basis: "manual" },
  { title: "Television", category: "av", basis: "count", qty: 1 },
  { title: "Dresser & mirror", category: "bespoke-furniture", basis: "manual" },
  { title: "Study / work desk", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Mirrors", category: "accessories", basis: "count", qty: 1 },
  ...WINDOW_BASE,
  { title: "Air conditioning", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "AC drain & copper routing", category: "hvac", basis: "manual", critical: true, spec: "Confirm drain fall and outdoor unit position before false ceiling closes." },
  { title: "Ceiling fan", category: "fans", basis: "count", qty: 1 },
  ...ELECTRICAL_BASE,
  { title: "USB / charging points", category: "electrical", basis: "count", qty: 2 },
  { title: "Data / network point", category: "networking", basis: "count", qty: 1 },
  ...LIGHTING_BASE,
  { title: "Lighting automation & scenes", category: "automation", basis: "count", qty: 1 },
  { title: "Curtain automation", category: "automation", basis: "count", qty: 1 },
  { title: "Artwork", category: "art", basis: "count", qty: 2 },
  { title: "Rug", category: "rugs", basis: "count", qty: 1 },
  { title: "Loose seating / occasional chair", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Accessories & styling", category: "styling", basis: "manual" },
];

const BATHROOM_TEMPLATE: TemplateItem[] = [
  { title: "Waterproofing", category: "waterproofing", basis: "floor-area", critical: true, spec: "Membrane to floor plus 300 mm wall upstand; 1.2 m in the shower zone. Flood-test before tiling." },
  { title: "Floor tile", category: "flooring", basis: "floor-area", critical: true, after: ["waterproofing"] },
  { title: "Wall tile", category: "flooring", basis: "wall-area", critical: true, after: ["waterproofing"] },
  { title: "Marble / stone feature", category: "stone", basis: "manual" },
  { title: "Shower floor fall & drain position", category: "plumbing", basis: "manual", critical: true },
  { title: "Concealed plumbing — hot & cold", category: "plumbing", basis: "count", qty: 6, critical: true },
  { title: "Vanity unit", category: "bathroom", basis: "manual", critical: true },
  { title: "Vanity countertop", category: "stone", basis: "manual" },
  { title: "Basin", category: "sanitaryware", basis: "count", qty: 1, critical: true },
  { title: "Basin mixer", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "WC", category: "sanitaryware", basis: "count", qty: 1, critical: true },
  { title: "Health faucet", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "Shower — overhead & hand shower", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "Diverter / concealed body", category: "sanitaryware", basis: "count", qty: 1, critical: true, spec: "Body must be ordered before wall tiling — it is cast into the wall." },
  { title: "Shower glass partition", category: "glass", basis: "manual", after: ["flooring"] },
  { title: "Geyser / hot water", category: "plumbing", basis: "count", qty: 1, critical: true },
  { title: "Mirror", category: "accessories", basis: "count", qty: 1 },
  { title: "Mirror / vanity lighting", category: "lighting", basis: "count", qty: 1 },
  { title: "Shower & vanity niches", category: "civil", basis: "count", qty: 2, spec: "Niche positions must be set out before waterproofing." },
  { title: "Storage — under-counter & tall", category: "bathroom", basis: "manual" },
  { title: "Towel rails & robe hooks", category: "accessories", basis: "count", qty: 3 },
  { title: "Bathroom accessories set", category: "accessories", basis: "count", qty: 1 },
  { title: "Exhaust fan", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Ventilation & window review", category: "windows", basis: "manual" },
  { title: "Ceiling", category: "ceiling", basis: "floor-area", spec: "Moisture-resistant board or grid; must allow geyser access." },
  { title: "Lighting", category: "lighting", basis: "count", qty: 3 },
  { title: "Sockets — shaver / hairdryer", category: "electrical", basis: "count", qty: 1 },
  ...DOOR_BASE,
];

const KITCHEN_TEMPLATE: TemplateItem[] = [
  { title: "Kitchen layout & work triangle sign-off", category: "kitchen", basis: "manual", critical: true },
  { title: "Base unit carcass", category: "kitchen", basis: "manual", unit: "rft", critical: true },
  { title: "Wall unit carcass", category: "kitchen", basis: "manual", unit: "rft" },
  { title: "Tall units", category: "kitchen", basis: "manual", unit: "rft" },
  { title: "Shutters & finish", category: "kitchen", basis: "manual", critical: true },
  { title: "Hardware — hinges, channels, lift-ups", category: "hardware", basis: "manual" },
  { title: "Internal accessories — baskets, cutlery, corner units", category: "kitchen", basis: "manual" },
  { title: "Countertop", category: "stone", basis: "manual", critical: true },
  { title: "Backsplash", category: "flooring", basis: "manual" },
  { title: "Island", category: "kitchen", basis: "manual" },
  { title: "Sink", category: "kitchen", basis: "count", qty: 1 },
  { title: "Kitchen faucet", category: "kitchen", basis: "count", qty: 1 },
  { title: "Hob", category: "appliances", basis: "count", qty: 1, critical: true },
  { title: "Chimney / extraction", category: "appliances", basis: "count", qty: 1, critical: true, spec: "Duct route to the external wall must be agreed before the false ceiling closes." },
  { title: "Built-in oven", category: "appliances", basis: "count", qty: 1 },
  { title: "Microwave", category: "appliances", basis: "count", qty: 1 },
  { title: "Refrigerator", category: "appliances", basis: "count", qty: 1 },
  { title: "Dishwasher", category: "appliances", basis: "count", qty: 1 },
  { title: "Dishwasher plumbing & power point", category: "plumbing", basis: "count", qty: 1, critical: true },
  { title: "Water purifier", category: "water", basis: "count", qty: 1 },
  { title: "Pantry storage", category: "kitchen", basis: "manual" },
  { title: "Gas line / cylinder bank", category: "plumbing", basis: "manual", critical: true },
  { title: "Plumbing points", category: "plumbing", basis: "count", qty: 4, critical: true },
  { title: "Electrical points & appliance loads", category: "electrical", basis: "count", qty: 12, critical: true },
  { title: "Under-cabinet & profile lighting", category: "lighting", basis: "count", qty: 6 },
  { title: "Ceiling lighting", category: "lighting", basis: "count", qty: 6 },
  ...FINISHES(),
  { title: "Ventilation — fresh air & exhaust", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Wet-kitchen interface & service door", category: "kitchen", basis: "manual", critical: true },
  ...DOOR_BASE,
];

const LIVING_TEMPLATE: TemplateItem[] = [
  ...FINISHES(),
  { title: "Feature / TV wall panelling", category: "wall-finish", basis: "manual", critical: true },
  { title: "TV unit", category: "bespoke-furniture", basis: "manual" },
  { title: "Television", category: "av", basis: "count", qty: 1 },
  { title: "Speakers & AV", category: "av", basis: "count", qty: 4 },
  { title: "Sofa", category: "loose-furniture", basis: "count", qty: 1, critical: true },
  { title: "Occasional chairs", category: "loose-furniture", basis: "count", qty: 2 },
  { title: "Coffee table", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Side tables", category: "loose-furniture", basis: "count", qty: 2 },
  { title: "Console / sideboard", category: "bespoke-furniture", basis: "manual" },
  { title: "Rug", category: "rugs", basis: "count", qty: 1 },
  ...WINDOW_BASE,
  { title: "Air conditioning", category: "hvac", basis: "count", qty: 2, critical: true },
  { title: "Ceiling fans", category: "fans", basis: "count", qty: 2 },
  ...ELECTRICAL_BASE,
  ...LIGHTING_BASE,
  { title: "Chandelier / statement fixture", category: "lighting", basis: "count", qty: 1 },
  { title: "Lighting automation & scenes", category: "automation", basis: "count", qty: 1 },
  { title: "Curtain automation", category: "automation", basis: "count", qty: 1 },
  { title: "Data / Wi-Fi access point", category: "networking", basis: "count", qty: 1 },
  { title: "Artwork", category: "art", basis: "count", qty: 3 },
  { title: "Cushions & throws", category: "soft-furnishing", basis: "manual" },
  { title: "Accessories & styling", category: "styling", basis: "manual" },
  ...DOOR_BASE,
];

const DINING_TEMPLATE: TemplateItem[] = [
  ...FINISHES(),
  { title: "Dining table", category: "loose-furniture", basis: "count", qty: 1, critical: true },
  { title: "Dining chairs", category: "loose-furniture", basis: "count", qty: 8 },
  { title: "Crockery unit / buffet", category: "bespoke-furniture", basis: "manual" },
  { title: "Statement pendant over table", category: "lighting", basis: "count", qty: 1, critical: true, spec: "Drop height and ceiling hook must be set before the false ceiling closes." },
  { title: "Feature wall / mirror panel", category: "wall-finish", basis: "manual" },
  ...WINDOW_BASE,
  { title: "Air conditioning", category: "hvac", basis: "count", qty: 1 },
  { title: "Ceiling fan", category: "fans", basis: "count", qty: 1 },
  ...ELECTRICAL_BASE,
  ...LIGHTING_BASE,
  { title: "Artwork", category: "art", basis: "count", qty: 1 },
  { title: "Rug", category: "rugs", basis: "count", qty: 1 },
  { title: "Accessories & styling", category: "styling", basis: "manual" },
];

const WIC_TEMPLATE: TemplateItem[] = [
  { title: "Flooring", category: "flooring", basis: "floor-area" },
  { title: "Skirting", category: "flooring", basis: "perimeter", unit: "rft" },
  { title: "Ceiling", category: "ceiling", basis: "floor-area" },
  { title: "Paint", category: "paint", basis: "wall-area" },
  { title: "Hanging & shelving system", category: "wardrobe", basis: "manual", critical: true },
  { title: "Drawer units & trays", category: "wardrobe", basis: "manual" },
  { title: "Shoe storage", category: "wardrobe", basis: "manual" },
  { title: "Jewellery / safe provision", category: "security", basis: "count", qty: 1 },
  { title: "Island / seating bench", category: "bespoke-furniture", basis: "manual" },
  { title: "Full-length mirror", category: "accessories", basis: "count", qty: 1 },
  { title: "Wardrobe profile & shelf lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Sockets", category: "electrical", basis: "count", qty: 2 },
  { title: "Ventilation / dehumidification", category: "hvac", basis: "count", qty: 1, spec: "Closed WICs in Hyderabad monsoon need air movement or a dehumidifier point." },
  ...DOOR_BASE,
];

const POWDER_TEMPLATE: TemplateItem[] = [
  { title: "Waterproofing", category: "waterproofing", basis: "floor-area", critical: true },
  { title: "Floor tile / stone", category: "flooring", basis: "floor-area" },
  { title: "Wall finish — feature", category: "wall-finish", basis: "wall-area", critical: true },
  { title: "Counter-top basin", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "Vanity / console", category: "bathroom", basis: "manual" },
  { title: "Basin mixer", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "WC", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "Health faucet", category: "sanitaryware", basis: "count", qty: 1 },
  { title: "Concealed plumbing", category: "plumbing", basis: "count", qty: 3, critical: true },
  { title: "Mirror & mirror lighting", category: "lighting", basis: "count", qty: 1 },
  { title: "Accessories", category: "accessories", basis: "count", qty: 1 },
  { title: "Exhaust fan", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Lighting", category: "lighting", basis: "count", qty: 2 },
  ...DOOR_BASE,
];

const CIRCULATION_TEMPLATE: TemplateItem[] = [
  { title: "Flooring", category: "flooring", basis: "floor-area" },
  { title: "Skirting", category: "flooring", basis: "perimeter", unit: "rft" },
  { title: "False ceiling", category: "ceiling", basis: "floor-area" },
  { title: "Paint", category: "paint", basis: "wall-area" },
  { title: "Wall panelling / art wall", category: "wall-finish", basis: "manual" },
  { title: "Lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Switches & sockets", category: "electrical", basis: "count", qty: 3 },
  { title: "Night / step lighting", category: "lighting", basis: "count", qty: 2 },
  { title: "Artwork", category: "art", basis: "count", qty: 2 },
  { title: "Smoke detector", category: "safety", basis: "count", qty: 1 },
];

const STAIR_TEMPLATE: TemplateItem[] = [
  { title: "Tread & riser stone", category: "stone", basis: "manual", critical: true },
  { title: "Stringer / side cladding", category: "stone", basis: "manual" },
  { title: "Balustrade & handrail", category: "staircase", basis: "manual", unit: "rft", critical: true },
  { title: "Soffit finish & paint", category: "paint", basis: "manual" },
  { title: "Stairwell feature wall", category: "wall-finish", basis: "manual" },
  { title: "Stairwell chandelier / pendant run", category: "lighting", basis: "count", qty: 1, critical: true, spec: "Access for cleaning and lamp changes must be resolved at design stage." },
  { title: "Step / cove lighting", category: "lighting", basis: "count", qty: 8 },
  { title: "Anti-slip nosing", category: "safety", basis: "manual", critical: true },
  { title: "Artwork / gallery wall", category: "art", basis: "count", qty: 3 },
];

const LIFT_TEMPLATE: TemplateItem[] = [
  { title: "Lift car interior finish", category: "elevator", basis: "manual", critical: true },
  { title: "Lift car flooring", category: "elevator", basis: "manual" },
  { title: "Lift car lighting & ceiling", category: "elevator", basis: "manual" },
  { title: "Landing door finish", category: "elevator", basis: "count", qty: 1 },
  { title: "Call panel & indicator finish", category: "elevator", basis: "count", qty: 1 },
  { title: "Handrail & mirror", category: "elevator", basis: "count", qty: 1 },
  { title: "Shaft ventilation & lighting", category: "electrical", basis: "count", qty: 1 },
  { title: "Power backup interface (ARD)", category: "power-backup", basis: "count", qty: 1, critical: true, spec: "Auto rescue device so the car lands on a power cut." },
  { title: "AMC & warranty terms", category: "handover", basis: "manual" },
];

const PUJA_TEMPLATE: TemplateItem[] = [
  { title: "Flooring — marble", category: "stone", basis: "floor-area", critical: true },
  { title: "Ceiling & detail", category: "ceiling", basis: "floor-area" },
  { title: "Mandir / altar unit", category: "bespoke-furniture", basis: "manual", critical: true },
  { title: "Carved doors / jaali screen", category: "carpentry", basis: "manual" },
  { title: "Wall finish — marble or inlay", category: "wall-finish", basis: "wall-area" },
  { title: "Storage drawers", category: "carpentry", basis: "manual" },
  { title: "Lamp & diya niche", category: "carpentry", basis: "count", qty: 1 },
  { title: "Warm accent & profile lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Bell & hanging provision", category: "accessories", basis: "count", qty: 1 },
  { title: "Ventilation for lamp smoke", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Sockets", category: "electrical", basis: "count", qty: 2 },
  ...DOOR_BASE,
];

const THEATRE_TEMPLATE: TemplateItem[] = [
  { title: "Acoustic treatment — walls", category: "av", basis: "wall-area", critical: true, spec: "Absorption at first reflection points, diffusion at the rear. Must be budgeted, not assumed." },
  { title: "Acoustic treatment — ceiling", category: "av", basis: "floor-area", critical: true },
  { title: "Acoustic door & seal", category: "doors", basis: "count", qty: 1, critical: true },
  { title: "Room-in-room isolation review", category: "av", basis: "manual", critical: true },
  { title: "Carpet / flooring", category: "flooring", basis: "floor-area" },
  { title: "Riser platform", category: "civil", basis: "manual" },
  { title: "Recliner seating", category: "loose-furniture", basis: "count", qty: 6, critical: true },
  { title: "Projector", category: "av", basis: "count", qty: 1, critical: true },
  { title: "Projection screen", category: "av", basis: "count", qty: 1 },
  { title: "Speakers & subwoofer", category: "av", basis: "count", qty: 7 },
  { title: "AV receiver & rack", category: "av", basis: "count", qty: 1 },
  { title: "Cable management & conduits", category: "av", basis: "manual", critical: true, spec: "Conduit runs must be laid before the false ceiling closes." },
  { title: "Star ceiling / cove lighting", category: "lighting", basis: "count", qty: 8 },
  { title: "Step & aisle lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Blackout treatment", category: "curtains", basis: "manual", critical: true },
  { title: "Air conditioning — low noise", category: "hvac", basis: "count", qty: 1, critical: true, spec: "Noise level matters more than tonnage here. Specify dB, not just capacity." },
  { title: "Fresh-air ventilation", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Dedicated power circuit & UPS", category: "electrical", basis: "count", qty: 1, critical: true },
  { title: "Automation & scene control", category: "automation", basis: "count", qty: 1 },
  { title: "Network point for streaming", category: "networking", basis: "count", qty: 1 },
  { title: "Snack counter / storage", category: "bespoke-furniture", basis: "manual" },
];

const BAR_TEMPLATE: TemplateItem[] = [
  { title: "Bar counter joinery", category: "bespoke-furniture", basis: "manual", critical: true },
  { title: "Counter-top stone", category: "stone", basis: "manual" },
  { title: "Back-bar display unit", category: "bespoke-furniture", basis: "manual" },
  { title: "Bar sink & plumbing", category: "plumbing", basis: "count", qty: 1, critical: true },
  { title: "Bar refrigerator / wine chiller", category: "appliances", basis: "count", qty: 1 },
  { title: "Ice maker", category: "appliances", basis: "count", qty: 1 },
  { title: "Glassware storage", category: "carpentry", basis: "manual" },
  { title: "Bar stools", category: "loose-furniture", basis: "count", qty: 3 },
  { title: "Backlit shelf lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Pendants over counter", category: "lighting", basis: "count", qty: 2 },
  { title: "Sockets & appliance points", category: "electrical", basis: "count", qty: 4, critical: true },
  { title: "Splashback finish", category: "wall-finish", basis: "manual" },
];

const LAUNDRY_TEMPLATE: TemplateItem[] = [
  { title: "Waterproofing", category: "waterproofing", basis: "floor-area", critical: true },
  { title: "Floor & wall tile", category: "flooring", basis: "floor-area" },
  { title: "Washing machine point — water & drain", category: "plumbing", basis: "count", qty: 1, critical: true },
  { title: "Dryer point & venting", category: "plumbing", basis: "count", qty: 1, critical: true },
  { title: "Counter & utility sink", category: "plumbing", basis: "count", qty: 1 },
  { title: "Storage & laundry baskets", category: "carpentry", basis: "manual" },
  { title: "Ironing board / folding counter", category: "carpentry", basis: "manual" },
  { title: "Drying provision", category: "carpentry", basis: "manual", critical: true, spec: "Indoor rack or terrace line — must be decided, not left to chance." },
  { title: "Exhaust & ventilation", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Lighting", category: "lighting", basis: "count", qty: 2 },
  { title: "Power points", category: "electrical", basis: "count", qty: 3 },
  ...DOOR_BASE,
];

const MAID_TEMPLATE: TemplateItem[] = [
  { title: "Flooring", category: "flooring", basis: "floor-area" },
  { title: "Skirting", category: "flooring", basis: "perimeter", unit: "rft" },
  { title: "Paint", category: "paint", basis: "wall-area" },
  { title: "Bed & mattress", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Storage / wardrobe", category: "wardrobe", basis: "manual" },
  { title: "Ceiling fan", category: "fans", basis: "count", qty: 1 },
  { title: "Air conditioning / ventilation", category: "hvac", basis: "count", qty: 1 },
  { title: "Lighting", category: "lighting", basis: "count", qty: 2 },
  { title: "Switches & sockets", category: "electrical", basis: "count", qty: 3 },
  { title: "Window & curtain", category: "curtains", basis: "manual" },
  ...DOOR_BASE,
];

const UTILITY_TEMPLATE: TemplateItem[] = [
  { title: "Flooring — anti-skid", category: "flooring", basis: "floor-area" },
  { title: "Waterproofing & drainage fall", category: "waterproofing", basis: "floor-area", critical: true },
  { title: "Utility sink & plumbing", category: "plumbing", basis: "count", qty: 1 },
  { title: "Washing machine provision", category: "plumbing", basis: "count", qty: 1 },
  { title: "Storage shelving", category: "carpentry", basis: "manual" },
  { title: "Gas cylinder bank & manifold", category: "plumbing", basis: "manual", critical: true },
  { title: "Water softener / purifier plant", category: "water", basis: "count", qty: 1, critical: true },
  { title: "Inverter / UPS location", category: "power-backup", basis: "count", qty: 1, critical: true },
  { title: "Lighting", category: "lighting", basis: "count", qty: 2 },
  { title: "Power points", category: "electrical", basis: "count", qty: 3 },
  { title: "Ventilation", category: "hvac", basis: "count", qty: 1 },
];

const WET_KITCHEN_TEMPLATE: TemplateItem[] = [
  { title: "Anti-skid flooring", category: "flooring", basis: "floor-area", critical: true },
  { title: "Full-height wall tiling", category: "flooring", basis: "wall-area" },
  { title: "Base & wall units", category: "kitchen", basis: "manual", unit: "rft" },
  { title: "Countertop — granite", category: "stone", basis: "manual" },
  { title: "Sink — deep bowl", category: "kitchen", basis: "count", qty: 1 },
  { title: "Faucet", category: "kitchen", basis: "count", qty: 1 },
  { title: "Hob for heavy cooking", category: "appliances", basis: "count", qty: 1 },
  { title: "Heavy-duty chimney", category: "appliances", basis: "count", qty: 1, critical: true },
  { title: "Exhaust & cross ventilation", category: "hvac", basis: "count", qty: 1, critical: true },
  { title: "Gas line", category: "plumbing", basis: "manual", critical: true },
  { title: "Plumbing points", category: "plumbing", basis: "count", qty: 3 },
  { title: "Electrical points", category: "electrical", basis: "count", qty: 6 },
  { title: "Lighting", category: "lighting", basis: "count", qty: 3 },
  { title: "Service door to utility", category: "doors", basis: "count", qty: 1 },
];

const FOYER_TEMPLATE: TemplateItem[] = [
  { title: "Flooring — feature stone", category: "stone", basis: "floor-area", critical: true },
  { title: "Floor inlay / pattern", category: "stone", basis: "manual" },
  { title: "Double-height wall finish", category: "wall-finish", basis: "manual", critical: true },
  { title: "Ceiling detail", category: "ceiling", basis: "floor-area" },
  { title: "Statement chandelier", category: "lighting", basis: "count", qty: 1, critical: true, spec: "Hook load, drop length and a cleaning access strategy must be fixed before ceiling closes." },
  { title: "Console table", category: "bespoke-furniture", basis: "manual" },
  { title: "Mirror", category: "accessories", basis: "count", qty: 1 },
  { title: "Shoe storage", category: "carpentry", basis: "manual" },
  { title: "Entrance door", category: "doors", basis: "count", qty: 1, critical: true },
  { title: "Video door phone", category: "security", basis: "count", qty: 1, critical: true },
  { title: "Smart lock", category: "security", basis: "count", qty: 1 },
  { title: "Accent & wall-wash lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Artwork / sculpture", category: "art", basis: "count", qty: 1 },
  { title: "Styling", category: "styling", basis: "manual" },
];

const GARDEN_TEMPLATE: TemplateItem[] = [
  { title: "Soil preparation & levelling", category: "landscape", basis: "floor-area", critical: true },
  { title: "Lawn / ground cover", category: "landscape", basis: "floor-area" },
  { title: "Planting — shrubs & hedging", category: "landscape", basis: "manual" },
  { title: "Specimen trees", category: "landscape", basis: "count", qty: 2 },
  { title: "Planters & edging", category: "landscape", basis: "manual" },
  { title: "Irrigation — drip & sprinkler", category: "landscape", basis: "manual", critical: true },
  { title: "Garden lighting", category: "lighting", basis: "count", qty: 6 },
  { title: "Garden tap / hose point", category: "plumbing", basis: "count", qty: 1 },
  { title: "Drainage", category: "landscape", basis: "manual", critical: true },
  { title: "Maintenance contract", category: "handover", basis: "manual" },
];

const TERRACE_TEMPLATE: TemplateItem[] = [
  { title: "Waterproofing", category: "waterproofing", basis: "floor-area", critical: true, spec: "Responsibility, warranty length and flood-test sign-off must all be named." },
  { title: "Slope & drainage outlets", category: "waterproofing", basis: "manual", critical: true },
  { title: "Deck / paving finish", category: "flooring", basis: "floor-area", critical: true },
  { title: "Pergola / shade structure", category: "civil", basis: "manual" },
  { title: "Parapet & railing finish", category: "staircase", basis: "manual", unit: "rft" },
  { title: "Outdoor furniture", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Outdoor lighting", category: "lighting", basis: "count", qty: 8 },
  { title: "Weatherproof sockets", category: "electrical", basis: "count", qty: 3 },
  { title: "Planters & green cover", category: "landscape", basis: "manual" },
  { title: "Irrigation for planters", category: "landscape", basis: "manual" },
  { title: "Outdoor speakers", category: "av", basis: "count", qty: 2 },
  { title: "Water outlet for cleaning", category: "plumbing", basis: "count", qty: 1 },
];

const FACADE_TEMPLATE: TemplateItem[] = [
  { title: "External render & putty", category: "facade", basis: "manual", critical: true },
  { title: "Exterior paint", category: "paint", basis: "manual", critical: true },
  { title: "Stone cladding to plinth", category: "stone", basis: "manual" },
  { title: "Timber-batten screen", category: "facade", basis: "manual" },
  { title: "Glass balustrade to balcony", category: "glass", basis: "manual" },
  { title: "Facade lighting", category: "lighting", basis: "count", qty: 8 },
  { title: "House number & name plate", category: "accessories", basis: "count", qty: 1 },
  { title: "Rainwater downpipes & concealment", category: "plumbing", basis: "manual", critical: true },
  { title: "Anti-bird / anti-pigeon measures", category: "safety", basis: "manual" },
];

const DRIVEWAY_TEMPLATE: TemplateItem[] = [
  { title: "Sub-base & paving", category: "landscape", basis: "floor-area", critical: true },
  { title: "Drainage channel", category: "landscape", basis: "manual", critical: true },
  { title: "Main gate", category: "security", basis: "count", qty: 1, critical: true },
  { title: "Gate automation", category: "automation", basis: "count", qty: 1 },
  { title: "Wicket gate", category: "security", basis: "count", qty: 1 },
  { title: "Compound wall finish", category: "facade", basis: "manual" },
  { title: "Bollard / driveway lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "EV charging point", category: "electrical", basis: "count", qty: 1, critical: true, spec: "Cable route and load must be reserved now even if the charger comes later." },
  { title: "Car wash tap & drain", category: "plumbing", basis: "count", qty: 1 },
  { title: "CCTV coverage", category: "security", basis: "count", qty: 2 },
];

const DECK_TEMPLATE: TemplateItem[] = [
  { title: "Sub-frame & levelling", category: "civil", basis: "manual" },
  { title: "Decking boards", category: "flooring", basis: "floor-area", critical: true },
  { title: "Waterproofing below deck", category: "waterproofing", basis: "floor-area", critical: true },
  { title: "Outdoor seating", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Shade / pergola", category: "civil", basis: "manual" },
  { title: "Deck lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "Weatherproof socket", category: "electrical", basis: "count", qty: 1 },
  { title: "Planting edge", category: "landscape", basis: "manual" },
];

const EXTERNAL_LIGHTING_TEMPLATE: TemplateItem[] = [
  { title: "Facade wash lighting", category: "lighting", basis: "count", qty: 6, critical: true },
  { title: "Tree uplighters", category: "lighting", basis: "count", qty: 4 },
  { title: "Bollards", category: "lighting", basis: "count", qty: 6 },
  { title: "Step & pathway lights", category: "lighting", basis: "count", qty: 8 },
  { title: "Gate & name-plate lighting", category: "lighting", basis: "count", qty: 2 },
  { title: "Weatherproof wiring & junction boxes", category: "electrical", basis: "manual", critical: true },
  { title: "Astro timer / automation", category: "automation", basis: "count", qty: 1 },
];

const PATHWAY_TEMPLATE: TemplateItem[] = [
  { title: "Stepping stones / paving", category: "landscape", basis: "floor-area" },
  { title: "Edging & gravel", category: "landscape", basis: "manual" },
  { title: "Path lighting", category: "lighting", basis: "count", qty: 6 },
  { title: "Drainage falls", category: "landscape", basis: "manual", critical: true },
];

const ENTRANCE_TEMPLATE: TemplateItem[] = [
  { title: "Entrance steps & landing stone", category: "stone", basis: "manual", critical: true },
  { title: "Main door", category: "doors", basis: "count", qty: 1, critical: true },
  { title: "Door hardware & smart lock", category: "security", basis: "count", qty: 1 },
  { title: "Video doorbell", category: "security", basis: "count", qty: 1, critical: true },
  { title: "Canopy / porch ceiling finish", category: "facade", basis: "manual" },
  { title: "Entrance lighting", category: "lighting", basis: "count", qty: 3 },
  { title: "Doormat recess", category: "civil", basis: "count", qty: 1 },
  { title: "Name plate & house number", category: "accessories", basis: "count", qty: 1 },
];

const PARKING_TEMPLATE: TemplateItem[] = [
  { title: "Floor finish — heavy duty", category: "flooring", basis: "floor-area", critical: true },
  { title: "Ceiling / soffit finish", category: "paint", basis: "floor-area" },
  { title: "Lighting", category: "lighting", basis: "count", qty: 4 },
  { title: "EV charge point", category: "electrical", basis: "count", qty: 1, critical: true },
  { title: "Wall guards & corner protection", category: "safety", basis: "manual" },
  { title: "Storage / tool cabinet", category: "carpentry", basis: "manual" },
  { title: "Water point & drainage", category: "plumbing", basis: "count", qty: 1 },
  { title: "CCTV", category: "security", basis: "count", qty: 1 },
];

const BALCONY_TEMPLATE: TemplateItem[] = [
  { title: "Waterproofing", category: "waterproofing", basis: "floor-area", critical: true },
  { title: "Floor finish — outdoor rated", category: "flooring", basis: "floor-area" },
  { title: "Ceiling / soffit finish", category: "paint", basis: "floor-area" },
  { title: "Railing / balustrade", category: "staircase", basis: "manual", unit: "rft", critical: true },
  { title: "Outdoor seating", category: "loose-furniture", basis: "count", qty: 1 },
  { title: "Outdoor lighting", category: "lighting", basis: "count", qty: 3 },
  { title: "Ceiling fan — outdoor rated", category: "fans", basis: "count", qty: 1 },
  { title: "Planters", category: "landscape", basis: "manual" },
  { title: "Weatherproof socket", category: "electrical", basis: "count", qty: 1 },
  { title: "Drainage outlet", category: "plumbing", basis: "count", qty: 1, critical: true },
  { title: "Blinds / shade", category: "curtains", basis: "manual" },
];

export const SCOPE_TEMPLATES: Record<SpaceKind, TemplateItem[]> = {
  bedroom: BEDROOM_TEMPLATE,
  "master-bedroom": [
    ...BEDROOM_TEMPLATE,
    { title: "Lounge seating nook", category: "loose-furniture", basis: "count", qty: 1 },
    { title: "Coffee / tea station", category: "bespoke-furniture", basis: "manual" },
    { title: "Two-zone lighting control", category: "automation", basis: "count", qty: 1 },
  ],
  bathroom: BATHROOM_TEMPLATE,
  powder: POWDER_TEMPLATE,
  wic: WIC_TEMPLATE,
  kitchen: KITCHEN_TEMPLATE,
  "wet-kitchen": WET_KITCHEN_TEMPLATE,
  utility: UTILITY_TEMPLATE,
  living: LIVING_TEMPLATE,
  drawing: LIVING_TEMPLATE,
  dining: DINING_TEMPLATE,
  "family-lounge": LIVING_TEMPLATE,
  foyer: FOYER_TEMPLATE,
  lobby: CIRCULATION_TEMPLATE,
  corridor: CIRCULATION_TEMPLATE,
  staircase: STAIR_TEMPLATE,
  lift: LIFT_TEMPLATE,
  puja: PUJA_TEMPLATE,
  "home-theatre": THEATRE_TEMPLATE,
  bar: BAR_TEMPLATE,
  laundry: LAUNDRY_TEMPLATE,
  "maid-room": MAID_TEMPLATE,
  balcony: BALCONY_TEMPLATE,
  terrace: TERRACE_TEMPLATE,
  garden: GARDEN_TEMPLATE,
  driveway: DRIVEWAY_TEMPLATE,
  parking: PARKING_TEMPLATE,
  deck: DECK_TEMPLATE,
  facade: FACADE_TEMPLATE,
  pathway: PATHWAY_TEMPLATE,
  "external-lighting": EXTERNAL_LIGHTING_TEMPLATE,
  entrance: ENTRANCE_TEMPLATE,
};
