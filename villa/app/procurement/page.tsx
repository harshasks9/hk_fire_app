"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { longLeadItems, forecastOf, daysBetween } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { type ScopeItem, type ProcurementStatus } from "@/lib/model/types";
import {
  PageTitle, Eyebrow, Stat, Money, Chip, Tabs, Empty, PhotoBlock, fmtDay, relative, PROC_LABEL,
} from "@/components/ui";
import { ItemSheet } from "@/components/ItemSheet";

const PIPELINE: ProcurementStatus[] = [
  "to-select", "selected", "quote-requested", "approved", "ordered",
  "in-transit", "delivered", "installed", "verified",
];

const TABS = ["Pipeline", "Long lead", "Deliveries", "All"] as const;
type Tab = (typeof TABS)[number];

/**
 * Procurement.
 *
 * Every approved purchasable item, moving left to right through nine states.
 * Long-lead items are given their own place because on a villa fit-out they are
 * the only thing that reliably moves the handover date.
 */
export default function ProcurementPage() {
  const { state } = useProject();
  const [tab, setTab] = useState<Tab>("Pipeline");
  const [open, setOpen] = useState<ScopeItem | null>(null);

  const products = useMemo(
    () => state.items.filter((i) => i.procurement && i.stage !== "not-applicable"),
    [state.items],
  );
  const spaceName = (id?: string) => state.spaces.find((s) => s.id === id)?.name ?? "House-wide";

  const longLead = longLeadItems(state);
  const atRisk = longLead.filter((i) =>
    ["not-started", "idea", "options", "estimated", "discussion"].includes(i.stage),
  );
  const inTransit = products.filter((i) => i.procurement!.status === "in-transit");
  const ordered = products.filter((i) => ["ordered", "in-transit"].includes(i.procurement!.status));
  const committed = products.reduce((a, i) => a + (i.ladder.committed ?? 0), 0);

  const upcoming = products
    .filter((i) => i.procurement?.expectedDelivery)
    .sort((a, b) => +new Date(a.procurement!.expectedDelivery!) - +new Date(b.procurement!.expectedDelivery!));

  return (
    <div>
      <PageTitle
        title="Procurement"
        sub="What has been selected, ordered, delivered and installed — and what is going to be late if it is not decided this week."
      />

      <div className="card px-5 py-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Purchasable items" value={products.length} large />
        <Stat label="On order" value={ordered.length} sub={`${inTransit.length} in transit`} large />
        <Stat label="Committed value" value={<Money value={committed} compact />} large />
        <Stat
          label="Long lead, undecided"
          value={atRisk.length || "—"}
          tone={atRisk.length ? "rust" : "sage"}
          sub="these move the handover date"
          large
        />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ "Long lead": longLead.length, Deliveries: upcoming.length, All: products.length }} />

      <div className="mt-6">
        {tab === "Pipeline" && (
          <div className="overflow-x-auto thin-scroll pb-2">
            <div className="flex gap-3 min-w-max">
              {PIPELINE.map((st) => {
                const list = products.filter((i) => i.procurement!.status === st);
                return (
                  <div key={st} className="w-[218px] shrink-0">
                    <div className="flex items-baseline justify-between mb-2 px-0.5">
                      <span className="eyebrow">{PROC_LABEL[st]}</span>
                      <span className="tnum text-[11px] text-ink-4">{list.length}</span>
                    </div>
                    <div className="space-y-2">
                      {list.slice(0, 14).map((i) => (
                        <button key={i.id} onClick={() => setOpen(i)} className="card w-full text-left px-3 py-2.5 hover:border-ink-4 transition-colors">
                          <div className="text-[12.5px] leading-snug line-clamp-2">{i.procurement!.product ?? i.title}</div>
                          <div className="text-[10.5px] text-ink-3 mt-1 truncate">{spaceName(i.spaceId)}</div>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="tnum text-[11px]">{inr(forecastOf(i), { compact: true })}</span>
                            {(i.procurement!.leadTimeWeeks ?? 0) >= 8 && (
                              <span className="text-[10px] text-clay">{i.procurement!.leadTimeWeeks}w</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {list.length > 14 && <div className="text-[11px] text-ink-4 px-1">+{list.length - 14} more</div>}
                      {!list.length && <div className="text-[11px] text-ink-4 px-1 py-2">—</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "Long lead" && (
          <div>
            {atRisk.length > 0 && (
              <div className="card px-4 py-4 mb-4" style={{ borderColor: "#e0c3ba" }}>
                <Eyebrow>Decide these first</Eyebrow>
                <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">
                  {atRisk.length} long-lead item{atRisk.length === 1 ? " is" : "s are"} still undecided.
                  Each week of delay on these is a week added to the end of the project — they are not
                  absorbed by float.
                </p>
              </div>
            )}
            <div className="card divide-y divide-line">
              {longLead.map((i) => {
                const p = i.procurement!;
                const risky = ["not-started", "idea", "options", "estimated", "discussion"].includes(i.stage);
                return (
                  <button key={i.id} onClick={() => setOpen(i)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-paper-2/60">
                    <div className="text-center shrink-0 w-12">
                      <div className="tnum text-[17px]" style={{ fontFamily: "var(--font-display)", color: risky ? "#8d3a2c" : "#514941" }}>
                        {p.leadTimeWeeks}
                      </div>
                      <div className="text-[9.5px] text-ink-4 uppercase tracking-wider">weeks</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px]">{p.product ?? i.title}</div>
                      <div className="text-[11.5px] text-ink-3">{spaceName(i.spaceId)} · {PROC_LABEL[p.status]}</div>
                    </div>
                    {risky && <Chip tone="rust">Undecided</Chip>}
                    <span className="tnum text-[12.5px] shrink-0">{inr(forecastOf(i), { compact: true })}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "Deliveries" && (
          <div className="card divide-y divide-line">
            {upcoming.length ? upcoming.map((i) => {
              const p = i.procurement!;
              const d = p.actualDelivery ?? p.expectedDelivery!;
              const late = !p.actualDelivery && new Date(d) < new Date();
              return (
                <button key={i.id} onClick={() => setOpen(i)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-paper-2/60">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px]">{p.product ?? i.title}</div>
                    <div className="text-[11.5px] text-ink-3">
                      {spaceName(i.spaceId)}
                      {p.storageLocation && ` · to ${p.storageLocation}`}
                      {p.installationDate && ` · install ${fmtDay(p.installationDate)}`}
                    </div>
                  </div>
                  <Chip tone={p.actualDelivery ? "sage" : late ? "rust" : "ochre"}>
                    {p.actualDelivery ? "delivered" : PROC_LABEL[p.status]}
                  </Chip>
                  <div className="text-right shrink-0">
                    <div className="text-[12.5px] tnum">{fmtDay(d)}</div>
                    <div className="text-[10.5px] text-ink-3">{relative(d)}</div>
                  </div>
                </button>
              );
            }) : <div className="px-4 py-8 text-center text-[13px] text-ink-3">No deliveries scheduled.</div>}
          </div>
        )}

        {tab === "All" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.slice(0, 120).map((i) => {
              const p = i.procurement!;
              const vendor = state.vendors.find((v) => v.id === (p.vendorId ?? i.vendorId));
              return (
                <button key={i.id} onClick={() => setOpen(i)} className="card overflow-hidden text-left hover:border-ink-4 transition-colors">
                  <PhotoBlock tone={p.swatch ?? "#c6bbab"} ratio="16 / 10" label={p.brand} />
                  <div className="px-3.5 py-3">
                    <div className="text-[13px] leading-snug line-clamp-2">{p.product ?? i.title}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5 truncate">{spaceName(i.spaceId)} · {vendor?.name ?? "no vendor"}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Chip tone={["verified", "installed"].includes(p.status) ? "sage" : p.status === "to-select" ? "neutral" : "ochre"}>
                        {PROC_LABEL[p.status]}
                      </Chip>
                      <span className="tnum text-[12px]">{inr(forecastOf(i), { compact: true })}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ItemSheet item={open} open={!!open} onClose={() => setOpen(null)} />
    </div>
  );
}
