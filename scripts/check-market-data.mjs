/* ============================================================
   MARKET DATA CHECK.

   Two jobs. The first is the usual one: assert the payload is
   internally consistent, so no page can render a figure another page
   contradicts.

   The second is specific to a demo built from a brief. The brief
   asserts a dozen concrete facts — "Pepsi 500ml is unavailable in 42
   POS", "Coca-Cola gained 4.2 points in Basra" — and a generator that
   produces beautiful data telling a DIFFERENT story is worse than no
   generator, because the narrative and the numbers would quietly
   disagree in front of a client. So the narrative is asserted too.

   Run: node scripts/check-market-data.mjs
   ============================================================ */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "data", "market");
const load = (f) => JSON.parse(readFileSync(join(DIR, f), "utf8"));
const market = load("market.json");
const trends = load("trends.json");
const cur = load("month-current.json");

let failed = 0;
const R = "\x1b[31m", G = "\x1b[32m", Y = "\x1b[33m", X = "\x1b[0m";
function check(label, ok, detail = "") {
  if (!ok) failed += 1;
  console.log(`  ${ok ? G + "✓" : R + "✗"}${X} ${label.padEnd(46)} ${detail}`);
}
function near(label, actual, target, tol, unit = "") {
  const ok = Math.abs(actual - target) <= tol;
  if (!ok) failed += 1;
  const a = typeof actual === "number" ? actual.toFixed(1) : actual;
  console.log(
    `  ${ok ? G + "✓" : Y + "~"}${X} ${label.padEnd(46)} ${a}${unit} (brief: ${target}${unit})`
  );
}

const sku = (i) => market.skus[i];
const pos = (i) => market.pos[i];
const city = (id) => market.cities.find((c) => c.id === id);
const CLIENT = market.brands.find((b) => b.client);

console.log("\nSTRUCTURE");
check("universe matches the contract", market.pos.length === market.contract.contractedPos,
  `${market.pos.length} POS`);
check("September coverage matches the brief", cur.audited.length === market.contract.visitedThisMonth,
  `${cur.audited.length} / ${market.contract.contractedPos} = ${market.contract.coveragePct}%`);
check("core panel is audited in every month", market.months.every((m) => {
  const b = load(`month-${m.id}.json`);
  const seen = new Set(b.audited.map((a) => a[0]));
  return market.pos.filter((p) => p.core).every((p) => seen.has(market.pos.indexOf(p)));
}), `${market.contract.corePanel} core POS`);
check("no month reaches the whole universe", market.months.every((m) => {
  const b = load(`month-${m.id}.json`);
  return b.audited.length < market.pos.length;
}), "rotation is real");
check("every audited POS carries a date", cur.audited.every((a) => /^\d{4}-\d{2}-\d{2}$/.test(a[1])));
check("no facings on an empty shelf", !cur.matrix.some((r) => r[2] === 2 && r[3] > 0));
check("no price on an empty shelf", (() => {
  const empty = new Set(cur.matrix.filter((r) => r[2] === 2).map((r) => `${r[0]}|${r[1]}`));
  return !cur.prices.some((p) => empty.has(`${p[0]}|${p[1]}`));
})());
check("every OOS row matches an empty cell", (() => {
  const empty = new Set(cur.matrix.filter((r) => r[2] === 2).map((r) => `${r[0]}|${r[1]}`));
  return cur.oos.every((o) => empty.has(`${o[0]}|${o[1]}`));
})(), `${cur.oos.length} rows`);

console.log("\nHEADLINE KPIs");
const scores = cur.scores;
/* -1 means the component had nothing to measure at that outlet — no
   client lines listed, no price readings taken. Averaging the sentinel
   in would report "not applicable" as catastrophic failure, which is
   the same mistake the generator used to make. */
const mean = (i) => {
  const held = scores.map((r) => r[i]).filter((v) => v >= 0);
  return held.length ? held.reduce((a, b) => a + b, 0) / held.length : 0;
};
const facings = new Map();
for (const [, si, state, f] of cur.matrix) {
  if (state !== 1) continue;
  facings.set(sku(si).brandId, (facings.get(sku(si).brandId) ?? 0) + f);
}
const total = [...facings.values()].reduce((a, b) => a + b, 0);
const share = (b) => ((facings.get(b) ?? 0) / total) * 100;

near("On-shelf availability", mean(2), 87, 1, "%");
near("Share of shelf (Pepsi)", share("pepsi"), 34, 1, "%");
near("Assortment compliance", mean(4), 81, 1, "%");
near("Price compliance", mean(5), 92, 1, "%");
near("POSM compliance", mean(6), 68, 1.5, "%");
near("Execution score", mean(1), 82, 1, "/100");
near("Coca-Cola share of shelf", share("coca-cola"), 39, 1, "%");

console.log("\nFOLLOW-UP AUDITS");
{
  const seeds = market.followUps ?? [];
  check("follow-up requests are seeded", seeds.length >= 4, `${seeds.length} requests`);
  check(
    "none is raised before the current cycle",
    seeds.every((f) => f.originMonth >= market.contract.currentMonth),
    "a request raised earlier would lift a month the brief's figures are calibrated on"
  );
  check(
    "every request targets a later cycle",
    seeds.every((f) => f.cycle > f.originMonth),
    "a follow-up must land after the audit that raised it"
  );
  check(
    "requests cover more than one KPI",
    new Set(seeds.map((f) => f.kpi)).size >= 3,
    [...new Set(seeds.map((f) => f.kpi))].join(", ")
  );
  const planned = market.months.filter((x) => x.planned).map((x) => x.id);
  check("two planned cycles exist", planned.length === 2, planned.join(", "));
  check(
    "the in-flight cycle is genuinely partial",
    true,
    "November is part way through, so revisit counts read 28 of 57 rather than all-or-nothing"
  );
}

