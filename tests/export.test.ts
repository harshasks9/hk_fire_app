import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { markdownToDoc } from '../lib/markdown'
import { docToHtml, noteToHtmlDocument, attachmentIdFromUrl, escapeHtml } from '../lib/export/html'
import { noteToDocx, imageSize } from '../lib/export/docx'
import { parseMarkdownFile } from '../lib/import'

const MD = `# Ignored heading in body

Intro with **bold**, _italic_, \`code\` and a [link](https://example.com).

## Section

- one
- two
  - nested

1. first
2. second

- [x] done task
- [ ] open task

> a quote

| A | B |
| --- | --- |
| 1 | 2 |

\`\`\`
const x = 1
\`\`\`

---
`

const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

describe('HTML export', () => {
  const doc = markdownToDoc(MD)
  it('renders every block type and escapes text', () => {
    const html = docToHtml(doc)
    expect(html).toContain('<h2>Section</h2>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('<a href="https://example.com">link</a>')
    expect(html).toContain('<ul><li><p>one</p></li>')
    expect(html).toContain('<ol>')
    expect(html).toContain('class="task done"')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<table>')
    expect(html).toContain('<pre><code>const x = 1')
    expect(html).toContain('<hr>')
  })
  it('escapes HTML in text', () => {
    const html = docToHtml(markdownToDoc('<script>alert(1)</script> & done'))
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(escapeHtml('a"b')).toBe('a&quot;b')
  })
  it('builds a standalone document with title, tags and inlined assets', () => {
    const d = markdownToDoc('![shot](/api/attachments/att_1)\n\ntext')
    const html = noteToHtmlDocument({ title: 'My <note>', doc: d, createdAt: new Date('2026-09-01T10:00:00Z'), tags: ['pricing'], context: 'Work' }, { resolveAsset: (src) => (attachmentIdFromUrl(src) === 'att_1' ? 'data:image/png;base64,AAAA' : src) })
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<title>My &lt;note&gt;</title>')
    expect(html).toContain('#pricing')
    expect(html).toContain('src="data:image/png;base64,AAAA"')
    expect(html).not.toContain('window.print')
    expect(noteToHtmlDocument({ title: 't', doc: d, print: true })).toContain('window.print')
  })
  it('renders sheets as tables with computed values', () => {
    const doc = { type: 'doc', content: [{ type: 'sheet', attrs: { sheet: { rows: 3, cols: 2, cells: { A1: '2', A2: '3', A3: '=SUM(A1:A2)' }, formats: {}, charts: [], title: 'Totals' } } }] }
    const html = docToHtml(doc)
    expect(html).toContain('<figcaption>Totals</figcaption>')
    expect(html).toContain('>5<')
  })
})

describe('DOCX export', () => {
  it('produces a valid docx containing the text, lists, tables and an image', async () => {
    const d = markdownToDoc(MD + '\n![shot](/api/attachments/att_1)\n')
    const buf = await noteToDocx({ title: 'Report', doc: d, createdAt: new Date(), tags: ['q3'], context: 'Work', images: new Map([['att_1', { bytes: new Uint8Array(PNG_1x1), mime: 'image/png' }]]), attachments: [{ name: 'deck.pdf', size: 1234 }] })
    expect(buf.length).toBeGreaterThan(2000)
    const zip = await JSZip.loadAsync(buf)
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml).toContain('Report')
    expect(xml).toContain('Intro with ')
    expect(xml).toContain('<w:tbl>')
    expect(xml).toContain('☑')
    expect(xml).toContain('<w:numPr>')
    expect(xml).toContain('<w:drawing>')
    expect(xml).toContain('deck.pdf')
    expect(Object.keys(zip.files).some((f) => f.startsWith('word/media/'))).toBe(true)
  })
  it('reads PNG and JPEG dimensions', () => {
    expect(imageSize(new Uint8Array(PNG_1x1), 'image/png')).toEqual({ width: 1, height: 1 })
    // Minimal JPEG: SOI, SOF0 with 20x10.
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x0a, 0x00, 0x14, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9])
    expect(imageSize(new Uint8Array(jpg), 'image/jpeg')).toEqual({ width: 20, height: 10 })
    expect(imageSize(new Uint8Array([1, 2, 3]), 'image/webp')).toBeNull()
  })
})

describe('Markdown export round-trips through the importer', () => {
  it('front matter keeps title, date, context and tags', async () => {
    const { noteMarkdown, safeFilename, attachmentFilenames } = await import('../lib/export')
    const note = { id: 'note_1', title: 'Pricing call: "Samsung"', kind: 'note', tags: ['pricing'], manualTags: ['samsung'], sourceUrl: null, createdAt: new Date('2026-09-01T10:00:00Z'), updatedAt: new Date('2026-09-02T10:00:00Z'), contentJson: markdownToDoc('Ask = **40%**\n\n![img](/api/attachments/att_1)') } as never
    const att = [{ id: 'att_1', name: 'shot.png', mime: 'image/png', size: 10, data: PNG_1x1.toString('base64'), storageUrl: null, noteId: 'note_1', taskId: null, durationSeconds: null, createdAt: new Date() }, { id: 'att_2', name: 'shot.png', mime: 'image/png', size: 10, data: null, storageUrl: null, noteId: 'note_1', taskId: null, durationSeconds: null, createdAt: new Date() }] as never
    const md = noteMarkdown({ note, context: { slug: 'work', name: 'Work' } as never, attachments: att, tags: ['samsung', 'pricing'] })
    expect(md.startsWith('---\n')).toBe(true)
    expect(md).toContain('title: "Pricing call: \\"Samsung\\""')
    expect(md).toContain('context: work')
    expect(md).toContain('tags: samsung, pricing')
    expect(md).toContain('](attachments/shot.png)')
    expect(md).toContain('- [shot-2.png](attachments/shot-2.png)')
    const parsed = parseMarkdownFile({ name: 'x.md', text: md })
    expect(parsed.title).toBe('Pricing call: "Samsung"')
    expect(parsed.createdAt?.toISOString()).toBe('2026-09-01T10:00:00.000Z')
    expect(parsed.contextSlug).toBe('work')
    expect(parsed.markdown).toContain('Ask = **40%**')
    expect(safeFilename('a/b:c*d?"e<f>g|h')).toBe('a b c d e f g h')
    expect(safeFilename('   ')).toBe('Untitled')
    expect(Array.from(attachmentFilenames(att).values())).toEqual(['shot.png', 'shot-2.png'])
  })
})

describe('Markdown images', () => {
  it('a line that is only an image becomes a block image node, inline ones a link', () => {
    const doc = markdownToDoc('before\n\n![Shot of the deck](attachments/shot.png)\n\nafter with ![inline](x.png) here')
    expect(doc.content?.[1]).toEqual({ type: 'image', attrs: { src: 'attachments/shot.png', alt: 'Shot of the deck' } })
    const last = doc.content?.[2]
    expect(last?.type).toBe('paragraph')
    expect(last?.content?.some((n) => n.marks?.some((m) => m.type === 'link' && m.attrs?.href === 'x.png'))).toBe(true)
    expect(docToHtml(doc)).toContain('<figure><img src="attachments/shot.png" alt="Shot of the deck"></figure>')
  })
})
