/*
  Editor JSON → Word document (.docx) via the `docx` package. Pure: images are
  handed in as bytes so this can run anywhere (server route, tests).
*/
import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, ImageRun, LevelFormat, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, UnderlineType, WidthType,
  type IParagraphOptions, type IRunOptions, type ParagraphChild,
} from 'docx'
import type { PMNode } from '../markdown'
import { normalizeSheet, sheetToGrid } from '../sheet/model'
import { attachmentIdFromUrl } from './html'

export interface DocxImage { bytes: Uint8Array; mime: string }

export interface DocxInput {
  title: string
  doc: unknown
  createdAt?: Date
  updatedAt?: Date
  tags?: string[]
  context?: string
  /** Inline images by attachment id (`/api/attachments/<id>` in the document) or by full URL. */
  images?: Map<string, DocxImage>
  attachments?: { name: string; size?: number }[]
}

type Block = Paragraph | Table
const MONO = 'Consolas'
const PAGE_WIDTH_TWIPS = 9000 // 6.25in text width on Letter with 1in margins... rounded

/** PNG / JPEG / GIF pixel size from the header, for aspect-correct placement. */
export function imageSize(bytes: Uint8Array, mime: string): { width: number; height: number } | null {
  const b = bytes
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  try {
    if (mime === 'image/png' && b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { width: dv.getUint32(16), height: dv.getUint32(20) }
    if (mime === 'image/gif' && b.length > 10) return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) }
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      let i = 2
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue }
        const marker = b[i + 1]!
        const len = dv.getUint16(i + 2)
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) }
        i += 2 + len
      }
    }
  } catch { /* fall through */ }
  return null
}

function docxImageType(mime: string): 'png' | 'jpg' | 'gif' | 'bmp' | null {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/bmp') return 'bmp'
  return null
}

interface Ctx { input: DocxInput; listInstance: number }

function runs(nodes: PMNode[] | undefined, ctx: Ctx, base: { bold?: boolean; italics?: boolean; color?: string } = {}): ParagraphChild[] {
  const out: ParagraphChild[] = []
  for (const n of nodes ?? []) {
    if (n.type === 'hardBreak') { out.push(new TextRun({ break: 1 })); continue }
    if (n.type === 'mention') { out.push(new TextRun({ text: `@${String(n.attrs?.label ?? n.attrs?.id ?? '')}`, color: '2F6FED', ...base })); continue }
    if (n.type === 'noteLink') { out.push(new TextRun({ text: String(n.attrs?.label ?? ''), color: '2F6FED', underline: { type: UnderlineType.DOTTED }, ...base })); continue }
    if (n.type === 'image') { const img = imageRun(n, ctx); if (img) out.push(img); continue }
    if (n.type !== 'text') continue
    const opts: { -readonly [K in keyof IRunOptions]: IRunOptions[K] } = { text: n.text ?? '', ...base }
    let href: string | null = null
    for (const m of n.marks ?? []) {
      if (m.type === 'bold') opts.bold = true
      else if (m.type === 'italic') opts.italics = true
      else if (m.type === 'code') { opts.font = MONO; opts.shading = { type: ShadingType.CLEAR, fill: 'F2F3F5' } }
      else if (m.type === 'strike') opts.strike = true
      else if (m.type === 'underline') opts.underline = {}
      else if (m.type === 'highlight') opts.highlight = 'yellow'
      else if (m.type === 'link') href = String(m.attrs?.href ?? '')
    }
    if (href && /^https?:/i.test(href)) out.push(new ExternalHyperlink({ link: href, children: [new TextRun({ ...opts, style: 'Hyperlink' })] }))
    else out.push(new TextRun(opts))
  }
  return out
}

function imageRun(n: PMNode, ctx: Ctx): ImageRun | null {
  const src = String(n.attrs?.src ?? '')
  const key = attachmentIdFromUrl(src) ?? src
  const img = ctx.input.images?.get(key)
  if (!img) return null
  const type = docxImageType(img.mime)
  if (!type) return null
  const size = imageSize(img.bytes, img.mime) ?? { width: 960, height: 640 }
  const maxW = 600 // points-ish (docx uses px at 96dpi for transformation)
  const scale = Math.min(1, maxW / size.width)
  return new ImageRun({ type, data: img.bytes, transformation: { width: Math.round(size.width * scale), height: Math.round(size.height * scale) }, altText: { title: String(n.attrs?.alt ?? 'image'), description: String(n.attrs?.alt ?? ''), name: 'image' } })
}

