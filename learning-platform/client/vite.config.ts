/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // SIGNUP-EXPEDITE-001: the dev server (5173) and the Express API
    // (index.ts, port 3000) are separate processes; without this, fetches
    // to /api/* from the Vite dev server 404 instead of reaching Express.
    // Production doesn't need this — app.ts serves the built client itself.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
