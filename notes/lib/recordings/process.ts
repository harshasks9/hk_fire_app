/*
  Turning a recording (or a pasted transcript) into a structured meeting note
  that lands in the right context, connected to everything already known.

  Stages, each written to meetings.ingest_status so the UI can follow along:
    transcribing → structuring → filing → done | failed

  The raw transcript is kept verbatim (transcripts table and the bottom of the
  note). Everything above it in the note is generated and marked as such.
*/
import { and, desc, eq, inArray, lt, ne, sql } from 'drizzle-orm'
import { getDb, schema } from '../db'
import type { Context, IngestStatus, TranscriptSegment } from '../db/schema'
import { getProvider } from '../ai/provider'
import { runWithAiScope } from '../ai/scope'
import { notebookAiScope } from '../ai/notebook-config'
import { matchKnownEntities, localExtract } from '../ai/local'
import type { Extraction, KnownEntity } from '../ai/types'
import { SYSTEM_CHIEF_OF_STAFF } from '../ai/prompts'
import { knownEntitiesFor, processNote } from '../pipeline'
import { notebookOfContext, notebookOwnerName } from '../tenant'
import { transcribeMeetingAudio } from '../media'
import { docToText, markdownToDoc } from '../markdown'
import { extractJson, uid, wordCount, truncate, formatDate } from '../util'
import { applySpeakerMap, emptyStructure, parseTranscript, renderStructuredMarkdown, speakerMapFrom, transcriptStats, transcriptToText, isGenericSpeaker, type StructuredMeeting } from './transcript'

export async function setStage(meetingId: string, status: IngestStatus, error?: string | null) {
  const db = await getDb()
  await db.update(schema.meetings).set({ ingestStatus: status, ingestError: error ?? null, ingestStageAt: new Date(), updatedAt: new Date() }).where(eq(schema.meetings.id, meetingId))
}

/** Run the whole job for one meeting. Safe to call again after a failure. */
export async function processRecording(meetingId: string): Promise<void> {
  const db = await getDb()
  const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId)))[0]
  if (!m || !m.noteId) return
  const notebookId = await notebookOfContext(m.contextId)
  const ownerName = notebookId ? await notebookOwnerName(notebookId) : 'Harsha'
  const scope = notebookId ? await notebookAiScope(notebookId, ownerName) : { mode: 'shared' as const, ownerName }
  await runWithAiScope(scope, async () => {
    try {
      await run(meetingId, ownerName, notebookId)
    } catch (err) {
      console.error('[recording]', meetingId, err)
      await setStage(meetingId, 'failed', String(err).slice(0, 400))
      if (m.noteId) await db.update(schema.notes).set({ status: 'processed', processingError: String(err).slice(0, 400) }).where(eq(schema.notes.id, m.noteId))
    }
  })
}

