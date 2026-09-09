/* ============================================================
   VEMI MARKET DATA — Pepsi Iraq, 1,000 POS, six cities, six months.

   Replaces the Erbil-only builder. The geography here is GENERIC:
   nothing knows the name of a city, every rule reads city → district →
   outlet, and Erbil is just the row that happens to keep its real
   district names. The old builder hard-coded Erbil into the rules
   themselves — district adjacency, a Citadel centroid — which is what
   made a second city impossible to add.

   Everything is deterministic: same seed, same market, every run.

   Run: node scripts/build-market-data.mjs
   ============================================================ */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "data", "market");

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260909);
const pick = (p) => rand() < p;
const between = (lo, hi) => lo + rand() * (hi - lo);
const intBetween = (lo, hi) => Math.round(between(lo, hi));
const choice = (xs) => xs[Math.floor(rand() * xs.length)];
const clamp = (lo, hi, x) => Math.min(hi, Math.max(lo, x));
function normal(mean = 0, sd = 1) {
  const u = Math.max(rand(), 1e-9);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/* ---------------- the contract ---------------- */

const CONTRACT = {
  client: "Baghdad Soft Drinks Company",
  clientShort: "Baghdad Soft Drinks",
  brand: "Pepsi",
  country: "Iraq",
  category: "Soft Drinks",
  currency: "IQD",
  contractedPos: 1000,
  /* September is in flight — the demo opens mid-cycle, which is what
     makes the coverage ring worth looking at. */
  visitedThisMonth: 742,
  daysRemaining: 9,
  daysElapsed: 21,
};

/* Six months, April → September 2026. Only the last is partial. */
const MONTHS = [
  { id: "2026-04", label: "April 2026", short: "Apr", days: 30 },
  { id: "2026-05", label: "May 2026", short: "May", days: 31 },
  { id: "2026-06", label: "June 2026", short: "Jun", days: 30 },
  { id: "2026-07", label: "July 2026", short: "Jul", days: 31 },
  { id: "2026-08", label: "August 2026", short: "Aug", days: 31 },
  { id: "2026-09", label: "September 2026", short: "Sep", days: 30, current: true },
  /* Two cycles past the current one, so a follow-up audit requested
     today has somewhere to land. October is fully audited — a request
     raised now can be seen through to a finished result — and November
     is in flight, which is what makes the progressive states ("18 of
     54 revisited") demonstrable rather than described. */
  { id: "2026-10", label: "October 2026", short: "Oct", days: 31, planned: true },
  { id: "2026-11", label: "November 2026", short: "Nov", days: 30, planned: true },
];
const CURRENT = "2026-09";
/* Cycles after the current one. The portal shows them as planned
   rather than historical: they exist so a follow-up has a destination,
   not because the future is known. */
const FUTURE = ["2026-10", "2026-11"];
const IN_FLIGHT = "2026-11";

/* ---------------- geography ----------------

   GOVERNORATES, not cities. Iraq's first-level administrative unit is
   the governorate, it is the unit a commercial team plans routes and
   accounts around, and it is what the follow-up hierarchy groups by.

   Five of the six share a name with their capital. The sixth does not:
   the audit works Mosul, and Mosul is the capital of NINEVEH. Labelling
   that row "Mosul" while calling the column "Governorate" is the kind
   of error an Iraqi reader spots immediately, so the governorate
   carries its own name and the city it is audited in stays alongside.

   Coordinates are the capital's, projected the way the marketing map
   projects them:
     x = 9.591 * lon - 368.85
     y = 432.83 - 11.497 * lat                                        */
const GOVERNORATES = [
  { id: "baghdad", name: "Baghdad", capital: "Baghdad", lat: 33.31, lng: 44.36, pos: 380, tier: "capital" },
  { id: "basra", name: "Basra", capital: "Basra", lat: 30.51, lng: 47.78, pos: 160, tier: "major" },
  { id: "erbil", name: "Erbil", capital: "Erbil", lat: 36.19, lng: 44.01, pos: 150, tier: "major" },
  { id: "nineveh", name: "Nineveh", capital: "Mosul", lat: 36.34, lng: 43.13, pos: 140, tier: "major" },
  { id: "najaf", name: "Najaf", capital: "Najaf", lat: 32.03, lng: 44.34, pos: 95, tier: "mid" },
  { id: "karbala", name: "Karbala", capital: "Karbala", lat: 32.61, lng: 44.02, pos: 75, tier: "mid" },
];
for (const c of GOVERNORATES) {
  c.x = Math.round((9.591 * c.lng - 368.85) * 100) / 100;
  c.y = Math.round((432.83 - 11.497 * c.lat) * 100) / 100;
}

/* Real district names per city. Erbil keeps the set the old build
   used, so anything ported across still recognises them. */
const DISTRICTS = {
  baghdad: ["Karrada", "Mansour", "Zayouna", "Adhamiyah", "Kadhimiya", "Dora",
            "Yarmouk", "Ghazaliya", "Jadriya", "Harthiya", "Palestine Street", "Sadr City"],
  basra: ["Ashar", "Jubaila", "Tuwaisa", "Qibla", "Hayaniyah", "Zubair", "Maqal", "Junaina"],
  erbil: ["Ankawa", "Bakhtiari", "Downtown", "Dream City", "Gulan", "Havalan",
          "Iskan", "Kurdistan", "Minara", "Setaqan"],
  nineveh: ["Al-Zuhour", "Al-Muthanna", "Al-Noor", "Bab al-Tob", "Al-Sukkar",
          "Al-Rashidiya", "Hay al-Arabi", "Al-Islah"],
  najaf: ["Al-Ansar", "Al-Adala", "Al-Milad", "Al-Askari", "Al-Ghadeer", "Hay al-Nasr",
          "Al-Furat", "Al-Jamea"],
  karbala: ["Al-Hurr", "Al-Abbasiya", "Bab Baghdad", "Al-Eskan", "Al-Ghadeer",
            "Hay al-Muallimeen", "Al-Wafaa", "Al-Naqib"],
};

/* ------------------------------------------------------------------
   PUTTING OUTLETS ON THE MAP.

   The audit records a district name, not a coordinate. The map needs
   coordinates, so each district is given a deterministic centroid on a
   ring around its city centre and each outlet a small jitter inside
   its district.

   This is SYNTHETIC PLACEMENT and the portal says so wherever the map
   is drawn: the city is real, the district is real, the point within
   the district is a plausible position, not a surveyed address. Ring
   radius scales with how many outlets a city carries, so Baghdad
   spreads wider than Karbala rather than every city occupying the same
   disc.
------------------------------------------------------------------ */
/* Its own random stream. Coordinates were added after the rest of the
   dataset was calibrated, and drawing them from the shared generator
   would have shifted every subsequent draw — changing shelf shares,
   stockouts and prices that the checks had already been tuned
   against. Placement is cosmetic; it must not move the market. */
const place = mulberry32(415926);

const DISTRICT_POINT = new Map();
for (const gov of GOVERNORATES) {
  const names = DISTRICTS[gov.id];
  /* Degrees. 0.01° ≈ 1.1km, so a 380-outlet city spreads over roughly
     14km and a 75-outlet one over roughly 6km. */
  const radius = 0.02 + 0.00025 * gov.pos;
  names.forEach((name, i) => {
    /* Golden-angle spacing, so districts don't line up in spokes. */
    const angle = i * 2.39996;
    const r = radius * Math.sqrt((i + 0.6) / names.length);
    DISTRICT_POINT.set(`${gov.id}|${name}`, {
      lat: gov.lat + r * Math.cos(angle),
      /* Longitude degrees shrink with latitude; at 33°N a degree of
         longitude is about 0.84 of a degree of latitude. */
      lng: gov.lng + (r * Math.sin(angle)) / Math.cos((gov.lat * Math.PI) / 180),
    });
  });
}

function placeInDistrict(gov, district) {
  const centre = DISTRICT_POINT.get(`${gov.id}|${district}`);
  const spread = 0.006;
  return {
    lat: Math.round((centre.lat + (place() - 0.5) * spread) * 100000) / 100000,
    lng: Math.round((centre.lng + (place() - 0.5) * spread * 1.2) * 100000) / 100000,
  };
}

/* ------------------------------------------------------------------
   THE FIELD TEAM.

   Every visit is run by somebody, and the brief's POS detail panel
   asks who. Auditors are assigned to city routes rather than scattered
   at random, because that is how field work is actually organised —
   and because it makes a revisit routable: the person who covered a
   door last month is the one who can go back.

   Names are Iraqi and fictional. The assignment is deterministic, so
   an outlet keeps the same auditor across months unless the route
   changes.
------------------------------------------------------------------ */
const AUDITORS = [
  { id: "aud-1", name: "Rawa Kareem", governorates: ["erbil", "nineveh"] },
  { id: "aud-2", name: "Zaid Al-Obaidi", governorates: ["baghdad"] },
  { id: "aud-3", name: "Noor Hadi", governorates: ["baghdad"] },
  { id: "aud-4", name: "Mustafa Jabbar", governorates: ["basra"] },
  { id: "aud-5", name: "Hiba Salman", governorates: ["najaf", "karbala"] },
  { id: "aud-6", name: "Dilan Ahmed", governorates: ["erbil", "nineveh"] },
];

/* Which auditor covers a given outlet: the ones on that city's route,
   split evenly and stably by the outlet's own sequence number. */
const auditorsFor = (govId) => AUDITORS.filter((a) => a.governorates.includes(govId));

function auditorFor(pos) {
  const team = auditorsFor(pos.governorateId);
  if (!team.length) return AUDITORS[0];
  const n = Number(pos.id.replace(/\D/g, "")) || 0;
  return team[n % team.length];
}

const CHANNELS = [
  { id: "hypermarket", name: "Hypermarket", share: 0.05, size: 9 },
  { id: "supermarket", name: "Supermarket", share: 0.22, size: 6 },
  { id: "mini-market", name: "Mini-market", share: 0.34, size: 4 },
  { id: "grocery", name: "Grocery", share: 0.31, size: 3 },
  { id: "convenience", name: "Convenience", share: 0.08, size: 2 },
];

/* Named chains give the retailer filter something real to group by;
   the rest are independents, which is how this trade actually looks. */
const RETAILERS = ["Miral", "Family Mall", "Carrefour", "Al Rasheed", "City Center", "Independent"];

/* ---------------- brands and range ---------------- */

const BRANDS = [
  { id: "pepsi", name: "Pepsi", owner: "Baghdad Soft Drinks", client: true, strength: 0.94 },
  { id: "coca-cola", name: "Coca-Cola", owner: "Coca-Cola Iraq", client: false, strength: 0.95 },
  { id: "7up", name: "7UP", owner: "Baghdad Soft Drinks", client: false, strength: 0.80 },
  { id: "mirinda", name: "Mirinda", owner: "Baghdad Soft Drinks", client: false, strength: 0.76 },
  { id: "mountain-dew", name: "Mountain Dew", owner: "Baghdad Soft Drinks", client: false, strength: 0.62 },
  { id: "rc-cola", name: "RC Cola", owner: "RC Bottling Iraq", client: false, strength: 0.55 },
];

const PACKS = {
  "can-250": { label: "250ml Can", rrp: 500, cooler: true },
  "can-330": { label: "330ml Can", rrp: 750, cooler: true },
  "pet-500": { label: "500ml PET", rrp: 750, cooler: true },
  "pet-1000": { label: "1L PET", rrp: 1250, cooler: false },
  "pet-2250": { label: "2.25L PET", rrp: 2000, cooler: false },
};

/* Pepsi's six, per the brief. Rivals carry a comparable range so shelf
   share is a fair contest rather than an artefact of listing counts. */
const CLIENT_PACKS = ["can-250", "can-330", "pet-500", "pet-1000", "pet-2250"];
const SKUS = [];
for (const brand of BRANDS) {
  const packs = brand.id === "pepsi" ? CLIENT_PACKS : CLIENT_PACKS.slice(0, 4);
  for (const pack of packs) {
    SKUS.push({
      id: `${brand.id}-${pack}`,
      brandId: brand.id,
      pack,
      name: `${brand.name} ${PACKS[pack].label}`,
      rrp: PACKS[pack].rrp,
    });
  }
}
/* Pepsi Zero — a sixth Pepsi SKU with its own listing story, which is
   what makes the assortment matrix worth looking at. */
SKUS.push({
  id: "pepsi-zero-330",
  brandId: "pepsi",
  pack: "can-330",
  name: "Pepsi Zero 330ml",
  rrp: 750,
});

const CLIENT = BRANDS.find((b) => b.client);
const CLIENT_SKUS = SKUS.filter((s) => s.brandId === CLIENT.id);

/* ---------------- POSM ---------------- */

const POSM_TYPES = [
  { id: "cooler", name: "Branded refrigerator", weight: 3, channels: ["hypermarket", "supermarket", "mini-market"] },
  { id: "shelf-strip", name: "Shelf strips", weight: 2, channels: null },
  { id: "poster", name: "Posters", weight: 1, channels: null },
  { id: "stand", name: "Floor stand", weight: 2, channels: ["hypermarket", "supermarket"] },
  { id: "display", name: "Promotional display", weight: 2, channels: ["hypermarket", "supermarket", "mini-market"] },
];

const OOS_REASONS = [
  { id: "not-delivered", name: "Delivery not made", weight: 0.34 },
  { id: "sold-out", name: "Sold out before revisit", weight: 0.27 },
  { id: "not-ordered", name: "Retailer did not order", weight: 0.18 },
  { id: "space-taken", name: "Space given to another brand", weight: 0.13 },
  { id: "delisted", name: "Delisted at store level", weight: 0.08 },
];

const SHELF_POSITIONS = ["eye", "upper", "lower"];

console.log("constants loaded:",
  GOVERNORATES.length, "cities ·",
  Object.values(DISTRICTS).flat().length, "districts ·",
  BRANDS.length, "brands ·",
  SKUS.length, "SKUs ·",
  CLIENT_SKUS.length, "Pepsi SKUs");

/* ------------------------------------------------------------------
   THE UNIVERSE — 1,000 outlets, distributed by city and channel.
------------------------------------------------------------------ */
const CHANNEL_WORD = {
  hypermarket: "Hypermarket",
  supermarket: "Supermarket",
  "mini-market": "Market",
  grocery: "Grocery",
  convenience: "Store",
};

const POS = [];
let seq = 0;
for (const gov of GOVERNORATES) {
  const districts = DISTRICTS[gov.id];
  for (let i = 0; i < gov.pos; i += 1) {
    /* Channel mix by weight, so a city's shape is realistic rather
       than uniform. */
    let roll = rand();
    let channel = CHANNELS[CHANNELS.length - 1];
    for (const c of CHANNELS) {
      if (roll < c.share) { channel = c; break; }
      roll -= c.share;
    }
    const district = districts[i % districts.length];
    seq += 1;
    const n = String((i % 99) + 1).padStart(3, "0");
    POS.push({
      id: `pos-${seq}`,
      code: `${gov.capital.slice(0, 3).toUpperCase()}-${String(seq).padStart(4, "0")}`,
      name: `${district} ${CHANNEL_WORD[channel.id]} ${n}`,
      governorateId: gov.id,
      district,
      channel: channel.id,
      retailer:
        channel.id === "hypermarket" || channel.id === "supermarket"
          ? choice(RETAILERS)
          : "Independent",
      /* Rough footfall weight — drives how much the outlet matters and
         how many facings it has to give. */
      volume: Math.round(clamp(0.4, 2.2, normal(channel.size / 4, 0.35)) * 100) / 100,
      ...placeInDistrict(gov, district),
    });
  }
}

/* ------------------------------------------------------------------
   THE CORE PANEL — 400 outlets audited EVERY month.

   Stratified by city and channel so the core mirrors the universe. A
   core that over-weights hypermarkets measures hypermarkets, and every
   trend drawn from it would describe a market nobody sells into.
------------------------------------------------------------------ */
const CORE_SIZE = 400;
const strata = new Map();
for (const p of POS) {
  const key = `${p.governorateId}|${p.channel}`;
  strata.set(key, [...(strata.get(key) ?? []), p.id]);
}
const CORE = new Set();
{
  const groups = [...strata.values()];
  let i = 0;
  while (CORE.size < CORE_SIZE && i < 400) {
    for (const g of groups) {
      if (CORE.size >= CORE_SIZE) break;
      if (g[i]) CORE.add(g[i]);
    }
    i += 1;
  }
}
for (const p of POS) p.core = CORE.has(p.id);

/* ------------------------------------------------------------------
   THE SCHEDULE — who is audited in which month, and on which day.

   Core outlets every month. The remaining 600 rotate: each month draws
   a fresh slice, so month-over-month overlap runs through the core.
   That is the panel design the brief asks for on page 9 — trends at
   market level, plus a Repeated POS section that can only ever mean
   the core.

   September is deliberately incomplete: 742 of 1,000, because the
   month is 21 days in with 9 to go, and the coverage ring is the first
   thing the dashboard has to make honest.
------------------------------------------------------------------ */
const ROTATING = POS.filter((p) => !p.core).map((p) => p.id);
const MONTHLY_TARGET = 880;

/* How far each cycle got. A completed month reaches the monthly
   target; the current one is 21 days in; November is deliberately part
   way through, because a follow-up audit that is half done is the
   state the Action Center has to be able to report honestly. */
const MONTH_TARGET = (id) => {
  if (id === CURRENT) return CONTRACT.visitedThisMonth;
  if (id === IN_FLIGHT) return 430;
  return MONTHLY_TARGET;
};

/* The future cycles draw their schedule from their OWN stream.

   The schedule for every month is built up front, in one loop, so
   adding October and November to it consumed main-stream randomness
   that the six original months used to get — and the audited set for
   September changed, taking the brief's calibrated figures with it.
   An isolated stream means the historical months schedule exactly as
   they did before these two cycles existed. */
const futureRand = mulberry32(20261001);

const schedule = new Map();
for (const month of MONTHS) {
  const planned = FUTURE.includes(month.id);
  const rng = planned ? futureRand : rand;
  const target = MONTH_TARGET(month.id);
  const pool = [...ROTATING]
    .sort(() => rng() - 0.5)
    .slice(0, target - CORE.size);
  const window =
    month.id === CURRENT ? CONTRACT.daysElapsed : month.id === IN_FLIGHT ? 12 : month.days;
  for (const posId of [...CORE, ...pool]) {
    schedule.set(`${month.id}|${posId}`, Math.round(1 + rng() * (window - 1)));
  }
}

const auditedIn = (monthId) => POS.filter((p) => schedule.has(`${monthId}|${p.id}`));
const auditDate = (monthId, posId) => {
  const d = schedule.get(`${monthId}|${posId}`);
  return d === undefined ? null : `${monthId}-${String(d).padStart(2, "0")}`;
};

console.log(`universe ${POS.length} POS · core ${CORE.size} · rotating ${ROTATING.length}`);
for (const m of MONTHS) {
  const n = auditedIn(m.id).length;
  console.log(`  ${m.short} ${String(n).padStart(4)} audited (${((n / POS.length) * 100).toFixed(1)}%)`);
}

/* ------------------------------------------------------------------
   PERSISTENT OUTLET CHARACTER.

   Drawn once per outlet, not per visit. A planogram, a store manager's
   preference and a distributor's service level all persist for months;
   without this an outlet's shelf share in April would be uncorrelated
   with its share in May, and the Repeated POS section would be
   measuring the random number generator.
------------------------------------------------------------------ */
const brandBias = new Map();
const keepBias = new Map();
const posmBias = new Map();
for (const p of POS) {
  keepBias.set(p.id, clamp(0.6, 1.45, normal(1, 0.2)));
  posmBias.set(p.id, clamp(0.3, 1.7, normal(1, 0.35)));
  for (const b of BRANDS) {
    brandBias.set(`${p.id}|${b.id}`, clamp(0.55, 1.5, normal(1, 0.22)));
  }
}

/* Range is a decision, not a per-visit coin flip: listed once, with a
   little churn each month for real delistings and listings won. */
const baseListed = new Map();
for (const p of POS) {
  const channel = CHANNELS.find((c) => c.id === p.channel);
  for (const sku of SKUS) {
    const brand = BRANDS.find((b) => b.id === sku.brandId);
    const odds =
      brand.strength *
      (0.417 + channel.share * 0.4 + channel.size * 0.055) *
      (sku.id === "pepsi-zero-330" ? 0.55 : 1) * // the newest line, thinnest range
      (sku.pack === "pet-2250" ? 0.84 : 1) *
      brandBias.get(`${p.id}|${brand.id}`);
    baseListed.set(`${p.id}|${sku.id}`, pick(clamp(0.05, 0.97, odds)));
  }
}

/* Shelf weight per brand — calibrated to the market the brief
   describes: Pepsi 34% of shelf against Coca-Cola at 39%. */
const SHELF_WEIGHT = {
  pepsi: 0.265, "coca-cola": 0.372, "7up": 0.125,
  mirinda: 0.102, "mountain-dew": 0.060, "rc-cola": 0.054,
};

/* Required range and POSM by channel — what "compliance" is measured
   against. A grocery is not expected to carry the full six. */
const REQUIRED_SKUS = {
  hypermarket: 6, supermarket: 6, "mini-market": 4, grocery: 3, convenience: 3,
};
const requiredPosm = (channelId) =>
  POSM_TYPES.filter((t) => !t.channels || t.channels.includes(channelId));

/* ------------------------------------------------------------------
   DRIFT — the six months have to tell a story, not repeat one.

   Without this every month is an independent draw from the same
   parameters, the trend lines come out flat, and the Competitor
   Movement card has nothing to point at. The brief's narrative is
   specific, so the drift is too:

     · Coca-Cola has been taking shelf all half, hardest in Basra,
       where the brief puts them at 35% → 42% in supermarkets
     · Pepsi has been giving it up at the same rate
     · Pepsi 500ml's availability has been deteriorating — it is the
       SKU the whole demo narrative hangs on
     · POSM has drifted down and is the worst-performing KPI

   Everything is anchored so that SEPTEMBER equals the calibrated
   figures above: month 5 multiplies by 1, and the earlier months are
   where the movement lives. Calibrate the present, then walk backwards
   — the other way round and every tuning pass would move the headline.
------------------------------------------------------------------ */
const MONTH_INDEX = Object.fromEntries(MONTHS.map((m, i) => [m.id, i]));

/* 0 at April, 1 at SEPTEMBER — anchored on the current cycle, not on
   the last month in the list.

   Dividing by MONTHS.length quietly re-scaled every drift in the file
   the moment October and November were added: September stopped being
   the anchor, and the calibrated figures the whole build rests on moved
   with it. Anchoring on the current cycle keeps the past exactly as it
   was and lets the future extrapolate past 1, which is what a trend
   continuing into the next cycle should do. */
const progress = (monthId) => MONTH_INDEX[monthId] / MONTH_INDEX[CURRENT];

/* Where each brand stands in each city, independent of time. The
   brief puts Baghdad at Pepsi 31% / Coca-Cola 41% against a national
   34 / 39 — the capital is where Pepsi is weakest on shelf, and that
   is the whole basis of its "31 Baghdad supermarkets" insight. */
const CITY_SHELF = {
  baghdad: { pepsi: 0.86, "coca-cola": 1.10 },
  basra: { pepsi: 0.95, "coca-cola": 1.06 },
};

function shelfDrift(monthId, brandId, cityId) {
  const t = progress(monthId);
  const place = CITY_SHELF[cityId]?.[brandId] ?? 1;
  if (brandId === "coca-cola") {
    /* Basra is where the brief says the swing happened. */
    const gain = cityId === "basra" ? 0.13 : 0.055;
    return place * (1 - gain * (1 - t));
  }
  if (brandId === "pepsi") {
    const loss = cityId === "basra" ? 0.09 : 0.04;
    return place * (1 + loss * (1 - t));
  }
  return place;
}

/* ------------------------------------------------------------------
   BRAND PRICE POSITION.

   Every brand used to price off the same RRP with the same variance,
   which meant the Competition page's price-position chart was six
   bubbles in a vertical line: arithmetically correct, and saying
   nothing. Real categories are not like that — a value challenger
   undercuts, a premium brand holds.

   The CLIENT is deliberately left at 1.0. Its price compliance is a
   calibrated headline figure measured against RRP, and moving it would
   move a number the checks are tuned against. Everyone else takes a
   position around it.
------------------------------------------------------------------ */
const BRAND_PRICE = {
  pepsi: 1,
  "coca-cola": 1.005,   // shoulder to shoulder with the client
  "7up": 0.975,
  mirinda: 0.97,
  "mountain-dew": 0.99,
  "rc-cola": 0.9,       // the value challenger, and it shows on shelf
};

/* Pepsi 500ml has been emptying more often as the half went on. */
function oosDrift(monthId, sku) {
  const t = progress(monthId);
  return sku.pack === "pet-500" && sku.brandId === CLIENT.id ? 1 - 0.3 * (1 - t) : 1;
}

/* POSM has slipped; it was near target in April. */
const posmDrift = (monthId) => 1 + 0.16 * (1 - progress(monthId));

/* ------------------------------------------------------------------
   PROMOTIONS AND SECONDARY DISPLAYS.

   A real audit records these — a gondola end, a price flash, a branded
   chiller by the till — and the brief asks the Competition page to
   report them. They are observed per BRAND per outlet, not per SKU:
   an auditor notes that Coca-Cola is running something here, not that
   a particular can is.

   Drawn from their own random stream, for the same reason placement
   is: promotions were added after the shelf figures were calibrated,
   and sharing the main generator would have shifted every later draw
   and moved numbers the checks are tuned against.

   The drift is the brief's story told a second way. Coca-Cola's
   activity has climbed hard through the half and hardest in Basra —
   which is where its shelf gain shows up. A competitor taking shelf
   without visible activity behind it would be a market nobody could
   explain; this is the mechanism under the movement.
------------------------------------------------------------------ */
const promoRand = mulberry32(717171);
const promoPick = (p) => promoRand() < p;

/* Baseline share of audited outlets running something, per brand. */
const PROMO_BASE = {
  pepsi: 0.22, "coca-cola": 0.26, "7up": 0.12,
  mirinda: 0.10, "mountain-dew": 0.07, "rc-cola": 0.06,
};

function promoRate(monthId, brandId, cityId) {
  const t = progress(monthId);
  const base = PROMO_BASE[brandId] ?? 0.08;
  if (brandId === "coca-cola") {
    /* From roughly half its September level in April, and steeper in
       Basra, where the shelf swing happened. */
    const climb = cityId === "basra" ? 0.62 : 0.3;
    return base * (cityId === "basra" ? 1.35 : 1) * (1 - climb * (1 - t));
  }
  if (brandId === CLIENT.id) {
    /* Broadly flat: the client has not answered. */
    return base * (1 + 0.06 * (1 - t));
  }
  return base;
}

/* A secondary display is the bigger commitment — floor space, not a
   shelf talker — so it is rarer, and only in formats that have room. */
const DISPLAY_CHANNELS = new Set(["hypermarket", "supermarket", "mini-market"]);

function promosFor(monthId, pos) {
  const rows = [];
  for (const brand of BRANDS) {
    const rate = promoRate(monthId, brand.id, pos.governorateId) * (0.7 + pos.volume * 0.4);
    const promo = promoPick(Math.min(0.9, rate));
    const display =
      DISPLAY_CHANNELS.has(pos.channel) && promoPick(Math.min(0.6, rate * 0.45));
    if (promo || display) rows.push([brand.id, promo ? 1 : 0, display ? 1 : 0]);
  }
  return rows;
}

/* ------------------------------------------------------------------
   FOLLOW-UP AUDITS, AND THE LIFT THEY COINCIDE WITH.

   The Action Center's whole claim is "you asked us to look again, and
   here is what changed". That needs two things in the data: a record
   of which outlets were asked about, and outlets that actually moved.

   READ THIS BEFORE CHANGING THE LIFT.

   Left to chance, a revisited outlet improves about as often as it
   worsens, every request would report "no material change", and the
   page would be a well-built shell. So the generator MODELS the thing
   a follow-up audit is supposed to cause: outlets in a request get
   attention before the next visit, and their weakest dimension
   improves.

   This is a modelled effect, not an observed one. The portal must go
   on saying what it has always said — that a comparison shows what
   changed between two visits, not that the request caused it. One
   outlet, no control group. The lift is deliberately partial (some
   outlets do not improve, a few get worse) so the demo can show Mixed
   and Worsened results rather than a page where every request
   succeeds, which nobody would believe.

   Requests are seeded HERE rather than in the app so every count on
   the page is derived from the same payload as the shelf itself.
------------------------------------------------------------------ */
const followUpRand = mulberry32(31071974);
const followPick = (p) => followUpRand() < p;

/* Which KPI a seeded request is about, and how strongly a requested
   outlet responds. Availability answers fastest — it is a delivery —
   while shelf space is a negotiation and moves least. */
const FOLLOW_UP_KPIS = [
  { kpi: "availability", strength: 0.55 },
  { kpi: "posm", strength: 0.6 },
  { kpi: "assortment", strength: 0.35 },
  { kpi: "shelfShare", strength: 0.25 },
  { kpi: "price", strength: 0.45 },
];

/* Roughly a fifth of requested outlets see nothing change, and a few
   go backwards — a distributor misses a drop, a retailer reclaims the
   space. Without them every request reads "Improved" and the result
   column stops carrying information. */
const LIFT_TAKES = 0.72;
const LIFT_BACKFIRES = 0.08;

/* posId -> { strength, direction } for the cycle being generated. */
const liftFor = new Map();
const FOLLOW_UPS = [];

/* Seeded after a month is generated: the outlets whose gaps that cycle
   found, carried into the next cycle as a request. */
function seedFollowUp(originMonth, cycle, bundleRows, spec) {
  const candidates = bundleRows
    .filter((row) => row.issues > 0)
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 40 + Math.floor(followUpRand() * 25));

  if (candidates.length < 12) return null;

  const request = {
    id: `req-${originMonth}-${spec.kpi}`,
    kpi: spec.kpi,
    brand: CLIENT.id,
    originMonth,
    cycle,
    createdAt: `${originMonth}-${String(22 + Math.floor(followUpRand() * 6)).padStart(2, "0")}`,
    pos: candidates.map((row) => row.posId),
  };
  FOLLOW_UPS.push(request);

  for (const posId of request.pos) {
    const direction = followPick(LIFT_BACKFIRES) ? -1 : followPick(LIFT_TAKES) ? 1 : 0;
    liftFor.set(`${cycle}|${posId}`, { kpi: spec.kpi, strength: spec.strength, direction });
  }
  return request;
}

