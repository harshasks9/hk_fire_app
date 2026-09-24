"use client";

import React from "react";
import type { Edge, FrameOpening, Layout, Piece, RoomDesign, RoomFrame } from "@/lib/design/types";
import { frameFor } from "@/lib/design/frame";
import { feetLabel } from "@/lib/model/measure";

/**
 * One room, one layout, drawn to scale.
 *
 * The walls, windows, sliders and doors come from the plan geometry; the
 * furniture comes from the layout's data, at real sizes. Drawn road-down like
 * every other sheet in the app, so north is to the right.
 */

const INK = "#2b2622", MID = "#8a8076", WALL = "#6f665d", GLASS = "#cfe0ea", CLAY = "#b0623c";
const FLOOR: Record<string, string> = {
  wood: "#f2e8d7", stone: "#efebe4", tile: "#e8ecee", deck: "#ebe0ca", paving: "#ece8e0", grass: "#e3ebd9",
  service: "#eceae6", void: "#f4f2ee", water: "#dde9ef",
};
/** The floor's accent, from the concept: clay, sage, ink blue. */
const ACCENT: Record<string, [string, string]> = {
  ground: ["#ecd2c1", "#d6ab92"], first: ["#d6e2cf", "#aec3a4"], second: ["#d3dae8", "#a9b6cf"], outdoor: ["#e9dfca", "#d2c29f"],
};
const OAK = "#e9d7b8", OAK_D = "#cdb58d", STONE = "#e4e1db", WHITE = "#fdfbf8";

const short = (p: Piece) => (p.label ?? p.kind).replace(/\s+\d[\d\s×x,.]*(mm)?.*$/, "").replace(/,.*$/, "");

