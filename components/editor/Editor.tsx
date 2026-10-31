"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  MousePointer2,
  Hand,
  Square,
  Diamond,
  Database,
  Circle,
  Undo2,
  Redo2,
  WandSparkles,
  Download,
  ChevronDown,
  Plus,
  Minus,
  Maximize,
  Upload,
  FilePlus2,
  ArrowUpRight,
  X,
  HelpCircle,
  ArrowRight,
  Check,
  AlertCircle,
  Cable,
  Sprout,
} from "lucide-react";
import NodeShape, { NodeActions } from "./NodeShape";
import DetailsPanel from "./DetailsPanel";
import Modal from "./Modal";
import {
  emptyDocument,
  parseDocument,
  STORAGE_KEY,
  type DiagramDocument,
  type NodeKind,
} from "@/lib/diagram/schema";
import { commit, undo, redo, type History } from "@/lib/diagram/history";
import { addNode, removeObjects, SIZE } from "@/lib/diagram/actions";
import { tidy } from "@/lib/diagram/layout";
import { downloadJson, exportImage } from "@/lib/diagram/export";
const nodeTypes = { diagram: NodeShape };
type Tool = "select" | "pan" | "connect" | NodeKind;
type Selection = { nodes: string[]; edges: string[] };
const tools = [
  { id: "select", label: "Select", key: "V", icon: MousePointer2 },
  { id: "pan", label: "Pan", key: "H", icon: Hand },
  { id: "process", label: "Process", key: "P", icon: Square },
  { id: "decision", label: "Decision", key: "D", icon: Diamond },
  { id: "system", label: "System", key: "S", icon: Database },
  { id: "terminal", label: "Start / End", key: "T", icon: Circle },
  { id: "connect", label: "Connect", key: "C", icon: Cable },
] as const;
export default function Editor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
function EditorInner() {
  const [history, setHistory] = useState<History | null>(null);
  const historyRef = useRef<History | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const blockedRef = useRef(false);
  const [status, setStatus] = useState("Loading drawing…");
  const [message, setMessage] = useState("");
  const [tool, setTool] = useState<Tool>("select");
  const [space, setSpace] = useState(false);
  const [selection, setSelection] = useState<Selection>({
    nodes: [],
    edges: [],
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [menu, setMenu] = useState(false);
  const [about, setAbout] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [replacement, setReplacement] = useState<DiagramDocument | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();
  const doc = history?.present;
  const publish = useCallback((h: History) => {
    historyRef.current = h;
    setHistory(h);
  }, []);
  const change = useCallback(
    (fn: (d: DiagramDocument) => DiagramDocument, remember = true) => {
      const h = historyRef.current;
      if (!h) return;
      const result = fn(h.present);
      if (JSON.stringify(result) === JSON.stringify(h.present)) return;
      const next = { ...result, updatedAt: new Date().toISOString() };
      publish(remember ? commit(h, next) : { ...h, present: next });
    },
    [publish],
  );
  useEffect(() => {
    let d: DiagramDocument;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      d = saved ? parseDocument(JSON.parse(saved)) : emptyDocument();
    } catch {
      // Hydration reads browser-only storage after the server render.
      d = emptyDocument();
      blockedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageBlocked(true);
      setMessage(
        "Your saved drawing could not be read. It has been preserved. Import a JSON backup or start a new drawing to resume saving.",
      );
    }
    publish({ past: [], present: d, future: [] });
    setZoom(d.viewport?.zoom || 1);
  }, [publish]);
  useEffect(() => {
    if (!doc || storageBlocked) return;
    // The status mirrors the external, debounced localStorage write.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("Saving…");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
        setStatus("Saved locally");
      } catch {
        setStatus("Could not save");
        setMessage(
          "Browser storage is unavailable or full. Download editable JSON to keep your work.",
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [doc, storageBlocked]);
  useEffect(() => {
    const save = () => {
      const h = historyRef.current;
      if (h && !blockedRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(h.present));
        } catch {
          /* The visible autosave error is handled by the debounced writer. */
        }
      }
    };
    const warn = (e: BeforeUnloadEvent) => {
      (document.activeElement as HTMLElement | null)?.blur();
      save();
      try {
        if (
          historyRef.current &&
          JSON.stringify(historyRef.current.present) !==
            localStorage.getItem(STORAGE_KEY)
        ) {
          e.preventDefault();
        }
      } catch {
        e.preventDefault();
      }
    };
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", warn);
    };
  }, []);
  const clearSelection = useCallback(() => {
    setSelection({ nodes: [], edges: [] });
    setEditing(null);
  }, []);
  const travel = useCallback(
    (direction: "undo" | "redo") => {
      const h = historyRef.current;
      if (h) {
        publish(direction === "undo" ? undo(h) : redo(h));
        setPositions({});
        clearSelection();
      }
    },
    [publish, clearSelection],
  );
  const remove = useCallback(() => {
    change((d) => removeObjects(d, [...selection.nodes, ...selection.edges]));
    clearSelection();
  }, [change, selection, clearSelection]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'input,textarea,select,[contenteditable="true"]',
        )
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        travel(e.shiftKey ? "redo" : "undo");
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        travel("redo");
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        e.key === "Enter" &&
        (e.target as HTMLElement).classList.contains("react-flow__node")
      ) {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) {
          e.preventDefault();
          setEditing(id);
        }
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setSpace(true);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      }
      if (e.key === "Escape") {
        setTool("select");
        clearSelection();
        setMenu(false);
        setAbout(false);
        setReplacement(null);
      }
      const found = tools.find(
        (t) => t.key.toLowerCase() === e.key.toLowerCase(),
      );
      if (found) {
        setTool(found.id);
        if (found.id === "connect") clearSelection();
      }
      if (e.key === "?") setAbout((v) => !v);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    const blur = () => setSpace(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [travel, remove, clearSelection]);
  const create = useCallback(
    (kind: NodeKind, position: { x: number; y: number }, source?: string) => {
      let created = "";
      let placed = position;
      change((d) => {
        const result = addNode(d, kind, position, source);
        created = result.id;
        placed = result.document.nodes.at(-1)!.position;
        return result.document;
      });
      if (created) {
        setSelection({ nodes: [created], edges: [] });
        setEditing(null);
        setTool("select");
        requestAnimationFrame(() => {
          void rf
            .setCenter(placed.x + 92, placed.y + 46, {
              zoom: rf.getZoom(),
              duration: 0,
            })
            .then(() => setEditing(created));
        });
      }
    },
    [change, rf],
  );
  const connect = useCallback(
    (connection: Connection) => {
      change((d) => {
        if (
          !connection.source ||
          !connection.target ||
          connection.source === connection.target ||
          d.edges.some(
            (e) =>
              e.source === connection.source && e.target === connection.target,
          )
        )
          return d;
        return {
          ...d,
          edges: [
            ...d.edges,
            {
              id: crypto.randomUUID(),
              source: connection.source,
              target: connection.target,
              sourceHandle: "out" as const,
              targetHandle: "in" as const,
              data: { label: "" },
            },
          ],
        };
      });
    },
    [change],
  );
  const nodeChanges = useCallback(
    (changes: NodeChange[]) => {
      for (const c of changes) {
        if (c.type === "position" && c.position) {
          if (c.dragging === false) {
            change((d) => ({
              ...d,
              nodes: d.nodes.map((n) =>
                n.id === c.id ? { ...n, position: c.position! } : n,
              ),
            }));
            setPositions((p) => {
              const next = { ...p };
              delete next[c.id];
              return next;
            });
          } else setPositions((p) => ({ ...p, [c.id]: c.position! }));
        }
        if (c.type === "select")
          setSelection((prev) => ({
            ...prev,
            nodes: c.selected
              ? [...new Set([...prev.nodes, c.id])]
              : prev.nodes.filter((id) => id !== c.id),
          }));
      }
    },
    [change],
  );
  const selectedNode = doc?.nodes.find((n) => selection.nodes.includes(n.id));
  const selectedEdge = !selectedNode
    ? doc?.edges.find((e) => selection.edges.includes(e.id))
    : undefined;
  const nodes: Node[] =
    doc?.nodes.map((n) => ({
      ...n,
      width: SIZE.width,
      height: SIZE.height,
      // Keep measurements during controlled updates, so inputs never hide and lose focus.
      measured: { ...SIZE },
      position: positions[n.id] || n.position,
      selected: selection.nodes.includes(n.id),
      ariaLabel: `${n.data.kind}: ${n.data.label || "Untitled shape"}`,
    })) || [];
  const edges: Edge[] =
    doc?.edges.map((e) => ({
      ...e,
      type: "smoothstep",
      label: e.data?.label,
      ariaLabel: `${e.data?.label || "Connection"} from ${doc?.nodes.find((n) => n.id === e.source)?.data.label || "untitled shape"} to ${doc?.nodes.find((n) => n.id === e.target)?.data.label || "untitled shape"}`,
      selected: selection.edges.includes(e.id),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: "#263E4A",
      },
      style: { stroke: "#263E4A", strokeWidth: 1.7 },
      labelStyle: { fill: "#263E4A", fontSize: 12, fontWeight: 600 },
      labelBgStyle: { fill: "#F6F0E4" },
      labelBgPadding: [7, 4],
    })) || [];
  const updateDetails = (data: Record<string, unknown>) => {
    const existing = (selectedNode?.data || selectedEdge?.data || {}) as Record<
      string,
      unknown
    >;
    const patch = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) => (existing[key] ?? "") !== value,
      ),
    );
    if (!Object.keys(patch).length) return;
    change((d) => ({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === selectedNode?.id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
      edges: d.edges.map((e) =>
        e.id === selectedEdge?.id
          ? { ...e, data: { label: "", ...e.data, ...patch } }
          : e,
      ),
    }));
  };
  const replaceDocument = (next: DiagramDocument) => {
    change(() => next);
    blockedRef.current = false;
    setStorageBlocked(false);
    setReplacement(null);
    setPositions({});
    clearSelection();
    void rf.setViewport(next.viewport || { x: 0, y: 0, zoom: 1 });
    setMessage("");
  };
  const requestReplace = (next: DiagramDocument) => {
    if (
      doc?.nodes.length ||
      (doc && doc.title !== "Untitled drawing") ||
      storageBlocked
    )
      setReplacement(next);
    else replaceDocument(next);
  };
  const image = async (format: "png" | "svg") => {
    if (!doc) return;
    setMenu(false);
    setExporting(true);
    setEditing(null);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const root = canvasRef.current?.querySelector<HTMLElement>(
        ".react-flow__viewport",
      );
      if (!root) throw new Error("Canvas is not available yet.");
      await exportImage(format, doc, root, rf.getNodesBounds(rf.getNodes()));
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Export failed. Try editable JSON instead.",
      );
    } finally {
      setExporting(false);
    }
  };
  const onViewport = (_e: MouseEvent | TouchEvent | null, v: Viewport) => {
    setZoom(v.zoom);
    change((d) => ({ ...d, viewport: v }), false);
  };
  return (
    <main className={`editor ${exporting ? "is-exporting" : ""}`}>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setAbout(true)}
          aria-label="About Silo Works"
        >
          <SiloMark />
          <span>
            SILO WORKS<small>PRAIRIE SYSTEMS & ENGINEERING</small>
          </span>
        </button>
        <div className="document-heading">
          <span className="eyebrow drawing-number">FIELD DRAWING / 002</span>
          <input
            key={`${doc?.id}-${doc?.title}`}
            className="drawing-title"
            aria-label="Drawing title"
            defaultValue={doc?.title || "Untitled drawing"}
            maxLength={200}
            onBlur={(e) =>
              change((d) => ({
                ...d,
                title: e.target.value.trim() || "Untitled drawing",
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            disabled={!doc}
          />
        </div>
        <div
          className={`save-status ${storageBlocked || status === "Could not save" ? "error" : ""}`}
          role="status"
          title="Stored only in this browser and device. Download JSON for a backup."
        >
          {storageBlocked || status === "Could not save" ? (
            <AlertCircle size={13} />
          ) : (
            <Check size={13} />
          )}
          <span>{storageBlocked ? "Saving paused" : status}</span>
        </div>
        <div className="header-actions">
          <div className="history-buttons">
            <button
              className="icon-button"
              aria-label="Undo"
              title="Undo · Ctrl/⌘ Z"
              disabled={!history?.past.length}
              onClick={() => travel("undo")}
            >
              <Undo2 size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Redo"
              title="Redo · Ctrl/⌘ Shift Z"
              disabled={!history?.future.length}
              onClick={() => travel("redo")}
            >
              <Redo2 size={18} />
            </button>
          </div>
          <button
            className="tidy-button"
            disabled={!doc?.nodes.length}
            onClick={() => {
              change(tidy);
              setPositions({});
              setTimeout(() => rf.fitView({ padding: 0.2, duration: 0 }), 40);
            }}
          >
            <WandSparkles size={15} />
            <span>Tidy Up</span>
          </button>
          <div className="export-container">
            <button
              className="export-button"
              aria-expanded={menu}
              aria-controls="export-options"
              disabled={!doc || exporting}
              onClick={() => setMenu((v) => !v)}
            >
              <Download size={15} />
              {exporting ? "Exporting…" : "Export"}
              <ChevronDown size={13} />
            </button>
            {menu && (
              <>
                <button
                  className="menu-dismiss"
                  tabIndex={-1}
                  aria-label="Close export menu"
                  onClick={() => setMenu(false)}
                />
                <div className="export-menu" id="export-options">
                  <span className="eyebrow">TAKE YOUR WORK WITH YOU</span>
                  <button onClick={() => void image("png")}>
                    <Download size={15} />
                    PNG image<span>.png</span>
                  </button>
                  <button onClick={() => void image("svg")}>
                    <Download size={15} />
                    SVG image<span>.svg</span>
                  </button>
                  <button
                    onClick={() => {
                      if (doc) downloadJson(doc);
                      setMenu(false);
                    }}
                  >
                    <Download size={15} />
                    Editable drawing<span>.json</span>
                  </button>
                  <hr />
                  <button
                    onClick={() => {
                      fileRef.current?.click();
                      setMenu(false);
                    }}
                  >
                    <Upload size={15} />
                    Import drawing
                  </button>
                  <button
                    onClick={() => {
                      requestReplace(emptyDocument());
                      setMenu(false);
                    }}
                  >
                    <FilePlus2 size={15} />
                    New drawing
                  </button>
                  <p>
                    Private by design. No uploads.
                    <br />
                    JSON is your editable backup.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <input
        hidden
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        aria-label="Import drawing file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            if (file.size > 10_000_000)
              throw new Error("File is larger than 10 MB.");
            requestReplace(parseDocument(JSON.parse(await file.text())));
          } catch {
            setMessage(
              "This file is not a valid Silo Works v1 drawing. Your current drawing has not been changed.",
            );
          }
        }}
      />
      {message && (
        <div className="message-banner" role="alert">
          <AlertCircle size={17} />
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}
      <div className="workspace">
        <nav className="toolbar" aria-label="Drawing tools">
          {tools.map((t, i) => (
            <div
              key={t.id}
              className={i === 2 || i === 6 ? "tool-divider" : ""}
            >
              <button
                className={`tool-button ${tool === t.id ? "active" : ""}`}
                aria-label={`${t.label} tool`}
                aria-pressed={tool === t.id}
                title={`${t.label} · ${t.key}`}
                onClick={() => {
                  setTool(t.id);
                  setEditing(null);
                  if (t.id === "connect") clearSelection();
                }}
              >
                <t.icon size={19} />
                <span className="tool-tooltip">
                  {t.label}
                  <kbd>{t.key}</kbd>
                </span>
              </button>
            </div>
          ))}
          <span className="toolbar-caption">TOOLS</span>
        </nav>
        <div className={`canvas tool-${tool}`} ref={canvasRef}>
          {doc && (
            <NodeActions.Provider
              value={{
                editing,
                edit: setEditing,
                label: (id, value) =>
                  change((d) => ({
                    ...d,
                    nodes: d.nodes.map((n) =>
                      n.id === id
                        ? { ...n, data: { ...n.data, label: value } }
                        : n,
                    ),
                  })),
                grow: (id) => {
                  const source = historyRef.current?.present.nodes.find(
                    (n) => n.id === id,
                  );
                  if (source)
                    create(
                      "process",
                      { x: source.position.x + 284, y: source.position.y },
                      id,
                    );
                },
              }}
            >
              <ReactFlow
                key={doc.id}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={nodeChanges}
                onEdgesChange={(changes) => {
                  for (const c of changes)
                    if (c.type === "select")
                      setSelection((prev) => ({
                        ...prev,
                        edges: c.selected
                          ? [...new Set([...prev.edges, c.id])]
                          : prev.edges.filter((id) => id !== c.id),
                      }));
                }}
                onConnect={connect}
                defaultViewport={doc.viewport}
                minZoom={0.1}
                maxZoom={4}
                zoomOnDoubleClick={false}
                deleteKeyCode={null}
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Shift"
                panOnDrag={tool === "pan" || space ? [0, 1, 2] : [1, 2]}
                nodesDraggable={tool === "select" && !space}
                nodesConnectable={tool === "select" || tool === "connect"}
                elementsSelectable={tool === "select" || tool === "connect"}
                selectionOnDrag={false}
                onNodeDragStop={() => {
                  const current = rf.getNodes();
                  change((d) => ({
                    ...d,
                    nodes: d.nodes.map((n) => ({
                      ...n,
                      position:
                        current.find((c) => c.id === n.id)?.position ||
                        n.position,
                    })),
                  }));
                  setPositions({});
                }}
                onNodeClick={(_e, n) => {
                  if (tool === "connect") {
                    const source = selection.nodes[0];
                    if (source && source !== n.id) {
                      connect({
                        source,
                        target: n.id,
                        sourceHandle: "out",
                        targetHandle: "in",
                      });
                      setTool("select");
                    } else if (!_e.shiftKey)
                      setSelection({ nodes: [n.id], edges: [] });
                  } else if (!_e.shiftKey)
                    setSelection({ nodes: [n.id], edges: [] });
                }}
                onNodeDoubleClick={(_e, n) => setEditing(n.id)}
                onEdgeClick={(_e, e) =>
                  setSelection({ nodes: [], edges: [e.id] })
                }
                onEdgeDoubleClick={(_e, e) => {
                  setSelection({ nodes: [], edges: [e.id] });
                  setTimeout(
                    () =>
                      canvasRef.current?.parentElement
                        ?.querySelector<HTMLInputElement>("[data-detail-label]")
                        ?.focus(),
                    50,
                  );
                }}
                onPaneClick={(e) => {
                  if (
                    ["process", "decision", "system", "terminal"].includes(tool)
                  ) {
                    create(
                      tool as NodeKind,
                      rf.screenToFlowPosition({
                        x: e.clientX - 92,
                        y: e.clientY - 46,
                      }),
                    );
                  } else clearSelection();
                  setMenu(false);
                }}
                onMoveEnd={onViewport}
                connectionLineStyle={{ stroke: "#A65B3D", strokeWidth: 2 }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1}
                  color="#b7ac9870"
                />
              </ReactFlow>
            </NodeActions.Provider>
          )}
          {!doc && (
            <div className="empty-state">
              <p>Opening your drawing…</p>
            </div>
          )}
          {doc && !doc.nodes.length && (
            <div className="empty-state">
              <div className="empty-drawing" aria-hidden="true">
                <span />
                <ArrowRight size={27} />
                <span className="diamond" />
                <ArrowRight size={27} />
                <span className="round" />
              </div>
              <span className="eyebrow">A LITTLE CLARITY STARTS HERE</span>
              <h1>
                Might as well
                <br />
                <em>draw it out.</em>
              </h1>
              <p>
                Pick a shape. Sketch a process.
                <br />
                Make a complicated thing a little clearer.
              </p>
              <button
                onClick={() => {
                  const bounds = canvasRef.current?.getBoundingClientRect();
                  if (bounds)
                    create(
                      "process",
                      rf.screenToFlowPosition({
                        x: bounds.x + bounds.width / 2 - 92,
                        y: bounds.y + bounds.height / 2 - 46,
                      }),
                    );
                }}
              >
                <Plus size={16} />
                Add your first shape
              </button>
              <small>
                Or choose a shape from the toolbar and click anywhere.
              </small>
            </div>
          )}
          <div className="canvas-caption">
            <span className="crosshair">+</span>{" "}
            {tool === "select"
              ? "SELECT & SKETCH"
              : tool === "pan"
                ? "PAN THE DRAWING"
                : tool === "connect"
                  ? "SELECT SOURCE, THEN DESTINATION"
                  : `CLICK TO PLACE ${tool === "terminal" ? "START / END" : tool.toUpperCase()}`}
          </div>
          <div className="zoom-controls">
            <button aria-label="Zoom out" onClick={() => void rf.zoomOut()}>
              <Minus size={15} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button aria-label="Zoom in" onClick={() => void rf.zoomIn()}>
              <Plus size={15} />
            </button>
            <span className="zoom-divider" />
            <button
              aria-label="Fit drawing"
              title="Fit drawing"
              onClick={() => void rf.fitView({ padding: 0.2 })}
            >
              <Maximize size={15} />
            </button>
          </div>
        </div>
        {(selectedNode || selectedEdge) && (
          <DetailsPanel
            key={selectedNode?.id || selectedEdge?.id}
            node={selectedNode}
            edge={selectedEdge}
            update={updateDetails}
            close={clearSelection}
            remove={remove}
          />
        )}
      </div>
      <footer className="statusbar">
        <div>
          <span className="status-dot" />
          <span>
            {doc?.nodes.length || 0} shapes
            <span className="footer-separator">/</span>
            {doc?.edges.length || 0} connections
          </span>
          <span className="local-note">
            LOCAL ONLY · YOUR BROWSER, YOUR DRAWING
          </span>
        </div>
        <button className="help-button" onClick={() => setAbout(true)}>
          <HelpCircle size={13} />
          Shortcuts & a note from the farm
        </button>
        <a
          href="https://shelterbelt.xyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          A SHELTERBELT PROJECT
          <ArrowUpRight size={12} />
        </a>
      </footer>
      {about && (
        <Modal labelledBy="about-title" onClose={() => setAbout(false)}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              autoFocus
              className="icon-button modal-close"
              aria-label="Close help"
              onClick={() => setAbout(false)}
            >
              <X size={18} />
            </button>
            <Sprout size={26} />
            <span className="eyebrow">SHELTERBELT / EXPERIMENT 002</span>
            <h2 id="about-title">A note from the farm.</h2>
            <p>
              Inspired by Grandpa Roger, who could explain just about anything
              with a pen and a napkin at the kitchen table.
            </p>
            <p>
              Silo Works is our attempt to make that napkin a little more
              useful.
            </p>
            <div className="shortcuts">
              <span>Undo / Redo</span>
              <kbd>⌘/Ctrl Z / Shift Z</kbd>
              <span>Pan the canvas</span>
              <kbd>Space + drag</kbd>
              <span>Delete selected</span>
              <kbd>Delete</kbd>
              <span>Edit a label</span>
              <kbd>Double-click</kbd>
              <span>Tools</span>
              <kbd>V H P D S T C</kbd>
            </div>
            <p className="privacy-note">
              Drawings stay in this browser on this device. Export JSON to keep
              an editable backup. No accounts, uploads, or tracking.
            </p>
            <small>Made with care on the digital prairie.</small>
          </section>
        </Modal>
      )}
      {replacement && (
        <Modal labelledBy="replace-title" onClose={() => setReplacement(null)}>
          <section className="modal">
            <h2 id="replace-title">Replace this drawing?</h2>
            <p>
              {storageBlocked
                ? "Unreadable saved data will be replaced."
                : "Your current drawing will be replaced in this browser."}{" "}
              Download a JSON backup first if you want to keep it.
            </p>
            <div className="modal-actions">
              <button autoFocus onClick={() => setReplacement(null)}>
                Cancel
              </button>
              <button onClick={() => doc && downloadJson(doc)}>
                Download current JSON
              </button>
              <button
                className="primary"
                onClick={() => replaceDocument(replacement)}
              >
                Replace drawing
              </button>
            </div>
          </section>
        </Modal>
      )}
    </main>
  );
}
function SiloMark() {
  return (
    <svg
      className="silo-mark"
      viewBox="0 0 42 52"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 49h33M10 48V19L23 8l13 11v29M9 19h28M13 24h20M13 30h20M13 36h20M13 42h20M18 48V20M28 48V20M21 9V3h4v6M6 48V23M3 23h6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M10 19L23 12l13 7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
