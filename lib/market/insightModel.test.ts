/* The decision layer classifies; it must never invent. These tests
   guard the three things it decides — category, priority, subsumption —
   and one thing it must not do, which is change a finding. */

import { describe, expect, it } from "vitest";
import { current } from "./index";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { generateInsights, RULE_IDS, SHARE_FLOOR_PT, type Insight } from "./insights";
import {
  MIN_DIVERGENCE_PT,
  MIN_FOLLOW_UP_POS,
  RULE_KPI,
  followUpBlock,
  OUTCOMES,
  PRIORITY_WEIGHTS,
  RULE_CLASS,
  axisOf,
  bandOf,
  classify,
  decide,
  phenomenonOf,
  priorityOf,
  qualityOf,
  scopeWeight,
  subsume,
  topCards,
  type DecisionInsight,
} from "./insightModel";

const view = applyFilters(EMPTY_FILTERS, current);
const raw = generateInsights(view).all;
const report = decide(raw, view);

/* A minimal finding, so a test can state exactly the one thing it is
   about instead of hunting the panel for a case that happens to fit. */
const make = (over: Partial<Insight> = {}): Insight => ({
  id: "x1",
  rule: "r2-district-deficit",
  category: "critical",
  severity: "warning",
  headline: "h",
  detail: "d",
  impact: { value: 10, unit: "outlets", label: "10" },
  confidence: "measured",
  scope: { outlets: 10, label: "s" },
  cta: { href: "/portal", label: "open" },
  affected: [],
  money: null,
  evidence: { formula: "f", table: { columns: [], rows: [] } },
  entities: {},
  ...over,
});

describe("rule → outcome", () => {
  it("classifies every rule, so a new rule cannot land nowhere", () => {
    for (const rule of RULE_IDS) {
      expect(RULE_CLASS[rule], rule).toBeDefined();
      expect(OUTCOMES).toContain(RULE_CLASS[rule].outcome);
    }
  });

  it("sends every rival-benchmarked rule to Respond to competition, and only those", () => {
    for (const rule of RULE_IDS) {
      const { benchmark, outcome } = RULE_CLASS[rule];
      expect(outcome === "respond-to-competition", rule).toBe(benchmark === "rival");
    }
  });

  it("keeps a competitive distribution gap out of Grow distribution", () => {
    /* R3 reads like a distribution rule and is measured against rival
       packs, so the benchmark rule — not the topic — has to decide it. */
    expect(RULE_CLASS["r3-distribution-gap"].outcome).toBe("respond-to-competition");
    expect(RULE_CLASS["r11-assortment-gap"].outcome).toBe("grow-distribution");
  });
});

describe("priority", () => {
  it("ranks a market-wide finding above the same finding at one outlet", () => {
    const wide = make({ affected: view.outlets.slice(0, 300).map((o) => o.id) });
    const narrow = make({ affected: [view.outlets[0].id] });
    const score = (i: Insight) =>
      priorityOf(i, scopeWeight(i, view), qualityOf(i, view));
    expect(score(wide)).toBeGreaterThan(score(narrow));
  });

  it("weights commercial size, not outlet count", () => {
    /* Same number of outlets, different footfall: the busier set must
       score higher, or "40 kiosks" and "40 hypermarkets" rank alike. */
    const sorted = [...view.outlets].sort((a, b) => b.volume - a.volume);
    const busy = make({ affected: sorted.slice(0, 40).map((o) => o.id) });
    const quiet = make({ affected: sorted.slice(-40).map((o) => o.id) });
    expect(scopeWeight(busy, view)).toBeGreaterThan(scopeWeight(quiet, view));
  });

  it("discounts thin evidence without annihilating it", () => {
    /* The reason the score is a weighted sum. A product would drive a
       limited-sample finding to near zero and hide it; it should be
       ranked down and still reachable. */
    const thin = priorityOf(make({ severity: "critical" }), 0, "limited");
    const solid = priorityOf(make({ severity: "critical" }), 0, "high");
    expect(thin).toBeLessThan(solid);
    expect(thin).toBeGreaterThan(0.5 * solid);
  });

  it("puts the weights on the record", () => {
    const total =
      PRIORITY_WEIGHTS.severity + PRIORITY_WEIGHTS.reach + PRIORITY_WEIGHTS.quality;
    expect(total).toBeCloseTo(1);
  });

  it("bands the observed panel into three non-empty groups", () => {
    /* Cut-offs are placed on the real distribution. If a future change
       to the rules flattens it, this fails rather than quietly leaving
       a label that no finding ever carries. */
    const bands = new Set(report.all.map((i) => i.priorityBand));
    expect(bands).toEqual(new Set(["high", "medium", "low"]));
  });

  it("bands monotonically", () => {
    expect(bandOf(0.9)).toBe("high");
    expect(bandOf(0.55)).toBe("medium");
    expect(bandOf(0.2)).toBe("low");
  });
});

