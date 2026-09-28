"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  SUB_KEYS, evaluate, frontier, knee, bestUnder, steps, moves, sameWeights, costByCat,
  type Study, type Point, type Weights, type Dim,
} from "@/lib/ht/pareto";
import { formatINR } from "@/lib/ht/catalog";
import { useHt } from "./data";
import { Hit, Seg } from "./bits";

const L = 1e5;
/** Selection colours: validated as a three-slot set against the dark card surface (all pairs). */
const SEL = ["#3987e5", "#d95926", "#199e70"];
const BRASS = "#d6b06a";
const MUTED = "#80858d";
const BAD = "#ef7a64";
/** Reference systems: violet diamonds — shape and hue both differ from the study's points and the selection rings. */
const REF = "#9085e9";

const lakh = (n: number, p = 1) => `₹${(n / L).toFixed(p)} L`;

export function ParetoView() {
  const { studies: STUDIES, total, budgetCap } = useHt();
  const [studyId, setStudyId] = useState<string>(STUDIES[0].id);
  const study = STUDIES.find((s) => s.id === studyId)!;
  const [weightsBy, setWeightsBy] = useState<Record<string, Weights>>(Object.fromEntries(STUDIES.map((s) => [s.id, s.weights])));
  const weights = weightsBy[studyId];
  const setWeights = (w: Weights) => setWeightsBy((s) => ({ ...s, [studyId]: w }));
  const [selBy, setSelBy] = useState<Record<string, string[]>>(Object.fromEntries(STUDIES.map((s) => [s.id, s.defaultSel])));
  const sel = selBy[studyId];
  const setSel = (ids: string[]) => setSelBy((s) => ({ ...s, [studyId]: ids }));
  const [budgetBy, setBudgetBy] = useState<Record<string, number>>(Object.fromEntries(STUDIES.map((s) => [s.id, s.defaultBudget])));
  const budget = budgetBy[studyId];
  const [band, setBand] = useState(STUDIES[0].configs.length <= 60);
  const [focus, setFocus] = useState(false);
  const [hl, setHl] = useState<{ dim: Dim; value: string } | null>(null);

  const isDefault = sameWeights(weights, study.weights);
  const pts = useMemo(() => evaluate(study, weights), [study, weights]);
  const front = useMemo(() => frontier(pts), [pts]);
  const k = isDefault ? pts.find((p) => p.id === study.knee)! : knee(front);
  const best = bestUnder(pts, budget);
  const byId = (id: string) => pts.find((p) => p.id === id)!;

  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id].slice(-3));
  const switchStudy = (id: string) => { setStudyId(id); setHl(null); setBand(STUDIES.find((s) => s.id === id)!.configs.length <= 60); };
  const cap = study.cap ?? budgetCap;
  const [showRefs, setShowRefs] = useState(true);
  const own = pts.filter((p) => !p.ref);
  const hasRefs = own.length < pts.length;
  const shown = showRefs ? pts : own;
  const underCap = cap ? own.filter((p) => p.cost < cap).length : 0;

  return (
    <div className="space-y-6">
      {/* study switch + room fit */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-4 items-stretch">
        <div className="flex flex-col gap-2">
          {STUDIES.length > 1 && <Seg label="Study" value={studyId} onChange={switchStudy} options={STUDIES.map((s) => ({ id: s.id, label: s.title }))} />}
          <span className="t3 text-[12px] px-1">{study.short}</span>
        </div>
        <div className="card-flat px-4 py-3 flex items-start gap-3" style={{ borderColor: study.fitsRoom ? "rgba(127,196,154,.35)" : "rgba(230,184,90,.4)" }}>
          <span className="verdict shrink-0 mt-0.5" style={{ color: study.fitsRoom ? "var(--agree)" : "var(--qualified)" }}>{study.fitsRoom ? "Fits this room" : "Different room"}</span>
          <p className="t2 text-[13.5px] leading-relaxed">{study.roomNote}</p>
        </div>
      </div>

      {/* headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile k="Systems modelled" v={`${own.length}`} sub={`${front.length} on the frontier · ${own.length - front.length} dominated${hasRefs ? ` · ${pts.length - own.length} reference points` : ""}`} />
        <Tile k={isDefault ? "Study's knee" : "Knee at your weights"} v={`${k.id} · ${lakh(k.cost)}`} sub={`${study.scoreName} ${k.score}`} accent onClick={() => toggle(k.id)} />
        <Tile k={`Best at ${lakh(budget, 0)}`} v={best ? `${best.id} · ${best.score}` : "—"} sub={best ? lakh(best.cost) : "Nothing fits"} onClick={best ? () => toggle(best.id) : undefined} />
        {cap ? <Tile k="Hard cap" v={lakh(cap, 0)} sub={`${underCap} of ${own.length} systems fit under it`} /> : <Tile k="Current /ht pick" v={lakh(total)} sub="Not scored by either study" />}
      </div>

      {/* chart + controls */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="card p-3 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
            <div>
              <h3 className="text-[17px] font-semibold">Cost against {study.scoreName}</h3>
              <p className="t3 text-[12.5px]">Hover a point for the system · click to compare up to three · the brass line is the Pareto frontier</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className="toggle" aria-pressed={focus} onClick={() => setFocus((v) => !v)}><span className="dot" />Zoom to the knee</button>
              <button className="toggle" aria-pressed={band} onClick={() => setBand((v) => !v)}><span className="dot" />±{study.uncertainty} uncertainty</button>
              {hasRefs && <button className="toggle" aria-pressed={showRefs} onClick={() => setShowRefs((v) => !v)}><span className="dot" />Video theatre</button>}
            </div>
          </div>
          <div className="scroll-x"><div className="min-w-[640px]">
            <Scatter study={study} pts={shown} front={front} k={k} best={best} budget={budget} sel={sel} onToggle={toggle} band={band} hl={hl} isDefault={isDefault} focus={focus} mark={cap ? { cost: cap, label: `₹${cap / L} L hard cap`, cap: true } : { cost: total, label: "current /ht pick" }} />
          </div></div>
          <ChartKey refs={hasRefs && showRefs} />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="eyebrow mb-2">Your budget</div>
            <div className="text-[26px] font-semibold num tracking-[-0.02em]">{lakh(budget, 0)}</div>
            <input
              type="range" className="w-full mt-3 accent-[#d6b06a]" aria-label="Budget in lakh"
              min={Math.floor(Math.min(...own.map((p) => p.cost)) / L)} max={Math.ceil(Math.max(...own.map((p) => p.cost)) / L)} step={0.5}
              value={budget / L} onChange={(e) => setBudgetBy((s) => ({ ...s, [studyId]: Number(e.target.value) * L }))}
            />
            {best && (
              <button className="text-left mt-3 block w-full well p-3 lift" onClick={() => toggle(best.id)}>
                <div className="text-[12px] t3">Best within budget</div>
                <div className="text-[14px] font-medium mt-0.5">{best.id} · {best.tier ?? best.layout}</div>
                <div className="text-[12.5px] t2 mt-0.5 line-clamp-2">{best.name}</div>
                <div className="text-[12.5px] mono mt-1 brass">{lakh(best.cost)} · {study.scoreName} {best.score}</div>
              </button>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow">What matters to you</div>
              {!isDefault && <button className="btn btn-sm btn-ghost" onClick={() => setWeights(study.weights)}>Reset</button>}
            </div>
            <Weighting study={study} weights={weights} onChange={setWeights} />
            <p className="t3 text-[12px] leading-relaxed mt-3">
              {isDefault ? "The study's own weights. Move a slider and the scores, frontier and knee recompute." : "Custom weights: scores, frontier and knee are recomputed; the study's own labels are hidden."}
            </p>
          </div>

          <div className="card p-5">
            <div className="eyebrow mb-3">Highlight a choice</div>
            <Highlight study={study} pts={pts} hl={hl} setHl={setHl} />
          </div>
        </div>
      </div>

      {study.reference && <Reference r={study.reference} onPick={(id) => { setShowRefs(true); toggle(id); }} sel={sel} />}

      {/* returns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-[16px] font-semibold">Each step along the frontier</h3>
          <p className="t3 text-[12.5px] mb-4">{study.scoreName} points gained per ₹1 lakh as you climb the frontier. Where the bars shrink, money stops buying performance.</p>
          <Steps front={front} k={k} onPick={toggle} />
        </div>
        <div className="card p-5">
          <h3 className="text-[16px] font-semibold">What each single upgrade buys</h3>
          <p className="t3 text-[12.5px] mb-4">Pairs of systems that differ in exactly one choice, ranked by points per ₹1 lakh. Repeated swaps are averaged.</p>
          <Moves study={study} pts={pts} />
        </div>
      </div>

      {/* compare */}
      <Compare study={study} sel={sel.map(byId)} onRemove={toggle} weights={weights} />

      {/* table */}
      <details className="card overflow-hidden group">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between">
          <span className="text-[15px] font-semibold">{pts.length > 60 ? `The ${front.length} frontier systems as a table` : `All ${pts.length} systems as a table`}</span>
          <span className="t3 text-[13px] group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <AllTable study={study} pts={pts} sel={sel} onToggle={toggle} />
      </details>

      {study.robustness && <Robust r={study.robustness} />}

      <div className="card-flat p-5">
        <div className="eyebrow mb-2">The study&rsquo;s verdict</div>
        <p className="text-[15px] leading-relaxed">{study.verdict}</p>
        <p className="t3 text-[12.5px] leading-relaxed mt-3">{study.common} Scores are modelled judgements anchored to published measurements, not tests in this room: treat anything within ±{study.uncertainty} as a tie.</p>
      </div>
    </div>
  );
}

/* ============================================================== reference */

function Reference({ r, onPick, sel }: { r: NonNullable<Study["reference"]>; onPick: (id: string) => void; sel: string[] }) {
  const cols: [keyof Point["sub"], string][] = [["dialogue", "Dialogue"], ["bass", "Bass"], ["immersion", "Immersion"], ["hdr", "Picture"], ["synergy", "Synergy"], ["upgrade", "Upgrade"]];
  const tint = (v: number) => (!v ? "transparent" : v > 0 ? `rgba(57,135,229,${Math.min(0.85, 0.18 + (Math.abs(v) / 16) * 0.67)})` : `rgba(230,103,103,${Math.min(0.85, 0.18 + (Math.abs(v) / 16) * 0.67)})`);
  const sgn = (v: number, p = 1) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(p)}`;
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2"><svg width="14" height="14"><path d="M7 1 L13 7 L7 13 L1 7 Z" fill={REF} /></svg><div className="eyebrow">Reference</div></div>
      <h3 className="text-[16px] font-semibold mt-1">{r.title}</h3>
      <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-4xl">{r.note}</p>
      <div className="scroll-x mt-4">
        <table className="w-full min-w-[980px] text-[12.5px] border-separate" style={{ borderSpacing: "2px" }}>
          <thead>
            <tr className="t3 text-left">
              <th className="font-normal py-1.5 pr-3">Their part</th>
              <th className="font-normal pr-3">Replaces</th>
              <th className="font-normal text-right pr-3">Cost</th>
              <th className="font-normal text-right pr-3">Score</th>
              {cols.map(([k, l]) => <th key={k} className="font-normal text-center w-[68px]">{l}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="t2">
              <td className="py-1.5 pr-3 font-medium text-[var(--text)]">The recommendation</td>
              <td className="pr-3 t3">—</td>
              <td className="text-right num pr-3">{lakh(r.base.cost)}</td>
              <td className="text-right num pr-3">{r.base.score.toFixed(1)}</td>
              {cols.map(([k]) => <td key={k} className="text-center t3">·</td>)}
            </tr>
            {r.rows.map((row) => (
              <tr key={row.id} className={sel.includes(row.id) ? "bg-[var(--card-2)]" : ""}>
                <td className="py-1.5 pr-3">
                  <button className={`text-left hover:underline flex items-center gap-2 ${row.id === "REF-VIDEO" ? "font-semibold" : ""}`} onClick={() => onPick(row.id)}>
                    <svg width="10" height="10" className="shrink-0"><path d="M5 0 L10 5 L5 10 L0 5 Z" fill={REF} /></svg>{row.part}
                  </button>
                </td>
                <td className="pr-3 t3">{row.replaces}</td>
                <td className="text-right num pr-3 whitespace-nowrap">{lakh(row.cost)} <span className="t3">{sgn(row.dCost / L, 2)} L</span></td>
                <td className="text-right num pr-3 whitespace-nowrap">{row.score.toFixed(1)} <span style={{ color: row.dScore < 0 ? BAD : row.dScore > 0 ? "var(--agree)" : "var(--text-3)" }}>{sgn(row.dScore)}</span></td>
                {cols.map(([k]) => (
                  <td key={k} className="text-center num rounded-[4px] h-8" style={{ background: tint(row.dSub[k]) }}>
                    {row.dSub[k] ? sgn(row.dSub[k]) : <span className="t3">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 space-y-2">
        {r.rows.map((row) => (
          <li key={row.id} className="text-[13px] leading-relaxed flex gap-2">
            <svg width="10" height="10" className="shrink-0 mt-[5px]"><path d="M5 0 L10 5 L5 10 L0 5 Z" fill={REF} /></svg>
            <span><span className="font-medium">{row.part}.</span> <span className="t2">{row.note}</span></span>
          </li>
        ))}
        {r.unpriced.map((u) => (
          <li key={u.part} className="text-[13px] leading-relaxed flex gap-2">
            <span className="shrink-0 w-[10px] t3">×</span>
            <span><span className="font-medium">{u.part}.</span> <span className="t2">{u.why}</span></span>
          </li>
        ))}
      </ul>
      <details className="mt-4">
        <summary className="cursor-pointer t3 text-[12.5px]">Indian prices used for the reference parts</summary>
        <ul className="mt-2 space-y-1 text-[12.5px]">
          {r.prices.map((p) => (
            <li key={p.name} className="grid grid-cols-[minmax(0,1fr)_90px] sm:grid-cols-[260px_90px_minmax(0,1fr)] gap-x-3">
              <span className="t2">{p.name}</span>
              <span className="num text-right">{lakh(p.price, 2)}{p.est ? " est." : ""}</span>
              <span className="t3 hidden sm:block">{p.source}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/* ============================================================= robustness */

function Robust({ r }: { r: NonNullable<Study["robustness"]> }) {
  return (
    <div className="card p-5">
      <div className="eyebrow mb-1">How sure is this?</div>
      <h3 className="text-[16px] font-semibold">Which choice wins across {r.samples} perturbed runs</h3>
      <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-3xl">{r.note}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 mt-4">
        {r.dims.map((d) => (
          <div key={d.label} className="min-w-0">
            <div className="text-[12.5px] t3 mb-2">{d.label}</div>
            <ul className="space-y-1.5">
              {d.rows.map((row) => (
                <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_88px_44px] items-center gap-2 text-[13px]">
                  <span className={`truncate ${row.pick ? "font-semibold" : "t2"}`} title={row.label}>{row.label}</span>
                  <span className="h-2 rounded-sm bg-[var(--card-3)] overflow-hidden">
                    <span className="block h-full rounded-sm" style={{ width: `${row.share}%`, background: row.pick ? "var(--brass)" : "var(--text-3)" }} />
                  </span>
                  <span className="num text-right t2">{row.share.toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="t3 text-[12.5px] leading-relaxed mt-4">{r.risk}</p>
    </div>
  );
}

/* ================================================================ scatter */

function Scatter({ study, pts: allPts, front, k, best, budget, sel, onToggle, band, hl, isDefault, focus, mark }: {
  study: Study; pts: Point[]; front: Point[]; k: Point; best?: Point; budget: number; sel: string[];
  onToggle: (id: string) => void; band: boolean; hl: { dim: Dim; value: string } | null; isDefault: boolean; focus: boolean;
  mark: { cost: number; label: string; cap?: boolean };
}) {
  // "Zoom to the knee" keeps the steep part of the curve and a little beyond it.
  const zoomMax = Math.max(k.cost * 1.35, (study.id === "A" ? 48 : 42) * L);
  const pts = focus ? allPts.filter((p) => p.cost <= zoomMax) : allPts;
  const [hover, setHover] = useState<Point | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const W = 960, H = 540, m = { l: 58, r: 28, t: 30, b: 50 };
  const costs = pts.map((p) => p.cost / L), scores = pts.map((p) => p.score);
  const x0 = Math.floor((Math.min(...costs) - (focus ? 1 : 3)) / 5) * 5, x1 = Math.ceil((Math.max(...costs) + (focus ? 1 : 4)) / 5) * 5;
  const y0 = Math.floor(Math.min(...scores) - 2), y1 = Math.ceil(Math.max(...scores) + 1.5);
  const X = (c: number) => m.l + ((c / L - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (s: number) => m.t + (1 - (s - y0) / (y1 - y0)) * (H - m.t - m.b);
  const xStep = x1 - x0 > 70 ? 10 : 5, yStep = y1 - y0 > 20 ? 5 : y1 - y0 > 9 ? 2 : 1;
  const xt = []; for (let v = Math.ceil(x0 / xStep) * xStep; v <= x1; v += xStep) xt.push(v);
  const yt = []; for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1; v += yStep) yt.push(v);
  const severe = isDefault ? study.severeFrom : k.cost;
  const rec = mark.cost;
  const dense = pts.length > 60;
  const lit = (p: Point) => !hl || p.dims[hl.dim] === hl.value;

  const vf = front.filter((p) => p.cost <= x1 * L);
  const area = `M ${X(vf[0].cost)} ${Y(y0)} ` + vf.map((p) => `L ${X(p.cost)} ${Y(p.score)}`).join(" ") + ` L ${X(x1 * L)} ${Y(vf[vf.length - 1].score)} L ${X(x1 * L)} ${Y(y0)} Z`;
  const line = vf.map((p, i) => `${i ? "L" : "M"} ${X(p.cost)} ${Y(p.score)}`).join(" ");
  const callouts = (isDefault ? study.callouts : [{ id: k.id, tag: "Knee (your weights)", dx: -12, dy: -16, anchor: "end" as const }]).filter((c) => pts.some((p) => p.id === c.id));
  const order = [...pts].sort((a, b) => Number(a.pareto) - Number(b.pareto) || Number(sel.includes(a.id)) - Number(sel.includes(b.id)));

  return (
    <div ref={wrap} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`${study.title}: cost against ${study.scoreName}`}>
        {/* severe-returns zone */}
        {severe < x1 * L && (
          <>
            <rect x={X(severe)} y={m.t} width={Math.max(0, W - m.r - X(severe))} height={H - m.t - m.b} fill="rgba(239,122,100,0.05)" />
            <text x={X(severe) + 8} y={m.t + 14} fontSize={11} fill={BAD} opacity={0.85}>{isDefault ? "Severe diminishing returns" : "Beyond the knee"}</text>
          </>
        )}

        {/* grid */}
        {yt.map((v) => (
          <g key={`y${v}`}>
            <line x1={m.l} x2={W - m.r} y1={Y(v)} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={m.l - 10} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-3)" className="svg-mono">{v}</text>
          </g>
        ))}
        {xt.map((v) => (
          <g key={`x${v}`}>
            <line x1={X(v * L)} x2={X(v * L)} y1={H - m.b} y2={H - m.b + 5} stroke="rgba(255,255,255,0.2)" />
            <text x={X(v * L)} y={H - m.b + 19} textAnchor="middle" fontSize={11} fill="var(--text-3)" className="svg-mono">₹{v}L</text>
          </g>
        ))}
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="rgba(255,255,255,0.18)" />
        <text x={W - m.r} y={H - 8} textAnchor="end" fontSize={11.5} fill="var(--text-2)">Total AV cost →</text>
        <text x={14} y={m.t + 4} fontSize={11.5} fill="var(--text-2)" transform={`rotate(-90 14 ${m.t + 4})`} textAnchor="end">{study.scoreName} →</text>

        {/* attainable region + frontier */}
        <path d={area} fill="rgba(214,176,106,0.06)" />
        <path d={line} fill="none" stroke={BRASS} strokeWidth={2} strokeLinejoin="round" />

        {/* budget */}
        {budget <= x1 * L && <>
        <rect x={X(budget)} y={m.t} width={Math.max(0, W - m.r - X(budget))} height={H - m.t - m.b} fill="rgba(0,0,0,0.28)" />
        <line x1={X(budget)} x2={X(budget)} y1={m.t} y2={H - m.b} stroke="var(--text-2)" strokeDasharray="4 4" />
        <text x={X(budget) - 6} y={H - m.b - 8} textAnchor="end" fontSize={11} fill="var(--text)" className="svg-mono">budget {lakh(budget, 0)}</text>
        </>}

        {/* current app pick, cost only */}
        {rec >= x0 * L && rec <= x1 * L && (
          <g>
            <line x1={X(rec)} x2={X(rec)} y1={m.t} y2={H - m.b} stroke={mark.cap ? BAD : "var(--g-picture)"} strokeDasharray={mark.cap ? "6 3" : "2 5"} strokeWidth={mark.cap ? 1.8 : 1} opacity={mark.cap ? 0.9 : 0.7} />
            <text x={X(rec) + 5} y={mark.cap ? m.t + 30 : H - m.b - 26} fontSize={11} fontWeight={mark.cap ? 600 : 400} fill={mark.cap ? BAD : "var(--g-picture)"}>{mark.label}</text>
          </g>
        )}

        {/* uncertainty */}
        {band && pts.map((p) => (
          <line key={`u${p.id}`} x1={X(p.cost)} x2={X(p.cost)} y1={Y(p.score + study.uncertainty)} y2={Y(p.score - study.uncertainty)} stroke={p.pareto ? BRASS : MUTED} strokeOpacity={lit(p) ? 0.28 : 0.06} strokeWidth={2} strokeLinecap="round" />
        ))}

        {/* points: in a dense cloud, the dominated ones are drawn as one quiet layer and hovered by proximity */}
        {dense && (
          <g pointerEvents="none">
            {pts.filter((p) => !p.pareto && !p.ref && !sel.includes(p.id)).map((p) => (
              <circle key={p.id} cx={X(p.cost)} cy={Y(p.score)} r={2.6} fill={lit(p) ? (hl ? "#e8e6df" : "#5d636c") : "#2a2f36"} opacity={lit(p) ? 0.85 : 0.5} />
            ))}
          </g>
        )}
        {dense && (
          <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill="transparent"
            onMouseMove={(e) => {
              const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              const mx = ((e.clientX - r.left) / r.width) * W, my = ((e.clientY - r.top) / r.height) * H;
              let best: Point | null = null, bd = 144;
              for (const p of pts) { const d = (X(p.cost) - mx) ** 2 + (Y(p.score) - my) ** 2; if (d < bd) { bd = d; best = p; } }
              setHover(best);
            }}
            onMouseLeave={() => setHover(null)}
            onClick={() => { if (hover) onToggle(hover.id); }}
            style={{ cursor: hover ? "pointer" : "default" }}
          />
        )}
        {/* reference swaps: a thin line from the recommendation to each single-part swap */}
        {(() => {
          const base = pts.find((q) => q.id === study.defaultSel[0]);
          return base && pts.filter((p) => p.ref && p.id !== "REF-VIDEO").map((p) => (
            <line key={`rl${p.id}`} x1={X(base.cost)} y1={Y(base.score)} x2={X(p.cost)} y2={Y(p.score)} stroke={REF} strokeOpacity={0.85} strokeWidth={1.5} strokeDasharray="4 3" pointerEvents="none" />
          ));
        })()}
        {pts.filter((p) => p.refTag).map((p) => (
          <text key={`rt${p.id}`} x={X(p.cost) + p.refTag!.dx} y={Y(p.score) + p.refTag!.dy} textAnchor={p.refTag!.anchor} fontSize={11} fill="#c9c3f5" stroke="#15181c" strokeWidth={4} paintOrder="stroke" pointerEvents="none">{p.refTag!.text}</text>
        ))}
        {(dense ? order.filter((p) => p.pareto || p.ref || sel.includes(p.id)) : order).map((p) => {
          const si = sel.indexOf(p.id);
          const on = lit(p);
          const cx = X(p.cost), cy = Y(p.score);
          return (
            <Hit key={p.id} label={`${p.ref ?? p.id}: ${lakh(p.cost)}, ${study.scoreName} ${p.score}${p.ref ? ", reference" : p.pareto ? ", on the frontier" : ", dominated"}. ${si >= 0 ? "Selected" : "Select to compare"}`} onClick={() => onToggle(p.id)}>
              <g onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p)} onBlur={() => setHover(null)} opacity={on || p.ref ? 1 : 0.18}>
                <circle cx={cx} cy={cy} r={dense && !p.pareto && !p.ref ? 7 : 14} fill="transparent" />
                {si >= 0 && <circle cx={cx} cy={cy} r={11.5} fill="none" stroke={SEL[si]} strokeWidth={2.5} />}
                {p.ref ? (
                  <path className="hit-body" d={`M ${cx} ${cy - 7} L ${cx + 7} ${cy} L ${cx} ${cy + 7} L ${cx - 7} ${cy} Z`} fill={REF} stroke="#15181c" strokeWidth={1.5} />
                ) : (
                <circle className="hit-body" cx={cx} cy={cy} r={p.pareto ? 6 : dense ? 3.5 : 5}
                  fill={p.pareto ? BRASS : "#15181c"} stroke={p.pareto ? "#15181c" : MUTED} strokeWidth={p.pareto ? 2 : 1.6} />
                )}
                {hl && on && <circle cx={X(p.cost)} cy={Y(p.score)} r={8.5} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={1} />}
              </g>
            </Hit>
          );
        })}

        {/* callouts */}
        {callouts.map((c) => {
          const p = pts.find((q) => q.id === c.id);
          if (!p) return null;
          const tx = X(p.cost) + c.dx, ty = Y(p.score) + c.dy;
          return (
            <g key={`c${c.id}`} pointerEvents="none">
              <text x={tx} y={ty} textAnchor={c.anchor ?? "start"} fontSize={12} fontWeight={600} fill="var(--text)" stroke="#15181c" strokeWidth={4} paintOrder="stroke">{c.id} · {c.tag}</text>
            </g>
          );
        })}
        {best && best.cost <= x1 * L && !callouts.some((c) => c.id === best.id) && (
          <text x={X(best.cost) - 10} y={Y(best.score) + 22} textAnchor="end" fontSize={11} fill="var(--text-2)" stroke="#15181c" strokeWidth={4} paintOrder="stroke" pointerEvents="none">{best.id} · best in budget</text>
        )}
        {sel.map((id, i) => {
          const p = pts.find((q) => q.id === id);
          if (!p) return null;
          return <text key={`s${id}`} x={X(p.cost) + 13} y={Y(p.score) - 11} fontSize={10.5} fontWeight={700} fill="var(--text)" pointerEvents="none">{i + 1}</text>;
        })}
      </svg>

      {hover && (
        <div
          className="absolute z-10 pointer-events-none card px-3.5 py-3 w-[270px] shadow-2xl"
          style={{ left: `${Math.min(X(hover.cost) / W, 0.68) * 100}%`, top: `${(Y(hover.score) / H) * 100}%`, transform: Y(hover.score) / H < 0.45 ? "translate(14px, 16px)" : "translate(14px, calc(-100% - 12px))", background: "#101216" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="mono text-[12px] t2">{hover.ref ?? hover.id} · {hover.layout}</span>
            <span className="text-[11.5px]" style={{ color: hover.ref ? REF : hover.pareto ? BRASS : MUTED }}>{hover.ref ? "reference" : hover.pareto ? "on the frontier" : "dominated"}</span>
          </div>
          <div className="text-[13.5px] font-medium leading-snug mt-1.5">{hover.name}</div>
          <div className="flex gap-4 mt-2 text-[13px]">
            <span><span className="t3">Cost </span>{lakh(hover.cost)}</span>
            <span><span className="t3">{study.scoreName} </span>{hover.score}</span>
          </div>
          {hover.critique && <p className="t3 text-[12px] leading-relaxed mt-2 line-clamp-3">{hover.critique}</p>}
        </div>
      )}
    </div>
  );
}

function ChartKey({ refs }: { refs?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 pt-3 text-[12px] t2">
      {refs && <span className="flex items-center gap-2"><svg width="14" height="14"><path d="M7 1 L13 7 L7 13 L1 7 Z" fill={REF} stroke="#15181c" strokeWidth="1.5" /></svg>Video theatre: whole system, and each of its parts swapped into the recommendation</span>}
      <span className="flex items-center gap-2"><svg width="14" height="14"><circle cx="7" cy="7" r="5.5" fill={BRASS} stroke="#15181c" strokeWidth="2" /></svg>On the frontier</span>
      <span className="flex items-center gap-2"><svg width="14" height="14"><circle cx="7" cy="7" r="4.5" fill="none" stroke={MUTED} strokeWidth="1.6" /></svg>Dominated — something cheaper scores as well</span>
      <span className="flex items-center gap-2"><svg width="18" height="14"><line x1="1" x2="17" y1="7" y2="7" stroke={BRASS} strokeWidth="2" /></svg>Frontier</span>
      <span className="flex items-center gap-2">{SEL.map((c) => <svg key={c} width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="none" stroke={c} strokeWidth="2.5" /></svg>)}Selected 1 · 2 · 3</span>
    </div>
  );
}

/* ============================================================== controls */

function Weighting({ study, weights, onChange }: { study: Study; weights: Weights; onChange: (w: Weights) => void }) {
  const total = SUB_KEYS.reduce((a, k) => a + weights[k], 0) || 1;
  return (
    <div className="space-y-3">
      {SUB_KEYS.map((k) => (
        <label key={k} className="block">
          <span className="flex items-baseline justify-between text-[12.5px]">
            <span className="t2">{study.labels[k]}</span>
            <span className="mono num">{Math.round((weights[k] / total) * 100)}%</span>
          </span>
          <input type="range" min={0} max={40} step={1} value={weights[k]} className="w-full accent-[#d6b06a]"
            onChange={(e) => onChange({ ...weights, [k]: Number(e.target.value) })} aria-label={`${study.labels[k]} weight`} />
        </label>
      ))}
    </div>
  );
}

function Highlight({ study, pts, hl, setHl }: { study: Study; pts: Point[]; hl: { dim: Dim; value: string } | null; setHl: (v: { dim: Dim; value: string } | null) => void }) {
  const dims = (Object.keys(study.dimLabels) as Dim[]).filter((d) => d !== "extras");
  const [dim, setDim] = useState<Dim>(dims[dims.length - 1]);
  const values = Array.from(new Set(pts.map((p) => p.dims[dim] ?? ""))).filter(Boolean);
  return (
    <div>
      <select className="w-full h-9 rounded-lg bg-[var(--bg-2)] border border-[var(--line-2)] px-2 text-[13px] text-[var(--text)]" value={dim} onChange={(e) => { setDim(e.target.value as Dim); setHl(null); }} aria-label="Dimension to highlight">
        {dims.map((d) => <option key={d} value={d}>{study.dimLabels[d]}</option>)}
      </select>
      <div className="flex flex-wrap gap-1.5 mt-3 max-h-[220px] overflow-y-auto">
        {values.map((v) => (
          <button key={v} className="toggle !h-auto !py-1.5 text-left !text-[12px]" aria-pressed={hl?.dim === dim && hl.value === v} onClick={() => setHl(hl?.dim === dim && hl.value === v ? null : { dim, value: v })} title={v}>
            <span className="dot" />{v.length > 46 ? `${v.slice(0, 45)}…` : v}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================== returns bars */

function Steps({ front, k, onPick }: { front: Point[]; k: Point; onPick: (id: string) => void }) {
  const rows = steps(front);
  const max = Math.max(...rows.map((r) => r.perLakh), 0.01);
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <button key={r.to.id} onClick={() => onPick(r.to.id)} className="w-full grid grid-cols-[92px_minmax(0,1fr)_64px] items-center gap-3 text-left group" title={`${r.from.id} → ${r.to.id}: +${lakh(r.dCost)}, +${r.dScore}`}>
          <span className="mono text-[11.5px] t2 group-hover:text-[var(--text)]">{r.from.id} → {r.to.id}</span>
          <span className="h-[14px] rounded-[4px] bg-[var(--bg-2)] overflow-hidden">
            <span className="block h-full rounded-[4px]" style={{ width: `${Math.max((r.perLakh / max) * 100, 1.5)}%`, background: r.to.id === k.id ? "#f0cf8e" : BRASS, opacity: r.perLakh < 0.15 ? 0.45 : 1 }} />
          </span>
          <span className="mono text-[11.5px] text-right num">{r.perLakh.toFixed(2)}</span>
        </button>
      ))}
      <p className="t3 text-[11.5px] pt-2">Points per ₹1 L. Faded bars buy less than 0.15 points per lakh. The lighter bar ends at the knee ({k.id}).</p>
    </div>
  );
}

function Moves({ study, pts }: { study: Study; pts: Point[] }) {
  const dims = Object.keys(study.dimLabels) as Dim[];
  const all = useMemo(() => moves(pts, Object.keys(study.dimLabels) as Dim[]), [pts, study]);
  const [dim, setDim] = useState<Dim | "all">("all");
  const [more, setMore] = useState(false);
  // Swaps that cost almost nothing produce huge ratios; list them apart.
  const cheap = all.filter((m) => (dim === "all" || m.dim === dim) && m.dCost < 0.5 * L);
  const rows = all.filter((m) => (dim === "all" || m.dim === dim) && m.dCost >= 0.5 * L);
  const shown = more ? rows : rows.slice(0, 9);
  const max = Math.max(...rows.map((r) => Math.abs(r.perLakh)), 0.01);
  const short = (s: string) => (s.length > 34 ? `${s.slice(0, 33)}…` : s);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button className="toggle" aria-pressed={dim === "all"} onClick={() => setDim("all")}>All</button>
        {dims.filter((d) => all.some((m) => m.dim === d)).map((d) => (
          <button key={d} className="toggle" aria-pressed={dim === d} onClick={() => setDim(d)}>{study.dimLabels[d]}</button>
        ))}
      </div>
      <div className="space-y-3">
        {shown.map((m) => {
          const pos = m.perLakh >= 0;
          const w = (Math.abs(m.perLakh) / max) * 50;
          return (
            <div key={`${m.dim}${m.from}${m.to}`} title={`${m.from} → ${m.to}`}>
              <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="min-w-0 truncate"><span className="t3">{study.dimLabels[m.dim]} · </span>{short(m.from)} <span className="t3">→</span> {short(m.to)}</span>
                <span className="mono shrink-0 num" style={{ color: pos ? "var(--text)" : BAD }}>{m.perLakh >= 0 ? "+" : ""}{m.perLakh.toFixed(2)}/L</span>
              </div>
              <div className="relative h-[10px] mt-1 rounded-[4px] bg-[var(--bg-2)]">
                <span className="absolute top-0 bottom-0 w-px bg-[rgba(255,255,255,0.25)]" style={{ left: "50%" }} />
                <span className="absolute top-0 h-full rounded-[4px]" style={{ left: pos ? "50%" : `${50 - w}%`, width: `${Math.max(w, 0.8)}%`, background: pos ? BRASS : BAD, opacity: pos ? 1 : 0.8 }} />
              </div>
              <div className="t3 text-[11.5px] mt-1 mono">{m.pairs.length > 3 ? `${m.pairs.length} pairs, e.g. ${m.pairs[0][0]}→${m.pairs[0][1]}` : m.pairs.map((p) => `${p[0]}→${p[1]}`).join(", ")} · +{lakh(m.dCost)} · {m.dScore >= 0 ? "+" : ""}{m.dScore}</div>
            </div>
          );
        })}
      </div>
      {rows.length > 9 && <button className="btn btn-sm mt-4" onClick={() => setMore((v) => !v)}>{more ? "Show fewer" : `Show all ${rows.length}`}</button>}
      <p className="t3 text-[11.5px] mt-3">Right of centre: better for the money. Left: costs more and scores lower.</p>
      {cheap.length > 0 && (
        <div className="mt-5 pt-4 border-t hair">
          <div className="text-[13px] font-medium">Near-free swaps (under ₹50k)</div>
          <p className="t3 text-[11.5px] mb-2">Too cheap to rank per lakh — just take the better one.</p>
          <ul className="space-y-1.5">
            {cheap.map((m) => (
              <li key={`c${m.dim}${m.from}${m.to}`} className="text-[12.5px] flex items-baseline justify-between gap-3" title={`${m.from} → ${m.to}`}>
                <span className="min-w-0 truncate"><span className="t3">{study.dimLabels[m.dim]} · </span>{short(m.from)} <span className="t3">→</span> {short(m.to)}</span>
                <span className="mono shrink-0" style={{ color: m.dScore >= 0 ? "var(--text)" : BAD }}>{m.dScore >= 0 ? "+" : ""}{m.dScore} for {lakh(m.dCost, 2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* =============================================================== compare */

function Compare({ study, sel, onRemove, weights }: { study: Study; sel: Point[]; onRemove: (id: string) => void; weights: Weights }) {
  if (!sel.length) {
    return <div className="card p-6 t2 text-[14px]">Click up to three points on the chart to compare them here.</div>;
  }
  const base = sel[0];
  const total = SUB_KEYS.reduce((a, k) => a + weights[k], 0) || 1;
  const lo = Math.min(50, ...sel.flatMap((p) => SUB_KEYS.map((k) => p.sub[k]))) ;
  const dims = Object.keys(study.dimLabels) as Dim[];
  const catLabels = study.catLabels ?? {};
  const cats = Object.keys(catLabels);
  const hasParts = !!study.prices && sel.every((p) => p.parts);
  const catMax = hasParts ? Math.max(...sel.flatMap((p) => cats.map((c) => costByCat(p.parts!, study.prices)[c] ?? 0))) : 1;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[19px] font-semibold">Side by side</h3>
        <span className="t3 text-[12.5px]">Differences are measured against {base.id}</span>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: sel.length } as React.CSSProperties}>
        {sel.map((p, i) => {
          const dc = p.cost - base.cost, ds = Math.round((p.score - base.score) * 10) / 10;
          return (
            <div key={p.id} className="card p-4 sm:p-5 min-w-0" style={{ boxShadow: `inset 0 3px 0 ${SEL[i]}` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-semibold"><span className="w-2.5 h-2.5 rounded-full" style={{ background: SEL[i] }} />{i + 1} · {p.id}</span>
                <button className="t3 text-[12px] hover:text-[var(--text)]" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.id}`}>✕</button>
              </div>
              {p.tier && <div className="brass text-[12px] mt-2">{p.tier}</div>}
              <div className="text-[14px] font-medium leading-snug mt-1 line-clamp-3">{p.name}</div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="well px-3 py-2"><div className="eyebrow !text-[9.5px]">Cost</div><div className="text-[17px] font-semibold num">{lakh(p.cost)}</div>{i > 0 && <div className="mono text-[11px]" style={{ color: dc > 0 ? "var(--qualified)" : "var(--agree)" }}>{dc >= 0 ? "+" : "−"}{lakh(Math.abs(dc))}</div>}</div>
                <div className="well px-3 py-2"><div className="eyebrow !text-[9.5px]">{study.scoreName}</div><div className="text-[17px] font-semibold num">{p.score}</div>{i > 0 && <div className="mono text-[11px]" style={{ color: ds > 0 ? "var(--agree)" : ds < 0 ? BAD : "var(--text-3)" }}>{ds >= 0 ? "+" : ""}{ds}{Math.abs(ds) < study.uncertainty ? " · a tie" : ""}</div>}</div>
              </div>
              <div className="mt-2 text-[11.5px]" style={{ color: p.pareto ? BRASS : MUTED }}>{p.pareto ? "On the frontier" : "Dominated at these weights"} · {p.layout}</div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="eyebrow mb-4">Where the points come from</div>
        <div className="space-y-4">
          {SUB_KEYS.map((k) => (
            <div key={k} className="grid sm:grid-cols-[200px_minmax(0,1fr)] gap-x-4 gap-y-1 items-center">
              <div className="text-[13px]">{study.labels[k]} <span className="t3 mono text-[11px]">· {Math.round((weights[k] / total) * 100)}%</span></div>
              <div className="relative h-7">
                <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--bg-2)] rounded" />
                {[60, 70, 80, 90, 100].filter((v) => v >= lo).map((v) => (
                  <span key={v} className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-[rgba(255,255,255,0.15)]" style={{ left: `${((v - lo) / (100 - lo)) * 100}%` }} />
                ))}
                {sel.map((p, i) => (
                  <span key={p.id} title={`${p.id}: ${p.sub[k]}`}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
                    style={{ left: `${((p.sub[k] - lo) / (100 - lo)) * 100}%`, background: SEL[i], boxShadow: "0 0 0 2px #15181c" }} />
                ))}
                <span className="absolute right-0 -top-1 text-[11px] mono t3">{sel.map((p) => p.sub[k].toFixed(0)).join(" · ")}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="t3 text-[11.5px] mt-4">Axis runs from {lo} to 100. Values on the right are in selection order 1 · 2 · 3.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="eyebrow px-5 pt-5">What&rsquo;s in each system</div>
        <div className="scroll-x">
          <table className="ht-table min-w-[640px] mt-2">
            <tbody>
              {dims.map((d) => (
                <tr key={d}>
                  <td className="t3 text-[12.5px] w-[150px]">{study.dimLabels[d]}</td>
                  {sel.map((p, i) => {
                    const v = p.dims[d] ?? "—";
                    const diff = i > 0 && v !== base.dims[d];
                    return (
                      <td key={p.id} className="text-[13px] leading-relaxed" style={diff ? { boxShadow: `inset 3px 0 0 ${SEL[i]}` } : undefined}>
                        <span className={diff ? "" : "t2"}>{v}</span>
                        {study.describe[v] && <span className="block t3 text-[12px] mt-0.5">{study.describe[v]}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t3 text-[11.5px] px-5 pb-4">A coloured edge marks what differs from {base.id}.</p>
      </div>

      {hasParts && (
        <div className="card p-5">
          <div className="eyebrow mb-4">Where the money goes</div>
          <div className="space-y-4">
            {cats.map((c) => (
              <div key={c} className="grid sm:grid-cols-[200px_minmax(0,1fr)] gap-x-4 gap-y-1.5">
                <div className="text-[13px]">{catLabels[c]}</div>
                <div className="space-y-1">
                  {sel.map((p, i) => {
                    const v = costByCat(p.parts!, study.prices)[c] ?? 0;
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="h-[10px] rounded-[4px]" style={{ width: `${Math.max((v / catMax) * 80, 0.6)}%`, background: SEL[i] }} />
                        <span className="mono text-[11.5px] t2 shrink-0">{formatINR(v)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: sel.length } as React.CSSProperties}>
        {sel.map((p, i) => (
          <div key={p.id} className="card-flat p-4 min-w-0 space-y-2.5 text-[13px] leading-relaxed">
            <div className="flex items-center gap-2 font-semibold"><span className="w-2.5 h-2.5 rounded-full" style={{ background: SEL[i] }} />{p.id} — evaluator</div>
            {p.rationale && <p><span className="t3">Why: </span>{p.rationale}</p>}
            {p.tradeoffs && <p><span className="t3">Trade-offs: </span>{p.tradeoffs}</p>}
            {p.critique ? <p className="text-[var(--text)]"><span className="t3">Critique: </span>{p.critique}</p> : <p className="t3">No separate critique in the study; judge it by its position against the frontier.</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function AllTable({ study, pts, sel, onToggle }: { study: Study; pts: Point[]; sel: string[]; onToggle: (id: string) => void }) {
  const many = pts.length > 60;
  const rows = [...pts].filter((p) => !many || p.pareto || sel.includes(p.id)).sort((a, b) => a.cost - b.cost);
  return (
    <div className="scroll-x border-t hair">
      <table className="ht-table min-w-[900px]">
        <thead>
          <tr>
            <th>ID</th><th>System</th><th className="text-right">Cost</th><th className="text-right">{study.scoreName}</th><th className="text-right">Study said</th><th>Frontier</th>
            {SUB_KEYS.map((k) => <th key={k} className="text-right" title={study.labels[k]}>{study.labels[k].split(" ")[0]}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const si = sel.indexOf(p.id);
            return (
              <tr key={p.id} onClick={() => onToggle(p.id)} className="cursor-pointer hover:bg-[var(--card-2)]">
                <td className="mono text-[12.5px]"><span className="inline-flex items-center gap-2">{si >= 0 && <span className="w-2 h-2 rounded-full" style={{ background: SEL[si] }} />}{p.id}</span></td>
                <td className="text-[13px] max-w-[340px]">{p.name}</td>
                <td className="text-right mono text-[12.5px]">{lakh(p.cost)}</td>
                <td className="text-right mono text-[12.5px]">{p.score}</td>
                <td className="text-right mono text-[12.5px] t3">{p.stated}</td>
                <td style={{ color: p.pareto ? BRASS : MUTED }} className="text-[12.5px]">{p.pareto ? "yes" : "dominated"}</td>
                {SUB_KEYS.map((k) => <td key={k} className="text-right mono text-[12px] t2">{p.sub[k].toFixed(study.id === "A" ? 1 : 0)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Tile({ k, v, sub, accent, onClick }: { k: string; v: string; sub: string; accent?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <div className="eyebrow !text-[10px]">{k}</div>
      <div className={`text-[20px] sm:text-[22px] font-semibold tracking-[-0.01em] num mt-1 ${accent ? "brass" : ""}`}>{v}</div>
      <div className="t3 text-[12.5px] mt-0.5">{sub}</div>
    </>
  );
  return onClick ? <button className="card px-4 py-4 text-left lift" onClick={onClick}>{body}</button> : <div className="card px-4 py-4">{body}</div>;
}
