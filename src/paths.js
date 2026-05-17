import path from "node:path";

export function resolveInsideRoot(root, targetPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Path "${targetPath}" escapes the project root.`);
  }

  return resolvedTarget;
}

export function resolveStoragePaths(root, options) {
  return {
    root: path.resolve(root),
    draftPath: resolveInsideRoot(
      root,
      path.join(options.draftDir, options.draftFile)
    ),
    draftDirPath: resolveInsideRoot(root, options.draftDir),
    exportDirPath: resolveInsideRoot(root, options.exportDir)
  };
}

export function slugify(value) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "prd";
}
