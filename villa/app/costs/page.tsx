"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProject } from "@/lib/store";
import {
  projectFinance, rollup, itemsForFloor, houseWideItems, forecastOf, byCategory,
  upcomingPayments, itemsForSpace,
} from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { type Category, type FloorId, type Payment } from "@/lib/model/types";
import { FLOOR_META } from "@/lib/seed/spaces";
import {
  PageTitle, Stat, BudgetBar, Tabs, Empty, StageChip, fmtDay, relative, Assumed, Bar, Section,
  LegendDot, BAR, useToast,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ItemSheet } from "@/components/ItemSheet";
import { AddButton, RowActions, EntityLink } from "@/components/Entity";
import { ScenarioPlanner } from "@/components/ScenarioPlanner";
import { BoqTable } from "@/components/BoqTable";
import { catLabel } from "@/lib/model/categories";

const TABS = ["Overview", "Drill-down", "BOQ", "Scenarios", "Payments"] as const;
type Tab = (typeof TABS)[number];
type DrillFloor = FloorId | "house";

const VIEW_TAB: Record<string, Tab> = { payments: "Payments", scenarios: "Scenarios", boq: "BOQ", drilldown: "Drill-down" };
const TAB_VIEW: Record<Tab, string | null> = { Overview: null, "Drill-down": "drilldown", BOQ: "boq", Scenarios: "scenarios", Payments: "payments" };

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

