import { chapterPhotos, chapters, hasRealPhotos } from "@/content/album";
import { site } from "@/content/site";
import { ChapterLink } from "./OpenAlbumButton";
import { PhotoFrame } from "./PhotoFrame";
import { Reveal } from "./Reveal";

/** The Family & Friends chapter as a flowing, masonry-style gallery. Hidden if the chapter is removed. */
export function FamilyGallery() {
  const chapter = chapters.find((c) => c.id === site.familyChapterId);
  if (!chapter) return null;
  const pool = chapterPhotos(chapter.id);
  const real = pool.filter((p) => p.src);
  const photos = (hasRealPhotos() ? real : pool).slice(0, 9);
  if (photos.length === 0) return null;

  return (
    <section id="family" data-nav aria-labelledby="family-title" className="bg-ivory px-5 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold-deep">{chapter.title}</p>
          <h2 id="family-title" className="font-display t-title mt-4">
            The people who made the day
          </h2>
          <p className="italic-serif mt-5 text-xl text-espresso/80">{chapter.introduction}</p>
        </Reveal>

        <ul className="mt-16 columns-2 gap-4 md:columns-3 md:gap-6">
          {photos.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 3) * 80} className="mb-4 break-inside-avoid md:mb-6">
              <PhotoFrame
                photo={p}
                sizes="(min-width: 768px) 30vw, 46vw"
                list={photos}
                favouriteToggle
                className="w-full"
                style={{ aspectRatio: String(Math.min(1.6, Math.max(0.65, p.aspect))) }}
              />
            </Reveal>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <ChapterLink chapterId={chapter.id}>Open this chapter in the album →</ChapterLink>
        </div>
      </div>
    </section>
  );
}
