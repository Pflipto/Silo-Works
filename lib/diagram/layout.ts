import dagre from "@dagrejs/dagre";
import type { DiagramDocument } from "./schema";
import { SIZE } from "./actions";
export function tidy(d: DiagramDocument): DiagramDocument {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 64,
    ranksep: 100,
    marginx: 60,
    marginy: 60,
  });
  d.nodes.forEach((n) => g.setNode(n.id, { ...SIZE }));
  d.edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return {
    ...d,
    nodes: d.nodes.map((n) => ({
      ...n,
      position: {
        x: g.node(n.id).x - SIZE.width / 2,
        y: g.node(n.id).y - SIZE.height / 2,
      },
    })),
  };
}
