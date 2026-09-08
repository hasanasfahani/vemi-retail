/* ============================================================
   THE DECISION LAYER — insight engine (Phase 8, expanded Phases 11–12).

   A pure function: FilteredView in, ranked findings out. No ML, no
   LLM — every insight is a stated formula over data already in the
   model, and every insight carries that formula and its source rows
   so a skeptical reader can check the arithmetic by hand.

   Presence problems (R1, R2, R3, R4, R6, R7, R9, R10, R11) all
   convert to the same currency — facing-days at risk, shelf space ×
   time. But
   raw total facing-days alone would let a diffuse, panel-wide rule (R7 spans
   every outlet in the city) always outrank a concentrated one (R1 is
   a single named store), just because the panel is bigger than the
   store. That is a real difference in urgency, not a rounding error,
   so the ranked list sorts by INTENSITY — impact ÷ the outlets that
   finding actually touches — not by raw impact. A problem confirmed
   at one store and costing 140 facing-days there (intensity 140) is a
   sharper, more immediately actionable finding than the same total
   cost smeared across 100 outlets (intensity ~1 each), even though
   the second number is bigger on paper. `impact.value` itself is
   never altered by this — the headline number stays the true total;
   only the sort key divides by scope, and scope is shown on the card,
   so nothing here is a hidden weighting.

   Pricing (R5) stays in its own currency (breaching readings) because
   forcing a price deviation into a facings number would be a
   conversion nobody could defend; its scope is always one outlet, so
   intensity there is just the raw count — no ranking change.
   Momentum (R8) is a single derived fact, not a ranked list — with
   two visits there is nothing to rank it against.

   THRESHOLDS below are calibrated against this dataset's own
   distributions (see the comment on each), not imported from a
   market this data doesn't describe. Change them here — nowhere else
   reads a magic number for these rules.

   Phase 11 added R9 (dark outlet: 0% client in-stock, deliberately
   excluding what R1 already fully explains) and R10 (a new-stockout
   cluster in one visit — the leading indicator before R1's two-visit
   confirmation). Phase 12 added R11 (assortment gap: an outlet's
   listed SKU count against its own channel's median — a range-
   selling problem, distinct from R3's citywide-per-SKU version of
   the same idea). All three deepen the engine itself rather than its
   delivery surfaces.
   ============================================================ */

import {
  coreTrend,
  posOf,
  skuOf,
  brandName,
  skuName,
  clientBrand,
  skus,
  pos as allPos,
} from "./portalData";
import { districtPoints, ERBIL_CITADEL, type DistrictPoint } from "./portal";
import { REVISIT_INTERVAL_DAYS } from "./portalData";
import type { FilteredView } from "./portalFilters";

/* When an outlet was actually seen. Under a rotating panel this is a
   property of the outlet, not the window, so every outlet-level finding
   states its own date rather than implying a shared audit day. */
function auditDateOf(view: FilteredView, posId: string): string {
  return view.auditedAt.get(posId) ?? "in this window";
}

export type Severity = "critical" | "warning" | "watch";
export type Trend = "worsening" | "new";

export type RuleId =
  | "r1-outlet-gaps"
  | "r2-district-deficit"
  | "r3-distribution-gap"
  | "r4-rival-substitution"
  | "r5-price-cluster"
  | "r6-channel-gap"
  | "r7-fixture-imbalance"
  | "r9-dark-outlet"
  | "r11-assortment-gap"
  | "r12-geographic-concentration";

/* The rules the engine currently has. Exported so anything holding a
   stored rule name — an action created cycles ago — can tell "this
   finding is gone" from "this rule is gone". */
export const RULE_IDS: RuleId[] = [
  "r1-outlet-gaps",
  "r2-district-deficit",
  "r3-distribution-gap",
  "r4-rival-substitution",
  "r5-price-cluster",
  "r6-channel-gap",
  "r7-fixture-imbalance",
  "r9-dark-outlet",
  "r11-assortment-gap",
  "r12-geographic-concentration",
];

export type EvidenceTable = { columns: string[]; rows: (string | number)[][] };

export type Insight = {
  id: string;
  rule: RuleId;
  severity: Severity;
  headline: string;
  detail: string;
  impact: { value: number; unit: "facing-days" | "readings"; label: string };
  /* "measured": impact.value is summed straight from recorded field
     observations (real daysOut, real readings). "estimated": impact
     is a formula's projection over a deficit that was never itself
     directly observed as an event (e.g. "this district's share gap,
     multiplied by the days between visits"). Both are honest, stated
     arithmetic — neither is invented — but they answer different
     questions, and a projection shouldn't be able to outrank a
     confirmed observation just because its formula produces a bigger
     number. The ranked list sorts measured findings first; shown on
     the card, never a hidden weighting. */
  confidence: "measured" | "estimated";
  /* How much of the panel this finding actually covers — the
     denominator the ranked list divides impact by. Shown on the card
     so the ranking rule is visible, not inferred. */
  scope: { outlets: number; label: string };
  trend: Trend;
  /* Some findings are natively a two-point comparison — a client share
     in one fixture against another, this visit against the last. Where
     that is true the rule states the pair here, so a chart can draw it
     without parsing prose or re-deriving numbers the rule already
     computed. Absent on rules whose shape is a ranking, not a pair. */
  pair?: {
    aLabel: string;
    bLabel: string;
    unit: string;
    rows: { id: string; label: string; a: number; b: number; emphasis?: boolean }[];
  };
  /* Findings about how much of a countable set is present — "carries 1
     of your 4 SKUs" — state the counts here so a meter can draw them
     without re-deriving what the rule already worked out. */
  meter?: { filled: number; total: number; benchmark?: number; unitLabel: string };
  evidence: { href: string; formula: string; table: EvidenceTable };
  entities: {
    brandId?: string;
    skuId?: string;
    posId?: string;
    area?: string;
    channel?: string;
  };
};

export type Momentum = {
  conceding: boolean;
  clientDelta: number;
  rivalBrandId: string | null;
  rivalDelta: number | null;
};

export type InsightReport = {
  presence: Insight[];
  pricing: Insight[];
  momentum: Momentum | null;
};

/* ------------------------------------------------------------------
   Every threshold below was set against the real generated dataset
   (node scripts/build-portal-data.mjs → 100 outlets, 2 visits), not
   picked round. The comment on each cites what was observed. Rerun
   the calibration whenever the panel size or category changes —
   these numbers are shaped by *this* market's variance, not a
   universal retail-audit standard.
   ------------------------------------------------------------------ */
