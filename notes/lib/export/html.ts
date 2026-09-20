/*
  Editor JSON → standalone HTML. Pure and client-safe: no database, no React.
  Used by the HTML export (which doubles as the print-to-PDF path) and by the
  DOCX exporter's shared walk.
*/
import type { PMNode } from '../markdown'
import { normalizeSheet, sheetToGrid } from '../sheet/model'

export interface AssetRef { id: string; name: string; mime: string }

export interface HtmlOptions {
  /** Rewrites an attachment URL (`/api/attachments/<id>`) into whatever the export can reach: a data URI, a relative path… Returns the input when nothing matches. */
  resolveAsset?: (src: string) => string
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const ATTACHMENT_RE = /^\/api\/attachments\/([^/?#]+)/

/** The attachment id an editor URL points at, if it is one. */
export function attachmentIdFromUrl(src: string): string | null {
  const m = ATTACHMENT_RE.exec(src)
  return m ? m[1]! : null
}

function inline(nodes: PMNode[] | undefined, o: HtmlOptions): string {
  return (nodes ?? []).map((n) => inlineNode(n, o)).join('')
}

function inlineNode(n: PMNode, o: HtmlOptions): string {
  if (n.type === 'hardBreak') return '<br>'
  if (n.type === 'mention') return `<span class="mention">@${escapeHtml(String(n.attrs?.label ?? n.attrs?.id ?? ''))}</span>`
  if (n.type === 'image') return image(n, o)
  if (n.type !== 'text') return ''
  let el = escapeHtml(n.text ?? '')
  for (const m of n.marks ?? []) {
    if (m.type === 'bold') el = `<strong>${el}</strong>`
    else if (m.type === 'italic') el = `<em>${el}</em>`
    else if (m.type === 'code') el = `<code>${el}</code>`
    else if (m.type === 'strike') el = `<s>${el}</s>`
    else if (m.type === 'underline') el = `<u>${el}</u>`
    else if (m.type === 'highlight') el = `<mark>${el}</mark>`
    else if (m.type === 'link') el = `<a href="${escapeHtml(resolve(String(m.attrs?.href ?? '#'), o))}">${el}</a>`
  }
  return el
}

function resolve(src: string, o: HtmlOptions): string {
  return o.resolveAsset ? o.resolveAsset(src) : src
}

function image(n: PMNode, o: HtmlOptions): string {
  return `<img src="${escapeHtml(resolve(String(n.attrs?.src ?? ''), o))}" alt="${escapeHtml(String(n.attrs?.alt ?? ''))}">`
}

function block(n: PMNode, o: HtmlOptions): string {
  const kids = () => (n.content ?? []).map((c) => block(c, o)).join('')
  switch (n.type) {
    case 'paragraph': return `<p>${inline(n.content, o)}</p>`
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(n.attrs?.level ?? 2)))
      return `<h${level}>${inline(n.content, o)}</h${level}>`
    }
    case 'bulletList': return `<ul>${kids()}</ul>`
    case 'orderedList': return `<ol>${kids()}</ol>`
    case 'listItem': return `<li>${kids()}</li>`
    case 'taskList': return `<ul class="tasks">${kids()}</ul>`
    case 'taskItem': return `<li class="task${n.attrs?.checked ? ' done' : ''}"><input type="checkbox" disabled${n.attrs?.checked ? ' checked' : ''}> <div>${kids()}</div></li>`
    case 'blockquote': return `<blockquote>${kids()}</blockquote>`
    case 'codeBlock': return `<pre><code>${escapeHtml((n.content ?? []).map((c) => c.text ?? '').join(''))}</code></pre>`
    case 'horizontalRule': return '<hr>'
    case 'image': return `<figure>${image(n, o)}</figure>`
    case 'table': return `<table><tbody>${kids()}</tbody></table>`
    case 'tableRow': return `<tr>${kids()}</tr>`
    case 'tableHeader': return `<th>${kids()}</th>`
    case 'tableCell': return `<td>${kids()}</td>`
    case 'callout': {
      const kind = String(n.attrs?.kind ?? 'info')
      const label = kind === 'decision' ? 'Decision' : kind === 'warning' ? 'Note' : kind === 'ai' ? 'AI' : ''
      return `<div class="callout callout-${escapeHtml(kind)}">${label ? `<div class="callout-label">${label}</div>` : ''}${kids()}</div>`
    }
    case 'sheet': return sheetHtml(n.attrs?.sheet)
    default: return n.content ? `<div>${kids()}</div>` : `<p>${inlineNode(n, o)}</p>`
  }
}

