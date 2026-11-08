/**
 * npm test — the dataset's contract as executable checks, plus the search folding.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadDataset } from './lib/load.ts'
import { checkDataset } from './lib/check.ts'
import { fold, buildSearchIndex, search, devanagariToIast } from '../src/lib/search.ts'

const ds = loadDataset()
const { issues, entities, assertions, sources } = checkDataset(ds)

test('the dataset has no validation errors', () => {
  const errors = issues.filter((i) => i.severity === 'error')
  assert.equal(errors.length, 0, errors.slice(0, 10).map((e) => `${e.id}: ${e.message}`).join('\n'))
})

test('every assertion cites at least one known source', () => {
  for (const a of assertions) {
    assert.ok(a.sources.length > 0, a.id)
    for (const r of a.sources) assert.ok(sources.has(r.source), `${a.id} → ${r.source}`)
  }
})

test('theological identifications are never bare identity merges', () => {
  for (const a of assertions) {
    if (a.p === 'AVATARA_OF') assert.notEqual(a.s, a.o)
  }
  // the registry keeps these pairs apart on purpose
  for (const [x, y] of [['char:janaka', 'char:janaka-videha'], ['deity:murugan', 'deity:skanda'], ['deity:vasudeva', 'char:krishna'], ['char:vasudeva-father', 'deity:vasudeva']]) {
    assert.ok(entities.has(x) && entities.has(y), `${x} and ${y} both exist as separate records`)
  }
})

test('temple founding legends are not used as material dates', () => {
  for (const e of entities.values()) {
    for (const d of e.dates ?? []) {
      // a material date may mention a legend (to set it aside) but must not rest on one
      if (d.system === 'material') assert.ok(!/^\s*(legend|tradition holds|temple tradition|local tradition|sthala|according to (the )?(legend|tradition)|traditional attribution)/i.test(d.basis ?? ''), `${e.id}: material date based on legend (${d.basis})`)
    }
  }
})

test('material evidence records say what they do not establish', () => {
  const missing = [...entities.values()].filter((e) => ['artifact', 'inscription', 'site'].includes(e.type) && e.summary && !e.limits).map((e) => e.id)
  assert.ok(missing.length <= Math.max(3, 0.1 * [...entities.values()].filter((e) => ['artifact', 'inscription', 'site'].includes(e.type)).length), `without limits: ${missing.join(', ')}`)
})

test('search folding unites spellings and scripts', () => {
  assert.equal(fold('Krishna'), fold('Kṛṣṇa'))
  assert.equal(fold('कृष्ण'), fold('Kṛṣṇa'))
  assert.equal(fold('Shiva'), fold('Śiva'))
  assert.equal(fold('शिव'), fold('Śiva'))
  assert.equal(fold('Vishnu'), fold('Viṣṇu'))
  assert.equal(fold('Rigveda'), fold('Ṛgveda'))
  assert.equal(fold('Vishwamitra'), fold('Viśvāmitra'))
  assert.equal(devanagariToIast('राम'), 'rāma')
  assert.notEqual(fold('Bharata'), fold('Bhārgava'))
})

test('search returns every same-named record, disambiguated', () => {
  const idx = buildSearchIndex([
    { id: 'char:nala', name: 'Nala', type: 'character', m: { degree: 3 } },
    { id: 'char:nala-vanara', name: 'Nala (vānara engineer)', type: 'character', m: { degree: 2 } },
    { id: 'char:krishna', name: 'Kṛṣṇa', type: 'character', devanagari: 'कृष्ण', aliases: ['Krishna'], m: { degree: 9 } },
  ])
  assert.deepEqual(new Set(search(idx, 'nala').map((h) => h.id)), new Set(['char:nala', 'char:nala-vanara']))
  for (const q of ['Krishna', 'Kṛṣṇa', 'कृष्ण', 'krsna']) assert.equal(search(idx, q)[0]?.id, 'char:krishna', q)
})
