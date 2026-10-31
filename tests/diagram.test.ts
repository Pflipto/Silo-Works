import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyDocument, parseDocument } from "../lib/diagram/schema";
import {
  addNode,
  removeObjects,
  freePosition,
  SIZE,
} from "../lib/diagram/actions";
import { tidy } from "../lib/diagram/layout";
import { commit, undo, redo, type History } from "../lib/diagram/history";
function fixture() {
  let d = emptyDocument();
  const a = addNode(d, "process", { x: 0, y: 0 });
  d = a.document;
  const b = addNode(d, "decision", { x: 300, y: 0 }, a.id);
  d = b.document;
  const c = addNode(d, "system", { x: 600, y: 0 }, b.id);
  d = c.document;
  const e = addNode(d, "terminal", { x: 600, y: 180 }, b.id);
  d = e.document;
  d.nodes[0].data = {
    ...d.nodes[0].data,
    label: "Patient Registers",
    notes: "Keep me",
    referenceUrl: "https://example.com/",
  };
  d.edges[0].data = { label: "Yes", notes: "An edge note" };
  return d;
}
test("version 1 JSON round-trip preserves IDs, metadata, topology, and viewport", () => {
  const d = fixture();
  assert.deepEqual(parseDocument(JSON.parse(JSON.stringify(d))), d);
});
test("rejects incompatible, corrupt, duplicate, dangling, and unsafe documents", () => {
  const d = fixture();
  for (const invalid of [
    { ...d, schemaVersion: 2 },
    { ...d, nodes: [...d.nodes, d.nodes[0]] },
    { ...d, edges: [{ ...d.edges[0], target: "missing" }] },
    {
      ...d,
      nodes: [
        {
          ...d.nodes[0],
          data: { ...d.nodes[0].data, referenceUrl: "javascript:alert(1)" },
        },
      ],
    },
    { ...d, viewport: { x: 0, y: 0, zoom: Infinity } },
  ])
    assert.throws(() => parseDocument(invalid));
});
test("connected creation keeps existing objects and avoids nearby occupied positions", () => {
  const d = fixture();
  const source = d.nodes[0];
  const p = { x: source.position.x + 284, y: source.position.y };
  const next = addNode(d, "process", p, source.id);
  assert.equal(next.document.nodes.length, d.nodes.length + 1);
  assert.deepEqual(next.document.nodes.slice(0, -1), d.nodes);
  assert.equal(next.document.edges.at(-1)?.source, source.id);
  assert.equal(next.document.edges.at(-1)?.target, next.id);
  const n = next.document.nodes.at(-1)!;
  for (const other of d.nodes)
    assert.ok(
      Math.abs(other.position.x - n.position.x) >= SIZE.width + 32 ||
        Math.abs(other.position.y - n.position.y) >= SIZE.height + 32,
    );
  assert.deepEqual(freePosition([], p), p);
});
test("deletion removes incident connections; undo restores notes and edges", () => {
  const d = fixture();
  const h: History = { past: [], present: d, future: [] };
  const next = commit(h, removeObjects(d, [d.nodes[1].id]));
  assert.equal(next.present.edges.length, 0);
  assert.deepEqual(undo(next).present, d);
  assert.deepEqual(redo(undo(next)).present, next.present);
});
test("history restores edit/move/tidy snapshots and clears redo on a new edit", () => {
  const d = fixture();
  let h: History = { past: [], present: d, future: [] };
  const moved = {
    ...d,
    nodes: d.nodes.map((n, i) =>
      i
        ? n
        : {
            ...n,
            position: { x: -50, y: 300 },
            data: { ...n.data, notes: "Updated" },
          },
    ),
  };
  h = commit(h, moved);
  h = commit(h, tidy(moved));
  assert.deepEqual(undo(h).present, moved);
  assert.deepEqual(undo(undo(h)).present, d);
  assert.deepEqual(redo(undo(h)).present, h.present);
  assert.equal(commit(undo(h), d).future.length, 0);
});
test("layout is opt-in, nonmutating, and topology-preserving for chain/fork/disconnected/cycle", () => {
  for (const mode of ["chain", "fork", "disconnected", "cycle"]) {
    const d = fixture();
    if (mode === "chain") d.edges = d.edges.slice(0, 2);
    if (mode === "disconnected") d.edges = [];
    if (mode === "cycle")
      d.edges.push({
        id: "back",
        source: d.nodes[2].id,
        target: d.nodes[0].id,
        data: { label: "Retry" },
      });
    const before = JSON.stringify(d);
    const out = tidy(d);
    assert.equal(JSON.stringify(d), before);
    assert.deepEqual(out.edges, d.edges);
    assert.deepEqual(
      out.nodes.map((n) => ({ id: n.id, data: n.data })),
      d.nodes.map((n) => ({ id: n.id, data: n.data })),
    );
    for (const n of out.nodes) {
      assert.ok(Number.isFinite(n.position.x));
      assert.ok(Number.isFinite(n.position.y));
    }
    if (mode === "chain" || mode === "fork")
      assert.ok(out.nodes[1].position.x > out.nodes[0].position.x);
  }
});
