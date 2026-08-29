import path from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";

const root = path.dirname(fileURLToPath(import.meta.url));
nextEnv.loadEnvConfig(path.join(root, "server"));
nextEnv.loadEnvConfig(root);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: root,
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js", "node-cron", "pg"],
  outputFileTracingIncludes: {
    "/*": [
      "./server/lib/fonts/**",
      "./server/assets/**",
      "./public/images/logo.png",
      "./node_modules/pdfkit/**"
    ]
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin/index.html" },
      { source: "/admin/", destination: "/admin/index.html" }
    ];
  }
};

export default nextConfig;
