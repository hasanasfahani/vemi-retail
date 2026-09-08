/* ============================================================
   FINDINGS → DECISIONS

   The insight engine answers "what is wrong". This answers "what do I
   do about it", and they are not the same list.

   Before this file, Command Center ranked findings against each other
   and its top five came back as ERB-302, ERB-302 again, ERB-1002,
   ERB-903, ERB-1803 — five findings that are five instances of ONE
   decision: get stock back on shelf. Correct ranking, useless page.
   Eleven rules over a hundred outlets will always produce many
   instances of a few problems, so the fix is not to re-rank the
   findings but to count them once, by the move they imply.

   The rollup does not weaken Phase 12's confidence tiering — it
   applies it a level up. A decision carrying directly measured
   evidence outranks one resting only on projections, exactly as an
   individual measured finding outranked an estimated one before.
   ============================================================ */

import type { Insight, InsightReport, Momentum, RuleId, Severity } from "./insights";
import { brandName, clientBrand } from "./portalData";
import { formatImpact } from "./economics";

export type DecisionId =
  | "replenish"
  | "cover"
  | "list"
  | "negotiate"
  | "defend";

/* Which rule implies which move. Every presence rule maps to exactly
   one decision — if a rule ever needs two, that is a sign the rule is
   measuring two things and should be split instead. */
const RULE_DECISION: Record<RuleId, DecisionId | "reprice"> = {
  "r1-outlet-gaps": "replenish",
  "r9-dark-outlet": "replenish",
  "r2-district-deficit": "cover",
  "r6-channel-gap": "cover",
  "r12-geographic-concentration": "cover",
  "r3-distribution-gap": "list",
  "r11-assortment-gap": "list",
  "r7-fixture-imbalance": "negotiate",
  "r4-rival-substitution": "defend",
  "r5-price-cluster": "reprice",
};

export type Decision = {
  id: DecisionId;
  /* The move, in the imperative. This is the sentence the executive is
     meant to leave the page able to repeat. */
  headline: string;
  /* Why this is one decision rather than N problems. */
  detail: string;
  impact: { value: number; label: string };
  outlets: number;
  severity: Severity;
  confidence: "measured" | "estimated";
  findings: Insight[];
  /* Where the proof lives, for the deep link. */
  href: string;
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  watch: 2,
};

/* The same normalisation the findings use, at decision altitude. */
const intensityOf = (d: Decision) =>
  d.outlets > 0 ? d.impact.value / d.outlets : 0;

const uniqueOutlets = (findings: Insight[]) => {
  /* Findings scoped to a single named outlet can be counted by id;
     district- and channel-scoped ones already carry an outlet count.
     Summing the two would double-count, so single-outlet findings are
     de-duplicated by posId and the rest contribute their own scope. */
  const named = new Set<string>();
  let broad = 0;
  for (const f of findings) {
    if (f.scope.outlets === 1 && f.entities.posId) named.add(f.entities.posId);
    else broad += f.scope.outlets;
  }
  return named.size + broad;
};

function buildHeadline(
  id: DecisionId,
  findings: Insight[],
  outlets: number,
  momentum: Momentum | null
): { headline: string; detail: string } {
  const stores = `${outlets} outlet${outlets === 1 ? "" : "s"}`;

  switch (id) {
    case "replenish": {
      const dark = findings.filter((f) => f.rule === "r9-dark-outlet").length;
      const clusters = findings.filter((f) => f.rule === "r1-outlet-gaps").length;
      return {
        headline: `Get stock back on shelf at ${stores}`,
        /* No "empty at both visits" clause any more: a rotating panel
           cannot confirm a gap twice, so the sentence describes what
           was actually seen — a shelf slot with nothing in it. */
        detail: [
          dark ? `${dark} carrying nothing of yours at all` : null,
          clusters ? `${clusters} with several lines empty at once` : null,
        ]
          .filter(Boolean)
          .join(", ") + ", found on the visit that audited them.",
      };
    }
    case "cover": {
      const concentration = findings.find(
        (f) => f.rule === "r12-geographic-concentration"
      );
      if (concentration) {
        return {
          /* R12's scope label already reads "N adjacent districts", so
             use it as-is. Substituting "adjacent" into it produced
             "4 adjacent adjacent districts" on every surface that
             renders this decision. */
          headline: `Route a rep through ${concentration.scope.label}`,
          detail:
            "These districts are behind and next to each other, so one planned run covers all of them rather than several separate visits.",
        };
      }
      const areas = findings.filter((f) => f.rule === "r2-district-deficit").length;
      const channels = findings.filter((f) => f.rule === "r6-channel-gap").length;
      return {
        headline: `Increase coverage across ${
          areas ? `${areas} district${areas === 1 ? "" : "s"}` : ""
        }${areas && channels ? " and " : ""}${
          channels ? `${channels} trade channel${channels === 1 ? "" : "s"}` : ""
        }`,
        detail: `${stores} sit in parts of the market where you hold less shelf than you do citywide.`,
      };
    }
    case "list":
      return {
        headline: `Get missing ${clientBrand.name} SKUs onto the range at ${stores}`,
        detail:
          "These stores stock you, but carry less of your range than comparable stores of the same format. A listing conversation, not a stock one.",
      };
    case "negotiate":
      return {
        headline: "Rebalance your chilled and ambient shelf space",
        detail:
          "Your share of one fixture type trails the other, which is a space negotiation rather than a replenishment problem.",
      };
    case "defend": {
      /* R4's own rival, not the share-mover.

         Momentum names whoever gained share in this window; R4 names
         whoever is standing in your gaps, by pack. They are different
         questions and often different brands, and the DEFENCE decision
         is about the second — you defend a fixture, not a league
         table. The momentum line keeps its own place on the page. */
      const rival =
        findings[0]?.entities.brandId ??
        momentum?.rivalBrandId ??
        null;
      const name = rival ? brandName(rival) : "a rival";
      return {
        headline: `Defend your position against ${name}`,
        /* The finding already states which pack and how much; repeating
           a share statistic here would answer a question the decision
           is not about. */
        detail:
          findings[0]?.detail ?? `${name} is taking the space where you go out of stock.`,
      };
    }
  }
}

