"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Photo } from "@/lib/types";
import { useFavourites } from "@/lib/favourites";
import { allPhotos } from "@/content/album";
import { Lightbox } from "./Lightbox";
import { FavouritesPanel } from "./FavouritesPanel";

interface PhotosContextValue {
  openPhoto: (photo: Photo, list?: Photo[]) => void;
  openFavourites: () => void;
  favourites: ReturnType<typeof useFavourites>;
}

const PhotosContext = createContext<PhotosContextValue | null>(null);

export function usePhotos(): PhotosContextValue {
  const ctx = useContext(PhotosContext);
  if (!ctx) throw new Error("usePhotos must be used inside <PhotoProvider>");
  return ctx;
}

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const favourites = useFavourites();
  const [lightbox, setLightbox] = useState<{ list: Photo[]; index: number } | null>(null);
  const [favsOpen, setFavsOpen] = useState(false);

  const openPhoto = useCallback((photo: Photo, list?: Photo[]) => {
    const everything = allPhotos();
    // Once real photographs exist, step through those only; before that, step through the placeholders.
    const real = everything.filter((p) => p.src);
    const fallback = real.some((p) => p.id === photo.id) ? real : everything;
    const l = list && list.some((p) => p.id === photo.id) ? list : fallback;
    const index = Math.max(0, l.findIndex((p) => p.id === photo.id));
    setLightbox({ list: l, index });
  }, []);
  const openFavourites = useCallback(() => setFavsOpen(true), []);

  const value = useMemo(() => ({ openPhoto, openFavourites, favourites }), [openPhoto, openFavourites, favourites]);

  return (
    <PhotosContext.Provider value={value}>
      {children}
      {lightbox && (
        <Lightbox
          list={lightbox.list}
          index={lightbox.index}
          onIndex={(i) => setLightbox((s) => (s ? { ...s, index: i } : s))}
          onClose={() => setLightbox(null)}
        />
      )}
      {favsOpen && (
        <FavouritesPanel
          onClose={() => setFavsOpen(false)}
          onOpenPhoto={(p, list) => {
            setFavsOpen(false);
            openPhoto(p, list);
          }}
        />
      )}
    </PhotosContext.Provider>
  );
}
