import Link from "next/link";
import { site, siteName } from "@/content/site";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="on-dark grain grain-light relative grid min-h-dvh place-items-center bg-espresso px-6 py-16 text-center text-ivory">
      <div>
        <p className="eyebrow text-gold">404</p>
        <h1 className="font-display t-title mt-5">This page has wandered off</h1>
        <div className="hairline mx-auto my-8 w-32" />
        <p className="italic-serif mx-auto max-w-md text-xl text-ivory/80">
          The page you were looking for is not part of {siteName}&rsquo;s archive, but the rest of the day is waiting.
        </p>
        <Link href="/" className="btn btn-gold mt-10">
          Return to the album
        </Link>
        <p className="eyebrow mt-12 text-ivory/60">
          {site.weddingDateDisplay} · {site.location}
        </p>
      </div>
    </main>
  );
}
