# v0.1 validation

Validated locally in the managed cloud environment on Node.js 24 with Chromium. No deployment or production services were created.

## Passed

- Clean `npm ci --no-audit --no-fund` using the committed lockfile.
- `npm run lint`, `npm run typecheck`, and `npm run build`.
- `npm test`: 6 tests passed for schema/JSON fidelity, invalid/unsafe input, connected placement, deletion, history, and topology-preserving layout (chain, fork, disconnected graph, cycle).
- `npm run test:e2e`: 7 tests passed against a fresh production server. The branching Patient Intake journey covers five nodes, a decision, Yes/No labels, node/edge notes, dragging without topology changes, single-step move undo/redo, explicit layout, layout undo/redo, refresh persistence, all three exports, and JSON reimport.
- Additional browser coverage: four free-placement shape types, manual Connect tool, direct handle drag, duplicate connection prevention, imported reference metadata, node deletion and undo, invalid import and corrupt-storage preservation, quota failure, 390px mobile shell, reduced-motion preference, visible keyboard focus, Enter/Escape label editing, keyboard movement persistence, native help-dialog focus return, and replacement cancellation.
- Desktop/mobile screenshots and downloaded PNG inspected; SVG opened and rendered in Chromium. Exports omit handles, selection outlines, notes indicators, grow buttons, editor chrome, and canvas grid.

Generated screenshots and exported files are in ignored `test-results/` and are not source assets. Browser tests use isolated contexts, so their sample drawings do not seed users' local storage.

## Limits and unperformed checks

- The under-five-minute first-time-user target has not been tested with an independent human participant. Automated completion is not a usability benchmark.
- Tested browser: Chromium. Firefox, Safari, screen-reader user testing, and a complete manual accessibility audit have not been performed.
- SVG uses embedded HTML (`foreignObject`) with embedded local fonts. Modern browsers render it; some native vector editors may not. JSON is the editable interchange format.
- Browser-local persistence has no cross-device sync. Back up important drawings with JSON; storage errors are visible and JSON remains available.
- This is desktop-oriented v0.1. Node resizing, sophisticated edge routing, mobile editing parity, accounts, and collaboration remain outside this implementation.
