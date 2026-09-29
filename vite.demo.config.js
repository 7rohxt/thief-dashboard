// Builds the whole dashboard into ONE self-contained HTML file (demo/index.html)
// that opens by double-click, no server needed. Map tiles still need internet.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'demo', assetsInlineLimit: 100000000, chunkSizeWarningLimit: 5000 },
})
