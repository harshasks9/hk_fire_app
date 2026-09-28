"use client";

import React, { useState } from "react";
import { SURFACES, SEQUENCE, STAGE_LABEL, type Layer, type Surface } from "@/lib/ht2/build";
import { H, ROOM, RISER, STAGE, SCREEN, PROJECTOR, ROWS, DOOR } from "@/lib/ht/geometry";
import { Hit } from "./bits";

const L = 1e5;
const BRASS = "#d6b06a";
const lakhs = (n: number) => `₹${(n / L).toFixed(1)}`;

/** Material fills for the section drawings — illustration, labelled in text, not a data encoding. */
const MAT: Record<Layer["kind"], { fill: string; stroke: string; label: string }> = {
  structure: { fill: "url(#rb-conc)", stroke: "#5b626c", label: "Masonry / concrete" },
  air: { fill: "transparent", stroke: "#4a515b", label: "Air gap" },
  wool: { fill: "url(#rb-wool)", stroke: "#a0824f", label: "Mineral wool" },
  board: { fill: "#cfccc4", stroke: "#8f8c85", label: "Gypsum board" },
  damping: { fill: "#6b5d8f", stroke: "#8f82b8", label: "Damping / MLV / pads" },
  timber: { fill: "#8a6a3f", stroke: "#b08b57", label: "Plywood / timber" },
  fabric: { fill: "#1d2127", stroke: "#6d747e", label: "Fabric / screen" },
  finish: { fill: "#2c3138", stroke: "#6d747e", label: "Finish / device" },
  membrane: { fill: "#4f7ea8", stroke: "#78a6cf", label: "Membrane / treatment" },
};

