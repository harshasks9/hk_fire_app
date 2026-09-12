import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { assertQuota } from '@/lib/plans'
import { apiError } from '@/lib/api'
import { getActiveContext } from '@/lib/context'
import { addAttachment, addSource, createNote, scheduleProcessing } from '@/lib/notes'
import { transcribeAudio } from '@/lib/media'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { docToText, markdownToDoc } from '@/lib/markdown'
import { wordCount } from '@/lib/util'
export const maxDuration = 90

/** Voice note: audio + (optional) client-side live transcript. Server transcription when Gemini is configured. */
export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const form = await req.formData()
  const audio = form.get('audio')
  const clientTranscript = String(form.get('transcript') ?? '').trim()
  const duration = Number(form.get('duration') ?? 0)
  const title = String(form.get('title') ?? '').trim() || `Voice note — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  let transcript = clientTranscript
  let bytes: Buffer | null = null
  let mime = 'audio/webm'
  if (audio instanceof File && audio.size > 0) {
    bytes = Buffer.from(await audio.arrayBuffer())
    mime = audio.type || mime
    const server = await transcribeAudio(bytes, mime)
    if (server && server.length > transcript.length * 0.5) transcript = server
  }
  const md = transcript ? `## Transcript\n\n${transcript}` : '_No speech was transcribed. The recording is attached._'
  const session = await getSession()
  if (session) { try { await assertQuota(session.notebook, 'notes') } catch (e) { return apiError(e) } }
  const id = await createNote({ contextId: ctx.id, title, markdown: md, kind: 'voice', source: 'voice', status: 'inbox' })
  if (bytes) {
    await addAttachment(id, { name: `voice-${Date.now()}.webm`, mime, bytes, durationSeconds: duration || undefined })
    await addSource(id, { kind: 'audio', title, extractedText: transcript || undefined })
  }
  const db = await getDb()
  const doc = markdownToDoc(md)
  const txt = docToText(doc)
  await db.update(schema.notes).set({ contentJson: doc, contentText: txt, wordCount: wordCount(txt) }).where(eq(schema.notes.id, id))
  scheduleProcessing(id)
  return NextResponse.json({ id }, { status: 201 })
}
