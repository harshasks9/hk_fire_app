/**
 * Orchestrator merge fixes after round 2 (idempotent). Logged in research/round-2-merge.md.
 *  - The validator now accepts coordinates worldwide, so the four diaspora temples whose
 *    coordinates the temple agent had to park in attributes get a proper location.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Entity } from '../schema/types.ts'

const file = join(import.meta.dirname, '..', 'data', 'entities', 'temple-r2.json')
const es: Entity[] = JSON.parse(readFileSync(file, 'utf8'))
const log: string[] = []
for (const e of es) {
  const c = typeof e.attributes?.coordinates === 'string' ? e.attributes.coordinates : undefined
  if (e.location || !c || !/not plotted/.test(c)) continue
  const m = c.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
  if (!m) continue
  const label = String(e.attributes?.locationLabel ?? '').split(' — ')
  e.location = { lat: +m[1], lon: +m[2], precision: 'exact', label: label[0], country: label[1] ?? label[0] }
  e.attributes!.coordinates = c.replace(/; not plotted — outside the map range accepted by the dataset validator/, '')
  delete e.attributes!.locationLabel
  log.push(`- \`${e.id}\`: location set from the parked coordinates (${m[1]}, ${m[2]})`)
}
// a name-based traditional attribution must not be a material date
for (const e of es) for (const d of e.dates ?? []) {
  if (d.system === 'material' && /^\s*traditional attribution/i.test(d.basis ?? '')) {
    d.system = 'traditional'
    d.event = 'traditional attribution (by name)'
    log.push(`- \`${e.id}\`: “${d.label}” moved from the material to the traditional chronology (basis: ${d.basis})`)
  }
}
writeFileSync(file, JSON.stringify(es, null, 1) + '\n')
const md = join(import.meta.dirname, '..', 'research', 'round-2-merge.md')
if (log.length) writeFileSync(md, `# Round-2 merge fixes (orchestrator)\n\nThe validator's longitude bound (−30°) excluded the Americas; it now accepts any valid coordinate. Changes applied to the round-2 temple data:\n\n${log.join('\n')}\n`)
console.log(log.length ? log.join('\n') : 'nothing to apply')
