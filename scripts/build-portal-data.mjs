/* ============================================================
   Erbil carbonated beverages — audit data builder.

   Emits one JSON payload per domain into lib/data/. Each payload is
   shaped like an API response (meta + rows), so swapping in a real
   endpoint later is a change of source, not of shape.

   Everything is derived from one model: a SKU is listed at an outlet
   or it isn't; if listed, it is in stock or out. Facings, shelf share,
   OOS and pricing all fall out of that, so the pages can never
   contradict each other.

   Run: node scripts/build-portal-data.mjs
   ============================================================ */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "data");

/* Deterministic PRNG — same input, same dataset, every run. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260812);
const pick = (n) => rand() < n;
const between = (lo, hi) => lo + rand() * (hi - lo);
const intBetween = (lo, hi) => Math.round(between(lo, hi));

/* Box-Muller, for the persistent outlet effects below. */
function normal(mean = 0, sd = 1) {
  const u = Math.max(rand(), 1e-9);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}
const clamp = (lo, hi, x) => Math.min(hi, Math.max(lo, x));

/* ------------------------------------------------------------------
   COLLECTION WINDOWS — not field visits.

   THIS IS THE LOAD-BEARING CHANGE. The audit does not sweep a fixed
   panel on one day and sweep it again a month later. Auditors work a
   rolling daily schedule, and the outlets on any given day are not the
   outlets from last month — the panel ROTATES.

   Two consequences the old model got wrong, both of which produced
   numbers the operation cannot collect:

     1. No outlet is guaranteed a second observation, so "out of stock
        at both visits" and "days out" are unknowable. A single visit
        tells you a SKU is listed and empty RIGHT NOW; it cannot tell
        you for how long, or whether it was empty last time.

     2. Aggregates are trailing-window composites, not snapshots. A
        citywide figure is "the market as sampled across these 28
        days", and comparing two windows is comparing two samples —
        legitimate, but never a same-outlet before/after.

   So the unit here is a WINDOW: a trailing period with its own set of
   audited outlets, each carrying its own audit date. Window-over-window
   aggregate comparison is valid and labelled as such. Outlet-level
   comparison is not modelled at all, because it cannot be collected.
------------------------------------------------------------------ */
const WINDOW_DAYS = 28;

const WINDOWS = [
  {
    id: "2026-07-15",
    label: "Trailing 28 days to 15 Jul 2026",
    shortLabel: "to 15 Jul",
    end: "2026-07-15",
    current: false,
  },
  {
    id: "2026-08-12",
    label: "Trailing 28 days to 12 Aug 2026",
    shortLabel: "to 12 Aug",
    end: "2026-08-12",
    current: true,
  },
];
const PREV = WINDOWS[0].id;
const CURR = WINDOWS[1].id;

const DAY = 86_400_000;
const startOf = (win) =>
  new Date(Date.parse(win.end) - (WINDOW_DAYS - 1) * DAY).toISOString().slice(0, 10);
for (const win of WINDOWS) win.start = startOf(win);

/* How much of the universe one window reaches. Below 100% by design:
   a rotating schedule means some outlets are simply not visited inside
   any given window, and a portal that cannot show that gap cannot tell
   a client whether they got the coverage they bought. */
const WINDOW_COVERAGE = 0.78;

/* ------------------------------------------------------------------
   THE CORE PANEL — the same outlets, every window.

   A rotating sample cannot tell market movement from panel movement:
   measure 75 stores this month and 75 different stores next month, and
   a shelf-share delta is partly the market and partly which doors you
   happened to walk through. On this dataset a rotating sample of 50
   cannot detect a real move smaller than 7.2pt. Nothing in FMCG moves
   7 points in a month, so in practice it detects nothing.

   A FIXED sub-panel fixes that, because the comparison becomes paired:
   an outlet's own persistent character — its planogram, its rep, its
   service level — appears on both sides of the subtraction and cancels.
   The measured outlet-level share correlation across windows here is
   r = 0.75, which is what makes the cancellation worth having.

   Bootstrapped from the paired outlets in this dataset, smallest real
   shelf-share move detectable at 80% power, 5% two-sided:

     rotating 50   7.20pt          fixed core 50   3.56pt
     rotating 205  3.56pt          fixed core 40   3.98pt

   A fixed 50 does the work of a rotating 205. Returns diminish as
   1/sqrt(n), so 40 is the knee: past it each extra outlet buys less
   than a tenth of a point.

   CORE_PANEL is therefore 40 of a 100-outlet universe — 40% of visits
   buying trend, 60% buying breadth. It is one constant, and it is the
   number to revisit once real field data exists: everything above is
   calibrated against this generator's persistence assumptions, not
   against Erbil. Re-run scripts/size-core-panel.mjs on real paired
   visits before defending it to a client.

   Selection is STRATIFIED by district and channel, so the core mirrors
   the universe rather than over-weighting whichever doors are easiest
   to work. A core panel that is 60% hypermarket measures hypermarkets.
------------------------------------------------------------------ */
const CORE_PANEL = 40;

