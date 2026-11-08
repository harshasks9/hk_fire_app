/**
 * npm run find -- "Kalidasa" "Bṛhat Saṃhitā" "कृष्ण"
 * Searches every record (name, IAST, Devanāgarī, aliases) with the site's own folding, so
 * researchers can check for an existing record before creating a new one.
 */
import { loadDataset } from './lib/load.ts'
import { mergeEntities } from './lib/check.ts'
import { fold } from '../src/lib/search.ts'

const qs = process.argv.slice(2)
const { byId } = mergeEntities(loadDataset())
const rows = [...byId.values()].map((e) => ({ e, keys: [e.name, e.iast, e.devanagari, ...(e.aliases ?? []), e.id.split(':')[1]?.replace(/-/g, ' ')].filter(Boolean).map((k) => fold(String(k))) }))
for (const q of qs) {
  const f = fold(q)
  const hits = rows.filter((r) => r.keys.some((k) => k === f || k.includes(f) || (f.length > 4 && f.includes(k) && k.length > 4)))
  console.log(`\n“${q}” → ${hits.length ? hits.slice(0, 12).map((h) => `${h.e.id} (${h.e.name})`).join('; ') : 'NOT FOUND'}`)
}
