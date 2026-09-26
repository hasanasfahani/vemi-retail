import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/brand/fonts";
import { brandHex } from "@/brand/tokens";
import "./globals.css";

/* Root holds only the document shell. The marketing chrome (Nav /
   Footer) lives in the (site) group; the portal brings its own. */

export const metadata: Metadata = {
  title: "Vemi · Market intelligence platform for Iraq",
  description:
    "See every shelf. Know every move. Win every decision. Vemi turns verified shelf evidence from across Iraq into market intelligence for FMCG brands: availability, shelf share, pricing and competitors.",
  applicationName: "Vemi",
  openGraph: {
    type: "website",
    siteName: "Vemi",
    title: "Vemi · Market intelligence platform for Iraq",
    description: "See every shelf. Know every move. Win every decision.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vemi · Market intelligence platform for Iraq",
    description: "See every shelf. Know every move. Win every decision.",
  },
};

/* Browser chrome color on mobile: Vemi Violet, as the kit's head
   snippet specifies. */
export const viewport: Viewport = {
  themeColor: brandHex.violet,
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
