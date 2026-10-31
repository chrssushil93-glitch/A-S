// Regenerates the favicon, Apple icon and social-sharing image from src/content/site.ts.
// Optional: the generated files are committed, so you only need this if you change names/date/place.
// Requires Playwright (not a project dependency):  npm i -D playwright && npx playwright install chromium
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = await fs.readFile(path.join(root, "src/content/site.ts"), "utf8");
const pick = (re) => src.match(re)?.[1];
const [a, b] = src.match(/names:\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"/).slice(1);
const date = pick(/weddingDateDisplay:\s*"([^"]+)"/);
const place = pick(/location:\s*"([^"]+)"/);
// Embedded as data URIs: an in-memory page may not load file:// fonts.
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(root, "src/fonts", f)).toString("base64")}`;

const css = `
@font-face{font-family:C;font-weight:400;src:url(${font("cormorant-garamond-latin-400-normal.woff2")})}
@font-face{font-family:C;font-weight:500;src:url(${font("cormorant-garamond-latin-500-normal.woff2")})}
@font-face{font-family:C;font-style:italic;font-weight:400;src:url(${font("cormorant-garamond-latin-400-italic.woff2")})}
@font-face{font-family:M;font-weight:200 800;src:url(${font("manrope-latin-wght-normal.woff2")})}
*{box-sizing:border-box;margin:0}
body{background:#302720;color:#f7f2ea;display:grid;place-items:center;overflow:hidden}
.frame{position:absolute;border:1px solid rgba(198,164,106,.7)}
`;

const pages = {
  "opengraph-image.png": {
    w: 1200,
    h: 630,
    html: `<style>${css}body{width:1200px;height:630px;text-align:center}
      .frame{inset:28px}.frame.b{inset:40px;border-color:rgba(198,164,106,.3)}
      .eb{font:500 17px M;letter-spacing:.42em;text-transform:uppercase;color:#c6a46a}
      h1{font:400 112px/1.02 C;letter-spacing:.04em;text-transform:uppercase;margin:34px 0 8px}
      h1 i{display:block;font-size:64px;text-transform:none;color:#c6a46a;letter-spacing:0;margin:6px 0}
      hr{width:180px;border:0;height:1px;background:#c6a46a;margin:30px auto}
      .d{font:500 18px M;letter-spacing:.34em;text-transform:uppercase;color:#f7f2ea}</style>
      <div class="frame"></div><div class="frame b"></div>
      <main><p class="eb">The Wedding Archive</p><h1>${a}<i>&amp;</i>${b}</h1><hr><p class="d">${date} · ${place}</p></main>`,
  },
  "icon.png": {
    w: 512,
    h: 512,
    html: `<style>${css}body{width:512px;height:512px}.frame{inset:26px;border-color:rgba(198,164,106,.8)}
      p{font:italic 400 250px/1 C;color:#c6a46a;letter-spacing:-.02em;transform:translateY(-14px)}</style>
      <div class="frame"></div><p>${a[0]}&amp;${b[0]}</p>`,
  },
  "apple-icon.png": {
    w: 180,
    h: 180,
    html: `<style>${css}body{width:180px;height:180px}.frame{inset:9px;border-color:rgba(198,164,106,.8)}
      p{font:italic 400 88px/1 C;color:#c6a46a;letter-spacing:-.02em;transform:translateY(-5px)}</style>
      <div class="frame"></div><p>${a[0]}&amp;${b[0]}</p>`,
  },
};

const { chromium } = createRequire(import.meta.url)("playwright"); // resolves local installs and NODE_PATH
const browser = await chromium.launch();
for (const [file, { w, h, html }] of Object.entries(pages)) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<!doctype html><meta charset=utf-8>${html}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, "src/app", file) });
  await page.close();
  console.log("wrote src/app/" + file);
}
await browser.close();
await fs.copyFile(path.join(root, "src/app/opengraph-image.png"), path.join(root, "src/app/twitter-image.png"));
const alt = `${a} & ${b} — The Wedding Archive, ${date}, ${place}`;
await fs.writeFile(path.join(root, "src/app/opengraph-image.alt.txt"), alt + "\n");
await fs.writeFile(path.join(root, "src/app/twitter-image.alt.txt"), alt + "\n");
