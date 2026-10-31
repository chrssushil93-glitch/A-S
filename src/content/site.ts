import type { SiteConfig } from "@/lib/types";
import audioManifest from "./audio-manifest.json";

const audio = audioManifest as { src?: string };

/**
 * ONE PLACE to edit the couple's details, copy, sharing metadata and music.
 * Photographs, chapters and the story live in ./album.ts.
 */
export const site: SiteConfig = {
  names: ["Sushil", "Anjali"],
  weddingDate: "2025-12-06",
  weddingDateDisplay: "06 December 2025",
  weddingDateShort: "06.12.2025",
  location: "Mumbai",
  siteTitle: "Sushil & Anjali — The Wedding Archive",
  description:
    "A timeless collection of photographs, memories, and moments from Sushil and Anjali's wedding on 6 December 2025 in Mumbai.",
  tagline: "One day. Two lives. A thousand little moments.",
  openingLine: "A lifetime of memories, beginning with one beautiful day.",
  closingLine: "Some days become memories. Some memories become forever.",
  // Set NEXT_PUBLIC_SITE_URL once you know the deployed address (e.g. in Vercel project settings).
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Music is OFF until you add a file: drop one you have the rights to use into public/audio/
  // (mp3, m4a, ogg, wav) and it is picked up automatically. It never autoplays.
  music: audio.src ? { src: audio.src, title: "Background music" } : undefined,
  // Chapters (by id, from album.ts) featured in the "Selected memories" section.
  memoryChapterIds: ["our-story", "together", "little-moments", "forever"],
  familyChapterId: "family",
  nav: [
    { id: "couple", label: "The Couple" },
    { id: "album", label: "The Album" },
    { id: "memories", label: "Memories" },
    { id: "story", label: "Our Story" },
  ],
  // Downloads are off by default. Set to true to show a download button in the photo viewer.
  allowDownloads: false,
};

export const siteName = `${site.names[0]} & ${site.names[1]}`;
