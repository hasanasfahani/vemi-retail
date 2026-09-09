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

import { useMemo } from "react";
import PageShell from "@/components/market/PageShell";
import CoverageRing from "@/components/market/CoverageRing";
import InsightCard from "@/components/market/InsightCard";
import MarketMap, { type MapPoint } from "@/components/market/map/MarketMap";
import MapLegend from "@/components/market/map/legend";
import { Card, ScoreRing, StatCard, Toasts, useToasts } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import Bar from "@/components/market/ui/Bar";
import Delta from "@/components/market/ui/Delta";
import { ChartLegend, StackedBars, brandColor, orderedBrands } from "@/components/market/charts";
import { scoreBand } from "@/components/market/ui/health";
import {
  buildReport, headline, reportCsv, reportFileName,
} from "@/lib/market/report";
import { shelf } from "@/lib/market/performance";
import { formatIqd, impactAssumption } from "@/lib/market/economics";
import { contract, cityName, monthLabel } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

export default function ReportsView() {
  return <PageShell>{(view) => <Reports view={view} />}</PageShell>;
}

function Reports({ view }: { view: MarketView }) {
  const { toasts, push, dismiss } = useToasts();
  const report = useMemo(() => buildReport(view), [view]);
  const s = useMemo(() => shelf(view), [view]);
  const ordered = orderedBrands();

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
            meta: `${outlet.district}, ${cityName(outlet.cityId)}`,
          },
        ];
      }),
    [view]
  );

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
    <div className="flex flex-col gap-5">
      {/* ---------- masthead ---------- */}
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[14px] border border-line bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Monthly retail execution report
          </p>
          <h1 className="mt-1 font-display text-[24px] font-bold leading-tight tracking-tight text-ink-900">
            {contract.client} · {report.monthLabel}
          </h1>
          <p className="mt-1.5 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-500">
            {headline(report)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={exportPdf}
            className="rounded-[9px] bg-violet px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-[9px] border border-line-strong bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() =>
              push("Sharing is not wired up in this build — export the file and send it on.", "info")
            }
            className="rounded-[9px] border border-line-strong bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
          >
            Share
          </button>
        </div>
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
              <p className="text-[12.5px] leading-relaxed text-ink-700">
                The composite weighs availability at 30%, shelf share 25%, assortment 20%, price
                15% and POSM 10%. It is an average over{" "}
                {report.coverage.audited.toLocaleString()} audited outlets, so a single door
                cannot move it — and it is the figure the rest of this report explains.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {report.cities.slice(0, 3).map((city) => (
                  <li key={city.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-[74px] shrink-0 text-ink-500">{city.label}</span>
                    <Bar value={city.score} max={100} par={report.score.target} />
                    <span className="mono w-[34px] shrink-0 text-right font-semibold text-ink-900">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              deltaLabel="vs last month"
            />
          ))}
        </div>
      </Section>

      {/* ---------- 4 · risks ---------- */}
      <Section n={4} title="Biggest risks">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.risks.map((risk) => (
            <InsightCard key={risk.id} insight={risk} />
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
                <span className="mono shrink-0 text-[12px] font-semibold text-ink-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink-900">{item.headline}</p>
                  <p className="mono truncate text-[11px] text-ink-400">
                    {item.scope.outlets.toLocaleString()} outlets ·{" "}
                    {item.concentration
                      ? `${item.concentration.share}% in ${cityName(item.concentration.cityId)}`
                      : "market-wide"}{" "}
                    · {item.impact.label}
                  </p>
                </div>
                <Bar
                  value={item.money ?? 0}
                  max={report.opportunities[0]?.money ?? 1}
                  label={item.headline}
                />
                <span className="mono w-[86px] shrink-0 text-right text-[12.5px] font-semibold text-ink-900">
                  {formatIqd(item.money ?? 0)} IQD
                </span>
              </li>
            ))}
          </ul>
        </Card>
        {impactAssumption && (
          <p className="mt-2.5 max-w-[92ch] text-[11px] leading-relaxed text-ink-400">
            {impactAssumption}
          </p>
        )}
      </Section>

      {/* ---------- 6 · competitive summary ---------- */}
      <Section n={6} title="Competitive summary">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Card title="Where each brand stands" padded={false}>
            <ul className="flex flex-col">
              {report.competitive.map((brand) => (
                <li key={brand.id} className="border-b border-line px-4 py-2.5 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-900">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px]"
                        style={{ background: brandColor(brand.id) }}
                        aria-hidden
                      />
                      {brand.name}
                      {brand.isClient && <Badge band="average" label="Your brand" size="sm" />}
                    </span>
                    <span className="mono text-[12.5px] font-semibold text-ink-900">
                      {brand.share}%
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={brand.share} max={45} color={brandColor(brand.id)} label={brand.name} />
                  </div>
                  <p className="mono mt-1 text-[11px] text-ink-400">
                    availability {brand.availability}% · {brand.perOutlet} facings per outlet ·
                    price index {brand.priceIndex} · promoting in {brand.promo}%
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Shelf battle by city"
            lead="Share of measured facings."
            action={
              <ChartLegend
                items={ordered.map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id) }))}
              />
            }
          >
            <StackedBars
              data={s.byCity}
              series={ordered.map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id) }))}
              max={100}
              height={280}
            />
          </Card>
        </div>
      </Section>

      {/* ---------- 7 · geographic performance ---------- */}
      <Section n={7} title="Geographic performance">
        <Card
          footnote="Outlets are placed within their district rather than surveyed to the street."
        >
          <div className="mb-2.5">
            <MapLegend />
          </div>
          <MarketMap points={points} height={420} />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {report.cities.map((city) => (
              <li key={city.id} className="flex items-center gap-2">
                <span className="w-[74px] shrink-0 text-[12px] text-ink-500">{city.label}</span>
                <Bar value={city.score} max={100} par={report.score.target} />
                <span className="mono w-[30px] shrink-0 text-right text-[12px] font-semibold text-ink-900">
                  {city.score}
                </span>
                <span className="mono w-[62px] shrink-0 text-right text-[11px] text-ink-400">
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
                <span className="mono mt-0.5 shrink-0 text-[12px] font-semibold text-ink-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink-900">{item.headline}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">{item.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Delta
                    value={item.scope.outlets}
                    unit=" outlets"
                    goodUp={false}
                    floor={0}
                  />
                  <p className="mono mt-0.5 text-[11px] text-ink-400">{item.impact.label}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <p className="text-[11px] leading-relaxed text-ink-400">
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
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          <span className="mono text-ink-400">{String(n).padStart(2, "0")}</span>
          {title}
        </h2>
        {aside && <span className="mono text-[11.5px] text-ink-400">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