/* What a requested outlet's lift does to one draw in the follow-up
   cycle. Returns a multiplier the visit model applies. */
function lift(monthId, posId, kpi) {
  const held = liftFor.get(`${monthId}|${posId}`);
  if (!held || held.kpi !== kpi || held.direction === 0) return 1;
  return held.direction > 0 ? 1 + held.strength : 1 - held.strength * 0.5;
}

/* ------------------------------------------------------------------
   ONE VISIT.
------------------------------------------------------------------ */
function visitFor(monthId, pos) {
  const channel = CHANNELS.find((c) => c.id === pos.channel);
  const cells = [];
  const oos = [];
  const prices = [];

  for (const sku of SKUS) {
    const brand = BRANDS.find((b) => b.id === sku.brandId);
    /* The listing draw is UNTOUCHED by the lift, and deliberately so.
       Whether a SKU is listed decides whether the stock, facing and
       price draws happen at all, so changing it here shifts every
       later draw in the run — which is exactly how an earlier version
       of this lift moved September's calibrated figures despite no
       request targeting September.

       Range still responds to a follow-up, but the adjustment is made
       below from the follow-up generator's own stream, where it cannot
       disturb the market. */
    let listed = pick(0.045)
      ? !baseListed.get(`${pos.id}|${sku.id}`)
      : baseListed.get(`${pos.id}|${sku.id}`);
    if (!listed && brand.client && lift(monthId, pos.id, "assortment") > 1) {
      /* A requested outlet takes a line it was not carrying. */
      if (followPick(0.32)) listed = true;
    }
    if (!listed) { cells.push([sku.id, 0, 0, null]); continue; }

    const risk = clamp(0.02, 0.5,
      (0.0945 + (channel.size < 4 ? 0.028 : 0)) *
      (sku.pack === "pet-500" ? 1.5 : 1) *   // the brief's problem SKU
      oosDrift(monthId, sku) *
      (brand.client ? 1.06 : 0.92) /
      keepBias.get(pos.id) /
      /* A follow-up audit's lift: the stockout risk falls at outlets
         somebody asked us to look at again. Client lines only — a
         request is about the client's shelf. */
      (brand.client ? lift(monthId, pos.id, "availability") : 1));
    const inStock = !pick(risk);

    const facings = inStock
      ? Math.max(1, Math.round(
          SHELF_WEIGHT[brand.id] * shelfDrift(monthId, brand.id, pos.governorateId) *
          26 * channel.size * 0.42 * pos.volume *
          brandBias.get(`${pos.id}|${brand.id}`) * between(0.85, 1.15) *
          (brand.client ? lift(monthId, pos.id, "shelfShare") : 1)))
      : 0;

    const position = inStock
      ? (pick(brand.client ? 0.42 : brand.id === "coca-cola" ? 0.55 : 0.3)
          ? "eye" : pick(0.5) ? "upper" : "lower")
      : null;

    cells.push([sku.id, listed ? (inStock ? 1 : 2) : 0, facings, position]);

    if (inStock) {
      /* The brand's position multiplies the draw rather than adding a
         draw of its own, so the random stream — and every figure
         downstream of it — is untouched. */
      const breach = brand.client ? 0.082 / lift(monthId, pos.id, "price") : 0.082;
      const price = Math.round(
        (sku.rrp * BRAND_PRICE[brand.id] *
          between(0.985, 1.048) * (pick(breach) ? between(1.08, 1.2) : 1)) / 25
      ) * 25;
      prices.push([sku.id, price]);
    } else {
      let roll = rand();
      let reason = OOS_REASONS[0];
      for (const r of OOS_REASONS) {
        if (roll < r.weight) { reason = r; break; }
        roll -= r.weight;
      }
      const normalFacings = Math.max(1, Math.round(
        SHELF_WEIGHT[brand.id] * 26 * channel.size * 0.42 * pos.volume *
        brandBias.get(`${pos.id}|${brand.id}`)));
      oos.push([sku.id, normalFacings, reason.id]);
    }
  }

  /* POSM — presence per required type, driven by the outlet's own
     execution character. */
  const posm = requiredPosm(pos.channel).map((t) => [
    t.id,
    pick(
      clamp(
        0.05, 0.97,
        0.738 * posmDrift(monthId) * posmBias.get(pos.id) *
          (t.id === "cooler" ? 0.85 : 1) *
          lift(monthId, pos.id, "posm")
      )
    ),
  ]);

  return { cells, oos, prices, posm, promos: promosFor(monthId, pos) };
}

