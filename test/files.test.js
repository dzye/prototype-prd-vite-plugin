import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  exportPrd,
  getStarterMarkdown,
  readDraft,
  saveDraft
} from "../src/files.js";

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "prototype-prd-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const storage = (root) => ({
  root,
  draftPath: path.join(root, ".prototype-prd/current.md"),
  draftDirPath: path.join(root, ".prototype-prd"),
  exportDirPath: path.join(root, "docs/prd")
});

test("readDraft returns a starter template when no draft exists", async () => {
  await withTempDir(async (root) => {
    const result = await readDraft(storage(root), "Checkout");

    assert.equal(result.exists, false);
    assert.match(result.markdown, /^# Checkout/);
    assert.match(result.markdown, /## Acceptance Criteria/);
  });
});

test("saveDraft writes markdown and readDraft returns the saved draft", async () => {
  await withTempDir(async (root) => {
    await saveDraft(storage(root), "# Saved PRD");
    const result = await readDraft(storage(root), "Checkout");

    assert.equal(result.exists, true);
    assert.equal(result.markdown, "# Saved PRD");
  });
});

test("exportPrd writes date-prefixed slug files", async () => {
  await withTempDir(async (root) => {
    const result = await exportPrd(storage(root), {
      markdown: "# Checkout",
      title: "Checkout Flow",
      date: "2026-05-17"
    });
    const content = await readFile(result.path, "utf8");

    assert.equal(result.fileName, "2026-05-17-checkout-flow.md");
    assert.equal(content, "# Checkout");
  });
});

test("exportPrd refuses to overwrite existing files by default", async () => {
  await withTempDir(async (root) => {
    await exportPrd(storage(root), {
      markdown: "# First",
      title: "Checkout",
      date: "2026-05-17"
    });

    await assert.rejects(
      () =>
        exportPrd(storage(root), {
          markdown: "# Second",
          title: "Checkout",
          date: "2026-05-17"
        }),
      /already exists/
    );
  });
});

test("getStarterMarkdown includes the agreed MVP sections", () => {
  const markdown = getStarterMarkdown("Feature");

  assert.match(markdown, /^# Feature/);
  assert.match(markdown, /## Background/);
  assert.match(markdown, /## Functional Requirements/);
  assert.match(markdown, /## Acceptance Criteria/);
});
