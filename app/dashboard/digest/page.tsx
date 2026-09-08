import Link from "next/link";
import PageHeader from "@/components/portal/PageHeader";
import PrintButton from "@/components/portal/PrintButton";
import StatTile from "@/components/portal/charts/StatTile";
import ChartFrame from "@/components/portal/ChartFrame";
import DivergingBar from "@/components/portal/charts/DivergingBar";
import { districtWatchTarget, kpiWatchTarget } from "@/lib/watchTargets";
import DecisionBlock from "@/components/portal/DecisionBlock";
import { scope } from "@/lib/portal";
import { EMPTY_FILTERS, applyFilters } from "@/lib/portalFilters";
import { generateInsights } from "@/lib/insights";
import { buildDecisions } from "@/lib/decisions";
import { chartFor, districtShares } from "@/lib/decisionCharts";
import { formatImpact } from "@/lib/economics";
import ImpactBasis from "@/components/portal/ImpactBasis";
import { headline, clientBrand, brandName, latest } from "@/lib/portalData";
import { listActions } from "@/lib/actionsServer";
import type { ActionRecord } from "@/lib/actionsShared";

export const metadata = {
  title: "Digest",
};

/* The executive digest — Command Center's content, condensed to what a
   reader needs in the 30 seconds before a meeting, plus the one thing
   Command Center doesn't show: whether anyone acted on what the last
   cycle flagged.

   Phase 13 brings it onto the same decisions architecture. It used to
   render a ranked list of findings, which meant the page a CEO forwards
   to their board was the one surface still arguing in text — the exact
   thing this phase set out to fix. Two decisions rather than three,
   because this is the shorter read, and the charts come from the same
   `chartFor` the Command Center uses so the two pages can never
   disagree about which chart proves which decision.

   Triggered by the visit cycle, not a clock: the page always reflects
   currentSnapshot vs previousSnapshot, so a new digest exists the
   moment a new visit is published, with nothing to schedule. */
