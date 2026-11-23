"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PageFlip } from "page-flip";
import { type AlbumMode, type FlatSpread, type SinglePage } from "@/lib/albumModel";
import { AlbumCover } from "./AlbumCover";
import { AlbumPage } from "./albumPages";

interface AlbumBookProps {
  mode: AlbumMode;
  /** Number of flipped leaves. 0 = closed. The visitor's position in the book. */
  f: number;
  flat: readonly FlatSpread[];
  plan: readonly SinglePage[];
  /** Called when the visitor turns pages by dragging or swiping the paper itself. */
  onFlip: (f: number) => void;
  onOpen: () => void;
  reducedMotion: boolean;
}

type PageDef =
  | { kind: "cover" }
  | { kind: "page"; fs: FlatSpread; part: "left" | "right" | "whole"; folio: string; gutter: "left" | "right" | "none"; flip: boolean };

/** Book position f (0 = closed) -> index of the page on the left/only side in the page list. */
const fToIndex = (mode: AlbumMode, f: number) => (f <= 0 ? 0 : mode === "double" ? 2 * f - 1 : f);
const indexToF = (mode: AlbumMode, i: number) => (i <= 0 ? 0 : mode === "double" ? Math.ceil(i / 2) : i);

/**
 * The 3D book, turned by the StPageFlip library: real page curl with bending paper,
 * dynamic shadows, a hard cover, and drag-to-turn. The pages themselves (AlbumCover / AlbumPage)
 * are the same React components as before, rendered into the library's page elements.
 *
 * Page list, desktop ("double"):  cover, then for every spread its left page and right page.
 * Page list, mobile ("single"):   cover, then one page per entry of the single-page plan.
 */
