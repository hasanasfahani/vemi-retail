import { Suspense } from "react";
import Link from "next/link";
import StatTile from "@/components/portal/charts/StatTile";
import ChartFrame from "@/components/portal/ChartFrame";
import DecisionBlock from "@/components/portal/DecisionBlock";
import DivergingBar from "@/components/portal/charts/DivergingBar";
import RankedBar from "@/components/portal/charts/RankedBar";
import CompositionBar from "@/components/portal/charts/CompositionBar";
import ReportComposer, {
  type ReportSection,
} from "@/components/portal/ReportComposer";
import ImpactBasis from "@/components/portal/ImpactBasis";
import { scope } from "@/lib/portal";
import { EMPTY_FILTERS, applyFilters } from "@/lib/portalFilters";
import { generateInsights } from "@/lib/insights";
import { buildDecisions } from "@/lib/decisions";
import { chartFor, districtShares } from "@/lib/decisionCharts";
import {
  AVG_SHELF_PRICE_IQD,
  UNITS_PER_FACING_DAY,
  IQD_PER_FACING_DAY,
  formatImpact,
} from "@/lib/economics";
import { VISIT_INTERVAL_DAYS } from "@/lib/cadence";
import {
  headline,
  clientBrand,
  competitors,
  brandName,
  latest,
} from "@/lib/portalData";
import { listActions } from "@/lib/actionsServer";
import type { ActionRecord } from "@/lib/actionsShared";

export const metadata = {
  title: "Reports",
};

/* REPORTS — the document that leaves the building.

   The Digest is the read before a meeting. This is the artefact
   forwarded to people who will never log in, and that difference sets
   every decision on the page:

   - It states its own provenance. A board paper whose numbers cannot
     be sourced is a board paper that gets argued with rather than
     acted on, so the method section is part of the document, not a
     help page — including the assumption behind every IQD figure.
   - It is composed, not fixed. The sender picks the sections for their
     audience (see ReportComposer) and the choice travels in the link.
   - It prints. Every band is a print block that will not split across
     a page break, and the composer itself disappears when it does.

   What it deliberately is NOT is a fourth place where numbers are
   computed. Every figure comes from the same `generateInsights` →
   `buildDecisions` → `chartFor` chain the Command Center renders, so a
   report and the portal it was cut from cannot drift. */
