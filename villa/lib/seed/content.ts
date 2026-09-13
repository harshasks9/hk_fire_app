import type {
  ScopeItem, Idea, DesignOption, Decision, Comment, Vendor, Quotation, Task, Snag,
  Note, Payment, Doc, SiteUpdate, Scenario, Person, Stage,
} from "../model/types";

/**
 * Curated project content.
 *
 * Everything here attaches to scope items that already exist, by lookup rather
 * than by hard-coded id — an idea is never a free-floating record, it is always
 * an idea *about* a specific piece of scope. That is what lets the same object
 * travel from inspiration to snag list without being retyped.
 *
 * The scenarios are typical of a premium Hyderabad villa fit-out. The money is
 * illustrative and editable; nothing here is a real quotation.
 */

export const PEOPLE: Person[] = [
  { id: "p-owner", name: "Harsha", role: "homeowner", avatarTone: "#8C6A4A" },
  { id: "p-owner2", name: "Sneha", role: "homeowner", avatarTone: "#7A6E5D" },
  { id: "p-designer", name: "Ananya Rao", role: "designer", firm: "Studio Kaash", avatarTone: "#4A6A5C" },
  { id: "p-designer2", name: "Vikram Shetty", role: "designer", firm: "Studio Kaash", avatarTone: "#5B6478" },
  { id: "p-pm", name: "Ravi Teja", role: "designer", firm: "Studio Kaash — site", avatarTone: "#7C5A4A" },
  { id: "p-light", name: "Meera Nair", role: "designer", firm: "Lumen Lighting Design", avatarTone: "#8A7B4F" },
];

export const VENDORS: Vendor[] = [
  { id: "v-stone", name: "Deccan Stone & Marble", trade: ["stone", "flooring"], city: "Hyderabad", contact: "Imran", phone: "+91 98490 xxxxx", rating: 4, notes: "Yard at Shamshabad. Slab reservation held for 21 days against 10% advance." },
  { id: "v-tiles", name: "Kajaria Studio — Banjara Hills", trade: ["flooring"], city: "Hyderabad", contact: "Sridhar", rating: 4 },
  { id: "v-carp", name: "Sri Venkateswara Interiors", trade: ["carpentry", "wardrobe", "bespoke-furniture"], city: "Hyderabad", contact: "Naresh", rating: 4, notes: "Own factory at Kukatpally. Strong on carcass work, weaker on finishing — inspect polish." },
  { id: "v-kitchen-a", name: "Hafele Design Centre", trade: ["kitchen", "hardware"], city: "Hyderabad", rating: 5, notes: "Premium. Full hardware warranty and service network." },
  { id: "v-kitchen-b", name: "Sleek Modular", trade: ["kitchen"], city: "Hyderabad", rating: 3 },
  { id: "v-kitchen-c", name: "Nolte India (via Elegant)", trade: ["kitchen"], city: "Hyderabad", rating: 5, notes: "German carcass, imported. 14-week lead including sea freight." },
  { id: "v-cp-a", name: "Jaquar World — Jubilee Hills", trade: ["sanitaryware", "plumbing"], city: "Hyderabad", rating: 4 },
  { id: "v-cp-b", name: "Grohe / Kohler via Sanitary Mart", trade: ["sanitaryware"], city: "Hyderabad", rating: 4 },
  { id: "v-light", name: "Lightology India", trade: ["lighting"], city: "Hyderabad", rating: 4 },
  { id: "v-light-b", name: "Wipro Lighting — project division", trade: ["lighting", "electrical"], city: "Hyderabad", rating: 3 },
  { id: "v-elec", name: "Sai Electricals", trade: ["electrical"], city: "Hyderabad", contact: "Mahesh", rating: 4 },
  { id: "v-plumb", name: "Krishna Plumbing Works", trade: ["plumbing", "waterproofing"], city: "Hyderabad", rating: 3 },
  { id: "v-wp", name: "Dr. Fixit Applicator — Sreenivasa", trade: ["waterproofing"], city: "Hyderabad", rating: 4, notes: "Offers a 10-year system warranty if the full specified system is used." },
  { id: "v-hvac", name: "Daikin Pro Shop", trade: ["hvac"], city: "Hyderabad", rating: 5 },
  { id: "v-auto", name: "Control4 via Smart Homes Hyd", trade: ["automation", "networking", "security"], city: "Hyderabad", rating: 4 },
  { id: "v-auto-b", name: "Schneider Wiser", trade: ["automation"], city: "Hyderabad", rating: 3, notes: "Retrofit-friendly, lower cost, smaller ecosystem." },
  { id: "v-av", name: "Sound & Vision — home cinema", trade: ["av"], city: "Hyderabad", rating: 5 },
  { id: "v-curtain", name: "The Curtain Studio", trade: ["curtains", "soft-furnishing"], city: "Hyderabad", rating: 4 },
  { id: "v-furniture", name: "Stanley Level Next", trade: ["loose-furniture"], city: "Hyderabad", rating: 4 },
  { id: "v-landscape", name: "Green Canopy Landscapes", trade: ["landscape"], city: "Hyderabad", rating: 4 },
  { id: "v-paint", name: "Asian Paints Safe Painting Service", trade: ["paint"], city: "Hyderabad", rating: 4 },
  { id: "v-lift", name: "Kone Elevators — India", trade: ["elevator"], city: "Hyderabad", rating: 5 },
  { id: "v-glass", name: "Saint-Gobain Glass Studio", trade: ["glass"], city: "Hyderabad", rating: 4 },
];

/* ------------------------------------------------------------------ lookup */

export function find(items: ScopeItem[], spaceId: string | undefined, fragment: string): ScopeItem | undefined {
  const frag = fragment.toLowerCase();
  return items.find(
    (i) => i.spaceId === spaceId && i.title.toLowerCase().includes(frag),
  );
}
export function findHouse(items: ScopeItem[], fragment: string): ScopeItem | undefined {
  return find(items, undefined, fragment);
}

/**
 * Force an item onto a stage and give it a coherent money ladder.
 *
 * A supplied ladder REPLACES the generated one rather than merging into it —
 * merging would leave the generated "paid" and "committed" figures sitting
 * behind a curated estimate, and those later, harder numbers would then win the
 * forecast.
 */
export function setStage(item: ScopeItem | undefined, stage: Stage, ladder?: Partial<ScopeItem["ladder"]>) {
  if (!item) return;
  item.stage = stage;
  if (ladder) item.ladder = { ...ladder };
  if (item.procurement) {
    const map: Record<string, string> = {
      approved: "approved", boq: "approved", quoted: "quote-requested", ordered: "ordered",
      "in-transit": "in-transit", delivered: "delivered", installed: "installed",
      inspected: "verified", complete: "verified",
    };
    if (map[stage]) item.procurement.status = map[stage] as never;
  }
}

const D = (s: string) => new Date(s).toISOString();

/* ---------------------------------------------------------------- content */

export interface Curated {
  ideas: Idea[];
  options: DesignOption[];
  decisions: Decision[];
  comments: Comment[];
  quotations: Quotation[];
  tasks: Task[];
  snags: Snag[];
  notes: Note[];
  payments: Payment[];
  docs: Doc[];
  siteUpdates: SiteUpdate[];
  scenarios: Scenario[];
}

