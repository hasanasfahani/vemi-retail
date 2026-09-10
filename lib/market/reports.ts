/* ============================================================
   CUSTOM REPORTS — the definition, and where it lives.

   A report is deliberately tiny: a name and an ordered list of block
   references, each optionally carrying a slice of its own. It holds no
   data and no figures. Everything it shows is recomputed from the same
   rows every other page reads, so a report saved in September and
   opened in November describes November — which is the point of it
   being a report rather than a screenshot.

   IT ALSO HOLDS NO SCOPE OF ITS OWN. The global filter bar is the
   report's scope, and blocks inherit it. A block may override any
   dimension, and that override is the ONLY thing on the page that
   escapes the header — which is why the block has to say so on its own
   face rather than in a settings panel nobody has open.

   WHAT "VISIBLE TO EVERYONE" CAN HONESTLY MEAN TODAY. There is no
   server, so there is no owner and no sharing. `localStorage` is
   per-browser and per-device: a colleague on another machine opens an
   empty list, however many reports exist here. The share link below is
   what actually crosses that gap, and it is why the definition is kept
   small enough to fit in a URL. When a backend arrives, reports move to
   it and gain an owner; none of the shapes here change.
   ============================================================ */

import { EMPTY_FILTERS, FILTER_KEYS, type FilterKey, type Filters } from "./filters";

/* The dimensions a block may override. The month is included: a report
   comparing this cycle against the last one is a normal thing to want,
   and it is the one override that cannot be expressed any other way. */
export type BlockScope = Partial<Pick<Filters, FilterKey | "month">>;

export type ReportBlock = {
  /* Instance id. The same catalogue block may appear more than once —
     the same chart at two scopes, side by side, is a legitimate report
     and the commonest reason to want per-block scope at all. */
  id: string;
  /* Key into the block catalogue (phase B). */
  blockId: string;
  /* Absent means "inherit the header", which is the silent default. */
  scope?: BlockScope;
  /* The reader's own words, where the catalogue's title is not what
     they are using the block to say. */
  title?: string;
};

export type CustomReport = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  blocks: ReportBlock[];
};

export const DEFAULT_REPORT_NAME = "My Report";

/* Long enough to be unique in a list one person builds by hand, short
   enough to sit in a URL. Not a UUID: `crypto.randomUUID` is missing in
   some of the environments this has to run in, and a report id has no
   security meaning. */
