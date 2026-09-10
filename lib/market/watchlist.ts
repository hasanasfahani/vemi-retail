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
import { KPI_NAME } from "./kpiLabels";
import { scoreboard } from "./competition";
import { governorateHealth } from "./governorateHealth";
import type { MarketView } from "./filters";
import { governorateName, channelName, clientBrand, brands, skuOf } from "./index";

export type WatchScope = {
  /* Empty means the whole market. Each of these narrows it.

     THE RULE THAT DECIDES WHAT THIS HOLDS: a watch may only be pinned
     on a slice the portal can find again next month. Everything here
     is a dimension of the audit itself — a place, a format, a retailer,
     a brand, a line — so the same question can be asked of a cycle
     nobody has run yet. A watch on "the third row of this chart" would
     have nothing to recompute. */
  governorateId?: string;
  district?: string;
  channel?: string;
  retailer?: string;
  /* Any brand, not only the client. A rival taking space is exactly
     the thing worth keeping an eye on. */
  brandId?: string;
  skuId?: string;
};

/* The measures a figure can be pinned on. The five audit KPIs and the
   composite, plus three the Competition page states and nothing else
   did: promotion coverage, eye-level conversion, and districts led.

   All three are recomputable from the same rows every cycle, which is
   the only test that matters here — a watch that cannot be recomputed
   is a screenshot with a target written on it. */
export type WatchKpi =
  | IssueKpi
  | "score"
  | "promo"
  | "visibility"
  | "districtsLed"
  /* Counts and extremes the tabs state directly. Each is a quantity a
     tile shows, and each is recomputed from the same rows every cycle
     — the only test that decides whether something belongs here. Where
     a tile showed a figure with no measure behind it, the honest fix
     was to add the measure rather than hang an eye on the nearest KPI
     and pin a number the tile does not display. */
  | "gapsFound"
  | "coverage"
  | "priceAbove"
  | "priceBelow"
  | "priceWorst"
  /* The mix-adjusted price index. Read through competition.ts's own
     scoreboard rather than recomputed here: the index divides each
     reading by the average price of its own pack before averaging the
     ratios, and a second copy of that would be a second answer. */
  | "priceIndex";