console.log("shelf model ready");

/* ------------------------------------------------------------------
   EXECUTION SCORE.

   A composite, weighted toward availability because an empty shelf
   costs more than a missing poster. The weights live here and nowhere
   else, and every surface that shows a score shows the breakdown
   beside it — a single number that cannot be taken apart is a number
   nobody can act on.
------------------------------------------------------------------ */
const SCORE_WEIGHTS = {
  availability: 0.30, shelfShare: 0.25, assortment: 0.20, price: 0.15, posm: 0.10,
};
/* Shelf share is scored against a par rather than raw: 40% of the
   shelf is an excellent result, not a 40/100. */
const SHARE_PAR = 0.40;

function scoreVisit(v, pos) {
  const client = v.cells.filter((c) => SKUS.find((s) => s.id === c[0]).brandId === CLIENT.id);
  const listed = client.filter((c) => c[1] !== 0);
  const inStock = listed.filter((c) => c[1] === 1);

  const totalFacings = v.cells.reduce((s, c) => s + c[2], 0);
  const mine = client.reduce((s, c) => s + c[2], 0);

  const clientPrices = v.prices.filter(
    (p) => SKUS.find((s) => s.id === p[0]).brandId === CLIENT.id
  );
  const compliant = clientPrices.filter((p) => {
    const rrp = SKUS.find((s) => s.id === p[0]).rrp;
    return Math.abs(p[1] - rrp) / rrp <= 0.05;
  });

  /* A COMPONENT WITH NOTHING TO MEASURE IS NOT APPLICABLE, and the
     composite reweights over the components that do apply.

     This used to default availability to 0 while defaulting price and
     POSM to 1 — the same "nothing observed" situation scored as total
     failure in one component and as perfection in two others. At the
     five outlets that list none of the client's range it produced a
     store reading "availability 0%, price 100%", and a composite
     punished twice for one fact: assortment already carries "carries
     none of the expected range", which is the real finding.

     Assortment always applies — zero of the expected range is an
     observation, not an absence — and so does shelf share wherever the
     fixture has facings to hold. */
  const availability = listed.length ? inStock.length / listed.length : null;
  const share = totalFacings ? mine / totalFacings : null;
  const assortment = Math.min(1, listed.length / REQUIRED_SKUS[pos.channel]);
  const price = clientPrices.length ? compliant.length / clientPrices.length : null;
  const posm = v.posm.length ? v.posm.filter((p) => p[1]).length / v.posm.length : null;

  const parts = [
    { value: availability, weight: SCORE_WEIGHTS.availability },
    { value: share === null ? null : Math.min(1, share / SHARE_PAR), weight: SCORE_WEIGHTS.shelfShare },
    { value: assortment, weight: SCORE_WEIGHTS.assortment },
    { value: price, weight: SCORE_WEIGHTS.price },
    { value: posm, weight: SCORE_WEIGHTS.posm },
  ];
  const applicable = parts.filter((part) => part.value !== null);
  const weight = applicable.reduce((s, part) => s + part.weight, 0);
  const score = weight
    ? applicable.reduce((s, part) => s + part.value * part.weight, 0) / weight
    : 0;

  /* -1 rides through the payload as "not applicable": the bundles are
     numeric tuples, and hydration turns the sentinel back into null. */
  const r1 = (n) => (n === null ? -1 : Math.round(n * 1000) / 10);

  return {
    score: Math.round(score * 100),
    availability: r1(availability),
    shelfShare: r1(share),
    assortment: r1(assortment),
    price: r1(price),
    posm: r1(posm),
  };
}


