"use client";

/* Five groups, collapsible to icons.

   The collapse is not decoration. At 1440px the rail costs 240px of a
   page whose densest views are a 26-column assortment matrix and a
   map — and those are exactly the views where someone wants the
   width back. Collapsed state persists, because a reader who wants
   the room usually wants it every time. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV } from "@/lib/market/nav";
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
      className={`hidden shrink-0 flex-col border-r border-line bg-white transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[68px]" : "w-[236px]"
      }`}
      aria-label="Sections"
    >
      <div className="flex h-[60px] items-center justify-between border-b border-line px-4">
        <Link
          href={withFilters("/portal")}
          className="flex items-center font-display text-lg font-bold tracking-tight text-ink-900"
        >
          {collapsed ? "V" : "Vemi"}
          <span style={{ color: "var(--color-violet)" }}>.</span>
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="rounded-md p-1 text-ink-400 hover:bg-canvas hover:text-ink-700"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9.5 4 5.5 8l4 4" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((group, i) => (
          <div key={group.label} className={i > 0 ? "mt-4" : undefined}>
            {!collapsed && (
              <div className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                {group.label}
              </div>
            )}
            {collapsed && i > 0 && <div className="mx-2 mb-2 h-px bg-line" />}
            {group.items.map((item) => {
              const active = pathname === item.href;
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
          </div>
        ))}
      </div>

      {/* Coverage lives in the rail because it is the one number that
          is true on every page — the contract, not a metric. */}
      <div className="border-t border-line p-2.5">
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="flex w-full items-center justify-center rounded-lg p-2 text-ink-400 hover:bg-canvas hover:text-ink-700"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6.5 4l4 4-4 4" />
            </svg>
          </button>
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
