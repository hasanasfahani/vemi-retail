/* ============================================================
   THE INSIGHT ENGINE.

   Rule-based, not generated: every finding on every page comes from a
   named rule with a stated formula and the source rows behind it. A
   reader can always ask "why does it say that?" and get arithmetic
   back, which is the whole difference between a portal a category
   manager will act on and one they will argue with.

   Ported from the single-city engine and made geography-generic —
   district rules now run city → district, and nothing here names a
   place. Two rules the multi-city brief needs were added (POSM
   absence, competitor movement) and one was dropped: geographic
   concentration needed district coordinates, which this dataset does
   not carry.

   Every threshold is calibrated against the distribution this dataset
   actually produces. Re-run `node scripts/calibrate-insights.mjs`
   after any change to the panel, the city list or the category, and
   move the numbers to match what it prints.
   ============================================================ */

import {
  brands, channelName, cityName, clientBrand, monthLabel, portfolioBrands, skuOf,
  skus, trends,
} from "./index";
import { moneyOf } from "./economics";
import type { MarketView } from "./filters";
import type { Cell, Sku } from "./types";

/* ---------- shapes ---------- */

export type Severity = "critical" | "warning" | "watch";

/* The four cards the brief asks the Executive Dashboard to speak in.
   Severity says how loud; category says what kind of conversation it
   starts — an emergency, a headroom argument, a discipline problem, or
   a competitor doing something. */
export type Category = "critical" | "opportunity" | "execution-gap" | "competitor";

export const CATEGORY_LABEL: Record<Category, string> = {
  critical: "Critical",
  opportunity: "Opportunity",
  "execution-gap": "Execution gap",
  competitor: "Competitor movement",
};

export type RuleId =
  | "r1-outlet-gaps"
  | "r2-district-deficit"
  | "r3-distribution-gap"
  | "r4-rival-substitution"
  | "r5-price-cluster"
  | "r6-channel-gap"
  | "r7-shelf-position"
  | "r9-dark-outlet"
  | "r11-assortment-gap"
  | "r13-posm-absent"
  | "r14-competitor-movement"
  | "r15-sku-stockout";

/* Exported so anything holding a stored rule name — an action created
   cycles ago — can tell "this finding is gone" from "this rule is
   gone". */
export const RULE_IDS: RuleId[] = [
  "r1-outlet-gaps", "r2-district-deficit", "r3-distribution-gap",
  "r4-rival-substitution", "r5-price-cluster", "r6-channel-gap",
  "r7-shelf-position", "r9-dark-outlet", "r11-assortment-gap",
  "r13-posm-absent", "r14-competitor-movement", "r15-sku-stockout",
];

export type EvidenceTable = { columns: string[]; rows: (string | number)[][] };

export type Insight = {
  id: string;
  rule: RuleId;
  category: Category;
  severity: Severity;
  headline: string;
  detail: string;
  /* What it costs, in the unit the rule actually measures. Mixing
     units in one ranked list would be dishonest, so the unit travels
     with the number. */
  impact: { value: number; unit: "facing-days" | "readings" | "outlets"; label: string };
  /* "measured" — summed straight from recorded observations.
     "estimated" — a formula's projection over a deficit that was never
     itself observed as an event. Both are stated arithmetic, but they
     answer different questions, so measured findings always rank
     ahead of estimated ones rather than competing on size. */
  confidence: "measured" | "estimated";
  /* How much of the panel the finding covers — the denominator the
     ranked list divides impact by, shown on the card so the ranking
     rule is visible rather than inferred. */
  scope: { outlets: number; label: string };
  /* Where to go to act on it, and what the reader should be looking
     at when they get there. */
  cta: { href: string; label: string };
  /* The outlets the finding actually touches. Rules supply it; the
     entry point turns it into geographic concentration, so no rule has
     to know about cities to say where its problem lives. */
  affected: string[];
  /* Derived at the entry point, never by a rule. */
  concentration?: { cityId: string; outlets: number; share: number };
  /* Facing-days converted to dinars, where that conversion is
     meaningful. Null on rules counted in readings or outlets —
     inventing a dinar figure for "three mispriced lines" would be
     making one up — and null wherever the facing-days are not the
     CLIENT'S OWN space: see `monetisable`. */
  money: number | null;
  /* False on findings measured in someone else's facings. R4 counts
     the rival shelf standing where the client is out; pricing that as
     client revenue would claim the client could capture a competitor's
     entire fixture, and at 849m IQD it dominated every money-ranked
     list on the first run. */
  monetisable?: boolean;
  evidence: { formula: string; table: EvidenceTable };
  entities: {
    brandId?: string;
    skuId?: string;
    posId?: string;
    cityId?: string;
    district?: string;
    channel?: string;
  };
};

/* What a rule returns. The two derived fields are filled in once, at
   the entry point, so a rule never has to know about cities or money
   to state its own finding. */
export type RawInsight = Omit<Insight, "concentration" | "money">;

export type InsightReport = {
  all: Insight[];
  byCategory: Record<Category, Insight[]>;
  /* The four or five cards the Executive Dashboard shows: the top
     finding from each category, so the page cannot fill up with five
     variations of the same stockout. */
  headlines: Insight[];
};

