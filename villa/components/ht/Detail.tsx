"use client";

import React, { useEffect, useRef, useState } from "react";
import { recommended, formatINR } from "@/lib/ht/catalog";
import { useHt } from "./data";
import { BUY_LABEL, GROUP_LABEL, REVIEW_Q, type Option } from "@/lib/ht/types";
import { Est, GROUP_COLOR, Seg, TierTag, Verdict } from "./bits";

type Tab = "overview" | "options" | "review";

export function Detail({ id, onClose, compare, onCompare, onOpenCompare }: {
  id: string;
  onClose: () => void;
  compare: { component: string; ids: string[] };
  onCompare: (component: string, optionId: string) => void;
  onOpenCompare: () => void;
}) {
  const { byId } = useHt();
  const c = byId(id);
  const rec = recommended(c);
  const [tab, setTab] = useState<Tab>("overview");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setTab("overview"); }, [id]);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const picked = compare.component === c.id ? compare.ids : [];
  const color = GROUP_COLOR[c.group];

  return (
    <>
      <div className="ht-scrim" onClick={onClose} aria-hidden />
      <aside className="ht-drawer" role="dialog" aria-modal="true" aria-labelledby="ht-detail-title">
        <div className="h-[3px] shrink-0" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <header className="px-5 sm:px-7 pt-5 pb-4 border-b hair shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {GROUP_LABEL[c.group]} · {c.qtyLabel ?? `Qty ${c.qty}`}
              </div>
              <h2 id="ht-detail-title" className="text-[24px] font-semibold tracking-[-0.01em] mt-1.5 leading-tight">{c.name}</h2>
              <p className="brass text-[15px] font-medium mt-1">{rec.name}</p>
            </div>
            <button ref={closeRef} className="btn btn-ghost btn-sm shrink-0" onClick={onClose} aria-label="Close details">Close ✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Fact k="Estimated" v={<>{formatINR(rec.price)}<Est on={rec.est} /></>} />
            <Fact k="Buy" v={rec.buy === "threshold" ? `Import if >${rec.threshold}% saving` : BUY_LABEL[rec.buy].replace("Buy in ", "")} />
            <Fact k="Evaluator" v={<Verdict v={c.review.verdict} short />} />
          </div>
          <div className="mt-4">
            <Seg label="Section" value={tab} onChange={setTab} options={[
              { id: "overview", label: "Overview" },
              { id: "options", label: `Options · ${c.options.length}` },
              { id: "review", label: "AV Evaluator Review" },
            ]} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
          {tab === "overview" && (
            <div className="space-y-6 rise">
              <Block title="Placement"><p className="whitespace-pre-line">{c.placement}</p></Block>
              <Block title="Key specifications">
                <dl className="kv">
                  {rec.specs.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
                </dl>
              </Block>
              <Block title="Why it was selected"><p>{c.why}</p></Block>
              <div className="grid sm:grid-cols-2 gap-3">
                <Mini title="Price">{formatINR(rec.price)}<Est on={rec.est} /><div className="t3 text-[12.5px] mt-1">{rec.priceNote}</div></Mini>
                <Mini title="Where to buy">{rec.buy === "threshold" ? `Import only if the saving beats ${rec.threshold}%` : BUY_LABEL[rec.buy]}{rec.importNote && <div className="t3 text-[12.5px] mt-1">{rec.importNote}</div>}</Mini>
              </div>
              {rec.service && <Block title="Warranty, voltage & service"><p>{rec.service}</p></Block>}
              <Block title="Upgrade path"><p>{c.upgrade}</p></Block>
              <div className="card-flat p-4 flex items-start gap-3">
                <Verdict v={c.review.verdict} />
                <div className="min-w-0">
                  <p className="text-[14px] leading-relaxed">{c.review.headline}</p>
                  <button className="text-[13px] brass mt-1.5 hover:underline" onClick={() => setTab("review")}>Read the full review →</button>
                </div>
              </div>
            </div>
          )}

          {tab === "options" && (
            <div className="space-y-3 rise">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="t3 text-[13px]">Tick up to three options to compare side by side.</p>
                <button className="btn btn-sm btn-brass" disabled={picked.length < 2} onClick={onOpenCompare} style={{ opacity: picked.length < 2 ? 0.45 : 1 }}>
                  Compare {picked.length ? `(${picked.length})` : ""}
                </button>
              </div>
              {c.options.map((o) => (
                <OptionCard key={o.id} o={o} base={rec} checked={picked.includes(o.id)} onToggle={() => onCompare(c.id, o.id)} />
              ))}
            </div>
          )}

          {tab === "review" && (
            <div className="rise">
              <div className="card p-5 mb-5">
                <div className="eyebrow mb-2">AV Evaluator Review · independent</div>
                <Verdict v={c.review.verdict} />
                <p className="text-[17px] leading-snug font-medium mt-2">{c.review.headline}</p>
              </div>
              <ol className="space-y-4">
                {REVIEW_Q.map(([k, q], i) => (
                  <li key={k} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                    <span className="mono t3 text-[12px] pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-[13px] t3">{q}</div>
                      <p className="text-[14.5px] leading-relaxed mt-0.5">{c.review[k]}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Fact({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="well px-3 py-2.5 min-w-0">
      <div className="eyebrow !text-[10px]">{k}</div>
      <div className="text-[14px] font-medium mt-1 truncate">{v}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-2">{title}</div>
      <div className="text-[14.5px] leading-relaxed t2">{children}</div>
    </div>
  );
}

function Mini({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="well p-3.5">
      <div className="eyebrow !text-[10px] mb-1.5">{title}</div>
      <div className="text-[14px]">{children}</div>
    </div>
  );
}

export function OptionCard({ o, base, checked, onToggle }: { o: Option; base: Option; checked: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(o.tier === "recommended");
  const diff = o.price - base.price;
  return (
    <div className={`card-flat overflow-hidden ${o.tier === "recommended" ? "ring-1 ring-[rgba(214,176,106,0.35)]" : ""}`}>
      <div className="flex items-start gap-3 p-4">
        <input
          type="checkbox" checked={checked} onChange={onToggle}
          aria-label={`Compare ${o.name}`}
          className="mt-1 w-4 h-4 accent-[#d6b06a] shrink-0"
        />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <div className="flex flex-wrap items-center gap-2">
            <TierTag tier={o.tier} />
            <span className="t3 text-[12px]">{o.buy === "threshold" ? `Import if >${o.threshold}%` : BUY_LABEL[o.buy]}</span>
          </div>
          <div className="text-[15px] font-semibold mt-1.5 leading-snug">{o.name}</div>
          <div className="flex flex-wrap items-baseline gap-x-3 mt-1">
            <span className="text-[14px]">{formatINR(o.price)}<Est on={o.est} /></span>
            {o.tier !== "recommended" && (
              <span className="text-[12.5px] mono" style={{ color: diff > 0 ? "var(--qualified)" : diff < 0 ? "var(--agree)" : "var(--text-3)" }}>
                {diff === 0 ? "same price" : `${formatINR(diff, { sign: true })} vs recommended`}
              </span>
            )}
          </div>
        </button>
        <span className="t3 text-[12px] pt-1" aria-hidden>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div className="px-4 pb-4 pl-11 space-y-3 text-[13.5px]">
          <p className="leading-relaxed"><span className="t3">What you&rsquo;d notice: </span>{o.perf}</p>
          <dl className="kv">
            {o.specs.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
          </dl>
          <p className="t3 text-[12.5px]">{o.priceNote}</p>
          {o.importNote && <p className="t2"><span className="t3">Import: </span>{o.importNote}</p>}
          {o.service && <p className="t2"><span className="t3">Service: </span>{o.service}</p>}
        </div>
      )}
    </div>
  );
}
