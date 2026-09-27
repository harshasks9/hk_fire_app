"use client";

import React, { useState } from "react";
import { EDGE_LABEL, type EdgeKind, type FlowEdge, type FlowNode } from "@/lib/ht/system";
import { useHt } from "./data";
import { GROUP_COLOR, Hit, Toggles } from "./bits";

const EDGE_COLOR: Record<EdgeKind, string> = {
  hdmi: "#67bde0",
  line: "#a898f2",
  speaker: "#d6b06a",
  sub: "#e5825a",
  network: "#7fc49a",
  trigger: "#f28fb1",
  power: "#8fa1b3",
  light: "#bfe6f7",
};

const NODE_H = 50;
/** Monospace at 10.5 px is ~6.3 px a character. */
const fit = (t: string, px: number) => { const n = Math.floor(px / 6.3); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const NODE_W = 190;

type Kinds = Record<EdgeKind, boolean>;

function Diagram({ flow, kinds, onPick, labels, height, title }: {
  flow: { nodes: FlowNode[]; edges: FlowEdge[] };
  kinds: Kinds; onPick: (c: string) => void; labels: boolean; height: number; title: string;
}) {
  const { byId } = useHt();
  const [hover, setHover] = useState<string | null>(null);
  const byNode = new Map(flow.nodes.map((n) => [n.id, n]));
  const w = (n: FlowNode) => n.w ?? NODE_W;
  const edges = flow.edges.filter((e) => kinds[e.kind]);

  // Spread several edges leaving/entering the same side so they don't overlap.
  const outIdx = new Map<string, number>(), inIdx = new Map<string, number>();
  const outCount = new Map<string, number>(), inCount = new Map<string, number>();
  for (const e of edges) { outCount.set(e.from, (outCount.get(e.from) ?? 0) + 1); inCount.set(e.to, (inCount.get(e.to) ?? 0) + 1); }

  return (
    <svg viewBox={`0 0 960 ${height}`} className="w-full h-auto block" role="img" aria-label={title}>
      <defs>
        {Object.entries(EDGE_COLOR).map(([k, c]) => (
          <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
          </marker>
        ))}
      </defs>
      {edges.map((e, i) => {
        const a = byNode.get(e.from)!, b = byNode.get(e.to)!;
        const oi = outIdx.get(e.from) ?? 0; outIdx.set(e.from, oi + 1);
        const ii = inIdx.get(e.to) ?? 0; inIdx.set(e.to, ii + 1);
        const oc = outCount.get(e.from)!, ic = inCount.get(e.to)!;
        const forward = b.x > a.x + 10;
        let x1: number, y1: number, x2: number, y2: number, d: string;
        if (forward) {
          x1 = a.x + w(a); y1 = a.y + NODE_H * ((oi + 1) / (oc + 1));
          x2 = b.x; y2 = b.y + NODE_H * ((ii + 1) / (ic + 1));
          const mx = (x1 + x2) / 2;
          d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 2} ${y2}`;
        } else {
          // Same column (power, UPS → PDU) or backwards: route vertically.
          x1 = a.x + w(a) / 2 + (oi - (oc - 1) / 2) * 16; y1 = a.y + (b.y < a.y ? 0 : NODE_H);
          x2 = b.x + w(b) / 2 + (ii - (ic - 1) / 2) * 16; y2 = b.y + (b.y < a.y ? NODE_H : 0);
          const my = (y1 + y2) / 2;
          d = `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2 + (b.y < a.y ? 2 : -2)}`;
        }
        const lit = !hover || hover === e.from || hover === e.to;
        const c = EDGE_COLOR[e.kind];
        const lx = forward ? x1 + (x2 - x1) * 0.5 : (x1 + x2) / 2 + 8;
        const ly = forward ? y1 + (y2 - y1) * 0.5 : (y1 + y2) / 2;
        return (
          <g key={i} opacity={lit ? 1 : 0.12} style={{ transition: "opacity .15s" }}>
            <path d={d} fill="none" stroke={c} strokeWidth={e.kind === "speaker" || e.kind === "sub" ? 2.2 : 1.6}
              strokeDasharray={e.kind === "trigger" ? "3 3" : e.kind === "network" ? "6 3" : e.kind === "power" ? "1 4" : undefined}
              strokeLinecap="round" markerEnd={`url(#arr-${e.kind})`} opacity={0.85} />
            {(labels || hover === e.from || hover === e.to) && e.label && (
              <g>
                <rect x={lx - e.label.length * 2.9 - 6} y={ly - 9} width={e.label.length * 5.8 + 12} height={17} rx={5} fill="#0e1013" stroke={c} strokeOpacity={0.35} />
                <text x={lx} y={ly + 3.5} textAnchor="middle" fontSize={10} fill={c} className="svg-mono">{e.label}</text>
              </g>
            )}
          </g>
        );
      })}
      {flow.nodes.map((n) => {
        const comp = n.component ? byId(n.component) : null;
        const color = comp ? GROUP_COLOR[comp.group] : "var(--text-3)";
        return (
          <g key={n.id} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}>
            <Hit label={`${n.label} — open details`} onClick={() => n.component && onPick(n.component)}>
              <rect className="hit-ring" x={n.x - 4} y={n.y - 4} width={w(n) + 8} height={NODE_H + 8} rx={14} fill="none" stroke={color} strokeWidth={1.5} />
              <rect className="hit-body" x={n.x} y={n.y} width={w(n)} height={NODE_H} rx={11} fill="#171b20" stroke="rgba(255,255,255,0.12)" />
              <rect x={n.x} y={n.y + 10} width={3} height={NODE_H - 20} rx={1.5} fill={color} />
              <text x={n.x + 14} y={n.y + 20} fontSize={12.5} fontWeight={600} fill="var(--text)">{n.label}</text>
              <text x={n.x + 14} y={n.y + 37} fontSize={10.5} fill="var(--text-3)" className="svg-mono">{fit(`${n.loc}${n.sub ? ` · ${n.sub}` : ""}`, w(n) - 24)}</text>
            </Hit>
          </g>
        );
      })}
    </svg>
  );
}