/* ------------------------------------------------------------------
   THRESHOLDS

   Each number below cites what the September panel actually produced
   (742 audited outlets, 11,005 cells). None of them is round for the
   sake of being round.
------------------------------------------------------------------ */
export const THRESHOLDS = {
  /* Client SKUs listed but empty at one outlet.
     Observed: 292 outlets carry ≥1 gap, 51 carry ≥2, 4 carry ≥3, and 3
     is the ceiling. One gap is the norm here, not a signal. */
  r1OutletGaps: { warningCount: 2, criticalCount: 3 },

  /* A district's client shelf share against its OWN city's share.
     Observed across 54 districts with ≥4 audited outlets: median −0.3pt
     (districts are mostly at city par), p75 3.2, p90 5.7, max 12.4
     (Iskan, Erbil). A 3pt bar would flag a quarter of the map. */
  r2DistrictDeficit: { criticalPt: 7, warningPt: 4, minOutlets: 4 },

  /* A client SKU's distribution against the median of same-pack rivals.
     Observed: five of six client SKUs lead their pack peers by 9–14pt;
     the exception is Pepsi Zero 330ml, 16.8pt BEHIND the peer median
     for 330ml cans. Sized so that one lone laggard is a warning and
     something twice as bad would be critical. Packs with no rival
     entry are skipped: "60pt ahead of nobody" is not a finding. */
  r3DistributionGap: { criticalPt: 20, warningPt: 10, minPeers: 1 },

  /* The top rival's share of facings at outlets where the client is
     out of stock — who is standing in the space.
     Observed: Coca-Cola 59.4% of contested facings, then 7UP 16.3%.
     With six brands, even split is 20%, so 30% is already a one-name
     story and 45% is dominance. */
  r4RivalSubstitution: { criticalSharePct: 45, warningSharePct: 30 },

  /* Client price readings more than 5% off RRP, clustered by outlet.
     Observed: 174 outlets carry ≥1 breach, 19 carry ≥2, 2 carry ≥3.
     One mispriced line is a reading; two at one store is a pattern. */
  r5PriceCluster: { warningCount: 2, criticalCount: 3 },

  /* Client availability in one channel against the client's own
     average. Observed September: overall 87.6%, and the widest channel
     gap is grocery at −2.0pt — inside the 1.7pt market detection floor
     and nowhere near a story. The rule is calibrated to speak when a
     channel genuinely breaks, and stays silent when it doesn't.

     `minListings` is a sample-size floor: below roughly 100/warningPt
     listings, one stockout moves a channel's rate by more than the
     threshold that judges it, and the rule cannot tell a channel
     problem from a rounding error. */
  r6ChannelGap: { criticalPt: 6, warningPt: 3, minListings: 100 },

  /* Client share of eye-level facings against every other shelf
     position. Observed: 33.6% at eye vs 34.4% elsewhere — a 0.8pt
     gap, i.e. no fixture story in this month at all. */
  r7ShelfPosition: { warningPt: 5, criticalPt: 9 },

  /* R9 has no numeric threshold: an outlet that lists the client and
     stocks none of it is a binary fact. Observed: 4 outlets. */

  /* Client SKUs listed at an outlet against that outlet's own channel
     median — a range-selling gap, not a stock gap.
     Observed: 265 outlets sit ≥1 SKU short, 118 sit ≥2 short, 26 sit
     3 short (the ceiling). One short is normal variance. */
  r11AssortmentGap: { warningCount: 2, criticalCount: 3 },

  /* Outlets that stock the client but carry NO point-of-sale material.
     Observed: 60 such outlets, and POSM is the weakest KPI in the
     month at 68% against an 85 target. */
  r13PosmAbsent: { warningCount: 20, criticalCount: 50 },

  /* Competitor shelf-share movement.

     Judged over the SIX-MONTH window, never month-over-month, and this
     is the most consequential calibration in the file. Bootstrapped
     detection floors (MDE = 2.8 × SE, 400 resamples) are 3.1pt in
     Baghdad and 4.6–5.6pt in the smaller cities, while every observed
     month-over-month city movement is between 0.1 and 2.1pt. A
     month-over-month competitor card would therefore be manufacturing
     signal from panel noise every single month.

     Over the half the picture is real: Coca-Cola +4.7pt in Basra
     against that city's 4.63pt floor. That is the one city movement
     this dataset can honestly claim, and the rule claims exactly it. */
  r14Movement: { windowMonths: 6, minPt: 1 },

  /* A single client SKU out of stock across the market, counted only
     where it is actually listed.
     Observed: Pepsi 500ml PET is empty in 91 of the outlets that list
     it — by far the worst, with 250ml Can next at 52. */
  r15SkuStockout: { warningOutlets: 40, criticalOutlets: 75 },
} as const;

/* Bootstrapped detection floors, in share points, from
   scripts/calibrate-insights.mjs. A city's floor is a property of how
   many outlets that city contributes, so it is stated per city rather
   than assumed uniform. */
export const SHARE_FLOOR_PT: Record<string, number> = {
  market: 1.81, baghdad: 3.09, basra: 4.63, erbil: 4.79,
  nineveh: 5.05, najaf: 4.90, karbala: 5.57,
};

/* Monthly audit cycle: the interval a deficit is projected over when a
   rule has to express a shortfall as exposure rather than as an event
   that was directly observed. */
export const REVISIT_DAYS = 30;

/* ---------- small helpers ---------- */

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));
const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return 0;
  const mid = Math.floor((s.length - 1) / 2);
  return s.length % 2 ? s[mid] : (s[mid] + s[mid + 1]) / 2;
};

/* Ranking: confidence tier first, then impact per outlet touched.

   Confidence outranks intensity outright, because a projection over a
   deficit nobody observed should never beat a directly counted loss
   just because its formula produces a bigger number. Within a tier,
   dividing by scope stops a market-wide rule from automatically
   outranking a concentrated one — the sort key is visible on the card,
   not a hidden weighting. */
export const intensityOf = (i: Insight) =>
  i.scope.outlets > 0 ? i.impact.value / i.scope.outlets : 0;

const CONFIDENCE_RANK = { measured: 0, estimated: 1 } as const;

/* Intensity only means something between findings measured in the SAME
   unit: facing-days and price readings are not convertible, and
   ranking them against each other would let whichever unit produces
   bigger numbers win an argument it never entered.

   So the list is ordered by a stated precedence of units and then by
   intensity inside each. The precedence is a declaration, not a
   conversion — space standing empty over time is the loss itself,
   outlets count where it happens, and readings are single
   observations — and it is fixed so the comparator stays transitive.
   A comparator that switched keys depending on which pair it was
   handed produced a list that was monotone nowhere. */
