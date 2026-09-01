/* CLI wrapper around the seed runner. FORCE_RESEED=1 wipes and reseeds. */
import { runSeed } from '../lib/seed/run'

runSeed({ force: process.env.FORCE_RESEED === '1' }).then(
  (res) => process.exit(res.ok ? 0 : 1),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