async function run(meetingId: string, ownerName: string, notebookId: string | null) {
  const db = await getDb()
  const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId)))[0]!
  const noteId = m.noteId!

  /* ----------------------------- 1. transcript ---------------------------- */
  let tr = (await db.select().from(schema.transcripts).where(eq(schema.transcripts.meetingId, meetingId)).orderBy(desc(schema.transcripts.createdAt)))[0]
  let segments: TranscriptSegment[] = tr?.segments ?? []
  if (!segments.length && m.recordingAttachmentId) {
    await setStage(meetingId, 'transcribing')
    const a = (await db.select().from(schema.attachments).where(eq(schema.attachments.id, m.recordingAttachmentId)))[0]
    if (!a?.data) throw new Error('The recording has no audio data')
    const raw = await transcribeMeetingAudio(Buffer.from(a.data, 'base64'), a.mime, { displayName: a.name })
    if (!raw) throw new Error('Transcription is not available: add a Gemini key in Settings → AI, or paste the transcript text instead')
    const parsed = parseTranscript(raw)
    segments = parsed.segments
    if (!segments.length) throw new Error('The recording produced no speech')
    const text = transcriptToText(segments)
    if (tr) await db.update(schema.transcripts).set({ segments, text, durationSeconds: a.durationSeconds ?? transcriptStats(segments).durationHint }).where(eq(schema.transcripts.id, tr.id))
    else await db.insert(schema.transcripts).values({ id: uid('tr'), meetingId, segments, text, source: 'recording', attachmentId: a.id, durationSeconds: a.durationSeconds ?? transcriptStats(segments).durationHint })
    tr = (await db.select().from(schema.transcripts).where(eq(schema.transcripts.meetingId, meetingId)).orderBy(desc(schema.transcripts.createdAt)))[0]
  }
  if (!segments.length) throw new Error('Nothing to structure: no transcript and no recording')
  const stats = transcriptStats(segments)

  /* ------------------------------ 2. context ------------------------------ */
  await setStage(meetingId, 'structuring')
  const contexts = notebookId ? await db.select().from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId)) : []
  const note = (await db.select().from(schema.notes).where(eq(schema.notes.id, noteId)))[0]!
  const wantsAuto = note.source === 'recording:auto'
  const transcriptText = transcriptToText(segments)
  let context = contexts.find((c) => c.id === m.contextId) ?? null
  if (wantsAuto && contexts.length > 1) {
    const picked = await pickContext(transcriptText, contexts)
    if (picked && picked.id !== m.contextId) {
      await db.update(schema.meetings).set({ contextId: picked.id }).where(eq(schema.meetings.id, meetingId))
      await db.update(schema.notes).set({ contextId: picked.id }).where(eq(schema.notes.id, noteId))
      context = picked
    }
  }
  const contextId = context?.id ?? m.contextId
  if (wantsAuto) await db.update(schema.notes).set({ source: 'recording' }).where(eq(schema.notes.id, noteId))

  /* ------------------------ 3. what we already know ----------------------- */
  const known = await knownEntitiesFor(contextId)
  const matched = matchKnownEntities(transcriptText, known).sort((a, b) => b.count - a.count).slice(0, 12)
  const prior = await priorKnowledge(contextId, matched.map((x) => x.entity), m.startsAt, meetingId)

  /* ----------------------------- 4. structure ----------------------------- */
  const provider = getProvider()
  const speakers = stats.speakers
  const labels = speakers.filter(isGenericSpeaker)
  let structure: StructuredMeeting
  let extraction: Extraction
  let usedProvider = provider.name
  const hint = { title: m.title && !/^Recording /.test(m.title) ? m.title : undefined, participants: participantsHint(note) }
  if (provider.isLLM) {
    try {
      const raw = await provider.complete(structuringPrompt({ transcript: transcriptText, ownerName, known, prior, speakers, hint, when: m.startsAt, contextName: context?.name }), { json: true, purpose: 'structure-meeting', maxTokens: 8192, system: SYSTEM_CHIEF_OF_STAFF })
      const parsed = extractJson<Partial<StructuredMeeting> & Partial<Extraction>>(raw)
      if (!parsed) throw new Error('Structuring returned no JSON')
      ;({ structure, extraction } = fromModel(parsed, ownerName))
    } catch (err) {
      console.error('[recording] structuring failed, using local extraction:', String(err).slice(0, 200))
      ;({ structure, extraction } = fromLocal(transcriptText, { title: hint.title, knownEntities: known, userName: ownerName, when: m.startsAt }))
      usedProvider = 'local'
    }
  } else {
    ;({ structure, extraction } = fromLocal(transcriptText, { title: hint.title, knownEntities: known, userName: ownerName, when: m.startsAt }))
    usedProvider = 'local'
  }
  if (!structure.title) structure.title = hint.title ?? `Meeting — ${formatDate(m.startsAt, { month: 'short', day: 'numeric' })}`

  /* --------------------------- 5. write the note -------------------------- */
  const speakerMap = speakerMapFrom(structure.attendees, labels)
  const named = applySpeakerMap(segments, speakerMap)
  const durationSeconds = m.durationSeconds ?? tr?.durationSeconds ?? stats.durationHint ?? null
  const body = renderStructuredMarkdown(structure, { when: m.startsAt, durationSeconds, source: m.recordingAttachmentId ? 'recording' : 'transcript' })
  const md = `${body}\n\n## Transcript\n\n${transcriptToText(named, { times: stats.durationHint != null })}`
  const doc = markdownToDoc(md)
  const text = docToText(doc)
  await db.update(schema.notes).set({ title: structure.title, contentJson: doc, contentText: text, wordCount: wordCount(text), status: 'processing', processingError: null, updatedAt: new Date() }).where(eq(schema.notes.id, noteId))
  await db.update(schema.meetings).set({ title: structure.title, durationSeconds, status: 'completed', endsAt: m.endsAt ?? (durationSeconds ? new Date(m.startsAt.getTime() + durationSeconds * 1000) : new Date(m.startsAt.getTime() + 30 * 60000)), updatedAt: new Date() }).where(eq(schema.meetings.id, meetingId))
  if (tr) await db.update(schema.transcripts).set({ segments: named, text: transcriptToText(named), speakerMap }).where(eq(schema.transcripts.id, tr.id))
  else await db.insert(schema.transcripts).values({ id: uid('tr'), meetingId, segments: named, text: transcriptToText(named), speakerMap, source: 'upload', durationSeconds })

  /* -------------------------------- 6. file ------------------------------- */
  await setStage(meetingId, 'filing')
  // Attendees are people for the graph even when the model listed them only as speakers.
  for (const a of structure.attendees) {
    if (!a.name || a.name.toLowerCase() === ownerName.toLowerCase()) continue
    if (!extraction.people.some((p) => p.name.toLowerCase() === a.name.toLowerCase())) extraction.people.push({ name: a.name, role: a.role, company: a.company })
  }
  await processNote(noteId, { extraction, provider: usedProvider })
  await setStage(meetingId, 'done')
}

