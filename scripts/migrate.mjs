import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(join(root, ".env.local"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан. Добавьте его в .env.local");
  process.exit(1);
}

const sqlPath = join(root, "db", "migrations", "001_leads.sql");
const ddl = readFileSync(sqlPath, "utf8");
const statements = ddl
  .split(";")
  .map((part) => part.replace(/--[^\n]*/g, "").trim())
  .filter(Boolean);

const sql = neon(databaseUrl);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Миграция применена: ${statements.length} операций из 001_leads.sql`);
