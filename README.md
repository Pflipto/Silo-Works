# Silo Works

Shelterbelt Experiment 002. **Might as well draw it out.**

A private, browser-local process and integration diagram editor. Next.js App Router, TypeScript, React Flow, Dagre, Zod, and html-to-image. No account, backend storage, telemetry, or external API calls.

## Develop

Node.js 24 and npm 11 are used in this environment.

```sh
npm ci
npm run dev
```

The editor runs on port 3001. `npm run build && npm start` runs a production build on the same port. No environment variables are required. Fonts are served locally under SIL OFL (see `public/fonts/inter-OFL.txt`).

## Use

Choose a shape tool and click the canvas, or use **Add your first shape**. Enter a label and press Enter. Select a shape and use its **+** to append a connected process. Drag between the right and left handles to connect existing shapes, or use Connect and click source then destination. Double-click a label to edit it. Select a connection or shape to edit its notes, description, or HTTP(S) reference. Tidy Up runs only on request.

Shift-click or Shift-drag a selection rectangle to select multiple objects. Space-drag pans; the wheel zooms. Delete removes the selection. Ctrl/⌘ Z undoes and Ctrl/⌘ Shift Z redoes. V/H/P/D/S/T/C select tools.

Autosave belongs to this browser/device; clearing browser data removes it. Download editable JSON for a backup. Import validates v1 schema and topology and asks before replacing a nonempty drawing. Unreadable stored data is preserved and autosave paused until explicit replacement. PNG/SVG exports contain only the drawing on cream paper; JSON preserves IDs, metadata, connections, title, and viewport. SVG uses embedded HTML via `foreignObject`, supported by modern browsers; some vector design applications may not support it.

## Validate

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser tests use Chromium at `/usr/bin/chromium` by default (override `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if needed). Run the production server before E2E tests, or let the configured webServer start it. See ACCEPTANCE.md for the usability and release checklist. The five-minute first-time-user benchmark requires a separate human usability session.

The attached specification is retained in the repository; `references/brand-board.png` is directional inspiration. See CHANGELOG.md for implementation decisions. No deployment is performed by these commands.
