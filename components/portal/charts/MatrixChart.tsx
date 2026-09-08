"use client";

/* A small labelled grid — two categorical axes, one measure.

   Built for the substitution question: when YOUR pack goes empty,
   which rival brand takes the space? That is a pair of categories
   crossed, and no bar chart shows it without collapsing one axis and
   losing the very comparison being asked for.

   Deliberately small. This form works at roughly 6 x 7; past that it
   is the outlet-by-SKU heatmap's problem, which is solved by rolling
   up rather than by drawing more cells. */

import { useState } from "react";

export type MatrixCellValue = { row: string; col: string; value: number };

type Props = {
  rows: { id: string; label: string }[];
  cols: { id: string; label: string; emphasis?: boolean }[];
  cells: MatrixCellValue[];
  unitNoun: string;
  /* Names what a row and a column are, for the read-out. */
  rowNoun: string;
  colNoun: string;
};

export default function MatrixChart({
  rows,
  cols,
  cells,
  unitNoun,
  rowNoun,
  colNoun,
}: Props) {
  const [hover, setHover] = useState<MatrixCellValue | null>(null);
  const index = new Map(cells.map((c) => [`${c.row}|${c.col}`, c.value]));
  const max = Math.max(...cells.map((c) => c.value), 1);

  /* Single hue, light to dark — magnitude, not identity. */
  const fill = (v: number) => {
    if (!v) return "transparent";
    const mix = v / max >= 0.75 ? 100 : v / max >= 0.5 ? 74 : v / max >= 0.25 ? 48 : 26;
    return `color-mix(in srgb, var(--color-violet) ${mix}%, #fff)`;
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="bg-white" />
              {cols.map((c) => (
                <th key={c.id} className="px-1 pb-1 align-bottom">
                  <span
                    className={`block whitespace-nowrap text-[11px] ${
                      c.emphasis ? "font-semibold text-ink-900" : "text-ink-500"
                    }`}
                  >
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th
                  scope="row"
                  className="whitespace-nowrap bg-white pr-3 text-right text-[12px] font-medium text-ink-700"
                >
                  {r.label}
                </th>
                {cols.map((c) => {
                  const v = index.get(`${r.id}|${c.id}`) ?? 0;
                  const on = hover?.row === r.id && hover?.col === c.id;
                  return (
                    <td key={c.id} className="p-0">
                      <div
                        tabIndex={0}
                        role="img"
                        aria-label={`${r.label} replaced by ${c.label}: ${v} ${unitNoun}`}
                        onMouseEnter={() => setHover({ row: r.id, col: c.id, value: v })}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover({ row: r.id, col: c.id, value: v })}
                        onBlur={() => setHover(null)}
                        className="flex h-[30px] w-[54px] items-center justify-center rounded-[3px] outline-none"
                        style={{
                          background: fill(v),
                          border: v ? "none" : "1px solid var(--color-line)",
                          boxShadow: on ? "0 0 0 2px var(--color-ink-900)" : undefined,
                        }}
                      >
                        {v > 0 && (
                          <span
                            className="mono text-[11px] font-semibold"
                            style={{
                              color:
                                v / max >= 0.5 ? "#fff" : "var(--color-ink-900)",
                            }}
                          >
                            {v}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex h-[34px] items-center rounded-lg bg-canvas px-3">
        {hover ? (
          <span className="text-[13px]">
            When your{" "}
            <span className="font-semibold text-ink-900">
              {rows.find((r) => r.id === hover.row)?.label}
            </span>{" "}
            is empty,{" "}
            <span className="font-semibold text-ink-900">
              {cols.find((c) => c.id === hover.col)?.label}
            </span>{" "}
            holds{" "}
            <span className="mono font-semibold text-ink-900">{hover.value}</span>{" "}
            {unitNoun} of that space.
          </span>
        ) : (
          <span className="text-[13px] text-ink-400">
            Rows are your {rowNoun}; columns are the {colNoun} standing in the
            gap. Darker means more space taken.
          </span>
        )}
      </div>
    </div>
  );
}
