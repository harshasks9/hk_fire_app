export type Tier = "recommended" | "alternative" | "step-up" | "reference" | "avoid";

export const TIER_LABEL: Record<Tier, string> = {
  recommended: "Recommended",
  alternative: "Alternative",
  "step-up": "Step-up",
  reference: "Reference",
  avoid: "Avoid",
};

export type Buy = "india" | "usa" | "singapore" | "hongkong" | "china" | "thailand" | "threshold" | "do-not-import";

export const BUY_LABEL: Record<Buy, string> = {
  india: "Buy in India",
  usa: "Buy in USA",
  singapore: "Buy in Singapore",
  hongkong: "Buy in Hong Kong",
  china: "Buy in China",
  thailand: "Buy in Thailand",
  threshold: "Import only above a saving threshold",
  "do-not-import": "Do not import",
};

/** What Compare can line up. Every value is a short, plain-language statement, never a score. */
export type Attr =
  | "measured" | "spl" | "distortion" | "directivity" | "bass" | "hdr" | "black"
  | "roomcorr" | "reliability" | "warranty" | "import" | "fit";

export const ATTR_LABEL: Record<Attr, string> = {
  measured: "Measured performance",
  spl: "SPL capability",
  distortion: "Distortion",
  directivity: "Directivity",
  bass: "Bass extension",
  hdr: "HDR performance",
  black: "Black level",
  roomcorr: "Room correction",
  reliability: "Reliability",
  warranty: "Warranty & service",
  import: "Import practicality",
  fit: "Fit for this room",
};

export interface Option {
  id: string;
  tier: Tier;
  name: string;
  /** Total landed cost for the component's quantity, in rupees. */
  price: number;
  /** How the price is made up, in local currency where it matters. */
  priceNote: string;
  est?: boolean;
  buy: Buy;
  /** For `threshold`: import only if the saving beats this percentage. */
  threshold?: number;
  specs: [string, string][];
  /** What you would hear or see differently from the recommendation. */
  perf: string;
  importNote?: string;
  service?: string;
  attrs?: Partial<Record<Attr, string>>;
}

export interface Review {
  verdict: "agree" | "qualified" | "disagree";
  headline: string;
  right: string;
  overkill: string;
  under: string;
  better: string;
  premium: string;
  notice: string;
  elsewhere: string;
  integrator: string;
}

export const REVIEW_Q: [keyof Omit<Review, "verdict" | "headline">, string][] = [
  ["right", "Is this the right product for this room?"],
  ["overkill", "Is it overkill?"],
  ["under", "Is it underpowered?"],
  ["better", "Is there a materially better alternative?"],
  ["premium", "Is the price premium justified?"],
  ["notice", "Would you reliably hear or see the difference?"],
  ["elsewhere", "Is the money better spent elsewhere?"],
  ["integrator", "What would an experienced integrator challenge?"],
];

export type Group = "speakers" | "bass" | "picture" | "electronics" | "infrastructure";

export const GROUP_LABEL: Record<Group, string> = {
  speakers: "Speakers",
  bass: "Bass",
  picture: "Picture",
  electronics: "Electronics",
  infrastructure: "Infrastructure",
};

export interface Component {
  id: string;
  name: string;
  group: Group;
  qty: number;
  qtyLabel?: string;
  placement: string;
  why: string;
  upgrade: string;
  options: Option[];
  review: Review;
  /** Where it lives in the rack, if it does. */
  rack?: string;
}
