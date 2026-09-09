"use client";

/* PAGE 3 · Competition — the same month, read as a contest.

   One deliberate departure from the rest of the portal: this page
   ignores the global BRAND filter. A brand comparison with five of six
   brands filtered out is not a comparison, and silently returning a
   one-row scoreboard would look like a bug. The header still shows the
   filter; this page says out loud that it is not applying it. */

import { useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import { useTargets } from "@/components/market/useTargets";
import PosDrawer from "@/components/market/PosDrawer";
import MarketMap, { type MapPoint } from "@/components/market/map/MarketMap";
import { Card, StatCard, Tabs } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import Bar from "@/components/market/ui/Bar";
import Delta from "@/components/market/ui/Delta";
import {
  BubbleScatter, ChartLegend, StackedBars, brandColor, orderedBrands,
} from "@/components/market/charts";
import {
  ACTIVITY_LABEL, activity, byRetailer, districtLeads, pricePosition, scoreboard,
  type Activity, type BrandRow,
} from "@/lib/market/competition";
import { shelf } from "@/lib/market/performance";
import { applyFilters, type MarketView } from "@/lib/market/filters";
import { brandName, cityName, clientBrand, contract } from "@/lib/market";
import type { MonthData } from "@/lib/market/types";

export default function CompetitionView() {
  return (
    <PageShell>
      {(view, _search, data) => <Competition view={view} data={data} />}
    </PageShell>
  );
}

function Competition({ view, data }: { view: MarketView; data: MonthData }) {
  /* Re-derived without the brand and SKU filters — see the note above.
     Outlet-level filters (city, channel, retailer) still apply, because
     narrowing WHERE you are comparing is exactly what this page is for. */
  const all = useMemo(
    () => applyFilters({ ...view.filters, brands: [], skus: [] }, data),
    [view.filters, data]
  );
  const narrowed = view.filters.brands.length > 0 || view.filters.skus.length > 0;

  const [battle, setBattle] = useState("city");
  const [openPos, setOpenPos] = useState<string | null>(null);

  const rows = useMemo(() => scoreboard(all), [all]);
  const bubbles = useMemo(() => pricePosition(all), [all]);
  const leads = useMemo(() => districtLeads(all), [all]);
  const events = useMemo(() => activity(all), [all]);
  const s = useMemo(() => shelf(all), [all]);
  const retailers = useMemo(() => byRetailer(all), [all]);

  const client = rows.find((r) => r.isClient)!;
  const leader = rows[0];
  const ordered = orderedBrands();
  const series = ordered.map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id) }));

  const battleData = battle === "city" ? s.byCity : battle === "channel" ? s.byChannel : retailers;

  const points = useMemo<MapPoint[]>(
    () =>
      leads.map((lead) => ({
        id: lead.id,
        name: `${lead.district}, ${cityName(lead.cityId)}`,
        lat: lead.lat,
        lng: lead.lng,
        value: lead.leaderShare,
        band: lead.leaderId === clientBrand.id ? "strong" : "critical",
        color: brandColor(lead.leaderId),
        /* Area, not radius, carries the facing count — doubling a
           radius would quadruple the ink for twice the evidence. */
        radius: Math.max(7, Math.min(26, Math.sqrt(lead.facings) / 3.2)),
        meta: `${brandName(lead.leaderId)} leads at ${lead.leaderShare}% · ${clientBrand.name} ${lead.clientShare}% · ${lead.outlets} audited outlets`,
      })),
    [leads]
  );

  const clientLeads = leads.filter((l) => l.leaderId === clientBrand.id).length;

  return (
    <div className="flex flex-col gap-4">
      {narrowed && (
        <p className="rounded-[12px] border border-violet-100 bg-violet-050 px-3.5 py-2.5 text-[12.5px] leading-snug text-violet-ink">
          The brand and SKU filters do not apply on this page — a comparison needs every brand in
          it. City, channel and retailer filters are applied as normal.
        </p>
      )}

      {/* ---------- A · scoreboard ---------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Competitive scoreboard
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            {all.posCount.toLocaleString()} audited outlets · {all.totalFacings.toLocaleString()} facings
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.slice(0, 3).map((row) => (
            <ScoreCard key={row.id} row={row} leader={leader} />
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Shelf gap to leader"
          value={leader.isClient ? 0 : Math.round((leader.share - client.share) * 10) / 10}
          unit="pt"
          band={leader.isClient ? "strong" : "attention"}
          footnote={leader.isClient ? `${clientBrand.name} leads the fixture` : `${leader.name} at ${leader.share}% vs ${client.share}%`}
        />
        <StatCard
          label="Districts led"
          value={clientLeads}
          band={clientLeads > leads.length / 2 ? "strong" : "attention"}
          footnote={`of ${leads.length} districts with at least three audited outlets`}
        />
        <StatCard
          label="Promotion presence"
          value={client.promo}
          unit="%"
          band={client.promo >= leader.promo ? "strong" : "attention"}
          footnote={`${leader.name} runs one in ${leader.promo}% of audited outlets`}
        />
        <StatCard
          label="Eye-level conversion"
          value={client.visibility}
          unit="%"
          footnote={`Share of ${clientBrand.name} facings at eye level · ${leader.name} ${leader.visibility}%`}
        />
      </div>

      {/* ---------- B · shelf battle ---------- */}
      <Card
        title="Shelf battle"
        lead="Share of measured facings, 100% stacked."
        action={
          <div className="flex items-center gap-3">
            <ChartLegend items={ordered.map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id) }))} />
          </div>
        }
        footnote="Retailer groups exclude independents — the absence of a group is not a group, and including it would make it the biggest one on the chart."
      >
        <div className="mb-3">
          <Tabs
            tabs={[
              { id: "city", label: "By city" },
              { id: "channel", label: "By channel" },
              { id: "retailer", label: "By retailer group", count: retailers.length },
            ]}
            active={battle}
            onChange={setBattle}
          />
        </div>
        <StackedBars data={battleData} series={series} max={100} height={battle === "retailer" ? 260 : 250} />
      </Card>

      {/* ---------- C · price position ---------- */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card
          title="Price against shelf"
          lead="Average observed price, share of shelf, and availability as the bubble."
          footnote={`Price in ${contract.currency}. A brand sitting low and left is buying nothing with its discount; high and right is a premium position that is holding.`}
        >
          <BubbleScatter
            points={bubbles}
            xLabel={`Average price (${contract.currency})`}
            yLabel="Share of shelf"
          />
        </Card>

        <Card title="Price position" lead="Indexed on the category average across every reading.">
          <ul className="flex flex-col">
            {rows.map((row) => (
              <li key={row.id} className="border-b border-line py-2.5 last:border-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium text-ink-700">{row.name}</span>
                  <span className="mono text-[12.5px] font-semibold text-ink-900">
                    {row.averagePrice.toLocaleString()} {contract.currency}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Bar
                    value={row.priceIndex}
                    max={130}
                    par={100}
                    color={brandColor(row.id)}
                    label={`${row.name} price index ${row.priceIndex}`}
                  />
                  <span className="mono w-[46px] shrink-0 text-right text-[11.5px] text-ink-400">
                    {row.priceIndex}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---------- D · who leads where ---------- */}
      <Card
        title="Who leads where"
        lead={`${leads.length} districts with at least three audited outlets, coloured by the brand holding the most shelf.`}
        action={
          <ChartLegend
            items={ordered
              .filter((b) => leads.some((l) => l.leaderId === b.id))
              .map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id) }))}
          />
        }
        footnote="Bubble area is the facings measured in that district, so a big bubble is a big fixture rather than a big claim. Districts with fewer than three audited outlets are left off: one shop's shelf is a thin basis for saying who is winning an area."
      >
        <MarketMap points={points} unit="%" height={440} cluster={false} />
      </Card>

      {/* ---------- E · competitor activity ---------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Competitor activity
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            Across the six-month window
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {events.slice(0, 6).map((event) => (
            <ActivityCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <PosDrawer posId={openPos} view={all} onClose={() => setOpenPos(null)} />
    </div>
  );
}

/* One brand's card. Every measure is computed the same way for every
   brand — the client gets no favourable denominator. */
function ScoreCard({ row, leader }: { row: BrandRow; leader: BrandRow }) {
  const targets = useTargets();
  const measures = [
    { label: "Availability", value: row.availability, unit: "%", max: 100, par: targets.availability },
    { label: "Share of shelf", value: row.share, unit: "%", max: 60, par: targets.shelfShare },
    { label: "Facings per outlet", value: row.perOutlet, unit: "", max: 90 },
    { label: "Eye-level share", value: row.visibility, unit: "%", max: 100 },
    { label: "Promotion presence", value: row.promo, unit: "%", max: 50 },
    { label: "Secondary displays", value: row.display, unit: "%", max: 30 },
  ];

  return (
    <article
      className={`flex min-w-0 flex-col rounded-[14px] border bg-white p-4 shadow-[var(--shadow-card)] ${
        row.isClient ? "border-violet-100" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: brandColor(row.id) }}
              aria-hidden
            />
            <h3 className="font-display text-[15px] font-bold tracking-tight text-ink-900">
              {row.name}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-ink-400">{row.owner}</p>
        </div>
        {row.isClient ? (
          <Badge band="average" label="Your brand" size="sm" />
        ) : row.id === leader.id ? (
          <Badge band="critical" label="Category leader" size="sm" />
        ) : null}
      </div>

      <dl className="mt-3 flex flex-col gap-2">
        {measures.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <dt className="w-[104px] shrink-0 text-[11.5px] text-ink-500">{m.label}</dt>
            <Bar value={m.value} max={m.max} par={m.par} color={brandColor(row.id)} label={`${row.name} ${m.label}`} />
            <dd className="mono w-[48px] shrink-0 text-right text-[12px] font-semibold text-ink-900">
              {m.value}
              {m.unit}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mono mt-3 border-t border-line pt-2.5 text-[11px] text-ink-400">
        {row.outlets.toLocaleString()} outlets stocking · {row.facings.toLocaleString()} facings ·
        price index {row.priceIndex}
      </p>
    </article>
  );
}

function ActivityCard({ event }: { event: Activity }) {
  return (
    <article className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          <span
            className="h-2 w-2 rounded-[2px]"
            style={{ background: brandColor(event.brandId) }}
            aria-hidden
          />
          {ACTIVITY_LABEL[event.kind]}
        </span>
        <Delta value={event.value} unit={event.unit} floor={0} goodUp={false} />
      </div>

      <h3 className="mt-2 font-display text-[13.5px] font-bold leading-snug tracking-tight text-ink-900">
        {event.headline}
      </h3>
      <p className="mt-1 text-[12px] leading-snug text-ink-500">{event.detail}</p>

      <p className="mt-2.5 text-[11px] leading-snug text-ink-400">
        {event.material
          ? "Larger than the panel's detection floor for this slice."
          : "Below the detection floor for this slice — context, not yet a finding."}
      </p>
    </article>
  );
}
