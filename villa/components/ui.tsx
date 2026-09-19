"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Stage, Category, Severity, SnagStatus, ProcurementStatus } from "@/lib/model/types";
import { STAGE_LABEL } from "@/lib/model/types";
import { inr } from "@/lib/model/costing";

/* --------------------------------------------------------------- typography */

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}

export function PageTitle({
  title, sub, right,
}: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-[26px] sm:text-[32px] leading-[1.15] text-ink">{title}</h1>
        {sub && <p className="text-[13.5px] text-ink-3 mt-1.5 max-w-2xl leading-relaxed">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-wrap">{right}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- money */

export function Money({
  value, compact, className = "", blank = "—",
}: { value?: number; compact?: boolean; className?: string; blank?: string }) {
  return <span className={`tnum ${className}`}>{inr(value, { compact, blank })}</span>;
}

/**
 * Any figure that is an assumption rather than a quotation is rendered with a
 * dotted underline and says so on hover. The product must never let an
 * indicative rate pass for a real price.
 */
export function Assumed({
  children, note = "An editable assumption, not a quotation.",
}: { children: React.ReactNode; note?: string }) {
  return (
    <span
      title={note}
      className="underline decoration-dotted decoration-ink-4 underline-offset-[3px] cursor-help"
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- chips */

const STAGE_TONE: Record<Stage, [string, string]> = {
  "not-started": ["#f1ede7", "#857b70"],
  idea: ["#f5ecd8", "#8a6a20"],
  options: ["#f5ecd8", "#8a6a20"],
  estimated: ["#e5e9ed", "#4c5763"],
  discussion: ["#f2e2d9", "#9c5333"],
  decided: ["#e5e9ed", "#42505e"],
  approved: ["#e4ebe2", "#41603f"],
  boq: ["#e4ebe2", "#41603f"],
  quoted: ["#e5e9ed", "#42505e"],
  ordered: ["#e4ebe2", "#41603f"],
  "in-transit": ["#e4ebe2", "#41603f"],
  delivered: ["#e4ebe2", "#41603f"],
  installed: ["#dfe8dd", "#35522f"],
  inspected: ["#dfe8dd", "#35522f"],
  snagged: ["#f6e1dc", "#8d3a2c"],
  complete: ["#dbe6d8", "#2f4a2a"],
  "not-applicable": ["#f4f1ec", "#a2988c"],
};

export function StageChip({ stage, small }: { stage: Stage; small?: boolean }) {
  const [bg, fg] = STAGE_TONE[stage];
  return (
    <span className="chip" style={{ background: bg, color: fg, fontSize: small ? 10.5 : 11.5 }}>
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function Chip({
  children, tone = "neutral", title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "clay" | "sage" | "ochre" | "rust" | "slate" | "ghost";
  title?: string;
}) {
  const tones: Record<string, [string, string]> = {
    neutral: ["#f1ede7", "#514941"],
    clay: ["#f2e2d9", "#9c5333"],
    sage: ["#e4ebe2", "#41603f"],
    ochre: ["#f5ecd8", "#8a6a20"],
    rust: ["#f6e1dc", "#8d3a2c"],
    slate: ["#e5e9ed", "#4c5763"],
    ghost: ["transparent", "#857b70"],
  };
  const [bg, fg] = tones[tone];
  return (
    <span className="chip" style={{ background: bg, color: fg, borderColor: tone === "ghost" ? "#e3ddd3" : "transparent" }} title={title}>
      {children}
    </span>
  );
}

export const SEVERITY_TONE: Record<Severity, "sage" | "ochre" | "clay" | "rust"> = {
  low: "sage", medium: "ochre", high: "clay", critical: "rust",
};

export const SNAG_TONE: Record<SnagStatus, "rust" | "ochre" | "slate" | "clay" | "sage"> = {
  open: "rust", assigned: "ochre", fixed: "slate", verify: "clay", closed: "sage",
};

export const PROC_LABEL: Record<ProcurementStatus, string> = {
  "to-select": "To select", selected: "Selected", "quote-requested": "Quote requested",
  approved: "Approved", ordered: "Ordered", "in-transit": "In transit",
  delivered: "Delivered", installed: "Installed", verified: "Verified",
};

/* ------------------------------------------------------------------- stats */

export function Stat({
  label, value, sub, tone, hint, large,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  tone?: "sage" | "rust" | "ochre" | "clay"; hint?: string; large?: boolean;
}) {
  const color = tone === "sage" ? "#41603f" : tone === "rust" ? "#8d3a2c" : tone === "ochre" ? "#8a6a20" : tone === "clay" ? "#9c5333" : undefined;
  return (
    <div title={hint}>
      <Eyebrow>{label}</Eyebrow>
      <div
        className={`tnum mt-1.5 ${large ? "text-[27px]" : "text-[20px]"} leading-none`}
        style={{ color, fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-ink-3 mt-1.5 leading-snug">{sub}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- progress */

export function Bar({
  pct, tone = "#5f7a5f", height = 6, track = "#ece7df",
}: { pct: number; tone?: string; height?: number; track?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: track }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: tone }}
      />
    </div>
  );
}

/** A budget bar that shows paid, committed and forecast as one stacked read. */
export function BudgetBar({
  paid, committed, forecast, budget,
}: { paid: number; committed: number; forecast: number; budget: number }) {
  const scale = Math.max(budget, forecast, 1);
  const p = (paid / scale) * 100;
  const c = (Math.max(0, committed - paid) / scale) * 100;
  const f = (Math.max(0, forecast - Math.max(committed, paid)) / scale) * 100;
  const over = forecast > budget;
  return (
    <div>
      <div className="flex h-[7px] w-full rounded-full overflow-hidden bg-paper-3">
        <div style={{ width: `${p}%`, background: "#41603f" }} title={`Paid ${inr(paid)}`} />
        <div style={{ width: `${c}%`, background: "#7d9a7a" }} title={`Committed, unpaid ${inr(Math.max(0, committed - paid))}`} />
        <div style={{ width: `${f}%`, background: over ? "#d3a08f" : "#c8c0b2" }} title={`Forecast, uncommitted ${inr(Math.max(0, forecast - Math.max(committed, paid)))}`} />
      </div>
      {budget > 0 && forecast > budget && (
        <div
          className="relative"
          style={{ marginTop: -7, height: 7, pointerEvents: "none" }}
          title={`Approved budget ${inr(budget)}`}
        >
          <div style={{ position: "absolute", left: `${(budget / scale) * 100}%`, top: -2, width: 2, height: 11, background: "#241f1a" }} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- sheet */

export function Sheet({
  open, onClose, title, children, wide,
}: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${wide ? "sm:max-w-4xl" : "sm:max-w-xl"} bg-paper sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto thin-scroll animate-sheet shadow-2xl`}
      >
        {title && (
          <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between gap-3">
            <div className="min-w-0 text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{title}</div>
            <button onClick={onClose} className="btn btn-sm shrink-0" aria-label="Close">Close</button>
          </div>
        )}
        <div className="px-5 sm:px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- tabs */

export function Tabs<T extends string>({
  tabs, active, onChange, counts,
}: { tabs: readonly T[]; active: T; onChange: (t: T) => void; counts?: Partial<Record<T, number>> }) {
  return (
    <div className="flex gap-1 overflow-x-auto thin-scroll -mx-1 px-1 pb-1" role="tablist">
      {tabs.map((t) => {
        const on = t === active;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              background: on ? "var(--color-ink)" : "transparent",
              color: on ? "var(--color-paper)" : "var(--color-ink-2)",
            }}
          >
            {t}
            {counts?.[t] !== undefined && (
              <span className="ml-1.5 tnum text-[11px] opacity-65">{counts[t]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ misc */

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-quiet px-5 py-8 text-center">
      <div className="text-[14px] text-ink-2">{title}</div>
      {hint && <div className="text-[12.5px] text-ink-3 mt-1.5 max-w-md mx-auto leading-relaxed">{hint}</div>}
    </div>
  );
}

export function Swatch({ colors, size = 18 }: { colors: string[]; size?: number }) {
  return (
    <div className="flex -space-x-1">
      {colors.slice(0, 4).map((c, i) => (
        <span
          key={i}
          className="rounded-full ring-2 ring-white"
          style={{ background: c, width: size, height: size, display: "inline-block" }}
        />
      ))}
    </div>
  );
}

/** A generated stand-in for a photo, so the prototype reads visually without stock imagery. */
export function PhotoBlock({
  tone = "#cfc4b3", label, ratio = "4 / 3", className = "", children,
}: { tone?: string; label?: string; ratio?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-line ${className}`}
      style={{
        aspectRatio: ratio,
        background: `linear-gradient(150deg, ${tone} 0%, color-mix(in srgb, ${tone} 72%, #ffffff) 52%, color-mix(in srgb, ${tone} 88%, #000000) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{ backgroundImage: "repeating-linear-gradient(52deg, #000 0 1px, transparent 1px 7px)" }}
      />
      {label && (
        <div className="absolute left-2.5 bottom-2 text-[10.5px] text-white/90 font-medium drop-shadow">{label}</div>
      )}
      {children}
    </div>
  );
}

export function Avatar({ name, tone, size = 26 }: { name: string; tone?: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-medium shrink-0"
      style={{ width: size, height: size, background: tone ?? "#857b70", fontSize: size * 0.38 }}
      title={name}
    >
      {initials}
    </span>
  );
}

export function Field({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div className="eyebrow mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-ink-3 mt-1 leading-snug">{hint}</div>}
    </label>
  );
}

/** A number input that never shows a leading zero and reports numbers, not strings. */
export function NumberInput({
  value, onChange, prefix, suffix, step = 1, className = "",
}: { value: number | undefined; onChange: (n: number) => void; prefix?: string; suffix?: string; step?: number; className?: string }) {
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const lastProp = useRef(value);
  useEffect(() => {
    if (lastProp.current !== value) {
      lastProp.current = value;
      setText(value === undefined ? "" : String(value));
    }
  }, [value]);
  return (
    <div className={`flex items-center gap-1.5 input ${className}`} style={{ padding: "6px 10px" }}>
      {prefix && <span className="text-ink-3 text-[12.5px]">{prefix}</span>}
      <input
        className="w-full bg-transparent outline-none tnum text-[13.5px]"
        inputMode="decimal"
        step={step}
        value={text}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          const n = parseFloat(t);
          if (!Number.isNaN(n)) { lastProp.current = n; onChange(n); }
          else if (t === "") { lastProp.current = 0; onChange(0); }
        }}
      />
      {suffix && <span className="text-ink-3 text-[12px] shrink-0">{suffix}</span>}
    </div>
  );
}

export function fmtDate(d?: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...opts });
}

export function fmtDay(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function relative(d: string | Date): string {
  const diff = Math.round((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff < 0) return `${-diff} days ago`;
  return `in ${diff} days`;
}
