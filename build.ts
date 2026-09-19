/**
 * Renders the forensic memoranda to plain static HTML in dist/.
 *
 *   dist/index.html        the index — both memos, the revalidation delta, side by side
 *   dist/owl/index.html    one page per memo, eighteen sections, driven by the data model
 *   dist/pax/index.html
 *   dist/methodology.md    the versioned prompt the memos follow
 *   dist/robots.txt        keep crawlers out; the pages sit behind a key anyway
 *
 * No runtime, no framework: every chart is an inline SVG drawn here, every table is a
 * table, and the CSS is one block at the top of each page. `npm run build`.
 */
import { mkdir, writeFile, copyFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FORENSIC_MEMOS,
  weightedValue,
  weightedUpsidePct,
  weightedIrrPct,
  sotpTotal,
  sotpPerShare,
  aumQualityScore,
  TIER_META,
  type ForensicMemo,
  type Tier,
  type Revalidation,
} from './memos/index.ts'

const HERE = import.meta.dirname
export const OUT = join(HERE, 'dist')

/* ------------------------------------------------------------------ text helpers */

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const money = (v: number, d = 2) => `$${v.toFixed(d)}`
const num = (v: number | null | undefined, d = 1, suffix = '') => (v === null || v === undefined ? '—' : `${v.toFixed(d)}${suffix}`)
const signed = (v: number, d = 0, suffix = '%') => `${v > 0 ? '+' : ''}${v.toFixed(d)}${suffix}`
const pad2 = (n: number) => String(n).padStart(2, '0')

type Tone = 'good' | 'warn' | 'serious' | 'crit' | 'blue' | 'neutral'

const RATING_TONE: Record<string, Tone> = {
  'Materially undervalued': 'good',
  'Moderately undervalued': 'good',
  'Fairly valued': 'neutral',
  'Moderately overvalued': 'crit',
  'Materially overvalued': 'crit',
}

const IMPACT_TONE: Record<string, Tone> = { Supports: 'good', Weakens: 'warn', Breaks: 'crit', Neutral: 'neutral' }

const PREDICTION_TONE: Record<string, Tone> = {
  'Too early': 'neutral',
  'On track': 'good',
  'At threshold': 'warn',
  'Off track': 'crit',
  'Resolved — correct': 'good',
  'Resolved — wrong': 'crit',
}

const STATUS_TONE: Record<string, Tone> = {
  Exceeded: 'good',
  'On track': 'blue',
  Met: 'blue',
  'Behind plan': 'crit',
  'Achieved by acquisition': 'warn',
  'No longer measurable': 'neutral',
  Improved: 'good',
  'In line': 'neutral',
  Deteriorated: 'crit',
  Deferred: 'warn',
  'Pulled forward': 'warn',
  Premium: 'good',
  Market: 'neutral',
  Discount: 'crit',
  High: 'crit',
  Medium: 'warn',
  Low: 'neutral',
  Conservative: 'good',
  Reasonable: 'neutral',
  Aggressive: 'crit',
}

/** Confidence-tier chip. The tooltip carries the tier's meaning. */
function tier(t: Tier): string {
  const m = TIER_META[t]
  return `<span class="tier tier-${t}" title="${esc(m.label)} — ${esc(m.desc)}">${t}</span>`
}

/** Status badge: a coloured dot beside a label, never colour alone. */
function badge(text: string, tone: Tone = 'neutral'): string {
  return `<span class="badge tone-${tone}">${esc(text)}</span>`
}

function section(id: string, n: number, title: string, sub: string, body: string): string {
  return `<section id="${id}" class="card">
<header class="sh"><h2><span class="sn">${pad2(n)}</span>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</header>
${body}
</section>`
}

const noteLine = (s?: string) => (s ? `<div class="note">${esc(s)}</div>` : '')

/* ------------------------------------------------------------------ charts */

const SERIES = { platform: 'var(--s1)', perShare: 'var(--s2)' }

interface Series {
  name: string
  values: number[]
  color: string
  dashed?: boolean
}

/**
 * Two-series line chart as inline SVG. One y-axis (both series share a scale, which is
 * why the indexed chart exists). Every point carries a native tooltip; the series are
 * direct-labelled at their right-hand end and repeated in an HTML legend below.
 */
function lineChart(o: { labels: string[]; series: Series[]; fmt: (v: number) => string; title: string; height?: number }): string {
  const W = 640
  const H = o.height ?? 220
  const P = { l: 48, r: 14, t: 14, b: 30 }
  const all = o.series.flatMap((s) => s.values)
  let lo = Math.min(...all)
  let hi = Math.max(...all)
  const span = hi - lo || Math.abs(hi) || 1
  lo -= span * 0.08
  hi += span * 0.12
  if (Math.min(...all) >= 0 && lo < 0) lo = 0
  const n = o.labels.length
  const x = (i: number) => P.l + (n === 1 ? 0 : (i / (n - 1)) * (W - P.l - P.r))
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b)

  const ticks = 4
  const grid = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks)
  const gridSvg = grid
    .map((v) => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="grid"/>
<text x="${P.l - 6}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end" class="ax">${esc(o.fmt(v))}</text>`)
    .join('\n')

  const step = n <= 9 ? 1 : Math.ceil(n / 6)
  const xLabels = o.labels
    .map((l, i) => (i % step === 0 || i === n - 1 ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" class="ax">${esc(l)}</text>` : ''))
    .join('\n')

  // Direct labels: the series ending higher goes above its last point, the other below.
  const order = [...o.series].sort((a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1])
  const dy = new Map(order.map((s, i) => [s.name, i === 0 ? -8 : 14]))

  const lines = o.series
    .map((s) => {
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
      const pts = s.values
        .map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"><title>${esc(o.labels[i])} · ${esc(s.name)}: ${esc(o.fmt(v))}</title></circle>`)
        .join('\n')
      const last = s.values.length - 1
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dashed ? ' stroke-dasharray="6 4"' : ''}/>
${pts}
<text x="${(x(last) - 6).toFixed(1)}" y="${(y(s.values[last]) + (dy.get(s.name) ?? -8)).toFixed(1)}" text-anchor="end" class="dl">${esc(s.name)} ${esc(o.fmt(s.values[last]))}</text>`
    })
    .join('\n')

  const legend = `<div class="legend">${o.series
    .map((s) => `<span><i style="border-color:${s.color}${s.dashed ? ';border-top-style:dashed' : ''}"></i>${esc(s.name)}</span>`)
    .join('')}</div>`

  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title)}" preserveAspectRatio="xMidYMid meet">
${gridSvg}
${xLabels}
${lines}
</svg>${legend}</figure>`
}

/** Fee mix: one stacked bar, first categorical slots in fixed order, plus a labelled legend. */
function stackedBar(items: { label: string; value: number; tier: Tier }[]): string {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  const segs = items
    .map((it, i) => `<span class="seg" style="width:${((it.value / total) * 100).toFixed(2)}%;background:var(--s${(i % 5) + 1})" title="${esc(it.label)}: ${it.value}%"></span>`)
    .join('')
  const legend = items
    .map((it, i) => `<span><i style="border-color:var(--s${(i % 5) + 1})"></i>${esc(it.label)} <b class="tnum">${it.value}%</b></span>`)
    .join('')
  return `<div class="stack">${segs}</div><div class="legend">${legend}</div>`
}

/** Score bars for the AUM quality scorecard. Threshold colours match the original UI. */
function scoreBar(score: number): string {
  const tone = score >= 7 ? 'good' : score >= 5 ? 'warn' : 'crit'
  return `<div class="bar"><span class="fill tone-${tone}" style="width:${score * 10}%"></span></div>`
}

/** Range bar used for the value range and each valuation method. */
function rangeBar(lo: number, hi: number, marks: { v: number; cls: string; title: string }[], band?: { lo: number; hi: number }): string {
  const pos = (v: number) => (((v - lo) / (hi - lo || 1)) * 100).toFixed(1)
  const bandHtml = band ? `<span class="band" style="left:${pos(band.lo)}%;width:${Math.max(2, Number(pos(band.hi)) - Number(pos(band.lo))).toFixed(1)}%"></span>` : ''
  return `<div class="range">${bandHtml}${marks.map((m) => `<span class="${m.cls}" style="left:${pos(m.v)}%" title="${esc(m.title)}"></span>`).join('')}</div>`
}

