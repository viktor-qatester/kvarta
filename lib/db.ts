import { Pool } from "@neondatabase/serverless";

export function createLeadPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL не настроен");
  }
  return new Pool({ connectionString });
}
