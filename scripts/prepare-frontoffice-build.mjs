import { existsSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const appOut = path.join(root, "public", "app");

if (existsSync(appOut)) {
  rmSync(appOut, { recursive: true, force: true });
  console.log("Removed public/app before frontoffice build (prevents nested copy).");
}
