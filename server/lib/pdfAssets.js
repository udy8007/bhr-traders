import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LIB = path.dirname(fileURLToPath(import.meta.url));

function firstExisting(files) {
  return files.find((file) => file && existsSync(file)) || "";
}

/** Vercel lambdas run from cwd; import.meta.url still points at the build dir (/vercel/path0). */
export function findPdfLogo() {
  return firstExisting([
    path.join(process.cwd(), "server", "assets", "logo.png"),
    path.join(process.cwd(), "public", "images", "logo.png"),
    path.join(LIB, "..", "assets", "logo.png"),
    path.join(LIB, "..", "..", "public", "images", "logo.png")
  ]);
}

export function readPdfFont(name) {
  const file = firstExisting([
    path.join(process.cwd(), "server", "lib", "fonts", name),
    path.join(process.cwd(), "lib", "fonts", name),
    path.join(LIB, "fonts", name)
  ]);
  if (!file) {
    throw new Error("PDF font missing: " + name);
  }
  return readFileSync(file);
}
