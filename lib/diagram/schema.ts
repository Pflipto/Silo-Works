import { z } from "zod";
const text = z.string().max(20000);
export const kinds = ["process", "decision", "system", "terminal"] as const;
export type NodeKind = (typeof kinds)[number];
const url = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || (/^https?:\/\//i.test(v) && URL.canParse(v)),
    "Use an http:// or https:// URL",
  );
const details = {
  label: z.string().max(300),
  description: text.optional(),
  notes: text.optional(),
  referenceUrl: url.optional(),
};
export const documentSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    title: z.string().max(200),
    updatedAt: z.iso.datetime(),
    nodes: z
      .array(
        z.object({
          id: z.string().min(1),
          type: z.literal("diagram"),
          position: z.object({
            x: z.number().finite(),
            y: z.number().finite(),
          }),
          data: z.object({ ...details, kind: z.enum(kinds) }),
        }),
      )
      .max(2000),
    edges: z
      .array(
        z.object({
          id: z.string().min(1),
          source: z.string(),
          target: z.string(),
          sourceHandle: z.literal("out").optional(),
          targetHandle: z.literal("in").optional(),
          data: z.object(details).optional(),
        }),
      )
      .max(5000),
    viewport: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
        zoom: z.number().min(0.1).max(4),
      })
      .optional(),
  })
  .superRefine((d, c) => {
    const ids = new Set(d.nodes.map((n) => n.id));
    if (
      ids.size !== d.nodes.length ||
      new Set([...d.nodes, ...d.edges].map((e) => e.id)).size !==
        d.nodes.length + d.edges.length
    )
      c.addIssue({ code: "custom", message: "Duplicate object IDs" });
    for (const e of d.edges)
      if (!ids.has(e.source) || !ids.has(e.target))
        c.addIssue({
          code: "custom",
          message: "Connection references a missing shape",
        });
  });
export type DiagramDocument = z.infer<typeof documentSchema>;
export type DiagramNode = DiagramDocument["nodes"][number];
export type DiagramEdge = DiagramDocument["edges"][number];
export function emptyDocument(): DiagramDocument {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    title: "Untitled drawing",
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}
export function parseDocument(input: unknown): DiagramDocument {
  return documentSchema.parse(input);
}
export const STORAGE_KEY = "silo-works.document.v1";
