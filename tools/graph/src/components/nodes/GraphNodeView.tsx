import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { GraphNode } from "../../types/graph";
import { NODE_TYPE_STYLE } from "./typeStyles";

export type GraphNodeData = {
  node: GraphNode;
  [key: string]: unknown;
};

export type AppNode = Node<GraphNodeData, "graphNode">;

/** One component handles all three node types — colour/label come from NODE_TYPE_STYLE. */
export function GraphNodeView({ data }: NodeProps<AppNode>) {
  const { node } = data;
  const style = NODE_TYPE_STYLE[node.type];

  return (
    <div
      style={{
        background: style.background,
        border: `2px solid ${style.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        width: 220,
        fontSize: 12,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 600, color: style.border, fontSize: 10, textTransform: "uppercase" }}>
        {style.label}
        {node.root && " · root"}
      </div>
      <div style={{ fontWeight: 600, margin: "2px 0" }}>{node.key}</div>
      <div style={{ color: "#555", fontFamily: "monospace", fontSize: 10 }}>{node.id}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
