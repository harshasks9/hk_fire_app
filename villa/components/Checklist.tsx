"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Checklist, Check } from "@/lib/model/checklist";
import { Bar, Chip } from "./ui";
import { Icon } from "./Icon";

/**
 * A room's checklist, section by section in the order a fit-out runs. The
 * same list on the Checklist page and on the room's own Checklist tab.
 */

const STATE_MARK: Record<Check["state"], { icon: string; tone: string; label: string }> = {
  done: { icon: "check", tone: "var(--color-good)", label: "Done" },
  partial: { icon: "progress", tone: "var(--color-warn)", label: "Started" },
  todo: { icon: "", tone: "var(--color-ink-4)", label: "Not yet" },
  na: { icon: "close", tone: "var(--color-ink-4)", label: "Not applicable" },
};

/** The list itself, section by section — used in the dialog above. */
export function ChecklistBody({ list }: { list: Checklist }) {
  const [hideDone, setHideDone] = useState(false);
  return (
    <div>
      <div className="flex justify-between items-center gap-2 mb-4">
        <Bar pct={list.pct} height={6} label="Checklist progress" />
        <button className="pill shrink-0" aria-pressed={hideDone} onClick={() => setHideDone((v) => !v)}>Hide done</button>
      </div>
      <div className="space-y-6">
        {list.sections.map((sec) => {
          const checks = hideDone ? sec.checks.filter((c) => c.state !== "done") : sec.checks;
          if (!checks.length) return null;
          return (
            <section key={sec.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[15px]">{sec.title}</h3>
                <span className="text-[13px] text-ink-3 tnum">
                  {sec.done} / {sec.total}
                  {sec.criticalOpen > 0 && <span className="text-accent-strong"> · {sec.criticalOpen} critical</span>}
                </span>
              </div>
              <p className="text-[13px] text-ink-3 mt-1 mb-2 leading-relaxed max-w-3xl">{sec.blurb}</p>
              <ul className="divide-y divide-line border-y border-line">
                {checks.map((c) => <CheckRow key={c.id} c={c} />)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CheckRow({ c }: { c: Check }) {
  const [open, setOpen] = useState(false);
  const m = STATE_MARK[c.state];
  return (
    <li>
      <div className="flex items-start gap-3 py-2">
        <span
          className="mt-0.5 w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center border"
          style={{ borderColor: m.tone, background: c.state === "done" ? m.tone : "transparent", color: c.state === "done" ? "#fff" : m.tone }}
          title={m.label} aria-label={m.label} role="img"
        >
          {m.icon && <Icon name={m.icon} size={11} strokeWidth={2.4} />}
        </span>
        <button className="text-left min-w-0 flex-1" onClick={() => setOpen((v) => !v)} aria-expanded={c.why ? open : undefined} disabled={!c.why}>
          <span className={`text-[14px] leading-snug ${c.state === "na" ? "text-ink-3 line-through" : c.state === "done" ? "text-ink-3" : "text-ink"}`}>
            {c.label}
          </span>
          {c.critical && c.state !== "done" && c.state !== "na" && <span className="ml-1.5"><Chip tone="accent" small>critical</Chip></span>}
          {c.detail && <span className="text-[13px] text-ink-3 ml-1.5">— {c.detail}</span>}
        </button>
        {c.href && <Link href={c.href} className="link text-[13px] shrink-0 mt-0.5">Open</Link>}
      </div>
      {open && c.why && (
        <p className="text-[13px] text-ink-3 leading-relaxed pl-[30px] pb-2.5 pr-2 max-w-3xl">{c.why}</p>
      )}
    </li>
  );
}
