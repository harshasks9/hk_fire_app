import { NextRequest, NextResponse } from 'next/server'
import { resolveContext } from '@/lib/context'
import { addAttachment, addSource, createNote, fetchLinkPreview, scheduleProcessing } from '@/lib/notes'
import { describeImage, transcribeAudio } from '@/lib/media'
import { getDb, schema } from '@/lib/db'
import { asc, eq } from 'drizzle-orm'
import { resolveToken } from '@/lib/tokens'
import { docToText, markdownToDoc } from '@/lib/markdown'
import { wordCount } from '@/lib/util'
import { assertQuota } from '@/lib/plans'
import { apiError } from '@/lib/api'
import { getSession } from '@/lib/session'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Quick capture: text, URL, screenshot/image, audio or file. AI does the filing. */
export async function POST(req: NextRequest) {
  // Two ways in: the session cookie (the app itself) or a personal capture token (shortcuts, automations).
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  let form: FormData
  if ((req.headers.get('content-type') ?? '').includes('application/json')) {
    const j = (await req.json().catch(() => ({}))) as { text?: string; url?: string; context?: string; contextId?: string; capturedAt?: string }
    form = new FormData()
    form.set('text', [j.text ?? '', j.url ?? ''].filter(Boolean).join('\n').trim())
    if (j.context) form.set('context', j.context)
    if (j.contextId) form.set('contextId', j.contextId)
    if (j.capturedAt) form.set('capturedAt', j.capturedAt)
  } else {
    form = await req.formData()
  }
  let ctx: Awaited<ReturnType<typeof resolveContext>>
  if (bearer) {
    const t = await resolveToken(bearer)
    if (!t) return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 })
    const db0 = await getDb()
    const all = await db0.select().from(schema.contexts).where(eq(schema.contexts.notebookId, t.notebook.id)).orderBy(asc(schema.contexts.position))
    const wanted = String(form.get('context') ?? form.get('contextId') ?? '')
    const picked = all.find((c) => c.slug === wanted || c.id === wanted) ?? all.find((c) => c.slug === 'work') ?? all[0]
    if (!picked) return NextResponse.json({ error: 'This notebook has no contexts' }, { status: 400 })
    ctx = picked
  } else {
    ctx = await resolveContext(String(form.get('contextId') ?? '') || undefined)
  }
  try {
    const nb = bearer ? (await resolveToken(bearer))?.notebook : (await getSession())?.notebook
    if (nb) await assertQuota(nb, 'notes')
  } catch (e) {
    return apiError(e)
  }
  const text = String(form.get('text') ?? '').trim()
  // Offline captures replay later; keep the moment they were written.
  const capturedAtRaw = String(form.get('capturedAt') ?? '')
  const capturedAt = capturedAtRaw && !Number.isNaN(Date.parse(capturedAtRaw)) ? new Date(capturedAtRaw) : undefined
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (!text && files.length === 0) return NextResponse.json({ error: 'Nothing to capture' }, { status: 400 })
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
  const id = await createNote({ contextId: ctx.id, title, markdown: body, kind, source: bearer ? 'api' : 'quick-capture', sourceUrl: urlMatch?.[0], status: 'inbox', createdAt: capturedAt })
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