describe("evidence quality", () => {
  it("does not call a single-outlet census thin", () => {
    /* R1 counted the empty facings standing in front of it. That is a
       complete description of one outlet, not a small sample of many. */
    const one = make({ scope: { outlets: 1, label: "o" }, affected: [view.outlets[0].id] });
    expect(qualityOf(one, view)).toBe("high");
  });

  it("calls a generalisation over a handful of outlets limited", () => {
    const few = make({
      scope: { outlets: 3, label: "three" },
      affected: view.outlets.slice(0, 3).map((o) => o.id),
    });
    expect(qualityOf(few, view)).toBe("limited");
  });
});

describe("placing a finding on the axis", () => {
  it("takes the narrowest tag, so an outlet is not also a governorate", () => {
    expect(axisOf(make({ entities: { posId: "pos-1", governorateId: "baghdad" } })).axis)
      .toBe("outlet");
    expect(axisOf(make({ entities: { governorateId: "baghdad" } })).axis).toBe("governorate");
    expect(axisOf(make({ entities: {} })).axis).toBe("market");
  });

  it("strips the slice from the phenomenon", () => {
    const a = make({ entities: { skuId: "sku-1", governorateId: "baghdad" } });
    const b = make({ entities: { skuId: "sku-1", governorateId: "basra" } });
    expect(phenomenonOf(a)).toBe(phenomenonOf(b));
  });
});

describe("subsumption", () => {
  const at = (id: string, axis: DecisionInsight["axis"], severity: Insight["severity"], axisValue?: string) =>
    ({
      ...classify(make({ id, severity }), view),
      axis,
      axisValue,
      phenomenon: "p",
    }) as DecisionInsight;

  it("folds a child that agrees with its parent", () => {
    const out = subsume([
      at("market", "market", "warning"),
      at("a", "governorate", "warning", "basra"),
      at("b", "governorate", "warning", "erbil"),
    ]);
    expect(out.filter((i) => i.parentId)).toHaveLength(2);
    expect(out.find((i) => i.id === "a")?.parentId).toBe("market");
  });

  it("keeps a lone divergent child folded — it IS the parent's story", () => {
    const out = subsume([
      at("market", "market", "warning"),
      at("a", "governorate", "critical", "basra"),
      at("b", "governorate", "warning", "erbil"),
    ]);
    expect(out.find((i) => i.id === "a")?.parentId).toBe("market");
  });

  it("promotes children only once two of them diverge", () => {
    const out = subsume([
      at("market", "market", "watch"),
      at("a", "governorate", "critical", "basra"),
      at("b", "governorate", "critical", "erbil"),
    ]);
    expect(out.find((i) => i.id === "a")?.parentId).toBeUndefined();
    expect(out.find((i) => i.id === "b")?.parentId).toBeUndefined();
  });

  it("never folds findings that are about different things", () => {
    const one = { ...at("a", "governorate", "warning", "basra"), phenomenon: "p1" };
    const two = { ...at("b", "governorate", "critical", "erbil"), phenomenon: "p2" };
    expect(subsume([one, two]).every((i) => !i.parentId)).toBe(true);
  });

  it("uses the governorate's own detection floor when it exceeds the minimum", () => {
    /* Karbala's floor is 5.57pt, above the 5pt minimum, so a child
       there has to clear the larger of the two. */
    expect(SHARE_FLOOR_PT.karbala).toBeGreaterThan(MIN_DIVERGENCE_PT);
  });
});