const UNIT_RANK: Record<Insight["impact"]["unit"], number> = {
  "facing-days": 0,
  outlets: 1,
  readings: 2,
};

export const byRank = (a: Insight, b: Insight) => {
  const tier = CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
  if (tier !== 0) return tier;
  const unit = UNIT_RANK[a.impact.unit] - UNIT_RANK[b.impact.unit];
  if (unit !== 0) return unit;
  return intensityOf(b) - intensityOf(a);
};

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, watch: 2 };

const clientSkuIds = (view: MarketView) =>
  new Set(view.cells.filter((c) => skuOf(c.skuId)?.brandId === clientBrand.id).map((c) => c.skuId));

const isClient = (c: Cell) => skuOf(c.skuId)?.brandId === clientBrand.id;
const facingsOf = (rows: Cell[]) =>
  rows.reduce((s, c) => (c.state === "in-stock" ? s + c.facings : s), 0);
const shareOf = (rows: Cell[]) => {
  const total = facingsOf(rows);
  return total === 0 ? 0 : r1((facingsOf(rows.filter(isClient)) / total) * 100);
};

type Ctx = {
  view: MarketView;
  posById: Map<string, MarketView["outlets"][number]>;
  cellsByPos: Map<string, Cell[]>;
  skuById: Map<string, Sku>;
};

/* ==================================================================
   R1 · gap cluster at one outlet

   Client SKUs the outlet lists — so it has the relationship, the
   shelf space and the price agreed — standing empty on the day it was
   audited. This is the most directly observed loss in the file:
   nothing is projected, the auditor stood in front of the empty
   facings and counted them.
================================================================== */
function r1OutletGaps(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const out: RawInsight[] = [];

  for (const [posId, cells] of ctx.cellsByPos) {
    const own = cells.filter(isClient);
    const gaps = own.filter((c) => c.state === "out-of-stock");
    if (gaps.length < THRESHOLDS.r1OutletGaps.warningCount) continue;
    /* An outlet with nothing in stock at all is R9's story, told
       better; don't say it twice. */
    if (own.every((c) => c.state === "out-of-stock")) continue;

    const outlet = ctx.posById.get(posId);
    if (!outlet) continue;

    /* Facings standing empty × the days until this outlet is next
       audited. The facing count is observed (the gap rows carry the
       space the SKU holds when stocked); the interval is the
       collection plan, stated, not guessed. */
    const lost = view.gaps
      .filter((g) => g.posId === posId && ctx.skuById.get(g.skuId)?.brandId === clientBrand.id)
      .reduce((s, g) => s + g.normalFacings, 0) * REVISIT_DAYS;

    out.push({
      id: `r1-${posId}`,
      rule: "r1-outlet-gaps",
      category: "critical",
      severity:
        gaps.length >= THRESHOLDS.r1OutletGaps.criticalCount ? "critical" : "warning",
      headline: `${gaps.length} ${clientBrand.name} lines empty at ${outlet.name}`,
      detail: `${outlet.name} lists ${own.length} ${clientBrand.name} SKUs and had ${gaps.length} of them out of stock when it was audited — space that is agreed, held and earning nothing.`,
      impact: {
        value: lost,
        unit: "facing-days",
        label: `${lost.toLocaleString()} facing-days until the next visit`,
      },
      confidence: "measured",
      scope: { outlets: 1, label: outlet.name },
      cta: { href: `/portal/pos?pos=${posId}`, label: "Open outlet" },
      affected: [posId],
      evidence: {
        formula:
          "empty client facings at this outlet × 30 days to the next audit",
        table: {
          columns: ["SKU", "State", "Facings when stocked"],
          rows: gaps.map((c) => [
            ctx.skuById.get(c.skuId)?.name ?? c.skuId,
            "Out of stock",
            view.gaps.find((g) => g.posId === posId && g.skuId === c.skuId)?.normalFacings ?? 0,
          ]),
        },
      },
      entities: {
        posId,
        cityId: outlet.cityId,
        district: outlet.district,
        channel: outlet.channel,
        brandId: clientBrand.id,
      },
    });
  }
  return out;
}

