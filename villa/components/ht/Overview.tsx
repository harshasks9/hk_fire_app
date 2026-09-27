"use client";

import React, { useState } from "react";
import { recommended, formatINR } from "@/lib/ht/catalog";
import { useHt } from "./data";
import { GROUP_LABEL, type Group } from "@/lib/ht/types";
import {
  ROOM, H, SCREEN, ROWS, PROJECTOR, viewingAngle, screenDistance,
  throwDistance, throwRatio, lensShift, sightline, elevation, nits, panelArea, absorptionNeeded, axialModes, schroeder, volume,
} from "@/lib/ht/geometry";
import { GROUP_COLOR, Section, Seg, Toggles, Verdict } from "./bits";
import { ALL_LAYERS, LAYER_ITEMS, PlanView, FrontView, SideView, View3D, type Layer, type Layers } from "./RoomViews";

type Go = (tab: string) => void;

/* ============================================================== overview */

export function Overview({ onPick, go, active }: { onPick: (c: string) => void; go: Go; active: string | null }) {
  const { catalog: CATALOG, total, hero, impact, chains, rebalance } = useHt();
  const pushback = CATALOG.filter((c) => c.review.verdict !== "agree").sort((a, b) => (a.review.verdict === "disagree" ? -1 : 0) - (b.review.verdict === "disagree" ? -1 : 0));
  const groups = Object.keys(GROUP_LABEL) as Group[];

  return (
    <div>
      {/* hero */}
      <section className="pt-8 sm:pt-12 pb-10">
        <div className="eyebrow mb-3">{hero.eyebrow}</div>
        <h1 className="text-[34px] sm:text-[52px] leading-[1.02] font-semibold tracking-[-0.03em] max-w-4xl">
          {hero.lead}<span className="brass">{hero.accent}</span>{hero.tail}
        </h1>
        <p className="t2 text-[16px] sm:text-[17px] leading-relaxed mt-5 max-w-3xl">{hero.body}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <Kpi k="AV equipment" v={formatINR(total)} sub="Recommended system, est." />
          {hero.kpis.map((x) => <Kpi key={x.k} {...x} />)}
          <Kpi k="Screen" v={`120″ · ${viewingAngle(screenDistance(0))}°`} sub={`Row 1 · ${viewingAngle(screenDistance(1))}° from row 2`} />
          <Kpi k="Ceiling" v={`${H.toFixed(2)} m`} sub="−203 mm from 2.75 m" accent />
        </div>
      </section>

      {/* system map */}
      <Section eyebrow="The whole system" title="Where everything goes" sub="Every speaker, sub, the screen, the projector and the rack. Click anything to open its details, alternatives and the evaluator's review."
        right={<button className="btn" onClick={() => go("room")}>Open the room views →</button>}>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-4">
          <div className="card p-3 sm:p-5">
            <div className="scroll-x"><div className="min-w-[620px]"><PlanView layers={{ ...ALL_LAYERS, treatment: false, dims: false }} active={active} onPick={onPick} /></div></div>
            <Legend />
            <Chains chains={chains} onPick={onPick} />
          </div>
          <div className="card p-2 sm:p-3">
            {groups.map((g) => (
              <div key={g} className="mb-1">
                <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: GROUP_COLOR[g] }} />
                  <span className="eyebrow">{GROUP_LABEL[g]}</span>
                </div>
                {CATALOG.filter((c) => c.group === g).map((c) => {
                  const o = recommended(c);
                  return (
                    <button key={c.id} onClick={() => onPick(c.id)}
                      className={`w-full text-left grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--card-3)] ${active === c.id ? "bg-[var(--card-3)]" : ""}`}>
                      <span className="min-w-0">
                        <span className="block text-[13px] t3">{c.name}{c.qty > 1 && !c.qtyLabel ? ` · ${c.qty}` : ""}</span>
                        <span className="block text-[14px] font-medium truncate">{o.name}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[13.5px] num">{formatINR(o.price)}</span>
                        <span className={`verdict v-${c.review.verdict} !text-[10.5px] !font-medium`} title={c.review.headline}>{c.review.verdict === "agree" ? "ok" : c.review.verdict === "qualified" ? "note" : "challenge"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* evaluator */}
      <Section eyebrow="AV Evaluator" title="Where the independent evaluator pushes back"
        sub="A second opinion on every recommendation: where it agrees, and where it qualifies or challenges the choice."
        right={<button className="btn" onClick={() => go("budget")}>{rebalance ? <>See the evaluator&rsquo;s rebalance →</> : "See the budget →"}</button>}>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pushback.map((c) => (
            <button key={c.id} onClick={() => onPick(c.id)} className="card p-5 text-left lift flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] t3">{c.name}</span>
                <Verdict v={c.review.verdict} short />
              </div>
              <p className="text-[15.5px] leading-snug font-medium mt-2">{c.review.headline}</p>
              <p className="t3 text-[13px] leading-relaxed mt-2 line-clamp-3">{c.review.integrator}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ceiling */}
      <Section eyebrow="Room update" title="The ceiling came down 8 inches. Here is everything that moved."
        sub={`Finished ceiling ${ROOM.ceilingBefore.toFixed(2)} m → ${H.toFixed(3)} m. The 203 mm void above carries the ducts, the isolation hangers and the projector's exhaust.`}>
        <div className="card overflow-hidden">
          <div className="scroll-x">
            <table className="ht-table min-w-[720px]">
              <thead><tr><th className="w-[200px]">What</th><th className="w-[150px]">Before</th><th className="w-[170px]">Now</th><th>Why it matters</th></tr></thead>
              <tbody>
                {impact.map((r) => (
                  <tr key={r.k}>
                    <td className="font-medium">{r.k}</td>
                    <td className="t3 mono text-[12.5px]">{r.before}</td>
                    <td className="brass mono text-[12.5px]">{r.after}</td>
                    <td className="t2 leading-relaxed">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* explore */}
      <Section eyebrow="Explore" title="Everything else">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[
            { t: "room", h: "Room views", p: "Plan, front and side elevations and a 3D model, with speaker angles, sightlines, treatment zones and HVAC." },
            { t: "flow", h: "Signal flow", p: "Every HDMI path, speaker run, sub output, network link, trigger and power feed, with cable types and lengths." },
            { t: "rack", h: "AV rack", p: "The rack unit by unit: vent gaps, power budget, heat load and cable management." },
            { t: "compare", h: "Compare", p: "Put two or three options side by side: price, output, directivity, blacks, warranty, import — and what you'd notice." },
            { t: "budget", h: "Budget impact", p: "What +₹2 L, +₹5 L and +₹10 L buy, and where more money changes nothing." },
            { t: "buy", h: "Procurement", p: "What to buy in India, what to import from where, the saving thresholds, and what never to import." },
          ].map((x) => (
            <button key={x.t} className="card p-5 text-left lift" onClick={() => go(x.t)}>
              <div className="text-[16px] font-semibold">{x.h} <span className="brass">→</span></div>
              <p className="t2 text-[13.5px] leading-relaxed mt-1.5">{x.p}</p>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Kpi({ k, v, sub, accent }: { k: string; v: string; sub: string; accent?: boolean }) {
  return (
    <div className="card px-4 py-4">
      <div className="eyebrow !text-[10px]">{k}</div>
      <div className={`text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] num mt-1 ${accent ? "brass" : ""}`}>{v}</div>
      <div className="t3 text-[12.5px] mt-0.5">{sub}</div>
    </div>
  );
}

function Chains({ chains: CHAINS, onPick }: { chains: { t: string; steps: [string, string][] }[]; onPick: (c: string) => void }) {
  return (
    <div className="mt-5 pt-4 border-t hair space-y-2.5">
      {CHAINS.map((c) => (
        <div key={c.t} className="flex flex-wrap items-center gap-1.5">
          <span className="eyebrow w-[64px] shrink-0">{c.t}</span>
          {c.steps.map(([id, l], i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="t3 text-[12px]">→</span>}
              <button className="chip hover:border-[var(--brass)] hover:text-[var(--text)] transition-colors" onClick={() => onPick(id)}>{l}</button>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const items = [
    { c: "var(--g-speakers)", l: "Speakers (L/C/R, wides, sides, rears)" },
    { c: "#f0cf8e", l: "Atmos, in the ceiling", ring: true },
    { c: "var(--g-bass)", l: "Subwoofers" },
    { c: "var(--g-picture)", l: "Screen, projector and beam" },
    { c: "var(--g-infrastructure)", l: "AV closet and rack" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-2 pt-3">
      {items.map((i) => (
        <span key={i.l} className="flex items-center gap-2 text-[12px] t2">
          <span className="w-2.5 h-2.5 rounded-full" style={i.ring ? { border: `2px dashed ${i.c}` } : { background: i.c }} />{i.l}
        </span>
      ))}
    </div>
  );
}

/* ================================================================== room */

type ViewId = "plan" | "front" | "side" | "3d";

export function RoomTab({ onPick, active }: { onPick: (c: string) => void; active: string | null }) {
  const { markers: MARKERS, acoustics } = useHt();
  const [view, setView] = useState<ViewId>("plan");
  const [layers, setLayers] = useState<Layers>(ALL_LAYERS);
  const toggle = (l: Layer) => setLayers((s) => ({ ...s, [l]: !s[l] }));
  const sl = sightline();
  const tops = MARKERS.filter((m) => m.role === "top" && m.label.startsWith("L"));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Seg label="View" value={view} onChange={setView} options={[
            { id: "plan", label: "Top-down plan" }, { id: "front", label: "Front elevation" }, { id: "side", label: "Side elevation" }, { id: "3d", label: "3D room" },
          ]} />
        </div>
        <div className="mb-4"><Toggles items={LAYER_ITEMS} on={layers} set={toggle} /></div>
        <div className="card p-3 sm:p-5">
          <div className="scroll-x"><div className={view === "3d" ? "" : "min-w-[620px]"}>
          {view === "plan" && <PlanView layers={layers} active={active} onPick={onPick} />}
          {view === "front" && <FrontView layers={layers} active={active} onPick={onPick} />}
          {view === "side" && <SideView layers={layers} active={active} onPick={onPick} />}
          </div></div>
          {view === "3d" && <View3D layers={layers} active={active} onPick={onPick} />}
        </div>
        {layers.treatment && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 px-1">
            {(acoustics?.legend ?? [
              ["#4fa79c", "Absorption: front wall 100–150 mm, first reflections 50–100 mm, ceiling clouds"],
              ["#a898f2", "Hybrid: slotted oak over absorption, rear half"],
              ["#d6b06a", "Diffusion: above 1.9 m on the rear wall and rear side walls"],
              ["#e5825a", "Bass traps: front corners, rear ceiling corner"],
            ]).map(([c, l]) => <span key={l} className="flex items-center gap-2 text-[12px] t2"><span className="w-3 h-3 rounded-sm" style={{ background: c, opacity: 0.8 }} />{l}</span>)}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <div className="eyebrow mb-3">Critical dimensions</div>
          <dl className="kv !grid-cols-[104px_minmax(0,1fr)]">
            <dt>Room, finished</dt><dd className="num">{ROOM.L.toFixed(2)} × {ROOM.W.toFixed(2)} × {H.toFixed(3)} m</dd>
            <dt>Volume</dt><dd className="num">{volume().toFixed(1)} m³</dd>
            <dt>Screen</dt><dd>2.66 × 1.49 m, {SCREEN.bottom.toFixed(2)}–{SCREEN.top.toFixed(2)} m</dd>
            {ROWS.map((r, i) => (
              <React.Fragment key={r.id}>
                <dt>{r.label}</dt>
                <dd>{screenDistance(i as 0 | 1).toFixed(2)} m · {viewingAngle(screenDistance(i as 0 | 1))}° · ears {r.earZ.toFixed(2)} m</dd>
              </React.Fragment>
            ))}
            <dt>Row 2 sightline</dt><dd>{Math.round(sl.clearance * 1000)} mm over upright row-1 heads</dd>
            <dt>Throw</dt><dd>{throwDistance()} m · ratio {throwRatio()} (1.34–2.14)</dd>
            <dt>Lens</dt><dd>{PROJECTOR.lensZ.toFixed(2)} m · {Math.round(lensShift() * 100)}% shift (max 70%)</dd>
            <dt>HDR on screen</dt><dd>~{nits(1400)}–{nits(1700)} nits from a JVC at this throw (est.)</dd>
          </dl>
        </div>
        <div className="card p-5">
          <div className="eyebrow mb-3">Atmos angles, lowered ceiling</div>
          <table className="ht-table">
            <thead><tr><th>Pair</th><th>x</th><th>Row 1</th><th>Row 2</th></tr></thead>
            <tbody>
              {tops.map((m) => {
                const a = elevation(m, 0), b = elevation(m, 1);
                return (
                  <tr key={m.id}>
                    <td className="font-medium">{m.label.slice(1).toUpperCase()}</td>
                    <td className="num t3">{m.x.toFixed(1)}</td>
                    <td className="num">{a.deg}° {a.where}</td>
                    <td className="num">{b.deg}° {b.where}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="t3 text-[12.5px] leading-relaxed mt-3">Dolby asks for 30–55° for top-front and top-rear speakers and 65–100° for top-middle. With the lower ceiling, row 2 sits only about 1.0 m below the overheads, so levels are trimmed from row-2 measurements in calibration.</p>
        </div>
        <div className="card p-5">
          <div className="eyebrow mb-3">Acoustics</div>
          <dl className="kv">
            <dt>Target RT60</dt><dd>{acoustics?.target ?? "0.25–0.35 s, 500 Hz–2 kHz"}</dd>
            <dt>Absorption needed</dt><dd>{absorptionNeeded()} m² sabins</dd>
            <dt>Broadband panel</dt><dd>~{panelArea()} m² at α≈0.9</dd>
            <dt>Length modes</dt><dd>{axialModes(ROOM.L).join(", ")} Hz</dd>
            <dt>Width modes</dt><dd>{axialModes(ROOM.W, 2).join(", ")} Hz</dd>
            <dt>Height mode</dt><dd>{axialModes(H, 1)[0]} Hz (was {axialModes(ROOM.ceilingBefore, 1)[0]})</dd>
            <dt>Schroeder</dt><dd>~{schroeder()} Hz</dd>
          </dl>
        </div>
      </aside>
    </div>
  );
}

