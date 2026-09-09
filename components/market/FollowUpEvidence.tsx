"use client";

/* THE EVIDENCE, BEFORE AND AFTER.

   The issues the original audit raised, whether each is still standing,
   both visits' shelves drawn from their own rows, and the change
   between them.

   "Resolved" means the issue is not present at the re-audit. It does
   NOT mean the request caused that, and the panel says so: one outlet,
   no control group, and a delivery that finally arrived looks
   identical from a shelf. */

import ShelfScene from "./ShelfScene";
import Badge from "./ui/Badge";
import Delta from "./ui/Delta";
import { auditorName, monthLabel } from "@/lib/market";
import { KPI_LABEL } from "@/lib/market/issues";
import type { OutletCase } from "@/lib/market/outletCase";
import type { MonthPair } from "@/lib/market/followUpView";
import type { Band } from "./ui/health";

const OUTCOME: Record<OutletCase["issues"][number]["outcome"], { band: Band; label: string }> = {
  resolved: { band: "strong", label: "Resolved" },
  unresolved: { band: "critical", label: "Still there" },
  awaiting: { band: "average", label: "Awaiting revisit" },
};

export default function FollowUpEvidence({
  outletCase: c,
  originMonth,
  cycle,
  origin,
  cyclePair,
}: {
  outletCase: OutletCase;
  originMonth: string;
  cycle: string;
  origin: MonthPair;
  cyclePair: MonthPair | null;
}) {
  const beforeCells = origin.view.cells.filter((cell) => cell.posId === c.posId);
  const afterCells = cyclePair
    ? cyclePair.view.cells.filter((cell) => cell.posId === c.posId)
    : [];

  const beforeVisit = origin.view.auditedAt.get(c.posId);
  const afterVisit = cyclePair?.view.auditedAt.get(c.posId);
  const beforeBy = auditorName(origin.view.auditedBy.get(c.posId) ?? "");
  const afterBy = cyclePair ? auditorName(cyclePair.view.auditedBy.get(c.posId) ?? "") : "";

  return (
    <div className="flex flex-col gap-5 rounded-[12px] border border-violet-100 bg-violet-050/40 p-3.5">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-violet-ink">
          Follow-up audit · {KPI_LABEL[c.kpi]}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-ink-500">
          Raised from {monthLabel(originMonth)}, checked in {monthLabel(cycle)}.
        </p>
      </div>

      {/* the comparison */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="flex items-baseline gap-2">
          <span className="mono text-[19px] font-semibold text-ink-400">
            {c.before === null ? "—" : `${c.before}%`}
          </span>
          <span aria-hidden className="text-ink-400">→</span>
          <span className="mono text-[24px] font-bold text-ink-900">
            {c.after === null ? "—" : `${c.after}%`}
          </span>
        </p>
        {c.delta !== null && <Delta value={c.delta} unit="pt" floor={0} />}
        <p className="mono text-[11.5px] text-ink-500">
          {c.revisited
            ? `${c.resolved} resolved · ${c.unresolved} still there`
            : "not yet revisited"}
        </p>
      </div>

      {/* what was wrong, and what happened to it */}
      <section>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Original issues
        </h4>
        {c.issues.length === 0 ? (
          <p className="mt-1.5 text-[12px] text-ink-500">
            Nothing was raised against this outlet for this KPI.
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-col">
            {c.issues.map((row) => (
              <li
                key={row.issue.id}
                className="flex items-center gap-2 border-b border-line py-1.5 text-[12px] last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink-900">
                    {row.skuName ?? row.issue.type}
                  </span>
                  {row.skuName && (
                    <span className="block truncate text-[11px] text-ink-400">
                      {row.issue.type}
                    </span>
                  )}
                </span>
                <Badge band={OUTCOME[row.outcome].band} label={OUTCOME[row.outcome].label} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* both shelves */}
      <div className="grid gap-3 sm:grid-cols-2">
        <figure className="min-w-0">
          <figcaption className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Before · {monthLabel(originMonth)}
            </span>
            <span className="mono text-[10.5px] text-ink-400">
              {beforeVisit?.slice(5)} · {beforeBy}
            </span>
          </figcaption>
          <ShelfScene cells={beforeCells} height={150} />
        </figure>

        <figure className="min-w-0">
          <figcaption className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              After · {monthLabel(cycle)}
            </span>
            <span className="mono text-[10.5px] text-ink-400">
              {afterVisit ? `${afterVisit.slice(5)} · ${afterBy}` : "not yet visited"}
            </span>
          </figcaption>
          {afterCells.length > 0 ? (
            <ShelfScene cells={afterCells} height={150} />
          ) : (
            <div className="flex h-[150px] items-center justify-center rounded-[10px] border border-dashed border-line-strong text-[11.5px] text-ink-400">
              Awaiting the {monthLabel(cycle)} visit
            </div>
          )}
        </figure>
      </div>

      <p className="text-[11px] leading-snug text-ink-400">
        Two audits of the same outlet, side by side. They show what changed between visits — not
        that the follow-up request caused it. One outlet, no control group: a delivery that finally
        arrived would look identical here.
      </p>
    </div>
  );
}
