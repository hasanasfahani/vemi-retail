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
  brands, channelName, governorateName, clientBrand, monthLabel, portfolioBrands, skuOf,
  skus, trends,
} from "./index";
import { moneyOf } from "./economics";
import { getTargets } from "./settings";
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
  | "r15-sku-stockout"
  /* Conjunctions — two conditions that co-occur where they should not.
     Numbered apart from the single-condition rules because they are a
     different kind of claim and are tested differently: a lift check
     rather than a threshold. */
  | "c1-stocked-not-shown"
  | "c2-core-range-missing"
  /* Competitive standing — what a rival HOLDS, where R14 reports what
     a rival has MOVED. */
  | "r16-share-gap"
  | "r17-promo-gap"
  /* Not detected here. A follow-up result is a fact about a REQUEST,
     not about the current panel, so it is built where the requests
     live — see verifyImpact.ts. The id is declared here so a stored
     rule name still resolves and the classification map stays total. */
  | "v1-follow-up-result";

/* Exported so anything holding a stored rule name — an action created
   cycles ago — can tell "this finding is gone" from "this rule is
   gone". */
export const RULE_IDS: RuleId[] = [
  "r1-outlet-gaps", "r2-district-deficit", "r3-distribution-gap",
  "r4-rival-substitution", "r5-price-cluster", "r6-channel-gap",
  "r7-shelf-position", "r9-dark-outlet", "r11-assortment-gap",
  "r13-posm-absent", "r14-competitor-movement", "r15-sku-stockout",
  "c1-stocked-not-shown", "c2-core-range-missing",
  "r16-share-gap", "r17-promo-gap", "v1-follow-up-result",
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
     to know about governorates to say where its problem lives. */
  affected: string[];
  /* Derived at the entry point, never by a rule. */
  concentration?: { governorateId: string; outlets: number; share: number };
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
    governorateId?: string;
    district?: string;
    channel?: string;
  };
};

/* What a rule returns. The two derived fields are filled in once, at
   the entry point, so a rule never has to know about governorates or money
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
     Baghdad and 4.6–5.6pt in the smaller governorates, while every observed
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

  /* ---------- conjunctions ----------

     A conjunction is not a gap against a target; it is two conditions
     found together in the same door. So it is not judged by a
     threshold on a rate, and the detection floors do not apply
     either — those govern COMPARISONS between periods or cohorts, and
     a conjunction is a COUNT.

     It gets its own test, in two parts.

     MIN_OUTLETS is the floor below which the count describes a
     handful of doors rather than a pattern.

     LIFT is the part that matters. The interesting claim is not "37
     outlets are like this" — with 742 doors, 37 of almost anything is
     arithmetic. It is "these two conditions occur together MORE than
     they would if they were unrelated." Expected co-occurrence is
     n × P(A) × P(B); lift is observed ÷ expected. At lift 1.0 the
     conjunction is telling you nothing you could not have got by
     multiplying two numbers from the dashboard. */
  conjunction: { minOutlets: 12, minLift: 1.25, criticalOutlets: 40 },

  /* WHAT THE LIFT TEST FOUND, AND WHY C1 IS SILENT.

     C1 looks for the conjunction the brief leads with: doors that stock
     the client well and still give it little shelf. The count is large —
     166 outlets at three quarters of par, 296 at full par — and on a
     card it would read as a discovery.

     It is not one. Across 737 audited outlets, 445 hold the client at
     or above the 95% availability target and 284 sit under three
     quarters of the shelf par; if those two facts were unrelated you
     would expect 171.5 doors to show both, and 166 do. Lift 1.00. The
     same at 34% (214 observed, 222.8 expected) and at 40% (296 against
     296.5). Availability and shelf share are independent in this
     market, so every one of those 166 doors is arithmetic a reader
     could have done from two dashboard tiles.

     The rule is kept, silent, for the same reason R7 is kept: a
     calibrated detector that reports nothing is a finding about the
     market, and deleting it would mean re-deriving this next quarter. */

  /* A SKU belongs to the client's CORE RANGE when it is listed in at
     least this share of audited outlets. Nothing in the dataset names a
     contracted range, so inventing one would be dishonest; what can be
     measured is which lines the brand evidently sells broadly.

     Observed listing rates across the 742-outlet panel: 1L PET 70.5%,
     500ml PET 69.7%, 250ml Can 68.9%, 330ml Can 67.5%, 2.25L PET 60.0%,
     Pepsi Zero 330ml 41.5%. The range clusters tightly between 60 and
     71 with one clear outlier below, so the bar is set at 60 — five
     lines in, the tail line out. A 70 bar would have admitted a single
     SKU and left nothing for it to be missing alongside. */
  coreRangeListedPct: 60,

  /* A governorate where the leading rival holds more of the fixture
     than the client. Judged against that governorate's own bootstrapped
     detection floor — 3.09pt in Baghdad, 5.57pt in Karbala — so a gap
     is only reported where the panel there could have seen it.
     `minOutlets` keeps a governorate the filter has thinned to a
     handful of doors from producing a share figure at all. */
  r16ShareGap: { minOutlets: 20, criticalPt: 12 },

  /* Promotion presence, client against the leading rival, counted in
     outlets rather than facings. Carries the same 5pt outlet-coverage
     floor competition.ts uses for promotion movement: roughly one
     outlet in twenty, comfortably outside month-to-month wobble. */
  r17PromoGap: { floorPt: 5, criticalPt: 15 },
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

