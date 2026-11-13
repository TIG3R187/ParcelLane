import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications, priceRules, shipmentDetails, shipmentEvents, shipments } from "@/db/schema";
import { bookingSchema, calculatePrice, type BookingInput, type QuoteInput } from "@/lib/domain";
import { HttpError } from "@/lib/http";
import { accessToken, tokenHash, trackingIdentifier } from "@/lib/tokens";
import { deliverNotification } from "@/lib/notifications";

export async function estimateShipment(input: QuoteInput) {
  if (input.service === "international-cargo" || input.destinationCountry !== "NG") return null;
  const [rule] = await getDb()
    .select()
    .from(priceRules)
    .where(
      and(
        eq(priceRules.active, true),
        eq(priceRules.service, input.service),
        sql`lower(${priceRules.originZone}) = lower(${input.originCity})`,
        sql`lower(${priceRules.destinationZone}) = lower(${input.destinationCity})`,
      ),
    )
    .orderBy(desc(priceRules.version), desc(priceRules.createdAt))
    .limit(1);
  if (!rule) return null;
  try {
    return { ...calculatePrice(input, rule), priceRuleId: rule.id, priceRuleVersion: rule.version };
  } catch {
    return null;
  }
}
export async function createShipment(raw: BookingInput, actorUserId?: string) {
  const input = bookingSchema.parse(raw);
  if (input.service !== "international-cargo" && input.destinationCountry !== "NG")
    throw new HttpError(400, "Choose international cargo for a destination outside Nigeria.");
  const estimate = await estimateShipment(input);
  const id = randomUUID();
  const trackingNumber = trackingIdentifier();
  const token = accessToken();
  const notificationId = randomUUID();
  const db = getDb();
  const shipment = {
    id,
    trackingNumber,
    service: input.service,
    status: "pending_review" as const,
    paymentStatus: "not_required" as const,
    originCity: input.originCity,
    destinationCity: input.destinationCity,
    destinationCountry: input.destinationCountry,
    quotedPriceKobo: estimate?.amountKobo ?? null,
    priceRuleId: estimate?.priceRuleId,
    priceRuleVersion: estimate?.priceRuleVersion,
    requestKind: input.requestKind,
    accessTokenHash: tokenHash(token),
    pickupDate: input.pickupDate,
  };
  const details = {
    shipmentId: id,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    senderPhone: input.senderPhone,
    pickupAddress: input.pickupAddress,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    destinationAddress: input.destinationAddress,
    packageType: input.packageType,
    contents: input.contents,
    weightGrams: Math.round(input.weightKg * 1000),
    lengthMm: Math.round(input.lengthCm * 10),
    widthMm: Math.round(input.widthCm * 10),
    heightMm: Math.round(input.heightCm * 10),
    deliveryInstructions: input.deliveryInstructions,
  };
  const batch = [
    db.insert(shipments).values(shipment),
    db.insert(shipmentDetails).values(details),
    db.insert(shipmentEvents).values({ shipmentId: id, status: "pending_review", actorUserId }),
    db.insert(notifications).values({
      id: notificationId,
      shipmentId: id,
      recipient: input.senderEmail,
      subject: "Your ParcelLane request",
      body: `Your request has been received for review. Your tracking number is ${trackingNumber}. Collection and pricing must be confirmed before shipment. Save this tracking number. No payment has been taken.`,
    }),
  ] as const;
  // Neon HTTP batch executes all writes in a single PostgreSQL transaction.
  if (actorUserId) {
    await db.batch([
      ...batch,
      db.execute(
        sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES (${actorUserId}, 'shipment.create', 'shipment', ${id})`,
      ),
    ]);
  } else {
    await db.batch(batch);
  }
  await deliverNotification(notificationId).catch(() => undefined);
  return {
    id,
    trackingNumber,
    accessToken: token,
    estimatedAmountKobo: estimate?.amountKobo ?? null,
  };
}
export async function publicTracking(trackingNumber: string) {
  const [shipment] = await getDb()
    .select({
      id: shipments.id,
      trackingNumber: shipments.trackingNumber,
      service: shipments.service,
      status: shipments.status,
      originCity: shipments.originCity,
      destinationCity: shipments.destinationCity,
    })
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber))
    .limit(1);
  if (!shipment) return null;
  const history = await getDb()
    .select({ status: shipmentEvents.status, occurredAt: shipmentEvents.occurredAt })
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, shipment.id))
    .orderBy(asc(shipmentEvents.occurredAt), asc(shipmentEvents.id));
  // Explicit public projection: no details, payment state, internal note or user id.
  return {
    trackingNumber: shipment.trackingNumber,
    service: shipment.service,
    status: shipment.status,
    history,
  };
}