/* ------------------------------------------------------------------ page shell */

const SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'debate', label: 'The debate' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'trajectory', label: 'Trajectory' },
  { id: 'pershare', label: 'Per-share bridge' },
  { id: 'scorecard', label: 'Since listing' },
  { id: 'segments', label: 'Business lines' },
  { id: 'capital', label: 'Capital quality' },
  { id: 'quality', label: 'Earnings quality' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'peers', label: 'Peers' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'redteam', label: 'Red team' },
  { id: 'risks', label: 'Risks' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'conclusion', label: 'Conclusion' },
  { id: 'sources', label: 'Sources' },
]

const CSS = `
:root{color-scheme:light;--bg:#f6f6f4;--surface:#fff;--surface2:#f3f3f0;--line:#e3e2dd;--ink:#0b0b0b;--ink2:#3d3c39;--ink3:#6e6d68;
--s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--s4:#eda100;--s5:#e87ba4;
--good:#0ca30c;--warn:#fab219;--serious:#ec835a;--crit:#d03b3b;--blue:#2a78d6;
--good-soft:#e7f5e7;--warn-soft:#fdf2d9;--crit-soft:#fae6e6;--blue-soft:#e6eff9;--neutral-soft:#ecebe7}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark;--bg:#121211;--surface:#1a1a19;--surface2:#222221;--line:#34342f;--ink:#fff;--ink2:#d6d5cc;--ink3:#a09f95;
--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;--s5:#d55181;--blue:#3987e5;--crit:#e66767;
--good-soft:#16301a;--warn-soft:#3a2d0e;--crit-soft:#3d1b1b;--blue-soft:#182a42;--neutral-soft:#2a2a28}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink2);font:14px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}
b,strong{color:var(--ink);font-weight:600}
.wrap{max-width:1080px;margin:0 auto;padding:20px 16px 56px}
.top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;padding:0 0 14px;border-bottom:1px solid var(--line);margin-bottom:18px;font-size:13px}
.top .brand{font-weight:600;color:var(--ink);letter-spacing:-0.01em}
.top nav{display:flex;flex-wrap:wrap;gap:14px}.top nav a{color:var(--ink2)}.top nav a.cur{color:var(--ink);font-weight:600}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px;margin:0 0 18px;min-width:0}
.card.blue{border-color:color-mix(in srgb,var(--blue) 35%,var(--line));background:color-mix(in srgb,var(--blue-soft) 45%,var(--surface))}
.card.warnc{border-color:color-mix(in srgb,var(--warn) 45%,var(--line));background:color-mix(in srgb,var(--warn-soft) 55%,var(--surface))}
h1{font-size:22px;line-height:1.25;letter-spacing:-0.015em;color:var(--ink);margin:0}
h2{font-size:16px;letter-spacing:-0.01em;color:var(--ink);margin:0}
h3{font-size:13px;color:var(--ink);margin:0 0 8px}
h4{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink3);margin:0 0 6px;font-weight:600}
p{margin:0 0 10px}p:last-child{margin-bottom:0}
.sh{margin-bottom:14px}.sh .sub{color:var(--ink3);font-size:12.5px;margin:4px 0 0}
.sn{font-size:11px;color:var(--ink3);margin-right:8px;font-variant-numeric:tabular-nums}
.tnum{font-variant-numeric:tabular-nums}
.muted{color:var(--ink3)}.small{font-size:12px}.tiny{font-size:11.5px;color:var(--ink3);line-height:1.45}
.note{font-size:11.5px;color:var(--ink3);line-height:1.4;margin-top:3px}
.lead{font-size:14.5px;color:var(--ink)}
.grid2{display:grid;gap:16px}.grid3{display:grid;gap:14px}.grid4{display:grid;gap:10px;grid-template-columns:1fr 1fr}.grid2>*,.grid3>*,.grid4>*{min-width:0}
@media(min-width:720px){.grid2{grid-template-columns:1fr 1fr}.grid3{grid-template-columns:1fr 1fr 1fr}.grid4{grid-template-columns:repeat(4,1fr)}.grid2.wide{grid-template-columns:1.4fr 1fr}.grid2.seg{grid-template-columns:260px 1fr}}
.box{background:var(--surface2);border:1px solid var(--line);border-radius:9px;padding:12px 14px;min-width:0}
.box.good{border-color:color-mix(in srgb,var(--good) 30%,var(--line));background:color-mix(in srgb,var(--good-soft) 60%,var(--surface))}
.box.crit{border-color:color-mix(in srgb,var(--crit) 30%,var(--line));background:color-mix(in srgb,var(--crit-soft) 60%,var(--surface))}
.box.blue{border-color:color-mix(in srgb,var(--blue) 30%,var(--line));background:color-mix(in srgb,var(--blue-soft) 60%,var(--surface))}
.box.warn{border-color:color-mix(in srgb,var(--warn) 40%,var(--line));background:color-mix(in srgb,var(--warn-soft) 60%,var(--surface))}
.stat .k{font-size:11px;color:var(--ink3);display:flex;justify-content:space-between;gap:6px;align-items:flex-start}
.stat .v{font-size:19px;font-weight:600;color:var(--ink);margin-top:5px;line-height:1.1}
.stat .s{font-size:11px;color:var(--ink3);margin-top:4px;line-height:1.35}
.v.good{color:var(--good)}.v.crit{color:var(--crit)}.v.warn{color:#b07800}@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .v.warn{color:var(--warn)}}
.price{text-align:right}.price .big{font-size:26px;font-weight:600;color:var(--ink);line-height:1}
.tier{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:4px;font-size:9.5px;font-weight:700;line-height:1;vertical-align:1px;margin-left:4px;border:1px solid transparent;cursor:help;flex:none}
.tier-A{background:var(--good-soft);color:var(--good)}.tier-B{background:var(--blue-soft);color:var(--blue)}.tier-C{background:var(--warn-soft);color:#9a6700}.tier-D{background:var(--surface2);color:var(--ink3);border-color:var(--line)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .tier-C{color:var(--warn)}}
.badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:11.5px;font-weight:500;color:var(--ink);background:var(--neutral-soft);white-space:nowrap;vertical-align:middle}
.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ink3);flex:none}
.badge.tone-good{background:var(--good-soft)}.badge.tone-good::before{background:var(--good)}
.badge.tone-warn{background:var(--warn-soft)}.badge.tone-warn::before{background:var(--warn)}
.badge.tone-serious{background:var(--warn-soft)}.badge.tone-serious::before{background:var(--serious)}
.badge.tone-crit{background:var(--crit-soft)}.badge.tone-crit::before{background:var(--crit)}
.badge.tone-blue{background:var(--blue-soft)}.badge.tone-blue::before{background:var(--blue)}
.tw{overflow-x:auto;margin:0 -20px;padding:0 20px}.tw.in{margin:0;padding:0}
table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px}.tw.in table{min-width:380px}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink3);font-weight:600;padding:0 0 8px 12px;border-bottom:1px solid var(--line);vertical-align:bottom}
td{padding:9px 0 9px 12px;border-bottom:1px solid color-mix(in srgb,var(--line) 60%,transparent);vertical-align:top}
th:first-child,td:first-child{padding-left:0}
.r{text-align:right}.nw{white-space:nowrap}.k{color:var(--ink);font-weight:500}
tr.self td{background:color-mix(in srgb,var(--blue-soft) 45%,transparent)}tr.self td:first-child{color:var(--blue)}
tr.tot td{font-weight:600;color:var(--ink)}
.secnav{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;margin:0 0 18px;background:var(--bg);border-bottom:1px solid var(--line)}
.secnav a{font-size:11.5px;padding:3px 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink2)}.secnav a:hover{border-color:var(--blue);text-decoration:none;color:var(--ink)}
@media(max-width:719px){.secnav{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.secnav::-webkit-scrollbar{display:none}.secnav a{flex:none}}
section{scroll-margin-top:64px}
ol.num,ul.plain{margin:0;padding:0;list-style:none}ol.num li,ul.plain li{display:flex;gap:10px;margin-bottom:8px;line-height:1.5}
ol.num li>i{flex:none;width:20px;height:20px;border-radius:50%;background:var(--blue-soft);color:var(--blue);font:600 11px/20px system-ui;text-align:center;font-style:normal}
ul.plain li>i{flex:none;font-style:normal;color:var(--ink3)}ul.plain li>i.x{color:var(--crit)}ul.plain li>i.ok{color:var(--good)}
.chart svg{width:100%;height:auto;display:block}.chart{margin:0}
.grid{stroke:var(--line);stroke-width:1}.ax{font-size:11px;fill:var(--ink3)}.dl{font-size:11px;fill:var(--ink);font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.legend{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:8px;font-size:11.5px;color:var(--ink2)}.legend i{display:inline-block;width:16px;border-top:2px solid;vertical-align:middle;margin-right:6px}
.stack{display:flex;height:14px;border-radius:6px;overflow:hidden;gap:2px;background:var(--surface)}.seg{display:block;height:100%}
.bar{height:6px;border-radius:999px;background:var(--line);overflow:hidden;margin-top:4px}.fill{display:block;height:100%;border-radius:999px}.fill.tone-good{background:var(--good)}.fill.tone-warn{background:var(--warn)}.fill.tone-crit{background:var(--crit)}
.hbar{height:8px;border-radius:4px;display:inline-block;vertical-align:middle}.hbar.pos{background:var(--good)}.hbar.neg{background:var(--crit)}.hbar.tot{background:var(--s1)}
.range{position:relative;height:6px;border-radius:999px;background:var(--line);margin:14px 6px 12px}
.range .band{position:absolute;top:0;height:100%;border-radius:999px;background:color-mix(in srgb,var(--blue) 35%,transparent)}
.range .dot{position:absolute;top:50%;width:11px;height:11px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid var(--surface)}
.range .dot.bear{background:var(--crit)}.range .dot.base{background:var(--blue)}.range .dot.bull{background:var(--good)}
.range .tick{position:absolute;top:50%;width:2px;height:20px;background:var(--ink);transform:translate(-50%,-50%);border-radius:1px}
.kv{display:flex;justify-content:space-between;gap:12px;font-size:12px;margin-top:6px}.kv+.kv{margin-top:6px}.kv .r{color:var(--ink);font-weight:500}
hr{border:0;border-top:1px solid var(--line);margin:10px 0}
.bridge{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 16px;align-items:flex-start;border:1px solid var(--line);border-radius:9px;padding:10px 14px;margin-bottom:8px;background:var(--surface2)}
.bridge.pos{border-color:color-mix(in srgb,var(--good) 30%,var(--line));background:color-mix(in srgb,var(--good-soft) 45%,var(--surface))}
.bridge.neg{border-color:color-mix(in srgb,var(--crit) 30%,var(--line));background:color-mix(in srgb,var(--crit-soft) 45%,var(--surface))}
.bridge .val{font-size:16px;font-weight:600;color:var(--ink);flex:none}.bridge.pos .val{color:var(--good)}.bridge.neg .val{color:var(--crit)}
.sens td.hi{background:color-mix(in srgb,var(--good-soft) 70%,transparent);color:var(--good);font-weight:600}.sens td.lo{background:color-mix(in srgb,var(--crit-soft) 70%,transparent);color:var(--crit);font-weight:600}
dl{margin:0}.qa{display:grid;gap:4px;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 60%,transparent)}.qa:last-child{border:0}@media(min-width:720px){.qa{grid-template-columns:minmax(0,300px) 1fr;gap:20px}}
.qa dt{color:var(--ink);font-weight:500;font-size:12.5px}.qa dd{margin:0;font-size:12.5px}
.scen{border-radius:9px;border:1px solid var(--line);padding:14px}.scen .tp{font-size:24px;font-weight:600;color:var(--ink);line-height:1;margin:8px 0 6px}
.scen.Bear{border-color:color-mix(in srgb,var(--crit) 30%,var(--line));background:color-mix(in srgb,var(--crit-soft) 40%,var(--surface))}
.scen.Base{border-color:color-mix(in srgb,var(--blue) 30%,var(--line));background:color-mix(in srgb,var(--blue-soft) 40%,var(--surface))}
.scen.Bull{border-color:color-mix(in srgb,var(--good) 30%,var(--line));background:color-mix(in srgb,var(--good-soft) 40%,var(--surface))}
.foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:12px;color:var(--ink3);margin-top:8px}
.memocard{display:flex;flex-direction:column;gap:12px}
`.trim()

