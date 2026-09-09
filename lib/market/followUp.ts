/* ============================================================
   FOLLOW-UP AUDITS.

   A request is: these outlets, this KPI, checked again next cycle.
   This file holds the request, and the arithmetic that says whether
   anything changed.

   THE RULE THE WHOLE FILE EXISTS TO ENFORCE — §16 of the brief, and
   the one requirement that decides whether any of this is worth
   reading: a follow-up result compares THE SAME OUTLETS. If 38 of 54
   requested outlets were revisited, the baseline is recomputed over
   those 38, not carried over from all 54. Comparing 54 outlets against
   a different 38 is the most common way before-and-after reporting
   lies, and it lies in the flattering direction, because the outlets a
   rotating panel returns to are not a random half.

   A BASELINE IS NEVER A STORED NUMBER. It is recomputed from the
   issue records every time, which is what lets a SKU filter move it:
   filter to Pepsi 500ml and the baseline, the follow-up and the change
   all have to describe that SKU. A stored 84.2% cannot do that, and an
   implementation that stores one will look right until somebody
   filters.
   ============================================================ */

import {
  clientBrand, followUps as seededFollowUps, governorateName, monthLabel, months, skuOf,
} from "./index";
import type { MarketView } from "./filters";
import type { IssueKpi } from "./issues";

/* ---------- the request ---------- */

export const REQUEST_STATUS = [
  { id: "requested", label: "Requested", hint: "Submitted, not yet on a route" },
  { id: "scheduled", label: "Scheduled", hint: "Accepted onto the cycle's route" },
  { id: "in-progress", label: "In progress", hint: "Some of the outlets have been revisited" },
  { id: "completed", label: "Completed", hint: "The cycle is finished for this request" },
  { id: "cancelled", label: "Cancelled", hint: "Withdrawn before the audit began" },
] as const;

export type RequestStatus = (typeof REQUEST_STATUS)[number]["id"];

export const CANCEL_REASONS = [
  "No longer required",
  "Team resolved internally",
  "Audit priority changed",
  "Other",
] as const;

export type FollowUpRequest = {
  id: string;
  kpi: IssueKpi;
  brandId: string;
  /* The cycle whose audit raised it — the baseline is measured here. */
  originMonth: string;
  /* The cycle it is checked in. */
  cycle: string;
  createdAt: string;
  posIds: string[];
  /* The issue records the request was raised against. Stored as IDS,
     not as counts or rates: the numbers are recomputed from them under
     whatever filter is active. */
  issueIds: string[];
  cancelled?: { at: string; reason: string };
};

/* ---------- results ---------- */

export type RevisitResult =
  | "pending"
  | "improved"
  | "no-change"
  | "worsened"
  | "mixed";

export const RESULT_LABEL: Record<RevisitResult, string> = {
  pending: "Pending",
  improved: "Improved",
  "no-change": "No material change",
  worsened: "Worsened",
  mixed: "Mixed",
};

/* ---------- per-outlet KPI ----------

   Computed from the ROWS of a filtered view, so a SKU filter narrows
   it. Shelf share is the exception and takes its denominator from the
   unfiltered fixture: a brand filter would otherwise leave the client
   holding 100% of a shelf containing only the client. */
export function posKpi(
  view: MarketView,
  full: MarketView,
  posId: string,
  kpi: IssueKpi
): number | null {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const own = view.cells.filter(
    (c) => c.posId === posId && skuOf(c.skuId)?.brandId === clientBrand.id
  );

  if (kpi === "availability") {
    if (own.length === 0) return null;
    return r1((own.filter((c) => c.state === "in-stock").length / own.length) * 100);
  }

  if (kpi === "shelfShare") {
    const all = full.cells.filter((c) => c.posId === posId && c.state === "in-stock");
    const total = all.reduce((s, c) => s + c.facings, 0);
    if (total === 0) return null;
    const mine = own
      .filter((c) => c.state === "in-stock")
      .reduce((s, c) => s + c.facings, 0);
    return r1((mine / total) * 100);
  }

  if (kpi === "assortment") {
    const outlet = view.outlets.find((p) => p.id === posId);
    if (!outlet) return null;
    /* Against the SKUs in scope: filtered to one line, "carries the
       range" collapses to "carries that line", which is the honest
       reading of the filter. */
    const inScope = new Set(view.cells.map((c) => c.skuId));
    const expected = [...inScope].filter(
      (skuId) => skuOf(skuId)?.brandId === clientBrand.id
    ).length;
    if (expected === 0) return null;
    return r1((own.length / expected) * 100);
  }

  if (kpi === "price") {
    const readings = view.prices.filter(
      (p) => p.posId === posId && skuOf(p.skuId)?.brandId === clientBrand.id
    );
    if (readings.length === 0) return null;
    return r1((readings.filter((p) => Math.abs(p.variance) <= 5).length / readings.length) * 100);
  }

  const posm = view.posm.filter((p) => p.posId === posId);
  if (posm.length === 0) return null;
  return r1((posm.filter((p) => p.present).length / posm.length) * 100);
}

