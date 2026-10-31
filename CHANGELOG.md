# Decisions

- v0.1 uses Next.js App Router, React Flow, Dagre, Zod, and html-to-image. No server storage or external services.
- App-owned version 1 schema validates imports and storage; library-only transient state is excluded from JSON.
- History stores bounded document snapshots. Drags and field edits commit once, rather than per pointer movement or keystroke.
- Import and new drawing require replacement confirmation when content exists. Unreadable saved data is never automatically overwritten.
- Fonts are self-hosted Inter, licensed under SIL OFL; canvas uses solid cream without decorative weathering.
- Fixed dimensions are supplied to React Flow on every controlled update; losing measurements briefly hides nodes and interrupts label focus. They match Dagre layout dimensions.
- Free shape tools place one shape per click. Select supports Shift selection; Space-drag and the Pan tool move the viewport.
- Native dialogs provide focus containment and restoration. Inline labels commit with Enter or blur and cancel with Escape. Active field edits flush before unload.
- PNG/SVG export uses html-to-image to preserve routed edges and embedded local fonts. SVG contains foreignObject and targets modern browser/document workflows; native editable backups use JSON.
- ESLint 9 matches the peer requirements of Next.js's React, import, and accessibility plugins; the lockfile is verified with npm ci.
