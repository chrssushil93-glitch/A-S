"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "wedding-archive:favourites:v1";
const EVENT = "wedding-archive:favourites-changed";
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedValue: string[] = EMPTY;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : EMPTY;
    return cachedValue;
  } catch {
    return cachedValue; // storage blocked: behave as an empty, session-less list
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable (private mode etc.): favourites simply will not persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Favourites are stored in this browser only (localStorage). They do not sync between devices.
 */
export function useFavourites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);
  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);
  return { ids, has, toggle, remove, clear };
}
