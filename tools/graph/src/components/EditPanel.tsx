import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DEPTH_STAGES, KNOWLEDGE_TYPES, PROVENANCE_TAGS, type GraphNode } from "../types/graph";
import { nodeFormSchema, type NodeFormValues } from "../lib/nodeFormSchema";

interface EditPanelProps {
  node: GraphNode | null;
  onSave: (node: GraphNode) => void;
  onClose: () => void;
}

/** Side panel: one form per selected node. Invalid values are flagged inline, before save. */
export function EditPanel({ node, onSave, onClose }: EditPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NodeFormValues>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: node ?? undefined,
  });

  useEffect(() => {
    if (node) reset(node);
  }, [node, reset]);

  if (!node) {
    return (
      <aside style={{ width: 320, padding: 16, borderLeft: "1px solid #ddd" }}>
        <p style={{ color: "#888" }}>Select a node to edit it.</p>
      </aside>
    );
  }

  return (
    <aside style={{ width: 320, padding: 16, borderLeft: "1px solid #ddd", overflowY: "auto" }}>
      <form
        onSubmit={handleSubmit((values) => onSave(values as GraphNode))}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <div>
          <label>id</label>
          <input {...register("id")} readOnly style={{ width: "100%" }} />
        </div>

        <div>
          <label>type</label>
          <input value={node.type} readOnly style={{ width: "100%" }} />
        </div>

        <div>
          <label>key</label>
          <input {...register("key")} style={{ width: "100%" }} />
          {errors.key && <span style={{ color: "crimson" }}>{errors.key.message}</span>}
        </div>

        <div>
          <label>description</label>
          <textarea {...register("description")} rows={4} style={{ width: "100%" }} />
          {errors.description && <span style={{ color: "crimson" }}>{errors.description.message}</span>}
        </div>

        <div>
          <label>knowledge_type</label>
          <select {...register("knowledge_type")} style={{ width: "100%" }}>
            {KNOWLEDGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>provenance_tags</label>
          <div>
            {PROVENANCE_TAGS.map((tag) => (
              <label key={tag} style={{ display: "block", fontSize: 12 }}>
                <input type="checkbox" value={tag} {...register("provenance_tags")} /> {tag}
              </label>
            ))}
          </div>
          {errors.provenance_tags && (
            <span style={{ color: "crimson" }}>{errors.provenance_tags.message as string}</span>
          )}
        </div>

        {(node.type === "DesiredResult" || node.type === "Prerequisite") && (
          <div>
            <label>audience (comma-separated persona ids, or "all")</label>
            <input {...register("audience" as never)} style={{ width: "100%" }} />
            {errors.audience && <span style={{ color: "crimson" }}>{String(errors.audience.message)}</span>}
          </div>
        )}

        {node.type === "Baseline" && (
          <div>
            <label>held_by (comma-separated persona ids)</label>
            <input {...register("held_by" as never)} style={{ width: "100%" }} />
            {errors.held_by && <span style={{ color: "crimson" }}>{String(errors.held_by.message)}</span>}
          </div>
        )}

        {node.type === "Prerequisite" && (
          <>
            <div>
              <label>
                <input type="checkbox" {...register("root")} /> root (deliberate, no incoming edge)
              </label>
            </div>
            <div>
              <label>root_rationale</label>
              <input {...register("root_rationale")} style={{ width: "100%" }} />
              {errors.root_rationale && (
                <span style={{ color: "crimson" }}>{errors.root_rationale.message}</span>
              )}
            </div>
          </>
        )}

        <div>
          <label>depth_staging.pass</label>
          <input type="number" {...register("depth_staging.pass", { valueAsNumber: true })} style={{ width: "100%" }} />
        </div>
        <div>
          <label>depth_staging.depth</label>
          <select {...register("depth_staging.depth")} style={{ width: "100%" }}>
            <option value="">(none)</option>
            {DEPTH_STAGES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </form>
    </aside>
  );
}
