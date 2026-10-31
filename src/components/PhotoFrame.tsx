"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { Photo } from "@/lib/types";
import { usePhotos } from "./PhotoProvider";

interface PhotoFrameProps {
  photo: Photo;
  /** `sizes` attribute so the browser downloads an appropriately small file. */
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Render only the left or right half of a photograph that spans two pages. */
  half?: "left" | "right";
  /** Open the lightbox on click. Defaults to true. */
  interactive?: boolean;
  /** Show a favourite toggle in the corner. */
  favouriteToggle?: boolean;
  /** Which photographs the lightbox should step through. Defaults to the whole album. */
  list?: Photo[];
  /** Cropping strategy. `cover` fills the frame; `contain` never crops. */
  fit?: "cover" | "contain";
  style?: React.CSSProperties;
}

/** A tasteful stand-in used until a real photograph exists, or if a file fails to load. */
export function Placeholder({ photo, failed = false, compact = false }: { photo: Photo; failed?: boolean; compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label={failed ? `${photo.alt} (image could not be loaded)` : photo.alt}
      className="absolute inset-0 grid place-items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(155deg, color-mix(in srgb, var(--rose) 55%, var(--paper)) 0%, color-mix(in srgb, var(--taupe) 35%, var(--paper)) 100%)",
      }}
    >
      <div
        className="absolute inset-[7%] border"
        style={{ borderColor: "color-mix(in srgb, var(--gold) 70%, transparent)" }}
        aria-hidden
      />
      <div className="relative text-center" style={{ color: "var(--taupe-deep)" }} aria-hidden>
        <div className="font-display italic" style={{ fontSize: compact ? "1.1rem" : "clamp(1.4rem, 5cqw, 2.4rem)" }}>
          S &amp; A
        </div>
        {!compact && (
          <div className="eyebrow mt-2" style={{ fontSize: "clamp(0.5rem, 1.7cqw, 0.66rem)" }}>
            {failed ? "Photograph unavailable" : "Photograph to come"}
          </div>
        )}
        {process.env.NODE_ENV !== "production" && !compact && (
          <div className="mt-2 font-mono" style={{ fontSize: "clamp(0.5rem, 1.5cqw, 0.62rem)", opacity: 0.7 }}>
            images/{photo.folder}/{photo.id}.jpg
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoFrame({
  photo,
  sizes,
  className = "",
  priority = false,
  half,
  interactive = true,
  favouriteToggle = false,
  list,
  fit = "cover",
  style,
}: PhotoFrameProps) {
  const { openPhoto, favourites } = usePhotos();
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(photo.src) && !failed;
  const isFav = favourites.has(photo.id);

  const inner = hasImage ? (
    <div
      className="absolute top-0 bottom-0"
      style={half ? { width: "200%", left: half === "right" ? "-100%" : 0 } : { inset: 0 }}
    >
      <Image
        src={photo.src!}
        alt={photo.alt}
        fill
        sizes={half ? "(min-width: 1024px) 80vw, 160vw" : sizes}
        priority={priority}
        onError={() => setFailed(true)}
        style={{ objectFit: fit, objectPosition: photo.focus ?? "50% 40%" }}
        draggable={false}
      />
    </div>
  ) : half ? (
    <div className="absolute top-0 bottom-0" style={{ width: "200%", left: half === "right" ? "-100%" : 0 }}>
      <Placeholder photo={photo} failed={failed} />
    </div>
  ) : (
    <Placeholder photo={photo} failed={failed} />
  );

  const label = `Open photograph: ${photo.alt}`;

  return (
    <div className={`relative overflow-hidden [container-type:inline-size] ${className}`} style={style}>
      {interactive ? (
        <button
          type="button"
          onClick={() => openPhoto(photo, list)}
          aria-label={label}
          className="group absolute inset-0 block h-full w-full cursor-zoom-in text-left"
        >
          {inner}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-espresso/0 transition-colors duration-300 group-hover:bg-espresso/10"
          />
        </button>
      ) : (
        inner
      )}
      {favouriteToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            favourites.toggle(photo.id);
          }}
          aria-pressed={isFav}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-paper/85 text-burgundy backdrop-blur transition-transform hover:scale-105"
        >
          <Heart size={18} fill={isFav ? "currentColor" : "none"} strokeWidth={1.6} aria-hidden />
        </button>
      )}
    </div>
  );
}
