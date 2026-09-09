/* ============================================================
   CLIENT SETTINGS — targets, people, notifications.

   The important distinction in this file, and the reason it exists
   separately from the engine:

     A TARGET is a contractual goal. "Availability should be 95%" is a
     statement about what the client wants, and moving it is a business
     decision — so when it moves, every band, badge and headline in the
     portal moves with it.

     A THRESHOLD is calibrated to what this market actually varies by.
     "A district 7 points below its city's share is critical" comes
     from the observed spread across 54 districts, and lowering a
     target must not silence it. Otherwise a problem could be made to
     disappear by moving a goalpost, which is exactly the kind of
     comfort a retail audit exists to refuse.

   So targets drive PRESENTATION everywhere, and the rules engine keeps
   its own bars. The Setup page states this in as many words.

   Targets live in a tiny external store rather than React context,
   because pure modules — the report, the outlet rows, the story
   templates — need to read them too, and threading a context through
   non-React code would mean passing targets into every function.
   ============================================================ */

import { kpiTargets, sharePar } from "./index";

export type Targets = {
  availability: number;
  shelfShare: number;
  assortment: number;
  price: number;
  posm: number;
  score: number;
};

export const DEFAULT_TARGETS: Targets = {
  availability: kpiTargets.availability,
  shelfShare: Math.round(sharePar * 100),
  assortment: kpiTargets.assortment,
  price: kpiTargets.price,
  posm: kpiTargets.posm,
  score: kpiTargets.score,
};

export const TARGET_META: { id: keyof Targets; label: string; hint: string }[] = [
  { id: "availability", label: "On-shelf availability", hint: "Listed lines found in stock" },
  { id: "shelfShare", label: "Share of shelf", hint: "Client facings as a share of the fixture" },
  { id: "assortment", label: "Assortment compliance", hint: "Range carried against the format's expectation" },
  { id: "price", label: "Price compliance", hint: "Readings within 5% of RRP" },
  { id: "posm", label: "POSM compliance", hint: "Agreed material present where checked" },
  { id: "score", label: "Execution score", hint: "The weighted composite of the five above" },
];

const KEY = "vemi.targets.v1";

let currentTargets: Targets = DEFAULT_TARGETS;
const listeners = new Set<() => void>();

export function getTargets(): Targets {
  return currentTargets;
}

/* The server has no localStorage, so it must always see the defaults —
   and so must the client's FIRST render, or hydration mismatches. The
   stored values arrive a tick later, through `hydrateTargets`. */
export function getDefaultTargets(): Targets {
  return DEFAULT_TARGETS;
}

export function subscribeTargets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

export function setTarget(id: keyof Targets, value: number): void {
  const clamped = Math.max(1, Math.min(100, Math.round(value)));
  currentTargets = { ...currentTargets, [id]: clamped };
  persist();
  emit();
}

export function resetTargets(): void {
  currentTargets = DEFAULT_TARGETS;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to do */
    }
  }
  emit();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(currentTargets));
  } catch {
    /* blocked storage: the change still applies for this session */
  }
}

export function hydrateTargets(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Targets>;
    const next = { ...DEFAULT_TARGETS };
    for (const meta of TARGET_META) {
      const value = parsed[meta.id];
      if (typeof value === "number" && value > 0 && value <= 100) next[meta.id] = value;
    }
    currentTargets = next;
    emit();
  } catch {
    /* corrupt store: stay on the defaults */
  }
}

export const targetsAreCustom = () =>
  TARGET_META.some((meta) => currentTargets[meta.id] !== DEFAULT_TARGETS[meta.id]);

/* ---------- people ----------

   Five fictional users, because a users table with no people in it
   reads oddly, and because the action queue needs somewhere for
   ownership to point. Roles match the ones the brief names; the field
   auditors are separate, and come from the audit data itself. */

export type Access = "Full access" | "Read & act" | "Read only";

export type User = {
  id: string;
  name: string;
  role: string;
  access: Access;
  status: "Active" | "Invited";
  /* Which rules' work lands with this person by default. */
  owns: string;
};

export const USERS: User[] = [
  { id: "u-cd", name: "Sarmad Al-Rawi", role: "Commercial Director", access: "Full access", status: "Active", owns: "Competitive response and category strategy" },
  { id: "u-sm", name: "Ahmed Kadhim", role: "Sales Manager", access: "Read & act", status: "Active", owns: "Availability and replenishment" },
  { id: "u-tm", name: "Layla Hussein", role: "Trade Marketing Manager", access: "Read & act", status: "Active", owns: "Shelf position and point-of-sale material" },
  { id: "u-ka", name: "Dara Othman", role: "Key Account Manager", access: "Read & act", status: "Active", owns: "Range, pricing and account negotiations" },
  { id: "u-admin", name: "Vemi Support", role: "Vemi Admin", access: "Full access", status: "Active", owns: "Audit configuration and data delivery" },
];

export const userByRole = (role: string) => USERS.find((u) => u.role === role);
export const userName = (role: string) => userByRole(role)?.name ?? role;

/* ---------- notifications ---------- */

export type NotificationId =
  | "critical-oos" | "competitor" | "weekly" | "monthly-report" | "revisit";

export const NOTIFICATIONS: { id: NotificationId; label: string; hint: string }[] = [
  { id: "critical-oos", label: "Critical out-of-stock alerts", hint: "When a listed door is found carrying none of the brand" },
  { id: "competitor", label: "Competitor movement", hint: "When a rival's shelf gain clears the detection floor for its city" },
  { id: "weekly", label: "Weekly summary", hint: "Coverage and the week's new findings" },
  { id: "monthly-report", label: "Monthly report ready", hint: "When the cycle closes and the report is assembled" },
  { id: "revisit", label: "Revisit completed", hint: "When a flagged outlet is audited again" },
];

const NOTIFY_KEY = "vemi.notifications.v1";

export const DEFAULT_NOTIFICATIONS: Record<NotificationId, boolean> = {
  "critical-oos": true,
  competitor: true,
  weekly: false,
  "monthly-report": true,
  revisit: true,
};

export function loadNotifications(): Record<NotificationId, boolean> {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(NOTIFY_KEY);
    if (!raw) return DEFAULT_NOTIFICATIONS;
    return { ...DEFAULT_NOTIFICATIONS, ...(JSON.parse(raw) as Record<NotificationId, boolean>) };
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotifications(value: Record<NotificationId, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(value));
  } catch {
    /* nothing to do */
  }
}