const KIND_ITEMS: { id: EdgeKind; label: string; color: string }[] = (Object.keys(EDGE_LABEL) as EdgeKind[]).map((k) => ({ id: k, label: EDGE_LABEL[k], color: EDGE_COLOR[k] }));

export function FlowView({ onPick }: { onPick: (c: string) => void }) {
  const { flows, flowNotes } = useHt();
  const AUDIO_FLOW = flows.audio, VIDEO_FLOW = flows.video;
  const [kinds, setKinds] = useState<Kinds>({ hdmi: true, line: true, speaker: true, sub: true, network: true, trigger: true, power: true, light: true });
  const [labels, setLabels] = useState(false);
  const toggle = (k: EdgeKind) => setKinds((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggles items={KIND_ITEMS} on={kinds} set={toggle} />
        <button className="toggle" aria-pressed={labels} onClick={() => setLabels((v) => !v)}><span className="dot" />Show every cable label</button>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h3 className="text-[17px] font-semibold">Sound: sources → processor → amplification → speakers and subs</h3>
          <span className="t3 text-[12.5px]">Hover a box to trace its cables · click for the product</span>
        </div>
        <div className="scroll-x"><div className="min-w-[760px]"><Diagram flow={AUDIO_FLOW} kinds={kinds} onPick={onPick} labels={labels} height={540} title="Audio signal flow" /></div></div>
        <Cables flow={AUDIO_FLOW} kinds={kinds} />
      </div>

      <div className="card p-4 sm:p-6">
        <h3 className="text-[17px] font-semibold mb-4">Picture: sources → processor → projector → screen</h3>
        <div className="scroll-x"><div className="min-w-[760px]"><Diagram flow={VIDEO_FLOW} kinds={kinds} onPick={onPick} labels={labels} height={270} title="Video signal flow" /></div></div>
        <Cables flow={VIDEO_FLOW} kinds={kinds} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {flowNotes.map((n) => <Note key={n.title} title={n.title}>{n.body}</Note>)}
      </div>
    </div>
  );
}

function Cables({ flow, kinds }: { flow: { nodes: FlowNode[]; edges: FlowEdge[] }; kinds: Kinds }) {
  const name = (id: string) => flow.nodes.find((n) => n.id === id)!;
  const rows = flow.edges.filter((e) => kinds[e.kind]);
  return (
    <details className="mt-4 group">
      <summary className="cursor-pointer list-none text-[13px] brass inline-flex items-center gap-1.5">Every connection as a list ({rows.length}) <span className="group-open:rotate-180 transition-transform">▾</span></summary>
      <div className="scroll-x mt-3">
        <table className="ht-table min-w-[640px]">
          <thead><tr><th>From</th><th>To</th><th>Type</th><th>Cable</th><th>Where</th></tr></thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i}>
                <td>{name(e.from).label}</td>
                <td>{name(e.to).label}</td>
                <td><span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: EDGE_COLOR[e.kind] }} />{EDGE_LABEL[e.kind]}</span></td>
                <td className="mono text-[12.5px]">{e.label ?? "—"}</td>
                <td className="t3 text-[12.5px]">{name(e.from).loc} → {name(e.to).loc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-flat p-5">
      <div className="eyebrow mb-2">{title}</div>
      <p className="t2 text-[14px] leading-relaxed">{children}</p>
    </div>
  );
}
