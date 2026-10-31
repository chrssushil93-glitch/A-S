import type { Chapter, Photo, TimelineEntry } from "@/lib/types";
import { photo } from "./photo";

/**
 * ALBUM CONTENT
 * -------------
 * Each photograph is declared by id and folder. The file `public/images/<folder>/<id>.jpg`
 * is picked up automatically; if it is missing, a placeholder frame is shown instead.
 * Example: `photo("together-01", "album", ...)` reads public/images/album/together-01.jpg.
 *
 * Chapters and spreads are plain arrays: reorder, rename, add or delete freely. To bring back
 * a chapter such as "The Ceremony" or "Family & Friends", add it here and drop its photos in.
 * Captions and alt text are neutral descriptions; replace them with your own words.
 */

// --- Cover & featured photographs ------------------------------------------
export const coverPhoto = photo("album-cover", "cover", {
  alt: "Sushil and Anjali walking hand in hand past white colonnades, smiling at each other",
  aspect: 0.666,
  focus: "50% 35%",
});

export const featuredPhoto = photo("featured", "cover", {
  alt: "Anjali in a deep purple saree smiling, with Sushil softly out of focus behind her",
  aspect: 0.666,
  focus: "50% 30%",
});

export const closingPhoto = photo("closing", "cover", {
  alt: "Sushil and Anjali seen from behind, sitting side by side looking out over the sea at dusk",
  aspect: 1.777,
  focus: "50% 50%",
});

// --- Chapters ---------------------------------------------------------------
export const chapters: Chapter[] = [
  {
    id: "our-story",
    title: "Our Story",
    introduction: "Where the archive begins: the two of them, side by side.",
    spreads: [
      {
        id: "our-story-open",
        layout: "chapter-opening",
        images: [
          photo("our-story-01", "couple", {
            alt: "Sushil in a gold kurta, smiling and looking away from the camera",
            aspect: 0.666,
            focus: "50% 30%",
          }),
        ],
      },
      {
        id: "our-story-a",
        layout: "portrait-caption",
        heading: "Two people, one day",
        caption: "A look held a moment longer than the camera needed.",
        images: [
          photo("our-story-02", "couple", {
            alt: "Anjali in a purple saree smiling, with Sushil in a gold kurta softly out of focus behind her",
            aspect: 0.666,
            focus: "50% 30%",
          }),
        ],
      },
      {
        id: "our-story-b",
        layout: "two-image",
        caption: "Together.",
        images: [
          photo("our-story-03", "couple", {
            alt: "Sushil and Anjali walking hand in hand, looking at each other",
            aspect: 0.666,
            focus: "50% 35%",
          }),
          photo("our-story-04", "couple", {
            alt: "Anjali in a purple saree seen from a low angle, with Sushil smiling behind her",
            aspect: 0.666,
            focus: "60% 30%",
          }),
        ],
      },
    ],
  },
  {
    id: "together",
    title: "Together",
    introduction: "Laughter, closeness, and the quiet in between.",
    spreads: [
      {
        id: "together-open",
        layout: "chapter-opening",
        images: [
          photo("together-01", "album", {
            alt: "Sushil kneeling to hold Anjali's hand in front of a grand heritage building",
            aspect: 0.666,
            focus: "50% 55%",
          }),
        ],
      },
      {
        id: "together-a",
        layout: "two-image",
        caption: "Easy company.",
        images: [
          photo("together-02", "album", {
            alt: "Sushil and Anjali in matching caps and olive T-shirts, laughing together against a dark tiled wall",
            aspect: 1.777,
            focus: "55% 40%",
          }),
          photo("together-03", "album", {
            alt: "Sushil and Anjali facing each other and holding hands in a leafy lane",
            aspect: 1.777,
            focus: "55% 35%",
          }),
        ],
      },
    ],
  },
  {
    id: "little-moments",
    title: "The Little Moments",
    introduction: "Details that are easy to miss and impossible to forget.",
    spreads: [
      {
        id: "little-open",
        layout: "chapter-opening",
        images: [
          photo("little-01", "details", {
            alt: "Close-up of a silver wristwatch with a green dial on a wrist, against a gold kurta",
            aspect: 0.666,
            focus: "50% 45%",
          }),
        ],
      },
    ],
  },
  {
    id: "forever",
    title: "Forever Begins",
    introduction: "The end of the day, and the start of everything after it.",
    spreads: [
      {
        id: "forever-open",
        layout: "chapter-opening",
        images: [
          photo("forever-01", "album", {
            alt: "Two hands, one with henna, joining fingertips to form an infinity shape beneath a full moon",
            aspect: 1.502,
            focus: "50% 55%",
          }),
        ],
      },
      {
        id: "forever-close",
        layout: "closing",
        heading: "Some days become memories. Some memories become forever.",
        images: [
          photo("forever-02", "album", {
            alt: "Sushil and Anjali seen from behind, sitting together and looking out over the sea at dusk",
            aspect: 1.777,
            focus: "50% 50%",
          }),
        ],
      },
    ],
  },
];

// --- "Our Story" timeline (neutral samples; replace with the real story) -----
// Add `image: photo(...)` to any entry to show a photograph beside it.
export const timeline: TimelineEntry[] = [
  {
    id: "t1",
    title: "Before the Celebration",
    description: "The quiet hours before the day began: a place for the preparations, the people, and the anticipation.",
  },
  {
    id: "t2",
    title: "A Day to Remember",
    date: "6 December 2025",
    location: "Mumbai",
    description: "The wedding itself, held in Mumbai. Add the moments you want to remember in your own words.",
  },
  {
    id: "t3",
    title: "Moments That Stay",
    description: "The small things that will outlast the big ones: glances, laughter, a hand held at the right moment.",
  },
  {
    id: "t4",
    title: "Together, Always",
    description: "Every album ends with a beginning. Here is where the next chapter starts.",
  },
];

// --- Derived helpers (do not edit) -------------------------------------------
/** Every distinct photograph in reading order, used by the lightbox and favourites. */
export function allPhotos(): Photo[] {
  const seen = new Set<string>();
  const out: Photo[] = [];
  const push = (p?: Photo) => {
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  };
  chapters.forEach((c) => c.spreads.forEach((s) => s.images.forEach(push)));
  return out;
}

export function chapterPhotos(chapterId: string): Photo[] {
  const c = chapters.find((x) => x.id === chapterId);
  if (!c) return [];
  const seen = new Set<string>();
  return c.spreads.flatMap((s) => s.images).filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

/** True once at least one real photograph has been added to public/images. */
export function hasRealPhotos(): boolean {
  return allPhotos().some((p) => p.src) || Boolean(coverPhoto.src || featuredPhoto.src || closingPhoto.src);
}
