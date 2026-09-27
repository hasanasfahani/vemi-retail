"use client";

/* PAGE 8 · Monthly Reports — the month, in the order a board reads it.

   The report is a VIEW of the same modules the interactive pages use,
   not a second calculation, so a figure here and the same figure on
   the dashboard cannot drift apart.

   Export PDF opens the browser's own print dialogue against a print
   stylesheet, which means the printed document IS this page rather
   than a second layout free to fall out of step. Export Excel
   downloads the report's real numbers. Share is a toast, because
   there is nobody to share with. */

import { Logo } from "@/components/vemi/Logo";
import { SignalField } from "@/components/vemi/SignalField";
import { asOf, vsPrior } from "@/lib/market/asOf";
import { useMemo } from "react";
import PageShell from "@/components/market/PageShell";
import CoverageRing from "@/components/market/CoverageRing";
import InsightCard from "@/components/market/InsightCard";
import { classify } from "@/lib/market/insightModel";
import MarketMap, { type MapPoint } from "@/components/market/map/MarketMap";
import MapLegend from "@/components/market/map/legend";
import { Card, ScoreRing, StatCard, Toasts, useToasts } from "@/components/market/ui";
import Bar from "@/components/market/ui/Bar";
import Delta from "@/components/market/ui/Delta";
import { ChartLegend, StackedBars, brandColor, brandSwatch, SERIES3, threeSeriesRows } from "@/components/market/charts";
import { scoreBand } from "@/components/market/ui/health";
import {
  buildReport, headline, reportCsv, reportFileName,
} from "@/lib/market/report";
import { shelf } from "@/lib/market/performance";
import { formatIqd, impactAssumption } from "@/lib/market/economics";
import { contract, governorateName, monthLabel } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

export default function ReportsView() {
  return <PageShell>{(view) => <Reports view={view} />}</PageShell>;
}

