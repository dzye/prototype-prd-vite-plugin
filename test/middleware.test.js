import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { EventEmitter } from "node:events";
import os from "node:os";
import path from "node:path";

import { createPrototypePrdMiddleware } from "../src/middleware.js";

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "prototype-prd-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function request(method, url, body) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = body ? { "content-type": "application/json" } : {};
  req[Symbol.asyncIterator] = async function* readBody() {
    if (body) {
      yield Buffer.from(JSON.stringify(body));
    }
  };

  return req;
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value = "") {
      this.body += value;
      this.finished = true;
    }
  };
}

async function invoke(middleware, method, url, body) {
  const req = request(method, url, body);
  const res = response();

  await middleware(req, res, () => {
    res.nextCalled = true;
  });

  return {
    statusCode: res.statusCode,
    headers: res.headers,
    body: res.body ? JSON.parse(res.body) : undefined,
    nextCalled: res.nextCalled
  };
}

test("middleware returns state without exposing API keys", async () => {
  await withTempDir(async (root) => {
    const middleware = createPrototypePrdMiddleware({
      root,
      options: { defaultTitle: "Checkout" },
      env: { OPENAI_API_KEY: "secret" }
    });

    const result = await invoke(middleware, "GET", "/__prototype_prd__/state");

    assert.equal(result.statusCode, 200);
    assert.equal(result.body.title, "Checkout");
    assert.equal(result.body.ai.configured, true);
    assert.equal(JSON.stringify(result.body).includes("secret"), false);
  });
});

test("middleware reads and saves drafts", async () => {
  await withTempDir(async (root) => {
    const middleware = createPrototypePrdMiddleware({ root, options: {} });

    const initial = await invoke(middleware, "GET", "/__prototype_prd__/draft");
    assert.equal(initial.statusCode, 200);
    assert.equal(initial.body.exists, false);

    const saved = await invoke(middleware, "PUT", "/__prototype_prd__/draft", {
      markdown: "# Saved"
    });
    assert.equal(saved.statusCode, 200);

    const next = await invoke(middleware, "GET", "/__prototype_prd__/draft");
    assert.equal(next.body.exists, true);
    assert.equal(next.body.markdown, "# Saved");
  });
});

test("middleware exports PRDs", async () => {
  await withTempDir(async (root) => {
    const middleware = createPrototypePrdMiddleware({ root, options: {} });

    const result = await invoke(middleware, "POST", "/__prototype_prd__/export", {
      title: "Checkout",
      markdown: "# Checkout",
      date: "2026-05-17"
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.body.fileName, "2026-05-17-checkout.md");
  });
});

test("middleware reports missing API key for AI generation", async () => {
  await withTempDir(async (root) => {
    const middleware = createPrototypePrdMiddleware({ root, options: {}, env: {} });

    const result = await invoke(middleware, "POST", "/__prototype_prd__/ai/generate", {
      markdown: "# Draft",
      instruction: "Expand this"
    });

    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error.code, "OPENAI_API_KEY_MISSING");
  });
});

test("middleware passes through unrelated requests", async () => {
  const middleware = createPrototypePrdMiddleware({ root: process.cwd(), options: {} });
  const result = await invoke(middleware, "GET", "/app.js");

  assert.equal(result.nextCalled, true);
});
