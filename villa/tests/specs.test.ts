import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SPECS, specFor, specLines, specProgress, WHEN_LABEL } from "@/lib/specs";
import { SPACES } from "@/lib/seed/spaces";
import { buildProject } from "@/lib/seed";
import { reducer } from "@/lib/reducer";
import { describe as describeAction } from "@/lib/journal";

describe("room specifications", () => {
  it("the home theatre carries one, filed against a real room", () => {
    const spec = specFor("sf-theatre")!;
    expect(spec).toBeDefined();
    expect(SPACES.some((s) => s.id === spec.spaceId)).toBe(true);
    for (const id of Object.keys(SPECS)) expect(SPACES.some((s) => s.id === id)).toBe(true);
  });

  it.each(Object.values(SPECS).map((s) => [s.spaceId, s] as const))("%s: every line is specific and checkable", (_id, spec) => {
    const lines = specLines(spec);
    const ids = lines.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(lines.length).toBeGreaterThanOrEqual(30);
    for (const l of lines) {
      expect(l.title.length).toBeGreaterThan(5);
      expect(l.spec.length).toBeGreaterThan(40);
      expect(WHEN_LABEL[l.when]).toBeTruthy();
    }
    expect(lines.filter((l) => l.critical).length).toBeGreaterThan(5);
    expect(spec.targets.length).toBeGreaterThan(4);
    expect(spec.context.join(" ")).toMatch(/monsoon/i);
  });

  it("names the Indian standards the materials are bought against", () => {
    const text = specLines(specFor("sf-theatre")!).map((l) => l.spec).join(" ");
    for (const std of ["IS 710", "IS 303", "IS 2095", "IS 8183", "IS 694", "IS 3043", "IS 6313", "IS 12640"]) {
      expect(text).toContain(std);
    }
  });

  it("ticks are saved on the room, journalled, and not-applicable lines leave the total", () => {
    const spec = specFor("sf-theatre")!;
    const p = buildProject();
    const before = specProgress(spec, p.spaces.find((s) => s.id === "sf-theatre")!.specChecks);
    expect(before.done).toBe(0);

    const tick = { type: "space/spec", id: "sf-theatre", key: "roof-wp", value: "done", label: "Roof waterproofed" } as const;
    const a = reducer(p, tick);
    expect(a.spaces.find((s) => s.id === "sf-theatre")!.specChecks).toEqual({ "roof-wp": "done" });
    expect(describeAction(p, tick).summary).toBe("Ticked off “Roof waterproofed” in the Home theatre specification");

    const b = reducer(a, { type: "space/spec", id: "sf-theatre", key: "iso-openings", value: "na" });
    const after = specProgress(spec, b.spaces.find((s) => s.id === "sf-theatre")!.specChecks);
    expect(after.done).toBe(1);
    expect(after.total).toBe(before.total - 1);

    const c = reducer(b, { type: "space/spec", id: "sf-theatre", key: "roof-wp" });
    expect(c.spaces.find((s) => s.id === "sf-theatre")!.specChecks).toEqual({ "iso-openings": "na" });
  });
});

describe("the specification on the page", () => {
  it("renders every line", async () => {
    const { SpecChecklist } = await import("@/components/SpecChecklist");
    const { ProjectProvider } = await import("@/lib/store");
    const { ToastProvider } = await import("@/components/ui");
    const spec = specFor("sf-theatre")!;
    const html = renderToStaticMarkup(
      React.createElement(ProjectProvider, null, React.createElement(ToastProvider, null, React.createElement(SpecChecklist, { spec }))),
    );
    expect((html.match(/role="checkbox"/g) ?? []).length).toBe(specLines(spec).length);
    expect(html).toContain("BWP (IS 710, marine)");
  });
});
