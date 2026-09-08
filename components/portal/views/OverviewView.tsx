"use client";

/* OVERVIEW — the entry point, deliberately thin.

   This page was the Command Center: a verdict, a parked-findings strip,
   four KPIs, two composition bars, a district diverging chart, three
   decision blocks with their own charts, three pricing cards, a photo
   strip and a national map. Every one of those earned its place on the
   day it shipped, and together they made an entry point nobody could
   read in thirty seconds — which was the one job it had.

   What survives is what a reader actually orients on: how am I doing,
   and where. Four figures and one map. The single verdict line stays
   because without it the page can answer "how am I doing" but not
   "what do I do", and that sentence costs one paragraph rather than a
   section.

   The depth did not move behind a disclosure here — it moved to the
   operator pages, which is where someone who wants it is already
   going. Shelf, Out-of-Stock, Price Intelligence and Competitor Watch
   all run the same engine, scoped to whatever the filter says. */

import { useMemo } from "react";
import PageHeader from "@/components/portal/PageHeader";
import StatTile from "@/components/portal/charts/StatTile";
import NationalMap from "@/components/portal/NationalMap";
import { scope, coverage, categories } from "@/lib/portal";
import { EMPTY_FILTERS, applyFilters } from "@/lib/portalFilters";
import { generateInsights } from "@/lib/insights";
import { portfolioRisk, portfolioVerdict } from "@/lib/portfolio";
import { useActions } from "@/components/portal/useActions";
import { useVerification } from "@/components/portal/useVerification";
import { formatImpact } from "@/lib/economics";
import ImpactBasis from "@/components/portal/ImpactBasis";
import {
  clientBrand,
  brandName,
  coreTrend,
  skuOf,
  latest,
} from "@/lib/portalData";

/* NO FILTER BAR HERE, on purpose.

   Overview reports the company: every brand it owns, every category
   and city it is subscribed to. Filtering that to one district or one
   brand does not produce a smaller company view — it produces an
   operator view with a company page's furniture, which is the same
   altitude confusion the verdict had. Anyone who wants to narrow is
   asking an operator question and the operator pages take filters. */
