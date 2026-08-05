// Mirrors .claude/reference/knowledge_goals_graph.schema.json.
// The schema is the authority; if these drift apart, the schema wins and this file has a bug.

export type PersonaRef = string; // pattern ^P-[A-Z0-9]+$

export const PROVENANCE_TAGS = [
  "stated",
  "inferred",
  "inherited_inferred",
  "invented_framing",
  "risk",
] as const;
export type ProvenanceTag = (typeof PROVENANCE_TAGS)[number];

export const KNOWLEDGE_TYPES = ["declarative", "procedural", "contextual"] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

export const NODE_TYPES = ["Baseline", "Prerequisite", "DesiredResult"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const DEPTH_STAGES = ["shallow", "deep"] as const;
export type DepthStage = (typeof DEPTH_STAGES)[number];

/** "all" or a non-empty list of persona ids. */
export type Audience = "all" | PersonaRef[];

export interface DepthStaging {
  pass: number;
  depth: DepthStage;
  note?: string;
}

export interface PersonaVariant {
  persona: PersonaRef;
  variant: string;
}

export interface GraphNode {
  id: string; // <TYPE>-<MNEMONIC>
  type: NodeType;
  provenance_tags: ProvenanceTag[];
  key: string;
  description: string;
  knowledge_type: KnowledgeType;
  /** Required for DesiredResult and Prerequisite. */
  audience?: Audience;
  skippable_by?: PersonaRef[];
  persona_variant?: PersonaVariant[];
  /** Baseline only. */
  held_by?: PersonaRef[];
  /** Prerequisite only: true for a deliberate root. */
  root?: boolean;
  /** Required alongside root: true. */
  root_rationale?: string;
  depth_staging?: DepthStaging;
}

export interface GraphEdge {
  from: string; // Requires `to`
  to: string;
  reason: string;
}

export interface KnowledgeGoalsGraph {
  course_name: string;
  personas: PersonaRef[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}
