import { closingPhoto } from "@/content/album";
import { site, siteName } from "@/content/site";
import { PhotoFrame } from "./PhotoFrame";
import { Reveal } from "./Reveal";

/** An intimate, understated ending. */
export function ClosingSection() {
  return (
    <section id="closing" aria-labelledby="closing-title" className="on-dark grain grain-light relative isolate overflow-hidden bg-espresso text-ivory">
      {closingPhoto.src && (
        <>
          <PhotoFrame photo={closingPhoto} sizes="100vw" interactive={false} className="absolute inset-0 -z-10 h-full w-full opacity-60" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-espresso via-espresso/40 to-espresso" />
        </>
      )}
      <div className="mx-auto flex min-h-[85dvh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
        <Reveal>
          <div className="hairline mx-auto mb-10 w-24" />
          <h2 id="closing-title" className="font-display t-title">
            {site.closingLine}
          </h2>
        </Reveal>
        <Reveal delay={300} className="mt-14">
          <p className="font-display text-3xl italic text-gold sm:text-4xl">{siteName}</p>
          <p className="eyebrow mt-4 text-ivory/80">
            {site.weddingDateDisplay} · {site.location}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
