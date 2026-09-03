import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  publicDir: path.join(root, "public"),
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
