/**
 * The integrity rules every record is held to. Pure: dataset in, issues out.
 *
 * Severity:
 *   error   — breaks the graph or the evidence contract (dangling reference, missing
 *             source, unknown predicate, duplicate id, impossible date). Build fails.
 *   warn    — weakens the record (no locator on a textual claim, recall-only status on a
 *             high-confidence claim, traditional association not marked class 6).
 */
import { NODE_TYPES, PREDICATES, AGENTS } from '../../schema/types.ts'
import type { Assertion, Entity, Source, DateClaim, SourceRef } from '../../schema/types.ts'
import type { Dataset } from './load.ts'

export interface Issue {
  severity: 'error' | 'warn'
  file: string
  id: string
  message: string
}

const STATUSES = new Set(['verified-online', 'source-checked', 'reference-checked', 'recall', 'unresolved', 'disputed'])
const CONFIDENCES = new Set(['high', 'medium', 'low'])
const SYSTEMS = new Set(['scholarly-textual', 'material', 'reception', 'traditional'])
const CERTAINTY = new Set(['secure', 'estimated', 'disputed'])
const SOURCE_TYPES = new Set([
  'primary-text', 'translation', 'scholarly-book', 'journal-article', 'catalogue', 'epigraphic-corpus',
  'excavation-report', 'institutional', 'reference', 'tradition',
])
const ID_RE = /^[a-z]+:[a-z0-9][a-z0-9-]*$/
const PREFIX: Record<string, string> = {
  collection: 'col', text: 'text', passage: 'psg', character: 'char', deity: 'deity', concept: 'concept',
  narrative: 'narr', lineage: 'lin', place: 'place', temple: 'temple', site: 'site', artifact: 'art',
  inscription: 'ins', manuscript: 'ms', person: 'person', polity: 'pol', institution: 'inst',
  tradition: 'trad', claim: 'claim',
}

/** Merge core identity with owner records into the final entity table (owner wins, aliases union). */
export function mergeEntities(ds: Dataset): { byId: Map<string, Entity & { _file: string }>; issues: Issue[] } {
  const issues: Issue[] = []
  const byId = new Map<string, Entity & { _file: string }>()
  const coreById = new Map(ds.core.map((c) => [c.id, c]))
  for (const f of ds.entities) {
    for (const e of f.items) {
      if (!e || typeof e.id !== 'string') {
        issues.push({ severity: 'error', file: f.file, id: '?', message: 'entity without id' })
        continue
      }
      if (byId.has(e.id)) {
        issues.push({ severity: 'error', file: f.file, id: e.id, message: `duplicate entity id (also in ${byId.get(e.id)!._file})` })
        continue
      }
      const core = coreById.get(e.id)
      if (core && core.owner !== f.domain && f.domain !== 'core') {
        issues.push({ severity: 'warn', file: f.file, id: e.id, message: `core entity owned by "${core.owner}" defined in "${f.domain}" file` })
      }
      const merged = { ...e, _file: f.file }
      if (core) {
        merged.name = e.name || core.name
        merged.iast = e.iast || core.iast
        merged.devanagari = e.devanagari || core.devanagari
        merged.aliases = [...new Set([...(core.aliases ?? []), ...(e.aliases ?? [])])]
        merged.type = e.type || core.type
      }
      byId.set(e.id, merged)
    }
  }
  // core identities without an owner record still exist as nodes (thin) — flagged.
  for (const c of ds.core) {
    if (!byId.has(c.id)) {
      issues.push({ severity: 'warn', file: 'data/core-registry.json', id: c.id, message: `core entity has no full record from owner "${c.owner}"` })
      byId.set(c.id, {
        id: c.id, type: c.type, name: c.name, iast: c.iast, devanagari: c.devanagari, aliases: c.aliases,
        summary: '', sources: [], confidence: 'low', status: 'unresolved', agent: c.owner, _file: 'core-registry',
      })
    }
  }
  return { byId, issues }
}

