import { readFileSync } from "fs";
import { applySchema } from "../server/lib/applySchema.js";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* missing file */
  }
}

loadEnv(".env.local");
loadEnv("server/.env.local");

try {
  await applySchema();
  console.log("Schema applied.");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
