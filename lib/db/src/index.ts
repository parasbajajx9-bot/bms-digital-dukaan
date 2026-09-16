import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/bms";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set; using the local fallback database URL.",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
