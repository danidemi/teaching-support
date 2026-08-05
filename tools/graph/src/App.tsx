import { useEffect, useState } from "react";
import { EditPanel } from "./components/EditPanel";
import { GraphCanvas } from "./components/GraphCanvas";
import type { GraphNode, KnowledgeGoalsGraph } from "./types/graph";

// The file server (tools/graph/server, step 6) exposes GET/PUT /api/graph.
// Until that lands, this shows a clear "not connected" state instead of failing silently.
export function App() {
  const [graph, setGraph] = useState<KnowledgeGoalsGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((res) => {
        if (!res.ok) throw new Error(`GET /api/graph -> ${res.status}`);
        return res.json();
      })
      .then(setGraph)
      .catch((err) => setError(String(err)));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p>Could not load the graph: {error}</p>
        <p style={{ color: "#888" }}>Is the local file server running (tools/graph/server)?</p>
      </div>
    );
  }

  if (!graph) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  const selectedNode: GraphNode | null =
    graph.nodes.find((n) => n.id === selectedId) ?? null;

  function handleSave(updated: GraphNode) {
    setGraph((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === updated.id ? updated : n)),
      };
    });
    // Persisting to disk (PUT /api/graph, with schema validation) is step 6.
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <GraphCanvas graph={graph} onSelectNode={setSelectedId} />
      <EditPanel node={selectedNode} onSave={handleSave} onClose={() => setSelectedId(null)} />
    </div>
  );
}
