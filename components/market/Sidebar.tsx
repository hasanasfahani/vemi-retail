"use client";

/* Five groups, collapsible to icons.

   The collapse is not decoration. At 1440px the rail costs 240px of a
   page whose densest views are a 26-column assortment matrix and a
   map — and those are exactly the views where someone wants the
   width back. Collapsed state persists, because a reader who wants
   the room usually wants it every time.

   TWO BUGS FIXED HERE, and they were the same bug wearing two faces.
   The rail sized itself to the whole page rather than the viewport, so
   on a long page its footer — which held the only expand button — sat
   thousands of pixels below the fold. Collapse the sidebar on the
   dashboard and there was no way back short of clearing storage.

   So: the rail is now `sticky` at full VIEWPORT height, which both
   keeps the navigation in view while the page scrolls and puts its
   controls where they can be reached. And the toggle lives in the
   header row in BOTH states, because a control that disappears in the
   state it is meant to undo is not a control. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NAV } from "@/lib/market/nav";
import { useReports } from "./useReports";
import { createReport, upsertReport } from "@/lib/market/reports";
import { contract, coverage } from "@/lib/market";
import Icon from "@/components/vemi/Icon";
import { IconButton } from "@/components/vemi/Button";
import { BandChip } from "@/components/vemi/BandChip";
import { Gauge } from "@/components/vemi/Gauge";
import { Logo } from "@/components/vemi/Logo";

const KEY = "vemi.sidebar.collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  /* Nav links carry the active filters.

     Global filters live in the URL, so a plain <Link href="/portal/x">
     silently drops them — pick Baghdad on the dashboard, click
     Performance, and you are looking at the whole country again while
     the header you just set says otherwise. Every destination keeps
     the query string; only page-local search is left behind, which is
     the point of it being page-local. */
  const params = useSearchParams();
  const qs = params.toString();
  const withFilters = (href: string) => (qs ? `${href}?${qs}` : href);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  /* The rail shows a few and the index shows the rest. A sidebar that
     grows without limit stops being navigation. */
  const { recent } = useReports();
  const RAIL_CAP = 5;

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(KEY) === "1";
    } catch {
      /* private mode — the rail still works, it just forgets. */
    }
    if (!stored) return;
    const id = window.setTimeout(() => setCollapsed(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* nothing to do — correct for this session regardless. */
    }
  };

  const itemClass = (active: boolean) =>
    `mb-0.5 flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] leading-5 transition-colors ${
      collapsed ? "justify-center px-0" : ""
    } ${
      active
        ? "bg-primary-tint font-semibold text-primary-text"
        : "font-medium text-text hover:bg-bg"
    }`;
  const iconClass = (active: boolean) => (active ? "text-primary" : "text-text-muted");

  return (
    <nav
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[72px]" : "w-[256px]"
      }`}
      aria-label="Sections"
    >
      <div
        className={`flex h-16 shrink-0 items-center border-b border-line ${
          collapsed ? "justify-center px-2" : "justify-between pl-5 pr-2"
        }`}
      >
        {!collapsed && (
          <Link href={withFilters("/portal")} className="flex items-center rounded-sm" aria-label="Vemi, executive dashboard">
            <Logo height={24} title="" />
          </Link>
        )}
        <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={toggle}>
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group, i) => (
          <div key={group.label} className={i > 0 ? "mt-5" : undefined}>
            {!collapsed && (
              <div className="flex min-h-8 items-center justify-between gap-2 pb-1 pl-3">
                <span className="vm-label">{group.label}</span>
                {group.id === "reports" && (
                  <IconButton
                    label="Build a report"
                    size="sm"
                    onClick={() => {
                      /* Created and opened in one gesture, with its name
                         selected. Nothing is gated behind confirming it,
                         so walking away costs nothing. */
                      const report = createReport();
                      upsertReport(report);
                      router.push(`/portal/reports/custom/${report.id}?new=1`);
                    }}
                  >
                    <Icon name="plus" size={16} />
                  </IconButton>
                )}
              </div>
            )}
            {collapsed && i > 0 && <div className="mx-2 mb-3 h-px bg-line" />}
            {group.items.map((item) => {
              const active = pathname === item.href;

              /* Not a link. A padlocked row that navigates anywhere is
                 a promise the product cannot keep yet. */
              if (item.locked) {
                return (
                  <div
                    key={item.href}
                    title={`${item.label} — coming soon`}
                    aria-disabled="true"
                    className={`mb-0.5 flex min-h-11 cursor-default items-center gap-3 rounded-md px-3 text-[15px] font-medium text-text-muted ${
                      collapsed ? "justify-center px-0" : ""
                    }`}
                  >
                    <Icon name={item.icon} className="h-5 w-5 text-line-strong" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
                          <Icon name="lock" size={16} />
                          Soon
                        </span>
                      </>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={withFilters(item.href)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={itemClass(active)}
                >
                  <Icon name={item.icon} className={`h-5 w-5 ${iconClass(active)}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            {/* The reader's own reports, under the two standing pages. */}
            {group.id === "reports" && recent.length > 0 && (
              <>
                {!collapsed && <div className="mx-3 my-2 h-px bg-line" />}
                {recent.slice(0, RAIL_CAP).map((report) => {
                  const href = `/portal/reports/custom/${report.id}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={report.id}
                      href={withFilters(href)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? report.name : undefined}
                      className={itemClass(active)}
                    >
                      <Icon name="custom-report" className={`h-5 w-5 ${iconClass(active)}`} />
                      {!collapsed && <span className="truncate">{report.name}</span>}
                    </Link>
                  );
                })}
                {!collapsed && recent.length > RAIL_CAP && (
                  <Link
                    href={withFilters("/portal/reports/custom")}
                    className="mb-0.5 flex min-h-9 items-center rounded-md px-3 text-sm font-semibold text-primary-text transition-colors hover:bg-primary-tint"
                  >
                    All {recent.length} reports
                  </Link>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Coverage lives in the rail because it is the one number that
          is true on every page — the contract, not a metric. */}
      <div className="shrink-0 border-t border-line p-3">
        {collapsed ? (
          <div
            className="flex flex-col items-center gap-1.5 py-1"
            title={`${coverage.audited.toLocaleString()} of ${coverage.contracted.toLocaleString()} audited · ${coverage.pct}%`}
          >
            <span className="font-mono text-xs font-medium text-text">{coverage.pct}%</span>
            <Gauge value={coverage.pct} className="w-9" label={`${coverage.pct}% of contracted outlets audited`} />
          </div>
        ) : (
          <div className="rounded-md border border-line bg-bg p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="vm-label">This month</span>
              <BandChip band={coverage.onTrack ? "strong" : "attention"} label={coverage.onTrack ? "On track" : "Behind"} size="sm" />
            </div>
            <div className="mt-2 font-mono text-sm font-medium text-text">
              {coverage.audited.toLocaleString()}
              <span className="text-text-muted"> / {coverage.contracted.toLocaleString()}</span>
            </div>
            <Gauge
              className="mt-2"
              value={coverage.pct}
              label={`${coverage.pct}% of contracted outlets audited`}
            />
            <div className="mt-2 text-xs text-text-muted">
              {coverage.pct}% · {contract.daysRemaining} days left
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