let seq = 0;
function makeId(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`;
}

const now = () => new Date().toISOString();

export function createReport(name = DEFAULT_REPORT_NAME): CustomReport {
  const at = now();
  return { id: makeId("r"), name, createdAt: at, updatedAt: at, blocks: [] };
}

export function makeBlock(blockId: string, scope?: BlockScope): ReportBlock {
  return { id: makeId("b"), blockId, ...(scope && hasScope(scope) ? { scope } : {}) };
}

/* An override with nothing in it is not an override. Storing one would
   put a scope chip on a block that is doing exactly what the header
   says, which is worse than useless — it teaches the reader to ignore
   the chip. */
export function hasScope(scope: BlockScope | undefined): boolean {
  if (!scope) return false;
  if (scope.month) return true;
  return FILTER_KEYS.some((key) => (scope[key]?.length ?? 0) > 0);
}

/* What a block is actually computed over: the header, with the block's
   own dimensions replacing it one at a time. Replacing rather than
   merging — a block scoped to Basra means Basra, not "Basra as well as
   whatever the header had". */
export function resolveScope(base: Filters, scope: BlockScope | undefined): Filters {
  if (!hasScope(scope)) return base;
  const out: Filters = { ...base };
  if (scope!.month) out.month = scope!.month;
  for (const key of FILTER_KEYS) {
    const held = scope![key];
    if (held && held.length) out[key] = held;
  }
  return out;
}

/* ---------- editing ----------

   Every one returns a NEW report and stamps `updatedAt`, so a caller
   cannot mutate a stored object by accident and the rail can order by
   recency without a second field to keep in step. */

/* Drop an optional key entirely rather than setting it to undefined:
   `"scope" in block` is what tells a chip whether to render, and an
   explicit undefined would answer yes. */
function omit(block: ReportBlock, key: "scope" | "title"): ReportBlock {
  const next = { ...block };
  delete next[key];
  return next;
}

const touched = (report: CustomReport, blocks: ReportBlock[]): CustomReport => ({
  ...report,
  blocks,
  updatedAt: now(),
});

export function renameReport(report: CustomReport, name: string): CustomReport {
  /* An empty name would render as a blank rail entry nobody can find
     again, so it falls back rather than being rejected with a dialogue
     in the first seconds of the feature. */
  const next = name.trim() || DEFAULT_REPORT_NAME;
  return { ...report, name: next, updatedAt: now() };
}

export function addBlock(report: CustomReport, blockId: string, scope?: BlockScope): CustomReport {
  return touched(report, [...report.blocks, makeBlock(blockId, scope)]);
}

export function removeBlock(report: CustomReport, blockInstanceId: string): CustomReport {
  return touched(report, report.blocks.filter((b) => b.id !== blockInstanceId));
}

export function duplicateBlock(report: CustomReport, blockInstanceId: string): CustomReport {
  const at = report.blocks.findIndex((b) => b.id === blockInstanceId);
  if (at === -1) return report;
  const source = report.blocks[at];
  const copy = makeBlock(source.blockId, source.scope);
  /* Beside its original, not at the end. A duplicate is nearly always
     the first half of "and now change this one's scope". */
  const blocks = [...report.blocks];
  blocks.splice(at + 1, 0, { ...copy, title: source.title });
  return touched(report, blocks);
}

export function moveBlock(report: CustomReport, blockInstanceId: string, to: number): CustomReport {
  const from = report.blocks.findIndex((b) => b.id === blockInstanceId);
  if (from === -1) return report;
  const target = Math.max(0, Math.min(report.blocks.length - 1, to));
  if (target === from) return report;
  const blocks = [...report.blocks];
  const [held] = blocks.splice(from, 1);
  blocks.splice(target, 0, held);
  return touched(report, blocks);
}

export function setBlockScope(
  report: CustomReport,
  blockInstanceId: string,
  scope: BlockScope | undefined
): CustomReport {
  return touched(
    report,
    report.blocks.map((b) =>
      b.id === blockInstanceId
        ? hasScope(scope)
          ? { ...b, scope }
          : /* Clearing an override REMOVES the key rather than storing an
               empty one, so `hasScope` stays the single test for "does
               this block differ from the header". */
            omit(b, "scope")
        : b
    )
  );
}

export function setBlockTitle(
  report: CustomReport,
  blockInstanceId: string,
  title: string | undefined
): CustomReport {
  const next = title?.trim();
  return touched(
    report,
    report.blocks.map((b) =>
      b.id === blockInstanceId
        ? next
          ? { ...b, title: next }
          : omit(b, "title")
        : b
    )
  );
}

/* ---------- the share link ----------

   The whole definition, in a URL. This is the only way a report reaches
   another person today, so it carries the name as well as the blocks —
   a link that reproduced the panels under the wrong title would be
   sharing a different document.

   Base64url over UTF-8 bytes rather than `btoa` on the string, because
   a report named in Arabic is entirely likely and `btoa` throws on
   anything outside Latin-1. */

type Wire = { n: string; b: [string, BlockScope?, string?][] };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function encodeReport(report: CustomReport): string {
  const wire: Wire = {
    n: report.name,
    b: report.blocks.map((block) => {
      const row: [string, BlockScope?, string?] = [block.blockId];
      if (hasScope(block.scope)) row[1] = block.scope;
      if (block.title) {
        row[1] = row[1] ?? undefined;
        row[2] = block.title;
      }
      return row;
    }),
  };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(wire)));
}

/* Returns a NEW report — fresh ids, fresh timestamps. Opening somebody
   else's link gives you your own copy to edit, not a shared object two
   people can disagree about. */
export function decodeReport(encoded: string): CustomReport | null {
  try {
    const wire = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as Wire;
    if (!wire || typeof wire.n !== "string" || !Array.isArray(wire.b)) return null;
    const report = createReport(wire.n.trim() || DEFAULT_REPORT_NAME);
    return {
      ...report,
      blocks: wire.b
        .filter((row) => Array.isArray(row) && typeof row[0] === "string")
        .map((row) => {
          const block = makeBlock(row[0], row[1]);
          return row[2] ? { ...block, title: String(row[2]) } : block;
        }),
    };
  } catch {
    /* A hand-edited or truncated link. Null lets the page say the link
       could not be read, which is better than a half-built report. */
    return null;
  }
}

/* ---------- storage ----------

   The same external-store shape targets and the watchlist use: hydrate
   on first subscription rather than from an effect, because `subscribe`
   is the one moment React guarantees during commit. */

const KEY = "vemi.reports.v1";

let reports: CustomReport[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

function read(): CustomReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return (parsed as CustomReport[]).filter(
      (r) => r && typeof r.id === "string" && typeof r.name === "string" && Array.isArray(r.blocks)
    );
  } catch {
    return [];
  }
}

export function subscribeReports(listener: () => void): () => void {
  listeners.add(listener);
  if (!hydrated) {
    hydrated = true;
    reports = read();
    queueMicrotask(emit);
  }
  return () => listeners.delete(listener);
}

export function getReports(): CustomReport[] {
  return reports;
}

export function reportsReady(): boolean {
  return hydrated;
}

export function saveReports(next: CustomReport[]): void {
  reports = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Private mode or a full quota. The session stays correct in
       memory and the page keeps working. */
  }
  emit();
}

export function upsertReport(report: CustomReport): void {
  const held = getReports();
  const at = held.findIndex((r) => r.id === report.id);
  if (at === -1) saveReports([...held, report]);
  else saveReports(held.map((r) => (r.id === report.id ? report : r)));
}

export function deleteReport(id: string): void {
  saveReports(getReports().filter((r) => r.id !== id));
}

export function findReport(id: string): CustomReport | null {
  return getReports().find((r) => r.id === id) ?? null;
}

/* Newest touched first — the rail shows a few and the index shows the
   rest, so the order has to put the report somebody is working on at
   the top rather than the one they made first. */
export function byRecency(list: CustomReport[]): CustomReport[] {
  return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function resetReportsForTest(): void {
  hydrated = false;
  reports = [];
  subscribeReports(() => {})();
}

export { EMPTY_FILTERS };
