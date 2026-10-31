import { test, expect, type Page } from "@playwright/test";
const storage = "silo-works.document.v1";
async function state(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "null"),
    storage,
  );
}
async function label(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Shape label", exact: true });
  await input.fill(text);
  await expect(input).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toHaveCount(0);
}
async function field(page: Page, name: string, text: string) {
  const input = page.getByLabel(name, { exact: true });
  await input.fill(text);
  await input.press("Tab");
}
async function saved(page: Page) {
  await expect(page.getByRole("status")).toHaveText("Saved locally");
}
test("golden path: fork, notes, move, tidy, history, reload, exports and import", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Might as well draw it out." }),
  ).toBeVisible();
  await field(page, "Drawing title", "Patient Intake");
  await page.getByRole("button", { name: "Add your first shape" }).click();
  await label(page, "Patient Registers");
  await page
    .getByRole("button", { name: "Add step after Patient Registers" })
    .click();
  await label(page, "Verify Insurance");
  await page
    .getByRole("button", { name: "Add step after Verify Insurance" })
    .click();
  await label(page, "Eligible?");
  await page
    .getByRole("combobox", { name: "Shape", exact: true })
    .selectOption("decision");
  await field(page, "Notes", "Eligibility checked against payer response");
  await page.getByRole("button", { name: "Add step after Eligible?" }).click();
  await label(page, "Enroll");
  await page.getByText("Eligible?", { exact: true }).click();
  await page.getByRole("button", { name: "Add step after Eligible?" }).click();
  await label(page, "Manual Review");
  await saved(page);
  let d = await state(page);
  expect(d.nodes).toHaveLength(5);
  expect(d.edges).toHaveLength(4);
  const fork = d.nodes.find(
    (n: { data: { label: string } }) => n.data.label === "Eligible?",
  );
  const branch = d.edges.find(
    (e: { source: string; target: string }) =>
      e.source === fork.id &&
      e.target ===
        d.nodes.find(
          (n: { data: { label: string } }) => n.data.label === "Manual Review",
        ).id,
  );
  await page.getByRole("button", { name: "Fit drawing", exact: true }).click();
  const yes = d.edges.find(
    (e: { source: string; id: string }) =>
      e.source === fork.id && e.id !== branch.id,
  );
  await selectEdge(page, yes.id);
  await field(page, "Label", "Yes");
  await selectEdge(page, branch.id);
  await field(page, "Label", "No");
  await field(page, "Notes", "Manual exception path");
  await saved(page);
  const beforeMove = await state(page);
  expect(
    beforeMove.edges.find((e: { id: string }) => e.id === yes.id).data.label,
  ).toBe("Yes");
  expect(
    beforeMove.edges.find((e: { id: string }) => e.id === branch.id).data.label,
  ).toBe("No");
  const shape = page.locator(`[data-id="${fork.id}"]`);
  await shape.scrollIntoViewIfNeeded();
  const box = await shape.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 70, box!.y + 45);
  await page.mouse.down();
  await page.mouse.move(box!.x + 90, box!.y + 160, { steps: 8 });
  await page.mouse.up();
  await saved(page);
  const moved = await state(page);
  expect(
    moved.nodes.find((n: { id: string }) => n.id === fork.id).position,
  ).not.toEqual(
    beforeMove.nodes.find((n: { id: string }) => n.id === fork.id).position,
  );
  expect(moved.edges).toEqual(beforeMove.edges);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await saved(page);
  expect((await state(page)).nodes).toEqual(beforeMove.nodes);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await saved(page);
  expect((await state(page)).nodes).toEqual(moved.nodes);
  await page.getByRole("button", { name: "Tidy Up", exact: true }).click();
  await saved(page);
  const tidied = await state(page);
  expect(tidied.edges).toEqual(moved.edges);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await saved(page);
  expect((await state(page)).nodes).toEqual(moved.nodes);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await saved(page);
  expect((await state(page)).nodes).toEqual(tidied.nodes);
  await page.reload();
  await saved(page);
  d = await state(page);
  expect(d.nodes).toEqual(tidied.nodes);
  expect(d.edges).toEqual(tidied.edges);
  expect(d.title).toBe("Patient Intake");
  for (const format of ["PNG image", "SVG image", "Editable drawing"]) {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: format }).click();
    const file = await download;
    expect(await file.failure()).toBeNull();
    const path = await file.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs/promises");
    const bytes = await fs.readFile(path!);
    expect(bytes.length).toBeGreaterThan(200);
    if (format === "SVG image") {
      const svg = bytes.toString();
      expect(svg).toContain("Patient Registers");
      expect(svg).toContain("Manual Review");
      expect(svg).toContain(">Yes<");
      expect(svg).toContain(">No<");
      expect(svg).not.toContain("grow-button");
      expect(svg).not.toContain("react-flow__handle");
      await fs.writeFile("test-results/drawing.svg", bytes);
    }
    if (format === "PNG image") {
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      await fs.writeFile("test-results/drawing.png", bytes);
    }
    if (format === "Editable drawing") {
      const roundtrip = JSON.parse(bytes.toString());
      expect(roundtrip.nodes).toEqual(d.nodes);
      expect(roundtrip.edges).toEqual(d.edges);
      await page.getByLabel("Import drawing file").setInputFiles({
        name: "backup.json",
        mimeType: "application/json",
        buffer: bytes,
      });
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByRole("button", { name: "Replace drawing", exact: true })
        .click();
      await saved(page);
      expect((await state(page)).nodes).toEqual(d.nodes);
    }
  }
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/editor-desktop.png" });
});
test("free placement, manual connection, deletion undo, labels and keyboard tools", async ({
  page,
}) => {
  await page.goto("/");
  await saved(page);
  for (const [i, kind] of [
    "Process",
    "Decision",
    "System",
    "Start / End",
  ].entries()) {
    await page
      .getByRole("button", { name: `${kind} tool`, exact: true })
      .click();
    await page
      .locator(".react-flow__pane")
      .click({ position: { x: 200 + i * 250, y: 250 } });
    await label(page, kind);
  }
  await saved(page);
  expect((await state(page)).nodes).toHaveLength(4);
  await page.getByRole("button", { name: "Fit drawing", exact: true }).click();
  await page.getByRole("button", { name: "Connect tool", exact: true }).click();
  await page
    .locator(".react-flow__node")
    .getByText("Process", { exact: true })
    .click();
  await page
    .locator(".react-flow__node")
    .getByText("Decision", { exact: true })
    .click();
  await saved(page);
  expect((await state(page)).edges).toHaveLength(1);
  await page
    .locator(".react-flow__node")
    .getByText("Decision", { exact: true })
    .dblclick();
  await label(page, "A decision");
  await saved(page);
  await page
    .locator(".react-flow__pane")
    .click({ position: { x: 800, y: 500 } });
  await page.getByText("A decision", { exact: true }).click();
  await page.keyboard.press("Delete");
  await saved(page);
  expect((await state(page)).nodes).toHaveLength(3);
  expect((await state(page)).edges).toHaveLength(0);
  await page.keyboard.press("Control+z");
  await saved(page);
  expect((await state(page)).nodes).toHaveLength(4);
  expect((await state(page)).edges).toHaveLength(1);
});
test("invalid import and corrupt storage never overwrite existing data", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "broken-json"),
    storage,
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Saving paused");
  await expect(page.locator(".message-banner")).toContainText("preserved");
  expect(await page.evaluate((key) => localStorage.getItem(key), storage)).toBe(
    "broken-json",
  );
  await page.getByLabel("Import drawing file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":99}'),
  });
  await expect(page.locator(".message-banner")).toContainText("not a valid");
  expect(await page.evaluate((key) => localStorage.getItem(key), storage)).toBe(
    "broken-json",
  );
});
test("storage quota failure is visible and work stays editable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Could not save");
  await page.getByRole("button", { name: "Add your first shape" }).click();
  await label(page, "Still here");
  await expect(page.getByText("Still here", { exact: true })).toBeVisible();
  await expect(page.locator(".message-banner")).toContainText(
    "Download editable JSON",
  );
});
test("small screen shell and keyboard focus remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await saved(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.getByRole("button", { name: "Export", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "About Silo Works" }),
  ).toBeFocused();
  await page.screenshot({ path: "test-results/editor-mobile.png" });
});

