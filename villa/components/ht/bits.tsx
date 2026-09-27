"use client";

import React from "react";
import type { Group, Review, Tier } from "@/lib/ht/types";
import { TIER_LABEL } from "@/lib/ht/types";

export const GROUP_COLOR: Record<Group, string> = {
  speakers: "var(--g-speakers)",
  bass: "var(--g-bass)",
  picture: "var(--g-picture)",
  electronics: "var(--g-electronics)",
  infrastructure: "var(--g-infrastructure)",
};

export const VERDICT_LABEL: Record<Review["verdict"], string> = {
  agree: "Evaluator agrees",
  qualified: "Agrees, with conditions",
  disagree: "Evaluator disagrees",
};

export function Verdict({ v, short }: { v: Review["verdict"]; short?: boolean }) {
  const label = short ? { agree: "Agrees", qualified: "Qualified", disagree: "Disagrees" }[v] : VERDICT_LABEL[v];
  return <span className={`verdict v-${v}`}>{label}</span>;
}

export function TierTag({ tier }: { tier: Tier }) {
  return <span className={`tier tier-${tier}`}>{TIER_LABEL[tier]}</span>;
}

export function Est({ on }: { on?: boolean }) {
  if (!on) return null;
  return <span className="t3 text-[11px] mono ml-1" title="Estimate — confirm before paying">est.</span>;
}

/** An SVG group that behaves like a button. */
export function Hit({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <g
      role="button" tabIndex={0} aria-label={label} className={`hit ${className}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <title>{label}</title>
      {children}
    </g>
  );
}

export function Section({ eyebrow, title, sub, right, children, className = "" }: {
  eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`mb-12 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div className="max-w-3xl">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.01em] leading-tight">{title}</h2>
          {sub && <p className="t2 text-[14.5px] leading-relaxed mt-2">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Toggles<T extends string>({ items, on, set }: { items: { id: T; label: string; color?: string }[]; on: Record<T, boolean>; set: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Layers">
      {items.map((i) => (
        <button key={i.id} className="toggle" aria-pressed={on[i.id]} onClick={() => set(i.id)} style={{ color: on[i.id] ? i.color ?? undefined : undefined }}>
          <span className="dot" style={{ background: i.color }} />
          <span style={{ color: on[i.id] ? "var(--text)" : undefined }}>{i.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}
