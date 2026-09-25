/**
 * A room's material specification, written as a checklist.
 *
 * Each line says what to use (grade, thickness, density, standard), why it
 * matters here rather than in a catalogue, how to check it on site, and what
 * not to accept in its place. Ticks live on the room (`Space.specChecks`) so
 * they are shared, journalled and restorable like everything else.
 */

export type SpecWhen = "design" | "civil" | "before-ceiling" | "purchase" | "handover";

export const WHEN_LABEL: Record<SpecWhen, string> = {
  design: "At design",
  civil: "Before civil work closes",
  "before-ceiling": "Before the ceiling closes",
  purchase: "When buying",
  handover: "At hand-over",
};

export interface SpecLine {
  id: string;
  title: string;
  /** What to use — material, grade, thickness, density, rating, standard. */
  spec: string;
  /** Why it matters in this climate, on this supply, in this market. */
  india?: string;
  /** How to check it on site or on paper before signing it off. */
  verify?: string;
  /** The substitution to refuse. */
  avoid?: string;
  critical?: boolean;
  when: SpecWhen;
}

export interface SpecSection {
  id: string;
  title: string;
  blurb: string;
  lines: SpecLine[];
}

export interface RoomSpec {
  spaceId: string;
  title: string;
  intro: string;
  /** The conditions the spec is written for. */
  context: string[];
  /** Measurable targets the finished room has to meet. */
  targets: { k: string; v: string }[];
  sections: SpecSection[];
  /** What this spec is not. */
  caveat: string;
}
