import type { Metadata } from "next";
import PortalNav, { PortalTabs } from "@/components/portal/PortalNav";
import PortalTopBar from "@/components/portal/PortalTopBar";
import PortalGuard from "@/components/portal/PortalGuard";
import PageTransition from "@/components/portal/PageTransition";
import OutletDrawerProvider from "@/components/portal/OutletDrawer";
import { scope } from "@/lib/portal";

/* Each page names itself in the tab; the scope carries the context. */
export const metadata: Metadata = {
  title: {
    template: `%s · ${scope.city} · Vemi`,
    default: `Workspace · ${scope.city} · Vemi`,
  },
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalGuard>
      <OutletDrawerProvider>
      <div className="portal-shell flex min-h-screen bg-canvas">
        <PortalNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopBar />
          <PortalTabs />
          {/* min-w-0 + overflow-x-hidden keep a wide child (the outlet ×
              SKU grid) scrolling inside its own box, never the page */}
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      </OutletDrawerProvider>
    </PortalGuard>
  );
}
