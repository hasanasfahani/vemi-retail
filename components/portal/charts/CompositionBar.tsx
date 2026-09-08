"use client";

/* One bar, split into where a total actually comes from.

   Used for a single question: of everything at stake this cycle, how
   much is replenishment versus range versus pricing? A ranked list of
   decisions answers "which is biggest"; this answers "what KIND of
   problem is this cycle", which is the thing an executive decides
   against.

   Capped at six segments by construction — past that a stacked bar
   stops being readable and the honest form is a ranked list. */

import { useState } from "react";

export type CompositionSegment = {
  id: string;
  label: string;
  value: number;
  emphasis?: boolean;
};

export default function CompositionBar({
  segments,
  unitNoun,
}: {
  segments: CompositionSegment[];
  unitNoun: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  /* One accent, then progressively lighter neutrals — the emphasis
     form rather than a categorical palette, because these segments
     are ordered by size and nobody needs to tell them apart by hue
     when each is directly labelled below. */
  const fill = (i: number, emphasis?: boolean) =>
    emphasis || i === 0
      ? "var(--color-violet)"
      : ["var(--color-chart-context)", "var(--color-comp-1)", "var(--color-comp-2)", "var(--color-comp-3)"][
          Math.min(i - 1, 3)
        ];

  return (
    <div className="w-full">
      <div className="flex gap-[2px] overflow-hidden rounded-[5px]">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const on = hover === seg.id;
          return (
            <div
              key={seg.id}
              tabIndex={0}
              onMouseEnter={() => setHover(seg.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(seg.id)}
              onBlur={() => setHover(null)}
              title={`${seg.label}: ${Math.round(seg.value).toLocaleString()} ${unitNoun} (${Math.round(pct)}%)`}
              className="h-[22px] outline-none"
              style={{
                width: `${Math.max(pct, 1.5)}%`,
                background: fill(i, seg.emphasis),
                opacity: hover && !on ? 0.55 : 1,
              }}
            />
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-col gap-1">
        {segments.map((seg, i) => (
          <div
            key={seg.id}
            className="flex items-baseline gap-2 text-[12.5px]"
            style={{ opacity: hover && hover !== seg.id ? 0.55 : 1 }}
          >
            <span
              className="mt-[3px] inline-block h-[9px] w-[9px] shrink-0 rounded-[2px]"
              style={{ background: fill(i, seg.emphasis) }}
            />
            <span className="text-ink-700">{seg.label}</span>
            <span className="mono ml-auto shrink-0 font-semibold text-ink-900">
              {Math.round((seg.value / total) * 100)}%
            </span>
            <span className="mono shrink-0 text-ink-400">
              {Math.round(seg.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
