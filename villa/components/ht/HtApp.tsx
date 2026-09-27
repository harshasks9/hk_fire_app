"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { systemTotal, formatINR } from "@/lib/ht/catalog";
import { H } from "@/lib/ht/geometry";
import { Detail } from "./Detail";
import { Overview, RoomTab } from "./Overview";
import { FlowView } from "./Flow";
import { RackView } from "./Rack";
import { CompareView } from "./Compare";
import { BudgetView } from "./Budget";
import { ProcureView } from "./Procure";
import { Section } from "./bits";

const TABS = [
  { id: "overview", label: "System" },
  { id: "room", label: "Room" },
  { id: "flow", label: "Signal flow" },
  { id: "rack", label: "Rack" },
  { id: "compare", label: "Compare" },
  { id: "budget", label: "Budget impact" },
  { id: "buy", label: "Procurement" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const HEAD: Record<Exclude<TabId, "overview">, { eyebrow: string; title: string; sub: string }> = {
  room: { eyebrow: "Room views", title: "Where everything goes, to the centimetre", sub: `Plan, front and side elevations and a 3D model at the revised ${H.toFixed(2)} m ceiling. Turn layers on and off; click any speaker, sub, the screen or the projector.` },
  flow: { eyebrow: "Signal flow", title: "Every cable, from source to seat", sub: "HDMI, line level, speaker runs, subwoofer outputs, Ethernet, 12 V triggers and power — with cable types, lengths and where each box lives." },
  rack: { eyebrow: "AV rack", title: "The 27U rack, unit by unit", sub: "Physical order, vent gaps, power budget, heat and cable management. Click a unit for its product details." },
  compare: { eyebrow: "Compare", title: "Put two or three options side by side", sub: "Price, output, distortion, directivity, bass, HDR, blacks, room correction, reliability, warranty and import — each as a plain statement of the difference." },
  budget: { eyebrow: "Budget impact", title: "What more money actually buys", sub: "Where the next ₹2 L, ₹5 L and ₹10 L make the biggest difference — and where spending more changes almost nothing." },
  buy: { eyebrow: "Procurement", title: "What to buy, and where", sub: "Organised by country, with the saving thresholds for imports and the list of things never to import." },
};

export function HtApp() {
  const [tab, setTab] = useState<TabId>("overview");
  const [open, setOpen] = useState<string | null>(null);
  const [compare, setCompare] = useState<{ component: string; ids: string[] }>({ component: "projector", ids: ["jvc-nz700", "jvc-nz500", "jvc-nz800"] });

  // Keep the tab in the URL hash so a view can be shared or reloaded.
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "") as TabId;
      if (TABS.some((t) => t.id === h)) setTab(h);
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
            <button className="flex items-center gap-3 min-w-0" onClick={() => go("overview")} aria-label="Home Theater Room — system overview">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #d6b06a, #8a672b)" }} aria-hidden>
                <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="7" rx="1" fill="#16130c" /><rect x="5" y="12" width="6" height="1.6" rx=".8" fill="#16130c" /></svg>
              </span>
              <span className="text-left min-w-0">
                <span className="block text-[15px] font-semibold tracking-[-0.01em] leading-tight">Home Theater Room</span>
                <span className="block text-[11.5px] t3 truncate">Villa 14 · 9.4.6 · {formatINR(systemTotal())} est.</span>
              </span>
            </button>
            <Link href="/villa/sf-theatre" className="btn btn-ghost btn-sm">Villa app ↗</Link>
          </div>
          <nav className="tabs mt-1.5 -mx-2" role="tablist" aria-label="Views">
            {TABS.map((t) => (
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
          Prices are landed estimates at ₹96/USD (late September 2026); items marked est. could not be checked against a live listing. Measurements come from Audio Science Review, Erin&rsquo;s Audio Corner, spinorama.org, data-bass, Audioholics, Projector Central, Projector Reviews and Simple Home Cinema, via their published reviews. Room geometry and acoustics are computed from the finished dimensions; confirm on site before ordering.
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
