# Custom Reports — product requirements (as built)

A portable spec of the custom-report section: what it must do, the exact
data model, every screen, every control, and the rules that are not
negotiable. Written so the same section can be rebuilt in another
product without reading this codebase.

---

## 1 · What the feature is

A reader assembles their own page out of findings the product already
computes: name it, add blocks, give any block a scope of its own,
reorder, print, and share by link.

**The unit is a BLOCK, not a chart.** A block is a *named finding that
already exists somewhere in the product*, carrying its own data builder,
its own chart, its own lead line and its own footnote. "Availability by
governorate" is a block. "A bar chart" is not on the menu.

This is the decision everything else follows from. A generic chart
builder (pick type → pick measure → pick dimension) would strip each
figure of its stated denominator, its calibrated target line, its
status-band cut-offs and its footnote, leaving a product that can draw
anything and vouch for nothing. Keeping the unit at block level costs
the reader nothing they would miss — nobody wants to choose between a
dot plot and a bar for the same figure — and makes a custom report
exactly as defensible as the page each block came from.

**Blocks are pure functions of a filtered view.** `(view, targets) =>
ReactNode`. No block fetches, no block holds state, no block writes.
That is what makes a registry possible instead of a rewrite.

---

## 2 · Non-negotiable invariants

| # | Invariant | Why |
| --- | --- | --- |
| I1 | A report stores **no data and no figures** — only block references. Everything recomputes from the same rows every other page reads. | A report saved in September and opened in November describes November. Otherwise it is a screenshot. |
| I2 | A report stores **no scope of its own**. The global filter bar *is* the report's scope. | One filter vocabulary in the product, not two. |
| I3 | A block whose slice differs from the header **states it on its own face**, as a chip in the card header — never only in a settings panel, never on hover. | Per-block scope deliberately breaks the product's "one bar, one slice" rule. Without the chip the feature manufactures two numbers that look comparable and are not. |
| I4 | Scope chips **survive printing**. No utility may hide one on paper. | A block computed over Basra on a page headed "all governorates" is only honest while the chip is beside it. |
| I5 | The reader **never places blocks**. Each block declares its own natural width; the grid packs. | The reader cannot leave a chart in a shape that breaks it. |
| I6 | Whether a block may see a brand/SKU filter is decided **outside the block**, by the scope resolver. A block is never handed the alternative view. | A block declaring "I compare all brands" and then reading the filtered view anyway fails silently until someone scopes a report to one brand and sees that brand holding 100% of a shelf containing only that brand. |
| I7 | A per-block override **replaces** a dimension; it does not merge with the header. | A block scoped to Basra means Basra, not "Basra as well as whatever the header had". |
| I8 | CSV for a block is computed over **the same view the panel drew**. | The file and the picture cannot disagree. |
| I9 | Nothing is gated behind a dialogue. Create first, rename in place, Escape keeps the default. | No abandoned-rename orphans; one rename interaction, not two. |

---

## 3 · Data model

```ts
/* Dimensions a block may override. Period is included — a report
   comparing this cycle against the last is the one override that
   cannot be expressed any other way. */
type BlockScope = Partial<Pick<Filters, FilterKey | "month">>;

type ReportBlock = {
  id: string;        // instance id — the same catalogue block may appear twice
  blockId: string;   // key into the block catalogue
  scope?: BlockScope;// ABSENT means "inherit the header". Never store {}.
  title?: string;    // the reader's own words; absent means the catalogue label
};

type CustomReport = {
  id: string;
  name: string;      // default "My Report"
  createdAt: string; // ISO
  updatedAt: string; // ISO — the rail and index order by this
  blocks: ReportBlock[];
};
```

Notes that matter:

- **Ids** are `prefix + Date.now().toString(36) + counter.toString(36)`.
  Not UUIDs: `crypto.randomUUID` is missing in some environments this
  must run in and a report id has no security meaning. Long enough to be
  unique in a list one person builds by hand, short enough for a URL.
- **`scope` and `title` are deleted, not set to `undefined`**, when
  cleared. `"scope" in block` / `hasScope()` is the single test for
  "does this block differ from the header"; an explicit `undefined`
  answers yes and would put a chip on a block that is doing exactly what
  the header says — worse than useless, it teaches the reader to ignore
  chips.
- **No `width` on `ReportBlock`.** See I5.
- **No `period` on `CustomReport`.** See I2.

### Required pure functions

