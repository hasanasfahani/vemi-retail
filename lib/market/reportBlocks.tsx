/* ============================================================
   THE BLOCK CATALOGUE.

   What a reader can put on a custom report, and it is deliberately NOT
   a list of chart types. This portal's charts are not generic:
   availability by governorate carries a stated denominator (listings,
   never outlets), a calibrated target line and a footnote saying what
   it excludes. Offering "a bar chart" and a measure to plot in it
   would strip all of that and leave a portal that can draw anything
   and vouch for nothing.

   So each entry is a NAMED FINDING that already exists on a page,
   carrying its own builder, its own chart and its own footnote. The
   report is then exactly as defensible as the page each block came
   from.

   Every entry is a pure function of a view. That was already true of
   every builder in lib/market, which is why this is a registry rather
   than a rewrite.
   ============================================================ */

import type { ReactNode } from "react";
import {
  DotPlot, GapBars, Heatmap, RankedBars, ShareDonut, SplitBars, StackedBars,
  brandColor, MEASURE,
} from "@/components/market/charts";
import { Bar } from "@/components/market/ui";
import { rateBand, scoreBand, BAND_COLOR } from "@/components/market/ui/health";
import { availability, assortment, pricing, posm, shelf } from "./performance";
import { scoreboard, districtLeads } from "./competition";
import { portfolioHealth } from "./brandHealth";
import { governorateHealth } from "./governorateHealth";
import { KPI_NAME } from "./kpiLabels";
import { clientBrand, governorates, governorateName, brands, posmTypes } from "./index";
import type { Targets } from "./settings";
import type { Filters, MarketView } from "./filters";

export type BlockGroup =
  | "headline"
  | "availability"
  | "shelf"
  | "pricing"
  | "assortment"
  | "posm"
  | "competition"
  | "health";

export const BLOCK_GROUP_LABEL: Record<BlockGroup, string> = {
  headline: "Headline",
  availability: "Availability",
  shelf: "Shelf",
  pricing: "Pricing",
  assortment: "Assortment",
  posm: "POSM",
  competition: "Competition",
  health: "Health",
};

export const BLOCK_GROUPS = Object.keys(BLOCK_GROUP_LABEL) as BlockGroup[];

/* ONE VIEW, ALREADY CORRECT FOR THIS BLOCK.

   An earlier shape handed every block both a filtered view and a
   brand-unfiltered one and trusted it to pick. That is a rule a block
   can silently break: declare `ignoresBrandFilter`, then read the
   filtered view anyway, and nothing fails until somebody scopes a
   report to one brand and finds Pepsi holding 100% of a shelf
   containing only Pepsi.

   So the choice is made OUTSIDE the block, by `scopeForBlock`, and the
   context carries the single view that choice produced. A block cannot
   get it wrong because it is never offered the alternative. */
export type BlockContext = {
  view: MarketView;
  targets: Targets;
};

/* The SHAPE a block draws, for the picker's thumbnail. Not the chart
   component's name — a reader choosing between twenty entries is asking
   "what will this look like on my page", and a five-second answer to
   that is worth more than a rendered preview that costs a data build
   per row of the list. */
export type BlockShape =
  | "tiles" | "bars" | "dots" | "gap" | "split" | "stacked" | "donut" | "grid" | "table";

export type BlockDef = {
  id: string;
  shape: BlockShape;
  label: string;
  group: BlockGroup;
  /* One line in the picker, saying what the block answers. */
  description: string;
  /* The grid packs by this. The reader never places blocks, so a block
     that needs the width says so once, here, and cannot be dragged into
     a shape that breaks it. */
  width: "half" | "full";
  lead?: string;
  footnote?: ReactNode;
  /* A COMPARISON IS NOT A COMPARISON WITH FIVE OF SIX BRANDS REMOVED.
     Blocks that set this are rendered over `wide`, and the scope editor
     hides the brand and SKU controls for them — otherwise scoping a
     shelf battle to Pepsi would draw Pepsi holding 100% of a shelf
     containing only Pepsi, which is true and useless. */
  ignoresBrandFilter?: boolean;
  render: (ctx: BlockContext) => ReactNode;
};

const pt = (n: number) => Math.round(n * 10) / 10;

/* ---------- headline ---------- */

