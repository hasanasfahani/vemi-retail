/* ============================================================
   REVISIT MANAGEMENT.

   Vemi audits a rotating panel, so the client's ability to say "go
   back to THAT door" is the difference between a survey and a service.
   This is that queue.

   It is seeded from the action board rather than kept independently.
   An action sitting in "Revisit scheduled" is already a statement that
   its outlets need another visit; storing that fact twice would let
   the two pages disagree about what is queued, and the first time they
   did, nobody would trust either.
   ============================================================ */

import { auditorName, governorateName, clientBrand, monthLabel, months, skuOf } from "./index";
import type { Action } from "./actions";
import type { MarketView } from "./filters";

export const REVISIT_STAGES = [
  { id: "flagged", label: "Flagged", hint: "Requested, not yet accepted onto a route" },
  { id: "approved", label: "Approved", hint: "Accepted for the next cycle" },
  { id: "route", label: "Added to route", hint: "On a named auditor's list" },
  { id: "visited", label: "Visited", hint: "The field team has been back" },
  { id: "verified", label: "Verified", hint: "The re-audit says what changed" },
] as const;

export type RevisitStage = (typeof REVISIT_STAGES)[number]["id"];
export const REVISIT_STAGE_IDS = REVISIT_STAGES.map((s) => s.id) as RevisitStage[];

export type Revisit = {
  posId: string;
  reason: string;
  priority: "high" | "medium" | "low";
  /* Who asked. Actions carry an owner; a flag raised from the drawer
     is attributed to the person using the portal. */
  requestedBy: string;
  flaggedAt: string;
  plannedMonth: string;
  stage: RevisitStage;
  /* The action that produced it, when it came from the board. */
  actionId: string | null;
};

const KEY = "vemi.revisits.v1";
type Store = { version: 1; revisits: Revisit[] };

/* The cycle a newly flagged outlet lands in: the month after the
   current one, since this month's fieldwork is already running. */