export default async function ReportsPage() {
  const view = applyFilters(EMPTY_FILTERS, latest);
  const report = generateInsights(view);
  const { decisions, reprice } = buildDecisions(report);
  const { momentum } = report;
  const top = decisions.slice(0, 3);

  const rank = competitors.findIndex((c) => c.isClient) + 1;
  const measured = decisions.filter((d) => d.confidence === "measured");
  const estimated = decisions.filter((d) => d.confidence === "estimated");

  const flagged = new Map(
    report.presence
      .filter((i) => i.rule === "r2-district-deficit")
      .map((f) => [f.entities.area ?? "", f.severity])
  );
  const districtRows = districtShares(view).map((d) => ({
    id: d.area,
    label: d.area,
    delta: d.delta,
    severity:
      flagged.get(d.area) === "critical"
        ? ("critical" as const)
        : flagged.has(d.area)
          ? ("warning" as const)
          : null,
    meta: `${d.outlets} outlets`,
  }));

  const actionsResult = await listActions();
  const actions = actionsResult.ok ? actionsResult.actions : [];
  const open = actions.filter((a) => a.status !== "Done");
  const done = actions.filter((a) => a.status === "Done");

  const sections: ReportSection[] = [
    {
      id: "verdict",
      label: "The verdict",
      hint: "One paragraph: the move, what it is worth, and where momentum sits.",
      node: (
        <Band title="The verdict" eyebrow={scope.dataAsOf}>
          {top.length ? (
            <>
              <p className="t-h3 !text-[19px] leading-snug">{top[0].headline}</p>
              <p className="mt-1.5 text-sm text-ink-500">
                <span className="mono font-semibold text-ink-900">
                  {formatImpact(top[0].impact.value)}
                </span>
                {" at stake. "}
                {decisions.length > 1
                  ? `${decisions.length - 1} further decision${
                      decisions.length > 2 ? "s" : ""
                    } follow, ranked by confirmed evidence first.`
                  : "It is the only decision flagged this cycle."}
              </p>
              {momentum?.conceding && momentum.rivalBrandId && (
                <p className="mt-2.5 text-sm text-ink-700">
                  Momentum: {clientBrand.name} lost{" "}
                  {Math.abs(momentum.clientDelta)}pt of shelf share this cycle
                  while {brandName(momentum.rivalBrandId)} gained{" "}
                  {momentum.rivalDelta}pt.
                </p>
              )}
              <ImpactBasis className="mt-3" />
            </>
          ) : (
            <p className="text-sm text-ink-500">
              No district, channel, SKU or outlet fell outside its expected
              range this cycle. We looked — that is the result.
            </p>
          )}
        </Band>
      ),
    },
    {
      id: "kpis",
      label: "Headline numbers",
      hint: "The four figures, each against the previous visit.",
      node: (
        <Band title="Headline numbers" eyebrow={`vs ${scope.previousVisit}`}>
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
              footnote={`Rank ${rank} of ${competitors.length} in category`}
            />
            <StatTile
              label="Price compliance"
              value={`${headline.priceCompliance}%`}
              footnote={`${clientBrand.name} SKUs at RRP ±5%`}
            />
            <StatTile
              label="Active out-of-stocks"
              value={`${headline.activeOos}`}
              goodDirection="down"
              footnote={`${headline.oosDays} lost shelf-days this cycle`}
            />
          </div>
        </Band>
      ),
    },
    {
      id: "decisions",
      label: "The decisions",
      hint: "Each move with the chart that proves it. The substance of the report.",
      node: (
        <div className="flex flex-col gap-4">
          {top.length ? (
            top.map((decision, i) => (
              <DecisionBlock
                key={decision.id + i}
                decision={decision}
                rank={i + 1}
                visit={view.visit}
                {...chartFor(decision, view.posCount)}
              />
            ))
          ) : (
            <Band title="The decisions">
              <p className="text-sm text-ink-400">
                No decision cleared the reporting threshold this cycle.
              </p>
            </Band>
          )}
        </div>
      ),
    },
    {
      id: "composition",
      label: "Shape of the cycle",
      hint: "Where the loss sits, split by how firmly it is known.",
      core: false,
      node: (
        <Band
          title="What kind of cycle this is"
          eyebrow="confirmed vs projected"
        >
          {measured.length > 0 && (
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="t-h3 !text-[13px]">Confirmed losses</h3>
                <span className="mono text-[12px] text-ink-400">
                  {measured
                    .reduce((s, d) => s + d.impact.value, 0)
                    .toLocaleString()}{" "}
                  facing-days
                </span>
              </div>
              <CompositionBar
                segments={measured.map((d) => ({
                  id: d.id,
                  label: d.headline,
                  value: d.impact.value,
                }))}
                unitNoun="facing-days"
              />
            </div>
          )}
          {estimated.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="t-h3 !text-[13px]">Projected gaps</h3>
                <span className="mono text-[12px] text-ink-400">
                  {estimated
                    .reduce((s, d) => s + d.impact.value, 0)
                    .toLocaleString()}{" "}
                  facing-days
                </span>
              </div>
              <CompositionBar
                segments={estimated.map((d) => ({
                  id: d.id,
                  label: d.headline,
                  value: d.impact.value,
                }))}
                unitNoun="facing-days"
              />
            </div>
          )}
          <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-ink-500">
            <span className="font-semibold text-ink-700">How to read this. </span>
            Each bar splits its own total, so the widest band is the kind of
            problem that tier mostly is. The tiers are kept apart because a
            confirmed loss and a projected one are different kinds of number.
          </p>
        </Band>
      ),
    },
    {
      id: "districts",
      label: "The city, district by district",
      hint: "Where shelf share falls short of your own citywide average.",
      core: false,
      node: (
        <ChartFrame
          title={`${clientBrand.name} shelf share by district`}
          subtitle={`Against your citywide average · ${scope.dataAsOf}`}
          howToRead="Each row is a district. The centre line is your citywide shelf share; bars to the left fall short of it and bars to the right run ahead. Colour marks how far past the reporting threshold a shortfall sits."
          soWhat={
            districtRows.filter((d) => d.severity).length
              ? `${
                  districtRows.filter((d) => d.severity).length
                } districts sit below your own citywide average — coverage is uneven before it is insufficient.`
              : "No district falls materially behind your citywide average this cycle."
          }
          /* ChartFrame's control band falls back to its all-clear
             whenever no action is passed — correct on a working page,
             wrong in a document, where there are no buttons at all and
             the fallback would print "every district is within range"
             directly under a sentence saying six are not. A report
             fills that slot with provenance instead, and keeps the
             all-clear for the cycle when it is actually true. */
          action={
            districtRows.some((d) => d.severity) ? (
              <SourceNote href="/dashboard/shelf-share" />
            ) : undefined
          }
          allClear="Every district is within range of your citywide average."
          table={{
            columns: ["District", "vs citywide", "Outlets"],
            rows: districtRows.map((d) => [
              d.label,
              `${d.delta > 0 ? "+" : ""}${d.delta}pt`,
              d.meta,
            ]),
          }}
        >
          <DivergingBar
            rows={districtRows}
            baselineLabel={`your citywide ${clientBrand.name} share`}
            unit="pt"
            collapseMiddle={{ keepWorst: 6, keepBest: 3 }}
          />
        </ChartFrame>
      ),
    },
    {
      id: "standing",
      label: "Competitive standing",
      hint: "Where you sit against every brand audited, and which way it moved.",
      core: false,
      node: (
        <ChartFrame
          title="Shelf share by brand"
          subtitle={`All brands audited · ${scope.dataAsOf}`}
          howToRead={`Each row is a brand and its length is the share of audited facings it holds. The ghost mark behind each row is where that brand stood at the ${scope.previousVisit}.`}
          soWhat={`${clientBrand.name} holds ${headline.shelfShare}% of audited facings, ranking ${rank} of ${competitors.length}.`}
          action={<SourceNote href="/dashboard/competitors" />}
          table={{
            columns: ["Brand", "Share", "Change"],
            rows: competitors.map((c) => [
              brandName(c.brandId),
              `${c.share}%`,
              `${c.shareDelta > 0 ? "+" : ""}${c.shareDelta}pt`,
            ]),
          }}
        >
          <RankedBar
            rows={competitors.map((c) => ({
              id: c.brandId,
              label: brandName(c.brandId),
              value: c.share,
              previous: Math.round((c.share - c.shareDelta) * 10) / 10,
              emphasis: c.isClient,
            }))}
            unit="%"
            previousLabel={scope.previousVisit}
            labelWidth={118}
          />
        </ChartFrame>
      ),
    },
    {
      id: "pricing",
      label: "Pricing",
      hint: "Breaching readings — counted separately, in their own currency.",
      core: false,
      node: (
        <Band
          title={reprice ? reprice.headline : "Pricing"}
          eyebrow="breaching readings, not facing-days"
        >
          <p className="text-sm text-ink-500">
            {reprice
              ? reprice.detail
              : "No outlet is clustering price breaches this cycle."}
          </p>
          {reprice && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {reprice.findings.slice(0, 5).map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-line pt-1.5 text-[13px]"
                >
                  <span className="text-ink-900">{f.headline}</span>
                  <span className="mono shrink-0 text-[12px] text-ink-400">
                    {f.scope.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Band>
      ),
    },
    {
      id: "actions",
      label: "What was done about the last one",
      hint: "Open and closed work in Priorities — the accountability page.",
      core: false,
      node: (
        <Band title="Work in progress" eyebrow="from Priorities">
          {actions.length ? (
            <>
              <p className="text-sm text-ink-500">
                {open.length} action{open.length === 1 ? "" : "s"} open,{" "}
                {done.length} closed. A report that shows only findings tells
                the reader what is wrong; this tells them whether anyone is on
                it.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {open.slice(0, 8).map((action: ActionRecord) => (
                  <li
                    key={action.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-line pt-1.5 text-[13px]"
                  >
                    <span className="text-ink-900">{action.title}</span>
                    <span className="mono shrink-0 text-[12px] text-ink-400">
                      {action.owner || "unassigned"}
                      {action.dueDate ? ` · due ${action.dueDate}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-400">
              Nothing has been added to Priorities yet.
            </p>
          )}
        </Band>
      ),
    },
    {
      id: "method",
      label: "How these numbers are produced",
      hint: "Provenance and assumptions. Include it when the reader will check.",
      node: (
        <Band title="How these numbers are produced" eyebrow="method">
          <dl className="flex flex-col gap-2.5 text-[13px]">
            <Method label="Source">
              {scope.posCount} outlets in {scope.city} audited on foot,
              photographed and geo-stamped. {scope.skuCount} SKUs across the{" "}
              {scope.category.toLowerCase()} category. This edition reports the{" "}
              {scope.dataAsOf} visit against {scope.previousVisit} — a{" "}
              {VISIT_INTERVAL_DAYS}-day cycle.
            </Method>
            <Method label="Findings">
              Every finding comes from a stated formula applied to that
              cycle&apos;s audit data. No forecasting and no machine learning:
              each one can be traced to the specific outlets and readings that
              produced it.
            </Method>
            <Method label="Confidence">
              A finding is <strong>measured</strong> when it rests on
              observations at both visits, and <strong>estimated</strong> when
              it projects from a single cycle. Measured evidence always ranks
              ahead of estimated, whatever the size of the number.
            </Method>
            <Method label="Impact">
              Shelf loss is counted in facing-days — facings lost multiplied by
              days lost.{" "}
              {IQD_PER_FACING_DAY !== null ? (
                <>
                  IQD figures convert that at{" "}
                  <strong>
                    {IQD_PER_FACING_DAY.toLocaleString()} IQD per facing-day
                  </strong>
                  , which is the measured facings-weighted average shelf price
                  of {clientBrand.name} lines in this audit (
                  {AVG_SHELF_PRICE_IQD.toLocaleString()} IQD) multiplied by an{" "}
                  <strong>assumed {UNITS_PER_FACING_DAY} units sold per facing per day</strong>
                  . That rate of sale is the one input this audit does not
                  measure — a shelf audit records what is on the shelf, not
                  what leaves it — so every currency figure in this report is
                  modelled, not observed. Substitute your own rate of sale and
                  every figure moves with it proportionally.
                </>
              ) : (
                <>
                  Impact is reported in facing-days rather than currency,
                  because no rate of sale has been supplied for this category.
                </>
              )}
            </Method>
            <Method label="Coverage">
              Erbil is live. The remaining 18 governorates are available on
              subscription and are not represented in any figure here.
            </Method>
          </dl>
        </Band>
      ),
    },
  ];

  return (
    <>
      <Suspense
        fallback={
          <div className="h-32 rounded-[18px] border border-line bg-white" />
        }
      >
        <ReportComposer sections={sections}>
          {/* cover — always in the document */}
          <section className="report-block rounded-[18px] border border-line bg-white p-6 sm:p-8">
            <div className="t-eyebrow">
              Retail audit report · {scope.category}
            </div>
            <h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-ink-900">
              {clientBrand.name} in {scope.city}
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Field visit {scope.dataAsOf}, compared with {scope.previousVisit}.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 text-[13px] sm:grid-cols-4">
              <Fact label="Outlets audited" value={`${scope.posCount}`} />
              <Fact label="SKUs tracked" value={`${scope.skuCount}`} />
              <Fact label="Decisions" value={`${decisions.length}`} />
              <Fact
                label="At stake"
                value={formatImpact(
                  decisions.reduce((s, d) => s + d.impact.value, 0)
                )}
              />
            </dl>
          </section>
        </ReportComposer>
      </Suspense>
    </>
  );
}

/* ---------- document furniture ---------- */

function Band({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="t-h3">{title}</h2>
        {eyebrow && <span className="text-[12px] text-ink-400">{eyebrow}</span>}
      </div>
      {children}
    </section>
  );
}

/* Where a chart's detail lives, for the recipient who does have a
   login. Deliberately a link and not a button: nothing in a document
   should imply an action the reader can take from a printed page. */
function SourceNote({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-[12.5px] font-medium text-ink-400 hover:text-violet-ink print:text-ink-400"
    >
      Full detail in the portal →
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </dt>
      <dd className="mono mt-0.5 text-[15px] font-semibold text-ink-900">
        {value}
      </dd>
    </div>
  );
}

function Method({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line pt-2.5 first:border-0 first:pt-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </dt>
      <dd className="mt-1 max-w-[72ch] leading-relaxed text-ink-700">
        {children}
      </dd>
    </div>
  );
}
