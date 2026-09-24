import type { ProjectState, Role } from "./types";

/**
 * Which rooms the person using the app sees.
 *
 * A contractor with rooms assigned under Admin → People sees only those rooms,
 * and the bathrooms and walk-ins that belong to them. Everyone else, and any
 * contractor without assigned rooms, sees the whole villa.
 *
 * This is a lens, not a lock: the app has one shared password, so it keeps a
 * contractor's view focused rather than keeping anything secret.
 */
export function roomLens(state: ProjectState, role: Role, meId?: string): (spaceId?: string) => boolean {
  if (role !== "vendor") return () => true;
  const person = state.people.find((p) => p.id === meId);
  const ids = (person?.spaceIds ?? []).map((s) => s.trim()).filter(Boolean);
  if (!ids.length) return () => true;
  const allowed = new Set(ids);
  for (const s of state.spaces) if (s.parentId && allowed.has(s.parentId)) allowed.add(s.id);
  return (spaceId?: string) => !!spaceId && allowed.has(spaceId);
}
