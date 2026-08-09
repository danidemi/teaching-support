# Knowledge graph editor

Local viewer/editor/checker for the DESIGN SSOT store (`design/knowledge_goals_graph.json`),
shaped by `.claude/reference/knowledge_goals_graph.schema.json` — see
`.claude/reference/knowledge_goals_graph_model.md` for a human-facing walkthrough of that model.
Mirrors the `tools/slides/` pattern: containerised, single local human user, no auth, no
database, `.pptx`-style build products don't apply here (there's nothing to render) — a git
commit of the JSON file *is* the certification.

## Status

All 11 steps of `doc/tmp/app-editing-chart/plan.md` are done. This README covers the two ways to
run it; the plan log has the full build history, the bugs found and fixed along the way, and the
reasoning behind each design decision.

## Running it (recommended: Docker, host needs nothing else)

```bash
tools/graph/graph edit design/knowledge_goals_graph.json   # opens a browser at 127.0.0.1:5173
tools/graph/graph check design/knowledge_goals_graph.json  # schema + closure check, headless
tools/graph/graph help                                     # full command list
```

First run builds the image and installs dependencies (needs network); later runs are fast.
`node_modules` is **not** baked into the image — the repo is bind-mounted at runtime and
dependencies land on the host, owned by the invoking user (`-u $(id -u):$(id -g)`, same reasoning
`tools/slides/slides` uses) — so a fresh clone needs nothing but Docker.

`edit <file>` starts both the file server and the Vite dev UI inside one container, maps both
ports back to the host as `127.0.0.1`-only (the actual security boundary — the container binds
`0.0.0.0` *inside* itself, which isn't reachable from outside it), and best-effort opens a
browser once Vite is up. `ctrl-c` stops it. `check <file>...` is one-shot, no ports, safe to run
in CI or a pre-commit hook.

## Running it without Docker (dev mode, host Node ≥20 required)

Two processes, in separate terminals:

```bash
cd tools/graph
npm install
npm run server   # file server on 127.0.0.1:3001 — reads/validates/writes design/knowledge_goals_graph.json
npm run dev       # Vite dev server on 127.0.0.1:5173, proxies /api to the server above
```

Then open `http://127.0.0.1:5173` yourself. `npm run check <file>` runs the standalone checker
the same way `graph check` does inside Docker.

This repo's host Node may be older than the `>=20` `package.json` requires (`create-vite` and
some transitive deps enforce that at install time) — in that case use `tools/graph/graph` instead,
or a Node ≥20 toolchain (nvm, etc.) for this path.

## What loading/saving actually does

Loading fetches the current graph via `GET /api/graph`. Saving a node's edit form calls
`PUT /api/graph`, which sorts (`nodes` by `id`, `edges` by `(from, to)`), validates the whole graph
against `.claude/reference/knowledge_goals_graph.schema.json`, and — only if valid — pretty-prints
it with `server/formatGraph.mjs` (matching the file's existing on-disk convention, so an
unrelated-field save doesn't reformat the whole file) and writes it back. A failed validation
leaves the file untouched and shows an error banner instead of silently corrupting the store.

## Other commands (non-Docker path)

```bash
npm run build     # type-check (tsc -b) + production build to dist/ (git-ignored)
npm run preview   # serve the dist/ build locally
npm run server    # the file server alone (see above)
npm run check      # tools/graph/check.mjs alone (see above)
```

## Layout of the source

- `src/types/graph.ts` — TypeScript types mirroring the JSON Schema. The schema is the authority;
  if these drift apart, the schema wins and this file has a bug.
- `src/lib/nodeFormSchema.ts` — Zod schema re-deriving the same per-type rules, so the edit form
  catches bad values before save.
- `src/lib/layout.ts` — Dagre auto-layout, re-run on every load. Canvas positions are never part of
  the SSOT file (would pollute diffs with non-semantic changes), so nothing here is persisted.
- `src/components/` — the React Flow canvas, colour-coded node view, the `Requires`-edge renderer
  (shows `reason` as a label), and the side edit panel (`EditPanel.tsx` — note the
  `audience`/`held_by`/`skippable_by` text↔array conversion helpers, needed because those fields
  are `"all" | string[]`/`string[]` but a text input only holds a string).
- `src/App.tsx` — loads the graph from `GET /api/graph`, saves via `PUT /api/graph`, holds
  selection state and a save-error banner.
- `server/index.mjs` — the local file server. Reads `GRAPH_FILE`/`GRAPH_SERVER_HOST`/
  `GRAPH_SERVER_PORT` env overrides (used by the Docker wrapper's `edit`); unset, it defaults to
  the plain localhost-only/DESIGN-store behaviour described above.
- `server/formatGraph.mjs` — deterministic pretty-printer matching the file's existing on-disk
  style (inline arrays of primitives, compact small objects like edges, expanded nodes), so a save
  never reformats the whole file as a side effect.
- `check.mjs` — standalone schema + closure check (see `.claude/reference/
  knowledge_goals_graph_model.md`'s "Closure check" section for exactly what that means and why
  the direction isn't what the agent doc's prose reads as on a first pass). Deliberately separate
  from `server/index.mjs` — no port, no server, just a script, so it's usable headless.
- `Dockerfile` / `graph` / `docker/edit-entrypoint.sh` — the containerised entry point. The image
  is just Node ≥20, nothing else; `node_modules` is intentionally not baked in (see "Running it"
  above).

## Known gaps

- The closure check (`check.mjs`) doesn't verify *audience reachability* (every persona in a
  node's audience has a path in from a `Baseline` they hold) — the agent is instructed to check
  this by hand while building the graph; it isn't automated yet. See
  `.claude/reference/knowledge_goals_graph_model.md`.
- `persona_variant` has no dedicated edit-panel UI — it round-trips untouched on save (nothing is
  lost), but adding/editing a variant currently means editing the JSON directly.
