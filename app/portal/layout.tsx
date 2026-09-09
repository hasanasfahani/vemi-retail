import { Suspense } from "react";
import type { Metadata } from "next";
import Sidebar from "@/components/market/Sidebar";
import { contract } from "@/lib/market";

export const metadata: Metadata = {
  title: {
    template: `%s · ${contract.brand} ${contract.country} · Vemi`,
    default: `${contract.brand} ${contract.country} · Vemi`,
  },
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar reads the URL to keep filters across navigation, so
          it suspends during prerender like the shell does. */}
      <Suspense fallback={<div className="hidden w-[236px] shrink-0 border-r border-line bg-white lg:block" />}>
        <Sidebar />
      </Suspense>
      {/* min-w-0 so a wide child — the assortment matrix, the POS table —
          scrolls inside its own box and never the page. */}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
