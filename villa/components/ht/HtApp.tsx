"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/ht/catalog";
import { useHt } from "./data";
import { AssumptionsView } from "./Assumptions";
import { AddonsView } from "./Addons";
import { Detail } from "./Detail";
import { Overview, RoomTab } from "./Overview";
import { FlowView } from "./Flow";
import { RackView } from "./Rack";
import { CompareView } from "./Compare";
import { BudgetView } from "./Budget";
import { ProcureView } from "./Procure";
import { ParetoView } from "./Pareto";
import { Section } from "./bits";

const TABS = [
  { id: "overview", label: "System" },
  { id: "assumptions", label: "Assumptions tested" },
  { id: "pareto", label: "Pareto options" },
  { id: "addons", label: "Room build & add-ons" },
  { id: "room", label: "Room" },
  { id: "flow", label: "Signal flow" },
  { id: "rack", label: "Rack" },
  { id: "compare", label: "Compare" },
  { id: "budget", label: "Budget impact" },
  { id: "buy", label: "Procurement" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function HtApp() {
  const d = useHt();
  const tabs = TABS.filter((t) => (t.id !== "assumptions" || d.assumptions?.length) && (t.id !== "addons" || d.addons));
  const HEAD = d.heads;
  const [tab, setTab] = useState<TabId>("overview");
  const [open, setOpen] = useState<string | null>(null);
  const [compare, setCompare] = useState<{ component: string; ids: string[] }>(d.compareDefault);

  // Keep the tab in the URL hash so a view can be shared or reloaded.
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "") as TabId;
      if (tabs.some((t) => t.id === h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#0a0b0d";
    return () => { document.body.style.background = prev; };
  }, []);

  const go = useCallback((id: string) => {
    setTab(id as TabId);
    history.replaceState(null, "", id === "overview" ? window.location.pathname : `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onPick = useCallback((id: string) => setOpen(id), []);
  const onClose = useCallback(() => setOpen(null), []);

  const toggleCompare = (component: string, optionId: string) => {
    setCompare((s) => {
      if (s.component !== component) return { component, ids: [optionId] };
      const has = s.ids.includes(optionId);
      return { component, ids: has ? s.ids.filter((x) => x !== optionId) : [...s.ids, optionId].slice(-3) };
    });
  };

  return (
    <div className="ht">
      <header className="ht-top">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <div className="flex items-center justify-between gap-4 pt-3.5">
            <button className="flex items-center gap-3 min-w-0" onClick={() => go("overview")} aria-label={`${d.title} — system overview`}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #d6b06a, #8a672b)" }} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="7" rx="1" fill="#16130c" /><rect x="5" y="12" width="6" height="1.6" rx=".8" fill="#16130c" /></svg>
              </span>
              <span className="text-left min-w-0">
                <span className="block text-[15px] font-semibold tracking-[-0.01em] leading-tight">{d.title}</span>
                <span className="block text-[11.5px] t3 truncate">{d.tagline} · {formatINR(d.total)} est.</span>
              </span>
            </button>
            <Link href={d.backLink.href} className="btn btn-ghost btn-sm">{d.backLink.label}</Link>
          </div>
          <nav className="tabs mt-1.5 -mx-2" role="tablist" aria-label="Views">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className="tab" onClick={() => go(t.id)}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 sm:px-8 pb-24" id="main">
        {tab === "overview" ? (
          <Overview onPick={onPick} go={go} active={open} />
        ) : (
          <div className="pt-8 sm:pt-10">
            <Section eyebrow={HEAD[tab].eyebrow} title={HEAD[tab].title} sub={HEAD[tab].sub}>
              {tab === "assumptions" && <AssumptionsView />}
              {tab === "pareto" && <ParetoView />}
              {tab === "addons" && <AddonsView onPick={onPick} />}
              {tab === "room" && <RoomTab onPick={onPick} active={open} />}
              {tab === "flow" && <FlowView onPick={onPick} />}
              {tab === "rack" && <RackView onPick={onPick} />}
              {tab === "compare" && <CompareView state={compare} setState={setCompare} onPick={onPick} />}
              {tab === "budget" && <BudgetView onPick={onPick} />}
              {tab === "buy" && <ProcureView onPick={onPick} />}
            </Section>
          </div>
        )}
        <footer className="mt-16 pt-6 border-t hair t3 text-[12.5px] leading-relaxed max-w-4xl">
          {d.footer}
        </footer>
      </main>

      {open && (
        <Detail
          id={open} onClose={onClose}
          compare={compare} onCompare={toggleCompare}
          onOpenCompare={() => { setOpen(null); go("compare"); }}
        />
      )}
    </div>
  );
}
