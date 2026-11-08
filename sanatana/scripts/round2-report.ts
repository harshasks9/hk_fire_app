/**
 * npm run report:r2 → research/round-2-additions.md
 * Counts what round 2 added (files *-r2.json and the new iconography files) by agent and
 * record type, and lists every new record by name, grouped — the factual basis for the
 * "what was added" summary.
 */
import { writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { loadDataset, ROOT } from './lib/load.ts'
import { TYPE_LABEL_PLAIN } from './lib/labels.ts'
import type { Entity, Assertion } from '../schema/types.ts'

const ds = loadDataset()
const isR2 = (file: string) => /-r2\.json$/.test(file) || basename(file).startsWith('iconography')
const newEntities: (Entity & { _f: string })[] = ds.entities.filter((f) => isR2(f.file)).flatMap((f) => f.items.map((e) => ({ ...e, _f: f.domain })))
const newAssertions: Assertion[] = ds.assertions.filter((f) => isR2(f.file)).flatMap((f) => f.items)
const newSources = ds.sources.filter((f) => isR2(f.file)).flatMap((f) => f.items)
const newComparisons = ds.comparisons.filter((f) => isR2(f.file)).flatMap((f) => f.items)
const allEntities = ds.entities.flatMap((f) => f.items).length
const allAssertions = ds.assertions.flatMap((f) => f.items).length

const byAgent = new Map<string, (Entity & { _f: string })[]>()
for (const e of newEntities) (byAgent.get(e.agent) ?? byAgent.set(e.agent, []).get(e.agent)!).push(e)

let md = `# Round 2 — what was added

Generated ${new Date().toISOString().slice(0, 10)} from the round-2 data files.

| | Round 2 added | Dataset total now |
|---|---|---|
| Records (entities) | **${newEntities.length.toLocaleString()}** | ${allEntities.toLocaleString()} |
| Assertions (sourced relationships) | **${newAssertions.length.toLocaleString()}** | ${allAssertions.toLocaleString()} |
| Sources | **${newSources.length}** | ${ds.sources.flatMap((f) => f.items).length} |
| Comparison tables | **${newComparisons.length}** | ${ds.comparisons.flatMap((f) => f.items).length} |

`
for (const [agent, es] of [...byAgent.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const as = newAssertions.filter((a) => a.agent === agent).length
  md += `## ${agent} — ${es.length} records, ${as} assertions\n\n`
  const byType = new Map<string, string[]>()
  for (const e of es) (byType.get(e.type) ?? byType.set(e.type, []).get(e.type)!).push(e.name)
  for (const [t, names] of [...byType.entries()].sort((a, b) => b[1].length - a[1].length)) {
    md += `- **${TYPE_LABEL_PLAIN[t] ?? t} (${names.length})**: ${names.sort((a, b) => a.localeCompare(b)).join('; ')}\n`
  }
  md += '\n'
}
if (newComparisons.length) md += `## New comparison tables\n\n${newComparisons.map((c) => `- ${c.title}`).join('\n')}\n`
writeFileSync(join(ROOT, 'research', 'round-2-additions.md'), md)
console.log(`round 2: ${newEntities.length} records, ${newAssertions.length} assertions, ${newSources.length} sources, ${newComparisons.length} comparisons`)
