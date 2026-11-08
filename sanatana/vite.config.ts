import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' so the build runs from any sub-path (/sanatana/ on the villa site, a Vercel root, an artifact).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => (/node_modules\/(cytoscape|cytoscape-fcose|cose-base|layout-base)\//.test(id) ? 'graph' : /node_modules\/d3-/.test(id) ? 'geo' : undefined),
      },
    },
  },
})
