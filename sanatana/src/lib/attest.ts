/**
 * Attestation gathering — "what documented references to X, and what dated physical
 * representations associated with X, exist, and from when?"
 *
 * Textual attestations come from APPEARS_IN / MENTIONED_IN / NARRATED_IN / TEACHES_IN
 * edges, dated by the scholarly date of the text (passages inherit their text's date).
 * Material attestations come from DEPICTED_IN / WORSHIPPED_AT (figure → object) and
 * REFERS_TO / INTERPRETED_AS (object → figure), dated by the object's material date.
 * Optionally, figures linked by IDENTIFIED_WITH (either direction) or FORM_OF (forms of
 * X) are included — always labelled with the identification they come through, since
 * an identification is itself an interpretive assertion.
 */
import type { Store, GNode, GEdge } from '../data/store.tsx'
import { textFromLocator, NARRATIVE_ROLE_PREDICATES } from './locators.ts'

export type Lane = 'text' | 'reception' | 'material' | 'tradition'
export interface Attestation {
  key: string
  lane: Lane
  node: GNode // the text / object / temple
  start: number
  end: number
  label: string // date label
  certainty: string
  edge: GEdge
  via?: GNode // identified figure this came through
  relation: string
  traditional?: boolean
}

const TEXTUAL = new Set(['APPEARS_IN', 'MENTIONED_IN', 'NARRATED_IN', 'TEACHES_IN'])
const RECEPTION_COLS = new Set(['col:regional-retellings', 'col:bhakti-literature', 'col:southeast-asian', 'col:agamas-tantras'])

/**
 * Which identified figures may lend their attestations to this one. The rule keeps
 * historical precursors and variants (Vāsudeva and Kṛṣṇa Devakīputra for Kṛṣṇa; Rudra
 * and Oesho for Śiva; Naṭarāja as a form of Śiva) and refuses theological equations
 * that would absorb another major deity's entire record (Kṛṣṇa = Viṣṇu in the
 * Bhāgavata; Śiva = Viṣṇu in the Skanda Purāṇa; Rāma = Brahman): those are assertions
 * about theology, not evidence that the record mentions this figure.
 *   - never through a concept, and never into a hub record (degree ≥ 60)
 *   - IDENTIFIED_WITH only when the identification is textual, scholarly or disputed
 *     (classes 1, 5, 7) — devotional identifications (class 6) are not followed
 *   - FORM_OF only inward (forms of X), and never from a larger record than X
 */
export function identityCircle(store: Store, id: string): { node: GNode; edge?: GEdge }[] {
  const self = store.byId.get(id)!
  const out: { node: GNode; edge?: GEdge }[] = [{ node: self }]
  const seen = new Set([id])
  for (const x of store.neighbours(id)) {
    const p = x.edge.p
    const o = x.other
    if (seen.has(o.id) || o.type === 'concept' || o.m.degree >= 60) continue
    const ok = (p === 'IDENTIFIED_WITH' && [1, 5, 7].includes(x.edge.evidenceClass)) || (p === 'FORM_OF' && x.dir === 'in' && o.m.degree <= self.m.degree)
    if (ok) { seen.add(o.id); out.push({ node: o, edge: x.edge }) }
  }
  return out
}

function textLane(store: Store, textId: string): Lane {
  const t = store.byId.get(textId)
  const cols = t?.m.corpora ?? []
  return cols.some((c) => RECEPTION_COLS.has(c)) ? 'reception' : 'text'
}

