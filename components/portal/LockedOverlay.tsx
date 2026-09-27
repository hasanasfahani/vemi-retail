"use client";

import { Suspense, useState } from "react";
import FullDemoModal from "./FullDemoModal";
import { useRole } from "./useRole";
import { LockedRegion } from "@/components/vemi/LockedRegion";
import { Button } from "@/components/vemi/Button";
import { contract } from "@/lib/market";
import MobileNav from "@/components/market/MobileNav";

/* Gates a module behind the full-demo request.

   Admins see the module untouched. Everyone else sees the brand's
   locked region: stated plainly on Paper ("Not in your plan"), what
   the module does and what it holds, and one way in. It used to blur
   the real page behind a card; the brand rules out greying or blurring
   as the signal, and a specific account of what is inside does the
   "there is something real here" job better than an unreadable
   picture of it. The module's content is no longer rendered for
   non-admins at all.

   This is presentation, not access control; the portal runs on
   illustrative data. */

const MODULES: Record<string, { lead: string; holds: string[] }> = {
  "Audit Setup": {
    lead: "Choose what every audit cycle covers and the targets each page is judged against.",
    holds: ["Outlet panel and visit cadence", "Must-stock SKUs per channel", "KPI targets that reband the portal"],
  },
  "POS Explorer": {
    lead: "Every audited outlet in one place, with its shelf, its band and its history.",
    holds: ["Search and filter all audited outlets", "Shelf evidence and gaps per outlet", "Export to CSV for field teams"],
  },
  "Historical Trends": {
    lead: "How availability, shelf share, pricing and POSM moved across the last six cycles.",
    holds: ["Market and core-panel lines side by side", "Brand share across the half", "The same outlets compared month to month"],
  },
  "Users & Settings": {
    lead: "Bring your team in and decide who sees which markets.",
    holds: ["Invite users by role", "Market and category access", "Notification preferences"],
  },
  "Follow-up Audits": {
    lead: "Send auditors back to the outlets behind an insight, and see whether the fix held.",
    holds: ["Request a revisit from any finding", "Before and after shelf evidence", "Verification by re-running the rule"],
  },
  Pricing: {
    lead: "Shelf price against list price, by SKU, governorate and retailer.",
    holds: ["Price compliance against list", "Breaches traced to their outlets", "Price position against competitors"],
  },
  Assortment: {
    lead: "Which of your range is listed and stocked where, against each channel's must-stock list.",
    holds: ["SKU by outlet listing matrix", "Distribution gaps by channel", "Headroom per SKU"],
  },
  POSM: {
    lead: "Which display material is on the shelf, where, and how much of what was agreed is there.",
    holds: ["Presence by material type", "Compliance by governorate", "Missing items by outlet"],
  },
  Watchlist: {
    lead: "Pin the figures you care about and see them move each cycle against their targets.",
    holds: ["Watch any KPI, brand or outlet", "Off-track alerts each cycle", "Trend against target"],
  },
  "Monthly Reports": {
    lead: "The month's audit as a report you can print or forward.",
    holds: ["Coverage and market health", "Gaps and the actions behind them", "Competitive summary"],
  },
};

export default function LockedOverlay({
  title,
  standalone = true,
  children,
}: {
  /* Names the module in the heading and in the request. */
  title: string;
  /* A whole locked page brings the portal's top bar and page container
     (the module's own page, which normally draws them, is not
     rendered). A locked tab inside a page sets this false. */
  standalone?: boolean;
  children: React.ReactNode;
}) {
  const role = useRole();
  const [open, setOpen] = useState(false);

  if (role === "admin") return <>{children}</>;

  const about = MODULES[title];

  const region = (
    <div className="max-w-[720px]">
      <LockedRegion
        title={title}
        lead={about?.lead ?? "This module is available on a guided walkthrough, where we set it up around your categories and markets."}
        action={
          <>
            {about && (
              <ul className="mt-1 flex flex-col gap-2">
                {about.holds.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-text">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Button onClick={() => setOpen(true)}>Request full demo</Button>
            </div>
          </>
        }
      />
      <FullDemoModal open={open} onClose={() => setOpen(false)} source={title} />
    </div>
  );

  if (!standalone) return <div className="py-2">{region}</div>;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <h1 className="truncate text-lg font-semibold leading-7 text-text">{title}</h1>
          <span className="hidden truncate font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-muted md:inline">
            {contract.clientShort} · {contract.brand} · {contract.country}
          </span>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-[1360px] flex-1 px-4 pb-16 pt-8 sm:px-6">{region}</main>
    </>
  );
}
