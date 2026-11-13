import { test, expect } from "@playwright/test";

const routes = [
  "/",
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
];

for (const width of [320, 360, 390, 430]) {
  test(`${width}px phones keep public pages and forms inside the viewport`, async ({
    page,
  }, info) => {
    test.skip(info.project.name === "desktop", "Phone-specific viewport matrix.");
    test.slow();
    await page.setViewportSize({ width, height: width === 320 ? 568 : 852 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const issues = await page.evaluate(() => {
        const problems: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth)
          problems.push("horizontal document overflow");
        const fields = document.querySelectorAll<HTMLInputElement>(
          ".form-field input, .form-field select, .form-field textarea, .select-wrap select",
        );
        for (const field of fields) {
          const rect = field.getBoundingClientRect();
          if (!rect.width || !rect.height || field.closest('[aria-hidden="true"]')) continue;
          if (rect.left < -1 || rect.right > innerWidth + 1)
            problems.push(`${field.name}: outside viewport`);
          if (parseFloat(getComputedStyle(field).fontSize) < 16)
            problems.push(`${field.name}: small input text`);
          if (rect.height < 44) problems.push(`${field.name}: short touch target`);
        }
        return problems;
      });
      expect(issues, `${width}px ${route}`).toEqual([]);
      if (route === "/" || route === "/book")
        await page.screenshot({
          path: info.outputPath(`${width}-${route === "/" ? "home" : "booking"}.png`),
          fullPage: true,
        });
    }
  });
}

test("mobile controls, sticky navigation and landscape menu stay reachable", async ({
  page,
}, info) => {
  test.skip(info.project.name === "desktop", "Phone-specific interaction checks.");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  for (const name of ["Track a parcel", "Request a quote"]) {
    const rect = await page.getByRole("tab", { name, exact: true }).boundingBox();
    expect(rect?.height).toBeGreaterThanOrEqual(44);
    expect(rect?.width).toBeGreaterThanOrEqual(44);
  }
  const submit = await page
    .getByRole("button", { name: "Track parcel", exact: true })
    .boundingBox();
  expect(submit!.y + submit!.height).toBeLessThanOrEqual(568);
  await page.setViewportSize({ width: 390, height: 852 });
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: "instant" }));
  expect((await page.locator(".site-header").boundingBox())?.y).toBe(0);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(page.locator("details.mobile-menu")).not.toHaveAttribute("open", "");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  const booking = navigation.getByRole("link", { name: "Book a shipment" });
  await booking.scrollIntoViewIfNeeded();
  const menu = await navigation.boundingBox();
  const action = await booking.boundingBox();
  expect(menu!.y + menu!.height).toBeLessThanOrEqual(391);
  expect(action!.y + action!.height).toBeLessThanOrEqual(391);
  await booking.click();
  await expect(page).toHaveURL(/\/book$/);
});
