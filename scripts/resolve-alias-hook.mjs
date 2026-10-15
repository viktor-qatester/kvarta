import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function candidatesForBase(basePath) {
  return [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const subpath = specifier.slice(2);
    for (const file of candidatesForBase(path.join(root, subpath))) {
      try {
        return await nextResolve(pathToFileURL(file).href, context);
      } catch {
        // try next candidate
      }
    }
  }

  if (
    specifier.startsWith("./") ||
    specifier.startsWith("../")
  ) {
    const parent = path.dirname(fileURLToPath(context.parentURL));
    for (const file of candidatesForBase(path.resolve(parent, specifier))) {
      try {
        return await nextResolve(pathToFileURL(file).href, context);
      } catch {
        // try next candidate
      }
    }
  }

  return nextResolve(specifier, context, nextResolve);
}
