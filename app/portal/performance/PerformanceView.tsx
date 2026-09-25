"use client";

/* PAGE 2 · Performance — five tabs, one page.

   The tab lives in the URL, so the Executive Dashboard's KPI tiles can
   link straight to the tab that explains them, and a link someone
   pastes into a message opens on the same view they were looking at.

   Every tab reads the same filtered view. The five are different
   questions about one month of fieldwork, not five datasets. */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/market/PageShell";
import Tabs from "@/components/market/ui/Tabs";
import AvailabilityTab from "./tabs/AvailabilityTab";
import ShelfTab from "./tabs/ShelfTab";
import PricingTab from "./tabs/PricingTab";
import AssortmentTab from "./tabs/AssortmentTab";
import PosmTab from "./tabs/PosmTab";
import LockedOverlay from "@/components/portal/LockedOverlay";
import type { MarketView } from "@/lib/market/filters";

const TABS = [
  { id: "availability", label: "Availability" },
  { id: "shelf", label: "Shelf & visibility" },
  { id: "pricing", label: "Pricing" },
  { id: "assortment", label: "Assortment" },
  { id: "posm", label: "POSM" },
];

export default function PerformanceView() {
  return <PageShell>{(view) => <Performance view={view} />}</PageShell>;
}

function Performance({ view }: { view: MarketView }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active = TABS.some((t) => t.id === params.get("tab"))
    ? (params.get("tab") as string)
    : "availability";

  /* `replace`, not `push`: flipping between tabs is looking at one
     page from five angles, and it should not take five presses of the
     back button to leave. The global filters ride along untouched. */
  const setTab = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params.toString());
      if (id === "availability") next.delete("tab");
      else next.set("tab", id);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={TABS} active={active} onChange={setTab} />
      {/* Availability and Shelf & visibility are the open modules; the
          rest sit behind the full-demo request. The tab strip still
          shows them, so a visitor can see what the platform covers. */}
      {active === "availability" && <AvailabilityTab view={view} />}
      {active === "shelf" && <ShelfTab view={view} />}
      {active === "pricing" && (
        <LockedOverlay title="Pricing">
          <PricingTab view={view} />
        </LockedOverlay>
      )}
      {active === "assortment" && (
        <LockedOverlay title="Assortment">
          <AssortmentTab view={view} />
        </LockedOverlay>
      )}
      {active === "posm" && (
        <LockedOverlay title="POSM">
          <PosmTab view={view} />
        </LockedOverlay>
      )}
    </div>
  );
}
