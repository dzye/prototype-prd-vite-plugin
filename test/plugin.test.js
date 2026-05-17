import test from "node:test";
import assert from "node:assert/strict";

import prototypePrd from "../index.js";

test("plugin exposes a stable Vite plugin name", () => {
  const plugin = prototypePrd();

  assert.equal(plugin.name, "prototype-prd-vite-plugin");
});

test("plugin injects the overlay loader during dev", () => {
  const plugin = prototypePrd();
  plugin.configResolved({ command: "serve", root: process.cwd() });

  const html = plugin.transformIndexHtml("<html><head></head><body></body></html>");

  assert.match(html, /__prototype_prd__\/client\/overlay\.js/);
});

test("plugin skips HTML injection when disabled for build", () => {
  const plugin = prototypePrd();
  plugin.configResolved({ command: "build", root: process.cwd() });

  const html = plugin.transformIndexHtml("<html><body></body></html>");

  assert.equal(html, "<html><body></body></html>");
});

test("plugin registers client asset and API middleware during dev", () => {
  const plugin = prototypePrd();
  const used = [];
  plugin.configResolved({ command: "serve", root: process.cwd() });
  plugin.configureServer({
    middlewares: {
      use(handler) {
        used.push(handler);
      }
    }
  });

  assert.equal(used.length, 2);
  assert.equal(typeof used[0], "function");
  assert.equal(typeof used[1], "function");
});
