"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { CATEGORY_LABEL, type Quotation } from "@/lib/model/types";
import { PageTitle, Eyebrow, Chip, Empty, Tabs, Stat, fmtDay, Assumed } from "@/components/ui";
import { Comments } from "@/components/Comments";
import { catLabel } from "@/lib/model/categories";

const TABS = ["Quotation comparison", "Directory"] as const;
type Tab = (typeof TABS)[number];

/**
 * Vendors and quotations.
 *
 * The comparison is the point. Three quotes with three different headline
 * numbers are meaningless until you know what is inside each one — so the
 * comparison normalises them into the same rows and shouts, loudly, when they
 * are not like-for-like. A cheaper quote that excludes the countertop is not a
 * cheaper quote.
 */
export default function VendorsPage() {
  const { state } = useProject();
  const [tab, setTab] = useState<Tab>("Quotation comparison");

  // Group quotes that cover overlapping scope — those are the comparable sets.
  const sets = useMemo(() => {
    const groups: { key: string; title: string; quotes: Quotation[] }[] = [];
    const used = new Set<string>();
    for (const q of state.quotations) {
      if (used.has(q.id)) continue;
      const siblings = state.quotations.filter(
        (o) => !used.has(o.id) && o.scopeItemIds.some((s) => q.scopeItemIds.includes(s)),
      );
      siblings.forEach((s) => used.add(s.id));
      const firstItem = state.items.find((i) => i.id === q.scopeItemIds[0]);
      const space = firstItem?.spaceId ? state.spaces.find((s) => s.id === firstItem.spaceId) : undefined;
      groups.push({
        key: q.id,
        title: space ? `${space.name} — ${firstItem?.title}` : firstItem?.title ?? q.title,
        quotes: siblings,
      });
    }
    return groups;
  }, [state.quotations, state.items, state.spaces]);

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Vendors</div>
      <PageTitle
        title="Vendors & quotations"
        sub="Quotes normalised into the same rows, with the differences called out — because the cheapest number is rarely the cheapest deal."
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ "Quotation comparison": state.quotations.length, Directory: state.vendors.length }} />

      <div className="mt-6">
        {tab === "Quotation comparison" && (
          sets.length ? (
            <div className="space-y-8">
              {sets.map((g) => <Comparison key={g.key} title={g.title} quotes={g.quotes} />)}
            </div>
          ) : <Empty title="No quotations received yet." />
        )}

        {tab === "Directory" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {state.vendors.map((v) => {
              const items = state.items.filter((i) => i.vendorId === v.id);
              const value = items.reduce((a, i) => a + forecastOf(i), 0);
              const snags = state.snags.filter((s) => s.vendorId === v.id && s.status !== "closed");
              const tasks = state.tasks.filter((t) => t.vendorId === v.id && t.status !== "done");
              return (
                <div key={v.id} id={v.id} className="card px-4 py-4 scroll-mt-24">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{v.name}</div>
                      <div className="text-[11.5px] text-ink-3 mt-0.5">{v.trade.map((t) => catLabel(state, t)).join(" · ")}</div>
                    </div>
                    {v.rating && (
                      <span className="text-[12px] text-ochre shrink-0" title={`${v.rating} of 5`}>
                        {"★".repeat(v.rating)}<span className="text-ink-4">{"★".repeat(5 - v.rating)}</span>
                      </span>
                    )}
                  </div>
                  {v.notes && <p className="text-[12.5px] text-ink-3 mt-2 leading-relaxed">{v.notes}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11.5px] text-ink-3">
                    {value > 0 && <span className="tnum">{inr(value, { compact: true })} awarded</span>}
                    {items.length > 0 && <span className="tnum">{items.length} items</span>}
                    {tasks.length > 0 && <span className="tnum">{tasks.length} open tasks</span>}
                    {snags.length > 0 && <span className="text-rust tnum">{snags.length} open snags</span>}
                    {v.contact && <span>{v.contact}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Comparison({ title, quotes }: { title: string; quotes: Quotation[] }) {
  const { state, dispatch } = useProject();
  const vendor = (id: string) => state.vendors.find((v) => v.id === id);
  const sorted = [...quotes].sort((a, b) => a.total - b.total);
  const cheapest = sorted[0];
  const recommended = quotes.find((q) => q.recommended);
  const flagged = quotes.filter((q) => q.comparabilityFlags?.length);

  const ROWS: { label: string; get: (q: Quotation) => React.ReactNode }[] = [
    { label: "Total", get: (q) => <span className="tnum text-[16px] font-medium">{inr(q.total)}</span> },
    { label: "vs cheapest", get: (q) => q.id === cheapest.id ? <span className="text-sage text-[12px]">lowest</span> : <span className="tnum text-[12px] text-rust">+{inr(q.total - cheapest.total, { compact: true })}</span> },
    { label: "Brand / spec", get: (q) => <span className="text-[12px]">{q.lines.map((l) => l.brand ?? l.spec).filter(Boolean).join(" · ") || "—"}</span> },
    { label: "Warranty", get: (q) => q.warrantyMonths ? `${q.warrantyMonths / 12} years` : "—" },
    { label: "Lead time", get: (q) => q.leadTimeWeeks ? `${q.leadTimeWeeks} weeks` : "—" },
    { label: "Payment terms", get: (q) => <span className="text-[12px]">{q.paymentTerms ?? "—"}</span> },
    { label: "Received", get: (q) => fmtDay(q.receivedAt) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-[19px]">{title}</h2>
        <span className="text-[12px] text-ink-3">{quotes.length} quotation{quotes.length > 1 ? "s" : ""}</span>
      </div>

      {flagged.length > 0 && (
        <div className="card px-4 py-3.5 mb-3" style={{ borderColor: "#e2c9a8", background: "#fdf9f1" }}>
          <Eyebrow>These are not like-for-like</Eyebrow>
          <div className="mt-2 space-y-2">
            {flagged.map((q) => (
              <div key={q.id}>
                <div className="text-[12.5px] font-medium">{vendor(q.vendorId)?.name}</div>
                <ul className="mt-1 space-y-0.5">
                  {q.comparabilityFlags!.map((f, i) => (
                    <li key={i} className="text-[12px] text-ink-2 leading-relaxed flex gap-1.5">
                      <span className="text-ochre shrink-0">·</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-ink-3 mt-2.5 leading-relaxed">
            Comparing headline totals across these would be misleading. Price the exclusions back in first.
          </p>
        </div>
      )}

      <div className="overflow-x-auto thin-scroll">
        <div className="grid gap-3 min-w-max" style={{ gridTemplateColumns: `128px repeat(${quotes.length}, minmax(230px, 1fr))` }}>
          <div />
          {quotes.map((q) => (
            <div key={q.id} className="card px-3.5 py-3" style={{ borderColor: q.recommended ? "var(--color-sage)" : undefined }}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13.5px] font-medium leading-snug">{vendor(q.vendorId)?.name}</div>
                {q.recommended && <Chip tone="sage">Recommended</Chip>}
              </div>
              <div className="text-[11px] text-ink-3 mt-0.5">{q.title}</div>
            </div>
          ))}

          {ROWS.map((r) => (
            <React.Fragment key={r.label}>
              <div className="text-[11.5px] text-ink-3 py-2 self-center">{r.label}</div>
              {quotes.map((q) => (
                <div key={q.id} className="py-2 px-3.5 text-[13px] self-center">{r.get(q)}</div>
              ))}
            </React.Fragment>
          ))}

          <div className="text-[11.5px] text-ink-3 py-2">Included</div>
          {quotes.map((q) => (
            <ul key={q.id} className="py-2 px-3.5 space-y-1">
              {q.inclusions.map((x, i) => (
                <li key={i} className="text-[11.5px] text-ink-2 leading-snug flex gap-1.5">
                  <span className="text-sage shrink-0">+</span>{x}
                </li>
              ))}
            </ul>
          ))}

          <div className="text-[11.5px] text-ink-3 py-2">Excluded</div>
          {quotes.map((q) => (
            <ul key={q.id} className="py-2 px-3.5 space-y-1">
              {q.exclusions.map((x, i) => (
                <li key={i} className="text-[11.5px] text-ink-3 leading-snug flex gap-1.5">
                  <span className="text-rust shrink-0">−</span>{x}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {recommended?.recommendationNote && (
        <div className="card-quiet px-4 py-3.5 mt-3">
          <Eyebrow>Why {vendor(recommended.vendorId)?.name}</Eyebrow>
          <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">{recommended.recommendationNote}</p>
        </div>
      )}

      <div className="mt-3">
        <Comments targetType="quote" targetId={quotes[0].id} placeholder="Comment on this comparison…" />
      </div>
    </div>
  );
}
