import { allPhotos, chapters } from "@/content/album";
import { site } from "@/content/site";
import { Reveal } from "./Reveal";

/** A short introduction to the archive. Every figure here is derived from the real content. */
export function CoupleIntro() {
  const [a, b] = site.names;
  const realCount = allPhotos().filter((p) => p.src).length;
  const facts: [string, string][] = [
    ["Married", site.weddingDateDisplay],
    ["Where", `${site.location}, India`],
    ["In the album", `${chapters.length} chapters`],
    ...(realCount > 0 ? ([["Photographs", String(realCount)]] as [string, string][]) : []),
  ];
  return (
    <section id="couple" data-nav aria-labelledby="couple-title" className="bg-paper px-6 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className="eyebrow text-gold-deep">The Archive</p>
          <h2 id="couple-title" className="font-display t-title mt-5">
            {site.tagline}
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="t-lead italic-serif mx-auto mt-8 max-w-2xl text-espresso/85">
            This is where the day is kept: the photographs, the people, and the small moments in between. {a} and {b} were
            married in {site.location} on {site.weddingDateDisplay}.
          </p>
        </Reveal>
        <Reveal delay={250}>
          <dl className="mx-auto mt-16 grid max-w-3xl gap-y-8 border-y border-gold/40 py-10 sm:grid-flow-col sm:auto-cols-fr">
            {facts.map(([k, v]) => (
              <div key={k} className="px-4">
                <dt className="eyebrow text-taupe-deep">{k}</dt>
                <dd className="font-display mt-2 text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
