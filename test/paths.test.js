import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { resolveInsideRoot, resolveStoragePaths, slugify } from "../src/paths.js";

test("resolveInsideRoot resolves paths inside the project root", () => {
  const root = path.resolve("/tmp/prototype-prd");
  const file = resolveInsideRoot(root, "docs/prd/feature.md");

  assert.equal(file, path.join(root, "docs/prd/feature.md"));
});

test("resolveInsideRoot rejects traversal outside the project root", () => {
  const root = path.resolve("/tmp/prototype-prd");

  assert.throws(
    () => resolveInsideRoot(root, "../outside.md"),
    /escapes the project root/
  );
});

test("resolveInsideRoot rejects absolute paths outside the project root", () => {
  const root = path.resolve("/tmp/prototype-prd");

  assert.throws(
    () => resolveInsideRoot(root, "/etc/passwd"),
    /escapes the project root/
  );
});

test("resolveStoragePaths resolves draft and export directories", () => {
  const root = path.resolve("/tmp/prototype-prd");
  const paths = resolveStoragePaths(root, {
    draftDir: ".prototype-prd",
    draftFile: "current.md",
    exportDir: "docs/prd"
  });

  assert.equal(paths.root, root);
  assert.equal(paths.draftPath, path.join(root, ".prototype-prd/current.md"));
  assert.equal(paths.exportDirPath, path.join(root, "docs/prd"));
});

test("slugify creates safe lowercase file slugs", () => {
  assert.equal(slugify("Checkout Flow / v2!"), "checkout-flow-v2");
  assert.equal(slugify("   "), "prd");
});
