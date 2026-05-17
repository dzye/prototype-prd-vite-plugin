import test from "node:test";
import assert from "node:assert/strict";

import { extractResponseText, generatePrdMarkdown } from "../src/openai.js";

test("generatePrdMarkdown calls the Responses API with PRD context", async () => {
  const calls = [];
  const markdown = await generatePrdMarkdown({
    apiKey: "test-key",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-test",
    markdown: "# Draft",
    instruction: "Expand acceptance criteria",
    pageUrl: "http://localhost:5173/checkout",
    notes: "Prototype has a checkout form.",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ output_text: "# Generated PRD" });
    }
  });

  assert.equal(markdown, "# Generated PRD");
  assert.equal(calls[0].url, "https://api.openai.com/v1/responses");
  assert.equal(calls[0].init.headers.authorization, "Bearer test-key");

  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.model, "gpt-test");
  assert.match(body.instructions, /product requirements document/i);
  assert.match(body.input, /# Draft/);
  assert.match(body.input, /Expand acceptance criteria/);
  assert.match(body.input, /http:\/\/localhost:5173\/checkout/);
});

test("generatePrdMarkdown supports custom compatible base URLs", async () => {
  const calls = [];
  await generatePrdMarkdown({
    apiKey: "test-key",
    baseURL: "http://localhost:11434/v1/",
    model: "local",
    markdown: "",
    instruction: "",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({ output_text: "ok" });
    }
  });

  assert.equal(calls[0].url, "http://localhost:11434/v1/responses");
});

test("extractResponseText reads message content arrays", () => {
  const text = extractResponseText({
    output: [
      {
        type: "message",
        content: [
          { type: "output_text", text: "Hello" },
          { type: "refusal", refusal: "No" }
        ]
      }
    ]
  });

  assert.equal(text, "Hello");
});

test("generatePrdMarkdown maps API errors", async () => {
  await assert.rejects(
    () =>
      generatePrdMarkdown({
        apiKey: "test-key",
        baseURL: "https://api.openai.com/v1",
        model: "gpt-test",
        markdown: "",
        instruction: "",
        fetchImpl: async () =>
          jsonResponse(
            { error: { message: "Invalid API key" } },
            { ok: false, status: 401 }
          )
      }),
    /OpenAI API request failed: Invalid API key/
  );
});

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return payload;
    }
  };
}
