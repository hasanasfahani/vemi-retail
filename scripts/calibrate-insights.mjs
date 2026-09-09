/* ============================================================
   THRESHOLD CALIBRATION.

   Every threshold in lib/market/insights.ts is set against the
   distribution this dataset actually produces, not against a round
   number imported from another market. This script prints those
   distributions so the choice is auditable — and so it can be redone
   the moment the panel size, the city list or the category changes.

     node scripts/calibrate-insights.mjs
   ============================================================ */

import fs from "node:fs";

const R = (p) => JSON.parse(fs.readFileSync(`lib/data/market/${p}`, "utf8"));
const m = R("market.json");
const raw = R("month-current.json");
const trends = R("trends.json");

const POSITION = ["eye", "upper", "lower"];
const pos = m.pos, skus = m.skus, brands = m.brands;
const client = brands.find((b) => b.client);
const posOf = (i) => pos[i];
const skuOf = (i) => skus[i];

const cells = raw.matrix.map(([p, k, state, facings, position]) => ({
  pos: posOf(p), sku: skuOf(k),
  inStock: state === 1, facings,
  position: position < 0 ? null : POSITION[position],
}));
const prices = raw.prices.map(([p, k, price]) => {
  const sku = skuOf(k);
  return { pos: posOf(p), sku, variance: ((price - sku.rrp) / sku.rrp) * 100 };
});
const posm = raw.posm.map(([p, t, present]) => ({ pos: posOf(p), type: m.posmTypes[t].id, present: present === 1 }));
const audited = new Set(raw.audited.map(([p]) => posOf(p).id));

const q = (values, p) => {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return 0;
  return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10;
};
const spread = (name, values) =>
  console.log(
    `${name.padEnd(34)} n=${String(values.length).padStart(4)}  ` +
      `min ${q(values, 0)}  p25 ${q(values, 0.25)}  med ${q(values, 0.5)}  ` +
      `p75 ${q(values, 0.75)}  p90 ${q(values, 0.9)}  max ${q(values, 0.999)}`
  );

const clientCells = cells.filter((c) => c.sku.brandId === client.id);
console.log(`\n=== dataset: ${audited.size} audited outlets, ${cells.length} cells ===\n`);

/* R1 — client SKUs listed but empty, per outlet */
const gapsPerOutlet = new Map();
for (const c of clientCells) if (!c.inStock) gapsPerOutlet.set(c.pos.id, (gapsPerOutlet.get(c.pos.id) ?? 0) + 1);
spread("R1 client gaps per outlet", [...gapsPerOutlet.values()]);
console.log(`   outlets with >=1 gap: ${gapsPerOutlet.size}, >=2: ${[...gapsPerOutlet.values()].filter((v) => v >= 2).length}, >=3: ${[...gapsPerOutlet.values()].filter((v) => v >= 3).length}, >=4: ${[...gapsPerOutlet.values()].filter((v) => v >= 4).length}`);

/* R2 — district client share vs its own city's share */
const facingsBy = (rows) => rows.filter((c) => c.inStock).reduce((s, c) => s + c.facings, 0);
const byCity = new Map(), byDistrict = new Map();
for (const c of cells) {
  const ck = c.pos.cityId, dk = `${c.pos.cityId}|${c.pos.district}`;
  (byCity.get(ck) ?? byCity.set(ck, []).get(ck)).push(c);
  (byDistrict.get(dk) ?? byDistrict.set(dk, []).get(dk)).push(c);
}
const sharePct = (rows) => {
  const total = facingsBy(rows);
  return total ? (facingsBy(rows.filter((c) => c.sku.brandId === client.id)) / total) * 100 : 0;
};
const deficits = [];
for (const [dk, rows] of byDistrict) {
  const cityRows = byCity.get(dk.split("|")[0]);
  const outlets = new Set(rows.map((r) => r.pos.id)).size;
  if (outlets < 4) continue;
  deficits.push({ dk, outlets, deficit: sharePct(cityRows) - sharePct(rows) });
}
spread("R2 district deficit (pt)", deficits.map((d) => d.deficit));
console.log(`   districts n>=4 outlets: ${deficits.length}; worst: ${deficits.sort((a, b) => b.deficit - a.deficit).slice(0, 3).map((d) => `${d.dk} ${d.deficit.toFixed(1)}`).join(", ")}`);