function checkRefs(refs: SourceRef[] | undefined, sourceIds: Set<string>, file: string, id: string, issues: Issue[], where: string) {
  if (!Array.isArray(refs)) return
  for (const r of refs) {
    if (!r || typeof r.source !== 'string') issues.push({ severity: 'error', file, id, message: `${where}: source ref without "source"` })
    else if (!sourceIds.has(r.source)) issues.push({ severity: 'error', file, id, message: `${where}: unknown source "${r.source}"` })
  }
}

function checkDate(d: DateClaim, sourceIds: Set<string>, file: string, id: string, issues: Issue[]) {
  if (!SYSTEMS.has(d.system)) issues.push({ severity: 'error', file, id, message: `date: unknown system "${d.system}"` })
  if (!CERTAINTY.has(d.certainty)) issues.push({ severity: 'error', file, id, message: `date: unknown certainty "${d.certainty}"` })
  if (!d.label) issues.push({ severity: 'error', file, id, message: 'date: missing label' })
  if (!d.event) issues.push({ severity: 'warn', file, id, message: 'date: missing event (what is dated)' })
  if (d.system !== 'traditional') {
    if (typeof d.start !== 'number' || typeof d.end !== 'number') {
      issues.push({ severity: 'error', file, id, message: `date "${d.label}": non-traditional dates need numeric start and end` })
    } else {
      if (d.start > d.end) issues.push({ severity: 'error', file, id, message: `date "${d.label}": start after end` })
      if (d.end > 2026) issues.push({ severity: 'error', file, id, message: `date "${d.label}": in the future` })
      if (d.start < -4000 && d.system !== 'material') issues.push({ severity: 'warn', file, id, message: `date "${d.label}": earlier than 4000 BCE for a textual/reception date — check` })
      if (d.certainty === 'secure' && d.end - d.start > 50 && d.system === 'material') {
        issues.push({ severity: 'warn', file, id, message: `date "${d.label}": marked secure but spans ${d.end - d.start} years` })
      }
    }
  }
  if (!d.basis) issues.push({ severity: 'warn', file, id, message: `date "${d.label}": missing basis` })
  if (!Array.isArray(d.sources) || d.sources.length === 0) issues.push({ severity: 'error', file, id, message: `date "${d.label}": no sources` })
  checkRefs(d.sources, sourceIds, file, id, issues, `date "${d.label}"`)
}

