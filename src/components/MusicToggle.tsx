"use client";

import { useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import { site } from "@/content/site";

/**
 * Optional background music. Renders nothing unless a file exists in public/audio/.
 * It never autoplays: playback starts only when the visitor presses the button.
 */
export function MusicToggle({ className = "" }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "unavailable">("idle");
  const music = site.music;
  if (!music) return null;

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    try {
      await a.play();
    } catch {
      setState("unavailable");
    }
  };

  const playing = state === "playing";
  const label =
    state === "unavailable" ? "Music is unavailable" : playing ? `Pause music: ${music.title}` : `Play music: ${music.title}`;

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={state === "unavailable"}
        aria-pressed={playing}
        aria-label={label}
        title={label}
        className={`icon-btn ${className}`}
        style={playing ? { background: "var(--gold)", borderColor: "var(--gold)", color: "var(--espresso)" } : undefined}
      >
        {playing ? <Pause size={18} aria-hidden /> : <Music size={18} aria-hidden />}
      </button>
      <audio
        ref={audioRef}
        src={music.src}
        loop
        preload="none"
        onPlay={() => setState("playing")}
        onPause={() => setState((s) => (s === "unavailable" ? s : "idle"))}
        onError={() => setState("unavailable")}
      />
      <span role="status" className="sr-only">
        {playing ? "Music playing" : ""}
      </span>
    </>
  );
}
