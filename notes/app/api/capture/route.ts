import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { addAttachment, addSource, createNote, fetchLinkPreview, scheduleProcessing } from '@/lib/notes'
import { describeImage, transcribeAudio } from '@/lib/media'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { docToText, markdownToDoc } from '@/lib/markdown'
import { wordCount } from '@/lib/util'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Quick capture: text, URL, screenshot/image, audio or file. AI does the filing. */
export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const form = await req.formData()
  const text = String(form.get('text') ?? '').trim()
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  const urlMatch = text.match(/https?:\/\/\S+/)
  let kind: 'capture' | 'link' | 'screenshot' | 'voice' | 'document' = 'capture'
  let title = ''
  let body = text
  const db = await getDb()

  if (urlMatch && text.replace(urlMatch[0], '').trim().length < 200) {
    kind = 'link'
    const preview = await fetchLinkPreview(urlMatch[0])
    title = preview.title
    const comment = text.replace(urlMatch[0], '').trim()
    body = [comment, preview.description, preview.text ? `> ${preview.text.slice(0, 1200)}` : '', `Source: ${urlMatch[0]}`].filter(Boolean).join('\n\n')
  }
  const id = await createNote({ contextId: ctx.id, title, markdown: body, kind, source: 'quick-capture', sourceUrl: urlMatch?.[0], status: 'inbox' })
  if (urlMatch) await addSource(id, { kind: 'url', url: urlMatch[0], title })

  const extra: string[] = []
  for (const f of files) {
    const bytes = Buffer.from(await f.arrayBuffer())
    await addAttachment(id, { name: f.name || 'file', mime: f.type || 'application/octet-stream', bytes })
    if (f.type.startsWith('image/')) {
      kind = kind === 'capture' ? 'screenshot' : kind
      const desc = await describeImage(bytes, f.type)
      extra.push(desc ? `**${f.name || 'Screenshot'}** — ${desc}` : `Screenshot attached: ${f.name || 'image'}.`)
      await addSource(id, { kind: 'screenshot', title: f.name, extractedText: desc ?? undefined })
    } else if (f.type.startsWith('audio/')) {
      kind = 'voice'
      const t = await transcribeAudio(bytes, f.type)
      extra.push(t ? `## Transcript\n\n${t}` : `Audio attached: ${f.name}.`)
      await addSource(id, { kind: 'audio', title: f.name, extractedText: t ?? undefined })
    } else if (/text\/|markdown|json|csv/.test(f.type) || /\.(md|txt|csv)$/i.test(f.name)) {
      const t = bytes.toString('utf8').slice(0, 20000)
      extra.push(`## ${f.name}\n\n${t}`)
      kind = kind === 'capture' ? 'document' : kind
      await addSource(id, { kind: 'file', title: f.name, extractedText: t })
    } else {
      extra.push(`File attached: ${f.name} (${Math.round(f.size / 1024)} KB).`)
      kind = kind === 'capture' ? 'document' : kind
      await addSource(id, { kind: f.type === 'application/pdf' ? 'pdf' : 'file', title: f.name })
    }
  }
  if (extra.length || kind !== 'capture') {
    const md = [body, ...extra].filter(Boolean).join('\n\n')
    const doc = markdownToDoc(md)
    const txt = docToText(doc)
    await db.update(schema.notes).set({ kind, contentJson: doc, contentText: txt, wordCount: wordCount(txt), title: title || (kind === 'screenshot' ? 'Screenshot' : kind === 'voice' ? 'Voice note' : '') }).where(eq(schema.notes.id, id))
  }
  scheduleProcessing(id)
  return NextResponse.json({ id, kind }, { status: 201 })
}
