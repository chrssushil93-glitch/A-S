"use client";

import { useEffect, useRef } from "react";
import { Heart, Trash2, X } from "lucide-react";
import type { Photo } from "@/lib/types";
import { allPhotos } from "@/content/album";
import { useFocusTrap, useScrollLock } from "@/lib/hooks";
import { Placeholder } from "./PhotoFrame";
import Image from "next/image";
import { usePhotos } from "./PhotoProvider";

export function FavouritesPanel({
  onClose,
  onOpenPhoto,
}: {
  onClose: () => void;
  onOpenPhoto: (p: Photo, list: Photo[]) => void;
}) {
  const { favourites } = usePhotos();
  const ref = useRef<HTMLDivElement>(null);
  useScrollLock(true);
  useFocusTrap(true, ref);

  // Listen on the window: removing a favourite can delete the focused button, which would otherwise
  // leave focus on the page behind the panel and make Escape do nothing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const photos = allPhotos().filter((p) => favourites.ids.includes(p.id));

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fav-title"
      tabIndex={-1}
      className="fixed inset-0 z-[85] grid place-items-center bg-espresso/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[86dvh] w-full max-w-2xl overflow-auto bg-paper p-6 text-espresso shadow-2xl sm:p-10">
        <button type="button" className="icon-btn absolute right-3 top-3" onClick={onClose} aria-label="Close favourites">
          <X size={20} aria-hidden />
        </button>
        <p className="eyebrow text-gold-deep">Your selection</p>
        <h2 id="fav-title" className="font-display mt-2 text-4xl">
          Favourite memories
        </h2>
        <p className="mt-3 text-sm text-taupe-deep">
          Saved in this browser on this device only. They are not shared or synced anywhere.
        </p>

        {photos.length === 0 ? (
          <div className="mt-8 flex items-center gap-3 border border-dashed border-taupe p-6 text-taupe-deep">
            <Heart size={20} aria-hidden />
            <p>Tap the heart on any photograph to keep it here.</p>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <li key={p.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onOpenPhoto(p, photos)}
                    aria-label={`Open photograph: ${p.alt}`}
                    className="relative block w-full overflow-hidden [container-type:inline-size]"
                    style={{ aspectRatio: "4 / 5" }}
                  >
                    {p.src ? (
                      <Image src={p.src} alt={p.alt} fill sizes="200px" style={{ objectFit: "cover", objectPosition: p.focus ?? "50% 40%" }} />
                    ) : (
                      <Placeholder photo={p} compact />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => favourites.remove(p.id)}
                    aria-label={`Remove from favourites: ${p.alt}`}
                    className="absolute right-1.5 top-1.5 grid h-10 w-10 place-items-center rounded-full bg-paper/90 text-burgundy"
                  >
                    <X size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={favourites.clear} className="btn btn-dark mt-8 text-burgundy">
              <Trash2 size={14} aria-hidden /> Clear all favourites
            </button>
          </>
        )}
      </div>
    </div>
  );
}
