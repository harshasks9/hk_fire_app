import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { detectKind, extractDocument, htmlToMarkdown, parseDelimited, rowsToMarkdown, titleFromFilename } from '@/lib/documents/extract'

/** A one-page PDF with a real text layer, small enough to write by hand. */
function tinyPdf(text: string): Buffer {
  const content = `BT /F1 18 Tf 40 700 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Title (Quarterly Treasury Review) /Producer (test) >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}

async function tinyDocx(paragraphs: { text: string; style?: string }[]): Promise<Buffer> {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)
  const body = paragraphs.map((p) => `<w:p>${p.style ? `<w:pPr><w:pStyle w:val="${p.style}"/></w:pPr>` : ''}<w:r><w:t>${p.text}</w:t></w:r></w:p>`).join('')
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`)
  return Buffer.from(await zip.generateAsync({ type: 'uint8array' }))
}

describe('detectKind / titles', () => {
  it('recognises documents by extension or MIME', () => {
    expect(detectKind('deck.PDF', '')).toBe('pdf')
    expect(detectKind('x', 'application/pdf')).toBe('pdf')
    expect(detectKind('memo.docx', '')).toBe('docx')
    expect(detectKind('numbers.xlsx', '')).toBe('xlsx')
    expect(detectKind('rows.csv', 'text/csv')).toBe('csv')
    expect(detectKind('page.html', '')).toBe('html')
    expect(detectKind('shot.PNG', 'image/png')).toBe('image')
    expect(detectKind('notes.md', '')).toBe('markdown')
    expect(detectKind('archive.zip', 'application/zip')).toBe('other')
  })
  it('turns a filename into a readable title', () => {
    expect(titleFromFilename('2026-Q3_treasury-review.pdf')).toBe('2026 Q3 treasury review')
  })
})

describe('CSV and tables', () => {
  it('parses quoted fields, embedded commas and CRLF', () => {
    const rows = parseDelimited('name,amount\r\n"Müller, Thomas","1,200"\r\nPriya,300\r\n')
    expect(rows).toEqual([['name', 'amount'], ['Müller, Thomas', '1,200'], ['Priya', '300']])
  })
  it('renders a Markdown table with a header row and escapes pipes', () => {
    const md = rowsToMarkdown([['a', 'b'], ['x|y', '2']]).markdown
    expect(md.split('\n')).toEqual(['| a | b |', '| --- | --- |', '| x\\|y | 2 |'])
  })
  it('extracts a CSV upload into a table note', async () => {
    const ex = await extractDocument({ name: 'pipeline.csv', mime: 'text/csv', bytes: Buffer.from('deal,value\nNissan,7.6M\nSamsung,3%') }, { ai: false })
    expect(ex.method).toBe('csv')
    expect(ex.markdown).toContain('| Nissan | 7.6M |')
    expect(ex.empty).toBe(false)
  })
})

describe('HTML', () => {
  it('keeps headings, lists, links, emphasis and tables', () => {
    const { title, markdown } = htmlToMarkdown(`<html><head><title>Board pack</title><style>p{}</style></head><body><nav>skip</nav><h1>Agenda</h1><p>Read <a href="https://x.test/a">the memo</a> and <strong>decide</strong>.</p><ul><li>Budget</li><li>Hiring</li></ul><table><tr><th>Item</th><th>Cost</th></tr><tr><td>Servers</td><td>$12k</td></tr></table></body></html>`)
    expect(title).toBe('Board pack')
    expect(markdown).toContain('# Agenda')
    expect(markdown).toContain('[the memo](https://x.test/a)')
    expect(markdown).toContain('**decide**')
    expect(markdown).toContain('- Budget')
    expect(markdown).toContain('| Servers | $12k |')
    expect(markdown).not.toContain('skip')
  })
})

describe('text and JSON', () => {
  it('reads front matter and the first heading as the title', async () => {
    const ex = await extractDocument({ name: 'x.md', mime: 'text/markdown', bytes: Buffer.from('---\ntitle: Pricing call\n---\n\nWe agreed on 3%.') }, { ai: false })
    expect(ex.title).toBe('Pricing call')
    expect(ex.markdown).toBe('We agreed on 3%.')
  })
  it('pretty-prints JSON into a code block', async () => {
    const ex = await extractDocument({ name: 'd.json', mime: 'application/json', bytes: Buffer.from('{"a":1}') }, { ai: false })
    expect(ex.method).toBe('json')
    expect(ex.markdown).toContain('"a": 1')
  })
})

describe('PDF', () => {
  it('reads the text layer and the document title', async () => {
    const ex = await extractDocument({ name: 'review.pdf', mime: 'application/pdf', bytes: tinyPdf('Nissan wants a 3% buffer on the POC.') }, { ai: false })
    expect(ex.method).toBe('pdf')
    expect(ex.pages).toBe(1)
    expect(ex.title).toBe('Quarterly Treasury Review')
    expect(ex.markdown).toContain('Nissan wants a 3% buffer')
  })
  it('hands a scanned PDF to the model and marks the result', async () => {
    const ex = await extractDocument({ name: 'scan.pdf', mime: 'application/pdf', bytes: tinyPdf(' ') }, { readWithAi: async () => '# Invoice 42\n\nTotal: $1,200' })
    expect(ex.method).toBe('pdf-ai')
    expect(ex.markdown).toContain('Invoice 42')
    expect(ex.warnings[0]).toMatch(/Scanned PDF/)
  })
  it('reports a scanned PDF it cannot read when there is no model', async () => {
    const ex = await extractDocument({ name: 'scan.pdf', mime: 'application/pdf', bytes: tinyPdf(' ') }, { readWithAi: async () => null })
    expect(ex.empty).toBe(true)
    expect(ex.warnings.join(' ')).toMatch(/no text layer/)
  })
})

describe('DOCX', () => {
  it('converts headings and paragraphs to Markdown', async () => {
    const bytes = await tinyDocx([{ text: 'Vendor shortlist', style: 'Heading1' }, { text: 'Three vendors made the cut.' }])
    const ex = await extractDocument({ name: 'shortlist.docx', mime: '', bytes }, { ai: false })
    expect(ex.method).toBe('docx')
    expect(ex.title).toBe('Vendor shortlist')
    expect(ex.markdown).toContain('Three vendors made the cut.')
  })
})

describe('images and unknown types', () => {
  it('needs the model for images and says so without one', async () => {
    const ex = await extractDocument({ name: 'whiteboard.png', mime: 'image/png', bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }, { readWithAi: async () => null })
    expect(ex.empty).toBe(true)
    expect(ex.warnings[0]).toMatch(/Gemini key/)
  })
  it('attaches unknown types without text', async () => {
    const ex = await extractDocument({ name: 'a.zip', mime: 'application/zip', bytes: Buffer.from('PK') }, { ai: false })
    expect(ex.method).toBe('none')
    expect(ex.empty).toBe(true)
  })
})
