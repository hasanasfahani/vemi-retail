/* ============================================================
   Audit data inspector + invariant check.

   Prints the dataset in a readable form, then asserts the rules that
   must hold for the pages to be internally consistent. Exits non-zero
   if any of them break, so it doubles as a regression guard whenever
   the generator is retuned.

   Run: node scripts/check-portal-data.mjs
   ============================================================ */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "data");
const load = (f) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const master = load("master.json");
const CURRENT = master.meta.currentWindow;
const VISITS = master.meta.windows.map((w) => w.id);
const availability = load("availability.json");
const shelfShare = load("shelf-share.json");
const pricing = load("pricing.json");
const competitors = load("competitors.json");
const photos = load("photos.json");

/* Visit bundles ship as index tuples against the master lists; rebuild
   the readable shape here so the checks read like the data they test. */
const CELL_STATE = ["not-listed", "in-stock", "out-of-stock"];
const visitData = Object.fromEntries(
  VISITS.map((id) => {
    const raw = load(`visit-${id}.json`);
    const posId = (i) => master.pos[i].id;
    const sku = (i) => master.skus[i];
    return [
      id,
      {
        matrix: raw.matrix.map(([p, k, state, facings]) => ({
          posId: posId(p),
          skuId: sku(k).id,
          state: CELL_STATE[state],
          facings,
        })),
        oos: raw.oos.map(([p, k, normalFacings]) => ({
          posId: posId(p),
          skuId: sku(k).id,
          normalFacings,
          facingDaysAtRisk: normalFacings * master.meta.revisitIntervalDays,
        })),
        observations: raw.observations.map(([p, k, price]) => ({
          posId: posId(p),
          skuId: sku(k).id,
          price,
          rrp: sku(k).rrp,
          variance: Math.round(((price - sku(k).rrp) / sku(k).rrp) * 1000) / 10,
          outlier:
            Math.abs(Math.round(((price - sku(k).rrp) / sku(k).rrp) * 1000) / 10) >
            10,
        })),
      },
    ];
  })
);
const current = visitData[CURRENT];

const brandName = (id) => master.brands.find((b) => b.id === id)?.name ?? id;
const skuName = (id) => master.skus.find((s) => s.id === id)?.name ?? id;
const posCode = (id) => master.pos.find((p) => p.id === id)?.code ?? id;
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const money = (n) => (n === null ? "—" : `${n.toLocaleString()} IQD`);
const delta = (n) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : "—");

const rule = (label) => console.log(`\n\x1b[1m${label}\x1b[0m`);

/* ---------------- report ---------------- */

console.log(`\n\x1b[1mVEMI AUDIT DATA — ${master.meta.city} · ${master.meta.category}\x1b[0m`);
console.log(
  `Windows: ${master.meta.windows.map((w) => `${w.shortLabel} (${w.outletsAudited} outlets)`).join("  →  ")}` +
    `   |   universe ${master.meta.posUniverse} · ${master.meta.skuCount} SKUs`
);

rule("BRAND SCOREBOARD (current visit)");
console.log(
  `  ${pad("Brand", 15)}${padL("Share", 7)}${padL("MoM", 7)}${padL("Avail", 8)}${padL("MoM", 7)}${padL("OOS", 5)}${padL("SKUs", 6)}`
);
for (const r of competitors.rows) {
  const marker = r.isClient ? "\x1b[1m▸ \x1b[0m" : "  ";
  console.log(
    `${marker}${pad(brandName(r.brandId), 15)}${padL(r.share + "%", 7)}${padL(delta(r.shareDelta), 7)}` +
      `${padL(r.availability + "%", 8)}${padL(delta(r.availabilityDelta), 7)}${padL(r.activeOos, 5)}${padL(r.skuCount, 6)}`
  );
}

rule("COOLER vs AMBIENT FACINGS");
for (const s of shelfShare.current) {
  const total = s.coolerFacings + s.ambientFacings;
  const coolerPct = total ? Math.round((s.coolerFacings / total) * 100) : 0;
  console.log(
    `  ${pad(brandName(s.brandId), 15)}${padL(s.facings, 5)} facings   cooler ${padL(coolerPct + "%", 4)}   ambient ${padL(100 - coolerPct + "%", 4)}`
  );
}

rule("WORST AVAILABILITY — SKUs (current visit)");
for (const s of [...availability.current.bySku]
  .sort((a, b) => a.onShelfAvailability - b.onShelfAvailability)
  .slice(0, 6)) {
  console.log(
    `  ${pad(skuName(s.skuId), 28)} on-shelf ${padL(s.onShelfAvailability + "%", 6)}   distribution ${padL(s.distribution + "%", 6)}`
  );
}

rule("WORST OUTLETS (current visit)");
for (const p of [...availability.current.byPos]
  .sort((a, b) => a.availability - b.availability)
  .slice(0, 6)) {
  const outlet = master.pos.find((x) => x.id === p.posId);
  console.log(
    `  ${pad(outlet.code, 9)}${pad(outlet.area, 20)}${pad(outlet.channel, 13)}` +
      `avail ${padL(p.availability + "%", 6)}   ${p.skusInStock}/${p.skusListed} SKUs on shelf`
  );
}

rule("LONGEST-RUNNING OUT-OF-STOCKS");
for (const r of current.oos.slice(0, 8)) {
  console.log(
    `  ${padL(r.normalFacings + "f", 5)}  ${pad(posCode(r.posId), 9)}${pad(skuName(r.skuId), 28)}`
  );
}
console.log(
  `  … ${current.oos.length} active in total`
);