const skuIndex = new Map(SKUS.map((s, i) => [s.id, i]));
const posIndex = new Map(POS.map((p, i) => [p.id, i]));
const brandIndex = new Map(BRANDS.map((b, i) => [b.id, i]));
const auditorIndex = new Map(AUDITORS.map((a, i) => [a.id, i]));
const posmIndex = new Map(POSM_TYPES.map((t, i) => [t.id, i]));
const reasonIndex = new Map(OOS_REASONS.map((r, i) => [r.id, i]));
const POSITION_IDX = { eye: 0, upper: 1, lower: 2 };

const months = {};
for (const month of MONTHS) {
  const audited = auditedIn(month.id);
  const bundle = { month: month.id, audited: [], matrix: [], oos: [], prices: [], posm: [], promos: [], scores: [] };
  /* Gap counts per outlet, for the follow-up request this cycle
     raises against the next one. */
  const issueRows = [];

  for (const pos of audited) {
    const v = visitFor(month.id, pos);
    const pi = posIndex.get(pos.id);
    bundle.audited.push([pi, auditDate(month.id, pos.id), auditorIndex.get(auditorFor(pos).id)]);

    for (const [skuId, state, facings, position] of v.cells) {
      if (state === 0 && facings === 0) {
        bundle.matrix.push([pi, skuIndex.get(skuId), 0, 0, -1]);
      } else {
        bundle.matrix.push([
          pi, skuIndex.get(skuId), state, facings,
          position === null ? -1 : POSITION_IDX[position],
        ]);
      }
    }
    for (const [skuId, nf, reason] of v.oos) {
      bundle.oos.push([pi, skuIndex.get(skuId), nf, reasonIndex.get(reason)]);
    }
    for (const [skuId, price] of v.prices) {
      bundle.prices.push([pi, skuIndex.get(skuId), price]);
    }
    for (const [typeId, present] of v.posm) {
      bundle.posm.push([pi, posmIndex.get(typeId), present ? 1 : 0]);
    }
    for (const [brandId, promo, display] of v.promos) {
      bundle.promos.push([pi, brandIndex.get(brandId), promo, display]);
    }
    const s = scoreVisit(v, pos);
    bundle.scores.push([pi, s.score, s.availability, s.shelfShare, s.assortment, s.price, s.posm]);
    issueRows.push({
      posId: pos.id,
      issues:
        v.cells.filter((c) => c[1] === 2 && SKUS.find((x) => x.id === c[0]).brandId === CLIENT.id)
          .length + v.posm.filter((row) => !row[1]).length,
    });
  }
  months[month.id] = bundle;

  /* Requests are raised only from the CURRENT cycle onwards, and this
     restriction is load-bearing.

     The lift moves the cycle a request targets. Seeding from April
     would have lifted every month after it — including September,
     whose figures the brief pins (87% availability, 34% share, 68%
     POSM) and the whole build is calibrated against. Those numbers
     describe a market nobody had yet intervened in, and they have to
     stay that way.

     So September raises three requests against October, which is fully
     audited and therefore shows finished results, and October raises
     two against November, which is part way through and shows the
     progressive states. Five requests, two of the states the Action
     Center has to report, and September untouched. */
  const nextCycle = MONTHS[MONTHS.indexOf(month) + 1];
  const raises =
    month.id === CURRENT
      ? FOLLOW_UP_KPIS.slice(0, 3)
      : month.id === "2026-10"
        ? FOLLOW_UP_KPIS.slice(3)
        : [];
  for (const spec of raises) {
    if (nextCycle) seedFollowUp(month.id, nextCycle.id, issueRows, spec);
  }
}

