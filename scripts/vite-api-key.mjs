import { loadEnv } from "vite";

export function resolveApiKey(mode, root = process.cwd()) {
  const env = loadEnv(mode, root, "");
  return env.VITE_API_KEY || env.API_KEY || (mode === "development" ? "bhr-traders-dev-api-key" : "");
}

export function viteApiKeyDefine(mode, root = process.cwd()) {
  return {
    "import.meta.env.VITE_API_KEY": JSON.stringify(resolveApiKey(mode, root))
  };
}
