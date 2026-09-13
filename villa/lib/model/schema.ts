import type { ProjectState } from "./types";
import { dimsLabel, areaSqft } from "./costing";
import {
  STAGES, STAGE_LABEL, CATEGORY_LABEL, UNIT_LABEL
} from "./types";
import type { CollectionKey } from "../store";

/**
 * Editing schema.
 *
 * Every collection declares its own editable fields once, and a single generic
 * editor renders the table, the form and the validation from that. The reason
 * is not brevity — it is that a field can no longer be silently unreachable.
 * If it is in the model it is in the schema, and if it is in the schema the
 * user can edit it.
 */

export type FieldType =
  | "text" | "textarea" | "number" | "money" | "percent"
  | "select" | "date" | "bool" | "tags" | "readonly";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  /** Fixed choices. */
  options?: { value: string; label: string }[];
  /** Choices drawn from the project itself. */
  source?: "spaces" | "vendors" | "items" | "people" | "decisions" | "designOptions" | "tasks" | "categories";
  hint?: string;
  required?: boolean;
  /** Shown as a column in the compact table, not just in the edit form. */
  inTable?: boolean;
  /** Derived display value for readonly fields. */
  compute?: (row: Record<string, unknown>, state: ProjectState) => string;
}

export interface CollectionSchema {
  key: CollectionKey;
  label: string;
  singular: string;
  /** How a row attaches to a floor, which is how the console groups things. */
  scope: "space" | "item" | "global";
  fields: Field[];
  blank: (ctx: { id: string; spaceId?: string; me: string; state: ProjectState }) => Record<string, unknown>;
  title: (row: Record<string, unknown>, state: ProjectState) => string;
  /** Optional warning shown before deleting a row of this kind. */
  deleteNote?: string;
}

const opts = <T extends Record<string, string>>(m: T) =>
  Object.entries(m).map(([value, label]) => ({ value, label }));

const now = () => new Date().toISOString();

const stageOptions = STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }));
const categoryOptions = opts(CATEGORY_LABEL); // fallback only; the editor prefers state
const unitOptions = opts(UNIT_LABEL);

const FLOORS = [
  { value: "outdoor", label: "Outdoor" },
  { value: "ground", label: "Ground floor" },
  { value: "first", label: "First floor" },
  { value: "second", label: "Second floor" },
];

const SPACE_KINDS = [
  "bedroom", "master-bedroom", "bathroom", "powder", "wic", "kitchen", "wet-kitchen",
  "utility", "living", "drawing", "dining", "family-lounge", "foyer", "lobby", "corridor",
  "staircase", "lift", "puja", "home-theatre", "bar", "laundry", "maid-room", "balcony",
  "terrace", "garden", "driveway", "parking", "deck", "facade", "pathway",
  "external-lighting", "entrance",
].map((k) => ({ value: k, label: k.replace(/-/g, " ") }));

