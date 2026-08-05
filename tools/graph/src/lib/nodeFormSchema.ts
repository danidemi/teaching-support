import { z } from "zod";
import { DEPTH_STAGES, KNOWLEDGE_TYPES, PROVENANCE_TAGS } from "../types/graph";

// Mirrors .claude/reference/knowledge_goals_graph.schema.json's `node` $def, so a bad
// value is caught in the form before it ever reaches a save/validate round-trip.

const personaRef = z
  .string()
  .regex(/^P-[A-Z0-9]+$/, "persona id must match P-[A-Z0-9]+");

const audienceSchema = z.union([
  z.literal("all"),
  z.array(personaRef).min(1, "audience list needs at least one persona"),
]);

const depthStagingSchema = z.object({
  pass: z.number().int().min(1),
  depth: z.enum(DEPTH_STAGES),
  note: z.string().optional(),
});

const personaVariantSchema = z.object({
  persona: personaRef,
  variant: z.string().min(1),
});

export const nodeFormSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["Baseline", "Prerequisite", "DesiredResult"]),
    provenance_tags: z.array(z.enum(PROVENANCE_TAGS)).min(1, "at least one provenance tag"),
    key: z.string().min(1),
    description: z.string().min(1),
    knowledge_type: z.enum(KNOWLEDGE_TYPES),
    audience: audienceSchema.optional(),
    skippable_by: z.array(personaRef).optional(),
    persona_variant: z.array(personaVariantSchema).optional(),
    held_by: z.array(personaRef).optional(),
    root: z.boolean().optional(),
    root_rationale: z.string().optional(),
    depth_staging: depthStagingSchema.optional(),
  })
  .superRefine((node, ctx) => {
    if ((node.type === "DesiredResult" || node.type === "Prerequisite") && !node.audience) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${node.type} requires audience`,
        path: ["audience"],
      });
    }
    if (node.type === "Baseline" && (!node.held_by || node.held_by.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Baseline requires held_by",
        path: ["held_by"],
      });
    }
    if (node.root && !node.root_rationale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "root: true requires root_rationale",
        path: ["root_rationale"],
      });
    }
    const prefix = { Baseline: "BSL-", Prerequisite: "PRQ-", DesiredResult: "DR-" }[node.type];
    if (!node.id.startsWith(prefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${node.type} id must start with ${prefix}`,
        path: ["id"],
      });
    }
  });

export type NodeFormValues = z.infer<typeof nodeFormSchema>;
