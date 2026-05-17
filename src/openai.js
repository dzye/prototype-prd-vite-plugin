const INSTRUCTIONS = `You are a senior product manager helping write a concise product requirements document.
Return only Markdown. Preserve useful existing sections and improve the PRD structure when needed.
Use these sections when applicable: Background, Goals, Non-Goals, Users, User Stories, Functional Requirements, UX Notes, Data And State, Edge Cases, Acceptance Criteria.`;

export async function generatePrdMarkdown({
  apiKey,
  baseURL = "https://api.openai.com/v1",
  model = "gpt-4.1-mini",
  markdown = "",
  instruction = "",
  pageUrl = "",
  notes = "",
  fetchImpl = globalThis.fetch
}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required for AI generation.");
  }

  const response = await fetchImpl(`${baseURL.replace(/\/+$/, "")}/responses`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: INSTRUCTIONS,
      input: buildInput({ markdown, instruction, pageUrl, notes })
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(`OpenAI API request failed: ${message}`);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("OpenAI API response did not contain generated text.");
  }

  return text;
}

export function extractResponseText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload?.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) => item?.content ?? [])
    .filter((content) => content?.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();
}

function buildInput({ markdown, instruction, pageUrl, notes }) {
  return [
    `User instruction:\n${instruction || "Generate or improve this PRD."}`,
    pageUrl ? `Current prototype URL:\n${pageUrl}` : "",
    notes ? `Product notes:\n${notes}` : "",
    `Current PRD Markdown:\n${markdown || "(empty draft)"}`
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}