/* Headlines are built from counts, and counts reach 1 as soon as a
   filter narrows the panel. "1 outlets" in a card that exists to be
   trusted with numbers is a small error that reads as a large one. */
export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

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
        governorateId: outlet.governorateId,
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
  const byGovernorate = new Map<string, Cell[]>();
  const byDistrict = new Map<string, Cell[]>();

  for (const cell of view.cells) {
    const outlet = ctx.posById.get(cell.posId);
    if (!outlet) continue;
    const dk = `${outlet.governorateId}|${outlet.district}`;
    byGovernorate.set(outlet.governorateId, [...(byGovernorate.get(outlet.governorateId) ?? []), cell]);
    byDistrict.set(dk, [...(byDistrict.get(dk) ?? []), cell]);
  }

  const out: RawInsight[] = [];
  for (const [dk, cells] of byDistrict) {
    const [governorateId, district] = dk.split("|");
    const outlets = new Set(cells.map((c) => c.posId));
    if (outlets.size < THRESHOLDS.r2DistrictDeficit.minOutlets) continue;

    const governorateShare = shareOf(byGovernorate.get(governorateId) ?? []);
    const districtShare = shareOf(cells);
    const deficit = r1(governorateShare - districtShare);
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
      detail: `${district} gives ${clientBrand.name} ${districtShare}% of shelf against ${governorateShare}% across ${governorateName(governorateId)} — ${outlets.size} audited outlets holding less than the city they sit in.`,
      impact: {
        value: short * REVISIT_DAYS,
        unit: "facing-days",
        label: `${(short * REVISIT_DAYS).toLocaleString()} facing-days below city par`,
      },
      confidence: "estimated",
      scope: { outlets: outlets.size, label: `${district}, ${governorateName(governorateId)}` },
      cta: { href: `/portal/pos?governorate=${governorateId}`, label: "See outlets" },
      affected: [...outlets],
      evidence: {
        formula:
          "(city client share − district client share) × district facings × 30 days",
        table: {
          columns: ["Area", "Client share", "Audited outlets", "Facings"],
          rows: [
            [district, `${districtShare}%`, outlets.size, facingsOf(cells)],
            [
              governorateName(governorateId),
              `${governorateShare}%`,
              new Set((byGovernorate.get(governorateId) ?? []).map((c) => c.posId)).size,
              facingsOf(byGovernorate.get(governorateId) ?? []),
            ],
          ],
        },
      },
      entities: { governorateId, district, brandId: clientBrand.id },
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
      entities: { posId, governorateId: outlet.governorateId, channel: outlet.channel, brandId: clientBrand.id },
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
      entities: { posId, governorateId: outlet.governorateId, channel: outlet.channel, brandId: clientBrand.id },
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
      entities: { posId, governorateId: outlet.governorateId, channel: outlet.channel, brandId: clientBrand.id },
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

  const governorateCounts = new Map<string, number>();
  for (const posId of bare) {
    const city = ctx.posById.get(posId)?.governorateId;
    if (city) governorateCounts.set(city, (governorateCounts.get(city) ?? 0) + 1);
  }
  const ranked = [...governorateCounts].sort((a, b) => b[1] - a[1]);

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
          columns: ["Governorate", "Outlets stocking the client with no POSM"],
          rows: ranked.map(([city, n]) => [governorateName(city), n]),
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
  const cityIds = view.filters.governorates.length
    ? view.filters.governorates
    : Object.keys(trends.byGovernorate);

  const out: RawInsight[] = [];
  for (const governorateId of cityIds) {
    const series = trends.byGovernorate[governorateId];
    if (!series) continue;
    /* The trend file runs past the month being viewed — October and
       November exist so the follow-up cycles have somewhere to land.
       Taking its last point would have this rule report November
       movement inside a September finding, which is not a forecast, it
       is a mistake. The window ENDS at the month in hand and reaches
       back from there. */
    const points = series.filter((p) => p.month <= view.month);
    if (points.length < 2) continue;
    const last = points[points.length - 1];
    const first = points[Math.max(0, points.length - THRESHOLDS.r14Movement.windowMonths)];
    const floor = SHARE_FLOOR_PT[governorateId] ?? SHARE_FLOOR_PT.market;

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
    const outlets = view.outlets.filter((p) => p.governorateId === governorateId).length;

    out.push({
      id: `r14-${governorateId}`,
      rule: "r14-competitor-movement",
      category: "competitor",
      severity: gainer.delta >= floor * 1.5 ? "critical" : "warning",
      headline: `${gainer.brand.name} has gained ${gainer.delta}pt of shelf in ${governorateName(governorateId)}`,
      detail: `Across ${monthLabel(first.month)} to ${monthLabel(last.month)}, ${gainer.brand.name} moved from ${first.brandShare[gainer.brand.id]}% to ${last.brandShare[gainer.brand.id]}% of ${governorateName(governorateId)} shelf${
        clientMove ? `, while ${clientBrand.name} moved ${clientMove.delta > 0 ? "+" : ""}${clientMove.delta}pt` : ""
      }. The city's detection floor is ${floor}pt, so this movement is larger than the panel's own noise.`,
      impact: { value: gainer.delta, unit: "outlets", label: `${gainer.delta}pt of city shelf` },
      confidence: "measured",
      scope: { outlets: Math.max(1, outlets), label: governorateName(governorateId) },
      cta: { href: `/portal/competition?governorate=${governorateId}`, label: "Open competition" },
      affected: view.outlets.filter((p) => p.governorateId === governorateId).map((p) => p.id),
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
      entities: { brandId: gainer.brand.id, governorateId },
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

    const governorateCounts = new Map<string, number>();
    for (const c of empty) {
      const city = ctx.posById.get(c.posId)?.governorateId;
      if (city) governorateCounts.set(city, (governorateCounts.get(city) ?? 0) + 1);
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
          columns: ["Governorate", "Outlets out of stock"],
          rows: [...governorateCounts].sort((a, b) => b[1] - a[1]).map(([city, n]) => [governorateName(city), n]),
        },
      },
      entities: { skuId, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ---------- entry point ---------- */




/* ==================================================================
   R16 · the fixture gap, city by city

   Where R14 reports what a rival has MOVED over six months, this
   reports what a rival HOLDS today. Both are measured against the
   governorate's own bootstrapped detection floor, because a 3pt gap in
   Baghdad and a 3pt gap in Karbala are not the same claim: Baghdad
   contributes enough doors to see one, Karbala does not.

   The benchmark is a rival brand rather than the contracted par, and
   that is what puts it under Respond to competition rather than Win
   the shelf. Same measurement, different yardstick, and the yardstick
   decides.
================================================================== */
function r16ShareGap(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const byGovernorate = new Map<string, Cell[]>();
  const outletsIn = new Map<string, Set<string>>();
  for (const cell of view.cells) {
    const outlet = ctx.posById.get(cell.posId);
    if (!outlet) continue;
    const g = outlet.governorateId;
    byGovernorate.set(g, [...(byGovernorate.get(g) ?? []), cell]);
    outletsIn.set(g, (outletsIn.get(g) ?? new Set()).add(cell.posId));
  }

  const out: RawInsight[] = [];
  for (const [governorateId, cells] of byGovernorate) {
    const doors = outletsIn.get(governorateId)?.size ?? 0;
    if (doors < THRESHOLDS.r16ShareGap.minOutlets) continue;

    const stocked = cells.filter((c) => c.state === "in-stock");
    const total = facingsOf(stocked);
    if (total === 0) continue;

    const byBrand = new Map<string, number>();
    for (const cell of stocked) {
      const brandId = ctx.skuById.get(cell.skuId)?.brandId;
      if (brandId) byBrand.set(brandId, (byBrand.get(brandId) ?? 0) + cell.facings);
    }
    const mine = pct(byBrand.get(clientBrand.id) ?? 0, total);
    const rivals = [...byBrand]
      .filter(([id]) => !portfolioBrands.some((b) => b.id === id))
      .map(([id, f]) => ({ id, share: pct(f, total) }))
      .sort((a, b) => b.share - a.share);

    const leader = rivals[0];
    if (!leader) continue;
    const gap = r1(leader.share - mine);
    const floor = SHARE_FLOOR_PT[governorateId] ?? SHARE_FLOOR_PT.market;
    if (gap < floor) continue;

    const rival = brands.find((b) => b.id === leader.id);
    out.push({
      id: `r16-${governorateId}`,
      rule: "r16-share-gap",
      category: "competitor",
      severity: gap >= THRESHOLDS.r16ShareGap.criticalPt ? "critical" : "warning",
      headline: `${rival?.name ?? leader.id} holds ${gap}pt more ${governorateName(governorateId)} shelf than ${clientBrand.name}`,
      detail: `Across ${doors} audited ${governorateName(governorateId)} outlets, ${rival?.name ?? leader.id} takes ${leader.share}% of the measured fixture against ${clientBrand.name} at ${mine}%. The city's detection floor is ${floor}pt, so the gap is wider than what this panel could mistake for noise.`,
      impact: { value: gap, unit: "outlets", label: `${gap}pt of city shelf` },
      confidence: "measured",
      scope: { outlets: doors, label: governorateName(governorateId) },
      cta: { href: `/portal/competition?governorate=${governorateId}`, label: "Open competition" },
      affected: [...(outletsIn.get(governorateId) ?? [])],
      evidence: {
        formula: `leading rival's share of measured facings − client's, within the governorate, reported only above its ${floor}pt detection floor`,
        table: {
          columns: ["Brand", "Share of fixture"],
          rows: [
            [rival?.name ?? leader.id, `${leader.share}%`],
            [clientBrand.name, `${mine}%`],
            ["Gap", `${gap}pt`],
          ],
        },
      },
      entities: { brandId: leader.id, governorateId },
    });
  }
  return out;
}

/* ==================================================================
   R17 · who is running promotions

   Counted in DOORS, not in facings: a promotion is either observed at
   an outlet or it is not, and converting that to a share of shelf
   would be inventing a denominator. The client's coverage against the
   rival running the most.
================================================================== */
function r17PromoGap(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const doors = new Set(view.cells.map((c) => c.posId)).size;
  if (doors === 0) return [];

  const byBrand = new Map<string, Set<string>>();
  for (const row of view.promos) {
    byBrand.set(row.brandId, (byBrand.get(row.brandId) ?? new Set()).add(row.posId));
  }

  const mine = pct(byBrand.get(clientBrand.id)?.size ?? 0, doors);
  const rivals = [...byBrand]
    .filter(([id]) => !portfolioBrands.some((b) => b.id === id))
    .map(([id, set]) => ({ id, cover: pct(set.size, doors) }))
    .sort((a, b) => b.cover - a.cover);

  const leader = rivals[0];
  if (!leader) return [];
  const gap = r1(leader.cover - mine);
  if (gap < THRESHOLDS.r17PromoGap.floorPt) return [];

  const rival = brands.find((b) => b.id === leader.id);
  return [
    {
      id: "r17-promo-gap",
      rule: "r17-promo-gap",
      category: "competitor",
      severity: gap >= THRESHOLDS.r17PromoGap.criticalPt ? "critical" : "warning",
      headline: `${rival?.name ?? leader.id} is promoting in ${gap}pt more outlets than ${clientBrand.name}`,
      detail: `${rival?.name ?? leader.id} was observed running a promotion in ${leader.cover}% of the ${doors} audited outlets against ${clientBrand.name} at ${mine}%.`,
      impact: { value: gap, unit: "outlets", label: `${gap}pt of outlet coverage` },
      confidence: "measured",
      scope: { outlets: doors, label: `${doors} audited outlets` },
      cta: { href: "/portal/competition", label: "Open competition" },
      affected: [...(byBrand.get(leader.id) ?? [])],
      evidence: {
        formula: `outlets where the brand was observed promoting ÷ audited outlets, client subtracted from the leading rival; floor ${THRESHOLDS.r17PromoGap.floorPt}pt of outlet coverage`,
        table: {
          columns: ["Brand", "Outlets promoting"],
          rows: [
            [rival?.name ?? leader.id, `${leader.cover}%`],
            [clientBrand.name, `${mine}%`],
            ["Gap", `${gap}pt`],
          ],
        },
      },
      entities: { brandId: leader.id },
    },
  ];
}

/* ==================================================================
   CONJUNCTIONS

   The two conditions a reader would otherwise have to notice
   themselves by holding one chart next to another. Everything else in
   this file measures one thing against one yardstick; these measure
   two things against each other, in the same door.

   Both are lift-tested. See THRESHOLDS.conjunction for why a count
   alone is not a finding.
================================================================== */

/* Observed ÷ expected-if-unrelated. 1.0 means the two conditions are
   independent and the conjunction is telling the reader nothing they
   could not have multiplied for themselves. */
function liftOf(both: number, a: number, b: number, n: number): number {
  if (n === 0 || a === 0 || b === 0) return 0;
  const expected = (a / n) * (b / n) * n;
  return expected === 0 ? 0 : r1(both / expected);
}

/* ------------------------------------------------------------------
   C1 · stocked, but not shown

   Outlets holding the client at or above the availability target while
   holding well under its share of the fixture. The product is THERE.
   Nobody has to be persuaded to list it, nobody has to chase a
   delivery — the argument is about centimetres, and it is the one
   conversation a rep can have on the next visit without anyone's
   permission.

   The pair is worth stating precisely because it is counter-intuitive:
   availability and shelf share normally move together, so doors where
   they come apart are not what a reader would have guessed from either
   number on its own.
------------------------------------------------------------------ */
function c1StockedNotShown(ctx: Ctx): RawInsight[] {
  const targets = getTargets();
  /* Well under, not merely under: at three quarters of par the gap is
     wider than the ordinary spread between doors. */
  const shareBar = r1(targets.shelfShare * 0.75);

  const rows: { posId: string; availability: number; share: number }[] = [];
  for (const [posId, cells] of ctx.cellsByPos) {
    const own = cells.filter(isClient);
    if (own.length === 0) continue;
    const availability = pct(own.filter((c) => c.state === "in-stock").length, own.length);
    const total = facingsOf(cells);
    if (total === 0) continue;
    rows.push({ posId, availability, share: shareOf(cells) });
  }
  if (rows.length === 0) return [];

  const strong = rows.filter((r) => r.availability >= targets.availability);
  const thin = rows.filter((r) => r.share < shareBar);
  const both = rows.filter((r) => r.availability >= targets.availability && r.share < shareBar);

  const lift = liftOf(both.length, strong.length, thin.length, rows.length);
  if (both.length < THRESHOLDS.conjunction.minOutlets) return [];
  if (lift < THRESHOLDS.conjunction.minLift) return [];

  const avgShare = r1(both.reduce((s, r) => s + r.share, 0) / both.length);
  const avgAvail = r1(both.reduce((s, r) => s + r.availability, 0) / both.length);
  const worst = [...both].sort((a, b) => a.share - b.share).slice(0, 10);

  return [
    {
      id: "c1-stocked-not-shown",
      rule: "c1-stocked-not-shown",
      category: "opportunity",
      severity:
        both.length >= THRESHOLDS.conjunction.criticalOutlets ? "critical" : "warning",
      headline: `${plural(both.length, "outlet")} stock${both.length === 1 ? "s" : ""} ${clientBrand.name} well and still give${both.length === 1 ? "s" : ""} it ${avgShare}% of the shelf`,
      detail: `${both.length} audited outlets hold ${clientBrand.name} at ${avgAvail}% availability — at or above the ${targets.availability}% target — while giving it ${avgShare}% of their fixture against a ${targets.shelfShare}% par. The listing is won and the delivery is arriving; what is missing is space.`,
      impact: { value: both.length, unit: "outlets", label: `${both.length} outlets with space to argue for` },
      confidence: "measured",
      scope: { outlets: both.length, label: `${both.length} audited outlets` },
      cta: { href: "/portal/pos", label: "Open POS explorer" },
      affected: both.map((r) => r.posId),
      evidence: {
        formula: `outlets with client availability ≥ ${targets.availability}% AND client shelf share < ${shareBar}% (three quarters of the ${targets.shelfShare}% par); reported at lift ${lift}× over independent co-occurrence`,
        table: {
          columns: ["Outlet", "Availability", "Shelf share"],
          rows: worst.map((r) => [
            ctx.posById.get(r.posId)?.name ?? r.posId,
            `${r.availability}%`,
            `${r.share}%`,
          ]),
        },
      },
      entities: { brandId: clientBrand.id },
    },
  ];
}

/* ------------------------------------------------------------------
   C2 · a core line missing from doors that carry the rest

   For each line the brand evidently sells everywhere — listed in at
   least `coreRangeListedPct` of audited outlets — the doors that carry
   the REST of the range and not this one.

   The second half of that sentence is what makes it a conjunction
   rather than a distribution count. An outlet that carries nothing is
   a different problem, already told by R9; an outlet that carries four
   of five core lines has made a range decision about the fifth, and
   that decision is what a rep can reopen.
------------------------------------------------------------------ */
function c2CoreRangeMissing(ctx: Ctx): RawInsight[] {
  const { view } = ctx;
  const outletIds = [...ctx.cellsByPos.keys()];
  const panel = outletIds.length;
  if (panel === 0) return [];

  const clientSkus = [...clientSkuIds(view)];
  const listedAt = new Map<string, Set<string>>();
  for (const [posId, cells] of ctx.cellsByPos) {
    listedAt.set(posId, new Set(cells.filter(isClient).map((c) => c.skuId)));
  }

  const core = clientSkus.filter((skuId) => {
    const n = outletIds.filter((posId) => listedAt.get(posId)?.has(skuId)).length;
    return pct(n, panel) >= THRESHOLDS.coreRangeListedPct;
  });
  if (core.length < 2) return [];

  const out: RawInsight[] = [];
  for (const skuId of core) {
    const carriesRest = outletIds.filter((posId) => {
      const held = listedAt.get(posId);
      if (!held) return false;
      /* Carries the rest of the core: every other core line but this. */
      return core.every((other) => other === skuId || held.has(other));
    });
    const missing = carriesRest.filter((posId) => !listedAt.get(posId)?.has(skuId));

    const hasSku = outletIds.filter((posId) => listedAt.get(posId)?.has(skuId)).length;
    const lift = liftOf(missing.length, carriesRest.length, panel - hasSku, panel);
    if (missing.length < THRESHOLDS.conjunction.minOutlets) continue;
    if (lift < THRESHOLDS.conjunction.minLift) continue;

    const sku = ctx.skuById.get(skuId);
    const share = pct(missing.length, carriesRest.length);

    out.push({
      id: `c2-${skuId}`,
      rule: "c2-core-range-missing",
      category: "opportunity",
      severity:
        missing.length >= THRESHOLDS.conjunction.criticalOutlets ? "critical" : "warning",
      headline: `${sku?.name ?? skuId} is missing from ${plural(missing.length, "outlet")} that carr${missing.length === 1 ? "ies" : "y"} the rest of the range`,
      detail: `${missing.length} of the ${carriesRest.length} audited outlets stocking every other core ${clientBrand.name} line do not list ${sku?.name ?? skuId} — ${share}% of doors that have already said yes to the range.`,
      impact: { value: missing.length, unit: "outlets", label: `${missing.length} listings to win` },
      confidence: "measured",
      scope: { outlets: carriesRest.length, label: `${carriesRest.length} outlets carrying the core range` },
      cta: { href: `/portal/performance?kpi=assortment`, label: "Open assortment" },
      affected: missing,
      evidence: {
        formula: `client lines listed in ≥${THRESHOLDS.coreRangeListedPct}% of audited outlets form the core range; counted are outlets listing every core line except this one, at lift ${lift}× over independent co-occurrence`,
        table: {
          columns: ["Scope", "Outlets"],
          rows: [
            ["Carry every other core line", carriesRest.length],
            [`Of those, missing ${sku?.name ?? skuId}`, missing.length],
            ["Share", `${share}%`],
          ],
        },
      },
      entities: { skuId, brandId: clientBrand.id },
    });
  }
  return out;
}

/* ==================================================================
   ROLLUPS

   Four rules speak one outlet at a time — R1's empty facings, R5's
   mispriced lines, R9's dark doors, R11's thin range. Each is exactly
   right at that resolution: a rep works one outlet, and the card names
   the street.

   But a page cannot open with 123 street names. Ranked and chipped,
   R11 alone filled 57% of the Insights page with single doors, and the
   reader had no way to learn the one thing they most need first —
   HOW MANY doors, and is that a lot.

   So each of those rules also states its own market total. Same rule
   id, same phenomenon, one level wider, which is precisely what the
   decision layer's subsumption is built to fold: the market finding
   becomes the card, and the outlets become its breakdown. Nothing is
   discarded and no number is restated — the rollup sums what the
   instances already counted.
================================================================== */
function rollup(
  children: RawInsight[],
  spec: {
    rule: RuleId;
    category: Category;
    /* Outlet counts at which the market total becomes a warning and a
       critical finding. Stated per rule, from the same observed panel
       the per-outlet thresholds were argued against. */
    warningOutlets: number;
    criticalOutlets: number;
    headline: (outlets: number) => string;
    detail: (outlets: number, impact: number) => string;
    impactLabel: (value: number) => string;
    formula: string;
    /* What the breakdown table shows per outlet. */
    column: string;
    valueOf: (child: RawInsight) => string | number;
  }
): RawInsight[] {
  if (children.length < spec.warningOutlets) return [];

  const affected = [...new Set(children.flatMap((c) => c.affected))];
  const impact = children.reduce((s, c) => s + c.impact.value, 0);
  /* A total is only as directly observed as its weakest part. */
  const confidence = children.some((c) => c.confidence === "estimated")
    ? "estimated"
    : "measured";

  /* A rollup must never soften what its instances say. R9's doors are
     a binary fact — the outlet lists the client and has none of it —
     so every instance is critical, and a market total calling four of
     them a warning would be the aggregate contradicting its own parts.

     The converse is NOT true and is deliberately not implemented: a
     handful of critical instances inside a large population does not
     make the population critical. R11 has 26 outlets three SKUs short
     among 123, and "123 outlets carry a thinner range" is a warning
     about a market, not an emergency. So the escalation only fires
     when the finding is critical in EVERY door it was found in. */
  const allCritical = children.every((c) => c.severity === "critical");

  const worst = [...children]
    .sort((a, b) => b.impact.value - a.impact.value)
    .slice(0, 10);

  return [
    {
      id: `${spec.rule}-market`,
      rule: spec.rule,
      category: spec.category,
      severity:
        allCritical || affected.length >= spec.criticalOutlets ? "critical" : "warning",
      headline: spec.headline(affected.length),
      detail: spec.detail(affected.length, impact),
      impact: {
        value: impact,
        unit: children[0].impact.unit,
        label: spec.impactLabel(impact),
      },
      confidence,
      scope: { outlets: affected.length, label: `${affected.length} audited outlets` },
      cta: { href: "/portal/pos", label: "Open POS explorer" },
      affected,
      evidence: {
        formula: spec.formula,
        table: {
          columns: ["Outlet", spec.column],
          rows: worst.map((c) => [c.scope.label, spec.valueOf(c)]),
        },
      },
      /* No posId and no governorate: this finding is about the market,
         and the decision layer reads the absence as the market axis. */
      entities: { brandId: clientBrand.id },
    },
  ];
}

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

  const gaps = r1OutletGaps(ctx);
  const prices = r5PriceCluster(ctx);
  const dark = r9DarkOutlets(ctx);
  const range = r11AssortmentGap(ctx);

  const all = [
    ...gaps,
    ...rollup(gaps, {
      rule: "r1-outlet-gaps",
      category: "critical",
      /* Observed: 51 outlets carry ≥2 client gaps, 4 carry ≥3. */
      warningOutlets: 20,
      criticalOutlets: 45,
      headline: (n) => `${plural(n, "outlet")} ${n === 1 ? "has" : "have"} two or more ${clientBrand.name} lines empty`,
      detail: (n, v) =>
        `${n} audited outlets were carrying at least two empty ${clientBrand.name} facings on the day they were visited — ${v.toLocaleString()} facing-days of agreed space earning nothing before the next cycle.`,
      impactLabel: (v) => `${v.toLocaleString()} facing-days until the next visit`,
      formula: "outlets with ≥2 empty client lines; facing-days summed across them",
      column: "Facing-days",
      valueOf: (c) => c.impact.value.toLocaleString(),
    }),
    ...r2DistrictDeficit(ctx),
    ...r3DistributionGap(ctx),
    ...r4RivalSubstitution(ctx),
    ...prices,
    ...rollup(prices, {
      rule: "r5-price-cluster",
      category: "execution-gap",
      /* Observed: 174 outlets carry ≥1 breach, 19 carry ≥2. */
      warningOutlets: 10,
      criticalOutlets: 25,
      headline: (n) => `${plural(n, "outlet")} ${n === 1 ? "is" : "are"} selling two or more ${clientBrand.name} lines off list`,
      detail: (n, v) =>
        `${n} audited outlets had at least two ${clientBrand.name} lines priced more than 5% away from list — ${v} readings in total.`,
      impactLabel: (v) => `${v} readings off list`,
      formula: "outlets with ≥2 client readings more than 5% from RRP",
      column: "Readings off list",
      valueOf: (c) => c.impact.value,
    }),
    ...r6ChannelGap(ctx),
    ...r7ShelfPosition(ctx),
    ...dark,
    ...rollup(dark, {
      rule: "r9-dark-outlet",
      category: "critical",
      /* Observed: 4 such outlets. Rare enough that two is a story. */
      warningOutlets: 2,
      criticalOutlets: 8,
      headline: (n) => `${plural(n, "outlet")} ${n === 1 ? "lists" : "list"} ${clientBrand.name} and stock${n === 1 ? "s" : ""} none of it`,
      detail: (n, v) =>
        `${n} audited outlets have a ${clientBrand.name} listing and had nothing on shelf at all — ${v.toLocaleString()} facing-days of a relationship that already exists.`,
      impactLabel: (v) => `${v.toLocaleString()} facing-days dark`,
      formula: "outlets listing the client with zero client facings in stock",
      column: "Facing-days",
      valueOf: (c) => c.impact.value.toLocaleString(),
    }),
    ...range,
    ...rollup(range, {
      rule: "r11-assortment-gap",
      category: "opportunity",
      /* Observed: 265 outlets sit ≥1 SKU short of their format, 118 sit
         ≥2 short. This is the largest single population in the file. */
      warningOutlets: 40,
      criticalOutlets: 100,
      headline: (n) => `${plural(n, "outlet")} carr${n === 1 ? "ies" : "y"} a thinner ${clientBrand.name} range than ${n === 1 ? "its" : "their"} format`,
      detail: (n, v) =>
        `${n} audited outlets list at least two ${clientBrand.name} SKUs fewer than the median for their own channel — ${v} listings of headroom in doors the brand already sells to.`,
      impactLabel: (v) => `${v} SKU listings of headroom`,
      formula: "outlets ≥2 client SKUs below their own channel's median listing count",
      column: "SKUs short",
      valueOf: (c) => c.impact.value,
    }),
    ...r13PosmAbsent(ctx),
    ...r14CompetitorMovement(ctx),
    ...r15SkuStockout(ctx),
    ...c1StockedNotShown(ctx),
    ...c2CoreRangeMissing(ctx),
    ...r16ShareGap(ctx),
    ...r17PromoGap(ctx),
  ]
    /* The two derived fields, filled once. Concentration answers "and
       where is this?" without any rule needing to know about governorates;
       money converts facing-days and REFUSES to convert anything else,
       because a dinar figure for "three mispriced lines" would be
       invented rather than modelled. */
    .map((raw): Insight => {
      const counts = new Map<string, number>();
      for (const posId of raw.affected) {
        const governorateId = posById.get(posId)?.governorateId;
        if (governorateId) counts.set(governorateId, (counts.get(governorateId) ?? 0) + 1);
      }
      const top = [...counts].sort((a, b) => b[1] - a[1])[0];
      return {
        ...raw,
        concentration: top
          ? { governorateId: top[0], outlets: top[1], share: pct(top[1], raw.affected.length) }
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
