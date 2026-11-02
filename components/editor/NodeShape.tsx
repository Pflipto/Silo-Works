"use client";
import { createContext, useContext, useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Plus, StickyNote } from "lucide-react";
import type { Direction } from "@/lib/diagram/actions";
import type { DiagramNode } from "@/lib/diagram/schema";
export const NodeActions = createContext<{
  editing: string | null;
  edit: (id: string | null) => void;
  label: (id: string, value: string) => void;
  grow: (id: string, direction: Direction) => void;
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
      className={`diagram-shape ${data.kind} ${data.kind === "ai" ? `ai-${data.aiType || "llm"}` : ""} ${selected ? "is-selected" : ""}`}
    >
      <Handle
        type="source"
        position={Position.Left}
        id="in"
        aria-label="Left connection"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        aria-label="Top connection"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        aria-label="Bottom connection"
      />
      {data.kind === "ai" ? (
        <svg
          className="shape-surface ai-symbol"
          viewBox="0 0 184 92"
          aria-hidden="true"
        >
          {data.aiType === "mcp" ? (
            <>
              <path className="pipe-body" d="M54 17H130V91H54Z" />
              <path className="pipe-highlight" d="M61 20H69V88H61Z" />
              <path className="pipe-rim" d="M44 1H140V21H44Z" />
              <path className="symbol-detail" d="M50 17H134M127 26V85" />
            </>
          ) : (
            <>
              <path
                className="brain-body"
                d="M92 13C80 0 62 3 57 12C42 5 28 12 27 24C10 22 2 37 10 48C0 61 10 76 25 75C29 89 48 93 61 84C71 94 87 88 92 81C97 88 113 94 123 84C136 93 155 89 159 75C174 76 184 61 174 48C182 37 174 22 157 24C156 12 142 5 127 12C122 3 104 0 92 13Z"
              />
              <path
                className="symbol-detail"
                d="M92 13V29M92 68V81M57 12C50 20 54 29 63 30M27 24C26 34 32 38 40 37M10 48C18 45 26 49 26 57M25 75C35 74 42 70 42 64M61 84C54 78 56 72 63 69M127 12C134 20 130 29 121 30M157 24C158 34 152 38 144 37M174 48C166 45 158 49 158 57M159 75C149 74 142 70 142 64M123 84C130 78 128 72 121 69"
              />
            </>
          )}
        </svg>
      ) : (
        <div className="shape-surface" />
      )}
      {data.kind === "ai" && (
        <span className="ai-kind">{(data.aiType || "llm").toUpperCase()}</span>
      )}
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
                ai: "AI",
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
        aria-label="Right connection"
      />
      {(["right", "left", "top", "bottom"] as const).map((direction) => (
        <button
          key={direction}
          data-editor-only
          className={`grow-button grow-${direction} nodrag nopan nokey`}
          title={`Add connected process ${direction}`}
          aria-label={
            direction === "right"
              ? `Add step after ${data.label || data.kind}`
              : `Add step ${direction} of ${data.label || data.kind}`
          }
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            actions.grow(id, direction);
          }}
        >
          <Plus size={15} />
        </button>
      ))}
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
