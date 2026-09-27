"use client";

import React, { useMemo, useState } from "react";
import type { Subs } from "@/lib/ht/pareto";
import { ADDONS, AREA_LABEL, TIMING_LABEL, basket, singles, ladder, CAP, CONTINGENCY, type AddOn, type Area } from "@/lib/ht2/addons";
import { build, row1Level, row2Level, PICTURE, SPEAKERS, SUBS, PROCESSING, TREATMENT, RECOMMENDED } from "@/lib/ht2/model";
import { Hit, Seg } from "./bits";
import { RoomBuild } from "./RoomBuild";

const L = 1e5;
/** Area colours: the three-slot categorical set, validated all-pairs against the dark card surface. */
const AREA_COLOR: Record<Area, string> = { sound: "#3987e5", bass: "#d95926", picture: "#199e70" };
const BRASS = "#d6b06a";
const BAD = "#ef7a64";
const SURF = "#15181c";

const lakh = (n: number, p = 2) => `₹${(n / L).toFixed(p)} L`;
const rupees = (n: number) => (Math.abs(n) >= L ? lakh(n) : `₹${Math.round(n / 1000)}k`);
const byId = (id: string) => ADDONS.find((a) => a.id === id)!;

const SUB_LABEL: Record<keyof Subs, string> = { dialogue: "Dialogue", bass: "Bass", immersion: "Immersion", hdr: "Picture", synergy: "Synergy", upgrade: "Upgrade" };

export function AddonsView({ onPick }: { onPick: (c: string) => void }) {
  const [view, setView] = useState<"build" | "addons">("build");
  return (
    <div className="space-y-6">
      <Seg label="View" value={view} onChange={setView} options={[
        { id: "build", label: "Room build, surface by surface" }, { id: "addons", label: "Add-ons planner" },
      ]} />
      {view === "build" ? <RoomBuild onPick={onPick} /> : <Planner onPick={onPick} />}
    </div>
  );
}

