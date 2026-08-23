# learning-platform

Web app supporting `learning-platform` services (see
`../learning_software_spec/learning-platform/references/vision.md`).
Stack decision: `../learning_software_spec/learning-platform/adr/ADR-0001-tech-stack.md`.

## Layout
* `client/` — React + TypeScript, built with Vite.
* `server/` — Node.js + TypeScript + Express. Serves the built client and
  hosts the API (email/password auth, courses, quizzes).

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

## Human-led UAT (UAT-BOOTSTRAP-001)

```bash
./scripts/uat.sh
```

One script does everything a human needs for a UAT session, from a clean
checkout: tears down and recreates Postgres/mailpit, waits for Postgres to
be healthy, builds the server and the client, then starts the built server
in the foreground (Ctrl-C to stop). No other setup step is needed — the
server runs pending DB migrations itself on startup.

Once it logs `learning-platform server listening on port 3000`, open
http://localhost:3000 in a browser. Captured emails (e.g. sign-up
confirmation links) are at http://localhost:8025.

Safe to re-run: each run starts from a clean container/volume state.
Whenever a change alters how the app is built, started, or migrated,
update this script in the same change.

## Local email testing (Mailpit)

`server/docker-compose.yml` starts a `mailpit` container that catches all
emails sent by the server in local dev (e.g. sign-up confirmation links) —
nothing is sent to a real inbox. View captured emails at:

http://localhost:8025

SMTP itself is on port `1025`, matching `SMTP_HOST`/`SMTP_PORT` in
`server/.env.example`.
