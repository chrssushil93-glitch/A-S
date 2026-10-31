/** Tiny event bridge so any section can ask the album to open, without prop-drilling. */
export const ALBUM_EVENT = "album:navigate";

export interface AlbumNavigateDetail {
  /** Chapter id to jump to. */
  chapterId?: string;
  /** Open the cover and show the first spread (used after the opening screen). */
  open?: boolean;
}

/**
 * Scroll to the album and optionally open it.
 *  - openAlbum("ceremony")           jumps straight to that chapter
 *  - openAlbum(undefined, {open:true}) opens the cover
 *  - openAlbum()                     only scrolls to the (closed) album
 */
export function openAlbum(chapterId?: string, opts: { open?: boolean } = {}) {
  if (typeof window === "undefined") return;
  document.getElementById("album")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  window.dispatchEvent(
    new CustomEvent<AlbumNavigateDetail>(ALBUM_EVENT, { detail: { chapterId, open: opts.open } }),
  );
}
