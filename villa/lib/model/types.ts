/**
 * The villa model.
 *
 * One idea governs this file: a piece of scope is ONE object for its whole life.
 * An idea, its options, the decision that picks one, the BOQ line it becomes, the
 * purchase order, the delivery, the installation and the snag against it are all
 * facets of the same `ScopeItem` — never re-keyed, never retyped, never duplicated
 * into a parallel "BOQ module". Every screen in the app is a different lens on the
 * same set of scope items.
 */

/* ------------------------------------------------------------------ spaces */

export type FloorId = "outdoor" | "ground" | "first" | "second";

export type SpaceKind =
  | "bedroom"
  | "master-bedroom"
  | "bathroom"
  | "powder"
  | "wic"
  | "kitchen"
  | "wet-kitchen"
  | "utility"
  | "living"
  | "drawing"
  | "dining"
  | "family-lounge"
  | "foyer"
  | "lobby"
  | "corridor"
  | "staircase"
  | "lift"
  | "puja"
  | "home-theatre"
  | "bar"
  | "laundry"
  | "maid-room"
  | "balcony"
  | "terrace"
  | "garden"
  | "driveway"
  | "parking"
  | "deck"
  | "facade"
  | "pathway"
  | "external-lighting"
  | "entrance";

/** Dimensions as printed on the architect's plan. Never inferred. */
export interface Dimensions {
  /** e.g. 20 ft 4 in -> { ft: 20, in: 4 } */
  widthFt: number;
  widthIn: number;
  lengthFt: number;
  lengthIn: number;
  /** Where the number came from, so a guess can never masquerade as a survey. */
  source: "architect-plan" | "site-measured" | "estimated" | "unknown";
}

export interface Space {
  id: string;
  name: string;
  floor: FloorId;
  kind: SpaceKind;
  /** Undefined means the plan does not dimension it. We do not invent one. */
  dims?: Dimensions;
  /** Derived carpet area in sq ft, only when dims exist. */
  note?: string;
  /** Parent space for WICs / bathrooms that belong to a bedroom. */
  parentId?: string;
  /** Hero image / render, if the designer has uploaded one. */
  heroUrl?: string;
  /** Ceiling height in feet — editable, blank until confirmed on site. */
  ceilingHeightFt?: number;
  archived?: boolean;
  /** The layout chosen for this room, by id (`${spaceId}:${key}`). Blank until someone chooses. */
  layoutId?: string;
  /** Material-spec checklist ticks for the room, by spec line id (see lib/specs). */
  specChecks?: Record<string, "done" | "na">;
}

/* ------------------------------------------------- the scope item lifecycle */

/**
 * The canonical workflow. Every scope item sits at exactly one stage, and the
 * stage is what every heatmap, completeness check and dashboard counts.
 */
export const STAGES = [
  "not-started",
  "idea",
  "options",
  "estimated",
  "discussion",
  "decided",
  "approved",
  "boq",
  "quoted",
  "ordered",
  "in-transit",
  "delivered",
  "installed",
  "inspected",
  "snagged",
  "complete",
  "not-applicable",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  "not-started": "Not started",
  idea: "Idea",
  options: "Options on table",
  estimated: "Estimated",
  discussion: "In discussion",
  decided: "Decided",
  approved: "Approved",
  boq: "In BOQ",
  quoted: "Quoted",
  ordered: "Ordered",
  "in-transit": "In transit",
  delivered: "Delivered",
  installed: "Installed",
  inspected: "Inspected",
  snagged: "Snagged",
  complete: "Complete",
  "not-applicable": "Not applicable",
};

/** How far through the pipeline a stage sits, 0..1. Drives completion %. */
export const STAGE_PROGRESS: Record<Stage, number> = {
  "not-started": 0,
  idea: 0.06,
  options: 0.12,
  estimated: 0.2,
  discussion: 0.26,
  decided: 0.34,
  approved: 0.45,
  boq: 0.52,
  quoted: 0.6,
  ordered: 0.68,
  "in-transit": 0.76,
  delivered: 0.84,
  installed: 0.92,
  inspected: 0.97,
  snagged: 0.9,
  complete: 1,
  "not-applicable": 1,
};

