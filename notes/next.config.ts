import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PGlite (embedded Postgres used when DATABASE_URL is absent) ships wasm; keep it out of the bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Migrations are applied at runtime from ./drizzle — trace the SQL into the serverless bundle.
  outputFileTracingIncludes: { '/**': ['./drizzle/**', './node_modules/@electric-sql/pglite/dist/**'] },
  eslint: { ignoreDuringBuilds: true },
  // Re-visiting a page within half a minute (back/forward, sidebar) is instant; refresh() still re-fetches.
  experimental: { serverActions: { bodySizeLimit: '8mb' }, staleTimes: { dynamic: 30, static: 180 } },
}

export default nextConfig
