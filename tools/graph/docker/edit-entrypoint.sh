#!/bin/sh
# Entrypoint for `graph edit <file>` (see tools/graph/graph). Runs *inside* the container, with
# the repo bind-mounted at /work and CWD at /work/tools/graph.
#
# Starts the file server in the background and the Vite dev server in the foreground. Both bind
# 0.0.0.0 here — not the 127.0.0.1 used by `npm run dev`/`npm run server` outside Docker — because
# that's the container's own loopback, not reachable via `docker run -p`. The host-side
# localhost-only guarantee comes from the wrapper script's `-p 127.0.0.1:PORT:PORT`, not from
# this bind address.
set -e

node server/index.mjs &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null' EXIT INT TERM

exec npx vite --host 0.0.0.0 --port 5173