function Planner({ onPick }: { onPick: (c: string) => void }) {
  const single = useMemo(singles, []);
  const lad = useMemo(() => ladder(), []);
  const [sel, setSel] = useState<string[]>([]);
  const b = useMemo(() => basket(sel), [sel]);
  const headroom = CAP - b.base.cost;
  const fits = lad.steps.filter((s) => s.cost < CAP);
  const fitsGain = fits.length ? fits[fits.length - 1].score - lad.start.score : 0;
  const fitsCost = fits.length ? fits[fits.length - 1].cost - lad.start.cost : 0;
  const bestValue = [...single].filter((s) => !byId(s.id).big).sort((x, y) => y.perLakh - x.perLakh)[0];

  const toggle = (id: string) =>
    setSel((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      const g = byId(id).group;
      return [...s.filter((x) => !g || byId(x).group !== g), id];
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tile k="Real headroom" v={lakh(headroom)} sub={`Under ₹30 L after the ₹${CONTINGENCY / L} L contingency`} />
        <Tile k="Best value" v={byId(bestValue.id).short} sub={`+${bestValue.gain.toFixed(2)} for ${rupees(bestValue.cost)} · ${bestValue.perLakh.toFixed(1)} per ₹1 L`} accent />
        <Tile k="Fits the headroom" v={`+${fitsGain.toFixed(2)} points`} sub={`${fits.map((s) => byId(s.id).short).join(", ")} · ${rupees(fitsCost)}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <div className="card p-4 sm:p-5">
            <h3 className="text-[16px] font-semibold">Value map: what each add-on buys for its cost</h3>
            <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-2xl">Each add-on on its own, on top of the recommended system. Up and to the left is better value; the diagonals mark points per ₹1 L. Filled dots are re-scored through the room model; hollow ones carry a stated judgement. Click one to add it to the basket.</p>
            <ValueMap single={single} sel={sel} onToggle={toggle} headroom={headroom} />
          </div>
          <div className="card p-4 sm:p-5">
            <h3 className="text-[16px] font-semibold">Best-first build-up</h3>
            <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-2xl">Start from the recommendation and keep adding whichever add-on buys the most per rupee, given what is already in. Where the bars cross the red line, the cap is gone; the hatched band is the contingency.</p>
            <Ladder lad={lad} sel={sel} />
          </div>
        </div>

        <div className="xl:sticky xl:top-[120px] space-y-4 min-w-0">
          <BasketCard b={b} sel={sel} />
          <div className="card divide-y divide-[var(--line)]">
            {(["sound", "bass", "picture"] as Area[]).map((area) => (
              <div key={area} className="p-3.5">
                <div className="flex items-center gap-2 text-[12px] t3 mb-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: AREA_COLOR[area] }} />{AREA_LABEL[area]}</div>
                <ul className="space-y-1">
                  {ADDONS.filter((a) => a.area === area).map((a) => {
                    const s = single.find((x) => x.id === a.id)!;
                    const on = sel.includes(a.id);
                    return (
                      <li key={a.id}>
                        <label className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[var(--card-2)] cursor-pointer">
                          <input type="checkbox" className="mt-1 accent-[#d6b06a]" checked={on} onChange={() => toggle(a.id)} />
                          <span className="min-w-0 flex-1">
                            <span className="text-[13.5px] block leading-snug">{a.short}{a.big && <span className="t3"> · not small</span>}</span>
                            <span className="text-[11.5px] t3 block">{TIMING_LABEL[a.timing]}{a.model ? "" : " · judgement"}{a.group ? " · replaces the rear subs" : ""}</span>
                          </span>
                          <span className="text-right shrink-0">
                            <span className="mono text-[12.5px] block" style={{ color: "var(--qualified)" }}>+{rupees(s.cost)}</span>
                            <span className="mono text-[11.5px] block t2">{s.gain >= 0 ? "+" : ""}{s.gain.toFixed(2)}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="text-[16px] font-semibold">Where each one helps</h3>
        <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-3xl">Change in each sub-score (0–100) on top of the recommended system, sorted by value. Blue is a gain, red a loss; the stronger the tint, the bigger the change. The row columns are judgement: who in the room will notice.</p>
        <Matrix single={single} onPick={(id) => onPick(byId(id).component)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <h3 className="text-[16px] font-semibold">What an external amp actually buys</h3>
          <p className="t2 text-[13.5px] leading-relaxed mt-1">Peak level from the front speakers at each row, on the Denon's own amplifiers and with an Emotiva BasX A3 on the L/C/R. An amp adds headroom — the same sound, closer to reference before it strains — not a different sound. It matters more with the less sensitive KEF.</p>
          <AmpChart />
        </div>
        <div className="card p-4 sm:p-5">
          <h3 className="text-[16px] font-semibold">Decide these before the room is closed up</h3>
          <p className="t2 text-[13.5px] leading-relaxed mt-1">Cheap to prepare now, expensive or impossible later — even if the add-on itself waits.</p>
          <ul className="mt-3 space-y-2.5">
            {ADDONS.filter((a) => a.timing === "pre-wire" || a.timing === "build").map((a) => (
              <li key={a.id} className="well p-3">
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left text-[14px] font-medium hover:underline" onClick={() => onPick(a.component)}>{a.short}</button>
                  <span className="chip !h-5 !text-[10.5px] shrink-0">{a.timing === "pre-wire" ? "pre-wire" : "during the build"}</span>
                </div>
                <p className="t2 text-[13px] leading-relaxed mt-1">{a.caveat}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card divide-y divide-[var(--line)]">
        {ADDONS.map((a) => (
          <div key={a.id} className="p-4 grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-x-6 gap-y-1.5">
            <div>
              <button className="text-left text-[14.5px] font-medium hover:underline" onClick={() => onPick(a.component)}>{a.name}</button>
              <div className="text-[12px] t3 mt-0.5">{a.priceNote}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="chip !h-5 !text-[10.5px]"><span className="w-2 h-2 rounded-full" style={{ background: AREA_COLOR[a.area] }} />{AREA_LABEL[a.area]}</span>
                <span className="chip !h-5 !text-[10.5px]">{a.model ? "Room model" : "Judgement"}</span>
                {a.est && <span className="chip !h-5 !text-[10.5px]">est.</span>}
              </div>
            </div>
            <div className="text-[13.5px] leading-relaxed">
              <p className="t2">{a.what}</p>
              <p className="t3 mt-1">{a.caveat}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="t3 text-[12.5px] leading-relaxed max-w-4xl">Add-ons that the room model covers are re-scored as whole systems, so their interactions are real; judged add-ons add their stated sub-score changes on top, which assumes they don&rsquo;t overlap. Treat anything under ±0.3 as a tie, and anything marked est. as a quote you still need.</p>
    </div>
  );
}

/* ================================================================ pieces */

function Tile({ k, v, sub, accent }: { k: string; v: string; sub: string; accent?: boolean }) {
  return (
    <div className="card px-4 py-4">
      <div className="eyebrow">{k}</div>
      <div className={`text-[22px] font-semibold tracking-[-0.02em] mt-1 ${accent ? "brass" : ""}`}>{v}</div>
      <div className="t3 text-[12.5px] mt-1 leading-snug">{sub}</div>
    </div>
  );
}

function BasketCard({ b, sel }: { b: ReturnType<typeof basket>; sel: string[] }) {
  const planned = b.base.cost - CONTINGENCY;
  const extra = b.cost - b.base.cost;
  const over = b.cost > CAP;
  const max = Math.max(CAP, b.cost) * 1.02;
  const pct = (v: number) => `${(v / max) * 100}%`;
  const dScore = b.score - b.base.score;
  return (
    <div className="card p-4 sm:p-5">
      <div className="eyebrow">Your basket</div>
      <div className="flex items-end justify-between gap-3 mt-1">
        <div>
          <div className="text-[26px] font-semibold num tracking-[-0.02em]" style={{ color: over ? BAD : undefined }}>{lakh(b.cost)}</div>
          <div className="t3 text-[12.5px]">{sel.length ? `${sel.length} add-on${sel.length > 1 ? "s" : ""}, +${rupees(extra)}` : "Nothing added yet"} · {over ? `${lakh(b.cost - CAP)} over the cap` : `${lakh(CAP - b.cost)} under the cap`}</div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-semibold num">{b.score.toFixed(1)}</div>
          <div className="t3 text-[12.5px] num">{dScore >= 0.005 ? `+${dScore.toFixed(2)}` : "±0"} vs {b.base.score}</div>
        </div>
      </div>
      <div className="relative h-4 mt-4 rounded-md bg-[var(--card-3)] overflow-hidden" role="img" aria-label={`Planned ${lakh(planned)}, contingency ${lakh(CONTINGENCY)}, add-ons ${lakh(extra)}, against a ₹30 L cap`}>
        <span className="absolute inset-y-0 left-0" style={{ width: pct(planned), background: "#5d636c" }} />
        <span className="absolute inset-y-0" style={{ left: pct(planned), width: pct(CONTINGENCY), background: "repeating-linear-gradient(135deg, #3a4048 0 4px, #2a2f36 4px 8px)" }} />
        <span className="absolute inset-y-0" style={{ left: pct(b.base.cost), width: pct(extra), background: over ? BAD : BRASS }} />
        <span className="absolute inset-y-[-2px] w-[2px]" style={{ left: pct(CAP), background: BAD }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11.5px] t3">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#5d636c" }} />Planned</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(135deg, #3a4048 0 2px, #2a2f36 2px 4px)" }} />Contingency</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: BRASS }} />Add-ons</span>
        <span className="flex items-center gap-1.5"><span className="w-[2px] h-3" style={{ background: BAD }} />₹30 L</span>
      </div>
      <dl className="mt-4 space-y-1.5">
        {(Object.keys(SUB_LABEL) as (keyof Subs)[]).map((k) => {
          const d = Math.round((b.sub[k] - b.base.sub[k]) * 10) / 10;
          return (
            <div key={k} className="grid grid-cols-[84px_minmax(0,1fr)_44px] items-center gap-2 text-[12.5px]">
              <dt className="t2">{SUB_LABEL[k]}</dt>
              <dd className="relative h-2 rounded-sm bg-[var(--card-3)]">
                <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${b.base.sub[k]}%`, background: "#5d636c" }} />
                {d > 0 && <span className="absolute inset-y-0 rounded-sm" style={{ left: `${b.base.sub[k]}%`, width: `${d}%`, background: BRASS, minWidth: 2 }} />}
                {d < 0 && <span className="absolute inset-y-0 rounded-sm" style={{ left: `${b.sub[k]}%`, width: `${-d}%`, background: BAD, minWidth: 2 }} />}
              </dd>
              <dd className="num text-right t2">{d === 0 ? "" : `${d > 0 ? "+" : ""}${d}`}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function ValueMap({ single, sel, onToggle, headroom }: { single: ReturnType<typeof singles>; sel: string[]; onToggle: (id: string) => void; headroom: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const pts = single.filter((s) => !byId(s.id).big);
  const big = single.filter((s) => byId(s.id).big);
  const W = 720, H = 440, m = { l: 52, r: 24, t: 20, b: 46 };
  const xMax = 2.2, yMax = 0.5;
  const X = (c: number) => m.l + (c / L / xMax) * (W - m.l - m.r);
  const Y = (g: number) => m.t + (1 - g / yMax) * (H - m.t - m.b);
  const guides = [1, 0.5, 0.25];
  /** Hand-placed labels where points crowd. */
  const place: Record<string, { dx: number; dy: number; a: "start" | "end" }> = {
    amp: { dx: -11, dy: 4, a: "end" }, lut: { dx: 11, dy: 12, a: "start" }, riser: { dx: 11, dy: 2, a: "start" }, traps: { dx: 11, dy: -4, a: "start" },
    a1h: { dx: 0, dy: 20, a: "end" }, pb4: { dx: 11, dy: 12, a: "start" }, rearSB2: { dx: -11, dy: -8, a: "end" },
  };
  const h = hover ? single.find((s) => s.id === hover) : null;
  return (
    <div className="relative mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Value map of add-ons: extra cost against score gain">
        {/* headroom */}
        <rect x={m.l} y={m.t} width={X(headroom) - m.l} height={H - m.t - m.b} fill="rgba(214,176,106,0.05)" />
        <line x1={X(headroom)} x2={X(headroom)} y1={m.t} y2={H - m.b} stroke={BRASS} strokeDasharray="4 4" strokeOpacity={0.7} />
        <text x={X(headroom) + 6} y={m.t + 12} fontSize={11} fill={BRASS}>{lakh(headroom)} headroom</text>
        {/* grid */}
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={Y(v)} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-3)" className="svg-mono">+{v.toFixed(1)}</text>
          </g>
        ))}
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <text key={v} x={X(v * L)} y={H - m.b + 18} textAnchor="middle" fontSize={11} fill="var(--text-3)" className="svg-mono">₹{v}L</text>
        ))}
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="rgba(255,255,255,0.18)" />
        <text x={W - m.r} y={H - 8} textAnchor="end" fontSize={11.5} fill="var(--text-2)">Extra cost →</text>
        <text x={14} y={m.t + 4} fontSize={11.5} fill="var(--text-2)" transform={`rotate(-90 14 ${m.t + 4})`} textAnchor="end">Score gain →</text>
        {/* value guides */}
        {guides.map((k) => {
          const xe = Math.min(xMax, yMax / k), ye = k * xe;
          return (
            <g key={k}>
              <line x1={X(0)} y1={Y(0)} x2={X(xe * L)} y2={Y(ye)} stroke="rgba(255,255,255,0.14)" strokeDasharray="2 5" />
              <text x={X(xe * L) - 4} y={Y(ye) + (ye >= yMax ? 14 : -6)} textAnchor="end" fontSize={10.5} fill="var(--text-3)">{k} pt / ₹1 L</text>
            </g>
          );
        })}
        {/* points */}
        {pts.map((s) => {
          const a = byId(s.id);
          const on = sel.includes(s.id);
          const p = place[s.id] ?? { dx: 11, dy: 4, a: "start" as const };
          const cx = X(s.cost), cy = Y(Math.max(0, s.gain));
          return (
            <Hit key={s.id} label={`${a.short}: +${s.gain.toFixed(2)} for ${rupees(s.cost)}. ${on ? "In the basket" : "Add to the basket"}`} onClick={() => onToggle(s.id)}>
              <g onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(s.id)} onBlur={() => setHover(null)}>
                <circle cx={cx} cy={cy} r={16} fill="transparent" />
                {on && <circle cx={cx} cy={cy} r={11.5} fill="none" stroke="var(--text)" strokeWidth={2} />}
                <circle className="hit-body" cx={cx} cy={cy} r={a.model ? 6.5 : 5.5} fill={a.model ? AREA_COLOR[a.area] : SURF} stroke={a.model ? SURF : AREA_COLOR[a.area]} strokeWidth={a.model ? 2 : 2.5} />
                <text x={cx + p.dx} y={cy + p.dy} textAnchor={p.a} fontSize={11.5} fill={on ? "var(--text)" : "var(--text-2)"} fontWeight={on ? 600 : 400} stroke={SURF} strokeWidth={4} paintOrder="stroke" pointerEvents="none">{a.short}</text>
              </g>
            </Hit>
          );
        })}
      </svg>
      {h && (() => {
        const a = byId(h.id);
        const left = (X(h.cost) / W) * 100, top = (Y(Math.max(0, h.gain)) / H) * 100;
        return (
          <div className="absolute pointer-events-none card-flat px-3 py-2 text-[12.5px] w-[250px] z-10" style={{ left: `min(${left}%, calc(100% - 260px))`, top: `calc(${top}% + 16px)`, background: "var(--card-3)" }}>
            <div className="font-semibold">{a.name}</div>
            <div className="num t2 mt-0.5">+{h.gain.toFixed(2)} points · {rupees(h.cost)} · {h.perLakh.toFixed(2)} per ₹1 L</div>
            <div className="t3 mt-1">{a.model ? "Re-scored through the room model" : "Stated judgement"}</div>
          </div>
        );
      })()}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-[12px] t2">
        {(["sound", "bass", "picture"] as Area[]).map((ar) => (
          <span key={ar} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: AREA_COLOR[ar] }} />{AREA_LABEL[ar]}</span>
        ))}
        <span className="flex items-center gap-1.5 t3"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "var(--text-3)" }} />Hollow = judgement</span>
        {big.map((s) => <span key={s.id} className="t3">Off the chart: {byId(s.id).short}, +{s.gain.toFixed(1)} for {rupees(s.cost)}</span>)}
      </div>
    </div>
  );
}

