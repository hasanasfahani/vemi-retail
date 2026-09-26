"use client";

import { cx } from "./cx";

export interface SegmentOption<T extends string> { value: T; label: string }

/** Two to four views of the same data (time window, unit, map/table). Not navigation. */
export function SegmentedControl<T extends string>({
  options, value, onChange, ariaLabel, size = "md", className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div className={cx("vm-seg", size === "sm" && "vm-seg--sm", className)} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.value} type="button" className="vm-seg__opt" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
