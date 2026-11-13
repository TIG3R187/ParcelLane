import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { readDatabaseUrl } from "./src/lib/env-schema";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
const needsConnection = process.argv.some((arg) =>
  ["migrate", "push", "pull", "studio"].includes(arg),
);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(needsConnection ? { dbCredentials: { url: readDatabaseUrl(process.env) } } : {}),
  strict: true,
  verbose: false,
});
