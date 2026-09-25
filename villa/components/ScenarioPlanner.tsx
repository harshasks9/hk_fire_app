"use client";

import React, { useMemo, useState } from "react";
import { useProject } from "@/lib/store";
import { SCENARIOS, TRADE_OFFS, scenarioForecast, scenarioTotal } from "@/lib/seed";
import { byCategory, itemsForSpace } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { type Category, type Scenario } from "@/lib/model/types";
import { Bar, Chip, Assumed, Section, Empty } from "./ui";
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

  const live = useMemo(() => state.items.filter((i) => i.stage !== "not-applicable"), [state.items]);

  const totals = useMemo(
    () => SCENARIOS.map((s) => ({ s, total: scenarioTotal(live, s) })),
    [live],
  );
  const baseline = totals.find((t) => t.s.id === "sc-premium")!.total;
  const current = totals.find((t) => t.s.id === active)!;
  const top = Math.max(...totals.map((t) => t.total), 1);

  // Where the difference between this scenario and the baseline actually sits.
  const catDelta = useMemo(() => {
    const grouped = byCategory(live);
    const base = SCENARIOS.find((s) => s.id === "sc-premium");
    const rows: { cat: Category; base: number; now: number; delta: number }[] = [];
    for (const [cat, list] of grouped) {
      const b = list.reduce((a, i) => a + scenarioForecast(i, base), 0);
      const now = list.reduce((a, i) => a + scenarioForecast(i, current.s), 0);
      if (Math.abs(now - b) > 1000) rows.push({ cat, base: b, now, delta: now - b });
    }
    return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [live, current.s]);

  const maxDelta = Math.max(...catDelta.map((r) => Math.abs(r.delta)), 1);

  if (!live.length) {
    return (
      <Empty icon="compare" title="Nothing to compare yet."
        hint="Scenarios re-price the project's scope at different spend levels. Add scope to the rooms and the three versions appear here." />
    );
  }

  return (
    <div>
      {/* ------------------------------------------------------- the three */}
      <Section title="Three versions of the same villa">
        <div className="grid md:grid-cols-3 gap-3" role="group" aria-label="Choose a scenario">
          {totals.map(({ s, total }) => {
            const on = s.id === active;
            const delta = total - baseline;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                aria-pressed={on}
                className={`card card-link text-left px-4 py-4 ${on ? "border-accent ring-1 ring-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[16px] font-semibold leading-snug">{s.name}</span>
                  {s.id === "sc-premium" ? <Chip tone="ghost">As designed</Chip> : on ? <Chip tone="accent">Showing</Chip> : null}
                </div>
                <div className="text-[13px] text-ink-3 mt-0.5 leading-snug">{s.subtitle}</div>
                <div className="text-[26px] font-semibold tracking-[-0.02em] mt-3 leading-none">
                  {inr(total, { compact: true })}
                </div>
                <div className={`text-[13px] mt-1.5 tnum ${delta > 0 ? "text-bad" : delta < 0 ? "text-good" : "text-ink-3"}`}>
                  {delta === 0 ? "The baseline" : `${delta > 0 ? "+" : ""}${inr(delta, { compact: true })} against as designed`}
                </div>
                <div className="mt-3">
                  <Bar pct={(total / top) * 100} height={5} tone={on ? "var(--color-accent)" : "var(--color-line-2)"} label={`${s.name} against the most expensive version`} />
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[14px] text-ink-2 mt-4 leading-relaxed max-w-3xl">{current.s.note}</p>
        <p className="text-[12.5px] text-ink-3 mt-2 leading-relaxed max-w-3xl">
          Money already committed on a purchase order is never scenarioed away — those
          items hold their real value in every version. The rest moves on{" "}
          <Assumed note="Category-level multipliers over the current forecast. They model the shape of the trade, not a quotation.">
            modelled multipliers
          </Assumed>.
        </p>
      </Section>

      {/* ------------------------------------------------- where it goes */}
      {catDelta.length > 0 && (
        <Section title={<>Where the difference sits <span className="text-ink-3 font-normal">— {current.s.name} against as designed</span></>}>
          <div className="card px-4 sm:px-5 py-5">
            <ul className="space-y-3">
              {catDelta.slice(0, 12).map((r) => (
                <li key={r.cat}>
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px] mb-1.5">
                    <span className="text-ink-2 min-w-0 truncate">{catLabel(state, r.cat)}</span>
                    <span className={`tnum shrink-0 ${r.delta > 0 ? "text-bad" : "text-good"}`}>
                      {r.delta > 0 ? "+" : ""}{inr(r.delta, { compact: true })}
                    </span>
                  </div>
                  <div className="flex items-center" aria-hidden>
                    <div className="w-1/2 flex justify-end">
                      {r.delta < 0 && (
                        <div className="h-[6px] rounded-l-full bg-good/70" style={{ width: `${(Math.abs(r.delta) / maxDelta) * 100}%` }} />
                      )}
                    </div>
                    <div className="w-px h-3 bg-line-2" />
                    <div className="w-1/2">
                      {r.delta > 0 && (
                        <div className="h-[6px] rounded-r-full bg-bad/60" style={{ width: `${(Math.abs(r.delta) / maxDelta) * 100}%` }} />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-good/70" /> Saves money</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bad/60" /> Costs more</span>
            </div>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------------- trade-offs */}
      <Section title="The specific trades">
        <p className="text-[14px] text-ink-3 -mt-1 mb-4 leading-relaxed max-w-2xl">
          Each of these shows what it costs in one room and what it costs across the whole
          villa. The second number is usually the one that changes the answer.
        </p>
        <div className="space-y-3">
          {TRADE_OFFS.map((t) => <TradeOff key={t.id} t={t} live={live} room={room} setRoom={setRoom} />)}
        </div>
      </Section>
    </div>
  );
}

function TradeOff({
  t, live, room, setRoom,
}: {
  t: (typeof TRADE_OFFS)[number];
  live: ReturnType<typeof useProject>["state"]["items"];
  room: string;
  setRoom: (s: string) => void;
}) {
  const { state } = useProject();

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
  const selectId = `trade-room-${t.id}`;

  return (
    <div className="card px-4 sm:px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-[15.5px]">{t.label}</h3>
        <span className="text-[13px] text-ink-3">{t.question}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-3.5">
        {([["a", t.a, aWhole], ["b", t.b, bWhole]] as const).map(([k, side, whole]) => {
          const isB = k === "b";
          return (
            <div key={k} className={`rounded-xl px-4 py-3 ${isB ? "bg-accent-soft" : "bg-paper-2"}`}>
              <div className="text-[14px] font-medium">{side.label}</div>
              <div className="text-[20px] font-semibold tracking-[-0.02em] mt-1.5 leading-tight">
                {inr(whole, { compact: true })}
              </div>
              <div className="text-[12.5px] text-ink-3">whole project</div>
              {sel && (
                <div className="mt-2.5 pt-2.5 border-t border-line-2/60">
                  <div className="tnum text-[14px]">{inr(isB ? sel.b : sel.a, { compact: true })}</div>
                  <div className="text-[12.5px] text-ink-3">in {sel.space.name}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className={`text-[13.5px] tnum ${wholeDelta > 0 ? "text-bad" : "text-good"}`}>
          {t.b.label} {wholeDelta >= 0 ? `costs ${inr(wholeDelta, { compact: true })} more` : `saves ${inr(-wholeDelta, { compact: true })}`} across the villa
          {sel && <> · {inr(sel.b - sel.a, { compact: true })} in {sel.space.name}</>}
        </span>
        {touched.length > 1 && (
          <label htmlFor={selectId} className="flex items-center gap-2 text-[13px] text-ink-3">
            Room
            <select id={selectId} className="input w-auto min-h-[34px] py-1 text-[13.5px]" value={sel?.space.id ?? ""} onChange={(e) => setRoom(e.target.value)}>
              {touched.slice(0, 12).map((x) => <option key={x.space.id} value={x.space.id}>{x.space.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <p className="text-[13px] text-ink-3 mt-2.5 leading-relaxed">{t.note}</p>
    </div>
  );
}
