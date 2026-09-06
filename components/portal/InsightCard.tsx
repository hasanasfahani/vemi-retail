"use client";

/* One ranked finding — the unit the Decision Layer is built from.

   Severity is a pill, never colour alone. The formula and its source
   rows sit behind a disclosure, closed by default so the ranked list
   stays scannable, open on demand so nothing is a black box. */

import { useState } from "react";
import Link from "next/link";
import { intensityOf, type Insight } from "@/lib/insights";

const SEVERITY_LABEL: Record<Insight["severity"], string> = {
  critical: "Critical",
  warning: "Warning",
  watch: "Watch",
};

/* globals.css defines .pill-good / .pill-warn / .pill-critical — the
   class name doesn't spell out "warning", so map explicitly rather
   than string-concatenating the severity. */
const SEVERITY_CLASS: Record<Insight["severity"], string> = {
  critical: "pill-critical",
  warning: "pill-warn",
  watch: "pill-warn",
};

export default function InsightCard({
  insight,
  rank,
}: {
  insight: Insight;
  rank?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-line py-3.5 last:border-0">
      <div className="flex items-start gap-3">
        {rank !== undefined && (
          <span className="mono mt-0.5 shrink-0 text-[12px] text-ink-400">
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`pill ${SEVERITY_CLASS[insight.severity]}`}>
              {SEVERITY_LABEL[insight.severity]}
            </span>
            {insight.trend === "worsening" && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-ink-400">
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="var(--color-critical)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M2.5 3.5 6 8l1.7-2.2L9.5 8" />
                </svg>
                confirmed twice
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[14px] font-semibold leading-snug text-ink-900">
            {insight.headline}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
            {insight.detail}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="mono text-[13px] font-semibold text-ink-900">
              {insight.impact.label}
            </span>
            <span
              className="text-[12px] text-ink-400"
              title={`Ranked by ${intensityOf(insight).toFixed(0)} ${insight.impact.unit}/outlet — the total divided by scope, not the total alone.`}
            >
              at {insight.scope.label}
            </span>
            <Link
              href={insight.evidence.href}
              className="text-[12px] font-semibold text-violet-ink hover:underline"
            >
              See the evidence →
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="text-[12px] font-medium text-ink-400 hover:text-ink-700"
            >
              {open ? "Hide the working" : "Show the working"}
            </button>
          </div>

          {open && (
            <div className="mt-3 rounded-[10px] bg-canvas p-3">
              <p className="mono text-[12px] leading-relaxed text-ink-700">
                {insight.evidence.formula}
              </p>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-ink-400">
                      {insight.evidence.table.columns.map((col) => (
                        <th key={col} className="whitespace-nowrap py-1 pr-4 text-left font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insight.evidence.table.rows.map((row, i) => (
                      <tr key={i} className="border-t border-line-strong/40">
                        {row.map((cell, j) => (
                          <td key={j} className="mono whitespace-nowrap py-1 pr-4 text-ink-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