/* ------------------------------------------------------------------ helpers */

function participantsHint(note: { contentText: string }): string[] {
  const m = note.contentText.match(/^Participants:\s*(.+)$/m)
  return m ? m[1]!.split(/,|;/).map((s) => s.trim()).filter(Boolean) : []
}

/** Which of the notebook's contexts does this transcript belong to? Known-entity hits first, the model as tie-breaker. */
export async function pickContext(text: string, contexts: Context[]): Promise<Context | null> {
  const scores = new Map<string, number>()
  for (const c of contexts) {
    const known = await knownEntitiesFor(c.id)
    const hits = matchKnownEntities(text, known)
    scores.set(c.id, hits.reduce((n, h) => n + Math.min(h.count, 5) * (h.entity.type === 'person' || h.entity.type === 'company' ? 2 : 1), 0))
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  const [top, second] = ranked
  if (top && top[1] > 0 && (!second || top[1] >= second[1] * 1.5)) return contexts.find((c) => c.id === top[0]) ?? null
  const provider = getProvider()
  if (provider.isLLM) {
    try {
      const raw = await provider.complete(
        `Which of these contexts does the meeting transcript below belong to? Answer with JSON {"slug": "..."} using exactly one slug.\n\nContexts:\n${contexts.map((c) => `- ${c.slug}: ${c.name}${c.description ? ` — ${c.description}` : ''}`).join('\n')}\n\nTranscript (start):\n"""\n${text.slice(0, 6000)}\n"""`,
        { json: true, purpose: 'pick-context', maxTokens: 64 },
      )
      const j = extractJson<{ slug?: string }>(raw)
      const c = contexts.find((x) => x.slug === j?.slug)
      if (c) return c
    } catch {
      /* fall through */
    }
  }
  return contexts.find((c) => c.slug === 'work') ?? contexts[0] ?? null
}

export interface PriorKnowledge {
  entities: { name: string; type: string; role?: string; company?: string }[]
  meetings: { title: string; date: Date; summary: string[] }[]
  loops: string[]
  tasks: string[]
  decisions: string[]
  facts: string[]
}

async function priorKnowledge(contextId: string, entities: KnownEntity[], before: Date, exceptMeetingId: string): Promise<PriorKnowledge> {
  const db = await getDb()
  const out: PriorKnowledge = { entities: entities.map((e) => ({ name: e.name, type: e.type, role: e.attributes?.role, company: e.attributes?.company })), meetings: [], loops: [], tasks: [], decisions: [], facts: [] }
  const ids = entities.map((e) => e.id)
  if (!ids.length) return out
  const noteIds = (await db.select({ noteId: schema.noteEntities.noteId }).from(schema.noteEntities).where(inArray(schema.noteEntities.entityId, ids))).map((r) => r.noteId)
  const mtgs = noteIds.length
    ? await db.select().from(schema.meetings).where(and(eq(schema.meetings.contextId, contextId), eq(schema.meetings.status, 'completed'), ne(schema.meetings.id, exceptMeetingId), inArray(schema.meetings.noteId, noteIds), lt(schema.meetings.startsAt, before))).orderBy(desc(schema.meetings.startsAt)).limit(3)
    : []
  out.meetings = mtgs.map((x) => ({ title: x.title, date: x.startsAt, summary: x.summary?.summary?.slice(0, 3) ?? [] }))
  const loops = await db.select().from(schema.commitments).where(and(eq(schema.commitments.contextId, contextId), eq(schema.commitments.status, 'open'))).orderBy(desc(schema.commitments.detectedAt)).limit(60)
  out.loops = loops.filter((l) => (l.counterpartyEntityId && ids.includes(l.counterpartyEntityId)) || (l.companyEntityId && ids.includes(l.companyEntityId)) || (l.sourceNoteId && noteIds.includes(l.sourceNoteId))).slice(0, 8).map((l) => `${l.kind}: ${l.text}`)
  const tasks = await db.select().from(schema.tasks).where(and(eq(schema.tasks.contextId, contextId), inArray(schema.tasks.status, ['open', 'waiting', 'delegated']))).orderBy(desc(schema.tasks.createdAt)).limit(80)
  out.tasks = tasks.filter((t) => (t.entityId && ids.includes(t.entityId)) || (t.ownerEntityId && ids.includes(t.ownerEntityId)) || (t.sourceNoteId && noteIds.includes(t.sourceNoteId))).slice(0, 8).map((t) => `${t.owner}: ${t.title}`)
  const decisions = await db.select().from(schema.decisions).where(eq(schema.decisions.contextId, contextId)).orderBy(desc(schema.decisions.decidedAt)).limit(60)
  out.decisions = decisions.filter((d) => (d.companyEntityId && ids.includes(d.companyEntityId)) || (d.topicEntityId && ids.includes(d.topicEntityId)) || (d.sourceNoteId && noteIds.includes(d.sourceNoteId))).slice(0, 6).map((d) => `${formatDate(d.decidedAt)}: ${d.statement}`)
  const facts = await db.select({ f: schema.facts, entity: schema.entities.name }).from(schema.facts).innerJoin(schema.entities, eq(schema.entities.id, schema.facts.entityId)).where(and(inArray(schema.facts.entityId, ids), sql`${schema.facts.supersededById} is null`)).orderBy(desc(schema.facts.observedAt)).limit(10)
  out.facts = facts.map((r) => `${r.entity} · ${r.f.label}: ${r.f.value}`)
  return out
}

function structuringPrompt(p: { transcript: string; ownerName: string; known: KnownEntity[]; prior: PriorKnowledge; speakers: string[]; hint: { title?: string; participants: string[] }; when: Date; contextName?: string }): string {
  const known = p.known
    .slice(0, 300)
    .map((e) => `${e.type}: ${e.name}${e.aliases.length ? ` (aka ${e.aliases.join(', ')})` : ''}${e.attributes?.role ? ` — ${e.attributes.role}` : ''}${e.attributes?.company ? ` @ ${e.attributes.company}` : ''}`)
    .join('\n')
  const prior = [
    p.prior.meetings.length ? `Previous meetings with these people/companies:\n${p.prior.meetings.map((m) => `- ${formatDate(m.date)} · ${m.title}${m.summary.length ? `: ${m.summary.join(' ')}` : ''}`).join('\n')}` : '',
    p.prior.loops.length ? `Open loops before this meeting:\n${p.prior.loops.map((l) => `- ${l}`).join('\n')}` : '',
    p.prior.tasks.length ? `Open tasks before this meeting:\n${p.prior.tasks.map((t) => `- ${t}`).join('\n')}` : '',
    p.prior.decisions.length ? `Earlier decisions:\n${p.prior.decisions.map((d) => `- ${d}`).join('\n')}` : '',
    p.prior.facts.length ? `Latest known numbers:\n${p.prior.facts.map((f) => `- ${f}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  return `Turn the meeting transcript below into a structured meeting note for its owner, "${p.ownerName}" (first person "I" / "me" in the transcript is usually ${p.ownerName}, who recorded it).
Meeting date: ${p.when.toDateString()}${p.contextName ? ` · Context: ${p.contextName}` : ''}${p.hint.title ? ` · Title given by the owner: ${p.hint.title}` : ''}${p.hint.participants.length ? ` · Participants given by the owner: ${p.hint.participants.join(', ')}` : ''}
Speaker labels in the transcript: ${p.speakers.join(', ') || '(none)'}

Return ONLY a JSON object with this exact shape (empty arrays/strings when nothing applies):
{
  "title": "short, specific title: who/what, e.g. 'Nissan — Treasury POC pricing'",
  "attendees": [{"speaker": "the transcript label, e.g. 'Speaker 1'", "name": "who it is (use the owner's name when it is them)", "role": "", "company": "", "confidence": 0.0}],
  "purpose": "one sentence: why this meeting happened",
  "context": ["how this connects to what was already known, e.g. 'Follow-up to the 3 Sep call; the 3% buffer question was still open' — only when the prior knowledge below supports it"],
  "summary": ["4-7 factual sentences, most important first"],
  "keyPoints": ["key discussion points, each self-contained"],
  "decisions": [{"statement": "", "reasoning": "", "alternatives": [""], "topic": "", "company": "", "excerpt": "verbatim sentence from the transcript", "status": "active|proposed"}],
  "actions": [{"title": "imperative, specific", "owner": "person name, 'Team' or '${p.ownerName}'", "due": "as said, e.g. 'Friday'", "priority": "low|normal|high|urgent", "company": "", "excerpt": ""}],
  "questions": ["open / unresolved questions"],
  "numbers": [{"label": "e.g. Revenue, Discount asked, Seats", "value": "as said e.g. $7.6M", "entity": "company/person it belongs to", "numeric": 7600000, "unit": "$|%|seats", "excerpt": ""}],
  "commitments": [{"text": "", "kind": "promised|waiting|follow_up|question", "byWhom": "", "counterparty": "", "company": "", "dueHint": "", "excerpt": ""}],
  "nextSteps": ["what happens next, in order"],
  "risks": ["..."],
  "people": [{"name": "", "role": "", "company": "", "excerpt": ""}],
  "companies": [{"name": "", "excerpt": ""}],
  "projects": [{"name": "", "excerpt": ""}],
  "topics": [{"name": "short canonical topic name", "excerpt": ""}],
  "dates": [{"label": "", "date": "YYYY-MM-DD if determinable", "excerpt": ""}],
  "opportunities": ["..."],
  "tags": ["4-8 short lowercase kebab-case tags for finding this meeting later, e.g. 'pricing', 'customer-call', 'renewal', 'hiring'"]
}

Rules:
- Identify speakers from introductions, how people address each other and the prior knowledge; set "confidence" 0-1 and keep the generic label as "name" when you cannot tell. The owner is usually the one recording.
- Use the canonical names below for known entities (match aliases, titles, first names).
- "commitments" are open loops: promises ("I'll send..."), things awaited ("waiting on pricing approval"), follow-ups.
- Every "excerpt" is copied verbatim from the transcript. Never invent facts that are not in it.
- Prefer fewer, higher-quality items. Transcripts contain filler and repetition: the note should not.

Known entities in this context:
${known || '(none yet)'}

${prior ? `What is already known (use it for "context", speaker identification and to mark decisions that confirm or change earlier ones):\n${prior}` : 'No prior knowledge about the people in this transcript.'}

TRANSCRIPT:
"""
${p.transcript.slice(0, 200_000)}
"""`
}

function str(x: unknown): string {
  return typeof x === 'string' ? x.trim() : ''
}
function strs(x: unknown): string[] {
  return Array.isArray(x) ? x.map(str).filter(Boolean) : []
}
function objs<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x.filter((o) => o && typeof o === 'object') as T[]) : []
}

