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

/* ------------------------------------------------------------------
   SNAPSHOTS — two field visits, so movement is real rather than drawn.
------------------------------------------------------------------ */
const SNAPSHOTS = [
  { id: "2026-07-15", label: "15 Jul 2026", current: false },
  { id: "2026-08-12", label: "12 Aug 2026", current: true },
];
const PREV = SNAPSHOTS[0].id;
const CURR = SNAPSHOTS[1].id;

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
   THE MATRIX — outlet × SKU × snapshot.
------------------------------------------------------------------ */
const cells = [];

for (const pos of POS) {
  for (const sku of SKUS) {
    const brand = brandById(sku.brandId);
    const listingOdds =
      brand.strength *
      CHANNEL_LISTING_INDEX[pos.channel] *
      PACK_LISTING_INDEX[sku.pack];

    for (const snap of SNAPSHOTS) {
      const listed = pick(Math.min(0.97, listingOdds));
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
        (pos.channel === "Grocery" || pos.channel === "Mini-market" ? 0.13 : 0.07) *
        (sku.pack === "can-330" ? 1.25 : 1) *
        (brand.client ? 1.1 : 1); // the client is stocked hardest, so it empties fastest
      const inStock = !pick(oosRisk);

      const baseFacings = brand.strength * (pos.channel === "Hypermarket" ? 9 : pos.channel === "Supermarket" ? 6 : 4);
      const facings = inStock ? Math.max(1, Math.round(baseFacings * between(0.65, 1.35))) : 0;

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

const at = (snapshot) => cells.filter((c) => c.snapshot === snapshot);
const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

/* ------------------------------------------------------------------
   DOMAIN PAYLOADS
------------------------------------------------------------------ */
const meta = {
  city: "Erbil",
  category: "Carbonated Beverages",
  snapshots: SNAPSHOTS,
  currentSnapshot: CURR,
  previousSnapshot: PREV,
  posCount: POS.length,
  skuCount: SKUS.length,
};

/* --- master --- */
const master = {
  meta,
  brands: BRANDS,
  skus: SKUS.map((s) => ({ ...s, rrp: RRP[s.pack] })),
  pos: POS,
};

/* --- availability: per SKU, per outlet, per snapshot --- */
function availabilityFor(snapshot) {
  const rows = at(snapshot);
  return {
    bySku: SKUS.map((sku) => {
      const forSku = rows.filter((c) => c.skuId === sku.id);
      const listed = forSku.filter((c) => c.listed).length;
      const inStock = forSku.filter((c) => c.inStock).length;
      return {
        skuId: sku.id,
        brandId: sku.brandId,
        distribution: pct(listed, POS.length),
        availability: pct(inStock, POS.length),
        onShelfAvailability: pct(inStock, listed),
      };
    }),
    byPos: POS.map((pos) => {
      const forPos = rows.filter((c) => c.posId === pos.id);
      const listed = forPos.filter((c) => c.listed).length;
      const inStock = forPos.filter((c) => c.inStock).length;
      const clientRows = forPos.filter((c) => brandById(brandOf(c.skuId)).client);
      return {
        posId: pos.id,
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

const matrixFor = (snapshot) =>
  at(snapshot).map((c) => [
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
function shareFor(snapshot) {
  const rows = at(snapshot).filter((c) => c.inStock);
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
   Days out alone tells you something is wrong; it doesn't tell you how
   much it costs or who is taking the space. These rows carry the shelf
   space the SKU normally holds in that outlet, the resulting lost
   facing-days, and which rival packs are sitting in stock alongside —
   the substitution the shopper actually makes.

   "Normally holds" is the facings that outlet gives that SKU on a visit
   where it is in stock; it is a property of the shelf, not of a single
   visit, which is what lets both visits be costed the same way. */
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

function oosFor(snapshot) {
  const previousOf = snapshot === CURR ? PREV : null;
  return at(snapshot)
    .filter((c) => c.listed && !c.inStock)
    .map((c) => {
      const before = previousOf
        ? cells.find(
            (p) =>
              p.snapshot === previousOf &&
              p.posId === c.posId &&
              p.skuId === c.skuId
          )
        : null;
      /* Out at both visits means it has been gone at least the 28 days
         between them; otherwise it went in the current cycle. */
      const persistent = Boolean(before?.listed && !before?.inStock);
      const daysOut = persistent ? intBetween(28, 41) : intBetween(2, 21);
      const holds =
        normalFacings.get(`${c.posId}|${c.skuId}`) ??
        medianFacings.get(c.skuId) ??
        2;

      const rivals = at(snapshot)
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

      /* [posIndex, skuIndex, daysOut, persistent, normalFacings,
          [[rivalSkuIndex, facings], ...]] — brand and lost facing-days
          are both derived on the client. */
      return [
        posIndexOf.get(c.posId),
        skuIndexOf.get(c.skuId),
        daysOut,
        persistent ? 1 : 0,
        holds,
        rivals.map((r) => [skuIndexOf.get(r.skuId), r.facings]),
      ];
    })
    .sort((a, b) => a[4] * a[2] < b[4] * b[2] ? 1 : -1);
}

const oosBySnapshot = Object.fromEntries(
  SNAPSHOTS.map((s) => [s.id, oosFor(s.id)])
);
const oosRows = oosBySnapshot[CURR];
const oosSkuIndex = (row) => row[1];

/* [posIndex, skuIndex, price]. RRP, variance and the outlier flag all
   fall out of the price and the SKU, so shipping them would be sending
   the same fact three times. */
const observationsFor = (snapshot) =>
  at(snapshot)
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
/* One bundle per field visit: the cells, the gaps and the shelf prices
   recorded on that day. The latest is also written as visit-current so
   the client can import it statically; every other visit is fetched on
   demand when the reader actually asks for that date. */
const visitFiles = {};
for (const snap of SNAPSHOTS) {
  const payload = {
    visit: snap.id,
    matrix: matrixFor(snap.id),
    oos: oosBySnapshot[snap.id],
    observations: observationsFor(snap.id),
  };
  visitFiles[`visit-${snap.id}.json`] = payload;
  if (snap.id === CURR) visitFiles["visit-current.json"] = payload;
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
console.log(`  outlets ${POS.length} · SKUs ${SKUS.length} · cells ${cells.length}`);
console.log(`  ${client.name} share ${clientShare.share}% · availability ${currAvail.find((a) => a.brandId === client.id).availability}%`);
console.log(`  active out-of-stocks ${oosRows.length} (${oosRows.filter((r) => r[3]).length} persistent)`);
console.log(
  `  brand share:`,
  currShare.map((s) => `${brandById(s.brandId).name} ${s.share}%`).join(", ")
);
