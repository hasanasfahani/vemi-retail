import { Suspense } from "react";
import type { Metadata } from "next";
import Sidebar from "@/components/market/Sidebar";
import PortalChrome from "@/components/portal/PortalChrome";
import PortalGate from "@/components/portal/PortalGate";
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
    <PortalGate>
      {/* data-surface: the client-portal token scope (docs/PORTAL-NEUTRAL-PLAN.md) —
          universal status colours and, as the plan lands, a neutral frame. */}
      {/* text-text restarts colour inheritance here: body's colour was
          resolved against the Vemi tokens, so without it every element
          that sets no colour of its own would inherit Ink. */}
      <div data-surface="portal" className="flex min-h-screen items-start bg-bg text-text print:bg-surface">
      {/* Sidebar reads the URL to keep filters across navigation, so
          it suspends during prerender like the shell does. */}
      <Suspense fallback={<div className="sticky top-0 hidden h-screen w-[256px] shrink-0 border-r border-line bg-surface lg:block" />}>
        <Sidebar />
      </Suspense>
      {/* min-w-0 so a wide child — the assortment matrix, the POS table —
          scrolls inside its own box and never the page. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalChrome />
        {children}
        </div>
      </div>
    </PortalGate>
  );
}
