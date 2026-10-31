"use client";

import { coverPhoto } from "@/content/album";
import { site } from "@/content/site";
import { PhotoFrame } from "./PhotoFrame";

/**
 * The printed front cover. Purely visual: the book (or the opening screen) decides what clicking it does.
 * Sized entirely in container units, so it scales from a thumbnail to a full-size book.
 */
export function AlbumCover() {
  const [a, b] = site.names;
  const hasPhoto = Boolean(coverPhoto.src);
  return (
    <div className="cover-leather grain absolute inset-0 overflow-hidden [container-type:size]">
      <div className="foil-line pointer-events-none absolute inset-[4.2cqw] opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute inset-[5.6cqw] border"
        style={{ borderColor: "color-mix(in srgb, var(--gold) 28%, transparent)" }}
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[12cqw] text-center">
        {hasPhoto ? (
          <PhotoFrame
            photo={coverPhoto}
            sizes="(min-width: 900px) 24vw, 60vw"
            interactive={false}
            className="mb-[5cqh]"
            style={{ width: "54cqw", aspectRatio: "4 / 5", boxShadow: "0 0 0 1px rgba(198,164,106,.55)" }}
          />
        ) : (
          <p className="font-display foil mb-[4cqh] italic" style={{ fontSize: "clamp(2.2rem, 24cqw, 7rem)", lineHeight: 1 }} aria-hidden>
            S&nbsp;<span style={{ fontSize: "0.7em" }}>&amp;</span>&nbsp;A
          </p>
        )}
        <p className="font-display foil" style={{ fontSize: "clamp(1rem, 11cqw, 3.4rem)", letterSpacing: "0.16em", lineHeight: 1.15 }}>
          {a.toUpperCase()}
        </p>
        <p className="font-display foil italic" style={{ fontSize: "clamp(0.9rem, 7cqw, 2.2rem)", lineHeight: 1.3 }}>
          &amp;
        </p>
        <p className="font-display foil" style={{ fontSize: "clamp(1rem, 11cqw, 3.4rem)", letterSpacing: "0.16em", lineHeight: 1.15 }}>
          {b.toUpperCase()}
        </p>
        <div className="hairline my-[3.4cqh] w-[28cqw]" />
        <p className="eyebrow foil" style={{ fontSize: "clamp(0.5rem, 2.9cqw, 0.85rem)", letterSpacing: "0.3em" }}>
          {site.weddingDateShort}
        </p>
        <p className="eyebrow foil mt-[1.2cqh]" style={{ fontSize: "clamp(0.5rem, 2.9cqw, 0.85rem)", letterSpacing: "0.3em" }}>
          {site.location.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
