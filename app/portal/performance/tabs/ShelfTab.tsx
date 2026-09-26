"use client";

import SectionHead from "@/components/market/SectionHead";
import { asOf } from "@/lib/market/asOf";
import { SegmentedControl } from "@/components/vemi/SegmentedControl";
import { useMemo, useState } from "react";

/* SHELF & VISIBILITY — how much of the fixture the brand holds, and
   at what height.

   Share and position are different arguments: holding par overall
   while losing eye level is a real, specific problem that an aggregate
   share figure hides completely. */

import { Card, StatCard } from "@/components/market/ui";
import WatchEye from "@/components/market/WatchEye";
import KpiGapBar from "@/components/market/KpiGapBar";
import DownloadGaps from "@/components/market/DownloadGaps";
import RequestFollowUp from "@/components/market/RequestFollowUp";
import ShelfCard from "@/components/market/ShelfCard";
import {
  ChartLegend, RankedBars, ShareDonut, StackedBars, brandColor, orderedBrands, brandSeries, brandOutline, threeSeriesRows, SERIES3, keyCompetitor,
} from "@/components/market/charts";
import { shelf } from "@/lib/market/performance";
import { clientBrand } from "@/lib/market";
import { useTargets } from "@/components/market/useTargets";
import { issuesFor, scopeOf } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