export const THRESHOLDS = {
  /* Client SKUs listed but empty at one outlet, observed on the visit
     that found them.

     Recalibrated from facing-days to a COUNT, because the facing-day
     figure is now a forward projection with a constant interval —
     ranking on it would just be ranking on facings, and a threshold in
     that unit would drift every time the revisit interval changed. A
     count is what the auditor actually saw.

     Observed: 33 of 100 outlets carry at least one client gap, but only
     6 carry two or more, and 3 is the ceiling this dataset produces. A
     single gap is the norm here, not a signal. */
  r1OutletGaps: { warningCount: 2, criticalCount: 3 },

  /* District client-share deficit vs citywide share.
     Observed: 18 districts, worst deficit 5.4pt (Bakhtiari), p75≈3.2,
     p90≈3.9 — an 8pt bar (a plausible import from a bigger market)
     would never fire here; 100 outlets across 18 districts just
     doesn't produce single-digit-plus swings. */
  r2DistrictDeficit: { criticalPt: 5, warningPt: 3 },

  /* Client SKU distribution vs same-pack-size peer median.
     Observed: 0 of 4 client SKUs currently behind peers (Pepsi's real
     weakness in this build is availability, not listing breadth) —
     these thresholds are sized to the ~10–30pt spread seen across
     peer groups, ready for when a SKU genuinely lags. */
  r3DistributionGap: { criticalPt: 25, warningPt: 12 },

  /* Top rival's share of facing-days occupying client out-of-stocks.
     Observed: Coca-Cola led at 27.9% of 3,818 contested facing-days,
     with four other rivals splitting the rest — no rival ever
     approaches 40% in a 5-competitor field this fragmented; 25%
     dominance is already a real, single-name story. */
  r4RivalSubstitution: { criticalSharePct: 25, warningSharePct: 15 },

  /* Price-breach cluster, by outlet (>10% off RRP), counting only the
     CLIENT's lines — see the rule for why that scope changed.

     Recalibrated on the client distribution, which is an order of
     magnitude smaller than the category-wide one these thresholds
     were originally sized against. Observed: 9 of 100 outlets carry
     ≥1 client breach, 7 carry ≥2, 4 carry ≥3, and exactly one carries
     4 — the ceiling this dataset produces. A single mispriced line is
     a reading, not a cluster; two at one store is a pattern worth one
     phone call. Keeping the old 5/10 bars against client-only counts
     would have silenced the rule completely. */
  r5PriceCluster: { minReadings: 2, criticalCount: 4, warningCount: 2 },

  /* Client availability in one channel vs the client's own overall
     average (only channels performing worse are flagged).
     Observed: Mini-market −6.5pt (n=112, the single biggest channel
     by volume) and Hypermarket −4.2pt (n=11) were the only channels
     underperforming the 86.0% overall figure.

     `minListings` is a sample-size floor, and it exists because
     without it this rule reported noise as strategy. Hypermarket
     carries 11 client listings across 3 outlets, so ONE stockout
     moves its availability by 9.1pt — three times the warning
     threshold. The rule duly fired "Hypermarket availability is
     4.2pt behind your overall average", a channel-wide claim resting
     on a single empty shelf, and its impact then rounded to zero
     listings. The floor is set where one listing moves the channel
     figure by less than the threshold that judges it: below
     100/warningPt ≈ 33 listings, this rule cannot tell a channel
     problem from a rounding error, so it declines to speak. */
  r6ChannelGap: { criticalPt: 6, warningPt: 3, minListings: 33 },

  /* Client share gap between chilled-cooler and ambient-shelf facings
     (bidirectional — either fixture type can be the weak one).
     Observed: cooler 31.3% vs ambient 23.8%, a 7.6pt gap — real but a
     negotiation, not an emergency, hence one tier only. */
  r7FixtureImbalance: { warningPt: 5 },

  /* Momentum: client losing share while some rival gains ≥1pt.
     Observed: Pepsi −2.1pt in this window, Coca-Cola +1.8pt — the rule
     fires on the real cycle in this dataset. */
  r8Momentum: { rivalGainPt: 1 },

  /* R9 has no numeric threshold — a "dark" outlet is 0% client
     in-stock among whatever it does carry, which is a binary fact,
     not a calibrated cutoff. */


  /* Client SKUs listed at an outlet vs that outlet's own channel
     median — a range-selling gap, not a stock gap (R3 measures the
     same idea the other way round: one SKU's distribution citywide;
     this measures one outlet's range against its own format).
     Observed: 32 of 100 outlets sit below their channel's median
     listed count, but the gap is 1 SKU for most of them — normal
     variance, not a signal. 9 outlets are 2+ SKUs short (identical to
     the flat "≤1 of 4 SKUs listed" count, cross-checked); 1 outlet
     (a Supermarket carrying just 1 of 4 against a median of 4) is 3
     short — the observed ceiling. Warning at 2, critical at 3. */
  r11AssortmentGap: { warningCount: 2, criticalCount: 3 },

  /* Flagged districts that sit next to each other on the map — one
     route-planning problem rather than N separate district problems.

     "Adjacent" needs a distance, and it is the one judgement number in
     this phase, so it is calibrated against the real spread rather
     than picked round. Across all 153 district pairs in the panel the
     separation runs: min 0.73km, p10 1.89, p25 2.75, median 4.54, max
     18.63. A 2.5km bar therefore means "closer than roughly the
     nearest fifth of all district pairs" — tight enough that a rep can
     work the block in one run, loose enough to survive the centroids
     being approximate.

     Three is the floor for calling it a concentration: two adjacent
     districts are a pair, not a pattern, and R2 already names them
     individually. */
  r12GeographicConcentration: { adjacentKm: 2.5, minDistricts: 3 },
} as const;

const COOLER_PACKS = new Set(["can-330", "pet-500", "glass-300"]);

/* Pack codes are how the audit records a format; these are how a
   person says them. */
const PACK_LABEL: Record<string, string> = {
  "can-330": "330ml can",
  "pet-500": "500ml PET",
  "pet-1000": "1L PET",
  "pet-1500": "1.5L PET",
  "pet-2250": "2.25L PET",
  "glass-300": "300ml glass",
};

/* The interval the "deficit × time" formulas treat as the exposure
   window — the literal number of days between the two field visits,
   read from their ids (which are ISO dates), never hardcoded. */
/* The deficit rules project a shortfall forward over the days until an
   outlet is next audited. That is the revisit interval — a property of
   the collection plan — not the gap between two snapshot dates, which
   under a rotating schedule describes nothing an outlet experiences. */
