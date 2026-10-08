/*
  Turning an uploaded document into Markdown the note editor can hold.

  Each format has a small, deterministic reader; PDFs and images fall back to
  the model (Gemini reads the file directly) when there is no text layer to
  read. The result is plain Markdown plus what we learned along the way:
  which reader produced it, page counts, warnings, and a title when the
  document carries one.
*/
import { parseFrontMatter } from '../import'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES } from './constants'

export type ExtractMethod = 'text' | 'markdown' | 'json' | 'pdf' | 'pdf-ai' | 'docx' | 'xlsx' | 'csv' | 'html' | 'image-ai' | 'none'

export interface ExtractInput { name: string; mime: string; bytes: Buffer }
export interface ExtractOptions {
  /** Read scanned PDFs and images with the model when the deterministic readers find nothing. Default true. */
  ai?: boolean
  /** Hook the model path uses (kept injectable for tests). */
  readWithAi?: (bytes: Buffer, mime: string, name: string) => Promise<string | null>
}
export interface Extracted {
  /** A title the document itself carries (PDF metadata, first heading, front matter). Empty when it has none. */
  title: string
  markdown: string
  method: ExtractMethod
  pages?: number
  sheets?: number
  warnings: string[]
  /** True when the document was recognised but nothing readable came out of it. */
  empty: boolean
}

export { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES }
/** Below this many characters per page a PDF is treated as scanned and handed to the model. */
const SCANNED_THRESHOLD = 40
/** Rows kept from a spreadsheet or CSV per sheet; the rest is noted, not pasted. */
const MAX_ROWS = 400
const MAX_COLS = 30
/** Extracted text is capped so a 900-page manual does not become a 900-page note. */
const MAX_CHARS = 400_000

export type DocKind = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'text' | 'markdown' | 'json' | 'html' | 'image' | 'other'

export function detectKind(name: string, mime: string): DocKind {
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase()
  const m = (mime || '').toLowerCase()
  if (ext === 'pdf' || m === 'application/pdf') return 'pdf'
  if (ext === 'docx' || m.includes('wordprocessingml')) return 'docx'
  if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm' || m.includes('spreadsheetml') || m === 'application/vnd.ms-excel') return 'xlsx'
  if (ext === 'csv' || ext === 'tsv' || m === 'text/csv' || m === 'text/tab-separated-values') return 'csv'
  if (ext === 'md' || ext === 'markdown' || m === 'text/markdown') return 'markdown'
  if (ext === 'json' || m === 'application/json') return 'json'
  if (ext === 'html' || ext === 'htm' || m === 'text/html') return 'html'
  if (m.startsWith('image/') || /^(png|jpe?g|gif|webp|heic|heif|bmp|tiff?)$/.test(ext)) return 'image'
  if (ext === 'txt' || ext === 'text' || ext === 'rtf' || ext === 'log' || m.startsWith('text/')) return 'text'
  return 'other'
}

