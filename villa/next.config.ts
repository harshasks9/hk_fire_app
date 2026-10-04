import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships wasm it locates relative to its own file; bundling breaks that.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  reactStrictMode: true,
  typedRoutes: false,
  // The dev badge sits on top of the sidebar footer; the build output says the same thing.
  devIndicators: false,
  // The Turkey trip planner is one static page in public/turkey/.
  async rewrites() {
    return [{ source: "/turkey", destination: "/turkey/index.html" }];
  },
};

export default nextConfig;
