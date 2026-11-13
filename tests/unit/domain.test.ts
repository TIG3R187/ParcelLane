import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createHmac } from "node:crypto";
import {
  bookingSchema,
  calculatePrice,
  canTransition,
  quoteInputSchema,
} from "../../src/lib/domain";
import { matchesPayment, verifyWebhook } from "../../src/lib/payment-validation";
import { accessToken, tokenHash, trackingIdentifier } from "../../src/lib/tokens";

const quote = {
  service: "nationwide-shipping" as const,
  originCity: "Lagos",
  destinationCity: "Abuja",
  destinationCountry: "NG",
  weightKg: 2.1,
  lengthCm: 20,
  widthCm: 20,
  heightCm: 20,
};
const fixture = {
  ...quote,
  senderName: "Fictional Sender",
  senderEmail: "sender@example.invalid",
  senderPhone: "+234 800 000 0000",
  recipientName: "Fictional Recipient",
  recipientPhone: "+234 800 000 0001",
  pickupAddress: "10 Fictional Test Street",
  destinationAddress: "20 Fictional Test Avenue",
  contents: "Fictional sample documents",
  packageType: "Documents",
  pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  consent: true,
};
describe("shipment boundary and pricing", () => {
  it("uses backend rates and rounds fractional billable kilograms up", () => {
    expect(
      calculatePrice(quote, { basePriceKobo: 100000, perKgKobo: 50000, volumetricDivisor: 5000 }),
    ).toEqual({ amountKobo: 250000, billableKg: 3 });
  });
  it("uses volumetric weight for a large lightweight box", () => {
    expect(
      calculatePrice(
        { ...quote, weightKg: 1, lengthCm: 50, widthCm: 40, heightCm: 30 },
        { basePriceKobo: 100000, perKgKobo: 20000, volumetricDivisor: 5000 },
      ),
    ).toEqual({ amountKobo: 340000, billableKg: 12 });
  });
  it("rejects invalid rules and oversized calculated prices", () => {
    expect(() =>
      calculatePrice(quote, { basePriceKobo: -1, perKgKobo: 10, volumetricDivisor: 5000 }),
    ).toThrow();
    expect(() =>
      calculatePrice(quote, {
        basePriceKobo: 100000000,
        perKgKobo: 10000000,
        volumetricDivisor: 1,
      }),
    ).toThrow();
  });
  it.each([
    { weightKg: 0 },
    { widthCm: -1 },
    { lengthCm: Infinity },
    { destinationCountry: "NGA" },
    { originCity: "10 Private Street" },
    { service: "food-delivery" },
  ])("rejects unsafe measurements or route input %j", (patch) => {
    expect(quoteInputSchema.safeParse({ ...quote, ...patch }).success).toBe(false);
  });
  it("does not accept client-controlled totals, payment status or admin role", () => {
    const parsed = bookingSchema.parse({
      ...fixture,
      quotedPriceKobo: 1,
      paymentStatus: "paid",
      role: "admin",
    });
    expect(parsed).not.toHaveProperty("quotedPriceKobo");
    expect(parsed).not.toHaveProperty("paymentStatus");
    expect(parsed).not.toHaveProperty("role");
  });
  it.each([
    { consent: false },
    { website: "spam.example" },
    { senderEmail: "not-email" },
    { senderPhone: "<script>" },
    { pickupDate: "2000-01-01" },
  ])("rejects incomplete consent and invalid contact input %j", (patch) => {
    expect(bookingSchema.safeParse({ ...fixture, ...patch }).success).toBe(false);
  });
});
describe("shipment state transitions", () => {
  it("requires review before collection and transit before delivery", () => {
    expect(canTransition("pending_review", "delivered")).toBe(false);
    expect(canTransition("pending_review", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "collected")).toBe(true);
    expect(canTransition("collected", "in_transit")).toBe(true);
    expect(canTransition("in_transit", "delivered")).toBe(true);
  });
  it("keeps final states closed", () => {
    expect(canTransition("delivered", "in_transit")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });
});
describe("unguessable identifiers", () => {
  it("generates unique tracking identifiers and separate hashed access tokens", () => {
    const ids = new Set(Array.from({ length: 200 }, trackingIdentifier));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^PLN-[A-F0-9]{32}$/);
    const token = accessToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash(token)).not.toBe(token);
    expect(tokenHash(token)).toHaveLength(64);
  });
});
describe("Paystack verification", () => {
  const reference = "PLPAY-" + "a".repeat(48);
  const expected = { reference, amountKobo: 500000, currency: "NGN" };
  const verified = {
    status: true,
    data: {
      id: 123,
      domain: "test",
      status: "success",
      reference,
      amount: 500000,
      currency: "NGN",
    },
  };
  it("accepts only a matching successful test transaction", () => {
    expect(matchesPayment(verified, expected)?.id).toBe(123);
  });
  it.each([
    { amount: 1 },
    { currency: "USD" },
    { reference: "PLPAY-" + "b".repeat(48) },
    { domain: "live" },
    { status: "pending" },
  ])("rejects mismatched transaction data %j", (patch) => {
    expect(
      matchesPayment({ ...verified, data: { ...verified.data, ...patch } }, expected),
    ).toBeNull();
  });
  it("authenticates legacy raw-body signatures and rejects tampering", () => {
    const raw = Buffer.from('{"event":"charge.success"}');
    const key = "sk_test_fictional_unit_key";
    const signature = createHmac("sha512", key).update(raw).digest("hex");
    expect(verifyWebhook(raw, new Headers({ "x-paystack-signature": signature }), key)).toBe(true);
    expect(
      verifyWebhook(
        Buffer.from(raw.toString() + " "),
        new Headers({ "x-paystack-signature": signature }),
        key,
      ),
    ).toBe(false);
    expect(verifyWebhook(raw, new Headers({ "x-paystack-signature": "0" }), key)).toBe(false);
  });
  it("checks modern timestamp signatures, supports rotation entries and refuses downgrade", () => {
    const raw = Buffer.from('{"event":"ping"}');
    const secret = "whsec_fictional_unit_key";
    const now = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha512", secret)
      .update(String(now) + ".")
      .update(raw)
      .digest("hex");
    const headers = new Headers({
      "paystack-signature": `t=${now},v1=whk_old:${"0".repeat(128)},v1=whk_test:${signature}`,
    });
    expect(verifyWebhook(raw, headers, "sk_test_fictional", secret, now)).toBe(true);
    expect(verifyWebhook(raw, headers, "sk_test_fictional", secret, now + 301)).toBe(false);
    expect(verifyWebhook(raw, new Headers(), "sk_test_fictional", secret)).toBe(false);
  });
});
