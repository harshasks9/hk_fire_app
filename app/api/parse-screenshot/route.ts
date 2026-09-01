import { NextRequest, NextResponse } from 'next/server'
import { geminiConfigured, parseFillScreenshot } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!geminiConfigured()) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set — enter the fill by form instead.' }, { status: 503 })
  }
  const form = await req.formData()
  const file = form.get('screenshot')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no file' }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'file too large (8MB max)' }, { status: 413 })
  }
  const buf = Buffer.from(await file.arrayBuffer())
  const parsed = await parseFillScreenshot(buf.toString('base64'), file.type || 'image/png')
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 502 })
  // Parsed fields prefill an EDITABLE form — nothing is saved without confirmation.
  return NextResponse.json(parsed)
}