export default async function DigestPage() {
  const view = applyFilters(EMPTY_FILTERS, latest);
  const report = generateInsights(view);
  const { decisions, reprice } = buildDecisions(report);
  const { momentum } = report;
  const top = decisions.slice(0, 2);

  const concentration = report.presence.find(
    (i) => i.rule === "r12-geographic-concentration"
  );
  const clustered = new Set(
    concentration?.evidence.table.rows.map((r) => String(r[0])) ?? []
  );
  const flaggedSeverity = new Map(
    report.presence
      .filter((i) => i.rule === "r2-district-deficit")
      .map((f) => [f.entities.area ?? "", f.severity])
  );
  const districtRows = districtShares(view).map((d) => ({
    id: d.area,
    label: d.area,
    delta: d.delta,
    severity:
      flaggedSeverity.get(d.area) === "critical"
        ? ("critical" as const)
        : flaggedSeverity.has(d.area)
          ? ("warning" as const)
          : null,
    meta: clustered.has(d.area)
      ? `${d.outlets} outlets · in the cluster`
      : `${d.outlets} outlets`,
  }));

  /* Watch pins as plain data, keyed by row id — this page is a Server
     Component, so a render callback could not cross to the chart. */
  const districtWatchTargets = Object.fromEntries(
    districtRows.map((d) => [
      d.id,
      districtWatchTarget({
        area: d.label,
        value: Math.round((headline.shelfShare + d.delta) * 10) / 10,
        cityAverage: headline.shelfShare,
        visit: view.visit,
      }),
    ])
  );

  const actionsResult = await listActions();
  const actions = actionsResult.ok ? actionsResult.actions : [];
  const summary = summarizeActions(actions);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Digest"
          lead={`${scope.dataAsOf} vs previous window (${scope.previousVisit})`}
        />
        <PrintButton />
      </div>

      {/* verdict */}
      <section className="mb-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        {top.length ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{
                  background:
                    top[0].severity === "critical"
                      ? "var(--color-critical)"
                      : "var(--color-warn)",
                }}
              />
              <span className="t-eyebrow">Your first move in this window</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              {top[0].headline}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              <span className="mono font-semibold text-ink-900">
                {formatImpact(top[0].impact.value)}
              </span>
              {" at stake — "}
              {decisions.length > 1
                ? `${decisions.length - 1} more decision${
                    decisions.length > 2 ? "s" : ""
                  } in this window.`
                : "the only decision flagged in this window."}
            </p>
            <ImpactBasis className="mt-2.5" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-eyebrow">This window</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              Nothing crossed a threshold in this window.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              No district, channel, SKU or outlet is currently outside its
              expected range. We looked — that is the result.
            </p>
          </>
        )}

        {momentum?.conceding && momentum.rivalBrandId && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-700">
            <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="var(--color-critical)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 3.5 6 8l1.7-2.2L9.5 8" />
            </svg>
            Momentum: {clientBrand.name} lost {Math.abs(momentum.clientDelta)}pt of
            share in this window while{" "}
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
          watch={kpiWatchTarget({
            metric: "availability",
            value: headline.availability,
            visit: view.visit,
          })}
        />
        <StatTile
          label="Shelf share"
          value={`${headline.shelfShare}%`}
          delta={headline.shelfShareDelta}
          goodDirection="up"
          watch={kpiWatchTarget({
            metric: "shelf-share",
            value: headline.shelfShare,
            visit: view.visit,
          })}
        />
        <StatTile
          label="Price compliance"
          value={`${headline.priceCompliance}%`}
          watch={kpiWatchTarget({
            metric: "compliance",
            value: headline.priceCompliance,
            visit: view.visit,
            suggestedTarget: { value: 100, why: "Every line within RRP ±5%." },
          })}
        />
        <StatTile
          label="Active out-of-stocks"
          value={`${headline.activeOos}`}
          goodDirection="down"
          watch={kpiWatchTarget({
            metric: "gaps",
            value: headline.activeOos,
            visit: view.visit,
            suggestedTarget: { value: 0, why: "No gaps — the shelf as it should be." },
          })}
        />
      </div>

      {/* market shape — the structural finding, same slot as Command
          Center so a reader moving between the two isn't relearning
          the page */}
      {concentration && (
        <section className="mt-4">
          <ChartFrame
            title={concentration.headline}
            subtitle={`${clientBrand.name} shelf share by district · ${scope.dataAsOf}`}
            howToRead="Each row is a district. The centre line is your citywide shelf share; bars to the left fall short of it, and colour marks how far past the reporting threshold each one sits."
            soWhat={concentration.detail}
            allClear="No district below threshold in this window"
            table={{
              columns: concentration.evidence.table.columns,
              rows: concentration.evidence.table.rows,
            }}
          >
            <DivergingBar
              rows={districtRows}
              baselineLabel={`your citywide ${clientBrand.name} share`}
              unit="pt"
              collapseMiddle={{ keepWorst: 6, keepBest: 3 }}
              watchTargets={districtWatchTargets}
            />
          </ChartFrame>
        </section>
      )}

      {/* the decisions — two, because this is the shorter read */}
      <div className="mt-4 flex flex-col gap-4">
        {top.map((decision, i) => (
          <DecisionBlock
            key={decision.id + i}
            decision={decision}
            rank={i + 1}
            visit={view.visit}
            {...chartFor(decision, view.posCount)}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        {/* pricing — its own currency, kept to a line in the digest */}
        <section className="min-w-0 rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">{reprice ? reprice.headline : "Pricing watch"}</h2>
          {reprice ? (
            <>
              <p className="mt-1 text-sm text-ink-500">{reprice.detail}</p>
              <p className="mono mt-2 text-[13px] font-semibold text-ink-900">
                {reprice.impact.label}
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                {reprice.findings.slice(0, 4).map((f) => (
                  <li key={f.id} className="text-[13px] leading-snug">
                    <span className="font-semibold text-ink-900">
                      {f.scope.label}
                    </span>
                    <span className="text-ink-400"> — {f.impact.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/pricing"
                className="mt-3 inline-block text-[12px] font-semibold text-violet-ink hover:underline"
              >
                Open Price Intelligence →
              </Link>
            </>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-400">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              No outlet is clustering price breaches in this window.
            </p>
          )}
        </section>

        {/* follow-through */}
        <section className="min-w-0 rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-h3">Follow-through</h2>
            <Link
              href="/dashboard/priorities"
              className="text-[12px] font-semibold text-violet-ink hover:underline print:hidden"
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
                  <span
                    className="t-eyebrow"
                    style={{
                      color: summary.overdue.length ? "var(--color-critical)" : undefined,
                    }}
                  >
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
                  Nothing has been turned into an action yet in this window.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <p className="mt-4 text-[12px] text-ink-400 print:hidden">
        Every decision above is rolled up from findings generated by a stated
        formula over in this window&apos;s audit data — no forecasting, no machine
        learning.
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
      <div className="mono mt-1 text-[20px] font-bold text-ink-900">{value}</div>
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
