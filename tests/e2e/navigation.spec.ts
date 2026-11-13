import { test, expect } from "@playwright/test";

test("mobile menu works before JavaScript loads and links remain usable", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 393, height: 852 },
  });
  const page = await context.newPage();
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await toggle.click();
  await expect(navigation).toBeVisible();
  await toggle.click();
  await expect(navigation).toBeHidden();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "About us" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your parcel has a story");
  await context.close();
});

test("repeated navigation keeps the menu, history and hydration working", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  for (const [label, route] of [
    ["About us", "/about"],
    ["Our services", "/services"],
    ["Contact", "/contact"],
    ["Track a shipment", "/track"],
  ]) {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(navigation).toBeVisible();
    await navigation.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(route + "$"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(navigation).toBeHidden();
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/contact$/);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Toggle navigation" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("delayed route responses keep current content usable and finish without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.route("**/about?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About us" })
    .click();
  await expect(page.getByRole("status")).toContainText("Opening page");
  await expect(page.getByRole("main")).not.toBeEmpty();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your parcel has a story");
  await page.goBack();
  await expect(page.getByRole("tab", { name: "Request a quote" })).toBeVisible();
  await page.getByRole("tab", { name: "Request a quote" }).click();
  await expect(page.getByRole("tab", { name: "Request a quote" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(errors).toEqual([]);
});
