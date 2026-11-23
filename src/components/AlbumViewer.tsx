"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { chapters, hasRealPhotos } from "@/content/album";
import { site } from "@/content/site";
import {
  chapterStartView,
  clamp,
  convertF,
  flattenSpreads,
  pad2,
  singlePagePlan,
  spreadForView,
  viewCount,
  type AlbumMode,
} from "@/lib/albumModel";
import { ALBUM_EVENT, openAlbum, type AlbumNavigateDetail } from "@/lib/albumEvents";
import { useHydrated, useMediaQuery, useSupports3D, useSwipe } from "@/lib/hooks";
import { AlbumBook } from "./AlbumBook";
import { AlbumCover } from "./AlbumCover";
import { AlbumPage } from "./albumPages";
import { AlbumGridFallback } from "./AlbumFallbacks";
import { ChapterNavigator } from "./ChapterNavigator";
import { EmptyAlbumState } from "./EmptyAlbumState";
import { ErrorBoundary } from "./ErrorBoundary";
import { usePhotos } from "./PhotoProvider";
import { ShareControl } from "./ShareControl";

// Static content, so these are computed once.
const FLAT = flattenSpreads(chapters);
const PLAN = singlePagePlan(FLAT);

interface Nav {
  f: number;
  from: number;
  turn: number;
  mode: AlbumMode;
}

