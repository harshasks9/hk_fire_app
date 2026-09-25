import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships wasm it locates relative to its own file; bundling breaks that.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  reactStrictMode: true,
  typedRoutes: false,
  // The dev badge sits on top of the sidebar footer; the build output says the same thing.
  devIndicators: false,
};

export default nextConfig;
