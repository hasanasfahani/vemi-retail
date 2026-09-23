import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

/* Root holds only the document shell. The marketing chrome (Nav /
   Footer) lives in the (site) group; the portal brings its own. */

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
