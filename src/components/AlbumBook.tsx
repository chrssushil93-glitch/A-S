"use client";

import type { CSSProperties } from "react";
import {
  changedLeaves,
  isNearLeaf,
  turnDelay,
  type AlbumMode,
  type FlatSpread,
  type SinglePage,
} from "@/lib/albumModel";
import { AlbumCover } from "./AlbumCover";
import { AlbumPage } from "./albumPages";

interface AlbumBookProps {
  mode: AlbumMode;
  /** Number of flipped leaves. 0 = closed. */
  f: number;
  /** `f` before the latest navigation (drives stagger and which leaves render content). */
  from: number;
  /** Changes on every navigation so the turn-shade animation restarts. */
  turn: number;
  flat: readonly FlatSpread[];
  plan: readonly SinglePage[];
  onOpen: () => void;
}

const Z_STEP = 0.5; // px of depth between sheets, stops coplanar sheets fighting

/**
 * The 3D book: a stack of leaves that rotate about the spine with CSS transforms.
 *
 * Desktop ("double"): leaf j has the right-hand page of spread j-1 on its front and the
 * left-hand page of spread j on its back. Mobile ("single"): each leaf carries one page.
 * Leaf 0 is always the cover.
 */
export function AlbumBook({ mode, f, from, turn, flat, plan, onOpen }: AlbumBookProps) {
  const views = mode === "double" ? flat.length : plan.length;
  const leafCount = views + 1;
  const open = f > 0;
  const [lo, hi] = changedLeaves(from, f);
  const remaining = views === 0 ? 0 : (views - f) / views;
  const turned = views === 0 ? 0 : f / views;

  const paper = <div className="album-page" />;

  const frontFace = (j: number) => {
    if (mode === "double") {
      const fs = flat[j - 1];
      return fs ? (
        <AlbumPage fs={fs} part="right" folio={String(2 * (j - 1) + 2)} gutter="left" flip={(j - 1) % 2 === 1} />
      ) : (
        paper
      );
    }
    const sp = plan[j - 1];
    const fs = sp && flat[sp.spreadIndex];
    return fs ? (
      <AlbumPage fs={fs} part={sp.part} folio={String(j)} gutter="left" flip={sp.spreadIndex % 2 === 1} />
    ) : (
      paper
    );
  };

  const backFace = (j: number) => {
    if (mode === "double") {
      const fs = flat[j];
      return fs ? <AlbumPage fs={fs} part="left" folio={String(2 * j + 1)} gutter="right" flip={j % 2 === 1} /> : paper;
    }
    return paper; // the reverse of a single page is blank paper
  };

  const leaves = [];
  for (let j = 0; j < leafCount; j++) {
    const flipped = j < f;
    const changing = j >= lo && j < hi;
    const delay = changing ? turnDelay(j, from, f) : 0;
    const near = isNearLeaf(j, f, from);
    const frontActive = j === f;
    const backActive = j === f - 1;
    const z = (flipped ? j : leafCount - j) * Z_STEP;
    const style = {
      zIndex: flipped ? j : leafCount - j,
      transform: `translateZ(${z}px) rotateY(${flipped ? -180 : 0}deg)`,
      "--turn-delay": `${delay}ms`,
    } as CSSProperties;

    leaves.push(
      <div key={j} className="book-leaf" style={style}>
        <div className="book-face" inert={!frontActive} aria-hidden={!frontActive}>
          {j === 0 ? (
            <>
              <AlbumCover />
              <button
                type="button"
                onClick={onOpen}
                tabIndex={frontActive ? 0 : -1}
                aria-label="Open the album"
                className="absolute inset-0 cursor-pointer transition-colors hover:bg-white/[0.03]"
              />
            </>
          ) : near ? (
            frontFace(j)
          ) : (
            paper
          )}
          {changing && <span key={`f${turn}`} className="turn-shade" aria-hidden />}
        </div>
        <div className="book-face is-back" inert={!backActive} aria-hidden={!backActive}>
          {near ? backFace(j) : paper}
          {changing && <span key={`b${turn}`} className="turn-shade is-back" aria-hidden />}
        </div>
      </div>,
    );
  }

  return (
    <div className="book-scene relative h-full w-full">
      <div className="book" data-open={open} data-mode={mode}>
        <div className="book-pages" style={{ "--rem": remaining, "--turned": turned } as CSSProperties}>
          {/* Cover boards: overhang the paper slightly, like a real hardback */}
          <div
            className="book-board"
            aria-hidden
            style={{ left: mode === "single" ? "-0.8%" : 0, right: "-1.8%", top: "-1.6%", bottom: "-1.6%", transform: "translateZ(-3px)" }}
          />
          {mode === "double" && (
            <div
              className="book-board"
              aria-hidden
              style={{ left: "-101.8%", width: "101.8%", top: "-1.6%", bottom: "-1.6%", transform: "translateZ(-3px)", opacity: open ? 1 : 0 }}
            />
          )}
          {/* Page-block edges: thicker on whichever side has more sheets */}
          <div
            className="book-edge"
            aria-hidden
            style={{ left: "100%", width: "calc(var(--rem) * 1.2%)", transform: "translateZ(-1px)" }}
          />
          {mode === "double" && (
            <div
              className="book-edge"
              aria-hidden
              style={{ right: "100%", width: "calc(var(--turned) * 1.2%)", transform: "translateZ(-1px)", opacity: open ? 1 : 0 }}
            />
          )}
          {leaves}
        </div>
      </div>
    </div>
  );
}
