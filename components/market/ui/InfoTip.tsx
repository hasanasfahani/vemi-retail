"use client";

/* The explanation, one click away.

   Every composite in this portal is a judgement — a weighting, a
   denominator, a par somebody chose — and a figure whose derivation
   cannot be inspected is a figure nobody should act on. But the
   working does not belong on the face of the card either, where it was
   the first thing a reader met and the last thing they wanted.

   So: a small button, a popover, and the arithmetic in plain words.
   Opens on click, closes on Escape or a click elsewhere, and is
   reachable from the keyboard — a tooltip that only exists on hover is
   unavailable to anyone using a keyboard or a touchscreen. */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function InfoTip({
  label = "How this is measured",
  align = "right",
  children,
}: {
  /* Named for what it explains, so a screen reader hears "How
     availability is measured" rather than five identical buttons. */
  label?: string;
  align?: "left" | "right";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();

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
    <span className="relative inline-flex" ref={box}>
      <button
        type="button"
        onClick={(e) => {
          /* The KPI tile is itself a link; opening its explanation
             must not navigate. */
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label}
        title={label}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-violet bg-violet text-white"
            : "border-line-strong bg-white text-ink-400 hover:border-ink-400 hover:text-ink-700"
        }`}
      >
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M8 7.4v3.6M8 5.2v.1" />
        </svg>
      </button>

      {open && (
        <span
          id={id}
          role="note"
          className={`absolute top-[calc(100%+7px)] z-40 block w-[min(330px,74vw)] rounded-[12px] border border-line bg-white p-3 text-[11.5px] font-normal leading-relaxed text-ink-500 shadow-[var(--shadow-pop)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
