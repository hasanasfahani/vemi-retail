"use client";

/* The month payloads a set of requests needs.

   A request spans two cycles — the one that raised it and the one that
   checks it — so a page showing five requests may need four months'
   rows. They are fetched once, deduplicated, and rebuilt into filtered
   views whenever the global filter moves.

   Each month comes as a PAIR: the filtered view, and the same month
   without the brand and SKU filters. Shelf share needs the second one
   for its denominator — filtered to Pepsi, the client would hold 100%
   of a fixture containing only Pepsi. */

import { useEffect, useMemo, useState } from "react";
import { cachedMonth, current, loadMonth } from "@/lib/market";
import { applyFilters, type Filters } from "@/lib/market/filters";
import type { MonthData } from "@/lib/market/types";
import type { MonthPair } from "@/lib/market/followUpView";

export function useFollowUpMonths(monthIds: string[], filters: Filters) {
  const wanted = useMemo(() => [...new Set(monthIds)].sort(), [monthIds]);
  const key = wanted.join(",");
  const [loaded, setLoaded] = useState<Map<string, MonthData>>(
    () => new Map([[current.month, current]])
  );

  useEffect(() => {
    let live = true;
    (async () => {
      const missing = wanted.filter((id) => !cachedMonth(id));
      if (missing.length === 0 && wanted.every((id) => loaded.has(id))) return;
      const held = await Promise.all(wanted.map((id) => loadMonth(id)));
      if (!live) return;
      setLoaded(new Map(held.map((data) => [data.month, data])));
    })();
    return () => {
      live = false;
    };
    /* Keyed on the month list rather than the Map, which is rebuilt on
       every load and would otherwise re-trigger this forever. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const months = useMemo(() => {
    const out = new Map<string, MonthPair>();
    for (const [id, data] of loaded) {
      out.set(id, {
        view: applyFilters({ ...filters, month: id }, data),
        full: applyFilters({ ...filters, month: id, brands: [], skus: [] }, data),
      });
    }
    return out;
  }, [loaded, filters]);

  const ready = wanted.every((id) => months.has(id));
  return { months, ready };
}
