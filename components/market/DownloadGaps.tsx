"use client";

/* The gap report button.

   Downloads exactly what the page is showing — same filters, same
   counts — because a file that quietly differs from the screen wins
   the argument in somebody's inbox a week later. */

import { Toasts, useToasts } from "./ui";
import { gapFileName, gapReportCsv } from "@/lib/market/gapReport";
import { KPI_LABEL, type Issue, type IssueKpi } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

export default function DownloadGaps({
  kpi,
  issues,
  view,
  full,
  label,
}: {
  kpi: IssueKpi;
  issues: Issue[];
  view: MarketView;
  full: MarketView;
  label?: string;
}) {
  const { toasts, push, dismiss } = useToasts();

  const download = () => {
    const csv = gapReportCsv(issues, kpi, view, full);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gapFileName(kpi, view.month)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    push(
      `${new Set(issues.map((i) => i.posId)).size} affected POS · ${issues.length} issues downloaded, filtered as shown.`
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={download}
        disabled={issues.length === 0}
        className="inline-flex items-center gap-1.5 rounded-[9px] border border-line-strong bg-white px-3 py-2 text-[12.5px] font-semibold text-ink-700 transition-colors hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 12.5h10" />
        </svg>
        {label ?? `Download ${KPI_LABEL[kpi]} gaps`}
      </button>
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
