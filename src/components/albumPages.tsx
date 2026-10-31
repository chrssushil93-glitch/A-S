"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Photo } from "@/lib/types";
import { pad2, type FlatSpread, type PagePart } from "@/lib/albumModel";
import { site, siteName } from "@/content/site";
import { PhotoFrame } from "./PhotoFrame";

/** A faint colour wash per chapter so each collection feels distinct without changing the paper. */
const TINTS = ["var(--rose)", "var(--gold)", "var(--taupe)", "var(--rose)", "var(--gold)"];
const PAGE_SIZES = "(min-width: 900px) 40vw, 92vw";
const PRINT_SHADOW = "0 1px 2px rgba(48,39,32,.14), 0 10px 24px -12px rgba(48,39,32,.4)";

/** Where the book's spine is, relative to this page. */
export type Gutter = "left" | "right" | "none";

export interface AlbumPageProps {
  fs: FlatSpread;
  part: PagePart;
  folio: string;
  gutter: Gutter;
  /** Alternate arrangement on odd spreads so the book never feels templated. */
  flip?: boolean;
}

/** A photograph mounted on the paper at its own proportions, never cropped. */
function Fit({ photo, pad = "0", sizes = PAGE_SIZES }: { photo: Photo; pad?: string; sizes?: string }) {
  return (
    <div className="relative grid h-full w-full min-h-0 min-w-0 place-items-center [container-type:size]" style={{ padding: pad }}>
      <PhotoFrame
        photo={photo}
        sizes={sizes}
        style={{
          aspectRatio: String(photo.aspect),
          width: `min(100cqw, calc(100cqh * ${photo.aspect}))`,
          boxShadow: PRINT_SHADOW,
        }}
      />
    </div>
  );
}

