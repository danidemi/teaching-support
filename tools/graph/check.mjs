#!/usr/bin/env node
// Standalone check for the DESIGN SSOT store (design/knowledge_goals_graph.json), mirroring
// tools/slides/slidelint.py's "the linter computes it, nobody hand-verifies" philosophy.
//
// Two checks, both mechanical:
//   1. Schema validation against .claude/reference/knowledge_goals_graph.schema.json.
//   2. Closure check, per .claude/agents/learning-curriculum-architect.md's "Closure check"
//      section: every node must have a path down to substrate, i.e. an outgoing Requires edge
//      (it appears as `from` on some edge, meaning it requires something) — unless it's a
//      Baseline (requires nothing, it's already held) or a Prerequisite marked root: true
//      (deliberately has no requirement). A node with no outgoing edge and no exemption is a
//      dead end the agent forgot to connect down toward a Baseline.
//      (The agent doc phrases this as "tabulate the edge list by target"; direction was
//      confirmed empirically by round-tripping the real, human-approved
//      design/knowledge_goals_graph.json — every DesiredResult/non-root-Prerequisite node
//      appears as `from` on some edge, and Baseline/root nodes never do.)
//
// Standalone from server/index.mjs on purpose (per the plan) — this runs headless, with no
// server needed, so it can be the basis of a Docker `check` subcommand (step 8) and can be run
// straight from CI or a pre-commit hook without starting anything on a port.
//
// Usage: node check.mjs <graph.json> [<graph.json> ...]
// Exit codes: 0 clean, 1 errors found, 2 a file couldn't be read/parsed.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Same gotcha as server/index.mjs: the schema declares draft 2020-12, which plain "ajv"
// doesn't understand — needs the dedicated 2020 build.
import Ajv2020 from "ajv/dist/2020.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const SCHEMA_PATH = path.join(REPO_ROOT, ".claude/reference/knowledge_goals_graph.schema.json");

async function loadValidator() {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf-8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function checkClosure(graph) {
  const errors = [];
  const sources = new Set(graph.edges.map((e) => e.from));
  for (const node of graph.nodes) {
    if (sources.has(node.id)) continue;
    if (node.type === "Baseline") continue;
    if (node.type === "Prerequisite" && node.root === true) continue;
    errors.push(
      `${node.id} (${node.type}) has no outgoing Requires edge and is not a Baseline or a ` +
        `root: true Prerequisite — it is a dead end, missing an edge down toward a Baseline`,
    );
  }
  return errors;
}

async function checkFile(filePath, validate) {
  let raw;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    console.error(`✗ ${filePath}: could not read file: ${err.message}`);
    return { errors: 1, fatal: true };
  }

  let graph;
  try {
    graph = JSON.parse(raw);
  } catch (err) {
    console.error(`✗ ${filePath}: not valid JSON: ${err.message}`);
    return { errors: 1, fatal: true };
  }

  console.log(`\n=== ${filePath} ===`);
  const problems = [];

  if (!validate(graph)) {
    for (const err of validate.errors) {
      const where = err.instancePath || "(root)";
      problems.push(`schema: ${where} ${err.message}`);
    }
  }

  // The closure check assumes nodes/edges are arrays — schema validation above already
  // guarantees that when it passes; skip it if the graph is too malformed to walk safely.
  if (Array.isArray(graph.nodes) && Array.isArray(graph.edges)) {
    problems.push(...checkClosure(graph).map((msg) => `closure: ${msg}`));
  }

  for (const line of problems) {
    console.log(`  ✗ ${line}`);
  }
  if (!problems.length) {
    console.log("  ✓ clean");
  }
  return { errors: problems.length, fatal: false };
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: check.mjs <graph.json> [<graph.json> ...]");
    return 2;
  }

  const validate = await loadValidator();
  let totalErrors = 0;
  for (const file of files) {
    const result = await checkFile(file, validate);
    if (result.fatal) return 2;
    totalErrors += result.errors;
  }

  console.log(`\n${totalErrors} error(s)`);
  return totalErrors ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`check.mjs: unexpected error: ${err.stack || err.message}`);
    process.exit(2);
  },
);
