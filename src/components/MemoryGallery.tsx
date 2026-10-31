"use client";

import { useMemo } from "react";
import { allPhotos, chapterPhotos, chapters, hasRealPhotos } from "@/content/album";
import { site } from "@/content/site";
import type { Photo } from "@/lib/types";
import { ChapterLink } from "./OpenAlbumButton";
import { EmptyAlbumState } from "./EmptyAlbumState";
import { PhotoFrame } from "./PhotoFrame";
import { usePhotos } from "./PhotoProvider";
import { Reveal } from "./Reveal";

/** An asymmetrical rhythm of column spans and offsets, repeated as needed. */
const RHYTHM = [
  { span: "md:col-span-5", lift: "", ratio: 0.8 },
  { span: "md:col-span-7", lift: "md:mt-20", ratio: 1.4 },
  { span: "md:col-span-4", lift: "md:-mt-6", ratio: 0.75 },
  { span: "md:col-span-4", lift: "md:mt-16", ratio: 1 },
  { span: "md:col-span-4", lift: "", ratio: 0.8 },
  { span: "md:col-span-7", lift: "md:-mt-4", ratio: 1.5 },
  { span: "md:col-span-5", lift: "md:mt-14", ratio: 0.8 },
  { span: "md:col-span-6", lift: "", ratio: 1.2 },
];

interface Tile {
  photo: Photo;
  chapterId: string;
  chapterTitle: string;
}

/** "Selected memories": a curated, editorial mosaic drawn from the chapters named in site.ts. */
export function MemoryGallery() {
  const { openPhoto, favourites } = usePhotos();

  const tiles = useMemo<Tile[]>(() => {
    const real = hasRealPhotos();
    return site.memoryChapterIds.flatMap((id) => {
      const chapter = chapters.find((c) => c.id === id);
      if (!chapter) return [];
      const pool = chapterPhotos(id);
      // Once real photographs exist, only show real ones; before that, show the placeholder frames.
      const chosen = (real ? pool.filter((p) => p.src) : pool).slice(0, 2);
      return chosen.map((photo) => ({ photo, chapterId: id, chapterTitle: chapter.title }));
    });
  }, []);

  const everything = useMemo(() => {
    const all = allPhotos();
    const real = all.filter((p) => p.src);
    return real.length ? real : all;
  }, []);

  return (
    <section id="memories" data-nav aria-labelledby="memories-title" className="bg-ivory px-5 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold-deep">Selected memories</p>
          <h2 id="memories-title" className="font-display t-title mt-4">
            A few frames to begin with
          </h2>
          <p className="mt-5 text-espresso/75">
            Tap a photograph to see it full size, mark the ones you love with a heart, or open its chapter in the album.
          </p>
        </Reveal>

        {!hasRealPhotos() && <EmptyAlbumState tone="light" />}

        <ul className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-12 md:items-start">
          {tiles.map((t, i) => {
            const r = RHYTHM[i % RHYTHM.length];
            const ratio = t.photo.src ? Math.min(1.8, Math.max(0.6, t.photo.aspect)) : r.ratio;
            return (
              <Reveal as="li" key={t.photo.id} delay={(i % 3) * 90} className={`${r.span} ${r.lift}`}>
                <figure className="group">
                  <div className="relative overflow-hidden">
                    <PhotoFrame
                      photo={t.photo}
                      sizes="(min-width: 1024px) 45vw, 92vw"
                      list={everything}
                      favouriteToggle
                      className="w-full"
                      style={{ aspectRatio: String(ratio) }}
                    />
                    {t.photo.caption && (
                      <figcaption
                        className="italic-serif pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-espresso/70 to-transparent px-4 pb-3 pt-10 text-lg text-ivory opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                      >
                        {t.photo.caption}
                      </figcaption>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-taupe-deep">
                    <p className="eyebrow">{t.chapterTitle}</p>
                    <ChapterLink chapterId={t.chapterId} className="text-espresso">
                      View in album <span aria-hidden>→</span>
                    </ChapterLink>
                  </div>
                </figure>
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-20 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => everything[0] && openPhoto(everything[0], everything)}
          >
            View all memories
          </button>
          {favourites.ids.length > 0 && (
            <p className="text-sm text-taupe-deep" role="status">
              {favourites.ids.length} saved on this device
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
