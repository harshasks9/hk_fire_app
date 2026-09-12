/*
  Automatic note understanding. Runs after every save (in the background) and
  turns the raw note into: entities + mentions, tasks, decisions (+ history),
  commitments (open loops), facts (+ change detection), timeline events,
  relations, an AI summary, embeddings and proactive insights.

  The raw note is never modified. Everything produced here points back at
  its source note and excerpt.
*/
import { and, eq, inArray, sql, desc } from 'drizzle-orm'
import { getDb, schema } from './db'
import type { Entity, EntityType, Note, NoteSummary } from './db/schema'
import { getProvider } from './ai/provider'
import { embedTexts } from './ai/embeddings'
import { matchKnownEntities, localExtract } from './ai/local'
import type { Extraction, KnownEntity } from './ai/types'
import { chunkText, slugify, uid, truncate } from './util'
import { jaccard, similarText } from './similarity'
import { refreshInsights } from './insights'
import { parseDueHint } from './dates'

const USER_NAME = process.env.USER_NAME || 'Harsha'

export interface ProcessResult {
  noteId: string
  entities: { id: string; name: string; type: EntityType; created: boolean }[]
  tasks: number
  decisions: number
  commitments: number
  facts: number
  changes: number
  provider: string
}

export async function knownEntitiesFor(contextId: string): Promise<KnownEntity[]> {
  const db = await getDb()
  const rows = await db.select().from(schema.entities).where(eq(schema.entities.contextId, contextId))
  return rows.map((e) => ({ id: e.id, name: e.name, type: e.type, aliases: e.aliases, attributes: e.attributes }))
}

async function resolveEntity(contextId: string, type: EntityType, name: string, attrs: Record<string, string | undefined> = {}, known: KnownEntity[]): Promise<{ entity: Entity; created: boolean } | null> {
  const db = await getDb()
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean || clean.length < 2 || clean.length > 80) return null
  const slug = slugify(clean)
  if (!slug) return null
  const lower = clean.toLowerCase()
  // 1. exact / alias match of the same type
  const match = known.find((k) => k.type === type && (k.name.toLowerCase() === lower || k.aliases.some((a) => a.toLowerCase() === lower)))
  let existing: Entity | undefined
  if (match) existing = (await db.select().from(schema.entities).where(eq(schema.entities.id, match.id)))[0]
  // 2. first-name / partial match for people ("Thomas" → "Thomas Müller")
  if (!existing && type === 'person') {
    const first = lower.split(' ')[0]!
    const cands = known.filter((k) => k.type === 'person' && (k.name.toLowerCase().split(' ')[0] === first || k.name.toLowerCase().startsWith(lower) || lower.startsWith(k.name.toLowerCase())))
    if (cands.length === 1) existing = (await db.select().from(schema.entities).where(eq(schema.entities.id, cands[0]!.id)))[0]
  }
  if (!existing) {
    const bySlug = await db.select().from(schema.entities).where(and(eq(schema.entities.contextId, contextId), eq(schema.entities.type, type), eq(schema.entities.slug, slug)))
    existing = bySlug[0]
  }
  const cleanAttrs = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v && v.trim()))
  if (existing) {
    const merged = { ...cleanAttrs, ...existing.attributes }
    const aliases = existing.aliases.slice()
    if (existing.name.toLowerCase() !== lower && !aliases.some((a) => a.toLowerCase() === lower) && lower.length > 2) aliases.push(clean)
    await db.update(schema.entities).set({ attributes: merged, aliases, lastSeenAt: new Date(), updatedAt: new Date(), mentionCount: sql`${schema.entities.mentionCount} + 1` }).where(eq(schema.entities.id, existing.id))
    return { entity: { ...existing, attributes: merged, aliases }, created: false }
  }
  const row = { id: uid('ent'), contextId, type, name: clean, slug, aliases: [] as string[], attributes: cleanAttrs, mentionCount: 1, lastSeenAt: new Date() }
  await db.insert(schema.entities).values(row)
  const created = (await db.select().from(schema.entities).where(eq(schema.entities.id, row.id)))[0]!
  known.push({ id: created.id, name: created.name, type, aliases: [], attributes: created.attributes })
  return { entity: created, created: true }
}

