"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Heart, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Photo } from "@/lib/types";
import { useFocusTrap, useScrollLock, useSwipe } from "@/lib/hooks";
import { usePhotos } from "./PhotoProvider";
import { Placeholder } from "./PhotoFrame";
import { siteName } from "@/content/site";

interface LightboxProps {
  list: Photo[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Lightbox({ list, index, onIndex, onClose }: LightboxProps) {
  const { favourites } = usePhotos();
  const photo = list[index];
  const rootRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useScrollLock(true);
  useFocusTrap(true, rootRef);

  const go = useCallback(
    (d: number) => {
      setZoomed(false);
      onIndex((index + d + list.length) % list.length);
    },
    [index, list.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const swipe = useSwipe((dir) => !zoomed && go(dir === "left" ? 1 : -1));

  if (!photo) return null;
  const hasImage = Boolean(photo.src) && failed !== photo.id;
  const isLoading = hasImage && loaded !== photo.id;
  const canZoom = hasImage && (photo.width ?? 0) >= 1400;
  const isFav = favourites.has(photo.id);
  const ext = photo.src?.split("?")[0].split(".").pop() ?? "jpg";
  const filename = `${siteName.replace(/\s*&\s*/g, "-and-").toLowerCase()}-wedding-${photo.id}.${ext}`;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph viewer, image ${index + 1} of ${list.length}`}
      tabIndex={-1}
      className="on-dark fixed inset-0 z-[90] flex flex-col bg-espresso/95 text-ivory backdrop-blur-sm"
      style={{ animation: "lb-in 280ms var(--ease-soft)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`@keyframes lb-in{from{opacity:0}to{opacity:1}}@keyframes lb-img{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}`}</style>

      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,var(--safe-top))] pb-2 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow tabular-nums" aria-live="polite">
          {pad(index + 1)} / {pad(list.length)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-btn"
            onClick={() => favourites.toggle(photo.id)}
            aria-pressed={isFav}
            aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart size={18} fill={isFav ? "currentColor" : "none"} strokeWidth={1.6} aria-hidden />
          </button>
          {canZoom && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setZoomed((z) => !z)}
              aria-pressed={zoomed}
              aria-label={zoomed ? "Zoom out" : "Zoom in"}
            >
              {zoomed ? <ZoomOut size={18} aria-hidden /> : <ZoomIn size={18} aria-hidden />}
            </button>
          )}
          {photo.downloadable && photo.src && hasImage && (
            <a className="icon-btn" href={photo.src} download={filename} aria-label="Download this photograph">
              <Download size={18} aria-hidden />
            </a>
          )}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close photograph viewer">
            <X size={20} aria-hidden />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        className={`relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16 ${
          zoomed ? "overflow-auto" : "overflow-hidden"
        }`}
        style={{ touchAction: zoomed ? "auto" : "pan-y" }}
        {...swipe}
        onClick={(e) => e.target === e.currentTarget && !zoomed && onClose()}
      >
        <button
          type="button"
          className="icon-btn absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 sm:grid"
          onClick={() => go(-1)}
          aria-label="Previous photograph"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-btn absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 sm:grid"
          onClick={() => go(1)}
          aria-label="Next photograph"
        >
          <ChevronRight size={22} aria-hidden />
        </button>

        <figure
          key={photo.id}
          className="relative m-0 shrink-0"
          style={{
            aspectRatio: String(photo.aspect),
            width: zoomed
              ? `min(220vw, ${Math.round(photo.aspect * 220)}dvh)`
              : `min(94vw, calc(76dvh * ${photo.aspect}))`,
            animation: "lb-img 420ms var(--ease-soft)",
          }}
        >
          {hasImage ? (
            <Image
              src={photo.src!}
              alt={photo.alt}
              fill
              sizes={zoomed ? "220vw" : "94vw"}
              priority
              quality={zoomed ? 90 : 80}
              onLoad={() => setLoaded(photo.id)}
              onError={() => setFailed(photo.id)}
              style={{ objectFit: "contain" }}
              draggable={false}
            />
          ) : (
            <Placeholder photo={photo} failed={failed === photo.id} />
          )}
          {isLoading && (
            <div className="absolute inset-0 grid place-items-center" role="status" aria-label="Loading photograph">
              <Loader2 className="animate-spin text-gold" size={28} aria-hidden />
            </div>
          )}
        </figure>
      </div>

      {/* Caption */}
      <div
        className="px-6 pb-[max(1rem,var(--safe-bottom))] pt-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display italic text-lg text-ivory/90 sm:text-xl">
          {photo.caption ?? <span className="sr-only">{photo.alt}</span>}
        </p>
        {photo.date && <p className="eyebrow mt-1 text-gold">{photo.date}</p>}
        <div className="mt-3 flex justify-center gap-3 sm:hidden">
          <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous photograph">
            <ChevronLeft size={22} aria-hidden />
          </button>
          <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next photograph">
            <ChevronRight size={22} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
