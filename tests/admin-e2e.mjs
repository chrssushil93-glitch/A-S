// Admin console end-to-end test. Start the app first with:
//   ADMIN_PASSWORD=testpw ADMIN_STORAGE=local npm start   (then BASE_URL=... node tests/admin-e2e.mjs)
// It replaces one photo and restores it afterwards.
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE_URL ?? "http://localhost:3124";
const PW = process.env.ADMIN_PASSWORD ?? "testpw";
const target = "public/images/album/together-01.jpg";
const overrides = "src/content/overrides.json";
const backup = { img: await fs.readFile(target), ov: await fs.readFile(overrides) };
const mine = "/tmp/admin-e2e-photo.jpg";
await sharp({ create: { width: 900, height: 600, channels: 3, background: { r: 200, g: 30, b: 60 } } }).jpeg().toFile(mine);

let pass = 0, failed = 0;
const check = (name, ok, extra = "") => { if (ok) pass++; else failed++; console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : " " + extra}`); };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/401|429/.test(m.text())) errors.push(m.text()); });

  const anon = await ctx.request.post(`${BASE}/api/admin/publish`, { multipart: { edits: "{}" } });
  check("publish refuses when signed out", anon.status() === 401);

  await page.goto(`${BASE}/admin`);
  check("login form shown", await page.getByLabel("Password").isVisible());
  check("page is noindex", (await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"));
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  check("wrong password rejected", await page.getByRole("alert").isVisible());
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Album console" }).waitFor();
  await page.locator("[data-slot]").first().waitFor();
  const slots = await page.locator("[data-slot]").count();
  check(`console lists photos (${slots})`, slots >= 10);
  check("publish disabled with no changes", await page.getByRole("button", { name: /^Publish/ }).isDisabled());

  const card = page.locator('[data-slot="album/together-01"]');
  await card.locator('input[type="file"]').setInputFiles(mine);
  await card.getByText("Unpublished").waitFor();
  await card.getByLabel(/Description/).fill("A bright red test frame");
  await card.locator(".adm-thumb").click({ position: { x: 20, y: 20 } });
  check("publish enabled with change", await page.getByRole("button", { name: /^Publish/ }).isEnabled());
  await page.getByRole("button", { name: /^Publish/ }).click();
  await page.getByText(/Saved to this computer/).waitFor({ timeout: 30000 });

  const meta = await sharp(target).metadata();
  check("photo file replaced", meta.width === 900 && meta.height === 600, `${meta.width}x${meta.height}`);
  const ov = JSON.parse(await fs.readFile(overrides, "utf8"));
  check("description saved", ov["album/together-01"]?.alt === "A bright red test frame");
  check("focus saved", /^\d+% \d+%$/.test(ov["album/together-01"]?.focus ?? ""));
  const man = JSON.parse(await fs.readFile("src/content/image-manifest.json", "utf8"));
  check("manifest has cache-busting hash", /\?v=[0-9a-f]{8}$/.test(man["album/together-01"].src));

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Password").waitFor();
  check("sign out returns to login", true);
  check("no console errors", errors.length === 0, errors.join(" | "));
} finally {
  await browser.close();
  await fs.writeFile(target, backup.img);
  await fs.writeFile(overrides, backup.ov);
  execFileSync("node", ["scripts/scan-images.mjs"], { stdio: "ignore" });
}
console.log(`${pass}/${pass + failed} passed`);
process.exit(failed ? 1 : 0);