export default function OverviewView() {
  /* Follow-through, from the same derivation Priorities renders — the
     two surfaces cannot disagree about whether work landed. */
  const { actions } = useActions();
  const { summary: follow } = useVerification(actions);
  const view = useMemo(
    () => applyFilters(EMPTY_FILTERS, latest),
    []
  );

  /* Company-level exposure, and the momentum line beneath it. The
     insight engine still runs — it is what every operator page reads —
     but the verdict here is computed at portfolio altitude rather than
     lifted from a brand-scoped decision. */
  const momentum = useMemo(() => generateInsights(view).momentum, [view]);
  const risk = useMemo(() => portfolioRisk(view), [view]);
  const verdict = useMemo(
    () => (risk ? portfolioVerdict(risk) : { headline: "", detail: "" }),
    [risk]
  );

  const client = view.byBrand.find((b) => b.isClient);

  /* Company altitude: the client's house, and the house behind it. */
  const house = coreTrend.houses.find((h) => h.isClient);
  const rivalHouse = coreTrend.houses.find((h) => !h.isClient);
  const houseBrands = house?.brands.length ?? 0;
  const leadPt =
    Math.round(((house?.share ?? 0) - (rivalHouse?.share ?? 0)) * 10) / 10;
  const activeCategories = categories.filter((c) => c.active).length;

  /* Availability across every brand the company owns, not just the
     lead one — the same widening the share figure gets. */
  const portfolioAvailability = useMemo(() => {
    const ids = new Set(house?.brands ?? []);
    const own = view.cells.filter((c) => {
      const b = skuOf(c.skuId)?.brandId;
      return b && ids.has(b) && c.state !== "not-listed";
    });
    if (!own.length) return 0;
    return (
      Math.round(
        (own.filter((c) => c.state === "in-stock").length / own.length) * 1000
      ) / 10
    );
  }, [view, house]);
  return (
    <div>
      <PageHeader
        title="Overview"
        lead={`${clientBrand.owner} across every brand, category and city audited`}
        posCount={view.posCount}
      />

      {/* THE VERDICT, AT COMPANY ALTITUDE.

          This used to render the top decision from the rollup, which
          is brand-scoped and outlet-shaped: "Get stock back on shelf
          at 4 outlets". True, useful, and the wrong altitude for a
          page about a company that owns three brands — it named
          Pepsi's worst doors while saying nothing about the house.

          The company question is which AXIS the exposure sits on,
          because brand-concentrated risk is a supply conversation and
          outlet-concentrated risk is a coverage one, and they have
          different owners. See lib/portfolio.ts. */}
      <section className="mt-4 mb-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        {risk ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{
                  background:
                    risk.concentratedBy === "neither"
                      ? "var(--color-warn)"
                      : "var(--color-critical)",
                }}
              />
              <span className="t-eyebrow">
                Your first move · {scope.dataAsOf}
              </span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              {verdict.headline}
            </p>
            <p className="mt-1 max-w-[74ch] text-sm text-ink-500">
              {verdict.detail}
            </p>
            <p className="mt-2 text-sm text-ink-500">
              <span className="mono font-semibold text-ink-900">
                {formatImpact(risk.totalAtRisk)}
              </span>
              {" at risk across the "}
              {risk.brands.length} {clientBrand.owner} brand
              {risk.brands.length === 1 ? "" : "s"}.
            </p>
            <ImpactBasis className="mt-2.5" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-eyebrow">This window · {scope.dataAsOf}</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              Every line you own was on the shelf where it is listed.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              No gap against any {clientBrand.owner} brand in this selection.
              We looked — that is the result.
            </p>
          </>
        )}

        {/* FOLLOW-THROUGH.

            The verdict says what to do. This says whether the last
            round of doing it reached the shelf — and it is the half a
            company-level reader has never been able to see, because
            the queue could only ever report that someone ticked a box.

            Rendered only once something has actually been re-audited.
            A 0% with nothing checked would read as total failure when
            the truth is that we have not been back yet. */}
        {follow.confirmationRate !== null && (
          <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[13px] text-ink-700">
            <span
              className="mt-[6px] inline-block h-[7px] w-[7px] shrink-0 rounded-full"
              style={{
                background:
                  follow.confirmationRate >= 60
                    ? "var(--color-good)"
                    : "var(--color-warn)",
              }}
              aria-hidden
            />
            <span>
              Of {follow.checkable} closed action
              {follow.checkable === 1 ? "" : "s"} we could re-check,{" "}
              <strong className="text-ink-900">
                {follow.held} {follow.held === 1 ? "was" : "were"} confirmed on
                shelf
              </strong>
              {follow.slipped > 0 &&
                ` and ${follow.slipped} ${
                  follow.slipped === 1 ? "was" : "were"
                } still open`}
              .
              {follow.recovered > 0 && (
                <> {formatImpact(follow.recovered)} back in place.</>
              )}
              {follow.awaiting > 0 && (
                <span className="text-ink-400">
                  {" "}
                  {follow.awaiting} more closed but not yet re-audited.
                </span>
              )}
            </span>
          </p>
        )}

        {momentum?.conceding && momentum.rivalBrandId && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-700">
            <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="var(--color-critical)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 3.5 6 8l1.7-2.2L9.5 8" />
            </svg>
            <span>
              {clientBrand.name} lost {Math.abs(momentum.clientDelta)}pt of
              share against the previous window while{" "}
              <strong className="text-ink-900">
                {brandName(momentum.rivalBrandId)}
              </strong>{" "}
              gained {momentum.rivalDelta}pt.{" "}
              {/* The two windows sampled different outlets. A share move
                  of this size can come from the market or from the
                  panel, and the page is not able to tell them apart —
                  so it says which stores each figure rests on rather
                  than presenting the delta as settled. */}
              <span className="text-ink-400">
                Across {scope.previousPosCount} outlets then and{" "}
                {scope.posCount} now — different stores, so read the
                direction rather than the decimal.
              </span>
            </span>
          </p>
        )}
      </section>

      {/* THE FOUR FIGURES, AT COMPANY ALTITUDE.

          This row used to report Pepsi: its availability, its share,
          its compliance, its gaps. That is a brand manager's row. A
          company-level reader owns Pepsi, 7UP and Mirinda, and the
          question they are actually asking is how their SHELF did
          against the other house — because share ceded by one of their
          own brands to another is not a loss, and a Pepsi-only row
          reports it as one. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Portfolio shelf share"
          value={`${house?.share ?? 0}%`}
          delta={house?.shareDelta}
          moved={house?.shareSignificant}
          floorPt={coreTrend.portfolioFloorPt}
          goodDirection="up"
          footnote={`${clientBrand.owner} — ${houseBrands} brands`}
        />
        <StatTile
          label={`Lead over ${rivalHouse?.owner ?? "the next house"}`}
          value={`${leadPt > 0 ? "+" : ""}${leadPt}pt`}
          goodDirection="up"
          footnote={`They hold ${rivalHouse?.share ?? 0}% across ${rivalHouse?.brands.length ?? 0} brands`}
        />
        <StatTile
          label="Portfolio on-shelf"
          value={`${portfolioAvailability}%`}
          goodDirection="up"
          footnote={`Level across ${view.posCount} outlets audited`}
        />
        <StatTile
          label="Footprint"
          value={`${coverage.activeCount} of ${coverage.totalCount}`}
          footnote={`governorates · ${activeCategories} of ${categories.length} categories`}
        />
      </div>

      {/* House against house — the one chart a company-level page
          needs, and the one that cannot be read off a brand ranking. */}
      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">Shelf by company</h2>
        <p className="mt-1 mb-4 text-sm text-ink-500">
          Every facing counted in this window, grouped by who owns the
          brand. Movement is measured on the {scope.corePanelSize} core
          outlets, against a ±{coreTrend.portfolioFloorPt}pt floor.
        </p>
        <div className="flex flex-col gap-3">
          {coreTrend.houses.map((h) => (
            <div key={h.owner} className="flex items-center gap-3">
              <span
                className={`w-[150px] shrink-0 truncate text-[13px] ${
                  h.isClient ? "font-semibold text-ink-900" : "text-ink-500"
                }`}
              >
                {h.owner}
              </span>
              <span className="relative h-[22px] min-w-0 flex-1 rounded-[5px] bg-canvas">
                <span
                  className="absolute inset-y-0 left-0 rounded-[5px]"
                  style={{
                    width: `${h.share}%`,
                    background: h.isClient
                      ? "var(--color-violet)"
                      : "var(--color-chart-context)",
                  }}
                />
              </span>
              <span className="mono w-[104px] shrink-0 text-right text-[12.5px]">
                <span className="font-semibold text-ink-900">{h.share}%</span>
                <span className="ml-1.5 text-ink-400">
                  {h.shareSignificant
                    ? `${h.shareDelta > 0 ? "+" : ""}${h.shareDelta}pt`
                    : "—"}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-snug text-ink-500">
          <span className="font-semibold text-ink-700">How to read this. </span>
          Each bar is one company&rsquo;s share of every facing audited. A dash
          instead of a movement means the change is inside the panel&rsquo;s
          detection floor — a reading, not a move.
        </p>
      </section>

      {/* the map — national, not the Erbil district heat.

          The entry point's job is footprint and orientation: where are
          we live, and what is next. District-level heat is an operator
          question and lives on Shelf and Out-of-Stock, where the
          measure selector belongs with the pages that act on it. */}
      <div className="mt-4">
        <NationalMap
          outletsAudited={view.posCount}
          availability={client?.availability ?? 0}
        />
      </div>

      <p className="mt-4 text-[12px] text-ink-400">
        Every figure here is computed from this window&apos;s audit data by a
        stated formula — no forecasting, no machine learning. Open any
        section under Operate for the detail behind it.
      </p>
    </div>
  );
}