async function upsertRelation(contextId: string, fromType: string, fromId: string, toType: string, toId: string, relation: string, sourceNoteId: string) {
  if (fromId === toId) return
  const db = await getDb()
  await db
    .insert(schema.entityRelations)
    .values({ id: uid('rel'), contextId, fromType, fromId, toType, toId, relation, sourceNoteId })
    .onConflictDoUpdate({ target: [schema.entityRelations.fromType, schema.entityRelations.fromId, schema.entityRelations.toType, schema.entityRelations.toId, schema.entityRelations.relation], set: { weight: sql`${schema.entityRelations.weight} + 1` } })
}

async function upsertTimeline(contextId: string, entityId: string, kind: string, title: string, occurredAt: Date, opts: { description?: string; noteId?: string; meetingId?: string; refId: string }) {
  const db = await getDb()
  await db
    .insert(schema.timelineEvents)
    .values({ id: uid('tl'), contextId, entityId, kind, title, description: opts.description, occurredAt, noteId: opts.noteId, meetingId: opts.meetingId, refId: opts.refId })
    .onConflictDoUpdate({ target: [schema.timelineEvents.entityId, schema.timelineEvents.kind, schema.timelineEvents.refId], set: { title, description: opts.description, occurredAt } })
}

export function summaryFromExtraction(ex: Extraction, provider: string): NoteSummary {
  return {
    summary: ex.summary.slice(0, 6),
    keyPoints: ex.keyPoints.slice(0, 8),
    decisions: ex.decisions.filter((d) => d.status !== 'proposed').map((d) => d.statement).slice(0, 6),
    actions: ex.actions.map((a) => (a.owner ? `${a.owner}: ${a.title}` : a.title)).slice(0, 10),
    risks: ex.risks.slice(0, 5),
    numbers: ex.numbers.map((n) => `${n.entity ? n.entity + ' · ' : ''}${n.label}: ${n.value}`).slice(0, 8),
    questions: ex.questions.slice(0, 5),
    generatedAt: new Date().toISOString(),
    provider,
  }
}

