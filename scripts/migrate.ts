/* Apply drizzle migrations to the Postgres pointed at by DATABASE_URL. */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. For local dev the app uses embedded PGlite and migrates itself.')
    process.exit(1)
  }
  const client = postgres(url, { max: 1, prepare: false })
  await migrate(drizzle(client), { migrationsFolder: './drizzle' })
  await client.end()
  console.log('Migrations applied.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
