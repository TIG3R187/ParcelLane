import { describe, expect, it } from "vitest";
import { trackingNumberSchema, quotePreviewSchema } from "../../src/lib/validation";
import { readDatabaseUrl } from "../../src/lib/env-schema";

describe("tracking input boundary", () => {
  it("normalises harmless formatting without inventing a tracking record", () => {
    expect(trackingNumberSchema.parse("  pln-demo-123  ")).toBe("PLN-DEMO-123");
  });
  it.each([
    "",
    "ABC",
    "A".repeat(41),
    "<script>alert(1)</script>",
    "PLN/../../admin",
    ["PLN123456"],
    null,
  ])("rejects malformed input %j", (input) => {
    expect(trackingNumberSchema.safeParse(input).success).toBe(false);
  });
});

describe("quote planning boundary", () => {
  it("accepts only planning selections and discards client price fields", () => {
    expect(
      quotePreviewSchema.parse({
        from: "Lagos",
        to: "Abuja",
        weight: "2–5 kg",
        price: 1,
        paymentStatus: "paid",
      }),
    ).toEqual({ service: "nationwide-shipping", from: "Lagos", to: "Abuja", weight: "2–5 kg" });
  });
  it.each([
    { from: "<script>" },
    { service: "food-delivery" },
    { weight: "-1" },
    { from: ["Lagos", "Abuja"] },
  ])("rejects unsupported selections %j", (input) => {
    expect(quotePreviewSchema.safeParse(input).success).toBe(false);
  });
});

describe("database configuration boundary", () => {
  it("accepts a TLS Neon connection (fictional credentials)", () => {
    const url =
      "postgresql://fictional_user:fictional_password@ep-demo.neon.tech/neondb?sslmode=require";
    expect(readDatabaseUrl({ DATABASE_URL: url })).toBe(url);
  });
  it.each([
    undefined,
    "",
    "postgresql://demo:demo@localhost/test",
    "postgresql://demo:demo@ep-demo.neon.tech/test",
    "https://demo:demo@ep-demo.neon.tech/test?sslmode=require",
    "postgresql://demo:demo@neon.tech.attacker.example/test?sslmode=require",
  ])("rejects missing or insecure configuration %j", (url) => {
    expect(() => readDatabaseUrl({ DATABASE_URL: url })).toThrow("Database is not configured");
  });
  it("does not include sensitive input in configuration errors", () => {
    try {
      readDatabaseUrl({ DATABASE_URL: "a-secret-value-that-is-not-a-url" });
      expect.fail("Expected invalid configuration to throw");
    } catch (error) {
      expect(String(error)).not.toContain("a-secret-value-that-is-not-a-url");
    }
  });
});
