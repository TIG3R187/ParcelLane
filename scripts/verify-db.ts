import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { readDatabaseUrl } from "../src/lib/env-schema";

async function main() {
  config({ path: ".env.local", quiet: true });
  config({ path: ".env", quiet: true });
  const db = drizzle(neon(readDatabaseUrl(process.env)));
  await db.execute(sql`select 1 as connected`);
  const result = await db.execute(
    sql`select table_name from information_schema.tables where table_schema = 'public' and table_name in ('price_rules', 'shipments', 'shipment_details', 'shipment_events', 'enquiries', 'rate_limit_buckets', 'audit_logs', 'auth_user', 'auth_session', 'auth_account', 'auth_verification', 'payments', 'notifications')`,
  );
  if (result.rows.length !== 13) throw new Error("Required tables are missing.");
  console.log("Neon connection verified; all 13 application tables are present.");
}

main().catch(() => {
  // Drivers may embed connection details in errors; never print the raw error.
  console.error(
    "Database verification failed. Check DATABASE_URL, network access, and applied migrations. No credentials were logged.",
  );
  process.exitCode = 1;
});
