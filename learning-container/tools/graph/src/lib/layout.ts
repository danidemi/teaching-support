import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

// Canvas positions are never part of the SSOT (they'd pollute diffs with non-semantic
// changes, see the plan's decision log) — so every load re-runs Dagre from scratch
// instead of reading/writing a layout file.

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

export function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // rankdir TB: edges point from `from` (a node that Requires) to `to` (the prerequisite),
  // so "to" should render above "from" — Dagre lays out along edge direction, so we feed
  // edges reversed (to -> from) to get prerequisites on top and desired results at the bottom.
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.target, edge.source);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return {
      ...node,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    };
  });
}