```ts
createReport(name?)                        -> CustomReport         // empty blocks
makeBlock(blockId, scope?)                 -> ReportBlock
hasScope(scope?)                           -> boolean              // month set, or any key non-empty
resolveScope(base: Filters, scope?)        -> Filters              // replace per dimension (I7)
renameReport(report, name)                 -> CustomReport         // empty name falls back to default
addBlock(report, blockId, scope?)          -> CustomReport         // appends
removeBlock(report, instanceId)            -> CustomReport
duplicateBlock(report, instanceId)         -> CustomReport         // inserted BESIDE its original, carries title + scope
moveBlock(report, instanceId, to)          -> CustomReport         // index clamped; no-op if unchanged
setBlockScope(report, instanceId, scope?)  -> CustomReport         // empty scope deletes the key
setBlockTitle(report, instanceId, title?)  -> CustomReport         // trimmed; empty deletes the key
byRecency(list)                            -> CustomReport[]       // updatedAt desc
```

Every editing function returns a **new** report and stamps `updatedAt`,
so a caller cannot mutate a stored object by accident and the rail can
order by recency without a second field to keep in step. Duplicate goes
beside its original because a duplicate is nearly always the first half
of "and now change this one's scope".

---

## 4 · The block catalogue (registry)

```ts
type BlockDef = {
  id: string;
  shape: "tiles"|"bars"|"dots"|"gap"|"split"|"stacked"|"donut"|"grid"|"table";
  label: string;
  group: BlockGroup;
  description: string;          // one line, shown in the picker
  width: "half" | "full";       // the grid packs by this
  lead?: string;                // sub-title on the card
  footnote?: ReactNode;         // the block's own caveat, carried from its home page
  ignoresBrandFilter?: boolean; // this block compares brands
  render: (ctx: { view; targets }) => ReactNode;
  csv?: (ctx: { view; targets }) => CsvTable; // absent => no download control
};
```

`shape` exists for the picker's schematic thumbnail. It is deliberately
not the chart component's name: a reader scanning twenty entries asks
"what will this look like on my page", and a 34×26px schematic answers
that instantly, where a real preview would cost a full data build per
row of the list.

`csv` absent means **the control is absent**, not present and producing
an empty file.

**Brand-comparison blocks.** `ignoresBrandFilter: true` means outlet
dimensions (place, format, retailer, period) still apply — a shelf
battle scoped to Basra is still a Basra question — but brand and SKU are
stripped:

```ts
scopeForBlock(block, filters) =>
  block.ignoresBrandFilter ? { ...filters, brands: [], skus: [] } : filters;
```

Order of operations when rendering a block, exactly:
`applyFilters(scopeForBlock(def, resolveScope(headerFilters, block.scope)), data)`.

### Groups and the 21 blocks as built

| Group | Blocks (`width`, `ignoresBrandFilter`) |
| --- | --- |
| **Headline** | The six KPIs (full) |
| **Availability** | By governorate (half) · By SKU (half) · By channel (half, ignores) · Why the shelf was empty (half) · Gaps by SKU and governorate (full) |
| **Shelf** | Shelf battle by governorate (full, ignores) · Shelf share by brand (half, ignores) |
| **Pricing** | Distance from list by SKU (half, ignores) · Price compliance by governorate (half) · How far from list (half) |
| **Assortment** | SKU penetration (half) · Range compliance by channel (half) · Range by SKU and governorate (full) |
| **POSM** | Presence by material (half) · Where POSM is missing (half) · POSM by channel (half) |
| **Competition** | Competitive scoreboard (full, ignores) · Price position (half, ignores) · Who leads where (half, ignores) |
| **Health** | Portfolio brand health (half, ignores) · Market health by governorate (half) |

**Insights are not blocks.** A live finding can stop firing between
cycles, and a saved report quietly losing a panel is a worse failure
than not offering it. Charts only.

---

## 5 · Storage and sharing

### Storage
- One key, `<product>.reports.v1`, in `localStorage`, holding the array.
- An **external store** (`useSyncExternalStore`) so the rail, the index
  page and an open report all reflect the same list the instant any one
  of them changes it — renaming a report in its header must move it in
  the sidebar without a reload.
- Hydrate **on first subscription**, not from an effect: `subscribe` is
  the one moment React guarantees during commit.
- The server snapshot is a **module-level constant empty array** (not a
  fresh literal — `useSyncExternalStore` compares by identity), and a
  separate `ready` flag whose server value is `false`.
- Reads are defensive: bad JSON → `[]`; rows without `id`, `name` and an
  array `blocks` are dropped. A write failing (private mode, full quota)
  is swallowed — the session stays correct in memory.

### The share link — this is the sharing mechanism
A report that cannot leave the browser is not a report. With no backend,
"visible to everyone" can only mean "visible in this browser"; a
colleague on another machine opens an empty list. So:

- The whole definition serialises into a URL:
  `/<index route>?r=<base64url>`.
