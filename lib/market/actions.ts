/* ============================================================
   THE ACTION QUEUE.

   Actions are DERIVED, not authored. Each one is created from a
   finding the engine produced, and inherits that finding's affected
   outlets, city concentration, KPI and modelled value. Nothing here
   invents a business problem — the queue is the engine's output with
   an owner and a due date attached.

   The queue is seeded from the PREVIOUS month's findings, on purpose.
   An action raised against this month's audit cannot have been
   verified yet: nobody has been back. Seeding from last cycle means
   the board opens in the state a real one would be in — work raised
   last month, and this month's fieldwork arriving to say whether it
   held.

   Everything a person does to the board — status, owner, priority,
   notes — lives in localStorage under one key, so a demo survives a
   reload without pretending to be a backend.
   ============================================================ */

import { cityName, monthLabel } from "./index";
import { USERS, userName } from "./settings";
import { generateInsights, type Insight, type RuleId } from "./insights";
import { applyFilters, EMPTY_FILTERS } from "./filters";
import { formatIqd } from "./economics";
import type { MonthData } from "./types";

/* The six stages the brief names. Order matters: the board reads left
   to right, and `index` is what a keyboard move adds to or subtracts
   from. */
export const STAGES = [
  { id: "detected", label: "Detected", hint: "Raised by the engine, not yet looked at" },
  { id: "reviewed", label: "Reviewed", hint: "Someone has read it and agrees it is real" },
  { id: "assigned", label: "Assigned", hint: "It has an owner and a date" },
  { id: "revisit", label: "Revisit scheduled", hint: "The outlets are on a future route" },
  { id: "verified", label: "Verified", hint: "The next audit says the shelf changed" },
  { id: "resolved", label: "Resolved", hint: "Closed out" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];
export const STAGE_IDS = STAGES.map((s) => s.id) as StageId[];

export type Priority = "high" | "medium" | "low";

/* Ownership points at the people on the Users page, so there is one
   list of who exists rather than two that can drift. Roles still drive
   the DEFAULT assignment — pricing work lands with whoever holds the
   accounts — but the name on the card is a person somebody could ask. */
export const OWNERS = USERS.map((u) => u.role);
export type Owner = string;

export type Action = {
  id: string;
  /* The finding this came from. The verification check re-runs the
     engine and asks whether this id still fires — see `verify`. */
  insightId: string;
  rule: RuleId;
  /* The month whose audit raised it. */
  raisedIn: string;
  issue: string;
  recommendation: string;
  posAffected: number;
  affected: string[];
  cityId: string | null;
  kpi: string;
  money: number | null;
  priority: Priority;
  owner: Owner;
  dueDate: string;
  stage: StageId;
  notes: { at: string; text: string }[];
};

/* What each rule is actually asking someone to DO. The engine states a
   problem; this states the response, and it is per-rule because
   "restock" and "renegotiate facings" are not interchangeable. */
const RECOMMENDATION: Record<RuleId, string> = {
  "r1-outlet-gaps": "Prioritise replenishment on the next delivery to this outlet.",
  "r2-district-deficit": "Take facings into the district's account reviews.",
  "r3-distribution-gap": "Push listings for this SKU where its pack peers already sell.",
  "r4-rival-substitution": "Close the stockouts before the rival's facings become permanent.",
  "r5-price-cluster": "Raise the pricing breach with the retailer directly.",
  "r6-channel-gap": "Work the channel's replenishment pattern rather than individual doors.",
  "r7-shelf-position": "Negotiate eye-level space at the next range review.",
  "r9-dark-outlet": "Emergency replenishment — a listed door is selling none of the brand.",
  "r11-assortment-gap": "Sell the missing range in on the next visit.",
  "r13-posm-absent": "Route a material deployment through the affected outlets.",
  "r14-competitor-movement": "Decide whether to answer the rival's push or concede the format.",
  "r15-sku-stockout": "Treat this SKU as its own replenishment problem.",
};

/* Which KPI the action moves, so the board can be read by measure as
   well as by owner. */
const KPI: Record<RuleId, string> = {
  "r1-outlet-gaps": "Availability",
  "r2-district-deficit": "Shelf share",
  "r3-distribution-gap": "Assortment",
  "r4-rival-substitution": "Shelf share",
  "r5-price-cluster": "Price compliance",
  "r6-channel-gap": "Availability",
  "r7-shelf-position": "Shelf share",
  "r9-dark-outlet": "Availability",
  "r11-assortment-gap": "Assortment",
  "r13-posm-absent": "POSM",
  "r14-competitor-movement": "Shelf share",
  "r15-sku-stockout": "Availability",
};

/* Which owner a kind of work lands on. A real client would set this;
   here it is a stated mapping rather than a random draw, so the board
   is legible — every pricing action sits with the same person. */
const OWNER_FOR: Record<RuleId, Owner> = {
  "r1-outlet-gaps": "Sales Manager",
  "r2-district-deficit": "Key Account Manager",
  "r3-distribution-gap": "Key Account Manager",
  "r4-rival-substitution": "Commercial Director",
  "r5-price-cluster": "Key Account Manager",
  "r6-channel-gap": "Sales Manager",
  "r7-shelf-position": "Trade Marketing Manager",
  "r9-dark-outlet": "Sales Manager",
  "r11-assortment-gap": "Key Account Manager",
  "r13-posm-absent": "Trade Marketing Manager",
  "r14-competitor-movement": "Commercial Director",
  "r15-sku-stockout": "Sales Manager",
};

const PRIORITY: Record<Insight["severity"], Priority> = {
  critical: "high",
  warning: "medium",
  watch: "low",
};

/* Deterministic, so the board looks the same on every load and in
   every browser — a demo whose queue reshuffles on refresh reads as
   broken. Seeded from the action's own id. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/* Where a freshly seeded action sits on the board. Weighted so the
   queue looks worked rather than untouched, and the two end states are
   left to the verification check and to the person using it. */
function seedStage(action: Omit<Action, "stage">): StageId {
  const roll = hash(`${action.id}|stage`);
  if (action.priority === "high") {
    return roll < 0.28 ? "detected" : roll < 0.52 ? "reviewed" : roll < 0.84 ? "assigned" : "revisit";
  }
  return roll < 0.42 ? "detected" : roll < 0.7 ? "reviewed" : roll < 0.9 ? "assigned" : "revisit";
}

function seedDueDate(action: Omit<Action, "stage" | "dueDate">, monthId: string): string {
  /* Due inside the cycle that follows the month that raised it. */
  const [year, month] = monthId.split("-").map(Number);
  const day = 3 + Math.floor(hash(`${action.id}|due`) * 25);
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `${next.y}-${String(next.m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/* ---------- seeding ---------- */

export function seedActions(previous: MonthData, limit = 34): Action[] {
  const view = applyFilters({ ...EMPTY_FILTERS, month: previous.month }, previous);
  const report = generateInsights(view);

  /* One action per finding, but capped per rule: 123 assortment gaps
     would bury every other kind of work under a single rule's output,
     and a board nobody can read is a board nobody uses. */
  const perRule = new Map<RuleId, number>();
  const chosen: Insight[] = [];
  for (const insight of report.all) {
    const taken = perRule.get(insight.rule) ?? 0;
    if (taken >= 5) continue;
    perRule.set(insight.rule, taken + 1);
    chosen.push(insight);
    if (chosen.length >= limit) break;
  }

  return chosen.map((insight) => {
    const base = {
      id: `act-${insight.id}`,
      insightId: insight.id,
      rule: insight.rule,
      raisedIn: previous.month,
      issue: insight.headline,
      recommendation: RECOMMENDATION[insight.rule],
      posAffected: insight.scope.outlets,
      affected: insight.affected,
      cityId: insight.concentration?.cityId ?? insight.entities.cityId ?? null,
      kpi: KPI[insight.rule],
      money: insight.money,
      priority: PRIORITY[insight.severity],
      owner: OWNER_FOR[insight.rule],
      notes: [] as Action["notes"],
    };
    const dueDate = seedDueDate(base, previous.month);
    return { ...base, dueDate, stage: seedStage({ ...base, dueDate }) };
  });
}

/* ---------- verification ----------

   The test is deliberately uniform across every rule: does the finding
   this action came from still fire in the latest audit?

   A per-rule table of "what fixed looks like" was the obvious design
   and it is the wrong one — it would be a second implementation of
   every rule, maintained separately and free to disagree with the
   first. Asking the engine reuses the rule itself, so a threshold
   change moves both at once by construction.

   WHAT THIS CANNOT SAY, and must never imply: that the action CAUSED
   the change. One outlet, no counterfactual. The wording throughout is
   "confirmed at re-audit", which is an observation. Nor is `slipped` a
   judgement of the person — they may have done everything right and
   the distributor may not have delivered, which is itself worth
   knowing and is why the state exists rather than folding into
   "closed". */

export type Outcome =
  /* Re-audited, and the finding is gone. */
  | "held"
  /* Re-audited, and it still fires. */
  | "slipped"
  /* None of the affected outlets were audited again this month, so
     there is nothing to report. Not a failure — the rotating panel
     simply has not been back. */
  | "awaiting"
  /* Created from a rule the engine no longer has. Without this, an
     action from a deleted rule would grade as HELD — its finding is
     indeed absent, but absent because the rule went away, not because
     the shelf changed. Exactly the false credit this exists to
     prevent, arriving through the back door. */
  | "untracked";

export type Verification = {
  outcome: Outcome;
  /* Which of the action's outlets the latest audit actually reached. */
  reaudited: number;
  /* The finding as it stands now, when it still fires. */
  current: Insight | null;
  note: string;
};

export function verify(
  action: Action,
  currentReport: { all: Insight[] },
  currentView: { auditedAt: Map<string, string>; month: string },
  knownRules: readonly RuleId[]
): Verification {
  if (!knownRules.includes(action.rule)) {
    return {
      outcome: "untracked",
      reaudited: 0,
      current: null,
      note: "Raised by a rule the engine no longer runs, so there is nothing to check it against.",
    };
  }

  const reaudited = action.affected.filter((posId) => currentView.auditedAt.has(posId));
  if (reaudited.length === 0) {
    return {
      outcome: "awaiting",
      reaudited: 0,
      current: null,
      note: `None of these ${action.posAffected.toLocaleString()} outlets were audited again in ${monthLabel(currentView.month)} — the panel has not been back yet.`,
    };
  }

  const current = currentReport.all.find((i) => i.id === action.insightId) ?? null;
  if (current) {
    return {
      outcome: "slipped",
      reaudited: reaudited.length,
      current,
      note: `Re-audited ${reaudited.length.toLocaleString()} of ${action.posAffected.toLocaleString()} outlets in ${monthLabel(currentView.month)}, and the finding still fires${current.money ? ` at ${formatIqd(current.money)} IQD` : ""}.`,
    };
  }

  return {
    outcome: "held",
    reaudited: reaudited.length,
    current: null,
    note: `Confirmed at re-audit: the finding that raised this no longer fires across the ${reaudited.length.toLocaleString()} outlet${reaudited.length === 1 ? "" : "s"} seen again in ${monthLabel(currentView.month)}.`,
  };
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  held: "Confirmed at re-audit",
  slipped: "Still firing",
  awaiting: "Awaiting re-audit",
  untracked: "Not verifiable",
};

/* ---------- storage ----------

   One key, one JSON blob, and a version so a shape change clears a
   stale board instead of crashing on it. */

const KEY = "vemi.actions.v2";

export type Board = { version: 2; actions: Action[] };

export function loadBoard(): Action[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Board;
    if (parsed.version !== 2 || !Array.isArray(parsed.actions)) return null;
    return parsed.actions;
  } catch {
    /* A corrupt or blocked store is not an error worth surfacing — the
       board simply reseeds. */
    return null;
  }
}

export function saveBoard(actions: Action[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 2, actions } satisfies Board));
  } catch {
    /* Private browsing, quota, disabled storage. The board keeps
       working in memory; only the reload survives being lost. */
  }
}

export function clearBoard(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/* ---------- summary ---------- */

export function summarise(actions: Action[]) {
  const at = (stage: StageId) => actions.filter((a) => a.stage === stage).length;
  const open = actions.filter((a) => a.stage !== "resolved" && a.stage !== "verified").length;
  return {
    total: actions.length,
    critical: actions.filter((a) => a.priority === "high" && a.stage !== "resolved").length,
    open,
    inProgress: at("assigned") + at("revisit"),
    verified: at("verified"),
    resolved: at("resolved"),
    overdue: actions.filter(
      (a) => a.stage !== "resolved" && a.stage !== "verified" && a.dueDate < todayISO()
    ).length,
  };
}

/* The demo's "today" is the end of the current audit cycle rather than
   the machine's clock, so a due-date badge means the same thing
   whenever the demo is opened. */
export function todayISO(): string {
  return "2026-09-21";
}

export const cityLabel = (id: string | null) => (id ? cityName(id) : "Market-wide");

/* The person behind a role, for anywhere the board shows an owner. */
export const ownerName = (role: string) => userName(role);
