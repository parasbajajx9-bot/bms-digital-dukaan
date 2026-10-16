import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL is not set; database-backed routes will be unavailable.",
  );
}

export const pool = new Pool(databaseUrl ? { connectionString: databaseUrl } : {});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
