"use client";

/* The right-hand slide-over. Detail without losing your place: a POS
   opened from the map, a table row or a task keeps the filtered list
   behind it, so closing returns you to exactly the scroll position you
   left.

   Escape closes, the backdrop closes, focus moves in on open and the
   page behind stops scrolling while it is up. */

import { useEffect, useRef, type ReactNode } from "react";

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = 520,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const held = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = held;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/25"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{ width: `min(${width}px, 100vw)` }}
        className="relative flex h-full flex-col border-l border-line bg-white shadow-[var(--shadow-pop)] outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-ink-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="shrink-0 rounded-md p-1 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-700"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="border-t border-line px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>
  );
}
