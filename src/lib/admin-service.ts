import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminOperationSchema, canTransition, type ShipmentStatus } from "@/lib/domain";
import { HttpError } from "@/lib/http";
import { deliverNotification } from "@/lib/notifications";
import { z } from "zod";
import { confirmPayment } from "@/lib/payments";

export async function adminOperation(
  raw: z.infer<typeof adminOperationSchema>,
  actor: { id: string; role: string },
) {
  if (actor.role !== "admin") throw new HttpError(403, "Administrator access is required.");
  const input = adminOperationSchema.parse(raw);
  const db = getDb();
  if (input.operation === "status") {
    const current = await db.execute(
      sql`SELECT status FROM shipments WHERE id = ${input.id}::uuid`,
    );
    const from = current.rows[0]?.status as ShipmentStatus | undefined;
    if (!from) throw new HttpError(404, "Shipment not found.");
    if (!canTransition(from, input.status))
      throw new HttpError(409, "That status change is not allowed.");
    if (input.status === "confirmed")
      throw new HttpError(409, "Confirm the shipping price to approve this request.");
    const eventId = randomUUID();
    const notificationId = randomUUID();
    const changed = await db.execute(sql`
      WITH changed AS (
        UPDATE shipments SET status = ${input.status}::shipment_status, updated_at = now()
        WHERE id = ${input.id}::uuid AND status = ${from}::shipment_status RETURNING id, tracking_number
      ), event AS (
        INSERT INTO shipment_events (id, shipment_id, status, internal_note, actor_user_id)
        SELECT ${eventId}::uuid, id, ${input.status}::shipment_status, ${input.internalNote}, ${actor.id} FROM changed
      ), audit AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${actor.id}, 'shipment.status', 'shipment', id::text, jsonb_build_object('from', ${from}::text, 'to', ${input.status}::text) FROM changed
      ), mail AS (
        INSERT INTO notifications (id, shipment_id, recipient, subject, body)
        SELECT ${notificationId}::uuid, c.id, d.sender_email, 'ParcelLane shipment update', 'Shipment ' || c.tracking_number || ': ' || ${input.status}::text || '. Check the tracking page for the latest progress.' FROM changed c JOIN shipment_details d ON d.shipment_id = c.id
      ) SELECT id FROM changed`);
    if (!changed.rows.length)
      throw new HttpError(409, "This shipment changed. Refresh and try again.");
    await deliverNotification(notificationId).catch(() => undefined);
  } else if (input.operation === "quote") {
    const notificationId = randomUUID();
    const changed = await db.execute(sql`
      WITH changed AS (
        UPDATE shipments SET quoted_price_kobo = ${input.amountKobo}, status = 'confirmed', payment_status = 'unpaid', updated_at = now()
        WHERE id = ${input.id}::uuid AND status IN ('pending_review', 'confirmed') AND payment_status NOT IN ('paid', 'pending')
        AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.shipment_id = shipments.id AND p.status = 'pending')
        RETURNING id, tracking_number
      ), event AS (
        INSERT INTO shipment_events (shipment_id, status, actor_user_id) SELECT id, 'confirmed', ${actor.id} FROM changed
      ), audit AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${actor.id}, 'shipment.quote', 'shipment', id::text, jsonb_build_object('amountKobo', ${input.amountKobo}::int) FROM changed
      ), mail AS (
        INSERT INTO notifications (id, shipment_id, recipient, subject, body)
        SELECT ${notificationId}::uuid, c.id, d.sender_email, 'ParcelLane request reviewed', 'Your request ' || c.tracking_number || ' has been reviewed. Please contact the business to confirm collection and payment arrangements.' FROM changed c JOIN shipment_details d ON d.shipment_id = c.id
      ) SELECT id FROM changed`);
    if (!changed.rows.length)
      throw new HttpError(
        409,
        "A paid, pending-payment, or progressed shipment cannot be repriced.",
      );
    await deliverNotification(notificationId).catch(() => undefined);
  } else if (input.operation === "price") {
    const origin = input.originZone.toLowerCase();
    const destination = input.destinationZone.toLowerCase();
    await db.batch([
      db.execute(
        sql`UPDATE price_rules SET active = false WHERE service = ${input.service}::service_type AND lower(origin_zone) = ${origin} AND lower(destination_zone) = ${destination}`,
      ),
      db.execute(
        sql`INSERT INTO price_rules (service, origin_zone, destination_zone, base_price_kobo, per_kg_kobo, volumetric_divisor, version, active) SELECT ${input.service}::service_type, ${origin}, ${destination}, ${input.basePriceKobo}, ${input.perKgKobo}, ${input.volumetricDivisor}, coalesce(max(version), 0) + 1, ${input.active} FROM price_rules WHERE service = ${input.service}::service_type AND lower(origin_zone) = ${origin} AND lower(destination_zone) = ${destination}`,
      ),
      db.execute(
        sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES (${actor.id}, 'pricing.version', 'price_rule', ${input.service + ":" + origin + ":" + destination}, jsonb_build_object('baseKobo', ${input.basePriceKobo}::int, 'perKgKobo', ${input.perKgKobo}::int, 'active', ${input.active}::boolean))`,
      ),
    ]);
  } else if (input.operation === "enquiry") {
    const changed = await db.execute(
      sql`WITH changed AS (UPDATE enquiries SET status = ${input.status}::enquiry_status WHERE id = ${input.id}::uuid RETURNING id), audit AS (INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) SELECT ${actor.id}, 'enquiry.status', 'enquiry', id::text, jsonb_build_object('status', ${input.status}::text) FROM changed) SELECT id FROM changed`,
    );
    if (!changed.rows.length) throw new HttpError(404, "Enquiry not found.");
  } else if (input.operation === "verify-payment") {
    const verified = await confirmPayment(input.reference);
    if (!verified) throw new HttpError(409, "Payment is not verified.");
    await db.execute(
      sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES (${actor.id}, 'payment.reconciled', 'payment_reference', ${input.reference})`,
    );
  } else {
    await db.execute(
      sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES (${actor.id}, 'notification.retry', 'notification', ${input.id})`,
    );
    const result = await deliverNotification(input.id);
    if (!result.sent)
      throw new HttpError(
        409,
        result.reason === "disabled"
          ? "Configure the email adapter before sending."
          : "Email was not sent. Check notification status and email configuration.",
      );
  }
}
