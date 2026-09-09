"use client";

/* Filter state, held in the URL.

   Five dimensions persist across pages; search does not — it is scoped
   to the table in front of you, and carrying it would silently empty a
   page nobody thought they had narrowed. */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  filtersFromParams, filtersToQuery, type Filters,
} from "@/lib/market/filters";

export function useFilters(): [Filters, (next: Filters) => void, () => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(params.toString())),
    [params]
  );

  const set = useCallback(
    (next: Filters) => {
      router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false });
    },
    [router, pathname]
  );

  const clear = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return [filters, set, clear];
}
