/* What a filtered view says when it selects nothing.

   It names the cause — an empty result under a rotating panel usually
   means the filter is narrower than the month's coverage, not that the
   shelf is empty — and offers the way out. */

import type { ReactNode } from "react";

export default function EmptyState({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </svg>
      <p className="mt-3 font-display text-[14.5px] font-bold text-ink-900">{title}</p>
      {lead && <p className="mt-1 max-w-[46ch] text-[12.5px] leading-snug text-ink-500">{lead}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