rule("PRICE BANDS (current visit)");
console.log(`  ${pad("SKU", 28)}${padL("RRP", 10)}${padL("Min", 10)}${padL("Avg", 10)}${padL("Max", 10)}${padL("Compliance", 12)}`);
for (const p of pricing.bySku.slice(0, 8)) {
  console.log(
    `  ${pad(skuName(p.skuId), 28)}${padL(money(p.rrp), 10)}${padL(money(p.min), 10)}${padL(money(p.avg), 10)}${padL(money(p.max), 10)}${padL(p.compliance + "%", 12)}`
  );
}

rule("PRICE OUTLIERS BY OUTLET (>10% off RRP)");
const outliersByPos = {};
for (const o of current.observations.filter((o) => o.outlier)) {
  outliersByPos[o.posId] = (outliersByPos[o.posId] ?? 0) + 1;
}
for (const [posId, count] of Object.entries(outliersByPos).sort((a, b) => b[1] - a[1])) {
  const outlet = master.pos.find((x) => x.id === posId);
  console.log(`  ${pad(outlet.code, 9)}${pad(outlet.area, 20)}${pad(outlet.channel, 13)}${count} flagged SKUs`);
}

/* ---------------- invariants ---------------- */

const checks = [];
const check = (name, pass, detail = "") => checks.push({ name, pass, detail });

const shareSum = shelfShare.current.reduce((t, r) => t + r.share, 0);
check("brand shares sum to 100%", Math.abs(shareSum - 100) < 0.15, `got ${shareSum.toFixed(1)}%`);

/* Every invariant is checked on every visit, not just the latest —
   the date filter puts each of them in front of the reader. */
const skuIds = new Set(master.skus.map((s) => s.id));
const posIds = new Set(master.pos.map((p) => p.id));

check(
  "every visit ships its own bundle",
  VISITS.every((v) => visitData[v].matrix.length > 0),
  VISITS.join(", ")
);

for (const visit of VISITS) {
  const { matrix, oos: rows, observations: prices } = visitData[visit];
  const tag = visit === CURRENT ? `${visit}, latest` : visit;

  const matrixOos = matrix.filter((r) => r.state === "out-of-stock").length;
  check(`[${tag}] OOS rows match the matrix`, matrixOos === rows.length, `${rows.length} vs ${matrixOos}`);

  const stocked = new Set(
    matrix.filter((r) => r.state === "in-stock").map((r) => `${r.posId}|${r.skuId}`)
  );
  const ghostPrices = prices.filter((o) => !stocked.has(`${o.posId}|${o.skuId}`));
  check(`[${tag}] no price on an unstocked shelf`, ghostPrices.length === 0, `${ghostPrices.length} found`);

  const badFacings = matrix.filter(
    (r) => (r.state !== "in-stock" && r.facings > 0) || (r.state === "in-stock" && r.facings < 1)
  );
  check(`[${tag}] facings exist only where stock does`, badFacings.length === 0, `${badFacings.length} found`);

  const dangling = [...matrix, ...rows, ...prices].filter(
    (r) => !skuIds.has(r.skuId) || !posIds.has(r.posId)
  );
  check(`[${tag}] every SKU and outlet reference resolves`, dangling.length === 0, `${dangling.length} dangling`);

  const badCost = rows.filter(
    (r) => r.facingDaysAtRisk !== r.normalFacings * master.meta.revisitIntervalDays
  );
  check(`[${tag}] facing-days at risk = facings x revisit interval`, badCost.length === 0, `${badCost.length} off`);
}

const compOos = competitors.rows.reduce((t, r) => t + r.activeOos, 0);
check(
  "per-brand OOS sums to the latest total",
  compOos === current.oos.length,
  `${compOos} vs ${current.oos.length}`
);

check("outlet universe matches the stated scope", master.pos.length === master.meta.posUniverse);

/* The rotation must actually rotate: a window that reached everything
   would mean the panel is fixed after all, and every "we did not look
   there" state in the portal would be unreachable and untested. */
for (const win of master.meta.windows) {
  check(
    `[${win.shortLabel}] window reaches part of the universe, not all of it`,
    win.outletsAudited > 0 && win.outletsAudited < master.meta.posUniverse,
    `${win.outletsAudited} of ${master.meta.posUniverse}`
  );
}
check("SKU count matches the stated scope", master.skus.length === master.meta.skuCount);
check(
  "exactly one brand is flagged as the client",
  master.brands.filter((b) => b.client).length === 1,
  `client: ${brandName(competitors.clientBrandId)}`
);
check(
  "every photo points at a real outlet",
  photos.rows.every((p) => posIds.has(p.posId)),
  `${photos.rows.length} photos → ${posCode(photos.rows[0].posId)}`
);

rule("INVARIANTS");
let failed = 0;
for (const c of checks) {
  if (!c.pass) failed++;
  console.log(
    `  ${c.pass ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${pad(c.name, 42)}${c.detail}`
  );
}

console.log(
  failed === 0
    ? `\n\x1b[32mAll ${checks.length} invariants hold.\x1b[0m\n`
    : `\n\x1b[31m${failed} of ${checks.length} invariants failed.\x1b[0m\n`
);
process.exit(failed === 0 ? 0 : 1);
