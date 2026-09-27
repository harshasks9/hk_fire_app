"use client";

import React from "react";
import { recommended, formatINR } from "@/lib/ht/catalog";
import { useHt } from "./data";
import { GROUP_LABEL, type Group } from "@/lib/ht/types";
import { GROUP_COLOR } from "./bits";

export function BudgetView({ onPick }: { onPick: (c: string) => void }) {
  const { catalog: CATALOG, byId, total, scenarios: SCENARIOS, lowReturn: LOW_RETURN, rebalance: reb, budgetCap, contingency, budgetNote } = useHt();
  const groups = (Object.keys(GROUP_LABEL) as Group[]).map((g) => ({
    g, sum: CATALOG.filter((c) => c.group === g).reduce((a, c) => a + recommended(c).price, 0),
  }));
  const net = reb ? [...reb.cut, ...reb.add].reduce((a, m) => a + m.delta, 0) : 0;

  return (
    <div className="space-y-10">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow mb-1">Recommended system, AV equipment only{budgetCap ? ` · cap ${formatINR(budgetCap)}` : ""}</div>
            <div className="text-[34px] font-semibold num tracking-[-0.02em]">{formatINR(total)}</div>
            {contingency ? (
              <div className="t2 text-[13px] mt-1 num">
                + {formatINR(contingency)} contingency = <span className="font-semibold">{formatINR(total + contingency)}</span>
                {budgetCap ? <span className="t3"> · {formatINR(budgetCap - total - contingency)} under the cap</span> : null}
              </div>
            ) : null}
          </div>
          <p className="t3 text-[13px] max-w-md">{budgetNote ?? "Room construction (isolation, treatment, baffle wall, HVAC, electrical) is separate. Figures marked est. need a live quote."}</p>
        </div>
        <div className="bar !h-4 mt-5">
          {groups.map(({ g, sum }) => <span key={g} style={{ width: `${(sum / total) * 100}%`, background: GROUP_COLOR[g] }} title={`${GROUP_LABEL[g]} ${formatINR(sum)}`} />)}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {groups.map(({ g, sum }) => (
            <span key={g} className="text-[13px] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GROUP_COLOR[g] }} />
              {GROUP_LABEL[g]} <span className="t3 num">{formatINR(sum)} · {Math.round((sum / total) * 100)}%</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const spent = s.moves.reduce((a, m) => a + m.delta, 0);
          return (
            <div key={s.amount} className="card p-5 flex flex-col">
              <div className="eyebrow">If you spend</div>
              <div className="text-[28px] font-semibold brass tracking-[-0.02em] mt-1">{s.title}</div>
              <p className="t2 text-[14px] leading-relaxed mt-2">{s.summary}</p>
              <ol className="mt-4 space-y-3 flex-1">
                {s.moves.map((m, i) => (
                  <li key={i} className="well p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <button className="text-left text-[14px] font-medium hover:underline" onClick={() => onPick(m.component)}>{m.to}</button>
                      <span className="mono text-[12.5px] shrink-0" style={{ color: "var(--qualified)" }}>{formatINR(m.delta, { sign: true })}</span>
                    </div>
                    <p className="t2 text-[13px] leading-relaxed mt-1.5">{m.what}</p>
                    {m.room && <span className="chip mt-2 !h-5 !text-[10.5px]">room construction</span>}
                  </li>
                ))}
              </ol>
              <div className="mt-4 pt-3 border-t hair text-[12.5px] t3">
                Spends {formatINR(spent)}{s.alt && <p className="mt-1.5 t2 leading-relaxed">{s.alt}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {reb && (
      <div className="card p-5 sm:p-6 border-[rgba(239,122,100,0.25)]">
        <div className="eyebrow mb-2" style={{ color: "var(--disagree)" }}>The evaluator&rsquo;s rebalance · same money, better result</div>
        <p className="text-[15px] leading-relaxed max-w-3xl">{reb.note}</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {[...reb.cut, ...reb.add].map((m) => (
            <button key={m.move} onClick={() => onPick(m.component)} className="well p-3.5 text-left lift">
              <div className="text-[13.5px]">{m.move}</div>
              <div className="mono text-[13px] mt-1" style={{ color: m.delta < 0 ? "var(--agree)" : "var(--qualified)" }}>{formatINR(m.delta, { sign: true })}</div>
            </button>
          ))}
        </div>
        <p className="t3 text-[13px] mt-3">Net change: {formatINR(net, { sign: true })}. The picture improves for every seat, and row 1 loses the wides.</p>
      </div>
      )}

      <div>
        <h3 className="text-[19px] font-semibold mb-1">Where spending more changes little</h3>
        <p className="t2 text-[14px] mb-4">Real money, small audible or visible difference in this room.</p>
        <div className="card divide-y divide-[var(--line)]">
          {LOW_RETURN.map((r) => (
            <button key={r.move} onClick={() => onPick(r.component)} className="w-full text-left grid sm:grid-cols-[minmax(0,1.1fr)_110px_minmax(0,1.6fr)] gap-x-5 gap-y-1 p-4 hover:bg-[var(--card-2)] transition-colors">
              <span className="text-[14px] font-medium">{r.move}<span className="block t3 text-[12px] font-normal">{byId(r.component).name}</span></span>
              <span className="mono text-[13px]" style={{ color: "var(--qualified)" }}>{r.delta}</span>
              <span className="t2 text-[13.5px] leading-relaxed">{r.why}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
