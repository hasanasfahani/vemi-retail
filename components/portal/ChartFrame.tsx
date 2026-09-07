"use client";

/* The frame every chart in the portal sits in.

   Four bands in a fixed order: title, plot, how-to-read, so-what +
   control. Two of those are REQUIRED PROPS on purpose —

     howToRead  the mechanics. What a row is, what the axis means,
                what colour is doing. Never changes when the data does.
     soWhat     the move this chart implies, this cycle. Changes every
                cycle. Not an observation — a decision.

   A chart that cannot state the decision it implies has not earned its
   place on the page, so that failure is a type error rather than
   something a reviewer has to catch.

   The control band is never empty. When nothing is flagged it renders
   an explicit all-clear, because blank space reads as missing data
   while "we looked and it was fine" is a result — which is most of
   what a weekly cadence is selling. */

import { useState, type ReactNode } from "react";

export type TableView = {
  columns: string[];
  rows: (string | number)[][];
};

type Props = {
  title: string;
  subtitle?: string;
  /* Mechanics of the encoding — required. */
  howToRead: string;
  /* The decision implied — required. */
  soWhat: string;
  children: ReactNode;
  /* Present only when the engine flagged something in this view. */
  action?: ReactNode;
  /* Shown in place of the action when the view is clean. */
  allClear?: string;
  /* Every chart ships a WCAG-clean equivalent. */
  table?: TableView;
};

export default function ChartFrame({
  title,
  subtitle,
  howToRead,
  soWhat,
  children,
  action,
  allClear,
  table,
}: Props) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="overflow-hidden rounded-[18px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <h3 className="t-h3 !text-[15px]">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>
          )}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            className="shrink-0 text-[12px] font-medium text-ink-400 hover:text-ink-700"
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        )}
      </div>

      <div className="px-3 pb-2 pt-3 sm:px-4">
        {showTable && table ? (
          <div className="overflow-x-auto px-2">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-ink-400">
                  {table.columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap py-1.5 pr-4 text-left font-semibold"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`whitespace-nowrap py-1.5 pr-4 ${
                          j === 0 ? "text-ink-700" : "mono text-ink-900"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>

      <p className="border-t border-line bg-canvas px-5 py-2.5 text-[12.5px] leading-snug text-ink-500 sm:px-6">
        <span className="font-semibold text-ink-700">How to read this. </span>
        {howToRead}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5 py-3 sm:px-6">
        <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink-900">
          {soWhat}
        </p>
        {action ?? (
          <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-400">
            <span className="dot" style={{ background: "var(--color-good)" }} />
            {allClear ?? "Nothing flagged this cycle"}
          </span>
        )}
      </div>
    </section>
  );
}