export function gatherAttestations(store: Store, id: string, includeIdentified = true): Attestation[] {
  const subject = store.byId.get(id)
  if (!subject) return []
  const circle = includeIdentified ? identityCircle(store, id) : [{ node: subject }]
  const items: Attestation[] = []
  const seen = new Set<string>()
  const push = (a: Attestation) => { if (seen.has(a.key)) return; seen.add(a.key); items.push(a) }

  for (const { node: fig, edge: viaEdge } of circle) {
    const via = viaEdge ? fig : undefined
    for (const x of store.neighbours(fig.id)) {
      const e = x.edge
      // textual
      if (x.dir === 'out' && TEXTUAL.has(e.p)) {
        const text = store.textOf(x.other.id) ?? x.other
        const d = store.dateOf(x.other.id, 'scholarly-textual')
        if (d) push({ key: `t:${text.id}:${fig.id}`, lane: textLane(store, text.id), node: text, start: d.start!, end: d.end ?? d.start!, label: d.label, certainty: d.certainty, edge: e, via, relation: `${store.meta.predicates[e.p]}${e.sources[0]?.locator ? ` · ${e.sources[0].locator}` : ''}` })
      }
      // textual, derived from the passage a class-1 role assertion cites (never through a narrative)
      if (e.evidenceClass === 1 && NARRATIVE_ROLE_PREDICATES.has(e.p)) {
        const loc = e.sources.find((r) => r.locator)?.locator
        const tid = textFromLocator(loc)
        const text = tid ? store.byId.get(tid) : undefined
        const d = tid ? store.dateOf(tid, 'scholarly-textual') : undefined
        if (text && d) push({ key: `t:${text.id}:${fig.id}`, lane: textLane(store, text.id), node: text, start: d.start!, end: d.end ?? d.start!, label: d.label, certainty: d.certainty, edge: e, via, relation: `${store.meta.predicates[e.p]} ${x.other.name}${loc ? ` · ${loc}` : ''}` })
      }
      // material
      let obj: GNode | undefined
      if (x.dir === 'out' && (e.p === 'DEPICTED_IN' || e.p === 'WORSHIPPED_AT')) obj = x.other
      if (x.dir === 'in' && (e.p === 'REFERS_TO' || e.p === 'INTERPRETED_AS' || e.p === 'ASSOCIATED_WITH')) obj = x.other
      if (x.dir === 'out' && e.p === 'ASSOCIATED_WITH') obj = x.other
      if (obj && ['temple', 'artifact', 'inscription', 'manuscript', 'site'].includes(obj.type)) {
        const d = store.dateOf(obj.id, 'material')
        if (d) push({ key: `m:${obj.id}:${fig.id}:${e.p}`, lane: e.p === 'ASSOCIATED_WITH' ? 'tradition' : 'material', node: obj, start: d.start!, end: d.end ?? d.start!, label: d.label, certainty: d.certainty, edge: e, via, relation: store.meta.predicates[e.p], traditional: e.p === 'ASSOCIATED_WITH' })
      }
    }
  }

  // a text: its own composition views, its manuscripts, external references, retellings
  if (subject.type === 'text' || subject.type === 'collection') {
    for (const x of store.neighbours(id)) {
      const e = x.edge
      if (x.dir === 'in' && (e.p === 'WITNESS_OF' || e.p === 'REFERS_TO_TEXT')) {
        const d = store.dateOf(x.other.id, 'material') ?? store.dateOf(x.other.id, 'scholarly-textual')
        if (d) push({ key: `w:${x.other.id}`, lane: 'material', node: x.other, start: d.start!, end: d.end ?? d.start!, label: d.label, certainty: d.certainty, edge: e, relation: store.meta.predicates[e.p] })
      }
      if (x.dir === 'in' && (e.p === 'RETELLS' || e.p === 'COMMENTARY_ON' || e.p === 'DERIVED_FROM' || e.p === 'TRANSLATION_OF')) {
        const d = store.dateOf(x.other.id, 'scholarly-textual')
        if (d) push({ key: `r:${x.other.id}`, lane: 'reception', node: x.other, start: d.start!, end: d.end ?? d.start!, label: d.label, certainty: d.certainty, edge: e, relation: store.meta.predicates[e.p] })
      }
    }
  }
  return items.sort((a, b) => a.start - b.start)
}

export const LANES: { id: Lane; label: string; blurb: string }[] = [
  { id: 'text', label: 'Sanskrit & canonical texts', blurb: 'Dated by scholarly estimates of composition (passages inherit their text’s range).' },
  { id: 'reception', label: 'Regional, devotional & later retellings', blurb: 'Vernacular, bhakti, Southeast Asian and later Sanskrit works.' },
  { id: 'material', label: 'Dated objects, inscriptions & structures', blurb: 'Material chronology: inscriptions, coins, sculptures, surviving temple fabric, manuscripts.' },
  { id: 'tradition', label: 'Traditional associations with dated sites', blurb: 'A site the tradition associates with the figure; the date is the surviving structure’s, not the association’s.' },
]