- Payload is minimised: `{ n: name, b: [[blockId, scope?, title?], …] }`.
- **Base64url over UTF-8 bytes**, not `btoa` on the string — `btoa`
  throws on anything outside Latin-1, and a report named in Arabic is
  entirely likely. `+`→`-`, `/`→`_`, padding stripped.
- It carries the **name** as well as the blocks; a link reproducing the
  panels under the wrong title would be sharing a different document.
- **Decoding produces a NEW report** — fresh ids, fresh timestamps.
  Opening someone's link gives you your own copy to edit, not a shared
  object two people disagree about with no server to arbitrate.
- A malformed or truncated link returns `null` and the page says the
  link could not be read, rather than building half a report.

### Ownership
None until there is a backend. Every report is visible to anyone using
this browser and any report can be deleted. When a backend arrives,
reports move to it and gain an owner; **no shape above changes**.

---

## 6 · Screens

### 6.1 Index — "Reports you built" (`/reports/custom`)

- Header: title, one-line lead, **New report** button (primary).
- `New report` creates immediately and routes to
  `/reports/custom/<id>?new=1`. Nothing is gated.
- States: *hydrating* → "Reading your reports…"; *empty* → an empty
  state explaining what a report is plus a **Build one** button; *has
  reports* → a responsive card grid (1 / 2 / 3 columns), newest edited
  first, each card showing name and `N blocks · edited <month>`.
- **This page is where a share link lands.** On mount with `?r=`:
  decode → `upsertReport` → toast "Added <name> to your reports" →
  `router.replace` to the new report. A ref guards against adopting the
  same link twice (React mounts effects twice in development).
- A standing footnote states honestly that reports live in this browser
  and that the link is how to reach a colleague.

### 6.2 The report (`/reports/custom/[id]`)

**Header row** (wraps; all controls `print:hidden`):
- Editable title on the left.
- `Add block` (primary) · `Copy link` · `Print` · `Delete report`.
- `Delete report` confirms with a native confirm naming the report,
  then removes, toasts, and navigates to the index.
- `Copy link` writes the share URL to the clipboard, toasting "Link
  copied — it carries the whole report", with a fallback toast telling
  the reader to copy the address bar if the clipboard is unreachable.

**Title control**
- Not editing: a button showing the name with a pencil icon; click
  enters edit.
- Editing: an input, autofocused and **selected**. Enter or blur
  commits; **Escape restores the previous name**. An empty or unchanged
  name commits nothing.
- `?new=1` opens straight into edit mode — the first thing anyone does
  with a new report is name it.
- The draft is seeded when editing **starts**, not synced from the prop
  by an effect.

**States**
- Store not hydrated → a card reading "Opening the report…".
- No report at that id → a card: "No report with that address", a lead
  explaining reports live in the browser that made them, and a link to
  all reports.

**Empty report**
One large dashed panel — "+ / Add your first block" — and beneath it
"or start with one of these" offering **four one-click starters** (the
headline KPIs, availability by governorate, the shelf battle, the
competitive scoreboard). A wholly empty page with a single button
teaches nothing about what the report can contain.

**The grid**
`grid gap-4 lg:grid-cols-2`; a `full` block spans both columns
(`lg:col-span-2`), a `half` block takes one. Every cell is `min-w-0`.

**Each block card**
- Uses the product's ordinary card, so a block looks like what it
  looked like where the reader first met it.
- Title = `block.title ?? def.label`; `lead` and `footnote` from the
  catalogue.
- Header right, in order: **scope chips** (if overridden) → drag handle
  → settings menu. The chips are outside the `print:hidden` wrapper;
  the controls are inside it.
- Chips are written in the reader's words, not ids: month label,
  governorate/channel/brand/SKU **names**, and `N <noun>` once more than
  two values are selected ("3 governorates").
- If a `ignoresBrandFilter` block carries a brand/SKU override, the
  footnote is **appended** with a sentence saying that part of the scope
  does not apply to it, because the chip must not claim it did.
- A `blockId` the current build does not know (from an old share link)
  renders a card saying so and naming the id, rather than a gap the
  reader has to guess at.

### 6.3 Add — the block picker (right-hand drawer, 420px)

- **Click appends; the drawer stays open.** Adding four blocks is four
  clicks, not four round trips. Dragging *to add* solves the wrong
  problem — when adding, nobody has an opinion about position yet.
- Subtitle states the catalogue size: "N to choose from — click to add,
  keep clicking to add more".
- Search field filters on label + description, case-insensitive.
- Grouped list; each row: schematic glyph, label, one-line description,
  and a `×N` count if the block is already on the report. **Count, not
  disabled** — the same chart at two scopes side by side is a legitimate
  report and the commonest reason to want per-block scope at all.
