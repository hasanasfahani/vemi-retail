import Link from "next/link";
import PageHeader from "@/components/portal/PageHeader";
import PrintButton from "@/components/portal/PrintButton";
import InsightCard from "@/components/portal/InsightCard";
import StatTile from "@/components/portal/charts/StatTile";
import { scope } from "@/lib/portal";
import { EMPTY_FILTERS, applyFilters } from "@/lib/portalFilters";
import { generateInsights } from "@/lib/insights";
import { headline, clientBrand, brandName, latest } from "@/lib/portalData";
import { listActions } from "@/lib/actionsServer";
import type { ActionRecord } from "@/lib/actionsShared";

export const metadata = {
  title: "Digest",
};

/* Phase 10 — the executive digest. Same content model as Command
   Center, condensed to what a reader needs in the 30 seconds before
   a meeting, plus the one thing Command Center doesn't show: whether
   anyone followed through on what the last cycle flagged.

   Triggered by the visit cycle, not a clock — this page always
   reflects currentSnapshot vs previousSnapshot, so a new digest
   exists the moment a new visit is published, with nothing to
   schedule. No email yet: the URL itself is the shareable artifact,
   and the print button turns it into a PDF for whoever needs one
   in their inbox. */
export default async function DigestPage() {
  const view = applyFilters(EMPTY_FILTERS, latest);
  const { presence, pricing, momentum } = generateInsights(view);
  const topPresence = presence[0];

  const actionsResult = await listActions();
  const actions = actionsResult.ok ? actionsResult.actions : [];
  const summary = summarizeActions(actions);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Digest"
          lead={`${scope.dataAsOf} vs previous visit (${scope.previousVisit})`}
        />
        <PrintButton />
      </div>

      {/* verdict */}
      <section className="mb-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        {topPresence ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{
                  background:
                    topPresence.severity === "critical"
                      ? "var(--color-critical)"
                      : "var(--color-warn)",
                }}
              />
              <span className="t-eyebrow">Biggest issue this cycle</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              {topPresence.headline}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-eyebrow">This cycle</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              Nothing crossed a threshold this cycle.
            </p>
          </>
        )}

        {momentum?.conceding && momentum.rivalBrandId && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-700">
            <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="var(--color-critical)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 3.5 6 8l1.7-2.2L9.5 8" />
            </svg>
            Momentum: {clientBrand.name} lost {Math.abs(momentum.clientDelta)}pt of
            share this cycle while{" "}
            <strong className="text-ink-900">{brandName(momentum.rivalBrandId)}</strong>{" "}
            gained {momentum.rivalDelta}pt.
          </p>
        )}
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="On-shelf availability"
          value={`${headline.availability}%`}
          delta={headline.availabilityDelta}
          goodDirection="up"
        />
        <StatTile
          label="Shelf share"
          value={`${headline.shelfShare}%`}
          delta={headline.shelfShareDelta}
          goodDirection="up"
        />
        <StatTile
          label="Price compliance"
          value={`${headline.priceCompliance}%`}
        />
        <StatTile
          label="Active out-of-stocks"
          value={`${headline.activeOos}`}
          goodDirection="down"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* needs attention, condensed */}
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">Needs attention</h2>
          <p className="mt-1 mb-1 text-sm text-ink-500">
            Top findings this cycle — measured losses first, then by
            concentration.
          </p>
          {presence.length ? (
            <ul>
              {presence.slice(0, 3).map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} rank={i + 1} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-400">
              No presence issues cleared the reporting threshold.
            </p>
          )}

          <h2 className="mt-5 t-h3">Pricing watch</h2>
          {pricing.length ? (
            <ul>
              {pricing.slice(0, 2).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-ink-400">
              No outlet is clustering price breaches this cycle.
            </p>
          )}
        </section>

        {/* follow-through */}
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-h3">Follow-through</h2>
            <Link
              href="/dashboard/priorities"
              className="text-[12px] font-semibold text-violet-ink hover:underline"
            >
              Open Priorities →
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            What was turned into a tracked action, and whether it moved.
          </p>

          {!actionsResult.ok ? (
            <p className="mt-4 rounded-[10px] bg-canvas p-3 text-sm text-ink-500">
              Couldn&apos;t reach the Priorities queue for this digest. The
              rest of the page is unaffected — check{" "}
              <Link href="/dashboard/priorities" className="font-semibold text-violet-ink hover:underline">
                Priorities
              </Link>{" "}
              directly.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <CountTile label="Open" value={summary.counts.Open} dot="var(--color-ink-400)" />
                <CountTile label="In Progress" value={summary.counts["In Progress"]} dot="var(--color-warn)" />
                <CountTile label="Done" value={summary.counts.Done} dot="var(--color-good)" />
              </div>

              <div className="mt-4 border-t border-line pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="t-eyebrow" style={{ color: summary.overdue.length ? "var(--color-critical)" : undefined }}>
                    {summary.overdue.length
                      ? `${summary.overdue.length} overdue`
                      : "Nothing overdue"}
                  </span>
                </div>
                {summary.overdue.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2">
                    {summary.overdue.slice(0, 6).map((a) => (
                      <li key={a.id} className="text-[13px] leading-snug">
                        <span className="font-semibold text-ink-900">{a.title}</span>
                        <span className="text-ink-400">
                          {" "}
                          — {a.owner || "unassigned"}, due {a.dueDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {actions.length === 0 && (
                <p className="mt-4 text-sm text-ink-400">
                  Nothing has been turned into an action yet this cycle.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <p className="mt-4 text-[12px] text-ink-400 print:hidden">
        Every figure above is generated from a stated formula over this
        cycle&apos;s audit data — no forecasting, no machine learning.
      </p>
    </>
  );
}

function CountTile({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="rounded-[10px] bg-canvas p-3">
      <div className="flex items-center gap-1.5">
        <span className="dot" style={{ background: dot }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
      </div>
      <div className="mt-1 mono text-[20px] font-bold text-ink-900">{value}</div>
    </div>
  );
}

function summarizeActions(actions: ActionRecord[]) {
  const counts = { Open: 0, "In Progress": 0, Done: 0 } as Record<
    ActionRecord["status"],
    number
  >;
  for (const a of actions) counts[a.status] += 1;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = actions
    .filter((a) => a.status !== "Done" && a.dueDate && a.dueDate < today)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));

  return { counts, overdue };
}
