import { and, eq, inArray, sql } from 'drizzle-orm'
import { getDb, schema } from '../db'
import { markdownToDoc, docToText } from '../markdown'
import { uid, wordCount, slugify } from '../util'
import { processNote, embedOwner } from '../pipeline'
import { refreshInsights } from '../insights'
import { CONTEXTS, DECISIONS, ENTITIES, NOTES, RESEARCH, UPCOMING, USER } from './data'

export const DEFAULT_NOTEBOOK = { id: 'nb_default', slug: 'primary', name: 'Primary' }

function at(daysAgo: number, hour = 10): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d
}

function markerKey(notebookId: string) {
  return notebookId === DEFAULT_NOTEBOOK.id ? 'seeded' : `seeded:${notebookId}`
}

/** Fully seeded = the completion marker exists. A partial seed (interrupted mid-way) reports false and is completed idempotently. */
export async function isSeeded(notebookId = DEFAULT_NOTEBOOK.id): Promise<boolean> {
  const db = await getDb()
  const rows = await db.select({ key: schema.appMeta.key }).from(schema.appMeta).where(eq(schema.appMeta.key, markerKey(notebookId)))
  return rows.length > 0
}

/** Ids for a notebook's copy of the sample data: the Primary notebook keeps the canonical ids, others get a suffix. */
export function seedIdMapper(notebookId: string) {
  const isDefault = notebookId === DEFAULT_NOTEBOOK.id
  const suffix = notebookId.replace(/^nb_/, '')
  return (id: string) => (isDefault ? id : `${id}__${suffix}`)
}

/** Create the five default contexts for a notebook (idempotent). */
export async function ensureDefaultContexts(notebookId: string): Promise<void> {
  const db = await getDb()
  const mapId = seedIdMapper(notebookId)
  await db.insert(schema.contexts).values(CONTEXTS.map((c) => ({ id: mapId(c.id), slug: c.slug, name: c.name, kind: c.kind, description: c.description, position: c.position, notebookId }))).onConflictDoNothing()
}

/** Remove every row that belongs to a notebook's contexts (and the contexts). Users, tokens and the notebook row are left alone. */
export async function wipeNotebookData(notebookId: string, opts: { keepContexts?: boolean } = {}): Promise<void> {
  const db = await getDb()
  const ctxIds = (await db.select({ id: schema.contexts.id }).from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId))).map((r) => r.id)
  if (ctxIds.length === 0) return
  const noteIds = (await db.select({ id: schema.notes.id }).from(schema.notes).where(inArray(schema.notes.contextId, ctxIds))).map((r) => r.id)
  const meetingIds = (await db.select({ id: schema.meetings.id }).from(schema.meetings).where(inArray(schema.meetings.contextId, ctxIds))).map((r) => r.id)
  const decisionIds = (await db.select({ id: schema.decisions.id }).from(schema.decisions).where(inArray(schema.decisions.contextId, ctxIds))).map((r) => r.id)
  if (noteIds.length) {
    await db.delete(schema.attachments).where(inArray(schema.attachments.noteId, noteIds))
    await db.delete(schema.sources).where(inArray(schema.sources.noteId, noteIds))
    await db.delete(schema.noteEntities).where(inArray(schema.noteEntities.noteId, noteIds))
    await db.delete(schema.noteVersions).where(inArray(schema.noteVersions.noteId, noteIds))
    await db.delete(schema.shareLinks).where(inArray(schema.shareLinks.noteId, noteIds))
  }
  if (meetingIds.length) await db.delete(schema.transcripts).where(inArray(schema.transcripts.meetingId, meetingIds))
  if (decisionIds.length) await db.delete(schema.decisionRevisions).where(inArray(schema.decisionRevisions.decisionId, decisionIds))
  await db.delete(schema.aiCalls).where(eq(schema.aiCalls.notebookId, notebookId))
  for (const t of [schema.insights, schema.embeddings, schema.timelineEvents, schema.researchProjects, schema.changes, schema.facts, schema.commitments, schema.decisions, schema.tasks, schema.entityRelations, schema.entities, schema.meetings, schema.notes, schema.weeklyReviews] as const) {
    // Every one of these tables carries a context_id column.
    await db.delete(t).where(inArray((t as unknown as { contextId: typeof schema.notes.contextId }).contextId, ctxIds))
  }
  if (!opts.keepContexts) await db.delete(schema.contexts).where(inArray(schema.contexts.id, ctxIds))
  await db.delete(schema.appMeta).where(eq(schema.appMeta.key, markerKey(notebookId)))
}

