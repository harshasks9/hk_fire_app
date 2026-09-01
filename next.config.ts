import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PGlite (dev-only Postgres) ships wasm; keep it external to the server bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  // The PGlite fallback migrates itself at runtime from ./drizzle — make sure
  // the SQL files are traced into the serverless bundle.
  outputFileTracingIncludes: { '/**': ['./drizzle/**'] },
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
