import type { MetadataRoute } from "next";
import { brandHex } from "@/brand/tokens";

/* Install / home-screen metadata. Icons are the kit's violet app tile;
   the tiles already carry rounded corners, so they are "any" rather
   than "maskable", which would crop them. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vemi · Market intelligence platform",
    short_name: "Vemi",
    description: "See every shelf. Know every move. Win every decision.",
    start_url: "/",
    display: "standalone",
    background_color: brandHex.paper,
    theme_color: brandHex.violet,
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
