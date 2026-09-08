"use client";

/* One filter row, above everything it scopes.

   State lives in the URL, so a filtered view is shareable and survives
   a reload. Every chart and table on the page re-renders against the
   same slice — filters never live inside a single card. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      <div className="grid gap-3 sm:grid-cols-3">
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
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  scroll?: boolean;
}) {
  /* A DROPDOWN, not an always-open list.

     The list fixed the chips' scanning problem but traded it for a
     new one: three open columns of checkboxes are a permanent block of
     furniture above every page, and eighteen districts pushed the
     actual content below the fold on a laptop. A filter is used
     occasionally and read constantly, so what it owes the page at rest
     is a one-line summary of what is selected — the detail belongs
     behind a click.

     Closed, each control states its own state ("All brands", "Pepsi",
     "3 selected"), which is the thing a reader needs when they arrive
     at a filtered link somebody sent them. */
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  /* Click-away and Escape. A dropdown that only closes by re-clicking
     its own button is a dropdown people leave open. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const summary =
    selected.length === 0
      ? `All ${label.toLowerCase()}s`
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? "1 selected"
        : `${selected.length} selected`;

  return (
    <div className="relative min-w-0" ref={box}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between gap-2 rounded-[10px] border px-3 py-2 text-left text-[13px] transition-colors ${
          selected.length
            ? "border-violet-100 bg-violet-050 font-semibold text-violet-ink"
            : "border-line-strong bg-white text-ink-700 hover:border-ink-400"
        }`}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0 opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden
        >
          <path d="M4 6.5 8 10.5 12 6.5" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute left-0 right-0 z-30 mt-1 max-h-[240px] overflow-y-auto rounded-[10px] border border-line bg-white p-1 shadow-[var(--shadow-pop)]"
        >
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => selected.forEach(onToggle)}
              className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-violet-ink hover:bg-canvas"
            >
              Clear {label.toLowerCase()}
            </button>
          )}
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <label
                key={option.value}
                role="option"
                aria-selected={on}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-[6px] text-[13px] transition-colors ${
                  on ? "font-semibold text-ink-900" : "text-ink-700"
                } hover:bg-canvas`}
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
      )}
    </div>
  );
}
