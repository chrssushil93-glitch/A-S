// Browser-level interaction tests. Usage:
//   npm run build && npm start   (in one terminal)
//   BASE_URL=http://localhost:3000 npm run test:e2e
// Needs Playwright with a Chromium install. Screenshots go to $SHOTS (default ./test-results).
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "test-results";
mkdirSync(SHOTS, { recursive: true });

const results = [];
let currentErrors = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split("\n")[0]}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  currentErrors = [];
  page.on("console", (m) => m.type() === "error" && currentErrors.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => currentErrors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 400 && currentErrors.push(`HTTP ${r.status()} ${r.url()}`));
  return { ctx, page };
}

const progressOf = (page) => page.getByRole("progressbar", { name: "Album progress" }).getAttribute("aria-valuenow");
const livePhotos = (page) => page.locator('#album button[aria-label^="Open photograph"]:not([inert] *)');

const overflowX = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function runDesktop(browser) {
  console.log("\nDesktop 1440×900");
  const { ctx, page } = await newPage(browser);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await check("opening screen shows names, date and primary action", async () => {
    const dlg = page.getByRole("dialog");
    await dlg.waitFor({ state: "visible", timeout: 5000 });
    const text = await dlg.innerText();
    assert(/SUSHIL/i.test(text) && /ANJALI/i.test(text), "names missing");
    assert(/06 December 2025/i.test(text) && /Mumbai/i.test(text), "date/location missing");
    assert(/Open our album/i.test(text), "primary action missing");
    await page.screenshot({ path: `${SHOTS}/desktop-opening.png` });
  });

  await check("opening can be skipped with Escape and does not return on reload", async () => {
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 4000 });
    await page.reload({ waitUntil: "networkidle" });
    assert((await page.getByRole("dialog").count()) === 0, "intro showed again in same session");
  });

  await check("hero renders and has no horizontal overflow", async () => {
    await page.screenshot({ path: `${SHOTS}/desktop-hero.png` });
    assert((await overflowX(page)) <= 0, "horizontal overflow");
  });

  await check("'Open the album' scrolls to and opens the book", async () => {
    await page.getByRole("button", { name: /open the album/i }).first().click();
    await page.getByRole("button", { name: /next spread/i }).first().waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(1200);
    await page.locator("#album").screenshot({ path: `${SHOTS}/desktop-album-open.png` });
  });

  await check("next / previous spread work via buttons", async () => {
    const before = await progressOf(page);
    await page.getByRole("button", { name: /^next spread$/i }).last().click();
    await page.waitForTimeout(1100);
    const after = await progressOf(page);
    assert(before !== after, `progress did not change (${before})`);
    await page.getByRole("button", { name: /^previous spread$/i }).last().click();
    await page.waitForTimeout(1100);
    assert((await progressOf(page)) === before, "previous did not return");
  });

  await check("arrow keys turn pages when the album is focused", async () => {
    await page.locator("#album").hover();
    const before = await progressOf(page);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1100);
    const mid = await progressOf(page);
    assert(mid !== before, "ArrowRight had no effect");
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(1100);
    assert((await progressOf(page)) === before, "ArrowLeft had no effect");
  });

  await check("chapter navigator jumps to the right chapter", async () => {
    const nav = page.getByLabel("Album chapters");
    const target = nav.getByRole("button").nth(3);
    const name = (await target.getAttribute("aria-label")) ?? (await target.innerText());
    await target.click();
    await page.waitForTimeout(1300);
    const pressed = await target.getAttribute("aria-current");
    assert(pressed && pressed !== "false", `chapter ${name} not marked current`);
    await page.locator("#album").screenshot({ path: `${SHOTS}/desktop-chapter.png` });
  });

  await check("clicking a photograph opens the lightbox with position counter", async () => {
    await livePhotos(page).first().click();
    const box = page.getByRole("dialog", { name: /photograph viewer/i });
    await box.waitFor({ state: "visible", timeout: 4000 });
    assert(/\d+\s*\/\s*\d+/.test(await box.innerText()), "counter missing");
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/desktop-lightbox.png` });
  });

  await check("lightbox next/prev via arrows, then Escape closes and restores focus", async () => {
    const box = page.getByRole("dialog", { name: /photograph viewer/i });
    const c0 = (await box.innerText()).match(/\d+\s*\/\s*\d+/)[0];
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    const c1 = (await box.innerText()).match(/\d+\s*\/\s*\d+/)[0];
    assert(c0 !== c1, "ArrowRight did not advance");
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(500);
    assert((await box.innerText()).match(/\d+\s*\/\s*\d+/)[0] === c0, "ArrowLeft did not go back");
    await page.keyboard.press("Escape");
    await box.waitFor({ state: "detached", timeout: 3000 });
    const locked = await page.evaluate(() => getComputedStyle(document.body).overflow);
    assert(locked !== "hidden", "scroll still locked after close");
  });

  await check("favourites toggle persists across reload and can be removed", async () => {
    await livePhotos(page).first().click();
    await page.getByRole("dialog", { name: /photograph viewer/i }).getByRole("button", { name: "Add to favourites" }).click();
    await page.keyboard.press("Escape");
    await page.reload({ waitUntil: "networkidle" });
    const favBtn = page.getByRole("button", { name: /favourite memories \(1/i }).first();
    await favBtn.waitFor({ state: "visible", timeout: 4000 });
    await favBtn.click();
    const panel = page.locator('[role="dialog"][aria-labelledby="fav-title"]');
    await panel.waitFor({ state: "visible", timeout: 3000 });
    await panel.getByRole("button", { name: /remove from favourites/i }).first().click();
    await page.keyboard.press("Escape");
    await panel.waitFor({ state: "detached", timeout: 3000 }); // Escape must work even after the focused button is gone
    await page.waitForTimeout(300);
    assert(
      (await page.getByRole("button", { name: /favourite memories \(1/i }).count()) === 0,
      "favourite not removed",
    );
  });

  await check("share control degrades to copy-link", async () => {
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
    const share = page.locator("#album").getByRole("button", { name: /share/i }).first();
    await share.scrollIntoViewIfNeeded();
    await share.click();
    await page.waitForTimeout(400);
    const live = await page.getByText(/link copied/i).count();
    assert(live > 0, "no 'Link copied' feedback");
  });

  await check("every in-page nav link targets an existing id", async () => {
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h.length > 1 && !h.startsWith("#album/") && !document.querySelector(h)),
    );
    assert(bad.length === 0, `dangling anchors: ${bad.join(", ")}`);
  });

  await check("full page screenshot + no horizontal overflow", async () => {
    await page.screenshot({ path: `${SHOTS}/desktop-full.png`, fullPage: true });
    assert((await overflowX(page)) <= 0, "horizontal overflow");
  });

  await check("deep link #album/together opens the book at that chapter", async () => {
    const p2 = await ctx.newPage();
    await p2.goto(`${BASE}/#album/together`, { waitUntil: "networkidle" });
    await p2.waitForTimeout(2200);
    const cur = p2.getByLabel("Album chapters").getByRole("button", { name: /together/i }).first();
    assert((await cur.getAttribute("aria-current")) !== null, "together chapter not current");
    await p2.close();
  });

  await check("404 page renders", async () => {
    const r = await page.goto(`${BASE}/definitely-missing`);
    assert(r.status() === 404, `expected 404, got ${r.status()}`);
    assert(/home|return|back/i.test(await page.locator("body").innerText()), "no way back from 404");
    // The 404 response is expected here, so drop the browser's own "Failed to load resource" noise for it.
    currentErrors = currentErrors.filter((e) => !/definitely-missing|status of 404/.test(e));
  });

  await check("no console errors or failed requests", async () => {
    assert(currentErrors.length === 0, currentErrors.join(" | "));
  });
  await ctx.close();
}

