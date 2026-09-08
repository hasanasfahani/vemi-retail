/* ============================================================
   CORE PANEL SIZING — re-run this against real field data.

   Answers one question: how many outlets must be revisited every
   window, and what is the smallest real move that panel can detect?

   The method does not depend on this dataset. It needs paired
   observations — the same outlet measured in two windows — and it
   bootstraps everything else. Point it at real audit data as soon as
   two months of it exist; the number in build-portal-data.mjs
   (CORE_PANEL) is calibrated against a generator's assumptions and
   should not be defended to a client until it has been re-run here.

   Run: node scripts/size-core-panel.mjs
   ============================================================ */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "data");
const load = (f) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const master = load("master.json");
const CLIENT = master.brands.find((b) => b.client).id;
const skuBrand = master.skus.map((s) => s.brandId);
const [prev, curr] = master.meta.windows.map((w) => w.id);

/* Per-outlet aggregates — the quantities a panel average is built from. */
function perOutlet(win) {
  const acc = new Map();
  for (const [p, k, state, facings] of win.matrix) {
    const e = acc.get(p) ?? { mine: 0, total: 0, listed: 0, inStock: 0 };
    const isClient = skuBrand[k] === CLIENT;
    if (state === 1) {
      e.total += facings;
      if (isClient) e.mine += facings;
    }
    if (isClient && state !== 0) {
      e.listed += 1;
      if (state === 1) e.inStock += 1;
    }
    acc.set(p, e);
  }
  return acc;
}

const A = perOutlet(load(`visit-${prev}.json`));
const B = perOutlet(load(`visit-${curr}.json`));
const paired = [...A.keys()].filter((p) => B.has(p));

/* Ratio estimators, matching how the portal computes these. */
const share = (acc, ids) => {
  let mine = 0, total = 0;
  for (const id of ids) { const e = acc.get(id); mine += e.mine; total += e.total; }
  return total ? (mine / total) * 100 : 0;
};
const avail = (acc, ids) => {
  let listed = 0, inStock = 0;
  for (const id of ids) { const e = acc.get(id); listed += e.listed; inStock += e.inStock; }
  return listed ? (inStock / listed) * 100 : 0;
};

const draw = (pool, n) =>
  Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
const sd = (xs) => {
  const m = xs.reduce((s, x) => s + x, 0) / xs.length;
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
};

/* Does an outlet's shelf share persist between windows? If it does
   not, pairing cancels nothing and a fixed panel is worthless — so
   this is the FIRST thing to check on real data, before any sizing. */
const xs = paired.map((p) => (A.get(p).total ? (A.get(p).mine / A.get(p).total) * 100 : 0));
const ys = paired.map((p) => (B.get(p).total ? (B.get(p).mine / B.get(p).total) * 100 : 0));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const [mx, my] = [mean(xs), mean(ys)];
const r =
  xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) /
  Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
      ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );

console.log(`Paired outlets available: ${paired.length}`);
console.log(`Outlet-level share persistence: r = ${r.toFixed(3)}`);
console.log(
  r < 0.3
    ? "  LOW — pairing cancels little here; check the data before sizing.\n"
    : "  Healthy. A fixed panel will pay for itself.\n"
);

const RUNS = 3000;
const aIds = [...A.keys()], bIds = [...B.keys()];
console.log("Smallest real move detectable, 80% power / 5% two-sided:\n");
console.log("   n      rotating share   fixed share    rotating avail   fixed avail");
for (const n of [20, 30, 40, 50, 60, 80]) {
  const rs = [], fs = [], ra = [], fa = [];
  for (let i = 0; i < RUNS; i++) {
    const s1 = draw(aIds, n), s2 = draw(bIds, n);
    rs.push(share(B, s2) - share(A, s1));
    ra.push(avail(B, s2) - avail(A, s1));
    const core = draw(paired, n);
    fs.push(share(B, core) - share(A, core));
    fa.push(avail(B, core) - avail(A, core));
  }
  const f = (x) => (2.8 * sd(x)).toFixed(2).padStart(6);
  const cap = n > paired.length ? "*" : " ";
  console.log(`  ${String(n).padStart(3)}     ${f(rs)}pt        ${f(fs)}pt${cap}      ${f(ra)}pt        ${f(fa)}pt${cap}`);
}
console.log(`\n  * above the ${paired.length} paired outlets on hand — resampled, so optimistic.`);
console.log("\n  Paired SE scales 1/sqrt(n). Comparing trailing 3-window averages");
console.log("  instead of adjacent windows cuts it a further 1.7x for no extra visits.");
console.log(`\n  Shipped: CORE_PANEL = ${master.meta.corePanelSize}`);
console.log(`  Measured floor: ±${master.coreTrend.shareFloorPt}pt share · ±${master.coreTrend.availabilityFloorPt}pt availability`);
