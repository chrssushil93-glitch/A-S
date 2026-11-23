"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Slot } from "@/lib/adminSlots";

type Staged = { file?: Blob; preview?: string; alt?: string; focus?: string };
type Status = { kind: "idle" | "busy" | "ok" | "error"; text?: string; link?: string };

/** Shrink big phone photos in the browser first so uploads stay quick; the server re-encodes anyway. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 3200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    return file; // e.g. a format the browser can't decode: let the server try
  }
}

export function AdminConsole({ slots, mode }: { slots: Slot[]; mode: "github" | "local" | "none" }) {
  const [staged, setStaged] = useState<Record<string, Staged>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const dirtyKeys = useMemo(
    () =>
      slots.filter((s) => {
        const g = staged[s.key];
        if (!g) return false;
        return Boolean(g.file) || (g.alt !== undefined && g.alt !== s.photo.alt) || (g.focus !== undefined && g.focus !== (s.photo.focus ?? "50% 40%"));
      }).map((s) => s.key),
    [slots, staged],
  );

  useEffect(() => {
    if (!dirtyKeys.length) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyKeys.length]);

  const patch = (key: string, p: Staged) => setStaged((s) => ({ ...s, [key]: { ...s[key], ...p } }));

  async function choose(key: string, f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/") && !/\.(heic|heif|jpe?g|png|webp|avif)$/i.test(f.name)) {
      setStatus({ kind: "error", text: `"${f.name}" isn't an image.` });
      return;
    }
    const blob = await shrink(f);
    if (staged[key]?.preview) URL.revokeObjectURL(staged[key].preview!);
    patch(key, { file: blob, preview: URL.createObjectURL(blob) });
    setStatus({ kind: "idle" });
  }

  function undo(key: string) {
    if (staged[key]?.preview) URL.revokeObjectURL(staged[key].preview!);
    setStaged((s) => {
      const n = { ...s };
      delete n[key];
      return n;
    });
  }

  async function publish() {
    setStatus({ kind: "busy", text: "Publishing…" });
    const form = new FormData();
    const edits: Record<string, { alt?: string; focus?: string }> = {};
    for (const s of slots) {
      const g = staged[s.key];
      if (!g || !dirtyKeys.includes(s.key)) continue;
      if (g.file) form.append(`file:${s.key}`, g.file, "photo.jpg");
      const e: { alt?: string; focus?: string } = {};
      if (g.alt !== undefined && g.alt !== s.photo.alt) e.alt = g.alt;
      if (g.focus !== undefined && g.focus !== (s.photo.focus ?? "50% 40%")) e.focus = g.focus;
      if (e.alt !== undefined || e.focus !== undefined) edits[s.key] = e;
    }
    form.append("edits", JSON.stringify(edits));
    const r = await fetch("/api/admin/publish", { method: "POST", body: form }).catch(() => null);
    const data = await r?.json().catch(() => null);
    if (r?.ok) {
      Object.values(staged).forEach((g) => g.preview && URL.revokeObjectURL(g.preview));
      setStaged({});
      setStatus({
        kind: "ok",
        text:
          data.mode === "github"
            ? "Published. The live site rebuilds now and shows your changes in about a minute."
            : "Saved to this computer. Restart the dev server if the page doesn't update.",
        link: data.commitUrl,
      });
    } else {
      setStatus({ kind: "error", text: data?.error ?? "Could not reach the server." });
      if (r?.status === 401) setTimeout(() => location.reload(), 1500);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.reload();
  }

  const groups = [...new Set(slots.map((s) => s.group))];
  const n = dirtyKeys.length;

  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <p className="adm-eyebrow">Sushil &amp; Anjali · The Wedding Archive</p>
          <h1 className="adm-h1">Album console</h1>
        </div>
        <button className="adm-btn" onClick={logout}>Sign out</button>
      </header>
      <p className="adm-note">
        Replace any photograph, tap the picture to set which part stays in frame, and edit its description. Nothing goes
        live until you press <strong>Publish</strong>. Photos are straightened, resized to a web-friendly size, and stripped
        of location data automatically.
      </p>
      {mode === "none" && (
        <p role="alert" className="adm-err adm-block">
          Publishing isn&apos;t connected yet. Add <code>GITHUB_TOKEN</code> in your hosting settings (see the README), then reload.
        </p>
      )}

      {groups.map((g) => (
        <section key={g} aria-labelledby={`g-${g}`} className="adm-group">
          <h2 id={`g-${g}`} className="adm-h2">{g}</h2>
          <div className="adm-grid">
            {slots.filter((s) => s.group === g).map((s) => {
              const st = staged[s.key];
              const focus = st?.focus ?? s.photo.focus ?? "50% 40%";
              const [fx, fy] = focus.split(" ").map((v) => parseFloat(v));
              const src = st?.preview ?? s.photo.src;
              const dirty = dirtyKeys.includes(s.key);
              return (
                <article key={s.key} className={`adm-card ${dirty ? "adm-dirty" : ""}`} data-slot={s.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); void choose(s.key, e.dataTransfer.files?.[0]); }}>
                  <div className="adm-thumbhead">
                    <strong>{s.label}</strong>
                    {dirty && <span className="adm-pill">Unpublished</span>}
                  </div>
                  <div
                    className="adm-thumb"
                    style={{ aspectRatio: String(Math.min(1.8, Math.max(0.6, s.photo.aspect))) }}
                    onClick={(e) => {
                      if (!src) return;
                      const b = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(((e.clientX - b.left) / b.width) * 100);
                      const y = Math.round(((e.clientY - b.top) / b.height) * 100);
                      patch(s.key, { focus: `${x}% ${y}%` });
                    }}
                    title={src ? "Click to set the focus point" : undefined}
                  >
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={s.photo.alt} style={{ objectPosition: focus }} />
                    ) : (
                      <span className="adm-empty">No photo yet</span>
                    )}
                    {src && <span className="adm-dot" style={{ left: `${fx}%`, top: `${fy}%` }} aria-hidden />}
                  </div>
                  <label className="adm-label" htmlFor={`alt-${s.key}`}>Description (for screen readers)</label>
                  <textarea id={`alt-${s.key}`} rows={2} maxLength={400} className="adm-input"
                    value={st?.alt ?? s.photo.alt}
                    onChange={(e) => patch(s.key, { alt: e.target.value })} />
                  <div className="adm-row">
                    <input ref={(el) => { fileInputs.current[s.key] = el; }} type="file" accept="image/*,.heic,.heif"
                      hidden aria-label={`Choose a new photo for ${s.group}, ${s.label}`}
                      onChange={(e) => { void choose(s.key, e.target.files?.[0]); e.target.value = ""; }} />
                    <button className="adm-btn" onClick={() => fileInputs.current[s.key]?.click()}>
                      {st?.file ? "Choose another" : src ? "Replace photo" : "Add photo"}
                    </button>
                    {dirty && <button className="adm-btn adm-quiet" onClick={() => undo(s.key)}>Undo</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <div className="adm-bar" role="region" aria-label="Publish changes">
        <span aria-live="polite" className={status.kind === "error" ? "adm-err" : ""}>
          {status.kind === "idle" || status.kind === "busy"
            ? status.text ?? (n ? `${n} unpublished change${n === 1 ? "" : "s"}` : "No changes yet")
            : status.text}{" "}
          {status.link && <a href={status.link} target="_blank" rel="noreferrer">View the change</a>}
        </span>
        <button className="adm-btn adm-primary" disabled={!n || status.kind === "busy" || mode === "none"} onClick={publish}>
          {status.kind === "busy" ? "Publishing…" : `Publish ${n || ""}`.trim()}
        </button>
      </div>
    </main>
  );
}
