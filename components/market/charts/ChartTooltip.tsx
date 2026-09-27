"use client";

/* One tooltip for every recharts surface (brand charts.md): surface,
   1px Line, radius 10, overlay shadow, a mono label, and the values in
   Ink with the series swatch beside them — a value stays legible
   whatever its series colour is. */

import type { TooltipContentProps } from "recharts";

export type Fmt = (value: number, name: string) => string;

export default function ChartTooltip({
  active, payload, label, format,
}: Partial<TooltipContentProps<number, string>> & { format?: Fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-md border border-line bg-surface px-3 py-2.5 shadow-[var(--vm-shadow-overlay)]">
      {label !== undefined && <p className="vm-label mb-1.5">{String(label)}</p>}
      <ul className="flex flex-col gap-1">
        {payload.map((row) => (
          <li key={String(row.dataKey)} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: row.color, boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--vm-text) 12%, transparent)" }}
              aria-hidden
            />
            <span className="text-text-muted">{row.name}</span>
            <span className="mono ml-auto pl-3 font-semibold text-text">
              {format ? format(Number(row.value), String(row.name)) : Number(row.value).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
