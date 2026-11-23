import { chapters, coverPhoto, featuredPhoto, closingPhoto } from "@/content/album";
import type { Photo } from "@/lib/types";

export interface Slot {
  key: string; // "folder/id"
  group: string;
  label: string;
  photo: Pick<Photo, "id" | "folder" | "src" | "width" | "height" | "alt" | "focus" | "aspect">;
}

const pick = (p: Photo): Slot["photo"] => ({
  id: p.id, folder: p.folder, src: p.src, width: p.width, height: p.height, alt: p.alt, focus: p.focus, aspect: p.aspect,
});

/** Every replaceable photograph, in the order a visitor meets them. */
export function getSlots(): Slot[] {
  const seen = new Set<string>();
  const out: Slot[] = [];
  const add = (p: Photo, group: string, label: string) => {
    const key = `${p.folder}/${p.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ key, group, label, photo: pick(p) });
  };
  add(coverPhoto, "Cover & homepage", "Album cover");
  add(featuredPhoto, "Cover & homepage", "Homepage hero");
  add(closingPhoto, "Cover & homepage", "Closing image");
  for (const c of chapters) {
    let n = 0;
    for (const s of c.spreads) for (const p of s.images) add(p, c.title, `Photo ${++n}`);
  }
  return out;
}

export const slotKeys = () => new Set(getSlots().map((s) => s.key));
