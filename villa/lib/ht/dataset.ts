import type { Component } from "./types";
import type { Marker } from "./geometry";
import type { RackUnit, FlowNode, FlowEdge, Scenario, MarketPrice } from "./system";
import type { Study } from "./pareto";

/**
 * Everything one Home Theater Room app shows, in one object, so the same
 * screens can present different systems: /ht (the original recommendation)
 * and /ht2 (the India-sourced, under-₹30 L rerun).
 */

export interface Kpi { k: string; v: string; sub: string; accent?: boolean }
export interface ImpactRow { k: string; before: string; after: string; note: string }
export interface HeadCopy { eyebrow: string; title: string; sub: string }

/** An assumption tested from first principles. */
export interface Assumption {
  id: string;
  area: string;
  claim: string;
  verdict: "kept" | "changed" | "rejected";
  reasoning: string;
  numbers?: string;
}

export interface HtDataset {
  key: string;
  basePath: string;
  title: string;
  /** Under the title in the header. */
  tagline: string;
  hero: { eyebrow: string; lead: string; accent: string; tail: string; body: string; kpis: Kpi[] };
  catalog: Component[];
  markers: Marker[];
  rack: RackUnit[];
  rackUnits: number;
  upsCapacity: number;
  projectorWatts: [number, number];
  flows: { audio: { nodes: FlowNode[]; edges: FlowEdge[] }; video: { nodes: FlowNode[]; edges: FlowEdge[] } };
  flowNotes: { title: string; body: string }[];
  chains: { t: string; steps: [string, string][] }[];
  impact: ImpactRow[];
  scenarios: Scenario[];
  lowReturn: { component: string; move: string; delta: string; why: string }[];
  rebalance?: { cut: { component: string; move: string; delta: number }[]; add: { component: string; move: string; delta: number }[]; note: string };
  importRules: { k: string; v: string }[];
  marketPrices: Record<string, MarketPrice[]>;
  doNotImport: { component: string; what: string; why: string }[];
  opportunistic: Partial<Record<string, string>>;
  studies: Study[];
  heads: Record<string, HeadCopy>;
  /** Show the add-ons planner (small upgrades to the recommended room). */
  addons?: boolean;
  /** Extra tabs, e.g. the assumptions audit on /ht2. */
  assumptions?: Assumption[];
  budgetCap?: number;
  /** Money held back inside the cap for prices that are still estimates. */
  contingency?: number;
  /**
   * A treatment spec that replaces the original drawing (absorption, hybrid
   * slotted oak, diffusion, ceiling clouds) with thick absorbers only.
   */
  acoustics?: { target: string; legend: [string, string][] };
  /** What the budget total includes and excludes. */
  budgetNote?: string;
  footer: string;
  compareDefault: { component: string; ids: string[] };
  backLink: { href: string; label: string };
}
