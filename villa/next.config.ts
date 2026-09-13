import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships wasm it locates relative to its own file; bundling breaks that.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  reactStrictMode: true,
  typedRoutes: false,
};

export default nextConfig;