export type Watch = {
  id: string;
  kpi: WatchKpi;
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

export const WATCH_KPI_LABEL: Record<WatchKpi, string> = {
  ...KPI_LABEL,
  score: KPI_NAME.score,
  promo: "Promotion presence",
  visibility: "Eye-level conversion",
  districtsLed: "Districts led",
  gapsFound: "Gaps found",
  coverage: "Coverage",
  priceAbove: "Readings above list",
  priceBelow: "Readings below list",
  priceWorst: "Worst price variance",
  priceIndex: "Price index",
};

/* Most of these are rates. Districts led is a count, and appending a
   percent sign to it would turn nineteen districts into nineteen
   percent of something unnamed. */
export const WATCH_KPI_UNIT: Record<WatchKpi, string> = {
  availability: "%",
  shelfShare: "%",
  assortment: "%",
  price: "%",
  posm: "%",
  score: "",
  promo: "%",
  visibility: "%",
  districtsLed: "",
  gapsFound: "",
  coverage: "%",
  priceAbove: "",
  priceBelow: "",
  priceWorst: "%",
  priceIndex: "",
};

/* One watch per question. Pinning the same measure over the same slice
   twice is not two watches, it is one watch clicked twice — and a list
   that fills with duplicates is a list nobody keeps. */
export function watchId(kpi: WatchKpi, scope: WatchScope): string {
  return [
    kpi,
    scope.governorateId ?? "*",
    scope.district ?? "*",
    scope.channel ?? "*",
    scope.retailer ?? "*",
    scope.brandId ?? "*",
    scope.skuId ?? "*",
  ].join("|");
}

export function scopeLabel(scope: WatchScope): string {
  const parts = [
    scope.brandId ? brands.find((b) => b.id === scope.brandId)?.name ?? scope.brandId : null,
    scope.skuId ? skuOf(scope.skuId)?.name ?? scope.skuId : null,
    scope.governorateId ? governorateName(scope.governorateId) : null,
    scope.district ?? null,
    scope.channel ? channelName(scope.channel) : null,
    scope.retailer ?? null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All audited outlets";
}

/* THE ID IS DERIVED, SO IT IS RE-DERIVED ON THE WAY IN.

   A stored id is a cached answer to "which question is this?", and the
   question is fully described by the kpi and the scope beside it. When
   the scope gained brand, SKU and district, every id already in a
   browser was left in the old four-part shape — so a figure genuinely
   on the watchlist showed an unwatched eye, and clicking it added a
   second row for the same question.

   Recomputing on load makes that class of bug impossible rather than
   fixed once: any future dimension added to the scope heals itself the
   next time the list is read. Duplicates that collapse to one id are
   folded, newest kept, because that is what the reader last said. */
function adopt(stored: Watch[]): Watch[] {
  const byId = new Map<string, Watch>();
  for (const watch of stored) {
    if (!watch || typeof watch !== "object" || !watch.kpi) continue;
    const id = watchId(watch.kpi, watch.scope ?? {});
    byId.set(id, { ...watch, scope: watch.scope ?? {}, id });
  }
  return [...byId.values()];
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
  if (scope.brandId && f.brands.length && !f.brands.includes(scope.brandId)) return false;
  if (scope.skuId && f.skus.length && !f.skus.includes(scope.skuId)) return false;
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
  const { scope } = watch;

  const outlets = view.outlets.filter(
    (o) =>
      (!scope.governorateId || o.governorateId === scope.governorateId) &&
      (!scope.district || o.district === scope.district) &&
      (!scope.channel || o.channel === scope.channel) &&
      (!scope.retailer || o.retailer === scope.retailer)
  );
  if (outlets.length === 0) return null;
  const ids = new Set(outlets.map((o) => o.id));

  /* Whose shelf is being watched. Defaults to the client, because a
     watch with no brand named is a watch on your own performance. */
  const brandId = scope.brandId ?? clientBrand.id;
  const mine = (skuId: string) => {
    if (scope.skuId) return skuId === scope.skuId;
    return skuOf(skuId)?.brandId === brandId;
  };

  /* The composite is scored per outlet for the CLIENT only — there is
     no rival execution score to average — so a brand-scoped watch on
     it would be answering a different question than it asked. */
  if (watch.kpi === "score") {
    /* There is no rival execution score to average. */
    if (scope.brandId && scope.brandId !== clientBrand.id) return null;

    /* A GOVERNORATE'S SCORE IS THE ONE ITS CARD SHOWS, and getting this
       wrong was visible within seconds: pinning Basra from the health
       card stored 85, and the watchlist read it back as 83 and called
       it "moving away" on the day it was created.

       Both numbers were defensible and they were different questions.
       The card weights the governorate's own aggregate components —
       availability 30, shelf 25, and so on, each computed across the
       whole city. Averaging per-outlet composites instead gives every
       door equal say regardless of size. One question, one number: the
       watch reads the same function the card does. */
    if (scope.governorateId && !scope.district && !scope.channel && !scope.retailer) {
      const health = governorateHealth(view).find(
        (row) => row.governorateId === scope.governorateId
      );
      return health ? health.score : null;
    }

    const rows = view.scores.filter((s) => ids.has(s.posId));
    if (rows.length === 0) return null;
    return Math.round(rows.reduce((sum, s) => sum + s.score, 0) / rows.length);
  }

  const own = view.cells.filter((c) => ids.has(c.posId) && mine(c.skuId));

  if (watch.kpi === "availability") {
    if (own.length === 0) return null;
    return pct(own.filter((c) => c.state === "in-stock").length, own.length);
  }

  if (watch.kpi === "shelfShare") {
    /* Denominator from the WHOLE fixture in those outlets, never the
       watched brand's own rows — otherwise every brand would hold
       100% of a shelf containing only itself. */
    const all = view.cells.filter((c) => ids.has(c.posId) && c.state === "in-stock");
    const total = all.reduce((s, c) => s + c.facings, 0);
    if (total === 0) return null;
    return pct(own.filter((c) => c.state === "in-stock").reduce((s, c) => s + c.facings, 0), total);
  }

  if (watch.kpi === "assortment") {
    /* Range is a client contract figure; the audit states no expected
       range for a rival. */
    if (scope.brandId && scope.brandId !== clientBrand.id) return null;

    /* ONE LINE IS A DIFFERENT QUESTION FROM THE RANGE. Scoped to a
       SKU, "assortment" means that line's PENETRATION — the share of
       audited outlets carrying it — which is what the SKU charts draw.
       Averaging the outlets' whole-range scores instead would pin a
       number the reader never saw and cannot find again. */
    if (scope.skuId) {
      const carrying = new Set(
        view.cells.filter((c) => ids.has(c.posId) && c.skuId === scope.skuId).map((c) => c.posId)
      );
      return pct(carrying.size, outlets.length);
    }

    const rows = view.scores.filter((s) => ids.has(s.posId));
    const usable = rows.map((s) => s.assortment).filter((v): v is number => v !== null);
    if (usable.length === 0) return null;
    return r1(usable.reduce((a, b) => a + b, 0) / usable.length);
  }

  if (watch.kpi === "price") {
    const rows = view.prices.filter((p) => ids.has(p.posId) && mine(p.skuId));
    if (rows.length === 0) return null;
    return pct(rows.filter((p) => p.compliant).length, rows.length);
  }

  if (watch.kpi === "promo") {
    /* Counted in DOORS. A promotion is either running at an outlet or
       it is not, and converting that to a share of shelf would be
       inventing a denominator. */
    if (scope.skuId) return null;
    /* `promos` carries a row per brand per audited outlet; the boolean
       on it says whether one was actually running. Counting the rows
       instead of the true ones counted every audited door as promoting
       — Coca-Cola read 35.4% against the scoreboard's 28.2%. */
    const promoting = new Set(
      view.promos
        .filter((p) => ids.has(p.posId) && p.brandId === brandId && p.promo)
        .map((p) => p.posId)
    );
    return pct(promoting.size, outlets.length);
  }

  if (watch.kpi === "visibility") {
    /* Of the brand's OWN facings, the share at eye level. The
       denominator is the brand's shelf, not the fixture: this asks how
       well space is converted into visibility, which is a different
       question from how much space there is. */
    const stocked = view.cells.filter(
      (c) => ids.has(c.posId) && c.state === "in-stock" && mine(c.skuId)
    );
    const total = stocked.reduce((s, c) => s + c.facings, 0);
    if (total === 0) return null;
    const eye = stocked
      .filter((c) => c.position === "eye")
      .reduce((s, c) => s + c.facings, 0);
    return pct(eye, total);
  }

  if (watch.kpi === "districtsLed") {
    /* Districts where this brand holds more of the fixture than any
       other. Districts with fewer than three audited outlets are
       excluded — one shop's shelf is not a district's position. */
    if (scope.skuId) return null;
    const byDistrict = new Map<string, Map<string, number>>();
    const doorsIn = new Map<string, Set<string>>();
    const outletById = new Map(outlets.map((o) => [o.id, o]));
    for (const cell of view.cells) {
      const outlet = outletById.get(cell.posId);
      if (!outlet || cell.state !== "in-stock") continue;
      const key = `${outlet.governorateId}|${outlet.district}`;
      doorsIn.set(key, (doorsIn.get(key) ?? new Set()).add(cell.posId));
      const held = byDistrict.get(key) ?? new Map<string, number>();
      const b = skuOf(cell.skuId)?.brandId;
      if (b) held.set(b, (held.get(b) ?? 0) + cell.facings);
      byDistrict.set(key, held);
    }
    let led = 0;
    for (const [key, held] of byDistrict) {
      if ((doorsIn.get(key)?.size ?? 0) < 3) continue;
      const top = [...held].sort((a, b) => b[1] - a[1])[0];
      if (top && top[0] === brandId) led += 1;
    }
    return led;
  }

  if (watch.kpi === "gapsFound") {
    /* Listed lines that were empty. A count, not a rate: it is what
       the tile shows, and what a field team is sent to close. */
    return own.filter((c) => c.state === "out-of-stock").length;
  }

  if (watch.kpi === "coverage") {
    /* Of the outlets this scope selects, the share the audit reached.
       A property of the collection plan rather than of the shelf, and
       true whatever the brand filter says — so a brand-scoped coverage
       watch is refused rather than answered with the same number. */
    if (scope.brandId || scope.skuId) return null;
    const inScope = view.outlets.length + view.notAuditedCount;
    return pct(view.outlets.length, inScope);
  }

  if (watch.kpi === "priceAbove" || watch.kpi === "priceBelow") {
    const rows = view.prices.filter((p) => ids.has(p.posId) && mine(p.skuId));
    if (rows.length === 0) return null;
    return rows.filter((p) =>
      watch.kpi === "priceAbove" ? p.variance > 5 : p.variance < -5
    ).length;
  }

  if (watch.kpi === "priceIndex") {
    /* 100 is category par. Scoped to a place or a format the index is
       recomputed over those outlets only, which is what the reader
       filtered to. */
    const board = scoreboard(
      scope.governorateId || scope.channel || scope.retailer
        ? { ...view, outlets, cells: view.cells.filter((c) => ids.has(c.posId)),
            prices: view.prices.filter((p) => ids.has(p.posId)) }
        : view
    );
    return board.find((b) => b.id === brandId)?.priceIndex ?? null;
  }

  if (watch.kpi === "priceWorst") {
    /* The single widest distance from list anywhere in scope. A worst
       case rather than an average, which is why it is its own measure
       and not a second reading of price compliance. */
    const rows = view.prices.filter((p) => ids.has(p.posId) && mine(p.skuId));
    if (rows.length === 0) return null;
    return r1(Math.max(...rows.map((p) => Math.abs(p.variance))));
  }

  /* POSM is recorded per outlet, not per SKU, so a line-scoped watch
     on it has no rows of its own to count. */
  if (scope.skuId) return null;
  if (scope.brandId && scope.brandId !== clientBrand.id) return null;
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
      if (Array.isArray(parsed)) watches = adopt(parsed as Watch[]);
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


/* Tests only: re-read storage from scratch. The store hydrates once
   per page, which is right in a browser and useless in a suite that
   needs to try several stored shapes. */
export function resetWatchesForTest(): void {
  hydrated = false;
  watches = [];
  const listener = () => {};
  const off = subscribeWatches(listener);
  off();
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
