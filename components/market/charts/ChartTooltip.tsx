"use client";

/* One tooltip for every recharts surface. Series colour sits in the
   swatch; the text stays in ink tokens, so a value is legible whatever
   its series colour is. */

import type { TooltipContentProps } from "recharts";

export type Fmt = (value: number, name: string) => string;

export default function ChartTooltip({
  active, payload, label, format,
}: Partial<TooltipContentProps<number, string>> & { format?: Fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-line bg-white px-2.5 py-2 shadow-[var(--shadow-pop)]">
      {label !== undefined && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {String(label)}
        </p>
      )}
      <ul className="flex flex-col gap-0.5">
        {payload.map((row) => (
          <li key={String(row.dataKey)} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: row.color }}
              aria-hidden
            />
            <span className="text-ink-500">{row.name}</span>
            <span className="mono ml-auto font-semibold text-ink-900">
              {format
                ? format(Number(row.value), String(row.name))
                : Number(row.value).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