/** The whole album section: heading, chapter navigator, book (or flat fallback), and controls. */
export function AlbumViewer() {
  const { favourites, openFavourites } = usePhotos();
  const hydrated = useHydrated();
  const supports3D = useSupports3D();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  // Narrow or portrait screens get a single page at a time; the two-page spread would be unreadably small.
  const single = useMediaQuery("(max-width: 899px), (max-aspect-ratio: 5/4)", false);
  const mode: AlbumMode = single ? "single" : "double";
  const V = viewCount(mode, FLAT, PLAN);

  const [nav, setNav] = useState<Nav>({ f: 0, from: 0, turn: 0, mode: "double" });
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // If the window is resized across the breakpoint, keep the visitor on the same spread.
  const f = nav.mode === mode ? nav.f : convertF(nav.f, nav.mode, mode, FLAT, PLAN);

  const goTo = useCallback(
    (target: number) => {
      setNav((prev) => {
        const cur = prev.mode === mode ? prev.f : convertF(prev.f, prev.mode, mode, FLAT, PLAN);
        const t = clamp(target, 0, V);
        return t === cur ? prev : { f: t, from: cur, turn: prev.turn + 1, mode };
      });
    },
    [mode, V],
  );
  const step = useCallback(
    (d: number) => {
      setNav((prev) => {
        const cur = prev.mode === mode ? prev.f : convertF(prev.f, prev.mode, mode, FLAT, PLAN);
        const t = clamp(cur + d, 0, V);
        return t === cur ? prev : { f: t, from: cur, turn: prev.turn + 1, mode };
      });
    },
    [mode, V],
  );
  const openCover = useCallback(() => {
    setNav((prev) => {
      const cur = prev.mode === mode ? prev.f : convertF(prev.f, prev.mode, mode, FLAT, PLAN);
      return cur > 0 ? prev : { f: 1, from: 0, turn: prev.turn + 1, mode };
    });
  }, [mode]);

  const jumpToChapter = useCallback(
    (chapterId: string) => {
      const start = chapterStartView(mode, FLAT, PLAN, chapterId);
      if (start >= 0) goTo(start + 1);
    },
    [mode, goTo],
  );

  const current = f > 0 ? spreadForView(mode, FLAT, PLAN, f - 1) : undefined;
  const activeChapterId = current?.chapterId;

  // Other sections ask the album to open / jump to a chapter through a window event.
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const d = (e as CustomEvent<AlbumNavigateDetail>).detail ?? {};
      if (d.chapterId) jumpToChapter(d.chapterId);
      else if (d.open) window.setTimeout(openCover, 450); // let the page finish scrolling first
    };
    window.addEventListener(ALBUM_EVENT, onNavigate);
    return () => window.removeEventListener(ALBUM_EVENT, onNavigate);
  }, [jumpToChapter, openCover]);

  // A shared link like  /#album/ceremony  opens the book at that chapter.
  useEffect(() => {
    const m = window.location.hash.match(/^#album\/([\w-]+)$/);
    if (!m || !chapters.some((c) => c.id === m[1])) return;
    const t = window.setTimeout(() => openAlbum(m[1]), 400);
    return () => window.clearTimeout(t);
  }, []);

  // Keep the address bar pointing at the current chapter so the link can be shared truthfully.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (activeChapterId) {
      window.history.replaceState(null, "", `#album/${activeChapterId}`);
    } else if (window.location.hash.startsWith("#album/")) {
      window.history.replaceState(null, "", "#album");
    }
  }, [activeChapterId]);

  // Track whether the album is on screen so the arrow keys only turn pages when it makes sense.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inView || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return; // lightbox etc. handle their own keys
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, step]);

  const swipe = useSwipe((dir) => step(dir === "left" ? 1 : -1));

  const open = f > 0;
  const sizeStyle =
    mode === "double"
      ? { aspectRatio: "1.44 / 1", width: "min(92vw, max(560px, calc((100dvh - 12rem) * 1.44)), 1900px)" }
      : { aspectRatio: "0.72 / 1", width: "min(90vw, max(260px, calc((100dvh - 9rem) * 0.72)), 560px)" };

  const progressTitle = !open ? "The cover" : `Chapter ${pad2((current?.chapterIndex ?? 0) + 1)} · ${current?.chapterTitle ?? ""}`;
  const progressCount = !open
    ? `${V} ${mode === "double" ? "spreads" : "pages"} inside`
    : `${mode === "double" ? "Spread" : "Page"} ${pad2(f)} of ${pad2(V)}`;
  const announce = open ? `${progressTitle}. ${progressCount}.` : "Album closed. Showing the cover.";

  const shareUrl = () =>
    `${window.location.origin}${window.location.pathname}${activeChapterId ? `#album/${activeChapterId}` : "#album"}`;

  // Flat (non-3D) rendering: used when the browser lacks 3D transforms.
  const flatStage = (
    <div key={f} className="fade-in absolute inset-0 grid" style={{ gridTemplateColumns: open && mode === "double" ? "1fr 1fr" : "1fr", ["--d" as string]: "0ms" }}>
      {!open ? (
        <div className="relative">
          <AlbumCover />
          <button type="button" onClick={openCover} aria-label="Open the album" className="absolute inset-0" />
        </div>
      ) : mode === "double" && current ? (
        <>
          <div className="relative">
            <AlbumPage fs={current} part="left" folio={String(2 * current.index + 1)} gutter="right" flip={current.index % 2 === 1} />
          </div>
          <div className="relative">
            <AlbumPage fs={current} part="right" folio={String(2 * current.index + 2)} gutter="left" flip={current.index % 2 === 1} />
          </div>
        </>
      ) : current ? (
        <div className="relative">
          <AlbumPage fs={current} part={PLAN[f - 1].part} folio={String(f)} gutter="none" flip={current.index % 2 === 1} />
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      id="album"
      ref={sectionRef}
      aria-labelledby="album-title"
      data-nav
      className="on-dark grain grain-light relative overflow-hidden bg-espresso text-ivory"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 55% at 50% 45%, rgba(198,164,106,.10), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[1900px] px-4 pb-20 pt-24 sm:px-8 sm:pt-32">
        <header className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold">The Album</p>
          <h2 id="album-title" className="font-display t-title mt-3">
            Turn the pages
          </h2>
          <p className="mt-4 text-ivory/75">
            Open the cover, then use the arrows, swipe, or the ← → keys. Tap any photograph to see it full size.
          </p>
        </header>

        {hydrated && !hasRealPhotos() && <EmptyAlbumState />}

        <ChapterNavigator activeId={activeChapterId} onSelect={jumpToChapter} />

        <div className="mt-8 flex justify-center" role="region" aria-roledescription="album" aria-label={`${site.siteTitle}, photo album`}>
          <ErrorBoundary fallback={<AlbumGridFallback />}>
            <div className="group relative" style={sizeStyle} {...(supports3D ? {} : swipe)}>
              <div className="absolute inset-0" style={{ touchAction: "pan-y" }}>
                {supports3D ? (
                  <>
                    <div
                      className="book-shadow"
                      aria-hidden
                      style={{ transform: !open && mode === "double" ? "translateX(-25%)" : undefined }}
                    />
                    {hydrated ? (
                      <AlbumBook key={mode} mode={mode} f={f} flat={FLAT} plan={PLAN} onFlip={goTo} onOpen={openCover} reducedMotion={reduced} />
                    ) : (
                      // Until the page-turning library takes over, show the closed cover.
                      <div className="absolute inset-y-0" style={mode === "double" ? { left: "25%", width: "50%" } : { left: 0, right: 0 }}>
                        <AlbumCover />
                      </div>
                    )}
                  </>
                ) : (
                  flatStage
                )}
              </div>
              {mode === "double" && open && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous spread"
                    className="icon-btn absolute left-2 top-1/2 z-[60] -translate-y-1/2 bg-espresso/60 text-ivory opacity-0 backdrop-blur transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-lg:hidden"
                  >
                    <ChevronLeft size={22} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={f === V}
                    aria-label="Next spread"
                    className="icon-btn absolute right-2 top-1/2 z-[60] -translate-y-1/2 bg-espresso/60 text-ivory opacity-0 backdrop-blur transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-lg:hidden"
                  >
                    <ChevronRight size={22} aria-hidden />
                  </button>
                </>
              )}
            </div>
          </ErrorBoundary>
        </div>
        <noscript>
          <AlbumGridFallback />
        </noscript>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        <div className="mx-auto mt-10 flex max-w-3xl items-center gap-3 sm:gap-6">
          <button
            type="button"
            className="icon-btn shrink-0"
            onClick={() => step(-1)}
            disabled={f === 0}
            aria-label={single ? "Previous page" : "Previous spread"}
          >
            <ChevronLeft size={22} aria-hidden />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="eyebrow truncate text-gold">{progressTitle}</p>
            <p className="mt-1 text-sm tabular-nums text-ivory/70">{progressCount}</p>
            <div
              role="progressbar"
              aria-label="Album progress"
              aria-valuemin={0}
              aria-valuemax={V}
              aria-valuenow={f}
              className="mt-3 h-px w-full bg-ivory/20"
            >
              <div className="h-px bg-gold transition-[width] duration-700" style={{ width: `${V ? (f / V) * 100 : 0}%` }} />
            </div>
          </div>
          <button
            type="button"
            className="icon-btn shrink-0"
            onClick={() => step(1)}
            disabled={f === V}
            aria-label={f === 0 ? "Open the album" : single ? "Next page" : "Next spread"}
          >
            <ChevronRight size={22} aria-hidden />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {open && (
            <button type="button" className="btn btn-gold" onClick={() => goTo(0)}>
              <X size={15} aria-hidden /> Close album
            </button>
          )}
          <ShareControl url={shareUrl} label={activeChapterId ? "Share this chapter" : "Share"} />
          <button type="button" className="btn btn-gold" onClick={openFavourites}>
            <Heart size={15} aria-hidden /> Favourites{favourites.ids.length > 0 ? ` (${favourites.ids.length})` : ""}
          </button>
        </div>
      </div>
    </section>
  );
}