describe("the report", () => {
  it("changes nothing about the findings it classifies", () => {
    /* The decision layer is allowed to add fields. It must never
       restate a headline, a number or an affected list. */
    for (const insight of report.all) {
      const source = raw.find((r) => r.id === insight.id);
      expect(source).toBeDefined();
      expect(insight.headline).toBe(source!.headline);
      expect(insight.impact).toEqual(source!.impact);
      expect(insight.affected).toEqual(source!.affected);
    }
    expect(report.all).toHaveLength(raw.length);
  });

  it("shows cards, keeps children reachable", () => {
    const hidden = report.all.filter((i) => i.parentId);
    expect(report.cards).toHaveLength(report.all.length - hidden.length);
    for (const child of hidden) {
      expect(report.children.get(child.parentId!)).toContain(child);
    }
  });

  it("leads with risks, not compliments", () => {
    const firstWin = report.cards.findIndex((i) => i.direction === "win");
    const lastRisk = report.cards.map((i) => i.direction).lastIndexOf("risk");
    if (firstWin !== -1) expect(firstWin).toBeGreaterThan(lastRisk);
  });

  it("does not open the board with three of the same rule", () => {
    /* Ranked on priority alone the September panel leads with three
       consecutive single-outlet gap clusters. */
    const rules = topCards(report, 5).map((i) => i.rule);
    expect(new Set(rules).size).toBe(rules.length);
  });

  it("puts every card in exactly one outcome", () => {
    const counted = OUTCOMES.reduce((s, o) => s + report.byOutcome[o].length, 0);
    expect(counted).toBe(report.cards.length);
  });
});

/* ------------------------------------------------------------------
   PHASE B — rollups, conjunctions and the competitive detectors.
------------------------------------------------------------------ */

describe("rollups", () => {
  it("collapses the per-outlet rules into one card each", () => {
    /* Before rollups the Insights page carried 123 single-door
       assortment findings under one chip — 57% of the page, and no way
       to learn the only thing that matters first: how many doors. */
    const range = report.byOutcome["grow-distribution"];
    expect(range.length).toBeLessThan(5);
    const parent = range.find((i) => i.rule === "r11-assortment-gap");
    expect(parent).toBeDefined();
    expect(report.children.get(parent!.id)!.length).toBeGreaterThan(100);
  });

  it("never restates a number — the total is the sum of its instances", () => {
    for (const rule of ["r1-outlet-gaps", "r11-assortment-gap"] as const) {
      const parent = report.cards.find((i) => i.rule === rule && i.axis === "market");
      expect(parent, rule).toBeDefined();
      const kids = report.children.get(parent!.id) ?? [];
      const summed = kids.reduce((s, k) => s + k.impact.value, 0);
      expect(parent!.impact.value).toBe(summed);
    }
  });

  it("keeps every folded instance reachable", () => {
    const folded = report.all.filter((i) => i.parentId);
    expect(folded.length).toBeGreaterThan(150);
    for (const child of folded) expect(child.axis).toBe("outlet");
  });
});

describe("conjunctions", () => {
  it("refuses a conjunction that is only arithmetic", () => {
    /* C1 looks for doors that stock the client well and still give it
       little shelf — the brief's own flagship example. 166 outlets
       qualify, which sounds like a discovery and is not: independence
       predicts 171.5. The lift gate is the only thing standing between
       that count and a card, so it is tested rather than trusted. */
    expect(report.all.some((i) => i.rule === "c1-stocked-not-shown")).toBe(false);
  });

  it("refuses a conjunction that is rarer than chance", () => {
    /* C2's doors carrying every core line but one run at lift 0.5–0.8:
       fewer than independence predicts, not more. */
    expect(report.all.some((i) => i.rule === "c2-core-range-missing")).toBe(false);
  });
});

