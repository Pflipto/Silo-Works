# Product Specification · Silo Works v0.1

## Product definition

A low-friction, single-user, browser-based diagram editor for explaining **how things work**. It should feel like a napkin sketch that becomes a respectable engineering drawing without a separate formatting session.

**Positioning (working):** A simple place to sketch processes, connect systems, and work things out.  
**Brand tagline:** *Might as well draw it out.*  
**Internal north star:** *The nicest napkin Grandpa Roger ever drew on.*

## Primary jobs to be done

1. Five minutes before a meeting, quickly sketch a process and show it on screen.
2. During a discussion, add, connect, move, and branch nodes without breaking the diagram.
3. Before handing off an integration, annotate systems and connections without covering the canvas in text.
4. Export a readable diagram to paste into a meeting note or document.

## Core v0.1 user stories

- As a visitor, I can open the editor and immediately begin drawing without a login, tutorial, or template selection.
- As a user, I can title a diagram and create process, decision, system, and start/end nodes.
- As a user, I can place a node freely or click a contextual `+` on a node to create an attached next step.
- As a user, I can connect existing nodes, label connections, and keep connections attached when moving nodes.
- As a user, I can select a node or edge, then edit its label, description, notes, and one optional reference URL in an unobtrusive details panel.
- As a user, I can invoke `Tidy Up` to arrange a diagram without altering its logical connections. It never runs automatically while I drag.
- As a user, I can undo and redo meaningful edits and recover my latest saved state after reloading.
- As a user, I can export a PNG or SVG, and download/import a versioned editable JSON file.

## Information architecture

Single-screen editor at `/` or `/editor`. No account or dashboard needed.

- **Header:** Silo Works wordmark; editable drawing title; small saved/saving state; undo/redo; Tidy Up; Export menu.
- **Left compact toolbar:** Select, Pan, Process, Decision, System, Start/End, Connect, Note (if supported). Obvious tooltips and accessible labels.
- **Canvas:** dominant region; warm, restrained paper tone and subtle grid; zoom/pan; draggable nodes; connected edges; selection handles; contextual `+`.
- **Right details panel:** appears only when node or edge selected (or can be collapsed). Clear label, description/notes, optional URL; edge-specific relationship label.
- **Footer/status bar:** zoom, quick help shortcut, small Shelterbelt attribution. Optional brief personal note in an About panel, not fixed onscreen.

## Core model

```ts
type NodeKind = 'process' | 'decision' | 'system' | 'terminal';
type DiagramNodeData = {
  label: string;
  kind: NodeKind;
  description?: string;
  notes?: string;
  referenceUrl?: string;
};
type DiagramEdgeData = {
  label?: string;
  description?: string;
  notes?: string;
  referenceUrl?: string;
};
type DiagramDocument = {
  schemaVersion: 1;
  id: string;
  title: string;
  updatedAt: string; // ISO date
  nodes: Array<{ id: string; type: string; position: { x:number; y:number }; data: DiagramNodeData }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string; data?: DiagramEdgeData }>;
  viewport?: { x: number; y: number; zoom: number };
};
```

Adapt exact fields to React Flow types as needed; preserve a **versioned, validated, app-owned document schema** independent of internal library serialization.

## Defaults and decisions

- First launch: empty canvas with a small unobtrusive instruction, e.g. “Start with a shape. Might as well draw it out.”
- Editing: double-click label to edit; Enter commits; Escape cancels; multiline text belongs in notes panel.
- Creating connected node: contextual `+` adds a process node to the right, creates the edge, and focuses label editing; user may change type afterward.
- Default flow: left to right. Decisions can branch to multiple targets, edge labels can be freely edited.
- Connecting: use visible hover/focus handles; preserve edges when nodes move; prevent exact duplicate connections where practical.
- Auto-layout: only on button click, offers left-to-right layout; preserve nodes, labels, notes, and connection identities; do not run on load or drag.
- Persistence: debounce browser-local save, load last diagram, display saved/error state, warn that storage is tied to this browser/device, and make JSON backup easy.
- Export: canvas-only PNG and SVG with sensible padding and opaque cream background; no selection outlines, toolbars, or editing controls. Optional modest metadata/title, not mandatory watermarks.
- Privacy: no telemetry, analytics, cloud sync, or uploads in v0.1.

## Non-goals

No account system; no collaborative cursors; no AI-generated maps; no automatic API discovery; no arbitrary file attachments; no complex nested subgraphs; no full responsive mobile editor; no auto-running processes or executing integrations.

## Product quality bar

Success means a first-time user can sketch a five-node process with a fork, label a connection, add a note, tidy, and export within five minutes with no instructions. Speed and clarity outrank fancy animations or decorative UI.
