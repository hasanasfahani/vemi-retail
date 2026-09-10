"use client";

/* The global header: what you are looking at, what it is narrowed to,
   and how fresh it is.

   The active-filter row is the part that earns its space. A filter
   that persists across pages is a filter someone will forget they set,
   and a page quietly reporting one city while its title says the
   market is the most expensive kind of wrong here. So every active
   filter is named, removable in one click, and a single Clear wipes
   the lot. */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { titleFor } from "@/lib/market/nav";
import {
  FILTER_KEYS, FILTER_META, activeCount, type FilterKey, type Filters,
} from "@/lib/market/filters";
import { months, contract } from "@/lib/market";
import Dropdown from "./Dropdown";
import { FILTER_OPTIONS as OPTIONS, FILTER_VALUE_LABEL as LABEL } from "@/lib/market/filterOptions";


export default function Header({
  filters,
  onChange,
  onClear,
  search,
  onSearch,
  searchPlaceholder = "Search",
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  /* Page-local, deliberately not in the URL. Omit to hide the box. */
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const active = activeCount(filters);

  const toggle = (key: FilterKey, value: string) => {
    const cur = filters[key];
    onChange({
      ...filters,
      [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-[60px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-ink-900">
            {titleFor(pathname)}
          </h1>
          <span className="hidden shrink-0 text-[12.5px] text-ink-400 md:inline">
            {contract.clientShort} · {contract.brand} · {contract.country}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onSearch && (
            <label className="relative hidden md:block">
              <svg viewBox="0 0 16 16" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5 14 14" />
              </svg>
              <input
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-[190px] rounded-[9px] border border-line-strong bg-white py-1.5 pl-8 pr-3 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-violet"
              />
            </label>
          )}

          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-ink-500 hover:bg-canvas hover:text-ink-900"
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 3.5-1.5 4.5-1.5 4.5h12s-1.5-1-1.5-4.5A4.5 4.5 0 0 0 10 3zM8.5 15a1.6 1.6 0 0 0 3 0" />
            </svg>
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-critical)" }}
            />
          </button>

          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: "var(--color-violet-050)", color: "var(--color-violet-ink)" }}
            title="Commercial Director"
          >
            HA
          </span>
        </div>
      </div>

      {/* filter row */}
      <div className="flex flex-wrap items-end gap-2 border-t border-line px-4 py-2.5 sm:px-6">
        <Dropdown
          label="Period"
          summary={months.find((m) => m.id === filters.month)?.label ?? "This month"}
          active={filters.month !== contract.currentMonth}
          options={months.map((m) => ({ value: m.id, label: m.label }))}
          selected={[filters.month]}
          onToggle={(v) => onChange({ ...filters, month: v })}
          single
        />
        {FILTER_KEYS.map((key) => (
          <Dropdown
            key={key}
            label={FILTER_META[key].label}
            summary={
              filters[key].length === 0
                ? `All ${FILTER_META[key].noun}`
                : filters[key].length === 1
                  ? LABEL[key](filters[key][0])
                  : `${filters[key].length} selected`
            }
            active={filters[key].length > 0}
            options={OPTIONS[key]}
            selected={filters[key]}
            onToggle={(v) => toggle(key, v)}
          />
        ))}

        {active > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mb-[1px] ml-auto rounded-[9px] px-2.5 py-2 text-[12.5px] font-semibold text-violet-ink hover:bg-violet-050"
          >
            Clear {active} filter{active === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {/* Active filters, always named. A persisted filter someone has
          forgotten is the most expensive kind of wrong on a page whose
          title says "market". */}
      {active > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line bg-canvas px-4 py-2 sm:px-6">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Showing
          </span>
          {filters.month !== contract.currentMonth && (
            <Chip
              label={months.find((m) => m.id === filters.month)?.label ?? filters.month}
              onRemove={() => onChange({ ...filters, month: contract.currentMonth })}
            />
          )}
          {FILTER_KEYS.flatMap((key) =>
            filters[key].map((v) => (
              <Chip
                key={`${key}-${v}`}
                label={LABEL[key](v)}
                onRemove={() => toggle(key, v)}
              />
            ))
          )}
        </div>
      )}

      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
    </header>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-violet-100 bg-violet-050 py-0.5 pl-2.5 pr-1 text-[12px] font-medium text-violet-ink">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full p-0.5 hover:bg-violet-100"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </span>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const items = [
    { tone: "critical", title: "Pepsi 500ml out of stock in 91 audited POS", when: "2h ago" },
    { tone: "warn", title: "Coca-Cola gained shelf share in Basra", when: "Yesterday" },
    { tone: "neutral", title: "September audit is 74% complete", when: "Yesterday" },
    { tone: "good", title: "12 flagged POS were revisited and verified", when: "3 days ago" },
  ] as const;
  const colour = {
    critical: "var(--color-critical)", warn: "var(--color-warn)",
    good: "var(--color-good)", neutral: "var(--color-ink-400)",
  };
  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="fixed inset-0 z-20 cursor-default"
      />
      <div className="absolute right-4 top-[58px] z-30 w-[320px] rounded-[12px] border border-line bg-white p-2 shadow-[var(--shadow-pop)] sm:right-6">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Notifications
        </div>
        {items.map((n) => (
          <div key={n.title} className="flex gap-2 rounded-lg px-2 py-2 hover:bg-canvas">
            <span
              className="mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ background: colour[n.tone] }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-[13px] leading-snug text-ink-900">{n.title}</span>
              <span className="block text-[11.5px] text-ink-400">{n.when}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