export async function processNote(noteId: string): Promise<ProcessResult | null> {
  const db = await getDb()
  const note = (await db.select().from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!note || note.deletedAt) return null
  const result: ProcessResult = { noteId, entities: [], tasks: 0, decisions: 0, commitments: 0, facts: 0, changes: 0, provider: 'none' }
  if (note.privacy === 'ai_excluded') {
    await db.update(schema.notes).set({ status: 'processed', aiProcessedAt: new Date() }).where(eq(schema.notes.id, noteId))
    return result
  }
  await db.update(schema.notes).set({ status: 'processing', processingError: null }).where(eq(schema.notes.id, noteId))
  try {
    const provider = getProvider()
    result.provider = provider.name
    const text = [note.title, note.contentText].filter(Boolean).join('\n\n')
    const known = await knownEntitiesFor(note.contextId)
    const ctx = { title: note.title || undefined, kind: note.kind, knownEntities: known, userName: USER_NAME }
    let ex: Extraction | null = null
    let usedProvider = provider.name
    if (text.trim().length >= 3) {
      try {
        ex = await provider.extract(note.contentText || note.title, ctx)
      } catch (err) {
        // The model is unavailable (bad key, retired model, outage): fall back to local understanding so the note is still filed.
        console.error('[pipeline] model extraction failed, using local extractor:', String(err).slice(0, 200))
        ex = localExtract(note.contentText || note.title, ctx)
        usedProvider = 'local'
      }
    }
    result.provider = usedProvider
    if (!ex) {
      await db.update(schema.notes).set({ status: 'processed', aiProcessedAt: new Date(), summary: null }).where(eq(schema.notes.id, noteId))
      return result
    }
    // Precision layer: known entities matched deterministically are always included.
    if (usedProvider !== 'local') {
      for (const m of matchKnownEntities(text, known)) {
        const bucket = m.entity.type === 'person' ? ex.people : m.entity.type === 'company' ? ex.companies : m.entity.type === 'topic' ? ex.topics : ex.projects
        if (!bucket.some((b) => b.name.toLowerCase() === m.entity.name.toLowerCase())) bucket.push({ name: m.entity.name, excerpt: m.excerpt })
      }
    }
    if (!note.title && ex.title) await db.update(schema.notes).set({ title: ex.title }).where(eq(schema.notes.id, noteId))

    const occurredAt = note.createdAt
    const byName = new Map<string, Entity>()
    const register = async (type: EntityType, name: string, attrs: Record<string, string | undefined>, excerpt?: string) => {
      const r = await resolveEntity(note.contextId, type, name, attrs, known)
      if (!r) return null
      byName.set(`${type}:${name.toLowerCase()}`, r.entity)
      if (!result.entities.some((e) => e.id === r.entity.id)) result.entities.push({ id: r.entity.id, name: r.entity.name, type, created: r.created })
      await db
        .insert(schema.noteEntities)
        .values({ id: uid('ne'), noteId, entityId: r.entity.id, excerpt: excerpt ? truncate(excerpt, 300) : null })
        .onConflictDoUpdate({ target: [schema.noteEntities.noteId, schema.noteEntities.entityId], set: { excerpt: excerpt ? truncate(excerpt, 300) : null } })
      await upsertTimeline(note.contextId, r.entity.id, note.kind === 'meeting' ? 'meeting' : note.kind, note.title || ex.title || 'Untitled note', occurredAt, { description: ex.summary[0], noteId, meetingId: note.meetingId ?? undefined, refId: noteId })
      return r.entity
    }
    const companies: Entity[] = []
    for (const c of ex.companies) {
      const e = await register('company', c.name, {}, c.excerpt)
      if (e) companies.push(e)
    }
    const people: Entity[] = []
    for (const p of ex.people) {
      const e = await register('person', p.name, { role: p.role, company: p.company }, p.excerpt)
      if (!e) continue
      people.push(e)
      const companyName = p.company ?? e.attributes.company
      if (companyName) {
        const c = byName.get(`company:${companyName.toLowerCase()}`) ?? (await register('company', companyName, {}, p.excerpt))
        if (c) {
          companies.includes(c) || companies.push(c)
          await upsertRelation(note.contextId, 'person', e.id, 'company', c.id, 'works_at', noteId)
        }
      }
    }
    const topics: Entity[] = []
    for (const t of ex.topics) {
      const e = await register('topic', t.name, {}, t.excerpt)
      if (e) topics.push(e)
    }
    const projects: Entity[] = []
    for (const p of ex.projects) {
      const e = await register('project', p.name, {}, p.excerpt)
      if (e) projects.push(e)
    }
    // Relations inferred from co-occurrence in this note.
    for (const p of people) for (const t of topics) await upsertRelation(note.contextId, 'person', p.id, 'topic', t.id, 'discussed', noteId)
    for (const c of companies) for (const t of topics) await upsertRelation(note.contextId, 'company', c.id, 'topic', t.id, 'about', noteId)
    for (const c of companies) for (const pr of projects) await upsertRelation(note.contextId, 'company', c.id, 'project', pr.id, 'involves', noteId)
    if (note.meetingId) {
      for (const p of people) await upsertRelation(note.contextId, 'person', p.id, 'meeting', note.meetingId, 'attended', noteId)
      const primary = companies[0]
      if (primary) await db.update(schema.meetings).set({ companyEntityId: primary.id, updatedAt: new Date() }).where(and(eq(schema.meetings.id, note.meetingId), sql`${schema.meetings.companyEntityId} is null`))
    }
    const titleLower = (note.title || '').toLowerCase()
    const primaryCompany = companies.find((c) => titleLower.includes(c.name.toLowerCase()) || c.aliases.some((a) => titleLower.includes(a.toLowerCase()))) ?? (companies.length === 1 ? companies[0] : undefined)
    const findCompany = (name?: string) => (name ? companies.find((c) => c.name.toLowerCase() === name.toLowerCase() || c.aliases.some((a) => a.toLowerCase() === name.toLowerCase())) : undefined) ?? primaryCompany
    const findPerson = (name?: string) => (name ? people.find((p) => p.name.toLowerCase() === name.toLowerCase() || p.name.toLowerCase().startsWith(name.toLowerCase()) || p.aliases.some((a) => a.toLowerCase() === name.toLowerCase())) : undefined)
    const findTopic = (name?: string) => (name ? topics.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.aliases.some((a) => a.toLowerCase() === name.toLowerCase())) : undefined)
    const topicInText = (text: string) => {
      const lower = text.toLowerCase()
      return topics.find((t) => lower.includes(t.name.toLowerCase()) || t.aliases.some((a) => lower.includes(a.toLowerCase())))
    }

    /* ------------------------------ tasks ------------------------------ */
    const existingTasks = await db.select().from(schema.tasks).where(eq(schema.tasks.sourceNoteId, noteId))
    const openCtxTasks = await db.select({ title: schema.tasks.title }).from(schema.tasks).where(and(eq(schema.tasks.contextId, note.contextId), eq(schema.tasks.status, 'open')))
    for (const a of ex.actions) {
      if (!a.title || a.title.length < 4) continue
      if (existingTasks.some((t) => similarText(t.title, a.title, 0.45))) continue
      if (openCtxTasks.some((t) => similarText(t.title, a.title, 0.7))) continue
      const owner = findPerson(a.owner)
      const company = findCompany(a.company)
      const taskId = uid('task')
      existingTasks.push({ id: taskId, title: a.title } as (typeof existingTasks)[number])
      await db.insert(schema.tasks).values({
        id: taskId, contextId: note.contextId, title: truncate(a.title, 200), owner: owner?.name ?? a.owner ?? USER_NAME, ownerEntityId: owner?.id, entityId: company?.id ?? projects[0]?.id, sourceNoteId: noteId, sourceExcerpt: a.excerpt, dueAt: parseDueHint(a.due, occurredAt), priority: a.priority ?? 'normal', status: owner && owner.name !== USER_NAME ? 'delegated' : 'open',
      })
      result.tasks++
      if (company) await upsertTimeline(note.contextId, company.id, 'task', a.title, occurredAt, { noteId, refId: `task:${noteId}:${slugify(a.title).slice(0, 40)}` })
    }

    /* ---------------------------- decisions ---------------------------- */
    const ctxDecisions = await db.select().from(schema.decisions).where(eq(schema.decisions.contextId, note.contextId)).orderBy(desc(schema.decisions.decidedAt))
    for (const d of ex.decisions) {
      if (!d.statement || d.statement.length < 8) continue
      const topic = findTopic(d.topic) ?? topicInText(d.statement) ?? (topics.length === 1 ? topics[0] : undefined)
      const company = findCompany(d.company)
      const existingSameNote = ctxDecisions.find((x) => x.sourceNoteId === noteId && similarText(x.statement, d.statement, 0.5))
      if (existingSameNote) continue
      const related = ctxDecisions
        .map((x) => ({ x, score: jaccard(x.title + ' ' + x.statement, d.statement) + (topic && x.topicEntityId === topic.id ? 0.3 : 0) + (company && x.companyEntityId === company.id ? 0.1 : 0) }))
        .filter((r) => r.score >= 0.35)
        .sort((a, b) => b.score - a.score)[0]
      if (related && related.x.sourceNoteId === noteId) continue
      if (related) {
        const same = similarText(related.x.statement, d.statement, 0.75)
        const kind = d.status === 'proposed' ? 'proposed' : same ? 'confirmed' : 'modified'
        await db.insert(schema.decisionRevisions).values({ id: uid('drv'), decisionId: related.x.id, occurredAt, statement: d.statement, kind, sourceNoteId: noteId, sourceExcerpt: d.excerpt })
        if (!same && occurredAt >= related.x.decidedAt) {
          await db.update(schema.decisions).set({ status: d.status === 'proposed' ? 'revisited' : 'active', statement: d.status === 'proposed' ? related.x.statement : d.statement, decidedAt: d.status === 'proposed' ? related.x.decidedAt : occurredAt, sourceNoteId: d.status === 'proposed' ? related.x.sourceNoteId : noteId, sourceExcerpt: d.status === 'proposed' ? related.x.sourceExcerpt : d.excerpt, reasoning: d.reasoning ?? related.x.reasoning, updatedAt: new Date() }).where(eq(schema.decisions.id, related.x.id))
        }
        const target = topic ?? company
        if (target) await upsertTimeline(note.contextId, target.id, 'decision', `${kind === 'proposed' ? 'Proposal' : kind === 'confirmed' ? 'Reconfirmed' : 'Decision updated'}: ${truncate(d.statement, 90)}`, occurredAt, { noteId, refId: `drv:${noteId}:${related.x.id}` })
        result.decisions++
        continue
      }
      // Proposals only ever revise an existing decision; they never create one.
      if (d.status === 'proposed') continue
      const title = truncate(d.topic ? `${d.topic}: ${d.statement}` : d.statement, 100)
      const id = uid('dec')
      await db.insert(schema.decisions).values({ id, contextId: note.contextId, title: cleanTitle(title), statement: d.statement, decidedAt: occurredAt, reasoning: d.reasoning, alternatives: d.alternatives ?? [], status: 'active', topicEntityId: topic?.id, companyEntityId: company?.id, sourceNoteId: noteId, sourceExcerpt: d.excerpt })
      await db.insert(schema.decisionRevisions).values({ id: uid('drv'), decisionId: id, occurredAt, statement: d.statement, kind: 'made', sourceNoteId: noteId, sourceExcerpt: d.excerpt })
      ctxDecisions.push({ id, contextId: note.contextId, title, statement: d.statement, decidedAt: occurredAt, context: null, reasoning: d.reasoning ?? null, alternatives: d.alternatives ?? [], status: 'active', topicEntityId: topic?.id ?? null, companyEntityId: company?.id ?? null, sourceNoteId: noteId, sourceExcerpt: d.excerpt ?? null, aiGenerated: true, createdAt: new Date(), updatedAt: new Date() })
      if (topic) await upsertRelation(note.contextId, 'decision', id, 'topic', topic.id, 'about', noteId)
      for (const p of people) await upsertRelation(note.contextId, 'person', p.id, 'decision', id, 'involved_in', noteId)
      const target = topic ?? company
      if (target) await upsertTimeline(note.contextId, target.id, 'decision', `Decision: ${truncate(d.statement, 90)}`, occurredAt, { noteId, refId: `dec:${id}` })
      result.decisions++
    }

    /* --------------------------- commitments --------------------------- */
    const existingCommitments = await db.select().from(schema.commitments).where(and(eq(schema.commitments.contextId, note.contextId), eq(schema.commitments.status, 'open')))
    for (const c of ex.commitments) {
      if (!c.text || c.text.length < 8) continue
      if (existingCommitments.some((x) => similarText(x.text, c.text, 0.6))) continue
      const counterparty = findPerson(c.counterparty)
      const company = findCompany(c.company)
      await db.insert(schema.commitments).values({ id: uid('cmt'), contextId: note.contextId, text: truncate(c.text, 300), kind: c.kind, byWhom: c.byWhom ?? USER_NAME, counterpartyEntityId: counterparty?.id, companyEntityId: company?.id, sourceNoteId: noteId, sourceExcerpt: c.excerpt, dueHint: c.dueHint, dueAt: parseDueHint(c.dueHint, occurredAt), priority: 'normal', detectedAt: occurredAt })
      result.commitments++
    }

    /* ------------------------------ facts ------------------------------ */
    for (const n of ex.numbers) {
      if (!n.label || !n.value) continue
      const entity = findCompany(n.entity) ?? findPerson(n.entity) ?? findTopic(n.entity) ?? projects[0]
      if (!entity) continue
      const latest = (
        await db.select().from(schema.facts).where(and(eq(schema.facts.entityId, entity.id), eq(schema.facts.label, n.label), sql`${schema.facts.supersededById} is null`)).orderBy(desc(schema.facts.observedAt)).limit(1)
      )[0]
      if (latest && latest.sourceNoteId === noteId) continue
      if (latest && latest.value.replace(/\s/g, '') === n.value.replace(/\s/g, '')) continue
      const id = uid('fact')
      await db.insert(schema.facts).values({ id, contextId: note.contextId, entityId: entity.id, label: n.label, value: n.value, numericValue: n.numeric, unit: n.unit, sourceNoteId: noteId, sourceExcerpt: n.excerpt, observedAt: occurredAt })
      result.facts++
      if (latest && latest.observedAt <= occurredAt) {
        await db.update(schema.facts).set({ supersededById: id }).where(eq(schema.facts.id, latest.id))
        const description = `${entity.name} ${n.label.toLowerCase()} changed from ${latest.value} → ${n.value}`
        await db.insert(schema.changes).values({ id: uid('chg'), contextId: note.contextId, entityId: entity.id, label: n.label, oldValue: latest.value, newValue: n.value, description, sourceNoteId: noteId, previousNoteId: latest.sourceNoteId, detectedAt: occurredAt })
        await upsertTimeline(note.contextId, entity.id, 'change', description, occurredAt, { noteId, refId: `chg:${id}` })
        result.changes++
      }
    }

    /* ------------------------------ summary ---------------------------- */
    const summary = summaryFromExtraction(ex, usedProvider)
    const longEnough = (note.contentText?.length ?? 0) > 240 || ex.actions.length > 0 || ex.decisions.length > 0
    await db.update(schema.notes).set({ summary: longEnough ? summary : null, status: 'processed', aiProcessedAt: new Date(), processingError: null }).where(eq(schema.notes.id, noteId))
    if (note.meetingId) await db.update(schema.meetings).set({ summary, updatedAt: new Date() }).where(eq(schema.meetings.id, note.meetingId))

    /* ---------------------------- embeddings --------------------------- */
    await embedOwner(note.contextId, 'note', noteId, [note.title, note.contentText].filter(Boolean).join('\n\n'))
    for (const e of [...people, ...companies, ...topics, ...projects]) await touchEntityEmbedding(e)

    await refreshInsights(note.contextId).catch(() => undefined)
    return result
  } catch (err) {
    await db.update(schema.notes).set({ status: 'processed', processingError: String(err).slice(0, 500), aiProcessedAt: new Date() }).where(eq(schema.notes.id, noteId))
    throw err
  }
}

