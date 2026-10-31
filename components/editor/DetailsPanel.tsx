"use client";
import { useState } from "react";
import { X, Trash2, ArrowUpRight } from "lucide-react";
import {
  kinds,
  type DiagramNode,
  type DiagramEdge,
  type NodeKind,
} from "@/lib/diagram/schema";
type Data = DiagramNode["data"] | NonNullable<DiagramEdge["data"]>;
export default function DetailsPanel({
  node,
  edge,
  update,
  close,
  remove,
}: {
  node?: DiagramNode;
  edge?: DiagramEdge;
  update: (data: Partial<Data>) => void;
  close: () => void;
  remove: () => void;
}) {
  const data = node?.data || edge?.data || { label: "" };
  const [error, setError] = useState("");
  return (
    <aside
      className="details-panel"
      aria-label={node ? "Shape details" : "Connection details"}
    >
      <div className="panel-heading">
        <span className="eyebrow">
          {node ? "SHAPE DETAILS" : "CONNECTION DETAILS"}
        </span>
        <button
          className="icon-button"
          aria-label="Close details"
          onClick={close}
        >
          <X size={17} />
        </button>
      </div>
      <h2>{node ? "A little more context." : "Connect the dots."}</h2>
      <p className="panel-hint">
        Keep the drawing clear. Put the details here.
      </p>
      <label>
        Label
        <input
          key={`label-${data.label}`}
          data-detail-label
          defaultValue={data.label}
          maxLength={300}
          placeholder={node ? "Name this step" : "e.g. Yes, approved"}
          onBlur={(e) => update({ label: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </label>
      {node && (
        <label>
          Shape
          <select
            value={node.data.kind}
            onChange={(e) => update({ kind: e.target.value as NodeKind })}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {
                  {
                    process: "Process",
                    decision: "Decision",
                    system: "System",
                    terminal: "Start / End",
                  }[k]
                }
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Description
        <textarea
          key={`desc-${data.description}`}
          defaultValue={data.description}
          rows={2}
          placeholder="What happens here?"
          maxLength={20000}
          onBlur={(e) => update({ description: e.target.value })}
        />
      </label>
      <label>
        Notes
        <textarea
          key={`notes-${data.notes}`}
          defaultValue={data.notes}
          rows={5}
          placeholder="The things worth remembering…"
          maxLength={20000}
          onBlur={(e) => update({ notes: e.target.value })}
        />
      </label>
      <label>
        Reference URL <span className="optional">optional</span>
        <input
          key={`url-${data.referenceUrl}`}
          type="url"
          defaultValue={data.referenceUrl}
          placeholder="https://"
          maxLength={2048}
          aria-invalid={!!error}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && (!/^https?:\/\//i.test(v) || !URL.canParse(v))) {
              setError("Use a valid http:// or https:// URL.");
              return;
            }
            setError("");
            update({ referenceUrl: v });
          }}
        />
      </label>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {data.referenceUrl && (
        <a
          className="reference-link"
          href={data.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open reference <ArrowUpRight size={14} />
        </a>
      )}
      <div className="panel-bottom">
        <span>Only saved in this browser.</span>
        <button className="delete-button" onClick={remove}>
          <Trash2 size={14} />
          Delete {node ? "shape" : "connection"}
        </button>
      </div>
    </aside>
  );
}
