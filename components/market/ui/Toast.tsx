"use client";

/* Confirmations, bottom-right.

   Small on purpose: a toast is an acknowledgement, not a dialogue. It
   announces itself to assistive technology through a live region,
   dismisses itself, and can be dismissed early — a message that
   cannot be got rid of is worse than no message. */

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastKind = "success" | "info";

export type Toast = { id: number; kind: ToastKind; text: string };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const timers = useRef<number[]>([]);

  const push = useCallback((text: string, kind: ToastKind = "success") => {
    next.current += 1;
    const id = next.current;
    setToasts((held) => [...held, { id, kind, text }]);
    const timer = window.setTimeout(() => {
      setToasts((held) => held.filter((t) => t.id !== id));
    }, 4200);
    timers.current.push(timer);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((held) => held.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const held = timers.current;
    return () => {
      for (const timer of held) window.clearTimeout(timer);
    };
  }, []);

  return { toasts, push, dismiss };
}

export default function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col gap-2 print:hidden"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-[360px] items-start gap-2.5 rounded-[12px] border border-line bg-white px-3.5 py-2.5 shadow-[var(--shadow-pop)]"
        >
          <span
            className="mt-[3px] h-2 w-2 shrink-0 rounded-full"
            style={{
              background:
                toast.kind === "success" ? "var(--color-good)" : "var(--color-violet)",
            }}
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-900">{toast.text}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 text-ink-400 transition-colors hover:text-ink-700"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