function Patterns() {
  return (
    <defs>
      <pattern id="rb-conc" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#343a42" /><line x1="0" y1="0" x2="0" y2="6" stroke="#4a515b" strokeWidth="1.2" />
      </pattern>
      <pattern id="rb-wool" width="10" height="6" patternUnits="userSpaceOnUse">
        <rect width="10" height="6" fill="#6e5a37" /><path d="M0 3 Q2.5 0 5 3 T10 3" fill="none" stroke="#b99558" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

export function RoomBuild({ onPick }: { onPick: (c: string) => void }) {
  const [sel, setSel] = useState<string>("ceiling");
  const s = SURFACES.find((x) => x.id === sel)!;
  const outside = SURFACES.reduce((a, x) => [a[0] + x.cost.lo, a[1] + x.cost.hi], [0, 0]);

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold">The room in section</h3>
            <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-3xl">A long section through the middle of the room, looking at the left (lobby) wall: terrace slab above, floor slab below, screen on the left. Click a number — or a surface below — to see how it is built and why.</p>
          </div>
        </div>
        <Section sel={sel} onSel={setSel} />
        <div className="flex flex-wrap gap-2 mt-3" role="tablist" aria-label="Surfaces">
          {SURFACES.map((x) => (
            <button key={x.id} role="tab" aria-selected={sel === x.id} onClick={() => setSel(x.id)}
              className={`chip !h-8 !px-3 !text-[12.5px] ${sel === x.id ? "!border-[var(--brass)] !text-[var(--text)]" : ""}`}>
              <span className="num w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{ background: sel === x.id ? BRASS : "var(--card-3)", color: sel === x.id ? "#16130c" : "var(--text-2)" }}>{x.n}</span>
              {x.name}
            </button>
          ))}
        </div>
      </div>

      <SurfaceDetail s={s} onPick={onPick} />

      <div className="card p-4 sm:p-5">
        <h3 className="text-[16px] font-semibold">In what order</h3>
        <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-3xl">Most of what makes a theatre good is decided before anything is visible. Each stage has to be finished — and photographed — before the next one covers it.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
          {SEQUENCE.map((st) => (
            <div key={st.stage} className="well p-3.5">
              <div className="text-[13px] font-semibold">{STAGE_LABEL[st.stage]}</div>
              <ol className="mt-2 space-y-1.5">
                {st.items.map((it, i) => {
                  const sf = SURFACES.find((x) => x.id === it.surface)!;
                  return (
                    <li key={i}>
                      <button className="text-left flex gap-2 text-[13px] leading-snug t2 hover:text-[var(--text)]" onClick={() => { setSel(sf.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                        <span className="num shrink-0 w-4 h-4 mt-[2px] rounded-full text-[10px] flex items-center justify-center bg-[var(--card-3)]">{sf.n}</span>
                        <span>{it.t}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="text-[16px] font-semibold">What the room itself costs</h3>
        <p className="t2 text-[13.5px] leading-relaxed mt-1 max-w-3xl">Construction around the AV system, estimated for Hyderabad — outside the ₹30 L AV cap. Each bar is a low–high range; all are estimates, so get three quotes.</p>
        <CostRanges onSel={setSel} sel={sel} />
        <p className="t3 text-[12.5px] mt-3">Room construction: {lakhs(outside[0])}–{lakhs(outside[1])} L on top of the AV system. Already inside the AV budget, and not counted here: the baffle wall and plinths (₹0.6 L), the specialist-built treatment panels and absorbers (₹2.6 L), the hush box (₹25k) and the earth pit (₹15k).</p>
      </div>
    </div>
  );
}

/* ================================================================ section */

function Section({ sel, onSel }: { sel: string; onSel: (id: string) => void }) {
  const W = 1000;
  const x0 = -0.45, x1 = ROOM.L + 0.45, zTop = H + 0.55, zBot = -0.32;
  const S = (W - 40) / (x1 - x0);
  const Hh = Math.ceil((zTop - zBot) * S + 28);
  const X = (x: number) => 20 + (x - x0) * S;
  const Z = (z: number) => 14 + (zTop - z) * S;
  const hot = (id: string) => sel === id;
  const edge = (id: string) => (hot(id) ? BRASS : "rgba(255,255,255,0.18)");
  const slabT = 0.15, voidTop = H + 0.203 + 0.03;
  const row1 = ROWS[0], row2 = ROWS[1];
  const Num = ({ id, x, z }: { id: string; x: number; z: number }) => {
    const sf = SURFACES.find((q) => q.id === id)!;
    return (
      <Hit label={`${sf.n}. ${sf.name} — show how it is built`} onClick={() => onSel(id)}>
        <g>
          <circle cx={X(x)} cy={Z(z)} r={16} fill="transparent" />
          <circle className="hit-body" cx={X(x)} cy={Z(z)} r={11} fill={hot(id) ? BRASS : "#20252c"} stroke={hot(id) ? "#16130c" : BRASS} strokeWidth={1.5} />
          <text x={X(x)} y={Z(z) + 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={hot(id) ? "#16130c" : BRASS}>{sf.n}</text>
        </g>
      </Hit>
    );
  };
  return (
    <div className="scroll-x mt-3">
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full min-w-[640px] h-auto block" role="img" aria-label="Long section through the theatre showing each surface's build-up">
        <Patterns />
        {/* terrace slab + membrane */}
        <rect x={X(x0)} y={Z(voidTop + slabT + 0.05)} width={(x1 - x0) * S} height={0.05 * S} fill="#4f7ea8" opacity={hot("ceiling") ? 0.9 : 0.5} />
        <rect x={X(x0)} y={Z(voidTop + slabT)} width={(x1 - x0) * S} height={slabT * S} fill="url(#rb-conc)" stroke={edge("ceiling")} />
        <text x={X(x1) - 6} y={Z(voidTop + slabT + 0.1)} textAnchor="end" fontSize={10.5} fill="var(--text-3)">Terrace: membrane, screed, heat-reflective coat</text>
        {/* hangers */}
        {[0.5, 1.7, 2.9, 4.1, 5.3].map((x) => <line key={x} x1={X(x)} x2={X(x)} y1={Z(voidTop)} y2={Z(H + 0.1)} stroke={hot("ceiling") ? BRASS : "#6d747e"} strokeWidth={1.2} strokeDasharray="3 2" />)}
        {/* ceiling wool + boards */}
        <rect x={X(0)} y={Z(H + 0.1)} width={ROOM.L * S} height={0.075 * S} fill="url(#rb-wool)" opacity={0.85} />
        <rect x={X(0)} y={Z(H + 0.025)} width={ROOM.L * S} height={0.025 * S} fill="#cfccc4" stroke={edge("ceiling")} />
        {/* duct in void */}
        <rect x={X(3.2)} y={Z(voidTop - 0.02)} width={1.6 * S} height={0.09 * S} rx={3} fill="none" stroke="#7fc49a" strokeOpacity={0.7} strokeDasharray="4 3" />
        <text x={X(4.0)} y={Z(voidTop - 0.02) - 3} textAnchor="middle" fontSize={9.5} fill="#7fc49a" opacity={0.8}>lined duct / exhaust</text>
        {/* reflection absorber + atmos */}
        <rect x={X(1.3)} y={Z(H)} width={0.65 * S} height={0.05 * S} fill="url(#rb-wool)" stroke={edge("ceiling")} />
        {[2.1, 4.95].map((x) => <rect key={x} x={X(x) - 12} y={Z(H) - 1} width={24} height={7} rx={2} fill={BRASS} opacity={0.85} />)}
        {/* floor slab */}
        <rect x={X(x0)} y={Z(0)} width={(x1 - x0) * S} height={0.15 * S} fill="url(#rb-conc)" stroke={edge("floor")} />
        <text x={X(x1) - 6} y={Z(-0.2) + 4} textAnchor="end" fontSize={10.5} fill="var(--text-3)">Floor slab — rooms below</text>
        {/* front brick wall + window infill */}
        <rect x={X(-0.23)} y={Z(voidTop)} width={0.23 * S} height={voidTop * S} fill="url(#rb-conc)" stroke={edge("front")} />
        <rect x={X(-0.23)} y={Z(2.1)} width={0.23 * S} height={1.2 * S} fill="#4a4036" opacity={0.9} />
        <text x={X(-0.115)} y={Z(1.5)} textAnchor="middle" fontSize={9} fill="var(--text-2)" transform={`rotate(-90 ${X(-0.115)} ${Z(1.5)})`}>window bricked up</text>
        {/* rear wall + lining + absorber */}
        <rect x={X(ROOM.L + 0.1)} y={Z(voidTop)} width={0.23 * S} height={voidTop * S} fill="url(#rb-conc)" stroke={edge("rear")} />
        <rect x={X(ROOM.L)} y={Z(H)} width={0.1 * S} height={H * S} fill="url(#rb-wool)" opacity={0.55} stroke={edge("rear")} />
        <rect x={X(ROOM.L - 0.125)} y={Z(2.2)} width={0.125 * S} height={1.6 * S} fill="url(#rb-wool)" stroke={edge("rear")} />
        {/* stage + baffle + corner trap */}
        <rect x={X(0)} y={Z(H)} width={0.15 * S} height={H * S} fill="url(#rb-wool)" opacity={0.8} stroke={edge("front")} />
        <rect x={X(0)} y={Z(STAGE.height)} width={STAGE.depth * S} height={STAGE.height * S} fill="#8a6a3f" stroke={edge("front")} />
        <rect x={X(0.5) - 3} y={Z(H)} width={9} height={(H - STAGE.height) * S} fill="#1d2127" stroke={edge("front")} />
        <rect x={X(0.2)} y={Z(1.4)} width={0.3 * S} height={0.48 * S} rx={3} fill="#2c3138" stroke="#6d747e" />
        <rect x={X(0.22)} y={Z(STAGE.height + 0.39)} width={0.37 * S} height={0.39 * S} rx={3} fill="#2a1a13" stroke="#e5825a" strokeOpacity={0.8} />
        <line x1={X(SCREEN.x)} x2={X(SCREEN.x)} y1={Z(SCREEN.top)} y2={Z(SCREEN.bottom)} stroke="#67bde0" strokeWidth={3} />
        <text x={X(SCREEN.x) + 6} y={Z(SCREEN.bottom) - 6} fontSize={10} fill="#67bde0">AT screen</text>
        {/* riser */}
        <rect x={X(RISER.x0)} y={Z(RISER.height)} width={(ROOM.L - RISER.x0) * S} height={RISER.height * S} fill="url(#rb-wool)" opacity={hot("floor") ? 1 : 0.6} stroke={edge("floor")} />
        <rect x={X(RISER.x0)} y={Z(RISER.height)} width={(ROOM.L - RISER.x0) * S} height={0.036 * S} fill="#8a6a3f" />
        <rect x={X(RISER.x0 - 0.3)} y={Z(RISER.stepRise)} width={0.3 * S} height={RISER.stepRise * S} fill="#8a6a3f" stroke={edge("floor")} />
        <rect x={X(ROOM.L - 0.53)} y={Z(0.36)} width={0.36 * S} height={0.36 * S} rx={3} fill="#2a1a13" stroke="#e5825a" strokeDasharray="3 2" />
        {/* carpet */}
        <rect x={X(STAGE.depth)} y={Z(0.012)} width={(RISER.x0 - STAGE.depth) * S} height={3} fill="#454b54" />
        {/* seats */}
        {[row1, row2].map((r) => (
          <g key={r.id} opacity={0.75}>
            <rect x={X(r.x0 + 0.1)} y={Z(r.base + 0.45)} width={(r.x1 - r.x0 - 0.2) * S} height={0.45 * S} rx={5} fill="#262b32" stroke="#3b434e" />
            <rect x={X(r.x1 - 0.3)} y={Z(r.base + 1.05)} width={0.2 * S} height={0.62 * S} rx={5} fill="#262b32" stroke="#3b434e" />
            <circle cx={X(r.earX)} cy={Z(r.earZ)} r={3.5} fill="var(--text-2)" />
          </g>
        ))}
        {/* projector + hush box */}
        <rect x={X(PROJECTOR.lensX - 0.06)} y={Z(H - 0.01)} width={(ROOM.L - 0.13 - PROJECTOR.lensX + 0.06) * S} height={(H - 0.01 - PROJECTOR.boxBottom + 0.03) * S} rx={3} fill="#1d2127" stroke={edge("rear")} strokeDasharray="4 2" />
        <circle cx={X(PROJECTOR.lensX - 0.06)} cy={Z(PROJECTOR.lensZ)} r={3} fill="#67bde0" />
        <text x={X(PROJECTOR.lensX - 0.12)} y={Z(PROJECTOR.boxBottom) + 12} textAnchor="end" fontSize={9.5} fill="var(--text-3)">projector in hush box</text>
        {/* door (on the far, left wall) */}
        <rect x={X(DOOR.x0)} y={Z(DOOR.height)} width={(DOOR.x1 - DOOR.x0) * S} height={DOOR.height * S} fill="none" stroke={edge("door")} strokeDasharray="6 4" strokeWidth={hot("door") ? 2 : 1} />
        <text x={X((DOOR.x0 + DOOR.x1) / 2)} y={Z(DOOR.height) + 14} textAnchor="middle" fontSize={10} fill="var(--text-3)">door (far wall)</text>
        {/* side panels on the far wall */}
        <rect x={X(1.6)} y={Z(1.9)} width={(DOOR.x0 - 1.6) * S} height={1.0 * S} fill="none" stroke={edge("sides")} strokeDasharray="2 3" strokeWidth={hot("sides") ? 2 : 1} />
        <rect x={X(DOOR.x1 + 0.1)} y={Z(2.2)} width={(ROOM.L - 0.25 - DOOR.x1 - 0.1) * S} height={1.0 * S} fill="none" stroke={edge("sides")} strokeDasharray="2 3" strokeWidth={hot("sides") ? 2 : 1} />
        <text x={X(1.65)} y={Z(1.9) + 13} fontSize={9.5} fill="var(--text-3)">reflection panels (far wall)</text>
        {/* AC slot */}
        <rect x={X(1.1)} y={Z(2.3)} width={1.5 * S} height={5} rx={2} fill="#7fc49a" opacity={hot("air") ? 0.95 : 0.5} />
        <text x={X(1.1)} y={Z(2.3) + 17} fontSize={9.5} fill="#7fc49a" opacity={0.8}>supply slot, side wall</text>
        <text x={X(RISER.x0) - 6} y={Z(0.36)} textAnchor="end" fontSize={9.5} fill="#7fc49a" opacity={0.8}>AC return</text>
        <rect x={X(RISER.x0) - 3} y={Z(0.3)} width={5} height={0.2 * S} fill="#7fc49a" opacity={hot("air") ? 0.95 : 0.5} />
        {/* power: floor conduit, socket, earth */}
        <line x1={X(0.7)} x2={X(3.1)} y1={Z(0.05)} y2={Z(0.05)} stroke={hot("power") ? BRASS : "#6d747e"} strokeWidth={1.5} strokeDasharray="6 3" />
        <rect x={X(1.05)} y={Z(0.42)} width={16} height={12} rx={2} fill="#20252c" stroke={hot("power") ? BRASS : "#6d747e"} />
        <text x={X(1.05) + 22} y={Z(0.42) + 10} fontSize={9.5} fill="var(--text-3)">sockets · conduit · AV earth</text>
        {/* callouts */}
        <Num id="ceiling" x={0.95} z={H + 0.14} />
        <Num id="front" x={0.33} z={2.05} />
        <Num id="sides" x={2.4} z={1.4} />
        <Num id="rear" x={ROOM.L - 0.35} z={1.55} />
        <Num id="floor" x={5.0} z={0.2} />
        <Num id="door" x={3.7} z={1.2} />
        <Num id="air" x={2.7} z={2.28} />
        <Num id="power" x={0.88} z={0.62} />
      </svg>
    </div>
  );
}

/* ============================================================ the detail */

function SurfaceDetail({ s, onPick }: { s: Surface; onPick: (c: string) => void }) {
  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="num shrink-0 w-8 h-8 rounded-full text-[14px] font-bold flex items-center justify-center" style={{ background: BRASS, color: "#16130c" }}>{s.n}</span>
        <div className="min-w-0">
          <h3 className="text-[20px] font-semibold tracking-[-0.01em]">{s.name}</h3>
          <p className="t2 text-[14px] mt-0.5">{s.where}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 mt-5">
        <div className="min-w-0">
          <div className="eyebrow mb-2">What the sound does here</div>
          <div className="space-y-3">
            {s.acoustics.map((p, i) => <p key={i} className="text-[14.5px] leading-relaxed">{p}</p>)}
          </div>
          <div className="eyebrow mt-6 mb-2">What it carries</div>
          <dl className="space-y-2.5">
            {s.details.map((d) => (
              <div key={d.k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-[13.5px] leading-relaxed">
                <dt className="t3">{d.k}</dt><dd className="t2">{d.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            <div className="eyebrow mb-2">Build-up, house side → room side</div>
            <Stack layers={s.layers} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {s.targets.map((t) => (
              <div key={t.k} className="well px-3 py-2">
                <div className="t3 text-[11.5px]">{t.k}</div>
                <div className="text-[13.5px] font-medium">{t.v}</div>
              </div>
            ))}
            <div className="well px-3 py-2">
              <div className="t3 text-[11.5px]">Construction cost (est.)</div>
              <div className="text-[13.5px] font-medium num">{lakhs(s.cost.lo)}–{lakhs(s.cost.hi)} L</div>
            </div>
          </div>
          <p className="t3 text-[12.5px] leading-relaxed -mt-2">{s.cost.note}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t hair">
        <div>
          <div className="eyebrow mb-2">In India</div>
          <p className="t2 text-[13.5px] leading-relaxed">{s.india}</p>
        </div>
        <div>
          <div className="eyebrow mb-2" style={{ color: "var(--disagree)" }}>Don&rsquo;t</div>
          <ul className="space-y-1.5">{s.avoid.map((a) => <li key={a} className="t2 text-[13.5px] leading-relaxed flex gap-2"><span style={{ color: "var(--disagree)" }}>×</span>{a}</li>)}</ul>
        </div>
        <div>
          <div className="eyebrow mb-2" style={{ color: "var(--agree)" }}>Check before paying</div>
          <ul className="space-y-1.5">{s.verify.map((a) => <li key={a} className="t2 text-[13.5px] leading-relaxed flex gap-2"><span style={{ color: "var(--agree)" }}>✓</span>{a}</li>)}</ul>
        </div>
      </div>
      {(s.id === "front" || s.id === "rear" || s.id === "sides") && (
        <button className="btn btn-sm mt-5" onClick={() => onPick(s.id === "front" ? "cabling" : "treatment")}>Open the {s.id === "front" ? "baffle and hush-box" : "treatment"} line in the AV budget →</button>
      )}
    </div>
  );
}

/** A section through one surface, drawn to scale (thin layers get a minimum width), numbered and listed. */
function Stack({ layers }: { layers: Layer[] }) {
  const W = 520, h = 96, minW = 9;
  const total = layers.reduce((a, l) => a + Math.max(l.mm, 0), 0) || 1;
  const thin = layers.filter((l) => l.mm < 15).length;
  const scale = (W - 20 - thin * minW) / Math.max(1, layers.filter((l) => l.mm >= 15).reduce((a, l) => a + l.mm, 0) || total);
  let x = 10;
  const bands = layers.map((l) => {
    const w = l.mm < 15 ? minW : l.mm * scale;
    const b = { l, x, w };
    x += w;
    return b;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${h + 26}`} className="w-full h-auto block" role="img" aria-label={`Build-up: ${layers.map((l) => l.name).join(", ")}`}>
        <Patterns />
        <text x={10} y={12} fontSize={10.5} fill="var(--text-3)">house side</text>
        <text x={W - 10} y={12} textAnchor="end" fontSize={10.5} fill="var(--text-3)">room side →</text>
        {bands.map((b, i) => {
          const m = MAT[b.l.kind];
          return (
            <g key={i}>
              <rect x={b.x} y={20} width={Math.max(1, b.w - 1)} height={h - 8} fill={m.fill} stroke={m.stroke} strokeDasharray={b.l.kind === "air" ? "3 3" : undefined} />
              <text x={b.x + b.w / 2} y={h + 24} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--text-2)">{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <ol className="mt-2 space-y-1">
        {layers.map((l, i) => (
          <li key={i} className="grid grid-cols-[18px_14px_minmax(0,1fr)_56px] items-start gap-2 text-[12.5px] leading-snug">
            <span className="t3 num text-right">{i + 1}</span>
            <span className="w-3 h-3 mt-[2px] rounded-sm border" style={{ background: MAT[l.kind].fill.startsWith("url") ? (l.kind === "wool" ? "#8a7047" : "#3b4149") : MAT[l.kind].fill, borderColor: MAT[l.kind].stroke }} />
            <span className="t2">{l.name}{l.note && <span className="t3"> — {l.note}</span>}</span>
            <span className="num t3 text-right">{l.mm ? `${l.mm} mm` : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CostRanges({ sel, onSel }: { sel: string; onSel: (id: string) => void }) {
  const max = 3.5 * L;
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="mt-4 grid grid-cols-[minmax(0,170px)_minmax(0,1fr)_92px] gap-x-3 gap-y-2 text-[12.5px] items-center">
      <span />
      <div className="relative h-4">{[0, 1, 2, 3].map((t) => <span key={t} className="absolute -translate-x-1/2 t3 mono text-[10.5px]" style={{ left: pct(t * L) }}>₹{t}L</span>)}</div>
      <span />
      {SURFACES.map((s) => (
        <React.Fragment key={s.id}>
          <button className={`text-left truncate ${sel === s.id ? "font-semibold" : "t2"} hover:underline`} onClick={() => onSel(s.id)}>{s.n}. {s.name}</button>
          <div className="relative h-3 rounded-sm bg-[var(--card-3)]">
            <span className="absolute inset-y-0 rounded-sm" style={{ left: pct(s.cost.lo), width: pct(s.cost.hi - s.cost.lo), background: "#80858d" }} />
          </div>
          <span className="num text-right t2">{lakhs(s.cost.lo)}–{lakhs(s.cost.hi)} L</span>
        </React.Fragment>
      ))}
    </div>
  );
}
