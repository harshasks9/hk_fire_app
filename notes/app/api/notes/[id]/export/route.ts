import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { getNote } from '@/lib/queries'
import { loadExportNote, noteDocx, noteHtml, noteMarkdown, noteZip, safeFilename, type ExportFormat, EXPORT_FORMATS } from '@/lib/export'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * One note as a file. `?format=md|html|docx|zip|json`; `html` with `&print=1` renders inline and opens the
 * print dialog, which is the "Save as PDF" path in every browser.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const format = (req.nextUrl.searchParams.get('format') ?? 'md') as ExportFormat
  if (!EXPORT_FORMATS.includes(format)) return NextResponse.json({ error: `format must be one of ${EXPORT_FORMATS.join(', ')}` }, { status: 400 })
  const e = await loadExportNote(id)
  if (!e) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const base = safeFilename(e.note.title)
  const download = (body: string | Buffer, type: string, ext: string, inline = false) =>
    new NextResponse(body as BodyInit, { headers: { 'Content-Type': type, 'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(base)}.${ext}"; filename*=UTF-8''${encodeURIComponent(base)}.${ext}`, 'Cache-Control': 'private, no-store' } })
  switch (format) {
    case 'md': return download(noteMarkdown(e), 'text/markdown; charset=utf-8', 'md')
    case 'html': {
      const print = req.nextUrl.searchParams.get('print') === '1'
      return download(noteHtml(e, { print }), 'text/html; charset=utf-8', 'html', print)
    }
    case 'docx': return download(await noteDocx(e), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')
    case 'zip': return download(await noteZip(e), 'application/zip', 'zip')
    case 'json': {
      const d = await getNote(id)
      return download(JSON.stringify(d, null, 2), 'application/json; charset=utf-8', 'json')
    }
  }
}
