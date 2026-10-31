# AGENTS.md · Silo Works

## Mission

Build **Silo Works**, Shelterbelt Experiment 002: a small, dependable, pleasant browser tool for quick process maps, flowcharts, and integration maps. Product principle: **Grandpa Roger's farm-napkin clarity**. The nicest napkin, not the largest whiteboard.

## Non-negotiables

1. **Simplicity wins.** Optimize for first shape in seconds and a presentable diagram in five minutes.
2. **Do not overbuild.** No auth, backend, AI, collaboration, billing, analytics, or complex template framework for v0.1.
3. **Protect the diagram.** Node/edge relationships, metadata, undo/redo, and local persistence must be reliable. Never silently lose work.
4. **Paper engineering visual language.** Follow `BRAND.md`. Warm paper, dark ink, legible diagrams, understated North Dakota heritage. Do not turn the working canvas into decorative aged paper.
5. **Build-as-you-go plus freeform.** Support contextual `+` connected creation and free placement. Neither can be fake or inert.
6. **Tidy Up is opt-in.** No surprise rearrangement while dragging.
7. **Keep dependencies lean.** Prefer React Flow and a simple layout helper over custom canvas engines or complex infrastructure.
8. **Tests matter.** Verify the golden path in `ACCEPTANCE.md`; run lint/build/tests before claiming completion.
9. **Accessible by default.** Meaningful focus, labels, contrast, keyboard editing, and reduced motion.
10. **Preserve scope and work.** Before destructive edits or architecture changes, explain the rationale; do not overwrite unrelated repository work. Do not deploy or connect external services without approval.

## Workflow expectations

- Read `README.md`, `PRODUCT_SPEC.md`, `UX_SPEC.md`, `BRAND.md`, `TECHNICAL.md`, and `ACCEPTANCE.md` before coding.
- Start with a concise implementation plan and a small vertical slice: create → connect → edit → save → reload.
- Work in focused increments; maintain a short changelog of decisions.
- Use TypeScript types and app-owned schema for stored diagrams. Avoid deeply clever abstractions.
- Deliver a working editor, not merely a visual static mockup.
- At completion, report: what shipped, tests run and results, remaining limitations, and how to run locally. Clearly state any acceptance checks not manually performed.