/* ---------------- calibration read-out ---------------- */
const cur = months[CURRENT];
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const facingsByBrand = new Map();
for (const [, si, state, facings] of cur.matrix) {
  if (state !== 1) continue;
  const b = SKUS[si].brandId;
  facingsByBrand.set(b, (facingsByBrand.get(b) ?? 0) + facings);
}
const totalFacings = [...facingsByBrand.values()].reduce((a, b) => a + b, 0);

console.log(`\n--- September 2026, ${cur.audited.length} POS audited ---`);
console.log(`  Execution score        ${Math.round(avg(cur.scores.map((s) => s[1])))} / 100   (target 82)`);
console.log(`  On-shelf availability  ${avg(cur.scores.map((s) => s[2])).toFixed(1)}%   (target 87)`);
console.log(`  Share of shelf         ${((facingsByBrand.get("pepsi") / totalFacings) * 100).toFixed(1)}%   (target 34)`);
console.log(`  Assortment compliance  ${avg(cur.scores.map((s) => s[4])).toFixed(1)}%   (target 81)`);
console.log(`  Price compliance       ${avg(cur.scores.map((s) => s[5])).toFixed(1)}%   (target 92)`);
console.log(`  POSM compliance        ${avg(cur.scores.map((s) => s[6])).toFixed(1)}%   (target 68)`);
console.log(`  Coca-Cola share        ${((facingsByBrand.get("coca-cola") / totalFacings) * 100).toFixed(1)}%   (target 39)`);

