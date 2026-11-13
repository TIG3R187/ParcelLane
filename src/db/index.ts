import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { readDatabaseUrl } from "@/lib/env-schema";

function createDatabase() {
  return drizzle({ client: neon(readDatabaseUrl(process.env)), schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

// Lazy connection: static public pages build and render without credentials.
export function getDb() {
  database ??= createDatabase();
  return database;
}