function KpiRow({ view, targets }: BlockContext) {
  const cells: { label: string; value: number; target: number; unit: string }[] = [
    { label: KPI_NAME.availability, value: view.kpi.availability, target: targets.availability, unit: "%" },
    { label: KPI_NAME.shelfShare, value: view.client?.share ?? 0, target: targets.shelfShare, unit: "%" },
    { label: KPI_NAME.assortment, value: view.kpi.assortment, target: targets.assortment, unit: "%" },
    { label: KPI_NAME.price, value: view.kpi.price, target: targets.price, unit: "%" },
    { label: KPI_NAME.posm, value: view.kpi.posm, target: targets.posm, unit: "%" },
    { label: KPI_NAME.score, value: view.kpi.score, target: targets.score, unit: "" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cells.map((cell) => {
        const band = cell.label === KPI_NAME.score ? scoreBand(cell.value) : rateBand(cell.value, cell.target);
        return (
          <div key={cell.label} className="min-w-0">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              {cell.label}
            </span>
            <span className="mt-1 block font-display text-[22px] font-bold leading-none tracking-tight text-ink-900">
              {cell.value}
              {cell.unit && <span className="ml-0.5 text-[13px] font-semibold text-ink-500">{cell.unit}</span>}
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-canvas">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, (cell.value / Math.max(cell.target, cell.value)) * 100))}%`,
                  background: BAND_COLOR[band],
                }}
              />
            </span>
            <span className="mono mt-1 block text-[11px] text-ink-400">
              target {cell.target}
              {cell.unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- the catalogue ---------- */

export const BLOCKS: BlockDef[] = [
  {
    id: "headline-kpis",
    shape: "tiles",
    label: "The six KPIs",
    group: "headline",
    description: "Every headline measure against its target, in one row.",
    width: "full",
    footnote: "Each bar runs to the larger of the figure and its target, so a met target fills the track rather than leaving it looking short.",
    render: (ctx) => <KpiRow {...ctx} />,
  },

  /* ---------- availability ---------- */
  {
    id: "availability-by-governorate",
    shape: "bars",
    label: "Availability by governorate",
    group: "availability",
    description: "Client listings found on shelf, per governorate.",
    width: "half",
    lead: "Client listings on shelf, per governorate.",
    footnote: "Measured over listings, never outlets: a shop that never carried a line has not run out of it.",
    render: ({ view, targets }) => {
      const a = availability(view);
      return (
        <RankedBars
          rows={a.byGovernorate.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.value,
            meta: `${row.listings.toLocaleString()} listings across ${row.outlets} outlets`,
          }))}
          max={100}
          par={targets.availability}
          unit="%"
        />
      );
    },
  },
  {
    id: "availability-by-sku",
    shape: "dots",
    label: "Availability by SKU",
    group: "availability",
    description: "Worst line first — where the shelf is empty.",
    width: "half",
    lead: "Worst first — the line to fix, not the range to admire.",
    render: ({ view, targets }) => {
      const a = availability(view);
      return (
        <DotPlot
          rows={a.bySku.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.value,
            color: brandColor(clientBrand.id),
          }))}
          min={0}
          max={100}
          par={targets.availability}
          unit="%"
        />
      );
    },
  },
  {
    id: "availability-by-channel",
    shape: "stacked",
    label: "Availability by channel",
    group: "availability",
    description: "The client against every other brand in the same format.",
    width: "half",
    ignoresBrandFilter: true,
    lead: "The client against every other brand in the same format.",
    footnote: "A rate is only good or bad relative to what everyone else in that format achieves.",
    render: ({ view }) => {
      const a = availability(view);
      return (
        <StackedBars
          data={a.byChannel.map((row) => ({ label: row.label, client: row.client, category: row.category }))}
          series={[
            { key: "client", name: clientBrand.name, color: MEASURE },
            { key: "category", name: "Rest of category", color: "var(--color-comp-1)" },
          ]}
          mode="grouped"
          max={100}
        />
      );
    },
  },
  {
    id: "availability-reasons",
    shape: "donut",
    label: "Why the shelf was empty",
    group: "availability",
    description: "The reason the auditor recorded against each gap.",
    width: "half",
    lead: "Reason recorded by the auditor who found the gap.",
    render: ({ view }) => {
      const a = availability(view);
      return (
        <ShareDonut
          palette="category"
          slices={a.byReason.map((row) => ({ id: row.id, name: row.name, value: row.value }))}
          centerValue={a.gaps.toLocaleString()}
          centerLabel="gaps"
        />
      );
    },
  },
  {
    id: "availability-sku-governorate",
    shape: "grid",
    label: "Gaps by SKU and governorate",
    group: "availability",
    description: "Out-of-stock counts, line by line and place by place.",
    width: "full",
    footnote: "Cells count listed lines found empty. A dash means no audited outlet there listed the SKU.",
    render: ({ view }) => {
      const a = availability(view);
      return (
        <Heatmap
          tone="bad"
          rows={a.bySku.map((row) => ({ id: row.id, label: row.label }))}
          columns={governorates.map((c) => ({ id: c.id, label: c.name }))}
          value={(skuId, governorateId) => a.gapAt(skuId, governorateId)}
          cellLabel={(skuId, governorateId, v) =>
            `${a.bySku.find((s) => s.id === skuId)?.label} · ${governorateName(governorateId)}: ${v} out of stock`
          }
        />
      );
    },
  },

  /* ---------- shelf ---------- */
  {
    id: "shelf-battle-governorate",
    shape: "stacked",
    label: "Shelf battle by governorate",
    group: "shelf",
    description: "Share of measured facings, every brand, 100% stacked.",
    width: "full",
    ignoresBrandFilter: true,
    lead: "Share of measured facings, 100% stacked.",
    render: ({ view }) => {
      const s = shelf(view);
      const ordered = brands;
      return (
        <StackedBars
          /* ShareRow already carries one key per brand — the same shape
             the Competition page feeds this chart. */
          data={s.byGovernorate.map((row) => ({
            label: String(row.label),
            ...Object.fromEntries(ordered.map((b) => [b.id, Number(row[b.id] ?? 0)])),
          }))}
          series={ordered.map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id) }))}
          max={100}
          height={250}
        />
      );
    },
  },
  {
    id: "shelf-by-brand",
    shape: "bars",
    label: "Shelf share by brand",
    group: "shelf",
    description: "Where the fixture actually goes, brand by brand.",
    width: "half",
    ignoresBrandFilter: true,
    render: ({ view, targets }) => {
      const s = shelf(view);
      return (
        <RankedBars
          rows={s.byBrand.map((row) => ({
            id: row.id,
            label: row.name,
            value: row.share,
            color: brandColor(row.id),
            meta: `${row.perOutlet} facings per stocking outlet`,
          }))}
          max={60}
          par={targets.shelfShare}
          unit="%"
        />
      );
    },
  },

  /* ---------- pricing ---------- */
  {
    id: "price-distance-by-sku",
    shape: "gap",
    label: "Distance from list by SKU",
    group: "pricing",
    description: "How far each line sits from its own recommended price.",
    width: "half",
    ignoresBrandFilter: true,
    footnote: "Every SKU has a different list price, so absolute dinars cannot be compared down a column. The distance from list can.",
    render: ({ view }) => {
      const p = pricing(view);
      return (
        <GapBars
          par={0}
          unit="%"
          parLabel="each line's own list price"
          rows={p.bySku.map((sku) => ({
            id: sku.id,
            label: sku.name,
            value: sku.rrp === 0 ? 0 : pt(((sku.average - sku.rrp) / sku.rrp) * 100),
          }))}
        />
      );
    },
  },
  {
    id: "price-compliance-by-governorate",
    shape: "dots",
    label: "Price compliance by governorate",
    group: "pricing",
    description: "Share of client readings within 5% of list.",
    width: "half",
    render: ({ view, targets }) => {
      const p = pricing(view);
      return (
        <DotPlot
          rows={p.byGovernorate.map((row) => ({ id: row.id, label: row.label, value: row.compliance }))}
          min={0}
          max={100}
          par={targets.price}
          unit="%"
        />
      );
    },
  },
  {
    id: "price-distribution",
    shape: "bars",
    label: "How far from list",
    group: "pricing",
    description: "Client readings, banded by distance from RRP.",
    width: "half",
    footnote: "A tight peak on list is discipline; a long tail on either side is a conversation with the retailer.",
    render: ({ view }) => {
      const p = pricing(view);
      return (
        <RankedBars
          rows={p.distribution.map((band) => ({
            id: band.id,
            label: band.label,
            value: band.value,
            color: band.id === "at-list" ? "var(--color-good)" : "var(--color-serious)",
          }))}
        />
      );
    },
  },

  /* ---------- assortment ---------- */
  {
    id: "assortment-penetration",
    shape: "dots",
    label: "SKU penetration",
    group: "assortment",
    description: "Audited outlets listing each client line.",
    width: "half",
    render: ({ view }) => {
      const a = assortment(view);
      return (
        <DotPlot
          rows={a.penetration.map((row) => ({ id: row.id, label: row.label, value: row.value }))}
          min={0}
          max={100}
          unit="%"
        />
      );
    },
  },
  {
    id: "assortment-by-channel",
    shape: "bars",
    label: "Range compliance by channel",
    group: "assortment",
    description: "Against the range each format is expected to carry.",
    width: "half",
    footnote: "Measured against what THIS format is expected to carry, not the widest format in the market.",
    render: ({ view, targets }) => {
      const a = assortment(view);
      return (
        <RankedBars
          rows={a.byChannel.map((row) => ({ id: row.id, label: row.label, value: row.value }))}
          max={100}
          par={targets.assortment}
          unit="%"
        />
      );
    },
  },
  {
    id: "assortment-heatmap",
    shape: "grid",
    label: "Range by SKU and governorate",
    group: "assortment",
    description: "Share of outlets in each place carrying each line.",
    width: "full",
    footnote: "Penetration, not stock: this says whether the door carries the line at all.",
    render: ({ view }) => {
      const a = assortment(view);
      return (
        <Heatmap
          rows={a.penetration.map((row) => ({ id: row.id, label: row.label }))}
          columns={governorates.map((c) => ({ id: c.id, label: c.name }))}
          value={(skuId, governorateId) => a.penetrationAt(skuId, governorateId)}
          cellLabel={(skuId, governorateId, v) =>
            `${a.penetration.find((s) => s.id === skuId)?.label} · ${governorateName(governorateId)}: ${v}%`
          }
        />
      );
    },
  },

  /* ---------- POSM ---------- */
  {
    id: "posm-by-material",
    shape: "bars",
    label: "Presence by material",
    group: "posm",
    description: "Where each type was checked, how often it was there.",
    width: "half",
    footnote: `Coolers, stands and displays are only checked in the formats that can take them — ${posmTypes
      .filter((t) => t.channels)
      .map((t) => t.name.toLowerCase())
      .join(", ")} are not expected in every door.`,
    render: ({ view, targets }) => {
      const p = posm(view);
      return (
        <RankedBars
          rows={p.byType.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.value,
            meta: `${row.present.toLocaleString()} present of ${row.checked.toLocaleString()} checked`,
          }))}
          max={100}
          par={targets.posm}
          unit="%"
        />
      );
    },
  },
  {
    id: "posm-weakest-governorates",
    shape: "split",
    label: "Where POSM is missing",
    group: "posm",
    description: "How much material is missing, not just the rate.",
    width: "half",
    footnote: "Bar length is how many items were checked there. A place with a poor rate over eighty checks has fewer items missing than a middling one over four hundred.",
    render: ({ view }) => {
      const p = posm(view);
      return (
        <SplitBars
          presentLabel="Material present"
          missingLabel="Missing"
          rows={p.byGovernorate.map((row) => ({
            id: row.id,
            label: row.label,
            total: row.checked,
            present: row.checked - row.missing,
          }))}
        />
      );
    },
  },
  {
    id: "posm-by-channel",
    shape: "gap",
    label: "POSM by channel",
    group: "posm",
    description: "Distance from the POSM target, format by format.",
    width: "half",
    render: ({ view, targets }) => {
      const p = posm(view);
      return (
        <GapBars
          par={targets.posm}
          rows={p.byChannel.map((row) => ({ id: row.id, label: row.label, value: row.value }))}
        />
      );
    },
  },

  /* ---------- competition ---------- */
  {
    id: "competition-scoreboard",
    shape: "table",
    label: "Competitive scoreboard",
    group: "competition",
    description: "Every brand on the six measures the audit records.",
    width: "full",
    ignoresBrandFilter: true,
    render: ({ view, targets }) => {
      const rows = scoreboard(view);
      const measures = [
        { label: KPI_NAME.availability, get: (r: (typeof rows)[number]) => r.availability, max: 100, par: targets.availability },
        { label: KPI_NAME.shelfShare, get: (r: (typeof rows)[number]) => r.share, max: 60, par: targets.shelfShare },
        { label: "Eye-level share", get: (r: (typeof rows)[number]) => r.visibility, max: 100 },
        { label: "Promotion presence", get: (r: (typeof rows)[number]) => r.promo, max: 50 },
      ];
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-1.5 pr-3 text-left font-semibold text-ink-400">Brand</th>
                {measures.map((m) => (
                  <th key={m.label} scope="col" className="py-1.5 pr-3 text-left font-semibold text-ink-400">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="py-1.5 pr-3 font-semibold text-ink-900">{row.name}</td>
                  {measures.map((m) => (
                    <td key={m.label} className="py-1.5 pr-3">
                      <span className="flex items-center gap-2">
                        <Bar value={m.get(row)} max={m.max} par={m.par} color={brandColor(row.id)} label={`${row.name} ${m.label}`} />
                        <span className="mono w-[44px] shrink-0 text-right text-ink-700">{m.get(row)}%</span>
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
  {
    id: "competition-price-position",
    shape: "gap",
    label: "Price position",
    group: "competition",
    description: "Each brand against the category average, indexed.",
    width: "half",
    ignoresBrandFilter: true,
    footnote: "100 is category par. Left is a value position, right is a premium one.",
    render: ({ view }) => (
      <GapBars
        par={100}
        unit=""
        rows={scoreboard(view).map((row) => ({ id: row.id, label: row.name, value: row.priceIndex }))}
      />
    ),
  },
  {
    id: "competition-leads",
    shape: "bars",
    label: "Who leads where",
    group: "competition",
    description: "Districts by the brand holding the most shelf.",
    width: "half",
    ignoresBrandFilter: true,
    footnote: "Districts with fewer than three audited outlets are excluded — one shop's shelf is not a district's position.",
    render: ({ view }) => {
      const leads = districtLeads(view);
      const held = new Map<string, number>();
      for (const lead of leads) held.set(lead.leaderId, (held.get(lead.leaderId) ?? 0) + 1);
      return (
        <RankedBars
          rows={[...held]
            .map(([id, n]) => ({
              id,
              label: brands.find((b) => b.id === id)?.name ?? id,
              value: n,
              color: brandColor(id),
              meta: `of ${leads.length} districts with enough coverage to judge`,
            }))
            .sort((a, b) => b.value - a.value)}
        />
      );
    },
  },

  /* ---------- health ---------- */
  {
    id: "health-brands",
    shape: "bars",
    label: "Portfolio brand health",
    group: "health",
    description: "The composite score for each brand in the house.",
    width: "half",
    ignoresBrandFilter: true,
    render: ({ view }) => (
      <RankedBars
        rows={portfolioHealth(view).map((row) => ({
          id: row.brandId,
          label: row.name,
          value: row.score,
          color: brandColor(row.brandId),
          meta: `weakest: ${row.weakest.label}`,
        }))}
        max={100}
      />
    ),
  },
  {
    id: "health-governorates",
    shape: "bars",
    label: "Market health by governorate",
    group: "health",
    description: "The composite score for each governorate.",
    width: "half",
    render: ({ view, targets }) => (
      <RankedBars
        rows={governorateHealth(view).map((row) => ({
          id: row.governorateId,
          label: row.name,
          value: row.score,
          meta: `${row.outlets.toLocaleString()} audited · weakest: ${row.weakest.label}`,
        }))}
        max={100}
        par={targets.score}
      />
    ),
  },
];

export const BLOCK_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));

/* The filters a block is actually computed over. Outlet dimensions —
   place, format, retailer, period — always apply: a shelf battle scoped
   to Basra is still a Basra question. Brand and SKU are dropped for the
   blocks that compare brands, because a comparison with five of six
   removed is not a comparison. */
export function scopeForBlock(block: BlockDef, filters: Filters): Filters {
  return block.ignoresBrandFilter ? { ...filters, brands: [], skus: [] } : filters;
}

export const blocksInGroup = (group: BlockGroup) => BLOCKS.filter((b) => b.group === group);
