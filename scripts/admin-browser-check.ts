import { config } from "dotenv";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";

config({ path: ".env.local", quiet: true });
const { getDb } = await import("../src/db/index");
const s = await import("../src/db/schema");
const db = getDb();
const actorId = randomUUID();
const email = `qa-browser-${actorId}@example.invalid`;
const password = randomBytes(24).toString("base64url");
const origin = "http://127.0.0.1:3200";
let stage = "fixture setup";
let shipmentId: string | undefined;
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3200"],
  {
    env: {
      ...process.env,
      BETTER_AUTH_URL: origin,
      EMAIL_ADAPTER: "disabled",
      PUBLIC_REQUESTS_ENABLED: "false",
      PAYSTACK_ENABLED: "false",
    },
    stdio: "ignore",
    windowsHide: true,
  },
);
const browser = await chromium.launch();
try {
  await db.batch([
    db.insert(s.user).values({
      id: actorId,
      name: "Fictional QA Browser Admin",
      email,
      emailVerified: true,
      role: "admin",
    }),
    db.insert(s.account).values({
      id: randomUUID(),
      accountId: actorId,
      userId: actorId,
      providerId: "credential",
      password: await hashPassword(password),
    }),
  ]);
  stage = "production server readiness";
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {
      /* Server is starting. */
    }
    if (attempt === 59) throw new Error("Server unavailable");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.name));
  stage = "administrator login in browser";
  await page.goto(origin + "/admin/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await page.waitForURL(origin + "/admin", { timeout: 30000 });
  console.log("PASS administrator browser sign-in");
  stage = "protected pages and accessibility";
  for (const route of [
    "/admin",
    "/admin/shipments",
    "/admin/shipments/new",
    "/admin/pricing",
    "/admin/enquiries",
    "/admin/payments",
    "/admin/notifications",
    "/admin/audit",
  ]) {
    const response = await page.goto(origin + route);
    assert.equal(response?.status(), 200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    if (result.violations.length)
      throw new Error("Accessibility: " + result.violations.map((v) => v.id).join(","));
  }
  console.log("PASS all eight protected admin pages and automated accessibility");
  stage = "shipment form submission";
  await page.goto(origin + "/admin/shipments/new");
  const fields: Record<string, string> = {
    senderName: "Fictional QA Sender",
    senderEmail: email,
    senderPhone: "+2348000000000",
    recipientName: "Fictional QA Recipient",
    recipientPhone: "+2348000000001",
    originCity: "Fictional Origin",
    destinationCity: "Fictional Destination",
    pickupAddress: "10 Fictional Pickup Street",
    destinationAddress: "20 Fictional Destination Street",
    destinationCountry: "NG",
    pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    contents: "Fictional documents",
    weightKg: "2",
    lengthCm: "20",
    widthCm: "20",
    heightCm: "20",
    deliveryInstructions: "PRIVATE FICTIONAL QA NOTE",
  };
  for (const [name, value] of Object.entries(fields))
    await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name="consent"]').check();
  const saved = page.waitForResponse(
    (response) =>
      response.url() === origin + "/api/admin" && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Submit shipment request" }).click();
  const response = await saved;
  assert.equal(response.status(), 201);
  const created = await response.json();
  shipmentId = created.id;
  assert.match(created.trackingNumber, /^PLN-[A-F0-9]{32}$/);
  await expect(page.getByText("A good start to your journey.")).toBeVisible();
  console.log("PASS full shipment form writes through authenticated API");
  stage = "quote review and status form";
  await page.goto(origin + "/admin/shipments/" + shipmentId);
  await page.getByLabel("Agreed price (kobo)").fill("250000");
  await page.getByRole("button", { name: "Confirm shipping quote" }).click();
  await expect(page.getByRole("status")).toContainText("Update saved", { timeout: 20000 });
  await page.reload();
  await page.getByLabel("Next status").selectOption("collected");
  await page.getByLabel("Internal note (private)").fill("PRIVATE QA STATUS NOTE");
  await page.getByRole("button", { name: "Save update" }).click();
  await expect(page.getByRole("status")).toContainText("Update saved", { timeout: 20000 });
  console.log("PASS quote approval and status update in admin UI");
  stage = "public tracking privacy and mobile dashboard";
  await page.goto(origin + "/track?number=" + created.trackingNumber);
  await expect(page.getByRole("heading", { name: "Collected", exact: true }).first()).toBeVisible();
  const publicText = await page.locator("main").innerText();
  for (const secret of [
    email,
    fields.senderName,
    fields.pickupAddress,
    fields.deliveryInstructions,
    "PRIVATE QA STATUS NOTE",
    created.accessToken,
  ])
    assert.ok(!publicText.includes(secret));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(origin + "/admin");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(origin + "/admin/login", { timeout: 20000 });
  await page.goto(origin + "/admin");
  assert.ok(page.url().endsWith("/admin/login"));
  assert.deepEqual(errors, []);
  console.log("PASS privacy, mobile layout, logout, and session revocation; no browser errors");
} catch (error) {
  console.error(
    "Browser check failed at: " +
      stage +
      (error instanceof Error && error.message.startsWith("Accessibility:")
        ? "; " + error.message
        : ". Raw errors withheld."),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
  try {
    const eventRows = await db
      .select({ id: s.shipmentEvents.shipmentId })
      .from(s.shipmentEvents)
      .where(eq(s.shipmentEvents.actorUserId, actorId));
    const ids = [...new Set([...eventRows.map((r) => r.id), ...(shipmentId ? [shipmentId] : [])])];
    if (ids.length)
      await db.batch([
        db.delete(s.notifications).where(inArray(s.notifications.shipmentId, ids)),
        db.delete(s.shipmentEvents).where(inArray(s.shipmentEvents.shipmentId, ids)),
        db.delete(s.shipmentDetails).where(inArray(s.shipmentDetails.shipmentId, ids)),
        db.delete(s.shipments).where(inArray(s.shipments.id, ids)),
      ]);
    await db.delete(s.auditLogs).where(eq(s.auditLogs.actorUserId, actorId));
    await db.delete(s.user).where(eq(s.user.id, actorId));
    console.log("Fictional browser fixtures removed; owned browser/server stopped.");
  } catch {
    console.error("Fictional browser fixture cleanup needs inspection.");
    process.exitCode = 1;
  }
}