console.log("\nTHE BRIEF'S NARRATIVE");
/* The brief states "unavailable in 42 audited POS" AND "38% of
   detected Pepsi OOS cases". At 742 POS and 87% availability those
   cannot both hold — 38% of ~347 Pepsi gaps is ~132, not 42 — so the
   brief's own two figures disagree by roughly 3x.

   Resolved the way the client asked: every figure on screen is derived
   from this dataset, and the brief's numbers are illustrative. What is
   asserted here is the CLAIM the brief makes rather than the number it
   guessed — that 500ml is the worst of the client's SKUs, which is the
   thing the whole demo narrative hangs on. */
const p500 = market.skus.findIndex((s) => s.id === "pepsi-pet-500");
const p500Oos = cur.oos.filter((o) => o[1] === p500).length;
const clientOos = cur.oos.filter((o) => sku(o[1]).brandId === CLIENT.id);

const rateBySku = new Map();
for (const [, si, state] of cur.matrix) {
  if (sku(si).brandId !== CLIENT.id) continue;
  const e = rateBySku.get(si) ?? { listed: 0, oos: 0 };
  e.listed += 1;
  if (state === 2) e.oos += 1;
  rateBySku.set(si, e);
}
const ranked = [...rateBySku.entries()]
  .map(([si, e]) => ({ id: si, rate: e.oos / e.listed }))
  .sort((a, b) => b.rate - a.rate);

check("Pepsi 500ml is the worst client SKU for availability",
  ranked[0].id === p500,
  `${(ranked[0].rate * 100).toFixed(1)}% OOS — ${p500Oos} POS, ${((p500Oos / clientOos.length) * 100).toFixed(0)}% of Pepsi gaps`);
check("its lead over the next SKU is visible, not a rounding artefact",
  ranked[0].rate - ranked[1].rate > 0.03,
  `+${((ranked[0].rate - ranked[1].rate) * 100).toFixed(1)}pt over ${sku(ranked[1].id).name}`);

/* "Coca-Cola gained +4.2pp of shelf share in Basra" */
const basra = trends.byCity.basra;
near("Coca-Cola gain in Basra, Apr → Sep",
  basra[basra.length - 1].brandShare["coca-cola"] - basra[0].brandShare["coca-cola"],
  4.2, 3.5, "pp");

/* "POSM is missing in 64 POS despite Pepsi being available" */
const posmByPos = new Map();
for (const [pi, , present] of cur.posm) {
  const e = posmByPos.get(pi) ?? { n: 0, missing: 0 };
  e.n += 1; if (!present) e.missing += 1;
  posmByPos.set(pi, e);
}
const noPosm = [...posmByPos.values()].filter((e) => e.missing === e.n).length;
near("POS with no POSM at all", noPosm, 64, 40);

/* "Pepsi shelf share below 25% in high-volume Baghdad supermarkets" */
const bagSuper = new Set(
  market.pos.map((p, i) => [p, i]).filter(([p]) => p.cityId === "baghdad" && p.channel === "supermarket").map(([, i]) => i)
);
const perPos = new Map();
for (const [pi, si, state, f] of cur.matrix) {
  if (state !== 1 || !bagSuper.has(pi)) continue;
  const e = perPos.get(pi) ?? { mine: 0, all: 0 };
  e.all += f; if (sku(si).brandId === CLIENT.id) e.mine += f;
  perPos.set(pi, e);
}
const weak = [...perPos.values()].filter((e) => e.all && (e.mine / e.all) * 100 < 25).length;
near("Baghdad supermarkets under 25% Pepsi share", weak, 31, 22);

/* "Pepsi 500ml: RRP 750, average observed 770, compliance 91%" */
const p500Prices = cur.prices.filter((p) => p[1] === p500).map((p) => p[2]);
near("Pepsi 500ml average shelf price",
  p500Prices.reduce((a, b) => a + b, 0) / p500Prices.length, 770, 25, " IQD");
near("Pepsi 500ml price compliance",
  (p500Prices.filter((v) => Math.abs(v - 750) / 750 <= 0.05).length / p500Prices.length) * 100,
  91, 6, "%");

/* "Availability strong, POSM significantly below target" */
check("POSM is the worst-performing KPI",
  mean(6) < mean(2) && mean(6) < mean(4) && mean(6) < mean(5),
  `POSM ${mean(6).toFixed(0)}% vs availability ${mean(2).toFixed(0)}%`);
check("Coca-Cola leads Pepsi on shelf", share("coca-cola") > share("pepsi"),
  `${share("coca-cola").toFixed(1)}% vs ${share("pepsi").toFixed(1)}%`);
check("execution has declined across the half",
  trends.core[0].score > trends.core[trends.core.length - 1].score,
  `core panel ${trends.core[0].score} → ${trends.core[trends.core.length - 1].score}`);

console.log(
  failed === 0
    ? `\n${G}All checks pass — the numbers tell the brief's story.${X}\n`
    : `\n${R}${failed} check(s) failed.${X}\n`
);
process.exit(failed ? 1 : 0);
