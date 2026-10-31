"use client";

import { useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { site } from "@/content/site";

interface ShareControlProps {
  /** A URL, or a function evaluated at click time (so it can include the current chapter). Defaults to this page. */
  url?: string | (() => string);
  label?: string;
  /** Icon-only round button (for the header). */
  iconOnly?: boolean;
  className?: string;
}

/** Uses the native share sheet where available, otherwise copies the link. */
export function ShareControl({ url, label = "Share", iconOnly = false, className = "" }: ShareControlProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const flash = () => {
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  async function share() {
    const target =
      (typeof url === "function" ? url() : url) ?? `${window.location.origin}${window.location.pathname}`;
    const data = { title: site.siteTitle, text: site.description, url: target };
    try {
      if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // the visitor closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(target);
      flash();
    } catch {
      window.prompt("Copy this link to share it:", target);
    }
  }

  const text = copied ? "Link copied" : label;
  return (
    <>
      <button
        type="button"
        onClick={share}
        className={iconOnly ? `icon-btn ${className}` : `btn btn-gold ${className}`}
        aria-label={iconOnly ? (copied ? "Link copied" : label) : undefined}
      >
        {copied ? <Check size={iconOnly ? 18 : 15} aria-hidden /> : <Share2 size={iconOnly ? 18 : 15} aria-hidden />}
        {!iconOnly && <span>{text}</span>}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </>
  );
}
