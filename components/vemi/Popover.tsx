"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";
import Icon from "./Icon";

const WIDTH = 340;

/**
 * A click-to-open explanation: "how this is measured", "why this band".
 * Opens on click (and keyboard), closes on Escape or a click elsewhere,
 * and opens toward whichever side of the content area has room.
 */
export function InfoPopover({
  label = "How this is measured", title, align = "end", children, className,
}: {
  /** Names the button for a screen reader ("How availability is measured"). */
  label?: string;
  /** Optional mono heading inside the panel. */
  title?: ReactNode;
  align?: "start" | "end";
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"start" | "end">(align);
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const main = box.current.closest("main")?.getBoundingClientRect();
    const left = (main?.left ?? 0) + 8;
    const right = (main?.right ?? window.innerWidth) - 8;
    const roomEnd = r.right - WIDTH >= left;
    const roomStart = r.left + WIDTH <= right;
    setSide(align === "end" ? (roomEnd ? "end" : roomStart ? "start" : "end") : roomStart ? "start" : roomEnd ? "end" : "start");
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className={cx("relative inline-flex", className)} ref={box}>
      <button
        type="button"
        className="vm-infobtn"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon name="info" size={16} />
      </button>
      {open && (
        <span id={id} role="note" className={cx("vm-pop", side === "end" ? "vm-pop--end" : "vm-pop--start")}>
          {title && <span className="vm-pop__label">{title}</span>}
          {children}
        </span>
      )}
    </span>
  );
}