function fromModel(j: Partial<StructuredMeeting> & Partial<Extraction>, ownerName: string): { structure: StructuredMeeting; extraction: Extraction } {
  const structure: StructuredMeeting = {
    title: truncate(str(j.title), 120),
    attendees: objs<StructuredMeeting['attendees'][number]>(j.attendees)
      .map((a) => ({ speaker: str(a.speaker) || undefined, name: str(a.name), role: str(a.role) || undefined, company: str(a.company) || undefined, confidence: typeof a.confidence === 'number' ? a.confidence : undefined }))
      .filter((a) => a.name),
    purpose: str(j.purpose),
    summary: strs(j.summary).slice(0, 8),
    keyPoints: strs(j.keyPoints).slice(0, 12),
    decisions: objs<{ statement?: unknown; reasoning?: unknown }>(j.decisions).map((d) => ({ statement: str(d.statement), reasoning: str(d.reasoning) || undefined })).filter((d) => d.statement),
    actions: objs<{ title?: unknown; owner?: unknown; due?: unknown }>(j.actions).map((a) => ({ title: str(a.title), owner: str(a.owner) || undefined, due: str(a.due) || undefined })).filter((a) => a.title),
    questions: strs(j.questions).slice(0, 10),
    numbers: objs<{ label?: unknown; value?: unknown; entity?: unknown }>(j.numbers).map((n) => ({ label: str(n.label), value: str(n.value), entity: str(n.entity) || undefined })).filter((n) => n.label && n.value),
    nextSteps: strs(j.nextSteps).slice(0, 10),
    context: strs(j.context).slice(0, 5),
    risks: strs(j.risks).slice(0, 6),
  }
  // Generic speaker names should never become people.
  structure.attendees = structure.attendees.filter((a) => !isGenericSpeaker(a.name) || a.speaker)
  const extraction: Extraction = {
    title: structure.title || undefined,
    summary: structure.summary,
    keyPoints: structure.keyPoints,
    people: objs<Extraction['people'][number]>(j.people).filter((p) => str(p.name) && !isGenericSpeaker(str(p.name))),
    companies: objs<Extraction['companies'][number]>(j.companies).filter((c) => str(c.name)),
    projects: objs<Extraction['projects'][number]>(j.projects).filter((c) => str(c.name)),
    topics: objs<Extraction['topics'][number]>(j.topics).filter((c) => str(c.name)),
    decisions: objs<Extraction['decisions'][number]>(j.decisions).filter((d) => str(d.statement)),
    actions: objs<Extraction['actions'][number]>(j.actions).filter((a) => str(a.title)).map((a) => ({ ...a, owner: a.owner && isGenericSpeaker(a.owner) ? ownerName : a.owner })),
    numbers: objs<Extraction['numbers'][number]>(j.numbers).filter((n) => str(n.label) && str(n.value)),
    commitments: objs<Extraction['commitments'][number]>(j.commitments).filter((c) => str(c.text)),
    risks: structure.risks,
    questions: structure.questions,
    dates: objs<Extraction['dates'][number]>(j.dates).filter((d) => str(d.label)),
    opportunities: strs(j.opportunities),
    tags: strs(j.tags),
  }
  return { structure, extraction }
}

