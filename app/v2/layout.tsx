import type { Metadata } from "next";
import Nav from "@/components/v2/Nav";
import Footer from "@/components/v2/Footer";
import AccessRequestModal from "@/components/demo/AccessRequestModal";

/* /v2 — the alternative positioning, running in parallel with the live
   site at `/`. It is a sibling of the (site) group, so it inherits only
   the root document shell and brings its own chrome.

   noindex is deliberate: until this version is confirmed it must not be
   indexed or compete with `/` in search. */

export const metadata: Metadata = {
  title: "Vemi — Retail & Market Intelligence for Iraq",
  description:
    "Vemi gives brands verified visibility into retail execution, competitors, consumers, and market signals — starting with real-world retail intelligence.",
  robots: { index: false, follow: false },
};

export default function V2Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <AccessRequestModal />
    </>
  );
}
