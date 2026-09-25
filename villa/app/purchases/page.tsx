"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { ItemSheet } from "@/components/ItemSheet";
import { AddButton } from "@/components/Entity";
import {
  purchaseList, purchaseTotals, groupPurchases, purchasesToCsv,
  SUPPLY_LABEL, SUPPLY_BLURB, BUY_STATUS_LABEL, BUY_STATUS_TONE,
  type Supply, type PurchaseLine,
} from "@/lib/model/purchase";
import { inr } from "@/lib/model/costing";
import { PageTitle, Chip, Stat, Empty, fmtDay, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * The purchase list.
 *
 * Deliberately separate from the BOQ. The BOQ answers "what does this project
 * cost"; this answers "what does somebody have to go and order, and by when".
 * Site work — plaster, paint, wiring, waterproofing — is excluded by
 * construction: there is nothing to buy, only a contractor to book.
 */

const GROUPS = [
  { k: "category", label: "Trade" },
  { k: "room", label: "Room" },
  { k: "supplier", label: "Supplier" },
  { k: "status", label: "Status" },
] as const;

type GroupKey = (typeof GROUPS)[number]["k"];

const FILTERS = [
  { k: "all", label: "Everything" },
  { k: "to-order", label: "Ready to order" },
  { k: "undecided", label: "Still to decide" },
  { k: "long-lead", label: "Long lead" },
  { k: "overdue", label: "Order date passed" },
  { k: "on-order", label: "On order" },
  { k: "arrived", label: "Arrived" },
] as const;

type FilterKey = (typeof FILTERS)[number]["k"];

const MATCH: Record<FilterKey, (l: PurchaseLine) => boolean> = {
  all: () => true,
  "to-order": (l) => l.status === "to-order",
  undecided: (l) => l.status === "undecided",
  "long-lead": (l) => l.longLead,
  overdue: (l) => !!l.overdueDays,
  "on-order": (l) => l.status === "ordered" || l.status === "in-transit",
  arrived: (l) => l.status === "delivered" || l.status === "installed",
};

/** With this many lines or fewer, every group starts open. */
const OPEN_ALL_BELOW = 60;
/** Otherwise the first few groups start open… */
const OPEN_FIRST = 3;
/** …and an open group shows this many lines before "Show all". */
const FIRST_ROWS = 12;

export default function PurchasesPage() {
  const { state } = useProject();
  const toast = useToast();
  const [group, setGroup] = useState<GroupKey>("category");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [supply, setSupply] = useState<Supply | "all">("all");
  const [openItem, setOpenItem] = useState<string | null>(null);
  /** Groups opened or closed by hand, and groups showing every line — keyed by grouping, so switching grouping starts fresh. */
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const all = useMemo(() => purchaseList(state), [state]);
  const totals = useMemo(() => purchaseTotals(all), [all]);

  const bySupply = useMemo(() => (supply === "all" ? all : all.filter((l) => l.supply === supply)), [all, supply]);
  const lines = useMemo(() => bySupply.filter(MATCH[filter]), [bySupply, filter]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.k, bySupply.filter(MATCH[f.k]).length])) as Record<FilterKey, number>,
    [bySupply],
  );

  const groups = useMemo(() => groupPurchases(lines, group), [lines, group]);
  const shown = purchaseTotals(lines);

  const keyOf = (k: string) => `${group}:${k}`;
  const isOpen = (k: string, i: number) => toggled[keyOf(k)] ?? (lines.length <= OPEN_ALL_BELOW || i < OPEN_FIRST);
  const allOpen = groups.every((g, i) => isOpen(g.key, i));
  const setAll = (open: boolean) => setToggled((t) => ({ ...t, ...Object.fromEntries(groups.map((g) => [keyOf(g.key), open])) }));

  const filtered = filter !== "all" || supply !== "all";
  const clearFilters = () => { setFilter("all"); setSupply("all"); };

  function download() {
    const blob = new Blob([purchasesToCsv(lines)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `villa-purchase-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Downloaded ${lines.length} line${lines.length === 1 ? "" : "s"} as CSV`);
  }

  if (!all.length) {
    return (
      <div>
        <PageTitle title="Purchase list" sub="Everything that has to be ordered from somebody, kept apart from the site work." />
        <Empty icon="buy" title="Nothing to buy yet."
          hint="Scope items in a trade that is bought in or made to measure appear here automatically. Labour-only trades never do — there is nothing to purchase."
          action={<AddButton on="items" label="Add something to buy" accent />} />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Purchase list"
        sub="What somebody has to go and order, and by when. Separate from the BOQ on purpose: the BOQ is what the project costs, this is the shopping. Labour-only trades are left out — there is nothing to buy, only a contractor to book."
        right={
          <>
            <button className="btn btn-sm" onClick={download} disabled={!lines.length}>
              <Icon name="download" size={15} /> Export CSV
            </button>
            <AddButton on="items" label="Add something to buy" accent />
          </>
        }
      />

      <div className="card stat-strip mb-6">
        <Stat label="Ready to order" value={totals.toOrder} sub={`${inr(totals.toOrderValue, { compact: true })} approved and waiting`}
          tone={totals.toOrder ? "accent" : undefined} large />
        <Stat label="Still to decide" value={totals.undecided} sub="cannot be ordered yet" large />
        <Stat label="Long lead, unordered" value={totals.longLeadUnordered} tone={totals.longLeadUnordered ? "warn" : undefined}
          sub="eight weeks or more" large />
        <Stat label="Order date passed" value={totals.overdue || "—"} tone={totals.overdue ? "bad" : undefined}
          sub={totals.overdue ? "late against the target date" : "nothing late"} large />
      </div>

      {totals.overdue > 0 && (
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3 rounded-xl bg-bad-soft px-4 sm:px-5 py-4 mb-6">
          <Icon name="alert" size={19} className="text-bad shrink-0 mt-0.5" />
          <div className="flex-1 min-w-[220px]">
            <div className="text-[14.5px] font-semibold text-ink">
              {totals.overdue} line{totals.overdue > 1 ? "s have" : " has"} passed the last date to order
            </div>
            <p className="text-[14px] text-ink-2 mt-1 leading-relaxed max-w-3xl">
              Order these first. A lead time does not shorten because the order was late — the target date moves instead.
            </p>
          </div>
          {filter !== "overdue" && (
            <button className="btn btn-sm" onClick={() => { setSupply("all"); setFilter("overdue"); }}>Show the late lines</button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ filters */}
      <div className="space-y-3 mb-5">
        <div className="flex gap-1.5 overflow-x-auto thin-scroll -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-0.5" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} className="pill shrink-0" aria-pressed={filter === f.k}>
              {f.label} <span className="count">{counts[f.k]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto thin-scroll -mx-4 px-4 sm:mx-0 sm:px-0 max-w-[calc(100%+2rem)] sm:max-w-none pb-0.5" role="group" aria-label="Supply">
            {(["all", "bought", "made"] as const).map((s) => (
              <button key={s} onClick={() => setSupply(s)} className="pill shrink-0" aria-pressed={supply === s}
                title={s === "all" ? undefined : SUPPLY_BLURB[s]}>
                {s === "all" ? "Bought and made" : SUPPLY_LABEL[s]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13.5px] text-ink-3">
            Group by
            <select className="input w-auto min-h-[34px] py-1" value={group} onChange={(e) => setGroup(e.target.value as GroupKey)}>
              {GROUPS.map((g) => <option key={g.k} value={g.k}>{g.label}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[13px] text-ink-3 tnum">
              {shown.lines} line{shown.lines === 1 ? "" : "s"} · {inr(shown.value, { compact: true })}
            </span>
            {groups.length > 1 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setAll(!allOpen)}>
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
            )}
          </div>
        </div>
      </div>

      {!lines.length ? (
        <Empty icon="search" title="Nothing matches these filters."
          hint={filtered ? "No line is both of these. Clear the filters to see the whole list." : undefined}
          action={<button className="btn btn-sm" onClick={clearFilters}>Clear filters</button>} />
      ) : (
        <div className="space-y-3">
          {groups.map((g, gi) => {
            const open = isOpen(g.key, gi);
            const k = keyOf(g.key);
            const showAll = expanded[k] || g.lines.length <= FIRST_ROWS + 3;
            const visible = showAll ? g.lines : g.lines.slice(0, FIRST_ROWS);
            const bodyId = `buy-${group}-${g.key}`;
            return (
              <section key={g.key} className="card overflow-hidden">
                <h2 className="text-[15px]">
                  <button
                    onClick={() => setToggled((t) => ({ ...t, [k]: !open }))}
                    aria-expanded={open} aria-controls={bodyId}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paper transition-colors ${open ? "border-b border-line" : ""}`}
                  >
                    <Icon name="chevron-right" size={16} className={`text-ink-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                    <span className="flex-1 min-w-0 truncate font-semibold">{g.label}</span>
                    <span className="text-[13px] text-ink-3 tnum font-normal shrink-0">
                      {g.lines.length} line{g.lines.length === 1 ? "" : "s"} · <span className="text-ink-2">{inr(g.value, { compact: true })}</span>
                    </span>
                  </button>
                </h2>

                {open && (
                  <div id={bodyId}>
                    {/* desk */}
                    <div className="hidden md:block overflow-x-auto thin-scroll">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            {group !== "room" && <th>Where</th>}
                            <th className="num">Qty</th>
                            <th className="num">Value</th>
                            {group !== "supplier" && <th>Supplier</th>}
                            <th>Lead</th>
                            <th>Order by</th>
                            {group !== "status" && <th>Status</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((l) => (
                            <tr key={l.itemId} className="cursor-pointer" onClick={() => setOpenItem(l.itemId)}>
                              <td className="max-w-[300px]">
                                <button className="text-left w-full font-medium hover:text-accent-strong" onClick={(e) => { e.stopPropagation(); setOpenItem(l.itemId); }}>
                                  <span className="block truncate">{l.title}</span>
                                </button>
                                {(l.product || l.brand) && (
                                  <div className="text-[12.5px] text-ink-3 truncate">{[l.brand, l.product].filter(Boolean).join(" — ")}</div>
                                )}
                                {l.blockedBy && <div className="text-[12.5px] text-warn truncate">Blocked: {l.blockedBy}</div>}
                              </td>
                              {group !== "room" && <td className="text-ink-3 whitespace-nowrap">{l.where}</td>}
                              <td className="num whitespace-nowrap">{l.qty} {l.unit}</td>
                              <td className="num whitespace-nowrap">{inr(l.value, { compact: true })}</td>
                              {group !== "supplier" && <td className="text-ink-3 whitespace-nowrap">{l.vendor ?? "—"}</td>}
                              <td className="tnum whitespace-nowrap">
                                {l.leadWeeks} wk {l.longLead && <Chip tone="warn">Long</Chip>}
                              </td>
                              <td className="tnum whitespace-nowrap">
                                {l.orderBy ? fmtDay(l.orderBy) : "—"}
                                {l.overdueDays ? <span className="text-bad font-semibold ml-1.5">{l.overdueDays}d late</span> : null}
                              </td>
                              {group !== "status" && <td className="whitespace-nowrap"><Chip tone={BUY_STATUS_TONE[l.status]}>{BUY_STATUS_LABEL[l.status]}</Chip></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* phone */}
                    <div className="md:hidden divide-y divide-line">
                      {visible.map((l) => (
                        <button key={l.itemId} onClick={() => setOpenItem(l.itemId)} className="w-full text-left px-4 py-3.5 hover:bg-paper transition-colors">
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block text-[14.5px] font-medium leading-snug">{l.title}</span>
                              <span className="block text-[13px] text-ink-3 mt-0.5">{l.where} · <span className="tnum">{l.qty} {l.unit}</span></span>
                            </span>
                            <span className="text-[14px] tnum font-medium shrink-0">{inr(l.value, { compact: true })}</span>
                          </span>
                          <span className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Chip tone={BUY_STATUS_TONE[l.status]}>{BUY_STATUS_LABEL[l.status]}</Chip>
                            {l.longLead && <Chip tone="warn">{l.leadWeeks} wk lead</Chip>}
                            {l.overdueDays ? <Chip tone="bad">{l.overdueDays}d late</Chip> : null}
                            {l.vendor && <span className="text-[13px] text-ink-3">{l.vendor}</span>}
                          </span>
                          {l.blockedBy && <span className="block text-[13px] text-warn mt-1.5">Blocked: {l.blockedBy}</span>}
                        </button>
                      ))}
                    </div>
                    {!showAll && (
                      <div className="border-t border-line px-4 py-2.5">
                        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded((x) => ({ ...x, [k]: true }))}>
                          <Icon name="chevron-down" size={15} /> Show all {g.lines.length} lines
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="text-[12.5px] text-ink-3 mt-6 leading-relaxed max-w-3xl">
        <strong className="text-ink-2 font-medium">Order by</strong> is the target installation date less the lead time — the
        last day this can be ordered and still arrive on time. Values follow the same ladder as everywhere else in the app:
        the order amount if there is one, otherwise the committed, approved, quoted or estimated figure, in that order.
        The pipeline and delivery tracking for anything already ordered lives on{" "}
        <Link href="/procurement" className="link">Procurement</Link>.
      </p>

      <ItemSheet item={state.items.find((i) => i.id === openItem) ?? null} open={!!openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