/**
  Load the sample dataset into a notebook. For the Primary notebook this also
  creates the notebook and its owner (a fresh install). Every step is idempotent
  so an interrupted seed can be completed on the next run without duplicates.
*/
export async function runSeed(opts: { force?: boolean; log?: (s: string) => void; notebookId?: string } = {}): Promise<{ ok: boolean; notes: number }> {
  const db = await getDb()
  const log = opts.log ?? (() => undefined)
  const nb = opts.notebookId ?? DEFAULT_NOTEBOOK.id
  const mapId = seedIdMapper(nb)
  const ctxId = (c: string) => mapId(c)
  if ((await isSeeded(nb)) && !opts.force) return { ok: true, notes: 0 }
  if (opts.force) {
    log('wiping existing data')
    await wipeNotebookData(nb)
  }
  log('seeding')
  if (nb === DEFAULT_NOTEBOOK.id) {
    // Fresh install: the Primary notebook and its owner, who is also the platform admin.
    await db.insert(schema.users).values({ id: USER.id, name: USER.name, email: USER.email, notebookId: nb, role: 'admin', emailVerifiedAt: new Date(), settings: { theme: 'system', aiProvider: 'auto', aiEnabled: true, proactiveInsights: true, dailyBriefHour: 7, defaultContext: 'work' } }).onConflictDoNothing()
    await db.insert(schema.notebooks).values({ id: nb, slug: DEFAULT_NOTEBOOK.slug, name: DEFAULT_NOTEBOOK.name, ownerUserId: USER.id, plan: 'team', settings: { sampleData: true } }).onConflictDoNothing()
  }
  await ensureDefaultContexts(nb)

  const entityIds = new Map<string, string>()
  for (const e of ENTITIES) {
    const slug = slugify(e.name)
    await db.insert(schema.entities).values({ id: uid('ent'), contextId: ctxId(e.ctx), type: e.type, name: e.name, slug, aliases: e.aliases ?? [], attributes: e.attributes ?? {}, pinned: e.pinned ?? false }).onConflictDoNothing()
    const row = (await db.select({ id: schema.entities.id }).from(schema.entities).where(and(eq(schema.entities.contextId, ctxId(e.ctx)), eq(schema.entities.type, e.type), eq(schema.entities.slug, slug))))[0]
    if (row) entityIds.set(`${e.ctx}:${e.type}:${e.name.toLowerCase()}`, row.id)
  }
  const findEntity = (ctx: string, type: string, name: string) => entityIds.get(`${ctx}:${type}:${name.toLowerCase()}`)
  const safeEmbed = async (...args: Parameters<typeof embedOwner>) => {
    try {
      await embedOwner(...args)
    } catch (err) {
      log(`  embedding skipped: ${String(err).slice(0, 120)}`)
    }
  }

  for (const r of RESEARCH) {
    const inserted = await db.insert(schema.researchProjects).values({ id: mapId(r.id), contextId: ctxId(r.ctx), name: r.name, slug: r.slug, description: r.description, question: r.question, synthesis: r.synthesis, synthesisUpdatedAt: at(1, 9), createdAt: at(30), updatedAt: at(1, 9) }).onConflictDoNothing().returning({ id: schema.researchProjects.id })
    if (inserted.length) await safeEmbed(ctxId(r.ctx), 'research', mapId(r.id), `${r.name}\n${r.description}\n${r.question}\n${r.synthesis}`)
  }

  const ordered = [...NOTES].sort((a, b) => b.daysAgo - a.daysAgo || (a.hour ?? 10) - (b.hour ?? 10))
  const existingNoteIds = new Set((await db.select({ id: schema.notes.id }).from(schema.notes)).map((r) => r.id))
  const newNotes: typeof ordered = []
  for (const n of ordered) {
    const noteId = mapId(n.id)
    if (existingNoteIds.has(noteId)) continue
    newNotes.push(n)
    const createdAt = at(n.daysAgo, n.hour)
    let meetingId: string | undefined
    if (n.meeting) {
      meetingId = uid('mtg')
      const endsAt = new Date(createdAt.getTime() + n.meeting.durationMin * 60000)
      const companyName = n.title.split(' — ')[0]?.trim()
      const companyId = companyName ? findEntity(n.ctx, 'company', companyName) : undefined
      await db.insert(schema.meetings).values({ id: meetingId, contextId: ctxId(n.ctx), title: n.title, startsAt: createdAt, endsAt, status: 'completed', location: n.meeting.location, companyEntityId: companyId, createdAt, updatedAt: createdAt })
      for (const p of n.meeting.participants) {
        const pid = findEntity(n.ctx, 'person', p)
        if (pid) await db.insert(schema.entityRelations).values({ id: uid('rel'), contextId: ctxId(n.ctx), fromType: 'person', fromId: pid, toType: 'meeting', toId: meetingId, relation: 'attended' }).onConflictDoNothing()
      }
      if (n.meeting.transcript) {
        let t = 0
        const segments = n.meeting.transcript.map((s) => {
          const seg = { t, speaker: s.speaker, text: s.text }
          t += Math.max(8, Math.round(s.text.split(' ').length * 0.45))
          return seg
        })
        await db.insert(schema.transcripts).values({ id: uid('tr'), meetingId, segments, text: segments.map((s) => `${s.speaker}: ${s.text}`).join('\n'), source: 'seed', createdAt: endsAt })
      }
    }
    const doc = markdownToDoc(n.body)
    const text = docToText(doc)
    await db.insert(schema.notes).values({
      id: noteId, contextId: ctxId(n.ctx), title: n.title, kind: n.kind ?? 'note', status: 'processed', contentJson: doc, contentText: text, meetingId, researchProjectId: n.research ? mapId(n.research) : undefined, favorite: n.favorite ?? false, source: n.source ?? 'editor', sourceUrl: n.sourceUrl, wordCount: wordCount(text), createdAt, updatedAt: createdAt,
    })
    if (meetingId) await db.update(schema.meetings).set({ noteId }).where(eq(schema.meetings.id, meetingId))
    if (n.sourceUrl) await db.insert(schema.sources).values({ id: uid('src'), noteId, kind: 'url', title: n.title, url: n.sourceUrl, domain: new URL(n.sourceUrl).hostname, createdAt })
  }

  for (const m of UPCOMING) {
    const startsAt = at(-m.daysAhead, m.hour)
    const id = mapId(m.id)
    const inserted = await db.insert(schema.meetings).values({ id, contextId: ctxId(m.ctx), title: m.title, startsAt, endsAt: new Date(startsAt.getTime() + m.durationMin * 60000), status: 'upcoming', location: m.location, companyEntityId: m.company ? findEntity(m.ctx, 'company', m.company) : undefined, createdAt: at(3), updatedAt: at(3) }).onConflictDoNothing().returning({ id: schema.meetings.id })
    if (!inserted.length) continue
    for (const p of m.participants) {
      const pid = findEntity(m.ctx, 'person', p)
      if (pid) await db.insert(schema.entityRelations).values({ id: uid('rel'), contextId: ctxId(m.ctx), fromType: 'person', fromId: pid, toType: 'meeting', toId: id, relation: 'attended' }).onConflictDoNothing()
    }
  }

  const ctxIds = CONTEXTS.map((c) => ctxId(c.id))
  const existingDecisionTitles = new Set((await db.select({ title: schema.decisions.title }).from(schema.decisions).where(inArray(schema.decisions.contextId, ctxIds))).map((r) => r.title))
  for (const d of DECISIONS) {
    if (existingDecisionTitles.has(d.title)) continue
    const id = uid('dec')
    const first = d.history[0]!
    const latestDecided = [...d.history].reverse().find((h) => h.kind === 'made' || h.kind === 'confirmed' || h.kind === 'modified') ?? first
    const last = d.history[d.history.length - 1]!
    const status = last.kind === 'contradicted' ? 'revisited' : last.kind === 'proposed' ? 'revisited' : 'active'
    await db.insert(schema.decisions).values({ id, contextId: ctxId(d.ctx), title: d.title, statement: latestDecided.statement, decidedAt: at(latestDecided.daysAgo, 12), context: d.context, reasoning: d.reasoning, alternatives: d.alternatives, status, topicEntityId: d.topic ? findEntity(d.ctx, 'topic', d.topic) : undefined, companyEntityId: d.company ? findEntity(d.ctx, 'company', d.company) : undefined, sourceNoteId: mapId(latestDecided.note), sourceExcerpt: latestDecided.statement, aiGenerated: true, createdAt: at(first.daysAgo, 12), updatedAt: at(last.daysAgo, 12) })
    for (const h of d.history) {
      await db.insert(schema.decisionRevisions).values({ id: uid('drv'), decisionId: id, occurredAt: at(h.daysAgo, 12), statement: h.statement, kind: h.kind, sourceNoteId: mapId(h.note), sourceExcerpt: h.statement, createdAt: at(h.daysAgo, 12) })
      const target = (d.topic && findEntity(d.ctx, 'topic', d.topic)) || (d.company && findEntity(d.ctx, 'company', d.company))
      if (target) await db.insert(schema.timelineEvents).values({ id: uid('tl'), contextId: ctxId(d.ctx), entityId: target, kind: 'decision', title: `${h.kind === 'proposed' ? 'Proposal' : h.kind === 'contradicted' ? 'Challenged' : h.kind === 'confirmed' ? 'Reconfirmed' : 'Decision'}: ${h.statement}`, occurredAt: at(h.daysAgo, 12), noteId: mapId(h.note), refId: `seed-dec:${id}:${h.daysAgo}` }).onConflictDoNothing()
    }
    await safeEmbed(ctxId(d.ctx), 'decision', id, `${d.title}\n${latestDecided.statement}\n${d.context}\n${d.reasoning}`)
  }

  let count = 0
  for (const n of newNotes) {
    log(`processing ${mapId(n.id)}`)
    try {
      await processNote(mapId(n.id))
    } catch (err) {
      log(`  failed: ${String(err).slice(0, 200)}`)
    }
    count++
  }
  for (const c of CONTEXTS) await refreshInsights(ctxId(c.id))
  const key = markerKey(nb)
  await db.insert(schema.appMeta).values({ key, value: { at: new Date().toISOString(), notes: count } }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value: { at: new Date().toISOString(), notes: count } } })
  log('done')
  return { ok: true, notes: count }
}

/** Sum of a count(*) per table for the admin dashboard. */
export const sqlCount = sql<number>`count(*)`
