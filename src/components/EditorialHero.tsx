import { featuredPhoto } from "@/content/album";
import { site } from "@/content/site";
import { OpenAlbumButton } from "./OpenAlbumButton";
import { PhotoFrame } from "./PhotoFrame";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` });

/** The first screen of the site proper: names, date, featured photograph. */
export function EditorialHero() {
  const [a, b] = site.names;
  return (
    <section id="top" aria-labelledby="hero-title" className="grain relative isolate overflow-hidden bg-ivory">
      <div className="mx-auto grid min-h-dvh max-w-[1500px] items-center gap-12 px-6 pb-20 pt-28 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pt-24">
        <div>
          <p className="eyebrow hero-rise text-gold-deep" style={d(0)}>
            {site.weddingDateDisplay} · {site.location}
          </p>
          <h1 id="hero-title" className="font-display t-hero mt-6">
            <span className="hero-rise block" style={d(150)}>
              {a}
            </span>
            <span className="hero-rise block italic text-burgundy" style={d(320)}>
              &amp; {b}
            </span>
          </h1>
          <div className="hairline hero-rise mt-10 w-44" style={d(520)} />
          <p className="t-lead italic-serif hero-rise mt-8 max-w-md text-espresso/85" style={d(650)}>
            {site.openingLine}
          </p>
          <div className="hero-rise mt-10 flex flex-wrap gap-4" style={d(800)}>
            <OpenAlbumButton>Open the album</OpenAlbumButton>
            <a href="#memories" className="btn btn-dark">
              See the memories
            </a>
          </div>
        </div>

        <figure className="hero-rise relative mx-auto w-full max-w-[540px] lg:ml-auto" style={d(500)}>
          <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 border" style={{ borderColor: "var(--gold)" }} />
          <PhotoFrame
            photo={featuredPhoto}
            priority
            sizes="(min-width: 1024px) 40vw, 92vw"
            className="relative w-full shadow-[0_30px_60px_-30px_rgba(48,39,32,.5)]"
            style={{ aspectRatio: String(featuredPhoto.aspect) }}
          />
        </figure>
      </div>
      <a
        href="#couple"
        aria-label="Scroll to the introduction"
        className="eyebrow absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-taupe-deep lg:flex"
      >
        Scroll
        <span aria-hidden className="h-8 w-px bg-gold" />
      </a>
    </section>
  );
}
