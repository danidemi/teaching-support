import { useEffect, useState } from "react";
import { EditPanel } from "./components/EditPanel";
import { GraphCanvas } from "./components/GraphCanvas";
import type { GraphNode, KnowledgeGoalsGraph } from "./types/graph";

// The file server (tools/graph/server) exposes GET/PUT /api/graph, schema-validating on write.
export function App() {
  const [graph, setGraph] = useState<KnowledgeGoalsGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  async function handleSave(updated: GraphNode) {
    if (!graph) return;
    const next: KnowledgeGoalsGraph = {
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === updated.id ? updated : n)),
    };
    setSaveError(null);
    try {
      const res = await fetch("/api/graph", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? `PUT /api/graph -> ${res.status}`);
      }
      setGraph(next);
    } catch (err) {
      setSaveError(String(err));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {saveError && (
        <div style={{ background: "#fdecea", color: "#a02020", padding: "6px 12px", fontSize: 12 }}>
          Save failed: {saveError}
        </div>
      )}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <GraphCanvas graph={graph} onSelectNode={setSelectedId} />
        <EditPanel node={selectedNode} onSave={handleSave} onClose={() => setSelectedId(null)} />
      </div>
    </div>
  );
}
