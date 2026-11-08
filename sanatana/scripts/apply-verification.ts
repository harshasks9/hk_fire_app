/**
 * Applies the corrections arising from the independent verification audit
 * (research/verification-report.md, research/verification-findings.json) to the research
 * data, and writes research/verification-resolution.md recording, finding by finding, what
 * was changed. Idempotent: running it twice changes nothing the second time.
 *
 *   npm run apply:verification && npm run validate
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Assertion, Entity, Source, Comparison, DateClaim } from '../schema/types.ts'

const DATA = join(import.meta.dirname, '..', 'data')
const today = '2026-11-08'
type Files<T> = Map<string, T[]>
const load = <T,>(dir: string): Files<T> => new Map(readdirSync(join(DATA, dir)).filter((f) => f.endsWith('.json')).map((f) => [join(DATA, dir, f), JSON.parse(readFileSync(join(DATA, dir, f), 'utf8')) as T[]]))
const entities = load<Entity>('entities')
const assertions = load<Assertion>('assertions')
const sources = load<Source>('sources')
const comparisons = load<Comparison>('comparisons')
const dirty = new Set<string>()
const log: { finding: string; resolution: string }[] = []
const note = (finding: string, resolution: string) => log.push({ finding, resolution })

function findIn<T extends { id: string }>(files: Files<T>, id: string): { item: T; file: string } | undefined {
  for (const [file, items] of files) { const item = items.find((x) => x.id === id); if (item) return { item, file } }
  return undefined
}
const E = (id: string) => { const r = findIn(entities, id); if (!r) throw new Error(`no entity ${id}`); dirty.add(r.file); return r.item }
const A = (id: string) => { const r = findIn(assertions, id); if (!r) throw new Error(`no assertion ${id}`); dirty.add(r.file); return r.item }
const C = (id: string) => { const r = findIn(comparisons, id); if (!r) throw new Error(`no comparison ${id}`); dirty.add(r.file); return r.item }
const sourceType = new Map<string, string>()
for (const items of sources.values()) for (const s of items) sourceType.set(s.id, s.type)

// ───────── 1. systemic: Wikipedia-only "verified-online" → reference-checked ─────────
let refA = 0, refE = 0
const onlyReference = (refs: { source: string }[]) => refs.length > 0 && refs.every((r) => sourceType.get(r.source) === 'reference')
for (const [file, items] of assertions) for (const a of items) {
  if (a.status === 'verified-online' && onlyReference(a.sources)) {
    a.status = 'reference-checked'
    if (a.confidence === 'high') a.confidence = 'medium'
    dirty.add(file); refA++
  }
}
for (const [file, items] of entities) for (const e of items) {
  if (e.status === 'verified-online' && onlyReference(e.sources)) { e.status = 'reference-checked'; if (e.confidence === 'high') e.confidence = 'medium'; dirty.add(file); refE++ }
}
note('temple:258, material:340 (medium, systemic) — assertions marked verified-online/high on Wikipedia alone',
  `Introduced the verification status “reference-checked” (checked against a reference work, not yet a primary or scholarly source). ${refA} assertions and ${refE} entities whose only sources are reference works were moved to it, and “high” confidence was lowered to “medium”. They display as “Reference-checked” throughout the site. Adding the epigraphic editions (EI, CII, SII) to the class-3 claims is logged as follow-up research.`)

// ───────── 2. systemic: recall + high → medium ─────────
let rc = 0
for (const [file, items] of entities) for (const e of items) if (e.status === 'recall' && e.confidence === 'high') { e.confidence = 'medium'; dirty.add(file); rc++ }
for (const [file, items] of assertions) for (const a of items) if (a.status === 'recall' && a.confidence === 'high') { a.confidence = 'medium'; dirty.add(file); rc++ }
note('text:vikramarjuna-vijaya and others (medium) — recall-status records at high confidence', `${rc} records with status “recall” lowered from high to medium confidence.`)

// ───────── 3. epic lineage locators ─────────
let lin = 0
for (const [file, items] of assertions) for (const a of items) {
  const n = Number(a.id.split(':')[1])
  if (a.agent === 'epic' && a.p === 'MEMBER_OF' && n >= 335 && n <= 389) {
    for (const r of a.sources) {
      if (!r.locator) continue
      const base = r.locator.startsWith('VR') ? 'VR (CE)' : r.locator.startsWith('MBh') ? 'MBh (CE)' : r.locator.startsWith('HV') ? 'HV (CE)' : undefined
      if (base && /\d/.test(r.locator)) { r.locator = `${base}, passim (verse-level locator withdrawn)`; delete r.quote }
    }
    a.status = 'source-checked'
    a.confidence = 'medium'
    a.rationale = 'Membership is attested across the text; the verse originally cited did not name this member (independent verification), so the verse-level locator was withdrawn rather than replaced unchecked.'
    dirty.add(file); lin++
  }
}
note('epic:362, epic:374, epic:337, epic:349, epic:358 (medium) — lineage memberships citing a verse that does not name the member', `${lin} MEMBER_OF assertions (epic:335–389): verse-level locators withdrawn and replaced with “passim”; status source-checked, confidence medium, rationale recorded. Precise genealogy loci are logged as follow-up.`)

// Duḥśalā locator
for (const id of ['epic:372', 'epic:223', 'epic:224']) {
  const a = A(id)
  for (const r of a.sources) if (r.locator === 'MBh (CE) 1.108.2') r.locator = 'MBh (CE) 1.108.18'
}
note('epic:372 (low) — Duḥśalā cited at 1.108.2 (which names the son Duḥśala)', 'Locator corrected to MBh (CE) 1.108.18 on epic:372, epic:223 and epic:224.')

// ───────── 4. identity scope ─────────
{
  const a = A('epic:413')
  a.evidenceClass = 5
  a.confidence = 'medium'
  a.qualifiers = { ...a.qualifiers, note: 'The Mahābhārata names Kṛṣṇa “Vāsudeva” (a textual fact); identifying him with the deity of the early inscriptions is a scholarly inference.' }
  a.rationale = 'Re-scoped after verification: the naming is textual, the identification with the inscriptional deity is interpretation.'
  note('epic:413 (medium) — naming treated as identity at class 1', 'Re-scoped to evidence class 5, confidence medium, with a note separating the textual naming from the scholarly identification.')
}
{
  const a = A('vedic:305')
  a.evidenceClass = 5
  a.confidence = 'medium'
  a.rationale = 'Inferred from the matronymic Aiḷa (RV 10.95.18); the Ṛgveda does not state the parentage.'
  note('vedic:305 (low) — parentage inferred from a matronymic marked class 1', 'Set to evidence class 5, confidence medium, with the inference stated.')
}
{
  const a = A('vedic:141')
  for (const r of a.sources) if (r.quote) r.quote = r.quote.replace('sūryaś ca', 'sūryaś cāham')
  const v = E('char:vamadeva')
  for (const r of v.sources) if (r.quote) r.quote = r.quote.replace('sūryaś ca', 'sūryaś cāham')
  note('vedic:141 (low) — quotation cut mid-sandhi', 'Quotation corrected to “aham manur abhavaṁ sūryaś cāham” on vedic:141 and char:vamadeva.')
}

// ───────── 5. dates ─────────
const moveToReception = (d: DateClaim, event: string) => { d.system = 'reception'; d.event = event }
for (const id of ['temple:somnath', 'temple:mahakaleshwar', 'temple:koneswaram']) {
  for (const d of E(id).dates ?? []) if (d.system === 'material' && /destruct/i.test(d.event)) moveToReception(d, 'recorded destruction (an event, not surviving fabric)')
}
for (const [file, items] of entities) for (const e of items) for (const d of e.dates ?? []) if (e.type === 'temple' && d.system === 'material' && d.event === 'destruction') { moveToReception(d, 'recorded destruction (an event, not surviving fabric)'); dirty.add(file) }
note('temple:somnath (medium) — destruction stored as a material date', 'Every temple destruction date moved to the reception system, so the map places a temple by its fabric (Somnath 1947–51; the Ahilyābāī temple 1783), not by a recorded raid. Same for Mahākāleśvara and Koṇeśvaram.')
{
  const e = E('temple:pashupatinath')
  for (const d of e.dates ?? []) if (d.system === 'material' && /Licchavi/.test(d.label)) moveToReception(d, 'earliest inscriptional attestation of the cult')
  note('temple:pashupatinath (medium) — cult attestation stored as surviving structure', 'The Licchavi attestation moved to the reception system; the 1692 renovation is the material placing date.')
}
{
  const e = E('temple:changu-narayan')
  const d = (e.dates ?? []).find((x) => x.system === 'material' && /464/.test(x.label))
  if (d) {
    d.event = 'earliest dated object on site (Mānadeva pillar inscription)'
    d.certainty = 'estimated'
    d.basis = 'dated pillar inscription (Saṃvat 386); dates the pillar and attests the shrine, not the present fabric'
    if (!(e.dates ?? []).some((x) => /495/.test(x.label))) e.dates!.push({ ...d, label: '495/496 CE (alternative reading of the era)', start: 495, end: 496, certainty: 'disputed', view: 'alternative era reading', sources: d.sources })
  }
  note('temple:changu-narayan (medium) — pillar inscription treated as secure construction date', 'Event renamed to “earliest dated object on site”, certainty estimated, basis clarified; the 495/496 CE alternative reading added as a disputed view. The c. 1702 rebuilding remains the fabric date.')
}
{
  for (const d of E('art:gudimallam-linga').dates ?? []) if (d.label === '2nd–1st century BCE') { d.certainty = 'estimated'; d.view = 'Harle; Blurton (majority)' }
  note('art:gudimallam-linga (medium) — all dates disputed; headline used a minority survey date', 'The 2nd–1st c. BCE view is marked estimated (majority: Harle; Blurton). Placement now prefers non-disputed dates, so Doniger’s 3rd c. BCE no longer sets the headline.')
}
{
  for (const d of E('temple:mundeshwari').dates ?? []) if (/570/.test(d.label)) { d.certainty = 'estimated'; d.view = 'Neuss; historians of architecture (palaeography)' }
  note('temple:mundeshwari (medium) — minority 108 CE reading placed the temple', 'The palaeographic c. 570–636 CE date is marked estimated and now places the temple; the 108 CE reading remains a disputed view.')
}
{
  for (const d of E('site:dwarka-offshore').dates ?? []) if (/anchor/.test(d.label)) { d.certainty = 'estimated'; d.view = 'Gaur, Sundaresh & Tripati 2004 (majority)' }
  note('site:dwarka-offshore (medium) — Rao’s disputed c. 15th c. BCE date placed the site', 'The anchor-typology dating (historical period) is marked estimated and places the site; Rao’s reading stays disputed.')
}
{
  for (const d of E('temple:prambanan').dates ?? []) if (/856/.test(d.label) && d.system === 'material') { d.certainty = 'estimated'; d.view = 'de Casparis 1956'; d.basis = 'dated Śivagṛha inscription, identified with the compound by argument' }
  note('temple:prambanan (medium) — consecration marked secure', 'Certainty estimated, view de Casparis, basis states that the identification is an argument.')
}
{
  for (const d of E('text:aryabhatiya').dates ?? []) if (d.event === 'composition') { d.certainty = 'estimated'; d.basis = 'author states his age (23) at Kali 3600 = 499 CE (3.10); the composition date is inferred from it' }
  note('text:aryabhatiya (low) — composition date marked secure', 'Certainty estimated; basis states the inference.')
}
{
  const e = E('temple:tirumala')
  for (const d of e.dates ?? []) {
    if (/966/.test(d.label)) d.event = 'earliest dated gift (inscription)'
    if (/1517/.test(d.label)) d.certainty = 'estimated'
  }
  note('temple:tirumala (low) — a gift recorded as construction', 'Event renamed “earliest dated gift (inscription)”; the 1517 date set to estimated pending the inscription edition.')
}
for (const [id, label, start, end] of [['temple:my-son', '7th–13th c. CE (standing brick temples)', 600, 1299], ['temple:vat-phou', 'mainly 11th–12th c. CE (standing buildings)', 1000, 1199]] as const) {
  const r = findIn(entities, id)
  if (!r) continue
  dirty.add(r.file)
  const e = r.item
  const found = (e.dates ?? []).find((d) => d.system === 'material' && d.event === 'construction' && (d.start ?? 0) < 600)
  if (found && !(e.dates ?? []).some((d) => d.event === 'surviving-structure')) {
    e.dates!.push({ system: 'material', event: 'surviving-structure', label, start, end, certainty: 'estimated', basis: 'architectural style and inscriptions of the standing buildings', sources: found.sources })
    moveToReception(found, 'foundation (attested by inscriptions)')
  }
}
note('temple:my-son (low) — a foundation date placed the standing temples at c. 350', 'Mỹ Sơn and Vat Phou now carry surviving-structure dates (7th–13th c.; mainly 11th–12th c.), and the foundation dates moved to the reception system.')

// ───────── 6. entity wording ─────────
{
  const h = E('char:hanuman')
  h.summary = h.summary.replace('becomes Rāma’s foremost devotee and messenger', 'becomes Rāma’s loyal servant and messenger; later devotional traditions make him the model devotee (bhakta)')
  note('char:hanuman (low) — Vālmīki-based summary called him Rāma’s foremost devotee', 'Summary now distinguishes Vālmīki’s servant and messenger from the later devotional ideal.')
}
{
  const s = E('deity:shiva')
  s.summary = s.summary.replace('continuous with the Vedic Rudra', 'identified, from the Śvetāśvatara Upaniṣad onward, with the Vedic Rudra')
  note('deity:shiva (low) — continuity with Rudra stated without qualification', 'Summary now says “identified, from the Śvetāśvatara Upaniṣad onward, with the Vedic Rudra”.')
}
{
  const p = E('person:sankardev')
  p.summary = p.summary.replace('(1449–1568)', '(traditionally 1449–1568, after the hagiographies)')
  note('person:sankardev (low) — hagiographic lifespan stated as fact', 'Summary labels the dates as traditional.')
}
{
  const c = E('concept:padal-petra-sthalam')
  if (!/275 or 276/.test(c.summary)) c.summary = c.summary.replace('The 276 Śiva temples', 'The Śiva temples (275 or 276, depending on the list)')
  note('concept:padal-petra-sthalam (low) — 276 here, 275 elsewhere', 'Summary gives both counts as list variants.')
}
{
  const u = E('inst:unesco')
  u.name = 'UNESCO'
  u.summary = 'UNESCO, whose World Heritage Centre maintains the World Heritage List (Mohenjo-daro 1980; Elephanta 1987; Mamallapuram, Ellora, Prambanan and others), whose Living Heritage Entity maintains the Intangible Cultural Heritage lists (Vedic chanting, Rāmlīlā, Kūṭiyāṭṭam, Royal Ballet of Cambodia), and whose Memory of the World Register includes the BORI Rigveda manuscripts (2007).'
  note('regional:430 (low) — ICH inscription attributed to the World Heritage Centre', 'inst:unesco renamed “UNESCO” and its summary distinguishes the World Heritage Centre, the Intangible Cultural Heritage section and Memory of the World.')
}
{
  const l = E('place:lanka-narrative')
  if (l.location) l.location.label = 'Traditional identification with Sri Lanka (disputed) — the literary Laṅkā is not a surveyed place'
  note('place:lanka-narrative (low) — literary Laṅkā plotted on Sri Lanka', 'Kept the point (ring marker for narrative places) but its label now states it is a disputed traditional identification.')
}
{
  const r = E('temple:ram-mandir-ayodhya')
  if (r.details && !/22–23 December 1949/.test(r.details)) {
    r.details = r.details.replace('the earlier Rām Lallā Virājmān image (installed in 1949) is retained in the temple.', 'the earlier Rām Lallā Virājmān image is retained in the temple.')
    r.details += '\n\nImages had been placed inside the mosque on the night of 22–23 December 1949. In its judgment of 9 November 2019 the Supreme Court held both that placement and the 1992 demolition to be illegal — describing the demolition as an egregious violation of the rule of law — decided the title dispute on the evidence of possession, and directed that five acres be allotted for a mosque.'
    r.sources.push({ source: 'src:sc-ayodhya-2019' })
  }
  note('temple:ram-mandir-ayodhya (medium) — sensitive site omitted the court’s findings', 'Details now record the December 1949 placement of images and the Supreme Court’s 2019 findings on it and on the 1992 demolition, citing the judgment.')
}

// ───────── 7. citations ─────────
{
  const a = A('material:66')
  for (const s of ['src:audouin-bernard-1974', 'src:srinivasan-1997']) if (!a.sources.some((r) => r.source === s)) a.sources.push({ source: s })
  a.confidence = 'medium'
  if (a.status === 'reference-checked') a.status = 'source-checked'
  note('material:66 (medium) — Kṛṣṇa’s earliest-object headline rested on Wikipedia', 'Added Audouin & Bernard 1974 and Srinivasan 1997; kept class 5, confidence medium. The site now labels a headline earliest object that rests on a class-5 identification.')
}
for (const id of ['regional:265', 'regional:268']) {
  const a = A(id)
  if (!a.sources.some((r) => r.source === 'src:cowell-jataka')) a.sources.push({ source: 'src:cowell-jataka', locator: 'vol. IV, no. 461' })
}
note('regional:265 (low) — English quotations attributed to the Pāli edition', 'Added Cowell (ed.), vol. IV, no. 461 as the source of the English wording; Fausbøll kept for the Pāli.')
{
  const r = findIn(sources, 'src:gretil-shatapatha')
  if (r) { r.item.url = 'https://gretil.sub.uni-goettingen.de/gretil.html'; dirty.add(r.file) }
  note('src:gretil-shatapatha (low) — URL is a directory returning 403', 'Pointed to the GRETIL index page.')
}

// ───────── 8. comparisons ─────────
{
  const c = C('cmp:sita-abduction-handling')
  for (const r of c.rows) if (r.text === 'text:valmiki-ramayana') { r.locator = 'VR (CE) 3.47.16'; r.status = 'verified-online' }
  const p = C('cmp:sita-parentage')
  for (const r of p.rows) if (r.text === 'text:valmiki-ramayana') { r.locator = 'VR (CE) 1.65.14'; r.status = 'verified-online' }
  const m = C('cmp:manu-fish-identity')
  for (const r of m.rows) {
    if (r.text === 'text:mahabharata') { r.locator = 'MBh (CE) 3.185.48'; r.status = 'verified-online' }
    if (r.text === 'text:matsya-purana') { r.locator = 'MatsP 1.11–28'; r.status = 'verified-online' }
    if (r.text === 'text:bhagavata-purana') { r.locator = 'BhP 8.24.10–13, 57–58'; r.status = 'verified-online' }
  }
  note('cmp:sita-abduction-handling, cmp:sita-parentage, cmp:manu-fish-identity (low) — coarse or recall locators', 'Locators set to those confirmed by the verifier (VR (CE) 3.47.16; 1.65.14; MBh (CE) 3.185.48; MatsP 1.11–28; BhP 8.24.10–13, 57–58).')
}

// ───────── 9. new orchestrator assertions (gaps) ─────────
const orchFile = join(DATA, 'assertions', 'orchestrator.json')
const copySources = (id: string) => structuredClone(A(id).sources)
const orch: Assertion[] = [
  { id: 'orchestrator:1', s: 'deity:shiva', p: 'APPEARS_IN', o: 'text:shvetashvatara-upanishad', qualifiers: { role: 'the one supreme lord, Rudra–Śiva', note: 'derived from vedic:215' }, evidenceClass: 1, sources: copySources('vedic:215'), confidence: 'high', status: 'verified-online', agent: 'orchestrator', rationale: 'The Upaniṣad applies śiva and maheśvara to the supreme Rudra (ŚvU 3.11; 4.10; 4.14), as verified for vedic:215.', lastVerified: today },
  { id: 'orchestrator:2', s: 'deity:shiva', p: 'APPEARS_IN', o: 'text:mahabharata', qualifiers: { role: 'Kirāta episode and elsewhere', note: 'derived from epic:810' }, evidenceClass: 1, sources: copySources('epic:810'), confidence: 'high', status: 'verified-online', agent: 'orchestrator', rationale: 'Passage verified for epic:810 (MBh (CE) 3.40–41).', lastVerified: today },
  { id: 'orchestrator:3', s: 'deity:shiva', p: 'APPEARS_IN', o: 'text:linga-purana', qualifiers: { role: 'the Liṅgodbhava', note: 'derived from purana:490' }, evidenceClass: 1, sources: copySources('purana:490'), confidence: 'high', status: 'verified-online', agent: 'orchestrator', rationale: 'Passage verified for purana:490 (LiP 1.17.37–45).', lastVerified: today },
  { id: 'orchestrator:4', s: 'deity:shiva', p: 'APPEARS_IN', o: 'text:bhagavata-purana', qualifiers: { role: 'Dakṣa’s sacrifice', note: 'derived from purana:430' }, evidenceClass: 1, sources: copySources('purana:430'), confidence: 'high', status: 'verified-online', agent: 'orchestrator', rationale: 'Passage verified for purana:430 (BhP 4.2–7).', lastVerified: today },
  { id: 'orchestrator:5', s: 'char:ila', p: 'IDENTIFIED_WITH', o: 'char:ida', qualifiers: { tradition: 'Purāṇic genealogy and modern scholarship' }, evidenceClass: 5, sources: [...E('char:ila').sources], confidence: 'medium', status: 'source-checked', agent: 'orchestrator', rationale: 'Both records discuss the equivalence of the Purāṇic Ilā with the Śatapatha’s Iḍā; recorded as an assertion, not a merge.', lastVerified: today },
  { id: 'orchestrator:6', s: 'ins:rajarajeshvaram-inscriptions', p: 'INSCRIBED_AT', o: 'temple:brihadisvara', evidenceClass: 3, sources: [{ source: 'src:hultzsch-sii2' }], confidence: 'high', status: 'source-checked', agent: 'orchestrator', lastVerified: today },
  { id: 'orchestrator:7', s: 'ins:rajarajeshvaram-inscriptions', p: 'REFERS_TO', o: 'person:rajaraja-i', evidenceClass: 3, sources: [{ source: 'src:hultzsch-sii2' }], confidence: 'high', status: 'source-checked', agent: 'orchestrator', lastVerified: today },
  { id: 'orchestrator:8', s: 'ins:rajarajeshvaram-inscriptions', p: 'DOCUMENTED_BY', o: 'inst:asi', qualifiers: { note: 'published in South Indian Inscriptions vol. II (Archaeological Survey of India)' }, evidenceClass: 4, sources: [{ source: 'src:hultzsch-sii2' }], confidence: 'high', status: 'source-checked', agent: 'orchestrator', lastVerified: today },
]
writeFileSync(orchFile, JSON.stringify(orch, null, 1) + '\n')
note('deity:shiva (medium) — journey (b): no direct links to the Śvetāśvatara, the Mahābhārata or the Purāṇas', 'Added orchestrator:1–4 (APPEARS_IN the Śvetāśvatara, Mahābhārata, Liṅga and Bhāgavata), each re-using the sources and locators already verified for vedic:215, epic:810, purana:490 and purana:430.')
note('char:ida (low) — Ilā and Iḍā kept apart without a linking assertion', 'Added orchestrator:5, char:ila IDENTIFIED_WITH char:ida (class 5, medium).')
note('temple:brihadisvara (low) — journey (e): only five edges, no inscription record', 'Added ins:rajarajeshvaram-inscriptions (South Indian Inscriptions vol. II, Hultzsch) with INSCRIBED_AT, REFERS_TO Rājarāja I and DOCUMENTED_BY ASI (orchestrator:6–8).')

const orchEntFile = join(DATA, 'entities', 'orchestrator.json')
const orchEnt: Entity[] = [
  {
    id: 'ins:rajarajeshvaram-inscriptions', type: 'inscription', name: 'Tamil inscriptions of the Rājarājeśvaram, Thanjavur',
    subtype: 'temple inscriptions (corpus)',
    summary: 'The long Tamil inscriptions on the walls and base of the Bṛhadīśvara (Rājarājeśvaram) temple, recording Rājarāja I’s and his successors’ gifts, the temple’s endowments, staff and bronzes; edited by E. Hultzsch in South Indian Inscriptions vol. II.',
    dates: [{ system: 'material', event: 'inscription', label: 'early 11th century CE (reigns of Rājarāja I and Rājendra I)', start: 1003, end: 1044, certainty: 'estimated', basis: 'regnal years stated in the inscriptions', sources: [{ source: 'src:hultzsch-sii2' }] }],
    location: { lat: 10.7828, lon: 79.1318, precision: 'exact', label: 'Bṛhadīśvara temple, Thanjavur, Tamil Nadu, India', country: 'India' },
    evidenceClass: 3,
    sources: [{ source: 'src:hultzsch-sii2' }],
    confidence: 'high', status: 'source-checked', agent: 'orchestrator', lastVerified: today,
    limits: 'The inscriptions document royal gifts, endowments and the temple’s establishment in the early 11th century; they do not date earlier worship at Thanjavur.',
  },
]
writeFileSync(orchEntFile, JSON.stringify(orchEnt, null, 1) + '\n')

for (const f of dirty) {
  const items = entities.get(f) ?? assertions.get(f) ?? sources.get(f) ?? comparisons.get(f)
  writeFileSync(f, JSON.stringify(items, null, 1) + '\n')
}

writeFileSync(join(import.meta.dirname, '..', 'research', 'verification-resolution.md'), `# Resolution of the verification findings

Generated by \`scripts/apply-verification.ts\` on ${today}. The independent audit is in
\`research/verification-report.md\` (52 findings: 2 high, 26 medium, 24 low). The two high
findings and the remaining discovery findings were fixed in \`scripts/seed-discoveries.ts\`;
site-side recommendations (placement skipping disputed dates, labelling headline dates that
rest on a disputed date or a class-5 identification) were fixed in \`src/\` and
\`scripts/build-graph.ts\`. Every data change is listed here.

| Finding | Resolution |
|---|---|
${log.map((l) => `| ${l.finding.replace(/\|/g, '/')} | ${l.resolution.replace(/\|/g, '/')} |`).join('\n')}
`)
console.log(`applied ${log.length} resolutions; ${dirty.size} files rewritten`)
