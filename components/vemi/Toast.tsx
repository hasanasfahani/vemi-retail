"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export type ToastKind = "success" | "info";
export type Toast = { id: number; kind: ToastKind; text: string };

/** Acknowledgements, bottom-end. Announced politely, self-dismissing, dismissible. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const timers = useRef<number[]>([]);

  const push = useCallback((text: string, kind: ToastKind = "success") => {
    next.current += 1;
    const id = next.current;
    setToasts((held) => [...held, { id, kind, text }]);
    timers.current.push(window.setTimeout(() => setToasts((held) => held.filter((t) => t.id !== id)), 4200));
  }, []);

  const dismiss = useCallback((id: number) => setToasts((held) => held.filter((t) => t.id !== id)), []);

  useEffect(() => {
    const held = timers.current;
    return () => held.forEach((t) => window.clearTimeout(t));
  }, []);

  return { toasts, push, dismiss };
}

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" aria-atomic="false" className="vm-toasts print:hidden">
      {toasts.map((t) => (
        <div key={t.id} className="vm-toast">
          <span className="vm-toast__dot" aria-hidden="true" style={t.kind === "info" ? { background: "var(--vm-text-muted)" } : undefined} />
          <p className="vm-toast__text">{t.text}</p>
          <button type="button" className="vm-iconbtn vm-iconbtn--sm -my-1" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