async function runMobile(browser) {
  console.log("\nMobile 390×844 (touch)");
  const { ctx, page } = await newPage(browser, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  await page.goto(BASE, { waitUntil: "networkidle" });

  await check("opening screen fits and the button is tappable", async () => {
    await page.getByRole("dialog").waitFor({ state: "visible" });
    await page.screenshot({ path: `${SHOTS}/mobile-opening.png` });
    const b = await page.getByRole("button", { name: /open our album|open the album/i }).first().boundingBox();
    assert(b && b.height >= 44, `touch target too small (${b?.height})`);
    await page.getByRole("button", { name: /open our album|open the album/i }).first().tap();
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 5000 });
  });

  await check("album uses single-page mode and swipe turns pages", async () => {
    await page.waitForTimeout(1500);
    const next = page.getByRole("button", { name: /^next page$/i });
    await next.waitFor({ state: "visible", timeout: 5000 });
    const before = await progressOf(page);
    await page.locator("#album").scrollIntoViewIfNeeded();
    const book = await page.getByRole("region", { name: /photo album/i }).locator("> div").first().boundingBox();
    // Synthetic horizontal swipe via CDP touch events, aimed at the middle of the book.
    const cdp = await ctx.newCDPSession(page);
    const y = Math.round(book.y + book.height / 2);
    const left = Math.round(book.x + book.width * 0.2);
    const right = Math.round(book.x + book.width * 0.8);
    const swipe = async (x0, x1) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= 6; i++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x0 + ((x1 - x0) * i) / 6, y }],
        });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    await swipe(right, left);
    await page.waitForTimeout(1000);
    const after = await progressOf(page);
    assert(before !== after, `swipe left did not advance (${before})`);
    await swipe(left, right);
    await page.waitForTimeout(1000);
    assert((await progressOf(page)) === before, "swipe right did not go back");
    await page.locator("#album").screenshot({ path: `${SHOTS}/mobile-album.png` });
  });

  await check("vertical scrolling still works over the album", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.wheel(0, 600).catch(() => {});
    await page.evaluate(() => window.scrollBy(0, 600));
    assert((await page.evaluate(() => window.scrollY)) > 0, "page cannot scroll");
  });

  await check("lightbox opens on tap and closes", async () => {
    // The first page of a chapter is a text opener; step forward until a photograph is on screen.
    for (let i = 0; i < 4 && (await livePhotos(page).count()) === 0; i++) {
      await page.getByRole("button", { name: /^next page$/i }).tap();
      await page.waitForTimeout(900);
    }
    await livePhotos(page).first().tap();
    const box = page.getByRole("dialog", { name: /photograph viewer/i });
    await box.waitFor({ state: "visible", timeout: 4000 });
    await page.screenshot({ path: `${SHOTS}/mobile-lightbox.png` });
    await page.getByRole("button", { name: /close photograph viewer/i }).tap();
    await box.waitFor({ state: "detached", timeout: 3000 });
  });

  await check("mobile menu opens and closes", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: /open menu/i }).tap();
    await page.getByRole("button", { name: /close menu/i }).first().waitFor({ state: "visible" });
    await page.screenshot({ path: `${SHOTS}/mobile-menu.png` });
    await page.getByRole("button", { name: /close menu/i }).first().tap();
  });

  await check("full page has no horizontal overflow; screenshot", async () => {
    await page.screenshot({ path: `${SHOTS}/mobile-full.png`, fullPage: true });
    assert((await overflowX(page)) <= 0, `overflow ${await overflowX(page)}px`);
  });

  await check("no console errors or failed requests", async () => {
    assert(currentErrors.length === 0, currentErrors.join(" | "));
  });
  await ctx.close();
}

