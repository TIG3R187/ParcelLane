import { z } from "zod";

export const databaseUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return (
      ["postgresql:", "postgres:"].includes(url.protocol) &&
      url.hostname.endsWith(".neon.tech") &&
      ["require", "verify-full"].includes(url.searchParams.get("sslmode") ?? "") &&
      !!url.username &&
      !!url.password
    );
  } catch {
    return false;
  }
}, "Use a Neon PostgreSQL URL with credentials and sslmode=require or verify-full.");

export function readDatabaseUrl(env: Record<string, string | undefined>): string {
  const parsed = databaseUrlSchema.safeParse(env.DATABASE_URL);
  if (!parsed.success) {
    // Do not include Zod input values or credentials in logs or error output.
    throw new Error(
      "Database is not configured. Set a valid Neon DATABASE_URL in .env.local (TLS required).",
    );
  }
  return parsed.data;
}