export function nextCycle(currentMonth: string): string {
  const index = months.findIndex((m) => m.id === currentMonth);
  const next = months[index + 1];
  if (next) return next.id;
  const [year, month] = currentMonth.split("-").map(Number);
  return month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, "0")}`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/* ---------- seeding ----------

   Every action already scheduled for a revisit contributes its
   outlets, capped so one market-wide finding cannot flood the queue
   with three hundred doors. Stages are dealt deterministically across
   the pipeline so it opens looking like work in progress. */
/* An outlet somebody would flag by hand: bad enough to be worth a
   special trip, and not already coming through an action. */
export type Candidate = { posId: string; reason: string; priority: Revisit["priority"] };

export function seedRevisits(
  actions: Action[],
  currentMonth: string,
  /* Direct flags, to stand for the requests a client makes outside the
     action queue. Without these the queue is only as big as whatever
     happened to be scheduled, which was 13 outlets — thinner than a
     real month's worth of requests. */
  candidates: Candidate[] = [],
  target = 26
): Revisit[] {
  const planned = nextCycle(currentMonth);
  const seen = new Set<string>();
  const out: Revisit[] = [];

  for (const action of actions) {
    if (action.stage !== "revisit") continue;
    /* A finding covering hundreds of outlets is a programme, not a
       revisit list — take the first few doors and let the rest follow
       from the action itself. */
    for (const posId of action.affected.slice(0, 4)) {
      if (seen.has(posId)) continue;
      seen.add(posId);
      const roll = hash(`${posId}|${action.id}`);
      out.push({
        posId,
        reason: action.issue,
        priority: action.priority,
        requestedBy: action.owner,
        flaggedAt: action.dueDate,
        plannedMonth: planned,
        stage:
          roll < 0.34 ? "flagged" : roll < 0.62 ? "approved" : roll < 0.86 ? "route" : "visited",
        actionId: action.id,
      });
    }
  }

  /* Top up with direct requests until the queue looks like a month's
     work. Deterministic order, so it does not reshuffle on reload. */
  const REQUESTERS = ["Commercial Director", "Sales Manager", "Trade Marketing Manager"];
  for (const candidate of candidates) {
    if (out.length >= target) break;
    if (seen.has(candidate.posId)) continue;
    seen.add(candidate.posId);
    const roll = hash(`${candidate.posId}|direct`);
    out.push({
      posId: candidate.posId,
      reason: candidate.reason,
      priority: candidate.priority,
      requestedBy: REQUESTERS[Math.floor(roll * REQUESTERS.length)],
      flaggedAt: `${currentMonth}-${String(2 + Math.floor(roll * 22)).padStart(2, "0")}`,
      plannedMonth: planned,
      stage: roll < 0.45 ? "flagged" : roll < 0.75 ? "approved" : "route",
      actionId: null,
    });
  }

  return out;
}

export function loadRevisits(): Revisit[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version !== 1 || !Array.isArray(parsed.revisits)) return null;
    return parsed.revisits;
  } catch {
    return null;
  }
}

export function saveRevisits(revisits: Revisit[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, revisits } satisfies Store));
  } catch {
    /* Blocked or full storage: the queue keeps working in memory. */
  }
}

export function clearRevisits(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/* ---------- before / after ----------

   Only an outlet audited in BOTH months can be compared to itself, and
   under a rotating panel that means the core panel. Everything else in
   the queue is honestly "awaiting its revisit" rather than a
   comparison nobody can make. */

type Side = {
  month: string;
  score: number;
  /* Null where the component did not apply at that visit. */
  availability: number | null;
  shelfShare: number | null;
  posm: number | null;
  gaps: number;
  auditedAt: string;
  collector: string;
};

export type Comparison = {
  posId: string;
  name: string;
  location: string;
  before: Side;
  after: Side;
  delta: { score: number; availability: number; shelfShare: number; posm: number; gaps: number };
  /* Whether the thing that got it flagged actually moved. */
  improved: boolean;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function comparisons(
  revisits: Revisit[],
  before: MarketView,
  after: MarketView
): Comparison[] {
  const beforeScores = new Map(before.scores.map((s) => [s.posId, s]));
  const afterScores = new Map(after.scores.map((s) => [s.posId, s]));
  /* CLIENT gaps only. Counting every brand's stockouts here put "1
     line out of stock" beside a client availability of 0%, which reads
     as a contradiction — the two figures have to be about the same
     brand or the card argues with itself. */
  const gapsOf = (view: MarketView, posId: string) =>
    view.cells.filter(
      (c) =>
        c.posId === posId &&
        c.state === "out-of-stock" &&
        skuOf(c.skuId)?.brandId === clientBrand.id
    ).length;

  return revisits
    .flatMap((revisit) => {
      const first = beforeScores.get(revisit.posId);
      const second = afterScores.get(revisit.posId);
      const outlet = after.outlets.find((p) => p.id === revisit.posId);
      if (!first || !second || !outlet) return [];

      /* A movement needs both ends. Where either visit had nothing to
         measure, the change is zero rather than a number invented from
         a missing one. */
      const moved = (a: number | null, b: number | null) =>
        a === null || b === null ? 0 : r1(b - a);

      const delta = {
        score: r1(second.score - first.score),
        availability: moved(first.availability, second.availability),
        shelfShare: moved(first.shelfShare, second.shelfShare),
        posm: moved(first.posm, second.posm),
        gaps: gapsOf(after, revisit.posId) - gapsOf(before, revisit.posId),
      };

      return [
        {
          posId: revisit.posId,
          name: outlet.name,
          location: `${outlet.district}, ${governorateName(outlet.governorateId)}`,
          before: {
            month: monthLabel(before.month),
            score: first.score,
            availability: first.availability,
            shelfShare: first.shelfShare,
            posm: first.posm,
            gaps: gapsOf(before, revisit.posId),
            auditedAt: before.auditedAt.get(revisit.posId) ?? "",
            collector: auditorName(before.auditedBy.get(revisit.posId) ?? ""),
          },
          after: {
            month: monthLabel(after.month),
            score: second.score,
            availability: second.availability,
            shelfShare: second.shelfShare,
            posm: second.posm,
            gaps: gapsOf(after, revisit.posId),
            auditedAt: after.auditedAt.get(revisit.posId) ?? "",
            collector: auditorName(after.auditedBy.get(revisit.posId) ?? ""),
          },
          delta,
          improved: delta.score > 0,
        },
      ];
    })
    .sort((a, b) => b.delta.score - a.delta.score);
}
