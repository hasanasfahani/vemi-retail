"use client";

/* One filter row, above everything it scopes.

   State lives in the URL, so a filtered view is shareable and survives
   a reload. Every chart and table on the page re-renders against the
   same slice — filters never live inside a single card. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_FILTERS,
  allAreas,
  allChannels,
  filterCount,
  filtersFromParams,
  filtersToQuery,
  type Filters,
} from "@/lib/portalFilters";
import {
  brands,
  cachedVisit,
  loadVisit,
  latest,
  type VisitData,
} from "@/lib/portalData";

export function useFilters(): [Filters, (next: Filters) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(params.toString())),
    [params]
  );

  const setFilters = useCallback(
    (next: Filters) => {
      router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false });
    },
    [router, pathname]
  );

  return [filters, setFilters];
}

/* The visit's cells, gaps and prices.

   The latest visit ships with the page; any other is fetched the first
   time it is asked for. While it is in flight the previous window's
   render is held at reduced opacity rather than replaced by a skeleton
   — no layout jump, and the reader keeps something to read. */
export function useVisitData(visit: string): {
  data: VisitData;
  loading: boolean;
} {
  const [loaded, setLoaded] = useState<VisitData | null>(
    () => cachedVisit(visit) ?? null
  );

  useEffect(() => {
    const ready = cachedVisit(visit);
    if (ready) {
      /* Off the effect body: a cache hit still has to reach state. */
      const id = window.setTimeout(() => setLoaded(ready), 0);
      return () => window.clearTimeout(id);
    }
    let live = true;
    loadVisit(visit).then((data) => {
      if (live) setLoaded(data);
    });
    return () => {
      live = false;
    };
  }, [visit]);

  const data = loaded?.visit === visit ? loaded : (loaded ?? latest);
  return { data, loading: data.visit !== visit };
}

type Group = "areas" | "channels" | "brands";

export default function FilterBar({
  filters,
  onChange,
  show = ["brands", "channels", "areas"],
  resultLabel,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  show?: Group[];
  resultLabel: string;
}) {
  const active = filterCount(filters);

  const toggle = (group: Group, value: string) => {
    const current = filters[group];
    onChange({
      ...filters,
      [group]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  return (
    <div className="mb-4 rounded-[14px] border border-line bg-white p-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* THE WINDOW SELECTOR WAS REMOVED HERE.

            It let a reader switch between the two collection windows.
            Under rolling collection there is only one answer to "what
            does the shelf look like" — the current trailing window —
            and the previous one exists to be subtracted from it, not
            browsed. Keeping the control put a date picker on every
            page to serve a case nobody had, and implied the portal
            was a historical archive rather than a live view.

            The previous window is still in the payload and still does
            its job: it is the other half of every core-panel delta. */}

        {show.includes("brands") && (
          <Group
            label="Brand"
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
            selected={filters.brands}
            onToggle={(v) => toggle("brands", v)}
          />
        )}
        {show.includes("channels") && (
          <Group
            label="Channel"
            options={allChannels.map((c) => ({ value: c, label: c }))}
            selected={filters.channels}
            onToggle={(v) => toggle("channels", v)}
          />
        )}
        {show.includes("areas") && (
          <Group
            label="District"
            options={allAreas.map((a) => ({ value: a, label: a }))}
            selected={filters.areas}
            onToggle={(v) => toggle("areas", v)}
            scroll
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2.5">
        <span className="text-[12px] text-ink-500">{resultLabel}</span>
        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-[12px] font-semibold text-violet-ink hover:underline"
          >
            Clear {active} filter{active > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function Group({
  label,
  options,
  selected,
  onToggle,
  scroll,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  scroll?: boolean;
}) {
  /* A LIST, not a row of chips.

     Chips read as a set of buttons of equal weight, which is fine for
     four channels and wrong for eighteen districts: they wrapped over
     several lines, the selected ones scattered among the unselected,
     and finding one meant scanning a paragraph. A list gives every
     option the same left edge, so the eye runs down a column instead
     of hunting across rows, and a checkbox says "several of these" in
     a way a highlighted pill does not. */
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 pb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
        {selected.length > 0 && (
          <span className="mono text-[11px] text-violet-ink">
            {selected.length}
          </span>
        )}
      </div>
      <div
        className={`flex flex-col rounded-[10px] border border-line bg-canvas p-1 ${
          scroll ? "max-h-[132px] overflow-y-auto" : ""
        }`}
      >
        {options.map((option) => {
          const on = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-[5px] text-[12.5px] transition-colors ${
                on
                  ? "bg-white font-semibold text-ink-900 shadow-[var(--shadow-card)]"
                  : "text-ink-700 hover:bg-white/60"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(option.value)}
                className="h-3.5 w-3.5 shrink-0 accent-[var(--color-violet)]"
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
