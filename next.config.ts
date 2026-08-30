import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PGlite (dev-only Postgres) ships wasm; keep it external to the server bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