function heading(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  return level <= 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4
}

function blocks(n: PMNode, ctx: Ctx, extra: Partial<IParagraphOptions> = {}): Block[] {
  switch (n.type) {
    case 'paragraph': return [new Paragraph({ children: runs(n.content, ctx), spacing: { after: 120 }, ...extra })]
    case 'heading': return [new Paragraph({ children: runs(n.content, ctx), heading: heading(Number(n.attrs?.level ?? 2)), spacing: { before: 240, after: 100 }, ...extra })]
    case 'bulletList': return list(n, ctx, 'bullets', extra)
    case 'orderedList': { ctx.listInstance++; return list(n, ctx, 'numbers', extra, ctx.listInstance) }
    case 'taskList': return (n.content ?? []).flatMap((li) => {
      const first = li.content?.[0]
      const rest = li.content?.slice(1) ?? []
      const box = new TextRun({ text: li.attrs?.checked ? '☑ ' : '☐ ' })
      const body = first?.type === 'paragraph' ? runs(first.content, ctx, li.attrs?.checked ? { color: '8A8A8A' } : {}) : []
      return [new Paragraph({ children: [box, ...body], indent: { left: 360 }, spacing: { after: 60 }, ...extra }), ...rest.flatMap((c) => blocks(c, ctx, { indent: { left: 720 } }))]
    })
    case 'blockquote': return (n.content ?? []).flatMap((c) => blocks(c, ctx, { indent: { left: 480 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'DDDDDD', space: 8 } } }))
    case 'codeBlock': return [new Paragraph({ children: (n.content ?? []).map((c) => c.text ?? '').join('').split('\n').flatMap((line, i) => (i ? [new TextRun({ break: 1 }), new TextRun({ text: line, font: MONO, size: 18 })] : [new TextRun({ text: line, font: MONO, size: 18 })])), shading: { type: ShadingType.CLEAR, fill: 'F2F3F5' }, spacing: { after: 160 }, ...extra })]
    case 'horizontalRule': return [new Paragraph({ thematicBreak: true, spacing: { after: 120 } })]
    case 'image': { const img = imageRun(n, ctx); return img ? [new Paragraph({ children: [img], spacing: { after: 160 } })] : [] }
    case 'table': return [table((n.content ?? []).map((row) => (row.content ?? []).map((cell) => ({ header: cell.type === 'tableHeader', blocks: (cell.content ?? []).flatMap((c) => blocks(c, ctx)) }))))]
    case 'callout': {
      const kind = String(n.attrs?.kind ?? 'info')
      const label = kind === 'decision' ? 'DECISION' : kind === 'warning' ? 'NOTE' : kind === 'ai' ? 'AI' : ''
      const border = { left: { style: BorderStyle.SINGLE, size: 18, color: kind === 'decision' ? '2F6FED' : 'E0B25A', space: 8 } }
      return [...(label ? [new Paragraph({ children: [new TextRun({ text: label, size: 16, color: '8A8A8A', bold: true })], indent: { left: 480 }, border, spacing: { after: 40 } })] : []), ...(n.content ?? []).flatMap((c) => blocks(c, ctx, { indent: { left: 480 }, border }))]
    }
    case 'sheet': return sheetTable(n.attrs?.sheet)
    default: return n.content ? (n.content ?? []).flatMap((c) => blocks(c, ctx, extra)) : [new Paragraph({ children: runs([n], ctx), ...extra })]
  }
}

function list(n: PMNode, ctx: Ctx, ref: 'bullets' | 'numbers', extra: Partial<IParagraphOptions>, instance?: number, level = 0): Block[] {
  const out: Block[] = []
  for (const li of n.content ?? []) {
    for (const c of li.content ?? []) {
      if (c.type === 'bulletList') out.push(...list(c, ctx, 'bullets', extra, undefined, level + 1))
      else if (c.type === 'orderedList') { ctx.listInstance++; out.push(...list(c, ctx, 'numbers', extra, ctx.listInstance, level + 1)) }
      else if (c.type === 'paragraph') out.push(new Paragraph({ children: runs(c.content, ctx), numbering: { reference: ref, level: Math.min(level, 2), instance }, spacing: { after: 60 }, ...extra }))
      else out.push(...blocks(c, ctx, { indent: { left: 720 * (level + 1) } }))
    }
  }
  return out
}

