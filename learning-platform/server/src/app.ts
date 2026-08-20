import express, { type Express } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist')

/**
 * Builds the Express app: serves the built React client (HOME-001's home
 * page) as static files, plus a health check endpoint.
 *
 * Kept separate from index.ts so tests can import the app without binding
 * to a port.
 */
export function createApp(): Express {
  const app = express()

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  app.use(express.static(CLIENT_DIST))

  // client-side routing fallback: any unmatched GET serves the SPA shell
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })

  return app
}
