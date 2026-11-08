/**
 * Applies the corrections arising from the independent verification of round 2
 * (research/verification-r2-report.md, research/verification-r2-findings.json) and writes
 * research/verification-r2-resolution.md, finding by finding. Idempotent: a second run
 * changes nothing.
 *
 * Epic participation locators are re-pointed from research/verification-r2-relocations.json,
 * which was computed against the GRETIL e-texts of the critical editions (each new locator is
 * a verse inside the episode that names the participant; the matched word is recorded).
 *
 *   npm run apply:verification-r2 && npm run validate
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Assertion, Entity, Source, DateClaim } from '../schema/types.ts'

const ROOT = join(import.meta.dirname, '..')
const DATA = join(ROOT, 'data')
const today = '2026-11-08'
type Files<T> = Map<string, T[]>
const load = <T,>(dir: string): Files<T> => new Map(readdirSync(join(DATA, dir)).filter((f) => f.endsWith('.json')).map((f) => [join(DATA, dir, f), JSON.parse(readFileSync(join(DATA, dir, f), 'utf8')) as T[]]))
const entities = load<Entity>('entities')
const assertions = load<Assertion>('assertions')
const sources = load<Source>('sources')
const dirty = new Set<string>()
const log: { finding: string; resolution: string }[] = []
const note = (finding: string, resolution: string) => log.push({ finding, resolution })

function findIn<T extends { id: string }>(files: Files<T>, id: string): { item: T; file: string } | undefined {
  for (const [file, items] of files) { const item = items.find((x) => x.id === id); if (item) return { item, file } }
  return undefined
}
const E = (id: string) => { const r = findIn(entities, id); if (!r) throw new Error(`no entity ${id}`); dirty.add(r.file); return r.item }
const Eopt = (id: string) => { const r = findIn(entities, id); if (r) dirty.add(r.file); return r?.item }
const A = (id: string) => { const r = findIn(assertions, id); if (!r) throw new Error(`no assertion ${id}`); dirty.add(r.file); return r.item }
const sourceType = new Map<string, string>()
for (const items of sources.values()) for (const s of items) sourceType.set(s.id, s.type)
const isR2 = (file: string) => /-r2\.json$|iconography\.json$/.test(file)

// ───────── 1. epic participation: one anchor verse cited for every participant ─────────
type Reloc = { id: string; s: string; o: string; old: string; new: string; quote: string; matched: string; note?: string }
const relocs = JSON.parse(readFileSync(join(ROOT, 'research', 'verification-r2-relocations.json'), 'utf8')) as Reloc[]
let moved = 0, kept = 0
for (const r of relocs) {
  const a = A(r.id)
  const ref = a.sources[0]
  if (ref.locator === r.new && ref.quote === r.quote) { kept++; continue }
  if (ref.locator !== r.old && ref.locator !== r.new) throw new Error(`${r.id}: unexpected locator ${ref.locator}`)
  if (r.new === r.old) kept++; else moved++
  ref.locator = r.new
  ref.quote = r.quote
  a.lastVerified = today
  a.rationale = `Verification round 2: locator re-pointed from the episode's anchor verse (${r.old}) to a verse in the episode that names the participant (“${r.matched}”).${r.note ? ' ' + r.note : ''}`
  if (r.note) a.qualifiers = { ...(a.qualifiers ?? {}), note: r.note }
}
note('epic:r2-440 and ~35 others (medium) — one anchor verse per story cited for every participant; Vidura placed in the forest-fire death',
  `${relocs.length} PARTICIPANT_IN assertions re-checked against the GRETIL e-texts: ${relocs.filter((r) => r.new !== r.old).length} re-pointed to a verse inside the episode that names the participant (the verse is quoted and the matched word recorded in research/verification-r2-relocations.json); the rest already named the participant by an epithet the first check missed (e.g. devarāja for Indra, “saṃjaya uvāca”). Vidura (epic:r2-552) now cites MBh 15.33.15 with a note that he dies in the forest by yoga before the fire, a participant in the retirement, not the fire.`)

// ───────── 2. duplicate identities across agents ─────────
function merge(dupId: string, keepId: string, summary: string, extraAliases: string[], why: string) {
  const dup = findIn(entities, dupId)
  const keep = E(keepId)
  if (!dup) return 0
  dirty.add(dup.file)
  keep.aliases = [...new Set([...(keep.aliases ?? []), ...extraAliases, ...(dup.item.aliases ?? [])])].filter((x) => x !== keep.name)
  keep.summary = summary
  const have = new Set(keep.sources.map((s) => `${s.source}|${s.locator ?? ''}`))
  for (const s of dup.item.sources) if (!have.has(`${s.source}|${s.locator ?? ''}`)) keep.sources.push(s)
  keep.details = [keep.details, why].filter(Boolean).join(' ')
  keep.lastVerified = today
  entities.set(dup.file, entities.get(dup.file)!.filter((e) => e.id !== dupId))
  let n = 0
  for (const [file, items] of assertions) for (const a of items) {
    if (a.s === dupId) { a.s = keepId; n++; dirty.add(file) }
    if (a.o === dupId) { a.o = keepId; n++; dirty.add(file) }
  }
  return n
}
const nMaya = merge('char:maya-asura', 'char:maya-danava',
  'Asura (dānava) master-builder and magician: he builds the three cities of Tripura, which Śiva burns (the Matsya and Śiva Purāṇas let him survive); in the Mahābhārata he builds the Pāṇḍavas’ assembly hall in gratitude for being spared in the Khāṇḍava fire; in the Rāmāyaṇa’s Uttarakāṇḍa he is the father of Mandodarī.',
  ['Maya (the asura architect)'],
  'Merged in verification round 2 with the Purāṇa agent’s record char:maya-asura, which described the same figure.')
if (nMaya) note('char:maya-asura (medium) — the same figure as char:maya-danava under a second id', `Merged into char:maya-danava (aliases, Tripura details and the four Purāṇa sources moved); ${nMaya} assertions repointed; char:maya-asura removed.`)
const nCow = merge('char:vasishtha-cow', 'char:nandini-cow',
  'The wish-granting cow of Vasiṣṭha’s hermitage, daughter of Surabhi. Her seizure by King Viśvāmitra starts the sages’ feud — Vālmīki calls her Śabalā, the Mahābhārata Nandinī — and she produces the armies that defeat the king; in Raghuvaṃśa 1–2 King Dilīpa tends her and offers his life to save her from a lion.',
  ['Śabalā', 'Vasiṣṭha’s wish-granting cow'],
  'Merged in verification round 2 with the Purāṇa agent’s record char:vasishtha-cow (the Viśvāmitra feud); Vālmīki’s Śabalā and the Mahābhārata/Raghuvaṃśa Nandinī are one tradition figure under text-specific names.')
if (nCow) {
  const k = E('char:nandini-cow')
  k.name = 'Nandinī / Śabalā (Vasiṣṭha’s cow)'
  k.iast = 'Nandinī / Śabalā'
  k.details = (k.details ?? '').replace(' Vasiṣṭha’s cow also appears, as Nandinī, in the Mahābhārata’s Vasiṣṭha–Viśvāmitra story; that occurrence has not been linked here.', '')
  note('char:vasishtha-cow (medium) — the same figure as char:nandini-cow under a second id', `Merged into char:nandini-cow, renamed “Nandinī / Śabalā (Vasiṣṭha’s cow)”; ${nCow} assertions repointed; char:vasishtha-cow removed.`)
}

// ───────── 3. high confidence on Wikipedia alone ─────────
let lowered = 0, loweredR1 = 0
const onlyReference = (refs: { source: string }[]) => refs.length > 0 && refs.every((r) => sourceType.get(r.source) === 'reference')
for (const [file, items] of assertions) for (const a of items) {
  if (a.confidence === 'high' && onlyReference(a.sources)) { a.confidence = 'medium'; if (isR2(file)) lowered++; else loweredR1++; dirty.add(file) }
}
if (lowered || loweredR1) note('material:r2-142 and 158 others (medium) — confidence high on a Wikipedia citation alone', `${lowered} round-2 assertions whose only support is a reference work lowered to confidence medium (their statuses were already reference-checked); the same rule caught ${loweredR1} round-1 assertions, lowered too. The validator now warns when this recurs.`)

// ───────── 4. temple “upgrades” that rest on unopened books ─────────
let reverted = 0
for (const [file, items] of assertions) if (file.endsWith('/temple.json')) for (const a of items) {
  if (a.status === 'source-checked' && /checked from the researcher.s knowledge of the works/.test(a.rationale ?? '')) {
    a.status = 'reference-checked'
    a.rationale = 'Round 2 added scholarly works that treat this attribution (kept as bibliography); they were not opened, so the claim stays reference-checked until a page is read (verification round 2).'
    reverted++; dirty.add(file)
  }
}
if (reverted) note('temple:162 and 106 others (medium) — upgrades to source-checked on books that were not opened', `${reverted} assertions reverted to reference-checked; the added bibliography is kept.`)

// ───────── 5. claimed or undated antiquity stored as numeric material dates ─────────
const claimed = /claimed|believed|unsupported|regional style only|not dated in the reference|no dates in the reference/i
let stripped = 0
const strippedIds: string[] = []
for (const [file, items] of entities) if (file.endsWith('/temple-r2.json')) for (const e of items) {
  for (const d of e.dates ?? []) {
    if (d.system === 'material' && d.certainty === 'disputed' && typeof d.start === 'number' && claimed.test(`${d.label} ${d.basis ?? ''}`)) {
      delete (d as Partial<DateClaim>).start
      delete (d as Partial<DateClaim>).end
      d.basis = `${d.basis ?? ''}; no numeric date is given because none is supported by evidence (verification round 2)`.replace(/^; /, '')
      stripped++; strippedIds.push(e.id); dirty.add(file)
    }
  }
}
if (stripped) note('temple:mahaganapati-ranjangaon, chandranath, dakshinkali, the four Pañca Kedāra shrines (medium) — claimed antiquity placed temples on the material time map', `${stripped} disputed material dates resting on a claim or on style alone keep their label but lose their numeric range, so the buildings no longer appear at 800–1600 CE: ${strippedIds.join(', ')}.`)

// ───────── 6. legends stated as fact ─────────
{
  const oz = E('temple:vighnahar-ozar')
  if (!/by temple tradition/.test(oz.summary ?? '')) {
    oz.summary = 'Aṣṭavināyaka temple at Ozar on the Kukaḍī river near Junnar where, by temple tradition, Gaṇeśa defeated the obstacle-demon Vighnāsura; renovated in 1967.'
    oz.dates = [...(oz.dates ?? []), { system: 'traditional', event: 'sthala-purāṇa', label: 'Gaṇeśa’s victory over Vighnāsura (temple tradition)', certainty: 'estimated', basis: 'temple tradition (sthala-purāṇa); not a historical date', sources: [{ source: 'src:wikipedia', url: 'https://en.wikipedia.org/wiki/Vigneshwara_Temple,_Ozar' }] } as DateClaim]
    oz.limits = `${oz.limits ?? ''} The Vighnāsura story is the temple’s sthala-purāṇa (class 6).`.trim()
  }
  const th = E('temple:chintamani-theur')
  if (!/by temple tradition/.test(th.summary ?? '')) {
    th.summary = 'One of the larger Aṣṭavināyaka temples, at Theur near Pune, where, by temple tradition, Gaṇeśa recovered the wish-granting jewel for the sage Kapila; a favoured shrine of the Peśvā Mādhavrāv I, who died there in 1772.'
    th.dates = [...(th.dates ?? []), { system: 'traditional', event: 'sthala-purāṇa', label: 'Gaṇeśa recovers the cintāmaṇi jewel for Kapila (temple tradition)', certainty: 'estimated', basis: 'temple tradition (sthala-purāṇa); not a historical date', sources: [{ source: 'src:wikipedia', url: 'https://en.wikipedia.org/wiki/Chintamani_Temple,_Theur' }] } as DateClaim]
    th.limits = `${th.limits ?? ''} The cintāmaṇi story is the temple’s sthala-purāṇa (class 6).`.trim()
  }
  note('temple:vighnahar-ozar, temple:chintamani-theur (medium) — sthala-purāṇa stated as fact', 'Summaries now say “by temple tradition”; each legend is recorded as a traditional date and in the limits.')
}

// ───────── 7. the Ayodhyā excavation's two evidence edges weighted unequally ─────────
{
  const srcFile = join(DATA, 'sources', 'material-r2.json')
  const srcs = sources.get(srcFile)!
  const add = (s: Source) => { if (!srcs.some((x) => x.id === s.id)) { srcs.push(s); dirty.add(srcFile) } }
  add({ agent: 'material', id: 'src:mandal-ratnagar-2007', type: 'scholarly-book', title: 'Ayodhya: Archaeology after Excavation', author: 'D. Mandal and Shereen Ratnagar', year: '2007', publisher: 'Tulika Books, New Delhi', notes: 'Cited as the published critique of the ASI report; not opened for this project. Bibliographic details from the verification report and recall.' } as Source)
  add({ agent: 'material', id: 'src:varma-menon-2010', type: 'journal-article', title: 'Was There a Temple under the Babri Masjid? Reading the Archaeological “Evidence”', author: 'Supriya Varma and Jaya Menon', year: '2010', publisher: 'Economic and Political Weekly 45.50', notes: 'Written by two archaeologists who observed the 2003 excavation; not opened for this project.' } as Source)
  const pro = A('material:r2-298'), con = A('material:r2-299')
  con.confidence = pro.confidence = 'medium'
  for (const id of ['src:mandal-ratnagar-2007', 'src:varma-menon-2010']) if (!con.sources.some((s) => s.source === id)) con.sources.push({ source: id })
  con.competing = 'The ASI and the Allahabad High Court (2010) rejected these criticisms; the Supreme Court (2019) accepted that a non-Islamic structure lay beneath the mosque but made no finding that a temple had been demolished.'
  note('claim:ayodhya-temple-beneath-mosque (medium) — the SUPPORTS and CONTRADICTS edges carried unequal confidence', 'Both edges are now confidence medium; the CONTRADICTS edge cites the critics’ published work (Mandal & Ratnagar 2007; Varma & Menon, EPW 2010) and records the ASI’s and the courts’ replies.')
}

// ───────── 8. low-severity findings ─────────
{
  let n = 0
  for (const [file, items] of entities) if (file.endsWith('/temple-r2.json')) for (const e of items) for (const d of e.dates ?? []) {
    if (d.certainty === 'secure' && /recall|as reported|does not quote/i.test(d.basis ?? '')) { d.certainty = 'estimated'; n++; dirty.add(file) }
  }
  if (n) note('temple:thousand-pillar-hanamkonda and others (low) — “secure” dates that were not checked in an edition', `${n} temple dates resting on recall or “as reported” lowered from secure to estimated until the inscription edition is cited.`)
}
{
  const k = E('art:kankali-tila-sarasvati')
  for (const d of k.dates ?? []) {
    if (d.start === 179) { d.certainty = 'estimated'; d.view = 'now widely accepted equation (127 CE epoch)' }
    if (d.start === 130) { d.certainty = 'disputed'; d.view = 'older equation (78 CE epoch)' }
  }
  note('art:kankali-tila-sarasvati (low) — both era equations disputed, so the older one placed the image', 'The 127 CE epoch (c. 181 CE) is now the estimated date; the 78 CE equation stays as the disputed older view.')
}
{
  const c = E('art:vasudeva-i-coin-cma')
  const d = (c.dates ?? [])[0]
  if (d && d.start === 142) {
    c.attributes = { ...(c.attributes ?? {}), 'museum dating': 'c. 142/145+ (Cleveland Museum of Art, on an older Kuṣāṇa chronology)' }
    Object.assign(d, { start: 190, end: 230, label: 'reign of Vāsudeva I (c. 190–230)', certainty: 'estimated', basis: 'dated to the issuing king’s reign as the graph dates it; the museum’s c. 142/145+ follows an older chronology' })
  }
  note('art:vasudeva-i-coin-cma (low) — museum date placed the coin before its king’s reign', 'Dated to Vāsudeva I’s reign (c. 190–230, estimated); the museum’s label is kept as an attribute.')
}
{
  const r = E('temple:rasmancha-bishnupur')
  if (r.location) { r.location.lat = 23.0682; r.location.lon = 87.3221 }
  note('temple:rasmancha-bishnupur (low) — coordinates copied from the Jor Bangla temple', 'Set to 23.0682, 87.3221 (OpenStreetMap).')
}
{
  const p = E('temple:sv-temple-pittsburgh')
  for (const d of p.dates ?? []) if (d.event === 'consecration' && d.start === 1975) Object.assign(d, { start: 1977, end: 1977, label: 'consecrated 8 June 1977' })
  p.details = (p.details ?? '').replace('Groundbreaking was on 17 April 1975.', 'Published accounts differ on the date of the groundbreaking (1975 or 1976).')
  note('temple:sv-temple-pittsburgh (low) — groundbreaking year uncertain', 'The secure date is now the consecration alone (8 June 1977); the details note that accounts of the groundbreaking differ.')
}
{
  const a = A('iconography:691'); a.confidence = 'medium'
  note('iconography:691 (low) — earliest dated Gaṅgādhara rests on Wikipedia and an unopened monograph', 'Lowered to confidence medium; disc:gangadhara-udayagiri was already medium and says the identification rests on reference works.')
}
{
  let n = 0
  for (const [file, items] of assertions) if (file.endsWith('/material-r2.json')) for (const a of items) {
    if (a.p === 'COMMISSIONED_BY' && /painter|engraver|composer/.test(String(a.qualifiers?.role ?? ''))) { a.p = 'MADE_BY'; n++; dirty.add(file) }
  }
  note('material:r2-317 and others (low) — painters and engravers recorded as patrons (COMMISSIONED_BY)', `New predicate MADE_BY (artifact/manuscript/inscription → person, with qualifier.role); ${n || 'the'} painter/engraver/composer edges moved to it. MEMBER_OF is documented for groups, styles and schools as well as lineages, and profile pages now list those under “Groups, styles & schools” rather than “Kinship & lineage”.`)
}
{
  const t = E('text:amritabindu-upanishad')
  t.aliases = [...new Set([...(t.aliases ?? []), 'Amṛtanāda Upaniṣad'])]
  const extra = 'The content described here is that of the text usually called the Amṛtanāda Upaniṣad (Deussen’s “Amṛtabindu”); it is distinct from the Brahmabindu, which some lists, including the Muktikā, call Amṛtabindu.'
  if (!(t.details ?? '').includes('Amṛtanāda')) t.details = [t.details, extra].filter(Boolean).join(' ')
  note('text:amritabindu-upanishad (low) — ambiguous title', 'Alias “Amṛtanāda Upaniṣad” added, with a note distinguishing it from the Brahmabindu.')
}
{
  const paraphrase: Record<string, string> = {
    'regional:r2-92': 'Kane equates the south Indian Pongal with the Makara-saṅkrānti of northern and western India.',
    'regional:r2-4': 'Balipratipadā: Kane, summarising Bhaviṣyottara 140, describes the day after Dīpāvalī as the day of Bali’s sovereignty.',
    'regional:r2-493': 'Kane notes that the legend of Kṛṣṇa’s killing of Narakāsura came to be attached to the fourteenth.',
  }
  for (const [id, text] of Object.entries(paraphrase)) { const a = A(id); a.qualifiers = { ...(a.qualifiers ?? {}), note: text } }
  note('regional:r2-92, r2-4, r2-493 (low) — short quotations from an in-copyright work', 'Paraphrased; the page locators are kept.')
}
{
  const file = join(DATA, 'sources', 'vedic-r2.json')
  const s = sources.get(file)!.find((x) => x.id === 'src:gretil-natyashastra')
  if (s) { s.url = 'https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/plaintext/sa_bharata-nATyazAstra-1-1618-303335-37.txt'; dirty.add(file) }
  note('src:gretil-natyashastra (low) — URL returned 404', 'Corrected to the current GRETIL file name.')
}
{
  const r = E('trad:ravidassia')
  r.summary = (r.summary ?? '').replace('largely of Dalit (camār) background', 'largely of Dalit background (many identify as Ad-Dharmi or Ravidassia)')
  note('trad:ravidassia (low) — caste name used in the summary', 'Rephrased with the community’s self-designations.')
}
{
  const a = A('vedic:r2-357')
  a.qualifiers = { ...(a.qualifiers ?? {}), note: 'One of the four: “ayam ātmā brahma” (Māṇḍ. 2; also BU 2.5.19). The other three are linked separately — CU 6.8.7 (vedic:r2-355), BU 1.4.10 (vedic:r2-356) and AU 3.3 (vedic:r2-358).' }
  note('vedic:r2-357 (low) — “Mahāvākyas DERIVED_FROM Māṇḍūkya” over-general', 'The note now says only “ayam ātmā brahma” comes from the Māṇḍūkya and points to the three parallel edges that already exist for the other mahāvākyas.')
}
note('disc:onam-mayon, disc:kalidasa-source, disc:varuna-mount, disc:holi-two-stories, disc:devi-mahatmya-manuscript', 'Fixed in scripts/seed-discoveries.ts: Ōṇam retitled to the poem’s Madurai and its unnamed Bali; the Raghuvaṃśa’s naming of Vālmīki described as an event in the story, with Aśvaghoṣa as an earlier witness; “two oldest image manuals” → “two early image manuals”; Holī “plural as soon as texts explain it”; the Devī Māhātmya manuscript lowered to medium.')

// ───────── write ─────────
for (const f of dirty) {
  const items = entities.get(f) ?? assertions.get(f) ?? sources.get(f)
  writeFileSync(f, JSON.stringify(items, null, 1) + '\n')
}
// the log is written on the run that applies the changes; a re-run (nothing left to apply) leaves it as is
if (moved) writeFileSync(join(ROOT, 'research', 'verification-r2-resolution.md'), `# Round-2 verification — resolution log

Generated by \`scripts/apply-verification-r2.ts\` on ${today}. The independent audit of the
round-2 additions is \`research/verification-r2-report.md\` (25 findings: 0 high, 11 medium,
14 low; 154 assertions read by hand with no factual error, 1,210 quotations checked by script).
Every finding is resolved below; the epic relocations are listed verse by verse in
\`research/verification-r2-relocations.json\`.

| Finding | Resolution |
|---|---|
${log.map((l) => `| ${l.finding.replace(/\|/g, '/')} | ${l.resolution.replace(/\|/g, '/')} |`).join('\n')}
`)
console.log(`applied ${log.length} resolutions; ${dirty.size} files rewritten; ${moved} locators moved, ${kept} kept`)
