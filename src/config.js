const DEFAULT_OPTIONS = {
  draftDir: ".prototype-prd",
  draftFile: "current.md",
  exportDir: "docs/prd",
  defaultTitle: "Product Requirements Document",
  ai: {
    enabled: true,
    trigger: "manual",
    model: "gpt-4.1-mini",
    baseURL: "https://api.openai.com/v1"
  }
};

export function normalizeOptions(userOptions = {}, command = "serve") {
  const ai = {
    ...DEFAULT_OPTIONS.ai,
    ...(userOptions.ai ?? {}),
    trigger: "manual"
  };

  return {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    enabled: userOptions.enabled ?? command === "serve",
    ai
  };
}
