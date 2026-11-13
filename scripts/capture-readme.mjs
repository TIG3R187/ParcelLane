import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import sharp from "sharp";

// Uses public pages only. Never capture .env files, administrator credentials,
// payment access codes, session cookies, or customer information.
const origin = "http://127.0.0.1:3300";
const output = "docs/readme";
await fs.mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3300"],
  {
    env: {
      ...process.env,
      BETTER_AUTH_URL: origin,
      PUBLIC_REQUESTS_ENABLED: "false",
      PAYSTACK_ENABLED: "false",
      EMAIL_ADAPTER: "disabled",
    },
    stdio: "ignore",
    windowsHide: true,
  },
);
const browser = await chromium.launch();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function gif(frames, width, height, filename) {
  const raw = [];
  for (const frame of frames)
    raw.push(await sharp(frame.image).resize(width, height).ensureAlpha().raw().toBuffer());
  await sharp(Buffer.concat(raw), {
    raw: { width, height: height * raw.length, channels: 4, pageHeight: height },
  })
    .gif({
      loop: 0,
      delay: frames.map((frame) => frame.delay),
      colours: 128,
      dither: 0.2,
      effort: 5,
    })
    .toFile(`${output}/${filename}`);
  const metadata = await sharp(`${output}/${filename}`, { animated: true }).metadata();
  console.log(
    `${filename}: ${metadata.pages} animated frames, ${Math.round((await fs.stat(`${output}/${filename}`)).size / 1024)} KB`,
  );
}

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {
      /* Startup. */
    }
    if (attempt === 59) throw new Error("README capture server unavailable");
    await wait(1000);
  }
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${output}/homepage-preview.png` });
  await page.screenshot({ path: `${output}/homepage-desktop.png`, fullPage: true });
  const frames = [];
  const capture = async (delay = 120) => frames.push({ image: await page.screenshot(), delay });
  await capture(1700);
  await page.getByRole("tab", { name: "Request a quote" }).click();
  await capture(1300);
  await page.getByRole("tab", { name: "Track a parcel" }).click();
  await capture(500);
  for (let i = 1; i <= 12; i++) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), i * 65);
    await wait(70);
    await capture(100);
  }
  await capture(1400);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Our services" })
    .click();
  await page.waitForURL("**/services");
  await wait(250);
  await capture(1400);
  await gif(frames, 960, 600, "site-tour.gif");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${output}/homepage-mobile.png`, fullPage: true });
  const mobile = [];
  const snap = async (delay = 140) => mobile.push({ image: await page.screenshot(), delay });
  await snap(1400);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  for (let i = 0; i < 4; i++) {
    await wait(50);
    await snap(80);
  }
  await snap(1200);
  await page.screenshot({ path: `${output}/mobile-menu.png` });
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "About us" })
    .click();
  await page.waitForURL("**/about");
  await wait(220);
  await snap(1400);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await wait(160);
  await snap(1000);
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Our services" })
    .click();
  await page.waitForURL("**/services");
  await wait(220);
  await snap(1500);
  await gif(mobile, 330, 716, "mobile-navigation.gif");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(origin + "/book", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${output}/shipment-request.png`, fullPage: true });
  console.log("README public screenshots and GIFs captured from the production build.");
} finally {
  await browser.close();
  server.kill();
}