function table(rows: { header: boolean; blocks: Block[] }[][]): Table {
  const cols = Math.max(1, ...rows.map((r) => r.length))
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: Array.from({ length: cols }, () => Math.floor(PAGE_WIDTH_TWIPS / cols)),
    rows: rows.map((r) => new TableRow({ children: r.map((cell) => new TableCell({ children: cell.blocks.length ? cell.blocks : [new Paragraph('')], shading: cell.header ? { type: ShadingType.CLEAR, fill: 'F2F3F5' } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 } })) })),
  })
}

function sheetTable(raw: unknown): Block[] {
  const sheet = normalizeSheet(raw)
  const { header, rows } = sheetToGrid(sheet)
  if (!rows.length) return sheet.title ? [new Paragraph({ children: [new TextRun({ text: sheet.title, bold: true }), new TextRun(' (empty sheet)')] })] : []
  const width = Math.max(1, ...rows.map((r) => r.findLastIndex((x) => x !== '') + 1))
  const cell = (text: string, opts: { header?: boolean; right?: boolean } = {}) => ({ header: Boolean(opts.header), blocks: [new Paragraph({ children: [new TextRun({ text, bold: opts.header, size: 18, color: opts.header ? '8A8A8A' : undefined })], alignment: opts.right ? AlignmentType.RIGHT : undefined })] })
  const head = [cell('', { header: true }), ...header.slice(0, width).map((h) => cell(h, { header: true }))]
  const body = rows.map((r, i) => [cell(String(i + 1), { header: true }), ...r.slice(0, width).map((c) => cell(c, { right: /^-?[\d,.]+%?$/.test(c) }))])
  const out: Block[] = []
  if (sheet.title) out.push(new Paragraph({ children: [new TextRun({ text: sheet.title, bold: true })], spacing: { after: 60 } }))
  out.push(table([head, ...body]), new Paragraph({ spacing: { after: 120 } }))
  return out
}

/** Build the .docx bytes for a note. */
export async function noteToDocx(input: DocxInput): Promise<Buffer> {
  const ctx: Ctx = { input, listInstance: 0 }
  const meta: string[] = []
  if (input.createdAt) meta.push(input.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
  if (input.context) meta.push(input.context)
  if (input.tags?.length) meta.push(input.tags.map((t) => `#${t}`).join(' '))
  const body: Block[] = [
    new Paragraph({ children: [new TextRun({ text: input.title || 'Untitled' })], heading: HeadingLevel.TITLE, spacing: { after: 80 } }),
    ...(meta.length ? [new Paragraph({ children: [new TextRun({ text: meta.join(' · '), color: '8A8A8A', size: 18 })], spacing: { after: 320 } })] : []),
    ...((input.doc as PMNode | null)?.content ?? []).flatMap((c) => blocks(c, ctx)),
  ]
  if (input.attachments?.length) {
    body.push(new Paragraph({ children: [new TextRun({ text: 'ATTACHMENTS', size: 16, color: '8A8A8A', bold: true })], spacing: { before: 400, after: 80 } }))
    for (const a of input.attachments) body.push(new Paragraph({ children: [new TextRun({ text: a.name })], numbering: { reference: 'bullets', level: 0 } }))
  }
  const document = new Document({
    creator: 'Notes',
    title: input.title || 'Untitled',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { size: 52, bold: true, color: '1A1A1A' }, paragraph: { spacing: { after: 120 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: '1A1A1A' } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '1A1A1A' } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: '1A1A1A' } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, color: '5C5C5C' } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets', levels: [0, 1, 2].map((level) => ({ level, format: LevelFormat.BULLET, text: ['•', '◦', '▪'][level]!, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } } })) },
        { reference: 'numbers', levels: [0, 1, 2].map((level) => ({ level, format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level]!, text: `%${level + 1}.`, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } } })) },
      ],
    },
    sections: [{ children: body }],
  })
  return Packer.toBuffer(document)
}
