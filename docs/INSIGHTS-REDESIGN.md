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

**B.0 · ✅ Rollups.** Four rules spoke one outlet at a time (R1, R5, R9,
R11). Each now also states its market total under the same rule id, so
subsumption folds the instances into it: **218 findings → 24 cards**,
Grow distribution 123 → 1. Required one refinement to the Phase A rule:
an **outlet-level child is never promoted**, because "materially
different from the market" is a claim about a segment where a rate is
computed over a population — a single outlet is an instance, not a rival
account. A rollup also may not soften its instances: R9's doors are
critical individually, so the total is too.

**Original note —** Grow distribution
holds **123 of 214** findings — every one a single-outlet
`r11-assortment-gap`, because that rule only ever emits at outlet level
and so has no parent to fold into. One chip would hold 57% of the page.
The fix is a channel- or market-level assortment parent so those 123
become its breakdown; without it, subsumption has nothing to bite on.
Do this before the new detectors.

**B.2 · ⚠️ Conjunctions — built, lift-tested, and both are SILENT.**
The sufficiency test is `lift = observed ÷ (n · P(A) · P(B))`, with a
1.25 bar. Results on the September panel:

- **C1 (stocked well, still thin on shelf)** — the brief's flagship
  example. 166 outlets qualify; independence predicts 171.5. **Lift
  1.00**, identical at every bar tested (34%: 214 vs 222.8; 40%: 296 vs
  296.5). Availability and shelf share are independent in this dataset.
- **C2 (a core line missing from doors carrying the rest)** — 32–71
  outlets per SKU, but **lift 0.5–0.8**: *rarer* than chance. Broad-range
  doors carry everything, which is the sensible retail pattern.

Both rules are kept and silent, on the precedent R7 already sets in this
file: a calibrated detector reporting nothing is itself a finding about
the market. **This is a decision for the user — see "The conjunction
problem" below.**

**B.3 · ✅ Competitive.** R16 (leading rival's fixture gap per
governorate, gated on that governorate's own bootstrapped floor) and R17
(promotion coverage in doors, not facings). Respond to competition went
3 → 7 cards.

**Original note —** Derived from `competition.ts`, which already
computes share, facings, `perOutlet`, eye-level `visibility`, promo
presence and `districtLeads`. Any brand that leads the client anywhere
is eligible; subsumption keeps the trivial ones off the page.

**B.4 · ✅ Verify Impact.** `verifyImpact.ts` reads `FollowUpRow`s the
Action Center already built — no second before-and-after. Direction is
set per finding (the one detector that can report either), preliminary
results say so in the sentence and drop to medium quality, and the CTA
deep-links to the request.

**Original note — Reuses `compareCohort` / `resultOf` from
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

## Frontend scope — demo-first

**Instruction, 10 Sep:** the frontend is for interactive demo screens.
Keep it as simple as possible; hardcode where that keeps it simple.

**What this does NOT change.** The engine stays derived. Hardcoding
`decide()`'s output would mean hand-typing 24 cards of figures that go
stale on the first filter change — more work than reading the objects
that already exist, and worse. Phases A and B stand.

**What it cuts from phases C–G:**

- One card component, no separate compact variant.
- The detail view uses the `evidence.table` **every insight already
  carries**, instead of a per-detector nominated chart. That was the
  largest single item in the plan and it is already built.
- Breakdown selector → the folded children, listed. No dimension
  switching.
- Download Insight print route → browser print of the drawer.
- No bulk actions, no sort control beyond priority, no local filters
  beyond the category chips.
- Affected-POS table reuses `DataTable` as-is: no pagination, no
  per-column filtering. Click through to the existing POS drawer.

**And it settles the conjunction question by itself:** regenerating the
dataset (option 2 below) is out of scope for a demo. Accepting the
silent detectors is the answer.

---

## Phase C — the card ✅

Done. `InsightCard` takes a `DecisionInsight`; outcome eyebrow coloured
by priority, headline held to two lines so figures align across a row,
the rule's own impact figure as the hero, and a uniform outlet count
rather than each rule's own scope wording (some phrase it as "outlets
with a client stockout", others as "48 audited outlets" — printing both
in one corner reads as two different fields).

`useDecisions` assembles the report once so three pages cannot hold
three slightly different ones. All consumers migrated: Executive
Dashboard (now "Key decision insights", one card per rule via
`topCards`), the Insights page (rebuilt on outcome chips, empty ones
hidden), and Reports (`classify` on its existing risk list).

Also corrected: the dashboard's InfoTip still described the old ranking
(severity → confidence → impact per outlet). It now describes the real
one.

Original spec —

