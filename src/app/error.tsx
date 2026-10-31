"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="on-dark grain grain-light relative grid min-h-dvh place-items-center bg-espresso px-6 py-16 text-center text-ivory">
      <div>
        <p className="eyebrow text-gold">Something went wrong</p>
        <h1 className="font-display t-title mt-5">The album slipped from our hands</h1>
        <p className="italic-serif mx-auto mt-6 max-w-md text-xl text-ivory/80">Nothing is lost. Please try again.</p>
        <button type="button" onClick={reset} className="btn btn-gold mt-10">
          Try again
        </button>
      </div>
    </main>
  );
}
