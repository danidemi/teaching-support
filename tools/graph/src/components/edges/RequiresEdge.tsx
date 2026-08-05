import { BaseEdge, EdgeLabelRenderer, getStraightPath, type Edge, type EdgeProps } from "@xyflow/react";

export type RequiresEdgeData = {
  reason: string;
  [key: string]: unknown;
};

export type AppEdge = Edge<RequiresEdgeData, "requires">;

/** <from> Requires <to> — rendered with the `reason` as a small label at the midpoint. */
export function RequiresEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<AppEdge>) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const reason = data?.reason;

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      {reason && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              padding: "1px 4px",
              fontSize: 10,
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              pointerEvents: "all",
            }}
            title={reason}
          >
            {reason}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
