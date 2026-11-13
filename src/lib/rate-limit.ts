import "server-only";
import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { authSecret } from "@/lib/site-config";
import { HttpError } from "@/lib/http";

export function clientKey(headers: Headers) {
  // Vercel overwrites this header. Outside Vercel, use a shared bucket instead
  // of trusting client-supplied forwarding headers.
  return process.env.VERCEL === "1"
    ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "shared"
    : "shared";
}
export async function rateLimit(scope: string, key: string, max = 10, windowSeconds = 60) {
  const hash = createHmac("sha256", authSecret()).update(`${scope}:${key}`).digest("hex");
  const result = await getDb().execute(sql`
    INSERT INTO rate_limit_buckets (scope, key_hash, count, reset_at)
    VALUES (${scope}, ${hash}, 1, now() + ${windowSeconds} * interval '1 second')
    ON CONFLICT (scope, key_hash) DO UPDATE SET
      count = CASE WHEN rate_limit_buckets.reset_at <= now() THEN 1 ELSE LEAST(rate_limit_buckets.count + 1, ${max + 1}) END,
      reset_at = CASE WHEN rate_limit_buckets.reset_at <= now() THEN now() + ${windowSeconds} * interval '1 second' ELSE rate_limit_buckets.reset_at END
    RETURNING count`);
  if (Number(result.rows[0]?.count) > max)
    throw new HttpError(429, "Too many requests. Please wait a minute and try again.");
}