function cleanTitle(s: string): string {
  return s.replace(/[.:]+$/, '')
}

export async function embedOwner(contextId: string, ownerType: 'note' | 'entity' | 'task' | 'decision' | 'meeting' | 'research', ownerId: string, text: string) {
  const db = await getDb()
  await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, ownerType), eq(schema.embeddings.ownerId, ownerId)))
  const chunks = chunkText(text)
  if (chunks.length === 0) return
  const { vectors, provider } = await embedTexts(chunks)
  await db.insert(schema.embeddings).values(chunks.map((c, i) => ({ id: uid('emb'), contextId, ownerType, ownerId, chunkIndex: i, text: c, embedding: vectors[i]!, provider })))
}

async function touchEntityEmbedding(e: Entity) {
  const text = `${e.type}: ${e.name}\n${Object.entries(e.attributes).map(([k, v]) => `${k}: ${v}`).join('\n')}\n${e.aliases.join(', ')}\n${e.summary ?? ''}`
  await embedOwner(e.contextId, 'entity', e.id, text)
}

/** Re-run the pipeline over every note (Settings → Rebuild index). */
export async function reprocessAll(contextId?: string): Promise<number> {
  const db = await getDb()
  const rows = await db
    .select({ id: schema.notes.id })
    .from(schema.notes)
    .where(contextId ? and(eq(schema.notes.contextId, contextId), sql`${schema.notes.deletedAt} is null`) : sql`${schema.notes.deletedAt} is null`)
    .orderBy(schema.notes.createdAt)
  let n = 0
  for (const r of rows) {
    await processNote(r.id).catch(() => undefined)
    n++
  }
  return n
}

export async function deleteDerived(noteId: string) {
  const db = await getDb()
  await db.delete(schema.noteEntities).where(eq(schema.noteEntities.noteId, noteId))
  await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'note'), eq(schema.embeddings.ownerId, noteId)))
  await db.delete(schema.timelineEvents).where(eq(schema.timelineEvents.noteId, noteId))
  await db.delete(schema.tasks).where(and(eq(schema.tasks.sourceNoteId, noteId), eq(schema.tasks.aiGenerated, true), inArray(schema.tasks.status, ['open', 'waiting', 'delegated'])))
  await db.delete(schema.commitments).where(and(eq(schema.commitments.sourceNoteId, noteId), eq(schema.commitments.status, 'open')))
}