const DAYS_BETWEEN_VISITS = REVISIT_INTERVAL_DAYS;

const round1 = (n: number) => Math.round(n * 10) / 10;

/* The ranking key: impact per outlet the finding actually touches.
   Guarded against a zero-outlet scope (shouldn't occur, but a rule
   bug here should degrade to "unranked low" rather than throw).
   Exported so the card can show the reader the same number the sort
   actually used, rather than a plain total that doesn't match the
   list's own order. */
export const intensityOf = (insight: Insight) =>
  insight.scope.outlets > 0 ? insight.impact.value / insight.scope.outlets : 0;

/* Confidence tier outranks intensity: every "measured" finding sorts
   ahead of every "estimated" one, regardless of either number, then
   each tier sorts by intensity within itself. Added when R11's
   projected facing-days (a formula over a listing gap that was never
   itself observed as a stockout) started outranking R1's directly
   observed, twice-confirmed losses — the same unit name doesn't make
   the two comparable, so rank doesn't treat them as such. No fudge
   factor on the number itself: impact.value is untouched, exactly
   like the scope-based intensity rule above it. */
const CONFIDENCE_RANK: Record<Insight["confidence"], number> = {
  measured: 0,
  estimated: 1,
};
const byIntensity = (a: Insight, b: Insight) => {
  const tier = CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
  return tier !== 0 ? tier : intensityOf(b) - intensityOf(a);
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor((sorted.length - 1) / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid] + sorted[mid + 1]) / 2;
};

/* ---------- R1 · outlet gap cluster ----------

   THIS RULE ABSORBED R10.

   The two used to split the same shelf fact by a test the collection
   model can no longer make. R1 reported gaps "confirmed at both
   visits"; R10 reported gaps "new this visit". Both need a previous
   observation OF THE SAME OUTLET, and a rotating panel does not
   revisit — so the split was not merely unavailable, it was decided by
   a `persistent` flag the generator invented.

   What a single visit genuinely sees is this: at this outlet, N of your
   SKUs have a slot and the slot is empty. That is one finding, and it
   is the one an auditor could actually stand behind. Severity comes
   from how many, because the count is observed; it no longer comes from
   accumulated facing-days, because those are now projected forward at a
   constant interval and would rank identically to facings.

   Outlets where EVERY listed client SKU is empty are left to R9 — a
   fully dark shelf is a stronger statement than a cluster, and firing
   both was double-counting even under the old model. */

function r1OutletGaps(view: FilteredView, darkOutlets: Set<string>): Insight[] {
  const byOutlet = new Map<string, FilteredView["oosRows"]>();
  for (const row of view.oosRows) {
    if (skuOf(row.skuId)?.brandId !== clientBrand.id) continue;
    if (darkOutlets.has(row.posId)) continue;
    byOutlet.set(row.posId, [...(byOutlet.get(row.posId) ?? []), row]);
  }

  const insights: Insight[] = [];
  for (const [posId, rows] of byOutlet) {
    if (rows.length < THRESHOLDS.r1OutletGaps.warningCount) continue;
    const outlet = posOf(posId);
    if (!outlet) continue;

    const severity: Severity =
      rows.length >= THRESHOLDS.r1OutletGaps.criticalCount ? "critical" : "warning";
    const impactValue = Math.round(
      rows.reduce((s, r) => s + r.facingDaysAtRisk, 0)
    );

    insights.push({
      id: `r1:${posId}`,
      rule: "r1-outlet-gaps",
      confidence: "measured",
      severity,
      headline: `${outlet.code} has ${rows.length} ${clientBrand.name} SKU${rows.length > 1 ? "s" : ""} listed but empty`,
      detail:
        "Shelf space this outlet gives you, holding nothing. Every one is a slot a rival can take before the next audit.",
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `${impactValue} facing-days at risk`,
      },
      scope: { outlets: 1, label: outlet.code },
      trend: "new",
      evidence: {
        href: `/dashboard/oos-alerts?area=${encodeURIComponent(outlet.area)}`,
        formula: `${rows.length} ${clientBrand.name} SKUs listed and empty at ${outlet.code}, audited ${auditDateOf(view, posId)}. Σ normalFacings × ${REVISIT_INTERVAL_DAYS} days to the next audit.`,
        table: {
          columns: ["SKU", "Normal facings", "Facing-days at risk"],
          rows: rows.map((r) => [
            skuName(r.skuId),
            r.normalFacings,
            r.facingDaysAtRisk,
          ]),
        },
      },
      entities: { posId, area: outlet.area, brandId: clientBrand.id },
    });
  }
  return insights.sort(byIntensity);
}

/* ---------- R2 · district share deficit ---------- */

