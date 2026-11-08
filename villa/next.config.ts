import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships wasm it locates relative to its own file; bundling breaks that.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  reactStrictMode: true,
  typedRoutes: false,
  // The dev badge sits on top of the sidebar footer; the build output says the same thing.
  devIndicators: false,
  // The Turkey trip planner, the workation report and the Sanatana knowledge graph are
  // static pages in public/. Sanatana is built by ../sanatana (npm run publish:villa) with
  // base /sanatana/ and hash routing, so one rewrite serves every view.
  async rewrites() {
    return [
      { source: "/turkey", destination: "/turkey/index.html" },
      { source: "/workation", destination: "/workation/index.html" },
      { source: "/sanatana", destination: "/sanatana/index.html" },
    ];
  },
};

export default nextConfig;
