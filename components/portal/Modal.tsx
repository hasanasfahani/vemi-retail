"use client";

import { useEffect, useRef } from "react";

/* Shared dialog shell for the portal's two conversion modals.

   Handles the things a dialog has to get right and that are easy to
   forget twice: Escape closes, the backdrop closes, the page behind
   does not scroll, and focus moves into the panel so a keyboard user
   is not left outside it. */

export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
  width = "max-w-4xl",
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Move focus in, but do not steal it from a field the panel itself
       may have autofocused. */
    const id = window.setTimeout(() => {
      if (panel.current && !panel.current.contains(document.activeElement)) {
        panel.current.focus();
      }
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
      style={{ background: "rgba(20,21,26,0.55)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative my-auto w-full ${width} overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-surface)] outline-none`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-ink-500 transition-colors hover:bg-canvas hover:text-ink-900"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
