import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Root holds only the document shell. The marketing chrome (Nav /
   Footer) lives in the (site) group; the portal brings its own. */

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  variable: "--font-space-grotesk",
  weight: "500 700",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vemi — Retail & Market Intelligence for Iraq",
  description:
    "Vemi gives brands verified visibility into retail execution, competitors, consumers, and market signals — starting with real-world retail intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