- A leading **"You use these"** group of up to 4, derived from the
  reader's *own reports* (most used first) rather than a separate
  recently-used list that would eventually disagree with them.
- Arrow Up/Down walk the entries from the search field; Enter adds (the
  browser does that once focus is on a button). Escape closes.
- Empty search result says: Nothing matches "<query>".
- Adding toasts "Added <label>".

### 6.4 Configure — one menu per block

A single ⋮ control top-right, opening a 248px popover with three panes.
All actions behind one control: a toolbar on every card would compete
with the figure it exists to show.

*Menu pane*
`Scope` (with a right-hand hint reading **"its own"** or **"the page"**)
· `Rename` · `Duplicate` · `Download CSV` *(only if `def.csv`)* · ── ·
`Move up` (disabled at index 0) · `Move down` (disabled at the end) ·
── · `Remove` (in the critical colour).

*Scope pane*
- Heading "This block only", a `Back` control, and the line: "Leave a
  control empty and this block follows the filters at the top of the
  page."
- A **Period** single-select whose first option is "Follow the page",
  then one multi-select per filter dimension, all summarising as
  "Follow the page" / "N selected". **The same filter controls the
  header uses** — never a second filter vocabulary.
- Brand-comparison blocks show **no brand or SKU control**, plus an
  explanatory line. Absent, not present and ignored.
- If the block has an override, a **"Follow the page again"** button
  clears it.

*Rename pane*
Heading "What this block is here to say", an autofocused input seeded
with the current title, Enter or `Save` commits, `Use the default`
clears the override. Saving a value equal to the catalogue label stores
nothing.

Outside click and Escape close the menu; opening always returns to the
menu pane.

### 6.5 Reorder

- **HTML5 drag from a handle**, not a motion library's reorder: those
  measure along one axis and this is a two-column grid where a block
  moves sideways as well as down.
- Only the handle is `draggable` — a whole draggable card swallows text
  selection and fights every control inside it.
- `dataTransfer.setData("text/plain", …)` is required (Firefox refuses
  to start a drag without payload); `effectAllowed = "move"`.
- The carried card drops to 40% opacity; the hovered target gets a
  2px accent ring with offset.
- A drop calls **`moveBlock`** — the same operation the keyboard path in
  the menu calls. One operation, two ways in.

### 6.6 Navigation

```
REPORTS                     +
  <standing report page 1>
  <standing report page 2>
  ─────
  Q4 Baghdad review
  POSM deep dive
  All 7 reports
```

- `+` on the group heading creates and opens a report with its name
  selected (same gesture as the index's New report).
- The reader's reports list beneath the standing pages, newest edited
  first, **capped at 5**, with an "All N reports" overflow link to the
  index. A sidebar that grows without limit stops being navigation.
- Rail links preserve the current filters, like every other rail link.

---

## 7 · Export

Three routes, no server:

1. **Copy link** — §5, the only thing that crosses to another person.
2. **Print** — `window.print()`. The print stylesheet must: hide the
   rail, header, section tabs and every `print:hidden` control; unroll
   anything that scrolls (`overflow: visible; max-height: none`); drop
   card shadows and set `break-inside: avoid` on cards; set a page
   margin; strip `a[href]::after` URL printing; and **force scope chips
   visible with explicit border and colour** (I4).
3. **Per-block CSV** — from the block menu, computed over the block's
   own resolved view (I8), filename `<product>-<report>-<block>-<month>`.

---

## 8 · Deliberately out of scope

Text and heading blocks (a report is figures first; prose blocks invite
a document editor) · multi-column layouts beyond half/full · cross-
filtering between blocks · derived or computed blocks (anything not
already a product figure) · scheduling, email delivery, server-side PDF ·
templates and cross-user duplication · undo history beyond a single undo
of Remove · insight blocks (§4).

---

## 9 · Build order

| Phase | Carries |
| --- | --- |
| A | Store + model: types, editing functions, URL serialisation, tests |
| B | Registry: every block as a pure `(view) => ReactNode`, each rendered under deliberately awkward scopes including one reaching no rows at all |
| C | The page: route, header, editable title, empty state, packed grid, scope chips, delete — plus the index and the share-link landing, so the feature is reachable and a link resolves |
| D | Add: drawer, grouping, search, click-to-add, schematics, arrow-key walking, "You use these" |
| E | Configure: the one menu — scope, rename, duplicate, move, remove, CSV |
| F | Reorder: drag from a handle, dropping onto `moveBlock` |
| G | Nav + index: `+` on the group, capped rail, overflow link |
| H | Export: copy link, print stylesheet, per-block CSV |

B is the phase that looks small and is not. Budget for it.
