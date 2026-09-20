/* Media understanding boundary. With Gemini configured, images are described/OCR'd, documents without a text layer are read, and audio is transcribed; otherwise these return null and the UI falls back to client-side transcription or a plain attachment. */
import { logAiCall } from './ai/log'
import { effectiveKeys } from './ai/scope'
import { withNotebookAi } from './session'
import { resolveGeminiModels } from './ai/gemini-models'
import { geminiFetch } from './ai/gemini-retry'

const API = 'https://generativelanguage.googleapis.com/v1beta/models'
const FILES_API = 'https://generativelanguage.googleapis.com/v1beta/files'
const UPLOAD_API = 'https://generativelanguage.googleapis.com/upload/v1beta/files'
/** Inline request bodies are capped at 20 MB by Gemini; above this the audio goes through the Files API. */
const INLINE_LIMIT = 14 * 1024 * 1024

function apiKey(): string | undefined {
  const keys = effectiveKeys()
  return keys.preference === 'local' ? undefined : keys.gemini
}

async function gemini(parts: unknown[], purpose: string, opts: { maxOutputTokens?: number; timeoutMs?: number } = {}): Promise<string | null> {
  const key = apiKey()
  if (!key) return null
  const model = (await resolveGeminiModels(key)).generation
  const started = Date.now()
  const attempt = async (maxOutputTokens: number) => {
    const { res, errorText } = await geminiFetch(
      `${API}/${model}:generateContent`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { maxOutputTokens } }), signal: AbortSignal.timeout(opts.timeoutMs ?? 60_000) },
      { maxWaitMs: 30_000 },
    )
    return { res, errorText }
  }
  try {
    let { res, errorText } = await attempt(opts.maxOutputTokens ?? 8192)
    // Older models reject a large output budget: fall back to the classic limit.
    if (res.status === 400 && (opts.maxOutputTokens ?? 0) > 8192 && /max_output_tokens|maxOutputTokens/i.test(errorText)) ({ res, errorText } = await attempt(8192))
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${errorText.slice(0, 160)}`)
    const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] }
    const text = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim()
    await logAiCall({ provider: 'gemini', model, purpose, ok: true, outputChars: text.length, durationMs: Date.now() - started })
    return text || null
  } catch (err) {
    await logAiCall({ provider: 'gemini', model, purpose, ok: false, error: String(err).slice(0, 200), durationMs: Date.now() - started })
    return null
  }
}

export async function describeImage(bytes: Buffer, mime: string): Promise<string | null> {
  return withNotebookAi(() => gemini([{ text: 'Transcribe all text in this image verbatim, then add one sentence describing what it shows. Plain text.' }, { inlineData: { mimeType: mime, data: bytes.toString('base64') } }], 'describe-image'))
}

export async function transcribeAudio(bytes: Buffer, mime: string): Promise<string | null> {
  return withNotebookAi(() => gemini([{ text: 'Transcribe this audio verbatim as plain text. If there are multiple speakers, prefix lines with "Speaker 1:", "Speaker 2:".' }, { inlineData: { mimeType: mime, data: bytes.toString('base64') } }], 'transcribe-audio'))
}

const MEETING_PROMPT = `Transcribe this meeting recording verbatim.
Format: one line per turn, "[m:ss] Speaker N: text" where m:ss is the time the turn starts and Speaker N is a consistent label per distinct voice (Speaker 1, Speaker 2, ...). If a speaker introduces themselves or is addressed by name, still keep the label and let the name appear in the text. Keep every sentence; do not summarize; do not add commentary. Write numbers as spoken (e.g. $7.6M, 3%). Output plain text only.`

/**
 * Meeting recordings: diarized, time-stamped, no length limit beyond the model's.
 * Small files go inline; larger ones are uploaded through the Files API first.
 * Must run inside an AI scope (the caller wraps it).
 */
export async function transcribeMeetingAudio(bytes: Buffer, mime: string, opts: { displayName?: string } = {}): Promise<string | null> {
  const key = apiKey()
  if (!key) return null
  const mediaPart = bytes.length <= INLINE_LIMIT ? { inlineData: { mimeType: mime, data: bytes.toString('base64') } } : { fileData: { mimeType: mime, fileUri: await uploadToFilesApi(key, bytes, mime, opts.displayName ?? 'recording') } }
  return gemini([{ text: MEETING_PROMPT }, mediaPart], 'transcribe-meeting', { maxOutputTokens: 65536, timeoutMs: 280_000 })
}

const DOCUMENT_PROMPT = `Read this document and return its full text as Markdown.
Keep the reading order, headings (as # / ## / ###), lists, and tables (as Markdown tables). Reproduce numbers, dates, names and amounts exactly as written; do not summarize, do not add commentary. For a form or a scanned letter, transcribe every field and its value. If a page is an image without text, write one line in italics describing it. Output Markdown only.`

/**
 * Read a document the deterministic parsers cannot (a scanned PDF, a photo of a page, a screenshot of a table).
 * PDFs and images go to Gemini directly; larger files travel through the Files API. Null when no key is configured.
 */
export async function readDocumentWithModel(bytes: Buffer, mime: string, name = 'document'): Promise<string | null> {
  return withNotebookAi(async () => {
    const key = apiKey()
    if (!key) return null
    const part = bytes.length <= INLINE_LIMIT ? { inlineData: { mimeType: mime, data: bytes.toString('base64') } } : { fileData: { mimeType: mime, fileUri: await uploadToFilesApi(key, bytes, mime, name) } }
    return gemini([{ text: DOCUMENT_PROMPT }, part], 'read-document', { maxOutputTokens: 65536, timeoutMs: 240_000 })
  })
}

/** Resumable upload; returns the file URI once Gemini reports it ACTIVE. */
async function uploadToFilesApi(key: string, bytes: Buffer, mime: string, displayName: string): Promise<string> {
  const start = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: {
      'x-goog-api-key': key,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(bytes.length),
      'X-Goog-Upload-Header-Content-Type': mime,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!start.ok) throw new Error(`Files API start HTTP ${start.status}: ${(await start.text()).slice(0, 160)}`)
  const uploadUrl = start.headers.get('x-goog-upload-url')
  if (!uploadUrl) throw new Error('Files API did not return an upload URL')
  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Length': String(bytes.length), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(180_000),
  })
  if (!up.ok) throw new Error(`Files API upload HTTP ${up.status}: ${(await up.text()).slice(0, 160)}`)
  const j = (await up.json()) as { file?: { name?: string; uri?: string; state?: string } }
  const name = j.file?.name
  let uri = j.file?.uri
  let state = j.file?.state
  if (!name || !uri) throw new Error('Files API upload returned no file')
  // Audio is usually ACTIVE immediately; poll briefly otherwise.
  for (let i = 0; i < 20 && state && state !== 'ACTIVE'; i++) {
    if (state === 'FAILED') throw new Error('Files API processing failed')
    await new Promise((r) => setTimeout(r, 2000))
    const g = await fetch(`${FILES_API}/${name.replace(/^files\//, '')}`, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(15_000) })
    if (!g.ok) break
    const f = (await g.json()) as { uri?: string; state?: string }
    state = f.state
    uri = f.uri ?? uri
  }
  return uri
}

export function mediaCapabilities() {
  const keys = effectiveKeys()
  const on = Boolean(keys.gemini) && keys.preference !== 'local'
  return { serverTranscription: on, imageUnderstanding: on }
}
