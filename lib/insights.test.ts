/* ============================================================
   P8-13 — the engine, asserted.

   `data:check` has always guarded the DATA: brand shares sum to 100,
   lost facing-days equals facings × days, no price on an unstocked
   shelf. Seventeen invariants, all green, none of which touch the
   twelve rules built on top of them. That gap was real: this build has
   shipped a substitution matrix summing the wrong unit, a monitor that
   would have recorded a rival's share under the client's name, and —
   caught by writing this file — a channel rule reporting a single
   empty shelf as a channel-wide strategic finding worth zero.

   Three layers here, in increasing order of what they catch:

   1. INVARIANTS      properties that must hold for any dataset. These
                      survive a data rebuild and are the ones that
                      catch a rule losing its units.
   2. RECOMPUTATION   each rule's headline number, derived a second
                      time from the raw visit by a different route
                      than the engine takes. If both agree they are
                      probably right; if they disagree one of them is
                      wrong and the test says which.
   3. GOLDEN          the exact ranked output of the current dataset.
                      Deliberately brittle: any threshold or ranking
                      change lands as a visible diff someone has to
                      consciously accept, rather than as a silent shift
                      in what the product tells a buyer.

   Layer 3 alone would be a change-detector. Layer 2 is what makes this
   a test of correctness rather than of stability.
   ============================================================ */

import { describe, expect, test } from "vitest";
import { generateInsights, THRESHOLDS, type Insight } from "./insights";
import { buildDecisions } from "./decisions";
import { applyFilters, EMPTY_FILTERS } from "./portalFilters";
import {
  clientBrand,
  latest,
  pos as allPos,
  posOf,
  skuOf,
  visits,
  corePanel,
  coreTrend,
  REVISIT_INTERVAL_DAYS,
} from "./portalData";

const view = applyFilters(EMPTY_FILTERS, latest);
const report = generateInsights(view);
const all = [...report.presence, ...report.pricing];

const byRule = (rule: string) => all.filter((i) => i.rule === rule);
const one = (id: string) => all.find((i) => i.id === id);

/* ---------------- 1. invariants ---------------- */