describe("competitive detectors", () => {
  it("gives the Competition page something to show", () => {
    const competitive = report.cards.filter((i) => i.benchmark === "rival");
    expect(competitive.length).toBeGreaterThanOrEqual(5);
  });

  it("reports a city shelf gap only above that city's own floor", () => {
    for (const insight of report.all.filter((i) => i.rule === "r16-share-gap")) {
      const floor = SHARE_FLOOR_PT[insight.axisValue ?? "market"] ?? SHARE_FLOOR_PT.market;
      expect(insight.impact.value, insight.axisValue).toBeGreaterThanOrEqual(floor);
    }
  });

  it("selects competitive cards on the benchmark, not on the label", () => {
    /* The Competition page filters on benchmark so the two views cannot
       drift apart when a category is renamed. */
    const byBenchmark = report.cards.filter((i) => i.benchmark === "rival");
    const byOutcome = report.byOutcome["respond-to-competition"];
    expect(byBenchmark).toEqual(byOutcome);
  });
});

describe("headline grammar", () => {
  it("never says '1 outlets'", () => {
    for (const insight of report.all) {
      expect(insight.headline, insight.id).not.toMatch(/\b1 outlets\b/);
      expect(insight.headline, insight.id).not.toMatch(/\b1 [a-z]+s\b(?! )/);
    }
  });

  it("keeps a headline short enough to read at a glance", () => {
    for (const insight of report.cards) {
      expect(insight.headline.length, insight.headline).toBeLessThanOrEqual(96);
    }
  });
});

describe("the trend window never reads past the month in hand", () => {
  it("measures competitor movement from April to the viewed month", () => {
    /* The trend file runs to November so the follow-up cycles have
       somewhere to land. Reading its last point put November movement
       inside a September finding and inflated Basra from the 4.7pt the
       thresholds were calibrated against to 6.8pt. */
    const basra = report.all.find((i) => i.id === "r14-basra");
    expect(basra).toBeDefined();
    expect(basra!.evidence.table.columns).toContain("September 2026");
    expect(basra!.evidence.table.columns).not.toContain("November 2026");
    expect(basra!.impact.value).toBeCloseTo(4.7, 1);
  });
});

describe("what can be re-audited", () => {
  it("classifies a KPI for every rule, or says there is none", () => {
    for (const rule of RULE_IDS) expect(RULE_KPI).toHaveProperty(rule);
  });

  it("refuses to send anyone back to re-measure a competitor", () => {
    /* R4 counts the RIVAL's facings standing where the client is out.
       A follow-up audit of that is asking the wrong question. */
    for (const rule of ["r4-rival-substitution", "r14-competitor-movement", "r16-share-gap", "r17-promo-gap"] as const) {
      expect(RULE_KPI[rule], rule).toBeNull();
    }
  });

  it("blocks a follow-up whose cohort could not read its own result", () => {
    const thin = report.all.find(
      (i) => i.kpi !== null && i.affected.length < MIN_FOLLOW_UP_POS
    );
    expect(thin, "expected at least one narrow finding in the panel").toBeDefined();
    expect(followUpBlock(thin!)).toContain("could not tell a real change from noise");
  });

  it("allows one whose cohort can", () => {
    const wide = report.cards.find(
      (i) => i.kpi !== null && i.affected.length >= MIN_FOLLOW_UP_POS
    );
    expect(wide).toBeDefined();
    expect(followUpBlock(wide!)).toBeNull();
  });

  it("blocks a competitor finding for the reason it is actually blocked", () => {
    const rival = report.cards.find((i) => i.benchmark === "rival");
    expect(followUpBlock(rival!)).toContain("measured on a competitor");
  });
});
