import "server-only";
import { createHash, randomBytes } from "node:crypto";
export function trackingIdentifier() {
  return `PLN-${randomBytes(16).toString("hex").toUpperCase()}`;
}
export function accessToken() {
  return randomBytes(32).toString("hex");
}
export function tokenHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
