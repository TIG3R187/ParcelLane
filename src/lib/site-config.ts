import "server-only";
import { z } from "zod";

export function siteOrigin() {
  const deploymentOrigin =
    process.env.VERCEL === "1" &&
    (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL);
  const value =
    process.env.BETTER_AUTH_URL ||
    (deploymentOrigin ? `https://${deploymentOrigin}` : process.env.NEXT_PUBLIC_SITE_URL) ||
    "http://localhost:3000";
  const url = new URL(z.url().parse(value));
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  )
    throw new Error("Invalid site origin");
  if (process.env.VERCEL === "1" && url.protocol !== "https:")
    throw new Error("HTTPS site origin required");
  return url.origin;
}
export function authSecret() {
  const result = z.string().min(43).safeParse(process.env.BETTER_AUTH_SECRET);
  if (!result.success) throw new Error("Administrator authentication is not configured.");
  return result.data;
}
export function publicRequestsEnabled() {
  return (
    process.env.PUBLIC_REQUESTS_ENABLED === "true" &&
    process.env.LEGAL_APPROVED === "true" &&
    !!process.env.BUSINESS_NAME &&
    !!process.env.BUSINESS_EMAIL &&
    !!process.env.BUSINESS_PHONE &&
    !!process.env.BUSINESS_ADDRESS &&
    !!process.env.BUSINESS_COVERAGE
  );
}
export function businessConfig() {
  return {
    name: process.env.BUSINESS_NAME || "ParcelLane",
    email: z.email().safeParse(process.env.BUSINESS_EMAIL).success
      ? process.env.BUSINESS_EMAIL
      : undefined,
    phone: process.env.BUSINESS_PHONE,
    address: process.env.BUSINESS_ADDRESS,
    coverage: process.env.BUSINESS_COVERAGE,
    legalApproved: process.env.LEGAL_APPROVED === "true",
    live: publicRequestsEnabled(),
  };
}
