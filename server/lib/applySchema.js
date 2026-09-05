import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILES = [
  path.join(root, "server", "supabase", "schema.sql"),
  path.join(root, "server", "supabase", "schema-admin.sql")
];

function pgConfig() {
  if (process.env.DATABASE_URL && /^postgres/i.test(process.env.DATABASE_URL)) {
    return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 };
  }
  const password = String(process.env.SUPABASE_DB_PASSWORD || "").trim();
  if (!password) return null;
  return {
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.akfrbpdxrbhuxqehpfqv",
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000
  };
}

export async function applySchema() {
  const config = pgConfig();
  if (!config) {
    throw new Error(
      "products table is missing. Add SUPABASE_DB_PASSWORD in .env.local from Supabase → Project Settings → Database (Database password), then restart. This is not the API secret key."
    );
  }
  const client = new pg.Client(config);
  await client.connect();
  try {
    for (const file of FILES) {
      await client.query(readFileSync(file, "utf8"));
    }
    await client.query("notify pgrst, 'reload schema'");
  } finally {
    await client.end();
  }
}

export function isMissingTableError(err) {
  const msg = String(err?.message || err || "");
  return /Could not find the table|schema cache|does not exist/i.test(msg);
}