export function AlbumBook({ mode, f, flat, plan, onFlip, onOpen, reducedMotion }: AlbumBookProps) {
  const defs = useMemo<PageDef[]>(() => {
    const out: PageDef[] = [{ kind: "cover" }];
    if (mode === "double") {
      flat.forEach((fs, k) => {
        out.push({ kind: "page", fs, part: "left", folio: String(2 * k + 1), gutter: "right", flip: k % 2 === 1 });
        out.push({ kind: "page", fs, part: "right", folio: String(2 * k + 2), gutter: "left", flip: k % 2 === 1 });
      });
    } else {
      plan.forEach((sp, j) => {
        const fs = flat[sp.spreadIndex];
        out.push({ kind: "page", fs, part: sp.part, folio: String(j + 1), gutter: "left", flip: sp.spreadIndex % 2 === 1 });
      });
    }
    return out;
  }, [mode, flat, plan]);

  // One detached element per page. The library moves these around the DOM; React renders into them
  // through portals, so React never has to reconcile nodes the library has moved.
  const [els] = useState(() =>
    defs.map((d) => {
      const el = document.createElement("div");
      el.className = "stf-sheet";
      if (d.kind === "cover") el.setAttribute("data-density", "hard");
      return el;
    }),
  );

  const outer = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const fRef = useRef(f);
  const onFlipRef = useRef(onFlip);
  const reducedRef = useRef(reducedMotion);
  const startF = useRef(f);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fRef.current = f;
    onFlipRef.current = onFlip;
    reducedRef.current = reducedMotion;
  });

  useEffect(() => {
    const parent = outer.current;
    if (!parent) return;
    let disposed = false;
    const host = document.createElement("div");
    host.className = "stf-host";
    parent.appendChild(host);
    let pf: PageFlip | null = null;

    // A drag that ends over a photograph must not also "click" it open.
    let down: { x: number; y: number } | null = null;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      moved = false;
    };
    const onMove = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 9) moved = true;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    parent.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    parent.addEventListener("click", onClickCapture, true);

    void import("page-flip").then(({ PageFlip }) => {
      if (disposed) return;
      pf = new PageFlip(host, {
        width: 500,
        height: 694,
        size: "stretch",
        // In stretch mode the library goes portrait (one page) when minWidth <= frame width < 2 x minWidth.
        // Single mode frames are 260-560px wide, so 281 keeps them portrait; two-page frames are far wider.
        minWidth: mode === "single" ? 281 : 1,
        maxWidth: 2400,
        minHeight: 200,
        maxHeight: 3400,
        showCover: true,
        usePortrait: mode === "single",
        startPage: fToIndex(mode, startF.current),
        drawShadow: true,
        maxShadowOpacity: 0.55,
        flippingTime: 850,
        mobileScrollSupport: true,
        swipeDistance: 24,
        showPageCorners: true,
        disableFlipByClick: true,
        // Photographs are buttons: let a drag that starts on one still turn the page.
        clickEventForward: false,
        startZIndex: 0,
      });
      pf.loadFromHTML(els);
      // The library calls a touch a swipe only if it ends within 250 ms; be more forgiving of slower hands.
      (pf.getUI() as unknown as { swipeTimeout: number }).swipeTimeout = 650;
      // disableFlipByClick stops a plain click from turning pages, but the library also applies it to
      // its own swipe and programmatic turns (backwards turns start outside the "corner" zone in
      // one-page mode). Lift it only for the duration of those calls.
      const lib = pf;
      for (const name of ["flipNext", "flipPrev", "flip"] as const) {
        const original = lib[name].bind(lib) as (...a: number[]) => void;
        (lib as unknown as Record<string, unknown>)[name] = (...args: number[]) => {
          const settings = lib.getSettings();
          settings.disableFlipByClick = false;
          try {
            original(...args);
          } finally {
            settings.disableFlipByClick = true;
          }
        };
      }
      flipRef.current = pf;
      const sync = () => {
        if (!pf) return;
        const want = fToIndex(mode, fRef.current);
        if (pf.getCurrentPageIndex() !== want && pf.getState() === "read") {
          if (reducedRef.current) pf.turnToPage(want);
          else pf.flip(want);
        }
      };
      pf.on("flip", (e) => {
        const next = indexToF(mode, e.data);
        if (next !== fRef.current) onFlipRef.current(next);
      });
      pf.on("changeState", (e) => {
        if (e.data === "read") sync();
      });
      setReady(true);
    });

    return () => {
      disposed = true;
      parent.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      parent.removeEventListener("click", onClickCapture, true);
      try {
        pf?.destroy();
      } catch {
        /* already torn down */
      }
      flipRef.current = null;
      host.remove();
    };
    // The book is rebuilt (keyed by mode in the viewer) rather than reconfigured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation from the buttons, keyboard, chapter list and deep links.
  useEffect(() => {
    const pf = flipRef.current;
    if (!pf || !ready) return;
    const want = fToIndex(mode, f);
    if (pf.getCurrentPageIndex() === want || pf.getState() !== "read") return;
    if (reducedMotion) pf.turnToPage(want);
    else pf.flip(want);
  }, [f, mode, ready, reducedMotion]);

  const cur = fToIndex(mode, f);
  const visible = (i: number) => (mode === "double" && f > 0 ? i === cur || i === cur + 1 : i === cur);

  return (
    <div className="book-scene relative h-full w-full" data-open={f > 0} data-mode={mode}>
      {/* A closed book sits on the right half of the frame; slide it to the centre until it is opened. */}
      <div
        ref={outer}
        className="stf-outer absolute inset-0"
        style={{ transform: f === 0 && mode === "double" ? "translateX(-25%)" : "none" }}
      />
      {defs.map((d, i) => {
        const vis = visible(i);
        const near = Math.abs(i - cur) <= 4;
        return createPortal(
          <div className="stf-fill" inert={!vis} aria-hidden={!vis}>
            {d.kind === "cover" ? (
              <>
                <AlbumCover />
                <button
                  type="button"
                  onClick={onOpen}
                  tabIndex={vis ? 0 : -1}
                  aria-label="Open the album"
                  className="absolute inset-0 cursor-pointer transition-colors hover:bg-white/[0.03]"
                />
              </>
            ) : near ? (
              <AlbumPage fs={d.fs} part={d.part} folio={d.folio} gutter={d.gutter} flip={d.flip} />
            ) : (
              <div className="album-page" />
            )}
          </div>,
          els[i],
          `p${i}`,
        );
      })}
    </div>
  );
}
