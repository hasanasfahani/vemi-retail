"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { portalNav, scope, coverage } from "@/lib/portal";

/* Left rail on desktop, a scrolling tab strip on phones — several
   buyers open this from LinkedIn on a handset. */
export default function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-[232px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <Link
          href="/"
          className="flex h-[60px] items-center border-b border-line px-6 font-display text-lg font-bold tracking-tight text-ink-900"
        >
          Vemi
          <span style={{ color: "var(--color-violet)" }}>.</span>
        </Link>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {portalNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`mb-0.5 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-violet-050 font-semibold text-violet-ink"
                    : "font-medium text-ink-500 hover:bg-canvas hover:text-ink-900"
                }`}
              >
                {item.label}
                {item.locked && <LockGlyph />}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-line p-3">
          <div className="rounded-lg bg-canvas p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Coverage
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-900">
              {coverage.activeCount} of {coverage.totalCount} governorates
            </div>
            <div className="mt-0.5 text-xs text-ink-500">
              {scope.posCount} outlets audited weekly
            </div>
          </div>
        </div>
    </nav>
  );
}

/* Same destinations, phone layout — sits under the top bar. */
export function PortalTabs() {
  const pathname = usePathname();
  const strip = useRef<HTMLElement>(null);

  /* Keep the current module in view: on a phone the later tabs sit off
     the right edge, and landing on one with no visible highlight reads
     as though nothing is selected. */
  useEffect(() => {
    const active = strip.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <nav
      ref={strip}
      className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:hidden"
    >
        {portalNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-violet-050 font-semibold text-violet-ink"
                  : "font-medium text-ink-500"
              }`}
            >
              {item.label}
              {item.locked && <LockGlyph />}
            </Link>
          );
      })}
    </nav>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7" />
    </svg>
  );
}