/* ---------- the detection floor, sized to the cohort ----------

   Bootstrapped from the cohort's own outlets: resample with
   replacement, take the standard error of the mean, and call the
   smallest detectable effect 2.8 × SE.

   Sizing matters more here than anywhere else in the portal. The
   market floor is 1.8 points because it rests on 742 outlets; a cohort
   of 38 is nothing like as steady, and reusing the market figure would
   call a two-point cohort move "Improved" when it is noise. A smaller
   request gets a coarser floor, which is exactly right — it has less
   evidence. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cohortFloor(values: number[], draws = 300): number {
  if (values.length < 2) return 100;
  const rand = mulberry32(values.length * 7919 + 13);
  const means: number[] = [];
  for (let d = 0; d < draws; d += 1) {
    let sum = 0;
    for (let i = 0; i < values.length; i += 1) {
      sum += values[Math.floor(rand() * values.length)];
    }
    means.push(sum / values.length);
  }
  const mean = means.reduce((a, b) => a + b, 0) / means.length;
  const se = Math.sqrt(
    means.reduce((s, v) => s + (v - mean) ** 2, 0) / (means.length - 1)
  );
  return Math.round(2.8 * se * 10) / 10;
}

/* ---------- the comparison ---------- */

export type Cohort = {
  /* Outlets the request asked about, after any active filter. */
  requested: string[];
  /* Of those, the ones the follow-up cycle actually reached AND that
     have a comparable reading at both ends. */
  matched: string[];
  baseline: number | null;
  followUp: number | null;
  delta: number | null;
  floor: number;
  result: RevisitResult;
};

export function compareCohort(
  posIds: string[],
  kpi: IssueKpi,
  origin: { view: MarketView; full: MarketView },
  cycle: { view: MarketView; full: MarketView } | null
): Cohort {
  const requested = [...new Set(posIds)];
  if (!cycle) {
    return {
      requested,
      matched: [],
      baseline: null,
      followUp: null,
      delta: null,
      floor: 0,
      result: "pending",
    };
  }

  const pairs: { posId: string; before: number; after: number }[] = [];
  for (const posId of requested) {
    const before = posKpi(origin.view, origin.full, posId, kpi);
    const after = posKpi(cycle.view, cycle.full, posId, kpi);
    /* BOTH ends or neither. An outlet with a reading in only one cycle
       cannot contribute to a change, and including it in one side of
       the average is precisely the error §16 exists to forbid. */
    if (before === null || after === null) continue;
    pairs.push({ posId, before, after });
  }

  if (pairs.length === 0) {
    return {
      requested,
      matched: [],
      baseline: null,
      followUp: null,
      delta: null,
      floor: 0,
      result: "pending",
    };
  }

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const baseline = r1(mean(pairs.map((p) => p.before)));
  const followUp = r1(mean(pairs.map((p) => p.after)));
  const delta = r1(followUp - baseline);
  /* The floor is bootstrapped on the per-outlet CHANGES, which is what
     the claim is about. */
  const floor = cohortFloor(pairs.map((p) => p.after - p.before));

  return {
    requested,
    matched: pairs.map((p) => p.posId),
    baseline,
    followUp,
    delta,
    floor,
    result: resultOf(delta, floor),
  };
}