export function RoomLayout({
  design, layout, frame, compact, className, maxHeight,
}: { design: RoomDesign; layout: Layout; frame?: RoomFrame; compact?: boolean; className?: string; maxHeight?: number }) {
  const f = frame ?? frameFor(design, layout);
  const base = Math.max(f.W, f.H * 0.85);
  const fs = base / (compact ? 30 : 36);
  const sw = base / 520;
  const T = Math.max(160, base / 34);
  const M = T + fs * (compact ? 1.2 : 3.6);
  const Vw = f.W + 2 * M, Vh = f.H + 2 * M;
  const [soft, strong] = ACCENT[f.outdoor ? "outdoor" : f.floor];

  const pieces = [...layout.pieces].sort((a, b) => Number(!!b.soft) - Number(!!a.soft));

  return (
    <svg viewBox={`${-M} ${-M} ${Vw} ${Vh}`} className={className} role="img"
      aria-label={`${layout.name}: layout ${layout.key}`} style={{ display: "block", width: "100%", height: "auto", maxHeight }}
      fontFamily="Inter, Helvetica, Arial, sans-serif">
      {/* walls and floor */}
      {!f.outdoor && <rect x={-T} y={-T} width={f.W + 2 * T} height={f.H + 2 * T} fill={WALL} rx={T / 6} />}
      <rect x={0} y={0} width={f.W} height={f.H} fill={FLOOR[f.finish] ?? FLOOR.stone}
        stroke={f.outdoor ? MID : "none"} strokeWidth={sw} strokeDasharray={f.outdoor ? `${sw * 6} ${sw * 4}` : undefined} />
      {f.openings.map((o, i) => <OpeningMark key={i} o={o} f={f} T={T} sw={sw} fs={fs} compact={compact} />)}

      {/* furniture */}
      {pieces.map((p, i) => <Glyph key={i} p={p} sw={sw} soft={soft} strong={strong} />)}
      {!compact && pieces.map((p, i) => <PieceLabel key={`l${i}`} p={p} fs={fs} />)}

      {/* clearances */}
      {!compact && layout.dims?.map((d, i) => <DimLine key={i} d={d} sw={sw} fs={fs} />)}

      {/* overall size and north */}
      {!compact && (
        <>
          <line x1={0} y1={-T - fs * 1.5} x2={f.W} y2={-T - fs * 1.5} stroke={MID} strokeWidth={sw} />
          <text x={f.W / 2} y={-T - fs * 2.0} fontSize={fs * 0.9} textAnchor="middle" fill={MID}>
            {f.W} mm · {feetLabel(f.W / 304.8)}
          </text>
          <line x1={-T - fs * 1.5} y1={0} x2={-T - fs * 1.5} y2={f.H} stroke={MID} strokeWidth={sw} />
          <text x={-T - fs * 2.0} y={f.H / 2} fontSize={fs * 0.9} textAnchor="middle" fill={MID}
            transform={`rotate(-90 ${-T - fs * 2.0} ${f.H / 2})`}>
            {f.H} mm · {feetLabel(f.H / 304.8)}
          </text>
          <g transform={`translate(${f.W + T + fs * 1.2} ${-T - fs * 1.7})`}>
            <path d={`M ${-fs * 0.9} 0 L ${fs * 0.9} 0 M ${fs * 0.4} ${-fs * 0.45} L ${fs * 0.9} 0 L ${fs * 0.4} ${fs * 0.45}`}
              stroke={INK} strokeWidth={sw * 1.4} fill="none" />
            <text x={0} y={fs * 1.3} fontSize={fs * 0.8} textAnchor="middle" fill={INK} fontWeight={600}>N</text>
          </g>
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ openings */

function OpeningMark({ o, f, T, sw, fs, compact }: { o: FrameOpening; f: RoomFrame; T: number; sw: number; fs: number; compact?: boolean }) {
  const len = o.to - o.from;
  const horiz = o.edge === "top" || o.edge === "bottom";
  // the wall band section this opening cuts
  const band = o.edge === "top" ? { x: o.from, y: -T, w: len, h: T }
    : o.edge === "bottom" ? { x: o.from, y: f.H, w: len, h: T }
    : o.edge === "left" ? { x: -T, y: o.from, w: T, h: len }
    : { x: f.W, y: o.from, w: T, h: len };
  const stroke = o.assumed ? CLAY : INK;
  const dash = o.assumed ? `${sw * 5} ${sw * 3}` : undefined;
  const out: React.ReactNode[] = [];

  if (o.kind === "window" || o.kind === "slider") {
    out.push(<rect key="g" {...band} width={band.w} height={band.h} fill={GLASS} stroke={INK} strokeWidth={sw * 0.8} />);
    const mid = horiz ? band.y + band.h / 2 : band.x + band.w / 2;
    if (o.kind === "window") {
      out.push(horiz
        ? <line key="m" x1={band.x} y1={mid} x2={band.x + band.w} y2={mid} stroke={INK} strokeWidth={sw * 0.8} />
        : <line key="m" x1={mid} y1={band.y} x2={mid} y2={band.y + band.h} stroke={INK} strokeWidth={sw * 0.8} />);
    } else {
      const off = T * 0.18, half = len / 2;
      out.push(horiz
        ? <g key="s"><line x1={band.x} y1={mid - off} x2={band.x + half + len * 0.05} y2={mid - off} stroke={INK} strokeWidth={sw * 1.2} />
            <line x1={band.x + half - len * 0.05} y1={mid + off} x2={band.x + band.w} y2={mid + off} stroke={INK} strokeWidth={sw * 1.2} /></g>
        : <g key="s"><line x1={mid - off} y1={band.y} x2={mid - off} y2={band.y + half + len * 0.05} stroke={INK} strokeWidth={sw * 1.2} />
            <line x1={mid + off} y1={band.y + half - len * 0.05} x2={mid + off} y2={band.y + band.h} stroke={INK} strokeWidth={sw * 1.2} /></g>);
    }
  } else {
    out.push(<rect key="gap" x={band.x} y={band.y} width={band.w} height={band.h} fill={FLOOR[f.finish] ?? FLOOR.stone} />);
    if ((o.kind === "door" || o.kind === "dbldoor") && o.pocket) {
      const wallAt = o.edge === "top" ? 0 : o.edge === "bottom" ? f.H : o.edge === "left" ? 0 : f.W;
      const P = (along: number) => (horiz ? [along, wallAt] : [wallAt, along]) as [number, number];
      const [ax, ay] = P(o.from), [bx, by] = P(o.to);
      out.push(<line key="pk" x1={ax} y1={ay} x2={bx} y2={by} stroke={CLAY} strokeWidth={sw * 2.2} strokeDasharray={`${sw * 8} ${sw * 3}`} />);
    } else if (o.kind === "door" || o.kind === "dbldoor") {
      const leaves = o.kind === "dbldoor" ? [[o.from, (o.from + o.to) / 2, true], [(o.from + o.to) / 2, o.to, false]] as const
        : [[o.from, o.to, !!o.hingeAtFrom]] as const;
      const inward = o.swingIn !== false;
      for (const [a, b, hingeAtA] of leaves) {
        const r = b - a, hinge = hingeAtA ? a : b, free = hingeAtA ? b : a;
        // wall line coordinate and the direction "into" the swing
        const wallAt = o.edge === "top" ? 0 : o.edge === "bottom" ? f.H : o.edge === "left" ? 0 : f.W;
        const intoRoom = o.edge === "top" || o.edge === "left" ? 1 : -1;
        const dir = inward ? intoRoom : -intoRoom;
        const P = (along: number, off: number) => (horiz ? [along, wallAt + off * dir] : [wallAt + off * dir, along]) as [number, number];
        const [hx, hy] = P(hinge, 0), [lx, ly] = P(hinge, r), [fx, fy] = P(free, 0);
        const sweep = (() => {
          const cross = (lx - hx) * (fy - hy) - (ly - hy) * (fx - hx);
          return cross > 0 ? 1 : 0;
        })();
        out.push(<g key={`${a}`}>
          <line x1={hx} y1={hy} x2={lx} y2={ly} stroke={stroke} strokeWidth={sw * 1.3} strokeDasharray={dash} />
          <path d={`M ${lx} ${ly} A ${r} ${r} 0 0 ${sweep} ${fx} ${fy}`} fill="none" stroke={stroke}
            strokeWidth={sw * 0.8} strokeDasharray={dash ?? `${sw * 4} ${sw * 3}`} opacity={0.8} />
        </g>);
      }
    } else if (o.assumed) {
      out.push(<rect key="as" x={band.x} y={band.y} width={band.w} height={band.h} fill="none" stroke={CLAY} strokeWidth={sw} strokeDasharray={dash} />);
    }
  }
  if (o.assumed && !compact) {
    const cx = band.x + band.w / 2, cy = band.y + band.h / 2;
    const tx = o.edge === "left" ? cx - T * 0.9 : o.edge === "right" ? cx + T * 0.9 : cx;
    const ty = o.edge === "top" ? cy - T * 0.9 : o.edge === "bottom" ? cy + T * 1.4 : cy;
    out.push(<text key="t" x={tx} y={ty} fontSize={fs * 0.62} fill={CLAY} textAnchor="middle"
      transform={horiz ? undefined : `rotate(-90 ${tx} ${ty})`}>assumed</text>);
  }
  return <g>{out}</g>;
}

/* -------------------------------------------------------------------- pieces */

function band(p: Piece, depth: number): { x: number; y: number; w: number; d: number } {
  switch (p.back) {
    case "top": return { x: p.x, y: p.y, w: p.w, d: depth };
    case "bottom": return { x: p.x, y: p.y + p.d - depth, w: p.w, d: depth };
    case "left": return { x: p.x, y: p.y, w: depth, d: p.d };
    case "right": return { x: p.x + p.w - depth, y: p.y, w: depth, d: p.d };
    default: return { x: p.x, y: p.y, w: p.w, d: depth };
  }
}
/** The two short ends of a piece whose back is on `back` — where a sofa's arms go. */
function ends(p: Piece, t: number) {
  const along = p.back === "top" || p.back === "bottom";
  return along
    ? [{ x: p.x, y: p.y, w: t, d: p.d }, { x: p.x + p.w - t, y: p.y, w: t, d: p.d }]
    : [{ x: p.x, y: p.y, w: p.w, d: t }, { x: p.x, y: p.y + p.d - t, w: p.w, d: t }];
}
const R = (r: { x: number; y: number; w: number; d: number }, props: React.SVGProps<SVGRectElement>) =>
  <rect x={r.x} y={r.y} width={Math.max(0, r.w)} height={Math.max(0, r.d)} {...props} />;

function Glyph({ p, sw, soft, strong }: { p: Piece; sw: number; soft: string; strong: string }) {
  const s = { stroke: INK, strokeWidth: sw };
  const rr = Math.min(p.w, p.d) * 0.06;
  const title = <title>{p.label ?? p.kind}</title>;
  const cx = p.x + p.w / 2, cy = p.y + p.d / 2;
  const hatch = (fill: string) => (
    <g>
      {R(p, { fill, ...s, rx: rr / 2 })}
      <path d={`M ${p.x} ${p.y} L ${p.x + p.w} ${p.y + p.d} M ${p.x + p.w} ${p.y} L ${p.x} ${p.y + p.d}`} stroke={OAK_D} strokeWidth={sw * 0.7} />
    </g>
  );

  switch (p.kind) {
    case "rug":
      return <g>{title}{R(p, { fill: soft, opacity: 0.55, stroke: strong, strokeWidth: sw, strokeDasharray: `${sw * 6} ${sw * 4}`, rx: rr })}</g>;
    case "zone":
      return <g>{title}{R(p, { fill: "none", stroke: MID, strokeWidth: sw, strokeDasharray: `${sw * 7} ${sw * 5}`, rx: rr })}</g>;
    case "pendant":
      return <g>{title}<circle cx={cx} cy={cy} r={p.w / 2} fill="none" stroke={CLAY} strokeWidth={sw} strokeDasharray={`${sw * 4} ${sw * 3}`} />
        <path d={`M ${cx - p.w * 0.18} ${cy} L ${cx + p.w * 0.18} ${cy} M ${cx} ${cy - p.w * 0.18} L ${cx} ${cy + p.w * 0.18}`} stroke={CLAY} strokeWidth={sw} /></g>;
    case "bed": case "bunk": case "daybed": {
      const back = p.back ?? "top";
      const along = back === "top" || back === "bottom";
      const len = along ? p.d : p.w, wid = along ? p.w : p.d;
      const pillowD = Math.min(380, len * 0.2);
      const n = wid > 1200 ? 2 : 1;
      const pw = (wid - (n + 1) * 70) / n;
      const pillows = Array.from({ length: n }, (_, i) => {
        const off = 70 + i * (pw + 70);
        const r = back === "top" ? { x: p.x + off, y: p.y + 90, w: pw, d: pillowD }
          : back === "bottom" ? { x: p.x + off, y: p.y + p.d - 90 - pillowD, w: pw, d: pillowD }
          : back === "left" ? { x: p.x + 90, y: p.y + off, w: pillowD, d: pw }
          : { x: p.x + p.w - 90 - pillowD, y: p.y + off, w: pillowD, d: pw };
        return <React.Fragment key={i}>{R(r, { fill: WHITE, stroke: INK, strokeWidth: sw * 0.7, rx: 60 })}</React.Fragment>;
      });
      const duvetStart = pillowD + 180;
      const duvet = back === "top" ? { x: p.x, y: p.y + duvetStart, w: p.w, d: p.d - duvetStart }
        : back === "bottom" ? { x: p.x, y: p.y, w: p.w, d: p.d - duvetStart }
        : back === "left" ? { x: p.x + duvetStart, y: p.y, w: p.w - duvetStart, d: p.d }
        : { x: p.x, y: p.y, w: p.w - duvetStart, d: p.d };
      return <g>{title}{R(p, { fill: WHITE, ...s, rx: 50 })}{R(duvet, { fill: soft, stroke: INK, strokeWidth: sw * 0.7 })}
        {p.kind === "daybed" && R(band(p, 220), { fill: strong, stroke: INK, strokeWidth: sw * 0.7 })}
        {pillows}{R(band(p, 70), { fill: OAK_D })}</g>;
    }
    case "sofa": case "armchair": case "recliner": case "lounger": {
      const depth = p.back === "top" || p.back === "bottom" ? p.d : p.w;
      const armT = p.kind === "lounger" ? 0 : Math.min(180, depth * 0.2);
      return <g>{title}{R(p, { fill: soft, ...s, rx: rr * 2 })}
        {R(band(p, Math.min(220, depth * 0.24)), { fill: strong, stroke: INK, strokeWidth: sw * 0.7, rx: rr })}
        {armT > 0 && ends(p, armT).map((e, i) => <React.Fragment key={i}>{R(e, { fill: strong, stroke: INK, strokeWidth: sw * 0.7, rx: rr })}</React.Fragment>)}</g>;
    }
    case "ottoman":
      return <g>{title}{R(p, { fill: soft, ...s, rx: rr * 3 })}</g>;
    case "chair": case "stool":
      return <g>{title}{p.kind === "stool" ? <circle cx={cx} cy={cy} r={p.w / 2} fill={OAK} {...s} /> : R(p, { fill: OAK, ...s, rx: p.w * 0.2 })}</g>;
    case "task-chair":
      return <g>{title}<circle cx={cx} cy={cy} r={p.w / 2} fill={strong} {...s} /><circle cx={cx} cy={cy} r={p.w * 0.3} fill={soft} stroke={INK} strokeWidth={sw * 0.7} /></g>;
    case "dining": {
      const longX = p.long ? p.long === "x" : p.w >= p.d;
      const seatsPerSide = (p.seats ?? 6) / 2;
      const table = longX ? { x: p.x, y: p.y + 550, w: p.w, d: p.d - 1100 } : { x: p.x + 550, y: p.y, w: p.w - 1100, d: p.d };
      const chairs: React.ReactNode[] = [];
      for (let i = 0; i < seatsPerSide; i++) {
        const at = (longX ? p.w : p.d) / seatsPerSide * (i + 0.5);
        const c = 440;
        if (longX) {
          chairs.push(<React.Fragment key={`a${i}`}>{R({ x: p.x + at - c / 2, y: p.y + 60, w: c, d: c }, { fill: OAK, ...s, rx: c * 0.18 })}</React.Fragment>);
          chairs.push(<React.Fragment key={`b${i}`}>{R({ x: p.x + at - c / 2, y: p.y + p.d - 60 - c, w: c, d: c }, { fill: OAK, ...s, rx: c * 0.18 })}</React.Fragment>);
        } else {
          chairs.push(<React.Fragment key={`a${i}`}>{R({ x: p.x + 60, y: p.y + at - c / 2, w: c, d: c }, { fill: OAK, ...s, rx: c * 0.18 })}</React.Fragment>);
          chairs.push(<React.Fragment key={`b${i}`}>{R({ x: p.x + p.w - 60 - c, y: p.y + at - c / 2, w: c, d: c }, { fill: OAK, ...s, rx: c * 0.18 })}</React.Fragment>);
        }
      }
      return <g>{title}{chairs}{R(table, { fill: OAK, ...s, rx: 40 })}</g>;
    }
    case "wardrobe": case "tall": case "shelf":
      return <g>{title}{hatch(OAK)}</g>;
    case "partition":
      return <g>{title}{R(p, { fill: GLASS, stroke: "#6d93a8", strokeWidth: sw * 1.3 })}</g>;
    case "tv": case "screen":
      return <g>{title}{R(p, { fill: INK, stroke: "none", rx: sw })}</g>;
    case "island": case "counter": case "bar": case "vanity":
      return <g>{title}{R(p, { fill: STONE, ...s, rx: 25 })}{p.kind === "vanity" &&
        <ellipse cx={cx} cy={cy} rx={Math.min(p.w, p.d) * 0.3} ry={Math.min(p.w, p.d) * 0.22} fill={WHITE} stroke={INK} strokeWidth={sw * 0.7} />}</g>;
    case "hob": {
      const r = Math.min(p.w, p.d) * 0.16;
      return <g>{title}{R(p, { fill: "#3f3a35", stroke: INK, strokeWidth: sw, rx: 20 })}
        {[[0.28, 0.3], [0.72, 0.3], [0.28, 0.7], [0.72, 0.7]].map(([a, b], i) =>
          <circle key={i} cx={p.x + p.w * a} cy={p.y + p.d * b} r={r} fill="none" stroke={WHITE} strokeWidth={sw} />)}</g>;
    }
    case "sink":
      return <g>{title}{R(p, { fill: STONE, ...s, rx: 30 })}{R({ x: p.x + p.w * 0.12, y: p.y + p.d * 0.15, w: p.w * 0.76, d: p.d * 0.7 }, { fill: WHITE, stroke: INK, strokeWidth: sw * 0.7, rx: 60 })}</g>;
    case "fridge": case "washer":
      return <g>{title}{R(p, { fill: "#eceeef", ...s, rx: 25 })}
        <text x={cx} y={cy + Math.min(p.w, p.d) * 0.12} fontSize={Math.min(p.w, p.d) * 0.36} textAnchor="middle" fill={MID}>{p.kind === "fridge" ? "F" : "W"}</text></g>;
    case "wc": {
      const cist = band(p, Math.min(p.w, p.d) * 0.36);
      return <g>{title}{R(cist, { fill: WHITE, ...s, rx: 30 })}
        <ellipse cx={cx} cy={cy} rx={p.w * (p.w < p.d ? 0.4 : 0.3)} ry={p.d * (p.w < p.d ? 0.3 : 0.4)} fill={WHITE} {...s} /></g>;
    }
    case "shower":
      return <g>{title}{R(p, { fill: "#e4eef3", ...s })}
        <path d={`M ${p.x} ${p.y} L ${p.x + p.w} ${p.y + p.d}`} stroke={MID} strokeWidth={sw * 0.6} />
        <circle cx={cx} cy={cy} r={Math.min(p.w, p.d) * 0.05} fill="none" stroke={INK} strokeWidth={sw} /></g>;
    case "tub":
      return <g>{title}{R(p, { fill: WHITE, ...s, rx: 120 })}{R({ x: p.x + 90, y: p.y + 90, w: p.w - 180, d: p.d - 180 }, { fill: "#e4eef3", stroke: INK, strokeWidth: sw * 0.7, rx: 200 })}</g>;
    case "plant": case "tree":
      return <g>{title}<circle cx={cx} cy={cy} r={p.w / 2} fill="#cfdcc2" stroke="#7f9a73" strokeWidth={sw} opacity={p.kind === "tree" ? 0.75 : 1} />
        <circle cx={cx} cy={cy} r={p.w * 0.18} fill="#aec09f" /></g>;
    case "planter":
      return <g>{title}{R(p, { fill: "#d7e2cb", stroke: "#7f9a73", strokeWidth: sw, rx: 30 })}</g>;
    case "pergola": {
      const slats: React.ReactNode[] = [];
      const vertical = p.w >= p.d;
      const n = Math.max(4, Math.round((vertical ? p.w : p.d) / 450));
      for (let i = 1; i < n; i++) {
        const t = i / n;
        slats.push(vertical
          ? <line key={i} x1={p.x + p.w * t} y1={p.y} x2={p.x + p.w * t} y2={p.y + p.d} stroke={OAK_D} strokeWidth={sw} />
          : <line key={i} x1={p.x} y1={p.y + p.d * t} x2={p.x + p.w} y2={p.y + p.d * t} stroke={OAK_D} strokeWidth={sw} />);
      }
      return <g>{title}{R(p, { fill: "none", stroke: OAK_D, strokeWidth: sw * 1.2, strokeDasharray: `${sw * 6} ${sw * 4}` })}{slats}</g>;
    }
    case "altar":
      return <g>{title}{R(p, { fill: OAK, ...s, rx: 20 })}{R({ x: p.x + p.w * 0.3, y: p.y + p.d * 0.25, w: p.w * 0.4, d: p.d * 0.5 }, { fill: "#e8c9a0", stroke: INK, strokeWidth: sw * 0.6 })}</g>;
    default: {
      const fill = ["coffee", "side"].includes(p.kind) ? "#efe2c9" : ["desk", "table", "console", "sideboard", "dresser", "media", "bench", "bedside"].includes(p.kind) ? OAK : STONE;
      return <g>{title}{R(p, { fill, ...s, rx: Math.min(p.w, p.d) * 0.08 })}</g>;
    }
  }
}

function PieceLabel({ p, fs }: { p: Piece; fs: number }) {
  if (p.kind === "counter" && /^Counter\b/.test(p.label ?? "Counter")) return null;
  if (["rug", "pergola", "fridge", "washer", "pendant", "tv", "screen", "partition", "chair", "stool", "task-chair", "bedside", "hob", "sink", "wc", "plant", "side"].includes(p.kind)) return null;
  const text = short(p);
  const long = Math.max(p.w, p.d), thin = Math.min(p.w, p.d);
  const size = Math.min(fs * 0.86, thin * 0.4);
  if (size < fs * 0.4 || text.length * size * 0.55 > long * 0.95) return null;
  const vertical = p.d > p.w * 1.3;
  // A zone's label sits in its top corner, so it never lands on the furniture inside it.
  if (p.kind === "zone") {
    return <text x={p.x + fs * 0.4} y={p.y + fs * 1.0} fontSize={Math.min(fs * 0.7, size)} fill={MID} style={{ pointerEvents: "none" }}>{text}</text>;
  }
  const cx = p.x + p.w / 2, cy = p.y + p.d / 2;
  const onBed = p.kind === "bed" || p.kind === "bunk" || p.kind === "daybed";
  const ty = onBed && !vertical ? cy + (p.back === "top" ? p.d * 0.18 : p.back === "bottom" ? -p.d * 0.18 : 0) : cy;
  return (
    <text x={cx} y={ty + size * 0.35} fontSize={size} textAnchor="middle" fill={INK}
      transform={vertical ? `rotate(-90 ${cx} ${ty})` : undefined} style={{ pointerEvents: "none" }}>{text}</text>
  );
}

function DimLine({ d, sw, fs }: { d: NonNullable<Layout["dims"]>[number]; sw: number; fs: number }) {
  const [x1, y1] = d.from, [x2, y2] = d.to;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const tick = fs * 0.35;
  const tk = (x: number, y: number) => {
    const nx = -Math.sin(ang) * tick, ny = Math.cos(ang) * tick;
    return <line x1={x - nx} y1={y - ny} x2={x + nx} y2={y + ny} stroke={CLAY} strokeWidth={sw * 1.2} />;
  };
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const deg = (ang * 180) / Math.PI;
  const upright = deg > 90 || deg < -90 ? deg + 180 : deg;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CLAY} strokeWidth={sw * 1.1} />
      {tk(x1, y1)}{tk(x2, y2)}
      <text x={mx} y={my - fs * 0.3} fontSize={fs * 0.66} textAnchor="middle" fill={CLAY} fontWeight={600}
        transform={`rotate(${upright} ${mx} ${my})`} stroke="#fffdfa" strokeWidth={fs * 0.12} paintOrder="stroke">{d.label}</text>
    </g>
  );
}

export function pieceList(layout: Layout): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of layout.pieces) {
    if (!p.label || p.kind === "zone" || p.kind === "pendant") continue;
    if (seen.has(p.label)) continue;
    seen.add(p.label);
    const n = layout.pieces.filter((q) => q.label === p.label).length;
    out.push(n > 1 ? `${p.label} × ${n}` : p.label);
  }
  return out;
}

export type { Edge };
