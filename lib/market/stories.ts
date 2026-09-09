/* ============================================================
   MARKET STORIES.

   The brief asks for storytelling blocks: a headline, one chart, one
   number, a recommendation. The temptation is to write three good
   sentences against today's figures and move on — and they would be
   silently wrong the next time the data is regenerated.

   So a story is a TEMPLATE WITH A TEST. Each one states the condition
   under which it is true, checks it against the current view, and
   declines to appear when the condition fails. The same discipline as
   the rules engine, applied to narrative: nothing here can say
   something the month does not support.

   Every comparison that could be noise is gated on a detection floor.
   A story is a stronger claim than a chart, not a weaker one.
   ============================================================ */

import {
  cities, cityName, clientBrand, monthLabel, trends,
} from "./index";
import { getTargets } from "./settings";
import type { MarketView } from "./filters";
import { availability, posm, shelf } from "./performance";
import { scoreboard } from "./competition";
import { formatIqd, moneyOf } from "./economics";

const r1 = (n: number) => Math.round(n * 10) / 10;

/* Bootstrapped floors, from scripts/calibrate-insights.mjs. */
const MARKET_FLOOR = 1.81;
const CITY_FLOOR: Record<string, number> = {
  baghdad: 3.09, basra: 4.63, erbil: 4.79, mosul: 5.05, najaf: 4.9, karbala: 5.57,
};

export type StoryChart =
  | { kind: "bars"; rows: { id: string; label: string; value: number; color?: string }[]; unit: string; max: number; par?: number }
  | { kind: "trend"; rows: { label: string; a: number; b: number }[]; aLabel: string; bLabel: string; unit: string };

export type Story = {
  id: string;
  /* The condition, in words, shown on the card. A reader who disagrees
     with the story can check the test rather than argue with prose. */
  test: string;
  headline: string;
  /* The one number the story turns on. */
  figure: { value: string; label: string };
  body: string;
  recommendation: string;
  chart: StoryChart;
  cta: { href: string; label: string };
};

/* ---------- 1 · strong on one measure, weak on another, same place ----------

   The brief's own example. A city where the client keeps the product
   on shelf but not on the good shelf is a specific, actionable split:
   the supply chain is working and the negotiation is not. */
