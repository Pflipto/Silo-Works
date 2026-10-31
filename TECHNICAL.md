# Recommended Technical Architecture

## Stack

- Next.js App Router + TypeScript + React.
- `@xyflow/react` (React Flow) for nodes/edges, selection, pan/zoom, and viewport.
- `@dagrejs/dagre` for initial `Tidy Up` layout; keep behind an abstraction so ELK.js can be swapped in if branching/routing proves inadequate.
- Browser `localStorage` for v0.1 persistence (guard SSR access); schema validation with a lightweight validator such as Zod.
- CSS variables for brand tokens, ordinary CSS modules or existing minimal styling approach, no heavy design system dependency.
- Use a stable maintained DOM-to-image/SVG export approach, test thoroughly with node labels/edge labels and fonts; avoid brittle ad hoc SVG serialization.
- Deployable to Vercel, **but do not deploy until approved**.

## Important implementation choices

- Make the editor a client component within Next.js. Keep SSR/browser storage boundary correct.
- Use an app-owned diagram document schema; hydrate React Flow from it and serialize back with explicit version handling.
- Separate editor logic from UI chrome and brand components.
- Keep diagram state in one coherent store, with undo/redo snapshots or a tested command history. Group dragging into one undoable action rather than dozens of pointer movements.
- Debounced save must not overwrite restored state during hydration. Handle storage quota errors and malformed saved data.
- Keep node identities stable when changing type, changing labels, and running layout.
- Layout uses known node dimensions and waits until nodes are measured where needed.
- Use stable handles with appropriate source/target behavior; don't hide handles with `display:none` where geometry calculations require them.
- Standard web-app safety: sanitize pasted labels as text, validate external URLs, no executing imported JSON content, no secret keys in the frontend.
- Add unit tests for serialization/schema migration, history, `+` node placement, and topology-preserving layout; add browser E2E smoke tests for the primary journey.

## Suggested file layout

```
app/
  page.tsx
components/
  editor/EditorShell.tsx
  editor/DiagramCanvas.tsx
  editor/NodeTypes.tsx
  editor/DetailsPanel.tsx
  editor/Toolbar.tsx
  editor/ExportMenu.tsx
lib/
  diagram/schema.ts
  diagram/storage.ts
  diagram/history.ts
  diagram/layout.ts
  diagram/export.ts
  diagram/actions.ts
styles/
  tokens.css
```

Structure is illustrative; keep it as simple as the actual implementation allows.

## Sources and checks

- React Flow API and examples: https://reactflow.dev/
- Save/restore: https://reactflow.dev/examples/interaction/save-and-restore
- Handles: https://reactflow.dev/api-reference/components/handle
- Layout options: https://reactflow.dev/learn/layouting/layouting
- Next.js client-component/browser API guidance: https://nextjs.org/docs/app/getting-started/server-and-client-components

Before installation, check current package versions and compatibility; use maintained stable releases. Avoid a mandatory backend for this experiment.
