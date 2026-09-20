"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { ItemSheet } from "@/components/ItemSheet";
import {
  purchaseList, purchaseTotals, groupPurchases, purchasesToCsv,
  SUPPLY_LABEL, SUPPLY_BLURB, BUY_STATUS_LABEL, BUY_STATUS_TONE,
  type Supply,
} from "@/lib/model/purchase";
import { inr } from "@/lib/model/costing";
import { PageTitle, Eyebrow, Chip, Stat, Empty, Money, fmtDay } from "@/components/ui";

/**
 * The purchase list.
 *
 * Deliberately separate from the BOQ. The BOQ answers "what does this project
 * cost"; this answers "what does somebody have to go and order, and by when".
 * Site work — plaster, paint, wiring, waterproofing — is excluded by
 * construction: there is nothing to buy, only a contractor to book.
 */

const GROUPS = [
  { k: "category", label: "By trade" },
  { k: "room", label: "By room" },
  { k: "supplier", label: "By supplier" },
  { k: "status", label: "By status" },
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

export default function PurchasesPage() {
  const { state } = useProject();
  const [group, setGroup] = useState<GroupKey>("category");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [supply, setSupply] = useState<Supply | "all">("all");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const all = useMemo(() => purchaseList(state), [state]);
  const totals = useMemo(() => purchaseTotals(all), [all]);

  const lines = useMemo(() => {
    let out = all;
    if (supply !== "all") out = out.filter((l) => l.supply === supply);
    switch (filter) {
      case "to-order": out = out.filter((l) => l.status === "to-order"); break;
      case "undecided": out = out.filter((l) => l.status === "undecided"); break;
      case "long-lead": out = out.filter((l) => l.longLead); break;
      case "overdue": out = out.filter((l) => !!l.overdueDays); break;
      case "on-order": out = out.filter((l) => l.status === "ordered" || l.status === "in-transit"); break;
      case "arrived": out = out.filter((l) => l.status === "delivered" || l.status === "installed"); break;
    }
    return out;
  }, [all, filter, supply]);

  const groups = useMemo(() => groupPurchases(lines, group), [lines, group]);
  const shown = purchaseTotals(lines);

  function download() {
    const blob = new Blob([purchasesToCsv(lines)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `villa-purchase-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!all.length) {
    return (
      <div>
        <PageTitle title="Purchase list" sub="Everything that has to be ordered from somebody, kept apart from the site work." />
        <Empty title="Nothing to buy yet."
          hint="Scope items in a trade that is bought in or made to measure appear here automatically. Labour-only trades never do — there is nothing to purchase." />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Purchase list"
        sub="What somebody has to go and order, and by when. Separate from the BOQ on purpose: the BOQ is what the project costs, this is the shopping. Labour-only trades are excluded — there is nothing to buy, only a contractor to book."
        right={<button className="btn btn-sm" onClick={download}>Export CSV</button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <Stat label="To order" value={totals.toOrder} sub={`${inr(totals.toOrderValue, { compact: true })} approved and waiting`}
          tone={totals.toOrder ? "clay" : undefined} />
        <Stat label="Still to decide" value={totals.undecided} sub="cannot be ordered yet" />
        <Stat label="Long lead unordered" value={totals.longLeadUnordered} tone={totals.longLeadUnordered ? "clay" : undefined}
          sub="eight weeks or more" />
        <Stat label="Order date passed" value={totals.overdue || "—"} tone={totals.overdue ? "rust" : undefined}
          sub={totals.overdue ? "late against the target date" : "nothing late"} />
      </div>

      {totals.overdue > 0 && (
        <div className="card-quiet px-4 py-3 mb-4" style={{ borderColor: "#e4c8bf" }}>
          <Eyebrow>Order these first</Eyebrow>
          <p className="text-[12px] text-ink-2 mt-1 leading-relaxed max-w-3xl">
            {totals.overdue} line{totals.overdue > 1 ? "s have" : " has"} passed the last date it could be ordered and
            still land for its target. A lead time does not shorten because the order was late — the target date moves instead.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------ filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className="btn btn-sm"
            style={filter === f.k ? { background: "var(--color-ink)", color: "var(--color-paper)", borderColor: "var(--color-ink)" } : undefined}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {(["all", "bought", "made"] as const).map((s) => (
          <button key={s} onClick={() => setSupply(s)} className="btn btn-sm"
            title={s === "all" ? undefined : SUPPLY_BLURB[s]}
            style={supply === s ? { background: "var(--color-ink)", color: "var(--color-paper)", borderColor: "var(--color-ink)" } : undefined}>
            {s === "all" ? "Bought and made" : SUPPLY_LABEL[s]}
          </button>
        ))}
        <span className="text-ink-4 mx-1 hidden sm:inline">|</span>
        {GROUPS.map((g) => (
          <button key={g.k} onClick={() => setGroup(g.k)} className="btn btn-sm"
            style={group === g.k ? { background: "var(--color-ink)", color: "var(--color-paper)", borderColor: "var(--color-ink)" } : undefined}>
            {g.label}
          </button>
        ))}
        <span className="text-[11.5px] text-ink-3 ml-auto tnum">
          {shown.lines} lines · {inr(shown.value, { compact: true })}
        </span>
      </div>

      {!lines.length ? (
        <Empty title="Nothing matches that filter." hint="Widen it, or switch back to Everything." />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="card overflow-hidden">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 border-b border-ink-6">
                <span className="text-[13.5px]" style={{ fontFamily: "var(--font-display)" }}>{g.label}</span>
                <span className="text-[11.5px] text-ink-3 tnum">{g.lines.length} lines · {inr(g.value, { compact: true })}</span>
              </div>
              {/* desktop */}
              <div className="hidden md:block overflow-x-auto thin-scroll">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-ink-3 text-left">
                      {["Item", "Where", "Qty", "Value", "Supplier", "Lead", "Order by", "Status"].map((h) => (
                        <th key={h} className="font-normal px-3 py-1.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.lines.map((l) => (
                      <tr key={l.itemId} className="border-t border-ink-6 hover:bg-[#faf7f2] cursor-pointer"
                        onClick={() => setOpenItem(l.itemId)}>
                        <td className="px-3 py-2 max-w-[260px]">
                          <div className="truncate">{l.title}</div>
                          {(l.product || l.brand) && (
                            <div className="text-[11px] text-ink-3 truncate">{[l.brand, l.product].filter(Boolean).join(" — ")}</div>
                          )}
                          {l.blockedBy && <div className="text-[11px] text-clay truncate">blocked: {l.blockedBy}</div>}
                        </td>
                        <td className="px-3 py-2 text-ink-3 whitespace-nowrap">{l.where}</td>
                        <td className="px-3 py-2 tnum whitespace-nowrap">{l.qty} {l.unit}</td>
                        <td className="px-3 py-2 tnum whitespace-nowrap"><Money value={l.value} compact /></td>
                        <td className="px-3 py-2 text-ink-3 whitespace-nowrap">{l.vendor ?? "—"}</td>
                        <td className="px-3 py-2 tnum whitespace-nowrap">
                          {l.leadWeeks}w {l.longLead && <Chip tone="ochre">long</Chip>}
                        </td>
                        <td className="px-3 py-2 tnum whitespace-nowrap">
                          {l.orderBy ? fmtDay(l.orderBy) : "—"}
                          {l.overdueDays && <span className="text-rust ml-1">+{l.overdueDays}d</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap"><Chip tone={BUY_STATUS_TONE[l.status]}>{BUY_STATUS_LABEL[l.status]}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* mobile */}
              <div className="md:hidden divide-y divide-ink-6">
                {g.lines.map((l) => (
                  <button key={l.itemId} onClick={() => setOpenItem(l.itemId)} className="w-full text-left px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] leading-snug">{l.title}</div>
                        <div className="text-[11px] text-ink-3 mt-0.5">{l.where} · {l.qty} {l.unit}</div>
                      </div>
                      <span className="text-[12px] tnum shrink-0"><Money value={l.value} compact /></span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Chip tone={BUY_STATUS_TONE[l.status]}>{BUY_STATUS_LABEL[l.status]}</Chip>
                      {l.longLead && <Chip tone="ochre">{l.leadWeeks}w lead</Chip>}
                      {l.overdueDays && <Chip tone="rust">{l.overdueDays}d late</Chip>}
                      {l.vendor && <span className="text-[11px] text-ink-3">{l.vendor}</span>}
                    </div>
                    {l.blockedBy && <div className="text-[11px] text-clay mt-1">blocked: {l.blockedBy}</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11.5px] text-ink-3 mt-5 leading-relaxed max-w-3xl">
        <strong className="text-ink-2 font-medium">Order by</strong> is the target installation date less the lead time — the
        last day this can be ordered and still arrive on time. Values follow the same ladder as everywhere else in the app:
        the order amount if there is one, otherwise the committed, approved, quoted or estimated figure, in that order.
        The pipeline and delivery tracking for anything already ordered lives on{" "}
        <Link href="/procurement" className="text-clay hover:underline">Procurement</Link>.
      </p>

      <ItemSheet item={state.items.find((i) => i.id === openItem) ?? null} open={!!openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
