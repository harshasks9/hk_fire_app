"use client";

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Stage, Severity, SnagStatus, ProcurementStatus } from "@/lib/model/types";
import { STAGE_LABEL } from "@/lib/model/types";
import { inr } from "@/lib/model/costing";
import { groupOf } from "@/lib/nav";
import { Icon } from "./Icon";

/* --------------------------------------------------------------- typography */

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}

/**
 * Every page opens the same way: where you are, what this is, and the one or
 * two things you can do from here. The label above the title is the menu
 * group, so the page says where it sits without a breadcrumb trail.
 */
export function PageTitle({
  title, sub, right, eyebrow, back,
}: {
  title: string; sub?: React.ReactNode; right?: React.ReactNode;
  /** Replaces the menu group above the title — a breadcrumb for pages deeper in. */
  eyebrow?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  const pathname = usePathname() ?? "/";
  const group = groupOf(pathname);
  useEffect(() => {
    document.title = pathname === "/" ? "Villa 14" : `${title} · Villa 14`;
  }, [title, pathname]);
  const label = eyebrow ?? group?.label;
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-7">
      <div className="min-w-0 max-w-3xl">
        {back ? (
          <Link href={back.href} className="eyebrow inline-flex items-center gap-1 hover:text-ink mb-2">
            <Icon name="arrow-left" size={13} strokeWidth={1.8} /> {back.label}
          </Link>
        ) : label ? (
          <div className="eyebrow mb-2">{label}</div>
        ) : null}
        <h1 className="text-[28px] sm:text-[34px] leading-[1.08] text-ink">{title}</h1>
        {sub && <p className="text-[15px] text-ink-3 mt-2 leading-relaxed max-w-2xl">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-wrap">{right}</div>}
    </header>
  );
}

/** A titled block within a page, with an optional link to see more. */
export function Section({
  title, action, children, className = "", id,
}: { title: React.ReactNode; action?: { href: string; label: string } | React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  const isLink = !!action && typeof action === "object" && !React.isValidElement(action) && "href" in (action as object);
  return (
    <section className={`mb-10 ${className}`} id={id}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-[17px] leading-tight">{title}</h2>
        {isLink ? (
          <Link href={(action as { href: string }).href} className="link text-[13.5px] inline-flex items-center gap-1">
            {(action as { label: string }).label} <Icon name="arrow-right" size={14} />
          </Link>
        ) : (action as React.ReactNode)}
      </div>
      {children}
    </section>
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
    <span title={note} className="underline decoration-dotted decoration-ink-4 underline-offset-[3px] cursor-help">
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- chips */

export type Tone = "neutral" | "accent" | "good" | "warn" | "bad" | "info" | "ghost";

/** Background and text for each tone, from the palette. */
export const TONE: Record<Tone, [string, string]> = {
  neutral: ["var(--color-paper-2)", "var(--color-ink-2)"],
  accent: ["var(--color-accent-soft)", "var(--color-accent-strong)"],
  good: ["var(--color-good-soft)", "var(--color-good)"],
  warn: ["var(--color-warn-soft)", "var(--color-warn)"],
  bad: ["var(--color-bad-soft)", "var(--color-bad)"],
  info: ["var(--color-info-soft)", "var(--color-info)"],
  ghost: ["transparent", "var(--color-ink-3)"],
};

/** The text colour for a tone, for figures and dots. */
export const toneInk = (t?: Tone | string) => (t && t in TONE ? TONE[t as Tone][1] : undefined);

const STAGE_TONE: Record<Stage, Tone> = {
  "not-started": "neutral", idea: "warn", options: "warn", estimated: "info", discussion: "accent",
  decided: "info", approved: "good", boq: "good", quoted: "info", ordered: "good", "in-transit": "good",
  delivered: "good", installed: "good", inspected: "good", snagged: "bad", complete: "good",
  "not-applicable": "ghost",
};

export function StageChip({ stage, small }: { stage: Stage; small?: boolean }) {
  return <Chip tone={STAGE_TONE[stage]} small={small}>{STAGE_LABEL[stage]}</Chip>;
}

export function Chip({
  children, tone = "neutral", title, small, dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  title?: string;
  small?: boolean;
  /** A leading dot — status read at a glance. */
  dot?: boolean;
}) {
  const [bg, fg] = TONE[tone] ?? TONE.neutral;
  return (
    <span
      className="chip"
      style={{ background: bg, color: fg, borderColor: tone === "ghost" ? "var(--color-line-2)" : "transparent", fontSize: small ? 12 : undefined, padding: small ? "1px 8px" : undefined }}
      title={title}
    >
      {dot && <span className="rounded-full" style={{ width: 6, height: 6, background: fg }} />}
      {children}
    </span>
  );
}

export const SEVERITY_TONE: Record<Severity, "good" | "warn" | "accent" | "bad"> = {
  low: "good", medium: "warn", high: "accent", critical: "bad",
};

export const SNAG_TONE: Record<SnagStatus, "bad" | "warn" | "info" | "accent" | "good"> = {
  open: "bad", assigned: "warn", fixed: "info", verify: "accent", closed: "good",
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
  tone?: "good" | "bad" | "warn" | "accent"; hint?: string; large?: boolean;
}) {
  return (
    <div title={hint} className="min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <div
        className={`mt-2 ${large ? "text-[30px]" : "text-[22px]"} leading-none font-semibold tracking-[-0.02em]`}
        style={{ color: toneInk(tone), fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {sub && <div className="text-[13px] text-ink-3 mt-1.5 leading-snug">{sub}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- progress */

export function Bar({
  pct, tone = "var(--color-good)", height = 6, track = "var(--color-paper-3)", label,
}: { pct: number; tone?: string; height?: number; track?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="w-full rounded-full overflow-hidden" style={{ height, background: track }}
      role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${v}%`, background: tone }} />
    </div>
  );
}

/** The budget bar's colours, for legends drawn next to it. */
export const BAR = { paid: "#3d6a4c", committed: "#8fb096", forecast: "#cbc5b8", over: "#d9a497", budget: "#1b211e" };

/** A budget bar that shows paid, committed and forecast as one stacked read. */
export function BudgetBar({
  paid, committed, forecast, budget,
}: { paid: number; committed: number; forecast: number; budget: number }) {
  const scale = Math.max(budget, forecast, 1);
  const p = (paid / scale) * 100;
  const c = (Math.max(0, committed - paid) / scale) * 100;
  const f = (Math.max(0, forecast - Math.max(committed, paid)) / scale) * 100;
  const over = budget > 0 && forecast > budget;
  return (
    <div
      className="relative" role="img"
      aria-label={`Paid ${inr(paid)}, committed ${inr(committed)}, forecast ${inr(forecast)}${budget ? `, budget ${inr(budget)}` : ""}`}
    >
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-paper-3 gap-px">
        <div style={{ width: `${p}%`, background: BAR.paid }} title={`Paid ${inr(paid)}`} />
        <div style={{ width: `${c}%`, background: BAR.committed }} title={`Committed, unpaid ${inr(Math.max(0, committed - paid))}`} />
        <div style={{ width: `${f}%`, background: over ? BAR.over : BAR.forecast }} title={`Forecast, uncommitted ${inr(Math.max(0, forecast - Math.max(committed, paid)))}`} />
      </div>
      {budget > 0 && (
        <div
          className="absolute -top-1 w-[2px] h-4 rounded-full bg-ink"
          style={{ left: `calc(${Math.min(100, (budget / scale) * 100)}% - 1px)` }}
          title={`Approved budget ${inr(budget)}`}
        />
      )}
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded-full shrink-0" style={{ width: 8, height: 8, background: color }} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ dialog */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The one dialog. A sheet from the bottom on a phone, a centred panel on a
 * desk. Focus moves in when it opens, stays inside while it is open, and goes
 * back to whatever opened it when it closes.
 */
export function Sheet({
  open, onClose, title, children, wide, footer, description,
}: {
  open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; wide?: boolean;
  /** Pinned to the bottom of the panel — for the dialog's actions. */
  footer?: React.ReactNode;
  description?: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const els = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the first field if there is one, otherwise the panel itself.
    requestAnimationFrame(() => {
      const p = panel.current;
      if (!p) return;
      const field = p.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]):not([type=checkbox]), textarea, select");
      (field ?? p).focus({ preventScroll: true });
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-6">
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-fade" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} bg-card sm:rounded-2xl rounded-t-2xl max-h-[92dvh] flex flex-col animate-sheet outline-none`}
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-line-2 shrink-0" aria-hidden />
        {title && (
          <div className="px-5 sm:px-6 pt-4 pb-3 flex items-start justify-between gap-3 border-b border-line shrink-0">
            <div className="min-w-0">
              <h2 id={titleId} className="text-[18px] leading-snug">{title}</h2>
              {description && <p className="text-[13.5px] text-ink-3 mt-1 leading-relaxed">{description}</p>}
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm -mr-2 shrink-0" aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto thin-scroll flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 pt-3.5 border-t border-line bg-card sm:rounded-b-2xl shrink-0 pb-[max(14px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Asking before something that cannot be taken back. */
export function Confirm({
  open, title, children, confirmLabel, onConfirm, onCancel, danger = true, cancelLabel = "Cancel",
}: {
  open: boolean; title: string; children?: React.ReactNode; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean; cancelLabel?: string;
}) {
  return (
    <Sheet
      open={open} onClose={onCancel} title={title}
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onCancel} data-autofocus>{cancelLabel}</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      }
    >
      <div className="text-[14.5px] text-ink-2 leading-relaxed space-y-2">{children}</div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------- toasts */

interface ToastMsg { id: number; text: string; tone?: "good" | "bad" | "neutral"; action?: { label: string; run: () => void } }
type Toaster = (text: string, opts?: Omit<ToastMsg, "id" | "text">) => void;
const ToastCtx = createContext<Toaster>(() => {});

/** A short line confirming that something happened — and, where it can be, how to take it back. */
export function useToast(): Toaster {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setMsgs((m) => m.filter((x) => x.id !== id)), []);
  const push = useCallback<Toaster>((text, opts = {}) => {
    const id = ++seq.current;
    setMsgs((m) => [...m.slice(-2), { id, text, ...opts }]);
    setTimeout(() => dismiss(id), opts.action ? 6500 : 3800);
  }, [dismiss]);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-6 flex flex-col items-center gap-2 w-[min(92vw,440px)] pointer-events-none"
        role="status" aria-live="polite"
      >
        {msgs.map((m) => (
          <div key={m.id} className="pointer-events-auto animate-toast w-full flex items-center gap-3 rounded-xl bg-ink text-[#f2f1ed] px-4 py-3 text-[14px]" style={{ boxShadow: "var(--shadow-pop)" }}>
            <span className="shrink-0" style={{ color: m.tone === "bad" ? "#f0a695" : "#d4b67a" }}>
              <Icon name={m.tone === "bad" ? "alert" : "check"} size={17} strokeWidth={1.9} />
            </span>
            <span className="flex-1 min-w-0">{m.text}</span>
            {m.action && (
              <button className="font-semibold text-[#e3c98f] hover:text-white" onClick={() => { m.action!.run(); dismiss(m.id); }}>
                {m.action.label}
              </button>
            )}
            <button className="text-[#a9b1ac] hover:text-white -mr-1 p-1" aria-label="Dismiss" onClick={() => dismiss(m.id)}>
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* -------------------------------------------------------------------- tabs */

/**
 * Tabs with an underline, arrow keys between them, and a count in each so
 * you know what is behind a tab before opening it.
 */
export function Tabs<T extends string>({
  tabs, active, onChange, counts, label = "Sections",
}: { tabs: readonly T[]; active: T; onChange: (t: T) => void; counts?: Partial<Record<T, number>>; label?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = tabs.length - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(tabs[j]);
    refs.current[j]?.focus();
  };
  return (
    <div className="relative border-b border-line">
      <div className="flex gap-1 overflow-x-auto -mb-px" role="tablist" aria-label={label} style={{ scrollbarWidth: "none" }}>
        {tabs.map((t, i) => {
          const on = t === active;
          const n = counts?.[t];
          return (
            <button
              key={t}
              ref={(el) => { refs.current[i] = el; }}
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t)}
              onKeyDown={(e) => onKey(e, i)}
              className={`shrink-0 inline-flex items-center gap-2 px-3 min-h-[44px] text-[14px] border-b-2 transition-colors ${on ? "border-ink text-ink font-semibold" : "border-transparent text-ink-3 font-medium hover:text-ink hover:border-line-2"}`}
            >
              {t}
              {n !== undefined && (
                <span className={`tnum text-[11px] font-mono rounded px-1.5 py-px ${on ? "bg-ink text-[#f2f1ed]" : "bg-paper-2 text-ink-3"}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ states */

/**
 * An empty list is a dead end unless it says why it is empty and offers the
 * way out of being empty.
 */
export function Empty({
  title, hint, icon = "sparkle", action, compact,
}: { title: string; hint?: React.ReactNode; icon?: string; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`card-quiet text-center ${compact ? "px-4 py-6" : "px-6 py-10"}`}>
      {!compact && (
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-paper-2 text-ink-3 flex items-center justify-center">
          <Icon name={icon} size={19} />
        </div>
      )}
      <div className="text-[15px] font-semibold text-ink">{title}</div>
      {hint && <div className="text-[14px] text-ink-3 mt-1.5 max-w-md mx-auto leading-relaxed">{hint}</div>}
      {action && <div className="mt-4 flex justify-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

/** Placeholder blocks while the project loads. */
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the project">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-9 w-72 max-w-full mb-3" />
      <Skeleton className="h-4 w-[520px] max-w-[90%] mb-8" />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

/* ------------------------------------------------------------------ misc */

export function Swatch({ colors, size = 18 }: { colors: string[]; size?: number }) {
  return (
    <div className="flex -space-x-1">
      {colors.slice(0, 4).map((c, i) => (
        <span key={i} className="rounded-full ring-2 ring-white" style={{ background: c, width: size, height: size, display: "inline-block" }} />
      ))}
    </div>
  );
}

/** A generated stand-in for a photo, so the prototype reads visually without stock imagery. */
export function PhotoBlock({
  tone = "#cfc8ba", label, ratio = "4 / 3", className = "", children,
}: { tone?: string; label?: string; ratio?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-line ${className}`}
      style={{
        aspectRatio: ratio,
        background: `linear-gradient(150deg, ${tone} 0%, color-mix(in srgb, ${tone} 72%, #ffffff) 52%, color-mix(in srgb, ${tone} 88%, #000000) 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "repeating-linear-gradient(52deg, #000 0 1px, transparent 1px 7px)" }} />
      {label && <div className="absolute left-2.5 bottom-2 text-[12px] text-white/95 font-medium drop-shadow">{label}</div>}
      {children}
    </div>
  );
}

const AVATAR_TONES = ["#5b6f63", "#8a672b", "#37607c", "#7a5a4a", "#4f5d73", "#6b6a3c"];

export function Avatar({ name, tone, size = 28 }: { name: string; tone?: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const auto = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: tone ?? auto, fontSize: size * 0.38 }}
      title={name}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Field({
  label, children, hint, required, error,
}: { label: string; children: React.ReactNode; hint?: string; required?: boolean; error?: string }) {
  return (
    <label className="block">
      <div className="text-[13px] font-semibold text-ink-2 mb-1.5">
        {label}{required && <span className="text-bad ml-0.5" aria-hidden>*</span>}
      </div>
      {children}
      {error ? (
        <div className="text-[12.5px] text-bad mt-1 leading-snug">{error}</div>
      ) : hint ? (
        <div className="text-[12.5px] text-ink-3 mt-1 leading-snug">{hint}</div>
      ) : null}
    </label>
  );
}

/** A number input that never shows a leading zero and reports numbers, not strings. */
export function NumberInput({
  value, onChange, prefix, suffix, step = 1, className = "", id,
}: { value: number | undefined; onChange: (n: number) => void; prefix?: string; suffix?: string; step?: number; className?: string; id?: string }) {
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const lastProp = useRef(value);
  useEffect(() => {
    if (lastProp.current !== value) {
      lastProp.current = value;
      setText(value === undefined ? "" : String(value));
    }
  }, [value]);
  return (
    <div className={`flex items-center gap-1.5 input ${className}`}>
      {prefix && <span className="text-ink-3 text-[13px]">{prefix}</span>}
      <input
        id={id}
        className="w-full bg-transparent outline-none tnum"
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
      {suffix && <span className="text-ink-3 text-[12.5px] shrink-0">{suffix}</span>}
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
