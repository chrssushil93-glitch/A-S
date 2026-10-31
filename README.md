# Sushil & Anjali — The Wedding Archive

An editorial, book-style digital wedding album. Visitors open a 3D album, turn its pages, jump between chapters, view photographs full-size, and mark favourites.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Motion · Lucide icons. The 3D book uses CSS 3D transforms (no WebGL), so it is light on phones and has no GPU-specific failure modes. Fonts (Cormorant Garamond, Manrope) are bundled locally; there are no third-party requests, analytics or trackers.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve the production build
npm run check        # typecheck + lint + unit tests
npm run test:e2e     # browser tests (needs `npm start` running; BASE_URL=... to point elsewhere)
```

`dev` and `build` first run `npm run photos`, which scans `public/images/` and `public/audio/`.

## Where things live

| What | Where |
|---|---|
| Names, date, copy, sharing text, nav, music, download switch | `src/content/site.ts` |
| Chapters, spreads, captions, alt text, timeline | `src/content/album.ts` |
| Colours, type scale, motion tokens | `src/app/globals.css` |
| Photographs | `public/images/<folder>/<id>.jpg` |
| Optional music | `public/audio/` |

## Adding or replacing photographs

Photographs are declared **by id** in `src/content/album.ts`, for example:

```ts
photo("together-02", "album", { alt: "…", aspect: 1.777, focus: "55% 40%" })
```

That reads `public/images/album/together-02.jpg` (also `.jpeg`, `.png`, `.webp`, `.avif`). If the file is missing, a neutral placeholder frame is shown, so the site never breaks.

1. **Add a photo:** save it as `public/images/<folder>/<id>.jpg`, using the folder and id of an existing `photo(...)` line. Run `npm run dev` (or `npm run photos`).
2. **Replace the cover:** overwrite `public/images/cover/album-cover.jpg`. The hero image is `cover/featured.jpg`; the closing image is `cover/closing.jpg`.
3. **Reorder:** reorder the `images` or `spreads` arrays in `album.ts`.
4. **Add / remove / rename a chapter:** edit the `chapters` array. Give each chapter and spread a unique `id`. Chapters named in `memoryChapterIds` (`site.ts`) feed "Selected memories".
5. **Captions and alt text:** the `caption`, `heading` and `alt` fields. Please keep alt text descriptive: it is what screen readers read.
6. **Our Story:** edit the `timeline` array. Add `image: photo(...)` to any entry to show a photo beside it.
7. **Homepage photos:** `featuredPhoto`, `coverPhoto`, `closingPhoto` at the top of `album.ts`, and `memoryChapterIds` in `site.ts`.
8. **Layouts:** each spread has a `layout`: `chapter-opening`, `full-page`, `two-image`, `three-collage`, `full-bleed`, `portrait-caption`, `candid-collage`, `closing`. Vary them.
9. **Face-safe cropping:** set `focus: "50% 30%"` (CSS `object-position`) so faces stay in frame where a photo is cropped.
10. **Music:** drop a file you have the rights to use into `public/audio/`. A play/pause control appears automatically. It never autoplays.
11. **Downloads:** off by default. Set `allowDownloads: true` in `site.ts` (or `downloadable: true` on single photos) to show a download button.

**Image quality and size.** Photos are served through Next's image optimizer (AVIF/WebP, responsive sizes). Export your finals at roughly 2400–3200 px on the long side as quality 82–90 JPEG. The photos currently in the project are 1023 × 1537 px and 1672 × 941 px, which look good in the book but will soften in the full-screen viewer on large or high-density displays. Higher-resolution originals are recommended.

## Deploying (Vercel)

1. Push the project to a Git repository and import it at vercel.com (framework: Next.js; no settings needed).
2. Set `NEXT_PUBLIC_SITE_URL` to the final address (for example `https://your-domain.com`) so share links and social previews are correct. There is no hard-coded URL.
3. Deploy. Every push redeploys.

Nothing here needs a database or paid service. Vercel's free tier is enough for a personal album; check their current limits for image optimization if you add a very large number of photographs.

## Privacy: please read

This is a **public static website**. Anyone with the link can open it, and every photo file has a direct URL.

- An unlisted link is **not** access control.
- A client-side password screen would **not** protect the image files, so none is included, on purpose.
- If you want it private, use hosting-level protection: **Vercel Password Protection / Deployment Protection** (a paid Vercel feature), or put the site behind another access-controlled host. Only then is it accurate to call it private.
- Image metadata (EXIF, location) is stripped from the photos prepared here; strip it from future exports too.
- Favourites are saved in each visitor's own browser (localStorage). They are not shared or synced anywhere.
- There is no guest-message form: it would need a backend, and a fake form would be dishonest.

## Testing

- `npm run check`: type-check, lint, unit tests for the album's page model.
- `npm run test:e2e`: Playwright (Chromium) against a running server. It covers the opening screen, the book (buttons, arrow keys, swipe), chapter jumps and deep links, the lightbox (keyboard, Escape, scroll lock), favourites persistence, share fallback, a viewport sweep from 360 to 1920 px for overflow and console errors, reduced motion, no-JavaScript, and a no-3D fallback. It needs photographs present to exercise the lightbox.

Not covered by automated tests: real-device touch behaviour on iOS Safari, screen-reader testing, and music playback (no audio file is supplied).
