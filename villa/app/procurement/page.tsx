"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { AddButton, EntityLink, RowActions } from "@/components/Entity";
import { longLeadItems, forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { type ScopeItem, type ProcurementStatus } from "@/lib/model/types";
import {
  PageTitle, Stat, Chip, Tabs, Empty, fmtDay, relative, PROC_LABEL, type Tone,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ItemSheet } from "@/components/ItemSheet";

const PIPELINE: ProcurementStatus[] = [
  "to-select", "selected", "quote-requested", "approved", "ordered",
  "in-transit", "delivered", "installed", "verified",
];

const TABS = ["Pipeline", "Long lead", "Deliveries", "All"] as const;
type Tab = (typeof TABS)[number];

const UNDECIDED = ["not-started", "idea", "options", "estimated", "discussion"];
/** Cards shown per pipeline column before "Show all". */
const COLUMN_FIRST = 12;
/** Cards shown on All before "Show more". */
const ALL_PAGE = 60;

const statusTone = (s: ProcurementStatus): Tone =>
  s === "verified" || s === "installed" || s === "delivered" ? "good"
  : s === "to-select" ? "neutral"
  : s === "ordered" || s === "in-transit" ? "info"
  : "warn";

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
  // An id, not a copy: the sheet must show the item as it is after an edit.
  const [openId, setOpenId] = useState<string | null>(null);
  const [wideCols, setWideCols] = useState<Record<string, boolean>>({});
  const [allShown, setAllShown] = useState(ALL_PAGE);
  const [allQuery, setAllQuery] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [allStage, setAllStage] = useState<ProcurementStatus | "any">("any");

  const products = useMemo(
    () => state.items.filter((i) => i.procurement && i.stage !== "not-applicable"),
    [state.items],
  );
  const spaceName = (id?: string) => state.spaces.find((s) => s.id === id)?.name ?? "House-wide";

  const longLead = longLeadItems(state);
  const atRisk = longLead.filter((i) => UNDECIDED.includes(i.stage));
  const inTransit = products.filter((i) => i.procurement!.status === "in-transit");
  const ordered = products.filter((i) => ["ordered", "in-transit"].includes(i.procurement!.status));
  const committed = products.reduce((a, i) => a + (i.ladder.committed ?? 0), 0);

  const upcoming = products
    .filter((i) => i.procurement?.expectedDelivery)
    .sort((a, b) => +new Date(a.procurement!.expectedDelivery!) - +new Date(b.procurement!.expectedDelivery!));

  const allList = useMemo(() => {
    const q = allQuery.trim().toLowerCase();
    return products.filter((i) => {
      const p = i.procurement!;
      if (allStage !== "any" && p.status !== allStage) return false;
      if (!q) return true;
      const where = state.spaces.find((s) => s.id === i.spaceId)?.name ?? "house-wide";
      return [p.product, p.brand, i.title, where].some((x) => (x ?? "").toLowerCase().includes(q));
    });
  }, [products, allQuery, allStage, state.spaces]);

  const open = (i: ScopeItem) => setOpenId(i.id);
  const openItem = openId ? state.items.find((i) => i.id === openId) ?? null : null;

  return (
    <div>
      <PageTitle
        title="Procurement"
        sub="What has been selected, ordered, delivered and installed — and what is going to be late if it is not decided this week. What still has to be bought lives on the purchase list."
        right={
          <>
            <Link href="/purchases" className="btn btn-sm">Purchase list <Icon name="arrow-right" size={15} /></Link>
            <AddButton on="items" label="Add something to buy" accent />
          </>
        }
      />

      <div className="card stat-strip mb-8">
        <Stat label="Purchasable items" value={products.length} large />
        <Stat label="On order" value={ordered.length} sub={`${inTransit.length} in transit`} large />
        <Stat label="Committed value" value={inr(committed, { compact: true })} sub="on purchase orders" large />
        <Stat
          label="Long lead, undecided"
          value={atRisk.length || "—"}
          tone={atRisk.length ? "bad" : undefined}
          sub={atRisk.length ? "these move the handover date" : "every long-lead item is decided"}
          large
        />
      </div>

      <Tabs
        tabs={TABS} active={tab} onChange={setTab} label="Procurement views"
        counts={{ Pipeline: products.length, "Long lead": longLead.length, Deliveries: upcoming.length, All: products.length }}
      />

      <div className="mt-6">
        {tab === "Pipeline" && (
          products.length ? (
            <>
              <p className="text-[13px] text-ink-3 mb-3">
                Nine stages, left to right. Scroll sideways for the later ones; open a card to move it on.
              </p>
              <div className="overflow-x-auto thin-scroll pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-start gap-3 min-w-max">
                  {PIPELINE.map((st) => {
                    const list = products.filter((i) => i.procurement!.status === st);
                    const all = wideCols[st] || list.length <= COLUMN_FIRST + 2;
                    const shown = all ? list : list.slice(0, COLUMN_FIRST);
                    return (
                      <section key={st} className="w-[236px] shrink-0 rounded-xl bg-paper-2/70 p-2" aria-label={`${PROC_LABEL[st]}, ${list.length}`}>
                        <div className="flex items-baseline justify-between px-1.5 pt-1 pb-2.5">
                          <h3 className="eyebrow">{PROC_LABEL[st]}</h3>
                          <span className="tnum text-[12px] font-mono text-ink-3">{list.length}</span>
                        </div>
                        <div className="space-y-2">
                          {shown.map((i) => {
                            const lead = i.procurement!.leadTimeWeeks ?? 0;
                            return (
                              <button key={i.id} onClick={() => open(i)} className="card card-link w-full text-left px-3 py-2.5 block">
                                <span className="block text-[13.5px] font-medium leading-snug line-clamp-2">{i.procurement!.product ?? i.title}</span>
                                <span className="block text-[12.5px] text-ink-3 mt-0.5 truncate">{spaceName(i.spaceId)}</span>
                                <span className="flex items-center justify-between gap-2 mt-2">
                                  <span className="tnum text-[13px]">{inr(forecastOf(i), { compact: true })}</span>
                                  {lead >= 8 && <Chip tone="warn">{lead} wk lead</Chip>}
                                </span>
                              </button>
                            );
                          })}
                          {!all && (
                            <button className="btn btn-ghost btn-sm w-full" onClick={() => setWideCols((c) => ({ ...c, [st]: true }))}>
                              Show all {list.length}
                            </button>
                          )}
                          {!list.length && <div className="text-[13px] text-ink-3 px-1.5 py-3">Nothing at this stage.</div>}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          ) : <NoProducts />
        )}

        {tab === "Long lead" && (
          longLead.length ? (
            <div>
              {atRisk.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-bad-soft px-4 sm:px-5 py-4 mb-4">
                  <Icon name="alert" size={19} className="text-bad shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14.5px] font-semibold">Decide these first</div>
                    <p className="text-[14px] text-ink-2 mt-1 leading-relaxed max-w-3xl">
                      {atRisk.length} long-lead item{atRisk.length === 1 ? " is" : "s are"} still undecided.
                      Each week of delay on these is a week added to the end of the project — they are not
                      absorbed by float.
                    </p>
                  </div>
                </div>
              )}
              {atRisk.length > 0 && atRisk.length < longLead.length && (
                <div className="flex items-center gap-1.5 mb-3" role="group" aria-label="Show">
                  <button className="pill" aria-pressed={!riskOnly} onClick={() => setRiskOnly(false)}>All long-lead <span className="count">{longLead.length}</span></button>
                  <button className="pill" aria-pressed={riskOnly} onClick={() => setRiskOnly(true)}>Undecided <span className="count">{atRisk.length}</span></button>
                </div>
              )}
              <div className="card divide-y divide-line overflow-hidden">
                {(riskOnly ? atRisk : longLead).map((i) => {
                  const p = i.procurement!;
                  const risky = UNDECIDED.includes(i.stage);
                  return (
                    <div key={i.id} className="relative px-4 sm:px-5 py-3.5 flex items-center gap-4 hover:bg-paper transition-colors">
                      <div className="text-center shrink-0 w-12">
                        <div className={`tnum text-[20px] font-semibold leading-none ${risky ? "text-bad" : "text-ink-2"}`}>{p.leadTimeWeeks}</div>
                        <div className="text-[12px] text-ink-3 mt-1">weeks</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => open(i)} className="text-left text-[14.5px] font-medium leading-snug after:absolute after:inset-0 after:content-['']">
                          {p.product ?? i.title}
                        </button>
                        <div className="text-[13px] text-ink-3 mt-0.5">
                          <span className="relative z-[1]"><EntityLink on="spaces" id={i.spaceId} label={spaceName(i.spaceId)} /></span> · {PROC_LABEL[p.status]}
                        </div>
                        {risky && <div className="mt-1.5 sm:hidden"><Chip tone="bad">Undecided</Chip></div>}
                      </div>
                      {risky && <span className="hidden sm:inline-flex"><Chip tone="bad">Undecided</Chip></span>}
                      <span className="tnum text-[14px] shrink-0 w-[68px] text-right">{inr(forecastOf(i), { compact: true })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Empty icon="timeline" title="No long-lead items."
              hint="Anything with a lead time of eight weeks or more, and enough value to matter, shows here so it can be decided early." />
          )
        )}

        {tab === "Deliveries" && (
          upcoming.length ? (
            <div className="card divide-y divide-line overflow-hidden">
              {upcoming.map((i) => {
                const p = i.procurement!;
                const d = p.actualDelivery ?? p.expectedDelivery!;
                const late = !p.actualDelivery && new Date(d) < new Date();
                return (
                  <div key={i.id} className="relative px-4 sm:px-5 py-3.5 flex items-center gap-4 hover:bg-paper transition-colors">
                    <div className="min-w-0 flex-1">
                      <button onClick={() => open(i)} className="text-left text-[14.5px] font-medium leading-snug after:absolute after:inset-0 after:content-['']">
                        {p.product ?? i.title}
                      </button>
                      <div className="text-[13px] text-ink-3 mt-0.5">
                        <span className="relative z-[1]"><EntityLink on="spaces" id={i.spaceId} label={spaceName(i.spaceId)} /></span>
                        {p.storageLocation && ` · to ${p.storageLocation}`}
                        {p.installationDate && ` · install ${fmtDay(p.installationDate)}`}
                      </div>
                      <div className="mt-1.5 sm:hidden">
                        <Chip tone={p.actualDelivery ? "good" : late ? "bad" : "warn"}>{p.actualDelivery ? "Delivered" : late ? "Late" : PROC_LABEL[p.status]}</Chip>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex">
                      <Chip tone={p.actualDelivery ? "good" : late ? "bad" : "warn"}>{p.actualDelivery ? "Delivered" : late ? "Late" : PROC_LABEL[p.status]}</Chip>
                    </span>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] tnum">{fmtDay(d)}</div>
                      <div className={`text-[12.5px] ${late ? "text-bad font-semibold" : "text-ink-3"}`}>{relative(d)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty icon="calendar" title="No deliveries scheduled."
              hint="Once an order has an expected delivery date it appears here, soonest first, with where it is going to be stored." />
          )
        )}

        {tab === "All" && (
          products.length ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="input flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-sm">
                  <Icon name="search" size={16} className="text-ink-3 shrink-0" />
                  <input
                    className="w-full min-w-0 bg-transparent outline-none" type="search" aria-label="Search products"
                    placeholder="Search product, brand or room" value={allQuery} onChange={(e) => { setAllQuery(e.target.value); setAllShown(ALL_PAGE); }}
                  />
                </div>
                <select className="input w-auto" aria-label="Stage" value={allStage} onChange={(e) => { setAllStage(e.target.value as ProcurementStatus | "any"); setAllShown(ALL_PAGE); }}>
                  <option value="any">Every stage</option>
                  {PIPELINE.map((st) => <option key={st} value={st}>{PROC_LABEL[st]}</option>)}
                </select>
                <span className="text-[13px] text-ink-3 tnum ml-auto">{allList.length} of {products.length}</span>
              </div>
              {allList.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allList.slice(0, allShown).map((i) => {
                    const p = i.procurement!;
                    const vendorId = p.vendorId ?? i.vendorId;
                    return (
                      <div key={i.id} className="card card-link relative group px-4 py-3.5 flex flex-col">
                        <div className="flex items-start gap-3">
                          {p.swatch && <span className="w-9 h-9 rounded-lg border border-line shrink-0" style={{ background: p.swatch }} aria-hidden />}
                          <button onClick={() => open(i)} className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-['']">
                            <span className="block text-[14.5px] font-medium leading-snug line-clamp-2">{p.product ?? i.title}</span>
                            {p.brand && <span className="block text-[13px] text-ink-2 mt-0.5 truncate">{p.brand}</span>}
                          </button>
                        </div>
                        <div className="text-[13px] text-ink-3 mt-1 truncate relative z-[1] w-fit max-w-full">
                          <EntityLink on="spaces" id={i.spaceId} label={spaceName(i.spaceId)} />
                          {" · "}
                          {vendorId ? <EntityLink on="vendors" id={vendorId} /> : "No vendor yet"}
                        </div>
                        <div className="mt-auto pt-2.5 flex items-center gap-2">
                          <Chip tone={statusTone(p.status)}>{PROC_LABEL[p.status]}</Chip>
                          <span className="tnum text-[14px] ml-auto">{inr(forecastOf(i), { compact: true })}</span>
                          <span className="relative z-[1]"><RowActions on="items" id={i.id} /></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty icon="search" title="Nothing matches."
                  hint="No product matches this search and stage."
                  action={<button className="btn btn-sm" onClick={() => { setAllQuery(""); setAllStage("any"); }}>Clear filters</button>} />
              )}
              {allList.length > allShown && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <span className="text-[13px] text-ink-3 tnum">Showing {allShown} of {allList.length}</span>
                  <button className="btn btn-sm" onClick={() => setAllShown((n) => n + ALL_PAGE)}>Show {Math.min(ALL_PAGE, allList.length - allShown)} more</button>
                </div>
              )}
            </>
          ) : <NoProducts />
        )}
      </div>

      <ItemSheet item={openItem} open={!!openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}

function NoProducts() {
  return (
    <Empty icon="procurement" title="Nothing to procure yet."
      hint="Scope items that are bought in or made to measure appear here once they have a product, and move through the nine stages as they are chosen, ordered and fitted."
      action={<AddButton on="items" label="Add something to buy" accent />} />
  );
}
