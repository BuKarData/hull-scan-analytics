import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import mpaCleanUrls from './vite-mpa.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), mpaCleanUrls()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