async function selectEdge(page: Page, id: string) {
  const point = await page
    .locator(`[data-id="${id}"] .react-flow__edge-path`)
    .evaluate((el) => {
      const path = el as SVGPathElement;
      const p = path.getPointAtLength(path.getTotalLength() * 0.85);
      const s = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!);
      return { x: s.x, y: s.y };
    });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator(`.react-flow__edge[data-id="${id}"]`)).toHaveClass(
    /selected/,
  );
  await expect(
    page.getByRole("complementary", { name: "Connection details" }),
  ).toBeVisible();
}

test("keyboard editing, cancellation, movement persistence, and help focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add your first shape" }).click();
  await label(page, "Original");
  await saved(page);
  const d = await state(page);
  const node = page.locator(`[data-id="${d.nodes[0].id}"]`);
  await node.focus();
  await page.keyboard.press("Enter");
  const input = page.getByRole("textbox", { name: "Shape label", exact: true });
  await input.fill("Discard this");
  await page.keyboard.press("Escape");
  await expect(node.getByText("Original", { exact: true })).toBeVisible();
  await node.focus();
  await page.keyboard.press("ArrowRight");
  await saved(page);
  expect((await state(page)).nodes[0].position.x).toBe(
    d.nodes[0].position.x + 5,
  );
  await page.reload();
  await saved(page);
  expect((await state(page)).nodes[0].position.x).toBe(
    d.nodes[0].position.x + 5,
  );
  const help = page.getByRole("button", {
    name: "Shortcuts & a note from the farm",
  });
  await help.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(help).toBeFocused();
});

test("handle connections stay attached, reject duplicates, and preserve imported metadata", async ({
  page,
}) => {
  const d = {
    schemaVersion: 1,
    id: "handles-test",
    title: "Integration map",
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "a",
        type: "diagram",
        position: { x: 250, y: 200 },
        data: {
          label: "Source",
          kind: "system",
          referenceUrl: "https://example.com/docs",
        },
      },
      {
        id: "b",
        type: "diagram",
        position: { x: 650, y: 200 },
        data: { label: "Destination", kind: "process" },
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
  await page.goto("/");
  await saved(page);
  await page.getByLabel("Import drawing file").setInputFiles({
    name: "handles.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await saved(page);
  const source = page.locator('[data-id="a"] .react-flow__handle-right');
  const target = page.locator('[data-id="b"] .react-flow__handle-left');
  await source.dragTo(target);
  await saved(page);
  let result = await state(page);
  expect(result.edges).toHaveLength(1);
  expect(result.edges[0]).toMatchObject({
    source: "a",
    target: "b",
    sourceHandle: "out",
    targetHandle: "in",
  });
  await source.dragTo(target);
  await saved(page);
  result = await state(page);
  expect(result.edges).toHaveLength(1);
  await page.locator('[data-id="a"]').click();
  await expect(
    page.getByRole("link", { name: "Open reference" }),
  ).toHaveAttribute("href", "https://example.com/docs");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "New drawing", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Replace this drawing?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await state(page)).nodes).toEqual(d.nodes);
});