/**
 * A category is an id, not a closed union.
 *
 * The list below seeds a new project, but it lives in project state from then
 * on: a homeowner doing a sea-facing apartment has different trades from one
 * doing a villa, and a taxonomy nailed into the type system cannot follow them.
 * `BUILTIN_CATEGORIES` is the default rate card; `state.categories` is the truth.
 */
export type Category = string;

type BuiltinCategory =
  | "civil"
  | "waterproofing"
  | "flooring"
  | "stone"
  | "ceiling"
  | "paint"
  | "wall-finish"
  | "doors"
  | "windows"
  | "glass"
  | "hardware"
  | "carpentry"
  | "wardrobe"
  | "kitchen"
  | "bathroom"
  | "sanitaryware"
  | "loose-furniture"
  | "bespoke-furniture"
  | "lighting"
  | "electrical"
  | "plumbing"
  | "hvac"
  | "fans"
  | "automation"
  | "networking"
  | "security"
  | "av"
  | "appliances"
  | "soft-furnishing"
  | "curtains"
  | "rugs"
  | "art"
  | "accessories"
  | "styling"
  | "landscape"
  | "facade"
  | "elevator"
  | "staircase"
  | "power-backup"
  | "water"
  | "safety"
  | "cleaning"
  | "handover";

export const CATEGORY_LABEL: Record<BuiltinCategory, string> = {
  civil: "Civil & masonry",
  waterproofing: "Waterproofing",
  flooring: "Flooring",
  stone: "Stone & marble",
  ceiling: "False ceiling",
  paint: "Painting",
  "wall-finish": "Wall finishes",
  doors: "Doors",
  windows: "Windows",
  glass: "Glass",
  hardware: "Hardware",
  carpentry: "Custom carpentry",
  wardrobe: "Wardrobes",
  kitchen: "Kitchen",
  bathroom: "Bathroom fit-out",
  sanitaryware: "Sanitaryware & CP",
  "loose-furniture": "Loose furniture",
  "bespoke-furniture": "Bespoke furniture",
  lighting: "Lighting",
  electrical: "Electrical",
  plumbing: "Plumbing",
  hvac: "HVAC",
  fans: "Fans",
  automation: "Home automation",
  networking: "Wi-Fi & networking",
  security: "Security & CCTV",
  av: "AV & home theatre",
  appliances: "Appliances",
  "soft-furnishing": "Soft furnishings",
  curtains: "Curtains & blinds",
  rugs: "Rugs",
  art: "Art",
  accessories: "Accessories",
  styling: "Styling",
  landscape: "Landscape & irrigation",
  facade: "Facade",
  elevator: "Elevator",
  staircase: "Staircase & railings",
  "power-backup": "Power backup",
  water: "Water systems",
  safety: "Safety & pest",
  cleaning: "Deep cleaning",
  handover: "Handover & warranties",
};

/** Which trade must finish before this one can start. Drives the timeline. */
export type Trade = Category;

export type CategoryGroup =
  | "shell" | "finishes" | "joinery" | "mep" | "furnishing" | "outdoor" | "systems" | "handover";

export const CATEGORY_GROUP_LABEL: Record<CategoryGroup, string> = {
  shell: "Shell & civil",
  finishes: "Finishes",
  joinery: "Joinery & furniture",
  mep: "MEP & services",
  furnishing: "Soft furnishing & styling",
  outdoor: "Outdoor",
  systems: "Systems & safety",
  handover: "Handover",
};

/**
 * A category and everything the app assumes about it.
 *
 * This is the rate card. Every indicative number the product uses when no
 * vendor has quoted yet comes from here, which is why it is editable in one
 * place rather than scattered through the code.
 */
