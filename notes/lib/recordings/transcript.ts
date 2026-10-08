/*
  Transcript understanding that needs no model: turning whatever a phone,
  a transcription app or a meeting tool produced into speaker-labelled,
  time-stamped segments, and rendering the structured note we build from it.

  Accepted shapes (auto-detected):
  - "Speaker 1: text" / "Thomas: text" lines (Gemini, Otter, Teams, Zoom exports)
  - "[00:12:34] Thomas: text", "00:12 Thomas: text", "12:34 — text"
  - WebVTT and SRT subtitle files
  - JSON: [{ "t": 12, "speaker": "Thomas", "text": "..." }] or { "segments": [...] }
  - Plain paragraphs (Apple Voice Memos / Notes transcripts): one segment per paragraph
*/
import type { TranscriptSegment } from '../db/schema'

export interface ParsedTranscript {
  segments: TranscriptSegment[]
  hasSpeakers: boolean
  hasTimes: boolean
  format: 'json' | 'vtt' | 'srt' | 'speakers' | 'plain'
}

const GENERIC_SPEAKER = /^(speaker|spk|unknown|participant|person|voice)\s*[-_ ]?\s*(\d+|[a-z])?$/i

/** True for labels like "Speaker 1" that diarization produces when it cannot tell who is talking. */
export function isGenericSpeaker(label: string): boolean {
  return GENERIC_SPEAKER.test(label.trim())
}

function parseClock(s: string): number | null {
  // 1:02:03.456 | 02:03 | 02:03,456 | 63.5
  const m = s.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/)
  if (m) return (m[1] ? Number(m[1]) * 3600 : 0) + Number(m[2]) * 60 + Number(m[3]) + (m[4] ? Number(m[4].padEnd(3, '0')) / 1000 : 0)
  if (/^\d+(\.\d+)?$/.test(s.trim())) return Number(s)
  return null
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function parseJson(raw: string): TranscriptSegment[] | null {
  const t = raw.trim()
  if (!(t.startsWith('[') || t.startsWith('{'))) return null
  try {
    const j = JSON.parse(t) as unknown
    const arr = Array.isArray(j) ? j : j && typeof j === 'object' && Array.isArray((j as { segments?: unknown }).segments) ? (j as { segments: unknown[] }).segments : null
    if (!arr) return null
    const out: TranscriptSegment[] = []
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue
      const o = item as Record<string, unknown>
      const text = cleanText(String(o.text ?? o.content ?? o.transcript ?? ''))
      if (!text) continue
      const tRaw = o.t ?? o.start ?? o.startTime ?? o.offset ?? 0
      const time = typeof tRaw === 'number' ? tRaw : (parseClock(String(tRaw)) ?? 0)
      const speaker = cleanText(String(o.speaker ?? o.speakerName ?? o.name ?? o.who ?? '')) || 'Speaker'
      out.push({ t: Math.max(0, Math.round(time * 10) / 10), speaker, text })
    }
    return out.length ? out : null
  } catch {
    return null
  }
}

function parseSubtitles(raw: string, kind: 'vtt' | 'srt'): TranscriptSegment[] {
  const blocks = raw.replace(/\r/g, '').split(/\n{2,}/)
  const out: TranscriptSegment[] = []
  for (const b of blocks) {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) continue
    const ti = lines.findIndex((l) => /-->/.test(l))
    if (ti < 0) continue
    const start = parseClock(lines[ti]!.split('-->')[0]!.trim().split(' ')[0]!) ?? 0
    let text = lines.slice(ti + 1).join(' ')
    let speaker = 'Speaker'
    const v = text.match(/^<v\s+([^>]+)>/)
    if (v) {
      speaker = v[1]!.trim()
      text = text.replace(v[0], '')
    }
    text = text.replace(/<[^>]+>/g, '')
    const labelled = text.match(/^([A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*){0,3}|Speaker\s*\d+):\s+(.+)$/)
    if (labelled) {
      speaker = labelled[1]!
      text = labelled[2]!
    }
    text = cleanText(text)
    if (!text) continue
    const prev = out[out.length - 1]
    if (prev && prev.speaker === speaker && kind === 'srt' && start - prev.t < 12 && prev.text.length < 400) prev.text += ' ' + text
    else out.push({ t: start, speaker, text })
  }
  return out
}

