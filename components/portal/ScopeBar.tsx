"use client";

/* Country-level scope control.

   The platform runs Iraq; Erbil is the market currently applied, not
   the extent of the product. Both selectors list everything Vemi
   covers, with unsubscribed markets and categories shown locked rather
   than hidden — the reader should see what they are not yet buying. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories, governorates, scope, UNLOCK_MESSAGE } from "@/lib/portal";

type Option = { id: string; label: string; sub?: string; active: boolean };

export default function ScopeBar() {
  const cityOptions: Option[] = governorates.map((g) => ({
    id: g.name,
    label: g.name,
    sub: g.active ? `${g.potentialPos} outlets live` : `${g.potentialPos} outlets available`,
    active: g.active,
  }));

  const categoryOptions: Option[] = categories.map((c) => ({
    id: c.id,
    label: c.label,
    active: c.active,
  }));

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="hidden text-[12px] font-semibold uppercase tracking-wide text-ink-400 xl:inline">
        {scope.country}
      </span>
      <span className="hidden text-ink-300 xl:inline" aria-hidden>
        /
      </span>
      <Selector label="Market" value={scope.city} options={cityOptions} />
      <Selector label="Category" value={scope.category} options={categoryOptions} />
    </div>
  );
}

function Selector({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: Option[];
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
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

  return (
    <div className="relative min-w-0" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        className="flex min-w-0 items-center gap-1.5 rounded-full border border-line-strong bg-white py-1 pl-2.5 pr-2 text-[13px] font-medium text-ink-700 transition-colors hover:border-ink-400"
      >
        <span
          className="dot dot-live shrink-0"
          style={{ background: "var(--color-good)" }}
          aria-hidden
        />
        <span className="truncate font-semibold text-ink-900">{value}</span>
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 4.5 6 7.5l3-3" />
        </svg>
      </button>

      {open && (
        <div className="panel-in absolute left-0 top-[calc(100%+8px)] z-50 w-[268px] overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-pop)]">
          <div className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {label}
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-[13px] ${
                  option.active ? "bg-violet-050" : ""
                }`}
              >
                <span className="min-w-0">
                  <span
                    className={
                      option.active
                        ? "font-semibold text-violet-ink"
                        : "text-ink-500"
                    }
                  >
                    {option.label}
                  </span>
                  {option.sub && (
                    <span className="block text-[11px] text-ink-400">
                      {option.sub}
                    </span>
                  )}
                </span>
                {option.active ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="var(--color-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3.5 8.5 6.5 11.5 12.5 5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                    <path d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-line bg-canvas px-3 py-2.5">
            <p className="text-[12px] text-ink-500">{UNLOCK_MESSAGE}</p>
            <Link
              href="/#packages"
              className="mt-1.5 inline-block text-[12px] font-semibold text-violet-ink hover:underline"
            >
              Extend coverage →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
