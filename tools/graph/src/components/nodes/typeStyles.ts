import type { NodeType } from "../../types/graph";

// Single place that maps node type -> colour, so the canvas nodes, legend, and any
// future export (e.g. a static SVG) stay in sync.
export const NODE_TYPE_STYLE: Record<NodeType, { background: string; border: string; label: string }> = {
  Baseline: { background: "#eef7ee", border: "#4caf50", label: "Baseline" },
  Prerequisite: { background: "#eaf2fb", border: "#2f6fb0", label: "Prerequisite" },
  DesiredResult: { background: "#fbeee0", border: "#c9781f", label: "Desired result" },
};
