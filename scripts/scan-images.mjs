// Scans public/images/** and writes src/content/image-manifest.json,
// and picks the first audio file in public/audio/ for src/content/audio-manifest.json.
// Run automatically before `npm run dev` and `npm run build`; run manually with `npm run photos`.
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = path.join(root, "public", "images");
const outFile = path.join(root, "src", "content", "image-manifest.json");
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("[photos] sharp not available — image dimensions will be omitted.");
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (exts.has(path.extname(e.name).toLowerCase())) files.push(full);
  }
  return files;
}

const manifest = {};
for (const file of (await walk(imagesDir)).sort()) {
  const rel = path.relative(imagesDir, file).split(path.sep).join("/");
  const [folder, ...rest] = rel.split("/");
  const name = rest.join("/");
  if (!name) continue;
  const id = name.slice(0, name.length - path.extname(name).length);
  let width;
  let height;
  if (sharp) {
    try {
      const meta = await sharp(file).metadata();
      // Account for EXIF rotation so portrait photos report portrait dimensions.
      const rotated = meta.orientation && meta.orientation >= 5;
      width = rotated ? meta.height : meta.width;
      height = rotated ? meta.width : meta.height;
    } catch (err) {
      console.warn(`[photos] could not read ${rel}: ${err.message}`);
    }
  }
  // Content hash in the URL: a replaced photo gets a new address, so browsers and the image
  // optimizer never serve the old picture from cache.
  const v = createHash("sha1").update(await fs.readFile(file)).digest("hex").slice(0, 8);
  manifest[`${folder}/${id}`] = { src: `/images/${rel}?v=${v}`, width, height };
}

await fs.mkdir(path.dirname(outFile), { recursive: true });
await fs.writeFile(outFile, JSON.stringify(manifest, null, 2) + "\n");
console.log(`[photos] ${Object.keys(manifest).length} photograph(s) found.`);

// --- Optional background music -------------------------------------------------
const audioDir = path.join(root, "public", "audio");
const audioExts = new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"]);
const audioFiles = (await fs.readdir(audioDir).catch(() => []))
  .filter((f) => audioExts.has(path.extname(f).toLowerCase()))
  .sort();
await fs.writeFile(
  path.join(root, "src", "content", "audio-manifest.json"),
  JSON.stringify(audioFiles.length ? { src: `/audio/${audioFiles[0]}` } : {}, null, 2) + "\n",
);
console.log(audioFiles.length ? `[photos] music: ${audioFiles[0]}` : "[photos] no music file (music control hidden).");
