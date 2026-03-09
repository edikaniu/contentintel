import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Explicitly configure SSL to avoid pg deprecation warning about sslmode aliases.
// Vercel Postgres / Neon requires SSL in production.
const isLocalhost = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
