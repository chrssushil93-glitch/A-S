import { site, siteName } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-espresso px-6 pb-[max(2rem,var(--safe-bottom))] pt-10 text-ivory/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-gold/30 pt-8 text-center sm:flex-row sm:text-left">
        <p className="eyebrow">
          {siteName} · {site.weddingDateShort} · {site.location}
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-2">
            {site.nav.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="eyebrow inline-flex min-h-11 items-center px-3 transition-colors hover:text-ivory">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#top" className="eyebrow inline-flex min-h-11 items-center px-3 text-gold transition-colors hover:text-ivory">
                Back to top ↑
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
