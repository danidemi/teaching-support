# Knowledge graph editor

Local viewer/editor for the DESIGN SSOT store (`design/knowledge_goals_graph.json`), shaped by
`.claude/reference/knowledge_goals_graph.schema.json`. Mirrors the `tools/slides/` pattern:
containerised, single local human user, no auth, no database.

## Status

This is currently a **frontend-only scaffold** (plan step 5). There is no backend yet (step 6) and
no Docker wrapper yet (step 8) — see `doc/tmp/app-editing-chart/plan.md` for what's done and what's
next. Until the backend lands, the app shows a "could not load the graph" message instead of
silently failing; that's expected, not a bug.

## Running it now (dev mode, host Node ≥20 required)

```bash
cd tools/graph
npm install
npm run dev
```

Opens on `http://127.0.0.1:5173`. It will report it can't reach `/api/graph` until the file server
(step 6) exists and is running on `127.0.0.1:3001` — `vite.config.ts` already proxies `/api` there.

This host's system Node is 18, which is why `npm install`/`npm run dev` must be run with a Node
≥20 toolchain (nvm, a container, etc.) — `create-vite` and some transitive deps enforce that
`engines` requirement. Once step 8 lands, running it will not need a compatible local Node at all —
same as `tools/slides`, only Docker will be required on the host, via a wrapper script
(`tools/graph/graph edit <file>`).

## Other commands

```bash
npm run build     # type-check (tsc -b) + production build to dist/ (git-ignored)
npm run preview   # serve the dist/ build locally
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
- `src/App.tsx` — loads the graph from `GET /api/graph` (step 6) and holds selection state.

## Known gaps (see the plan log for details)

- The edit panel's `audience`/`held_by`/`skippable_by` fields are plain text inputs but the schema
  expects `"all" | string[]` — editing those specific fields doesn't validate correctly yet.
- No save/persist path yet — that's the file server, step 6.
- No `check` command yet (schema + closure-check validation) — step 7.
