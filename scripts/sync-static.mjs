import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const shop = path.join(root, "dist");
const admin = path.join(root, "backoffice", "dist");
const pub = path.join(root, "public");
const adminOut = path.join(pub, "admin");

if (!existsSync(path.join(shop, "index.html"))) {
  throw new Error("Shop build missing. Run vite build first.");
}
if (!existsSync(path.join(admin, "index.html"))) {
  throw new Error("Backoffice build missing. Run npm --prefix backoffice run build first.");
}

cpSync(path.join(shop, "index.html"), path.join(pub, "index.html"));
const shopAssets = path.join(shop, "assets");
if (existsSync(shopAssets)) {
  const dest = path.join(pub, "assets");
  mkdirSync(dest, { recursive: true });
  cpSync(shopAssets, dest, { recursive: true });
}

if (existsSync(adminOut)) rmSync(adminOut, { recursive: true, force: true });
cpSync(admin, adminOut, { recursive: true });
console.log("Synced shop → / and backoffice → /admin");
