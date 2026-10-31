"use client";

import { openAlbum } from "@/lib/albumEvents";

/** Scrolls to the album and opens the cover. */
export function OpenAlbumButton({ children, className = "btn btn-dark" }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      href="#album"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openAlbum(undefined, { open: true });
      }}
    >
      {children}
    </a>
  );
}

/** A small text link that opens a specific chapter in the album. */
export function ChapterLink({ chapterId, children, className = "" }: { chapterId: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openAlbum(chapterId)}
      className={`inline-flex min-h-11 items-center gap-1 text-[0.72rem] font-medium uppercase tracking-[0.2em] underline decoration-gold decoration-1 underline-offset-[6px] transition-colors hover:text-burgundy ${className}`}
    >
      {children}
    </button>
  );
}
