"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { AddButton, RowActions, EntityLink, EmptyWithAdd } from "@/components/Entity";
import { forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { type Quotation, type Vendor } from "@/lib/model/types";
import { PageTitle, Chip, Empty, Tabs, fmtDay } from "@/components/ui";
import { Icon } from "@/components/Icon";
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
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  // Links to a vendor land here as /vendors#<id>. The vendor lives on the
  // Directory tab, so open that tab and bring the vendor into view.
  const showVendor = (id: string) => {
    if (!state.vendors.some((v) => v.id === id)) return;
    setQuery("");
    setTab("Directory");
    setFocusId(id);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }));
  };
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) showVendor(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.vendors.length]);
  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => setFocusId(null), 2400);
    return () => clearTimeout(t);
  }, [focusId]);

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

  const vendors = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...state.vendors].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      (v.city ?? "").toLowerCase().includes(q) ||
      v.trade.some((t) => catLabel(state, t).toLowerCase().includes(q)),
    );
  }, [state, query]);

  return (
    <div>
      <PageTitle
        title="Vendors & quotations"
        sub="Quotes normalised into the same rows, with the differences called out — because the cheapest number is rarely the cheapest deal."
        right={
          <>
            <AddButton on="quotations" label="Log a quotation" />
            <AddButton on="vendors" label="Add a vendor" accent />
          </>
        }
      />

      <Tabs
        tabs={TABS} active={tab} onChange={setTab} label="Vendor views"
        counts={{ "Quotation comparison": state.quotations.length, Directory: state.vendors.length }}
      />

      <div className="mt-6">
        {tab === "Quotation comparison" && (
          sets.length ? (
            <div className="space-y-12">
              {sets.map((g) => <Comparison key={g.key} title={g.title} quotes={g.quotes} onVendor={showVendor} />)}
            </div>
          ) : state.vendors.length ? (
            <EmptyWithAdd on="quotations" icon="compare" title="No quotations logged yet."
              hint="Log what a vendor has quoted and the comparison builds itself — including a warning when two quotes are not for the same thing." />
          ) : (
            <Empty icon="compare" title="No quotations logged yet."
              hint="A quotation belongs to a vendor, so add the vendor first. Then log what they quoted and the comparison builds itself."
              action={<AddButton on="vendors" label="Add a vendor" accent />} />
          )
        )}

        {tab === "Directory" && (
          !state.vendors.length ? (
            <EmptyWithAdd on="vendors" icon="vendors" title="No vendors yet."
              hint="The suppliers, contractors and fabricators you are buying from. A vendor here can be named on a quote, a purchase order, a task or a snag." />
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="input flex items-center gap-2 w-full sm:max-w-sm">
                  <Icon name="search" size={16} className="text-ink-3 shrink-0" />
                  <input
                    className="w-full min-w-0 bg-transparent outline-none" type="search" aria-label="Search vendors"
                    placeholder="Search by name, trade or city" value={query} onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <span className="text-[13px] text-ink-3 tnum">
                  {vendors.length === state.vendors.length ? `${vendors.length} vendors` : `${vendors.length} of ${state.vendors.length} vendors`}
                </span>
              </div>
              {vendors.length ? (
                <div className="card divide-y divide-line overflow-hidden">
                  {vendors.map((v) => <VendorRow key={v.id} v={v} focused={focusId === v.id} />)}
                </div>
              ) : (
                <Empty icon="search" title={`No vendor matches “${query.trim()}”.`}
                  hint="Search looks at the vendor's name, trades and city."
                  action={<button className="btn btn-sm" onClick={() => setQuery("")}>Clear search</button>} />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function VendorRow({ v, focused }: { v: Vendor; focused: boolean }) {
  const { state } = useProject();
  const items = state.items.filter((i) => i.vendorId === v.id);
  const value = items.reduce((a, i) => a + forecastOf(i), 0);
  const snags = state.snags.filter((s) => s.vendorId === v.id && s.status !== "closed");
  const tasks = state.tasks.filter((t) => t.vendorId === v.id && t.status !== "done");
  const quotes = state.quotations.filter((q) => q.vendorId === v.id);

  return (
    <div id={v.id} className={`px-4 sm:px-5 py-4 scroll-mt-24 group transition-colors ${focused ? "bg-accent-soft" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15.5px] leading-snug">{v.name}</h3>
          <div className="text-[13px] text-ink-3 mt-0.5">
            {v.trade.map((t) => catLabel(state, t)).join(" · ") || "No trade set"}
            {v.city && <> · {v.city}</>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {v.rating ? (
            <span className="text-[13px] text-warn tracking-[0.08em]" role="img" aria-label={`Rated ${v.rating} of 5`} title={`Rated ${v.rating} of 5`}>
              {"★".repeat(v.rating)}<span className="text-line-2">{"★".repeat(Math.max(0, 5 - v.rating))}</span>
            </span>
          ) : null}
          <RowActions on="vendors" id={v.id} />
        </div>
      </div>
      {v.notes && <p className="text-[14px] text-ink-2 mt-2 leading-relaxed max-w-3xl">{v.notes}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-[13px] text-ink-3">
        {value > 0 && <span className="tnum text-ink-2 font-medium">{inr(value, { compact: true })} awarded</span>}
        {items.length > 0 && (
          <EntityLink on="items" id={items[0].id}>
            <span className="tnum">{items.length} item{items.length > 1 ? "s" : ""}</span>
          </EntityLink>
        )}
        {quotes.length > 0 && <span className="tnum">{quotes.length} quotation{quotes.length > 1 ? "s" : ""}</span>}
        {tasks.length > 0 && (
          <EntityLink on="tasks" id={tasks[0].id}>
            <span className="tnum">{tasks.length} open task{tasks.length > 1 ? "s" : ""}</span>
          </EntityLink>
        )}
        {snags.length > 0 && (
          <EntityLink on="snags" id={snags[0].id} className="text-bad font-medium hover:underline underline-offset-2">
            <span className="tnum">{snags.length} open snag{snags.length > 1 ? "s" : ""}</span>
          </EntityLink>
        )}
        {v.contact && <span>{v.contact}</span>}
        {v.phone && <a href={`tel:${v.phone.replace(/\s+/g, "")}`} className="link tnum">{v.phone}</a>}
      </div>
    </div>
  );
}

function Comparison({ title, quotes, onVendor }: { title: string; quotes: Quotation[]; onVendor: (id: string) => void }) {
  const { state } = useProject();
  const vendor = (id: string) => state.vendors.find((v) => v.id === id);
  const sorted = [...quotes].sort((a, b) => a.total - b.total);
  const cheapest = sorted[0];
  const recommended = quotes.find((q) => q.recommended);
  const flagged = quotes.filter((q) => q.comparabilityFlags?.length);

  const single = quotes.length === 1;
  type Row = { label: string; get: (q: Quotation) => React.ReactNode };
  const ROWS: Row[] = ([
    { label: "Total", get: (q) => <span className="tnum text-[17px] font-semibold">{inr(q.total)}</span> },
    {
      label: "Against the lowest",
      get: (q) => q.id === cheapest.id
        ? <span className="text-good font-medium">Lowest</span>
        : <span className="tnum text-bad">+{inr(q.total - cheapest.total, { compact: true })}</span>,
    },
  ] as Row[]).filter((r) => !(single && r.label === "Against the lowest"));
  ROWS.push(
    { label: "Brand / spec", get: (q) => q.lines.map((l) => l.brand ?? l.spec).filter(Boolean).join(" · ") || "—" },
    { label: "Warranty", get: (q) => q.warrantyMonths ? `${+(q.warrantyMonths / 12).toFixed(1)} years` : "—" },
    { label: "Lead time", get: (q) => q.leadTimeWeeks ? `${q.leadTimeWeeks} weeks` : "—" },
    { label: "Payment terms", get: (q) => q.paymentTerms ?? "—" },
    { label: "Received", get: (q) => fmtDay(q.receivedAt) },
  );

  const VendorName = ({ q }: { q: Quotation }) => (
    <button onClick={() => onVendor(q.vendorId)} className="text-left text-[15px] font-semibold leading-snug hover:text-accent-strong hover:underline underline-offset-2">
      {vendor(q.vendorId)?.name ?? "Vendor"}
    </button>
  );

  const Included = ({ q }: { q: Quotation }) => (
    <ul className="space-y-1">
      {q.inclusions.map((x, i) => (
        <li key={i} className="text-[13px] text-ink-2 leading-snug flex gap-1.5">
          <span className="text-good shrink-0 font-semibold" aria-hidden>+</span><span><span className="sr-only">Includes </span>{x}</span>
        </li>
      ))}
      {!q.inclusions.length && <li className="text-[13px] text-ink-3">Nothing listed</li>}
    </ul>
  );
  const Excluded = ({ q }: { q: Quotation }) => (
    <ul className="space-y-1">
      {q.exclusions.map((x, i) => (
        <li key={i} className="text-[13px] text-ink-3 leading-snug flex gap-1.5">
          <span className="text-bad shrink-0 font-semibold" aria-hidden>−</span><span><span className="sr-only">Excludes </span>{x}</span>
        </li>
      ))}
      {!q.exclusions.length && <li className="text-[13px] text-ink-3">Nothing listed</li>}
    </ul>
  );

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 mb-3">
        <div className="min-w-0">
          <h2 className="text-[19px] leading-snug">{title}</h2>
          <div className="text-[13px] text-ink-3 mt-0.5">
            {single ? "One quotation so far — add another to compare against it." : `${quotes.length} quotations`}
          </div>
        </div>
        <AddButton on="quotations" prefill={{ title, scopeItemIds: quotes[0]?.scopeItemIds ?? [] }} label="Add a quote to this" />
      </div>

      {flagged.length > 0 && (
        <div className="rounded-xl bg-warn-soft px-4 sm:px-5 py-4 mb-4">
          <div className="flex items-center gap-2">
            <Icon name="alert" size={18} className="text-warn shrink-0" />
            <span className="text-[14.5px] font-semibold">These are not like-for-like</span>
          </div>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            {flagged.map((q) => (
              <div key={q.id}>
                <div className="text-[13.5px] font-semibold">{vendor(q.vendorId)?.name}</div>
                <ul className="mt-1 space-y-1">
                  {q.comparabilityFlags!.map((f, i) => (
                    <li key={i} className="text-[13.5px] text-ink-2 leading-snug flex gap-2">
                      <span className="text-warn shrink-0" aria-hidden>•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">
            Comparing headline totals across these would be misleading. Price the exclusions back in first.
          </p>
        </div>
      )}

      {/* desk: side by side, one row per question */}
      <div className={`hidden md:block card overflow-x-auto thin-scroll ${single ? "max-w-3xl" : ""}`}>
        <table className="table table-fixed" style={{ minWidth: 160 + quotes.length * 210 }}>
          <colgroup>
            <col style={{ width: 160 }} />
            {quotes.map((q) => <col key={q.id} />)}
          </colgroup>
          <thead>
            <tr>
              <th><span className="sr-only">Compared on</span></th>
              {quotes.map((q) => (
                <th key={q.id} id={q.id} className="!normal-case !tracking-normal !font-sans !text-[13px] !text-ink !whitespace-normal align-top scroll-mt-24 group">
                  <div className="flex items-start justify-between gap-2">
                    <VendorName q={q} />
                    {q.recommended && <Chip tone="good" dot>Recommended</Chip>}
                  </div>
                  <div className="flex items-start justify-between gap-2 mt-0.5">
                    <span className="text-[13px] text-ink-3 font-normal leading-snug">{q.title}</span>
                    <RowActions on="quotations" id={q.id} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="text-left font-normal text-[13px] text-ink-3 px-3 py-2.5 border-b border-line align-top">{r.label}</th>
                {quotes.map((q) => (
                  <td key={q.id} className={`text-[14px] ${q.recommended ? "bg-good-soft/40" : ""}`}>{r.get(q)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="text-left font-normal text-[13px] text-ink-3 px-3 py-2.5 border-b border-line align-top">Included</th>
              {quotes.map((q) => <td key={q.id} className={q.recommended ? "bg-good-soft/40" : ""}><Included q={q} /></td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left font-normal text-[13px] text-ink-3 px-3 py-2.5 align-top">Excluded</th>
              {quotes.map((q) => <td key={q.id} className={q.recommended ? "bg-good-soft/40" : ""}><Excluded q={q} /></td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* phone: one card per quote, lowest first */}
      <div className="md:hidden space-y-3">
        {sorted.map((q) => (
          <div key={q.id} className={`card px-4 py-4 group ${q.recommended ? "border-good" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <VendorName q={q} />
                <div className="text-[13px] text-ink-3 mt-0.5 leading-snug">{q.title}</div>
              </div>
              <RowActions on="quotations" id={q.id} />
            </div>
            {q.recommended && <div className="mt-2"><Chip tone="good" dot>Recommended</Chip></div>}
            <dl className="mt-3 divide-y divide-line border-y border-line">
              {ROWS.map((r) => (
                <div key={r.label} className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-[13px] text-ink-3 shrink-0">{r.label}</dt>
                  <dd className="text-[14px] text-right min-w-0">{r.get(q)}</dd>
                </div>
              ))}
            </dl>
            <div className="grid grid-cols-1 gap-3 mt-3">
              <div><div className="eyebrow mb-1.5">Included</div><Included q={q} /></div>
              <div><div className="eyebrow mb-1.5">Excluded</div><Excluded q={q} /></div>
            </div>
          </div>
        ))}
      </div>

      {recommended?.recommendationNote && (
        <div className="rounded-xl bg-good-soft px-4 sm:px-5 py-4 mt-4">
          <div className="text-[14.5px] font-semibold">Why {vendor(recommended.vendorId)?.name}</div>
          <p className="text-[14px] text-ink-2 mt-1 leading-relaxed max-w-3xl">{recommended.recommendationNote}</p>
        </div>
      )}

      <div className="mt-4">
        <Comments targetType="quote" targetId={quotes[0].id} placeholder="Comment on this comparison…" />
      </div>
    </section>
  );
}
