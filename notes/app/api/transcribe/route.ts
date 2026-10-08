import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio, mediaCapabilities } from '@/lib/media'
import { withNotebookAi } from '@/lib/session'
export const maxDuration = 90
/** Standalone transcription endpoint (used by live meeting mode when the browser has no speech API). */
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const audio = form.get('audio')
  if (!(audio instanceof File)) return NextResponse.json({ error: 'audio required' }, { status: 400 })
  return withNotebookAi(async () => {
    if (!mediaCapabilities().serverTranscription) return NextResponse.json({ text: null, reason: 'no-server-transcription' })
    const text = await transcribeAudio(Buffer.from(await audio.arrayBuffer()), audio.type || 'audio/webm')
    return NextResponse.json({ text })
  })
}