function r2DistrictDeficit(view: FilteredView): Insight[] {
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  const cityTotal = stocked.reduce((s, c) => s + c.facings, 0);
  const cityClient = stocked
    .filter((c) => skuOf(c.skuId)?.brandId === clientBrand.id)
    .reduce((s, c) => s + c.facings, 0);
  if (!cityTotal) return [];
  const cityShare = (cityClient / cityTotal) * 100;

  const byArea = new Map<
    string,
    { total: number; client: number; outlets: Set<string> }
  >();
  for (const c of stocked) {
    const area = posOf(c.posId)?.area;
    if (!area) continue;
    const entry =
      byArea.get(area) ?? { total: 0, client: 0, outlets: new Set<string>() };
    entry.total += c.facings;
    if (skuOf(c.skuId)?.brandId === clientBrand.id) entry.client += c.facings;
    entry.outlets.add(c.posId);
    byArea.set(area, entry);
  }

  const insights: Insight[] = [];
  for (const [area, e] of byArea) {
    if (!e.total) continue;
    const share = (e.client / e.total) * 100;
    const deficit = cityShare - share;
    if (deficit < THRESHOLDS.r2DistrictDeficit.warningPt) continue;
    const severity: Severity =
      deficit >= THRESHOLDS.r2DistrictDeficit.criticalPt ? "critical" : "warning";
    const impactValue = Math.round(((deficit / 100) * e.total) * DAYS_BETWEEN_VISITS);

    insights.push({
      id: `r2:${area}`,
      rule: "r2-district-deficit",
      confidence: "estimated",
      severity,
      headline: `${area} runs ${round1(deficit)}pt behind your citywide shelf share`,
      detail: `${clientBrand.name} holds ${round1(share)}% of facings here against ${round1(cityShare)}% across Erbil.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `≈${impactValue} facing-days below your own average`,
      },
      scope: { outlets: e.outlets.size, label: `${area} district (${e.outlets.size} outlets)` },
      trend: "new",
      evidence: {
        href: `/dashboard/shelf?area=${encodeURIComponent(area)}&mode=share`,
        formula: `(citywide share ${round1(cityShare)}% − ${area} share ${round1(share)}%) × ${Math.round(e.total)} in-district facings × ${DAYS_BETWEEN_VISITS} days between visits.`,
        table: {
          columns: ["Metric", "Value"],
          rows: [
            ["District facings", Math.round(e.total)],
            [`${clientBrand.name} facings`, Math.round(e.client)],
            ["District share", `${round1(share)}%`],
            ["Citywide share", `${round1(cityShare)}%`],
          ],
        },
      },
      entities: { area, brandId: clientBrand.id },
    });
  }
  return insights.sort(byIntensity);
}

/* ---------- R3 · distribution weakness by SKU ---------- */

function r3DistributionGap(view: FilteredView): Insight[] {
  const listedCount = new Map<string, number>();
  const facingsBySku = new Map<string, number[]>();
  for (const c of view.cells) {
    if (c.state !== "not-listed")
      listedCount.set(c.skuId, (listedCount.get(c.skuId) ?? 0) + 1);
    if (c.state === "in-stock")
      facingsBySku.set(c.skuId, [...(facingsBySku.get(c.skuId) ?? []), c.facings]);
  }

  const byPack = new Map<string, { skuId: string; dist: number }[]>();
  for (const sku of skus) {
    const dist = view.posCount ? ((listedCount.get(sku.id) ?? 0) / view.posCount) * 100 : 0;
    byPack.set(sku.pack, [...(byPack.get(sku.pack) ?? []), { skuId: sku.id, dist }]);
  }

  const insights: Insight[] = [];
  for (const sku of skus.filter((s) => s.brandId === clientBrand.id)) {
    const peers = byPack.get(sku.pack) ?? [];
    const peerMedian = median(peers.map((p) => p.dist));
    const own = peers.find((p) => p.skuId === sku.id)?.dist ?? 0;
    const gap = peerMedian - own;
    if (gap < THRESHOLDS.r3DistributionGap.warningPt) continue;
    const severity: Severity =
      gap >= THRESHOLDS.r3DistributionGap.criticalPt ? "critical" : "warning";

    const missingListings = Math.round((gap / 100) * view.posCount);
    const facings = facingsBySku.get(sku.id) ?? [];
    const avgFacings = facings.length
      ? facings.reduce((a, b) => a + b, 0) / facings.length
      : 2;
    const impactValue = Math.round(missingListings * avgFacings * DAYS_BETWEEN_VISITS);

    insights.push({
      id: `r3:${sku.id}`,
      rule: "r3-distribution-gap",
      confidence: "estimated",
      severity,
      headline: `${sku.name} is listed in far fewer outlets than comparable packs`,
      detail: `${Math.round(own)}% distribution against a ${Math.round(peerMedian)}% median for the same pack size — a listing gap, not a stock gap.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `≈${impactValue} facing-days of missed presence`,
      },
      scope: { outlets: view.posCount, label: `citywide (${view.posCount} outlets)` },
      trend: "new",
      evidence: {
        href: `/dashboard/shelf?brand=${clientBrand.id}&mode=availability`,
        formula: `(peer median ${Math.round(peerMedian)}% − own ${Math.round(own)}%) × ${view.posCount} outlets ≈ ${missingListings} missing listings × ${round1(avgFacings)} average facings × ${DAYS_BETWEEN_VISITS} days.`,
        table: {
          columns: ["Same-pack SKU", "Brand", "Distribution"],
          rows: peers.map((p) => [
            skuName(p.skuId),
            brandName(skuOf(p.skuId)!.brandId),
            `${Math.round(p.dist)}%`,
          ]),
        },
      },
      entities: { skuId: sku.id, brandId: clientBrand.id },
    });
  }
  return insights.sort(byIntensity);
}

/* ---------- R4 · rival substitution ---------- */