/* ------------------------------------------------------------------
   TRENDS — six months, pre-aggregated.

   The Historical page needs a series, not six full bundles: shipping
   2MB of cells to draw a line would be absurd. Aggregated here at the
   levels the brief says are safe to compare across months — market,
   city, channel, brand — plus a separate CORE-ONLY series, because
   that is the only cut where the same doors sit on both ends of the
   line and a month-over-month move means the market rather than the
   sample.
------------------------------------------------------------------ */
function aggregate(bundle, filterPos) {
  const keep = filterPos ? new Set(filterPos) : null;
  const rows = bundle.scores.filter((r) => !keep || keep.has(r[0]));
  if (!rows.length) return null;
  const mean = (i) => Math.round((rows.reduce((s, r) => s + r[i], 0) / rows.length) * 10) / 10;

  const facings = new Map();
  for (const [pi, si, state, f] of bundle.matrix) {
    if (state !== 1) continue;
    if (keep && !keep.has(pi)) continue;
    const b = SKUS[si].brandId;
    facings.set(b, (facings.get(b) ?? 0) + f);
  }
  const total = [...facings.values()].reduce((a, b) => a + b, 0);

  return {
    outlets: rows.length,
    score: Math.round(mean(1)),
    availability: mean(2),
    shelfShare: mean(3),
    assortment: mean(4),
    price: mean(5),
    posm: mean(6),
    brandShare: Object.fromEntries(
      BRANDS.map((b) => [b.id, total ? Math.round(((facings.get(b.id) ?? 0) / total) * 1000) / 10 : 0])
    ),
    /* Share of audited outlets running a promotion, per brand — the
       activity behind a shelf movement, so the Competition page can
       say what a competitor DID as well as what it gained. */
    promoShare: Object.fromEntries(
      BRANDS.map((b, bi) => {
        const outlets = new Set(
          bundle.promos
            .filter((r) => r[1] === bi && r[2] === 1 && (!keep || keep.has(r[0])))
            .map((r) => r[0])
        ).size;
        return [b.id, rows.length ? Math.round((outlets / rows.length) * 1000) / 10 : 0];
      })
    ),
    displayShare: Object.fromEntries(
      BRANDS.map((b, bi) => {
        const outlets = new Set(
          bundle.promos
            .filter((r) => r[1] === bi && r[3] === 1 && (!keep || keep.has(r[0])))
            .map((r) => r[0])
        ).size;
        return [b.id, rows.length ? Math.round((outlets / rows.length) * 1000) / 10 : 0];
      })
    ),
  };
}

