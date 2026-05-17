const API = "/__prototype_prd__";
const CSS_URL = "/__prototype_prd__/client/overlay.css";

const host = document.createElement("prototype-prd-overlay");
const shadow = host.attachShadow({ mode: "open" });
document.documentElement.append(host);

shadow.innerHTML = `
  <link rel="stylesheet" href="${CSS_URL}">
  <button class="toggle" type="button">PRD</button>
  <aside class="drawer" aria-label="PRD workbench">
    <header class="header">
      <div class="title-row">
        <h2>Prototype PRD</h2>
        <button class="close" type="button" aria-label="Close PRD panel">Close</button>
      </div>
      <div class="status">Loading local draft...</div>
    </header>
    <nav class="tabs">
      <button class="tab active" type="button" data-tab="edit">Edit</button>
      <button class="tab" type="button" data-tab="preview">Preview</button>
      <button class="tab" type="button" data-tab="generate">Generate</button>
    </nav>
    <main class="content"></main>
    <footer class="footer">
      <button class="primary save" type="button">Save draft</button>
      <button class="export" type="button">Export docs</button>
      <button class="copy" type="button">Copy Markdown</button>
    </footer>
  </aside>
`;

const state = {
  open: false,
  tab: "edit",
  title: "Product Requirements Document",
  markdown: "",
  aiConfigured: false
};

const elements = {
  toggle: shadow.querySelector(".toggle"),
  drawer: shadow.querySelector(".drawer"),
  close: shadow.querySelector(".close"),
  status: shadow.querySelector(".status"),
  tabs: [...shadow.querySelectorAll(".tab")],
  content: shadow.querySelector(".content"),
  save: shadow.querySelector(".save"),
  export: shadow.querySelector(".export"),
  copy: shadow.querySelector(".copy")
};

elements.toggle.addEventListener("click", () => setOpen(true));
elements.close.addEventListener("click", () => setOpen(false));
elements.save.addEventListener("click", saveDraft);
elements.export.addEventListener("click", exportDocs);
elements.copy.addEventListener("click", copyMarkdown);
elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.tab = tab.dataset.tab;
    render();
  });
});

boot();

async function boot() {
  try {
    const appState = await request("/state");
    const draft = await request("/draft");
    state.title = appState.title;
    state.aiConfigured = appState.ai.configured;
    state.markdown = draft.markdown;
    setStatus(draft.exists ? "Loaded local draft." : "Started from PRD template.");
    render();
  } catch (error) {
    setStatus(error.message);
    render();
  }
}

function setOpen(open) {
  state.open = open;
  elements.drawer.classList.toggle("open", open);
}

function render() {
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === state.tab);
  });

  if (state.tab === "edit") {
    elements.content.innerHTML = `<textarea aria-label="PRD Markdown"></textarea>`;
    const textarea = elements.content.querySelector("textarea");
    textarea.value = state.markdown;
    textarea.addEventListener("input", () => {
      state.markdown = textarea.value;
      setStatus("Unsaved changes.");
    });
    return;
  }

  if (state.tab === "preview") {
    elements.content.innerHTML = `<article class="preview">${renderMarkdown(state.markdown)}</article>`;
    return;
  }

  elements.content.innerHTML = `
    <p class="hint">AI generation only runs when you click the button. The request is sent from the local Vite dev server, not the browser.</p>
    <label>Instruction
      <input class="instruction" value="Generate or improve this PRD from the current draft.">
    </label>
    <label>Product notes
      <textarea class="notes" style="min-height:120px" placeholder="Optional notes about this prototype"></textarea>
    </label>
    <button class="primary generate" type="button">Generate Markdown</button>
  `;
  elements.content.querySelector(".generate").addEventListener("click", generate);
}

async function saveDraft() {
  try {
    await request("/draft", {
      method: "PUT",
      body: { markdown: state.markdown }
    });
    setStatus("Draft saved locally.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function exportDocs() {
  try {
    const result = await request("/export", {
      method: "POST",
      body: { markdown: state.markdown, title: state.title }
    });
    setStatus(`Exported ${result.fileName}.`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function copyMarkdown() {
  await navigator.clipboard.writeText(state.markdown);
  setStatus("Markdown copied.");
}

async function generate() {
  const instruction = elements.content.querySelector(".instruction").value;
  const notes = elements.content.querySelector(".notes").value;

  try {
    setStatus("Generating with AI...");
    const result = await request("/ai/generate", {
      method: "POST",
      body: {
        markdown: state.markdown,
        instruction,
        notes,
        pageUrl: window.location.href
      }
    });
    state.markdown = result.markdown;
    state.tab = "edit";
    setStatus("AI generated Markdown. Review before saving.");
    render();
  } catch (error) {
    setStatus(error.message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "content-type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Prototype PRD request failed.");
  }

  return payload;
}

function setStatus(message) {
  elements.status.textContent = message;
}

function renderMarkdown(markdown) {
  return escapeHtml(markdown)
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^\- (.*)$/gm, "<li>$1</li>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<h|<li|<\/p>)(.+)$/gm, "<p>$1</p>");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