/* Pricing keeps its own currency and its own block, exactly as agreed
   in Phase 8 — breaching readings do not convert to facing-days, and
   forcing them into one ranking would invent a conversion nobody could
   defend. So "reprice" is returned separately rather than competing
   with the presence decisions. */
export type DecisionReport = {
  decisions: Decision[];
  reprice: Decision | null;
};

export function buildDecisions(report: InsightReport): DecisionReport {
  const grouped = new Map<DecisionId | "reprice", Insight[]>();
  for (const insight of [...report.presence, ...report.pricing]) {
    const id = RULE_DECISION[insight.rule];
    grouped.set(id, [...(grouped.get(id) ?? []), insight]);
  }

  const build = (id: DecisionId | "reprice"): Decision | null => {
    const findings = grouped.get(id);
    if (!findings?.length) return null;

    /* R12 restates the districts R2 already found — it is a framing of
       them, not additional loss. Counting both would inflate the
       decision's impact and its outlet count on exactly the finding
       built to make the group legible. It stays in `findings` (it is
       the sentence that sells the decision) but is excluded from the
       arithmetic. */
    const counted = findings.filter(
      (f) => f.rule !== "r12-geographic-concentration"
    );
    const outlets = uniqueOutlets(counted.length ? counted : findings);
    const value = Math.round(
      (counted.length ? counted : findings).reduce((s, f) => s + f.impact.value, 0)
    );
    const severity = findings
      .map((f) => f.severity)
      .sort((a, b) => SEVERITY_ORDER[a] - SEVERITY_ORDER[b])[0];
    const confidence = findings.some((f) => f.confidence === "measured")
      ? "measured"
      : "estimated";

    if (id === "reprice") {
      return {
        id: "negotiate", // unused for pricing; kept off the presence ranking
        headline: `Fix pricing at ${outlets} retailer${outlets === 1 ? "" : "s"}`,
        detail:
          "Each of these is one conversation with one retailer that corrects every breaching line in that store at once.",
        impact: { value, label: `${value} breaching readings` },
        outlets,
        severity,
        confidence,
        findings,
        href: "/dashboard/pricing",
      };
    }

    const { headline, detail } = buildHeadline(id, findings, outlets, report.momentum);
    return {
      id,
      headline,
      detail,
      impact: { value, label: `${formatImpact(value)} at stake` },
      outlets,
      severity,
      confidence,
      findings: findings
        .slice()
        .sort((a, b) => b.impact.value - a.impact.value),
      href: findings[0].evidence.href,
    };
  };

  const order: DecisionId[] = ["replenish", "cover", "list", "negotiate", "defend"];
  const decisions = order
    .map(build)
    .filter((d): d is Decision => d !== null)
    /* Measured evidence first, then by impact per outlet touched.

       Careful: this looks like the findings' intensity rule but it is
       justified differently, and the difference matters. At finding
       level, dividing by scope corrects for a diffuse rule inflating
       its own signal. At decision level it means RETURN PER STORE
       VISITED — outlets are the unit of work a rep actually spends, so
       recovering 2,270 facing-days across 9 stores is a better day
       than 4,611 across all 100. Same arithmetic, different argument;
       do not collapse the two comments into one. */
    .sort((a, b) => {
      if (a.confidence !== b.confidence) return a.confidence === "measured" ? -1 : 1;
      return intensityOf(b) - intensityOf(a);
    });

  return { decisions, reprice: build("reprice") };
}