const coreIdx = new Set(POS.filter((p) => p.core).map((p) => posIndex.get(p.id)));
const trends = {
  months: MONTHS.map((m) => ({ id: m.id, label: m.label, short: m.short, current: !!m.current })),
  /* All audited outlets — breadth. Comparable at market level only. */
  market: MONTHS.map((m) => ({ month: m.id, ...aggregate(months[m.id]) })),
  /* The same 400 doors every month — the only honest store-level line. */
  core: MONTHS.map((m) => ({ month: m.id, ...aggregate(months[m.id], coreIdx) })),
  byGovernorate: Object.fromEntries(
    GOVERNORATES.map((c) => {
      const idx = new Set(POS.filter((p) => p.governorateId === c.id).map((p) => posIndex.get(p.id)));
      return [c.id, MONTHS.map((m) => ({ month: m.id, ...aggregate(months[m.id], idx) }))];
    })
  ),
  byChannel: Object.fromEntries(
    CHANNELS.map((c) => {
      const idx = new Set(POS.filter((p) => p.channel === c.id).map((p) => posIndex.get(p.id)));
      return [c.id, MONTHS.map((m) => ({ month: m.id, ...aggregate(months[m.id], idx) }))];
    })
  ),
};

/* ------------------------------------------------------------------
   EMIT
------------------------------------------------------------------ */
const market = {
  contract: {
    ...CONTRACT,
    coveragePct: Math.round((CONTRACT.visitedThisMonth / CONTRACT.contractedPos) * 1000) / 10,
    remaining: CONTRACT.contractedPos - CONTRACT.visitedThisMonth,
    currentMonth: CURRENT,
    corePanel: CORE.size,
  },
  months: MONTHS,
  governorates: GOVERNORATES,
  districts: Object.entries(DISTRICTS).flatMap(([cityId, names]) =>
    names.map((name) => ({ cityId, name }))
  ),
  channels: CHANNELS.map(({ id, name, size }) => ({ id, name, size })),
  retailers: RETAILERS,
  brands: BRANDS,
  skus: SKUS,
  auditors: AUDITORS.map(({ id, name, governorates }) => ({ id, name, governorates })),
  /* Follow-up audits already in flight when the portal opens. Each was
     raised from one cycle's gaps against the next, so the Action
     Center has completed, in-progress and pending requests to show
     without anybody clicking anything. */
  followUps: FOLLOW_UPS,
  posmTypes: POSM_TYPES.map(({ id, name, channels }) => ({ id, name, channels })),
  oosReasons: OOS_REASONS.map(({ id, name }) => ({ id, name })),
  shelfPositions: SHELF_POSITIONS,
  scoreWeights: SCORE_WEIGHTS,
  sharePar: SHARE_PAR,
  requiredSkus: REQUIRED_SKUS,
  kpiTargets: { availability: 95, price: 90, posm: 85, assortment: 90, score: 85 },
  pos: POS,
};

