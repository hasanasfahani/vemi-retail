"use client";

/* SECTION C · one finding, as a card.

   Category, headline, the metric, how many outlets it touches and
   where — then a way in. No paragraphs: a reader scanning five of
   these is deciding which one to open, not reading an essay.

   Everything on the card comes off the insight object, including the
   evidence behind the "Why" toggle. Nothing is written here that the
   engine did not compute. */

import { useState } from "react";
import type { Insight } from "@/lib/market/insights";
import { CATEGORY_LABEL } from "@/lib/market/insights";
import Badge from "./ui/Badge";
import type { Band } from "./ui/health";

/* Severity is how loud; category is what kind of conversation it
   starts. The pill shows the category and takes its colour from the
   severity, so both facts are on the card without two badges. */
const SEVERITY_BAND: Record<Insight["severity"], Band> = {
  critical: "critical",
  warning: "attention",
  watch: "average",
};

export default function InsightCard({
  insight,
  onAct,
}: {
  insight: Insight;
  onAct?: (insight: Insight) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <Badge
          band={SEVERITY_BAND[insight.severity]}
          label={CATEGORY_LABEL[insight.category]}
          size="sm"
        />
        <span className="mono shrink-0 text-[11px] text-ink-400">
          {insight.scope.outlets.toLocaleString()}{" "}
          {insight.scope.outlets === 1 ? "outlet" : "outlets"}
        </span>
      </div>

      <h3 className="mt-2 font-display text-[14px] font-bold leading-snug tracking-tight text-ink-900">
        {insight.headline}
      </h3>
      <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-ink-500">{insight.detail}</p>

      <p className="mono mt-2 text-[11.5px] text-ink-700">
        {insight.impact.label}
        <span className="ml-1.5 font-normal text-ink-400">
          · {insight.confidence === "measured" ? "counted from field rows" : "projected from a gap"}
        </span>
      </p>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={insight.cta.href}
          className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
        >
          {insight.cta.label}
        </a>
        {onAct && (
          <button
            type="button"
            onClick={() => onAct(insight)}
            className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
          >
            Assign
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ml-auto text-[12px] font-semibold text-ink-500 transition-colors hover:text-ink-900"
        >
          {open ? "Hide working" : "Why?"}
        </button>
      </div>

      {open && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mono text-[11px] leading-snug text-ink-500">
            {insight.evidence.formula}
          </p>
          <div className="mt-2 max-h-[188px] overflow-auto">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="border-b border-line">
                  {insight.evidence.table.columns.map((col) => (
                    <th key={col} scope="col" className="py-1 pr-3 text-left font-semibold text-ink-400">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insight.evidence.table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="py-1 pr-3 text-ink-700">
                        {typeof cell === "number" ? cell.toLocaleString() : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}
