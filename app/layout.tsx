import type { Metadata } from "next";
import { fontVariables } from "@/brand/fonts";
import "./globals.css";

/* Root holds only the document shell. The marketing chrome (Nav /
   Footer) lives in the (site) group; the portal brings its own. */

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
      className={`${fontVariables} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
