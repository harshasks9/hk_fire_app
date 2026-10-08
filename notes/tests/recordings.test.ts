import { describe, expect, it } from 'vitest'
import { applySpeakerMap, isGenericSpeaker, parseTranscript, renderStructuredMarkdown, speakerMapFrom, transcriptStats, transcriptToText, emptyStructure } from '@/lib/recordings/transcript'
import { chooseContext } from '@/lib/recordings/ingest'

describe('parseTranscript', () => {
  it('reads speaker-labelled lines with timestamps (Gemini / Otter style)', () => {
    const p = parseTranscript(`[0:03] Speaker 1: Thanks for making time today.
[0:09] Speaker 2: Of course. Where did we land on the buffer?
[0:15] Speaker 1: Still open, I'll send the numbers Friday.`)
    expect(p.format).toBe('speakers')
    expect(p.hasSpeakers).toBe(true)
    expect(p.hasTimes).toBe(true)
    expect(p.segments).toHaveLength(3)
    expect(p.segments[1]).toEqual({ t: 9, speaker: 'Speaker 2', text: 'Of course. Where did we land on the buffer?' })
  })
  it('reads named speakers without times and merges continuation lines', () => {
    const p = parseTranscript(`Thomas Müller: We need the POC signed off.
Priya: Agreed.
And the pricing has to move.
Thomas Müller: Fine.`)
    expect(p.segments.map((s) => s.speaker)).toEqual(['Thomas Müller', 'Priya', 'Thomas Müller'])
    expect(p.segments[1]!.text).toBe('Agreed. And the pricing has to move.')
  })
  it('does not mistake prose with a colon for a speaker', () => {
    const p = parseTranscript(`Note to self, the important thing: we ship in May.`)
    expect(p.format).toBe('plain')
    expect(p.segments[0]!.text).toContain('the important thing: we ship in May')
  })
  it('handles Apple Voice Memos style plain paragraphs', () => {
    const p = parseTranscript(`So the first thing we discussed was pricing.\n\nThen we moved on to the timeline and agreed on May.`)
    expect(p.format).toBe('plain')
    expect(p.hasSpeakers).toBe(false)
    expect(p.segments).toHaveLength(2)
  })
  it('parses WebVTT with voice tags', () => {
    const p = parseTranscript(`WEBVTT\n\n00:00:01.000 --> 00:00:04.000\n<v Thomas>Let's start.\n\n00:00:05.000 --> 00:00:08.000\nSpeaker 2: Sure.`, { filename: 'call.vtt' })
    expect(p.format).toBe('vtt')
    expect(p.segments[0]).toEqual({ t: 1, speaker: 'Thomas', text: "Let's start." })
    expect(p.segments[1]!.speaker).toBe('Speaker 2')
  })
  it('parses SRT', () => {
    const p = parseTranscript(`1\n00:00:01,000 --> 00:00:03,000\nHello there.\n\n2\n00:00:20,000 --> 00:00:22,000\nSecond block.`)
    expect(p.format).toBe('srt')
    expect(p.segments).toHaveLength(2)
    expect(p.segments[1]!.t).toBe(20)
  })
  it('parses JSON segment arrays', () => {
    const p = parseTranscript(JSON.stringify({ segments: [{ start: '1:02', speaker: 'Ana', text: 'Hi' }, { t: 70, name: 'Bo', content: 'Hey' }] }))
    expect(p.format).toBe('json')
    expect(p.segments).toEqual([{ t: 62, speaker: 'Ana', text: 'Hi' }, { t: 70, speaker: 'Bo', text: 'Hey' }])
  })
})

describe('speakers', () => {
  it('recognises generic diarization labels', () => {
    expect(isGenericSpeaker('Speaker 1')).toBe(true)
    expect(isGenericSpeaker('SPEAKER_2')).toBe(true)
    expect(isGenericSpeaker('Unknown')).toBe(true)
    expect(isGenericSpeaker('Thomas Müller')).toBe(false)
  })
  it('builds a map only from confident matches on real labels and applies it', () => {
    const map = speakerMapFrom([{ speaker: 'Speaker 1', name: 'Harsha', confidence: 0.9 }, { speaker: 'Speaker 2', name: 'Thomas Müller', confidence: 0.3 }, { speaker: 'Speaker 9', name: 'Ghost', confidence: 1 }], ['Speaker 1', 'Speaker 2'])
    expect(map).toEqual({ 'Speaker 1': 'Harsha' })
    const out = applySpeakerMap([{ t: 0, speaker: 'Speaker 1', text: 'a' }, { t: 1, speaker: 'speaker 2', text: 'b' }], map)
    expect(out.map((s) => s.speaker)).toEqual(['Harsha', 'speaker 2'])
  })
  it('renders text with and without labels', () => {
    const segs = [{ t: 0, speaker: 'Speaker', text: 'one' }, { t: 65, speaker: 'Speaker', text: 'two' }]
    expect(transcriptToText(segs)).toBe('one\ntwo')
    expect(transcriptToText(segs, { times: true })).toBe('one\n[1:05] two')
    expect(transcriptStats(segs)).toEqual({ words: 2, speakers: ['Speaker'], durationHint: 65 })
  })
})

