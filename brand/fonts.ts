import localFont from "next/font/local";

/* The three brand faces, self-hosted from brand/fonts (SIL OFL).

   next/font rather than the kit's @font-face sheet: it preloads the
   files, generates a metric-matched fallback so the swap does not shift
   the layout, and bundles the files into the build (the Vercel build
   once failed on fonts it could not reach).

   Each loader exposes a private variable; brand/tokens.css turns them
   into the --vm-font-* stacks everything else uses. Weights are the
   brand's 400 / 500 / 600 only — there is no bold in the system. */

export const instrumentSans = localFont({
  src: [
    { path: "./fonts/InstrumentSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/InstrumentSans-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

/* Arabic ships with the tokens but is not preloaded: no English page
   sets Arabic yet, and a preload nobody uses costs every visitor. */
export const plexSansArabic = localFont({
  src: [
    { path: "./fonts/IBMPlexSansArabic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  instrumentSans.variable,
  plexMono.variable,
  plexSansArabic.variable,
].join(" ");
