import { runSeed } from '../lib/seed/run'
runSeed({ force: process.env.FORCE_RESEED === '1', log: (s) => console.log(s) }).then(
  (r) => {
    console.log(r)
    process.exit(0)
  },
  (e) => {
    console.error(e)
    process.exit(1)
  },
)