export function buildContent(items: ScopeItem[]): Curated {
  const ideas: Idea[] = [];
  const options: DesignOption[] = [];
  const decisions: Decision[] = [];
  const comments: Comment[] = [];
  const quotations: Quotation[] = [];
  const tasks: Task[] = [];
  const snags: Snag[] = [];
  const notes: Note[] = [];
  const payments: Payment[] = [];
  const docs: Doc[] = [];
  const siteUpdates: SiteUpdate[] = [];

  const att = (id: string, label: string, swatch: string, kind: Idea["attachments"][0]["kind"] = "image") => ({
    id, kind, label, swatch, addedBy: "Ananya Rao", addedAt: D("2026-07-14"),
  });

  /* ============================ 1. MASTER BEDROOM FLOORING — the flagship decision */
  const mbFloor = find(items, "ff-master", "flooring");
  if (mbFloor) {
    setStage(mbFloor, "discussion", { initialEstimate: 285000, designerEstimate: 342000 });
    mbFloor.spec = "Master bedroom floor finish — 292 sq ft. Warm, quiet underfoot, and it must sit against the WIC and bathroom thresholds without a level change.";
    ideas.push({
      id: "idea-mb-floor-1", scopeItemId: mbFloor.id,
      title: "Wide-plank oak, matte, brushed",
      body: "Saved from a Bangalore project. The plank width is what makes it feel calm — 220 mm or wider, not the 90 mm strip most vendors push.",
      source: "Pinterest", createdBy: "Sneha", createdAt: D("2026-07-02"),
      shortlisted: true,
      reactions: { "❤️": ["Harsha", "Ananya Rao"] },
      attachments: [att("a1", "Oak plank reference", "#C6A67C"), att("a2", "Brushed matte detail", "#B08E63")],
    });
    ideas.push({
      id: "idea-mb-floor-2", scopeItemId: mbFloor.id,
      title: "Italian marble, book-matched at the bed wall",
      body: "Cooler and more formal. Works with the double-height foyer language but reads less restful in a bedroom.",
      source: "Designer", createdBy: "Ananya Rao", createdAt: D("2026-07-04"),
      attachments: [att("a3", "Statuario reference", "#E4E1DA")],
    });
    options.push(
      {
        id: "opt-mb-floor-a", scopeItemId: mbFloor.id, label: "Option A",
        headline: "Engineered oak — natural, matte",
        description: "14 mm engineered oak, 220 mm plank, brushed matte lacquer. Laid on ply over the existing screed, so the finished level matches the WIC threshold.",
        pros: ["Warm and quiet underfoot", "Forgiving of dust and scratches", "Works with the WIC joinery already approved"],
        cons: ["Needs care near the bathroom threshold", "Refinishing is a specialist job"],
        estimate: 342000, palette: ["#C6A67C", "#A57F53", "#E8DFD2"], leadTimeWeeks: 7,
        designerRecommended: false, attachments: [att("a4", "Oak — natural", "#C6A67C")],
      },
      {
        id: "opt-mb-floor-b", scopeItemId: mbFloor.id, label: "Option B",
        headline: "Engineered walnut — dark, wire-brushed",
        description: "Same construction, American walnut, wire-brushed with a UV-oil finish. Darker floor lets the bed-back panelling and the linen palette lift.",
        pros: ["Richer, more resolved against the walnut WIC", "Hides the dust Hyderabad guarantees you", "Same substrate, so no programme change"],
        cons: ["Shows lint more than oak", "About ₹1.8L more than the budget carried"],
        estimate: 522000, palette: ["#5B4331", "#3D2C1F", "#C8B9A6"], leadTimeWeeks: 9,
        designerRecommended: true, attachments: [att("a5", "Walnut — wire-brushed", "#5B4331")],
      },
      {
        id: "opt-mb-floor-c", scopeItemId: mbFloor.id, label: "Option C",
        headline: "Large-format porcelain, wood-look",
        description: "1200 x 200 porcelain plank. Visually close from standing height, indifferent to water, and the cheapest of the three.",
        pros: ["Lowest cost by a wide margin", "Nothing to maintain", "4-week lead, off the shelf"],
        cons: ["Cold and hard underfoot in a bedroom", "Reads as tile once you are barefoot", "Grout lines collect dust"],
        estimate: 196000, palette: ["#B9A184", "#9A8471", "#D8CCB8"],
        leadTimeWeeks: 4, designerRecommended: false, attachments: [att("a6", "Porcelain plank", "#B9A184")],
      },
    );
    decisions.push({
      id: "dec-mb-floor", scopeItemId: mbFloor.id,
      title: "Master bedroom flooring",
      question: "Oak, walnut or porcelain for the master bedroom floor?",
      recommendedOptionId: "opt-mb-floor-b",
      alternativeOptionIds: ["opt-mb-floor-a", "opt-mb-floor-c"],
      costDeltaVsBudget: 180000, scheduleImpactDays: 14,
      designerNote:
        "I am recommending walnut. The WIC joinery is already approved in walnut veneer, and an oak floor under a walnut wardrobe run will read as a mismatch rather than a contrast. The ₹1.8L difference buys coherence in the room you will look at every morning — but it is genuinely a preference, and Option A is not a wrong answer.",
      status: "awaiting-owner", decideBy: D("2026-09-18"),
      consequence:
        "Flooring must be ordered 9 weeks before the installation window. Deciding after 18 Sep pushes the master suite handover into the festive shutdown and delays the WIC install behind it.",
      history: [
        { at: D("2026-07-04"), by: "Ananya Rao", action: "raised", note: "Three options costed and presented." },
        { at: D("2026-08-21"), by: "Harsha", action: "changes-requested", note: "Can we see the walnut against the actual WIC veneer sample rather than a render?" },
        { at: D("2026-09-01"), by: "Ananya Rao", action: "revised", note: "Physical sample board sent to site. Walnut floor sample laid against the approved WIC veneer." },
      ],
    });
    comments.push(
      { id: "c1", targetType: "option", targetId: "opt-mb-floor-b", author: "Harsha", body: "I like this, but ₹1.8L over is a lot for a floor we cover with a rug. What does that ₹1.8L look like if we put it into the bathroom instead?", createdAt: D("2026-08-20"), reactions: { "👍": ["Sneha"] } },
      { id: "c2", targetType: "option", targetId: "opt-mb-floor-b", author: "Ananya Rao", body: "Fair. The rug covers about 40% of the floor — the perimeter is what you actually see. If you would rather spend it on the bathroom, Option A plus the marble vanity upgrade is a genuinely good trade. @Harsha I can price that as a swap if you want to see it.", createdAt: D("2026-08-21"), mentions: ["Harsha"], parentId: "c1" },
      { id: "c3", targetType: "option", targetId: "opt-mb-floor-c", author: "Sneha", body: "Not porcelain in the bedroom. We had it in the old flat and it was cold every morning from November.", createdAt: D("2026-08-20") },
      { id: "c4", targetType: "decision", targetId: "dec-mb-floor", author: "Ravi Teja", body: "Site note: screed level in the master is 12 mm below the WIC threshold. Either option works but the ply build-up needs to be confirmed with the carpenter before the WIC is fixed.", createdAt: D("2026-09-02") },
    );
  }

  /* ============================ 2. KITCHEN — three-way vendor comparison */
  const kitchenBase = find(items, "gf-kitchen", "base unit carcass");
  const kitchenShutter = find(items, "gf-kitchen", "shutters");
  const kitchenTop = find(items, "gf-kitchen", "countertop");
  if (kitchenBase) {
    setStage(kitchenBase, "quoted", { initialEstimate: 620000, designerEstimate: 742000, quoted: 812000 });
    kitchenBase.spec = "22 running feet of base units plus 14 rft wall units. Marine ply carcass, soft-close throughout, corner solution to the return.";
    setStage(kitchenShutter, "quoted", { initialEstimate: 380000, designerEstimate: 455000, quoted: 498000 });
    setStage(kitchenTop, "decided", { initialEstimate: 210000, designerEstimate: 268000 });

    quotations.push(
      {
        id: "q-kitchen-a", vendorId: "v-kitchen-a", title: "Hafele — full modular kitchen",
        scopeItemIds: [kitchenBase.id, kitchenShutter?.id, kitchenTop?.id].filter(Boolean) as string[],
        receivedAt: D("2026-08-28"), validUntil: D("2026-10-15"),
        lines: [
          { scopeItemId: kitchenBase.id, amount: 812000, spec: "BWR ply carcass, Hafele hinges & channels", brand: "Hafele", qty: 22, unit: "rft" },
          ...(kitchenShutter ? [{ scopeItemId: kitchenShutter.id, amount: 498000, spec: "Acrylic high-gloss shutters", brand: "Senosan" }] : []),
          ...(kitchenTop ? [{ scopeItemId: kitchenTop.id, amount: 268000, spec: "Quartz 20 mm, mitred edge", brand: "Caesarstone" }] : []),
        ],
        total: 1578000,
        inclusions: ["Full hardware with lifetime warranty", "Site measurement and installation", "Corner carousel and cutlery inserts", "3D design and shop drawings"],
        exclusions: ["Appliances", "Countertop cut-outs for hob and sink", "Electrical and plumbing points", "Backsplash"],
        warrantyMonths: 120, leadTimeWeeks: 8, paymentTerms: "50% advance, 40% before dispatch, 10% on installation",
        recommended: true,
        recommendationNote: "Not the cheapest, but the only one of the three quoting the full hardware warranty in writing and the only one whose service network exists in Hyderabad. On a kitchen you will open twenty times a day, the hinges are the product.",
      },
      {
        id: "q-kitchen-b", vendorId: "v-kitchen-b", title: "Sleek Modular — kitchen package",
        scopeItemIds: [kitchenBase.id, kitchenShutter?.id].filter(Boolean) as string[],
        receivedAt: D("2026-08-30"),
        lines: [
          { scopeItemId: kitchenBase.id, amount: 596000, spec: "HDF-HMR carcass, Sleek hardware", brand: "Sleek", qty: 22, unit: "rft" },
          ...(kitchenShutter ? [{ scopeItemId: kitchenShutter.id, amount: 362000, spec: "Laminate shutters, 1 mm edge band" }] : []),
        ],
        total: 958000,
        inclusions: ["Carcass and shutters", "Basic hardware", "Installation"],
        exclusions: ["Countertop", "Internal accessories", "Corner solution", "Appliances", "Backsplash", "Soft-close on drawers (quoted as an extra)"],
        warrantyMonths: 60, leadTimeWeeks: 6, paymentTerms: "70% advance, 30% on delivery",
        comparabilityFlags: [
          "Carcass is HDF-HMR, not marine ply — not like-for-like with A and C.",
          "Shutters are laminate against acrylic in A. Different finish class.",
          "Soft-close is excluded here and included in A and C.",
          "No countertop in scope, so the headline total is not comparable.",
        ],
      },
      {
        id: "q-kitchen-c", vendorId: "v-kitchen-c", title: "Nolte — imported German carcass",
        scopeItemIds: [kitchenBase.id, kitchenShutter?.id, kitchenTop?.id].filter(Boolean) as string[],
        receivedAt: D("2026-09-03"),
        lines: [
          { scopeItemId: kitchenBase.id, amount: 1145000, spec: "German engineered carcass, Blum hardware", brand: "Nolte", qty: 22, unit: "rft" },
          ...(kitchenShutter ? [{ scopeItemId: kitchenShutter.id, amount: 690000, spec: "Matt lacquer shutters" }] : []),
          ...(kitchenTop ? [{ scopeItemId: kitchenTop.id, amount: 310000, spec: "Quartz, imported" }] : []),
        ],
        total: 2145000,
        inclusions: ["Full imported carcass and hardware", "Blum lifetime hardware warranty", "All internal accessories", "Installation by trained crew"],
        exclusions: ["Appliances", "Electrical and plumbing", "Backsplash", "Customs duty variation beyond ±5%"],
        warrantyMonths: 120, leadTimeWeeks: 14, paymentTerms: "60% advance, 40% before dispatch from Germany",
        comparabilityFlags: [
          "14-week lead including sea freight — 6 weeks longer than A. This alone moves the kitchen off the critical path or onto it.",
          "Customs duty is quoted as an estimate with a ±5% band, so the final figure can move.",
        ],
      },
    );
    comments.push({
      id: "c5", targetType: "quote", targetId: "q-kitchen-b", author: "Ananya Rao",
      body: "Flagging this properly: Sleek is ₹6.2L cheaper on the headline but it is not the same kitchen. HDF-HMR carcass instead of marine ply matters in a Hyderabad kitchen with a wet kitchen next door, and there is no countertop, no accessories and no soft-close in the number. Like-for-like it lands within about ₹1.5L of Hafele.",
      createdAt: D("2026-09-04"),
    });
    decisions.push({
      id: "dec-kitchen-vendor", scopeItemId: kitchenBase.id,
      title: "Kitchen vendor award",
      question: "Hafele, Sleek or Nolte for the main kitchen?",
      alternativeOptionIds: [],
      costDeltaVsBudget: 70000, scheduleImpactDays: 0,
      designerNote: "Recommending Hafele. Nolte is the better kitchen but its 14-week lead puts it on the critical path and the duty band adds risk to a number we cannot then negotiate. Sleek is not comparable once the exclusions are priced back in.",
      status: "awaiting-owner", decideBy: D("2026-09-22"),
      consequence: "The kitchen is an 8-week build. Awarding after 22 Sep means the hob, chimney and countertop template all slip, and the wet-kitchen interface cannot be closed.",
      history: [{ at: D("2026-09-04"), by: "Ananya Rao", action: "raised", note: "Three quotes normalised and compared." }],
    });
  }

  /* ============================ 3. HOME THEATRE ACOUSTICS — the unbudgeted risk */
  const acWalls = find(items, "sf-theatre", "acoustic treatment — walls");
  const acCeil = find(items, "sf-theatre", "acoustic treatment — ceiling");
  const theatreAC = find(items, "sf-theatre", "air conditioning");
  if (acWalls) {
    setStage(acWalls, "idea", {});
    acWalls.ladder = {};
    if (acCeil) { setStage(acCeil, "not-started", {}); acCeil.ladder = {}; }
    ideas.push({
      id: "idea-theatre-1", scopeItemId: acWalls.id,
      title: "Fabric-wrapped absorber panels with a timber slat band",
      body: "Absorption where it matters, and the slat band keeps it from looking like a recording studio. The room is 20'4\" x 14'4\" so first reflection points are tight — this is not optional if the speakers are any good.",
      createdBy: "Vikram Shetty", createdAt: D("2026-09-05"),
      attachments: [att("a7", "Slat + fabric reference", "#6B5844"), att("a8", "Panel layout sketch", "#8A7C68", "sketch")],
    });
    comments.push({
      id: "c6", targetType: "item", targetId: acWalls.id, author: "Ananya Rao",
      body: "@Harsha this is the thing I want to flag before it becomes a surprise. There is no money against acoustic treatment at all right now. On a room this size it is realistically ₹3.5–5L for walls and ceiling. Either we budget it now or we accept that a ₹12L AV system will sound like a bathroom.",
      createdAt: D("2026-09-08"), mentions: ["Harsha"],
    });
  }
  if (theatreAC) {
    theatreAC.spec = "Low-noise indoor unit — specify sound pressure at low fan speed, not just tonnage. A standard hi-wall split at 42 dB will be audible in every quiet scene.";
  }

  /* ============================ 4. FOYER CHANDELIER — long lead, high visibility */
  const chandelier = find(items, "gf-foyer", "statement chandelier");
  if (chandelier) {
    setStage(chandelier, "discussion", { initialEstimate: 450000, designerEstimate: 615000 });
    if (chandelier.procurement) chandelier.procurement.leadTimeWeeks = 16;
    chandelier.spec = "Double-height foyer, 6'0\" x 8'6\" in plan with roughly 20 ft of clear height. Drop, hook load and a cleaning access strategy all have to be fixed before the ceiling closes.";
    options.push(
      {
        id: "opt-chand-a", scopeItemId: chandelier.id, label: "Option A",
        headline: "Cascading glass rods — imported",
        description: "Hand-blown glass rods on a brushed brass frame, 2.4 m drop. 16-week lead from Italy.",
        pros: ["Genuinely the arrival moment the foyer is asking for", "Reads well from both the ground floor and the first-floor void"],
        cons: ["16-week lead — the longest item in the project", "Cleaning needs a tower or a winch", "Breakage risk in transit"],
        estimate: 615000, palette: ["#D9CFC0", "#B08D57"], leadTimeWeeks: 16, designerRecommended: true, attachments: [att("a9", "Glass cascade", "#D9CFC0")],
      },
      {
        id: "opt-chand-b", scopeItemId: chandelier.id, label: "Option B",
        headline: "Linear brass ring cluster — made in India",
        description: "Three staggered rings, antique brass, integrated LED. Fabricated in Jaipur to our drawing.",
        pros: ["7-week lead", "Half the cost", "Relampable from a ladder", "Can be made to our exact drop"],
        cons: ["Less of a statement", "Finish quality depends on the fabricator's polish"],
        estimate: 285000, palette: ["#B08D57", "#3D3A34"], leadTimeWeeks: 7, attachments: [att("a10", "Brass rings", "#B08D57")],
      },
    );
    decisions.push({
      id: "dec-chandelier", scopeItemId: chandelier.id,
      title: "Foyer chandelier",
      question: "Imported glass cascade or the India-made brass cluster?",
      recommendedOptionId: "opt-chand-a", alternativeOptionIds: ["opt-chand-b"],
      costDeltaVsBudget: 165000, scheduleImpactDays: 21,
      designerNote: "The foyer is the one space every visitor sees and nobody lives in — it is the right place to spend. But a 16-week lead means ordering this week, and I would rather you chose B knowingly than chose A late.",
      status: "awaiting-owner", decideBy: D("2026-09-16"),
      consequence: "16-week lead. The ceiling hook and its load must be cast before the foyer ceiling closes on 2 Oct — after that the fixing becomes a surface-mounted compromise.",
      history: [{ at: D("2026-08-30"), by: "Ananya Rao", action: "raised" }],
    });
  }

  /* ============================ 5. TERRACE WATERPROOFING — unowned responsibility */
  const terraceWp = find(items, "sf-terrace", "waterproofing");
  if (terraceWp) {
    setStage(terraceWp, "estimated", { initialEstimate: 195000, designerEstimate: 268000 });
    terraceWp.owner = undefined; // deliberately unassigned — the completeness engine will catch it
    terraceWp.spec = "774 sq ft open terrace. The largest single waterproofing risk in the villa: it sits directly over the second-floor bedroom and lobby.";
    comments.push({
      id: "c7", targetType: "item", targetId: terraceWp.id, author: "Ravi Teja",
      body: "Nobody has taken this. The builder says their warranty ended at handover, our civil contractor says it is outside his scope and the deck vendor says he only lays on a warranted membrane. This needs an owner before the deck is ordered.",
      createdAt: D("2026-09-09"),
    });
    quotations.push({
      id: "q-wp", vendorId: "v-wp", title: "Terrace waterproofing — 10-year system warranty",
      scopeItemIds: [terraceWp.id], receivedAt: D("2026-09-06"),
      lines: [{ scopeItemId: terraceWp.id, amount: 268000, spec: "Two-coat polyurethane membrane, 300 mm upstand, fillets, 10-year warranty" }],
      total: 268000,
      inclusions: ["Surface preparation", "Membrane system", "Flood test with written sign-off", "10-year system warranty"],
      exclusions: ["Deck finish", "Structural repair if the slab is found cracked", "Drainage outlet replacement"],
      warrantyMonths: 120, leadTimeWeeks: 2, paymentTerms: "40% advance, 60% after flood test",
      recommended: true,
      recommendationNote: "The warranty is only valid if the full specified system is used — no substitutions to save ₹20k. Take this one.",
    });
  }

  /* ============================ 6. MASTER BATHROOM — approved and executing */
  const mbBathWp = find(items, "ff-master-bath", "waterproofing");
  const mbBathFloor = find(items, "ff-master-bath", "floor tile");
  const mbDiverter = find(items, "ff-master-bath", "diverter");
  const mbVanity = find(items, "ff-master-bath", "vanity unit");
  setStage(mbBathWp, "complete", { initialEstimate: 42000, designerEstimate: 46000, approved: 46000, committed: 46000, paid: 46000 });
  setStage(mbBathFloor, "installed", { initialEstimate: 88000, designerEstimate: 96000, approved: 94000, committed: 94000, paid: 66000 });
  setStage(mbDiverter, "ordered", { initialEstimate: 34000, designerEstimate: 42000, approved: 40000, committed: 40000, paid: 20000 });
  setStage(mbVanity, "approved", { initialEstimate: 120000, designerEstimate: 158000, approved: 152000 });
  if (mbVanity) mbVanity.vendorId = "v-carp";

  /* ============================ 7. GROUND FLOOR LIVING — mostly done, one snag */
  const livingFloor = find(items, "gf-living", "flooring");
  const livingSofa = find(items, "gf-living", "sofa");
  setStage(livingFloor, "inspected", { initialEstimate: 420000, designerEstimate: 468000, approved: 455000, committed: 455000, paid: 455000 });
  setStage(livingSofa, "in-transit", { initialEstimate: 280000, designerEstimate: 340000, approved: 328000, committed: 328000, paid: 164000 });
  if (livingSofa) {
    livingSofa.vendorId = "v-furniture";
    livingSofa.procurement = {
      ...livingSofa.procurement, scopeItemId: livingSofa.id, status: "in-transit",
      product: "Sectional, 3+2 with chaise", brand: "Stanley Level Next", sku: "SLN-MRD-3C2",
      vendorId: "v-furniture", qty: 1, orderAmount: 328000, advance: 164000, balance: 164000,
      orderedOn: D("2026-07-20"), expectedDelivery: D("2026-09-19"), leadTimeWeeks: 9,
      storageLocation: "Direct to site — living room", installationDate: D("2026-09-20"),
      warrantyMonths: 60, owner: "Ravi Teja", swatch: "#9C8672",
    };
  }

  /* ============================ 8. WARDROBE FINISH — a scenario-driving choice */
  const bed4Wardrobe = find(items, "ff-bed4", "wardrobe — carcass");
  if (bed4Wardrobe) {
    setStage(bed4Wardrobe, "estimated", { initialEstimate: 385000, designerEstimate: 412000 });
    options.push(
      {
        id: "opt-wr-a", scopeItemId: bed4Wardrobe.id, label: "Option A", headline: "Laminate shutters",
        description: "1 mm high-pressure laminate on BWP ply, 2 mm edge band, soft-close.",
        pros: ["Most durable surface of the three", "Widest colour range", "Cheapest"],
        cons: ["Edge band is always visible on close inspection", "Reads as a builder finish next to the veneer in the master"],
        estimate: 412000, palette: ["#D6CCBC", "#8E8071"], leadTimeWeeks: 8,
      },
      {
        id: "opt-wr-b", scopeItemId: bed4Wardrobe.id, label: "Option B", headline: "Natural veneer, PU matt polish",
        description: "Recon walnut veneer on BWP ply, three-coat PU matt. Matches the master WIC.",
        pros: ["Continuous with the master suite language", "Grain runs across the shutter set if laid out properly", "Repairable — it can be re-polished"],
        cons: ["₹1.1L more", "Polish quality is entirely dependent on the workshop", "10-week lead"],
        estimate: 524000, palette: ["#5B4331", "#7A5C42"], leadTimeWeeks: 10, designerRecommended: true,
      },
      {
        id: "opt-wr-c", scopeItemId: bed4Wardrobe.id, label: "Option C", headline: "Acrylic high gloss",
        description: "Imported acrylic sheet, seamless edge, mirror finish.",
        pros: ["Makes the room feel larger", "Genuinely seamless edge"],
        cons: ["Every fingerprint shows", "Scratches cannot be repaired, only replaced", "Wrong register for this bedroom"],
        estimate: 568000, palette: ["#EFECE6", "#CFC7BA"], leadTimeWeeks: 9,
      },
    );
  }

  /* ============================ 9. AUTOMATION — a system-level choice */
  const autoHouse = findHouse(items, "Home automation system");
  if (autoHouse) {
    setStage(autoHouse, "discussion", { initialEstimate: 850000, designerEstimate: 1180000 });
    autoHouse.owner = "Vikram Shetty";
    options.push(
      {
        id: "opt-auto-a", scopeItemId: autoHouse.id, label: "Option A", headline: "Control4 — full system",
        description: "Wired backbone, lighting, curtains, AV, HVAC and access under one interface across all three floors.",
        pros: ["One app for everything, genuinely", "Dealer-supported in Hyderabad", "Scales to the theatre and the terrace"],
        cons: ["₹11.8L", "Wired backbone must go in before ceilings close", "Dealer lock-in for programming changes"],
        estimate: 1180000, palette: ["#3A4A52", "#7E8C93"], leadTimeWeeks: 8, designerRecommended: true,
      },
      {
        id: "opt-auto-b", scopeItemId: autoHouse.id, label: "Option B", headline: "Schneider Wiser — retrofit",
        description: "Wireless retrofit modules behind the existing switch plates, lighting and curtains only.",
        pros: ["Half the cost", "No wiring dependency, can be added after handover", "Owner can reprogram it"],
        cons: ["Lighting and curtains only — no HVAC, AV or access", "Wireless across three concrete slabs is unreliable", "Second app for everything else"],
        estimate: 545000, palette: ["#4E5A45", "#96A18C"], leadTimeWeeks: 3,
      },
    );
    decisions.push({
      id: "dec-automation", scopeItemId: autoHouse.id,
      title: "Home automation system",
      question: "Full wired Control4, or a wireless retrofit limited to lights and curtains?",
      recommendedOptionId: "opt-auto-a", alternativeOptionIds: ["opt-auto-b"],
      costDeltaVsBudget: 330000, scheduleImpactDays: 0,
      designerNote: "This is the one decision that cannot be deferred, because Option A needs cable in the ceiling and Option B does not. If you are undecided, the cheap insurance is to pull the Control4 cabling now (about ₹90k) and decide the head-end later.",
      status: "awaiting-owner", decideBy: D("2026-09-20"),
      consequence: "First-floor ceilings close from 25 Sep. After that, the wired option means opening them again.",
      history: [
        { at: D("2026-08-12"), by: "Vikram Shetty", action: "raised" },
        { at: D("2026-09-02"), by: "Harsha", action: "held", note: "Want to see what the theatre needs before committing to the whole house." },
      ],
    });
  }

  /* ============================ 10. SANITARYWARE — Indian vs imported */
  const cpHouse = findHouse(items, "sanitaryware & CP package");
  if (cpHouse) {
    setStage(cpHouse, "estimated", { initialEstimate: 980000, designerEstimate: 1120000 });
    options.push(
      {
        id: "opt-cp-a", scopeItemId: cpHouse.id, label: "Option A", headline: "Jaquar — Indian, premium range",
        description: "Full house set across 8 bathrooms from the Jaquar Artize range.",
        pros: ["Spares available in Hyderabad the same day", "Service network is real", "₹11.2L for the house"],
        cons: ["Finish tolerances vary between batches", "Less refined feel than imported"],
        estimate: 1120000, palette: ["#B9BCBE", "#8F9295"], leadTimeWeeks: 5, designerRecommended: true,
      },
      {
        id: "opt-cp-b", scopeItemId: cpHouse.id, label: "Option B", headline: "Grohe / Kohler — imported",
        description: "Grohe CP with Kohler ceramics throughout.",
        pros: ["Noticeably better in the hand", "Consistent finish", "Longer cartridge life"],
        cons: ["₹18.4L — ₹7.2L more", "Concealed body spares take 3–4 weeks", "Overkill in the maid and powder rooms"],
        estimate: 1840000, palette: ["#D7D9DA", "#6E7477"], leadTimeWeeks: 9,
      },
      {
        id: "opt-cp-c", scopeItemId: cpHouse.id, label: "Option C", headline: "Split — imported in the three main suites",
        description: "Grohe/Kohler in the master, bedroom 5 and the powder room; Jaquar elsewhere.",
        pros: ["Spends the money where it is felt every day", "₹13.9L", "Keeps spares simple in the secondary bathrooms"],
        cons: ["Two vendors to coordinate", "Mixed concealed bodies mean two sets of spares"],
        estimate: 1390000, palette: ["#D7D9DA", "#B9BCBE", "#8F9295"], leadTimeWeeks: 9,
      },
    );
  }

  /* ============================ 11. Long-lead items with real procurement */
  const liftInterior = findHouse(items, "Elevator interior");
  if (liftInterior) {
    setStage(liftInterior, "ordered", { initialEstimate: 340000, designerEstimate: 395000, approved: 380000, committed: 380000, paid: 152000 });
    liftInterior.vendorId = "v-lift";
    liftInterior.procurement = {
      scopeItemId: liftInterior.id, status: "ordered", product: "Car interior — brushed SS with walnut veneer back panel",
      brand: "Kone", vendorId: "v-lift", qty: 1, orderAmount: 380000, advance: 152000, balance: 228000,
      orderedOn: D("2026-08-05"), expectedDelivery: D("2026-11-12"), leadTimeWeeks: 14,
      installationDate: D("2026-11-20"), warrantyMonths: 24, owner: "Ravi Teja", swatch: "#8A7A66",
    };
  }
  const theatreSeating = find(items, "sf-theatre", "recliner seating");
  if (theatreSeating) {
    setStage(theatreSeating, "estimated", { initialEstimate: 480000, designerEstimate: 620000 });
    if (theatreSeating.procurement) theatreSeating.procurement.leadTimeWeeks = 12;
  }
  const stoneHouse = findHouse(items, "Stone & marble");
  if (stoneHouse) {
    setStage(stoneHouse, "approved", { initialEstimate: 1450000, designerEstimate: 1720000, quoted: 1780000, approved: 1690000 });
    stoneHouse.vendorId = "v-stone";
    stoneHouse.owner = "Ananya Rao";
  }

  /* ============================ 12. TASKS — a real dependency chain */
  const T = (
    id: string, title: string, owner: string, start: string, finish: string,
    dependsOn: string[] = [], extra: Partial<Task> = {},
  ): Task => ({ id, title, owner, start: D(start), finish: D(finish), dependsOn, status: "todo", ...extra });

  tasks.push(
    T("t-design-freeze", "Design freeze — ground floor", "Ananya Rao", "2026-06-01", "2026-06-28", [], { status: "done", milestone: true }),
    T("t-boq-gf", "Ground floor BOQ issued", "Vikram Shetty", "2026-06-29", "2026-07-10", ["t-design-freeze"], { status: "done" }),
    T("t-quote-gf", "Ground floor quotations received", "Ananya Rao", "2026-07-11", "2026-07-28", ["t-boq-gf"], { status: "done" }),
    T("t-wp-gf", "Waterproofing — ground floor wet areas", "Ravi Teja", "2026-07-15", "2026-07-26", ["t-quote-gf"], { status: "done", vendorId: "v-wp" }),
    T("t-floor-gf", "Flooring — ground floor", "Ravi Teja", "2026-07-28", "2026-08-20", ["t-wp-gf"], { status: "done", vendorId: "v-stone", spaceId: "gf-living" }),
    T("t-ceiling-gf", "False ceiling — ground floor", "Ravi Teja", "2026-08-10", "2026-09-05", ["t-floor-gf"], { status: "done" }),
    T("t-elec-gf", "Electrical first fix — ground floor", "Mahesh", "2026-08-05", "2026-08-28", ["t-ceiling-gf"], { status: "done", vendorId: "v-elec" }),
    T("t-paint-gf", "Painting — ground floor", "Ravi Teja", "2026-09-06", "2026-09-24", ["t-ceiling-gf", "t-elec-gf"], { status: "in-progress", vendorId: "v-paint", spaceId: "gf-foyer" }),
    T("t-light-gf", "Lighting install — ground floor", "Mahesh", "2026-09-25", "2026-10-06", ["t-paint-gf"], { vendorId: "v-light" }),

    T("t-design-freeze-ff", "Design freeze — first floor", "Ananya Rao", "2026-07-15", "2026-08-25", [], { status: "done", milestone: true }),
    T("t-wp-ff", "Waterproofing — first floor bathrooms", "Ravi Teja", "2026-08-20", "2026-08-30", ["t-design-freeze-ff"], { status: "done", vendorId: "v-wp" }),
    T("t-tile-ff", "Bathroom tiling — first floor", "Ravi Teja", "2026-09-01", "2026-09-22", ["t-wp-ff"], { status: "in-progress", vendorId: "v-tiles", spaceId: "ff-master-bath" }),
    T("t-ceiling-ff", "False ceiling — first floor", "Ravi Teja", "2026-09-25", "2026-10-18", ["t-tile-ff"], { milestone: true, notes: "Hard gate: anything concealed above the ceiling must be fixed before this starts." }),
    T("t-mb-floor-order", "Master bedroom flooring — place order", "Ananya Rao", "2026-09-19", "2026-09-21", [], { notes: "Blocked on the flooring decision.", status: "blocked", spaceId: "ff-master" }),
    T("t-mb-floor-install", "Master bedroom flooring — install", "Ravi Teja", "2026-11-10", "2026-11-22", ["t-mb-floor-order", "t-ceiling-ff"], { spaceId: "ff-master" }),
    T("t-wic-shop", "Master WIC shop drawings approved", "Naresh", "2026-08-28", "2026-09-09", [], { status: "in-progress", vendorId: "v-carp", spaceId: "ff-master-wic", notes: "Third revision still not signed. Manufacturing cannot start and the slot is held until Friday." }),
    T("t-wic-mfg", "Master WIC manufacturing", "Naresh", "2026-09-19", "2026-11-05", ["t-wic-shop"], { vendorId: "v-carp", spaceId: "ff-master-wic" }),
    T("t-wic-install", "Master WIC installation", "Naresh", "2026-11-24", "2026-12-04", ["t-wic-mfg", "t-mb-floor-install"], { vendorId: "v-carp", spaceId: "ff-master-wic" }),

    T("t-kitchen-award", "Kitchen vendor award", "Harsha", "2026-09-15", "2026-09-22", [], { status: "blocked", milestone: true, notes: "Blocked on the vendor decision." }),
    T("t-kitchen-mfg", "Kitchen manufacturing", "Hafele", "2026-09-23", "2026-11-18", ["t-kitchen-award"], { vendorId: "v-kitchen-a" }),
    T("t-kitchen-install", "Kitchen installation", "Hafele", "2026-11-20", "2026-12-02", ["t-kitchen-mfg"], { vendorId: "v-kitchen-a", spaceId: "gf-kitchen" }),
    T("t-counter-template", "Countertop template & cut", "Imran", "2026-11-21", "2026-11-28", ["t-kitchen-install"], { vendorId: "v-stone" }),
    T("t-appliance-install", "Appliance installation", "Ravi Teja", "2026-12-03", "2026-12-08", ["t-kitchen-install", "t-counter-template"]),

    T("t-auto-cable", "Automation backbone cabling", "Smart Homes", "2026-09-21", "2026-09-24", [], { status: "blocked", vendorId: "v-auto", notes: "Must happen before first-floor ceilings close on 25 Sep." }),
    T("t-theatre-design", "Home theatre — acoustic design", "Vikram Shetty", "2026-09-15", "2026-10-05", []),
    T("t-theatre-build", "Home theatre — build & treatment", "Ravi Teja", "2026-10-20", "2026-12-10", ["t-theatre-design"], { spaceId: "sf-theatre" }),
    T("t-terrace-wp", "Terrace waterproofing", "Unassigned", "2026-10-01", "2026-10-14", [], { status: "blocked", spaceId: "sf-terrace", notes: "No owner. Deck cannot be ordered until this is resolved." }),
    T("t-terrace-deck", "Terrace decking", "Ravi Teja", "2026-10-20", "2026-11-10", ["t-terrace-wp"], { spaceId: "sf-terrace" }),
    T("t-landscape", "Landscaping & irrigation", "Green Canopy", "2026-12-01", "2027-01-10", [], { vendorId: "v-landscape" }),
    T("t-clean", "Deep clean", "Ravi Teja", "2027-01-20", "2027-01-27", ["t-landscape"]),
    T("t-snag", "Snagging walkthrough", "Harsha", "2027-01-28", "2027-02-04", ["t-clean"], { milestone: true }),
    T("t-handover", "Handover", "Ananya Rao", "2027-02-10", "2027-02-14", ["t-snag"], { milestone: true }),
  );

  /* ============================ 13. SNAGS */
  snags.push(
    {
      id: "s1", spaceId: "gf-living", title: "Skirting gap at the east wall",
      description: "3–4 mm gap between the skirting and the wall over about 1.2 m, worst near the deck door. Visible from the dining side.",
      category: "flooring", severity: "medium", vendorId: "v-stone", raisedBy: "Harsha",
      raisedAt: D("2026-09-06"), dueBy: D("2026-09-20"), status: "assigned", photoSwatch: "#B3A392",
      pins: [{ x: 0.34, y: 0.72, label: "Gap widest here" }],
    },
    {
      id: "s2", spaceId: "ff-master-bath", title: "Tile lippage at the shower threshold",
      description: "Two adjacent tiles are out by about 2 mm at the shower entry. It will catch a bare foot and hold water.",
      category: "flooring", severity: "high", vendorId: "v-tiles", raisedBy: "Ravi Teja",
      raisedAt: D("2026-09-10"), dueBy: D("2026-09-17"), status: "fixed", photoSwatch: "#C9C2B6",
      pins: [{ x: 0.5, y: 0.61, label: "Lippage" }], rectificationSwatch: "#CFC9BE",
    },
    {
      id: "s3", spaceId: "gf-kitchen", title: "Chimney duct route fouls the beam",
      description: "The duct as set out runs straight into the downstand beam. Either the duct drops below the ceiling line or the hob moves 300 mm.",
      category: "appliances", severity: "critical", raisedBy: "Ravi Teja",
      raisedAt: D("2026-09-11"), dueBy: D("2026-09-16"), status: "open", photoSwatch: "#9A9287",
      pins: [{ x: 0.62, y: 0.3, label: "Beam" }, { x: 0.44, y: 0.35, label: "Duct as set out" }],
    },
    {
      id: "s4", spaceId: "gf-foyer", title: "Paint shade differs between coats",
      description: "The second coat on the double-height wall is visibly lighter above about 10 ft. Likely a different batch.",
      category: "paint", severity: "medium", vendorId: "v-paint", raisedBy: "Sneha",
      raisedAt: D("2026-09-12"), dueBy: D("2026-09-22"), status: "open", photoSwatch: "#E3DCD0",
    },
    {
      id: "s5", spaceId: "ff-bed4", title: "Socket height inconsistent with the bed layout",
      description: "Bedside sockets are at 300 mm but the approved bed has a 420 mm base — they will be hidden behind it.",
      category: "electrical", severity: "medium", vendorId: "v-elec", raisedBy: "Ananya Rao",
      raisedAt: D("2026-09-08"), dueBy: D("2026-09-19"), status: "verify", photoSwatch: "#BFB6A8",
      rectificationSwatch: "#C4BCAE",
    },
    {
      id: "s6", spaceId: "gf-living", title: "AC drain fall is flat",
      description: "Drain line from the living room indoor unit has no measurable fall over 4 m. It will back up in the first heavy use.",
      category: "hvac", severity: "critical", vendorId: "v-hvac", raisedBy: "Ravi Teja",
      raisedAt: D("2026-08-29"), dueBy: D("2026-09-05"), status: "closed", photoSwatch: "#A8A196",
      rectificationSwatch: "#ADA69B", verifiedBy: "Ravi Teja", closedAt: D("2026-09-04"),
    },
    {
      id: "s7", spaceId: "gf-bedroom-bath", title: "Waterproofing upstand short at the door",
      description: "Membrane stops at about 120 mm at the door jamb against the 300 mm specified.",
      category: "waterproofing", severity: "high", vendorId: "v-wp", raisedBy: "Ravi Teja",
      raisedAt: D("2026-09-03"), dueBy: D("2026-09-10"), status: "closed", photoSwatch: "#9FA69B",
      rectificationSwatch: "#A4AB9F", verifiedBy: "Ananya Rao", closedAt: D("2026-09-09"),
    },
  );

  /* ============================ 14. NOTES — the project's memory */
  notes.push(
    {
      id: "n1", title: "Site visit — 8 September",
      kind: "site-visit", at: D("2026-09-08"), author: "Harsha",
      body: "Walked the ground floor with Ananya and Ravi. Paint on the foyer double-height wall looks patchy above the first-floor level — flagged it. Living room floor looks good, the skirting gap on the east wall needs doing before furniture arrives. Ananya raised the theatre acoustics not being in the budget at all, which I had not registered. Asked her to price it properly before we go further on the AV system.\n\nAlso: the lift car is 5'6\" x 5'0\". Ravi thinks the theatre recliners will not fit and we may need them craned to the terrace and brought in through the sliding doors. Needs checking before we order.",
      spaceIds: ["gf-foyer", "gf-living", "sf-theatre"],
      scopeItemIds: [acWalls?.id, theatreSeating?.id].filter(Boolean) as string[],
      vendorIds: ["v-paint"], decisionIds: [], taskIds: [],
      spawned: [
        { kind: "snag", id: "s4", label: "Paint shade differs between coats" },
        { kind: "task", id: "t-theatre-design", label: "Home theatre — acoustic design" },
        { kind: "follow-up", id: "f1", label: "Check recliner dimensions against lift car and stair turn" },
      ],
    },
    {
      id: "n2", title: "Kitchen vendor meeting — Hafele",
      kind: "vendor-meeting", at: D("2026-08-28"), author: "Ananya Rao",
      body: "Two hours at the Hafele centre. Key points: they will hold the quoted price for 45 days; the 8-week build starts from the signed shop drawing, not from the award; and they need the final appliance models before drawing because the tall unit and the chimney housing are cut to the appliance.\n\nThey also flagged that the wet-kitchen service door as drawn opens into the working triangle. Worth revisiting.",
      spaceIds: ["gf-kitchen", "gf-wet-kitchen"],
      scopeItemIds: [kitchenBase?.id].filter(Boolean) as string[],
      vendorIds: ["v-kitchen-a"], decisionIds: ["dec-kitchen-vendor"], taskIds: ["t-kitchen-award"],
      spawned: [{ kind: "decision", id: "dec-kitchen-vendor", label: "Kitchen vendor award" }],
    },
    {
      id: "n3", title: "Measurements — master suite",
      kind: "measurement", at: D("2026-09-02"), author: "Ravi Teja",
      body: "Measured on site against the plan.\n\n• Master bedroom: plan says 20'4\" x 14'4\". Site measures 20'3\" x 14'3½\" — within tolerance.\n• Screed level in the bedroom is 12 mm below the WIC threshold. The flooring build-up must account for this.\n• Window opening is 60 mm wider than drawn, which affects the curtain track length.\n• Ceiling height 10'2\" clear before the false ceiling.",
      spaceIds: ["ff-master", "ff-master-wic"],
      scopeItemIds: [mbFloor?.id].filter(Boolean) as string[],
      vendorIds: [], decisionIds: ["dec-mb-floor"], taskIds: [],
    },
    {
      id: "n4", title: "Call with Meera — lighting",
      kind: "call", at: D("2026-08-30"), author: "Ananya Rao",
      body: "Meera wants the lighting layout frozen before the first-floor ceiling starts. Her point: every dimmable circuit needs a driver specified with the fixture, and retrofitting dimming later means replacing drivers at about ₹1,800 each across roughly 120 fixtures.\n\nShe also strongly prefers we settle the automation question first, because the protocol determines the driver type.",
      spaceIds: [], scopeItemIds: [autoHouse?.id].filter(Boolean) as string[],
      vendorIds: ["v-light"], decisionIds: ["dec-automation"], taskIds: ["t-auto-cable"],
      spawned: [{ kind: "follow-up", id: "f2", label: "Freeze lighting layout before first-floor ceiling" }],
    },
    {
      id: "n5", title: "Terrace waterproofing — who owns it?",
      kind: "observation", at: D("2026-09-09"), author: "Ravi Teja",
      body: "Three-way gap. The builder's warranty ended at handover. Our civil contractor says the terrace is outside his scope as written. The deck vendor will not lay on an unwarranted membrane.\n\nSreenivasa (Dr. Fixit applicator) will do it with a 10-year system warranty for ₹2.68L, conditional on using the full specified system. Recommend we simply take it and stop trying to allocate it to someone else.",
      spaceIds: ["sf-terrace"], scopeItemIds: [terraceWp?.id].filter(Boolean) as string[],
      vendorIds: ["v-wp"], decisionIds: [], taskIds: ["t-terrace-wp"],
      spawned: [{ kind: "task", id: "t-terrace-wp", label: "Terrace waterproofing" }],
    },
    {
      id: "n6", title: "Design review — first floor",
      kind: "meeting", at: D("2026-08-25"), author: "Ananya Rao",
      body: "Present: Harsha, Sneha, Ananya, Vikram.\n\nAgreed: master suite palette locked to warm neutrals with walnut joinery. Bedroom 4 to be the quieter of the two secondary bedrooms. Puja room to be marble with a jaali screen rather than fully enclosed.\n\nOpen: master flooring (oak vs walnut), wardrobe finish in bedroom 4, and whether the family lounge gets a full TV wall or stays as seating only.\n\nHarsha asked for a running view of where we are against the ₹2.4 Cr number. That is now on the dashboard.",
      spaceIds: ["ff-master", "ff-bed4", "ff-puja", "ff-family"],
      scopeItemIds: [mbFloor?.id, bed4Wardrobe?.id].filter(Boolean) as string[],
      vendorIds: [], decisionIds: ["dec-mb-floor"], taskIds: [],
    },
  );

  /* ============================ 15. PAYMENTS */
  payments.push(
    { id: "pay1", vendorId: "v-stone", scopeItemIds: [stoneHouse?.id].filter(Boolean) as string[], label: "Marble — slab reservation balance", amount: 420000, dueOn: D("2026-09-18"), kind: "milestone" },
    { id: "pay2", vendorId: "v-furniture", scopeItemIds: [livingSofa?.id].filter(Boolean) as string[], label: "Living room sofa — balance on delivery", amount: 164000, dueOn: D("2026-09-19"), kind: "balance" },
    { id: "pay3", vendorId: "v-lift", scopeItemIds: [liftInterior?.id].filter(Boolean) as string[], label: "Lift interior — dispatch payment", amount: 152000, dueOn: D("2026-10-25"), kind: "milestone" },
    { id: "pay4", vendorId: "v-paint", scopeItemIds: [], label: "Painting — ground floor completion", amount: 185000, dueOn: D("2026-09-26"), kind: "milestone" },
    { id: "pay5", vendorId: "v-wp", scopeItemIds: [terraceWp?.id].filter(Boolean) as string[], label: "Terrace waterproofing — advance", amount: 107200, dueOn: D("2026-09-30"), kind: "advance" },
    { id: "pay6", vendorId: "v-carp", scopeItemIds: [], label: "Carpentry — WIC manufacturing advance", amount: 310000, dueOn: D("2026-09-24"), kind: "advance" },
    { id: "pay7", vendorId: "v-tiles", scopeItemIds: [], label: "Bathroom tiling — first floor", amount: 96000, dueOn: D("2026-09-08"), paidOn: D("2026-09-08"), kind: "milestone" },
    { id: "pay8", vendorId: "v-elec", scopeItemIds: [], label: "Electrical first fix — ground floor", amount: 240000, dueOn: D("2026-08-30"), paidOn: D("2026-09-01"), kind: "milestone" },
    { id: "pay9", vendorId: "v-hvac", scopeItemIds: [], label: "HVAC — advance on 9 units", amount: 280000, dueOn: D("2026-10-10"), kind: "advance" },
  );

  /* ============================ 16. SITE UPDATES */
  siteUpdates.push(
    { id: "su1", spaceId: "gf-living", at: D("2026-09-11"), by: "Ravi Teja", body: "Second coat of paint finished on the north and east walls. Skirting gap still open — Deccan coming Monday.", progressPct: 78, photoSwatch: "#CFC4B3" },
    { id: "su2", spaceId: "ff-master-bath", at: D("2026-09-10"), by: "Ravi Teja", body: "Wall tiling complete to three walls. Lippage at the shower threshold rectified and ready for check.", progressPct: 62, photoSwatch: "#C9C2B6" },
    { id: "su3", spaceId: "gf-kitchen", at: D("2026-09-11"), by: "Ravi Teja", body: "Chimney duct clash with the downstand beam confirmed on site. Held further work until the hob position is settled.", progressPct: 24, photoSwatch: "#A39A8D" },
    { id: "su4", spaceId: "gf-foyer", at: D("2026-09-12"), by: "Sneha", body: "Batch difference visible on the double-height wall above about 10 ft. Photographed in daylight.", progressPct: 55, photoSwatch: "#E3DCD0" },
    { id: "su5", spaceId: "sf-terrace", at: D("2026-09-09"), by: "Ravi Teja", body: "Ponding in two places after Sunday's rain. Both are away from the outlets — the falls are wrong, not just the membrane.", progressPct: 8, photoSwatch: "#8E948C" },
    { id: "su6", spaceId: "ff-bed4", at: D("2026-09-08"), by: "Ravi Teja", body: "First fix complete. Socket heights being reworked to suit the approved bed.", progressPct: 41, photoSwatch: "#BFB6A8" },
  );

  /* ============================ 17. DOCUMENTS */
  docs.push(
    { id: "d1", title: "Ground floor plan — architect", kind: "floor-plan", spaceIds: [], scopeItemIds: [], revision: "R3", addedAt: D("2026-05-20"), addedBy: "Ananya Rao" },
    { id: "d2", title: "First floor plan — architect", kind: "floor-plan", spaceIds: [], scopeItemIds: [], revision: "R3", addedAt: D("2026-05-20"), addedBy: "Ananya Rao" },
    { id: "d3", title: "Second floor plan — architect", kind: "floor-plan", spaceIds: [], scopeItemIds: [], revision: "R3", addedAt: D("2026-05-20"), addedBy: "Ananya Rao" },
    { id: "d4", title: "Front elevation render", kind: "render", spaceIds: ["out-facade"], scopeItemIds: [], addedAt: D("2026-05-22"), addedBy: "Ananya Rao" },
    { id: "d5", title: "Ground floor electrical layout", kind: "electrical", spaceIds: ["gf-living", "gf-kitchen", "gf-dining"], scopeItemIds: [], revision: "R2", addedAt: D("2026-07-08"), addedBy: "Vikram Shetty" },
    { id: "d6", title: "Lighting layout — ground floor", kind: "lighting", spaceIds: ["gf-living", "gf-foyer"], scopeItemIds: [], revision: "R2", addedAt: D("2026-07-30"), addedBy: "Meera Nair" },
    { id: "d7", title: "False ceiling layout — first floor", kind: "ceiling", spaceIds: ["ff-master", "ff-family"], scopeItemIds: [], revision: "R1", addedAt: D("2026-08-26"), addedBy: "Vikram Shetty" },
    { id: "d8", title: "Master WIC joinery drawing", kind: "joinery", spaceIds: ["ff-master-wic"], scopeItemIds: [], revision: "R2", addedAt: D("2026-09-10"), addedBy: "Naresh", vendorId: "v-carp" },
    { id: "d9", title: "Kitchen shop drawing — Hafele", kind: "joinery", spaceIds: ["gf-kitchen"], scopeItemIds: kitchenBase ? [kitchenBase.id] : [], revision: "R1", addedAt: D("2026-08-28"), addedBy: "Hafele", vendorId: "v-kitchen-a" },
    { id: "d10", title: "Hafele kitchen quotation", kind: "quote", spaceIds: ["gf-kitchen"], scopeItemIds: kitchenBase ? [kitchenBase.id] : [], addedAt: D("2026-08-28"), addedBy: "Ananya Rao", vendorId: "v-kitchen-a" },
    { id: "d11", title: "Terrace waterproofing quotation", kind: "quote", spaceIds: ["sf-terrace"], scopeItemIds: terraceWp ? [terraceWp.id] : [], addedAt: D("2026-09-06"), addedBy: "Ravi Teja", vendorId: "v-wp" },
    { id: "d12", title: "Plumbing layout — first floor", kind: "plumbing", spaceIds: ["ff-master-bath", "ff-bed4-bath"], scopeItemIds: [], revision: "R2", addedAt: D("2026-08-14"), addedBy: "Vikram Shetty" },
    { id: "d13", title: "Master bedroom render — walnut scheme", kind: "render", spaceIds: ["ff-master"], scopeItemIds: mbFloor ? [mbFloor.id] : [], revision: "R2", addedAt: D("2026-09-01"), addedBy: "Ananya Rao" },
    { id: "d14", title: "Lift interior — Kone purchase order", kind: "po", spaceIds: ["gf-lift"], scopeItemIds: liftInterior ? [liftInterior.id] : [], addedAt: D("2026-08-05"), addedBy: "Ravi Teja", vendorId: "v-lift" },
    { id: "d15", title: "Waterproofing warranty — ground floor wet areas", kind: "warranty", spaceIds: ["gf-bedroom-bath"], scopeItemIds: [], addedAt: D("2026-08-02"), addedBy: "Ravi Teja", vendorId: "v-wp" },
  );

  return { ideas, options, decisions, comments, quotations, tasks, snags, notes, payments, docs, siteUpdates, scenarios: [] };
}
