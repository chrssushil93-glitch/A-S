/**
 * Pure album logic: no React, no DOM, no path aliases, so it can be unit-tested with `node --test`.
 *
 * Vocabulary
 *  - spread : one entry of chapter.spreads (a double page in desktop mode)
 *  - view   : what the visitor currently sees. Desktop = one spread. Mobile = one page.
 *  - f      : how many leaves are flipped. f = 0 is the closed cover; f = view + 1 otherwise.
 *  - leaf   : a physical sheet. Leaf 0 is the cover.
 */
import type { Chapter, Spread } from "./types";

export type AlbumMode = "double" | "single";
export type PagePart = "left" | "right" | "whole";

export interface FlatSpread {
  /** Position in the whole album, across all chapters. */
  index: number;
  spread: Spread;
  chapterIndex: number;
  chapterId: string;
  chapterTitle: string;
  chapterIntro: string;
  indexInChapter: number;
}

export interface SinglePage {
  spreadIndex: number;
  part: PagePart;
}

export function flattenSpreads(chapters: readonly Chapter[]): FlatSpread[] {
  const out: FlatSpread[] = [];
  chapters.forEach((chapter, chapterIndex) => {
    chapter.spreads.forEach((spread, indexInChapter) => {
      out.push({
        index: out.length,
        spread,
        chapterIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterIntro: chapter.introduction,
        indexInChapter,
      });
    });
  });
  return out;
}

/** Mobile/narrow plan: every spread becomes two pages, except full-bleed which stays whole. */
export function singlePagePlan(flat: readonly FlatSpread[]): SinglePage[] {
  return flat.flatMap<SinglePage>((fs) =>
    fs.spread.layout === "full-bleed"
      ? [{ spreadIndex: fs.index, part: "whole" }]
      : [
          { spreadIndex: fs.index, part: "left" },
          { spreadIndex: fs.index, part: "right" },
        ],
  );
}

export function viewCount(mode: AlbumMode, flat: readonly FlatSpread[], plan: readonly SinglePage[]): number {
  return mode === "double" ? flat.length : plan.length;
}

export function spreadIndexForView(mode: AlbumMode, plan: readonly SinglePage[], view: number): number {
  return mode === "double" ? view : (plan[view]?.spreadIndex ?? 0);
}

/** First view of a chapter, or -1 if the chapter does not exist (or has no spreads). */
export function chapterStartView(
  mode: AlbumMode,
  flat: readonly FlatSpread[],
  plan: readonly SinglePage[],
  chapterId: string,
): number {
  const first = flat.find((fs) => fs.chapterId === chapterId);
  if (!first) return -1;
  return mode === "double" ? first.index : plan.findIndex((p) => p.spreadIndex === first.index);
}

export function spreadForView(
  mode: AlbumMode,
  flat: readonly FlatSpread[],
  plan: readonly SinglePage[],
  view: number,
): FlatSpread | undefined {
  return flat[spreadIndexForView(mode, plan, view)];
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Convert a flipped-leaf count from one mode to another (used when the window is resized). */
export function convertF(
  f: number,
  from: AlbumMode,
  to: AlbumMode,
  flat: readonly FlatSpread[],
  plan: readonly SinglePage[],
): number {
  if (f <= 0 || from === to) return Math.max(0, f);
  const spreadIndex = spreadIndexForView(from, plan, f - 1);
  const view = to === "double" ? spreadIndex : Math.max(0, plan.findIndex((p) => p.spreadIndex === spreadIndex));
  return view + 1;
}

/** Leaves whose flipped state changes when going from `from` to `to` (half-open range). */
export function changedLeaves(from: number, to: number): [number, number] {
  return from <= to ? [from, to] : [to, from];
}

/**
 * Stagger so a multi-page jump riffles like real paper: the leaf nearest the start goes first.
 * Returns milliseconds.
 */
export function turnDelay(leaf: number, from: number, to: number, step = 70, cap = 560): number {
  if (from === to) return 0;
  const rank = to > from ? leaf - from : from - 1 - leaf;
  return clamp(rank, 0, 100) * step > cap ? cap : clamp(rank, 0, 100) * step;
}

/** Whether leaf `j` is close enough to the current view to render real content. */
export function isNearLeaf(j: number, f: number, from: number, ahead = 3, behind = 2): boolean {
  return Math.abs(j - f) <= ahead || Math.abs(j - from) <= behind;
}

/** "03" style padding for counters. */
export const pad2 = (n: number) => String(n).padStart(2, "0");
