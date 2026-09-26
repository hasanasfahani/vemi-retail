"use client";

import { useRef, type KeyboardEvent } from "react";
import { cx } from "./cx";

export interface TabItem<T extends string> { id: T; label: string; count?: number; panelId?: string }

/** Sections within a page. Arrow keys, Home and End move between tabs. */
export function Tabs<T extends string>({
  items, value, onChange, ariaLabel, className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = items.length;
    const next =
      e.key === "ArrowRight" ? (i + 1) % n
      : e.key === "ArrowLeft" ? (i - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className={cx("vm-tabs", className)} role="tablist" aria-label={ariaLabel}>
      {items.map((t, i) => {
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={t.panelId}
            tabIndex={selected ? 0 : -1}
            className="vm-tab"
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
            {t.count !== undefined && <span className="vm-tab__count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
