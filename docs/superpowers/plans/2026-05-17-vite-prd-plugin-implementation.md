# Vite PRD Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publishable zero-runtime-dependency npm package that adds a local PRD workbench to Vite dev pages.

**Architecture:** The package exports one Vite plugin from `index.js`. The plugin injects a browser overlay client and registers namespaced dev-server middleware for state, draft read/write, export, and manual AI generation. Client assets are plain browser JavaScript and CSS served from package files.

**Tech Stack:** Node.js ESM, Vite plugin API, native `node:test`, native `fetch`, browser Web Components style isolation with a shadow root.

---

## File Structure

- `package.json`: npm metadata, scripts, peer dependency on Vite.
- `index.js`: public Vite plugin entry.
- `src/config.js`: option normalization and safe defaults.
- `src/paths.js`: project-root-safe path resolution.
- `src/files.js`: draft and export file operations.
- `src/http.js`: JSON request/response helpers.
- `src/openai.js`: manual OpenAI Responses API request helper.
- `src/middleware.js`: local Vite middleware endpoints.
- `client/overlay.js`: browser overlay UI and local endpoint calls.
- `client/overlay.css`: isolated drawer/button styles.
- `test/*.test.js`: Node tests for config, paths, files, OpenAI request shaping, and middleware.
- `examples/basic`: minimal Vite app for manual testing.
- `README.md`: install, config, storage, AI, privacy, and publishing notes.

## Tasks

### Task 1: Package Skeleton And Tests

- [ ] Create `package.json` with ESM package metadata and `node --test` scripts.
- [ ] Create `.gitignore` for local PRD drafts, generated dependencies, and visual brainstorm files.
- [ ] Create `test/config.test.js` for default options.
- [ ] Run `npm test` and confirm it fails because implementation files are missing.
- [ ] Implement `src/config.js`.
- [ ] Run `npm test` and confirm config tests pass.

### Task 2: Safe File Paths

- [ ] Create `test/paths.test.js` for safe project-root path resolution and path traversal rejection.
- [ ] Run `npm test` and confirm path tests fail.
- [ ] Implement `src/paths.js`.
- [ ] Run `npm test` and confirm config and path tests pass.

### Task 3: Draft And Export File Operations

- [ ] Create `test/files.test.js` for starter draft creation, draft save/read, export naming, and overwrite protection.
- [ ] Run `npm test` and confirm file tests fail.
- [ ] Implement `src/files.js`.
- [ ] Run `npm test` and confirm file tests pass.

### Task 4: HTTP And Middleware

- [ ] Create `test/middleware.test.js` for `/state`, `/draft`, draft save, export, and missing API key AI error.
- [ ] Run `npm test` and confirm middleware tests fail.
- [ ] Implement `src/http.js` and `src/middleware.js`.
- [ ] Run `npm test` and confirm middleware tests pass.

### Task 5: Manual OpenAI Generation

- [ ] Create `test/openai.test.js` for Responses API request shape, custom base URL, generated text extraction, and API error mapping.
- [ ] Run `npm test` and confirm OpenAI tests fail.
- [ ] Implement `src/openai.js` using server-side `fetch`.
- [ ] Run `npm test` and confirm OpenAI tests pass without making real network calls.

### Task 6: Vite Plugin Entry And Client Assets

- [ ] Create `test/plugin.test.js` for plugin name, dev-only HTML injection, and middleware registration.
- [ ] Run `npm test` and confirm plugin tests fail.
- [ ] Implement `index.js`.
- [ ] Create `client/overlay.js` and `client/overlay.css`.
- [ ] Run `npm test` and confirm all tests pass.

### Task 7: Example App And Documentation

- [ ] Create `examples/basic` with a minimal Vite app using the plugin.
- [ ] Write `README.md` with install, config, local storage, AI setup, privacy, and npm publish notes.
- [ ] Run `npm test`.
- [ ] Run `npm pack --dry-run`.
- [ ] Review final file list and note that no Git commit was made because the directory is not a Git repository.
