import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { AUDIO_MIMES, MAX_AUDIO_BYTES, TRANSCRIPT_EXT, startRecording, actorFromRequest } from '@/lib/recordings/ingest'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Post a meeting recording or its transcript.
 *   JSON:      { transcript, title?, context?, recordedAt?, participants?: string[] | string, notes? }
 *   multipart: audio=<file> and/or transcript=<file|text>, plus the same optional fields.
 * Responds 202 with the meeting to open; structuring continues in the background.
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await actorFromRequest(req)
    if (actor instanceof NextResponse) return actor
    const ct = req.headers.get('content-type') ?? ''
    let fields: Record<string, string> = {}
    let transcript: { text: string; filename?: string; mime?: string } | undefined
    let audio: { name: string; mime: string; bytes: Buffer; durationSeconds?: number } | undefined
    if (ct.includes('application/json')) {
      const j = (await req.json().catch(() => ({}))) as Record<string, unknown>
      for (const k of ['title', 'context', 'contextId', 'recordedAt', 'notes', 'duration']) if (j[k] != null) fields[k] = String(j[k])
      fields.participants = Array.isArray(j.participants) ? (j.participants as unknown[]).map(String).join(', ') : String(j.participants ?? '')
      const t = String(j.transcript ?? j.text ?? '')
      if (t.trim()) transcript = { text: t }
    } else if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) if (typeof v === 'string') fields[k] = v
      const t = form.get('transcript')
      if (t instanceof File && t.size > 0) transcript = { text: await t.text(), filename: t.name, mime: t.type }
      else if (typeof t === 'string' && t.trim()) transcript = { text: t }
      const files = [form.get('audio'), form.get('file'), ...form.getAll('files')].filter((f): f is File => f instanceof File && f.size > 0)
      for (const f of files) {
        if (AUDIO_MIMES.test(f.type) || /\.(m4a|mp3|wav|aac|ogg|opus|webm|caf|aiff?|mp4|mov)$/i.test(f.name)) {
          if (f.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: `Recording is larger than ${Math.round(MAX_AUDIO_BYTES / 1048576)} MB. Use the Import page for large files.` }, { status: 413 })
          audio = { name: f.name || 'recording.m4a', mime: f.type || 'audio/mp4', bytes: Buffer.from(await f.arrayBuffer()), durationSeconds: fields.duration ? Number(fields.duration) || undefined : undefined }
        } else if (!transcript && (TRANSCRIPT_EXT.test(f.name) || /^text\/|json/.test(f.type))) {
          transcript = { text: await f.text(), filename: f.name, mime: f.type }
        }
      }
    } else {
      // Plain text body: the transcript itself.
      const t = await req.text()
      if (t.trim()) transcript = { text: t }
    }
    const recordedAt = fields.recordedAt ? new Date(fields.recordedAt) : undefined
    const r = await startRecording({
      actor,
      context: fields.context ?? fields.contextId,
      title: fields.title,
      recordedAt,
      participants: (fields.participants ?? '').split(/,|;/).map((s) => s.trim()).filter(Boolean),
      notes: fields.notes,
      transcript,
      audio,
    })
    const origin = req.headers.get('x-forwarded-host') ? `https://${req.headers.get('x-forwarded-host')}` : req.nextUrl.origin
    return NextResponse.json({ ...r, status: 'queued', url: `${origin}/meetings/${r.meetingId}` }, { status: 202 })
  } catch (e) {
    return apiError(e)
  }
}
