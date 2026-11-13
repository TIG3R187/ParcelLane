import { z } from "zod";
import { apiError, HttpError } from "@/lib/http";
import { confirmPayment, paystackKey } from "@/lib/payments";
import { paymentReferenceSchema, verifyWebhook } from "@/lib/payment-validation";

export async function POST(request: Request) {
  try {
    const key = paystackKey();
    if (Number(request.headers.get("content-length") || "0") > 65_536)
      throw new HttpError(413, "Event is too large.");
    if (!request.body) throw new HttpError(400, "Missing event.");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 65_536) {
        await reader.cancel();
        throw new HttpError(413, "Event is too large.");
      }
      chunks.push(chunk.value);
    }
    const raw = Buffer.concat(chunks);
    if (!verifyWebhook(raw, request.headers, key, process.env.PAYSTACK_WEBHOOK_SECRET || undefined))
      throw new HttpError(401, "Invalid event signature.");
    let event: unknown;
    try {
      event = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new HttpError(400, "Invalid event JSON.");
    }
    const parsed = z.object({ event: z.string(), data: z.unknown().optional() }).safeParse(event);
    if (!parsed.success) throw new HttpError(400, "Invalid event.");
    if (parsed.data.event === "charge.success") {
      const charge = z.object({ reference: paymentReferenceSchema }).safeParse(parsed.data.data);
      if (!charge.success) throw new HttpError(400, "Invalid payment reference.");
      await confirmPayment(charge.data.reference);
    }
    return Response.json({ received: true });
  } catch (error) {
    return apiError(error);
  }
}
