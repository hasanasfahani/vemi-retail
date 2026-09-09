# Vemi — KPI Actions & Follow-up Audit Center

The brief that replaced the Action Center's task model, as given, with
the decisions taken against it recorded alongside. Sections follow the
original numbering.

## 1 · Objective

One workflow: **KPI gap → follow-up audit request → revisit → compare →
result**. Not a project- or task-management system. Vemi helps the
client identify execution gaps, export them for their own team, ask
Vemi to audit selected POS again, track whether those visits happened,
and measure whether execution improved.

## 2 · Performance page — KPI action summary

Each tab shows: KPI · target · gap · issue scope (affected POS and
issue count) · actions (Download gap report, Request follow-up audit).
Removed from the hero: Main issue, Where, Next. Deep analysis stays in
the charts below and is not duplicated above them.

## 3 · Affected POS vs issues

Two counts, never merged. Affected POS = unique outlets with at least
one relevant gap. Issues = individual detected records; one outlet can
carry several. Always show both where useful.

## 4 · Filters

The global filters (period, governorate, channel, retailer, brand, SKU)
apply to the KPI, the gap, both counts, the charts, the export and the
follow-up request. A request contains only the POS the active filter
selected.

## 5 · Gap reports

One CSV per KPI, respecting active filters, one row per POS-SKU issue:
POS id and name, governorate, district, channel, retailer, visit date,
brand, SKU, issue, baseline KPI, target, severity, evidence reference.

## 6 · Requesting a follow-up

A drawer showing KPI, brand, audit period and issue scope. POS
selection: recommended, all affected, or manual. Recommendation uses
stated deterministic logic. Cycle defaults to the next one and other
future cycles may be chosen. Confirming reports how many POS joined the
queue and persists locally.

## 7–10 · The Action Center becomes the Follow-up Audit Center

Replaces the priority table, Kanban and drag/drop. Answers: which gaps
did we ask Vemi to check again, where are they, did they improve?
Summary cards (active requests, POS requested / scheduled / revisited,
completed). Global filters plus KPI, cycle, request status and revisit
result. Each top-level row is a REQUEST, not a POS.

## 11 · Baseline, not current

The KPI at the time of the original audit is the baseline and is never
overwritten by later audits.

**Decision taken:** the baseline is stored as the underlying ISSUE
RECORDS rather than as a number. §18 requires a SKU filter to move it,
and a stored `84.2%` cannot recalculate.

## 12 · Three levels

Request → governorate → POS. Governorate figures are computed from the
request's own POS records. Clicking a POS opens the detail drawer. No
fourth nested level for SKUs.

## 13 · POS drawer

Store information, baseline KPI, original issues with their status
after the revisit, both audits' evidence, the comparison and the
resolved / unresolved summary.

## 14–15 · Status and result are different columns

Request status is operational: Requested → Scheduled → In progress →
Completed, plus Cancelled. Revisit result is the outcome: Pending,
Improved, No material change, Worsened, Mixed. Before enough POS are
revisited, show progress ("18 / 54 revisited") rather than declaring an
outcome.

## 16 · Matched cohort — the critical requirement

A result compares THE SAME POS. If 38 of 54 requested outlets were
revisited, the baseline is recomputed over those 38. Applies at
request, governorate and POS level. Also show "38 / 54 revisited".

**Decision taken:** the significance floor is bootstrapped from each
cohort's own outlets, not inherited from the market. A 37-outlet cohort
gets a ~15pt floor where the market's is 1.8pt. This is why a request
can read Improved while every governorate inside it reads no material
change — the pooled cohort has more evidence than any part of it.

## 17 · Results over time

Progressive states, with anything read before the cycle closes labelled
**preliminary**.

## 18 · Filters and hierarchical KPIs

Every level recalculates under the active filter. Nothing is cached on
a request.

## 19–21 · Result column, share, cancel

The result column shows the comparison rather than a word. Share is
secondary and opens a mail client — nothing is sent from the portal.
Cancelling requires a reason and is refused once any POS has been
revisited, because that would delete an observation rather than a plan.

## 22 · Geography

Governorate is the primary grouping. District stays POS metadata.

**Decision taken:** governorate replaced city throughout — the payload,
the filter, the URL parameter. Five of the six share a name with their
capital; Mosul does not, and its governorate is Nineveh. Both are
carried and shown together where they differ.

## 23–24 · Data model and integrity

Issues carry id, KPI, brand, SKU, POS, governorate, district, retailer,
channel, audit date, evidence, type and severity. Requests carry id,
KPI, brand, origin period, selected POS, baseline issue ids, cycle,
created date, status and matched revisits. Nothing is hardcoded; every
count comes from the shared dataset and changing a filter produces
consistent results across the page.

## 25–27 · Structure and principle

Performance: KPI summary → issue scope → actions → deep analytics →
affected POS. Action Center: header → summary → filters → expandable
request table. The story is: we found a gap; you asked us to check
these stores again; we revisited them; here is what changed. Not task,
assignee, deadline, comments, Kanban.

---

## Decisions taken outside the brief

- **October and November were generated.** The brief defaults a
  follow-up to October, and the dataset ended at September, so the
  central flow had no data underneath it. October is fully audited;
  November is in flight at 43%, which makes the progressive states real
  rather than described.
- **A follow-up lift is modelled in the generator.** Left to chance a
  revisited outlet improves about as often as it worsens, every request
  would report no material change, and the page would be a shell. 72%
  of requested outlets respond and 8% go backwards. This is a modelled
  effect; the portal continues to report observation without causation.
- **Requests are raised only from the current cycle onwards**, because
  a request raised earlier would lift a month whose figures the brief
  pins and the build is calibrated against.
- **Revisit Management was merged in.** It kept a second queue of the
  same outlets; two lists that can disagree are worse than either.
