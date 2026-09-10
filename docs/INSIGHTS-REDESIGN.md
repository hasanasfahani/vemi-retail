# Insights — Decision Insights redesign

Supersedes the Insights sections of `PRD.md`. Sits alongside
`FOLLOW-UP-REDESIGN.md`, which stays authoritative for the Action Center.

---

## 0 · What already exists

`lib/market/insights.ts` is already a deterministic rule engine: twelve
rules, thresholds justified against the observed September panel,
evidence tables carrying their own formula, affected-POS id lists,
entity tags, a measured/estimated confidence term and a ranking
function. It has no model in it and never did.

This redesign therefore **reframes and extends** that engine. It does
not replace it. The qualitative surfaces being removed are
`stories.ts` + `StoryCard` (Market Stories) and `OpportunityCard`.

Four consumers exist today and all four must keep working:

| Consumer | Uses |
| --- | --- |
| `app/portal/ExecutiveView.tsx` | `generateInsights(view).headlines` + `InsightCard` |
| `app/portal/insights/InsightsView.tsx` | full report, stories, opportunities |
| `app/portal/reports/ReportsView.tsx` | `InsightCard` for risks |
| `app/portal/competition/CompetitionView.tsx` | `activity()` feed (replaced in F.3) |

`components/portal/*` and `lib/insights.ts` are the legacy Erbil
dashboard — a **different** engine on unreachable routes. Out of scope.

---

## 1 · Decisions locked

Answered by the user:

1. **One specialisation axis per insight.** Geography *or* channel *or*
   retailer — never crossed. "Baghdad supermarkets" is a breakdown row,
   not a headline. Parenthood is then unambiguous.
2. **No business-importance config.** Scope is weighted by the outlet
   `volume` footfall weight already in the dataset, so forty
   hypermarkets outrank forty kiosks without a settings surface and
   without asserting anything.
3. **Category is set by the benchmark.** Benchmark is a target → the KPI
   category. Benchmark is a rival brand → Respond to Competition. No
   judgement calls, no overlap.
4. **Competition page: replace the `activity()` feed only.** The four
   chart panels stay exactly as they are.

Adopted as recommendations, not separately confirmed — flagged here so
they are easy to overturn:

5. **The parent card always stays.** A child slice earns its own card
   only when **two or more** children diverge materially. One divergent
   child *is* the parent's story; the parent's scope line names it.
6. **Suppressed children are computed, not skipped.** They carry a
   `parentId` and feed the detail view's breakdown for free.
7. **Divergence threshold is `max(detection floor, 5 pts)`.** The floor
   keeps it statistically honest; the 5 pt minimum stops promotion of
   differences nobody would act on.

---

## 2 · Deferred to phase 2 (explicitly not built now)

Per the MVP rule — limit the surface, master the detail.

- "New insights this period" in the page header. It needs the engine run
  twice and a month-free identity key; the header ships with **total**
  and **high priority** only.
- Crossed slices (geography × channel).
- Bulk select / bulk download / bulk email.
- Local filters beyond category + sort (no severity, direction or
  confidence chips yet).
- Insight-level PDF styling beyond a plain print route.
- Configurable priority weights.

---

## Phase A — the model

**A.1 · Shape.** Extend `Insight` rather than replacing it. Added
fields: `detectorId`, `category` (the seven outcome categories),
`benchmark` (`"target" | "rival" | "prior-period"`), `direction`
(`"risk" | "win"`), `parentId`, `axis`, `priority` (number) +
`priorityBand`, `evidence.quality`, `targetSnapshot`, `breakdowns`,
`comparisonBasis` (`"market-sample" | "like-for-like" | "point-in-time"`).
Keep `impact`, `evidence.formula`, `affected`, `entities` untouched —
they already do their jobs.

The seven categories replace the four mechanical ones. `CATEGORY_LABEL`
becomes the new map; every existing rule gets assigned by the benchmark
rule in A.4.

**A.2 · Priority.** ✅ Built. Severity normalisation turned out to
already exist: `THRESHOLDS` is a per-rule warning/critical cut-off
argued against this panel, so a rule saying "critical" has already said
"large by my own measure" — comparable across rules in a way that 26
price readings versus 1.4 facings never is. Score is a weighted **sum**
(0.55 severity / 0.30 volume-weighted reach / 0.15 evidence quality),
not a product: a product lets thin evidence annihilate a real finding
instead of ranking it down. Bands placed on the observed distribution
(214 findings, 0.438–0.887, p50 0.499, p90 0.674) rather than round
numbers. `topCards` carries a one-per-rule guard.

**A.3 · Subsumption.** One rule, applied after detection: a child is
promoted only if it clears its own detection floor *and* differs from
its parent by more than `max(floor, 5 pts)` *and* at least one sibling
also diverges. Everything else gets a `parentId`. Reuses `cohortFloor`
from `followUp.ts`.

