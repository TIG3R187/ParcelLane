import { config } from "dotenv";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray, sql } from "drizzle-orm";

config({ path: ".env.local", quiet: true });
process.env.EMAIL_ADAPTER = "disabled";
const { getDb } = await import("../src/db/index");
const schema = await import("../src/db/schema");
const { createShipment, publicTracking, estimateShipment } = await import("../src/lib/shipping");
const { adminOperation } = await import("../src/lib/admin-service");
const { getAuth, requireAdmin } = await import("../src/lib/auth");
const { rateLimit } = await import("../src/lib/rate-limit");
const { tokenHash } = await import("../src/lib/tokens");
const { confirmPayment } = await import("../src/lib/payments");
const db = getDb();
const actorId = randomUUID();
const shipmentIds: string[] = [];
const scope = "qa-" + randomBytes(8).toString("hex");
const email = `qa-${actorId}@example.invalid`;
const password = randomBytes(24).toString("base64url");
const actor = { id: actorId, role: "admin" };
let stage = "database preflight";
let passed = 0;
function check(label: string) {
  console.log("PASS " + label);
  passed++;
}
try {
  await db.execute(sql`select 1`);
  stage = "private fixture provisioning";
  await db.batch([
    db.insert(schema.user).values({
      id: actorId,
      name: "Fictional QA Administrator",
      email,
      emailVerified: true,
      role: "admin",
    }),
    db.insert(schema.account).values({
      id: randomUUID(),
      accountId: actorId,
      userId: actorId,
      providerId: "credential",
      password: await hashPassword(password),
    }),
  ]);
  stage = "Better Auth sign-in and server authorization";
  const origin = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const login = await getAuth().handler(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    }),
  );
  assert.equal(login.status, 200);
  const cookies = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.ok(cookies.includes("session_token"));
  const authorized = await requireAdmin(new Headers({ cookie: cookies }));
  assert.equal(authorized.id, actorId);
  check("Better Auth login and server-side admin authorization");
  await assert.rejects(requireAdmin(new Headers()));
  check("anonymous administrator access denied");
  await db.update(schema.user).set({ role: "staff" }).where(eq(schema.user.id, actorId));
  await assert.rejects(requireAdmin(new Headers({ cookie: cookies })));
  check("non-admin session denied using current database role");
  await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.id, actorId));
  stage = "persistent concurrent rate limiter";
  const attempts = await Promise.allSettled(
    Array.from({ length: 12 }, () => rateLimit(scope, "fictional-key", 3, 60)),
  );
  assert.equal(attempts.filter((result) => result.status === "fulfilled").length, 3);
  check("atomic PostgreSQL rate limit admits exactly 3 of 12 concurrent calls");
  stage = "versioned rate configuration";
  const originCity = "Fictional Qa Origin";
  const destinationCity = "Fictional Qa Destination";
  await adminOperation(
    {
      operation: "price",
      service: "nationwide-shipping",
      originZone: originCity,
      destinationZone: destinationCity,
      basePriceKobo: 100000,
      perKgKobo: 50000,
      volumetricDivisor: 5000,
      active: true,
    },
    actor,
  );
  const input = {
    service: "nationwide-shipping" as const,
    originCity,
    destinationCity,
    destinationCountry: "NG",
    weightKg: 2.1,
    lengthCm: 20,
    widthCm: 20,
    heightCm: 20,
    requestKind: "booking" as const,
    senderName: "Fictional Sender",
    senderEmail: "sender@example.invalid",
    senderPhone: "+234 800 000 0000",
    pickupAddress: "10 Fictional Pickup Street",
    recipientName: "Fictional Recipient",
    recipientPhone: "+234 800 000 0001",
    destinationAddress: "20 Fictional Destination Avenue",
    packageType: "Documents" as const,
    contents: "Fictional test documents",
    deliveryInstructions: "PRIVATE QA NOTE",
    pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    consent: true as const,
    website: "",
  };
  const estimate = await estimateShipment(input);
  assert.equal(estimate?.amountKobo, 250000);
  check("database-backed backend quote calculation");
  stage = "atomic shipment creation and privacy";
  const created = await createShipment(input, actorId);
  shipmentIds.push(created.id);
  assert.equal(created.estimatedAmountKobo, 250000);
  const [stored] = await db
    .select()
    .from(schema.shipments)
    .where(eq(schema.shipments.id, created.id));
  assert.equal(stored?.accessTokenHash, tokenHash(created.accessToken));
  assert.notEqual(stored?.accessTokenHash, created.accessToken);
  const tracked = await publicTracking(created.trackingNumber);
  assert.ok(tracked);
  assert.equal(tracked.status, "pending_review");
  const exposed = JSON.stringify(tracked);
  for (const secret of [
    input.senderName,
    input.senderEmail,
    input.senderPhone,
    input.pickupAddress,
    input.recipientName,
    input.destinationAddress,
    input.deliveryInstructions,
    created.accessToken,
    "quotedPriceKobo",
    "paymentStatus",
    "internalNote",
    "actorUserId",
  ])
    assert.ok(!exposed.includes(secret));
  check("shipment writes and public tracking privacy projection");
  stage = "admin state transition enforcement";
  await assert.rejects(
    adminOperation(
      { operation: "status", id: created.id, status: "delivered", internalNote: "" },
      actor,
    ),
  );
  await assert.rejects(
    adminOperation(
      { operation: "quote", id: created.id, amountKobo: 250000 },
      { id: actorId, role: "staff" },
    ),
  );
  await adminOperation({ operation: "quote", id: created.id, amountKobo: 250000 }, actor);
  await adminOperation(
    {
      operation: "status",
      id: created.id,
      status: "collected",
      internalNote: "PRIVATE ADMIN NOTE",
    },
    actor,
  );
  await adminOperation(
    { operation: "status", id: created.id, status: "in_transit", internalNote: "" },
    actor,
  );
  const progress = await publicTracking(created.trackingNumber);
  assert.deepEqual(
    progress?.history.map((event) => event.status),
    ["pending_review", "confirmed", "collected", "in_transit"],
  );
  assert.ok(!JSON.stringify(progress).includes("PRIVATE ADMIN NOTE"));
  check("review, quote confirmation and chronological status history");
  stage = "idempotent payment confirmation";
  const reference = "PLPAY-" + randomBytes(24).toString("hex");
  await db
    .insert(schema.payments)
    .values({ shipmentId: created.id, reference, amountKobo: 250000 });
  const savedFetch = globalThis.fetch;
  const savedKey = process.env.PAYSTACK_SECRET_KEY;
  const savedEnabled = process.env.PAYSTACK_ENABLED;
  process.env.PAYSTACK_ENABLED = "true";
  process.env.PAYSTACK_SECRET_KEY = "sk_test_fictional_integration_key";
  globalThis.fetch = async (url, options) =>
    String(url).startsWith("https://api.paystack.co/")
      ? Response.json({
          status: true,
          data: {
            id: randomUUID(),
            domain: "test",
            status: "success",
            reference,
            amount: 250000,
            currency: "NGN",
          },
        })
      : savedFetch(url, options);
  try {
    assert.equal(await confirmPayment(reference), true);
    assert.equal(await confirmPayment(reference), true);
  } finally {
    globalThis.fetch = savedFetch;
    process.env.PAYSTACK_SECRET_KEY = savedKey;
    process.env.PAYSTACK_ENABLED = savedEnabled;
  }
  const [paid] = await db
    .select()
    .from(schema.shipments)
    .where(eq(schema.shipments.id, created.id));
  assert.equal(paid?.paymentStatus, "paid");
  assert.equal(paid?.status, "in_transit");
  const confirmations = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.action, "payment.confirmed"));
  const paymentRows = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.reference, reference));
  assert.equal(confirmations.filter((row) => row.entityId === paymentRows[0]?.id).length, 1);
  check("duplicate verification confirms once without changing shipment status (provider mocked)");
  stage = "transaction rollback on invalid measurements";
  await assert.rejects(createShipment({ ...input, weightKg: 0 }, actorId));
  check("invalid shipment input rejected before writes");
  console.log(
    `Integration checks passed: ${passed}. All shipping/contact fixtures are fictional; Paystack network was mocked and email disabled.`,
  );
} catch {
  console.error(
    `Integration check failed at: ${stage}. Raw errors withheld to protect credentials.`,
  );
  process.exitCode = 1;
} finally {
  try {
    for (const id of shipmentIds) {
      const paymentIds = (
        await db
          .select({ id: schema.payments.id })
          .from(schema.payments)
          .where(eq(schema.payments.shipmentId, id))
      ).map((row) => row.id);
      if (paymentIds.length)
        await db.delete(schema.auditLogs).where(inArray(schema.auditLogs.entityId, paymentIds));
      await db.batch([
        db.delete(schema.notifications).where(eq(schema.notifications.shipmentId, id)),
        db.delete(schema.payments).where(eq(schema.payments.shipmentId, id)),
        db.delete(schema.shipmentEvents).where(eq(schema.shipmentEvents.shipmentId, id)),
        db.delete(schema.shipmentDetails).where(eq(schema.shipmentDetails.shipmentId, id)),
        db.delete(schema.shipments).where(eq(schema.shipments.id, id)),
      ]);
    }
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId));
    await db
      .delete(schema.priceRules)
      .where(
        and(
          eq(schema.priceRules.originZone, "fictional qa origin"),
          eq(schema.priceRules.destinationZone, "fictional qa destination"),
        ),
      );
    await db.delete(schema.rateLimitBuckets).where(eq(schema.rateLimitBuckets.scope, scope));
    await db.delete(schema.user).where(eq(schema.user.id, actorId));
    console.log("Fictional integration fixtures cleaned up.");
  } catch {
    console.error(
      "Fixture cleanup was incomplete; inspect records marked Fictional QA. No raw error was printed.",
    );
    process.exitCode = 1;
  }
}
