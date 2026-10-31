import type { DiagramDocument, DiagramNode, NodeKind } from "./schema";
export const SIZE = { width: 184, height: 92 };
export function freePosition(
  nodes: DiagramNode[],
  origin: { x: number; y: number },
) {
  let p = { ...origin };
  for (let i = 0; i < 2500; i++) {
    if (
      !nodes.some(
        (n) =>
          Math.abs(n.position.x - p.x) < SIZE.width + 32 &&
          Math.abs(n.position.y - p.y) < SIZE.height + 32,
      )
    )
      return p;
    p = {
      x: origin.x + Math.floor((i + 1) / 12) * 240,
      y: origin.y + ((i + 1) % 12) * 140,
    };
  }
  return p;
}
export function addNode(
  d: DiagramDocument,
  kind: NodeKind,
  position: { x: number; y: number },
  source?: string,
) {
  const id = crypto.randomUUID();
  const n: DiagramNode = {
    id,
    type: "diagram",
    position: freePosition(d.nodes, position),
    data: { kind, label: "" },
  };
  return {
    id,
    document: {
      ...d,
      nodes: [...d.nodes, n],
      edges: source
        ? [
            ...d.edges,
            {
              id: crypto.randomUUID(),
              source,
              target: id,
              sourceHandle: "out" as const,
              targetHandle: "in" as const,
              data: { label: "" },
            },
          ]
        : d.edges,
    },
  };
}
export function removeObjects(d: DiagramDocument, ids: string[]) {
  const gone = new Set(ids);
  return {
    ...d,
    nodes: d.nodes.filter((n) => !gone.has(n.id)),
    edges: d.edges.filter(
      (e) => !gone.has(e.id) && !gone.has(e.source) && !gone.has(e.target),
    ),
  };
}
