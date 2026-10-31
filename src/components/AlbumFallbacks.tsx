"use client";

import { chapters } from "@/content/album";
import { PhotoFrame } from "./PhotoFrame";

/**
 * Every photograph, chapter by chapter, with no 3D and no state.
 * Shown if the book fails to render, and inside <noscript>.
 */
export function AlbumGridFallback() {
  return (
    <div className="mx-auto mt-10 max-w-6xl space-y-12 text-left">
      {chapters.map((c) => {
        const seen = new Set<string>();
        const photos = c.spreads.flatMap((s) => s.images).filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
        return (
          <section key={c.id} aria-label={c.title}>
            <h3 className="font-display text-3xl">{c.title}</h3>
            <p className="italic-serif mt-1 text-lg opacity-80">{c.introduction}</p>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p) => (
                <li key={p.id}>
                  <PhotoFrame photo={p} sizes="(min-width: 1024px) 22vw, 46vw" list={photos} className="w-full" style={{ aspectRatio: "4 / 5" }} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