/* R3 — client SKU distribution vs same-pack peer median */
const listedPct = (skuId) => {
  const rows = cells.filter((c) => c.sku.id === skuId);
  return (rows.length / audited.size) * 100;
};
const packPeers = new Map();
for (const s of skus) (packPeers.get(s.pack) ?? packPeers.set(s.pack, []).get(s.pack)).push(s);
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
const distGaps = skus.filter((s) => s.brandId === client.id).map((s) => {
  const peers = (packPeers.get(s.pack) ?? []).filter((p) => p.brandId !== client.id).map((p) => listedPct(p.id));
  return { sku: s.name, own: listedPct(s.id), peer: med(peers) };
});
console.log("R3 client SKU distribution vs peer median:");
for (const d of distGaps) console.log(`   ${d.sku.padEnd(24)} own ${d.own.toFixed(1)}%  peers ${d.peer.toFixed(1)}%  gap ${(d.peer - d.own).toFixed(1)}pt`);

/* R4 — rival share of facings at outlets where the client is out */
const oosOutlets = new Set(clientCells.filter((c) => !c.inStock).map((c) => c.pos.id));
const contested = cells.filter((c) => oosOutlets.has(c.pos.id) && c.inStock && c.sku.brandId !== client.id);
const rivalTotals = new Map();
for (const c of contested) rivalTotals.set(c.sku.brandId, (rivalTotals.get(c.sku.brandId) ?? 0) + c.facings);
const contestedTotal = [...rivalTotals.values()].reduce((a, b) => a + b, 0);
console.log("R4 rival share of contested facings:");
for (const [b, v] of [...rivalTotals].sort((a, b) => b[1] - a[1]))
  console.log(`   ${b.padEnd(16)} ${((v / contestedTotal) * 100).toFixed(1)}%`);

/* R5 — client price breaches (>5% off RRP) per outlet */
const breaches = new Map();
for (const p of prices) if (p.sku.brandId === client.id && Math.abs(p.variance) > 5) breaches.set(p.pos.id, (breaches.get(p.pos.id) ?? 0) + 1);
spread("R5 client breaches per outlet", [...breaches.values()]);
console.log(`   outlets >=1: ${breaches.size}, >=2: ${[...breaches.values()].filter((v) => v >= 2).length}, >=3: ${[...breaches.values()].filter((v) => v >= 3).length}, >=4: ${[...breaches.values()].filter((v) => v >= 4).length}`);

/* R6 — client availability by channel vs the client's own average */
const overall = (rows) => (rows.filter((c) => c.inStock).length / rows.length) * 100;
const clientOverall = overall(clientCells);
console.log(`R6 client availability overall ${clientOverall.toFixed(1)}%`);
for (const ch of m.channels) {
  const rows = clientCells.filter((c) => c.pos.channel === ch.id);
  if (!rows.length) continue;
  console.log(`   ${ch.id.padEnd(14)} ${overall(rows).toFixed(1)}%  gap ${(clientOverall - overall(rows)).toFixed(1)}pt  listings ${rows.length}`);
}

/* R7 — client share at eye level vs everywhere else */
const shelfShareAt = (position) => {
  const rows = cells.filter((c) => c.inStock && (position === "eye" ? c.position === "eye" : c.position !== "eye"));
  const total = rows.reduce((s, c) => s + c.facings, 0);
  const own = rows.filter((c) => c.sku.brandId === client.id).reduce((s, c) => s + c.facings, 0);
  return total ? (own / total) * 100 : 0;
};
console.log(`R7 client share eye ${shelfShareAt("eye").toFixed(1)}% vs other ${shelfShareAt("other").toFixed(1)}%  gap ${(shelfShareAt("eye") - shelfShareAt("other")).toFixed(1)}pt`);

/* R9 — dark outlets: client listed somewhere, in stock nowhere */
const darkCount = [...new Set(clientCells.map((c) => c.pos.id))].filter(
  (id) => clientCells.filter((c) => c.pos.id === id).every((c) => !c.inStock)
).length;
console.log(`R9 dark outlets (client listed, none in stock): ${darkCount}`);

/* R11 — client SKUs listed at an outlet vs that outlet's channel median */
const listedAt = new Map();
for (const c of clientCells) listedAt.set(c.pos.id, (listedAt.get(c.pos.id) ?? 0) + 1);
const byChannelCounts = new Map();
for (const [id, n] of listedAt) {
  const ch = pos.find((p) => p.id === id).channel;
  (byChannelCounts.get(ch) ?? byChannelCounts.set(ch, []).get(ch)).push(n);
}
const shorts = [];
for (const [id, n] of listedAt) {
  const ch = pos.find((p) => p.id === id).channel;
  shorts.push(med(byChannelCounts.get(ch)) - n);
}
spread("R11 SKUs short of channel median", shorts.filter((s) => s > 0));
console.log(`   short by >=1: ${shorts.filter((s) => s >= 1).length}, >=2: ${shorts.filter((s) => s >= 2).length}, >=3: ${shorts.filter((s) => s >= 3).length}`);

