/* ============================================================
   THE DECISION LAYER.

   `insights.ts` already detects. Twelve rules, thresholds argued
   against what the September panel actually produced, an evidence
   table and a formula on every finding. Nothing in this file detects
   anything; it CLASSIFIES what those rules return, so the same object
   can be read as a decision rather than as a rule firing.

   Three questions get answered here, and nowhere else:

     WHICH CONVERSATION IS THIS?  — the outcome category, decided by
       what the finding is measured against, never by hand.
     HOW MUCH DOES IT DESERVE ATTENTION?  — one priority number, from
       stated factors, all of them measured.
     IS THIS THE SAME THING SAID TWICE?  — subsumption, so a market
       phenomenon appears once with its slices inside it.

   Kept separate from insights.ts on purpose. A rule should go on
   stating its own finding in its own units without knowing what a
   dashboard chip is called this quarter.
   ============================================================ */

import { clientBrand } from "./index";
import type { MarketView } from "./filters";
import {
  SHARE_FLOOR_PT,
  type Insight,
  type RuleId,
  type Severity,
} from "./insights";

/* ------------------------------------------------------------------
   OUTCOMES

   Seven, and they name what the reader would DO, not which subsystem
   noticed. "Availability gap" is a rule firing; "Protect sales" is a
   decision to make.
------------------------------------------------------------------ */
export type Outcome =
  | "protect-sales"
  | "grow-distribution"
  | "win-the-shelf"
  | "optimize-pricing"
  | "improve-execution"
  | "respond-to-competition"
  | "verify-impact";

export const OUTCOMES: Outcome[] = [
  "protect-sales",
  "grow-distribution",
  "win-the-shelf",
  "optimize-pricing",
  "improve-execution",
  "respond-to-competition",
  "verify-impact",
];

export const OUTCOME_LABEL: Record<Outcome, string> = {
  "protect-sales": "Protect sales",
  "grow-distribution": "Grow distribution",
  "win-the-shelf": "Win the shelf",
  "optimize-pricing": "Optimize pricing",
  "improve-execution": "Improve execution",
  "respond-to-competition": "Respond to competition",
  "verify-impact": "Verify impact",
};

/* What the finding is measured AGAINST. This single field decides the
   outcome category, so nobody ever has to arbitrate whether a
   competitive shelf gap is a shelf story or a competitor story: if the
   yardstick is a rival, it is a competitor story. It is also what the
   Competition page selects on, so that page and the category chip can
   never drift apart. */
export type Benchmark = "target" | "rival" | "prior-period";

/* Risks and wins rank differently — a compliment must never lead the
   Executive Dashboard over a stockout. Every current rule is
   risk-framed; the field exists because Verify Impact (phase B.4) is
   the first detector that reports good news. */
export type Direction = "risk" | "win";

/* How the finding was arrived at over time. Point-in-time findings
   make no claim about change at all, which is the honest default and
   the one every rule but R14 uses today. */
export type ComparisonBasis = "point-in-time" | "market-sample" | "like-for-like";

/* The ONE axis a finding may specialise along. Crossed slices
   (Baghdad × supermarkets) are deliberately out of scope: they are
   where the card count explodes and where "materially different"
   stops being defensible. A crossed slice is a breakdown row. */
export type Axis = "market" | "governorate" | "district" | "channel" | "outlet";

/* Ordered widest to narrowest — a finding's parent is always the same
   phenomenon one step to the left. */
const AXIS_RANK: Record<Axis, number> = {
  market: 0,
  governorate: 1,
  channel: 1,
  district: 2,
  outlet: 3,
};

export type EvidenceQuality = "high" | "medium" | "limited";
export type PriorityBand = "high" | "medium" | "low";

export type DecisionInsight = Insight & {
  outcome: Outcome;
  benchmark: Benchmark;
  direction: Direction;
  comparisonBasis: ComparisonBasis;
  axis: Axis;
  /* Which slice along that axis — a governorate id, a channel, a
     district key, an outlet id. Undefined at market level. */
  axisValue?: string;
  /* The phenomenon this finding is ABOUT, with the slice removed. Two
     insights sharing a key are the same market fact seen at two
     resolutions, and exactly one of them should be a card. */
  phenomenon: string;
  /* Set when this finding was folded into a wider one. Suppressed
     findings are still computed and still carried: they are what the
     detail view's breakdown is made of, and they are the answer to
     "why isn't Basra a card?". */
  parentId?: string;
  priority: number;
  priorityBand: PriorityBand;
  quality: EvidenceQuality;
  /* Share of the audited panel's commercial weight this finding
     touches — see `scopeWeight`. Carried so the card can show the
     ranking basis rather than assert a band. */
  reach: number;
};