/* ------------------------------------------------------------------
   BRANDS — the carbonated set actually facing each other in Erbil
   general trade. `client` marks whose workspace this is; change that
   one flag to re-point the whole portal at another brand owner.
------------------------------------------------------------------ */
const BRANDS = [
  { id: "pepsi", name: "Pepsi", owner: "Baghdad Soft Drinks", client: true, strength: 0.93 },
  { id: "coca-cola", name: "Coca-Cola", owner: "Coca-Cola Iraq", client: false, strength: 0.87 },
  { id: "7up", name: "7UP", owner: "Baghdad Soft Drinks", client: false, strength: 0.79 },
  { id: "mirinda", name: "Mirinda", owner: "Baghdad Soft Drinks", client: false, strength: 0.75 },
  { id: "fanta", name: "Fanta", owner: "Coca-Cola Iraq", client: false, strength: 0.71 },
  { id: "sprite", name: "Sprite", owner: "Coca-Cola Iraq", client: false, strength: 0.63 },
  { id: "zamzam", name: "Zam Zam Cola", owner: "Zam Zam Group", client: false, strength: 0.47 },
];

/* Recommended retail price per pack, in IQD. */
const RRP = {
  "can-330": 1000,
  "pet-500": 1000,
  "pet-1000": 1500,
  "pet-2250": 2500,
  "glass-300": 750,
  "pet-1500": 2000,
};

const SKUS = [
  { id: "pepsi-can-330", brandId: "pepsi", pack: "can-330", name: "Pepsi 330ml Can" },
  { id: "pepsi-pet-500", brandId: "pepsi", pack: "pet-500", name: "Pepsi 500ml PET" },
  { id: "pepsi-pet-1000", brandId: "pepsi", pack: "pet-1000", name: "Pepsi 1L PET" },
  { id: "pepsi-pet-2250", brandId: "pepsi", pack: "pet-2250", name: "Pepsi 2.25L PET" },
  { id: "coca-cola-can-330", brandId: "coca-cola", pack: "can-330", name: "Coca-Cola 330ml Can" },
  { id: "coca-cola-pet-500", brandId: "coca-cola", pack: "pet-500", name: "Coca-Cola 500ml PET" },
  { id: "coca-cola-pet-1000", brandId: "coca-cola", pack: "pet-1000", name: "Coca-Cola 1L PET" },
  { id: "coca-cola-pet-2250", brandId: "coca-cola", pack: "pet-2250", name: "Coca-Cola 2.25L PET" },
  { id: "7up-can-330", brandId: "7up", pack: "can-330", name: "7UP 330ml Can" },
  { id: "7up-pet-1000", brandId: "7up", pack: "pet-1000", name: "7UP 1L PET" },
  { id: "7up-pet-2250", brandId: "7up", pack: "pet-2250", name: "7UP 2.25L PET" },
  { id: "mirinda-can-330", brandId: "mirinda", pack: "can-330", name: "Mirinda Orange 330ml Can" },
  { id: "mirinda-pet-1000", brandId: "mirinda", pack: "pet-1000", name: "Mirinda Orange 1L PET" },
  { id: "mirinda-pet-2250", brandId: "mirinda", pack: "pet-2250", name: "Mirinda Orange 2.25L PET" },
  { id: "fanta-can-330", brandId: "fanta", pack: "can-330", name: "Fanta Orange 330ml Can" },
  { id: "fanta-pet-1000", brandId: "fanta", pack: "pet-1000", name: "Fanta Orange 1L PET" },
  { id: "sprite-can-330", brandId: "sprite", pack: "can-330", name: "Sprite 330ml Can" },
  { id: "sprite-pet-1000", brandId: "sprite", pack: "pet-1000", name: "Sprite 1L PET" },
  { id: "zamzam-glass-300", brandId: "zamzam", pack: "glass-300", name: "Zam Zam Cola 300ml Glass" },
  { id: "zamzam-pet-1500", brandId: "zamzam", pack: "pet-1500", name: "Zam Zam Cola 1.5L PET" },
];

/* ------------------------------------------------------------------
   OUTLETS — 25 audited points of sale.

   Coded rather than named, which is how retail audit panels are
   normally reported: the outlet is identified, the business is not.
   ERB-204 keeps its fascia because we hold shelf photography for it.
------------------------------------------------------------------ */
/* Modern trade sits at or under RRP; traditional trade carries a
   convenience premium. Kept tight — a real audit finds most of the
   market compliant and a minority drifting. */
const CHANNEL_PRICE_INDEX = {
  Hypermarket: 0.97,
  Supermarket: 1.0,
  "Mini-market": 1.03,
  Grocery: 1.06,
};

