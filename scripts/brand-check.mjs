#!/usr/bin/env node
/**
 * Vemi brand guard. Fails (exit 1) when UI code bypasses the brand tokens.
 *   node scripts/brand-check.mjs            # scans app, components, lib
 *   node scripts/brand-check.mjs app src    # scans given folders
 * Add to package.json: "brand:check": "node scripts/brand-check.mjs"
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'components', 'lib'];
const EXT = /\.(tsx?|jsx?|css|scss|html|mdx)$/;
const SKIP_DIR = new Set(['data', 'node_modules', '.next', 'dist', 'build', '.git', 'coverage']);
const ALLOW = [`brand${sep}`, `public${sep}`]; // the only places raw values may live

const TW_PALETTE = '(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
const rules = [
  { id: 'raw-hex', level: 'error', re: /(?<!&)#[0-9a-fA-F]{3,8}\b(?![-\w])/g, msg: 'Raw hex color. Use a var(--vm-*) token or a Tailwind brand class.' },
  { id: 'raw-rgb', level: 'error', re: /\b(rgba?|hsla?)\(\s*\d/g, msg: 'Raw rgb/hsl color. Use a var(--vm-*) token.' },
  { id: 'tw-default-palette', level: 'error', re: new RegExp(`\\b(bg|text|border|ring|fill|stroke|from|via|to|outline|divide|placeholder|decoration|accent|caret|shadow)-${TW_PALETTE}-\\d{2,3}\\b`, 'g'), msg: 'Tailwind default palette class. Use brand classes (bg-primary, text-text-muted, border-line…).' },
  // Plan phase 8 retired the pre-brand bridge; with --color-*: initial these no longer compile.
  { id: 'retired-token', level: 'error', re: /(?<![\w-])(?:[a-z0-9-]+:)*!?(?:bg|text|border(?:-[trblxyse])?|ring|fill|stroke|from|via|to|outline|divide|placeholder|decoration|accent|caret|shadow)-(?:ink-(?:900|700|600|500|400|300)|canvas|paper|violet(?:-ink)?|good|warn|serious|critical|comp-[123])(?![\w-])|var\(--color-|\bfont-(?:display|body)\b|\bt-(?:display|h2|h3|lead|eyebrow)\b|\bbtn-(?:primary|secondary|ghost)\b/g, msg: 'Retired pre-brand name. Use the semantic classes (text-text, text-text-muted, bg-bg, bg-primary, vm-h1, vm-label, vm-btn…) or var(--vm-*).' },
  { id: 'off-brand-font', level: 'error', re: /\b(Inter|Roboto|Arial|Helvetica|Montserrat|Poppins|Open Sans)\b/g, msg: 'Off-brand font. Use var(--vm-font-sans|mono|arabic).' },
  { id: 'gradient', level: 'warn', re: /(linear|radial|conic)-gradient\(/g, msg: 'Gradient. The Vemi brand uses flat color; remove unless it is a chart fill approved in review.' },
  { id: 'emoji', level: 'warn', re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/gu, msg: 'Emoji in UI. Vemi uses line icons, never emoji.' },
  { id: 'prev-visit', level: 'warn', re: /(previous|last) visit/gi, msg: 'Compare to a trailing window ("vs trailing 7 days"), not a previous visit.' },
];

function walk(dir, out) {
  let entries; try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIR.has(e)) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out); else if (EXT.test(e)) out.push(p);
  }
}

/* The client portal's colours (docs/PORTAL-NEUTRAL-PLAN.md): universal
   status colours and the data blue belong to portal code only, so the
   website stays fully Vemi. Anywhere else they are a warning. */
const PORTAL_ONLY = /--vm-status-|--vm-data-|--vm-delta-|(?<![\w-])(?:[a-z0-9-]+:)*!?(?:bg|text|border|fill|stroke|ring|outline)-(?:status-|delta-(?:better|worse))/;
const PORTAL_PATHS = [`app${sep}portal${sep}`, `components${sep}market${sep}`, `components${sep}portal${sep}`, `components${sep}vemi${sep}`, `app${sep}kit${sep}`, `lib${sep}market${sep}`];

const files = []; roots.forEach((r) => walk(r, files));
let errors = 0, warns = 0;
for (const f of files) {
  const rel = relative(process.cwd(), f);
  if (ALLOW.some((a) => rel.startsWith(a))) continue;
  const lines = readFileSync(f, 'utf8').split('\n');
  let alerts = 0;
  lines.forEach((line, i) => {
    if (/brand-check-ignore/.test(line)) return;
    alerts += (line.match(/<AlertChip\b/g) || []).length;
    if (PORTAL_ONLY.test(line) && !PORTAL_PATHS.some((p) => rel.startsWith(p))) {
      warns++;
      console.log(`warn   ${rel}:${i + 1}  [portal-only-colour] Status and data colours belong to the client portal (docs/PORTAL-NEUTRAL-PLAN.md); the website uses the Vemi tokens.`);
    }
    for (const r of rules) {
      r.re.lastIndex = 0;
      if (r.re.test(line)) {
        if (r.level === 'error') errors++; else warns++;
        console.log(`${r.level === 'error' ? 'ERROR' : 'warn '}  ${rel}:${i + 1}  [${r.id}] ${r.msg}`);
      }
    }
  });
  if (alerts > 1) { warns++; console.log(`warn   ${rel}  [one-signal] ${alerts} AlertChips in one file. Max one Signal element per view.`); }
}
console.log(`\nVemi brand check: ${files.length} files, ${errors} errors, ${warns} warnings.`);
process.exit(errors ? 1 : 0);