export default function ShelfTab({ view }: { view: MarketView }) {
  const s = shelf(view);

  /* The gaps this tab is about, under whatever filter is active —
     the same records the export writes and a follow-up request will
     carry, so the header, the file and the request cannot disagree. */
  const issues = useMemo(() => issuesFor(view, "shelfShare"), [view]);
  const scope = useMemo(() => scopeOf(issues), [issues]);
  /* How the market is actually spread on this measure — the thing
     the headline average is worst at telling you. */
  const spread = useMemo(
    () => view.scores.map((s) => s.shelfShare).filter((v): v is number => v !== null),
    [view]
  );
  const targets = useTargets();
  const par = targets.shelfShare;
  const ordered = orderedBrands();
  /* Plan D2: three series by default, the portfolio split on request. */
  const [split, setSplit] = useState(false);
  const stack = brandSeries(split);
  const legend = split
    ? ordered.map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id), outline: brandOutline(b.id) }))
    : SERIES3.map((x) => ({ id: x.key, name: x.name, color: x.color }));
  const splitControl = (
    <SegmentedControl
      ariaLabel="Brand detail"
      size="sm"
      value={split ? "split" : "grouped"}
      onChange={(v) => setSplit(v === "split")}
      options={[
        { value: "grouped", label: "Portfolio" },
        { value: "split", label: "Split portfolio" },
      ]}
    />
  );
  const slices = split
    ? s.byBrand.map((b) => ({ id: b.id, name: b.name, value: b.facings }))
    : (() => {
        const sum = (f: (id: string) => boolean) =>
          s.byBrand.filter((b) => f(b.id)).reduce((t, b) => t + b.facings, 0);
        const inPortfolio = new Set(ordered.filter((b) => b.owner === clientBrand.owner).map((b) => b.id));
        return [
          { id: "portfolio", name: SERIES3[0].name, value: sum((id) => inPortfolio.has(id)) },
          { id: "competitor", name: keyCompetitor.name, value: sum((id) => id === keyCompetitor.id) },
          { id: "others", name: "Others", value: sum((id) => !inPortfolio.has(id) && id !== keyCompetitor.id) },
        ];
      })();

  const eye = s.positions.find((p) => p.id === "eye");

  /* ---------- what each chart found ---------- */
  const basis = { asOf: asOf(view.month), base: `${view.posCount.toLocaleString()} outlets` };
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const govRows = threeSeriesRows(s.byGovernorate);
  const govWorst = [...govRows].sort((x, y) => (x.portfolio - x.competitor) - (y.portfolio - y.competitor))[0];
  const govSoWhat = govWorst
    ? govWorst.portfolio < govWorst.competitor
      ? `The portfolio trails ${keyCompetitor.name} most in ${govWorst.label}: ${govWorst.portfolio}% of the fixture against ${govWorst.competitor}%.`
      : `The portfolio holds more shelf than ${keyCompetitor.name} in every governorate; the closest is ${govWorst.label} (${govWorst.portfolio}% against ${govWorst.competitor}%).`
    : "No facings were measured in this view.";
  const chRows = threeSeriesRows(s.byChannel);
  const chWorst = [...chRows].sort((x, y) => (x.portfolio - x.competitor) - (y.portfolio - y.competitor))[0];
  const chSoWhat = chWorst
    ? `${chWorst.label} is where the portfolio is weakest against ${keyCompetitor.name}: ${chWorst.portfolio}% against ${chWorst.competitor}%.`
    : "No facings were measured in this view.";
  const splitTotal = slices.reduce((t, x) => t + x.value, 0) || 1;
  const splitSoWhat = `${clientBrand.name} holds ${s.clientShare}% of every audited facing, ${
    s.clientShare >= par ? `${r1(s.clientShare - par)} pts above` : `${r1(par - s.clientShare)} pts under`
  } the ${par}% par; ${slices[0]?.name ?? "the portfolio"} as a whole holds ${r1(((slices[0]?.value ?? 0) / splitTotal) * 100)}%.`;
  const lowPos = [...s.positions].sort((x, y) => x.clientShare - y.clientShare)[0];
  const posSoWhat = eye
    ? `${clientBrand.name} holds ${eye.clientShare}% at eye level${
        lowPos && lowPos.id !== "eye" ? ` and is thinnest on the ${lowPos.label.toLowerCase()} (${lowPos.clientShare}%)` : ""
      }.`
    : "No shelf positions were recorded in this view.";

  const cardFor = (row: { posId: string; share: number }, caption: string) => {
    const outlet = view.outlets.find((p) => p.id === row.posId);
    if (!outlet) return null;
    return (
      <ShelfCard
        key={row.posId}
        outlet={outlet}
        cells={view.cells.filter((c) => c.posId === row.posId)}
        score={view.scores.find((sc) => sc.posId === row.posId)?.score}
        auditedAt={view.auditedAt.get(row.posId)}
        caption={`${caption} · ${row.share}% of this shelf`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <KpiGapBar
        label="Share of shelf"
        value={s.clientShare}
        target={par}
        spread={spread}
        affectedPos={scope.affectedPos}
        issues={scope.issues}
        issueNoun="outlets below par"
        actions={
          <>
            <DownloadGaps kpi="shelfShare" issues={issues} view={view} full={view} />
            <RequestFollowUp kpi="shelfShare" issues={issues} view={view} />
          </>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {s.byBrand.slice(0, 4).map((brand) => (
          <StatCard
            key={brand.id}
            label={brand.name}
            value={brand.share}
            unit="%"
            band={brand.id === clientBrand.id ? (brand.share >= par ? "strong" : "attention") : undefined}
            detail={
              brand.id === clientBrand.id
                ? {
                    lead: `${brand.share}% of the measured fixture against a ${par}% contracted par.`,
                    rows: [
                      { label: "At or above par", value: `${par}% and over` },
                      { label: "Below par", value: `under ${par}%`, here: brand.share < par },
                      { label: "Holding now", value: `${brand.share}%`, here: true },
                      { label: "Facings per stocking outlet", value: `${brand.perOutlet}` },
                      { label: "Outlets stocking", value: brand.outlets.toLocaleString() },
                    ],
                    footnote:
                      "Only the client brand is banded here. A rival's share is a fact about the market, not a shortfall against a contract nobody signed with them.",
                  }
                : null
            }
            explain={
              brand.id === clientBrand.id
                ? `Share of every facing measured in the audited outlets, against the ${par}% par the contract sets.`
                : "Share of every facing measured in the audited outlets. No band: this brand has no par to be judged against."
            }
            watch={
              <WatchEye
                kpi="shelfShare"
                scope={{ brandId: brand.id }}
                value={brand.share}
                target={par}
                month={view.month}
                size="sm"
              />
            }
            footnote={`${brand.perOutlet} facings per stocking outlet · ${brand.outlets.toLocaleString()} outlets`}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Shelf battle by governorate"
          lead="Share of measured facings, 100% stacked."
          soWhat={govSoWhat}
          {...basis}
          confidence="measured"
          footnote={`Each bar is one governorate's measured fixture. Violet is your portfolio, Ink is ${keyCompetitor.name}, Slate is every other brand. Split portfolio breaks the violet into its brands.`}
          table={{ columns: ["Governorate", "Your portfolio", keyCompetitor.name, "Others"], numeric: [false, true, true, true], rows: govRows.map((r) => [r.label, `${r.portfolio}%`, `${r.competitor}%`, `${r.others}%`]) }}
          action={
            <div className="flex flex-col items-end gap-3">
              {splitControl}
              <ChartLegend items={legend} />
            </div>
          }
        >
          <StackedBars data={threeSeriesRows(s.byGovernorate)} series={stack} max={100} height={250} />
        </Card>

        <Card title="Shelf split this month" lead="Every audited facing, by brand." soWhat={splitSoWhat} {...basis} confidence="measured">
          <ShareDonut
            slices={slices}
            palette={split ? "brand" : "category"}
            centerValue={`${s.clientShare}%`}
            centerLabel={clientBrand.name}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Shelf battle by channel" lead="The same fixture question, by retail format." soWhat={chSoWhat} {...basis} confidence="measured" footnote="Each bar is one retail format's measured fixture, in the same three series as above.">
          <StackedBars data={threeSeriesRows(s.byChannel)} series={stack} max={100} height={230} />
        </Card>

        <Card
          title="Position on the shelf"
          lead={`${clientBrand.name}'s share of facings at each height.`}
          soWhat={posSoWhat}
          {...basis}
          confidence="measured"
          footnote="Eye level is the space worth negotiating for. Holding par overall while losing it is a different problem from losing share outright."
        >
          <RankedBars
            rows={s.positions.map((p) => ({
              id: p.id,
              label: p.label,
              value: p.clientShare,
              color: brandColor(clientBrand.id),
              meta: `${p.total.toLocaleString()} facings measured at this height`,
              trailing:
                eye && p.id !== "eye" ? (
                  <span className="shrink-0 font-mono text-xs text-ink-500">
                    {p.clientShare > eye.clientShare ? "+" : ""}
                    {Math.round((p.clientShare - eye.clientShare) * 10) / 10}pt vs eye
                  </span>
                ) : undefined,
            }))}
            max={100}
            par={par}
            unit="%"
          />
        </Card>
      </div>

      <section>
        <SectionHead title="Best executing shelves" lead="Drawn from each outlet's own audit rows, so the picture and the numbers cannot disagree." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {s.best.map((row) => cardFor(row, "Best in class"))}
        </div>
      </section>

      <section>
        <SectionHead title="Weakest executing shelves" lead="The shelves to visit first, with what is missing marked on them." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {s.worst.map((row) => cardFor(row, "Needs attention"))}
        </div>
      </section>
    </div>
  );
}
