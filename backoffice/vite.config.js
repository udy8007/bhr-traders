import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteApiKeyDefine } from "../scripts/vite-api-key.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.join(root, "..");

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  base: command === "build" ? "/admin/" : "/",
  envDir: repoRoot,
  define: viteApiKeyDefine(mode, repoRoot),
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
}));