export function checkDataset(ds: Dataset): { issues: Issue[]; entities: Map<string, Entity & { _file: string }>; assertions: (Assertion & { _file: string })[]; sources: Map<string, Source> } {
  const issues: Issue[] = ds.parseErrors.map((m) => ({ severity: 'error' as const, file: m.split(':')[0], id: '-', message: m }))

  // sources
  const sources = new Map<string, Source>()
  for (const f of ds.sources) {
    for (const s of f.items) {
      if (!s?.id) { issues.push({ severity: 'error', file: f.file, id: '?', message: 'source without id' }); continue }
      if (sources.has(s.id)) { issues.push({ severity: 'error', file: f.file, id: s.id, message: 'duplicate source id' }); continue }
      if (!s.id.startsWith('src:')) issues.push({ severity: 'error', file: f.file, id: s.id, message: 'source id must start with "src:"' })
      if (!SOURCE_TYPES.has(s.type)) issues.push({ severity: 'error', file: f.file, id: s.id, message: `unknown source type "${s.type}"` })
      if (!s.title) issues.push({ severity: 'error', file: f.file, id: s.id, message: 'source without title' })
      sources.set(s.id, s)
    }
  }
  const sourceIds = new Set(sources.keys())

  // entities
  const { byId: entities, issues: mergeIssues } = mergeEntities(ds)
  issues.push(...mergeIssues)
  const types = new Set<string>(NODE_TYPES)
  for (const e of entities.values()) {
    const file = e._file
    if (!ID_RE.test(e.id)) issues.push({ severity: 'error', file, id: e.id, message: 'id must be "<prefix>:<kebab-slug>" (lowercase ascii)' })
    if (!types.has(e.type)) issues.push({ severity: 'error', file, id: e.id, message: `unknown node type "${e.type}"` })
    else if (PREFIX[e.type] && !e.id.startsWith(PREFIX[e.type] + ':')) issues.push({ severity: 'error', file, id: e.id, message: `type ${e.type} ids must start with "${PREFIX[e.type]}:"` })
    if (file === 'core-registry') continue
    if (!e.name) issues.push({ severity: 'error', file, id: e.id, message: 'missing name' })
    if (!e.summary || e.summary.length < 20) issues.push({ severity: 'warn', file, id: e.id, message: 'summary missing or very short' })
    if (!CONFIDENCES.has(e.confidence)) issues.push({ severity: 'error', file, id: e.id, message: `bad confidence "${e.confidence}"` })
    if (!STATUSES.has(e.status)) issues.push({ severity: 'error', file, id: e.id, message: `bad status "${e.status}"` })
    if (!(e.agent in AGENTS)) issues.push({ severity: 'error', file, id: e.id, message: `unknown agent "${e.agent}"` })
    if (!Array.isArray(e.sources) || e.sources.length === 0) issues.push({ severity: 'error', file, id: e.id, message: 'entity has no sources' })
    checkRefs(e.sources, sourceIds, file, e.id, issues, 'entity')
    for (const d of e.dates ?? []) checkDate(d, sourceIds, file, e.id, issues)
    for (const t of e.traditions ?? []) if (!t.startsWith('trad:')) issues.push({ severity: 'error', file, id: e.id, message: `traditions must be tradition ids, got "${t}"` })
    if (e.location) {
      const { lat, lon } = e.location
      if (typeof lat !== 'number' || typeof lon !== 'number' || lat < -60 || lat > 70 || lon < -30 || lon > 180) {
        issues.push({ severity: 'error', file, id: e.id, message: `implausible coordinates ${lat},${lon}` })
      }
      if (!e.location.label || !e.location.country) issues.push({ severity: 'warn', file, id: e.id, message: 'location without label/country' })
    }
    if ((e.type === 'temple' || e.type === 'site') && !e.location) issues.push({ severity: 'warn', file, id: e.id, message: `${e.type} without coordinates` })
    if (['artifact', 'inscription', 'manuscript', 'temple', 'site'].includes(e.type) && !(e.dates ?? []).some((d) => d.system === 'material')) {
      issues.push({ severity: 'warn', file, id: e.id, message: `${e.type} without a material date` })
    }
    if (e.image && (!e.image.license || !e.image.page || !e.image.credit)) issues.push({ severity: 'error', file, id: e.id, message: 'image without licence/page/credit' })
  }

  // assertions
  const assertions: (Assertion & { _file: string })[] = []
  const seen = new Set<string>()
  const triple = new Map<string, string>()
  for (const f of ds.assertions) {
    for (const a of f.items) {
      const file = f.file
      if (!a?.id) { issues.push({ severity: 'error', file, id: '?', message: 'assertion without id' }); continue }
      if (seen.has(a.id)) { issues.push({ severity: 'error', file, id: a.id, message: 'duplicate assertion id' }); continue }
      seen.add(a.id)
      if (!(a.p in PREDICATES)) issues.push({ severity: 'error', file, id: a.id, message: `unknown predicate "${a.p}"` })
      if (!entities.has(a.s)) issues.push({ severity: 'error', file, id: a.id, message: `unknown subject "${a.s}"` })
      if (!entities.has(a.o)) issues.push({ severity: 'error', file, id: a.id, message: `unknown object "${a.o}"` })
      if (a.s === a.o) issues.push({ severity: 'error', file, id: a.id, message: 'self-loop' })
      if (![1, 2, 3, 4, 5, 6, 7].includes(a.evidenceClass)) issues.push({ severity: 'error', file, id: a.id, message: `bad evidenceClass ${a.evidenceClass}` })
      if (!CONFIDENCES.has(a.confidence)) issues.push({ severity: 'error', file, id: a.id, message: `bad confidence "${a.confidence}"` })
      if (!STATUSES.has(a.status)) issues.push({ severity: 'error', file, id: a.id, message: `bad status "${a.status}"` })
      if (!(a.agent in AGENTS)) issues.push({ severity: 'error', file, id: a.id, message: `unknown agent "${a.agent}"` })
      if (!Array.isArray(a.sources) || a.sources.length === 0) issues.push({ severity: 'error', file, id: a.id, message: 'assertion has no sources' })
      checkRefs(a.sources, sourceIds, file, a.id, issues, 'assertion')
      if (a.evidenceClass === 1 && !(a.sources ?? []).some((r) => r.locator)) issues.push({ severity: 'warn', file, id: a.id, message: 'class-1 textual attestation without a passage locator' })
      if (a.p === 'ASSOCIATED_WITH' && a.evidenceClass !== 6 && a.evidenceClass !== 7 && a.evidenceClass !== 5) {
        issues.push({ severity: 'warn', file, id: a.id, message: 'ASSOCIATED_WITH is a traditional association — evidence class should normally be 6 (or 5/7)' })
      }
      if ((a.p === 'AVATARA_OF' || a.p === 'IDENTIFIED_WITH' || a.p === 'FORM_OF') && !a.qualifiers?.tradition && !a.qualifiers?.text) {
        issues.push({ severity: 'warn', file, id: a.id, message: `${a.p} should be qualified by tradition or text` })
      }
      if (a.confidence === 'high' && a.status === 'recall' && a.evidenceClass === 1) {
        issues.push({ severity: 'warn', file, id: a.id, message: 'high-confidence textual locator from recall — verify online' })
      }
      if (a.qualifiers?.text && !entities.has(a.qualifiers.text)) issues.push({ severity: 'error', file, id: a.id, message: `qualifier text "${a.qualifiers.text}" unknown` })
      if (a.qualifiers?.tradition && a.qualifiers.tradition.startsWith('trad:') && !entities.has(a.qualifiers.tradition)) {
        issues.push({ severity: 'error', file, id: a.id, message: `qualifier tradition "${a.qualifiers.tradition}" unknown` })
      }
      const key = `${a.s}|${a.p}|${a.o}|${a.qualifiers?.text ?? ''}|${a.qualifiers?.tradition ?? ''}`
      if (triple.has(key)) issues.push({ severity: 'warn', file, id: a.id, message: `duplicate triple (same as ${triple.get(key)})` })
      else triple.set(key, a.id)
      assertions.push({ ...a, _file: file })
    }
  }

  // comparisons
  for (const f of ds.comparisons) {
    for (const c of f.items) {
      if (!c?.id) continue
      if (!entities.has(c.subject)) issues.push({ severity: 'error', file: f.file, id: c.id, message: `comparison subject "${c.subject}" unknown` })
      for (const r of c.rows ?? []) {
        if (!entities.has(r.text)) issues.push({ severity: 'error', file: f.file, id: c.id, message: `comparison row text "${r.text}" unknown` })
        checkRefs(r.sources, sourceIds, f.file, c.id, issues, 'comparison row')
        if (!r.sources?.length) issues.push({ severity: 'error', file: f.file, id: c.id, message: 'comparison row without sources' })
      }
    }
  }

  // discoveries
  for (const d of ds.discoveries) {
    for (const id of d.entities ?? []) if (!entities.has(id)) issues.push({ severity: 'error', file: 'data/discoveries.json', id: d.id, message: `unknown entity ${id}` })
    for (const id of d.assertions ?? []) if (!seen.has(id)) issues.push({ severity: 'error', file: 'data/discoveries.json', id: d.id, message: `unknown assertion ${id}` })
    checkRefs(d.sources, sourceIds, 'data/discoveries.json', d.id, issues, 'discovery')
  }
  for (const s of ds.sacred) checkRefs(s.sources, sourceIds, 'data/sacred-chronology.json', s.id, issues, 'sacred era')

  return { issues, entities, assertions, sources }
}