export function resultOf(delta: number | null, floor: number): RevisitResult {
  if (delta === null) return "pending";
  if (Math.abs(delta) < floor) return "no-change";
  return delta > 0 ? "improved" : "worsened";
}

/* A request whose governorates disagree is MIXED, and the top-level
   number alone would hide that: +6 in Baghdad and −7 in Basra averages
   to something that describes neither. */
export function resultAcross(parts: Cohort[]): RevisitResult {
  const decided = parts.filter((p) => p.result !== "pending");
  if (decided.length === 0) return "pending";
  const up = decided.filter((p) => p.result === "improved").length;
  const down = decided.filter((p) => p.result === "worsened").length;
  if (up > 0 && down > 0) return "mixed";
  if (up > 0) return "improved";
  if (down > 0) return "worsened";
  return "no-change";
}

/* ---------- status ----------

   Operational progress, kept apart from the result. One says where the
   fieldwork has got to; the other says what it found, and a page that
   merges them can report "Completed" as though it were good news. */
export function statusOf(
  request: FollowUpRequest,
  matchedCount: number,
  cycleAudited: boolean,
  cycleComplete: boolean
): RequestStatus {
  if (request.cancelled) return "cancelled";
  if (!cycleAudited) return "requested";
  if (matchedCount === 0) return "scheduled";
  if (matchedCount >= request.posIds.length || cycleComplete) return "completed";
  return "in-progress";
}

/* Cancelling is refused once the evidence exists. A request whose
   outlets have already been revisited has produced a finding, and
   withdrawing it would delete an observation rather than a plan. */
export function canCancel(status: RequestStatus, matchedCount: number): boolean {
  return matchedCount === 0 && status !== "completed" && status !== "cancelled";
}

/* ---------- cycles ---------- */

export const cycleLabel = (id: string) => monthLabel(id);

export function futureCycles(after: string): string[] {
  return months.filter((m) => m.id > after).map((m) => m.id);
}

export const governorateOfLabel = governorateName;

/* ============================================================
   STORAGE.

   Seeded requests come from the payload, so the page opens with work
   already in flight; anything the client raises is added in this
   browser. One key, one shape, a version so a change clears a stale
   board rather than crashing on it.
   ============================================================ */

const KEY = "vemi.followups.v1";
type Store = { version: 1; requests: FollowUpRequest[] };

/* The requests the generator raised, as the app's own shape. Their
   issue ids are derived rather than stored: an id built from the
   observation is stable without being persisted, and deriving keeps a
   seeded request honest if the data is regenerated. */
export function seededRequests(): FollowUpRequest[] {
  return seededFollowUps.map((seed) => ({
    id: seed.id,
    kpi: seed.kpi,
    brandId: seed.brand,
    originMonth: seed.originMonth,
    cycle: seed.cycle,
    createdAt: seed.createdAt,
    posIds: seed.pos,
    issueIds: [],
  }));
}

export function loadRequests(): FollowUpRequest[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version !== 1 || !Array.isArray(parsed.requests)) return null;
    return parsed.requests;
  } catch {
    return null;
  }
}

export function saveRequests(requests: FollowUpRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, requests } satisfies Store));
  } catch {
    /* Blocked storage: the queue still works for this session. */
  }
}

export function clearRequests(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/* A request raised from the Performance page. The outlets are whatever
   the active filter selected, which is what makes §4 true: narrow to
   one SKU and the request carries only the outlets with a gap on that
   SKU. */
export function createRequest(input: {
  kpi: IssueKpi;
  originMonth: string;
  cycle: string;
  posIds: string[];
  issueIds: string[];
}): FollowUpRequest {
  return {
    id: `req-${input.kpi}-${input.cycle}-${Date.now().toString(36)}`,
    kpi: input.kpi,
    brandId: clientBrand.id,
    originMonth: input.originMonth,
    cycle: input.cycle,
    createdAt: new Date().toISOString().slice(0, 10),
    posIds: [...new Set(input.posIds)],
    issueIds: input.issueIds,
  };
}

export type Summary = {
  active: number;
  posRequested: number;
  posScheduled: number;
  posRevisited: number;
  completed: number;
};