function shell(o: { title: string; description: string; current: 'index' | string; body: string }): string {
  const links = [
    { href: '/', label: 'All memos', key: 'index' },
    ...FORENSIC_MEMOS.map((m) => ({ href: `/${m.symbol.toLowerCase()}/`, label: m.symbol, key: m.symbol })),
    { href: '/methodology.md', label: 'Methodology', key: 'method' },
    { href: '/logout', label: 'Log out', key: 'logout' },
  ]
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${esc(o.description)}">
<title>${esc(o.title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top"><span class="brand">HK Fire — forensic memoranda</span><nav>${links
    .map((l) => `<a href="${l.href}"${l.key === o.current ? ' class="cur"' : ''}>${esc(l.label)}</a>`)
    .join('')}</nav></header>
${o.body}
<footer class="foot"><span>Independent research, not investment advice.</span><span>Methodology: <a href="/methodology.md">FORENSIC-ASSET-MANAGER-PROMPT.md</a></span></footer>
</div>
</body>
</html>`
}

/* ------------------------------------------------------------------ revalidation log */

function revalidationPanel(r: Revalidation): string {
  const ratingChanged = r.ratingWas !== r.ratingNow
  const move = ((r.priceNow - r.priceWas) / r.priceWas) * 100
  const vsW = ((r.priceNow - r.weightedValue) / r.weightedValue) * 100
  const four = [
    { k: 'Price at cut', v: money(r.priceWas), s: r.originalAsOf, t: '' },
    { k: 'Price now', v: money(r.priceNow), s: signed(move, 1), t: move > 0 ? 'good' : 'crit' },
    { k: 'Probability-weighted value', v: money(r.weightedValue), s: 'unchanged by this pass', t: '' },
    { k: 'Price vs weighted value', v: signed(vsW, 0), s: vsW > 0 ? 'trading above fair value' : 'trading below fair value', t: vsW > 0 ? 'crit' : 'good' },
  ]
  return `<section class="card blue" id="revalidation">
<div class="sh"><h2>What changed since ${esc(r.originalAsOf)} &nbsp;${badge(`Revalidated ${r.asOf}`, 'blue')} ${ratingChanged ? badge('Rating changed', 'warn') : badge('Rating unchanged')}</h2></div>
<p class="lead">${esc(r.verdict)}</p>
<div class="grid4" style="margin-top:14px">${four
    .map((x) => `<div class="box stat"><div class="k">${esc(x.k)}</div><div class="v tnum ${x.t}">${esc(x.v)}</div><div class="s">${esc(x.s)}</div></div>`)
    .join('')}</div>
${ratingChanged ? `<p class="box warn" style="margin-top:14px"><span class="muted">Rating</span> &nbsp;${badge(r.ratingWas, RATING_TONE[r.ratingWas])} → ${badge(r.ratingNow, RATING_TONE[r.ratingNow])}</p>` : ''}
<h4 style="margin-top:18px">What moved</h4>
<div class="tw"><table><thead><tr><th>Item</th><th>At the cut</th><th>Now</th><th>Effect on thesis</th></tr></thead><tbody>
${r.changes
    .map((c) => `<tr><td class="k">${esc(c.item)}${tier(c.tier)}${noteLine(c.note)}</td><td class="tnum nw muted">${esc(c.was)}</td><td class="tnum nw k">${esc(c.now)}</td><td>${badge(c.impact, IMPACT_TONE[c.impact])}</td></tr>`)
    .join('\n')}
</tbody></table></div>
<div class="grid2" style="margin-top:18px">
<div><h4>What did not change</h4><ul class="plain">${r.unchanged.map((u) => `<li><i class="ok">✓</i><span>${esc(u)}</span></li>`).join('')}</ul></div>
<div><h4>Did our pre-committed triggers work?</h4><p class="small">${esc(r.triggerNote)}</p></div>
</div>
</section>`
}

/* ------------------------------------------------------------------ memo page */

export function renderMemoPage(memo: ForensicMemo): string {
  const wv = weightedValue(memo)
  const upside = weightedUpsidePct(memo)
  const irr = weightedIrrPct(memo)
  const sotpPs = sotpPerShare(memo)
  const quality = aumQualityScore(memo)
  const base = memo.scenarios.find((s) => s.name === 'Base')!
  const lo = Math.min(...memo.scenarios.map((s) => s.targetPrice), memo.price)
  const hi = Math.max(...memo.scenarios.map((s) => s.targetPrice), memo.price)
  const platformLabel = memo.symbol === 'OWL' ? 'Total AUM' : 'Fee-related earnings'
  const platformShort = memo.symbol === 'OWL' ? 'AUM' : 'FRE'

  const integrity = `<section class="card warnc"><p class="small"><b>Independent research, not investment advice.</b> Every figure carries a confidence tier: ${tier('A')} reported · ${tier('B')} our arithmetic on reported figures · ${tier('C')} secondary source · ${tier('D')} our estimate. No valuation conclusion here rests on a tier C or D figure alone.</p><p class="small">${esc(memo.sourceCaveat)}</p></section>`

  const masthead = `<section class="card">
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:flex-start">
<div style="min-width:0;flex:1 1 420px">
<h1>${esc(memo.name)} <span class="muted">(${esc(memo.exchange)}: ${esc(memo.symbol)})</span></h1>
<p style="margin:8px 0 0">${badge(memo.rating, RATING_TONE[memo.rating])} ${memo.revalidation ? badge(`Revalidated ${memo.revalidation.asOf}`, 'blue') : ''}</p>
<p class="lead" style="margin-top:10px">${esc(memo.headline)}</p>
<p class="tiny">Analysis cut ${esc(memo.asOf)} · latest reported period: ${esc(memo.latestPeriod)}${memo.revalidation ? ` · revalidated ${esc(memo.revalidation.asOf)} against data published since` : ''}</p>
</div>
<div class="price tnum"><div class="big">${money(memo.price)}</div><div class="tiny">${esc(memo.priceAsOf)}</div><div style="margin-top:10px;font-weight:500;color:var(--ink);font-size:13px">Base case ${money(base.targetPrice)}</div><div class="small" style="color:var(--${upside > 0 ? 'good' : 'crit'})">${signed(upside)} to weighted fair value</div></div>
</div>
<div class="grid4" style="margin-top:18px">${memo.headlineStats
    .map((s) => `<div class="box stat"><div class="k"><span>${esc(s.label)}</span>${tier(s.tier)}</div><div class="v tnum ${s.tone === 'gain' ? 'good' : s.tone === 'loss' ? 'crit' : s.tone === 'warn' ? 'warn' : ''}">${esc(s.value)}</div>${s.sub ? `<div class="s">${esc(s.sub)}</div>` : ''}</div>`)
    .join('')}</div>
</section>`

  const nav = `<nav class="secnav" aria-label="Memo sections">${SECTIONS.map((s) => `<a href="#${s.id}">${esc(s.label)}</a>`).join('')}</nav>`

  const s1 = section(
    'summary',
    1,
    'Investment conclusion',
    'The one page, if you read nothing else.',
    `<div class="grid2 wide">
<div><p class="lead">${esc(memo.headline)}</p><p>${esc(memo.debate.marketBelieves)}</p><p><b>What the market may be underestimating. </b>${esc(memo.debate.underestimated)}</p><p><b>What could make the discount permanent. </b>${esc(memo.debate.deRating)}</p></div>
<div>
<div class="box"><h4>Value range</h4>${rangeBar(lo, hi, [
      ...memo.scenarios.map((s) => ({ v: s.targetPrice, cls: `dot ${s.name.toLowerCase()}`, title: `${s.name}: ${money(s.targetPrice)}` })),
      { v: memo.price, cls: 'tick', title: `Current price ${money(memo.price)}` },
    ])}
${memo.scenarios.map((s) => `<div class="kv tnum"><span>${esc(s.name)} <span class="muted">(${(s.probability * 100).toFixed(0)}%)</span></span><span class="r">${money(s.targetPrice)}</span></div>`).join('')}
<hr><div class="kv tnum"><span>Probability-weighted</span><span class="r"><b>${money(wv)}</b></span></div><div class="kv tnum"><span>Current price</span><span class="r">${money(memo.price)}</span></div><div class="kv tnum"><span>Expected 5-yr annualised</span><span class="r" style="color:var(--${irr > 0 ? 'good' : 'crit'})"><b>${irr.toFixed(1)}%</b></span></div></div>
<div class="box small" style="margin-top:12px"><h4>Position</h4><p>${esc(memo.positionSizing)}</p><hr><p><b>Upgrade at</b> ${esc(memo.ratingChangesAt.upgrade)}</p><p><b>Downgrade at</b> ${esc(memo.ratingChangesAt.downgrade)}</p><hr><p><b>Horizon</b> ${esc(memo.horizon)}</p></div>
</div></div>`,
  )

  const s2 = section(
    'debate',
    2,
    'The investment question',
    'Stated once, then tested for the rest of the memo.',
    `<div class="grid2">
<div class="box blue">${badge('What must go right', 'blue')}<p style="margin-top:10px">${esc(memo.debate.mustGoRight)}</p></div>
<div class="box crit">${badge("The bear's single best fact", 'crit')}<p style="margin-top:10px">${esc(memo.debate.bearsBestFact)}</p></div>
</div>
<h4 style="margin-top:18px">The two or three variables that decide the return</h4>
<ol class="num">${memo.debate.swingFactors.map((f, i) => `<li><i>${i + 1}</i><span>${esc(f)}</span></li>`).join('')}</ol>`,
  )

  const s3 = section(
    'quarter',
    3,
    'What changed in the latest quarter',
    memo.latestPeriod,
    `<p style="margin-bottom:14px">${esc(memo.quarterNarrative)}</p>
<div class="tw"><table><thead><tr><th>Metric</th><th class="r">Latest</th><th class="r">YoY</th><th class="r">QoQ</th><th>Driver</th><th>Verdict</th></tr></thead><tbody>
${memo.quarter
      .map((r) => `<tr><td class="k">${esc(r.metric)}${tier(r.tier)}${noteLine(r.note)}</td><td class="tnum nw r k">${esc(r.latest)}</td><td class="tnum nw r">${esc(r.yoy)}</td><td class="tnum nw r">${esc(r.qoq)}</td><td class="nw">${esc(r.driver)}</td><td>${badge(r.verdict, STATUS_TONE[r.verdict])}</td></tr>`)
      .join('\n')}
</tbody></table></div>
<h3 style="margin-top:24px">Management narrative vs. economic reality</h3>
${memo.narrative
      .map(
        (n) => `<div class="box" style="margin-bottom:10px"><p class="k">${n.challenged ? '<span style="color:var(--warn)" title="Challenged">⚠</span> ' : ''}${esc(n.claim)}</p>
<div class="grid2" style="margin-top:8px"><div><h4 style="color:var(--good)">Supporting</h4><p class="small">${esc(n.support)}</p></div><div><h4 style="color:var(--crit)">Contradicting / qualifying</h4><p class="small">${esc(n.contradiction)}</p></div></div>
<p class="small" style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line);color:var(--ink)"><b>Verdict. </b>${esc(n.verdict)}</p></div>`,
      )
      .join('')}`,
  )

  const trajectoryChart = lineChart({
    labels: memo.trajectory.labels,
    series: [
      { name: 'FRE per share', values: memo.trajectory.frePs, color: SERIES.platform },
      { name: 'DE per share', values: memo.trajectory.dePs, color: SERIES.perShare, dashed: true },
    ],
    fmt: (v) => money(v),
    title: `${memo.symbol} per-share fee-related and distributable earnings across ${memo.trajectory.labels.length} periods`,
  })
  const indexedChart = lineChart({
    labels: memo.indexed.labels,
    series: [
      { name: `${platformShort} index`, values: memo.indexed.aum, color: SERIES.platform },
      { name: 'DE/share index', values: memo.indexed.dePs, color: SERIES.perShare, dashed: true },
    ],
    fmt: (v) => v.toFixed(0),
    title: `Platform growth index versus distributable earnings per share index for ${memo.symbol}`,
  })
  const s4 = section(
    'trajectory',
    4,
    'Twelve-month operating trajectory',
    'Per-share earnings by quarter, and the gap between platform growth and shareholder earnings.',
    `<div class="grid2">
<div><h3>Per-share FRE and DE by period</h3><p class="tiny" style="margin-bottom:10px">The distance between the two lines is everything that sits below fee-related earnings — interest, tax and corporate cost.</p>${trajectoryChart}</div>
<div><h3>${esc(platformLabel)} vs. DE per share</h3><p class="tiny" style="margin-bottom:10px">Indexed to ${esc(memo.indexed.labels[0])} = 100. The gap between the two lines is the growth that did not reach the listed share. We index ${esc(platformShort)} because that is the series reported for every period in this company's history.</p>${indexedChart}
<div class="box kv tnum" style="margin-top:10px"><span>Final period</span><span>Platform <b>${memo.indexed.aum.at(-1)}</b> · Per share <b>${memo.indexed.dePs.at(-1)}</b></span></div></div>
</div>
<h3 style="margin-top:24px">Historical model</h3>
<div class="tw"><table><thead><tr><th>Period</th><th class="r">AUM $bn</th><th class="r">Fee-paying $bn</th><th class="r">FRE/sh</th><th class="r">DE/sh</th><th class="r">FRE margin</th><th class="r">Dividend/sh</th></tr></thead><tbody>
${memo.history
      .map(
        (h) => `<tr><td class="k"><span class="nw">${esc(h.period)}${tier(h.tier)}</span>${noteLine(h.note)}</td><td class="tnum r">${num(h.aum, 1)}</td><td class="tnum r">${num(h.fpaum, 1)}</td><td class="tnum r">${h.frePs === null ? '—' : money(h.frePs)}</td><td class="tnum r k">${h.dePs === null ? '—' : `$${h.dePs.toFixed(3).replace(/0$/, '')}`}</td><td class="tnum r">${num(h.freMarginPct, 1, '%')}</td><td class="tnum r">${h.dividendPs === null ? '—' : money(h.dividendPs)}</td></tr>`,
      )
      .join('\n')}
</tbody></table></div>
<p class="tiny" style="margin-top:8px">Empty cells are figures we could not source. They are never interpolated.</p>`,
  )

  const s5 = section(
    'pershare',
    5,
    'Per-share bridge',
    `Where the growth went, ${memo.bridge.period}. This is the arithmetic aggregate headlines hide.`,
    `${memo.bridge.terms
      .map((t) => `<div class="bridge ${t.effect === 'positive' ? 'pos' : t.effect === 'negative' ? 'neg' : ''}"><div style="min-width:0;flex:1"><div class="k">${esc(t.label)}</div><div class="note">${esc(t.detail)}</div></div><div class="val tnum">${esc(t.value)}</div></div>`)
      .join('')}
<p class="box blue" style="margin-top:14px;color:var(--ink)">${esc(memo.bridge.conclusion)}</p>`,
  )

  const s6 = section(
    'scorecard',
    6,
    'Progress since listing',
    'Every commitment made at or since listing, graded.',
    `<div class="tw"><table><thead><tr><th>Commitment</th><th>Target</th><th>Actual</th><th>Status</th></tr></thead><tbody>
${memo.scorecard
      .map((s) => `<tr><td class="k">${esc(s.commitment)}${tier(s.tier)}</td><td class="nw">${esc(s.target)}</td><td style="color:var(--ink)">${esc(s.actual)}${noteLine(s.note)}</td><td>${badge(s.status, STATUS_TONE[s.status])}</td></tr>`)
      .join('\n')}
</tbody></table></div>`,
  )

  const s7 = section(
    'segments',
    7,
    'Business-line economics',
    'Which platforms deserve a premium multiple and which deserve a discount.',
    `<div class="grid2 seg">
<div><h4>Fee mix</h4>${stackedBar(memo.segments.map((s) => ({ label: s.name, value: s.share, tier: s.tier })))}<p class="tiny" style="margin-top:10px">Share of management fees by platform${memo.segments[0]?.tier === 'D' ? ' (estimated — the company reports a single segment)' : ''}.</p></div>
<div>${memo.segments
      .map(
        (s, i) => `<div class="box" style="margin-bottom:10px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;align-items:center"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--s${(i % 5) + 1});vertical-align:-1px;margin-right:6px"></i><b>${esc(s.name)}</b>${tier(s.tier)}</span>${badge(`${s.multipleView} multiple`, STATUS_TONE[s.multipleView])}</div>
<div class="grid4 tiny" style="margin-top:10px"><div>Mgmt fees<div class="tnum" style="color:var(--ink)">${esc(s.mgmtFee)}</div></div><div>Share of fees<div class="tnum" style="color:var(--ink)">${s.share}%</div></div><div>Fee rate<div class="tnum" style="color:var(--ink)">${esc(s.feeRate)}</div></div><div>Duration<div style="color:var(--ink)">${esc(s.duration)}</div></div></div>
<p class="small" style="margin-top:10px">${esc(s.comment)}</p><p class="tiny">Origin: ${esc(s.organic)}</p></div>`,
      )
      .join('')}</div></div>`,
  )

  const s8 = section(
    'capital',
    8,
    'Capital quality — both sides of the balance',
    'Not every dollar of AUM is worth the same. And the liability side is where 2026 was decided.',
    `<div class="grid2">
<div><div style="display:flex;justify-content:space-between;align-items:baseline"><h3>AUM quality scorecard</h3><span class="small tnum">mean <b>${quality.toFixed(1)}</b> / 10</span></div>
${memo.aumScorecard.map((r) => `<div style="margin-bottom:10px"><div class="kv"><span style="color:var(--ink)">${esc(r.dimension)}</span><span class="r tnum">${r.score}/10</span></div>${scoreBar(r.score)}<div class="note">${esc(r.basis)}</div></div>`).join('')}
<p class="box small" style="margin-top:14px">${esc(memo.aumScorecardNote)}</p></div>
<div><h3>Liability side — redemption mechanics</h3>
${
      memo.redemptions
        ? `<div class="tw in"><table><thead><tr><th>Vehicle</th><th class="r">Requested</th><th class="r">Cap</th><th class="r">Fulfilled</th></tr></thead><tbody>${memo.redemptions
            .map((r) => `<tr><td class="k">${esc(r.vehicle)}<div class="note">${esc(r.size)}</div></td><td class="tnum r" style="color:var(--crit)">${esc(r.requested)}</td><td class="tnum r">${esc(r.cap)}</td><td class="tnum r">${esc(r.fulfilled)}<div class="note">${esc(r.trend)}</div></td></tr>`)
            .join('')}</tbody></table></div>`
        : `<div class="box good">${badge('No gated vehicles', 'good')}</div>`
    }
<p class="box small" style="margin-top:12px">${esc(memo.redemptionNote)}</p></div>
</div>`,
  )

  const maxAbs = Math.max(...memo.earningsBridge.map((b) => Math.abs(b.value))) || 1
  const s9 = section(
    'quality',
    9,
    'Earnings quality and dividend coverage',
    'From fee-related earnings to what a shareholder can actually be paid.',
    `<div class="grid2">
<div><h3>FRE → DE bridge ($m, latest quarter)</h3>
<div class="tw in"><table style="min-width:0"><tbody>${memo.earningsBridge
      .map((b) => {
        const cls = b.isTotal ? 'tot' : b.value < 0 ? 'neg' : 'pos'
        return `<tr${b.isTotal ? ' class="tot"' : ''}><td class="nw" style="width:44%">${esc(b.label)}</td><td class="tnum r nw" style="width:18%">${b.value < 0 ? '−' : ''}${Math.abs(b.value).toLocaleString('en-US', { maximumFractionDigits: 1 })}</td><td><span class="hbar ${cls}" style="width:${((Math.abs(b.value) / maxAbs) * 100).toFixed(1)}%"></span></td></tr>`
      })
      .join('')}</tbody></table></div>
<p class="small" style="margin-top:10px">${esc(memo.earningsBridgeNote)}</p></div>
<div><h3>Dividend against distributable earnings per share</h3>
<div class="tw in"><table><thead><tr><th>Year</th><th class="r">DE/sh</th><th class="r">Dividend/sh</th><th class="r">Payout</th></tr></thead><tbody>${memo.dividendCoverage
      .map((d) => {
        const c = d.payoutPct === null ? 'var(--ink3)' : d.payoutPct > 100 ? 'var(--crit)' : d.payoutPct > 90 ? '#b07800' : 'var(--good)'
        return `<tr><td class="k"><span class="nw">${esc(d.year)}</span>${noteLine(d.note)}</td><td class="tnum r">${d.dePs === null ? '—' : money(d.dePs)}</td><td class="tnum r">${d.dividendPs === null ? '—' : money(d.dividendPs)}</td><td class="tnum r"><b style="color:${c}">${num(d.payoutPct, 0, '%')}</b></td></tr>`
      })
      .join('')}</tbody></table></div>
<p class="box small" style="margin-top:12px">${esc(memo.dividendNote)}</p></div>
</div>`,
  )

  const s10 = section(
    'ownership',
    10,
    'Ownership, incentives and dilution',
    'Whose company is it, and how much of it is issued away each year?',
    `<div class="grid2">${memo.ownership
      .map((f) => `<div class="box stat"><div class="k"><span>${esc(f.k)}${f.period ? ` <span class="muted">· ${esc(f.period)}</span>` : ''}</span>${tier(f.tier)}</div><div class="v tnum" style="font-size:15px">${esc(f.v)}</div>${f.note ? `<div class="s">${esc(f.note)}</div>` : ''}</div>`)
      .join('')}</div>
<p style="margin-top:14px">${esc(memo.ownershipNote)}</p>`,
  )

  const s11 = section(
    'peers',
    11,
    'Peer comparison',
    'Chosen for business-model relevance, not market capitalisation.',
    `<div class="tw"><table><thead><tr><th>Manager</th><th class="r">Mkt cap $bn</th><th class="r">FRE $m</th><th class="r">FRE growth</th><th class="r">FRE margin</th><th class="r">P/FRE</th><th class="r">Div yield</th><th>Permanent capital</th></tr></thead><tbody>
${memo.peers
      .map(
        (p) => `<tr${p.ticker === memo.symbol ? ' class="self"' : ''}><td class="k"><span class="nw">${esc(p.ticker)}${tier(p.tier)}</span><div class="note">${esc(p.name)}</div>${noteLine(p.note)}</td><td class="tnum r">${num(p.marketCap, 2)}</td><td class="tnum r">${p.fre === null ? '—' : p.fre.toLocaleString('en-US')}</td><td class="tnum r">${num(p.freGrowthPct, 0, '%')}</td><td class="tnum r">${num(p.freMarginPct, 1, '%')}</td><td class="tnum r k">${p.pFre === null ? '—' : `${p.pFre.toFixed(1)}×`}</td><td class="tnum r">${num(p.divYieldPct, 1, '%')}</td><td class="nw">${esc(p.permCapital)}</td></tr>`,
      )
      .join('\n')}
</tbody></table></div>
<p class="tiny" style="margin-top:10px">FRE is annualised run-rate from the latest reported quarter and is not season-adjusted; peer figures are tier C and used for relative context only.</p>
<p style="margin-top:10px">${esc(memo.peerNote)}</p>`,
  )

  const s12 = section(
    'valuation',
    12,
    'Valuation',
    'Four complementary methods, each with its own multiple logic.',
    `${memo.valuation
      .map((v) => {
        const cross = v.base === 0
        return `<div class="box" style="margin-bottom:10px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;align-items:baseline"><h3 style="margin:0">${esc(v.name)}</h3>${cross ? '' : `<span class="tnum small">${money(v.low)} · <b style="font-size:16px">${money(v.base)}</b> · ${money(v.high)}</span>`}</div>
<p class="small" style="margin-top:6px">${esc(v.approach)}</p>
${cross ? '' : rangeBar(lo, hi, [{ v: v.base, cls: 'dot base', title: `Base ${money(v.base)}` }, { v: memo.price, cls: 'tick', title: `Current price ${money(memo.price)}` }], { lo: v.low, hi: v.high })}
<p class="note">${esc(v.note)}</p></div>`
      })
      .join('')}
<h3 style="margin-top:24px">Sum of the parts</h3>
<div class="tw"><table><thead><tr><th>Component</th><th>Basis</th><th class="r">Multiple</th><th class="r">Value $m</th></tr></thead><tbody>
${memo.sotp
      .map((r) => `<tr><td class="k">${esc(r.component)}</td><td>${esc(r.basis)}</td><td class="tnum nw r">${esc(r.multiple)}</td><td class="tnum r k"${r.value < 0 ? ' style="color:var(--crit)"' : ''}>${r.value < 0 ? '−' : ''}${Math.abs(r.value).toLocaleString('en-US')}</td></tr>`)
      .join('\n')}
<tr class="tot"><td>Equity value</td><td style="font-weight:400">${memo.dilutedShares.toLocaleString('en-US')}m fully diluted economic shares</td><td></td><td class="tnum r">${sotpTotal(memo).toLocaleString('en-US')}</td></tr>
<tr class="tot"><td>Per share</td><td class="muted" style="font-weight:400">vs. ${money(memo.price)} market price</td><td></td><td class="tnum r" style="color:var(--blue);font-size:15px">${money(sotpPs)}</td></tr>
</tbody></table></div>
<h3 style="margin-top:24px">What the current price already assumes</h3>
<div class="tw"><table><thead><tr><th>Variable</th><th>Implied by ${money(memo.price)}</th><th>Our view</th><th>Assessment</th></tr></thead><tbody>
${memo.implied.map((r) => `<tr><td class="k">${esc(r.variable)}</td><td>${esc(r.impliedByPrice)}</td><td>${esc(r.ourView)}</td><td>${badge(r.assessment, STATUS_TONE[r.assessment])}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="tiny" style="margin-top:8px">“Aggressive” means the market's implied assumption is harsher than the evidence supports — i.e. it favours the buyer.</p>`,
  )

  const s13 = section(
    'scenarios',
    13,
    'Bear, base and bull',
    'Five years. The bear case is a genuine downturn, not a slower base case.',
    `<div class="grid3">${memo.scenarios
      .map(
        (s) => `<div class="scen ${s.name}"><div class="kv"><b>${esc(s.name)}</b><span class="tnum">${(s.probability * 100).toFixed(0)}%</span></div><div class="tp tnum">${money(s.targetPrice)}</div><div class="small tnum">3-yr <b style="color:var(--${s.threeYrIrrPct >= 0 ? 'good' : 'crit'})">${s.threeYrIrrPct}%</b> · 5-yr <b style="color:var(--${s.fiveYrIrrPct >= 0 ? 'good' : 'crit'})">${s.fiveYrIrrPct}%</b> p.a.</div>
<p class="small" style="margin-top:10px">${esc(s.narrative)}</p>
<dl style="border-top:1px solid var(--line);padding-top:8px;margin-top:10px">${s.assumptions.map((a) => `<div class="kv tiny"><dt>${esc(a.k)}</dt><dd class="tnum r" style="margin:0;color:var(--ink2)">${esc(a.v)}</dd></div>`).join('')}</dl></div>`,
      )
      .join('')}</div>
<h3 style="margin-top:24px">Sensitivity — value per share by ${esc(memo.sensitivity.rowLabel)} and ${esc(memo.sensitivity.colLabel)}</h3>
<div class="tw in"><table class="sens" style="min-width:520px"><thead><tr><th>${esc(memo.sensitivity.rowLabel)}</th>${memo.sensitivity.cols.map((c) => `<th class="r">${esc(c)}</th>`).join('')}</tr></thead><tbody>
${memo.sensitivity.rows
      .map((r, ri) => `<tr><td class="tnum k">${esc(r)}</td>${memo.sensitivity.values[ri].map((v) => `<td class="tnum r ${v > memo.price * 1.25 ? 'hi' : v < memo.price * 0.9 ? 'lo' : ''}">${money(v)}</td>`).join('')}</tr>`)
      .join('\n')}
</tbody></table></div>
<p class="tiny" style="margin-top:8px">Green: more than 25% above the current price of ${money(memo.price)}. Red: below it.</p>`,
  )

  const s14 = section(
    'redteam',
    14,
    'Red team',
    'The strongest case against our own conclusion, then adjudication.',
    `<div class="grid2"><div class="box crit">${badge('The case against', 'crit')}<p style="margin-top:10px">${esc(memo.redTeam.case)}</p></div><div class="box blue">${badge('Adjudication', 'blue')}<p style="margin-top:10px">${esc(memo.redTeam.adjudication)}</p></div></div>`,
  )

  const s15 = section(
    'risks',
    15,
    'Risks, predictions and kill criteria',
    'Falsifiable, dated, and pre-committed.',
    `<div class="tw"><table><thead><tr><th>Risk</th><th>Mechanism</th><th>Quantified</th><th>Severity</th></tr></thead><tbody>
${memo.risks.map((r) => `<tr><td class="k">${esc(r.risk)}</td><td>${esc(r.mechanism)}</td><td class="tnum">${esc(r.quantified)}</td><td>${badge(r.severity, STATUS_TONE[r.severity])}</td></tr>`).join('\n')}
</tbody></table></div>
<div class="grid2" style="margin-top:20px">
<div><h3>Falsifiable predictions</h3>${memo.predictions
      .map(
        (p) => `<div class="box" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><span class="k small">${esc(p.claim)}</span>${badge(p.by, 'blue')}</div><p class="small tnum" style="margin-top:6px;color:var(--blue)">${esc(p.threshold)}</p>${p.status ? `<div class="box" style="background:var(--surface);margin-top:8px">${badge(p.status, PREDICTION_TONE[p.status])}${p.statusNote ? `<p class="tiny" style="margin-top:6px;color:var(--ink2)">${esc(p.statusNote)}</p>` : ''}</div>` : ''}<p class="tiny" style="margin-top:6px"><b>If wrong: </b>${esc(p.ifWrong)}</p></div>`,
      )
      .join('')}</div>
<div><h3>Kill criteria</h3><p class="tiny" style="margin-bottom:8px">Pre-committed. Any one of these and the position is exited regardless of price.</p><ul class="plain">${memo.killCriteria.map((k) => `<li class="box crit small" style="margin-bottom:8px"><i class="x">✕</i><span>${esc(k)}</span></li>`).join('')}</ul></div>
</div>`,
  )

  const s16 = section(
    'dashboard',
    16,
    'Quarterly monitoring dashboard',
    'The three numbers to check every quarter — and nothing else.',
    `<div class="grid3">${memo.kpis
      .map((k, i) => `<div class="box"><div style="display:flex;gap:8px;align-items:center"><i style="flex:none;width:20px;height:20px;border-radius:50%;background:var(--blue-soft);color:var(--blue);font:600 11px/20px system-ui;text-align:center;font-style:normal">${i + 1}</i><b>${esc(k.kpi)}</b></div><p class="small" style="margin-top:8px">${esc(k.why)}</p><ul class="plain tiny" style="border-top:1px solid var(--line);padding-top:8px;margin-top:10px"><li><i class="ok">✓</i><span>${esc(k.green)}</span></li><li><i class="x">✕</i><span>${esc(k.red)}</span></li></ul></div>`)
      .join('')}</div>`,
  )

  const s17 = section(
    'conclusion',
    17,
    'Required conclusions',
    'Twelve direct answers, then the rating.',
    `<dl>${memo.conclusions.map((c, i) => `<div class="qa"><dt><span class="muted tnum">${i + 1}.</span> ${esc(c.q)}</dt><dd>${esc(c.a)}</dd></div>`).join('')}</dl>
<div class="box blue" style="margin-top:18px;padding:18px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center"><div><h4>Final rating</h4><div style="font-size:20px;font-weight:600;color:var(--ink)">${esc(memo.rating)}</div></div><div class="small tnum" style="text-align:right"><div>Base case <b>${money(base.targetPrice)}</b> · weighted <b>${money(wv)}</b></div><div>Expected 5-yr <b style="color:var(--${irr > 0 ? 'good' : 'crit'})">${irr.toFixed(1)}% p.a.</b> · horizon ${esc(memo.horizon)}</div></div></div><p class="small" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">${esc(memo.positionSizing)}</p></div>
<h3 style="margin-top:24px">Unanswered questions for management</h3>
<ol class="num">${memo.questionsForManagement.map((q, i) => `<li><i>${i + 1}</i><span class="small">${esc(q)}</span></li>`).join('')}</ol>`,
  )

  const s18 = section(
    'sources',
    18,
    'Confidence ledger',
    'Every source, with its tier. Read this before trusting any number above.',
    `<div class="grid4" style="margin-bottom:14px">${(Object.keys(TIER_META) as Tier[])
      .map((t) => `<div class="box"><div>${tier(t)} <b class="small">${esc(TIER_META[t].label)}</b></div><div class="note">${esc(TIER_META[t].desc)}</div></div>`)
      .join('')}</div>
<div class="tw"><table><thead><tr><th>Source</th><th>Publisher</th><th>Period</th><th class="r">Tier</th></tr></thead><tbody>
${memo.sources
      .map((s) => `<tr><td style="color:var(--ink)">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>` : esc(s.label)}</td><td>${esc(s.publisher)}</td><td class="nw">${esc(s.period)}</td><td class="r">${tier(s.tier)}</td></tr>`)
      .join('\n')}
</tbody></table></div>`,
  )

  const body = [integrity, masthead, memo.revalidation ? revalidationPanel(memo.revalidation) : '', nav, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, `<p class="small"><a href="/">← All forensic memos</a></p>`].join('\n')

  return shell({
    title: `${memo.symbol} — ${memo.name} · forensic memorandum`,
    description: memo.headline,
    current: memo.symbol,
    body,
  })
}

/* ------------------------------------------------------------------ index page */

const COMPARE_ROWS: { label: string; note?: string; get: (m: ForensicMemo) => string }[] = [
  { label: 'Share price', get: (m) => money(m.price) },
  { label: 'Market capitalisation', get: (m) => `$${m.marketCap.toFixed(2)}bn` },
  { label: 'Price / fee-related earnings', get: (m) => `${(m.peers.find((p) => p.ticker === m.symbol)?.pFre ?? 0).toFixed(1)}×` },
  { label: 'FRE growth, latest quarter', get: (m) => `${m.peers.find((p) => p.ticker === m.symbol)?.freGrowthPct ?? 0}%` },
  { label: 'FRE margin', get: (m) => `${(m.peers.find((p) => p.ticker === m.symbol)?.freMarginPct ?? 0).toFixed(1)}%` },
  { label: 'Dividend yield', get: (m) => `${m.dividendYieldPct.toFixed(1)}%` },
  {
    label: 'Dividend as % of DE',
    note: 'The single sharpest difference between the two',
    get: (m) => {
      const last = [...m.dividendCoverage].reverse().find((d) => d.payoutPct !== null)
      return last?.payoutPct ? `${last.payoutPct}%` : '—'
    },
  },
  { label: 'Permanent capital', get: (m) => m.peers.find((p) => p.ticker === m.symbol)?.permCapital ?? '—' },
  { label: 'AUM quality score', note: 'Mean of eight economic dimensions, 0–10', get: (m) => aumQualityScore(m).toFixed(1) },
  { label: 'Gated vehicles', get: (m) => (m.redemptions ? `Yes — ${m.redemptions.length}` : 'None') },
  { label: 'Base-case value', get: (m) => money(m.scenarios.find((s) => s.name === 'Base')?.targetPrice ?? 0) },
  { label: 'Probability-weighted value', get: (m) => money(weightedValue(m)) },
  { label: 'Upside to weighted value', get: (m) => signed(weightedUpsidePct(m)) },
  { label: 'Expected 5-year annualised', get: (m) => `${weightedIrrPct(m).toFixed(1)}%` },
  { label: 'Rating', get: (m) => m.rating },
]

const IF_FORCED = `Patria — and after August, by a wider margin than when this pair was first written. The original case was that Patria was the better arithmetic at a similar discount. Blue Owl has since re-rated 29.5% while Patria moved 2.6%, so the discount is no longer similar: Patria trades at 7.9× fee-related earnings against Blue Owl's 12.0×, a 34% gap where four weeks ago it was 17%. Nothing in either business changed to justify that. Patria still offers a dividend covered twice over, no gated vehicles, and a per-share stagnation whose single dominant cause (a distributable-earnings-to-fee-earnings ratio that fell from 164% to 99%) cannot repeat, because it has already fully played out — set against one new and genuinely unhelpful fact, that management now guides the FRE margin to stay below its 58–60% target for the full year. Blue Owl still owns the better franchise and the better fee rate, but the market has now paid for the re-rating in advance of the dividend rebase and the redemption queue clearing, which is why it is rated fairly valued rather than cheap. Own both only if you accept that they share one macro exposure: the multiple the market pays for private-markets fee streams.`

function memoCard(memo: ForensicMemo): string {
  const upside = weightedUpsidePct(memo)
  const base = memo.scenarios.find((s) => s.name === 'Base')?.targetPrice ?? 0
  const platformShort = memo.symbol === 'OWL' ? 'AUM' : 'FRE'
  const chart = lineChart({
    labels: memo.indexed.labels,
    series: [
      { name: memo.symbol === 'OWL' ? 'Total AUM' : 'Fee-related earnings', values: memo.indexed.aum, color: SERIES.platform },
      { name: 'DE per share', values: memo.indexed.dePs, color: SERIES.perShare, dashed: true },
    ],
    fmt: (v) => v.toFixed(0),
    title: `${memo.symbol}: platform growth versus distributable earnings per share, indexed`,
    height: 170,
  })
  return `<article class="card memocard">
<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2><a href="/${memo.symbol.toLowerCase()}/" style="color:var(--ink)">${esc(memo.symbol)}</a> <span class="muted" style="font-weight:400">${esc(memo.exchange)}</span> ${badge(memo.rating, RATING_TONE[memo.rating])}</h2><div class="small" style="margin-top:2px">${esc(memo.name)}</div></div><div class="price tnum"><div style="font-size:18px;font-weight:600;color:var(--ink);line-height:1">${money(memo.price)}</div><div class="small" style="color:var(--${upside > 0 ? 'good' : 'crit'})">${signed(upside)}</div></div></div>
<p class="lead">${esc(memo.headline)}</p>
<div><div class="kv tiny"><span>${esc(platformShort)} vs. DE per share, indexed to ${esc(memo.indexed.labels[0])} = 100</span><span class="tnum">${memo.indexed.aum.at(-1)} vs ${memo.indexed.dePs.at(-1)}</span></div>${chart}</div>
<hr>
<div class="grid4">${memo.headlineStats
    .slice(0, 4)
    .map((s) => `<div class="stat"><div class="k">${esc(s.label)}</div><div class="v tnum ${s.tone === 'gain' ? 'good' : s.tone === 'loss' ? 'crit' : s.tone === 'warn' ? 'warn' : ''}" style="font-size:15px">${esc(s.value)}</div></div>`)
    .join('')}</div>
<div class="box crit"><h4 style="color:var(--crit)">The bear's single best fact</h4><p class="small">${esc(memo.debate.bearsBestFact)}</p></div>
<div class="kv small"><span>Base case <b>${money(base)}</b> · ${esc(memo.latestPeriod.split(' (')[0])}</span><a href="/${memo.symbol.toLowerCase()}/"><b style="color:var(--blue)">Read the memo →</b></a></div>
</article>`
}

export function renderIndexPage(memos: ForensicMemo[] = FORENSIC_MEMOS): string {
  const revalidatedOn = memos
    .map((m) => m.revalidation?.asOf)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1)

  const intro = `<section class="card blue"><h1>Forensic memoranda — alternative asset managers</h1>
<p style="margin-top:10px">Adversarial investment-committee memoranda on listed alternative asset managers, written to a single standard: value the business on manager economics — fee-paying capital, fee rates, fee-related earnings, distributable earnings, duration, dilution — and judge every claim against <b>what reached the listed share</b>, not what reached assets under management.</p>
<p class="small">Each memo carries a confidence tier on every figure, an explicit per-share bridge, a dividend-coverage test, a red-team case against its own conclusion, three dated falsifiable predictions, and pre-committed kill criteria. The methodology is versioned at <a href="/methodology.md">FORENSIC-ASSET-MANAGER-PROMPT.md</a>.</p></section>`

  const reval = revalidatedOn
    ? `<section class="card blue"><h2>Updated ${esc(revalidatedOn)} &nbsp;${badge('Both memos revalidated', 'blue')}</h2>
<p class="lead" style="margin-top:8px">Both memos were re-tested against everything published since the 2026-07-31 cut. No operating figure in either memo deteriorated, and neither company reported new results. What moved was price — and only on one side.</p>
${memos
        .filter((m) => m.revalidation)
        .map((m) => {
          const r = m.revalidation!
          const move = ((r.priceNow - r.priceWas) / r.priceWas) * 100
          const changed = r.ratingWas !== r.ratingNow
          return `<div class="box" style="margin-top:10px;background:var(--surface)"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><a href="/${m.symbol.toLowerCase()}/"><b>${esc(m.symbol)}</b></a><span class="tnum small" style="color:var(--${move > 0 ? 'good' : 'crit'});font-weight:500">${signed(move, 1)}</span><span class="tnum tiny">${money(r.priceWas)} → ${money(r.priceNow)}</span>${changed ? badge(`${r.ratingWas} → ${r.ratingNow}`, 'warn') : badge('Rating held')}</div><p class="small" style="margin-top:6px">${esc(r.verdict)}</p></div>`
        })
        .join('')}</section>`
    : ''

  const cards = `<div class="grid2" style="align-items:start">${memos.map(memoCard).join('')}</div>`

  const compare = `<section class="card"><div class="sh"><h2>Side by side</h2><p class="sub">Two cheap alternative managers, cheap for opposite reasons. Read the pair, not either alone.</p></div>
<div class="tw"><table style="min-width:560px"><thead><tr><th>Dimension</th>${memos.map((m) => `<th class="r">${esc(m.symbol)}</th>`).join('')}</tr></thead><tbody>
${COMPARE_ROWS.map((row) => `<tr><td>${esc(row.label)}${noteLine(row.note)}</td>${memos.map((m) => `<td class="tnum r" style="color:var(--ink)">${esc(row.get(m))}</td>`).join('')}</tr>`).join('\n')}
</tbody></table></div>
<p class="box small" style="margin-top:14px"><b>If forced to own one.</b> ${esc(IF_FORCED)}</p></section>`

  return shell({
    title: 'HK Fire — forensic memoranda',
    description: 'Adversarial investment-committee memoranda on Blue Owl (OWL) and Patria (PAX).',
    current: 'index',
    body: [intro, reval, cards, compare].join('\n'),
  })
}

/* ------------------------------------------------------------------ build */

export async function build(out = OUT): Promise<string[]> {
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  const written: string[] = []
  const put = async (rel: string, html: string) => {
    const file = join(out, rel)
    await mkdir(join(file, '..'), { recursive: true })
    await writeFile(file, html)
    written.push(rel)
  }
  await put('index.html', renderIndexPage())
  for (const memo of FORENSIC_MEMOS) await put(`${memo.symbol.toLowerCase()}/index.html`, renderMemoPage(memo))
  await copyFile(join(HERE, 'docs', 'FORENSIC-ASSET-MANAGER-PROMPT.md'), join(out, 'methodology.md'))
  written.push('methodology.md')
  await put('robots.txt', 'User-agent: *\nDisallow: /\n')
  await put(
    '404.html',
    shell({
      title: 'Not found — HK Fire',
      description: 'There is no page at this address.',
      current: '404',
      body: `<section class="card"><h1>Not found</h1><p style="margin-top:8px">There is no page at this address. The memos are listed on the <a href="/">index</a>.</p></section>`,
    }),
  )
  return written
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await build()
  console.log(`dist/ — ${files.length} files:\n  ${files.join('\n  ')}`)
}
