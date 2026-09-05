import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteApiKeyDefine } from "../scripts/vite-api-key.mjs";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  publicDir: path.join(repoRoot, "public"),
  envDir: repoRoot,
  define: viteApiKeyDefine(mode, repoRoot),
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
}));