function r4RivalSubstitution(view: FilteredView): Insight[] {
  const clientGaps = view.oosRows.filter(
    (r) => skuOf(r.skuId)?.brandId === clientBrand.id
  );

  const tally = new Map<string, number>();
  /* Substitution happens at the fixture, one pack at a time. A brand
     can lead the whole contested space and still not be the one
     taking a particular format — and "which format" is what a rep
     defends. So the pair is tracked alongside the brand total. */
  const pairs = new Map<string, number>();
  const outletsAffected = new Set<string>();
  let total = 0;
  for (const row of clientGaps) {
    if (!row.rivalsInStock.length) continue;
    const pack = skuOf(row.skuId)?.pack;
    outletsAffected.add(row.posId);
    for (const rival of row.rivalsInStock) {
      const value = rival.facings * REVISIT_INTERVAL_DAYS;
      tally.set(rival.brandId, (tally.get(rival.brandId) ?? 0) + value);
      if (pack) {
        const key = `${pack}|${rival.brandId}`;
        pairs.set(key, (pairs.get(key) ?? 0) + value);
      }
      total += value;
    }
  }
  if (!total) return [];

  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const [topBrandId, topValue] = ranked[0];
  const topShare = (topValue / total) * 100;
  if (topShare < THRESHOLDS.r4RivalSubstitution.warningSharePct) return [];
  const severity: Severity =
    topShare >= THRESHOLDS.r4RivalSubstitution.criticalSharePct ? "critical" : "warning";

  const rankedPairs = [...pairs.entries()].sort((a, b) => b[1] - a[1]);
  const [topPairKey, topPairValue] = rankedPairs[0] ?? ["", 0];
  const [topPack, topPairBrand] = topPairKey.split("|");
  const packLabel = PACK_LABEL[topPack] ?? topPack;

  /* The finding leads with the pack-level pair, because that is the
     one someone can act on: you defend a format in a fixture, not a
     brand in the abstract. The brand that leads overall is still
     named when it differs, so the sharper fact never hides the
     broader one. */
  const leadsOverall = topPairBrand === topBrandId;
  const impactValue = Math.round(topPairValue || topValue);

  return [
    {
      id: `r4:${topPairKey || topBrandId}`,
      rule: "r4-rival-substitution",
      confidence: "measured",
      severity,
      headline: topPairKey
        ? `${brandName(topPairBrand)} is taking your ${packLabel} space when it runs out`
        : `${brandName(topBrandId)} is filling the shelf where ${clientBrand.name} is out of stock`,
      detail: topPairKey
        ? leadsOverall
          ? `${brandName(topPairBrand)} holds ${Math.round(topPairValue)} facing-days of your ${packLabel} gaps, and ${Math.round(topShare)}% of all the space contested across ${outletsAffected.size} outlets.`
          : `${brandName(topPairBrand)} holds ${Math.round(topPairValue)} facing-days of your ${packLabel} gaps — the sharpest single format. ${brandName(topBrandId)} leads the contested space overall at ${Math.round(topShare)}%, but not in this pack.`
        : `Across ${outletsAffected.size} outlets, ${brandName(topBrandId)} holds ${Math.round(topShare)}% of the space contested during your gaps.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `${impactValue} facing-days occupied`,
      },
      scope: {
        outlets: outletsAffected.size,
        label: `${outletsAffected.size} outlets`,
      },
      trend: "new",
      evidence: {
        href: `/dashboard/oos-alerts`,
        formula: `Σ (rival facings × days ${clientBrand.name} was out), grouped by your pack format and the rival holding that space.`,
        table: {
          columns: ["Your pack", "Rival", "Contested facing-days"],
          rows: rankedPairs.slice(0, 10).map(([key, val]) => {
            const [pack, bId] = key.split("|");
            return [PACK_LABEL[pack] ?? pack, brandName(bId), Math.round(val)];
          }),
        },
      },
      entities: { brandId: topPairBrand || topBrandId },
    },
  ];
}

/* ---------- R5 · price breach cluster (own currency: readings) ---------- */

/* Counts the CLIENT's mispriced lines, not the category's.

   This rule was the one exception in the engine — every other rule
   filters to the client, and R5 counted every brand's breaching
   reading at an outlet. The consequence was not cosmetic. It ranked
   ERB-1005 critical on 10 breaching SKUs of which exactly ONE was the
   client's, and pushed ERB-203 — the outlet with the most client
   breaches in the panel — down to sixth and a warning. A commercial
   team reading that page was being sent to argue with a retailer
   about a rival's shelf price, which is not a conversation they have
   standing to have, while the store actually mispricing their own
   lines sat below the fold.

   It also disagreed with the KPI tile directly above it, which has
   always reported compliance across client SKUs only. Two pricing
   numbers on one page, different populations, no label saying so.

   The category-wide count survives as CONTEXT rather than as the
   ranked number: a retailer off RRP on fourteen lines across the
   category is a different conversation from one off on three, and the
   rep should know that walking in — it just isn't the measure of what
   the client can fix. */
function r5PriceCluster(view: FilteredView): Insight[] {
  const byOutlet = new Map<string, FilteredView["priceRows"]>();
  const categoryBreaches = new Map<string, number>();
  for (const row of view.priceRows) {
    if (!row.outlier) continue;
    categoryBreaches.set(row.posId, (categoryBreaches.get(row.posId) ?? 0) + 1);
    if (skuOf(row.skuId)?.brandId !== clientBrand.id) continue;
    byOutlet.set(row.posId, [...(byOutlet.get(row.posId) ?? []), row]);
  }

  const insights: Insight[] = [];
  for (const [posId, rows] of byOutlet) {
    if (rows.length < THRESHOLDS.r5PriceCluster.minReadings) continue;
    const outlet = posOf(posId);
    if (!outlet) continue;
    const meanDev = rows.reduce((s, r) => s + Math.abs(r.variance), 0) / rows.length;
    const severity: Severity =
      rows.length >= THRESHOLDS.r5PriceCluster.criticalCount
        ? "critical"
        : rows.length >= THRESHOLDS.r5PriceCluster.warningCount
          ? "warning"
          : "watch";
    if (severity === "watch") continue;

    const category = categoryBreaches.get(posId) ?? rows.length;
    const wider = category - rows.length;

    insights.push({
      id: `r5:${posId}`,
      rule: "r5-price-cluster",
      confidence: "measured",
      severity,
      headline: `${outlet.code} is pricing ${rows.length} of your lines well off RRP`,
      detail:
        `Average deviation ${Math.round(meanDev)}% — one retailer conversation fixes every line at once.` +
        (wider > 0
          ? ` This store is also off RRP on ${wider} competitor line${
              wider === 1 ? "" : "s"
            }, so it is not following list pricing at all.`
          : ""),
      impact: {
        value: rows.length,
        unit: "readings",
        label: `${rows.length} breaching readings`,
      },
      scope: { outlets: 1, label: outlet.code },
      trend: "new",
      evidence: {
        href: `/dashboard/pricing?area=${encodeURIComponent(outlet.area)}`,
        formula: `Count of ${clientBrand.name} shelf-price readings at ${outlet.code} more than 10% off RRP (${rows.length} of ${category} breaching readings at this outlet across all brands).`,
        table: {
          columns: ["SKU", "Shelf price", "RRP", "Variance"],
          rows: rows.map((r) => [
            skuName(r.skuId),
            r.price,
            r.rrp,
            `${r.variance > 0 ? "+" : ""}${r.variance}%`,
          ]),
        },
      },
      entities: { posId, area: outlet.area, brandId: clientBrand.id },
    });
  }
  /* Scope is always one outlet here, so this is equivalent to sorting
     by raw breach count — stated via byIntensity for consistency with
     every other rule rather than as a special case. */
  return insights.sort(byIntensity);
}

/* ---------- R6 · channel weakness ---------- */

function r6ChannelGap(view: FilteredView): Insight[] {
  const clientListed = view.cells.filter(
    (c) => skuOf(c.skuId)?.brandId === clientBrand.id && c.state !== "not-listed"
  );
  if (!clientListed.length) return [];
  const overallAvail =
    (clientListed.filter((c) => c.state === "in-stock").length / clientListed.length) * 100;

  const channels = [...new Set(allPos.map((p) => p.channel))];
  const insights: Insight[] = [];
  for (const channel of channels) {
    const chCells = clientListed.filter((c) => posOf(c.posId)?.channel === channel);
    /* Too small a base to carry a channel-level claim — see the
       threshold comment. Skipped silently rather than reported as a
       clean channel, because "we cannot tell" is not "it is fine". */
    if (chCells.length < THRESHOLDS.r6ChannelGap.minListings) continue;
    const chAvail = (chCells.filter((c) => c.state === "in-stock").length / chCells.length) * 100;
    const deficit = overallAvail - chAvail;
    if (deficit < THRESHOLDS.r6ChannelGap.warningPt) continue;
    const severity: Severity =
      deficit >= THRESHOLDS.r6ChannelGap.criticalPt ? "critical" : "warning";

    const deficitListings = Math.round((deficit / 100) * chCells.length);
    const stockedClient = clientListed.filter((c) => c.state === "in-stock");
    const avgFacings = stockedClient.length
      ? stockedClient.reduce((s, c) => s + c.facings, 0) / stockedClient.length
      : 2;
    const impactValue = Math.round(deficitListings * avgFacings * DAYS_BETWEEN_VISITS);
    const channelOutlets = new Set(chCells.map((c) => c.posId)).size;

    insights.push({
      id: `r6:${channel}`,
      rule: "r6-channel-gap",
      confidence: "estimated",
      severity,
      headline: `${channel} availability is ${round1(deficit)}pt behind your overall average`,
      detail: `${chCells.length} of your listings sit in ${channel.toLowerCase()} outlets — a channel-wide fix reaches all of them at once.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `≈${impactValue} facing-days below your average`,
      },
      scope: { outlets: channelOutlets, label: `${channel} (${channelOutlets} outlets)` },
      trend: "new",
      evidence: {
        href: `/dashboard/shelf?channel=${encodeURIComponent(channel)}&mode=availability`,
        formula: `(overall availability ${round1(overallAvail)}% − ${channel} ${round1(chAvail)}%) × ${chCells.length} listings ≈ ${deficitListings} extra gaps × ${round1(avgFacings)} average facings × ${DAYS_BETWEEN_VISITS} days.`,
        table: {
          columns: ["Metric", "Value"],
          rows: [
            ["Listings in channel", chCells.length],
            ["In stock", chCells.filter((c) => c.state === "in-stock").length],
            [`${channel} availability`, `${round1(chAvail)}%`],
            ["Overall availability", `${round1(overallAvail)}%`],
          ],
        },
      },
      entities: { channel, brandId: clientBrand.id },
    });
  }
  return insights.sort(byIntensity);
}

