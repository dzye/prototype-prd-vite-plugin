# prototype-prd-vite-plugin

Local-first PRD workbench for Vite prototype projects.

During `vite dev`, this plugin injects a small `PRD` button into the page. The button opens a right-side drawer where you can edit Markdown, preview it, save a local draft, export a project PRD, and optionally trigger AI generation from your local dev server.

## Install

```bash
npm install -D prototype-prd-vite-plugin
```

## Usage

```js
// vite.config.js
import { defineConfig } from "vite";
import prototypePrd from "prototype-prd-vite-plugin";

export default defineConfig({
  plugins: [
    prototypePrd()
  ]
});
```

The overlay only runs in Vite dev mode. It is disabled for production builds by default.

## Configuration

```js
prototypePrd({
  draftDir: ".prototype-prd",
  draftFile: "current.md",
  exportDir: "docs/prd",
  defaultTitle: "Product Requirements Document",
  ai: {
    enabled: true,
    model: "gpt-4.1-mini",
    baseURL: "https://api.openai.com/v1"
  }
});
```

## Storage Model

Drafts are local-first:

- Draft file: `.prototype-prd/current.md`
- Export directory: `docs/prd`
- Export file shape: `YYYY-MM-DD-<slug>.md`

If you want private drafts, keep `.prototype-prd/` in `.gitignore`. Exported PRDs under `docs/prd/` are intended to be committed and reviewed with the project.

## AI Generation

AI generation is manual. The plugin never calls an external API on startup or while you type. It only calls AI after you click `Generate Markdown`.

Set your API key locally before starting Vite:

```bash
OPENAI_API_KEY=your_key npm run dev
```

The key is read only by the Vite dev server middleware. It is not sent to the browser, not written by this plugin, and not printed.

By default the plugin calls the OpenAI Responses API at:

```text
POST https://api.openai.com/v1/responses
```

You can set `ai.baseURL` for a compatible local gateway or proxy.

## Privacy And Safety

- No production build injection by default.
- No browser-side OpenAI API calls.
- No API key creation or storage.
- No automatic network requests for editing, saving, previewing, or exporting.
- File access is constrained to the Vite project root.
- AI context is limited to current PRD Markdown, current page URL, and notes you enter.

## Local Development

```bash
npm test
npm pack --dry-run
```

## Example

See `examples/basic` for a minimal Vite app configuration.
