import { eq, sql } from 'drizzle-orm'
import { getDb, schema } from '../db'
import { markdownToDoc, docToText } from '../markdown'
import { uid, wordCount, slugify } from '../util'
import { processNote, embedOwner } from '../pipeline'
import { refreshInsights } from '../insights'
import { CONTEXTS, DECISIONS, ENTITIES, NOTES, RESEARCH, UPCOMING, USER } from './data'

function at(daysAgo: number, hour = 10): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d
}

export async function isSeeded(): Promise<boolean> {
  const db = await getDb()
  const rows = await db.select({ n: sql<number>`count(*)` }).from(schema.contexts)
  return Number(rows[0]?.n ?? 0) > 0
}

export async function runSeed(opts: { force?: boolean; log?: (s: string) => void } = {}): Promise<{ ok: boolean; notes: number }> {
  const db = await getDb()
  const log = opts.log ?? (() => undefined)
  if (await isSeeded()) {
    if (!opts.force) return { ok: true, notes: 0 }
    log('wiping existing data')
    for (const t of [schema.aiCalls, schema.insights, schema.embeddings, schema.timelineEvents, schema.attachments, schema.sources, schema.researchProjects, schema.changes, schema.facts, schema.commitments, schema.decisionRevisions, schema.decisions, schema.tasks, schema.entityRelations, schema.noteEntities, schema.entities, schema.transcripts, schema.meetings, schema.notes, schema.contexts, schema.users, schema.appMeta]) {
      await db.delete(t)
    }
  }
  log('seeding')
  await db.insert(schema.users).values({ id: USER.id, name: USER.name, email: USER.email, settings: { theme: 'system', aiProvider: 'auto', aiEnabled: true, proactiveInsights: true, dailyBriefHour: 7, defaultContext: 'work' } })
  await db.insert(schema.contexts).values(CONTEXTS.map((c) => ({ id: c.id, slug: c.slug, name: c.name, kind: c.kind, description: c.description, position: c.position })))

  const entityIds = new Map<string, string>()
  for (const e of ENTITIES) {
    const id = uid('ent')
    entityIds.set(`${e.ctx}:${e.type}:${e.name.toLowerCase()}`, id)
    await db.insert(schema.entities).values({ id, contextId: e.ctx, type: e.type, name: e.name, slug: slugify(e.name), aliases: e.aliases ?? [], attributes: e.attributes ?? {}, pinned: e.pinned ?? false })
  }
  const findEntity = (ctx: string, type: string, name: string) => entityIds.get(`${ctx}:${type}:${name.toLowerCase()}`)

  for (const r of RESEARCH) {
    await db.insert(schema.researchProjects).values({ id: r.id, contextId: r.ctx, name: r.name, slug: r.slug, description: r.description, question: r.question, synthesis: r.synthesis, synthesisUpdatedAt: at(1, 9), createdAt: at(30), updatedAt: at(1, 9) })
    await embedOwner(r.ctx, 'research', r.id, `${r.name}\n${r.description}\n${r.question}\n${r.synthesis}`)
  }

  const ordered = [...NOTES].sort((a, b) => b.daysAgo - a.daysAgo || (a.hour ?? 10) - (b.hour ?? 10))
  for (const n of ordered) {
    const createdAt = at(n.daysAgo, n.hour)
    let meetingId: string | undefined
    if (n.meeting) {
      meetingId = uid('mtg')
      const endsAt = new Date(createdAt.getTime() + n.meeting.durationMin * 60000)
      const companyName = n.title.split(' — ')[0]?.trim()
      const companyId = companyName ? findEntity(n.ctx, 'company', companyName) : undefined
      await db.insert(schema.meetings).values({ id: meetingId, contextId: n.ctx, title: n.title, startsAt: createdAt, endsAt, status: 'completed', location: n.meeting.location, companyEntityId: companyId, createdAt, updatedAt: createdAt })
      for (const p of n.meeting.participants) {
        const pid = findEntity(n.ctx, 'person', p)
        if (pid) await db.insert(schema.entityRelations).values({ id: uid('rel'), contextId: n.ctx, fromType: 'person', fromId: pid, toType: 'meeting', toId: meetingId, relation: 'attended' }).onConflictDoNothing()
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
      id: n.id, contextId: n.ctx, title: n.title, kind: n.kind ?? 'note', status: 'processed', contentJson: doc, contentText: text, meetingId, researchProjectId: n.research, favorite: n.favorite ?? false, source: n.source ?? (n.meeting ? 'editor' : 'editor'), sourceUrl: n.sourceUrl, wordCount: wordCount(text), createdAt, updatedAt: createdAt,
    })
    if (meetingId) await db.update(schema.meetings).set({ noteId: n.id }).where(eq(schema.meetings.id, meetingId))
    if (n.sourceUrl) await db.insert(schema.sources).values({ id: uid('src'), noteId: n.id, kind: 'url', title: n.title, url: n.sourceUrl, domain: new URL(n.sourceUrl).hostname, createdAt })
  }

  for (const m of UPCOMING) {
    const startsAt = at(-m.daysAhead, m.hour)
    const id = m.id
    await db.insert(schema.meetings).values({ id, contextId: m.ctx, title: m.title, startsAt, endsAt: new Date(startsAt.getTime() + m.durationMin * 60000), status: 'upcoming', location: m.location, companyEntityId: m.company ? findEntity(m.ctx, 'company', m.company) : undefined, createdAt: at(3), updatedAt: at(3) })
    for (const p of m.participants) {
      const pid = findEntity(m.ctx, 'person', p)
      if (pid) await db.insert(schema.entityRelations).values({ id: uid('rel'), contextId: m.ctx, fromType: 'person', fromId: pid, toType: 'meeting', toId: id, relation: 'attended' }).onConflictDoNothing()
    }
  }

  for (const d of DECISIONS) {
    const id = uid('dec')
    const first = d.history[0]!
    const latestDecided = [...d.history].reverse().find((h) => h.kind === 'made' || h.kind === 'confirmed' || h.kind === 'modified') ?? first
    const last = d.history[d.history.length - 1]!
    const status = last.kind === 'contradicted' ? 'revisited' : last.kind === 'proposed' ? 'revisited' : 'active'
    await db.insert(schema.decisions).values({ id, contextId: d.ctx, title: d.title, statement: latestDecided.statement, decidedAt: at(latestDecided.daysAgo, 12), context: d.context, reasoning: d.reasoning, alternatives: d.alternatives, status, topicEntityId: d.topic ? findEntity(d.ctx, 'topic', d.topic) : undefined, companyEntityId: d.company ? findEntity(d.ctx, 'company', d.company) : undefined, sourceNoteId: latestDecided.note, sourceExcerpt: latestDecided.statement, aiGenerated: true, createdAt: at(first.daysAgo, 12), updatedAt: at(last.daysAgo, 12) })
    for (const h of d.history) {
      await db.insert(schema.decisionRevisions).values({ id: uid('drv'), decisionId: id, occurredAt: at(h.daysAgo, 12), statement: h.statement, kind: h.kind, sourceNoteId: h.note, sourceExcerpt: h.statement, createdAt: at(h.daysAgo, 12) })
      const target = (d.topic && findEntity(d.ctx, 'topic', d.topic)) || (d.company && findEntity(d.ctx, 'company', d.company))
      if (target) await db.insert(schema.timelineEvents).values({ id: uid('tl'), contextId: d.ctx, entityId: target, kind: 'decision', title: `${h.kind === 'proposed' ? 'Proposal' : h.kind === 'contradicted' ? 'Challenged' : h.kind === 'confirmed' ? 'Reconfirmed' : 'Decision'}: ${h.statement}`, occurredAt: at(h.daysAgo, 12), noteId: h.note, refId: `seed-dec:${id}:${h.daysAgo}` }).onConflictDoNothing()
    }
    await embedOwner(d.ctx, 'decision', id, `${d.title}\n${latestDecided.statement}\n${d.context}\n${d.reasoning}`)
  }

  let count = 0
  for (const n of ordered) {
    log(`processing ${n.id}`)
    try {
      await processNote(n.id)
    } catch (err) {
      log(`  failed: ${String(err).slice(0, 200)}`)
    }
    count++
  }
  for (const c of CONTEXTS) await refreshInsights(c.id)
  await db.insert(schema.appMeta).values({ key: 'seeded', value: { at: new Date().toISOString(), notes: count } }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value: { at: new Date().toISOString(), notes: count } } })
  log('done')
  return { ok: true, notes: count }
}
