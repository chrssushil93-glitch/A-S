"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { site, siteName } from "@/content/site";
import { useFocusTrap, useScrollLock } from "@/lib/hooks";
import { MusicToggle } from "./MusicToggle";
import { usePhotos } from "./PhotoProvider";
import { ShareControl } from "./ShareControl";

/** Slim, fixed header: names, section links, and the few global actions. */
export function SiteHeader() {
  const { favourites, openFavourites } = usePhotos();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useScrollLock(menuOpen);
  useFocusTrap(menuOpen, menuRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently crossing the middle of the viewport.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const ids = site.nav.map((n) => n.id);
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const favCount = favourites.ids.length;

  return (
    <>
      <a
        href="#album"
        className="sr-only z-[120] bg-paper px-4 py-3 text-espresso focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to the album
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow] duration-500 ${
          scrolled ? "bg-ivory/90 shadow-[0_1px_0_rgba(168,155,139,.35)] backdrop-blur" : "bg-transparent"
        }`}
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8">
          <a href="#top" className="font-display text-xl text-espresso" aria-label={`${siteName}: back to the top`}>
            <span className="sm:hidden" aria-hidden>
              S <span className="italic text-burgundy">&amp;</span> A
            </span>
            <span className="hidden sm:inline" aria-hidden>
              {site.names[0]} <span className="italic text-burgundy">&amp;</span> {site.names[1]}
            </span>
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {site.nav.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    aria-current={active === n.id ? "location" : undefined}
                    className={`eyebrow inline-flex min-h-11 items-center px-3 transition-colors ${
                      active === n.id ? "text-burgundy" : "text-espresso/70 hover:text-espresso"
                    }`}
                    style={active === n.id ? { boxShadow: "inset 0 -2px 0 var(--burgundy)" } : undefined}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 text-espresso">
            <button type="button" onClick={openFavourites} className="icon-btn relative max-sm:hidden" aria-label={`Favourite memories (${favCount})`}>
              <Heart size={18} aria-hidden fill={favCount ? "currentColor" : "none"} />
              {favCount > 0 && (
                <span aria-hidden className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-burgundy px-1 text-[0.65rem] text-ivory">
                  {favCount}
                </span>
              )}
            </button>
            <span className="max-sm:hidden">
              <ShareControl iconOnly label="Share this website" />
            </span>
            <MusicToggle />
            <button
              ref={menuButtonRef}
              type="button"
              className="icon-btn lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
            >
              <Menu size={20} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          className="on-dark fixed inset-0 z-[95] flex flex-col bg-espresso px-8 pb-[max(2rem,var(--safe-bottom))] pt-[max(1rem,var(--safe-top))] text-ivory"
        >
          <div className="flex h-14 items-center justify-between">
            <p className="font-display text-xl">{siteName}</p>
            <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X size={20} aria-hidden />
            </button>
          </div>
          <nav aria-label="Menu" className="mt-8">
            <ul className="space-y-1">
              {site.nav.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active === n.id ? "location" : undefined}
                    className="font-display flex min-h-14 items-center text-4xl"
                    style={active === n.id ? { color: "var(--gold)", boxShadow: "inset 0 -1px 0 var(--gold)" } : undefined}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                setMenuOpen(false);
                openFavourites();
              }}
            >
              <Heart size={15} aria-hidden /> Favourites{favCount ? ` (${favCount})` : ""}
            </button>
            <ShareControl label="Share" />
          </div>
        </div>
      )}
    </>
  );
}