export interface CategoryDef {
  id: string;
  label: string;
  group: CategoryGroup;
  /** Indicative supply rate. An assumption, never a quotation. */
  rate?: number;
  unit?: Unit;
  wastagePct?: number;
  labourRate?: number;
  installationPct?: number;
  freight?: number;
  taxPct?: number;
  /** How a default quantity is derived from a room's dimensions. */
  basis?: "floor-area" | "wall-area" | "perimeter" | "count" | "manual";
  /** Typical lead time; 8 weeks or more marks an item long-lead. */
  leadTimeWeeks?: number;
  assumption?: string;
  /** Kept out of pickers without destroying the items already using it. */
  archived?: boolean;
}

/* ----------------------------------------------------------- cost structure */

export type Unit =
  | "sqft"
  | "sqm"
  | "rft"
  | "nos"
  | "ls"
  | "day"
  | "set"
  | "job"
  | "kg"
  | "litre";

export const UNIT_LABEL: Record<Unit, string> = {
  sqft: "sq ft",
  sqm: "sq m",
  rft: "running ft",
  nos: "nos",
  ls: "lump sum",
  day: "labour-day",
  set: "set",
  job: "job",
  kg: "kg",
  litre: "litre",
};

/**
 * A costing build-up. Everything is editable; nothing here is a market quote.
 * `base = qty x rate`, then the adders stack on top.
 */
export interface CostBuildUp {
  qty: number;
  unit: Unit;
  /** Material / supply rate per unit. */
  rate: number;
  /** Wastage as a percentage of material value. Tiles, stone, fabric. */
  wastagePct?: number;
  /** Labour, either per unit or as a lump. */
  labourRate?: number;
  labourLumpSum?: number;
  /** Installation, freight, taxes, anything else. */
  installationPct?: number;
  freight?: number;
  taxPct?: number;
  otherCharges?: number;
  /** Free-text record of what the numbers assume. */
  assumption?: string;
}

/**
 * The seven money columns. Each is independently nullable: an item can be
 * estimated without being quoted, quoted without being approved, and so on.
 */
export interface CostLadder {
  /** Early planning allowance, set at budget time. */
  initialEstimate?: number;
  /** Refined number once the designer has specified it. */
  designerEstimate?: number;
  /** Lowest / recommended vendor quotation. */
  quoted?: number;
  /** Negotiated and signed off by the homeowner. */
  approved?: number;
  /** PO raised / contract awarded. */
  committed?: number;
  /** Cash actually out the door. */
  paid?: number;
}

/* -------------------------------------------------- ideas, options, threads */

export interface Attachment {
  id: string;
  kind: "image" | "link" | "pdf" | "drawing" | "sketch" | "invoice" | "other";
  label: string;
  url?: string;
  /** For prototype content we render a generated swatch instead of a photo. */
  swatch?: string;
  addedBy: string;
  addedAt: string;
}

export interface Idea {
  id: string;
  scopeItemId: string;
  title: string;
  body?: string;
  source?: string;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string;
  shortlisted?: boolean;
  reactions?: Record<string, string[]>;
}

export interface DesignOption {
  id: string;
  scopeItemId: string;
  label: string;
  headline: string;
  description: string;
  pros: string[];
  cons: string[];
  estimate?: number;
  /** Swatch colours to render a material chip strip. */
  palette: string[];
  leadTimeWeeks?: number;
  designerRecommended?: boolean;
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  /** What this comment hangs off: an idea, an option, a decision, an item. */
  targetType: "idea" | "option" | "decision" | "item" | "snag" | "note" | "quote";
  targetId: string;
  author: string;
  body: string;
  createdAt: string;
  mentions?: string[];
  reactions?: Record<string, string[]>;
  parentId?: string;
}

/* ----------------------------------------------------------------- decision */

export type DecisionStatus =
  | "draft"
  | "awaiting-owner"
  | "approved"
  | "rejected"
  | "changes-requested"
  | "on-hold";

export interface Decision {
  id: string;
  scopeItemId: string;
  title: string;
  question: string;
  recommendedOptionId?: string;
  alternativeOptionIds: string[];
  /** Delta against whatever is currently in the budget. */
  costDeltaVsBudget?: number;
  scheduleImpactDays?: number;
  designerNote?: string;
  status: DecisionStatus;
  /** Hard date past which the programme slips. */
  decideBy?: string;
  /** Why it matters — shown on the decision card. */
  consequence?: string;
  history: DecisionEvent[];
}