/** Arranges 1–n photographs in a tidy editorial grid inside a page region. */
function Collage({ photos, gap = "3.2cqw" }: { photos: Photo[]; gap?: string }) {
  const n = photos.length;
  if (n === 0) return null;
  const rows = n === 1 ? 1 : n === 2 ? 2 : Math.ceil((n - 1) / 2) + 1;
  return (
    <div
      className="grid h-full w-full"
      style={{
        gap,
        gridTemplateColumns: n >= 3 ? "1fr 1fr" : "1fr",
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {photos.map((p, i) => (
        <div key={p.id} className="min-h-0 min-w-0" style={n >= 3 && i === 0 ? { gridColumn: "span 2" } : undefined}>
          <Fit photo={p} />
        </div>
      ))}
    </div>
  );
}

function Sheet({
  fs,
  folio,
  gutter,
  side,
  children,
}: {
  fs: FlatSpread;
  folio: string;
  gutter: Gutter;
  side: "left" | "right";
  children: ReactNode;
}) {
  const tint = TINTS[fs.chapterIndex % TINTS.length];
  return (
    <div className="album-page" style={{ "--tint": tint } as CSSProperties}>
      {children}
      <p
        aria-hidden
        className="eyebrow pointer-events-none absolute bottom-[3.2cqw] flex gap-[1.6cqw] text-taupe-deep"
        style={{
          fontSize: "clamp(0.56rem, 2.3cqw, 0.7rem)",
          letterSpacing: "0.2em",
          [side === "left" ? "left" : "right"]: "7cqw",
        }}
      >
        {side === "left" ? (
          <>
            <span className="tabular-nums">{folio}</span>
            <span>·</span>
            <span>{fs.chapterTitle}</span>
          </>
        ) : (
          <>
            <span>{fs.chapterTitle}</span>
            <span>·</span>
            <span className="tabular-nums">{folio}</span>
          </>
        )}
      </p>
      {gutter !== "none" && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${gutter === "left" ? "page-shade-right" : "page-shade-left"}`}
        />
      )}
    </div>
  );
}

const sheetSide = (part: PagePart): "left" | "right" => (part === "left" ? "left" : "right");

/** Type-only page: chapter label, heading and caption. */
function TextBlock({ fs, heading, caption, align = "center" }: { fs: FlatSpread; heading?: string; caption?: string; align?: "center" | "left" }) {
  return (
    <div
      className={`absolute inset-0 grid place-items-center px-[11cqw] pb-[8cqw] ${align === "center" ? "text-center" : "text-left"}`}
    >
      <div className={align === "center" ? "mx-auto" : ""}>
        <p className="eyebrow text-gold-deep" style={{ fontSize: "clamp(0.54rem, 2.3cqw, 0.72rem)" }}>
          Chapter {pad2(fs.chapterIndex + 1)}
        </p>
        {heading && (
          <h4 className="font-display mt-[4cqw]" style={{ fontSize: "clamp(1.4rem, 8.6cqw, 3.4rem)" }}>
            {heading}
          </h4>
        )}
        <div className={`hairline my-[5cqw] w-[24cqw] ${align === "center" ? "mx-auto" : ""}`} />
        {caption && (
          <p className="italic-serif text-espresso/90" style={{ fontSize: "clamp(0.95rem, 4.6cqw, 1.7rem)", lineHeight: 1.4 }}>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p
      className="italic-serif absolute inset-x-[10cqw] bottom-[9cqw] text-center text-espresso/85"
      style={{ fontSize: "clamp(0.85rem, 3.8cqw, 1.35rem)" }}
    >
      {children}
    </p>
  );
}

export function AlbumPage({ fs, part, folio, gutter, flip = false }: AlbumPageProps) {
  const { spread } = fs;
  const imgs = spread.images;
  const side = sheetSide(part);
  const wrap = (node: ReactNode) => (
    <Sheet fs={fs} folio={folio} gutter={gutter} side={side}>
      {node}
    </Sheet>
  );
  const photoAt = (i: number) => imgs[i];
  const mounted = (i: number, pad = "7cqw 7cqw 11cqw") => {
    const p = photoAt(i);
    return p ? <Fit photo={p} pad={pad} /> : null;
  };

  switch (spread.layout) {
    case "chapter-opening": {
      if (part === "left" || part === "whole") {
        return wrap(
          <div className="absolute inset-0 grid place-items-center px-[11cqw] pb-[8cqw] text-center">
            <div>
              <p className="eyebrow text-gold-deep" style={{ fontSize: "clamp(0.54rem, 2.3cqw, 0.72rem)" }}>
                Chapter {pad2(fs.chapterIndex + 1)}
              </p>
              <h3 className="font-display mt-[4cqw]" style={{ fontSize: "clamp(1.7rem, 11cqw, 4.4rem)" }}>
                {fs.chapterTitle}
              </h3>
              <div className="hairline mx-auto my-[5.5cqw] w-[26cqw]" />
              <p className="italic-serif text-espresso/90" style={{ fontSize: "clamp(0.95rem, 4.4cqw, 1.6rem)", lineHeight: 1.45 }}>
                {fs.chapterIntro}
              </p>
            </div>
          </div>,
        );
      }
      return wrap(mounted(0, "8cqw 8cqw 12cqw"));
    }

    case "full-page": {
      const textLeft = !flip;
      const caption = spread.caption ?? spread.heading;
      if (part === "left") return wrap(textLeft ? <TextBlock fs={fs} heading={spread.heading} caption={spread.heading ? spread.caption : caption} /> : mounted(0));
      return wrap(textLeft ? mounted(0) : <TextBlock fs={fs} heading={spread.heading} caption={spread.heading ? spread.caption : caption} />);
    }

    case "two-image": {
      if (part === "left") return wrap(mounted(0));
      return wrap(
        <>
          {mounted(1)}
          {spread.caption && <Caption>{spread.caption}</Caption>}
        </>,
      );
    }

    case "three-collage": {
      if (part === "left") return wrap(mounted(0, "7cqw 7cqw 11cqw"));
      return wrap(
        <div className="absolute inset-0" style={{ padding: "7cqw 7cqw 11cqw" }}>
          <Collage photos={imgs.slice(1, 3)} />
        </div>,
      );
    }

    case "full-bleed": {
      const p = photoAt(0);
      if (!p) return wrap(null);
      if (part === "whole") {
        return wrap(
          <>
            <Fit photo={p} pad="6cqw 6cqw 14cqw" />
            {spread.caption && <Caption>{spread.caption}</Caption>}
          </>,
        );
      }
      return (
        <div className="album-page">
          <PhotoFrame photo={p} sizes="(min-width: 900px) 48vw, 92vw" half={part === "left" ? "left" : "right"} className="h-full w-full" />
          {part === "right" && spread.caption && (
            <p
              className="italic-serif pointer-events-none absolute inset-x-0 bottom-0 px-[8cqw] pb-[5cqw] pt-[14cqw] text-right text-ivory"
              style={{
                fontSize: "clamp(0.85rem, 3.8cqw, 1.35rem)",
                background: "linear-gradient(0deg, rgba(48,39,32,.62), transparent)",
              }}
            >
              {spread.caption}
            </p>
          )}
          <span aria-hidden className={`pointer-events-none absolute inset-0 ${part === "left" ? "page-shade-left" : "page-shade-right"}`} />
        </div>
      );
    }

    case "portrait-caption": {
      const textLeft = !flip;
      const text = <TextBlock fs={fs} heading={spread.heading} caption={spread.caption} align="left" />;
      const photo = mounted(0, "9cqw 9cqw 13cqw");
      if (part === "left") return wrap(textLeft ? text : photo);
      return wrap(textLeft ? photo : text);
    }

    case "candid-collage": {
      const half = Math.ceil(imgs.length / 2);
      const photos = part === "left" ? imgs.slice(0, half) : imgs.slice(half);
      if (part === "whole") {
        return wrap(
          <div className="absolute inset-0" style={{ padding: "7cqw 7cqw 11cqw" }}>
            <Collage photos={imgs} />
          </div>,
        );
      }
      return wrap(
        <div className="absolute inset-0" style={{ padding: "7cqw 7cqw 11cqw" }}>
          <Collage photos={photos} />
        </div>,
      );
    }

    case "closing": {
      if (part === "left") return wrap(mounted(0, "8cqw 8cqw 12cqw"));
      return wrap(
        <div className="absolute inset-0 grid place-items-center px-[11cqw] pb-[8cqw] text-center">
          <div>
            <div className="hairline mx-auto mb-[6cqw] w-[20cqw]" />
            <h3 className="font-display text-burgundy" style={{ fontSize: "clamp(1.3rem, 7.4cqw, 2.8rem)", lineHeight: 1.18 }}>
              {spread.heading ?? site.closingLine}
            </h3>
            <div className="hairline mx-auto my-[6cqw] w-[20cqw]" />
            <p className="font-display italic" style={{ fontSize: "clamp(1.1rem, 6cqw, 2.2rem)" }}>
              {siteName}
            </p>
            <p className="eyebrow mt-[3cqw] text-taupe-deep" style={{ fontSize: "clamp(0.54rem, 2.3cqw, 0.72rem)" }}>
              {site.weddingDateDisplay} · {site.location}
            </p>
          </div>
        </div>,
      );
    }
  }
}
