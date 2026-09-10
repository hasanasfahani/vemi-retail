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
import Icon from "./Icon";

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

  return (
    <nav
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[68px]" : "w-[236px]"
      }`}
      aria-label="Sections"
    >
      <div
        className={`flex h-[60px] shrink-0 items-center border-b border-line ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <Link
            href={withFilters("/portal")}
            className="flex items-center font-display text-lg font-bold tracking-tight text-ink-900"
          >
            Vemi
            <span style={{ color: "var(--color-violet)" }}>.</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-700"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={collapsed ? "M6.5 4l4 4-4 4" : "M9.5 4 5.5 8l4 4"} />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((group, i) => (
          <div key={group.label} className={i > 0 ? "mt-4" : undefined}>
            {!collapsed && (
              <div className="flex items-center justify-between gap-2 px-2.5 pb-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                  {group.label}
                </span>
                {group.id === "reports" && (
                  <button
                    type="button"
                    title="Build a report"
                    aria-label="Build a report"
                    onClick={() => {
                      /* Created and opened in one gesture, with its name
                         selected. Nothing is gated behind confirming it,
                         so walking away costs nothing. */
                      const report = createReport();
                      upsertReport(report);
                      router.push(`/portal/reports/custom/${report.id}?new=1`);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-[6px] text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {collapsed && i > 0 && <div className="mx-2 mb-2 h-px bg-line" />}
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
                    className={`mb-0.5 flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-ink-300 ${
                      collapsed ? "justify-center" : ""
                    }`}
                  >
                    <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        <svg
                          viewBox="0 0 16 16"
                          className="ml-auto h-3.5 w-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
                          <path d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7" />
                        </svg>
                        <span className="sr-only">Coming soon</span>
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
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active
                      ? "bg-violet-050 font-semibold text-violet-ink"
                      : "font-medium text-ink-500 hover:bg-canvas hover:text-ink-900"
                  }`}
                >
                  <Icon name={item.icon} className="h-[17px] w-[17px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            {/* The reader's own reports, under the two standing pages. */}
            {group.id === "reports" && recent.length > 0 && (
              <>
                {!collapsed && <div className="mx-2.5 my-1.5 h-px bg-line" />}
                {recent.slice(0, RAIL_CAP).map((report) => {
                  const href = `/portal/reports/custom/${report.id}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={report.id}
                      href={withFilters(href)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? report.name : undefined}
                      className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
                        collapsed ? "justify-center" : ""
                      } ${
                        active
                          ? "bg-violet-050 font-semibold text-violet-ink"
                          : "font-medium text-ink-500 hover:bg-canvas hover:text-ink-900"
                      }`}
                    >
                      <Icon name="custom-report" className="h-[17px] w-[17px] shrink-0" />
                      {!collapsed && <span className="truncate">{report.name}</span>}
                    </Link>
                  );
                })}
                {!collapsed && recent.length > RAIL_CAP && (
                  <Link
                    href={withFilters("/portal/reports/custom")}
                    className="mb-0.5 block rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
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
      <div className="shrink-0 border-t border-line p-2.5">
        {collapsed ? (
          <div
            className="flex flex-col items-center gap-1 py-1"
            title={`${coverage.audited.toLocaleString()} of ${coverage.contracted.toLocaleString()} audited · ${coverage.pct}%`}
          >
            <span className="mono text-[12px] font-bold text-ink-900">{coverage.pct}%</span>
            <span className="h-1 w-8 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${coverage.pct}%`,
                  background: coverage.onTrack ? "var(--color-good)" : "var(--color-warn)",
                }}
              />
            </span>
          </div>
        ) : (
          <div className="rounded-lg bg-canvas p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                This month
              </span>
              <span className="mono text-[11px] font-semibold" style={{ color: coverage.onTrack ? "var(--color-good)" : "var(--color-warn)" }}>
                {coverage.onTrack ? "On track" : "Behind"}
              </span>
            </div>
            <div className="mono mt-1 text-[15px] font-bold text-ink-900">
              {coverage.audited.toLocaleString()}
              <span className="text-[12px] font-medium text-ink-400">
                {" "}/ {coverage.contracted.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{ width: `${coverage.pct}%`, background: "var(--color-violet)" }}
              />
            </div>
            <div className="mt-1 text-[11px] text-ink-400">
              {coverage.pct}% · {contract.daysRemaining} days left
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
