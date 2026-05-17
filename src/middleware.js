import { normalizeOptions } from "./config.js";
import { exportPrd, readDraft, saveDraft } from "./files.js";
import { readJson, sendError, sendJson } from "./http.js";
import { generatePrdMarkdown } from "./openai.js";
import { resolveStoragePaths } from "./paths.js";

const PREFIX = "/__prototype_prd__";

export function createPrototypePrdMiddleware({
  root,
  options = {},
  env = process.env,
  generate = generatePrdMarkdown
}) {
  const normalized = normalizeOptions(options, "serve");
  const storagePaths = resolveStoragePaths(root, normalized);

  return async function prototypePrdMiddleware(req, res, next) {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (!url.pathname.startsWith(PREFIX)) {
      next();
      return;
    }

    try {
      if (req.method === "GET" && url.pathname === `${PREFIX}/state`) {
        sendJson(res, 200, {
          title: normalized.defaultTitle,
          draftPath: relativeForClient(storagePaths.root, storagePaths.draftPath),
          exportDir: relativeForClient(storagePaths.root, storagePaths.exportDirPath),
          ai: {
            enabled: normalized.ai.enabled,
            trigger: "manual",
            configured: Boolean(env.OPENAI_API_KEY)
          }
        });
        return;
      }

      if (req.method === "GET" && url.pathname === `${PREFIX}/draft`) {
        sendJson(res, 200, await readDraft(storagePaths, normalized.defaultTitle));
        return;
      }

      if (req.method === "PUT" && url.pathname === `${PREFIX}/draft`) {
        const body = await readJson(req);
        sendJson(res, 200, await saveDraft(storagePaths, body.markdown));
        return;
      }

      if (req.method === "POST" && url.pathname === `${PREFIX}/export`) {
        const body = await readJson(req);
        sendJson(
          res,
          200,
          await exportPrd(storagePaths, {
            markdown: body.markdown,
            title: body.title || normalized.defaultTitle,
            date: body.date,
            overwrite: Boolean(body.overwrite)
          })
        );
        return;
      }

      if (req.method === "POST" && url.pathname === `${PREFIX}/ai/generate`) {
        if (!normalized.ai.enabled) {
          sendError(res, 400, "AI_DISABLED", "AI generation is disabled.");
          return;
        }

        if (!env.OPENAI_API_KEY) {
          sendError(
            res,
            400,
            "OPENAI_API_KEY_MISSING",
            "Set OPENAI_API_KEY in your local environment to use AI generation."
          );
          return;
        }

        const body = await readJson(req);
        const markdown = await generate({
          apiKey: env.OPENAI_API_KEY,
          baseURL: normalized.ai.baseURL,
          model: normalized.ai.model,
          markdown: body.markdown,
          instruction: body.instruction,
          pageUrl: body.pageUrl,
          notes: body.notes
        });

        sendJson(res, 200, { markdown });
        return;
      }

      sendError(res, 404, "NOT_FOUND", "Prototype PRD endpoint not found.");
    } catch (error) {
      sendError(
        res,
        error?.message?.includes("already exists") ? 409 : 500,
        "PROTOTYPE_PRD_ERROR",
        error?.message || "Prototype PRD request failed."
      );
    }
  };
}

function relativeForClient(root, targetPath) {
  return targetPath.replace(`${root}/`, "");
}
