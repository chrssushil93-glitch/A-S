"use client";

import { useEffect, useRef } from "react";
import { chapters } from "@/content/album";
import { pad2 } from "@/lib/albumModel";
import { useReducedMotion } from "@/lib/hooks";

/** A scrollable list of chapters. The active chapter is marked with an underline, weight and aria-current. */
export function ChapterNavigator({ activeId, onSelect }: { activeId?: string; onSelect: (id: string) => void }) {
  const listRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !el) return;
    // Scroll the strip itself (never the page) so the active chapter stays in view.
    list.scrollTo({ left: el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [activeId, reduce]);

  return (
    <nav aria-label="Album chapters" className="mx-auto mt-8 max-w-5xl">
      <ul ref={listRef} className="no-scrollbar relative flex gap-1 overflow-x-auto px-1 pb-1 sm:justify-center">
        {chapters.map((c, i) => {
          const active = c.id === activeId;
          return (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={active ? "true" : undefined}
                className={`chapter-pill flex min-h-11 items-center gap-2 px-3 py-2 text-[0.8rem] tracking-wide transition-colors ${
                  active ? "!text-gold" : "text-ivory/70 hover:text-ivory"
                }`}
                style={active ? { boxShadow: "inset 0 -2px 0 var(--gold)", fontWeight: 600 } : undefined}
              >
                <span className="eyebrow tabular-nums opacity-70" style={{ fontSize: "0.62rem" }}>
                  {pad2(i + 1)}
                </span>
                {c.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
