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
  /* "neutral" ramps Violet 100 → Violet → Ink 800, for a magnitude that
     is neither good nor bad — penetration, coverage, price. "bad" runs
     the D1 band ramp from Paper to Ink, for a magnitude that counts
     failures, so a dark cell means "needs you sooner" everywhere. */
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
      "var(--vm-primary-tint)",
      "var(--vm-portfolio-3)",
      "var(--vm-portfolio-2)",
      "var(--vm-primary)",
      "var(--vm-ink-800)",
    ],
    /* Role tokens (brand/tokens.css): the D1 ramp on the Vemi surface,
       green → red status tints in the client portal. */
    bad: ["var(--vm-heat-bad-0)", "var(--vm-heat-bad-1)", "var(--vm-heat-bad-2)", "var(--vm-heat-bad-3)", "var(--vm-heat-bad-4)"],
  } as const;

  const fill = (v: number) => RAMP[tone][step(v)];
  const step = (v: number) => {
    const t = hi === lo ? 1 : (v - lo) / (hi - lo);
    return t < 0.2 ? 0 : t < 0.4 ? 1 : t < 0.6 ? 2 : t < 0.8 ? 3 : 4;
  };
  /* The number's colour is made for its cell: on the neutral ramp it
     flips to white on the two darkest steps, where Ink would fall under
     4.5:1; on the failure ramp each step names its own (≥4.5:1). */
  const ink = (v: number) =>
    tone === "bad"
      ? `var(--vm-heat-bad-on-${step(v)})`
      : step(v) >= 3
        ? "var(--vm-surface)"
        : "var(--vm-text)";

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-[2px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[140px] bg-surface" />
              {columns.map((col) => (
                <th key={col.id} scope="col" className="px-1 pb-1 uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="sticky left-0 z-10 bg-surface pr-3 text-right text-sm font-medium text-text">
                  {row.label}
                </th>
                {columns.map((col) => {
                  const v = value(row.id, col.id);
                  if (v === null)
                    return (
                      <td key={col.id} className="rounded-sm bg-bg py-3 text-center text-text-muted" title="Not audited">
                        —
                      </td>
                    );
                  const cell = (
                    <span className="mono block py-3 text-center text-sm font-semibold tabular-nums">
                      {v.toFixed(v < 10 ? 1 : 0)}
                      {unit}
                    </span>
                  );
                  return (
                    <td
                      key={col.id}
                      className="rounded-sm"
                      style={{
                        background: fill(v),
                        color: ink(v),
                        /* The light end of the ramp is 1.22:1 against the
                           card; a hairline keeps the cell a cell. */
                        boxShadow: (hi === lo ? 1 : (v - lo) / (hi - lo)) < 0.4 ? "inset 0 0 0 1px var(--vm-line)" : undefined,
                      }}
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
      {legend && <div className="mt-2 text-xs text-text-muted">{legend}</div>}
    </div>
  );
}
