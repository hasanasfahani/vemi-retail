"use client";

/* Placeholder body for a route that has its shell but not yet its
   content. Client-side because PageShell hands the filtered view down
   as a render prop, and a function cannot cross the server boundary —
   so every page in this portal is a thin server file (which owns the
   metadata) wrapping a client view. */

import PageShell from "./PageShell";

export default function StubView({
  title,
  lead,
}: {
  title: string;
  lead: string;
}) {
  return (
    <PageShell>
      {(view) => (
        <div className="rounded-[14px] border border-line bg-white p-8">
          <h2 className="font-display text-[19px] font-bold tracking-tight text-ink-900">
            {title}
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-500">{lead}</p>
          <p className="mono mt-4 text-[12px] text-ink-400">
            {view.posCount.toLocaleString()} of{" "}
            {view.inScopeCount.toLocaleString()} outlets audited in scope ·{" "}
            {view.coveragePct}% covered · execution {view.kpi.score}/100 ·
            availability {view.kpi.availability}%
          </p>
        </div>
      )}
    </PageShell>
  );
}
