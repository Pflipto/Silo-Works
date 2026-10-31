import type { DiagramDocument } from "./schema";
export type History = {
  past: DiagramDocument[];
  present: DiagramDocument;
  future: DiagramDocument[];
};
export function commit(h: History, next: DiagramDocument): History {
  if (JSON.stringify(h.present) === JSON.stringify(next)) return h;
  return { past: [...h.past.slice(-99), h.present], present: next, future: [] };
}
export function undo(h: History): History {
  const prev = h.past.at(-1);
  return prev
    ? {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future],
      }
    : h;
}
export function redo(h: History): History {
  const next = h.future[0];
  return next
    ? { past: [...h.past, h.present], present: next, future: h.future.slice(1) }
    : h;
}