export function titleFromFilename(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Extract Markdown from a document. Never throws for a recognised type: failures become warnings and `empty`. */
export async function extractDocument(input: ExtractInput, opts: ExtractOptions = {}): Promise<Extracted> {
  const kind = detectKind(input.name, input.mime)
  const warnings: string[] = []
  const finish = (r: Partial<Extracted> & { markdown: string; method: ExtractMethod }): Extracted => {
    let markdown = r.markdown.replace(/\u0000/g, '').trim()
    if (markdown.length > MAX_CHARS) {
      markdown = markdown.slice(0, MAX_CHARS) + '\n\n_… the document continues; the full file is attached._'
      warnings.push(`Only the first ${Math.round(MAX_CHARS / 1000)}k characters were kept in the note`)
    }
    return { title: r.title ?? '', markdown, method: r.method, pages: r.pages, sheets: r.sheets, warnings: [...warnings, ...(r.warnings ?? [])], empty: markdown.length === 0 }
  }
  const ai = opts.ai !== false
  const readWithAi = opts.readWithAi ?? (await import('../media')).readDocumentWithModel

  try {
    switch (kind) {
      case 'markdown':
      case 'text': {
        const raw = input.bytes.toString('utf8').replace(/^﻿/, '')
        const { data, body } = parseFrontMatter(raw)
        let markdown = body
        let title = data.title ?? ''
        const heading = /^#\s+(.+?)\s*$/m.exec(markdown)
        if (!title && heading && markdown.trimStart().startsWith('#')) { title = heading[1]!.trim(); markdown = markdown.replace(heading[0], '') }
        if (kind === 'text' && /\.rtf$/i.test(input.name)) markdown = rtfToText(markdown)
        return finish({ title, markdown, method: kind })
      }
      case 'json': {
        const raw = input.bytes.toString('utf8')
        try {
          const j = JSON.parse(raw) as unknown
          return finish({ markdown: '```json\n' + JSON.stringify(j, null, 2).slice(0, MAX_CHARS) + '\n```', method: 'json' })
        } catch {
          return finish({ markdown: '```\n' + raw + '\n```', method: 'json', warnings: ['Not valid JSON; kept as text'] })
        }
      }
      case 'html':
        return finish({ ...htmlToMarkdown(input.bytes.toString('utf8')), method: 'html' })
      case 'csv': {
        const delim = /\.tsv$/i.test(input.name) || input.mime === 'text/tab-separated-values' ? '\t' : ','
        const rows = parseDelimited(input.bytes.toString('utf8').replace(/^﻿/, ''), delim)
        return finish({ ...rowsToMarkdown(rows), method: 'csv' })
      }
      case 'xlsx': {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(input.bytes, { type: 'buffer', cellDates: true })
        const parts: string[] = []
        const w: string[] = []
        for (const name of wb.SheetNames) {
          const ws = wb.Sheets[name]
          if (!ws) continue
          const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' }) as unknown[][]
          const cleaned = rows.map((r) => r.map((c) => (c == null ? '' : String(c))))
          const md = rowsToMarkdown(cleaned)
          if (!md.markdown) continue
          parts.push(`## ${name}\n\n${md.markdown}`)
          w.push(...md.warnings.map((x) => `${name}: ${x}`))
        }
        return finish({ markdown: parts.join('\n\n'), method: 'xlsx', sheets: wb.SheetNames.length, warnings: w })
      }
      case 'docx': {
        const mammoth = await import('mammoth')
        const r = await mammoth.convertToHtml({ buffer: input.bytes })
        const { markdown: md } = htmlToMarkdown(r.value)
        const heading = /^#\s+(.+?)\s*$/m.exec(md)
        const errors = r.messages.filter((m: { type: string }) => m.type === 'error').map((m: { message: string }) => m.message).slice(0, 3)
        return finish({ title: heading && md.trimStart().startsWith('#') ? heading[1]!.trim() : '', markdown: md, method: 'docx', warnings: errors })
      }
      case 'pdf': {
        const { extractText, getMeta } = await import('unpdf')
        // pdf.js takes ownership of the buffer it is given (it may be detached), so each call gets its own copy.
        const fresh = () => new Uint8Array(input.bytes)
        let pages = 0
        let text = ''
        let title = ''
        try {
          const r = await extractText(fresh(), { mergePages: false })
          pages = r.totalPages
          text = r.text.map((p, i) => cleanPdfPage(p, i + 1)).filter(Boolean).join('\n\n')
        } catch (e) {
          warnings.push(`The PDF text layer could not be read (${String((e as Error).message ?? e).slice(0, 80)})`)
        }
        try {
          const meta = await getMeta(fresh())
          const t = (meta.info as { Title?: string } | undefined)?.Title
          if (t && t.trim() && !/^(untitled|microsoft word|document\d*)/i.test(t.trim())) title = t.trim().replace(/\.(docx?|pdf)$/i, '')
        } catch {
          /* metadata is optional */
        }
        const perPage = pages ? text.replace(/\s+/g, '').length / pages : text.length
        if (perPage < SCANNED_THRESHOLD && ai) {
          const read = await readWithAi(input.bytes, 'application/pdf', input.name)
          if (read && read.trim().length > text.trim().length) return finish({ title, markdown: read, method: 'pdf-ai', pages, warnings: ['Scanned PDF: the text was read by the model, so check numbers against the original'] })
          if (!text.trim()) warnings.push('This PDF has no text layer and the model could not read it (add a Gemini key in Settings → AI)')
        }
        return finish({ title, markdown: text, method: 'pdf', pages })
      }
      case 'image': {
        if (!ai) return finish({ markdown: '', method: 'none' })
        const read = await readWithAi(input.bytes, input.mime || 'image/png', input.name)
        if (!read) return finish({ markdown: '', method: 'none', warnings: ['Reading images needs a Gemini key (Settings → AI)'] })
        return finish({ markdown: read, method: 'image-ai' })
      }
      default:
        return finish({ markdown: '', method: 'none', warnings: [`${input.name.split('.').pop()?.toUpperCase() ?? 'This'} files are attached as-is; text is extracted from PDF, Word, Excel, CSV, HTML, text and images`] })
    }
  } catch (e) {
    return finish({ markdown: '', method: 'none', warnings: [`Could not read this file: ${String((e as Error).message ?? e).slice(0, 160)}`] })
  }
}

/* ------------------------------------------------------------------ helpers */

function cleanPdfPage(page: string, n: number): string {
  const t = page
    .replace(/[ \t]+\n/g, '\n')
    .replace(/(\S)-\n(\w)/g, '$1$2') // hyphenation at line ends
    .replace(/([^\n.!?:;])\n(?!\n)([a-z0-9(])/g, '$1 $2') // re-flow wrapped lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return t ? (n > 1 ? `\n\n<!-- page ${n} -->\n${t}` : t) : ''
}

function rtfToText(rtf: string): string {
  if (!/^\{\\rtf/.test(rtf.trim())) return rtf
  return rtf
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\'([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\[a-z]+-?\d* ?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** RFC 4180-ish: quoted fields, doubled quotes, CRLF. */
export function parseDelimited(text: string, delim = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((c) => c.trim())) rows.push(row)
      row = []
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); if (row.some((c) => c.trim())) rows.push(row) }
  return rows
}

/** A Markdown table (header row first), capped in rows and columns. */
export function rowsToMarkdown(rows: string[][]): { markdown: string; warnings: string[] } {
  const warnings: string[] = []
  const cleaned = rows.filter((r) => r.some((c) => String(c).trim()))
  if (!cleaned.length) return { markdown: '', warnings }
  const width = Math.min(MAX_COLS, Math.max(...cleaned.map((r) => r.length)))
  if (Math.max(...cleaned.map((r) => r.length)) > MAX_COLS) warnings.push(`Only the first ${MAX_COLS} columns were kept`)
  const kept = cleaned.slice(0, MAX_ROWS)
  if (cleaned.length > MAX_ROWS) warnings.push(`Only the first ${MAX_ROWS} of ${cleaned.length} rows were kept`)
  const esc = (c: unknown) => String(c ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim()
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => esc(r[i]))
  const [head, ...body] = kept.map(pad)
  const lines = [`| ${head!.join(' | ')} |`, `| ${head!.map(() => '---').join(' | ')} |`, ...body.map((r) => `| ${r.join(' | ')} |`)]
  if (cleaned.length > MAX_ROWS) lines.push('', `_${cleaned.length - MAX_ROWS} more rows in the attached file._`)
  return { markdown: lines.join('\n'), warnings }
}

/** HTML → Markdown for the structures that matter in a document: headings, paragraphs, lists, links, emphasis, tables, code. */
export function htmlToMarkdown(html: string): { title: string; markdown: string } {
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()
  let s = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg|head|nav|footer|iframe)[\s\S]*?<\/\1>/gi, '')
    .replace(/\r/g, '')
  // Tables: rows → pipe rows; the first row is the header.
  s = s.replace(/<table[\s\S]*?<\/table>/gi, (t) => {
    const rows = [...t.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((r) => [...r[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => stripInline(c[1]!)))
    return '\n\n' + rowsToMarkdown(rows).markdown + '\n\n'
  })
  s = s
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l: string, t: string) => `\n\n${'#'.repeat(Number(l))} ${stripInline(t)}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t: string) => `\n- ${stripInline(t)}`)
    .replace(/<\/(ul|ol)>/gi, '\n\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t: string) => `\n\n> ${stripInline(t)}\n\n`)
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, t: string) => `\n\n\`\`\`\n${decode(t.replace(/<[^>]+>/g, ''))}\n\`\`\`\n\n`)
    .replace(/<(p|div|section|article|tr|br|hr)[^>]*>/gi, '\n\n')
    .replace(/<\/(p|div|section|article)>/gi, '\n\n')
  s = stripInline(s)
  return { title, markdown: s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() }
}

function stripInline(s: string): string {
  return decode(
    s
      .replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, '_$2_')
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, h: string, t: string) => (/^https?:/.test(h) ? `[${t.replace(/<[^>]+>/g, '').trim()}](${h})` : t))
      .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]{2,}/g, ' '),
  ).trim()
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
}
