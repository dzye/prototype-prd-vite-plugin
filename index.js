import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { normalizeOptions } from "./src/config.js";
import { createPrototypePrdMiddleware } from "./src/middleware.js";

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_PREFIX = "/__prototype_prd__/client/";

export default function prototypePrd(userOptions = {}) {
  let resolvedConfig = {
    command: "serve",
    root: process.cwd()
  };
  let options = normalizeOptions(userOptions, "serve");

  return {
    name: "prototype-prd-vite-plugin",
    apply: "serve",

    configResolved(config) {
      resolvedConfig = config;
      options = normalizeOptions(userOptions, config.command);
    },

    configureServer(server) {
      if (!options.enabled) {
        return;
      }

      server.middlewares.use(createClientAssetMiddleware());
      server.middlewares.use(
        createPrototypePrdMiddleware({
          root: resolvedConfig.root,
          options
        })
      );
    },

    transformIndexHtml(html) {
      if (!options.enabled) {
        return html;
      }

      const script = `<script type="module" src="${CLIENT_PREFIX}overlay.js"></script>`;
      return html.includes("</body>")
        ? html.replace("</body>", `${script}</body>`)
        : `${html}${script}`;
    }
  };
}

export { prototypePrd };

function createClientAssetMiddleware() {
  return async function clientAssetMiddleware(req, res, next) {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (!url.pathname.startsWith(CLIENT_PREFIX)) {
      next();
      return;
    }

    const assetName = path.basename(url.pathname);
    if (!["overlay.js", "overlay.css"].includes(assetName)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    const filePath = path.join(PACKAGE_ROOT, "client", assetName);
    const content = await readFile(filePath, "utf8");

    res.setHeader(
      "content-type",
      assetName.endsWith(".css")
        ? "text/css; charset=utf-8"
        : "text/javascript; charset=utf-8"
    );
    res.end(content);
  };
}