/* ---------- R7 · fixture imbalance (bidirectional) ---------- */

function r7FixtureImbalance(view: FilteredView): Insight[] {
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  const cooler = stocked.filter((c) => COOLER_PACKS.has(skuOf(c.skuId)!.pack));
  const ambient = stocked.filter((c) => !COOLER_PACKS.has(skuOf(c.skuId)!.pack));
  const coolerTotal = cooler.reduce((s, c) => s + c.facings, 0);
  const ambientTotal = ambient.reduce((s, c) => s + c.facings, 0);
  if (!coolerTotal || !ambientTotal) return [];

  const coolerClient = cooler
    .filter((c) => skuOf(c.skuId)!.brandId === clientBrand.id)
    .reduce((s, c) => s + c.facings, 0);
  const ambientClient = ambient
    .filter((c) => skuOf(c.skuId)!.brandId === clientBrand.id)
    .reduce((s, c) => s + c.facings, 0);

  const coolerShare = (coolerClient / coolerTotal) * 100;
  const ambientShare = (ambientClient / ambientTotal) * 100;
  const gap = Math.abs(coolerShare - ambientShare);
  if (gap < THRESHOLDS.r7FixtureImbalance.warningPt) return [];

  const coolerWeaker = coolerShare < ambientShare;
  const weakerLabel = coolerWeaker ? "chilled coolers" : "the ambient take-home shelf";
  const weakerTotal = coolerWeaker ? coolerTotal : ambientTotal;
  const strongerShare = Math.max(coolerShare, ambientShare);
  const weakerShare = Math.min(coolerShare, ambientShare);
  const impactValue = Math.round(
    ((strongerShare - weakerShare) / 100) * weakerTotal * DAYS_BETWEEN_VISITS
  );

  return [
    {
      id: "r7:fixture-imbalance",
      rule: "r7-fixture-imbalance",
      confidence: "estimated",
      severity: "warning",
      headline: `${clientBrand.name} is under-represented in ${weakerLabel}`,
      detail: `Cooler share ${round1(coolerShare)}% vs ambient share ${round1(ambientShare)}% — the two fixture types aren't being negotiated evenly.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `≈${impactValue} facing-days to reach parity`,
      },
      scope: { outlets: view.posCount, label: `citywide (${view.posCount} outlets)` },
      trend: "new",
      /* Natively a pair: the same measure in two fixture types. The gap
         between the marks IS the finding, which is what the dumbbell
         draws — no time axis required. */
      pair: {
        aLabel: "Ambient shelf",
        bLabel: "Chilled cooler",
        unit: "%",
        rows: [
          {
            id: "fixture",
            label: `${clientBrand.name} share`,
            a: round1(ambientShare),
            b: round1(coolerShare),
            emphasis: true,
          },
        ],
      },
      evidence: {
        href: `/dashboard/shelf?mode=share`,
        formula: `(stronger fixture share ${round1(strongerShare)}% − weaker ${round1(weakerShare)}%) × ${Math.round(weakerTotal)} facings in that fixture × ${DAYS_BETWEEN_VISITS} days.`,
        table: {
          columns: ["Fixture", "Your facings", "Category facings", "Your share"],
          rows: [
            ["Chilled cooler", coolerClient, Math.round(coolerTotal), `${round1(coolerShare)}%`],
            ["Ambient shelf", ambientClient, Math.round(ambientTotal), `${round1(ambientShare)}%`],
          ],
        },
      },
      entities: { brandId: clientBrand.id },
    },
  ];
}

/* ---------- R9 · dark outlet (total client absence) ---------- */

function r9DarkOutlets(view: FilteredView): Insight[] {
  const byOutlet = new Map<
    string,
    { listed: number; oosRows: FilteredView["oosRows"] }
  >();
  for (const c of view.cells) {
    if (skuOf(c.skuId)?.brandId !== clientBrand.id) continue;
    if (c.state === "not-listed") continue;
    const e = byOutlet.get(c.posId) ?? { listed: 0, oosRows: [] };
    e.listed += 1;
    byOutlet.set(c.posId, e);
  }
  for (const row of view.oosRows) {
    if (skuOf(row.skuId)?.brandId !== clientBrand.id) continue;
    byOutlet.get(row.posId)?.oosRows.push(row);
  }

  const insights: Insight[] = [];
  for (const [posId, e] of byOutlet) {
    if (e.listed === 0 || e.oosRows.length < e.listed) continue; // something is in stock

    const outlet = posOf(posId);
    if (!outlet) continue;
    const impactValue = Math.round(
      e.oosRows.reduce((s, r) => s + r.facingDaysAtRisk, 0)
    );

    insights.push({
      id: `r9:${posId}`,
      rule: "r9-dark-outlet",
      confidence: "measured",
      severity: "critical",
      headline: `${outlet.code} carries ${clientBrand.name} but has none in stock`,
      detail: `All ${e.listed} listed ${clientBrand.name} SKU${e.listed > 1 ? "s are" : " is"} out of stock at once — a fully absent shelf, not a partial gap.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `${impactValue} facing-days at risk`,
      },
      scope: { outlets: 1, label: outlet.code },
      trend: "new",
      evidence: {
        href: `/dashboard/oos-alerts?area=${encodeURIComponent(outlet.area)}`,
        formula: `Every listed ${clientBrand.name} SKU at ${outlet.code} was out of stock when audited ${auditDateOf(view, posId)} (${e.oosRows.length} of ${e.listed}); Σ normalFacings × ${REVISIT_INTERVAL_DAYS} days to the next audit.`,
        table: {
          columns: ["SKU", "Normal facings", "Facing-days at risk"],
          rows: e.oosRows.map((r) => [
            skuName(r.skuId),
            r.normalFacings,
            r.facingDaysAtRisk,
          ]),
        },
      },
      entities: { posId, area: outlet.area, brandId: clientBrand.id },
    });
  }
  return insights.sort(byIntensity);
}

