"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProject } from "@/lib/store";
import {
  projectFinance, rollup, itemsForFloor, houseWideItems, forecastOf, byCategory,
  upcomingPayments, itemsForSpace,
} from "@/lib/model/derive";
import { inr, computeCost } from "@/lib/model/costing";
import { CATEGORY_LABEL, type Category, type ScopeItem, type FloorId } from "@/lib/model/types";
import { FLOOR_META } from "@/lib/seed/spaces";
import {
  PageTitle, Eyebrow, Stat, Money, BudgetBar, Chip, Tabs, Empty, StageChip, fmtDay, Assumed, Bar,
} from "@/components/ui";
import { ItemSheet } from "@/components/ItemSheet";
import { AddButton, RowActions, EntityLink, EmptyWithAdd } from "@/components/Entity";
import { ScenarioPlanner } from "@/components/ScenarioPlanner";
import { BoqTable } from "@/components/BoqTable";
import { catLabel } from "@/lib/model/categories";

const TABS = ["Overview", "Drill-down", "BOQ", "Scenarios", "Payments"] as const;
type Tab = (typeof TABS)[number];

/**
 * Costs.
 *
 * The product's answer to "where is my money going". Seven money columns at
 * project level, then a drill-down that walks Project → Floor → Room → Category
 * → Item without ever changing screen.
 */
export default function CostsPage() {
  return <React.Suspense><CostsInner /></React.Suspense>;
}

const VIEW_TAB: Record<string, Tab> = { payments: "Payments", scenarios: "Scenarios", boq: "BOQ", drilldown: "Drill-down" };

