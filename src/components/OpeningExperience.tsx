"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/content/site";
import { openAlbum } from "@/lib/albumEvents";
import { useFocusTrap, useReducedMotion, useScrollLock } from "@/lib/hooks";
import { AlbumCover } from "./AlbumCover";

const STORAGE_KEY = "wedding-archive:intro";
const noopSubscribe = () => () => {};

/**
 * The cover-of-the-album welcome screen.
 * - Never blocks for long: the button works immediately and "Skip" is always available.
 * - Remembered for the session (a tiny inline script in the layout hides it on revisits, so there is no flash).
 * - Works with reduced motion, and is hidden entirely without JavaScript.
 */
export function OpeningExperience() {
  const [a, b] = site.names;
  // Set by the inline script in <head> for returning sessions and shared chapter links.
  const alreadySeen = useSyncExternalStore(
    noopSubscribe,
    () => document.documentElement.dataset.intro === "seen",
    () => false,
  );
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const active = !alreadySeen && phase !== "gone";

  useScrollLock(active);
  useFocusTrap(active, rootRef);

  const leave = useCallback(
    (thenOpen: boolean) => {
      if (phase !== "show") return;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* storage blocked: the intro simply shows again next visit */
      }
      document.documentElement.dataset.hero = "go"; // starts the hero's entrance animation
      setPhase("leaving");
      if (thenOpen) window.setTimeout(() => openAlbum(undefined, { open: true }), reduce ? 0 : 500);
      window.setTimeout(() => setPhase("gone"), reduce ? 0 : 950);
    },
    [phase, reduce],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && leave(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, leave]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${a} and ${b}'s wedding archive`}
      tabIndex={-1}
      data-leaving={phase === "leaving"}
      className="opening on-dark grain grain-light fixed inset-0 z-[100] overflow-y-auto bg-espresso text-ivory"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 border sm:inset-6"
        style={{ borderColor: "color-mix(in srgb, var(--gold) 45%, transparent)" }}
      />
      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-8 pb-[max(3rem,var(--safe-bottom))] pt-[max(3.5rem,var(--safe-top))] sm:px-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="text-center lg:text-left">
          <p className="eyebrow rise text-gold" style={{ ["--d" as string]: "250ms" }}>
            The Wedding Archive
          </p>
          <p
            className="font-display rise mt-6 uppercase"
            style={{ ["--d" as string]: "500ms", fontSize: "clamp(2.7rem, 9vw, 6.6rem)", letterSpacing: "0.06em", lineHeight: 1.04 }}
          >
            <span className="block">{a}</span>
            <span className="block italic normal-case text-gold" style={{ fontSize: "0.62em", letterSpacing: "0.02em" }}>
              &amp;
            </span>
            <span className="block">{b}</span>
          </p>
          <div className="hairline draw mx-auto mt-8 w-40 lg:mx-0" style={{ ["--d" as string]: "900ms" }} />
          <p className="eyebrow rise mt-6 text-ivory/85" style={{ ["--d" as string]: "1000ms" }}>
            {site.weddingDateDisplay} · {site.location}
          </p>
          <p
            className="italic-serif rise mx-auto mt-6 max-w-md text-xl text-ivory/80 lg:mx-0 sm:text-2xl"
            style={{ ["--d" as string]: "1150ms", lineHeight: 1.45 }}
          >
            {site.openingLine}
          </p>
          <div className="rise mt-10 flex flex-col items-center gap-3 lg:items-start" style={{ ["--d" as string]: "1350ms" }}>
            <button type="button" className="btn btn-gold" onClick={() => leave(true)}>
              Open our album
            </button>
            <button
              type="button"
              className="min-h-11 px-2 text-[0.72rem] uppercase tracking-[0.24em] text-ivory/70 underline decoration-gold/60 underline-offset-[6px] transition-colors hover:text-ivory"
              onClick={() => leave(false)}
            >
              Skip to the site
            </button>
          </div>
        </div>

        {/* A closed album, seen from an angle */}
        <div className="fade-in hidden lg:block" style={{ ["--d" as string]: "800ms" }} aria-hidden>
          <div className="mx-auto" style={{ perspective: "1600px", width: "min(100%, 340px)" }}>
            <div
              className="relative"
              style={{
                aspectRatio: "0.72 / 1",
                transform: "rotateY(-24deg) rotateX(4deg)",
                boxShadow:
                  "1px 0 0 #d9cfbf, 3px 0 0 #fbf6ec, 5px 0 0 #d9cfbf, 7px 0 0 #fbf6ec, 9px 0 0 #d9cfbf, 40px 50px 70px -10px rgba(0,0,0,.65)",
              }}
            >
              <AlbumCover />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