/* ---------- R11 · assortment gap (range-selling, not stock) ---------- */

function r11AssortmentGap(view: FilteredView): Insight[] {
  const clientSkus = skus.filter((s) => s.brandId === clientBrand.id);
  const clientSkuIds = new Set(clientSkus.map((s) => s.id));
  if (!clientSkuIds.size) return [];

  const listedIds = new Map<string, Set<string>>(); // posId -> client sku ids listed there
  for (const c of view.cells) {
    if (!clientSkuIds.has(c.skuId) || c.state === "not-listed") continue;
    const set = listedIds.get(c.posId) ?? new Set<string>();
    set.add(c.skuId);
    listedIds.set(c.posId, set);
  }

  const byChannel = new Map<string, number[]>();
  for (const outlet of view.outlets) {
    const n = listedIds.get(outlet.id)?.size ?? 0;
    byChannel.set(outlet.channel, [...(byChannel.get(outlet.channel) ?? []), n]);
  }
  const channelMedian = new Map<string, number>();
  for (const [channel, counts] of byChannel) channelMedian.set(channel, median(counts));

  const clientInStock = view.cells.filter(
    (c) => clientSkuIds.has(c.skuId) && c.state === "in-stock"
  );
  const avgFacings = clientInStock.length
    ? clientInStock.reduce((s, c) => s + c.facings, 0) / clientInStock.length
    : 2;

  const insights: Insight[] = [];
  for (const outlet of view.outlets) {
    const listed = listedIds.get(outlet.id) ?? new Set<string>();
    const med = channelMedian.get(outlet.channel) ?? 0;
    const gap = med - listed.size;
    if (gap < THRESHOLDS.r11AssortmentGap.warningCount) continue;
    const severity: Severity =
      gap >= THRESHOLDS.r11AssortmentGap.criticalCount ? "critical" : "warning";
    const impactValue = Math.round(gap * avgFacings * DAYS_BETWEEN_VISITS);
    const missing = clientSkus.filter((s) => !listed.has(s.id));

    insights.push({
      id: `r11:${outlet.id}`,
      rule: "r11-assortment-gap",
      confidence: "estimated",
      severity,
      headline: `${outlet.code} carries only ${listed.size} of your ${clientSkus.length} ${clientBrand.name} SKUs`,
      detail: `${outlet.channel} outlets typically carry ${med} — a listing gap, not a stock gap; ${missing.length} SKU${missing.length > 1 ? "s aren't" : " isn't"} on the range at all.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `≈${impactValue} facing-days of missed presence`,
      },
      scope: { outlets: 1, label: outlet.code },
      trend: "new",
      /* Countable and small — four SKUs are four things a reader can
         count, so the chart shows slots rather than a percentage. */
      meter: {
        filled: listed.size,
        total: clientSkus.length,
        benchmark: med,
        unitLabel: `${clientBrand.name} SKUs`,
      },
      evidence: {
        href: `/dashboard/shelf?area=${encodeURIComponent(outlet.area)}&brand=${clientBrand.id}&mode=availability`,
        formula: `${outlet.channel} median listed SKUs (${med}) − ${outlet.code}'s listed count (${listed.size}) = ${gap} missing from the range × ${round1(avgFacings)} average facings × ${DAYS_BETWEEN_VISITS} days.`,
        table: {
          columns: ["SKU", "Pack", "Status"],
          rows: clientSkus.map((s) => [
            s.name,
            s.pack,
            listed.has(s.id) ? "Listed" : "Not listed",
          ]),
        },
      },
      entities: { posId: outlet.id, area: outlet.area, brandId: clientBrand.id },
    });
  }
  return insights.sort(byIntensity);
}

