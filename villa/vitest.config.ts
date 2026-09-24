import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  // Components are rendered in some tests; Next keeps JSX for its own compiler, vitest needs it compiled.
  esbuild: { jsx: "automatic" },
  test: { environment: "node", include: ["tests/**/*.test.ts", "lib/**/*.test.ts"] },
});
