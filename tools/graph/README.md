# Knowledge graph editor

Local viewer/editor for the DESIGN SSOT store (`design/knowledge_goals_graph.json`), shaped by
`.claude/reference/knowledge_goals_graph.schema.json`. Mirrors the `tools/slides/` pattern:
containerised, single local human user, no auth, no database.

## Status

Frontend + local file server both exist now (plan steps 5–6). There is no `check` command yet
(step 7) and no Docker wrapper yet (step 8) — see `doc/tmp/app-editing-chart/plan.md` for what's
done and what's next.

## Running it now (dev mode, host Node ≥20 required)

Two processes, in separate terminals:

```bash
cd tools/graph
npm install
npm run server   # file server on 127.0.0.1:3001 — reads/validates/writes design/knowledge_goals_graph.json
npm run dev       # Vite dev server on 127.0.0.1:5173, proxies /api to the server above
```

Open `http://127.0.0.1:5173`. Loading fetches the current graph via `GET /api/graph`; saving a
node's edit form calls `PUT /api/graph`, which validates the whole graph against
`.claude/reference/knowledge_goals_graph.schema.json` before writing it back — a failed validation
leaves the file untouched and shows an error banner instead.

This host's system Node is 18, which is why these commands must be run with a Node ≥20 toolchain
(nvm, a container, etc.) — `create-vite` and some transitive deps enforce that `engines`
requirement. Once step 8 lands, running it will not need a compatible local Node at all — same as
`tools/slides`, only Docker will be required on the host, via a wrapper script
(`tools/graph/graph edit <file>`).

## Other commands

```bash
npm run build     # type-check (tsc -b) + production build to dist/ (git-ignored)
npm run preview   # serve the dist/ build locally
npm run server    # the file server alone (see above)
```

## Layout of the source

- `src/types/graph.ts` — TypeScript types mirroring the JSON Schema. The schema is the authority;
  if these drift apart, the schema wins and this file has a bug.
- `src/lib/nodeFormSchema.ts` — Zod schema re-deriving the same per-type rules, so the edit form
  catches bad values before save.
- `src/lib/layout.ts` — Dagre auto-layout, re-run on every load. Canvas positions are never part of
  the SSOT file (would pollute diffs with non-semantic changes), so nothing here is persisted.
- `src/components/` — the React Flow canvas, colour-coded node view, the `Requires`-edge renderer
  (shows `reason` as a label), and the side edit panel.
- `src/App.tsx` — loads the graph from `GET /api/graph`, saves via `PUT /api/graph`, holds
  selection state and a save-error banner.
- `server/index.mjs` — the local file server (see "Running it now" above).
- `server/formatGraph.mjs` — deterministic pretty-printer matching the file's existing on-disk
  style (inline arrays of primitives, compact small objects like edges, expanded nodes), so a save
  never reformats the whole file as a side effect.

## Known gaps (see the plan log for details)

- The edit panel's `audience`/`held_by`/`skippable_by` fields are plain text inputs but the schema
  expects `"all" | string[]` — editing those specific fields doesn't validate correctly yet.
- No `check` command yet (schema + closure-check validation, standalone from the server) — step 7.
