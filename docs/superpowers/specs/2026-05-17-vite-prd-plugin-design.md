# Vite PRD Plugin Design

Date: 2026-05-17

## Goal

Build a publishable npm package that adds a local PRD workbench to Vite prototype projects. During `vite dev`, the plugin injects a small PRD toggle into the running prototype page. Developers can open a side drawer, edit a Markdown PRD, save it into the project locally, optionally generate content with AI, and export a shareable PRD file into the project docs.

The MVP is intentionally local-first. It does not provide a hosted collaboration server. It should be useful for one developer immediately, while leaving clean extension points for later server-backed multi-user editing.

## Product Decisions

- Package concept: `prototype-prd-vite-plugin`.
- Runtime scope: Vite dev mode only.
- UI shell: floating `PRD` button plus right-side drawer.
- Draft storage: project-local draft path, default `.prototype-prd/current.md`.
- Export storage: project docs path, default `docs/prd/<slug>.md`.
- AI behavior: disabled by default at startup; only calls AI when the user explicitly clicks an AI generation action.
- API key behavior: the plugin never creates, stores, uploads, or prints API keys. Users configure `OPENAI_API_KEY` in their own local environment.
- Network behavior: normal editing, saving, previewing, and exporting do not use the network. AI generation may call the OpenAI API only after explicit user action.

## Non-Goals For MVP

- Multi-user real-time collaboration.
- Hosted PRD storage.
- User accounts, auth, teams, or permissions.
- Rich text document editor.
- Production build injection.
- Browser-side OpenAI API calls.

## Architecture

The plugin has three main pieces:

1. Vite plugin entry

   The npm package exports a Vite plugin function. It registers dev-only middleware, serves the plugin client assets, and injects a client loader into HTML during Vite dev.

2. Plugin client overlay

   The browser-side client renders the floating PRD button and the side drawer. It provides Markdown editing, preview, save status, AI generation controls, and export controls. It calls local plugin endpoints exposed by the Vite dev server.

3. Local dev server middleware

   The middleware reads and writes Markdown files under the project root, validates paths, lists available draft/export files, and handles AI generation requests. It reads `OPENAI_API_KEY` only from server-side environment variables.

Data flow:

```text
Prototype page
  -> injected client overlay
  -> local Vite middleware endpoints
  -> project-local Markdown files

AI generation button
  -> client overlay
  -> local Vite middleware
  -> OpenAI API, if OPENAI_API_KEY is configured
  -> generated Markdown returned to editor
```

## Public Plugin API

The plugin should expose a small configuration surface:

```ts
prototypePrd({
  enabled?: boolean;
  draftDir?: string;
  draftFile?: string;
  exportDir?: string;
  defaultTitle?: string;
  ai?: {
    enabled?: boolean;
    trigger?: "manual";
    model?: string;
    baseURL?: string;
  };
});
```

Default values:

- `enabled`: true in dev, false in production.
- `draftDir`: `.prototype-prd`.
- `draftFile`: `current.md`.
- `exportDir`: `docs/prd`.
- `defaultTitle`: inferred from the Vite project name when possible.
- `ai.enabled`: true means the AI controls are available in the drawer.
- `ai.trigger`: always `"manual"` in MVP; no request runs until the user clicks an AI action.
- `ai.model`: configurable by the consuming project.
- `ai.baseURL`: optional for compatible local gateways or proxies, but not required for MVP.

## Local Endpoints

Endpoint names should be namespaced to avoid collisions:

- `GET /__prototype_prd__/state`
  - Returns current config, file paths, whether a draft exists, and whether AI appears configured.

- `GET /__prototype_prd__/draft`
  - Returns the current draft Markdown. If no draft exists, returns a generated starter template.

- `PUT /__prototype_prd__/draft`
  - Saves Markdown to the draft path.

- `POST /__prototype_prd__/export`
  - Writes the current Markdown to `docs/prd/<slug>.md`.

- `POST /__prototype_prd__/ai/generate`
  - Accepts project context and user instructions.
  - Requires explicit user action from the client.
  - Requires server-side `OPENAI_API_KEY`.
  - Returns Markdown text or a structured error.

All endpoints must reject unsafe paths that escape the Vite project root.

## UI Design

The MVP UI has a restrained developer-tool feel:

