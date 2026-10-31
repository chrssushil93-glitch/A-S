import { timeline } from "@/content/album";
import { PhotoFrame } from "./PhotoFrame";
import { Reveal } from "./Reveal";

/** "Our Story": an editable timeline. Entries live in src/content/album.ts. */
export function StoryTimeline() {
  return (
    <section id="story" data-nav aria-labelledby="story-title" className="bg-paper px-6 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className="eyebrow text-gold-deep">Our Story</p>
          <h2 id="story-title" className="font-display t-title mt-4">
            In their own time
          </h2>
        </Reveal>

        <ol className="relative mt-20">
          <span aria-hidden className="absolute bottom-0 left-4 top-0 w-px bg-gold/50 md:left-1/2" />
          {timeline.map((e, i) => {
            const right = i % 2 === 1;
            return (
              <Reveal as="li" key={e.id} className="relative mb-20 last:mb-0 md:grid md:grid-cols-2 md:gap-20">
                <span
                  aria-hidden
                  className="absolute left-4 top-3 h-3 w-3 -translate-x-1/2 rounded-full border border-gold bg-paper md:left-1/2"
                />
                <div className={`pl-12 md:pl-0 ${right ? "md:order-2" : "md:text-right"}`}>
                  <p className="eyebrow text-gold-deep">
                    {[e.date, e.location].filter(Boolean).join(" · ") || `Chapter ${String(i + 1).padStart(2, "0")}`}
                  </p>
                  <h3 className="font-display mt-3 text-4xl sm:text-5xl">{e.title}</h3>
                  <p className="mt-4 text-espresso/80">{e.description}</p>
                </div>
                {e.image && (
                  <div className={`mt-8 pl-12 md:mt-0 md:pl-0 ${right ? "md:order-1" : ""}`}>
                    <PhotoFrame
                      photo={e.image}
                      sizes="(min-width: 768px) 36vw, 80vw"
                      className="w-full max-w-sm shadow-[0_24px_50px_-28px_rgba(48,39,32,.55)] md:max-w-none"
                      style={{ aspectRatio: String(Math.min(1.4, Math.max(0.7, e.image.aspect))) }}
                    />
                  </div>
                )}
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
