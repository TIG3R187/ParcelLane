import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { payments, shipmentDetails, shipments } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { matchesPayment } from "@/lib/payment-validation";
import { siteOrigin } from "@/lib/site-config";
import { tokenHash } from "@/lib/tokens";

export function paystackKey() {
  if (process.env.PAYSTACK_ENABLED !== "true")
    throw new HttpError(503, "Online test payments are not enabled.");
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key?.startsWith("sk_test_") || key.length < 20)
    throw new HttpError(503, "A Paystack test secret key is required.");
  return key;
}
async function paystack(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${paystackKey()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new HttpError(502, "Paystack could not complete this request. Please try again later.");
  return response.json();
}
export async function initializePayment(trackingNumber: string, token: string) {
  paystackKey();
  const db = getDb();
  const [shipment] = await db
    .select({
      id: shipments.id,
      amountKobo: shipments.quotedPriceKobo,
      status: shipments.status,
      paymentStatus: shipments.paymentStatus,
      email: shipmentDetails.senderEmail,
    })
    .from(shipments)
    .innerJoin(shipmentDetails, eq(shipments.id, shipmentDetails.shipmentId))
    .where(
      and(
        eq(shipments.trackingNumber, trackingNumber),
        eq(shipments.accessTokenHash, tokenHash(token)),
      ),
    )
    .limit(1);
  if (!shipment) throw new HttpError(404, "Payment access could not be verified.");
  if (shipment.status !== "confirmed" || shipment.paymentStatus === "paid" || !shipment.amountKobo)
    throw new HttpError(409, "Payment requires an approved, unpaid shipping quote.");
  const [existing] = await db
    .select({ authorizationUrl: payments.authorizationUrl })
    .from(payments)
    .where(and(eq(payments.shipmentId, shipment.id), eq(payments.status, "pending")))
    .limit(1);
  if (existing?.authorizationUrl) return existing.authorizationUrl;
  if (existing)
    throw new HttpError(
      409,
      "A payment is being prepared. Try again shortly or contact the business.",
    );
  const reference = `PLPAY-${randomBytes(24).toString("hex")}`;
  const result = await db.execute(sql`
    WITH locked AS (SELECT id, quoted_price_kobo FROM shipments WHERE id = ${shipment.id}::uuid AND status = 'confirmed' AND payment_status = 'unpaid' AND quoted_price_kobo = ${shipment.amountKobo} FOR UPDATE),
    created AS (INSERT INTO payments (shipment_id, reference, amount_kobo) SELECT id, ${reference}, quoted_price_kobo FROM locked RETURNING id),
    changed AS (UPDATE shipments SET payment_status = 'pending', updated_at = now() WHERE id IN (SELECT id FROM locked) AND EXISTS (SELECT 1 FROM created))
    SELECT id FROM created`);
  if (!result.rows.length) throw new HttpError(409, "The quote changed. Refresh before paying.");
  try {
    const response = z
      .object({
        status: z.literal(true),
        data: z.object({ authorization_url: z.url(), reference: z.string() }),
      })
      .parse(
        await paystack("/transaction/initialize", {
          email: shipment.email,
          amount: shipment.amountKobo,
          currency: "NGN",
          reference,
          callback_url: `${siteOrigin()}/payment/callback`,
        }),
      );
    const url = new URL(response.data.authorization_url);
    if (
      response.data.reference !== reference ||
      url.protocol !== "https:" ||
      url.hostname !== "checkout.paystack.com"
    )
      throw new Error("Invalid checkout response");
    await db
      .update(payments)
      .set({ authorizationUrl: url.href })
      .where(eq(payments.reference, reference));
    return url.href;
  } catch {
    // Keep an uncertain initialization pending. Reconcile by reference before
    // creating a replacement: a timeout may occur after Paystack creates it.
    throw new HttpError(
      502,
      "Payment preparation is uncertain. Contact the business before starting another payment.",
    );
  }
}
export async function confirmPayment(reference: string) {
  const [payment] = await getDb()
    .select()
    .from(payments)
    .where(eq(payments.reference, reference))
    .limit(1);
  if (!payment) throw new HttpError(404, "Payment reference not found.");
  if (payment.status === "paid") return true;
  const verified = matchesPayment(
    await paystack(`/transaction/verify/${encodeURIComponent(reference)}`),
    payment,
  );
  if (!verified)
    throw new HttpError(409, "Payment is not yet verified. No payment status was changed.");
  const result = await getDb().execute(sql`
    WITH changed AS (
      UPDATE payments SET status = 'paid', provider_transaction_id = ${String(verified.id)}, paid_at = now()
      WHERE reference = ${reference} AND status = 'pending' AND amount_kobo = ${verified.amount} AND currency = 'NGN'
      RETURNING id, shipment_id
    ), shipment AS (
      UPDATE shipments SET payment_status = 'paid', updated_at = now() WHERE id IN (SELECT shipment_id FROM changed)
    ), audit AS (
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) SELECT 'paystack:test', 'payment.confirmed', 'payment', id::text FROM changed
    ), mail AS (
      INSERT INTO notifications (shipment_id, recipient, subject, body)
      SELECT c.shipment_id, d.sender_email, 'ParcelLane test payment confirmed', 'Your test payment has been verified. This is a test-mode transaction, not a live charge.' FROM changed c JOIN shipment_details d ON d.shipment_id = c.shipment_id
    ) SELECT id FROM changed`);
  if (result.rows.length) return true;
  const [latest] = await getDb()
    .select({ status: payments.status })
    .from(payments)
    .where(eq(payments.reference, reference))
    .limit(1);
  return latest?.status === "paid";
}
