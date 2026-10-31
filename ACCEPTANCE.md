# Acceptance Criteria & Test Scenarios

## Release gate: Grandpa Roger test

**Without onboarding or help, a first-time desktop user can create a five-step flowchart with a decision, two branches, one edge label, and one note in under five minutes.** Export should be clean enough for a professional meeting. Treat this as a usability target requiring a manual test, not a guaranteed benchmark.

## Functional checks

- [ ] Blank canvas opens without authentication or setup.
- [ ] Free placement works for each of four node kinds.
- [ ] `+` creates a new node and connected edge, with immediate label edit.
- [ ] Manual node-to-node connection works and remains attached during repositioning.
- [ ] Connection labels can be created, edited, and persist on reload.
- [ ] Node and edge details are editable, persistent, and hidden when deselected.
- [ ] `Tidy Up` produces sensible left-to-right alignment on chain, fork, disconnected graph; never changes topology.
- [ ] Undo/redo handles create/delete/edit/move/tidy and restores correct edges/notes.
- [ ] Autosave restores full diagram after refresh, with clear storage status.
- [ ] Exported PNG and SVG are readable and contain no editor handles or controls.
- [ ] Editable JSON export/import round-trips nodes, edges, labels, notes, title, viewport and IDs.
- [ ] Malformed imported JSON and storage errors fail visibly and safely.
- [ ] Pan/zoom, keyboard shortcuts, and visible focus indicators work.
- [ ] Interface remains coherent at typical desktop and laptop sizes; narrow/mobile screen degrades gracefully.
- [ ] `npm run lint`, `npm run build`, and test commands succeed.

## Golden path manual QA

1. Open the app in a fresh browser profile.
2. Add `Patient Registers`.
3. Click `+` to add `Verify Insurance`.
4. Add `Eligible?` as a decision.
5. Branch to `Enroll` and `Manual Review`.
6. Label outgoing edges `Yes` and `No`.
7. Add node note `Eligibility checked against payer response`.
8. Add edge note `Manual exception path`.
9. Move the decision node; verify edges follow.
10. Click `Tidy Up`; verify layout but not meaning changes.
11. Undo and redo; verify reliable results.
12. Refresh; verify diagram persisted.
13. Export PNG/SVG and editable JSON; inspect output.
14. Import JSON and check fidelity.

## Out-of-scope gate

Do not block v0.1 on AI, SaaS accounts, cloud sync, advanced routing, templates, collaboration, mobile editing parity, or branding animation.
