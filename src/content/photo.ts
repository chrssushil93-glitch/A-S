import type { ImageFolder, Photo } from "@/lib/types";
import rawManifest from "./image-manifest.json";
import { site } from "./site";
import rawOverrides from "./overrides.json";

type ManifestEntry = { src: string; width?: number; height?: number };
const manifest = rawManifest as Record<string, ManifestEntry>;
/** Text and crop edits made in the admin console (src/content/overrides.json), keyed "folder/id". */
const overrides = rawOverrides as Record<string, { alt?: string; focus?: string }>;

interface PhotoOptions {
  alt: string;
  caption?: string;
  date?: string;
  /** Width / height. Only used until a real file exists (the real dimensions win). */
  aspect?: number;
  focus?: string;
  downloadable?: boolean;
}

/**
 * Declare a photograph by id. If a file named `<id>.jpg|png|webp|avif` exists in
 * public/images/<folder>/ the photo is used automatically; otherwise a tasteful
 * placeholder frame is shown. Never fabricates an image URL.
 */
export function photo(id: string, folder: ImageFolder, opts: PhotoOptions): Photo {
  const entry = manifest[`${folder}/${id}`];
  const aspect =
    entry?.width && entry?.height ? entry.width / entry.height : (opts.aspect ?? 1.5);
  const edit = overrides[`${folder}/${id}`];
  return {
    id,
    folder,
    src: entry?.src,
    width: entry?.width,
    height: entry?.height,
    aspect,
    alt: edit?.alt || opts.alt,
    caption: opts.caption,
    date: opts.date,
    focus: edit?.focus || opts.focus,
    downloadable: opts.downloadable ?? site.allowDownloads,
  };
}