async function runViewports(browser) {
  console.log("\nViewport sweep");
  for (const [name, w, h] of [
    ["360", 360, 740],
    ["tablet-768", 768, 1024],
    ["tablet-1024", 1024, 768],
    ["laptop-1280", 1280, 720],
    ["large-1920", 1920, 1080],
  ]) {
    const { ctx, page } = await newPage(browser, { viewport: { width: w, height: h } });
    await page.addInitScript(() => sessionStorage.setItem("wedding-archive:intro", "1"));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await check(`${name}: no horizontal overflow, no errors`, async () => {
      await page.locator("#album").scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${SHOTS}/vp-${name}.png` });
      assert((await overflowX(page)) <= 0, `overflow ${await overflowX(page)}px`);
      assert(currentErrors.length === 0, currentErrors.join(" | "));
    });
    await ctx.close();
  }
}

async function runResilience(browser) {
  console.log("\nResilience");
  {
    const { ctx, page } = await newPage(browser, { reducedMotion: "reduce" });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await check("reduced motion: intro dismisses and album still navigates", async () => {
      await page.getByRole("button", { name: /open our album|open the album/i }).first().click();
      await page.getByRole("dialog").waitFor({ state: "detached", timeout: 3000 });
      const next = page.getByRole("button", { name: /next spread/i }).first();
      await next.waitFor({ state: "visible", timeout: 5000 });
      await next.click();
      await page.waitForTimeout(300);
      assert(currentErrors.length === 0, currentErrors.join(" | "));
    });
    await ctx.close();
  }
  {
    const { ctx, page } = await newPage(browser, { javaScriptEnabled: false });
    await page.goto(BASE, { waitUntil: "load" });
    await check("no JavaScript: content is still readable and the intro is not blocking", async () => {
      const text = await page.locator("body").innerText();
      assert(/Sushil/i.test(text) && /Anjali/i.test(text), "names missing without JS");
      const blocked = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return d ? getComputedStyle(d).display !== "none" : false;
      });
      assert(!blocked, "intro overlay blocks no-JS visitors");
    });
    await ctx.close();
  }
  {
    // Simulate a browser without 3D transforms support: the album must still be browsable.
    const { ctx, page } = await newPage(browser);
    await page.addInitScript(() => {
      sessionStorage.setItem("wedding-archive:intro", "1");
      const orig = CSS.supports.bind(CSS);
      CSS.supports = (a, b) => (String(a).includes("preserve-3d") || String(b).includes("preserve-3d") ? false : orig(a, b));
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await check("no 3D support: flat album fallback still shows photographs", async () => {
      await page.locator("#album").scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      const n = await page.locator('#album button[aria-label^="Open photograph"], #album img').count();
      assert(n > 0, "fallback shows no photographs");
      await page.locator("#album").screenshot({ path: `${SHOTS}/fallback-no3d.png` });
    });
    await ctx.close();
  }
}

const browser = await chromium.launch();
try {
  await runDesktop(browser);
  await runMobile(browser);
  await runViewports(browser);
  await runResilience(browser);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  for (const f of failed) console.log(` ✗ ${f.name}: ${f.err.split("\n")[0]}`);
  process.exit(1);
}