function sheetHtml(raw: unknown): string {
  const sheet = normalizeSheet(raw)
  const { header, rows } = sheetToGrid(sheet)
  if (!rows.length) return sheet.title ? `<p><strong>${escapeHtml(sheet.title)}</strong> (empty sheet)</p>` : ''
  const width = Math.max(1, ...rows.map((r) => r.findLastIndex((x) => x !== '') + 1))
  const head = `<tr><th></th>${header.slice(0, width).map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
  const body = rows.map((r, i) => `<tr><th>${i + 1}</th>${r.slice(0, width).map((c) => `<td class="${/^-?[\d,.]+%?$/.test(c) ? 'num' : ''}">${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
  return `<figure class="sheet">${sheet.title ? `<figcaption>${escapeHtml(sheet.title)}</figcaption>` : ''}<table class="sheet"><thead>${head}</thead><tbody>${body}</tbody></table></figure>`
}

/** The note body as an HTML fragment. */
export function docToHtml(doc: unknown, o: HtmlOptions = {}): string {
  const node = doc as PMNode | null | undefined
  if (!node) return ''
  return (node.content ?? []).map((c) => block(c, o)).join('\n')
}

export interface HtmlDocumentInput {
  title: string
  doc: unknown
  createdAt?: Date
  updatedAt?: Date
  tags?: string[]
  context?: string
  /** Extra files that are not inline images: listed at the end. */
  attachments?: { name: string; href: string; size?: number }[]
  /** Opens the print dialog on load, for "Print / Save as PDF". */
  print?: boolean
}

const CSS = `
:root { color-scheme: light; --fg: #1a1a1a; --fg-2: #5c5c5c; --fg-3: #8a8a8a; --border: #e6e6e6; --accent: #2f6fed; --soft: #f5f6f8; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: var(--fg); }
body { font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
main { max-width: 720px; margin: 0 auto; padding: 48px 24px 64px; }
header h1 { font-size: 30px; line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 8px; font-weight: 650; }
header .meta { color: var(--fg-3); font-size: 13px; margin: 0 0 32px; display: flex; flex-wrap: wrap; gap: 6px 12px; }
header .tag { background: var(--soft); border-radius: 6px; padding: 1px 7px; color: var(--fg-2); }
article > * + * { margin-top: 0.75em; }
article h1 { font-size: 24px; margin-top: 1.6em; } article h2 { font-size: 20px; margin-top: 1.5em; } article h3 { font-size: 17px; margin-top: 1.3em; }
article h1, article h2, article h3, article h4 { line-height: 1.3; letter-spacing: -0.01em; font-weight: 640; }
article p { margin: 0; }
article a { color: var(--accent); text-decoration: none; } article a:hover { text-decoration: underline; }
article ul, article ol { padding-left: 1.5em; margin: 0; } article li + li { margin-top: 0.25em; }
article ul.tasks { list-style: none; padding-left: 0.2em; } article li.task { display: flex; gap: 8px; align-items: flex-start; } article li.task > div { flex: 1; } article li.task input { margin-top: 6px; } article li.task.done > div { color: var(--fg-3); text-decoration: line-through; }
article blockquote { margin: 0; padding: 2px 0 2px 14px; border-left: 3px solid var(--border); color: var(--fg-2); }
article code { font: 0.9em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: var(--soft); border-radius: 4px; padding: 1px 5px; }
article pre { background: var(--soft); border-radius: 8px; padding: 12px 14px; overflow-x: auto; } article pre code { background: none; padding: 0; }
article hr { border: 0; border-top: 1px solid var(--border); margin: 1.5em 0; }
article img { max-width: 100%; border-radius: 8px; } article figure { margin: 0; }
article table { border-collapse: collapse; width: 100%; font-size: 14px; } article th, article td { border: 1px solid var(--border); padding: 6px 9px; text-align: left; vertical-align: top; } article th { background: var(--soft); font-weight: 600; }
article table.sheet th { color: var(--fg-3); font-weight: 500; font-size: 12px; text-align: center; } article table.sheet td.num { text-align: right; font-variant-numeric: tabular-nums; } article figure.sheet figcaption { font-weight: 600; margin-bottom: 6px; }
article .callout { border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; background: var(--soft); } article .callout-decision { border-color: #c9d8ff; background: #f2f6ff; } article .callout-warning { border-color: #f3d9a4; background: #fff8e8; }
article .callout-label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--fg-3); margin-bottom: 4px; }
article .mention { color: var(--accent); font-weight: 500; }
.attachments { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 14px; } .attachments h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--fg-3); margin: 0 0 8px; }
footer { margin-top: 48px; padding-top: 14px; border-top: 1px solid var(--border); color: var(--fg-3); font-size: 12px; }
@media print { main { max-width: none; padding: 0; } footer { display: none; } body { font-size: 12.5pt; } a { color: inherit; } }
`

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** A complete, self-contained HTML document for a note. */
export function noteToHtmlDocument(input: HtmlDocumentInput, o: HtmlOptions = {}): string {
  const meta: string[] = []
  if (input.createdAt) meta.push(fmtDate(input.createdAt))
  if (input.updatedAt && input.createdAt && input.updatedAt.getTime() - input.createdAt.getTime() > 86400_000) meta.push(`updated ${fmtDate(input.updatedAt)}`)
  if (input.context) meta.push(escapeHtml(input.context))
  const tags = (input.tags ?? []).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join('')
  const attachments = input.attachments?.length
    ? `<section class="attachments"><h2>Attachments</h2><ul>${input.attachments.map((a) => `<li><a href="${escapeHtml(a.href)}">${escapeHtml(a.name)}</a>${a.size ? ` <span style="color:var(--fg-3)">(${formatBytes(a.size)})</span>` : ''}</li>`).join('')}</ul></section>`
    : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(input.title || 'Untitled')}</title>
<style>${CSS}</style>
</head>
<body>
<main>
<header><h1>${escapeHtml(input.title || 'Untitled')}</h1><p class="meta">${meta.map((m) => `<span>${m}</span>`).join('')}${tags}</p></header>
<article>
${docToHtml(input.doc, o)}
</article>
${attachments}
<footer>Exported from Notes${input.updatedAt ? ` · ${fmtDate(new Date())}` : ''}</footer>
</main>
${input.print ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},150)})</script>' : ''}
</body>
</html>
`
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
