"use client";

/* THE STATUS CHIP, WITH ITS REASONING ATTACHED.

   A chip that says "Needs attention" is a verdict. Hovering it now
   shows how the verdict was reached: the cut-offs, where this figure
   falls against them, what it would take to reach the next band, and —
   where the status is a composite or covers a population — what it is
   made of.

   Opens on hover AND on keyboard focus, because a panel that only
   exists on hover is unavailable to anyone using a keyboard or a
   touchscreen. The chip stays a span rather than becoming a button:
   it is a label with an explanation, not a control, and announcing it
   as a button would promise an action it does not perform. */

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BAND_SWATCH, BAND_SWATCH_EDGE, BAND_LABEL, type Band } from "./health";
import { BandChip } from "@/components/vemi/BandChip";
import type { BandDetail } from "@/lib/market/bandDetail";

const WIDTH = 300;

export default function StatusChip({
  band,
  label,
  size = "md",
  detail,
  title,
  children,
}: {
  band: Band;
  label?: string;
  size?: "sm" | "md";
  /* Omit and the chip behaves exactly as a plain badge — there are
     places where the status is the whole story and there is nothing
     further to say. */
  detail?: BandDetail | null;
  title?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"left" | "right">("left");
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !box.current) return;
    const rect = box.current.getBoundingClientRect();
    const main = box.current.closest("main")?.getBoundingClientRect();
    const leftEdge = (main?.left ?? 0) + 8;
    const rightEdge = (main?.right ?? window.innerWidth) - 8;
    /* Prefer opening rightward from the chip; flip when that would run
       past the content area. */
    setSide(rect.left + WIDTH <= rightEdge ? "left" : rect.right - WIDTH >= leftEdge ? "right" : "left");
  }, [open]);

  const chip = (
    <BandChip band={band} label={label} size={size} className={detail ? "cursor-help" : undefined}>
      {children}
    </BandChip>
  );

  if (!detail) return chip;

  return (
    <span
      ref={box}
      className="relative inline-flex"
      tabIndex={0}
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      {chip}

      {open && (
        <span
          id={id}
          role="tooltip"
          className={`vm-pop w-[300px] ${side === "left" ? "vm-pop--start" : "vm-pop--end"}`}
        >
          <span className="vm-pop__label">{title ?? `Why ${BAND_LABEL[band].toLowerCase()}`}</span>
          <span className="block text-sm text-text">{detail.lead}</span>

          <span className="mt-2 block">
            {detail.rows.map((row) => (
              <span
                key={row.label}
                className={`flex items-center gap-2 border-b border-line py-1.5 text-xs last:border-0 ${
                  row.here ? "font-semibold text-text" : "text-text-muted"
                }`}
              >
                {row.band && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: BAND_SWATCH[row.band], boxShadow: `inset 0 0 0 1px ${BAND_SWATCH_EDGE[row.band]}` }}
                    aria-hidden
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{row.label}</span>
                <span className="mono shrink-0">{row.value}</span>
                {row.here && <span className="shrink-0 font-mono text-xs text-primary-text">here</span>}
              </span>
            ))}
          </span>

          {detail.footnote && (
            <span className="mt-2 block text-xs text-text-muted">{detail.footnote}</span>
          )}
        </span>
      )}
    </span>
  );
}
