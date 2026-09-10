/* ============================================================
   THE WATCHLIST.

   A watch is a standing question: "tell me where this number is next
   time somebody looks." It is not a follow-up audit — that sends
   people back into the field and costs money. A watch costs nothing
   and asks nothing of anyone; it just keeps a figure where its owner
   can find it.

   WHAT A WATCH STORES, AND WHAT IT REFUSES TO. It stores the QUESTION:
   which measure, over which slice of the market, against what target,
   and what the figure read on the day it was pinned. It does not store
   the current value, because the current value is a property of the
   data and the filters, not of the watch — a stored one would go stale
   the moment the month rolled over and then quietly disagree with
   every other page in the portal.

   So the baseline is a record of the past and everything else is
   recomputed. That is the same rule the follow-up queue follows, for
   the same reason.
   ============================================================ */

import type { IssueKpi } from "./issues";
import { KPI_LABEL } from "./issues";
import type { MarketView } from "./filters";
import { governorateName, channelName, clientBrand, skuOf } from "./index";

export type WatchScope = {
  /* Empty means the whole market. Each of these narrows it. */
  governorateId?: string;
  channel?: string;
  retailer?: string;
};

export type Watch = {
  id: string;
  kpi: IssueKpi | "score";
  scope: WatchScope;
  /* What the reader wants it to reach. Defaults to the KPI's target,
     which is a figure already on the page rather than one somebody had
     to invent. */
  target: number;
  /* The reading on the day it was pinned, and the month that reading
     came from. Kept so the page can say what has happened SINCE, which
     is the only thing a watchlist is for. */
  baseline: number;
  baselineMonth: string;
  createdAt: string;
  note?: string;
};

export const WATCH_KPI_LABEL: Record<Watch["kpi"], string> = {
  ...KPI_LABEL,
  score: "Execution score",
};

/* One watch per question. Pinning the same measure over the same slice
   twice is not two watches, it is one watch clicked twice — and a list
   that fills with duplicates is a list nobody keeps. */
export function watchId(kpi: Watch["kpi"], scope: WatchScope): string {
  return [
    kpi,
    scope.governorateId ?? "*",
    scope.channel ?? "*",
    scope.retailer ?? "*",
  ].join("|");
}

export function scopeLabel(scope: WatchScope): string {
  const parts = [
    scope.governorateId ? governorateName(scope.governorateId) : null,
    scope.channel ? channelName(scope.channel) : null,
    scope.retailer ?? null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All audited outlets";
}

/* Does the current view still contain the slice this watch asks about?
   A watch pinned on Basra says nothing while the reader is filtered to
   Erbil, and showing a figure anyway would be answering a question
   nobody asked. */
export function scopeMatches(scope: WatchScope, view: MarketView): boolean {
  const f = view.filters;
  if (scope.governorateId && f.governorates.length && !f.governorates.includes(scope.governorateId)) {
    return false;
  }
  if (scope.channel && f.channels.length && !f.channels.includes(scope.channel)) return false;
  if (scope.retailer && f.retailers.length && !f.retailers.includes(scope.retailer)) return false;
  return true;
}

/* ---------- reading the figure now ----------

   Computed from the rows, every time, the same way the dashboard tiles
   compute theirs. A watch stores the question and the past; the
   present is always re-derived.
------------------------------------------------------------------ */

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));