/* ==================================================================
   R2 · district shelf-share deficit

   A district where the client holds materially less shelf than it
   holds across that district's OWN city. Comparing a district to the
   national figure would just rediscover that Baghdad is weaker than
   Erbil; comparing it to its own city isolates the thing a field
   manager can actually do something about.
================================================================== */
function r2DistrictDeficit(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const byCity = new Map<string, Cell[]>();
  const byDistrict = new Map<string, Cell[]>();

  for (const cell of view.cells) {
    const outlet = ctx.posById.get(cell.posId);
    if (!outlet) continue;
    const dk = `${outlet.cityId}|${outlet.district}`;
    byCity.set(outlet.cityId, [...(byCity.get(outlet.cityId) ?? []), cell]);
    byDistrict.set(dk, [...(byDistrict.get(dk) ?? []), cell]);
  }

  const out: RawInsight[] = [];
  for (const [dk, cells] of byDistrict) {
    const [cityId, district] = dk.split("|");
    const outlets = new Set(cells.map((c) => c.posId));
    if (outlets.size < THRESHOLDS.r2DistrictDeficit.minOutlets) continue;

    const cityShare = shareOf(byCity.get(cityId) ?? []);
    const districtShare = shareOf(cells);
    const deficit = r1(cityShare - districtShare);
    if (deficit < THRESHOLDS.r2DistrictDeficit.warningPt) continue;

    /* Facings the client would hold at city par, minus what it holds,
       projected over the audit cycle. Estimated, not measured: nobody
       observed those facings being lost — the shortfall is inferred
       from a share comparison. */
    const total = facingsOf(cells);
    const short = Math.round((deficit / 100) * total);
    out.push({
      id: `r2-${dk}`,
      rule: "r2-district-deficit",
      category: "opportunity",
      severity:
        deficit >= THRESHOLDS.r2DistrictDeficit.criticalPt ? "critical" : "warning",
      headline: `${clientBrand.name} shelf share is ${deficit}pt below city par in ${district}`,
      detail: `${district} gives ${clientBrand.name} ${districtShare}% of shelf against ${cityShare}% across ${cityName(cityId)} — ${outlets.size} audited outlets holding less than the city they sit in.`,
      impact: {
        value: short * REVISIT_DAYS,
        unit: "facing-days",
        label: `${(short * REVISIT_DAYS).toLocaleString()} facing-days below city par`,
      },
      confidence: "estimated",
      scope: { outlets: outlets.size, label: `${district}, ${cityName(cityId)}` },
      cta: { href: `/portal/pos?city=${cityId}`, label: "See outlets" },
      affected: [...outlets],
      evidence: {
        formula:
          "(city client share − district client share) × district facings × 30 days",
        table: {
          columns: ["Area", "Client share", "Audited outlets", "Facings"],
          rows: [
            [district, `${districtShare}%`, outlets.size, facingsOf(cells)],
            [
              cityName(cityId),
              `${cityShare}%`,
              new Set((byCity.get(cityId) ?? []).map((c) => c.posId)).size,
              facingsOf(byCity.get(cityId) ?? []),
            ],
          ],
        },
      },
      entities: { cityId, district, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   R3 · a client SKU behind its pack peers on distribution

   Listing breadth, not stock: how many audited outlets carry the SKU
   at all, against the median of rival SKUs in the SAME pack format.
   Comparing a 250ml can to a 2.25L bottle would say nothing; packs
   compete within their own format.
================================================================== */
function r3DistributionGap(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const audited = view.posCount || 1;
  const listedPct = (skuId: string) =>
    pct(new Set(view.cells.filter((c) => c.skuId === skuId).map((c) => c.posId)).size, audited);

  const out: RawInsight[] = [];
  for (const sku of ctx.skuById.values()) {
    if (sku.brandId !== clientBrand.id) continue;
    const peers = [...ctx.skuById.values()].filter(
      (s) => s.pack === sku.pack && s.brandId !== clientBrand.id
    );
    if (peers.length < THRESHOLDS.r3DistributionGap.minPeers) continue;

    const own = listedPct(sku.id);
    const peerMedian = r1(median(peers.map((p) => listedPct(p.id))));
    const gap = r1(peerMedian - own);
    if (gap < THRESHOLDS.r3DistributionGap.warningPt) continue;

    const missing = Math.round(((gap / 100) * audited));
    out.push({
      id: `r3-${sku.id}`,
      rule: "r3-distribution-gap",
      category: "opportunity",
      severity: gap >= THRESHOLDS.r3DistributionGap.criticalPt ? "critical" : "warning",
      headline: `${sku.name} is listed in ${gap}pt fewer outlets than its pack rivals`,
      detail: `${sku.name} is carried by ${own}% of audited outlets against a ${peerMedian}% median for other ${sku.pack.replace("-", " ")} lines — roughly ${missing} outlets where the format sells and this SKU is absent.`,
      impact: { value: missing, unit: "outlets", label: `${missing} outlets not carrying it` },
      confidence: "estimated",
      scope: { outlets: audited, label: "all audited outlets" },
      cta: { href: `/portal/performance?tab=assortment&sku=${sku.id}`, label: "See assortment" },
      /* The outlets that do NOT carry it — the gap is the opportunity,
         not the outlets already stocking it. */
      affected: view.outlets
        .filter((p) => !view.cells.some((c) => c.posId === p.id && c.skuId === sku.id))
        .map((p) => p.id),
      evidence: {
        formula: "median(same-pack rival distribution) − client SKU distribution",
        table: {
          columns: ["SKU", "Brand", "Listed in"],
          rows: [
            [sku.name, clientBrand.name, `${own}%`],
            ...peers.map((p) => [
              p.name,
              brands.find((b) => b.id === p.brandId)?.name ?? p.brandId,
              `${listedPct(p.id)}%`,
            ]),
          ],
        },
      },
      entities: { skuId: sku.id, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   R4 · who stands in the client's empty space

   At outlets where the client is out of stock, whose facings fill the
   fixture. A shopper who came for Pepsi and left with something else
   is the real cost of a stockout, and this names which competitor
   collected it.
================================================================== */
function r4RivalSubstitution(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const oosOutlets = new Set(
    view.cells.filter((c) => isClient(c) && c.state === "out-of-stock").map((c) => c.posId)
  );
  if (oosOutlets.size === 0) return [];

  const contested = view.cells.filter(
    (c) => oosOutlets.has(c.posId) && c.state === "in-stock" && !isClient(c)
  );
  const totals = new Map<string, number>();
  for (const c of contested) {
    const brandId = ctx.skuById.get(c.skuId)?.brandId;
    if (!brandId) continue;
    totals.set(brandId, (totals.get(brandId) ?? 0) + c.facings);
  }
  const all = [...totals.values()].reduce((a, b) => a + b, 0);
  if (all === 0) return [];

  const ranked = [...totals].sort((a, b) => b[1] - a[1]);
  const [topId, topFacings] = ranked[0];
  const share = pct(topFacings, all);
  if (share < THRESHOLDS.r4RivalSubstitution.warningSharePct) return [];
  /* Portfolio stablemates are not substitution — a shopper taking 7UP
     when Pepsi is out keeps the money inside Baghdad Soft Drinks. */
  if (portfolioBrands.some((b) => b.id === topId)) return [];

  const rival = brands.find((b) => b.id === topId)!;
  return [
    {
      id: `r4-${topId}`,
      rule: "r4-rival-substitution",
      category: "competitor",
      severity:
        share >= THRESHOLDS.r4RivalSubstitution.criticalSharePct ? "critical" : "warning",
      headline: `${rival.name} holds ${share}% of the shelf where ${clientBrand.name} is out`,
      detail: `Across ${oosOutlets.size} audited outlets with a ${clientBrand.name} stockout, ${rival.name} occupies ${topFacings.toLocaleString()} of ${all.toLocaleString()} competing facings — the shelf a ${clientBrand.name} shopper meets instead.`,
      impact: {
        value: topFacings * REVISIT_DAYS,
        unit: "facing-days",
        label: `${(topFacings * REVISIT_DAYS).toLocaleString()} contested facing-days`,
      },
      confidence: "measured",
      /* Rival facings, not the client's — not convertible to client
         money. See the note on `monetisable`. */
      monetisable: false,
      scope: { outlets: oosOutlets.size, label: "outlets with a client stockout" },
      cta: { href: "/portal/competition", label: "Open competition" },
      affected: [...oosOutlets],
      evidence: {
        formula: "rival facings at client-stockout outlets ÷ all competing facings there",
        table: {
          columns: ["Brand", "Facings", "Share of contested shelf"],
          rows: ranked.map(([id, v]) => [
            brands.find((b) => b.id === id)?.name ?? id,
            v,
            `${pct(v, all)}%`,
          ]),
        },
      },
      entities: { brandId: topId },
    },
  ];
}

/* ==================================================================
   R5 · price breaches clustered at one outlet

   Client lines priced more than 5% away from RRP. Scoped to the
   client deliberately: a competitor's discounting is a market fact,
   not something the client's own team can fix on a phone call, and
   mixing the two produced rankings dominated by outlets that were
   only remarkable for somebody else's promotion.
================================================================== */
function r5PriceCluster(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const byPos = new Map<string, typeof view.prices>();
  for (const p of view.prices) {
    if (ctx.skuById.get(p.skuId)?.brandId !== clientBrand.id) continue;
    if (Math.abs(p.variance) <= 5) continue;
    byPos.set(p.posId, [...(byPos.get(p.posId) ?? []), p]);
  }

  const out: RawInsight[] = [];
  for (const [posId, rows] of byPos) {
    if (rows.length < THRESHOLDS.r5PriceCluster.warningCount) continue;
    const outlet = ctx.posById.get(posId);
    if (!outlet) continue;
    const over = rows.filter((r) => r.variance > 0).length;

    out.push({
      id: `r5-${posId}`,
      rule: "r5-price-cluster",
      category: "execution-gap",
      severity:
        rows.length >= THRESHOLDS.r5PriceCluster.criticalCount ? "critical" : "warning",
      headline: `${rows.length} ${clientBrand.name} lines mispriced at ${outlet.name}`,
      detail: `${outlet.name} prices ${rows.length} ${clientBrand.name} SKUs more than 5% away from RRP — ${over} above list, ${rows.length - over} below.`,
      impact: { value: rows.length, unit: "readings", label: `${rows.length} readings off list` },
      confidence: "measured",
      scope: { outlets: 1, label: outlet.name },
      cta: { href: `/portal/pos?pos=${posId}`, label: "Open outlet" },
      affected: [posId],
      evidence: {
        formula: "client price readings more than ±5% from RRP, counted per outlet",
        table: {
          columns: ["SKU", "Shelf price", "RRP", "Variance"],
          rows: rows.map((r) => [
            ctx.skuById.get(r.skuId)?.name ?? r.skuId,
            r.price,
            r.rrp,
            `${r.variance > 0 ? "+" : ""}${r.variance}%`,
          ]),
        },
      },
      entities: { posId, cityId: outlet.cityId, channel: outlet.channel, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   R6 · a channel where the client is weaker than its own average

   Only channels performing WORSE than the client's overall figure, and
   only channels big enough that one stockout cannot move the rate by
   more than the threshold judging it.
================================================================== */
function r6ChannelGap(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const own = view.cells.filter(isClient);
  if (own.length === 0) return [];
  const overall = pct(own.filter((c) => c.state === "in-stock").length, own.length);

  const out: RawInsight[] = [];
  const byChannel = new Map<string, Cell[]>();
  for (const c of own) {
    const ch = ctx.posById.get(c.posId)?.channel;
    if (ch) byChannel.set(ch, [...(byChannel.get(ch) ?? []), c]);
  }

  for (const [channel, rows] of byChannel) {
    if (rows.length < THRESHOLDS.r6ChannelGap.minListings) continue;
    const rate = pct(rows.filter((c) => c.state === "in-stock").length, rows.length);
    const gap = r1(overall - rate);
    if (gap < THRESHOLDS.r6ChannelGap.warningPt) continue;

    const outlets = new Set(rows.map((c) => c.posId)).size;
    const short = Math.round((gap / 100) * rows.length);
    out.push({
      id: `r6-${channel}`,
      rule: "r6-channel-gap",
      category: "execution-gap",
      severity: gap >= THRESHOLDS.r6ChannelGap.criticalPt ? "critical" : "warning",
      headline: `${channelName(channel)} availability is ${gap}pt behind your own average`,
      detail: `${clientBrand.name} is on shelf in ${rate}% of ${channelName(channel)} listings against ${overall}% across all audited outlets — ${outlets} outlets in one format, failing the same way.`,
      impact: {
        value: short * REVISIT_DAYS,
        unit: "facing-days",
        label: `${(short * REVISIT_DAYS).toLocaleString()} facing-days behind average`,
      },
      confidence: "estimated",
      scope: { outlets, label: channelName(channel) },
      cta: { href: `/portal/performance?channel=${channel}`, label: "See channel" },
      affected: [...new Set(rows.map((c) => c.posId))],
      evidence: {
        formula: "client availability overall − client availability in this channel",
        table: {
          columns: ["Scope", "Availability", "Listings", "Outlets"],
          rows: [
            [channelName(channel), `${rate}%`, rows.length, outlets],
            ["All audited", `${overall}%`, own.length, view.posCount],
          ],
        },
      },
      entities: { channel, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   R7 · shelf position

   The client's share of eye-level facings against its share everywhere
   else. Eye level is the space worth negotiating for, and holding par
   overall while losing the best shelf is a real, specific problem that
   an aggregate share figure hides completely.
================================================================== */
function r7ShelfPosition(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  const eye = stocked.filter((c) => c.position === "eye");
  const rest = stocked.filter((c) => c.position !== "eye");
  if (eye.length === 0 || rest.length === 0) return [];

  const eyeShare = shareOf(eye);
  const restShare = shareOf(rest);
  const gap = r1(restShare - eyeShare);
  if (gap < THRESHOLDS.r7ShelfPosition.warningPt) return [];

  const short = Math.round((gap / 100) * facingsOf(eye));
  return [
    {
      id: "r7-eye-level",
      rule: "r7-shelf-position",
      category: "execution-gap",
      severity: gap >= THRESHOLDS.r7ShelfPosition.criticalPt ? "critical" : "warning",
      headline: `${clientBrand.name} holds ${gap}pt less of the eye-level shelf than of the rest`,
      detail: `${eyeShare}% of eye-level facings against ${restShare}% elsewhere — the client is being shelved, but not at the height that sells.`,
      impact: {
        value: short * REVISIT_DAYS,
        unit: "facing-days",
        label: `${(short * REVISIT_DAYS).toLocaleString()} eye-level facing-days short`,
      },
      confidence: "estimated",
      scope: { outlets: new Set(eye.map((c) => c.posId)).size, label: "outlets with eye-level shelf" },
      cta: { href: "/portal/performance?tab=shelf", label: "See shelf" },
      affected: [...new Set(eye.map((c) => c.posId))],
      evidence: {
        formula: "client share of non-eye facings − client share of eye-level facings",
        table: {
          columns: ["Position", "Client share", "Facings"],
          rows: [
            ["Eye level", `${eyeShare}%`, facingsOf(eye)],
            ["Upper / lower", `${restShare}%`, facingsOf(rest)],
          ],
        },
      },
      entities: { brandId: clientBrand.id },
    },
  ];
}

/* ==================================================================
   R9 · dark outlet

   The outlet lists the client and has none of it on shelf. Not a gap
   in a range — a total absence at a door that has already agreed to
   carry the brand, which is the most expensive kind of stockout there
   is and the easiest to fix.
================================================================== */
function r9DarkOutlets(ctx: Ctx): RawInsight[] {
  const out: RawInsight[] = [];
  for (const [posId, cells] of ctx.cellsByPos) {
    const own = cells.filter(isClient);
    if (own.length === 0) continue;
    if (own.some((c) => c.state === "in-stock")) continue;

    const outlet = ctx.posById.get(posId);
    if (!outlet) continue;
    const lost =
      ctx.view.gaps
        .filter((g) => g.posId === posId && ctx.skuById.get(g.skuId)?.brandId === clientBrand.id)
        .reduce((s, g) => s + g.normalFacings, 0) * REVISIT_DAYS;

    out.push({
      id: `r9-${posId}`,
      rule: "r9-dark-outlet",
      category: "critical",
      severity: "critical",
      headline: `${outlet.name} carries no ${clientBrand.name} at all`,
      detail: `${outlet.name} lists ${own.length} ${clientBrand.name} SKUs and had every one of them out of stock — a listed door selling none of the brand.`,
      impact: {
        value: lost,
        unit: "facing-days",
        label: `${lost.toLocaleString()} facing-days dark`,
      },
      confidence: "measured",
      scope: { outlets: 1, label: outlet.name },
      cta: { href: `/portal/pos?pos=${posId}`, label: "Open outlet" },
      affected: [posId],
      evidence: {
        formula: "every listed client SKU out of stock at one outlet",
        table: {
          columns: ["SKU", "State", "Facings when stocked"],
          rows: own.map((c) => [
            ctx.skuById.get(c.skuId)?.name ?? c.skuId,
            "Out of stock",
            ctx.view.gaps.find((g) => g.posId === posId && g.skuId === c.skuId)?.normalFacings ?? 0,
          ]),
        },
      },
      entities: { posId, cityId: outlet.cityId, channel: outlet.channel, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   R11 · range short of the format's own norm

   How many client SKUs an outlet lists against the median for its own
   channel. R3 asks "where is this SKU missing across the market";
   this asks "which doors carry a thinner range than their format
   normally does" — the same idea rotated, and the one a rep can sell
   against on the next visit.
================================================================== */
function r11AssortmentGap(ctx: Ctx): RawInsight[] {
  const listed = new Map<string, number>();
  for (const [posId, cells] of ctx.cellsByPos) {
    listed.set(posId, cells.filter(isClient).length);
  }
  const byChannel = new Map<string, number[]>();
  for (const [posId, n] of listed) {
    const ch = ctx.posById.get(posId)?.channel;
    if (ch) byChannel.set(ch, [...(byChannel.get(ch) ?? []), n]);
  }
  const medians = new Map([...byChannel].map(([ch, v]) => [ch, median(v)]));

  const out: RawInsight[] = [];
  for (const [posId, n] of listed) {
    const outlet = ctx.posById.get(posId);
    if (!outlet) continue;
    const norm = medians.get(outlet.channel) ?? 0;
    const short = Math.round(norm - n);
    if (short < THRESHOLDS.r11AssortmentGap.warningCount) continue;

    out.push({
      id: `r11-${posId}`,
      rule: "r11-assortment-gap",
      category: "opportunity",
      severity:
        short >= THRESHOLDS.r11AssortmentGap.criticalCount ? "critical" : "warning",
      headline: `${outlet.name} carries ${short} fewer ${clientBrand.name} SKUs than its format`,
      detail: `${outlet.name} lists ${n} ${clientBrand.name} SKUs against a median of ${norm} across audited ${channelName(outlet.channel)} outlets — range to sell in, not stock to chase.`,
      impact: { value: short, unit: "outlets", label: `${short} SKUs of headroom` },
      confidence: "estimated",
      scope: { outlets: 1, label: outlet.name },
      cta: { href: `/portal/pos?pos=${posId}`, label: "Open outlet" },
      affected: [posId],
      evidence: {
        formula: "channel median client SKUs listed − this outlet's client SKUs listed",
        table: {
          columns: ["Scope", "Client SKUs listed"],
          rows: [
            [outlet.name, n],
            [`${channelName(outlet.channel)} median`, norm],
          ],
        },
      },
      entities: { posId, cityId: outlet.cityId, channel: outlet.channel, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   R13 · stocking the brand with nothing to say about it

   Outlets that have the client on shelf and carry no point-of-sale
   material at all. The brief names this one directly, and it is the
   cheapest gap in the file to close: the product is already there,
   the relationship already exists, and a rep with a boot full of
   material fixes it in one visit.
================================================================== */
function r13PosmAbsent(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const stocking = new Set(
    view.cells.filter((c) => isClient(c) && c.state === "in-stock").map((c) => c.posId)
  );
  const byPos = new Map<string, { n: number; present: number }>();
  for (const row of view.posm) {
    const held = byPos.get(row.posId) ?? { n: 0, present: 0 };
    held.n += 1;
    held.present += row.present ? 1 : 0;
    byPos.set(row.posId, held);
  }

  const bare = [...byPos]
    .filter(([posId, v]) => stocking.has(posId) && v.present === 0)
    .map(([posId]) => posId);
  if (bare.length < THRESHOLDS.r13PosmAbsent.warningCount) return [];

  const cityCounts = new Map<string, number>();
  for (const posId of bare) {
    const city = ctx.posById.get(posId)?.cityId;
    if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }
  const ranked = [...cityCounts].sort((a, b) => b[1] - a[1]);

  return [
    {
      id: "r13-posm-absent",
      rule: "r13-posm-absent",
      category: "execution-gap",
      severity:
        bare.length >= THRESHOLDS.r13PosmAbsent.criticalCount ? "critical" : "warning",
      headline: `${clientBrand.name} is on shelf in ${bare.length} outlets with no POSM at all`,
      detail: `${bare.length} audited outlets stock ${clientBrand.name} and carry none of the agreed point-of-sale material — the product is present and unsupported.`,
      impact: { value: bare.length, unit: "outlets", label: `${bare.length} outlets with zero POSM` },
      confidence: "measured",
      scope: { outlets: bare.length, label: "outlets stocking the client" },
      cta: { href: "/portal/performance?tab=posm", label: "See POSM" },
      affected: bare,
      evidence: {
        formula: "outlets with client stock in place and zero POSM types present",
        table: {
          columns: ["City", "Outlets stocking the client with no POSM"],
          rows: ranked.map(([city, n]) => [cityName(city), n]),
        },
      },
      entities: { brandId: clientBrand.id },
    },
  ];
}

/* ==================================================================
   R14 · competitor movement

   Judged over the six-month window, never month to month.

   Every observed month-over-month city movement in this panel is
   between 0.1 and 2.1 share points, while the bootstrapped detection
   floor for a single city runs 3.1pt (Baghdad) to 5.6pt (Karbala). A
   monthly competitor card would therefore be a random number
   generator with an arrow on it. Over the half the movement is real
   and the rule reports exactly that, with the window and the floor on
   the card so nobody mistakes one for the other.
================================================================== */
function r14CompetitorMovement(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const cityIds = view.filters.cities.length
    ? view.filters.cities
    : Object.keys(trends.byCity);

  const out: RawInsight[] = [];
  for (const cityId of cityIds) {
    const points = trends.byCity[cityId];
    if (!points || points.length < 2) continue;
    const first = points[0];
    const last = points[points.length - 1];
    const floor = SHARE_FLOOR_PT[cityId] ?? SHARE_FLOOR_PT.market;

    const moves = brands
      .map((b) => ({
        brand: b,
        delta: r1((last.brandShare[b.id] ?? 0) - (first.brandShare[b.id] ?? 0)),
      }))
      .sort((a, b) => b.delta - a.delta);

    const gainer = moves[0];
    if (!gainer || gainer.delta < floor) continue;
    if (portfolioBrands.some((b) => b.id === gainer.brand.id)) continue;

    const clientMove = moves.find((m) => m.brand.id === clientBrand.id);
    const outlets = view.outlets.filter((p) => p.cityId === cityId).length;

    out.push({
      id: `r14-${cityId}`,
      rule: "r14-competitor-movement",
      category: "competitor",
      severity: gainer.delta >= floor * 1.5 ? "critical" : "warning",
      headline: `${gainer.brand.name} has gained ${gainer.delta}pt of shelf in ${cityName(cityId)}`,
      detail: `Across ${monthLabel(first.month)} to ${monthLabel(last.month)}, ${gainer.brand.name} moved from ${first.brandShare[gainer.brand.id]}% to ${last.brandShare[gainer.brand.id]}% of ${cityName(cityId)} shelf${
        clientMove ? `, while ${clientBrand.name} moved ${clientMove.delta > 0 ? "+" : ""}${clientMove.delta}pt` : ""
      }. The city's detection floor is ${floor}pt, so this movement is larger than the panel's own noise.`,
      impact: { value: gainer.delta, unit: "outlets", label: `${gainer.delta}pt of city shelf` },
      confidence: "measured",
      scope: { outlets: Math.max(1, outlets), label: cityName(cityId) },
      cta: { href: `/portal/competition?city=${cityId}`, label: "Open competition" },
      affected: view.outlets.filter((p) => p.cityId === cityId).map((p) => p.id),
      evidence: {
        formula: `share now − share six months ago, per brand, reported only above the city's ${floor}pt detection floor (MDE = 2.8 × bootstrapped SE)`,
        table: {
          columns: ["Brand", monthLabel(first.month), monthLabel(last.month), "Change"],
          rows: moves.map((m) => [
            m.brand.name,
            `${first.brandShare[m.brand.id] ?? 0}%`,
            `${last.brandShare[m.brand.id] ?? 0}%`,
            `${m.delta > 0 ? "+" : ""}${m.delta}pt`,
          ]),
        },
      },
      entities: { brandId: gainer.brand.id, cityId },
    });
  }
  return out;
}

/* ==================================================================
   R15 · one SKU failing across the market

   The market-wide counterpart to R1: not "this outlet has gaps" but
   "this line is empty everywhere". Counted only where the SKU is
   actually listed, so a SKU nobody stocks cannot look like a SKU
   everybody has run out of — those are opposite problems with
   opposite fixes.
================================================================== */
function r15SkuStockout(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const out: RawInsight[] = [];

  for (const skuId of clientSkuIds(view)) {
    const rows = view.cells.filter((c) => c.skuId === skuId);
    const empty = rows.filter((c) => c.state === "out-of-stock");
    if (empty.length < THRESHOLDS.r15SkuStockout.warningOutlets) continue;

    const sku = ctx.skuById.get(skuId);
    if (!sku) continue;
    const rate = pct(empty.length, rows.length);
    const lost =
      view.gaps.filter((g) => g.skuId === skuId).reduce((s, g) => s + g.normalFacings, 0) *
      REVISIT_DAYS;

    const cityCounts = new Map<string, number>();
    for (const c of empty) {
      const city = ctx.posById.get(c.posId)?.cityId;
      if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    }

    out.push({
      id: `r15-${skuId}`,
      rule: "r15-sku-stockout",
      category: "critical",
      severity:
        empty.length >= THRESHOLDS.r15SkuStockout.criticalOutlets ? "critical" : "warning",
      headline: `${sku.name} is out of stock in ${empty.length} audited outlets`,
      detail: `${sku.name} is listed in ${rows.length} audited outlets and empty in ${empty.length} of them — ${rate}% of its own distribution standing idle.`,
      impact: {
        value: lost,
        unit: "facing-days",
        label: `${lost.toLocaleString()} facing-days lost`,
      },
      confidence: "measured",
      scope: { outlets: empty.length, label: "outlets listing this SKU" },
      cta: { href: `/portal/pos?sku=${skuId}`, label: "See outlets" },
      affected: empty.map((c) => c.posId),
      evidence: {
        formula: "outlets where the SKU is listed and out of stock ÷ outlets listing it",
        table: {
          columns: ["City", "Outlets out of stock"],
          rows: [...cityCounts].sort((a, b) => b[1] - a[1]).map(([city, n]) => [cityName(city), n]),
        },
      },
      entities: { skuId, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ---------- entry point ---------- */

export function generateInsights(view: MarketView): InsightReport {
  const posById = new Map(view.outlets.map((p) => [p.id, p]));
  /* Every SKU the master list knows, not only the ones this filter
     touched — R3 has to see rival packs the brand filter excluded, or
     "behind its peers" has no peers to be behind. */
  const skuById = new Map<string, Sku>(skus.map((s) => [s.id, s]));

  const cellsByPos = new Map<string, Cell[]>();
  for (const cell of view.cells) {
    cellsByPos.set(cell.posId, [...(cellsByPos.get(cell.posId) ?? []), cell]);
  }

  const ctx: Ctx = { view, posById, cellsByPos, skuById };

  const all = [
    ...r1OutletGaps(ctx),
    ...r2DistrictDeficit(ctx),
    ...r3DistributionGap(ctx),
    ...r4RivalSubstitution(ctx),
    ...r5PriceCluster(ctx),
    ...r6ChannelGap(ctx),
    ...r7ShelfPosition(ctx),
    ...r9DarkOutlets(ctx),
    ...r11AssortmentGap(ctx),
    ...r13PosmAbsent(ctx),
    ...r14CompetitorMovement(ctx),
    ...r15SkuStockout(ctx),
  ]
    /* The two derived fields, filled once. Concentration answers "and
       where is this?" without any rule needing to know about cities;
       money converts facing-days and REFUSES to convert anything else,
       because a dinar figure for "three mispriced lines" would be
       invented rather than modelled. */
    .map((raw): Insight => {
      const counts = new Map<string, number>();
      for (const posId of raw.affected) {
        const cityId = posById.get(posId)?.cityId;
        if (cityId) counts.set(cityId, (counts.get(cityId) ?? 0) + 1);
      }
      const top = [...counts].sort((a, b) => b[1] - a[1])[0];
      return {
        ...raw,
        concentration: top
          ? { cityId: top[0], outlets: top[1], share: pct(top[1], raw.affected.length) }
          : undefined,
        money:
          raw.impact.unit === "facing-days" && raw.monetisable !== false
            ? moneyOf(raw.impact.value)
            : null,
      };
    })
    /* A finding whose impact rounds to nothing is not a finding. */
    .filter((i) => i.impact.value > 0)
    .sort((a, b) => {
      const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      return sev !== 0 ? sev : byRank(a, b);
    });

  const byCategory = {
    critical: all.filter((i) => i.category === "critical"),
    opportunity: all.filter((i) => i.category === "opportunity"),
    "execution-gap": all.filter((i) => i.category === "execution-gap"),
    competitor: all.filter((i) => i.category === "competitor"),
  } as Record<Category, Insight[]>;

  /* One card per category, so the dashboard cannot fill with five
     variations of the same stockout. Any remaining slot goes to the
     highest-ranked finding from a rule not already on the board —
     "next by rank" would just print a second outlet with the same
     three empty facings, which tells the reader nothing new. */
  const picked = (Object.keys(byCategory) as Category[])
    .map((c) => byCategory[c][0])
    .filter(Boolean);
  const usedRules = new Set(picked.map((i) => i.rule));
  const spare: Insight[] = [];
  for (const insight of all) {
    if (spare.length >= 5 - picked.length) break;
    if (usedRules.has(insight.rule)) continue;
    usedRules.add(insight.rule);
    spare.push(insight);
  }
  const headlines = [...picked, ...spare].slice(0, 5);

  return { all, byCategory, headlines };
}