- A floating `PRD` button in the bottom-right corner.
- A right-side drawer, around 420-520px wide on desktop.
- Mobile fallback: drawer becomes a full-screen panel.
- Header: PRD title, save status, close button.
- Main tabs:
  - `Edit`: Markdown textarea.
  - `Preview`: rendered Markdown preview.
  - `Generate`: AI prompt form and generation controls.
- Footer actions:
  - Save draft.
  - Export to docs.
  - Copy Markdown.

The overlay should avoid interfering with the prototype page:

- It should use a high but scoped z-index.
- Styles should be isolated as much as practical.
- It should not depend on the consuming app's CSS framework.
- It should not mutate app state.

## Markdown Template

When no draft exists, the starter PRD should include:

```md
# Product Requirements Document

## Background

## Goals

## Non-Goals

## Users

## User Stories

## Functional Requirements

## UX Notes

## Data And State

## Edge Cases

## Acceptance Criteria
```

AI generation should fill or refine this structure rather than inventing an incompatible format.

## AI Generation Behavior

AI generation should be deliberate and transparent:

- The client shows that AI generation may call an external API.
- No AI request runs on page load.
- The user can provide a short instruction such as "generate a PRD from the current prototype" or "expand acceptance criteria".
- The server reads `OPENAI_API_KEY` from the environment at request time.
- If no key exists, the UI shows local setup guidance without exposing secrets.
- The server never sends the whole local filesystem. It only sends the current Markdown and explicitly selected project context.

For MVP, project context can be minimal:

- Current PRD Markdown.
- Current page URL.
- Optional user-written product notes.

Later versions can add optional code scanning or route extraction.

## Storage Model

MVP uses a hybrid local storage model:

- Drafts live in `.prototype-prd/current.md`.
- Users can keep `.prototype-prd/` ignored if they want private drafts.
- Exported PRDs live in `docs/prd/`.
- Exported files are intended to be committed and reviewed with the project.

This gives a private scratchpad plus an explicit sharing step. It also prepares the plugin for future storage adapters.

Potential future storage adapters:

- `local`: current MVP file storage.
- `git`: export and version through project Git conventions.
- `remote`: server-backed collaborative documents.

## Error Handling

The UI should make common states obvious:

- Draft read failure: show a retry action and exact safe path.
- Draft save failure: keep unsaved content in memory and show the error.
- Export path conflict: ask whether to overwrite or choose a new slug.
- Missing API key: show that `OPENAI_API_KEY` must be configured locally.
- AI request failure: keep the current PRD unchanged and show a retryable error.
- Network unavailable: editing and local save still work.

The server should return structured JSON errors:

```ts
{
  error: {
    code: string;
    message: string;
  };
}
```

## Security And Privacy

- Do not inject the overlay in production builds.
- Do not expose `OPENAI_API_KEY` to the browser.
- Do not log secrets.
- Restrict file access to the Vite project root.
- Normalize and validate all configured paths.
- Require explicit button clicks for AI generation.
- Keep default project context small and user-visible.

## Testing Strategy

Unit tests:

- Path normalization and project-root escape prevention.
- Draft read/write behavior.
- Export slug generation and conflict handling.
- Structured error responses.

Integration tests:

- Vite dev server loads plugin middleware.
- HTML injection adds the client loader in dev mode.
- Client can load, edit, save, and re-read a draft.
- Missing `OPENAI_API_KEY` produces a safe UI error.

Manual browser checks:

- Floating button appears on a Vite prototype page.
- Drawer opens and closes without breaking page interactions.
- Markdown preview renders correctly.
- Mobile viewport uses full-screen panel.

## Release Shape

The package should be designed for npm publication:

- TypeScript source.
- ESM output.
- `exports` field for the Vite plugin entry.
- Bundled client assets.
- README with install, Vite config, storage behavior, AI setup, and privacy notes.
- Example Vite app for local testing.

## Open Questions

- Final npm package name.
- Whether exported PRD filenames should be timestamped, slug-only, or both.
- Whether the first implementation should include multiple drafts or only one `current.md`.
- Whether AI prompt presets should be configurable in plugin options.

Recommended MVP answers:

- Start with package name `prototype-prd-vite-plugin`.
- Use slug plus date for exports, such as `2026-05-17-my-feature.md`.
- Support one draft file first.
- Ship one default AI prompt preset and make presets configurable later.
