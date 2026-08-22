# learning-platform

Web app supporting `learning-platform` services (see
`../learning_software_spec/learning-platform/references/vision.md`).
Stack decision: `../learning_software_spec/learning-platform/adr/ADR-0001-tech-stack.md`.

## Layout
* `client/` — React + TypeScript, built with Vite.
* `server/` — Node.js + TypeScript + Express. Serves the built client and
  will host the Google OAuth endpoints (LOGIN-001).

## Develop

```bash
cd client && npm install && npm test   # unit tests
cd server && npm install && npm test   # unit tests
```

## Run

```bash
cd server && npm run db:up             # starts Postgres + Mailpit (docker-compose.yml)
cd client && npm run build             # produces client/dist
cd server && npm run build && npm start   # serves the built client on :3000
```

## Local email testing (Mailpit)

`server/docker-compose.yml` starts a `mailpit` container that catches all
emails sent by the server in local dev (e.g. sign-up confirmation links) —
nothing is sent to a real inbox. View captured emails at:

http://localhost:8025

SMTP itself is on port `1025`, matching `SMTP_HOST`/`SMTP_PORT` in
`server/.env.example`.
