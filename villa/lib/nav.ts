import type { Role } from "./model/types";

/**
 * Where everything lives.
 *
 * One map of the app, grouped the way the work is: the house itself, planning
 * it, paying for it, and building it. The sidebar, the phone menu and every
 * page's heading read from here, so a screen can never be reachable on one
 * device and lost on another.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** One line on the phone menu and in search, saying what the page is for. */
  blurb: string;
  /** Contractors see a narrower app: only what concerns the work. */
  vendor?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const HOME: NavItem = { href: "/", label: "Home", icon: "home", blurb: "What needs you today.", vendor: true };

export const NAV: NavGroup[] = [
  {
    id: "house", label: "House", items: [
      { href: "/villa", label: "Rooms", icon: "villa", blurb: "Every room, floor by floor, with its plan and scope.", vendor: true },
      { href: "/design", label: "Design", icon: "design", blurb: "Layouts, moodboards, options and client feedback." },
      { href: "/villa/drawings", label: "Drawings", icon: "drawings", blurb: "The architect's issued plans and elevation.", vendor: true },
    ],
  },
  {
    id: "plan", label: "Plan", items: [
      { href: "/checklist", label: "Checklist", icon: "checklist", blurb: "Every line a good designer works through, room by room.", vendor: true },
      { href: "/decisions", label: "Decisions", icon: "decisions", blurb: "Choices waiting on you, and everything already settled." },
      { href: "/phases", label: "Phases", icon: "phases", blurb: "Twelve phases in the order a fit-out runs." },
      { href: "/timeline", label: "Timeline", icon: "timeline", blurb: "Tasks, dependencies and the critical path to handover.", vendor: true },
      { href: "/more/completeness", label: "Gaps", icon: "alert", blurb: "Not what has been entered — what has not yet been thought about." },
    ],
  },
  {
    id: "money", label: "Money", items: [
      { href: "/costs", label: "Costs", icon: "costs", blurb: "Budget, forecast, committed and paid — kept apart." },
      { href: "/purchases", label: "Purchase list", icon: "buy", blurb: "What has to be ordered, and by when." },
      { href: "/procurement", label: "Procurement", icon: "procurement", blurb: "Selected, ordered, delivered, installed." },
      { href: "/vendors", label: "Vendors", icon: "vendors", blurb: "Suppliers, contractors and quote comparison." },
    ],
  },
  {
    id: "site", label: "On site", items: [
      { href: "/site", label: "Site", icon: "site", blurb: "Photos, snags, notes and progress, room by room.", vendor: true },
      { href: "/notes", label: "Notes", icon: "notes", blurb: "Meetings, calls and measurements, tagged to what they touch.", vendor: true },
      { href: "/documents", label: "Documents", icon: "documents", blurb: "Drawings, quotes, POs, invoices and warranties.", vendor: true },
    ],
  },
  {
    id: "project", label: "Project", items: [
      { href: "/sheet", label: "Sheet", icon: "sheet", blurb: "One room's scope as a spreadsheet. Paste from Excel." },
      { href: "/manage", label: "Manage", icon: "manage", blurb: "Create, edit and delete anything, floor by floor." },
      { href: "/history", label: "History", icon: "history", blurb: "Every change, who made it, and restoring to any point." },
      { href: "/admin", label: "Settings", icon: "admin", blurb: "People, categories and rates, backup and reset." },
    ],
  },
];

/** Pages that are not in the menu but still belong to a group, for their headings. */
const EXTRA: Record<string, string> = {
  "/more": "",
};

export function navFor(role: Role): NavGroup[] {
  if (role !== "vendor") return NAV;
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.vendor) })).filter((g) => g.items.length);
}

/** The group a path belongs to, for the label above its title. */
export function groupOf(pathname: string): NavGroup | undefined {
  if (pathname in EXTRA) return NAV.find((g) => g.id === EXTRA[pathname]);
  let best: { g: NavGroup; len: number } | undefined;
  for (const g of NAV) for (const i of g.items) {
    if (pathname === i.href || pathname.startsWith(i.href + "/")) {
      if (!best || i.href.length > best.len) best = { g, len: i.href.length };
    }
  }
  return best?.g;
}

/** The single nav entry a path lights up — the longest match wins, so /villa/drawings is not also /villa. */
export function activeHref(pathname: string, role: Role): string | undefined {
  if (pathname === "/") return "/";
  let best: string | undefined;
  for (const g of navFor(role)) for (const i of g.items) {
    if ((pathname === i.href || pathname.startsWith(i.href + "/")) && (!best || i.href.length > best.length)) best = i.href;
  }
  return best;
}

/** Phone tab bar: four places people go every day, and the menu for the rest. */
export const MOBILE_TABS = ["/", "/villa", "/checklist", "/site"];
