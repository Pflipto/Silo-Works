# Editor Interaction Specification

## Input and editing

### Create a free node

- Click one of four shape tools, then click the canvas to place it. Keep the selected tool until Escape or Select is chosen, or use single-shot placement if testing reveals that to be clearer.
- Immediately focus node-label editing; show sample placeholder text, not a permanently named “New Node.”
- Nodes have comfortable hit targets and legible labels.

### Grow a flow with `+`

- When a node is selected or hovered, show contextual `+` at its right side.
- Click `+` → append a process node one grid interval to the right, connect source to new node, and put the new label in edit mode.
- If destination overlaps existing content, find a nearby free location rather than covering another node.
- If the source is a decision, allow multiple outgoing links. Do not force a prescribed Yes/No schema in v0.1.
- Users can alternatively draw connections from handles to existing nodes.

### Connections

- Attached edges use clean, readable routing with arrowheads and no phantom endpoints.
- Moving either connected node updates the edge in real time.
- Selecting an edge reveals the details panel; double-clicking the edge label edits it.
- Clicking blank canvas deselects and hides the panel.
- Deleting a node also removes its incident edges, with undo available.

### Manipulate and navigate

- Drag nodes freely; pan via dedicated hand mode or Space+drag; mouse wheel/trackpad zoom; Fit View control.
- Support selection, Delete/Backspace, Escape, Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z (or Ctrl/Cmd+Y).
- Minimum accessibility: keyboard navigation of major controls, labels, visible focus, sufficient contrast, reduced-motion respect.
- Favor desktop/laptop editing. On smaller screens, offer a readable, non-broken view and clear export/import access; mobile editing parity is deferred.

### Notes/details

- Node: title/label, type, optional description, optional notes, optional reference URL.
- Edge: label, optional description, optional notes, optional reference URL.
- Notes appear only when selected; tiny unobtrusive indicator on objects with details is acceptable.
- Do not add markdown editor, attachments, or arbitrary property schemas.
- Validate URL protocols: permit `https:` and `http:` only; reject script URLs.

### Tidy Up

- Explicit command. Uses graph topology to arrange left-to-right; branch spacing should be obvious.
- After Tidy Up, undo restores the prior coordinates in one step.
- Never change node data, edge endpoints, or label text.
- Test a process chain, branching decision, disconnected nodes, and a back-edge/cycle.

### Document lifecycle

- Auto-save on meaningful edits with debounce; status `Saving…`, `Saved locally`, or `Could not save`.
- First use creates a local document. Reload restores it.
- `New drawing` is explicit and asks to confirm only if content would otherwise be lost; easy JSON export before replacement.
- Export PNG, SVG, and editable `.json` as separate options.
- Import JSON validates schema/version and shows a safe error; no silent overwrite of current drawing.

## Information density

- Most screen real estate belongs to the canvas.
- Details panel only appears for the selected object and remains narrow.
- Avoid modal setup wizards, splash screens, marketing banners, heavy animation, and permanent decorative labels.
- Stick to clear verbs: `Add`, `Connect`, `Tidy Up`, `Export`, `Notes`. Whimsical language belongs in welcoming copy and About.

## Footer/About note

**A note from the farm**  
Inspired by Grandpa Roger, who could explain just about anything with a pen and a napkin at the kitchen table.  
Silo Works is our attempt to make that napkin a little more useful.  
Made with care on the digital prairie. A Shelterbelt project.

This is drafted brand copy; it can be lightly edited for voice, but keep the sentiment and avoid inventing biographical details.
