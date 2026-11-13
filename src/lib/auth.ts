import "server-only";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { authSecret, siteOrigin } from "@/lib/site-config";
import { HttpError } from "@/lib/http";

function createAuth() {
  return betterAuth({
    appName: "ParcelLane Admin",
    baseURL: siteOrigin(),
    secret: authSecret(),
    database: drizzleAdapter(getDb(), { provider: "pg", schema, transaction: false }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 14,
      maxPasswordLength: 128,
    },
    user: { additionalFields: { role: { type: "string", defaultValue: "staff", input: false } } },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 30, cookieCache: { enabled: false } },
    trustedOrigins: [siteOrigin()],
    // All exposed auth routes are wrapped in our atomic PostgreSQL limiter.
    rateLimit: { enabled: false },
    advanced: {
      useSecureCookies: siteOrigin().startsWith("https:"),
      ipAddress: { disableIpTracking: true },
    },
    logger: { disabled: true },
  });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  auth ??= createAuth();
  return auth;
}
export async function requireAdmin(headers: Headers) {
  if (!/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(headers.get("cookie") || ""))
    throw new HttpError(401, "Administrator sign-in is required.");
  const result = await getAuth().api.getSession({ headers });
  if (!result) throw new HttpError(401, "Administrator sign-in is required.");
  if (result.user.role !== "admin") throw new HttpError(403, "Administrator access is required.");
  return result.user;
}
