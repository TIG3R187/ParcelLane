import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const paymentReferenceSchema = z.string().regex(/^PLPAY-[a-f0-9]{48}$/);
export const verifiedPaymentSchema = z.object({
  status: z.literal(true),
  data: z.object({
    id: z.union([z.number().int().positive(), z.string().min(1)]),
    domain: z.literal("test"),
    status: z.literal("success"),
    reference: paymentReferenceSchema,
    amount: z.number().int().positive(),
    currency: z.literal("NGN"),
  }),
});
export function matchesPayment(
  raw: unknown,
  expected: { reference: string; amountKobo: number; currency: string },
) {
  const result = verifiedPaymentSchema.safeParse(raw);
  return result.success &&
    result.data.data.reference === expected.reference &&
    result.data.data.amount === expected.amountKobo &&
    result.data.data.currency === expected.currency
    ? result.data.data
    : null;
}
function compare(expected: Buffer, received: string) {
  return (
    /^[a-f0-9]{128}$/.test(received) && timingSafeEqual(expected, Buffer.from(received, "hex"))
  );
}
export function verifyWebhook(
  raw: Buffer,
  headers: Headers,
  apiSecret: string,
  webhookSecret?: string,
  now = Math.floor(Date.now() / 1000),
) {
  const modern = headers.get("paystack-signature");
  if (modern) {
    if (!webhookSecret?.startsWith("whsec_")) return false;
    const entries = modern.split(",").map((p) => p.trim());
    const times = entries.filter((p) => p.startsWith("t="));
    if (times.length !== 1 || !/^t=\d+$/.test(times[0]!)) return false;
    const timestamp = times[0]!.slice(2);
    if (!Number.isSafeInteger(Number(timestamp)) || Math.abs(now - Number(timestamp)) > 300)
      return false;
    const expected = createHmac("sha512", webhookSecret)
      .update(timestamp + ".")
      .update(raw)
      .digest();
    return entries
      .filter((p) => p.startsWith("v1=whk_"))
      .some((p) => {
        const colon = p.indexOf(":");
        return colon > 0 && compare(expected, p.slice(colon + 1));
      });
  }
  // A configured modern secret must never silently downgrade to legacy signing.
  if (webhookSecret) return false;
  return compare(
    createHmac("sha512", apiSecret).update(raw).digest(),
    headers.get("x-paystack-signature") || "",
  );
}
