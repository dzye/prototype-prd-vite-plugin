import test from "node:test";
import assert from "node:assert/strict";

import { normalizeOptions } from "../src/config.js";

test("normalizeOptions applies local-first defaults", () => {
  const options = normalizeOptions({}, "serve");

  assert.equal(options.enabled, true);
  assert.equal(options.draftDir, ".prototype-prd");
  assert.equal(options.draftFile, "current.md");
  assert.equal(options.exportDir, "docs/prd");
  assert.equal(options.defaultTitle, "Product Requirements Document");
  assert.equal(options.ai.enabled, true);
  assert.equal(options.ai.trigger, "manual");
  assert.equal(options.ai.model, "gpt-4.1-mini");
  assert.equal(options.ai.baseURL, "https://api.openai.com/v1");
});

test("normalizeOptions disables plugin for production builds by default", () => {
  const options = normalizeOptions({}, "build");

  assert.equal(options.enabled, false);
});

test("normalizeOptions preserves explicit overrides", () => {
  const options = normalizeOptions(
    {
      enabled: true,
      draftDir: ".drafts",
      draftFile: "feature.md",
      exportDir: "product/prd",
      defaultTitle: "Checkout",
      ai: {
        enabled: false,
        model: "custom-model",
        baseURL: "http://localhost:11434/v1"
      }
    },
    "build"
  );

  assert.equal(options.enabled, true);
  assert.equal(options.draftDir, ".drafts");
  assert.equal(options.draftFile, "feature.md");
  assert.equal(options.exportDir, "product/prd");
  assert.equal(options.defaultTitle, "Checkout");
  assert.equal(options.ai.enabled, false);
  assert.equal(options.ai.trigger, "manual");
  assert.equal(options.ai.model, "custom-model");
  assert.equal(options.ai.baseURL, "http://localhost:11434/v1");
});
