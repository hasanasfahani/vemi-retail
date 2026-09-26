"use client";

/* The one filter control, multi- or single-select.

   Closed, it states its own state — "All governorates", "Baghdad", "3
   selected" — because that is what a reader needs when they open a
   filtered link somebody sent them. The detail belongs behind a click:
   six filters rendered open would be a permanent block of furniture
   above every page. */

import Icon from "@/components/vemi/Icon";
import { useEffect, useRef, useState } from "react";

export default function Dropdown({
  label,
  summary,
  active,
  options,
  selected,
  onToggle,
  single,
}: {
  label: string;
  summary: string;
  active: boolean;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative min-w-0" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label}: ${summary}`}
        className={`flex h-11 max-w-[260px] items-center gap-1.5 rounded-md border px-2.5 text-left text-sm transition-colors ${
          active
            ? "border-primary-tint bg-primary-tint font-semibold text-primary-text"
            : "border-line-strong bg-white text-ink-900 hover:bg-canvas"
        }`}
      >
        {/* The default summaries name themselves ("All governorates"); the
            label joins once a specific value is chosen ("GOVERNORATE Basra"). */}
        {active && (
          <span className="shrink-0 font-mono text-xs font-medium uppercase tracking-[0.08em] text-primary-text">{label}</span>
        )}
        <span className="min-w-0 truncate">{summary}</span>
        <span className="shrink-0 text-ink-500" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <Icon name="chevron-down" size={16} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable={!single}
          className="absolute left-0 z-40 mt-1 max-h-[320px] w-[248px] overflow-y-auto rounded-md border border-line bg-white p-1 shadow-[var(--vm-shadow-overlay)]"
        >
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onToggle(option.value);
                  if (single) setOpen(false);
                }}
                className={`flex min-h-9 w-full items-center gap-2 rounded-sm px-2 text-left text-sm transition-colors hover:bg-canvas ${
                  on ? "font-semibold text-ink-900" : "text-ink-700"
                }`}
              >
                {!single && (
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                      on ? "border-primary bg-primary" : "border-line-strong bg-white"
                    }`}
                    aria-hidden
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6.2 5 8.5l4.5-5" />
                      </svg>
                    )}
                  </span>
                )}
                <span className="min-w-0 truncate">{option.label}</span>
                {single && on && (
                  <svg viewBox="0 0 12 12" className="ml-auto h-3 w-3 shrink-0 text-violet-ink" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2.5 6.2 5 8.5l4.5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
