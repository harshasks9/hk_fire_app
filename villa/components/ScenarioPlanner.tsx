"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { SCENARIOS, TRADE_OFFS, scenarioForecast, scenarioTotal } from "@/lib/seed";
import { forecastOf, byCategory, itemsForSpace, projectFinance } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { CATEGORY_LABEL, type Category, type Scenario } from "@/lib/model/types";
import { Eyebrow, Stat, Money, Bar, Chip, Assumed } from "./ui";
import { catLabel } from "@/lib/model/categories";

/**
 * The scenario planner.
 *
 * A scenario is a lens, not a fork: the same scope seen at a different spend
 * level. The comparison that matters is not the headline total but *where* the
 * extra money goes — so every view answers "what does this buy me" at category
 * level, and every trade-off shows both the room cost and the whole-project cost.
 */
export function ScenarioPlanner() {
  const { state } = useProject();
  const [active, setActive] = useState<string>("sc-premium");
  const [room, setRoom] = useState<string>("");

  const live = state.items.filter((i) => i.stage !== "not-applicable");
  const fin = projectFinance(state);

  const totals = useMemo(
    () => SCENARIOS.map((s) => ({ s, total: scenarioTotal(live, s) })),
    [live],
  );
  const baseline = totals.find((t) => t.s.id === "sc-premium")!.total;
  const current = totals.find((t) => t.s.id === active)!;

  // Where the difference between this scenario and the baseline actually sits.
  const catDelta = useMemo(() => {
    const grouped = byCategory(live);
    const rows: { cat: Category; base: number; now: number; delta: number }[] = [];
    for (const [cat, list] of grouped) {
      const base = list.reduce((a, i) => a + scenarioForecast(i, SCENARIOS.find((s) => s.id === "sc-premium")), 0);
      const now = list.reduce((a, i) => a + scenarioForecast(i, current.s), 0);
      if (Math.abs(now - base) > 1000) rows.push({ cat, base, now, delta: now - base });
    }
    return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [live, current.s]);

  const maxDelta = Math.max(...catDelta.map((r) => Math.abs(r.delta)), 1);

  return (
    <div className="space-y-7">
      {/* ------------------------------------------------------- the three */}
      <div>
        <Eyebrow className="mb-2.5">Three versions of the same villa</Eyebrow>
        <div className="grid md:grid-cols-3 gap-3">
          {totals.map(({ s, total }) => {
            const on = s.id === active;
            const delta = total - baseline;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className="card text-left px-4 py-4 transition-all"
                style={{
                  borderColor: on ? "var(--color-clay)" : "var(--color-line)",
                  boxShadow: on ? "0 2px 14px rgba(176,96,58,.12)" : undefined,
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[16px]" style={{ fontFamily: "var(--font-display)" }}>{s.name}</span>
                  {s.id === "sc-premium" && <Chip tone="ghost">as designed</Chip>}
                </div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">{s.subtitle}</div>
                <div className="tnum text-[26px] mt-3 leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  {inr(total, { compact: true })}
                </div>
                {delta !== 0 && (
                  <div className="text-[12px] mt-1.5 tnum" style={{ color: delta > 0 ? "#8d3a2c" : "#41603f" }}>
                    {delta > 0 ? "+" : ""}{inr(delta, { compact: true })} vs as designed
                  </div>
                )}
                <div className="mt-3">
                  <Bar pct={(total / Math.max(...totals.map((t) => t.total))) * 100} height={5} tone={on ? "#b0603a" : "#a39684"} />
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[12.5px] text-ink-2 mt-3 leading-relaxed max-w-3xl">{current.s.note}</p>
        <p className="text-[11px] text-ink-3 mt-2 leading-relaxed max-w-3xl">
          Money already committed on a purchase order is never scenarioed away — those
          items hold their real value in every version. The rest moves on{" "}
          <Assumed note="Category-level multipliers over the current forecast. They model the shape of the trade, not a quotation.">
            modelled multipliers
          </Assumed>.
        </p>
      </div>

      {/* ------------------------------------------------- where it goes */}
      {catDelta.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Where the difference sits — {current.s.name} vs as designed</Eyebrow>
          <div className="card px-4 sm:px-5 py-4">
            <div className="space-y-2.5">
              {catDelta.slice(0, 12).map((r) => (
                <div key={r.cat}>
                  <div className="flex items-baseline justify-between text-[12.5px] mb-1">
                    <span className="text-ink-2">{catLabel(state, r.cat)}</span>
                    <span className="tnum" style={{ color: r.delta > 0 ? "#8d3a2c" : "#41603f" }}>
                      {r.delta > 0 ? "+" : ""}{inr(r.delta, { compact: true })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1/2 flex justify-end">
                      {r.delta < 0 && (
                        <div className="h-[6px] rounded-l-full" style={{ width: `${(Math.abs(r.delta) / maxDelta) * 100}%`, background: "#7d9a7a" }} />
                      )}
                    </div>
                    <div className="w-px h-3 bg-line-2" />
                    <div className="w-1/2">
                      {r.delta > 0 && (
                        <div className="h-[6px] rounded-r-full" style={{ width: `${(Math.abs(r.delta) / maxDelta) * 100}%`, background: "#c98b78" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- trade-offs */}
      <div>
        <Eyebrow className="mb-1">The specific trades</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mb-3 leading-relaxed max-w-2xl">
          Each of these shows what it costs in one room and what it costs across the whole
          villa. The second number is usually the one that changes the answer.
        </p>
        <div className="space-y-3">
          {TRADE_OFFS.map((t) => <TradeOff key={t.id} t={t} room={room} setRoom={setRoom} />)}
        </div>
      </div>
    </div>
  );
}

function TradeOff({
  t, room, setRoom,
}: {
  t: (typeof TRADE_OFFS)[number];
  room: string;
  setRoom: (s: string) => void;
}) {
  const { state } = useProject();
  const live = state.items.filter((i) => i.stage !== "not-applicable");

  const asScenario = (mult: Record<string, number>): Scenario => ({
    id: "tmp", name: "", subtitle: "", overrides: {},
    categoryMultipliers: mult as Partial<Record<Category, number>>,
  });

  const aWhole = scenarioTotal(live, asScenario(t.a.categoryMultipliers));
  const bWhole = scenarioTotal(live, asScenario(t.b.categoryMultipliers));
  const wholeDelta = bWhole - aWhole;

  // The rooms this trade actually touches, biggest first.
  const cats = Object.keys(t.a.categoryMultipliers) as Category[];
  const touched = state.spaces
    .map((s) => {
      const items = itemsForSpace(state, s.id).filter((i) => cats.includes(i.category) && i.stage !== "not-applicable");
      return {
        space: s,
        a: items.reduce((x, i) => x + scenarioForecast(i, asScenario(t.a.categoryMultipliers)), 0),
        b: items.reduce((x, i) => x + scenarioForecast(i, asScenario(t.b.categoryMultipliers)), 0),
      };
    })
    .filter((x) => Math.abs(x.b - x.a) > 500)
    .sort((x, y) => Math.abs(y.b - y.a) - Math.abs(x.b - x.a));

  const sel = touched.find((x) => x.space.id === room) ?? touched[0];

  return (
    <div className="card px-4 sm:px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px]">{t.label}</h3>
        <span className="text-[12px] text-ink-3">{t.question}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-3.5">
        {[["a", t.a, aWhole], ["b", t.b, bWhole]].map(([k, side, whole]) => {
          const s = side as typeof t.a;
          const isB = k === "b";
          return (
            <div key={k as string} className="rounded-xl px-3.5 py-3" style={{ background: isB ? "#f7f0ea" : "#f2f3ef" }}>
              <div className="text-[13px] font-medium">{s.label}</div>
              <div className="tnum text-[19px] mt-1.5" style={{ fontFamily: "var(--font-display)" }}>
                {inr(whole as number, { compact: true })}
              </div>
              <div className="text-[10.5px] text-ink-3">whole project</div>
              {sel && (
                <div className="mt-2 pt-2 border-t border-line/70">
                  <div className="tnum text-[13.5px]">{inr(isB ? sel.b : sel.a, { compact: true })}</div>
                  <div className="text-[10.5px] text-ink-3">in {sel.space.name}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12.5px] tnum" style={{ color: wholeDelta > 0 ? "#8d3a2c" : "#41603f" }}>
          {t.b.label} costs {wholeDelta > 0 ? "+" : ""}{inr(wholeDelta, { compact: true })} more across the villa
          {sel && <> · {inr((sel.b - sel.a), { compact: true })} in {sel.space.name}</>}
        </span>
        {touched.length > 1 && (
          <select className="input w-auto text-[12px]" value={sel?.space.id ?? ""} onChange={(e) => setRoom(e.target.value)}>
            {touched.slice(0, 12).map((x) => <option key={x.space.id} value={x.space.id}>{x.space.name}</option>)}
          </select>
        )}
      </div>

      <p className="text-[12px] text-ink-3 mt-2.5 leading-relaxed">{t.note}</p>
    </div>
  );
}