function CostsInner() {
  const { state } = useProject();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(VIEW_TAB[params.get("view") ?? ""] ?? "Overview");
  const [openItem, setOpenItem] = useState<ScopeItem | null>(null);
  const fin = projectFinance(state);

  // House-wide scope has no room to open in, so it opens here instead.
  useEffect(() => {
    const want = params.get("item");
    if (!want) return;
    const it = state.items.find((i) => i.id === want);
    if (it) { setOpenItem(it); setTab("BOQ"); }
  }, [params, state.items]);

  return (
    <div>
      <PageTitle
        title="Costs"
        sub="What was budgeted, what was estimated, what is committed, and what has actually been paid — kept as four different numbers, because they are."
        right={
          <div className="flex items-center gap-2">
            <AddButton on="payments" label="Schedule a payment" />
            <AddButton on="items" label="Add scope" accent />
          </div>
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "Overview" && <Overview />}
        {tab === "Drill-down" && <DrillDown onOpen={setOpenItem} />}
        {tab === "BOQ" && <BoqTable onOpen={setOpenItem} />}
        {tab === "Scenarios" && <ScenarioPlanner />}
        {tab === "Payments" && <Payments />}
      </div>

      <ItemSheet item={openItem} open={!!openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}

function Overview() {
  const { state } = useProject();
  const fin = projectFinance(state);

  const LADDER = [
    ["Original budget", fin.originalBudget, "What you set out to spend."],
    ["Current approved budget", fin.approvedBudget, "The sum of everything signed off so far."],
    ["Committed", fin.committed, "POs raised and contracts awarded."],
    ["Paid", fin.paid, "Cash already out."],
    ["Remaining commitments", fin.remainingCommitment, "Owed on work already ordered."],
    ["Uncommitted estimate", fin.uncommittedEstimate, "Forecast on things nobody has ordered yet."],
    ["Contingency", fin.contingency, `${state.meta.contingencyPct}% — ${inr(fin.contingencyRemaining)} of it still unspent.`],
    ["Forecast final cost", fin.forecast, "The honest number: hardest available figure per item."],
  ] as const;

  const floors: FloorId[] = ["ground", "first", "second", "outdoor"];
  const houseWide = rollup(houseWideItems(state), state.decisions);

  const allCats = byCategory(state.items.filter((i) => i.stage !== "not-applicable"));
  const catRows = Array.from(allCats.entries())
    .map(([cat, list]) => ({ cat, forecast: list.reduce((a, i) => a + forecastOf(i), 0), n: list.length }))
    .sort((a, b) => b.forecast - a.forecast)
    .slice(0, 14);
  const catMax = Math.max(...catRows.map((r) => r.forecast), 1);

  return (
    <div className="space-y-6">
      <div className="card px-5 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-5">
          <Stat label="Original budget" value={<Money value={fin.originalBudget} compact />} large />
          <Stat label="Forecast final" value={<Money value={fin.forecast} compact />} tone={fin.budgetVariance > 0 ? "rust" : "sage"} large
            sub={`${fin.budgetVariance > 0 ? "+" : ""}${inr(fin.budgetVariance, { compact: true })} · ${fin.originalBudget ? Math.round((fin.budgetVariance / fin.originalBudget) * 100) : 0}%`} />
          <Stat label="Committed" value={<Money value={fin.committed} compact />} large sub={`${inr(fin.remainingCommitment, { compact: true })} still owed`} />
          <Stat label="Contingency left" value={<Money value={fin.contingencyRemaining} compact />} large
            tone={fin.contingencyRemaining < fin.contingency * 0.4 ? "ochre" : "sage"} sub={`of ${inr(fin.contingency, { compact: true })}`} />
        </div>
        <BudgetBar paid={fin.paid} committed={fin.committed} forecast={fin.forecast} budget={fin.originalBudget} />
      </div>

      <div className="card divide-y divide-line">
        {LADDER.map(([label, value, hint]) => (
          <div key={label} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[13.5px]">{label}</div>
              <div className="text-[11.5px] text-ink-3 mt-0.5">{hint}</div>
            </div>
            <span className="tnum text-[15px] shrink-0" style={{ fontFamily: "var(--font-display)" }}>{inr(value)}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card px-4 sm:px-5 py-5">
          <Eyebrow className="mb-3">By floor</Eyebrow>
          <div className="space-y-3">
            {floors.map((f) => {
              const r = rollup(itemsForFloor(state, f), state.decisions);
              return (
                <div key={f}>
                  <div className="flex items-baseline justify-between text-[13px] mb-1">
                    <span>{FLOOR_META[f].label}</span>
                    <span className="tnum">{inr(r.forecast)}</span>
                  </div>
                  <BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} />
                  <div className="text-[11px] text-ink-3 mt-1 tnum">{r.live} items · {Math.round(r.completionPct)}% complete</div>
                </div>
              );
            })}
            <div className="hairline pt-3">
              <div className="flex items-baseline justify-between text-[13px] mb-1">
                <span>House-wide</span>
                <span className="tnum">{inr(houseWide.forecast)}</span>
              </div>
              <BudgetBar paid={houseWide.paid} committed={houseWide.committed} forecast={houseWide.forecast} budget={houseWide.approvedBudget} />
              <div className="text-[11px] text-ink-3 mt-1 tnum">{houseWide.live} items — systems and scope that belong to no single room</div>
            </div>
          </div>
        </div>

        <div className="card px-4 sm:px-5 py-5">
          <Eyebrow className="mb-3">Biggest categories</Eyebrow>
          <div className="space-y-2.5">
            {catRows.map((r) => (
              <div key={r.cat}>
                <div className="flex items-baseline justify-between text-[12.5px] mb-1">
                  <span className="text-ink-2">{catLabel(state, r.cat)} <span className="text-ink-4 tnum">({r.n})</span></span>
                  <span className="tnum">{inr(r.forecast, { compact: true })}</span>
                </div>
                <Bar pct={(r.forecast / catMax) * 100} height={5} tone="#a8763f" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11.5px] text-ink-3 leading-relaxed max-w-2xl">
        Where no vendor quotation exists, the forecast uses the app&rsquo;s{" "}
        <Assumed>indicative rate</Assumed> for that category. Those rates are starting
        assumptions for a premium Hyderabad fit-out, editable on every item, and they are
        not market quotations.
      </p>
    </div>
  );
}

function DrillDown({ onOpen }: { onOpen: (i: ScopeItem) => void }) {
  const { state } = useProject();
  const [floor, setFloor] = useState<FloorId | "house" | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [cat, setCat] = useState<Category | null>(null);

  const floors: (FloorId | "house")[] = ["ground", "first", "second", "outdoor", "house"];

  const scopeItems = useMemo(() => {
    if (!floor) return state.items;
    if (floor === "house") return houseWideItems(state);
    return itemsForFloor(state, floor);
  }, [state, floor]);

  const spaceItems = spaceId ? itemsForSpace(state, spaceId) : scopeItems;
  const catItems = cat ? spaceItems.filter((i) => i.category === cat) : spaceItems;

  const spaces = floor && floor !== "house" ? state.spaces.filter((s) => s.floor === floor) : [];
  const cats = Array.from(byCategory(spaceItems.filter((i) => i.stage !== "not-applicable")).entries())
    .map(([c, list]) => ({ c, total: list.reduce((a, i) => a + forecastOf(i), 0), n: list.length }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] mb-4">
        <button onClick={() => { setFloor(null); setSpaceId(null); setCat(null); }} className="text-clay hover:underline">Project</button>
        {floor && <><span className="text-ink-4">/</span>
          <button onClick={() => { setSpaceId(null); setCat(null); }} className="text-clay hover:underline">
            {floor === "house" ? "House-wide" : FLOOR_META[floor].label}
          </button></>}
        {spaceId && <><span className="text-ink-4">/</span>
          <button onClick={() => setCat(null)} className="text-clay hover:underline">{state.spaces.find((s) => s.id === spaceId)?.name}</button></>}
        {cat && <><span className="text-ink-4">/</span><span className="text-ink-2">{catLabel(state, cat)}</span></>}
      </div>

      {!floor && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {floors.map((f) => {
            const items = f === "house" ? houseWideItems(state) : itemsForFloor(state, f);
            const r = rollup(items, state.decisions);
            return (
              <button key={f} onClick={() => setFloor(f)} className="card px-4 py-4 text-left hover:border-ink-4 transition-colors">
                <div className="text-[15px]" style={{ fontFamily: "var(--font-display)" }}>
                  {f === "house" ? "House-wide" : FLOOR_META[f].label}
                </div>
                <div className="tnum text-[20px] mt-1.5">{inr(r.forecast, { compact: true })}</div>
                <div className="text-[11.5px] text-ink-3 mt-1">{r.live} items · {Math.round(r.completionPct)}% complete</div>
                <div className="mt-2.5"><BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} /></div>
              </button>
            );
          })}
        </div>
      )}

      {floor && floor !== "house" && !spaceId && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {spaces.map((s) => {
            const r = rollup(itemsForSpace(state, s.id), state.decisions);
            return (
              <button key={s.id} onClick={() => setSpaceId(s.id)} className="card px-4 py-3.5 text-left hover:border-ink-4 transition-colors">
                <div className="text-[13.5px]">{s.name}</div>
                <div className="tnum text-[17px] mt-1">{inr(r.forecast, { compact: true })}</div>
                <div className="text-[11px] text-ink-3 mt-0.5">{r.live} items</div>
                <div className="mt-2"><BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} /></div>
              </button>
            );
          })}
        </div>
      )}

      {((floor === "house") || spaceId) && !cat && (
        <div className="card divide-y divide-line">
          {cats.map((c) => (
            <button key={c.c} onClick={() => setCat(c.c)} className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-paper-2/60 text-left">
              <span className="text-[13.5px]">{catLabel(state, c.c)} <span className="text-ink-4 tnum text-[11.5px]">({c.n})</span></span>
              <span className="tnum text-[13.5px]">{inr(c.total)}</span>
            </button>
          ))}
        </div>
      )}

      {cat && (
        <div className="card divide-y divide-line">
          {catItems.map((i) => (
            <button key={i.id} onClick={() => onOpen(i)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-paper-2/60 text-left">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px]">{i.title}</div>
                <div className="text-[11px] text-ink-3 tnum">
                  {i.cost.qty} × {inr(i.cost.rate)} {i.vendorId ? `· ${state.vendors.find((v) => v.id === i.vendorId)?.name}` : ""}
                </div>
              </div>
              <span className="tnum text-[13px] shrink-0">{inr(forecastOf(i))}</span>
              <StageChip stage={i.stage} small />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Payments() {
  const { state, dispatch } = useProject();
  const due = upcomingPayments(state, 3650);
  const paid = state.payments.filter((p) => p.paidOn);
  const next30 = upcomingPayments(state, 30);
  const overdue = due.filter((p) => new Date(p.dueOn) < new Date());

  return (
    <div className="space-y-5">
      <div className="card px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Due in 30 days" value={<Money value={next30.reduce((a, p) => a + p.amount, 0)} compact />} tone="ochre" large />
        <Stat label="Overdue" value={<Money value={overdue.reduce((a, p) => a + p.amount, 0)} compact blank="—" />} tone={overdue.length ? "rust" : undefined} large />
        <Stat label="Paid to date" value={<Money value={paid.reduce((a, p) => a + p.amount, 0)} compact />} tone="sage" large />
        <Stat label="Scheduled total" value={<Money value={state.payments.reduce((a, p) => a + p.amount, 0)} compact />} large />
      </div>

      <div>
        <Eyebrow className="mb-2">Due</Eyebrow>
        <div className="card divide-y divide-line">
          {due.length ? due.map((p) => {
            const v = state.vendors.find((x) => x.id === p.vendorId);
            const late = new Date(p.dueOn) < new Date();
            return (
              <div key={p.id} id={p.id} className="px-4 py-3 flex items-center gap-3 group scroll-mt-24">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px]">{p.label}</div>
                  <div className="text-[11.5px] text-ink-3">
                    {v ? <EntityLink on="vendors" id={v.id} /> : "No vendor"} · {p.kind}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="tnum text-[13.5px]">{inr(p.amount)}</div>
                  <div className="text-[11px]" style={{ color: late ? "#8d3a2c" : "#857b70" }}>{fmtDay(p.dueOn)}</div>
                </div>
                <button className="btn btn-sm shrink-0" onClick={() => dispatch({ type: "payment/paid", id: p.id, on: new Date().toISOString() })}>
                  Mark paid
                </button>
                <RowActions on="payments" id={p.id} />
              </div>
            );
          }) : (
            <div className="px-4 py-6 text-center text-[13px] text-ink-3">
              Nothing outstanding. <span className="inline-block ml-2 align-middle"><AddButton on="payments" label="Schedule a payment" /></span>
            </div>
          )}
        </div>
      </div>

      <div>
        <Eyebrow className="mb-2">Paid</Eyebrow>
        <div className="card divide-y divide-line">
          {paid.map((p) => {
            const v = state.vendors.find((x) => x.id === p.vendorId);
            return (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] text-ink-2">{p.label}</div>
                  <div className="text-[11.5px] text-ink-3">{v?.name}</div>
                </div>
                <div className="text-right">
                  <div className="tnum text-[13px]">{inr(p.amount)}</div>
                  <div className="text-[11px] text-ink-3">paid {fmtDay(p.paidOn)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
