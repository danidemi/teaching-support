// Deterministic pretty-printer matching the repo's existing JSON style (see e.g.
// tsconfig.json's "references" array, or the hand-authored design/knowledge_goals_graph.json):
//   - an array of primitives renders inline on one line: ["P-DEV", "P-OPS"]
//   - an array of objects renders as one object per line, and each object is compacted onto
//     a single line IF every one of its own values is a primitive or an array of primitives
//     (e.g. edges, persona_variant entries) — otherwise it's expanded (e.g. nodes, because they
//     nest arrays/objects that themselves need expanding, like depth_staging or persona_variant)
//   - a plain object property value (not an array element) is always expanded multi-line
//
// Plain `JSON.stringify(graph, null, 2)` does not produce this — it expands every array onto
// one element per line — which would turn every save into a full-file reformat diff. This
// module exists so a save from the app never introduces that non-semantic diff noise.

function isPrimitive(v) {
  return v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function isInlineableArray(v) {
  return Array.isArray(v) && v.every(isPrimitive);
}

// "Leaf-compatible": can appear inside a compacted one-line object, i.e. doesn't itself need
// multi-line expansion.
function isLeafCompatible(v) {
  return isPrimitive(v) || isInlineableArray(v);
}

// Compacting is only for small objects (edges: from/to/reason, persona_variant: persona/variant) —
// nodes have far more fields and stay expanded even though every one of their own fields is a
// leaf value, so field count is the deciding factor, not leaf-ness alone.
const MAX_COMPACT_KEYS = 3;

function isCompactableObject(v) {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.keys(v).length <= MAX_COMPACT_KEYS &&
    Object.values(v).every(isLeafCompatible)
  );
}

function formatInlineArray(arr) {
  return `[${arr.map((v) => JSON.stringify(v)).join(", ")}]`;
}

function formatCompactObject(obj) {
  const entries = Object.entries(obj).map(
    ([k, v]) => `"${k}": ${isInlineableArray(v) ? formatInlineArray(v) : JSON.stringify(v)}`,
  );
  return `{ ${entries.join(", ")} }`;
}

function indent(level) {
  return "  ".repeat(level);
}

function formatValue(value, level) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (isInlineableArray(value)) return formatInlineArray(value);
    const items = value.map((item) => {
      const rendered =
        isCompactableObject(item) ? formatCompactObject(item) : formatValue(item, level + 1);
      return `${indent(level + 1)}${rendered}`;
    });
    return `[\n${items.join(",\n")}\n${indent(level)}]`;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const lines = keys.map(
      (k) => `${indent(level + 1)}"${k}": ${formatValue(value[k], level + 1)}`,
    );
    return `{\n${lines.join(",\n")}\n${indent(level)}}`;
  }
  return JSON.stringify(value);
}

/** Pretty-print a graph object per the convention above, with a trailing newline. */
export function formatGraph(graph) {
  return `${formatValue(graph, 0)}\n`;
}