// "[00:12:34] Name: text" | "00:12 Name: text" | "Name (00:12): text" | "Name: text" | "[12:34] text"
const LINE = /^\s*(?:\[?(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)\]?\s*[-–—]?\s*)?(?:([^:\n]{1,48}?)\s*(?:\((\d{1,2}:\d{2}(?::\d{2})?)\))?\s*:\s+)?(.+)$/

function parseLines(raw: string): { segments: TranscriptSegment[]; hasSpeakers: boolean; hasTimes: boolean } {
  const lines = raw.replace(/\r/g, '').split('\n')
  const segments: TranscriptSegment[] = []
  let hasSpeakers = false
  let hasTimes = false
  let lastT = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const m = line.match(LINE)
    if (!m) continue
    const [, t1, who, t2, text] = m
    const time = parseClock(t1 ?? t2 ?? '')
    const speakerRaw = who ? cleanText(who) : ''
    // A label is a speaker only if it looks like a name or a diarization label, not a sentence fragment.
    const looksLikeSpeaker = Boolean(speakerRaw) && speakerRaw.split(' ').length <= 4 && !/[.!?,]$/.test(speakerRaw) && (/^[A-Z0-9]/.test(speakerRaw) || isGenericSpeaker(speakerRaw))
    const speaker = looksLikeSpeaker ? speakerRaw : ''
    const body = cleanText(looksLikeSpeaker ? text! : who ? `${who}: ${text}` : text!)
    if (!body) continue
    if (time != null) {
      hasTimes = true
      lastT = time
    }
    if (speaker) hasSpeakers = true
    const prev = segments[segments.length - 1]
    if (!speaker && prev && time == null) {
      // Continuation of the previous speaker's paragraph.
      prev.text += ' ' + body
      continue
    }
    segments.push({ t: time ?? lastT, speaker: speaker || prev?.speaker || 'Speaker', text: body })
  }
  return { segments, hasSpeakers, hasTimes }
}