function Reports({ view }: { view: MarketView }) {
  const { toasts, push, dismiss } = useToasts();
  const report = useMemo(() => buildReport(view), [view]);
  const s = useMemo(() => shelf(view), [view]);

  const points = useMemo<MapPoint[]>(
    () =>
      view.outlets.flatMap((outlet) => {
        const score = view.scores.find((row) => row.posId === outlet.id);
        if (!score) return [];
        return [
          {
            id: outlet.id,
            name: outlet.name,
            lat: outlet.lat,
            lng: outlet.lng,
            value: score.score,
            band: scoreBand(score.score),
            meta: `${outlet.district}, ${governorateName(outlet.governorateId)}`,
          },
        ];
      }),
    [view]
  );

  /* What the report's two charts found, from the same rows. */
  const battleRows = threeSeriesRows(s.byGovernorate);
  const battleWorst = [...battleRows].sort((x, y) => (x.portfolio - x.competitor) - (y.portfolio - y.competitor))[0];
  const battleSoWhat = battleWorst
    ? `The widest shelf gap is ${battleWorst.label}: your portfolio ${battleWorst.portfolio}% against ${SERIES3[1].name} ${battleWorst.competitor}%.`
    : "No facings were measured this cycle.";
  const govLow = [...report.governorates].sort((x, y) => x.score - y.score)[0];
  const geoSoWhat = govLow
    ? `${govLow.label} scores lowest at ${govLow.score}, against a target of ${report.score.target}.`
    : "No governorate was audited this cycle.";

  const exportCsv = () => {
    const blob = new Blob([reportCsv(report)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportFileName(report)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    push(`${reportFileName(report)}.csv downloaded — every figure in this report.`);
  };

  const exportPdf = () => {
    push("Opening the print dialogue — choose “Save as PDF”.", "info");
    /* Let the toast paint before the print dialogue blocks the thread. */
    window.setTimeout(() => window.print(), 220);
  };

  return (
    <div className="flex flex-col gap-12">
      {/* ---------- cover ----------
          The brand's report-cover style (Brand Guide, "Report cover"):
          a Violet panel, the reversed logo, a mono eyebrow, the title,
          and a block field thinning in from the corner. On paper the
          panel drops to white with the colour logo, because browsers do
          not print backgrounds and white type would vanish. */}
      <header className="relative isolate overflow-hidden rounded-xl bg-primary p-8 text-white sm:p-10 print:rounded-none print:bg-surface print:p-0 print:text-text">
        <SignalField colorway="violet" fadeFrom="right" cols={16} rows={9} className="absolute inset-y-0 right-0 -z-10 h-full w-[55%] opacity-90 print:hidden" />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <span className="print:hidden">
            <Logo height={26} tone="reversed" title="Vemi" />
          </span>
          <span className="hidden print:inline-flex">
            <Logo height={26} title="Vemi" />
          </span>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button type="button" onClick={exportPdf} className="vm-btn bg-surface text-primary-text hover:bg-primary-tint">
              Export PDF
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="vm-btn border-white/60 bg-transparent text-white hover:bg-white/10"
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={() =>
                push("Sharing is not wired up in this build — export the file and send it on.", "info")
              }
              className="vm-btn vm-btn--text text-white hover:bg-white/10"
            >
              Share
            </button>
          </div>
        </div>
        <p className="mt-16 font-mono text-xs font-medium uppercase tracking-[0.12em] text-white/80 print:mt-8 print:text-text-muted">
          Monthly market report
        </p>
        <h1 className="mt-3 max-w-[18ch] text-[44px] font-semibold leading-[52px] tracking-[-0.02em]">
          {contract.country} {contract.category.toLowerCase()} market monitor
        </h1>
        <p className="mt-3 font-mono text-sm text-white/85 print:text-text-muted">
          {contract.client} · {report.monthLabel}
        </p>
        <p className="mt-6 max-w-[64ch] text-lg text-white/90 print:text-text">{headline(report)}</p>
      </header>

      {/* ---------- 1 · coverage ---------- */}
      <Section n={1} title="Coverage">
        <Card>
          <CoverageRing
            audited={report.coverage.audited}
            contracted={report.coverage.contracted}
            pct={report.coverage.pct}
            remaining={report.coverage.remaining}
            daysRemaining={report.coverage.daysRemaining}
            perDaySoFar={Math.round((report.coverage.audited / contract.daysElapsed) * 10) / 10}
            perDayRequired={
              Math.round(
                (report.coverage.remaining / Math.max(1, report.coverage.daysRemaining)) * 10
              ) / 10
            }
            onTrack={
              report.coverage.audited / contract.daysElapsed >=
              report.coverage.remaining / Math.max(1, report.coverage.daysRemaining)
            }
          />
        </Card>
      </Section>

      {/* ---------- 2 · market score ---------- */}
      <Section n={2} title="Market score">
        <Card>
          <div className="flex flex-wrap items-center gap-6">
            <ScoreRing score={report.score.value} size={128} caption={`Target ${report.score.target}`} />
            <div className="min-w-[260px] flex-1">
              <p className="text-sm leading-relaxed text-text">
                The composite weighs availability at 30%, shelf share 25%, assortment 20%, price
                15% and POSM 10%. It is an average over{" "}
                {report.coverage.audited.toLocaleString()} audited outlets, so a single door
                cannot move it — and it is the figure the rest of this report explains.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {report.governorates.slice(0, 3).map((city) => (
                  <li key={city.id} className="flex items-center gap-2 text-sm">
                    <span className="w-[74px] shrink-0 text-text-muted">{city.label}</span>
                    <Bar value={city.score} max={100} par={report.score.target} band={scoreBand(city.score)} />
                    <span className="mono w-[34px] shrink-0 text-right font-semibold text-text">
                      {city.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Section>

      {/* ---------- 3 · KPI results ---------- */}
      <Section n={3} title="KPI results">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {report.kpis.map((kpi) => (
            <StatCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              target={kpi.target}
              band={kpi.band}
              delta={kpi.delta}
              deltaFloor={kpi.floor}
              deltaLabel={vsPrior(view.month)}
            />
          ))}
        </div>
      </Section>

      {/* ---------- 4 · risks ---------- */}
      <Section n={4} title="Biggest risks">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {report.risks.map((risk) => (
            <InsightCard key={risk.id} insight={classify(risk, view)} />
          ))}
        </div>
      </Section>

      {/* ---------- 5 · opportunities ---------- */}
      <Section
        n={5}
        title="Biggest opportunities"
        aside={`${formatIqd(report.exposed)} IQD across five findings`}
      >
        <Card padded={false}>
          <ul className="flex flex-col">
            {report.opportunities.map((item, index) => (
              <li
                key={item.id}
                className="flex min-w-0 items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"
              >
                <span className="mono shrink-0 text-xs font-semibold text-text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{item.headline}</p>
                  <p className="mono truncate text-xs text-text-muted">
                    {item.scope.outlets.toLocaleString()} outlets ·{" "}
                    {item.concentration
                      ? `${item.concentration.share}% in ${governorateName(item.concentration.governorateId)}`
                      : "market-wide"}{" "}
                    · {item.impact.label}
                  </p>
                </div>
                <Bar
                  value={item.money ?? 0}
                  max={report.opportunities[0]?.money ?? 1}
                  label={item.headline}
                />
                <span className="mono w-[86px] shrink-0 text-right text-sm font-semibold text-text">
                  {formatIqd(item.money ?? 0)} IQD
                </span>
              </li>
            ))}
          </ul>
        </Card>
        {impactAssumption && (
          <p className="mt-2.5 max-w-[92ch] text-xs leading-relaxed text-text-muted">
            {impactAssumption}
          </p>
        )}
      </Section>

      {/* ---------- 6 · competitive summary ---------- */}
      <Section n={6} title="Competitive summary">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card title="Where each brand stands" padded={false}>
            <ul className="flex flex-col">
              {report.competitive.map((brand) => (
                <li key={brand.id} className="border-b border-line px-4 py-2.5 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-text">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px]"
                        style={brandSwatch(brand.id)}
                        aria-hidden
                      />
                      {brand.name}
                      {brand.isClient && (
                        <span className="rounded-full bg-primary-tint px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-primary-text">
                          Your brand
                        </span>
                      )}
                    </span>
                    <span className="mono text-sm font-semibold text-text">
                      {brand.share}%
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={brand.share} max={45} color={brandColor(brand.id)} label={brand.name} />
                  </div>
                  <p className="mono mt-1 text-xs text-text-muted">
                    availability {brand.availability}% · {brand.perOutlet} facings per outlet ·
                    price index {brand.priceIndex} · promoting in {brand.promo}%
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Shelf battle by governorate"
            lead="Share of measured facings."
            soWhat={battleSoWhat}
            asOf={asOf(view.month)}
            base={`${view.posCount.toLocaleString()} outlets`}
            confidence="measured"
            action={
              <ChartLegend items={SERIES3.map((x) => ({ id: x.key, name: x.name, color: x.color }))} />
            }
          >
            <StackedBars
              data={threeSeriesRows(s.byGovernorate)}
              series={[...SERIES3]}
              max={100}
              height={280}
            />
          </Card>
        </div>
      </Section>

      {/* ---------- 7 · geographic performance ---------- */}
      <Section n={7} title="Geographic performance">
        <Card
          title="Execution score by outlet"
          soWhat={geoSoWhat}
          asOf={asOf(view.month)}
          base={`${view.posCount.toLocaleString()} outlets`}
          confidence="measured"
          footnote="Outlets are placed within their district rather than surveyed to the street. Green is strong, yellow average, orange needs attention, red critical."
        >
          <div className="mb-2.5">
            <MapLegend />
          </div>
          <MarketMap points={points} height={420} bandOf={scoreBand} />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {report.governorates.map((city) => (
              <li key={city.id} className="flex items-center gap-2">
                <span className="w-[74px] shrink-0 text-xs text-text-muted">{city.label}</span>
                <Bar value={city.score} max={100} par={report.score.target} band={scoreBand(city.score)} />
                <span className="mono w-[30px] shrink-0 text-right text-xs font-semibold text-text">
                  {city.score}
                </span>
                <span className="mono w-[62px] shrink-0 text-right text-xs text-text-muted">
                  {city.outlets} POS
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {/* ---------- 8 · recommended actions ---------- */}
      <Section n={8} title="Recommended actions">
        <Card padded={false}>
          <ol className="flex flex-col">
            {report.recommended.map((item, index) => (
              <li key={item.id} className="flex min-w-0 gap-3 border-b border-line px-4 py-3 last:border-0">
                <span className="mono mt-0.5 shrink-0 text-xs font-semibold text-text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{item.headline}</p>
                  <p className="mt-0.5 text-xs leading-snug text-text-muted">{item.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Delta
                    value={item.scope.outlets}
                    unit=" outlets"
                    goodUp={false}
                    floor={0}
                  />
                  <p className="mono mt-0.5 text-xs text-text-muted">{item.impact.label}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <p className="text-xs leading-relaxed text-text-muted">
        Prepared from the {monthLabel(report.month)} audit of{" "}
        {report.coverage.audited.toLocaleString()} outlets against a{" "}
        {report.coverage.contracted.toLocaleString()}-outlet contract. Movement figures are stated
        against a bootstrapped detection floor; anything below the floor for its slice is reported
        as flat rather than given a direction.
      </p>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Section({
  n, title, aside, children,
}: {
  n: number;
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="vm-h2 flex items-baseline gap-3 text-text">
          <span className="font-mono text-base font-medium text-text-muted">{String(n).padStart(2, "0")}</span>
          {title}
        </h2>
        {aside && <span className="font-mono text-xs text-text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