**A.4 · Category assignment + migration.** Map all twelve existing rules
onto the seven categories via the benchmark rule; `r4-rival-substitution`
and `r14-competitor-movement` land in Respond to Competition, the rest by
KPI. Snapshot test proving rule → category is total and stable.

*Tests:* 23 in `insightModel.test.ts` — every rule classified, the
benchmark rule is exactly equivalent to the Respond-to-competition
category, commercial weighting beats outlet counting, thin evidence is
discounted but survives, subsumption promotes only on two divergent
siblings, and the layer never alters a headline, an impact or an
affected list.

---

## Phase B — detectors

**B.1 · Port the twelve.** Existing rules emit the new shape. No
behaviour change — the current `insights.test.ts` expectations must
still hold, extended with the new fields.

**B.0 · The concentration problem Phase A surfaced.** Grow distribution
holds **123 of 214** findings — every one a single-outlet
`r11-assortment-gap`, because that rule only ever emits at outlet level
and so has no parent to fold into. One chip would hold 57% of the page.
The fix is a channel- or market-level assortment parent so those 123
become its breakdown; without it, subsumption has nothing to bite on.
Do this before the new detectors.

**B.2 · Conjunctions.** The new value, and the reason the page is worth
building: availability high ∧ shelf share low; client available ∧
required POSM absent; SKU required ∧ absent. These need a **count-based
sufficiency test** (minimum N, and whether the co-occurrence exceeds the
base rate) — cohort floors govern comparisons, not counts, so this is a
separate check, not a reuse.

**B.3 · Competitive.** Derived from `competition.ts`, which already
computes share, facings, `perOutlet`, eye-level `visibility`, promo
presence and `districtLeads`. Any brand that leads the client anywhere
is eligible; subsumption keeps the trivial ones off the page.

**B.4 · Verify Impact.** Reuses `compareCohort` / `resultOf` from
`followUp.ts`. The card summarises; **Open Analysis deep-links into the
Action Center request** rather than re-rendering a parallel before/after.
One comparison implementation, no chance of two views disagreeing.

**B.5 · Headline templates.** One template per detector, filled from the
same values as the metrics — no authored copy anywhere. Explicit work
items, because template copy fails at the edges: plural/singular
agreement, a length budget, and deliberately varied sentence shapes so
forty cards do not all open with a number. Band words must mean the
portal's bands (`rateBand` / `StatusChip` cut-offs) or not appear.

---

## Phase C — the card

Rewrite `InsightCard`: category eyebrow, decision headline, **hero
delta** (the difference is the finding; its components sit smaller),
supporting values, scope line, optional badge (priority, or
`Like-for-like · N POS`), then Open Analysis + Download + Email.

Ships with a compact variant for the dashboard. All four consumers
updated in this phase so nothing is left half-migrated.

---

## Phase D — the detail view

A `Drawer`, reusing `DataTable`, `ShelfScene`, `PosDrawer` and the
existing chart components.

A finding summary · B the template sentence · C the chart the detector
nominates (not one chart forced on every insight) · D breakdown selector
limited to the axes that apply · E affected-POS table, click-through to
the POS drawer · F evidence · G trend, labelled Market Sample or
Like-for-Like, shown only when the data supports it.

---

## Phase E — actions

CSV of the affected rows (extends `gapReport.ts`); `mailto:` with a
prefilled quantitative summary and **no fake sent-confirmation**; a
print route for Download Insight; Request Follow-up reusing
`RequestFollowUp.tsx`, **disabled with a stated reason when the cohort
is too small to produce a measurable result** — the expected detectable
range travels with the request, as it already does in the Action Center.

---

## Phase F — page integration

**F.1 · Insights page.** Header (total + high priority), seven category
chips, sort control, the empty state — which names the binding filter
and offers to drop it rather than a vague "broaden scope".

**F.2 · Executive Dashboard.** "Key Decision Insights" — top 3–5 by
priority from the same collection, compact card, same detail view.
Risks rank above wins.

**F.3 · Competition page.** The `activity()` feed becomes the
competitive insight list, selected on `benchmark === "rival"` rather
than on category, so the two views cannot drift apart. The four charts
are untouched.

---

## Phase G — removals

Delete `stories.ts`, `stories.test.ts`, `StoryCard.tsx`,
`OpportunityCard.tsx` and the old four-category constants. Confirm
`ReportsView` still renders. Full test run and clean build.

---

## Sizing

Roughly two thirds of the Follow-up redesign, because the engine, the
floors, the follow-up flow, the POS drawer, the tables and the shelf
scene all exist. Phase B.2 (conjunctions) and Phase D (detail view) are
the two that carry real new work.