export function parseTranscript(raw: string, hint?: { filename?: string; mime?: string }): ParsedTranscript {
  const name = (hint?.filename ?? '').toLowerCase()
  const text = raw.replace(/^﻿/, '')
  if (name.endsWith('.json') || hint?.mime === 'application/json' || /^\s*[[{]/.test(text)) {
    const j = parseJson(text)
    if (j) return { segments: j, hasSpeakers: j.some((s) => s.speaker !== 'Speaker'), hasTimes: j.some((s) => s.t > 0), format: 'json' }
  }
  if (/^\s*WEBVTT/.test(text) || name.endsWith('.vtt')) {
    const segments = parseSubtitles(text.replace(/^\s*WEBVTT[^\n]*\n/, ''), 'vtt')
    return { segments, hasSpeakers: segments.some((s) => s.speaker !== 'Speaker'), hasTimes: true, format: 'vtt' }
  }
  if (name.endsWith('.srt') || /^\s*1\s*\n\s*\d{2}:\d{2}:\d{2},\d{3}\s+-->/.test(text)) {
    const segments = parseSubtitles(text, 'srt')
    return { segments, hasSpeakers: segments.some((s) => s.speaker !== 'Speaker'), hasTimes: true, format: 'srt' }
  }
  const parsed = parseLines(text)
  if (parsed.hasSpeakers || parsed.hasTimes) return { ...parsed, format: 'speakers' }
  // Plain prose: one segment per paragraph so the note keeps its shape.
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(cleanText)
    .filter(Boolean)
  return { segments: paragraphs.map((p) => ({ t: 0, speaker: 'Speaker', text: p })), hasSpeakers: false, hasTimes: false, format: 'plain' }
}

/** Replace generic labels with the people the model identified. Unknown labels are left alone. */
export function applySpeakerMap(segments: TranscriptSegment[], map: Record<string, string>): TranscriptSegment[] {
  const norm = new Map<string, string>()
  for (const [k, v] of Object.entries(map)) if (k.trim() && v.trim()) norm.set(k.trim().toLowerCase(), v.trim())
  return segments.map((s) => ({ ...s, speaker: norm.get(s.speaker.trim().toLowerCase()) ?? s.speaker }))
}

export function transcriptToText(segments: TranscriptSegment[], opts: { times?: boolean } = {}): string {
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
  const single = new Set(segments.map((s) => s.speaker)).size <= 1
  return segments
    .map((s) => `${opts.times && s.t > 0 ? `[${fmt(s.t)}] ` : ''}${single && s.speaker === 'Speaker' ? '' : `${s.speaker}: `}${s.text}`)
    .join('\n')
}

export function transcriptStats(segments: TranscriptSegment[]) {
  const words = segments.reduce((n, s) => n + s.text.split(/\s+/).filter(Boolean).length, 0)
  const speakers = [...new Set(segments.map((s) => s.speaker))]
  const lastT = segments.reduce((m, s) => Math.max(m, s.t), 0)
  return { words, speakers, durationHint: lastT > 0 ? lastT : null }
}

/* ------------------------------ structured note ------------------------------ */

export interface StructuredMeeting {
  title: string
  /** Speaker label → who it is, plus role/company when known. */
  attendees: { speaker?: string; name: string; role?: string; company?: string; confidence?: number }[]
  purpose: string
  summary: string[]
  keyPoints: string[]
  decisions: { statement: string; reasoning?: string }[]
  actions: { title: string; owner?: string; due?: string }[]
  questions: string[]
  numbers: { label: string; value: string; entity?: string }[]
  nextSteps: string[]
  /** How this connects to what the notebook already knew ("Follow-up to the 3 Sep call: the 3% buffer is still open"). */
  context: string[]
  risks: string[]
}

export function emptyStructure(title = ''): StructuredMeeting {
  return { title, attendees: [], purpose: '', summary: [], keyPoints: [], decisions: [], actions: [], questions: [], numbers: [], nextSteps: [], context: [], risks: [] }
}

/** The meeting note body. The transcript itself is appended by the caller so the raw source travels with the note. */
export function renderStructuredMarkdown(s: StructuredMeeting, meta: { when: Date; durationSeconds?: number | null; source: string }): string {
  const lines: string[] = []
  const when = meta.when.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const dur = meta.durationSeconds && meta.durationSeconds > 0 ? ` · ${Math.round(meta.durationSeconds / 60)} min` : ''
  lines.push(`_Structured from a ${meta.source} on ${when}${dur}. The full transcript is at the bottom._`)
  if (s.attendees.length) {
    lines.push('', '## Attendees', ...s.attendees.map((a) => `- ${a.name}${a.role ? ` — ${a.role}` : ''}${a.company ? ` (${a.company})` : ''}${a.speaker && a.speaker.toLowerCase() !== a.name.toLowerCase() ? ` · ${a.speaker}` : ''}`))
  }
  if (s.purpose) lines.push('', '## Purpose', s.purpose)
  if (s.context.length) lines.push('', '## Context', ...s.context.map((c) => `- ${c}`))
  if (s.summary.length) lines.push('', '## Summary', ...s.summary.map((x) => `- ${x}`))
  if (s.keyPoints.length) lines.push('', '## Key points', ...s.keyPoints.map((x) => `- ${x}`))
  if (s.decisions.length) lines.push('', '## Decisions', ...s.decisions.map((d) => `- ${d.statement}${d.reasoning ? ` — _${d.reasoning}_` : ''}`))
  if (s.actions.length) lines.push('', '## Action items', ...s.actions.map((a) => `- [ ] ${a.owner ? `**${a.owner}**: ` : ''}${a.title}${a.due ? ` (due ${a.due})` : ''}`))
  if (s.questions.length) lines.push('', '## Open questions', ...s.questions.map((q) => `- ${q}`))
  if (s.numbers.length) lines.push('', '## Numbers mentioned', ...s.numbers.map((n) => `- ${n.entity ? `${n.entity} · ` : ''}${n.label}: **${n.value}**`))
  if (s.risks.length) lines.push('', '## Risks', ...s.risks.map((r) => `- ${r}`))
  if (s.nextSteps.length) lines.push('', '## Next steps', ...s.nextSteps.map((n) => `- ${n}`))
  return lines.join('\n')
}

/** Filing needs a speaker map keyed exactly by the labels in the transcript. */
export function speakerMapFrom(attendees: StructuredMeeting['attendees'], labels: string[], minConfidence = 0.6): Record<string, string> {
  const out: Record<string, string> = {}
  const known = new Set(labels.map((l) => l.toLowerCase()))
  for (const a of attendees) {
    if (!a.speaker || !a.name) continue
    if (!known.has(a.speaker.toLowerCase())) continue
    if ((a.confidence ?? 1) < minConfidence) continue
    if (a.speaker.toLowerCase() === a.name.toLowerCase()) continue
    out[a.speaker] = a.name
  }
  return out
}
