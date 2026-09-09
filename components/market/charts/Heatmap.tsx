/* A grid of one measure across two dimensions — city × channel,
   district × SKU. Sequential single hue, light to dark: magnitude is
   one thing, so it gets one hue and never a rainbow.

   Every cell carries its own number as well as its fill, so the map
   is readable in greyscale and by a colourblind reader; the fill is
   the glance, the digit is the fact. */

import type { ReactNode } from "react";

export default function Heatmap({
  rows,
  columns,
  value,
  cellLabel,
  min,
  max,
  unit = "",
  onCellClick,
  legend,
  tone = "neutral",
}: {
  rows: { id: string; label: string }[];
  columns: { id: string; label: string }[];
  value: (rowId: string, colId: string) => number | null;
  cellLabel?: (rowId: string, colId: string, v: number) => string;
  min?: number;
  max?: number;
  unit?: string;
  onCellClick?: (rowId: string, colId: string) => void;
  legend?: ReactNode;
  /* "neutral" ramps through the portal's accent, for a magnitude that
     is neither good nor bad — penetration, coverage, price. "bad"
     ramps through the critical red, for a magnitude that is a count of
     failures: a grid of out-of-stocks drawn in the same violet as a
     distribution map reads as ordinary volume, and a dark cell should
     mean the same thing everywhere it appears. */
  tone?: "neutral" | "bad";
}) {
  const values: number[] = [];
  for (const r of rows)
    for (const c of columns) {
      const v = value(r.id, c.id);
      if (v !== null) values.push(v);
    }
  /* The ramp spans the DATA's range, not 0–100. Availability across a
     grid lives between 80 and 92; anchored at zero every cell would be
     the same dark violet and the map would say nothing. Pass min/max
     explicitly where an absolute scale is the point. */
  const lo = min ?? (values.length ? Math.min(...values) : 0);
  const hi = max ?? (values.length ? Math.max(...values) : 1);

  /* One hue, five steps. Sequential means a single hue, light to dark —
     never a rainbow — and the hue itself carries the meaning: accent
     for a plain magnitude, red where the magnitude counts failures. */
  const RAMP = {
    neutral: [
      "var(--color-violet-050)",
      "var(--color-violet-100)",
      "var(--color-stock-1)",
      "var(--color-stock-3)",
      "var(--color-violet)",
    ],
    bad: ["#fdf0ef", "#f8d4d1", "#eda9a4", "#dd6f68", "var(--color-critical)"],
  } as const;

  const fill = (v: number) => {
    const t = hi === lo ? 1 : (v - lo) / (hi - lo);
    const step = t < 0.2 ? 0 : t < 0.4 ? 1 : t < 0.6 ? 2 : t < 0.8 ? 3 : 4;
    return RAMP[tone][step];
  };
  const ink = (v: number) => {
    const t = hi === lo ? 1 : (v - lo) / (hi - lo);
    return t >= 0.6 ? "#ffffff" : "var(--color-ink-700)";
  };

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-[2px] text-[12px]">
          <thead>
            <tr>
              <th className="w-[128px]" />
              {columns.map((col) => (
                <th key={col.id} scope="col" className="px-1 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="pr-2 text-right text-[12px] font-medium text-ink-700">
                  {row.label}
                </th>
                {columns.map((col) => {
                  const v = value(row.id, col.id);
                  if (v === null)
                    return (
                      <td key={col.id} className="rounded-[6px] bg-canvas py-2 text-center text-ink-400" title="Not audited">
                        —
                      </td>
                    );
                  const cell = (
                    <span className="mono block py-2 text-center font-semibold tabular-nums">
                      {v.toFixed(v < 10 ? 1 : 0)}
                      {unit}
                    </span>
                  );
                  return (
                    <td
                      key={col.id}
                      className="rounded-[6px]"
                      style={{ background: fill(v), color: ink(v) }}
                      title={cellLabel?.(row.id, col.id, v) ?? `${row.label} · ${col.label}: ${v}${unit}`}
                    >
                      {onCellClick ? (
                        <button type="button" onClick={() => onCellClick(row.id, col.id)} className="block w-full">
                          {cell}
                        </button>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legend && <div className="mt-2 text-[11px] text-ink-400">{legend}</div>}
    </div>
  );
}
