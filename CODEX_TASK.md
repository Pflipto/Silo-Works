# First Codex Task · Implement Silo Works v0.1

Build the first working prototype of **Silo Works** in a new standalone repository, using the attached specification files.

**Read these first, in order:** `AGENTS.md`, `PRODUCT_SPEC.md`, `UX_SPEC.md`, `BRAND.md`, `TECHNICAL.md`, `ACCEPTANCE.md`. Inspect `references/brand-board.png` as directional inspiration.

## Objective

Ship a reliable, local-first, desktop-oriented diagram editor that supports freeform placement **and** contextual `+` connected creation, smart persistent connections, labels, node/edge notes, manual `Tidy Up`, undo/redo, local autosave, and PNG/SVG/JSON export. Use Next.js + TypeScript + React Flow; start with Dagre for manual layout.

## Approach

1. Inspect repository/current environment; if empty, scaffold a simple Next.js TypeScript app.
2. Implement the smallest complete edit loop first: add node → connect → edit label → save → refresh.
3. Add connected `+` creation, four node types, edge labels, and object details.
4. Add undo/redo, opt-in Tidy Up, export/import, and error handling.
5. Apply the paper-engineering brand tokens and responsive shell; preserve canvas readability.
6. Run lint, build, unit tests, and available E2E tests. Walk the golden path in `ACCEPTANCE.md` if browser tooling is available.
7. Summarize what works, what doesn't, test commands/results, and any tradeoffs. If deployment requires approval, stop at a local build.

## Constraints

No backend, user accounts, external tracking, AI generation, multiplayer, or decorative features that displace the canvas. Keep architecture understandable for an AI-assisted beginner builder. Don't claim features are working until tested. Ask only if a truly blocking product decision cannot be resolved from the spec.

## Done means

Someone can enter the page, make a simple branching process diagram, annotate it, rearrange and tidy it, reload without loss, and export it cleanly, all without onboarding.
