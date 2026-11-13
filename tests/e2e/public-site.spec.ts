import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage renders its imagery and fits the screen", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Deliver with confidence." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore service/ })).toHaveCount(3);
  const hero = page.getByAltText(
    "A shipping professional holding a parcel beside an orange cargo van in a Nigerian city",
  );
  await expect(hero).toBeVisible();
  await expect
    .poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("tracking validates input and safely handles an unknown shipment", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Tracking number" }).fill("<script>");
  await page.getByRole("button", { name: "Track parcel" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("letters, numbers");
  await page.getByRole("textbox", { name: "Tracking number" }).fill("pln-demo-123");
  await page.getByRole("button", { name: "Track parcel" }).click();
  await expect(page).toHaveURL(/\/track\?number=PLN-DEMO-123/);
  await expect(page.getByRole("status")).toContainText(/find a shipment|temporarily unavailable/);
});

test("quote tab supports keyboard selection", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Track a parcel" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Request a quote" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("link", { name: "Plan your shipment" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A clearer picture");
});

test("planner carries locations into the detailed estimate form", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Sending from").selectOption("Ibadan");
  await page.getByLabel("Sending to").selectOption("Lagos");
  await page.getByLabel("Package weight").selectOption("2–5 kg");
  await page.getByRole("button", { name: "Prepare a quote" }).click();
  await expect(page.getByLabel("Sending from")).toHaveValue("Ibadan");
  await expect(page.getByLabel("Sending to")).toHaveValue("Lagos");
  await expect(page.getByRole("button", { name: "Calculate estimate" })).toBeVisible();
});

test("FAQ opens and navigation works at mobile and desktop sizes", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "About us" })
      .click();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "About us" })
      .click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your parcel has a story");
  await page.goto("/faqs");
  await page.locator("summary").filter({ hasText: "How should I pack my shipment?" }).click();
  await expect(
    page.getByText("Use a strong box suited to the contents", { exact: false }),
  ).toBeVisible();
});

test("all public pages are reachable and have a single main heading", async ({ page }) => {
  for (const route of [
    "/services",
    "/services/express-delivery",
    "/services/nationwide-shipping",
    "/services/international-cargo",
    "/about",
    "/contact",
    "/faqs",
    "/terms",
    "/privacy",
    "/book",
    "/quote",
    "/track",
    "/payment",
    "/admin/login",
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), route).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      route,
    ).toBe(true);
  }
});

test("public pages meet automated WCAG AA checks", async ({ page }) => {
  test.slow();
  for (const route of [
    "/",
    "/services/express-delivery",
    "/track",
    "/quote",
    "/contact",
    "/faqs",
    "/book",
    "/payment",
    "/admin/login",
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      `${route}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([]);
  }
});

test("untrusted queries are rejected and administrator operations stay closed", async ({
  page,
}) => {
  await page.goto("/track?number=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("isn’t valid");
  await page.goto("/quote?from=unknown-location");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("weren’t recognised");
  for (const route of ["/api/auth/sign-up/email", "/services/unknown"]) {
    const response = await page.request.get(route);
    expect(response.status(), route).toBe(404);
  }
  const admin = await page.request.get("/admin");
  expect(admin.url()).toContain("/admin/login");
  expect((await page.request.get("/api/bookings")).status()).toBe(405);
  expect((await page.request.post("/api/auth/sign-up/email", { data: {} })).status()).toBe(404);
  const headers = { origin: "http://127.0.0.1:3100" };
  expect((await page.request.post("/api/admin", { headers, data: {} })).status()).toBe(401);
  for (const route of ["/api/bookings", "/api/enquiries"]) {
    expect((await page.request.post(route, { headers, data: {} })).status()).toBe(503);
  }
  expect(
    (
      await page.request.post("/api/bookings", {
        headers: { origin: "https://evil.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
});

test("security headers are present and preview indexing is disabled", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("form-action 'self'");
  expect(headers["content-security-policy"]).toContain("'nonce-");
  expect(headers["content-security-policy"]?.split("style-src")[0]).not.toContain("unsafe-inline");
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("tablet layout fits without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("heading", { name: "Deliver with confidence." })).toBeVisible();
});