/* ---------- R12 · geographic concentration of district deficits ----------

   The strongest fact this dataset produces, and the one a ranked list
   of individual districts structurally cannot state: when the districts
   running behind are also next to each other, that is not four store
   problems, it is one route. R2 finds the districts; R12 notices they
   touch.

   Distances are real great-circle kilometres between the district
   centroids already carried in lib/portal.ts, so this is arithmetic on
   coordinates, not an editorial reading of a map. */

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: DistrictPoint, b: DistrictPoint) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function r12GeographicConcentration(districtInsights: Insight[]): Insight[] {
  if (districtInsights.length < THRESHOLDS.r12GeographicConcentration.minDistricts)
    return [];

  /* Only districts we can actually place on the map can be clustered. */
  const flagged = districtInsights
    .map((insight) => ({
      insight,
      point: districtPoints.find((p) => p.name === insight.entities.area),
    }))
    .filter((f): f is { insight: Insight; point: DistrictPoint } => !!f.point);

  /* Single-link clustering: two districts join the same group when they
     are within the adjacency bar of each other, transitively. */
  const seen = new Set<string>();
  const groups: { insight: Insight; point: DistrictPoint }[][] = [];
  for (const start of flagged) {
    if (seen.has(start.point.name)) continue;
    seen.add(start.point.name);
    const stack = [start];
    const group: typeof flagged = [];
    while (stack.length) {
      const current = stack.pop()!;
      group.push(current);
      for (const other of flagged) {
        if (seen.has(other.point.name)) continue;
        if (
          haversineKm(current.point, other.point) <=
          THRESHOLDS.r12GeographicConcentration.adjacentKm
        ) {
          seen.add(other.point.name);
          stack.push(other);
        }
      }
    }
    groups.push(group);
  }

  const insights: Insight[] = [];
  for (const group of groups) {
    if (group.length < THRESHOLDS.r12GeographicConcentration.minDistricts) continue;

    const names = group
      .map((g) => g.point.name)
      .sort((a, b) => a.localeCompare(b));
    const outlets = group.reduce((sum, g) => sum + g.insight.scope.outlets, 0);
    const impactValue = Math.round(
      group.reduce((sum, g) => sum + g.insight.impact.value, 0)
    );

    /* How far the whole block sits from the Citadel decides whether it
       reads as the city core or an outlying pocket — the difference
       between "work the centre" and "work the ring road". */
    const meanKm =
      group.reduce(
        (sum, g) =>
          sum +
          haversineKm(g.point, {
            name: "citadel",
            lat: ERBIL_CITADEL.lat,
            lng: ERBIL_CITADEL.lng,
          }),
        0
      ) / group.length;
    const where = meanKm <= 3 ? "the old city core" : "one pocket of the city";

    insights.push({
      id: `r12:${names.join("+")}`,
      rule: "r12-geographic-concentration",
      confidence: "estimated",
      severity: "critical",
      headline: `Your weakness is concentrated in ${where} — ${group.length} adjacent districts, not ${group.length} separate problems`,
      detail: `${names.join(", ")} all run behind your citywide share and all sit within ${THRESHOLDS.r12GeographicConcentration.adjacentKm}km of each other. That makes this a route-planning decision rather than ${group.length} store conversations.`,
      impact: {
        value: impactValue,
        unit: "facing-days",
        label: `≈${impactValue} facing-days across ${outlets} outlets`,
      },
      scope: { outlets, label: `${group.length} adjacent districts` },
      trend: "new",
      evidence: {
        href: `/dashboard/shelf?area=${encodeURIComponent(names.join(","))}&mode=share`,
        formula: `Districts flagged by R2, then grouped where centroids sit within ${THRESHOLDS.r12GeographicConcentration.adjacentKm}km of one another (great-circle). Groups of ${THRESHOLDS.r12GeographicConcentration.minDistricts}+ are reported; impact is the sum of the member districts'.`,
        table: {
          columns: ["District", "Outlets", "Behind city by", "km from Citadel"],
          rows: group
            .slice()
            .sort((a, b) => b.insight.impact.value - a.insight.impact.value)
            .map((g) => [
              g.point.name,
              g.insight.scope.outlets,
              g.insight.headline.match(/([\d.]+pt)/)?.[1] ?? "—",
              haversineKm(g.point, {
                name: "citadel",
                lat: ERBIL_CITADEL.lat,
                lng: ERBIL_CITADEL.lng,
              }).toFixed(1),
            ]),
        },
      },
      entities: { brandId: clientBrand.id },
    });
  }

  return insights.sort(byIntensity);
}

/* ---------- R8 · momentum (a single fact, not a ranked list) ---------- */

/* R8 · momentum — now drawn from the core panel, and gated on the
   panel's own detection floor.

   This rule used to read `competitors`, which is a full-window figure
   computed over whichever outlets each window happened to reach, and
   fired whenever a rival gained 1pt. With a measured floor of ~2pt on
   a 40-outlet core, a 1pt threshold fires on noise roughly as often as
   on signal — the rule was manufacturing momentum stories out of panel
   rotation.

   Two changes: the numbers come from the paired core, and both sides
   must clear the floor. A finding that says "you are conceding ground"
   is one of the most consequential things this product can tell a
   commercial team, and it should not be sayable about a move the panel
   cannot resolve. */
function computeMomentum(): Momentum | null {
  const client = coreTrend.brands.find((b) => b.brandId === clientBrand.id);
  if (!client) return null;

  const rivals = coreTrend.brands
    .filter(
      (b) =>
        b.brandId !== clientBrand.id &&
        b.shareDelta >= Math.max(THRESHOLDS.r8Momentum.rivalGainPt, coreTrend.shareFloorPt) &&
        b.shareSignificant
    )
    .sort((a, b) => b.shareDelta - a.shareDelta);

  const conceding =
    client.shareDelta < 0 && client.shareSignificant && rivals.length > 0;

  return {
    conceding,
    clientDelta: client.shareDelta,
    rivalBrandId: conceding ? rivals[0].brandId : null,
    rivalDelta: conceding ? rivals[0].shareDelta : null,
  };
}

/* ---------- entry point ---------- */

export function generateInsights(view: FilteredView): InsightReport {
  /* R2's output feeds R12 — the concentration rule reads the district
     findings rather than recomputing them, so the two can never
     disagree about which districts are behind. */
  const districts = r2DistrictDeficit(view);

  /* R9 runs first: a fully dark outlet is the stronger statement, and
     R1 must not also report it as a cluster. */
  const dark = r9DarkOutlets(view);
  const darkOutlets = new Set(
    dark.map((i) => i.entities.posId).filter((p): p is string => Boolean(p))
  );

  const presence = [
    ...r1OutletGaps(view, darkOutlets),
    ...districts,
    ...r12GeographicConcentration(districts),
    ...r3DistributionGap(view),
    ...r4RivalSubstitution(view),
    ...r6ChannelGap(view),
    ...r7FixtureImbalance(view),
    ...dark,
    ...r11AssortmentGap(view),
  ]
    /* A finding worth nothing is not a finding.

       Every rule states an impact, and the whole product ranks, rolls
       up and prices findings by that number — so one that arrives at
       zero is telling the reader "here is a problem costing you
       nothing", which is either a threshold firing on noise or a
       formula that has lost its units. R6 shipped exactly that for
       three releases: a channel-wide warning whose own arithmetic
       resolved to 0 facing-days.

       R6's real fix is the sample-size floor above; this is the net
       under it, because the same shape can appear in any rule whose
       impact is a percentage applied to a small base. Kept as a
       filter rather than an assertion so a live page degrades by
       showing one finding fewer rather than by crashing — and
       asserted in the test suite, where it is allowed to be loud. */
    .filter((insight) => insight.impact.value > 0)
    .sort(byIntensity);

  const pricing = r5PriceCluster(view)
    .filter((insight) => insight.impact.value > 0)
    .sort(byIntensity);

  return { presence, pricing, momentum: computeMomentum() };
}