Rewrite `InsightCard`: outcome eyebrow, decision headline, **hero
figure** (the impact the rule states, in the rule's own unit),
scope line, priority + basis badges, then Open. One component, used at
every size. All four consumers updated in this phase so nothing is left
half-migrated.

---

## Phase D — the detail view ✅

Done, at the trimmed scope. `InsightDrawer`: the rule's figure and its
own sentence, the comparison-basis note where a finding claims a change,
`evidence.formula` + `evidence.table`, the folded children listed, and
the affected outlets in a `DataTable` — which already brings search,
facets, pagination and a CSV button, so Phase E's CSV arrives free.

**Findings are addressable.** `?insight=<id>` opens the drawer, read
straight from the URL rather than copied into state by an effect, so a
link arrives with the drawer already open on first render. This is what
PRD §23 needs for one insight to open identically from three pages.

**Two real defects found by looking at it**, neither of which any test
would have caught:

- R14 read the LAST point of the trend series, and that file now runs to
  November so the follow-up cycles have somewhere to land. A September
  finding was citing November movement — Basra inflated from the 4.7pt
  the thresholds are calibrated against to 6.8pt. `activity()` on the
  Competition page had the same bug, live. Both now end the window at
  the month in hand; a regression test pins Basra at 4.7pt.
- The drawer subtitle printed the raw month key (`2026-09`).

Original spec —

A `Drawer`, reusing `DataTable` and `PosDrawer`.

Finding summary · the rule's own `detail` sentence · the `evidence.table`
and `evidence.formula` each insight already carries · the folded
children, listed · affected-POS table with click-through. Comparison
basis labelled Market sample / Like-for-like wherever a finding claims a
change.

---

## Phase E — actions ✅

Done. CSV was already there (DataTable). Added:

**Email** — `mailtoFor` builds the message from the finding's own
headline, figure, scope, sentence and formula, with an absolute link
back to `?insight=<id>`. No mail server, no fake "sent" toast. Composed
on click rather than at render, because the server has no origin to put
in the link and building it at render time meant the button did not
exist in the first HTML at all.

**Request follow-up** — reuses `RequestFollowUp` with the issue records
narrowed to the finding's own outlets. `RULE_KPI` says what a follow-up
would go back and measure, and null is a real answer: R4, R14, R16 and
R17 are measured on a competitor, and re-auditing a rival's shelf is the
wrong question.

**The gate.** `MIN_FOLLOW_UP_POS = 20`, and it is a COUNT rather than a
computed floor, for a measured reason. Bootstrapped floors on plausible
per-outlet deltas: 4 outlets → 5.3pt, 6 → 9.0, 10 → 10.5, 12 → 10.9,
20 → 9.7, 30 → 7.9, 60 → 6.5. Two outlets returns **0.0pt** — a
degenerate bootstrap, not a precise cohort, and a floor of zero would
make any movement look significant. So eligibility is checked before the
fact, on a number that cannot degenerate.

**Print** — `window.print()` on the drawer.

Original spec —

CSV of the affected rows; `mailto:` with a prefilled summary and **no
fake sent-confirmation**; Request Follow-up reusing `RequestFollowUp.tsx`,
disabled with a stated reason when the cohort is too small. Download
Insight is browser print of the drawer.

---

## Phase F — page integration ✅

F.1 and F.2 landed in Phase C (the card migration required them).
F.3 done here: the Competition page's `activity()` feed is replaced by
competitive findings, and the four chart panels are untouched, exactly
as scoped.

Two details worth keeping:

- The findings are computed on `all` — the same brand/SKU-stripped view
  the charts above use — so a card and the chart under it cannot
  disagree about a share.
- Selection is on `benchmark === "rival"`, **not** on the outcome label.
  A finding measured against a rival belongs on this page whatever the
  chip is called; a test pins the two selections equal.

Seven findings render: contested facings, promotion coverage, a pack-rival
distribution gap, three city shelf gaps and the Basra movement.

`activity()`, `ACTIVITY_LABEL` and `type Activity` in `competition.ts`
are now referenced only by their own test → **Phase G**.

Original spec —

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

## Phase G — removals ✅

Deleted: `stories.ts`, `stories.test.ts`, `StoryCard.tsx`,
`OpportunityCard.tsx`, and — as flagged in Phase F — `activity()`,
`ACTIVITY_LABEL` and `type Activity` from `competition.ts`.

The old four-category system went with them: `Category`,
`CATEGORY_LABEL`, the `category` field on every rule, and
`InsightReport.byCategory` / `.headlines`. Two overlapping taxonomies
where one is dead is exactly the kind of detail the MVP rule says to
remove rather than carry. `generateInsights` now returns `{ all }`, and
`report.ts` takes its recommended actions from `topCards(decide(...))`.

`report.stories` turned out to be computed on every report build and
never rendered — dead before this phase started.

**One test was worth saving rather than deleting.** The activity suite
asserted the dataset's central competitive story: Coca-Cola gained Basra
shelf AND ran promotions there. That is a property of the DATA, not of
the component that reported it, so it is now pinned against the trend
rows and the promo rows directly, above Basra's own 4.63pt floor, where
no future refactor of the reporting layer can quietly lose it.

Original spec —

Delete `stories.ts`, `stories.test.ts`, `StoryCard.tsx`,
`OpportunityCard.tsx` and the old four-category constants. Confirm
`ReportsView` still renders. Full test run and clean build.

---

## Sizing

Roughly two thirds of the Follow-up redesign, because the engine, the
floors, the follow-up flow, the POS drawer, the tables and the shelf
scene all exist. Phase B.2 (conjunctions) and Phase D (detail view) are
the two that carry real new work.


---

## The conjunction problem — needs a decision

Phase B.2 built the detectors and the lift test, and the test says
neither conjunction exists in this dataset. The cause is structural: the
generator draws availability, facings, listings and POSM from
independent random streams, so no two KPIs co-vary. Every conjunction
will therefore come out at lift ≈ 1 (or below), for ever.

That matters because conjunctions were the argument for the whole page —
"reveal relationships the user would otherwise investigate manually"
(PRD §17). Without cross-KPI structure there are no relationships to
reveal, and the Insights page is a well-ranked list of single-KPI gaps.

Two ways forward:

1. **Accept it.** Ship the lift gate and the two silent detectors as a
   calibration record. The page is honest and slightly less interesting
   than the brief imagined. Zero risk to anything already calibrated.
2. **Give the generator a "well-served door" latent factor**, so
   availability, shelf share, assortment and POSM co-move the way they
   do in real retail. Conjunctions then exist and the lift test starts
   earning its keep. But it moves every calibrated figure in the
   portal — the thresholds in `insights.ts` each cite observed values,
   and all of them would need re-deriving.

Option 2 is the honest model of retail and the expensive one. Not a call
to make inside a phase.