/* Not-listed cells are dropped from the payload: absence IS "not
   listed", every SKU is checked at every audited outlet, and keeping
   them would add a third of the bytes to say nothing. */
for (const m of MONTHS) {
  months[m.id].matrix = months[m.id].matrix.filter((r) => r[2] !== 0);
}

mkdirSync(OUT, { recursive: true });
const files = { "market.json": market, "trends.json": trends };
for (const m of MONTHS) {
  files[`month-${m.id}.json`] = months[m.id];
  if (m.id === CURRENT) files["month-current.json"] = months[m.id];
}
let bytes = 0;
for (const [name, payload] of Object.entries(files)) {
  const json = name.startsWith("month-")
    ? JSON.stringify(payload)
    : JSON.stringify(payload, null, 2) + "\n";
  bytes += json.length;
  writeFileSync(join(OUT, name), json);
}

console.log(`\nWrote ${Object.keys(files).length} payloads · ${(bytes / 1024 / 1024).toFixed(2)} MB total`);
console.log(`  current month bundle ${(JSON.stringify(months[CURRENT]).length / 1024).toFixed(0)} KB`);
console.log(`  core-panel trend: ${trends.core.map((t) => t.score).join(" → ")} execution score`);
console.log(`  market trend:     ${trends.market.map((t) => t.availability).join(" → ")} availability`);