export const SCHEMAS: Record<CollectionKey, CollectionSchema> = {
  /* --------------------------------------------------------- categories */
  categories: {
    key: "categories", label: "Categories", singular: "category", scope: "global",
    deleteNote: "Scope items using it fall back to another category rather than breaking. Archiving is usually better — it hides the trade from pickers without touching history.",
    fields: [
      { key: "label", label: "Name", type: "text", required: true, inTable: true },
      { key: "id", label: "Id", type: "text", required: true,
        hint: "Used internally. Changing it on an existing category will orphan the items using it — prefer renaming the label." },
      { key: "group", label: "Group", type: "select", required: true, inTable: true, options: [
        { value: "shell", label: "Shell & civil" }, { value: "finishes", label: "Finishes" },
        { value: "joinery", label: "Joinery & furniture" }, { value: "mep", label: "MEP & services" },
        { value: "furnishing", label: "Soft furnishing & styling" }, { value: "outdoor", label: "Outdoor" },
        { value: "systems", label: "Systems & safety" }, { value: "handover", label: "Handover" },
      ] },
      { key: "rate", label: "Indicative rate", type: "money", inTable: true,
        hint: "A starting assumption used until a vendor quotes. Never presented as a market price." },
      { key: "unit", label: "Unit", type: "select", options: unitOptions, inTable: true },
      { key: "basis", label: "Quantity basis", type: "select",
        hint: "How a default quantity is worked out from a room's dimensions.",
        options: [
          { value: "floor-area", label: "Floor area" }, { value: "wall-area", label: "Wall area" },
          { value: "perimeter", label: "Perimeter" }, { value: "count", label: "Count" },
          { value: "manual", label: "Enter by hand" },
        ] },
      { key: "wastagePct", label: "Wastage %", type: "percent" },
      { key: "labourRate", label: "Labour / unit", type: "money" },
      { key: "installationPct", label: "Installation %", type: "percent" },
      { key: "freight", label: "Freight", type: "money" },
      { key: "taxPct", label: "Tax %", type: "percent" },
      { key: "leadTimeWeeks", label: "Lead time (weeks)", type: "number", inTable: true,
        hint: "8 or more marks items in this trade as long-lead across the whole product." },
      { key: "assumption", label: "What the rate assumes", type: "textarea" },
      { key: "archived", label: "Archived", type: "bool", inTable: true,
        hint: "Hidden from pickers; existing items keep it." },
    ],
    blank: ({ id }) => ({ id: `cat-${id.slice(-6)}`, label: "New category", group: "finishes", taxPct: 18, unit: "ls" }),
    title: (r) => String(r.label || "Untitled category"),
  },

  /* ------------------------------------------------------------- spaces */
  spaces: {
    key: "spaces", label: "Spaces", singular: "space", scope: "space",
    deleteNote: "Its scope items can be deleted with it, or kept and moved to house-wide.",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inTable: true },
      { key: "floor", label: "Floor", type: "select", options: FLOORS, required: true, inTable: true },
      { key: "_size", label: "Size", type: "readonly", inTable: true,
        compute: (row) => {
          const d = row.dims as never;
          const label = dimsLabel(d);
          return label ? `${label} · ${areaSqft(d)} sq ft` : "not dimensioned";
        } },
      { key: "kind", label: "Kind", type: "select", options: SPACE_KINDS, required: true, inTable: true,
        hint: "Decides which checklist a newly created space is born with." },
      { key: "parentId", label: "Part of", type: "select", source: "spaces",
        hint: "For a WIC or bathroom that belongs to a bedroom." },
      { key: "dims.widthFt", label: "Width (ft)", type: "number" },
      { key: "dims.widthIn", label: "Width (in)", type: "number" },
      { key: "dims.lengthFt", label: "Length (ft)", type: "number" },
      { key: "dims.lengthIn", label: "Length (in)", type: "number" },
      { key: "dims.source", label: "Dimension source", type: "select",
        options: [
          { value: "architect-plan", label: "Architect's plan" },
          { value: "site-measured", label: "Measured on site" },
          { value: "estimated", label: "Estimated" },
          { value: "unknown", label: "Unknown" },
        ],
        hint: "Never leave a site measurement labelled as a plan dimension." },
      { key: "ceilingHeightFt", label: "Ceiling height (ft)", type: "number" },
      { key: "note", label: "Note", type: "textarea" },
    ],
    blank: ({ id }) => ({ id, name: "New space", floor: "ground", kind: "bedroom" }),
    title: (r) => String(r.name || "Untitled space"),
  },

  /* -------------------------------------------------------------- items */
  items: {
    key: "items", label: "Scope items", singular: "scope item", scope: "item",
    deleteNote: "Its ideas, options and decision go with it.",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "spaceId", label: "Room", type: "select", source: "spaces", inTable: true,
        hint: "Leave blank for house-wide scope." },
      { key: "category", label: "Category", type: "select", source: "categories", required: true, inTable: true },
      { key: "stage", label: "Stage", type: "select", options: stageOptions, required: true, inTable: true },
      { key: "spec", label: "Specification", type: "textarea" },
      { key: "owner", label: "Owner", type: "text", inTable: true },
      { key: "vendorId", label: "Vendor", type: "select", source: "vendors" },
      { key: "targetDate", label: "Target date", type: "date" },
      { key: "cost.qty", label: "Quantity", type: "number", inTable: true },
      { key: "cost.unit", label: "Unit", type: "select", options: unitOptions, inTable: true },
      { key: "cost.rate", label: "Rate", type: "money", inTable: true },
      { key: "cost.wastagePct", label: "Wastage %", type: "percent" },
      { key: "cost.labourRate", label: "Labour / unit", type: "money" },
      { key: "cost.labourLumpSum", label: "Labour lump sum", type: "money" },
      { key: "cost.installationPct", label: "Installation %", type: "percent" },
      { key: "cost.freight", label: "Freight", type: "money" },
      { key: "cost.taxPct", label: "Tax %", type: "percent" },
      { key: "cost.otherCharges", label: "Other charges", type: "money" },
      { key: "cost.assumption", label: "Rate assumption", type: "textarea" },
      { key: "ladder.initialEstimate", label: "Initial estimate", type: "money" },
      { key: "ladder.designerEstimate", label: "Designer estimate", type: "money" },
      { key: "ladder.quoted", label: "Quoted", type: "money" },
      { key: "ladder.approved", label: "Approved", type: "money" },
      { key: "ladder.committed", label: "Committed", type: "money" },
      { key: "ladder.paid", label: "Paid", type: "money" },
      { key: "naReason", label: "Not-applicable reason", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    blank: ({ id, spaceId }) => ({
      id, title: "New scope item", spaceId, category: "flooring", stage: "not-started",
      cost: { qty: 1, unit: "nos", rate: 0, taxPct: 18 }, ladder: {}, tags: [],
    }),
    title: (r) => String(r.title || "Untitled item"),
  },

  /* -------------------------------------------------------------- ideas */
  ideas: {
    key: "ideas", label: "Ideas", singular: "idea", scope: "item",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "scopeItemId", label: "Against", type: "select", source: "items", required: true, inTable: true },
      { key: "body", label: "Note", type: "textarea" },
      { key: "source", label: "Source", type: "text", hint: "Pinterest, a magazine, a showroom." },
      { key: "shortlisted", label: "Shortlisted", type: "bool", inTable: true },
      { key: "createdBy", label: "Added by", type: "text", inTable: true },
      { key: "createdAt", label: "Added", type: "date" },
    ],
    blank: ({ id, me, state }) => ({
      id, title: "New idea", scopeItemId: state.items[0]?.id, attachments: [],
      createdBy: me, createdAt: now(),
    }),
    title: (r) => String(r.title || "Untitled idea"),
  },

  /* ------------------------------------------------------------ options */
  options: {
    key: "options", label: "Design options", singular: "option", scope: "item",
    fields: [
      { key: "label", label: "Label", type: "text", required: true, inTable: true, hint: "Option A, Option B…" },
      { key: "headline", label: "Headline", type: "text", required: true, inTable: true },
      { key: "scopeItemId", label: "Against", type: "select", source: "items", required: true, inTable: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "estimate", label: "Estimate", type: "money", inTable: true },
      { key: "leadTimeWeeks", label: "Lead time (weeks)", type: "number", inTable: true },
      { key: "designerRecommended", label: "Designer recommends", type: "bool", inTable: true },
      { key: "pros", label: "Pros", type: "tags", hint: "One per line." },
      { key: "cons", label: "Cons", type: "tags", hint: "One per line." },
      { key: "palette", label: "Palette", type: "tags", hint: "Hex colours, one per line — they render as the swatch." },
    ],
    blank: ({ id, state }) => ({
      id, label: "Option", headline: "New option", scopeItemId: state.items[0]?.id,
      description: "", pros: [], cons: [], palette: ["#c3b6a4"], attachments: [],
    }),
    title: (r) => `${r.label ?? ""} — ${r.headline ?? ""}`.trim(),
  },

  /* ---------------------------------------------------------- decisions */
  decisions: {
    key: "decisions", label: "Decisions", singular: "decision", scope: "item",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "scopeItemId", label: "Against", type: "select", source: "items", required: true, inTable: true },
      { key: "question", label: "Question", type: "textarea", required: true },
      { key: "status", label: "Status", type: "select", inTable: true, options: [
        { value: "draft", label: "Draft" },
        { value: "awaiting-owner", label: "Awaiting owner" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "changes-requested", label: "Changes requested" },
        { value: "on-hold", label: "On hold" },
      ] },
      { key: "recommendedOptionId", label: "Recommended option", type: "select", source: "designOptions" },
      { key: "costDeltaVsBudget", label: "Cost delta", type: "money", inTable: true },
      { key: "scheduleImpactDays", label: "Schedule impact (days)", type: "number" },
      { key: "decideBy", label: "Decide by", type: "date", inTable: true },
      { key: "consequence", label: "Why it matters now", type: "textarea" },
      { key: "designerNote", label: "Designer's recommendation", type: "textarea" },
    ],
    blank: ({ id, me, state }) => ({
      id, title: "New decision", scopeItemId: state.items[0]?.id, question: "",
      alternativeOptionIds: [], status: "awaiting-owner",
      history: [{ at: now(), by: me, action: "raised" }],
    }),
    title: (r) => String(r.title || "Untitled decision"),
  },

  /* ----------------------------------------------------------- comments */
  comments: {
    key: "comments", label: "Comments", singular: "comment", scope: "item",
    fields: [
      { key: "body", label: "Comment", type: "textarea", required: true, inTable: true },
      { key: "author", label: "Author", type: "text", required: true, inTable: true },
      { key: "targetType", label: "About", type: "select", inTable: true, options: [
        { value: "item", label: "Scope item" }, { value: "idea", label: "Idea" },
        { value: "option", label: "Option" }, { value: "decision", label: "Decision" },
        { value: "snag", label: "Snag" }, { value: "note", label: "Note" },
        { value: "quote", label: "Quotation" },
      ] },
      { key: "targetId", label: "Target id", type: "text" },
      { key: "createdAt", label: "Posted", type: "date" },
    ],
    blank: ({ id, me, state }) => ({
      id, targetType: "item", targetId: state.items[0]?.id, author: me, body: "", createdAt: now(),
    }),
    title: (r) => String(r.body || "").slice(0, 60) || "Empty comment",
  },

  /* ------------------------------------------------------------ vendors */
  vendors: {
    key: "vendors", label: "Vendors", singular: "vendor", scope: "global",
    deleteNote: "Their quotations and scheduled payments go too; awarded scope falls back to unassigned.",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inTable: true },
      { key: "trade", label: "Trades", type: "tags", inTable: true, hint: "Category keys, one per line." },
      { key: "contact", label: "Contact", type: "text", inTable: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "rating", label: "Rating (1–5)", type: "number", inTable: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    blank: ({ id }) => ({ id, name: "New vendor", trade: [] }),
    title: (r) => String(r.name || "Unnamed vendor"),
  },

  /* -------------------------------------------------------- quotations */
  quotations: {
    key: "quotations", label: "Quotations", singular: "quotation", scope: "global",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "vendorId", label: "Vendor", type: "select", source: "vendors", required: true, inTable: true },
      { key: "total", label: "Total", type: "money", inTable: true },
      { key: "receivedAt", label: "Received", type: "date", inTable: true },
      { key: "validUntil", label: "Valid until", type: "date" },
      { key: "warrantyMonths", label: "Warranty (months)", type: "number" },
      { key: "leadTimeWeeks", label: "Lead time (weeks)", type: "number" },
      { key: "paymentTerms", label: "Payment terms", type: "text" },
      { key: "recommended", label: "Recommended", type: "bool", inTable: true },
      { key: "recommendationNote", label: "Why", type: "textarea" },
      { key: "inclusions", label: "Included", type: "tags", hint: "One per line." },
      { key: "exclusions", label: "Excluded", type: "tags", hint: "One per line." },
      { key: "comparabilityFlags", label: "Not like-for-like because", type: "tags",
        hint: "One per line. These are what stop a cheaper headline misleading you." },
    ],
    blank: ({ id, state }) => ({
      id, title: "New quotation", vendorId: state.vendors[0]?.id, scopeItemIds: [],
      receivedAt: now(), lines: [], total: 0, inclusions: [], exclusions: [],
    }),
    title: (r) => String(r.title || "Untitled quotation"),
  },

  /* -------------------------------------------------------------- tasks */
  tasks: {
    key: "tasks", label: "Tasks", singular: "task", scope: "space",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "owner", label: "Owner", type: "text", required: true, inTable: true },
      { key: "spaceId", label: "Room", type: "select", source: "spaces", inTable: true },
      { key: "scopeItemId", label: "Scope item", type: "select", source: "items" },
      { key: "vendorId", label: "Vendor", type: "select", source: "vendors" },
      { key: "status", label: "Status", type: "select", inTable: true, options: [
        { value: "todo", label: "To do" }, { value: "in-progress", label: "In progress" },
        { value: "blocked", label: "Blocked" }, { value: "done", label: "Done" },
      ] },
      { key: "start", label: "Start", type: "date" },
      { key: "finish", label: "Finish", type: "date", inTable: true },
      { key: "milestone", label: "Milestone", type: "bool", inTable: true },
      { key: "dependsOn", label: "Depends on", type: "tags", hint: "Task ids, one per line." },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    blank: ({ id, spaceId, me }) => ({ id, title: "New task", owner: me, spaceId, dependsOn: [], status: "todo" }),
    title: (r) => String(r.title || "Untitled task"),
  },

  /* -------------------------------------------------------------- snags */
  snags: {
    key: "snags", label: "Snags", singular: "snag", scope: "space",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "spaceId", label: "Room", type: "select", source: "spaces", required: true, inTable: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Trade", type: "select", source: "categories", inTable: true },
      { key: "severity", label: "Severity", type: "select", inTable: true, options: [
        { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
        { value: "high", label: "High" }, { value: "critical", label: "Critical" },
      ] },
      { key: "status", label: "Status", type: "select", inTable: true, options: [
        { value: "open", label: "Open" }, { value: "assigned", label: "Assigned" },
        { value: "fixed", label: "Fixed" }, { value: "verify", label: "Verify" },
        { value: "closed", label: "Closed" },
      ] },
      { key: "vendorId", label: "Responsible vendor", type: "select", source: "vendors" },
      { key: "scopeItemId", label: "Scope item", type: "select", source: "items" },
      { key: "raisedBy", label: "Raised by", type: "text" },
      { key: "raisedAt", label: "Raised", type: "date" },
      { key: "dueBy", label: "Due", type: "date", inTable: true },
      { key: "verifiedBy", label: "Verified by", type: "text" },
      { key: "closedAt", label: "Closed", type: "date" },
    ],
    blank: ({ id, spaceId, me, state }) => ({
      id, title: "New snag", spaceId: spaceId ?? state.spaces[0]?.id, category: "flooring",
      severity: "medium", status: "open", raisedBy: me, raisedAt: now(), photoSwatch: "#bdb2a2",
    }),
    title: (r) => String(r.title || "Untitled snag"),
  },

  /* -------------------------------------------------------------- notes */
  notes: {
    key: "notes", label: "Notes", singular: "note", scope: "space",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "kind", label: "Kind", type: "select", inTable: true, options: [
        { value: "meeting", label: "Meeting" }, { value: "site-visit", label: "Site visit" },
        { value: "call", label: "Call" }, { value: "vendor-meeting", label: "Vendor meeting" },
        { value: "observation", label: "Observation" }, { value: "measurement", label: "Measurement" },
        { value: "idea", label: "Idea" }, { value: "follow-up", label: "Follow-up" },
      ] },
      { key: "author", label: "Author", type: "text", inTable: true },
      { key: "at", label: "Date", type: "date", inTable: true },
      { key: "body", label: "Body", type: "textarea", required: true },
      { key: "spaceIds", label: "Rooms", type: "tags", hint: "Space ids, one per line." },
      { key: "vendorIds", label: "Vendors", type: "tags", hint: "Vendor ids, one per line." },
      { key: "scopeItemIds", label: "Scope items", type: "tags", hint: "Item ids, one per line." },
    ],
    blank: ({ id, spaceId, me }) => ({
      id, title: "New note", body: "", kind: "observation", at: now(), author: me,
      spaceIds: spaceId ? [spaceId] : [], scopeItemIds: [], vendorIds: [], decisionIds: [], taskIds: [],
    }),
    title: (r) => String(r.title || "Untitled note"),
  },

  /* ----------------------------------------------------------- payments */
  payments: {
    key: "payments", label: "Payments", singular: "payment", scope: "global",
    fields: [
      { key: "label", label: "Label", type: "text", required: true, inTable: true },
      { key: "vendorId", label: "Vendor", type: "select", source: "vendors", required: true, inTable: true },
      { key: "amount", label: "Amount", type: "money", required: true, inTable: true },
      { key: "kind", label: "Kind", type: "select", inTable: true, options: [
        { value: "advance", label: "Advance" }, { value: "milestone", label: "Milestone" },
        { value: "balance", label: "Balance" }, { value: "retention", label: "Retention" },
      ] },
      { key: "dueOn", label: "Due", type: "date", inTable: true },
      { key: "paidOn", label: "Paid", type: "date", inTable: true },
      { key: "scopeItemIds", label: "Scope items", type: "tags", hint: "Item ids, one per line." },
    ],
    blank: ({ id, state }) => ({
      id, vendorId: state.vendors[0]?.id, scopeItemIds: [], label: "New payment",
      amount: 0, dueOn: now(), kind: "milestone",
    }),
    title: (r) => String(r.label || "Untitled payment"),
  },

  /* ---------------------------------------------------------- documents */
  docs: {
    key: "docs", label: "Documents", singular: "document", scope: "space",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, inTable: true },
      { key: "kind", label: "Kind", type: "select", inTable: true, options: [
        "floor-plan", "electrical", "lighting", "ceiling", "plumbing", "furniture", "joinery",
        "elevation", "render", "boq", "quote", "po", "contract", "invoice", "receipt",
        "spec", "warranty", "manual",
      ].map((k) => ({ value: k, label: k.replace(/-/g, " ") })) },
      { key: "revision", label: "Revision", type: "text", inTable: true },
      { key: "vendorId", label: "Vendor", type: "select", source: "vendors" },
      { key: "addedBy", label: "Added by", type: "text", inTable: true },
      { key: "addedAt", label: "Added", type: "date", inTable: true },
      { key: "url", label: "Link", type: "text" },
      { key: "spaceIds", label: "Rooms", type: "tags", hint: "Space ids, one per line." },
      { key: "scopeItemIds", label: "Scope items", type: "tags", hint: "Item ids, one per line." },
    ],
    blank: ({ id, spaceId, me }) => ({
      id, title: "New document", kind: "render", spaceIds: spaceId ? [spaceId] : [],
      scopeItemIds: [], addedAt: now(), addedBy: me,
    }),
    title: (r) => String(r.title || "Untitled document"),
  },

  /* ------------------------------------------------------- site updates */
  siteUpdates: {
    key: "siteUpdates", label: "Site updates", singular: "site update", scope: "space",
    fields: [
      { key: "body", label: "Update", type: "textarea", required: true, inTable: true },
      { key: "spaceId", label: "Room", type: "select", source: "spaces", required: true, inTable: true },
      { key: "by", label: "By", type: "text", inTable: true },
      { key: "at", label: "Date", type: "date", inTable: true },
      { key: "progressPct", label: "Progress %", type: "percent", inTable: true },
      { key: "photoSwatch", label: "Photo tone", type: "text", hint: "A hex colour, standing in for the photo." },
    ],
    blank: ({ id, spaceId, me, state }) => ({
      id, spaceId: spaceId ?? state.spaces[0]?.id, at: now(), by: me, body: "", photoSwatch: "#c2b6a6",
    }),
    title: (r) => String(r.body || "").slice(0, 60) || "Empty update",
  },

  /* ---------------------------------------------------------- scenarios */
  scenarios: {
    key: "scenarios", label: "Scenarios", singular: "scenario", scope: "global",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inTable: true },
      { key: "subtitle", label: "Subtitle", type: "text", inTable: true },
      { key: "note", label: "Note", type: "textarea" },
    ],
    blank: ({ id }) => ({ id, name: "New scenario", subtitle: "", overrides: {}, categoryMultipliers: {} }),
    title: (r) => String(r.name || "Untitled scenario"),
  },

  /* ------------------------------------------------------------- people */
  people: {
    key: "people", label: "People", singular: "person", scope: "global",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inTable: true },
      { key: "role", label: "Role", type: "select", inTable: true, options: [
        { value: "homeowner", label: "Homeowner" }, { value: "designer", label: "Designer" },
        { value: "vendor", label: "Contractor" },
      ] },
      { key: "title", label: "Title", type: "text", inTable: true, hint: "Principal designer, site engineer, electrical contractor…" },
      { key: "firm", label: "Firm", type: "text", inTable: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "inactive", label: "Inactive", type: "bool", hint: "Keeps their name on old changes but takes them out of the pickers." },
      { key: "avatarTone", label: "Avatar colour", type: "text", hint: "A hex colour." },
    ],
    blank: ({ id }) => ({ id, name: "", role: "designer", avatarTone: "#857b70" }),
    title: (r) => String(r.name || "Unnamed"),
  },
};

/** Read a possibly-nested key such as "cost.rate" or "dims.widthFt". */
export function readField(row: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], row);
}

/** Write a possibly-nested key, cloning the objects it passes through. */
export function writeField(row: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  const parts = key.split(".");
  if (parts.length === 1) return { ...row, [key]: value };
  const [head, ...rest] = parts;
  const child = (row[head] as Record<string, unknown>) ?? {};
  return { ...row, [head]: writeField(child, rest.join("."), value) };
}