function CostsInner() {
  const { state } = useProject();
  const params = useSearchParams();
  const [tab, setTabState] = useState<Tab>(VIEW_TAB[params.get("view") ?? ""] ?? "Overview");
  // An id, not a copy: the sheet must show the item as it is after an edit.
  const [openId, setOpenId] = useState<string | null>(null);
  const [drillFrom, setDrillFrom] = useState<DrillFloor | null>(null);
  const openItem = openId ? state.items.find((i) => i.id === openId) ?? null : null;

  // The tab lives in the address, so a refresh or a shared link lands on it.
  const setTab = (t: Tab) => {
    setTabState(t);
    const v = TAB_VIEW[t];
    window.history.replaceState(null, "", v ? `/costs?view=${v}` : "/costs");
  };

  // House-wide scope has no room to open in, so it opens here instead — once
  // per link, not again every time the project changes.
  const handled = useRef<string | null>(null);
  useEffect(() => {
    const want = params.get("item");
    if (!want || handled.current === want) return;
    if (state.items.some((i) => i.id === want)) {
      handled.current = want;
      setOpenId(want);
      setTabState("BOQ");
    }
  }, [params, state.items]);

  return (
    <div>
      <PageTitle
        title="Costs"
        sub="What was budgeted, what was estimated, what is committed, and what has actually been paid — kept as four different numbers, because they are."
        right={
          <>
            <AddButton on="payments" label="Schedule a payment" />
            <AddButton on="items" label="Add scope" accent />
          </>
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={(t) => { setDrillFrom(null); setTab(t); }} label="Cost views" />

      <div className="mt-6">
        {tab === "Overview" && <Overview onDrill={(f) => { setDrillFrom(f); setTab("Drill-down"); }} />}
        {tab === "Drill-down" && <DrillDown initialFloor={drillFrom} onOpen={setOpenId} />}
        {tab === "BOQ" && <BoqTable onOpen={(i) => setOpenId(i.id)} />}
        {tab === "Scenarios" && <ScenarioPlanner />}
        {tab === "Payments" && <Payments />}
      </div>

      <ItemSheet item={openItem} open={!!openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ----------------------------------------------------------------- overview */

function Overview({ onDrill }: { onDrill: (f: DrillFloor) => void }) {
  const { state } = useProject();
  const fin = projectFinance(state);
  const noBudget = !fin.originalBudget;

  const LADDER = [
    ["Original budget", fin.originalBudget, "What you set out to spend."],
    ["Current approved budget", fin.approvedBudget, "The sum of everything signed off so far."],
    ["Committed", fin.committed, "Purchase orders raised and contracts awarded."],
    ["Paid", fin.paid, "Cash already out."],
    ["Remaining commitments", fin.remainingCommitment, "Owed on work already ordered."],
    ["Uncommitted estimate", fin.uncommittedEstimate, "Forecast on things nobody has ordered yet."],
    ["Contingency", fin.contingency, `${state.meta.contingencyPct}% of the budget — ${inr(fin.contingencyRemaining)} of it still unspent.`],
    ["Forecast final cost", fin.forecast, "The honest number: the hardest available figure for each item."],
  ] as const;

  const floors: FloorId[] = ["ground", "first", "second", "outdoor"];
  const houseWide = rollup(houseWideItems(state), state.decisions);

  const allCats = byCategory(state.items.filter((i) => i.stage !== "not-applicable"));
  const catRows = Array.from(allCats.entries())
    .map(([cat, list]) => ({ cat, forecast: list.reduce((a, i) => a + forecastOf(i), 0), n: list.length }))
    .sort((a, b) => b.forecast - a.forecast)
    .slice(0, 14);
  const catMax = Math.max(...catRows.map((r) => r.forecast), 1);
  const variancePct = fin.originalBudget ? Math.round((fin.budgetVariance / fin.originalBudget) * 100) : 0;

  return (
    <div>
      <div className="card px-5 py-5 mb-10">
        {noBudget && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-accent-soft px-4 py-3 mb-5">
            <Icon name="info" size={18} className="text-accent-strong shrink-0" />
            <p className="text-[14px] text-ink-2 flex-1 min-w-[220px] leading-snug">
              <strong className="font-semibold text-ink">No budget set yet.</strong>{" "}
              The forecast is the sum of today&rsquo;s estimates — set a budget to see how it compares, and to get a contingency.
            </p>
            <Link href="/manage?settings=1" className="btn btn-sm">Set the budget</Link>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-6 mb-6">
          <Stat label="Original budget" value={noBudget ? "Not set" : inr(fin.originalBudget, { compact: true })} large />
          <Stat
            label="Forecast final" value={inr(fin.forecast, { compact: true })} large
            tone={noBudget ? undefined : fin.budgetVariance > 0 ? "bad" : "good"}
            sub={noBudget ? "the sum of every estimate" : `${fin.budgetVariance > 0 ? "+" : ""}${inr(fin.budgetVariance, { compact: true })} (${variancePct > 0 ? "+" : ""}${variancePct}%) against budget`}
          />
          <Stat label="Committed" value={inr(fin.committed, { compact: true })} large sub={`${inr(fin.remainingCommitment, { compact: true })} still owed`} />
          <Stat
            label="Contingency left" large
            value={noBudget ? "—" : inr(fin.contingencyRemaining, { compact: true })}
            tone={noBudget || !fin.contingency ? undefined : fin.contingencyRemaining < fin.contingency * 0.4 ? "warn" : "good"}
            sub={noBudget ? "comes with a budget" : `of ${inr(fin.contingency, { compact: true })}`}
          />
        </div>
        <BudgetBar paid={fin.paid} committed={fin.committed} forecast={fin.forecast} budget={fin.originalBudget} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
          <LegendDot color={BAR.paid} label={`Paid ${inr(fin.paid, { compact: true })}`} />
          <LegendDot color={BAR.committed} label={`Committed, unpaid ${inr(fin.remainingCommitment, { compact: true })}`} />
          <LegendDot color={!noBudget && fin.forecast > fin.originalBudget ? BAR.over : BAR.forecast} label={`Still an estimate ${inr(fin.uncommittedEstimate, { compact: true })}`} />
          {!noBudget && <LegendDot color={BAR.budget} label="Budget line" />}
        </div>
      </div>

      <Section title="From budget to forecast">
        <div className="card divide-y divide-line">
          {LADDER.map(([label, value, hint], i) => {
            const last = i === LADDER.length - 1;
            return (
              <div key={label} className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 ${last ? "bg-paper-2/60 rounded-b-[12px]" : ""}`}>
                <div className="min-w-0">
                  <div className={`text-[14.5px] ${last ? "font-semibold" : ""}`}>{label}</div>
                  <div className="text-[13px] text-ink-3 mt-0.5 leading-snug">{hint}</div>
                </div>
                <span className={`tnum text-[15px] shrink-0 ${last ? "font-semibold" : ""} ${!value ? "text-ink-3" : ""}`}>{inr(value)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-x-6">
        <Section title="By floor">
          <div className="card divide-y divide-line overflow-hidden">
            {floors.map((f) => {
              const r = rollup(itemsForFloor(state, f), state.decisions);
              return (
                <FloorRow key={f} label={FLOOR_META[f].label} r={r} onClick={() => onDrill(f)}
                  foot={`${r.live} items · ${Math.round(r.completionPct)}% complete`} />
              );
            })}
            <FloorRow label="House-wide" r={houseWide} onClick={() => onDrill("house")}
              foot={`${houseWide.live} items — systems and scope that belong to no single room`} />
          </div>
        </Section>

        <Section title="Biggest categories">
          {catRows.length ? (
            <div className="card px-4 sm:px-5 py-5">
              <ul className="space-y-3">
                {catRows.map((r) => (
                  <li key={r.cat}>
                    <div className="flex items-baseline justify-between gap-3 text-[13.5px] mb-1.5">
                      <span className="text-ink-2 min-w-0 truncate">{catLabel(state, r.cat)} <span className="text-ink-3 tnum text-[12.5px]">· {r.n}</span></span>
                      <span className="tnum shrink-0">{inr(r.forecast, { compact: true })}</span>
                    </div>
                    <Bar pct={(r.forecast / catMax) * 100} height={5} tone="var(--color-accent)" label={`${catLabel(state, r.cat)} share of the largest category`} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Empty icon="costs" title="No scope to cost yet." hint="Categories appear here as soon as the rooms have scope in them."
              action={<AddButton on="items" label="Add scope" accent />} />
          )}
        </Section>
      </div>

      <p className="text-[12.5px] text-ink-3 leading-relaxed max-w-2xl">
        Where no vendor quotation exists, the forecast uses the app&rsquo;s{" "}
        <Assumed>indicative rate</Assumed> for that category. Those rates are starting
        assumptions for a premium Hyderabad fit-out, editable on every item, and they are
        not market quotations.
      </p>
    </div>
  );
}

function FloorRow({
  label, r, foot, onClick,
}: { label: string; r: ReturnType<typeof rollup>; foot: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 sm:px-5 py-4 hover:bg-paper transition-colors group">
      <div className="flex items-baseline justify-between gap-3 text-[14.5px] mb-2">
        <span className="font-medium">{label}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="tnum">{inr(r.forecast)}</span>
          <Icon name="chevron-right" size={16} className="text-ink-4 group-hover:text-ink transition-colors self-center" />
        </span>
      </div>
      <BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} />
      <div className="text-[12.5px] text-ink-3 mt-1.5">{foot}</div>
    </button>
  );
}

/* --------------------------------------------------------------- drill-down */

function DrillDown({ onOpen, initialFloor }: { onOpen: (id: string) => void; initialFloor: DrillFloor | null }) {
  const { state } = useProject();
  const [floor, setFloor] = useState<DrillFloor | null>(initialFloor);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [cat, setCat] = useState<Category | null>(null);

  const floors: DrillFloor[] = ["ground", "first", "second", "outdoor", "house"];
  const floorLabel = (f: DrillFloor) => (f === "house" ? "House-wide" : FLOOR_META[f].label);

  const scopeItems = useMemo(() => {
    if (!floor) return state.items;
    if (floor === "house") return houseWideItems(state);
    return itemsForFloor(state, floor);
  }, [state, floor]);

  const spaceItems = spaceId ? itemsForSpace(state, spaceId) : scopeItems;
  const catItems = cat ? spaceItems.filter((i) => i.category === cat && i.stage !== "not-applicable") : spaceItems;

  const spaces = floor && floor !== "house" ? state.spaces.filter((s) => s.floor === floor) : [];
  const cats = Array.from(byCategory(spaceItems.filter((i) => i.stage !== "not-applicable")).entries())
    .map(([c, list]) => ({ c, total: list.reduce((a, i) => a + forecastOf(i), 0), n: list.length }))
    .sort((a, b) => b.total - a.total);

  const crumbs: { label: string; go?: () => void }[] = [
    { label: "Whole project", go: () => { setFloor(null); setSpaceId(null); setCat(null); } },
  ];
  if (floor) crumbs.push({ label: floorLabel(floor), go: () => { setSpaceId(null); setCat(null); } });
  if (spaceId) crumbs.push({ label: state.spaces.find((s) => s.id === spaceId)?.name ?? "Room", go: () => setCat(null) });
  if (cat) crumbs.push({ label: catLabel(state, cat) });

  return (
    <div>
      <nav aria-label="Where you are in the costs" className="mb-5">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px]">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <Icon name="chevron-right" size={14} className="text-ink-4" />}
                {last ? (
                  <span className="font-semibold text-ink" aria-current="page">{c.label}</span>
                ) : (
                  <button onClick={c.go} className="link">{c.label}</button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {!floor && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {floors.map((f) => {
            const r = rollup(f === "house" ? houseWideItems(state) : itemsForFloor(state, f), state.decisions);
            return (
              <DrillCard key={f} title={floorLabel(f)} value={inr(r.forecast, { compact: true })}
                foot={`${r.live} items · ${Math.round(r.completionPct)}% complete`} r={r} onClick={() => setFloor(f)} />
            );
          })}
        </div>
      )}

      {floor && floor !== "house" && !spaceId && (
        spaces.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {spaces.map((s) => {
              const r = rollup(itemsForSpace(state, s.id), state.decisions);
              return (
                <DrillCard key={s.id} title={s.name} value={inr(r.forecast, { compact: true })}
                  foot={`${r.live} item${r.live === 1 ? "" : "s"}`} r={r} onClick={() => setSpaceId(s.id)} />
              );
            })}
          </div>
        ) : (
          <Empty icon="villa" title={`No rooms on the ${floorLabel(floor).toLowerCase()}.`} hint="Rooms are added under Rooms, floor by floor."
            action={<button className="btn btn-sm" onClick={() => setFloor(null)}>Back to the whole project</button>} />
        )
      )}

      {(floor === "house" || spaceId) && !cat && (
        cats.length ? (
          <div className="card divide-y divide-line overflow-hidden">
            {cats.map((c) => (
              <button key={c.c} onClick={() => setCat(c.c)} className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-paper transition-colors text-left group">
                <span className="text-[14.5px] min-w-0 flex-1">
                  {catLabel(state, c.c)} <span className="text-ink-3 tnum text-[13px]">· {c.n} item{c.n === 1 ? "" : "s"}</span>
                </span>
                <span className="tnum text-[14px] shrink-0">{inr(c.total)}</span>
                <Icon name="chevron-right" size={16} className="text-ink-4 group-hover:text-ink transition-colors shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <Empty icon="costs" title="No scope here yet." hint="Nothing in this part of the house has a cost against it."
            action={<AddButton on="items" prefill={spaceId ? { spaceId } : undefined} label="Add scope" accent />} />
        )
      )}

      {cat && (
        catItems.length ? (
          <div className="card divide-y divide-line overflow-hidden">
            {catItems.map((i) => {
              const vendor = i.vendorId ? state.vendors.find((v) => v.id === i.vendorId)?.name : undefined;
              return (
                <button key={i.id} onClick={() => onOpen(i.id)} className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-paper transition-colors text-left">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] leading-snug">{i.title}</div>
                    <div className="text-[13px] text-ink-3 mt-0.5">
                      <span className="tnum">{i.cost.qty} × {inr(i.cost.rate)}</span>{vendor ? ` · ${vendor}` : ""}
                    </div>
                    <div className="mt-1.5 sm:hidden"><StageChip stage={i.stage} /></div>
                  </div>
                  <span className="hidden sm:inline-flex"><StageChip stage={i.stage} /></span>
                  <span className="tnum text-[14px] shrink-0 w-[92px] text-right">{inr(forecastOf(i))}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <Empty icon="costs" title="Nothing left in this category." action={<button className="btn btn-sm" onClick={() => setCat(null)}>Back to categories</button>} />
        )
      )}
    </div>
  );
}

function DrillCard({
  title, value, foot, r, onClick,
}: { title: string; value: string; foot: string; r: ReturnType<typeof rollup>; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card card-link px-4 py-4 text-left group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15.5px] font-semibold leading-snug">{title}</span>
        <Icon name="chevron-right" size={16} className="text-ink-4 group-hover:text-ink transition-colors shrink-0" />
      </div>
      <div className="text-[22px] font-semibold tracking-[-0.02em] mt-2 leading-none">{value}</div>
      <div className="text-[13px] text-ink-3 mt-1.5">{foot}</div>
      <div className="mt-3"><BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} /></div>
    </button>
  );
}

/* ----------------------------------------------------------------- payments */

function Payments() {
  const { state, dispatch } = useProject();
  const toast = useToast();
  const due = upcomingPayments(state, 3650);
  const paid = state.payments.filter((p) => p.paidOn).sort((a, b) => +new Date(b.paidOn!) - +new Date(a.paidOn!));
  const next30 = upcomingPayments(state, 30);
  const now = new Date();
  const overdue = due.filter((p) => new Date(p.dueOn) < now);
  const sum = (list: Payment[]) => list.reduce((a, p) => a + p.amount, 0);

  const markPaid = (p: Payment) => {
    dispatch({ type: "payment/paid", id: p.id, on: new Date().toISOString() });
    toast(`Marked paid: ${p.label}`, {
      action: { label: "Undo", run: () => dispatch({ type: "update", on: "payments", id: p.id, patch: { paidOn: undefined } }) },
    });
  };

  if (!state.payments.length) {
    return (
      <Empty icon="rupee" title="No payments scheduled."
        hint="Schedule advances, milestones and balances against each vendor. What is due in the next 30 days shows on Home."
        action={<AddButton on="payments" label="Schedule a payment" accent />} />
    );
  }

  return (
    <div>
      <div className="card stat-strip mb-10">
        <Stat label="Due in 30 days" value={next30.length ? inr(sum(next30), { compact: true }) : "—"} tone={next30.length ? "warn" : undefined} large
          sub={`${next30.length} payment${next30.length === 1 ? "" : "s"}`} />
        <Stat label="Overdue" value={overdue.length ? inr(sum(overdue), { compact: true }) : "—"} tone={overdue.length ? "bad" : undefined} large
          sub={overdue.length ? `${overdue.length} past the due date` : "nothing late"} />
        <Stat label="Paid to date" value={inr(sum(paid), { compact: true })} tone={paid.length ? "good" : undefined} large
          sub={`${paid.length} payment${paid.length === 1 ? "" : "s"}`} />
        <Stat label="Scheduled total" value={inr(sum(state.payments), { compact: true })} large sub="paid and unpaid" />
      </div>

      <Section title={`Due · ${due.length}`}>
        {due.length ? (
          <div className="card divide-y divide-line">
            {due.map((p) => {
              const late = new Date(p.dueOn) < now;
              const actions = (
                <>
                  <RowActions on="payments" id={p.id} />
                  <button className="btn btn-sm" onClick={() => markPaid(p)}>
                    <Icon name="check" size={15} strokeWidth={2} /> Mark paid
                  </button>
                </>
              );
              return (
                <div key={p.id} id={p.id} className="px-4 sm:px-5 py-3.5 group scroll-mt-24">
                  <div className="flex items-start sm:items-center gap-x-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] leading-snug">{p.label}</div>
                      <div className="text-[13px] text-ink-3 mt-0.5">
                        {p.vendorId ? <EntityLink on="vendors" id={p.vendorId} /> : "No vendor"} · <span className="capitalize">{p.kind}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="tnum text-[14.5px] font-medium">{inr(p.amount)}</div>
                      <div className={`text-[12.5px] tnum ${late ? "text-bad font-semibold" : "text-ink-3"}`}>
                        {fmtDay(p.dueOn)}<span className="hidden sm:inline"> · {relative(p.dueOn)}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 shrink-0">{actions}</div>
                  </div>
                  <div className="sm:hidden flex items-center justify-between gap-2 mt-2">
                    <span className={`text-[12.5px] ${late ? "text-bad font-semibold" : "text-ink-3"}`}>{late ? "Overdue, " : "Due "}{relative(p.dueOn)}</span>
                    <span className="flex items-center gap-1">{actions}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty compact title="Nothing outstanding." hint="Every scheduled payment has been paid."
            action={<AddButton on="payments" label="Schedule a payment" />} />
        )}
      </Section>

      <Section title={`Paid · ${paid.length}`}>
        {paid.length ? (
          <div className="card divide-y divide-line">
            {paid.map((p) => (
              <div key={p.id} id={p.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-4 group scroll-mt-24">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] text-ink-2 leading-snug">{p.label}</div>
                  <div className="text-[13px] text-ink-3 mt-0.5">
                    {p.vendorId ? <EntityLink on="vendors" id={p.vendorId} /> : "No vendor"} · <span className="capitalize">{p.kind}</span>
                  </div>
                </div>
                <RowActions on="payments" id={p.id} />
                <div className="text-right shrink-0">
                  <div className="tnum text-[14.5px]">{inr(p.amount)}</div>
                  <div className="text-[12.5px] text-good tnum">Paid {fmtDay(p.paidOn)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty compact title="Nothing paid yet." hint="Mark a payment paid above and it moves here, with the date." />
        )}
      </Section>
    </div>
  );
}
