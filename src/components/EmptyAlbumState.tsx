export function EmptyAlbumState({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  return (
    <aside
      role="note"
      className={`mx-auto mt-8 max-w-xl border border-dashed px-6 py-5 text-center ${
        dark ? "border-gold/50 text-ivory" : "border-taupe text-espresso"
      }`}
    >
      <p className="italic-serif text-xl">The photographs are on their way.</p>
      <p className={`mt-1 text-sm ${dark ? "text-ivory/70" : "text-taupe-deep"}`}>
        Every page is laid out and waiting. As the pictures are added, they will appear here on their own.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-3 font-mono text-xs opacity-70">
          dev hint: add files named after each placeholder id into public/images/… then restart (see README).
        </p>
      )}
    </aside>
  );
}