function winsAvailabilityLosesShelf(view: MarketView): Story | null {
  const a = availability(view);
  const s = shelf(view);
  const board = scoreboard(view);
  const client = board.find((b) => b.isClient);
  const leader = board[0];
  if (!client || !leader || leader.isClient) return null;

  const candidates = cities
    .map((city) => {
      const cityAvail = a.byCity.find((r) => r.id === city.id);
      const cityShelf = s.byCity.find((r) => r.id === city.id);
      if (!cityAvail || !cityShelf) return null;
      const share = Number(cityShelf[clientBrand.id] ?? 0);
      const rivalShare = Number(cityShelf[leader.id] ?? 0);
      return {
        city,
        availability: cityAvail.value,
        share,
        rivalShare,
        outlets: cityAvail.outlets,
        gap: r1(rivalShare - share),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    /* The test: availability at or above the market figure, shelf share
       behind the rival by more than that city's detection floor. */
    .filter(
      (row) =>
        row.availability >= a.rate &&
        row.gap >= (CITY_FLOOR[row.city.id] ?? MARKET_FLOOR)
    )
    .sort((x, y) => y.gap - x.gap);

  const top = candidates[0];
  if (!top) return null;

  /* "Wins" is a claim; matching the market is not. The test admits a
     tie deliberately — the story is about the SPLIT between supply and
     negotiation, and that split is just as real when availability is
     merely at par — so the headline says which of the two it is rather
     than calling a tie a win. */
  const beats = r1(top.availability - a.rate) >= 0.5;

  return {
    id: "wins-availability-loses-shelf",
    test: `${cityName(top.city.id)} availability ≥ the market's ${a.rate}%, and ${leader.name} ahead on shelf by more than the city's ${CITY_FLOOR[top.city.id] ?? MARKET_FLOOR}pt detection floor.`,
    headline: `${clientBrand.name} ${beats ? "wins" : "holds"} availability but loses shelf in ${top.city.name}`,
    figure: { value: `${top.gap}pt`, label: `behind ${leader.name} on shelf` },
    body: `${top.city.name} keeps ${clientBrand.name} on shelf ${beats ? "better than the country manages" : "exactly as well as the country manages"} — ${top.availability}% against ${a.rate}% nationally, across ${top.outlets.toLocaleString()} audited outlets. The space it holds is another matter: ${top.share}% of measured facings against ${leader.name}'s ${top.rivalShare}%. Supply is working; the negotiation is not.`,
    recommendation: `Take facings, not replenishment, into the ${top.city.name} account reviews — the product is already arriving.`,
    chart: {
      kind: "trend",
      rows: [
        { label: "Availability", a: top.availability, b: a.rate },
        { label: "Shelf share", a: top.share, b: s.clientShare },
      ],
      aLabel: top.city.name,
      bLabel: "All audited",
      unit: "%",
    },
    cta: { href: `/portal/performance?tab=shelf&city=${top.city.id}`, label: "Open the shelf view" },
  };
}

/* ---------- 2 · one SKU carrying most of a KPI's damage ----------

   A KPI is an average, and an average hides whether the problem is
   everywhere or in one line. When one SKU owns a disproportionate
   share of the gaps, the fix is a conversation about one line rather
   than a programme about availability. */
function oneSkuCarriesTheDamage(view: MarketView): Story | null {
  const a = availability(view);
  const worst = a.worstSku;
  if (!worst) return null;
  const evenShare = 100 / Math.max(1, a.bySku.length);
  /* The test: this SKU owns at least half again the share of gaps an
     even split would give it. */
  if (worst.shareOfGaps < evenShare * 1.5) return null;

  const facingDays = view.gaps
    .filter((g) => g.skuId === worst.id)
    .reduce((s, g) => s + g.normalFacings, 0) * 30;
  const money = moneyOf(facingDays);

  return {
    id: "one-sku-carries-the-damage",
    test: `${worst.label} owns ${worst.shareOfGaps}% of client out-of-stocks against the ${r1(evenShare)}% an even split across ${a.bySku.length} lines would give it.`,
    headline: `One line is carrying most of the availability problem`,
    figure: {
      value: `${worst.shareOfGaps}%`,
      label: `of every ${clientBrand.name} gap is ${worst.label}`,
    },
    body: `${clientBrand.name} availability reads ${a.rate}% across the market, which sounds like a broad supply question. It is not. ${worst.label} is empty in ${worst.out.toLocaleString()} of the ${worst.listed.toLocaleString()} outlets that list it${money ? `, roughly ${formatIqd(money)} IQD of shelf standing idle until the next visit` : ""}.`,
    recommendation: `Treat ${worst.label} as its own replenishment problem before touching the wider availability programme.`,
    chart: {
      kind: "bars",
      rows: a.bySku.map((sku) => ({
        id: sku.id,
        label: sku.label,
        value: sku.out,
        color: sku.id === worst.id ? "var(--color-critical)" : "var(--color-comp-1)",
      })),
      unit: "",
      max: Math.max(...a.bySku.map((s) => s.out)),
    },
    cta: { href: `/portal/pos?sku=${worst.id}`, label: "See the affected outlets" },
  };
}

/* ---------- 3 · a rival's activity explains its shelf gain ----------

   The most useful competitive story is not "they gained" but "they
   gained AND here is what they did". It fires only when both the
   movement and the activity clear their own floors, because either
   half alone is a coincidence. */
function activityExplainsTheGain(view: MarketView): Story | null {
  const scope = view.filters.cities.length ? view.filters.cities : cities.map((c) => c.id);

  const candidates = scope
    .map((cityId) => {
      const line = trends.byCity[cityId];
      if (!line || line.length < 2) return null;
      const first = line[0];
      const last = line[line.length - 1];
      const floor = CITY_FLOOR[cityId] ?? MARKET_FLOOR;

      const moves = Object.entries(last.brandShare)
        .filter(([id]) => id !== clientBrand.id)
        .map(([id, share]) => ({
          id,
          shelf: r1(share - (first.brandShare[id] ?? 0)),
          promo: r1((last.promoShare?.[id] ?? 0) - (first.promoShare?.[id] ?? 0)),
        }))
        .sort((x, y) => y.shelf - x.shelf);

      const top = moves[0];
      /* The test: shelf movement above the city's floor AND promotion
         presence up by at least five points of outlet coverage. */
      if (!top || top.shelf < floor || top.promo < 5) return null;
      return { cityId, first, last, ...top, floor };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((x, y) => y.shelf - x.shelf);

  const top = candidates[0];
  if (!top) return null;

  const board = scoreboard(view);
  const rival = board.find((b) => b.id === top.id);
  const clientMove = r1((top.last.brandShare[clientBrand.id] ?? 0) - (top.first.brandShare[clientBrand.id] ?? 0));

  return {
    id: "activity-explains-the-gain",
    test: `${rival?.name ?? top.id} shelf up ${top.shelf}pt in ${cityName(top.cityId)} — above the city's ${top.floor}pt floor — with promotion presence up ${top.promo}pt over the same window.`,
    headline: `${rival?.name ?? top.id} bought its ${cityName(top.cityId)} shelf gain`,
    figure: { value: `+${top.shelf}pt`, label: `of ${cityName(top.cityId)} shelf, ${monthLabel(top.first.month)} to ${monthLabel(top.last.month)}` },
    body: `${rival?.name ?? top.id} moved from ${top.first.brandShare[top.id]}% to ${top.last.brandShare[top.id]}% of measured facings in ${cityName(top.cityId)}, while ${clientBrand.name} moved ${clientMove > 0 ? "+" : ""}${clientMove}pt. Over the same window its promotion presence rose from ${top.first.promoShare[top.id]}% to ${top.last.promoShare[top.id]}% of audited outlets. The shelf followed the activity.`,
    recommendation: `Decide whether to answer in ${cityName(top.cityId)} or concede the format — the gain has a mechanism behind it, so it will not reverse on its own.`,
    chart: {
      kind: "trend",
      rows: [
        { label: "Shelf share", a: top.first.brandShare[top.id] ?? 0, b: top.last.brandShare[top.id] ?? 0 },
        { label: "Promoting", a: top.first.promoShare[top.id] ?? 0, b: top.last.promoShare[top.id] ?? 0 },
      ],
      aLabel: monthLabel(top.first.month),
      bLabel: monthLabel(top.last.month),
      unit: "%",
    },
    cta: { href: `/portal/competition?city=${top.cityId}`, label: "Open competition" },
  };
}

/* ---------- 4 · the product is there and unsupported ----------

   The cheapest gap in any audit: the brand is on shelf, the
   relationship exists, and there is nothing on the fixture saying so.
   Fires when POSM is the weakest KPI against its own target. */
function stockedButUnsupported(view: MarketView): Story | null {
  const p = posm(view);
  const a = availability(view);
  const gapToTarget = (value: number, target: number) => r1(target - value);

  const posmGap = gapToTarget(p.compliance, getTargets().posm);
  const availGap = gapToTarget(a.rate, getTargets().availability);
  const shareGap = gapToTarget(shelf(view).clientShare, getTargets().shelfShare);

  /* The test: POSM is further from its target than availability or
     shelf share are from theirs, and there is a countable population
     of outlets stocking the brand with nothing on the fixture. */
  if (posmGap <= availGap || posmGap <= shareGap) return null;
  if (p.bare.length < 20) return null;

  const worstCity = p.byCity[0];

  return {
    id: "stocked-but-unsupported",
    test: `POSM sits ${posmGap}pt below its ${getTargets().posm}% target — further than availability (${availGap}pt) or shelf share (${shareGap}pt) — with ${p.bare.length} outlets stocking the brand and carrying no material.`,
    headline: `${clientBrand.name} is on shelf in ${p.bare.length} outlets with nothing saying so`,
    figure: { value: `${p.compliance}%`, label: `POSM compliance against an ${getTargets().posm}% target` },
    body: `Point-of-sale material is the weakest thing this audit measures, and it is the cheapest to fix: in ${p.bare.length} audited outlets the product is already on the shelf and not one piece of agreed material is present. ${worstCity ? `${worstCity.label} is the weakest city at ${worstCity.value}%, with ${worstCity.missing.toLocaleString()} items missing.` : ""}`,
    recommendation: `Route a material run through the ${p.bare.length} stocked-but-bare outlets before spending anything on new listings.`,
    chart: {
      kind: "bars",
      rows: p.byType.map((type) => ({
        id: type.id,
        label: type.label,
        value: type.value,
      })),
      unit: "%",
      max: 100,
      par: getTargets().posm,
    },
    cta: { href: "/portal/performance?tab=posm", label: "Open POSM" },
  };
}

/* ---------- 5 · a value brand buying nothing with its price ----------

   Fires when a rival prices materially below the category and still
   holds little shelf — which says the category is not price-elastic at
   the fixture, and that discounting is the wrong answer to a share
   problem. Useful precisely because it argues AGAINST an obvious
   move. */
function priceIsNotTheLever(view: MarketView): Story | null {
  const board = scoreboard(view);
  const client = board.find((b) => b.isClient);
  if (!client) return null;

  const cheap = board
    .filter((b) => !b.isClient && b.priceIndex > 0 && b.priceIndex <= 95)
    .sort((x, y) => x.priceIndex - y.priceIndex)[0];
  /* The test: someone is at least 5% under category par and holds less
     than a third of the client's shelf. */
  if (!cheap || cheap.share >= client.share / 3) return null;

  return {
    id: "price-is-not-the-lever",
    test: `${cheap.name} prices at a ${cheap.priceIndex} index (category par is 100) and holds ${cheap.share}% of shelf against ${clientBrand.name}'s ${client.share}%.`,
    headline: `Discounting is not buying shelf in this category`,
    figure: { value: `${cheap.share}%`, label: `shelf for ${cheap.name} at a ${cheap.priceIndex} price index` },
    body: `${cheap.name} sells ${100 - cheap.priceIndex}% under category par on the packs it shares with everyone else, and holds ${cheap.share}% of measured facings — against ${client.share}% for ${clientBrand.name} at a ${client.priceIndex} index. Whatever decides shelf in this market, it is not shelf price.`,
    recommendation: `Answer share pressure with facings and material rather than price — the evidence says the discount would be spent for nothing.`,
    chart: {
      kind: "bars",
      rows: board.map((b) => ({
        id: b.id,
        label: `${b.name} · index ${b.priceIndex}`,
        value: b.share,
      })),
      unit: "%",
      max: Math.max(...board.map((b) => b.share)),
    },
    cta: { href: "/portal/competition", label: "Open competition" },
  };
}

export function marketStories(view: MarketView): Story[] {
  return [
    winsAvailabilityLosesShelf(view),
    oneSkuCarriesTheDamage(view),
    activityExplainsTheGain(view),
    stockedButUnsupported(view),
    priceIsNotTheLever(view),
  ].filter((story): story is Story => story !== null);
}