export interface DecisionEvent {
  at: string;
  by: string;
  action: "raised" | "approved" | "rejected" | "changes-requested" | "held" | "revised";
  note?: string;
  optionId?: string;
}

/* ------------------------------------------------------ vendors & quotations */

export interface Vendor {
  id: string;
  name: string;
  trade: Category[];
  contact?: string;
  phone?: string;
  city?: string;
  rating?: number;
  notes?: string;
}

export interface QuoteLine {
  scopeItemId: string;
  amount: number;
  spec?: string;
  brand?: string;
  qty?: number;
  unit?: Unit;
}

export interface Quotation {
  id: string;
  vendorId: string;
  scopeItemIds: string[];
  title: string;
  receivedAt: string;
  validUntil?: string;
  lines: QuoteLine[];
  total: number;
  inclusions: string[];
  exclusions: string[];
  warrantyMonths?: number;
  leadTimeWeeks?: number;
  paymentTerms?: string;
  recommended?: boolean;
  recommendationNote?: string;
  /** Set when the quote is not like-for-like with its siblings. */
  comparabilityFlags?: string[];
}

/* -------------------------------------------------------------- procurement */

export type ProcurementStatus =
  | "to-select"
  | "selected"
  | "quote-requested"
  | "approved"
  | "ordered"
  | "in-transit"
  | "delivered"
  | "installed"
  | "verified";

export interface Procurement {
  scopeItemId: string;
  product?: string;
  sku?: string;
  brand?: string;
  vendorId?: string;
  qty?: number;
  orderAmount?: number;
  advance?: number;
  balance?: number;
  orderedOn?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  storageLocation?: string;
  installationDate?: string;
  warrantyMonths?: number;
  invoiceRef?: string;
  owner?: string;
  status: ProcurementStatus;
  /** Weeks from order to delivery. Anything >= 8 surfaces as long-lead. */
  leadTimeWeeks?: number;
  swatch?: string;
}

/* -------------------------------------------------------------------- tasks */

export type TaskStatus = "todo" | "in-progress" | "blocked" | "done";

export interface Task {
  id: string;
  title: string;
  spaceId?: string;
  scopeItemId?: string;
  vendorId?: string;
  owner: string;
  start?: string;
  finish?: string;
  dependsOn: string[];
  milestone?: boolean;
  status: TaskStatus;
  /** Days of float before this task starts pushing handover. */
  notes?: string;
}

/* ------------------------------------------------------------------- snags */

export type SnagStatus = "open" | "assigned" | "fixed" | "verify" | "closed";
export type Severity = "low" | "medium" | "high" | "critical";

export interface Snag {
  id: string;
  spaceId: string;
  scopeItemId?: string;
  title: string;
  description?: string;
  category: Category;
  severity: Severity;
  vendorId?: string;
  raisedBy: string;
  raisedAt: string;
  dueBy?: string;
  status: SnagStatus;
  photoSwatch?: string;
  /** Annotation pins, normalised 0..1 over the photo. */
  pins?: { x: number; y: number; label: string }[];
  rectificationSwatch?: string;
  verifiedBy?: string;
  closedAt?: string;
}

/* -------------------------------------------------------------------- notes */

export interface Note {
  id: string;
  title: string;
  body: string;
  kind:
    | "meeting"
    | "site-visit"
    | "call"
    | "vendor-meeting"
    | "observation"
    | "measurement"
    | "idea"
    | "follow-up";
  at: string;
  author: string;
  /** One note, many subjects. This is what makes notes the project's memory. */
  spaceIds: string[];
  scopeItemIds: string[];
  vendorIds: string[];
  decisionIds: string[];
  taskIds: string[];
  /** Room layouts this note is about. */
  layoutIds?: string[];
  /** Things this note spawned, so a conversation never evaporates. */
  spawned?: { kind: "task" | "decision" | "snag" | "procurement" | "follow-up"; id: string; label: string }[];
}