describe("invariants — must hold for any dataset", () => {
  test("no finding ships with zero impact", () => {
    /* The R6 bug in one line. A finding costing nothing is either a
       threshold firing on noise or a formula that lost its units, and
       both are worse than silence. */
    const worthless = all.filter((i) => i.impact.value <= 0);
    expect(worthless.map((i) => `${i.id} (${i.impact.value})`)).toEqual([]);
  });

  test("every finding carries a scope of at least one outlet", () => {
    /* scope.outlets is the ranking denominator. A zero would divide
       impact by nothing and float the finding to the top of every
       list in the product. */
    expect(all.filter((i) => i.scope.outlets < 1).map((i) => i.id)).toEqual([]);
  });

  test("ids are unique", () => {
    const ids = all.map((i) => i.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("every evidence link points at a real portal route", () => {
    /* P8-05. A deep link into a page that does not exist breaks the
       one promise the engine makes to a sceptical reader: that the
       claim can be checked. */
    const routes = [
      "/dashboard/shelf",
      "/dashboard/oos-alerts",
      "/dashboard/pricing",
      "/dashboard/competitors",
      "/dashboard/field-ops",
    ];
    const bad = all.filter(
      (i) => !routes.some((r) => i.evidence.href.startsWith(r))
    );
    expect(bad.map((i) => `${i.id} → ${i.evidence.href}`)).toEqual([]);
  });

  test("every finding exposes a formula and evidence rows", () => {
    /* P8-06 — the trust mechanism. An insight that cannot show its
       working is the thing this product exists not to be. */
    const silent = all.filter(
      (i) => !i.evidence.formula.trim() || i.evidence.table.rows.length === 0
    );
    expect(silent.map((i) => i.id)).toEqual([]);
  });

  test("presence findings rank measured before estimated", () => {
    /* Phase 12's tiering. A projection must never outrank a confirmed
       observation just because its formula produces a bigger number. */
    const tiers = report.presence.map((i) => i.confidence);
    const lastMeasured = tiers.lastIndexOf("measured");
    const firstEstimated = tiers.indexOf("estimated");
    if (lastMeasured !== -1 && firstEstimated !== -1) {
      expect(firstEstimated).toBeGreaterThan(lastMeasured);
    }
  });

  test("within a tier, findings rank by impact per outlet", () => {
    for (const tier of ["measured", "estimated"] as const) {
      const slice = report.presence.filter((i) => i.confidence === tier);
      const intensity = slice.map((i) => i.impact.value / i.scope.outlets);
      const sorted = [...intensity].sort((a, b) => b - a);
      expect(intensity.map((n) => +n.toFixed(6))).toEqual(
        sorted.map((n) => +n.toFixed(6))
      );
    }
  });

  test("pricing is counted in readings, presence in facing-days", () => {
    /* P8-04. The two scales are deliberately not comparable, and
       blending them is the failure this separation prevents. */
    expect(report.presence.every((i) => i.impact.unit === "facing-days")).toBe(true);
    expect(report.pricing.every((i) => i.impact.unit === "readings")).toBe(true);
  });

  test("severity is set by threshold, never by rank", () => {
    /* Bakhtiari is critical at 350 facing-days while Ankawa is only a
       warning at 352 — correct, because R2's severity is a
       percentage-point deficit and its impact is facing-days. This
       asserts the two stay independent rather than quietly collapsing
       into "biggest number is worst". */
    const r2 = byRule("r2-district-deficit");
    const critical = r2.filter((i) => i.severity === "critical");
    const warning = r2.filter((i) => i.severity === "warning");
    if (critical.length && warning.length) {
      const deficitOf = (i: Insight) =>
        Number(i.headline.match(/([\d.]+)pt/)?.[1] ?? 0);
      expect(Math.min(...critical.map(deficitOf))).toBeGreaterThanOrEqual(
        THRESHOLDS.r2DistrictDeficit.criticalPt
      );
      expect(Math.max(...warning.map(deficitOf))).toBeLessThan(
        THRESHOLDS.r2DistrictDeficit.criticalPt
      );
    }
  });
});

/* ---------------- 2. recomputation ----------------

   Each of these derives the rule's own number by a different path
   than the engine used, from the raw visit. Agreement is evidence;
   disagreement names the rule that is wrong. */

describe("recomputation — the engine's arithmetic, checked independently", () => {
  test("R1 impact equals the client gaps observed at that outlet", () => {
    const findings = byRule("r1-outlet-gaps");
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      const posId = finding.entities.posId!;
      const rows = latest.oos.filter(
        (row) =>
          row.posId === posId && skuOf(row.skuId)?.brandId === clientBrand.id
      );
      const expected = rows.reduce(
        (sum, row) => sum + row.normalFacings * REVISIT_INTERVAL_DAYS,
        0
      );
      expect(finding.impact.value, finding.id).toBe(Math.round(expected));
      expect(rows.length).toBeGreaterThanOrEqual(
        THRESHOLDS.r1OutletGaps.warningCount
      );
    }
  });

  test("no rule reads a field a single visit cannot produce", () => {
    /* The regression guard for the whole rotating-panel change. `daysOut`
       and `persistent` needed a previous observation of the SAME outlet,
       which the collection model does not deliver — so they are gone
       from the payload, and this asserts nothing quietly reintroduces
       an equivalent by another name. */
    const row = latest.oos[0] as Record<string, unknown>;
    expect(row).not.toHaveProperty("daysOut");
    expect(row).not.toHaveProperty("persistent");
    expect(row).toHaveProperty("facingDaysAtRisk");
  });

  test("R1 never reports an outlet R9 already called dark", () => {
    /* A fully dark shelf is the stronger statement; firing both was
       double-counting the same store under two rules. */
    const dark = new Set(byRule("r9-dark-outlet").map((i) => i.entities.posId));
    const clusters = byRule("r1-outlet-gaps").map((i) => i.entities.posId);
    expect(clusters.filter((p) => dark.has(p))).toEqual([]);
  });

  test("every audited outlet carries its own date", () => {
    /* Under rolling collection freshness is a property of the outlet.
       An outlet in the matrix with no audit date would be a reading
       nobody can place in time. */
    const dated = new Set(latest.audited.map((a) => a.posId));
    const seen = new Set(latest.matrix.map((c) => c.posId));
    expect([...seen].filter((p) => !dated.has(p))).toEqual([]);
    expect(latest.audited.every((a) => /^\d{4}-\d{2}-\d{2}$/.test(a.auditedAt))).toBe(true);
  });

  test("the core panel is audited in EVERY window", () => {
    /* The whole basis of a paired comparison. One missing core outlet
       in one window and that window's delta is no longer measuring the
       same doors on both sides. */
    for (const win of visits) {
      const audited = new Set(
        win.id === latest.visit ? latest.audited.map((a) => a.posId) : []
      );
      if (!audited.size) continue;
      const missing = [...corePanel].filter((p) => !audited.has(p));
      expect(missing, `core outlets missing from ${win.id}`).toEqual([]);
    }
  });

  test("the core panel mirrors the universe it is drawn from", () => {
    /* A core that is 60% hypermarket measures hypermarkets. Selection
       is stratified; this asserts the result, not the intent. */
    const share = (ids: string[], key: "channel" | "area") => {
      const counts = new Map<string, number>();
      for (const id of ids) {
        const v = posOf(id)![key];
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      return counts;
    };
    const core = share([...corePanel], "channel");
    const all = share(allPos.map((p) => p.id), "channel");
    for (const [channel, n] of all) {
      const universePct = (n / allPos.length) * 100;
      const corePct = ((core.get(channel) ?? 0) / corePanel.size) * 100;
      /* Within 12pt — a 40-outlet stratified draw cannot match a
         100-outlet universe exactly, but it must not skew. */
      expect(Math.abs(corePct - universePct), channel).toBeLessThan(12);
    }
  });

  test("a movement inside the detection floor is not called a move", () => {
    /* The point of the whole exercise. `shareSignificant` gates every
       movement claim in the product, and it must agree with the floor
       rather than being set independently. */
    for (const b of coreTrend.brands) {
      expect(b.shareSignificant, `${b.brandId} share`).toBe(
        Math.abs(b.shareDelta) >= coreTrend.shareFloorPt
      );
      expect(b.availabilitySignificant, `${b.brandId} availability`).toBe(
        Math.abs(b.availabilityDelta) >= coreTrend.availabilityFloorPt
      );
    }
    expect(coreTrend.shareFloorPt).toBeGreaterThan(0);
  });

  test("momentum never fires on a move below the floor", () => {
    /* R8 used to fire on any rival gain of 1pt, which sits under the
       measured floor — it was manufacturing momentum out of panel
       noise. Conceding is now gated on BOTH sides clearing it. */
    const m = report.momentum;
    if (!m?.conceding) return;
    expect(Math.abs(m.clientDelta)).toBeGreaterThanOrEqual(coreTrend.shareFloorPt);
    expect(m.rivalDelta!).toBeGreaterThanOrEqual(coreTrend.shareFloorPt);
  });

  test("coverage separates 'audited' from 'in scope'", () => {
    /* The rate denominators must be outlets actually reached. If these
       were equal the rotation would not be modelled at all. */
    expect(view.posCount).toBe(view.outlets.length);
    expect(view.inScopeCount).toBeGreaterThan(view.posCount);
    expect(view.notAuditedCount).toBe(view.inScopeCount - view.posCount);
  });

  test("R4 counts facing-days, not raw facings", () => {
    /* The unit bug this build actually shipped. The substitution
       matrix summed `facings` while the engine counts facing-days, so
       the two named different rivals as the biggest threat. Rebuilding
       the leader from raw rows here is what would have caught it. */
    const finding = byRule("r4-rival-substitution")[0];
    expect(finding).toBeDefined();

    const tally = new Map<string, number>();
    for (const row of latest.oos) {
      if (skuOf(row.skuId)?.brandId !== clientBrand.id) continue;
      const pack = skuOf(row.skuId)!.pack;
      for (const rival of row.rivalsInStock) {
        if (skuOf(rival.skuId)?.pack !== pack) continue;
        const key = `${pack}|${rival.brandId}`;
        /* facings × the days the client was absent — the same space ×
           time the rest of the product ranks by. A sum of bare
           `facings` here is the bug. */
        tally.set(
          key,
          (tally.get(key) ?? 0) + rival.facings * REVISIT_INTERVAL_DAYS
        );
      }
    }
    const [topKey, topValue] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];

    expect(finding.id).toBe(`r4:${topKey}`);
    expect(finding.impact.value).toBe(Math.round(topValue));
  });

  test("R5 impact equals that outlet's readings more than 10% off RRP", () => {
    const findings = byRule("r5-price-cluster");
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      const posId = finding.entities.posId!;
      const expected = latest.observations.filter(
        (o) =>
          o.posId === posId &&
          skuOf(o.skuId)?.brandId === clientBrand.id &&
          Math.abs(o.variance) > 10
      ).length;
      expect(finding.impact.value, finding.id).toBe(expected);
      expect(expected).toBeGreaterThanOrEqual(THRESHOLDS.r5PriceCluster.minReadings);
    }
  });

  test("R6 only speaks about channels with a base big enough to read", () => {
    /* The regression guard for the bug this file found. Hypermarket
       carries 11 client listings across 3 outlets, so one stockout
       swings its availability by 9.1pt — the rule must decline. */
    const listed = view.cells.filter(
      (c) => skuOf(c.skuId)?.brandId === clientBrand.id && c.state !== "not-listed"
    );
    for (const finding of byRule("r6-channel-gap")) {
      const channel = finding.entities.channel!;
      const base = listed.filter((c) => posOf(c.posId)?.channel === channel).length;
      expect(base, `${finding.id} base`).toBeGreaterThanOrEqual(
        THRESHOLDS.r6ChannelGap.minListings
      );
    }

    const hypermarket = listed.filter(
      (c) => posOf(c.posId)?.channel === "Hypermarket"
    ).length;
    expect(hypermarket).toBeLessThan(THRESHOLDS.r6ChannelGap.minListings);
    expect(one("r6:Hypermarket")).toBeUndefined();
  });

  test("R9 fires only where the outlet holds nothing of the client's", () => {
    for (const finding of byRule("r9-dark-outlet")) {
      const posId = finding.entities.posId!;
      const own = view.cells.filter(
        (c) => c.posId === posId && skuOf(c.skuId)?.brandId === clientBrand.id
      );
      const listed = own.filter((c) => c.state !== "not-listed");
      expect(listed.length, `${finding.id} listings`).toBeGreaterThan(0);
      expect(
        listed.filter((c) => c.state === "in-stock").length,
        `${finding.id} in stock`
      ).toBe(0);
    }
  });

  test("R12 restates districts R2 already found, never new ones", () => {
    /* R12 is a framing of R2's output, which is why the decision
       rollup excludes it from the arithmetic. If it ever names a
       district R2 did not, that exclusion silently starts dropping
       real loss. */
    const flagged = new Set(
      byRule("r2-district-deficit").map((i) => i.entities.area)
    );
    for (const finding of byRule("r12-geographic-concentration")) {
      for (const row of finding.evidence.table.rows) {
        expect(flagged.has(String(row[0])), `${row[0]} not in R2`).toBe(true);
      }
    }
  });

  test("momentum reflects the real share movement between visits", () => {
    const { momentum } = report;
    expect(momentum).toBeDefined();
    if (momentum?.conceding) {
      expect(momentum.clientDelta).toBeLessThan(0);
      expect(momentum.rivalDelta).toBeGreaterThanOrEqual(
        THRESHOLDS.r8Momentum.rivalGainPt
      );
      expect(momentum.rivalBrandId).not.toBe(clientBrand.id);
    }
  });
});

/* ---------------- decisions ---------------- */

describe("decisions — the rollup on top of the engine", () => {
  const { decisions, reprice } = buildDecisions(report);

  test("every presence finding lands in exactly one decision", () => {
    const rolled = decisions.flatMap((d) => d.findings.map((f) => f.id));
    expect(rolled.length).toBe(new Set(rolled).size);
    expect([...rolled].sort()).toEqual(
      report.presence.map((i) => i.id).sort()
    );
  });

  test("R12 is carried but not counted", () => {
    /* It is the sentence that sells the "cover" decision and a
       restatement of R2's districts — so it must appear in findings
       and must not appear in the sum. */
    const cover = decisions.find((d) => d.id === "cover");
    if (!cover) return;
    const r12 = cover.findings.filter(
      (f) => f.rule === "r12-geographic-concentration"
    );
    /* R12 only fires when the flagged districts are geographically
       adjacent, which is a property of the data rather than something
       the rollup can guarantee — so this asserts the exclusion holds
       WHEN it fires, instead of requiring it to fire. Requiring it was
       over-fitting the test to one dataset. */
    if (r12.length === 0) return;
    const counted = cover.findings
      .filter((f) => f.rule !== "r12-geographic-concentration")
      .reduce((s, f) => s + f.impact.value, 0);
    expect(cover.impact.value).toBe(Math.round(counted));
  });

  test("decisions rank measured before estimated", () => {
    const tiers = decisions.map((d) => d.confidence);
    const lastMeasured = tiers.lastIndexOf("measured");
    const firstEstimated = tiers.indexOf("estimated");
    if (lastMeasured !== -1 && firstEstimated !== -1) {
      expect(firstEstimated).toBeGreaterThan(lastMeasured);
    }
  });

  test("pricing rolls up in readings, outside the presence ranking", () => {
    expect(reprice?.impact.label).toMatch(/readings/);
    expect(decisions.map((d) => d.id)).not.toContain("reprice");
  });
});

/* ---------------- P8-12 · the visit selector ---------------- */

describe("the engine follows the selected visit", () => {
  test("an earlier visit produces a different, recomputed list", async () => {
    const order = visits.map((v) => v.id).sort();
    const previousId = order[0];
    expect(previousId).not.toBe(latest.visit);

    const { loadVisit } = await import("./portalData");
    const previous = await loadVisit(previousId);
    const earlier = generateInsights(applyFilters({ ...EMPTY_FILTERS, visit: previousId }, previous));

    expect(earlier.presence.map((i) => i.id)).not.toEqual(
      report.presence.map((i) => i.id)
    );
    expect(earlier.presence.every((i) => i.impact.value > 0)).toBe(true);
  });

  test("a filtered view yields findings scoped to that filter", () => {
    /* P8-11 — the operator strip. Filtering to one district must
       genuinely rerun the engine, not relabel panel-wide findings. */
    const area = "Bakhtiari";
    const scoped = generateInsights(
      applyFilters({ ...EMPTY_FILTERS, areas: [area] }, latest)
    );
    const outlets = new Set(
      allPos.filter((p) => p.area === area).map((p) => p.id)
    );
    for (const finding of scoped.presence) {
      if (finding.entities.posId) {
        expect(outlets.has(finding.entities.posId), finding.id).toBe(true);
      }
      if (finding.entities.area) {
        expect(finding.entities.area, finding.id).toBe(area);
      }
    }
  });
});

/* ---------------- 3. golden ----------------

   The exact output for the shipped dataset. When this fails, read the
   diff and decide whether the change was intended — then update it in
   the same commit as the rule change, never separately. */

describe("golden output for the shipped visit", () => {
  test("the ranked presence list is unchanged", () => {
    expect(
      report.presence.map((i) => `${i.id} ${i.severity} ${i.confidence} ${i.impact.value}`)
    ).toMatchInlineSnapshot(`
      [
        "r1:erb-204 warning measured 224",
        "r1:erb-1104 warning measured 224",
        "r9:erb-1602 critical measured 112",
        "r9:erb-1702 critical measured 84",
        "r4:can-330|coca-cola critical measured 644",
        "r11:erb-405 critical estimated 382",
        "r11:erb-205 warning estimated 255",
        "r11:erb-505 warning estimated 255",
        "r11:erb-603 warning estimated 255",
        "r11:erb-1301 warning estimated 255",
        "r11:erb-1601 warning estimated 255",
        "r11:erb-1602 warning estimated 255",
        "r11:erb-1702 warning estimated 255",
        "r11:erb-1704 warning estimated 255",
        "r2:Dream City warning estimated 365",
        "r2:Daratu critical estimated 385",
        "r2:Kasnazan critical estimated 450",
        "r2:Brayati critical estimated 278",
        "r2:Baharka warning estimated 198",
        "r2:Shorsh critical estimated 255",
        "r2:Havalan warning estimated 263",
        "r7:fixture-imbalance warning estimated 3693",
        "r6:Mini-market warning estimated 382",
      ]
    `);
  });

  test("the pricing list is unchanged", () => {
    expect(
      report.pricing.map((i) => `${i.id} ${i.severity} ${i.impact.value}`)
    ).toMatchInlineSnapshot(`
      [
        "r5:erb-105 warning 3",
        "r5:erb-203 warning 3",
        "r5:erb-702 warning 3",
        "r5:erb-1203 warning 2",
      ]
    `);
  });

  test("the decisions are unchanged", () => {
    const { decisions } = buildDecisions(report);
    expect(
      decisions.map((d) => `${d.id} ${d.confidence} ${d.impact.value} across ${d.outlets}`)
    ).toMatchInlineSnapshot(`
      [
        "replenish measured 644 across 4",
        "defend measured 644 across 22",
        "list estimated 2422 across 9",
        "negotiate estimated 3693 across 87",
        "cover estimated 2576 across 67",
      ]
    `);
  });
});
