/* Media understanding boundary. With Gemini configured, images are described/OCR'd and audio is transcribed; otherwise these return null and the UI falls back to client-side transcription or a plain attachment. */
import { logAiCall } from './ai/log'

const API = 'https://generativelanguage.googleapis.com/v1beta/models'

async function gemini(parts: unknown[], purpose: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const started = Date.now()
  try {
    const res = await fetch(`${API}/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ role: 'user', parts }] }), signal: AbortSignal.timeout(60_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim()
    await logAiCall({ provider: 'gemini', model, purpose, ok: true, outputChars: text.length, durationMs: Date.now() - started })
    return text || null
  } catch (err) {
    await logAiCall({ provider: 'gemini', model, purpose, ok: false, error: String(err).slice(0, 200), durationMs: Date.now() - started })
    return null
  }
}

export async function describeImage(bytes: Buffer, mime: string): Promise<string | null> {
  return gemini([{ text: 'Transcribe all text in this image verbatim, then add one sentence describing what it shows. Plain text.' }, { inlineData: { mimeType: mime, data: bytes.toString('base64') } }], 'describe-image')
}

export async function transcribeAudio(bytes: Buffer, mime: string): Promise<string | null> {
  return gemini([{ text: 'Transcribe this audio verbatim as plain text. If there are multiple speakers, prefix lines with "Speaker 1:", "Speaker 2:".' }, { inlineData: { mimeType: mime, data: bytes.toString('base64') } }], 'transcribe-audio')
}

export function mediaCapabilities() {
  return { serverTranscription: Boolean(process.env.GEMINI_API_KEY), imageUnderstanding: Boolean(process.env.GEMINI_API_KEY) }
}