describe('structured note', () => {
  it('renders every populated section and skips empty ones', () => {
    const s = { ...emptyStructure('Nissan — pricing'), attendees: [{ speaker: 'Speaker 1', name: 'Harsha' }, { name: 'Thomas Müller', role: 'CFO', company: 'Nissan' }], purpose: 'Agree the buffer.', summary: ['We agreed on 3%.'], actions: [{ title: 'Send numbers', owner: 'Harsha', due: 'Friday' }], numbers: [{ label: 'Buffer', value: '3%', entity: 'Nissan' }] }
    const md = renderStructuredMarkdown(s, { when: new Date('2026-09-12T10:00:00Z'), durationSeconds: 1800, source: 'recording' })
    expect(md).toContain('## Attendees')
    expect(md).toContain('- Harsha · Speaker 1')
    expect(md).toContain('- Thomas Müller — CFO (Nissan)')
    expect(md).toContain('## Action items\n- [ ] **Harsha**: Send numbers (due Friday)')
    expect(md).toContain('Nissan · Buffer: **3%**')
    expect(md).not.toContain('## Decisions')
    expect(md).toContain('30 min')
  })
})

describe('chooseContext', () => {
  const ctxs = [{ id: 'c1', slug: 'personal', name: 'Personal' }, { id: 'c2', slug: 'work', name: 'Work' }] as never[]
  it('honours an explicit slug or id and falls back to auto/work', () => {
    expect(chooseContext(ctxs, 'personal')).toMatchObject({ context: { id: 'c1' }, auto: false })
    expect(chooseContext(ctxs, 'c2')).toMatchObject({ context: { id: 'c2' }, auto: false })
    expect(chooseContext(ctxs, 'auto')).toMatchObject({ context: { id: 'c2' }, auto: true })
    expect(chooseContext(ctxs, 'nope')).toMatchObject({ context: { id: 'c2' }, auto: true })
  })
})

describe('tags', () => {
  it('normalizes and dedupes', async () => {
    const { normalizeTag, normalizeTags, deriveTags } = await import('@/lib/tags')
    expect(normalizeTag('#Pricing & Discounts')).toBe('pricing-and-discounts')
    expect(normalizeTag('Q4 Planning!')).toBe('q4-planning')
    expect(normalizeTag('  ')).toBeNull()
    expect(normalizeTag('123')).toBeNull()
    expect(normalizeTag('note')).toBeNull()
    expect(normalizeTags(['Hiring', 'hiring', '#hiring', 'Design'])).toEqual(['hiring', 'design'])
    const { emptyExtraction } = await import('@/lib/ai/types')
    const ex = { ...emptyExtraction(), tags: ['Pricing', 'Customer Call'], topics: [{ name: 'Treasury POC' }], decisions: [{ statement: 'Go annual', status: 'active' as const }], actions: [{ title: 'Send numbers' }], numbers: [{ label: 'a', value: '1' }, { label: 'b', value: '2' }] }
    expect(deriveTags(ex, { kind: 'meeting', source: 'recording' })).toEqual(['pricing', 'customer-call', 'treasury-poc', 'meeting', 'recording', 'decision', 'action-items', 'numbers'])
  })
  it('parses tag filters out of a search query', async () => {
    const { parseTagQuery } = await import('@/lib/search')
    expect(parseTagQuery('tag:pricing nissan #renewal')).toEqual({ text: 'nissan', tags: ['pricing', 'renewal'] })
    expect(parseTagQuery('#pricing')).toEqual({ text: '', tags: ['pricing'] })
    expect(parseTagQuery('C# tutorial')).toEqual({ text: 'C# tutorial', tags: [] })
  })
})
