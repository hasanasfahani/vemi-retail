"use client";

/* The global header: what you are looking at, what it is narrowed to,
   and how fresh it is.

   The active-filter row is the part that earns its space. A filter
   that persists across pages is a filter someone will forget they set,
   and a page quietly reporting one city while its title says the
   market is the most expensive kind of wrong here. So every active
   filter is named, removable in one click, and a single Clear wipes
   the lot. */

import { useEffect, useState } from "react";
import Icon from "@/components/vemi/Icon";
import { Button, IconButton } from "@/components/vemi/Button";
import { BAND_COLOR, BAND_EDGE } from "./ui/health";
import { usePathname } from "next/navigation";
import { titleFor } from "@/lib/market/nav";
import {
  FILTER_KEYS, FILTER_META, activeCount, type FilterKey, type Filters,
} from "@/lib/market/filters";
import { months, contract } from "@/lib/market";
import Dropdown from "./Dropdown";
import MobileNav from "./MobileNav";
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

  /* Past the first screen the filter row folds into one line — what
     the page is narrowed to, and a way back to the controls — so the
     sticky header stops eating a sixth of the viewport. */
  const [folded, setFolded] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setFolded(window.scrollY > 220);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const showFilters = !folded || pinnedOpen;

  const periodLabel = months.find((m) => m.id === filters.month)?.label ?? "This month";
  const summary = [
    periodLabel,
    ...FILTER_KEYS.map((key) =>
      filters[key].length === 0
        ? `All ${FILTER_META[key].noun}`
        : filters[key].length === 1
          ? LABEL[key](filters[key][0])
          : `${filters[key].length} ${FILTER_META[key].noun}`
    ),
  ].join(" · ");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <MobileNav />
        <div className="mr-auto flex min-w-0 flex-col justify-center sm:flex-row sm:items-baseline sm:gap-3">
          <h1 className="truncate text-lg font-semibold leading-7 text-ink-900">{titleFor(pathname)}</h1>
          <span className="hidden truncate font-mono text-xs font-medium uppercase tracking-[0.1em] text-ink-500 md:inline">
            {contract.clientShort} · {contract.brand} · {contract.country}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onSearch && (
            <label className="relative mr-2 hidden md:block">
              <span className="sr-only">{searchPlaceholder}</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
                <Icon name="search" size={16} />
              </span>
              <input
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="vm-input !h-10 w-[220px] !pl-9 !text-sm"
              />
            </label>
          )}

          <span className="relative">
            <IconButton label="Notifications, 1 unread" aria-expanded={notifOpen} onClick={() => setNotifOpen((v) => !v)}>
              <Icon name="bell" />
            </IconButton>
            <span className="pointer-events-none absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" aria-hidden />
          </span>

          <span
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary-text"
            title="Commercial Director"
          >
            HA
          </span>
        </div>
      </div>

      {showFilters ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-3 sm:px-6">
          <Dropdown
            label="Period"
            summary={periodLabel}
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

          <span className="ml-auto flex items-center gap-2">
            {active > 0 && (
              <Button variant="text" onClick={onClear}>
                Reset {active} filter{active === 1 ? "" : "s"}
              </Button>
            )}
            {folded && (
              <Button variant="text" onClick={() => setPinnedOpen(false)}>
                Hide filters
              </Button>
            )}
          </span>
        </div>
      ) : (
        <div className="flex min-h-11 items-center gap-3 border-t border-line px-4 sm:px-6">
          <span className="vm-label shrink-0">{active > 0 ? `${active} active` : "Showing"}</span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-700">{summary}</span>
          <Button variant="text" size="sm" onClick={() => setPinnedOpen(true)}>
            Edit filters
          </Button>
        </div>
      )}

      {/* Active filters, always named. A persisted filter someone has
          forgotten is the most expensive kind of wrong on a page whose
          title says "market". */}
      {showFilters && active > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-4 py-2 sm:px-6">
          <span className="vm-label">Showing</span>
          {filters.month !== contract.currentMonth && (
            <Chip
              label={periodLabel}
              onRemove={() => onChange({ ...filters, month: contract.currentMonth })}
            />
          )}
          {FILTER_KEYS.flatMap((key) =>
            filters[key].map((v) => (
              <Chip key={`${key}-${v}`} label={LABEL[key](v)} onRemove={() => toggle(key, v)} />
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
    <span className="flex h-8 items-center gap-1 rounded-full bg-primary-tint pl-3 pr-1 text-sm font-medium text-primary-text">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white"
      >
        <Icon name="close" size={16} />
      </button>
    </span>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const items = [
    { band: "critical", title: "Pepsi 500ml out of stock in 91 audited POS", when: "2h ago" },
    { band: "attention", title: "Coca-Cola gained shelf share in Basra", when: "Yesterday" },
    { band: "average", title: "September audit is 74% complete", when: "Yesterday" },
    { band: "strong", title: "12 flagged POS were revisited and verified", when: "3 days ago" },
  ] as const;
  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="fixed inset-0 z-20 cursor-default"
      />
      <div className="absolute right-4 top-[60px] z-30 w-[340px] rounded-md border border-line bg-white p-2 shadow-[var(--vm-shadow-overlay)] sm:right-6">
        <div className="vm-label px-2 py-2">Notifications</div>
        {items.map((n) => (
          <div key={n.title} className="flex gap-3 rounded-md px-2 py-2.5 hover:bg-canvas">
            <span
              className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
              style={{ background: BAND_COLOR[n.band], boxShadow: `inset 0 0 0 1px ${BAND_EDGE[n.band]}` }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-sm text-ink-900">{n.title}</span>
              <span className="block font-mono text-xs text-ink-500">{n.when}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
