import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Database factory.
 *
 *  - DATABASE_URL set          → Postgres (Neon, Vercel Postgres, anything).
 *                                Migrated on first connect; no CLI step.
 *  - no DATABASE_URL, not on Vercel → embedded PGlite under .data/, so local
 *                                dev and tests exercise the real server path.
 *  - no DATABASE_URL, on Vercel → null. A serverless /tmp database would look
 *                                like persistence and lose everything between
 *                                instances, which is worse than honestly
 *                                staying in the browser. The client keeps
 *                                localStorage and the admin screen says so.
 */
const g = globalThis as unknown as { __villaDb?: Promise<Db | null> };

async function create(): Promise<Db | null> {
  const url = process.env.DATABASE_URL;
  const path = await import("node:path");
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  if (url) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { prepare: false, max: 5 });
    const db = drizzle(client, { schema });
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(db, { migrationsFolder });
    return db;
  }

  if (process.env.VERCEL && !process.env.PGLITE_DIR) return null;

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (!process.env.PGLITE_MEMORY) {
    const fs = await import("node:fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(process.env.PGLITE_MEMORY ? undefined : dataDir);
  const db = drizzle(client, { schema });
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(db, { migrationsFolder });
  return db as unknown as Db;
}

export function getDb(): Promise<Db | null> {
  if (!g.__villaDb) g.__villaDb = create();
  return g.__villaDb;
}

/** Tests need a fresh database each time. */
export function resetDbForTests() {
  g.__villaDb = undefined;
}

export { schema };
