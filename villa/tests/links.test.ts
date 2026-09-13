import { describe, it, expect } from "vitest";
import { buildProject } from "@/lib/seed";
import { COLLECTION_KEYS, type CollectionKey } from "@/lib/reducer";
import { hrefFor, labelFor, relatedTo } from "@/lib/model/links";
import { SCHEMAS } from "@/lib/model/schema";

/**
 * Clickthroughs have to land somewhere real.
 *
 * A link that 404s is worse than no link, and the failure is invisible until
 * someone clicks it. These check that every kind of record resolves to a route
 * the app actually serves, and that the two awkward cases stay right: a scope
 * item opens in its room, and a house-wide item — which has no room — opens on
 * the BOQ instead.
 */

const state = buildProject();

/** The routes the app serves, from app/. */
const ROUTES = [
  "/", "/villa", "/design", "/decisions", "/timeline", "/costs", "/procurement",
  "/site", "/more", "/notes", "/documents", "/vendors", "/admin", "/manage",
  "/sheet", "/history",
];

const routeOf = (href: string) => href.split(/[?#]/)[0].replace(/\/$/, "") || "/";

describe("clickthroughs", () => {
  it("gives every kind of record somewhere to open, and it is a real route", () => {
    for (const on of COLLECTION_KEYS as readonly CollectionKey[]) {
      const rows = state[on] as unknown as { id: string }[];
      if (!rows.length) continue;
      const href = hrefFor(on, rows[0].id, state);
      // A comment has no page of its own — it lives inside whatever it is about.
      if (on === "comments") { expect(href).toBeUndefined(); continue; }
      expect(href, `${on} has no link`).toBeDefined();
      const base = routeOf(href!);
      const known = ROUTES.includes(base) || base.startsWith("/villa/");
      expect(known, `${on} links to ${href}, which is not a route`).toBe(true);
    }
  });

  it("opens a scope item in its own room, and a house-wide one on the BOQ", () => {
    const inRoom = state.items.find((i) => i.spaceId)!;
    expect(hrefFor("items", inRoom.id, state)).toBe(`/villa/${inRoom.spaceId}?item=${inRoom.id}`);
    const houseWide = state.items.find((i) => !i.spaceId)!;
    expect(houseWide, "the seed should contain house-wide scope").toBeDefined();
    expect(hrefFor("items", houseWide.id, state)).toBe(`/costs?item=${houseWide.id}`);
  });

  it("never links to a record that has been deleted", () => {
    expect(hrefFor("vendors", "nope", state)).toBeUndefined();
    expect(labelFor("vendors", "nope", state)).toBeUndefined();
  });

  it("names every record the way its own screen names it", () => {
    for (const on of COLLECTION_KEYS as readonly CollectionKey[]) {
      const rows = state[on] as unknown as Record<string, unknown>[];
      if (!rows.length) continue;
      const label = labelFor(on, String(rows[0].id), state);
      expect(label, `${on} has no name`).toBeTruthy();
      expect(label).toBe(SCHEMAS[on].title(rows[0], state));
    }
  });

  it("finds the neighbourhood of a record, so nothing is an island", () => {
    const item = state.items.find((i) => state.ideas.some((x) => x.scopeItemId === i.id))!;
    const rel = relatedTo("items", item.id, state);
    expect(rel.some((r) => r.on === "ideas" && r.ids.length)).toBe(true);

    const vendor = state.vendors.find((v) => state.quotations.some((q) => q.vendorId === v.id))!;
    expect(relatedTo("vendors", vendor.id, state).some((r) => r.on === "quotations")).toBe(true);

    const space = state.spaces.find((s) => state.items.some((i) => i.spaceId === s.id))!;
    expect(relatedTo("spaces", space.id, state).some((r) => r.on === "items")).toBe(true);
  });

  it("every collection can be created, edited and deleted from its schema", () => {
    for (const on of COLLECTION_KEYS as readonly CollectionKey[]) {
      const schema = SCHEMAS[on];
      expect(schema, `${on} has no schema, so nothing can edit it`).toBeDefined();
      expect(schema.fields.length, `${on} has no editable fields`).toBeGreaterThan(0);
      // A blank row always carries an id — some collections shape their own,
      // which is why nothing downstream is allowed to overwrite it.
      const blank = schema.blank({ id: "x", me: "Tester", state });
      expect(String(blank.id), `${on} mints no id`).toContain("x");
      expect(schema.title(blank, state), `${on} cannot name a new row`).toBeTruthy();
    }
  });
});
