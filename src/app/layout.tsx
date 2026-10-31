import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/content/site";
import { PhotoProvider } from "@/components/PhotoProvider";

const serif = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const sans = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: { default: site.siteTitle, template: `%s · ${site.siteTitle}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: site.siteTitle,
    description: site.description,
    siteName: site.siteTitle,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: site.siteTitle, description: site.description },
  // A shared link is not access control. Keep out of search engines unless you choose otherwise.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#302720",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: marks JS as available (enables scroll reveals) and skips the
            opening screen for returning sessions and shared chapter links, so there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement;d.classList.add('js-ready');if(sessionStorage.getItem('wedding-archive:intro')==='1'||location.hash.indexOf('#album')===0)d.setAttribute('data-intro','seen')}catch(e){document.documentElement.classList.add('js-ready')}",
          }}
        />
        {/* Without JavaScript, never trap visitors behind the opening screen */}
        <noscript>
          <style>{".opening{display:none!important}.hero-rise{animation-play-state:running!important}"}</style>
        </noscript>
      </head>
      <body>
        <PhotoProvider>{children}</PhotoProvider>
      </body>
    </html>
  );
}
