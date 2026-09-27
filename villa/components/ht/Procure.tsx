"use client";

import React from "react";
import { formatINR, byId } from "@/lib/ht/catalog";
import { procurementGroups, IMPORT_RULES, MARKET_PRICES, DO_NOT_IMPORT, OPPORTUNISTIC } from "@/lib/ht/system";
import { BUY_LABEL, type Buy } from "@/lib/ht/types";
import { Est, GROUP_COLOR } from "./bits";

const FLAG: Record<Buy, string> = {
  india: "IN", usa: "US", singapore: "SG", hongkong: "HK", china: "CN", thailand: "TH", threshold: "≥%", "do-not-import": "✕",
};

export function ProcureView({ onPick }: { onPick: (c: string) => void }) {
  const groups = procurementGroups();
  const total = groups.reduce((a, g) => a + g.lines.reduce((b, l) => b + l.option.price, 0), 0);
  const india = groups.find((g) => g.buy === "india")!.lines.reduce((b, l) => b + l.option.price, 0);

  return (
    <div className="space-y-10">
      <div className="grid md:grid-cols-3 gap-3">
        <Tile k="Bought in India" v={formatINR(india)} sub={`${Math.round((india / total) * 100)}% of the system`} />
        <Tile k="Imported" v={formatINR(total - india)} sub="Speakers, amp, screen, sub drivers, meter" />
        <Tile k="Transformers needed" v="None" sub="Every import is passive or universal-voltage" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {groups.filter((g) => g.buy !== "do-not-import").map((g) => {
          const sum = g.lines.reduce((a, l) => a + l.option.price, 0);
          const opp = OPPORTUNISTIC[g.buy];
          return (
            <div key={g.buy} className="card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="mono text-[11px] w-9 h-7 rounded-md flex items-center justify-center border hair t2">{FLAG[g.buy]}</span>
                  <h3 className="text-[16px] font-semibold">{BUY_LABEL[g.buy]}</h3>
                </div>
                {g.lines.length > 0 && <span className="num text-[14px] t2">{formatINR(sum)}</span>}
              </div>
              {g.lines.length === 0 ? (
                <p className="t3 text-[13.5px] leading-relaxed">{opp ?? "Nothing on the recommended list."}</p>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {g.lines.map(({ component: c, option: o }) => (
                    <li key={c.id}>
                      <button className="w-full text-left py-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 group" onClick={() => onPick(c.id)}>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-[12px] t3">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GROUP_COLOR[c.group] }} />{c.name}
                            {o.threshold && <span className="chip !h-5 !text-[10.5px]" style={{ color: "var(--qualified)", borderColor: "rgba(230,184,90,.4)" }}>only if &gt;{o.threshold}% cheaper</span>}
                          </span>
                          <span className="block text-[14px] font-medium mt-0.5 group-hover:underline">{o.name}</span>
                          <span className="block t3 text-[12.5px] mt-0.5 leading-relaxed">{o.importNote ?? o.priceNote}</span>
                        </span>
                        <span className="num text-[14px] text-right">{formatINR(o.price)}<Est on={o.est} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {g.lines.length > 0 && opp && <p className="t3 text-[12.5px] mt-3 leading-relaxed">{opp}</p>}
            </div>
          );
        })}
      </div>

      <div className="card p-5 sm:p-6 border-[rgba(239,122,100,0.25)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="mono text-[11px] w-9 h-7 rounded-md flex items-center justify-center border t2" style={{ borderColor: "rgba(239,122,100,.4)", color: "var(--disagree)" }}>✕</span>
          <h3 className="text-[16px] font-semibold">Do not import</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {DO_NOT_IMPORT.map((d) => (
            <button key={d.what} onClick={() => onPick(d.component)} className="well p-4 text-left lift">
              <div className="text-[14px] font-medium">{d.what}</div>
              <p className="t2 text-[13px] leading-relaxed mt-1">{d.why}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
        <div className="card p-5">
          <div className="eyebrow mb-3">Street prices by market</div>
          <div className="space-y-5">
            {Object.entries(MARKET_PRICES).map(([cid, rows]) => (
              <div key={cid}>
                <button className="text-[14px] font-semibold hover:underline" onClick={() => onPick(cid)}>{byId(cid).name}</button>
                <table className="ht-table mt-1">
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.market + r.local}>
                        <td className="w-[110px] t2">{BUY_LABEL[r.market].replace("Buy in ", "")}</td>
                        <td className="mono">{r.local}</td>
                        <td className="num text-right">{formatINR(r.inr)}</td>
                        <td className="t3 text-[12.5px]">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="eyebrow mb-3">Import rules that decide all of this</div>
          <dl className="space-y-3">
            {IMPORT_RULES.map((r) => (
              <div key={r.k}>
                <dt className="text-[13px] t3">{r.k}</dt>
                <dd className="text-[14px] leading-relaxed">{r.v}</dd>
              </div>
            ))}
          </dl>
          <p className="t3 text-[12px] mt-4 leading-relaxed">Rates: ₹96/USD, ₹75/SGD, ₹12.3/HKD, ₹2.9/THB, ₹14.3/CNY (late Sep 2026). Sources: Business Standard and CBIC on Baggage Rules 2026; Outlook Money on the courier duty cut; dealer listings (AVStore, ProHiFi, avshack, VPLAK, Bajaao) and US retailers.</p>
        </div>
      </div>
    </div>
  );
}

function Tile({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="card p-5">
      <div className="eyebrow">{k}</div>
      <div className="text-[26px] font-semibold num tracking-[-0.02em] mt-1">{v}</div>
      <div className="t3 text-[13px] mt-0.5">{sub}</div>
    </div>
  );
}
