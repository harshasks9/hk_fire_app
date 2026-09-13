import type { CategoryDef, CategoryGroup, ProjectState, Space, CostBuildUp } from "./types";
import { CATEGORY_LABEL } from "./types";
import { DEFAULT_RATES, areaSqft, wallAreaSqft, perimeterFt, round } from "./costing";

/**
 * The built-in rate card.
 *
 * Composed from the category labels, the indicative rates and the typical lead
 * times, which used to live in three different files. A project seeds its own
 * copy from this and then owns it — an admin can change a rate, rename a trade
 * or add one the villa needs, without touching code.
 */

const GROUP: Record<string, CategoryGroup> = {
  civil: "shell", waterproofing: "shell", windows: "shell", staircase: "shell",
  flooring: "finishes", stone: "finishes", ceiling: "finishes", paint: "finishes",
  "wall-finish": "finishes", glass: "finishes",
  doors: "joinery", hardware: "joinery", carpentry: "joinery", wardrobe: "joinery",
  kitchen: "joinery", bathroom: "joinery", "loose-furniture": "joinery",
  "bespoke-furniture": "joinery",
  sanitaryware: "mep", lighting: "mep", electrical: "mep", plumbing: "mep",
  hvac: "mep", fans: "mep",
  "soft-furnishing": "furnishing", curtains: "furnishing", rugs: "furnishing",
  art: "furnishing", accessories: "furnishing", styling: "furnishing",
  landscape: "outdoor", facade: "outdoor",
  automation: "systems", networking: "systems", security: "systems", av: "systems",
  appliances: "systems", elevator: "systems", "power-backup": "systems",
  water: "systems", safety: "systems",
  cleaning: "handover", handover: "handover",
};

/** Typical order-to-delivery time. At or above 8 weeks an item is long-lead. */
export const LEAD_WEEKS: Record<string, number> = {
  stone: 9, wardrobe: 10, kitchen: 12, "bespoke-furniture": 10, carpentry: 8,
  "loose-furniture": 9, sanitaryware: 8, lighting: 7, curtains: 6, glass: 4,
  av: 10, elevator: 14, automation: 8, appliances: 6, doors: 8, hvac: 4,
};

export const BUILTIN_CATEGORIES: CategoryDef[] = Object.entries(CATEGORY_LABEL).map(([id, label]) => {
  const r = DEFAULT_RATES[id];
  return {
    id,
    label,
    group: GROUP[id] ?? "systems",
    rate: r?.rate,
    unit: r?.unit,
    wastagePct: r?.wastagePct,
    labourRate: r?.labourRate,
    installationPct: r?.installationPct,
    freight: r?.freight,
    taxPct: r?.taxPct ?? 18,
    basis: r?.basis,
    leadTimeWeeks: LEAD_WEEKS[id],
    assumption: r?.assumption,
  };
});

/* ------------------------------------------------------------- lookups */

export function catDef(state: ProjectState, id?: string): CategoryDef | undefined {
  if (!id) return undefined;
  return state.categories.find((c) => c.id === id);
}

/** Never render a raw id at the user. Fall back to a readable form of it. */
export function catLabel(state: ProjectState, id?: string): string {
  if (!id) return "—";
  return catDef(state, id)?.label ?? CATEGORY_LABEL[id as keyof typeof CATEGORY_LABEL] ?? id.replace(/-/g, " ");
}

/** Categories offered in pickers: live ones, grouped, alphabetical within a group. */
export function activeCategories(state: ProjectState): CategoryDef[] {
  return state.categories.filter((c) => !c.archived);
}

export function categoryOptions(state: ProjectState): { value: string; label: string }[] {
  return activeCategories(state)
    .slice()
    .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
    .map((c) => ({ value: c.id, label: c.label }));
}

export function groupedCategories(state: ProjectState): { group: CategoryGroup; items: CategoryDef[] }[] {
  const by = new Map<CategoryGroup, CategoryDef[]>();
  for (const c of state.categories) {
    const arr = by.get(c.group) ?? [];
    arr.push(c);
    by.set(c.group, arr);
  }
  return Array.from(by.entries())
    .map(([group, items]) => ({ group, items: items.sort((a, b) => a.label.localeCompare(b.label)) }));
}

/** How many scope items would be affected by changing or removing a category. */
export function categoryUsage(state: ProjectState, id: string): number {
  return state.items.filter((i) => i.category === id).length;
}


/**
 * A starting cost build-up for a category, read from THIS project's rate card.
 *
 * The difference from the built-in defaults matters: if an admin edits the
 * flooring rate, every item created afterwards has to pick that up, or the
 * rate card is decoration.
 */
export function buildUpFromCategory(
  state: ProjectState,
  categoryId: string,
  space?: Space,
  qtyOverride?: number,
): CostBuildUp {
  const def = catDef(state, categoryId);
  const ceiling = space?.ceilingHeightFt ?? 10;
  let qty = qtyOverride;
  if (qty === undefined && space?.dims) {
    if (def?.basis === "floor-area") qty = areaSqft(space.dims);
    else if (def?.basis === "wall-area") qty = wallAreaSqft(space.dims, ceiling);
    else if (def?.basis === "perimeter") qty = perimeterFt(space.dims);
  }
  return {
    qty: round(qty ?? 1, 1),
    unit: def?.unit ?? "ls",
    rate: def?.rate ?? 0,
    wastagePct: def?.wastagePct,
    labourRate: def?.labourRate,
    installationPct: def?.installationPct,
    freight: def?.freight,
    taxPct: def?.taxPct ?? 18,
    assumption: def?.assumption,
  };
}