export function watchValue(watch: Watch, view: MarketView): number | null {
  const outlets = view.outlets.filter(
    (o) =>
      (!watch.scope.governorateId || o.governorateId === watch.scope.governorateId) &&
      (!watch.scope.channel || o.channel === watch.scope.channel) &&
      (!watch.scope.retailer || o.retailer === watch.scope.retailer)
  );
  if (outlets.length === 0) return null;
  const ids = new Set(outlets.map((o) => o.id));

  if (watch.kpi === "score") {
    const rows = view.scores.filter((s) => ids.has(s.posId));
    if (rows.length === 0) return null;
    return Math.round(rows.reduce((sum, s) => sum + s.score, 0) / rows.length);
  }

  const own = view.cells.filter(
    (c) => ids.has(c.posId) && skuOf(c.skuId)?.brandId === clientBrand.id
  );

  if (watch.kpi === "availability") {
    if (own.length === 0) return null;
    return pct(own.filter((c) => c.state === "in-stock").length, own.length);
  }

  if (watch.kpi === "shelfShare") {
    /* Denominator from the WHOLE fixture in those outlets, not the
       client's own rows — otherwise a brand filter would leave the
       client holding 100% of a shelf containing only the client. */
    const all = view.cells.filter((c) => ids.has(c.posId) && c.state === "in-stock");
    const total = all.reduce((s, c) => s + c.facings, 0);
    if (total === 0) return null;
    return pct(own.filter((c) => c.state === "in-stock").reduce((s, c) => s + c.facings, 0), total);
  }

  if (watch.kpi === "assortment") {
    const rows = view.scores.filter((s) => ids.has(s.posId));
    const usable = rows.map((s) => s.assortment).filter((v): v is number => v !== null);
    if (usable.length === 0) return null;
    return r1(usable.reduce((a, b) => a + b, 0) / usable.length);
  }

  if (watch.kpi === "price") {
    const rows = view.prices.filter(
      (p) => ids.has(p.posId) && skuOf(p.skuId)?.brandId === clientBrand.id
    );
    if (rows.length === 0) return null;
    return pct(rows.filter((p) => p.compliant).length, rows.length);
  }

  const posm = view.posm.filter((p) => ids.has(p.posId));
  if (posm.length === 0) return null;
  return pct(posm.filter((p) => p.present).length, posm.length);
}

/* ---------- storage ----------

   Same shape as the follow-up queue: one versioned key, this browser
   only, and the page says so rather than implying a server. */

const KEY = "vemi.watchlist.v1";

/* A TINY EXTERNAL STORE, not per-component state — the same shape
   `settings.ts` uses for targets, and for a reason that shows up
   immediately here. A Watch control sits on the dashboard tiles, on the
   Performance tiles and on the Watchlist page at once. With the list
   held inside each hook, pinning a figure in one place left every other
   control on the same screen still saying "Watch". One store, one
   subscription, every control correct. */

let watches: Watch[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeWatches(listener: () => void): () => void {
  listeners.add(listener);
  /* THE STORE HYDRATES ITSELF, on the first thing that subscribes to
     it, rather than waiting to be told by a component's effect.

     The effect-driven version did not work and the reason is worth
     recording: `subscribe` is called by React during commit, whereas a
     passive effect is scheduled afterwards, and this pane never got
     round to running the passive one — every Watch control stayed
     disabled and the Watchlist page sat on "Reading your watchlist…"
     indefinitely. Subscribing is the one moment React guarantees, so
     that is where the read belongs.

     The emit is deferred to a microtask because subscribe runs inside
     React's commit, and notifying synchronously from there would be
     telling React the store changed while it is still writing the DOM. */
  if (!hydrated) {
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) watches = parsed as Watch[];
    } catch {
      /* Private mode, cleared storage, a hand-edited value — an empty
         list is the honest answer and the page still works. */
    }
    queueMicrotask(emit);
  }
  return () => listeners.delete(listener);
}

/* The server has no localStorage and must always see the empty list, or
   the first client render disagrees with the HTML it is hydrating. The
   stored list arrives a tick later, through `hydrateWatches`. */
export function getWatches(): Watch[] {
  return watches;
}

export function watchesReady(): boolean {
  return hydrated;
}


export function saveWatches(next: Watch[]): void {
  watches = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Nothing to do; the session stays correct in memory. */
  }
  emit();
}

/* ---------- reading one ---------- */

export type WatchState = "reached" | "improving" | "slipping" | "flat" | "out-of-scope";

export const WATCH_STATE_LABEL: Record<WatchState, string> = {
  reached: "Target reached",
  improving: "Moving toward target",
  slipping: "Moving away",
  flat: "No material change",
  "out-of-scope": "Outside the current filter",
};

/* A point of movement is not a change. The market's own bootstrapped
   detection floor is 1.81pt, so anything inside that is reported as
   flat rather than dressed up as a trend. */
export const WATCH_FLOOR_PT = 1.81;

export function watchState(
  watch: Watch,
  current: number | null,
  inScope: boolean
): WatchState {
  if (!inScope || current === null) return "out-of-scope";
  if (current >= watch.target) return "reached";
  const moved = current - watch.baseline;
  if (Math.abs(moved) < WATCH_FLOOR_PT) return "flat";
  return moved > 0 ? "improving" : "slipping";
}