/* ----------------------------------------------------------------- payments */

export interface Payment {
  id: string;
  vendorId: string;
  scopeItemIds: string[];
  label: string;
  amount: number;
  dueOn: string;
  paidOn?: string;
  kind: "advance" | "milestone" | "balance" | "retention";
}

/* ------------------------------------------------------------ documents */

export interface Doc {
  id: string;
  title: string;
  kind:
    | "floor-plan"
    | "electrical"
    | "lighting"
    | "ceiling"
    | "plumbing"
    | "furniture"
    | "joinery"
    | "elevation"
    | "render"
    | "boq"
    | "quote"
    | "po"
    | "contract"
    | "invoice"
    | "receipt"
    | "spec"
    | "warranty"
    | "manual";
  spaceIds: string[];
  scopeItemIds: string[];
  vendorId?: string;
  revision?: string;
  addedAt: string;
  addedBy: string;
  url?: string;
}

/* ------------------------------------------------ the item, and the project */

export interface SiteUpdate {
  id: string;
  spaceId: string;
  at: string;
  by: string;
  body: string;
  progressPct?: number;
  photoSwatch?: string;
}

/** The spine. Everything above hangs off one of these. */
export interface ScopeItem {
  id: string;
  title: string;
  /** Blank for house-wide scope that belongs to no single room. */
  spaceId?: string;
  category: Category;
  stage: Stage;
  /** Written specification, filled in as the item firms up. */
  spec?: string;
  owner?: string;
  cost: CostBuildUp;
  ladder: CostLadder;
  vendorId?: string;
  /** Other scope items that must complete first. */
  dependsOn?: string[];
  targetDate?: string;
  /** Set when marked not-applicable, so the audit trail survives. */
  naReason?: string;
  /** True for items the app pre-populated, false for user-added. */
  seeded?: boolean;
  procurement?: Procurement;
  /** Set once an option is approved, so the decision is traceable from the item. */
  chosenOptionId?: string;
  notes?: string;
  /** Flags raised by the completeness engine, recomputed not stored. */
  tags?: string[];
}

export type Role = "homeowner" | "designer" | "vendor";

/**
 * Someone on the project. Designers, contractors and the family all live here;
 * the role decides which lens the app shows them and what they may approve.
 */
export interface Person {
  id: string;
  name: string;
  role: Role;
  firm?: string;
  phone?: string;
  email?: string;
  /** What they do, in a few words — "lighting designer", "site engineer". */
  title?: string;
  avatarTone?: string;
  /** Off the project but kept for history. */
  inactive?: boolean;
  /** For a contractor: the only rooms they see. Empty means every room. */
  spaceIds?: string[];
}

export interface Scenario {
  id: string;
  name: string;
  subtitle: string;
  /** Multiplier or override per scope item id. */
  overrides: Record<string, { amount?: number; multiplier?: number; spec?: string }>;
  /** Category-level multipliers applied where no item override exists. */
  categoryMultipliers?: Partial<Record<Category, number>>;
  note?: string;
}

export interface ProjectMeta {
  name: string;
  address: string;
  plotWidthFt: number;
  plotDepthFt: number;
  startDate: string;
  targetHandover: string;
  originalBudget: number;
  contingencyPct: number;
  currency: "INR";
  lastOwnerVisit: string;
}

export interface ProjectState {
  meta: ProjectMeta;
  /** The project's own category taxonomy and rate card. */
  categories: CategoryDef[];
  people: Person[];
  spaces: Space[];
  items: ScopeItem[];
  ideas: Idea[];
  options: DesignOption[];
  decisions: Decision[];
  comments: Comment[];
  vendors: Vendor[];
  quotations: Quotation[];
  tasks: Task[];
  snags: Snag[];
  notes: Note[];
  payments: Payment[];
  docs: Doc[];
  siteUpdates: SiteUpdate[];
  scenarios: Scenario[];
  activeScenarioId?: string;
}