/* Erbil districts the panel covers, with the outlet mix each one gets.
   Real neighbourhoods; the split follows how modern and traditional
   trade actually distribute across the city — malls and supermarkets
   in the newer western districts, groceries dense in the older core. */
const DISTRICTS = [
  { area: "Ankawa", prefix: 1, mix: ["Hypermarket", "Supermarket", "Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery"] },
  { area: "Downtown / Qaysari", prefix: 2, mix: ["Supermarket", "Supermarket", "Mini-market", "Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Iskan", prefix: 3, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery"] },
  { area: "Dream City", prefix: 4, mix: ["Hypermarket", "Supermarket", "Supermarket", "Mini-market", "Mini-market"] },
  { area: "Minara", prefix: 5, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Shorsh", prefix: 6, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Setaqan", prefix: 7, mix: ["Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Naz City", prefix: 8, mix: ["Supermarket", "Supermarket", "Mini-market", "Mini-market", "Grocery"] },
  { area: "Zanko", prefix: 9, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery"] },
  { area: "Bakhtiari", prefix: 10, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Brayati", prefix: 11, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery"] },
  { area: "Havalan", prefix: 12, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Runaki", prefix: 13, mix: ["Mini-market", "Mini-market", "Mini-market", "Grocery", "Grocery"] },
  { area: "Gulan", prefix: 14, mix: ["Hypermarket", "Supermarket", "Mini-market", "Mini-market", "Grocery"] },
  { area: "Baharka", prefix: 15, mix: ["Supermarket", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Kasnazan", prefix: 16, mix: ["Supermarket", "Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Daratu", prefix: 17, mix: ["Mini-market", "Mini-market", "Grocery", "Grocery", "Grocery"] },
  { area: "Kurdistan", prefix: 18, mix: ["Supermarket", "Supermarket", "Mini-market", "Mini-market", "Grocery"] },
];

/* Outlets that price well above the market. A real audit always turns
   some up, and they are the point of the outlier view. */
const PRICE_BIAS = {
  "ERB-105": 1.12,
  "ERB-203": 1.09,
  "ERB-403": 1.11,
  "ERB-702": 1.14,
  "ERB-1005": 1.1,
  "ERB-1203": 1.13,
  "ERB-1503": 1.09,
  "ERB-1704": 1.12,
};

/* The one outlet whose fascia we show: we hold its shelf photography. */
const NAMED = { "ERB-204": "Dur Nassrawey Center" };

const POS = DISTRICTS.flatMap((district) =>
  district.mix.map((channel, i) => {
    const code = `ERB-${district.prefix}0${i + 1}`;
    return {
      id: code.toLowerCase(),
      code,
      area: district.area,
      channel,
      ...(NAMED[code] ? { name: NAMED[code] } : {}),
      ...(PRICE_BIAS[code] ? { priceBias: PRICE_BIAS[code] } : {}),
    };
  })
);

/* Bigger formats need shelf space small outlets don't have. */
const CHANNEL_LISTING_INDEX = {
  Hypermarket: 1.08,
  Supermarket: 1.0,
  "Mini-market": 0.9,
  Grocery: 0.82,
};
const PACK_LISTING_INDEX = {
  "can-330": 1.0,
  "pet-500": 0.95,
  "pet-1000": 0.98,
  "pet-2250": 0.82,
  "glass-300": 0.8,
  "pet-1500": 0.85,
};

const brandOf = (skuId) => SKUS.find((s) => s.id === skuId).brandId;
const brandById = (id) => BRANDS.find((b) => b.id === id);

/* ------------------------------------------------------------------
   PERSISTENT OUTLET CHARACTER — drawn once per outlet, not per visit.

   Without this every visit to a store was an independent draw from the
   same distribution, which made an outlet's shelf share in one window
   uncorrelated with its share in the next (measured r = -0.175 on the
   paired outlets). Real shelves do not behave that way: a planogram, a
   store manager's preference and a distributor's service level all
   persist for months. ERB-204 gives you the same generous facing count
   visit after visit; a kiosk on the ring road does not.

   That absence was not a cosmetic flaw. It made a fixed core panel
   provably pointless in this dataset — pairing cancels the part of an
   outlet that stays the same, and nothing stayed the same. Any panel
   sizing done on the old data would have measured the generator rather
   than the market.

   Two persistent effects, both per outlet:

     brandBias   how this store treats each brand — its planogram
                 preference. Drives listing odds AND facings, because a
                 store that ranges you wider also faces you deeper.
     keepBias    how reliably this store stays in stock at all — the
                 distributor's service level to that door.

   Per-visit noise shrinks accordingly (was ±35% on facings, now ±15%),
   so the visit-to-visit variation is real sampling jitter around a
   stable shelf rather than the shelf itself being redrawn each time.
------------------------------------------------------------------ */
const brandBias = new Map(); // `${posId}|${brandId}` -> multiplier
const keepBias = new Map();  // posId -> multiplier on staying in stock

for (const pos of POS) {
  keepBias.set(pos.id, clamp(0.6, 1.4, normal(1, 0.2)));
  for (const brand of BRANDS) {
    brandBias.set(`${pos.id}|${brand.id}`, clamp(0.55, 1.5, normal(1, 0.24)));
  }
}

/* ------------------------------------------------------------------
   THE ROTATION — who gets audited, in which window, on what day.

   Each window reaches WINDOW_COVERAGE of the universe, and the outlets
   it reaches are drawn independently per window. Overlap between two
   windows is therefore incidental rather than designed, which is the
   whole point: nothing downstream may assume an outlet appears twice.

   Every audited outlet carries its own date inside the window, because
   under rolling collection "when was this seen" is a property of the
   outlet, never of the panel.
------------------------------------------------------------------ */
/* Stratified pick: walk the universe grouped by district x channel and
   take every k-th outlet, so the core's mix matches the universe's. */
function chooseCore(size) {
  const strata = new Map();
  for (const pos of POS) {
    const key = `${pos.area}|${pos.channel}`;
    strata.set(key, [...(strata.get(key) ?? []), pos.id]);
  }
  const ordered = [...strata.values()];
  const core = new Set();
  let i = 0;
  while (core.size < size && i < 40) {
    for (const group of ordered) {
      if (core.size >= size) break;
      if (group[i]) core.add(group[i]);
    }
    i += 1;
  }
  return core;
}
const CORE = chooseCore(CORE_PANEL);

const schedule = new Map(); // `${windowId}|${posId}` -> auditedAt ISO date

for (const win of WINDOWS) {
  const start = Date.parse(win.start);
  for (const pos of POS) {
    /* Core outlets are audited every window without exception — that
       is what makes them core. Everything else rotates. */
    if (!CORE.has(pos.id) && !pick(WINDOW_COVERAGE)) continue;
    const dayOffset = intBetween(0, WINDOW_DAYS - 1);
    schedule.set(
      `${win.id}|${pos.id}`,
      new Date(start + dayOffset * DAY).toISOString().slice(0, 10)
    );
  }
}

const auditedAt = (windowId, posId) => schedule.get(`${windowId}|${posId}`) ?? null;
const auditedIn = (windowId) =>
  POS.filter((pos) => schedule.has(`${windowId}|${pos.id}`));

/* ------------------------------------------------------------------
   THE MATRIX — outlet × SKU, per window, for AUDITED outlets only.

   An outlet not visited inside a window produces no cells at all. It is
   not a zero and not a gap; it is an absence of observation, and the
   difference matters more than anything else in this file.
------------------------------------------------------------------ */
const cells = [];

for (const pos of POS) {
  for (const sku of SKUS) {
    const brand = brandById(sku.brandId);
    const bias = brandBias.get(`${pos.id}|${brand.id}`);
    const listingOdds =
      brand.strength *
      CHANNEL_LISTING_INDEX[pos.channel] *
      PACK_LISTING_INDEX[sku.pack] *
      bias;

    /* RANGE IS A DECISION, NOT A COIN FLIP PER VISIT.

       Whether a store carries a SKU at all is a listing decision that
       holds for months — it is renegotiated a few times a year, not
       redrawn every time an auditor walks in. Deciding it once per
       outlet x SKU and letting it churn slightly is what makes an
       outlet's shelf share persist across windows, which is the whole
       basis on which a fixed panel beats a rotating one.

       In stock vs empty stays per-visit, because that genuinely is
       what changes between visits — and it is the thing this product
       is built to catch. */
    const baseListed = pick(Math.min(0.97, listingOdds));

    for (const snap of WINDOWS) {
      /* Not on this window's schedule — no observation exists. */
      if (!schedule.has(`${snap.id}|${pos.id}`)) continue;

      /* ~5% churn per window: real range changes, delistings, new
         listings won. Enough that R3 and R11 still have something to
         find; far short of redrawing the planogram monthly. */
      const listed = pick(0.05) ? !baseListed : baseListed;
      if (!listed) {
        cells.push({
          snapshot: snap.id,
          posId: pos.id,
          skuId: sku.id,
          listed: false,
          inStock: false,
          facings: 0,
          price: null,
        });
        continue;
      }

      /* Out-of-stock risk climbs in smaller outlets and on the
         fastest-moving packs. */
      const oosRisk =
        ((pos.channel === "Grocery" || pos.channel === "Mini-market" ? 0.13 : 0.07) *
          (sku.pack === "can-330" ? 1.25 : 1) *
          (brand.client ? 1.1 : 1)) / // the client is stocked hardest, so it empties fastest
        keepBias.get(pos.id); // ...and some doors are simply served better
      const inStock = !pick(clamp(0.01, 0.6, oosRisk));

      const baseFacings =
        brand.strength *
        bias *
        (pos.channel === "Hypermarket" ? 9 : pos.channel === "Supermarket" ? 6 : 4);
      const facings = inStock ? Math.max(1, Math.round(baseFacings * between(0.85, 1.15))) : 0;

      const rrp = RRP[sku.pack];
      const price = inStock
        ? Math.round((rrp * CHANNEL_PRICE_INDEX[pos.channel] * (pos.priceBias ?? 1) * between(0.98, 1.05)) / 50) * 50
        : null;

      cells.push({
        snapshot: snap.id,
        posId: pos.id,
        skuId: sku.id,
        listed: true,
        inStock,
        facings,
        price,
      });
    }
  }
}

const at = (windowId) => cells.filter((c) => c.snapshot === windowId);
const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

/* ------------------------------------------------------------------
   DOMAIN PAYLOADS
------------------------------------------------------------------ */
const meta = {
  city: "Erbil",
  category: "Carbonated Beverages",
  /* Windows, not visits. Each carries the outlets it actually reached,
     so the portal can always separate "we looked and it was fine" from
     "we did not look". */
  windows: WINDOWS.map((w) => ({
    ...w,
    outletsAudited: auditedIn(w.id).length,
  })),
  currentWindow: CURR,
  previousWindow: PREV,
  windowDays: WINDOW_DAYS,
  /* Outlets audited in EVERY window. Movement claims are drawn from
     these and from nothing else. */
  corePanel: [...CORE],
  corePanelSize: CORE.size,
  /* The planned gap between audits of the same outlet — the basis for
     every forward loss estimate. */
  revisitIntervalDays: WINDOW_DAYS,
  /* The universe. Distinct from how many were audited in a window,
     which is the whole point of tracking coverage. */
  posUniverse: POS.length,
  skuCount: SKUS.length,
};

/* --- the core-panel trend ---

   The ONLY place in this payload where a movement claim is computed,
   and it is computed over the core outlets alone. Everywhere else
   reports a level: what the shelf looked like across everything we
   reached. Levels want breadth; movement wants the same doors twice,
   and mixing the two is how panel rotation gets read as market change.

   Both sides of every subtraction below are the same 40 stores. */
function coreTrend() {
  const inCore = (c) => CORE.has(c.posId);
  const shareIn = (windowId, brandId) => {
    const rows = at(windowId).filter((c) => c.inStock && inCore(c));
    const total = rows.reduce((s, c) => s + c.facings, 0);
    const mine = rows
      .filter((c) => brandOf(c.skuId) === brandId)
      .reduce((s, c) => s + c.facings, 0);
    return total ? Math.round((mine / total) * 1000) / 10 : 0;
  };
  const availIn = (windowId, brandId) => {
    const rows = at(windowId).filter(
      (c) => inCore(c) && c.listed && brandOf(c.skuId) === brandId
    );
    if (!rows.length) return 0;
    return Math.round((rows.filter((c) => c.inStock).length / rows.length) * 1000) / 10;
  };
  const round1 = (n) => Math.round(n * 10) / 10;

  /* THE DETECTION FLOOR.

     A panel this size cannot resolve arbitrarily small moves, and a
     number reported without that floor invites the reader to act on
     noise. Bootstrapped rather than assumed: resample the core outlets
     with replacement, recompute the delta each time, and take the
     spread of those deltas as the standard error of the measurement.
     MDE = 2.8 x SE — the smallest real move a 5% two-sided test would
     catch 80% of the time.

     Reported alongside every movement claim so "-1.9pt" can be shown
     for what it is when the floor is 4pt: a reading, not a finding. */
  const CLIENT_ID = BRANDS.find((b) => b.client).id;
  const bootstrapFloor = (metric) => {
    const core = [...CORE];
    const deltas = [];
    for (let r = 0; r < 3000; r++) {
      const sample = [];
      for (let i = 0; i < core.length; i++) {
        sample.push(core[Math.floor(rand() * core.length)]);
      }
      const at2 = (windowId) => {
        const set = new Set(sample);
        const rows = at(windowId).filter((c) => set.has(c.posId));
        if (metric === "share") {
          const stocked = rows.filter((c) => c.inStock);
          const total = stocked.reduce((s, c) => s + c.facings, 0);
          const mine = stocked
            .filter((c) => brandOf(c.skuId) === CLIENT_ID)
            .reduce((s, c) => s + c.facings, 0);
          return total ? (mine / total) * 100 : 0;
        }
        const listed = rows.filter(
          (c) => c.listed && brandOf(c.skuId) === CLIENT_ID
        );
        return listed.length
          ? (listed.filter((c) => c.inStock).length / listed.length) * 100
          : 0;
      };
      deltas.push(at2(CURR) - at2(PREV));
    }
    const mean = deltas.reduce((s, x) => s + x, 0) / deltas.length;
    const sd = Math.sqrt(
      deltas.reduce((s, x) => s + (x - mean) ** 2, 0) / (deltas.length - 1)
    );
    return Math.round(2.8 * sd * 10) / 10;
  };

  const shareFloor = bootstrapFloor("share");
  const availFloor = bootstrapFloor("availability");

  return {
    outlets: CORE.size,
    windowDays: WINDOW_DAYS,
    /* Smallest move this panel can tell from noise, per metric. */
    shareFloorPt: shareFloor,
    availabilityFloorPt: availFloor,
    brands: BRANDS.map((b) => {
      const now = shareIn(CURR, b.id);
      const before = shareIn(PREV, b.id);
      const availNow = availIn(CURR, b.id);
      const availBefore = availIn(PREV, b.id);
      return {
        brandId: b.id,
        share: now,
        previousShare: before,
        shareDelta: round1(now - before),
        availability: availNow,
        previousAvailability: availBefore,
        availabilityDelta: round1(availNow - availBefore),
        /* Does the move clear the floor? Computed once here so no
           surface has to re-derive it and get it different. */
        shareSignificant: Math.abs(now - before) >= shareFloor,
        availabilitySignificant: Math.abs(availNow - availBefore) >= availFloor,
      };
    }),
  };
}

/* --- master --- */
const master = {
  meta,
  brands: BRANDS,
  skus: SKUS.map((s) => ({ ...s, rrp: RRP[s.pack] })),
  pos: POS.map((p) => (CORE.has(p.id) ? { ...p, core: true } : p)),
  coreTrend: coreTrend(),
};

/* --- availability: per SKU, per outlet, per snapshot --- */
function availabilityFor(windowId) {
  const rows = at(windowId);
  /* The denominator is outlets AUDITED IN THIS WINDOW, never the
     universe. Dividing by the universe would report an outlet nobody
     visited as one that does not stock you — turning missing
     observation into a distribution problem, which is the exact
     failure mode a rotating panel introduces. */
  const audited = auditedIn(windowId);
  return {
    bySku: SKUS.map((sku) => {
      const forSku = rows.filter((c) => c.skuId === sku.id);
      const listed = forSku.filter((c) => c.listed).length;
      const inStock = forSku.filter((c) => c.inStock).length;
      return {
        skuId: sku.id,
        brandId: sku.brandId,
        distribution: pct(listed, audited.length),
        availability: pct(inStock, audited.length),
        onShelfAvailability: pct(inStock, listed),
      };
    }),
    byPos: audited.map((pos) => {
      const forPos = rows.filter((c) => c.posId === pos.id);
      const listed = forPos.filter((c) => c.listed).length;
      const inStock = forPos.filter((c) => c.inStock).length;
      const clientRows = forPos.filter((c) => brandById(brandOf(c.skuId)).client);
      return {
        posId: pos.id,
        auditedAt: auditedAt(windowId, pos.id),
        skusListed: listed,
        skusInStock: inStock,
        availability: pct(inStock, listed),
        clientAvailability: pct(
          clientRows.filter((c) => c.inStock).length,
          clientRows.filter((c) => c.listed).length
        ),
      };
    }),
    byBrand: BRANDS.map((brand) => {
      const forBrand = rows.filter((c) => brandOf(c.skuId) === brand.id);
      return {
        brandId: brand.id,
        availability: pct(
          forBrand.filter((c) => c.inStock).length,
          forBrand.filter((c) => c.listed).length
        ),
      };
    }),
  };
}

/* The cell grid is 2,000 rows per visit, and the outlet and SKU ids
   repeat in every one of them. Stored as objects that is ~285KB a
   visit; stored as index tuples against the master lists it is a
   fraction of that, and the client rehydrates it in one pass.
     [posIndex, skuIndex, state, facings]   state: 0 not-listed
                                                   1 in-stock
                                                   2 out-of-stock */
const posIndexOf = new Map(POS.map((p, i) => [p.id, i]));
const skuIndexOf = new Map(SKUS.map((s, i) => [s.id, i]));

const matrixFor = (windowId) =>
  at(windowId).map((c) => [
    posIndexOf.get(c.posId),
    skuIndexOf.get(c.skuId),
    !c.listed ? 0 : c.inStock ? 1 : 2,
    c.facings,
  ]);

const availability = {
  meta,
  current: availabilityFor(CURR),
  previous: availabilityFor(PREV),
};

/* --- shelf share: facings-based, split by fixture --- */
function shareFor(windowId) {
  const rows = at(windowId).filter((c) => c.inStock);
  const total = rows.reduce((s, c) => s + c.facings, 0);
  return BRANDS.map((brand) => {
    const forBrand = rows.filter((c) => brandOf(c.skuId) === brand.id);
    const facings = forBrand.reduce((s, c) => s + c.facings, 0);
    /* Chilled coolers favour single-serve; ambient shelf favours
       take-home packs. Split each brand's facings on pack type. */
    const cooler = forBrand
      .filter((c) => ["can-330", "pet-500", "glass-300"].includes(SKUS.find((s) => s.id === c.skuId).pack))
      .reduce((s, c) => s + c.facings, 0);
    return {
      brandId: brand.id,
      facings,
      share: pct(facings, total),
      coolerFacings: cooler,
      ambientFacings: facings - cooler,
    };
  });
}

const shelfShare = {
  meta,
  current: shareFor(CURR),
  previous: shareFor(PREV),
};

/* --- out of stock: listed but empty, with the context needed to act ---

   What a single visit can observe: this SKU has a slot at this outlet
   and the slot is empty today. What it CANNOT observe, and what this
   file no longer pretends to know:

     daysOut      how long it has been empty. Requires a previous
                  observation of this outlet, which a rotating panel
                  does not provide.
     persistent   whether it was also empty last time. Same problem.

   Both were previously invented here — `persistent` from a lookup
   against the prior snapshot, `daysOut` from a random range keyed off
   it. Under a rotating schedule that lookup finds nothing for most
   outlets, so the fields were not merely unavailable but fictional.

   What replaces them is a FORWARD estimate. A gap found today keeps
   costing until someone is next in that store, so the loss is the
   shelf space multiplied by the planned revisit interval. That is an
   assumption, but it is a stated one about the future rather than a
   fabricated measurement of the past — and it is the same direction
   the deficit rules already project in, so the whole product finally
   runs on one time basis instead of two.

   "Normally holds" is the facings that outlet gives that SKU when it
   is in stock — a property of the shelf, observable on the visit that
   found the gap. */
const packOf = (skuId) => SKUS.find((s) => s.id === skuId).pack;

const normalFacings = new Map();
for (const cell of cells) {
  if (!cell.inStock) continue;
  const key = `${cell.posId}|${cell.skuId}`;
  normalFacings.set(key, Math.max(normalFacings.get(key) ?? 0, cell.facings));
}
/* Fallback for a SKU never seen in stock at that outlet: what it
   typically holds elsewhere. */
const medianFacings = new Map();
for (const sku of SKUS) {
  const seen = cells
    .filter((c) => c.skuId === sku.id && c.inStock)
    .map((c) => c.facings)
    .sort((a, b) => a - b);
  medianFacings.set(sku.id, seen.length ? seen[Math.floor(seen.length / 2)] : 2);
}

function oosFor(windowId) {
  return at(windowId)
    .filter((c) => c.listed && !c.inStock)
    .map((c) => {
      const holds =
        normalFacings.get(`${c.posId}|${c.skuId}`) ??
        medianFacings.get(c.skuId) ??
        2;

      const rivals = at(windowId)
        .filter(
          (r) =>
            r.posId === c.posId &&
            r.inStock &&
            packOf(r.skuId) === packOf(c.skuId) &&
            brandOf(r.skuId) !== brandOf(c.skuId)
        )
        .sort((a, b) => b.facings - a.facings)
        .slice(0, 3)
        .map((r) => ({ brandId: brandOf(r.skuId), skuId: r.skuId, facings: r.facings }));

      /* [posIndex, skuIndex, normalFacings, [[rivalSkuIndex, facings], ...]]
         Four fields, not six. Lost facing-days is derived on the client
         from normalFacings x the revisit interval. */
      return [
        posIndexOf.get(c.posId),
        skuIndexOf.get(c.skuId),
        holds,
        rivals.map((r) => [skuIndexOf.get(r.skuId), r.facings]),
      ];
    })
    .sort((a, b) => b[2] - a[2]);
}

const oosByWindow = Object.fromEntries(
  WINDOWS.map((w) => [w.id, oosFor(w.id)])
);
const oosRows = oosByWindow[CURR];
const oosSkuIndex = (row) => row[1];

/* [posIndex, skuIndex, price]. RRP, variance and the outlier flag all
   fall out of the price and the SKU, so shipping them would be sending
   the same fact three times. */
const observationsFor = (windowId) =>
  at(windowId)
    .filter((c) => c.price !== null)
    .map((c) => [posIndexOf.get(c.posId), skuIndexOf.get(c.skuId), c.price]);

/* --- pricing: observed shelf prices against RRP --- */
const pricing = {
  meta,
  bySku: SKUS.map((sku) => {
    const observed = at(CURR)
      .filter((c) => c.skuId === sku.id && c.price !== null)
      .map((c) => c.price);
    const rrp = RRP[sku.pack];
    const compliant = observed.filter((p) => Math.abs(p - rrp) / rrp <= 0.05).length;
    return {
      skuId: sku.id,
      brandId: sku.brandId,
      rrp,
      min: observed.length ? Math.min(...observed) : null,
      max: observed.length ? Math.max(...observed) : null,
      avg: observed.length
        ? Math.round(observed.reduce((s, p) => s + p, 0) / observed.length)
        : null,
      observations: observed.length,
      compliance: pct(compliant, observed.length),
    };
  }),

};

/* --- competitors: client against the rest, side by side --- */
const client = BRANDS.find((b) => b.client);
const currShare = shareFor(CURR);
const prevShare = shareFor(PREV);
const currAvail = availabilityFor(CURR).byBrand;
const prevAvail = availabilityFor(PREV).byBrand;

const competitors = {
  meta,
  clientBrandId: client.id,
  rows: BRANDS.map((brand) => {
    const share = currShare.find((s) => s.brandId === brand.id);
    const shareBefore = prevShare.find((s) => s.brandId === brand.id);
    const avail = currAvail.find((a) => a.brandId === brand.id);
    const availBefore = prevAvail.find((a) => a.brandId === brand.id);
    const oosCount = oosRows.filter(
      (r) => brandOf(SKUS[oosSkuIndex(r)].id) === brand.id
    ).length;
    return {
      brandId: brand.id,
      isClient: brand.client,
      share: share.share,
      shareDelta: Math.round((share.share - shareBefore.share) * 10) / 10,
      availability: avail.availability,
      availabilityDelta:
        Math.round((avail.availability - availBefore.availability) * 10) / 10,
      activeOos: oosCount,
      skuCount: SKUS.filter((s) => s.brandId === brand.id).length,
    };
  }).sort((a, b) => b.share - a.share),
};

/* --- shelf photography, geo-stamped in the field --- */
const photos = {
  meta,
  rows: [
    "a_22137918_prg_1725137_q_2556239_i_21.jpg",
    "a_22137918_prg_1725137_q_2556239_i_22.jpg",
    "a_22137918_prg_1725137_q_2556239_i_23.jpg",
    "a_22137918_prg_1725137_q_2556239_i_24.jpg",
    "a_22137918_prg_1725137_q_2556239_i_25.jpg",
    "a_22137918_prg_1725137_q_2556239_i_26.jpg",
    "a_22137918_prg_1725137_q_2556239_i_27.jpg",
  ].map((file, i) => ({
    id: `erb-204-${i + 1}`,
    file: `/audit/${file}`,
    posId: "erb-204",
    capturedAt: "2026-08-12T15:10:22+03:00",
    auditRef: "22137918",
  })),
};

/* ------------------------------------------------------------------ */
mkdirSync(OUT, { recursive: true });
/* One bundle per collection window: which outlets were reached and
   when, plus the cells, gaps and shelf prices recorded across it. The
   latest is also written as visit-current so the client can import it
   statically; earlier windows are fetched on demand.

   `audited` is new and load-bearing: [posIndex, auditedAt]. Without it
   an outlet missing from the matrix is indistinguishable from an outlet
   with nothing on its shelf. */
const visitFiles = {};
for (const win of WINDOWS) {
  const payload = {
    visit: win.id,
    audited: auditedIn(win.id).map((pos) => [
      posIndexOf.get(pos.id),
      auditedAt(win.id, pos.id),
    ]),
    matrix: matrixFor(win.id),
    oos: oosByWindow[win.id],
    observations: observationsFor(win.id),
  };
  visitFiles[`visit-${win.id}.json`] = payload;
  if (win.id === CURR) visitFiles["visit-current.json"] = payload;
}

const files = {
  "master.json": master,
  "availability.json": availability,
  "shelf-share.json": shelfShare,
  "pricing.json": pricing,
  "competitors.json": competitors,
  "photos.json": photos,
  ...visitFiles,
};

for (const [name, payload] of Object.entries(files)) {
  /* Visit bundles are machine-read and shipped to the browser, so they
     go out minified; everything else stays readable for inspection. */
  const json = name.startsWith("visit-")
    ? JSON.stringify(payload)
    : JSON.stringify(payload, null, 2) + "\n";
  writeFileSync(join(OUT, name), json);
}

/* Console summary so the numbers can be sanity-checked at a glance. */
const clientShare = currShare.find((s) => s.brandId === client.id);
console.log(`Wrote ${Object.keys(files).length} payloads to lib/data/`);
console.log(`  universe ${POS.length} outlets · SKUs ${SKUS.length} · cells ${cells.length}`);
console.log(`  ${client.name} share ${clientShare.share}% · availability ${currAvail.find((a) => a.brandId === client.id).availability}%`);
console.log(`  active out-of-stocks ${oosRows.length}`);
console.log(
  `  coverage:`,
  WINDOWS.map((w) => `${w.shortLabel} ${auditedIn(w.id).length}/${POS.length}`).join(" · ")
);
console.log(
  `  core panel ${CORE.size} outlets, in every window · ${POS.length - CORE.size} rotating`
);
console.log(
  `  brand share:`,
  currShare.map((s) => `${brandById(s.brandId).name} ${s.share}%`).join(", ")
);
