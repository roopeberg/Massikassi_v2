import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __massikassiSql: ReturnType<typeof postgres> | undefined;
}

// Reuse the connection across hot reloads / module re-evaluations in dev,
// same rationale as the usual Next.js + Postgres singleton pattern.
const sql =
  globalThis.__massikassiSql ??
  postgres(process.env.DATABASE_URL ?? "postgres://localhost:5432/massikassi", {
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__massikassiSql = sql;
}

export const db = drizzle(sql, { schema });
