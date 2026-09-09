"use client";

/* The one filter control, multi- or single-select.

   Closed, it states its own state — "All governorates", "Baghdad", "3
   selected" — because that is what a reader needs when they open a
   filtered link somebody sent them. The detail belongs behind a click:
   six filters rendered open would be a permanent block of furniture
   above every page. */

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
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-[152px] items-center justify-between gap-2 rounded-[9px] border px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
          active
            ? "border-violet-100 bg-violet-050 font-semibold text-violet-ink"
            : "border-line-strong bg-white text-ink-700 hover:border-ink-400"
        }`}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0 opacity-60"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden
        >
          <path d="M4 6.5 8 10.5 12 6.5" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable={!single}
          className="absolute left-0 z-40 mt-1 max-h-[280px] w-[228px] overflow-y-auto rounded-[10px] border border-line bg-white p-1 shadow-[var(--shadow-pop)]"
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
                className={`flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-left text-[13px] transition-colors hover:bg-canvas ${
                  on ? "font-semibold text-ink-900" : "text-ink-700"
                }`}
              >
                {!single && (
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border ${
                      on ? "border-violet bg-violet" : "border-line-strong bg-white"
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
