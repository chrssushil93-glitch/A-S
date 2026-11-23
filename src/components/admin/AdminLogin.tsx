"use client";

import { useState } from "react";

export function AdminLogin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    }).catch(() => null);
    if (r?.ok) return location.reload();
    setErr((await r?.json().catch(() => null))?.error ?? "Could not reach the server.");
    setBusy(false);
  }

  return (
    <main className="adm-wrap adm-narrow">
      <p className="adm-eyebrow">Sushil &amp; Anjali · The Wedding Archive</p>
      <h1 className="adm-h1">Album console</h1>
      <form onSubmit={submit} className="adm-card">
        <label htmlFor="pw" className="adm-label">Password</label>
        <input id="pw" type="password" autoFocus autoComplete="current-password" value={pw}
          onChange={(e) => setPw(e.target.value)} className="adm-input" />
        {err && <p role="alert" className="adm-err">{err}</p>}
        <button className="adm-btn adm-primary" disabled={busy || !pw}>{busy ? "Checking…" : "Sign in"}</button>
      </form>
    </main>
  );
}
