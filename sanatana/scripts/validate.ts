/**
 * npm run validate                — check the whole dataset
 * npm run validate -- --domain epic  — only print issues from files named epic.json
 * npm run validate -- --errors       — errors only
 *
 * Exit code 1 if any error remains (in the filtered set).
 */
import { loadDataset } from './lib/load.ts'
import { checkDataset } from './lib/check.ts'

const args = process.argv.slice(2)
const domain = args.includes('--domain') ? args[args.indexOf('--domain') + 1] : undefined
const errorsOnly = args.includes('--errors')

const ds = loadDataset()
const { issues, entities, assertions, sources } = checkDataset(ds)
const shown = issues.filter((i) => (!domain || new RegExp(`/${domain}(-[^/]*)?\\.json$`).test(i.file)) && (!errorsOnly || i.severity === 'error'))

const errors = shown.filter((i) => i.severity === 'error')
const warns = shown.filter((i) => i.severity === 'warn')
for (const i of [...errors, ...warns].slice(0, 400)) {
  console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '}  ${i.file.replace(/.*\/data\//, 'data/')}  ${i.id}  — ${i.message}`)
}
if (shown.length > 400) console.log(`… ${shown.length - 400} more`)
console.log(`\n${entities.size} entities · ${assertions.length} assertions · ${sources.size} sources`)
console.log(`${errors.length} errors · ${warns.length} warnings${domain ? ` (domain ${domain})` : ''}`)
process.exit(errors.length ? 1 : 0)
