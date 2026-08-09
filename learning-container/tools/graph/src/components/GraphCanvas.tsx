import { Background, Controls, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import { layoutGraph } from "../lib/layout";
import type { KnowledgeGoalsGraph } from "../types/graph";
import { GraphNodeView, type AppNode, type GraphNodeData } from "./nodes/GraphNodeView";
import { RequiresEdge, type AppEdge, type RequiresEdgeData } from "./edges/RequiresEdge";

const nodeTypes = { graphNode: GraphNodeView };
const edgeTypes = { requires: RequiresEdge };

interface GraphCanvasProps {
  graph: KnowledgeGoalsGraph;
  onSelectNode: (nodeId: string | null) => void;
}

export function GraphCanvas({ graph, onSelectNode }: GraphCanvasProps) {
  const initial = useMemo(() => {
    const rfNodes: AppNode[] = graph.nodes.map((node) => ({
      id: node.id,
      type: "graphNode",
      position: { x: 0, y: 0 }, // overwritten by layoutGraph below
      data: { node } satisfies GraphNodeData,
    }));
    const rfEdges: AppEdge[] = graph.edges.map((edge) => ({
      id: `${edge.from}->${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: "requires",
      data: { reason: edge.reason } satisfies RequiresEdgeData,
    }));
    return { nodes: layoutGraph(rfNodes, rfEdges), edges: rfEdges };
  }, [graph]);

  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);

  // Re-run layout whenever the graph identity changes (e.g. after a reload/save).
  useEffect(() => {
    // Nothing to do here beyond what `initial` already recomputed; kept as a hook
    // so a future "re-layout" button has an obvious place to call layoutGraph again.
  }, [graph]);

  return (
    <div style={{ flex: 1, height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