/* R13 — POSM missing where the client is present */
const clientPresent = new Set(clientCells.filter((c) => c.inStock).map((c) => c.pos.id));
const posmByOutlet = new Map();
for (const p of posm) {
  const cur = posmByOutlet.get(p.pos.id) ?? { n: 0, on: 0 };
  cur.n += 1; cur.on += p.present ? 1 : 0;
  posmByOutlet.set(p.pos.id, cur);
}
const bare = [...posmByOutlet].filter(([id, v]) => clientPresent.has(id) && v.on === 0).length;
spread("R13 POSM present per outlet (%)", [...posmByOutlet.values()].map((v) => (v.on / v.n) * 100));
console.log(`   outlets stocking the client with ZERO POSM: ${bare}`);

/* R14 — competitor share movement by city, month over month */
console.log("R14 brand share movement, last month vs previous, by city:");
for (const [cityId, points] of Object.entries(trends.byCity)) {
  const [prev, last] = points.slice(-2);
  const moves = brands.map((b) => ({ b: b.id, d: (last.brandShare[b.id] ?? 0) - (prev.brandShare[b.id] ?? 0) }))
    .sort((a, b) => b.d - a.d);
  console.log(`   ${cityId.padEnd(9)} ${moves.map((x) => `${x.b} ${x.d > 0 ? "+" : ""}${x.d.toFixed(1)}`).join("  ")}`);
}

/* ---------- detection floors ----------

   A movement claim is only worth making if the panel can resolve it.
   Bootstrap the standard error of each measure by resampling audited
   outlets with replacement, then take the minimum detectable effect as
   2.8 × SE (two-sided, 80% power at α=0.05). Anything smaller is panel
   noise wearing a plus sign. */
const mulberry32 = (a) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(20260909);

const bootstrapSE = (outletIds, measure, draws = 400) => {
  const values = [];
  for (let d = 0; d < draws; d += 1) {
    const sample = Array.from({ length: outletIds.length }, () => outletIds[Math.floor(rnd() * outletIds.length)]);
    values.push(measure(sample));
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
};

const cellsByPos = new Map();
for (const c of cells) (cellsByPos.get(c.pos.id) ?? cellsByPos.set(c.pos.id, []).get(c.pos.id)).push(c);

const shareOf = (ids) => {
  let own = 0, all = 0;
  for (const id of ids)
    for (const c of cellsByPos.get(id) ?? [])
      if (c.inStock) { all += c.facings; if (c.sku.brandId === client.id) own += c.facings; }
  return all ? (own / all) * 100 : 0;
};
const availOf = (ids) => {
  let ok = 0, n = 0;
  for (const id of ids)
    for (const c of cellsByPos.get(id) ?? [])
      if (c.sku.brandId === client.id) { n += 1; if (c.inStock) ok += 1; }
  return n ? (ok / n) * 100 : 0;
};

console.log("\nDetection floors (MDE = 2.8 x bootstrapped SE):");
const allIds = [...audited];
console.log(`   market share        ${(2.8 * bootstrapSE(allIds, shareOf)).toFixed(2)}pt  (n=${allIds.length})`);
console.log(`   market availability ${(2.8 * bootstrapSE(allIds, availOf)).toFixed(2)}pt`);
for (const city of m.cities) {
  const ids = allIds.filter((id) => pos.find((p) => p.id === id).cityId === city.id);
  console.log(`   ${city.id.padEnd(9)} share ${(2.8 * bootstrapSE(ids, shareOf)).toFixed(2)}pt   availability ${(2.8 * bootstrapSE(ids, availOf)).toFixed(2)}pt   (n=${ids.length})`);
}
const coreIds = allIds.filter((id) => pos.find((p) => p.id === id).core);
console.log(`   core panel          share ${(2.8 * bootstrapSE(coreIds, shareOf)).toFixed(2)}pt   availability ${(2.8 * bootstrapSE(coreIds, availOf)).toFixed(2)}pt   (n=${coreIds.length})`);
