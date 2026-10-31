"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Plus, StickyNote } from "lucide-react";
import type { DiagramNode } from "@/lib/diagram/schema";
export const NodeActions = createContext<{
  editing: string | null;
  edit: (id: string | null) => void;
  label: (id: string, value: string) => void;
  grow: (id: string) => void;
}>({ editing: null, edit: () => {}, label: () => {}, grow: () => {} });
export default function NodeShape({
  id,
  data,
  selected,
}: NodeProps<Node<DiagramNode["data"]>>) {
  const actions = useContext(NodeActions);
  const editing = actions.editing === id;
  return (
    <div
      className={`diagram-shape ${data.kind} ${selected ? "is-selected" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        aria-label="Incoming connection"
      />
      <div className="shape-surface" />
      <div className="shape-content" onDoubleClick={() => actions.edit(id)}>
        {editing ? (
          <LabelInput
            key={id}
            value={data.label}
            done={(value) => {
              actions.label(id, value);
              actions.edit(null);
            }}
            cancel={() => actions.edit(null)}
          />
        ) : (
          <span className={data.label ? "" : "placeholder"}>
            {data.label ||
              {
                process: "Process",
                decision: "Decision",
                system: "System",
                terminal: "Start / End",
              }[data.kind]}
          </span>
        )}
        {(data.notes || data.description || data.referenceUrl) && (
          <StickyNote
            data-editor-only
            className="detail-mark"
            size={12}
            aria-label="Has details"
          />
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        aria-label="Outgoing connection"
      />
      <button
        data-editor-only
        className="grow-button nodrag nopan nokey"
        title="Add connected process"
        aria-label={`Add step after ${data.label || data.kind}`}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          actions.grow(id);
        }}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
function LabelInput({
  value,
  done,
  cancel,
}: {
  value: string;
  done: (v: string) => void;
  cancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      className="node-label-input nodrag nopan nokey"
      aria-label="Shape label"
      placeholder="Name this step…"
      value={draft}
      maxLength={300}
      onChange={(e) => setDraft(e.target.value)}
      onDoubleClick={(e) => e.stopPropagation()}
      onBlur={() => {
        if (!cancelled.current) done(draft);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          done(draft);
        }
        if (e.key === "Escape") {
          cancelled.current = true;
          cancel();
        }
      }}
    />
  );
}
