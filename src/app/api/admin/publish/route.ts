import { NextResponse } from "next/server";
import sharp from "sharp";
import { isAdmin } from "@/lib/adminAuth";
import { slotKeys } from "@/lib/adminSlots";
import { publish, storageMode, type Edit } from "@/lib/adminStore";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FILE = 25 * 1024 * 1024;
const MAX_FILES = 30;
const FOCUS = /^(\d{1,3}(\.\d+)?)% (\d{1,3}(\.\d+)?)%$/;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("Please sign in again.", 401);
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail("Cross-site request refused.", 403);
  if (storageMode() === "none")
    return fail("Publishing isn't set up yet: add GITHUB_TOKEN in the hosting settings (see the README).", 503);

  let form: FormData;
  try { form = await req.formData(); } catch { return fail("Could not read the upload."); }
  const known = slotKeys();

  let edits: Record<string, Edit> = {};
  try { edits = JSON.parse(String(form.get("edits") ?? "{}")); } catch { return fail("Bad edit data."); }
  for (const [key, e] of Object.entries(edits)) {
    if (!known.has(key)) return fail(`Unknown photo "${key}".`);
    if (e.focus && !FOCUS.test(e.focus)) return fail("Bad focus point.");
    if (e.alt && e.alt.length > 400) return fail("Description is too long (400 characters max).");
  }

  const images: Record<string, Buffer> = {};
  for (const [name, value] of form.entries()) {
    if (!name.startsWith("file:") || typeof value === "string") continue;
    const key = name.slice(5);
    if (!known.has(key)) return fail(`Unknown photo "${key}".`);
    if (Object.keys(images).length >= MAX_FILES) return fail("Too many photos at once.");
    if (value.size > MAX_FILE) return fail("One of the photos is larger than 25 MB.");
    try {
      // Straighten by EXIF, drop all metadata (including location), cap the size, re-encode.
      images[key] = await sharp(Buffer.from(await value.arrayBuffer()))
        .rotate()
        .resize({ width: 3200, height: 3200, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
    } catch {
      return fail(`"${key}" doesn't look like a photo this console can read. Try a JPEG or PNG.`, 415);
    }
  }
  if (!Object.keys(images).length && !Object.keys(edits).length) return fail("Nothing to publish.");

  try {
    return NextResponse.json({ ok: true, ...(await publish({ images, edits })) });
  } catch (err) {
    console.error("[admin] publish failed", err);
    return fail("Publishing failed. Nothing was changed on the site. " + (err instanceof Error ? err.message : ""), 502);
  }
}
