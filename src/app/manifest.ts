import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.siteTitle,
    short_name: `${site.names[0]} & ${site.names[1]}`,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#302720",
    theme_color: "#302720",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
