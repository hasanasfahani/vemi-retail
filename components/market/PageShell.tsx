"use client";

/* Every page's frame: the global header wired to URL filters, and the
   filtered view computed once and handed down. Pages receive a view,
   not a filter object — so no page can accidentally compute its
   figures over a different slice than its own header advertises. */

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Header from "./Header";
import ToastHost from "./ToastHost";
import { useFilters } from "./useFilters";
import { applyFilters, type MarketView } from "@/lib/market/filters";
import { cachedMonth, current, loadMonth } from "@/lib/market";
import { hydrateTargets } from "@/lib/market/settings";
import { useEffect } from "react";
import type { MonthData } from "@/lib/market/types";

type ShellProps = {
  /* The month's raw rows come with the view, because one page — the
     Competition page — has to re-derive a view the brand filter does
     NOT narrow: a brand comparison with five of six brands filtered
     out is not a comparison. Everything else uses `view` and never
     touches this. */
  children: (view: MarketView, search: string, data: MonthData) => ReactNode;
  /* Opt in per page — search is page-local by design. */
  search?: boolean;
  searchPlaceholder?: string;
};

/* The shell reads filter state from the URL, and `useSearchParams`
   suspends during a static prerender — so the whole thing sits behind
   a boundary and the page ships as HTML with a frame already drawn.
   Without it a production build fails outright, and in development it
   silently appears to work, which is the worst combination. */
export default function PageShell(props: ShellProps) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell {...props} />
    </Suspense>
  );
}

function ShellSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="h-[60px]" />
        <div className="h-[57px] border-t border-line" />
      </div>
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">
        <div className="h-40 animate-pulse rounded-[14px] border border-line bg-white" />
      </main>
    </>
  );
}

function Shell({ children, search, searchPlaceholder }: ShellProps) {
  const [filters, setFilters, clearFilters] = useFilters();

  /* Stored KPI targets are read once, after mount. Reading them during
     render would make the first client paint disagree with the
     server's HTML, which is a hydration error rather than a feature. */
  useEffect(() => {
    hydrateTargets();
  }, []);

  const [query, setQuery] = useState("");
  const [data, setData] = useState<MonthData>(current);

  /* The current month ships with the page; any other is fetched the
     first time it is asked for. */
  useEffect(() => {
    const held = cachedMonth(filters.month);
    if (held) {
      const id = window.setTimeout(() => setData(held), 0);
      return () => window.clearTimeout(id);
    }
    let live = true;
    loadMonth(filters.month).then((d) => {
      if (live) setData(d);
    });
    return () => {
      live = false;
    };
  }, [filters.month]);

  const view = useMemo(() => applyFilters(filters, data), [filters, data]);

  return (
    <>
      <Header
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        search={search ? query : undefined}
        onSearch={search ? setQuery : undefined}
        searchPlaceholder={searchPlaceholder}
      />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6">
        {children(view, query, data)}
      </main>
      {/* One host for every confirmation on the page — see toastBus. */}
      <ToastHost />
    </>
  );
}
