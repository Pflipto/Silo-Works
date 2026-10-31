import { toPng, toSvg } from "html-to-image";
import { getViewportForBounds, type Rect } from "@xyflow/react";
import type { DiagramDocument } from "./schema";
export function download(data: string, name: string) {
  const a = document.createElement("a");
  a.href = data;
  a.download = name;
  a.click();
}
export function downloadJson(d: DiagramDocument) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }),
  );
  download(url, `${filename(d.title)}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function filename(s: string) {
  return (
    s
      .replace(/[^a-z0-9 _-]/gi, "")
      .trim()
      .slice(0, 100) || "silo-works"
  );
}
export async function exportImage(
  format: "png" | "svg",
  d: DiagramDocument,
  root: HTMLElement,
  bounds: Rect,
) {
  if (!d.nodes.length)
    throw new Error("Add a shape before exporting an image.");
  await document.fonts.ready;
  const width = Math.ceil(bounds.width + 160),
    height = Math.ceil(bounds.height + 160);
  if (width > 16000 || height > 16000 || width * height > 40000000)
    throw new Error(
      "This drawing is too large for an image. Download JSON or export a smaller drawing.",
    );
  const viewport = getViewportForBounds(bounds, width, height, 1, 1, 0);
  // A cloned viewport preserves React Flow paths, labels, local fonts, and shapes together.
  const fn = format === "png" ? toPng : toSvg;
  const data = await fn(root, {
    backgroundColor: "#F6F0E4",
    width,
    height,
    pixelRatio: 2,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(1)`,
    },
    filter: (el) =>
      !(
        el instanceof Element &&
        (el.hasAttribute("data-editor-only") ||
          el.classList.contains("react-flow__handle") ||
          el.classList.contains("react-flow__nodesselection") ||
          el.classList.contains("react-flow__selection"))
      ),
  });
  download(data, `${filename(d.title)}.${format}`);
}
