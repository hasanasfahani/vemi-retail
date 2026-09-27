#!/usr/bin/env node
/**
 * Contrast of every text / mark pair the product uses, computed from
 * brand/tokens.css for both surfaces: the Vemi surface (:root) and the
 * client portal ([data-surface="portal"], docs/PORTAL-NEUTRAL-PLAN.md).
 * Fails (exit 1) when a pair drops under its WCAG minimum, so a token
 * edit cannot quietly break legibility.
 *   node scripts/contrast-check.mjs
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../brand/tokens.css", import.meta.url), "utf8");

/* Declarations of one rule block, by its selector's first line. */
function block(selectorStart) {
  const i = css.indexOf(selectorStart);
  if (i < 0) throw new Error(`no block ${selectorStart}`);
  const open = css.indexOf("{", i);
  const close = css.indexOf("\n}", open);
  const out = {};
  for (const m of css.slice(open + 1, close).matchAll(/(--vm-[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const root = block(":root,\n[data-theme=\"light\"]");
Object.assign(root, block(":root {\n  /* Type."));
const portal = { ...root, ...block('[data-surface="portal"] {') };

function resolve(tokens, name, depth = 0) {
  const v = tokens[name];
  if (v === undefined) throw new Error(`unknown token ${name}`);
  const ref = v.match(/^var\((--vm-[\w-]+)\)$/);
  if (ref) return resolve(tokens, ref[1], depth + 1);
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  throw new Error(`${name} is not a flat colour: ${v}`);
}

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* [label, foreground, background, minimum] — text 4.5, marks and
   control borders 3. */
const SHARED = [
  ["text on ground", "--vm-text", "--vm-bg", 4.5],
  ["text on surface", "--vm-text", "--vm-surface", 4.5],
  ["muted on ground", "--vm-text-muted", "--vm-bg", 4.5],
  ["muted on surface", "--vm-text-muted", "--vm-surface", 4.5],
  ["violet text on surface", "--vm-primary-text", "--vm-surface", 4.5],
  ["violet text on tint", "--vm-primary-text", "--vm-primary-tint", 4.5],
  ["on-primary on primary", "--vm-on-primary", "--vm-primary", 4.5],
  ["control border on surface", "--vm-line-strong", "--vm-surface", 3],
  ["danger on surface", "--vm-danger", "--vm-surface", 4.5],
];
const PORTAL = [
  ["muted on tint", "--vm-text-muted", "--vm-primary-tint", 4.5],
  ...["strong", "average", "attention", "critical"].flatMap((b) => [
    [`${b} text on its tint`, `--vm-status-${b}-text`, `--vm-status-${b}-tint`, 4.5],
    [`${b} text on surface`, `--vm-status-${b}-text`, "--vm-surface", 4.5],
  ]),
  ["strong fill on surface", "--vm-status-strong-fill", "--vm-surface", 3],
  ["average edge on surface", "--vm-status-average-edge", "--vm-surface", 3],
  ["attention fill on surface", "--vm-status-attention-fill", "--vm-surface", 3],
  ["attention fill on ground", "--vm-status-attention-fill", "--vm-bg", 3],
  ["critical fill on surface", "--vm-status-critical-fill", "--vm-surface", 3],
  ["cluster count on green", "--vm-mark-strong-on", "--vm-mark-strong", 4.5],
  ["cluster count on yellow", "--vm-mark-average-on", "--vm-mark-average", 4.5],
  ["cluster count on orange", "--vm-mark-attention-on", "--vm-mark-attention", 4.5],
  ["cluster count on red", "--vm-mark-critical-on", "--vm-mark-critical", 4.5],
  ...[0, 1, 2, 3, 4].map((n) => [`failure heat step ${n}`, `--vm-heat-bad-on-${n}`, `--vm-heat-bad-${n}`, 4.5]),
  ["delta better on surface", "--vm-delta-better", "--vm-surface", 4.5],
  ["delta worse on surface", "--vm-delta-worse", "--vm-surface", 4.5],
  ["your portfolio on surface", "--vm-chart-1", "--vm-surface", 3],
  ["key competitor on surface", "--vm-chart-2", "--vm-surface", 3],
  ["others on surface", "--vm-chart-3", "--vm-surface", 3],
  ["heat text on light step", "--vm-text", "--vm-heat-2", 4.5],
  ["heat text on dark step", "--vm-surface", "--vm-heat-3", 4.5],
];

let failed = 0;
for (const [surface, tokens, pairs] of [["vemi", root, SHARED], ["portal", portal, [...SHARED, ...PORTAL]]]) {
  for (const [label, fg, bg, min] of pairs) {
    const r = ratio(resolve(tokens, fg), resolve(tokens, bg));
    if (r < min) {
      failed++;
      console.log(`FAIL  ${surface.padEnd(6)} ${r.toFixed(2).padStart(5)}:1 < ${min}  ${label}`);
    }
  }
}
const total = SHARED.length * 2 + PORTAL.length;
console.log(`Vemi contrast check: ${total} pairs across 2 surfaces, ${failed} failing.`);
process.exit(failed ? 1 : 0);