function Ladder({ lad, sel }: { lad: ReturnType<typeof ladder>; sel: string[] }) {
  const lo = 27 * L;
  const hi = Math.ceil(Math.max(...lad.steps.map((s) => s.cost), CAP) / L + 0.5) * L;
  const pct = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const planned = lad.start.cost - CONTINGENCY;
  const ticks: number[] = []; for (let v = lo; v <= hi; v += L) ticks.push(v);
  const rows = [{ id: "", cost: lad.start.cost, score: lad.start.score }, ...lad.steps];
  return (
    <div className="mt-4">
      <div className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_64px] sm:grid-cols-[180px_minmax(0,1fr)_72px] gap-x-3 text-[12.5px]">
        <span />
        <div className="relative h-5">
          {ticks.map((t) => <span key={t} className="absolute -translate-x-1/2 t3 mono text-[10.5px]" style={{ left: pct(t) }}>{(t / L).toFixed(0)}</span>)}
        </div>
        <span className="t3 text-right text-[11px]">Score</span>
        {rows.map((r, i) => {
          const prev = i ? rows[i - 1].cost : lo;
          const a = r.id ? byId(r.id) : null;
          const over = r.cost > CAP;
          return (
            <React.Fragment key={r.id || "base"}>
              <span className={`truncate py-1 ${a && sel.includes(a.id) ? "font-semibold" : "t2"}`} title={a?.name}>{a ? `${i}. ${a.short}` : "Recommended system"}</span>
              <div className="relative my-1 h-[18px]">
                {ticks.map((t) => <span key={t} className="absolute inset-y-0 w-px bg-[rgba(255,255,255,0.05)]" style={{ left: pct(t) }} />)}
                {a ? (
                  <span className="absolute inset-y-0 rounded-[3px]" style={{ left: pct(prev), width: `max(3px, calc(${pct(r.cost)} - ${pct(prev)}))`, background: AREA_COLOR[a.area], opacity: over ? 0.45 : 1 }} />
                ) : (
                  <>
                    <span className="absolute inset-y-0 left-0 rounded-l-[3px]" style={{ width: pct(planned), background: "#5d636c" }} />
                    <span className="absolute inset-y-0" style={{ left: pct(planned), width: `calc(${pct(lad.start.cost)} - ${pct(planned)})`, background: "repeating-linear-gradient(135deg, #3a4048 0 4px, #2a2f36 4px 8px)" }} />
                  </>
                )}
                <span className="absolute inset-y-[-4px] w-[2px]" style={{ left: pct(CAP), background: BAD }} />
              </div>
              <span className="num text-right py-1">{r.score.toFixed(2)}{a && <span className="t3 text-[11px] block leading-none">+{(r.score - rows[i - 1].score).toFixed(2)}</span>}</span>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11.5px] t3">
        <span>₹ lakh, whole system including contingency</span>
        <span className="flex items-center gap-1.5"><span className="w-[2px] h-3" style={{ background: BAD }} />₹30 L cap</span>
        <span>Faded bars are past the cap</span>
      </div>
    </div>
  );
}

function Matrix({ single, onPick }: { single: ReturnType<typeof singles>; onPick: (id: string) => void }) {
  const cols = ["dialogue", "bass", "immersion", "hdr", "synergy", "upgrade"] as (keyof Subs)[];
  const rows = [...single].sort((a, b) => b.perLakh - a.perLakh);
  const tint = (v: number) => {
    if (!v) return "transparent";
    const a = Math.min(0.85, 0.18 + Math.abs(v) / 5 * 0.67);
    return v > 0 ? `rgba(57,135,229,${a})` : `rgba(230,103,103,${a})`;
  };
  const dots = (n: number) => (n === 0 ? "—" : n === 1 ? "●" : "●●");
  return (
    <div className="scroll-x mt-3">
      <table className="w-full min-w-[720px] text-[12.5px] border-separate" style={{ borderSpacing: "2px" }}>
        <thead>
          <tr className="t3 text-left">
            <th className="font-normal py-1.5 pr-3">Add-on</th>
            {cols.map((c) => <th key={c} className="font-normal text-center w-[76px]">{SUB_LABEL[c]}</th>)}
            <th className="font-normal text-center w-[56px]">Row 1</th>
            <th className="font-normal text-center w-[56px]">Row 2</th>
            <th className="font-normal text-right w-[84px] pl-2">Per ₹1 L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const a = byId(s.id);
            return (
              <tr key={s.id}>
                <td className="py-1.5 pr-3">
                  <button className="text-left hover:underline flex items-center gap-2" onClick={() => onPick(s.id)}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: AREA_COLOR[a.area] }} />{a.short}
                    {!a.model && <span className="t3 text-[11px]">judged</span>}
                  </button>
                </td>
                {cols.map((c) => (
                  <td key={c} className="text-center num rounded-[4px] h-8" style={{ background: tint(s.dSub[c]) }}>
                    {s.dSub[c] ? `${s.dSub[c] > 0 ? "+" : ""}${s.dSub[c]}` : <span className="t3">·</span>}
                  </td>
                ))}
                <td className="text-center t2 text-[10px] tracking-[2px]">{dots(a.rows[0])}</td>
                <td className="text-center t2 text-[10px] tracking-[2px]">{dots(a.rows[1])}</td>
                <td className="text-right num pl-2">{s.perLakh.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AmpChart() {
  const f = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id)!;
  const mk = (spk: string, amp: boolean) => build(f(PICTURE, RECOMMENDED.pic), f(SPEAKERS, spk), f(SUBS, RECOMMENDED.sub), f(PROCESSING, RECOMMENDED.proc), f(TREATMENT, RECOMMENDED.trt), amp);
  const rows = [
    { label: "KEF Q Concerto · X6800H", b: mk("S3", false), rec: true },
    { label: "KEF + BasX A3", b: mk("S3", true) },
    { label: "Klipsch RP-6000F · X6800H", b: mk("S4", false) },
    { label: "Klipsch + BasX A3", b: mk("S4", true) },
  ];
  const W = 560, rowH = 40, m = { l: 190, r: 20, t: 26, b: 34 };
  const H = m.t + rows.length * rowH + m.b;
  const lo = 94, hi = 108;
  const X = (db: number) => m.l + ((db - lo) / (hi - lo)) * (W - m.l - m.r);
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Peak level at row 1 and row 2 with and without an external amplifier">
        {[94, 96, 98, 100, 102, 104, 106, 108].map((v) => (
          <g key={v}>
            <line x1={X(v)} x2={X(v)} y1={m.t} y2={H - m.b} stroke="rgba(255,255,255,0.06)" />
            <text x={X(v)} y={H - m.b + 16} textAnchor="middle" fontSize={11} fill="var(--text-3)" className="svg-mono">{v}</text>
          </g>
        ))}
        <line x1={X(105)} x2={X(105)} y1={m.t - 8} y2={H - m.b} stroke={BAD} strokeDasharray="4 3" />
        <text x={X(105)} y={m.t - 12} textAnchor="middle" fontSize={10.5} fill={BAD}>Reference 105</text>
        <line x1={X(100)} x2={X(100)} y1={m.t - 8} y2={H - m.b} stroke={BRASS} strokeDasharray="4 3" />
        <text x={X(100)} y={m.t - 12} textAnchor="middle" fontSize={10.5} fill={BRASS}>Row-2 target</text>
        <text x={W - m.r} y={H - 4} textAnchor="end" fontSize={11} fill="var(--text-2)">Peak level, dB →</text>
        {rows.map((r, i) => {
          const y = m.t + i * rowH + rowH / 2;
          const r2 = row2Level(r.b), r1 = row1Level(r.b);
          return (
            <g key={r.label}>
              <text x={m.l - 12} y={y + 4} textAnchor="end" fontSize={12} fill={r.rec ? "var(--text)" : "var(--text-2)"} fontWeight={r.rec ? 600 : 400}>{r.label}</text>
              <line x1={X(r2)} x2={X(Math.min(hi, r1))} y1={y} y2={y} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
              <circle cx={X(r2)} cy={y} r={6} fill="#3987e5" stroke={SURF} strokeWidth={2} />
              <circle cx={X(Math.min(hi, r1))} cy={y} r={5.5} fill={SURF} stroke="#3987e5" strokeWidth={2.5} />
              <text x={X(r2) - 10} y={y + 4} textAnchor="end" fontSize={10.5} fill="var(--text-2)" className="svg-mono" stroke={SURF} strokeWidth={3} paintOrder="stroke">{r2.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[12px] t2">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3987e5" }} />Row 2 (4.9 m)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#3987e5" }} />Row 1 (2.9 m)</span>
      </div>
    </div>
  );
}
