/**
 * Publishes the built microsite into the villa Next.js app's static folder, so it is
 * served at /sanatana by the villa Vercel project alongside /turkey and /workation.
 *
 *   npm run publish:villa   (runs `npm run graph`, a typecheck and a /sanatana/-based build first)
 *
 * The villa app rewrites /sanatana → /sanatana/index.html (see villa/next.config.ts).
 * Routing inside the site is hash-based, so no other rewrites are needed.
 */
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'dist-villa')
const DEST = join(ROOT, '..', 'villa', 'public', 'sanatana')
execSync(`npx vite build --base=/sanatana/ --outDir ${OUT} --emptyOutDir`, { cwd: ROOT, stdio: 'inherit' })
if (existsSync(DEST)) rmSync(DEST, { recursive: true })
mkdirSync(DEST, { recursive: true })
cpSync(OUT, DEST, { recursive: true })
console.log(`published ${OUT} → ${DEST}`)
