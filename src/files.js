import { constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { slugify } from "./paths.js";

const STARTER_SECTIONS = [
  "Background",
  "Goals",
  "Non-Goals",
  "Users",
  "User Stories",
  "Functional Requirements",
  "UX Notes",
  "Data And State",
  "Edge Cases",
  "Acceptance Criteria"
];

export function getStarterMarkdown(title = "Product Requirements Document") {
  const safeTitle = String(title || "Product Requirements Document").trim();
  const sections = STARTER_SECTIONS.map((section) => `## ${section}\n`).join("\n");

  return `# ${safeTitle}\n\n${sections}`;
}

export async function readDraft(storagePaths, title) {
  try {
    const markdown = await readFile(storagePaths.draftPath, "utf8");
    return { exists: true, markdown, path: storagePaths.draftPath };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    return {
      exists: false,
      markdown: getStarterMarkdown(title),
      path: storagePaths.draftPath
    };
  }
}

export async function saveDraft(storagePaths, markdown) {
  await mkdir(path.dirname(storagePaths.draftPath), { recursive: true });
  await writeFile(storagePaths.draftPath, String(markdown ?? ""), "utf8");

  return { path: storagePaths.draftPath };
}

export async function exportPrd(
  storagePaths,
  { markdown, title, date = new Date().toISOString().slice(0, 10), overwrite = false }
) {
  await mkdir(storagePaths.exportDirPath, { recursive: true });

  const fileName = `${date}-${slugify(title)}.md`;
  const targetPath = path.join(storagePaths.exportDirPath, fileName);

  if (!overwrite) {
    try {
      await access(targetPath, fsConstants.F_OK);
      throw new Error(`Export file "${fileName}" already exists.`);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  await writeFile(targetPath, String(markdown ?? ""), "utf8");

  return { fileName, path: targetPath };
}