/* ------------------------------------------------------------------
   RULE → OUTCOME

   Assigned by benchmark, mechanically. Every rule appears exactly
   once; the test in this module's suite proves the map is total, so a
   thirteenth rule cannot be added without landing somewhere.
------------------------------------------------------------------ */
type Classification = {
  outcome: Outcome;
  benchmark: Benchmark;
  direction: Direction;
  basis: ComparisonBasis;
};

export const RULE_CLASS: Record<RuleId, Classification> = {
  /* Listed lines standing empty — the shelf is agreed and earning
     nothing. Measured against the outlet's own listings. */
  "r1-outlet-gaps": { outcome: "protect-sales", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* A district holding less shelf than its own city does. */
  "r2-district-deficit": { outcome: "win-the-shelf", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* A client SKU behind the same-pack rivals it sits next to — the
     yardstick is a competitor's distribution, so this is competitive
     even though it reads as a distribution rule. */
  "r3-distribution-gap": { outcome: "respond-to-competition", benchmark: "rival", direction: "risk", basis: "point-in-time" },
  /* Whose facings fill the space when the client is out. */
  "r4-rival-substitution": { outcome: "respond-to-competition", benchmark: "rival", direction: "risk", basis: "point-in-time" },
  "r5-price-cluster": { outcome: "optimize-pricing", benchmark: "target", direction: "risk", basis: "point-in-time" },
  "r6-channel-gap": { outcome: "protect-sales", benchmark: "target", direction: "risk", basis: "point-in-time" },
  "r7-shelf-position": { outcome: "win-the-shelf", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* An outlet that lists the client and stocks none of it. */
  "r9-dark-outlet": { outcome: "protect-sales", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* Range selling, not stock: SKUs the outlet could list and doesn't. */
  "r11-assortment-gap": { outcome: "grow-distribution", benchmark: "target", direction: "risk", basis: "point-in-time" },
  "r13-posm-absent": { outcome: "improve-execution", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* Six-month movement, judged against the city's own detection floor.
     The panel rotates, so this is a market-sample change and says so. */
  "r14-competitor-movement": { outcome: "respond-to-competition", benchmark: "rival", direction: "risk", basis: "market-sample" },
  "r15-sku-stockout": { outcome: "protect-sales", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* Stocked well and still short of the fixture: the yardstick is the
     shelf par, so this is a shelf decision, not a competitor one. */
  "c1-stocked-not-shown": { outcome: "win-the-shelf", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* A core line absent from doors that carry the rest of the range. */
  "c2-core-range-missing": { outcome: "grow-distribution", benchmark: "target", direction: "risk", basis: "point-in-time" },
  /* Measured against a rival's fixture and a rival's promotion
     coverage, so the benchmark rule sends both to competition. */
  "r16-share-gap": { outcome: "respond-to-competition", benchmark: "rival", direction: "risk", basis: "point-in-time" },
  "r17-promo-gap": { outcome: "respond-to-competition", benchmark: "rival", direction: "risk", basis: "point-in-time" },
  /* The only like-for-like finding in the portal: the same outlets on
     both ends of the comparison. Its direction is not fixed — a
     follow-up can report a win or a worsening — so verifyImpact.ts
     sets it per finding rather than reading it from here. */
  "v1-follow-up-result": { outcome: "verify-impact", benchmark: "prior-period", direction: "win", basis: "like-for-like" },
};

/* ------------------------------------------------------------------
   SEVERITY, NORMALISED

   The problem this solves: price compliance moves on a 0–100 scale and
   average facings on a 0–3 one, so a formula built on raw gap size
   would rank pricing first for ever, whatever the market did.

   The fix is that each rule ALREADY normalises against its own scale —
   that is exactly what `THRESHOLDS` is: a per-rule warning and
   critical cut-off argued against what this panel produces. A rule
   emitting "critical" has said "large by my own measure", and that
   statement is comparable across rules in a way that 26 price
   readings versus 1.4 facings never is.

   So the MVP reads severity as the normaliser it already is. It is
   coarse — three levels — and phase B can refine any rule by having it
   emit a continuous `magnitude`; the shape below is ready for that and
   the rest of the scoring does not change when it arrives.
------------------------------------------------------------------ */
const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 1,
  warning: 0.62,
  watch: 0.3,
};

/* ------------------------------------------------------------------
   SCOPE, WEIGHTED BY COMMERCIAL SIZE

   Counting outlets would say a finding across forty kiosks matters as
   much as one across forty hypermarkets. Every outlet already carries
   a `volume` footfall weight, so the denominator is the audited
   panel's total weight and the numerator is the weight this finding
   touches. Nothing is configured and nothing is asserted.

   Compressed with a square root because reach has diminishing
   returns: going from one outlet to forty changes what a reader should
   do far more than going from three hundred to three hundred and
   forty, and a linear term would let any market-wide rule win by
   default.
------------------------------------------------------------------ */
export function scopeWeight(insight: Insight, view: MarketView): number {
  const weight = new Map(view.outlets.map((o) => [o.id, o.volume]));
  let total = 0;
  for (const v of weight.values()) total += v;
  if (total === 0) return 0;
  let touched = 0;
  for (const posId of insight.affected) touched += weight.get(posId) ?? 0;
  return Math.sqrt(Math.min(1, touched / total));
}

/* ------------------------------------------------------------------
   EVIDENCE QUALITY

   Not a confidence score and not a model's opinion. Two measured
   facts: whether the finding was observed or projected — the
   distinction insights.ts already draws and already ranks on — and
   whether it rests on enough outlets to mean anything.

   The outlet floor is the market detection floor read as a percentage
   of the panel: below roughly that share, a rate computed over the
   affected set moves by more than the thresholds that judge it.
------------------------------------------------------------------ */
const LIMITED_OUTLETS = 5;

export function qualityOf(insight: Insight, view: MarketView): EvidenceQuality {
  /* `view.outlets` is already the audited set — applyFilters keeps
     the visited subset apart from everything in scope. */
  const panel = view.outlets.length;
  const floorShare = SHARE_FLOOR_PT.market / 100;
  const reached = insight.affected.length;

  /* A single-outlet finding is not thin evidence — it is a complete
     census of the thing it describes. R1 counted the empty facings in
     front of it. Thinness only applies to a finding that GENERALISES
     over a set. */
  if (insight.scope.outlets <= 1) {
    return insight.confidence === "measured" ? "high" : "medium";
  }
  if (reached < LIMITED_OUTLETS || reached < panel * floorShare) return "limited";
  return insight.confidence === "measured" ? "high" : "medium";
}

const QUALITY_WEIGHT: Record<EvidenceQuality, number> = {
  high: 1,
  medium: 0.75,
  limited: 0.45,
};

/* ------------------------------------------------------------------
   PRIORITY

   A weighted SUM, not a product. A product lets one small factor
   annihilate the others — a thin-but-real finding would score near
   zero however large it is, and disappear rather than appear with a
   caveat. The sum lets each factor argue its case and keeps the
   ordering readable: severity leads, reach adjusts, evidence discounts.

   The weights are a declaration, and they are shown to the reader in
   the detail view. Ranking is the only editorial voice left in a
   portal that refuses to write opinions, so it has to be inspectable
   rather than inferred.
------------------------------------------------------------------ */
export const PRIORITY_WEIGHTS = { severity: 0.55, reach: 0.3, quality: 0.15 } as const;

/* Cut-offs placed on the OBSERVED distribution, not on round numbers.

   Over the unfiltered September panel the engine returns 214 findings
   scoring 0.438 to 0.887, with p25 0.464, p50 0.499, p75 0.507 and p90
   0.674. The range is narrow and bottom-heavy because most findings are
   single-outlet clusters: warning severity, near-zero reach, and
   therefore near-identical scores. A band set at a round 0.4 would have
   put every one of the 214 into "medium or above" and the label would
   have meant nothing.

   So: high is the top decile, medium is everything above the median,
   and low is the bottom half — which is exactly the population of
   one-outlet, one-rule, warning-level findings that a reader should be
   able to skip. Each band names a real group. */
export const PRIORITY_BANDS = { high: 0.67, medium: 0.5 } as const;

export function bandOf(priority: number): PriorityBand {
  if (priority >= PRIORITY_BANDS.high) return "high";
  if (priority >= PRIORITY_BANDS.medium) return "medium";
  return "low";
}

export function priorityOf(
  insight: Insight,
  reach: number,
  quality: EvidenceQuality
): number {
  const score =
    SEVERITY_WEIGHT[insight.severity] * PRIORITY_WEIGHTS.severity +
    reach * PRIORITY_WEIGHTS.reach +
    QUALITY_WEIGHT[quality] * PRIORITY_WEIGHTS.quality;
  return Math.round(score * 1000) / 1000;
}

/* ------------------------------------------------------------------
   PLACING A FINDING ON THE AXIS

   Read from the entities a rule already tags itself with. Narrowest
   wins: an outlet-level finding is not also a governorate finding just
   because the outlet sits in one.
------------------------------------------------------------------ */
export function axisOf(insight: Insight): { axis: Axis; axisValue?: string } {
  const e = insight.entities;
  if (e.posId) return { axis: "outlet", axisValue: e.posId };
  if (e.district) return { axis: "district", axisValue: `${e.governorateId ?? ""}|${e.district}` };
  if (e.channel) return { axis: "channel", axisValue: e.channel };
  if (e.governorateId) return { axis: "governorate", axisValue: e.governorateId };
  return { axis: "market" };
}

/* The phenomenon, with the slice stripped off. Same rule, same brand,
   same SKU = the same market fact, wherever it was observed. */
export function phenomenonOf(insight: Insight): string {
  const e = insight.entities;
  return [insight.rule, e.brandId ?? clientBrand.id, e.skuId ?? "*"].join(":");
}

/* ------------------------------------------------------------------
   SUBSUMPTION

   One market phenomenon, one card.

   The rule, in full: within a phenomenon, findings are ordered widest
   first. A narrower finding earns its own card only when

     1. it differs from its parent by more than max(detection floor,
        MIN_DIVERGENCE_PT) — the floor keeps it statistically honest,
        the minimum stops promotion of a difference nobody would act
        on; and
     2. at least one SIBLING also diverges.

   Condition 2 is the one that is easy to leave out and shouldn't be.
   If exactly one child differs from the market, that child IS the
   market's story — the parent card names it in its scope line, and
   splitting it out prints the same fact twice. It takes two divergent
   children before there is a second story to tell.

   ONE FINDING IS NEVER PROMOTED, whatever it says: an outlet-level
   child. "Materially different from the wider market" is a claim about
   a SEGMENT — a governorate, a channel, a district — where a rate is
   computed over a population and can genuinely diverge from another
   population's. A single outlet is a sample of size one. It is an
   INSTANCE of the market phenomenon, not a rival account of it, and
   promoting it would put three hundred street names on a page whose
   job is to say what is happening in the market.

   This is what makes the rollups in insights.ts work: a per-outlet rule
   emits its instances and one market-level parent, and the instances
   become that parent's breakdown rather than 123 cards under one chip.

   Suppressed findings keep their `parentId` and stay in the
   collection. They are what the breakdown selector renders.

   NOTE ON WHAT THIS DOES TODAY. The twelve current rules each emit at
   one resolution — R2 per district, R6 per channel, R15 per SKU across
   the market — so almost no phenomenon currently arrives at two
   levels at once and almost nothing is suppressed. That is expected.
   The mechanism is built here, with its tests, because phase B adds
   the detectors that slice, and discovering the rule then would mean
   discovering it inside a page rewrite.
------------------------------------------------------------------ */
export const MIN_DIVERGENCE_PT = 5;

/* The measured quantity two findings of the same phenomenon are
   compared on. Severity is the only quantity every rule states on the
   same scale, so divergence is read as a difference in severity
   weight, expressed in points. A rule that emits a continuous
   magnitude in phase B can override this by carrying it. */
const magnitudeOf = (i: Insight) => SEVERITY_WEIGHT[i.severity] * 100;

function floorFor(insight: DecisionInsight): number {
  if (insight.axis === "governorate" && insight.axisValue) {
    return SHARE_FLOOR_PT[insight.axisValue] ?? SHARE_FLOOR_PT.market;
  }
  return SHARE_FLOOR_PT.market;
}

export function subsume(insights: DecisionInsight[]): DecisionInsight[] {
  const groups = new Map<string, DecisionInsight[]>();
  for (const insight of insights) {
    groups.set(insight.phenomenon, [...(groups.get(insight.phenomenon) ?? []), insight]);
  }

  const parentOf = new Map<string, string>();

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const byRank = [...group].sort((a, b) => AXIS_RANK[a.axis] - AXIS_RANK[b.axis]);

    for (let level = 1; level < byRank.length; level += 1) {
      const child = byRank[level];
      /* The nearest strictly wider finding of the same phenomenon. */
      const parent = byRank
        .slice(0, level)
        .reverse()
        .find((p) => AXIS_RANK[p.axis] < AXIS_RANK[child.axis]);
      if (!parent) continue;

      const bar = Math.max(floorFor(child), MIN_DIVERGENCE_PT);
      const diverges = (c: DecisionInsight) =>
        Math.abs(magnitudeOf(c) - magnitudeOf(parent)) > bar;

      const siblings = byRank.filter(
        (s) => s !== child && AXIS_RANK[s.axis] === AXIS_RANK[child.axis]
      );
      const promoted =
        child.axis !== "outlet" && diverges(child) && siblings.some(diverges);
      if (!promoted) parentOf.set(child.id, parent.id);
    }
  }

  return insights.map((i) =>
    parentOf.has(i.id) ? { ...i, parentId: parentOf.get(i.id) } : i
  );
}

/* ------------------------------------------------------------------
   THE ENTRY POINT

   Takes what insights.ts detected and returns the same findings as
   decisions. Pure, memoisable, and shaped so the whole thing can move
   behind an API later without a single component changing.
------------------------------------------------------------------ */
export type DecisionReport = {
  /* Everything, suppressed children included. */
  all: DecisionInsight[];
  /* What a page shows: parents and promoted children, priority first. */
  cards: DecisionInsight[];
  byOutcome: Record<Outcome, DecisionInsight[]>;
  /* Children keyed by the finding that absorbed them, for the detail
     view's breakdown. */
  children: Map<string, DecisionInsight[]>;
};

export function classify(insight: Insight, view: MarketView): DecisionInsight {
  const cls = RULE_CLASS[insight.rule];
  const reach = scopeWeight(insight, view);
  const quality = qualityOf(insight, view);
  const priority = priorityOf(insight, reach, quality);
  return {
    ...insight,
    outcome: cls.outcome,
    benchmark: cls.benchmark,
    direction: cls.direction,
    comparisonBasis: cls.basis,
    ...axisOf(insight),
    phenomenon: phenomenonOf(insight),
    reach: Math.round(reach * 1000) / 1000,
    quality,
    priority,
    priorityBand: bandOf(priority),
  };
}

/* Risks before wins at equal priority: a portal that opens with a
   compliment while a line is out of stock has misread the room. */
export const byPriority = (a: DecisionInsight, b: DecisionInsight) => {
  if (a.direction !== b.direction) return a.direction === "risk" ? -1 : 1;
  if (b.priority !== a.priority) return b.priority - a.priority;
  return a.id.localeCompare(b.id);
};

/* ------------------------------------------------------------------
   THE TOP OF THE LIST

   Priority alone produces a repetitive board. Ranked straight, the
   September panel opens with three consecutive "3 Pepsi lines empty at
   <outlet>" cards: the same rule, the same severity, three different
   street names, and nothing a reader learns from the second and third
   that they did not learn from the first.

   insights.ts already guards its own dashboard picks this way. The
   guard belongs with ranking rather than with any one page, so it lives
   here and every surface gets it: one card per rule until the rules run
   out, then the next by priority.
------------------------------------------------------------------ */
export function topCards(report: DecisionReport, limit = 5): DecisionInsight[] {
  const picked: DecisionInsight[] = [];
  const usedRules = new Set<RuleId>();
  for (const insight of report.cards) {
    if (picked.length >= limit) break;
    if (usedRules.has(insight.rule)) continue;
    usedRules.add(insight.rule);
    picked.push(insight);
  }
  for (const insight of report.cards) {
    if (picked.length >= limit) break;
    if (!picked.includes(insight)) picked.push(insight);
  }
  return picked;
}

/* `extra` is for findings that are already decisions and were never
   detected from this month's panel — today that means follow-up
   results, which are facts about a request rather than about the
   market. They go through subsumption and ranking with everything
   else, so a page never has to know where a card came from. */
export function decide(
  insights: Insight[],
  view: MarketView,
  extra: DecisionInsight[] = []
): DecisionReport {
  const all = subsume([...insights.map((i) => classify(i, view)), ...extra]).sort(byPriority);
  const cards = all.filter((i) => !i.parentId);

  const byOutcome = Object.fromEntries(
    OUTCOMES.map((o) => [o, cards.filter((i) => i.outcome === o)])
  ) as Record<Outcome, DecisionInsight[]>;

  const children = new Map<string, DecisionInsight[]>();
  for (const insight of all) {
    if (!insight.parentId) continue;
    children.set(insight.parentId, [...(children.get(insight.parentId) ?? []), insight]);
  }

  return { all, cards, byOutcome, children };
}
