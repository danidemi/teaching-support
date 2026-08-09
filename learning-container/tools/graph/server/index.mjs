// Minimal local file server for the DESIGN SSOT store (design/knowledge_goals_graph.json).
// Localhost-only, no auth, no database — single local human user, same spirit as tools/slides/.
//
// Endpoints:
//   GET  /api/graph  -> current contents of the target graph file (default: design/knowledge_goals_graph.json)
//   PUT  /api/graph  -> body is a full graph object; validated against the JSON Schema and,
//                       if valid, written back (sorted, pretty-printed) to the same file.
//
// Plain Node + Express (no build step) so this can run directly under Node 20+ without
// going through Vite/TypeScript — see tools/graph/README.md for how it's started.
//
// Env overrides (used by the Docker wrapper, tools/graph/graph, for step 8's `edit <file>` —
// unset in the plain `npm run server` path, which keeps the original localhost-only defaults):
//   GRAPH_FILE          repo-relative path to the graph file to serve (default: the DESIGN store)
//   GRAPH_SERVER_HOST   bind address (default: 127.0.0.1). Docker binds 0.0.0.0 *inside* the
//                        container — `docker run -p 127.0.0.1:...` is what keeps it
//                        localhost-only from the host's point of view; see the wrapper script.
//   GRAPH_SERVER_PORT   bind port (default: 3001)

import express from "express";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// The schema declares "$schema": draft/2020-12 — the plain "ajv" export only understands
// up to draft-2019-09, so this needs the dedicated 2020 build.
import Ajv2020 from "ajv/dist/2020.js";
import { formatGraph } from "./formatGraph.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/index.mjs -> tools/graph -> tools -> repo root.
const REPO_ROOT = path.resolve(__dirname, "../../..");
const GRAPH_PATH = process.env.GRAPH_FILE
  ? path.resolve(REPO_ROOT, process.env.GRAPH_FILE)
  : path.join(REPO_ROOT, "design/knowledge_goals_graph.json");
const SCHEMA_PATH = path.join(REPO_ROOT, ".claude/reference/knowledge_goals_graph.schema.json");

const HOST = process.env.GRAPH_SERVER_HOST || "127.0.0.1";
const PORT = Number(process.env.GRAPH_SERVER_PORT) || 3001;

let cachedValidate = null;
async function getValidator() {
  if (cachedValidate) return cachedValidate;
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf-8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  cachedValidate = ajv.compile(schema);
  return cachedValidate;
}

// Same ordering convention the agent follows: nodes by id, edges by (from, to).
// Enforced here too so a save from the app can't silently drift from that convention.
function sortGraph(graph) {
  return {
    ...graph,
    nodes: [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...graph.edges].sort((a, b) =>
      a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from),
    ),
  };
}

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/api/graph", async (_req, res) => {
  try {
    const raw = await readFile(GRAPH_PATH, "utf-8");
    res.type("application/json").send(raw);
  } catch (err) {
    res.status(500).json({ error: `Could not read ${GRAPH_PATH}: ${err.message}` });
  }
});

app.put("/api/graph", async (req, res) => {
  try {
    const validate = await getValidator();
    const graph = sortGraph(req.body);
    if (!validate(graph)) {
      res.status(400).json({ error: "Graph failed schema validation", details: validate.errors });
      return;
    }
    await writeFile(GRAPH_PATH, formatGraph(graph), "utf-8");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: `Could not write ${GRAPH_PATH}: ${err.message}` });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Graph file server listening on http://${HOST}:${PORT}`);
  console.log(`Serving ${GRAPH_PATH}`);
});
