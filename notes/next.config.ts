import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PGlite (embedded Postgres used when DATABASE_URL is absent) ships wasm; keep it out of the bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  // Migrations are applied at runtime from ./drizzle — trace the SQL into the serverless bundle.
  outputFileTracingIncludes: { '/**': ['./drizzle/**', './node_modules/@electric-sql/pglite/dist/**'] },
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
}

export default nextConfig
