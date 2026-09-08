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
  visits,
  currentVisit,
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {/* Collection window — always shown. Every figure on the page is
            a composite across one trailing window, not a reading from
            one day, and which window is the first thing to know. The
            control used to be labelled "Visit", which implied a single
            date the whole panel shares; it never did under rolling
            collection. */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Window
          </span>
          <div className="flex gap-1 rounded-lg bg-canvas p-1">
            {visits.map((visit) => (
              <button
                key={visit.id}
                type="button"
                aria-pressed={filters.visit === visit.id}
                onClick={() => onChange({ ...filters, visit: visit.id })}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  filters.visit === visit.id
                    ? "bg-white text-ink-900 shadow-[var(--shadow-card)]"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {visit.shortLabel}
                {visit.id === currentVisit && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-400">
                    latest
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

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
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-1 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <div
        className={`flex flex-wrap gap-1 ${
          scroll ? "max-h-[64px] overflow-y-auto" : ""
        }`}
      >
        {options.map((option) => {
          const on = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option.value)}
              className="rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors"
              style={
                on
                  ? {
                      background: "var(--color-violet-050)",
                      borderColor: "var(--color-violet-100)",
                      color: "var(--color-violet-ink)",
                    }
                  : {
                      background: "#fff",
                      borderColor: "var(--color-line-strong)",
                      color: "var(--color-ink-700)",
                    }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