function fromLocal(text: string, ctx: { title?: string; knownEntities: KnownEntity[]; userName: string; when: Date }): { structure: StructuredMeeting; extraction: Extraction } {
  const extraction = localExtract(text, { ...ctx, kind: 'meeting' })
  // Without a model the first transcript line is a poor title: name the meeting after who/what it was about.
  const company = extraction.companies[0]?.name
  const people = extraction.people.filter((p) => p.name.toLowerCase() !== ctx.userName.toLowerCase()).map((p) => p.name)
  const date = formatDate(ctx.when, { month: 'short', day: 'numeric' })
  const fallback = company ? `${company} — ${date}` : people.length ? `Meeting with ${people.slice(0, 2).join(' and ')} — ${date}` : `Meeting — ${date}`
  extraction.title = ctx.title ?? fallback
  const structure = emptyStructure(ctx.title ?? fallback)
  structure.summary = extraction.summary
  structure.keyPoints = extraction.keyPoints
  structure.decisions = extraction.decisions.map((d) => ({ statement: d.statement, reasoning: d.reasoning }))
  structure.actions = extraction.actions.map((a) => ({ title: a.title, owner: a.owner, due: a.due }))
  structure.questions = extraction.questions
  structure.numbers = extraction.numbers.map((n) => ({ label: n.label, value: n.value, entity: n.entity }))
  structure.risks = extraction.risks
  structure.attendees = extraction.people.map((p) => ({ name: p.name, role: p.role, company: p.company }))
  return { structure, extraction }
}
