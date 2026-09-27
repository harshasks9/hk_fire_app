"use client";

import React, { useState } from "react";
import { type RackUnit } from "@/lib/ht/system";
import { useHt } from "./data";
import { GROUP_COLOR, Hit } from "./bits";

const UH = 24;

export function RackView({ onPick }: { onPick: (c: string) => void }) {
  const [hover, setHover] = useState<RackUnit | null>(null);
  const { rack: RACK, rackUnits: RACK_U, power: p, projectorWatts: PROJECTOR_WATTS, byId } = useHt();
  const W = 440, left = 46, top = 20;
  const height = top * 2 + RACK_U * UH;
  const y = (u: number, h: number) => top + (RACK_U - (u + h - 1)) * UH;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
      <div className="card p-4 sm:p-6">
        <div className="flex items-baseline justify-between mb-4 gap-3">
          <h3 className="text-[17px] font-semibold">{RACK_U}U rack, front view</h3>
          <span className="t3 text-[12.5px]">Click any unit</span>
        </div>
        <svg viewBox={`0 0 ${W + left + 30} ${height}`} className="w-full h-auto max-w-[560px] mx-auto block" role="img" aria-label="AV rack elevation">
          <defs>
            <pattern id="vent" width="8" height="6" patternUnits="userSpaceOnUse">
              <rect width="8" height="6" fill="#0d0f12" />
              <rect x="1" y="2" width="6" height="2" rx="1" fill="#252a31" />
            </pattern>
          </defs>
          <rect x={left - 14} y={top - 10} width={W + 28} height={RACK_U * UH + 20} rx={10} fill="#0c0e11" stroke="rgba(255,255,255,0.12)" />
          <rect x={left - 8} y={top} width={8} height={RACK_U * UH} fill="#1d2127" />
          <rect x={left + W} y={top} width={8} height={RACK_U * UH} fill="#1d2127" />
          {Array.from({ length: RACK_U }).map((_, i) => (
            <text key={i} x={left - 20} y={top + i * UH + UH / 2 + 3.5} textAnchor="end" fontSize={9.5} fill="var(--text-3)" className="svg-mono">{RACK_U - i}</text>
          ))}
          {RACK.map((r) => {
            const yy = y(r.u, r.h);
            const hh = r.h * UH - 2;
            if (r.kind === "vent") {
              return (
                <g key={r.u} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}>
                  <rect x={left} y={yy + 1} width={W} height={hh} fill="url(#vent)" rx={2} />
                  <text x={left + W - 8} y={yy + hh / 2 + 4} textAnchor="end" fontSize={9.5} fill="#4b535e" className="svg-mono">vent</text>
                </g>
              );
            }
            const comp = r.component ? byId(r.component) : null;
            const color = comp ? GROUP_COLOR[comp.group] : "var(--text-3)";
            const face = r.kind === "power" ? "#15191d" : r.kind === "fan" ? "#121518" : r.kind === "cable" ? "#111316" : "#1a1e24";
            return (
              <g key={r.u} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}>
                <Hit label={`${r.label} — open details`} onClick={() => r.component && onPick(r.component)}>
                  <rect className="hit-ring" x={left - 3} y={yy - 2} width={W + 6} height={hh + 6} rx={5} fill="none" stroke={color} strokeWidth={1.5} />
                  <rect className="hit-body" x={left} y={yy + 1} width={W} height={hh} rx={3} fill={face} stroke="rgba(255,255,255,0.1)" />
                  <rect x={left + 6} y={yy + 5} width={3} height={hh - 8} rx={1.5} fill={color} />
                  {r.kind === "device" && r.h >= 2 && (
                    <>
                      <circle cx={left + W - 22} cy={yy + hh / 2 + 1} r={r.h >= 4 ? 16 : 6} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={r.h >= 4 ? 3 : 1.5} />
                      <rect x={left + W - 110} y={yy + hh / 2 - 4} width={60} height={9} rx={2} fill="#0b0d0f" />
                    </>
                  )}
                  {r.kind === "fan" && [0, 1, 2, 3].map((i) => <circle key={i} cx={left + 120 + i * 70} cy={yy + hh / 2 + 1} r={8} fill="none" stroke="#2c323a" />)}
                  <text x={left + 18} y={yy + (r.h > 1 ? 18 : hh / 2 + 5)} fontSize={12} fontWeight={600} fill="var(--text)">{r.label}</text>
                  {r.h > 1 && r.sub && <text x={left + 18} y={yy + 34} fontSize={10} fill="var(--text-3)">{r.sub}</text>}
                  {r.h === 1 && r.sub && r.kind !== "fan" && <text x={left + W - 12} y={yy + hh / 2 + 4} textAnchor="end" fontSize={9.5} fill="var(--text-3)">{r.sub.length > 34 ? `${r.sub.slice(0, 33)}…` : r.sub}</text>}
                </Hit>
              </g>
            );
          })}
        </svg>
        <p className="t3 text-[12.5px] mt-3 text-center min-h-[18px]">
          {hover ? <>U{hover.u}{hover.h > 1 ? `–${hover.u + hover.h - 1}` : ""} · {hover.label}{hover.sub ? ` — ${hover.sub}` : ""}</> : "Hot units get a 1U gap above them; heavy units sit low."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="eyebrow mb-3">Power budget</div>
          <div className="grid grid-cols-3 gap-2">
            <Stat k="Typical on UPS" v={`${(p.typ / 1000).toFixed(1)} kW`} />
            <Stat k="Peak on UPS" v={`${(p.peak / 1000).toFixed(1)} kW`} />
            <Stat k="UPS capacity" v={`${(p.capacity / 1000).toFixed(1)} kW`} />
          </div>
          <div className="bar mt-4" aria-label={`Peak load ${Math.round((p.peak / p.capacity) * 100)}% of UPS capacity`}>
            <span style={{ width: `${(p.typ / p.capacity) * 100}%`, background: "var(--agree)" }} />
            <span style={{ width: `${((p.peak - p.typ) / p.capacity) * 100}%`, background: "var(--qualified)", opacity: 0.7 }} />
          </div>
          <p className="t2 text-[13.5px] leading-relaxed mt-3">
            On the UPS: {RACK.filter((r) => r.ups && r.watts && r.kind !== "power").map((r) => r.label).join(", ")} and the projector ({PROJECTOR_WATTS[1]} W, by its own circuit to the rear shelf). Peak is {Math.round((p.peak / p.capacity) * 100)}% of the UPS&rsquo;s {(p.capacity / 1000).toFixed(1)} kW.
            The two sub amps (up to {(p.subsPeak / 1000).toFixed(1)} kW in bursts) run from the sequenced PDU on a dedicated 20 A circuit, <strong className="text-[var(--text)]">not</strong> through the UPS.
          </p>
        </div>

        <div className="card p-5">
          <div className="eyebrow mb-3">Heat & airflow</div>
          <p className="t2 text-[13.5px] leading-relaxed">
            A loud film puts about <strong className="text-[var(--text)]">{Math.round(p.heatW / 100) * 100} W</strong> (~{Math.round(p.heatBtu / 100) * 100} BTU/h) into the closet. Air enters low through the perforated front door, rises through the 1U gaps above each hot unit, and leaves through the thermostatic fan tray at the top. In a Hyderabad summer the closet itself needs an exhaust fan to outside or a small split AC; a temperature alert at the top of the rack is cheap insurance.
          </p>
        </div>

        <div className="card p-5">
          <div className="eyebrow mb-3">Cable management</div>
          <ul className="t2 text-[13.5px] leading-relaxed space-y-2 list-disc pl-5">
            <li>Speaker, sub and HDMI runs enter at the top through the patch panel (U24) and drop down the rear left rail; power runs down the rear right rail, so signal and mains never share a bundle.</li>
            <li>A service loop long enough to slide the receiver forward without unplugging anything.</li>
            <li>Every cable labelled at both ends: channel name, run length, and for the fibre HDMI the direction (SOURCE → DISPLAY).</li>
            <li>Star earth at the rack: neutral-to-earth under 2 V, measured before handover.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="well px-3 py-2.5">
      <div className="eyebrow !text-[10px]">{k}</div>
      <div className="text-[18px] font-semibold num mt-0.5">{v}</div>
    </div>
  );
}
