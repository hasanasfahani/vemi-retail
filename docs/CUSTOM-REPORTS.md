# Custom Reports — plan

A reader builds their own page: name it, add blocks, give each block its
own scope, reorder, share.

Nothing here is implemented. This is the plan and the decisions it needs.

---

## 0 · The one decision that shapes everything else

**What is the thing a user adds?**

The brief says "charts". If that is taken literally the product becomes a
chart builder: pick a chart type, pick a measure, pick a dimension. Every
generic BI tool works this way and it is the wrong answer here, because
this portal's charts are not generic. `RankedBars` of availability by
governorate is not "a bar chart of a number" — it is a measurement with a
stated denominator (listings, never outlets), a calibrated target line, a
footnote explaining what it excludes, and a status chip whose cut-offs
were argued against this panel. Strip that and you get a portal that can
draw anything and vouch for nothing.

So the unit is a **BLOCK**: a named finding that already exists somewhere
in the portal, carrying its own data builder, its own chart type, its own
footnote and its own explanation. "Availability by governorate" is a
block. "A bar chart" is not on the menu.

This costs the user nothing they would actually miss — nobody wants to
choose between a dot plot and a bar for the same figure — and it means a
custom report is as defensible as the page the block came from.

Everything below follows from that.

---

## 1 · Three places I would change the brief

### 1.1 · Click to add. Drag to reorder.

The brief has the user drag a chart from the side panel onto the page.
Drag is the more expensive interaction to build, the slower one to use,
and unusable from a keyboard without a parallel path.

It is also solving the wrong problem. When ADDING, the user has no
opinion about position yet — they want the block on the page. When
REORDERING they have a very specific opinion, and that is where dragging
earns its keep.

**Recommend:** click (or Enter) in the panel appends the block to the end
of the report and scrolls to it. Drag is for reordering blocks already on
the canvas, with "move up / move down" in each block's menu as the
keyboard path. `framer-motion` is already a dependency and does
drag-with-layout-animation, so no new package.

### 1.2 · Create first, rename in place

The brief creates the page, puts the name in edit mode, and grants access
"once the user confirms the name". That leaves two bad states: an
abandoned rename (an empty "My Report" nobody meant to make) and a
modal-ish gate in front of an empty page.

**Recommend:** the + creates the report immediately and navigates to it.
The title is an inline editable heading, focused and selected on arrival.
Enter or blur commits; Escape keeps "My Report". Nothing is gated. The
same control is how you rename later, so there is one rename interaction,
not two.

Duplicate names are allowed — the id is the identity — because forbidding
them means a validation dialogue in the first three seconds of the
feature.

### 1.3 · A report that cannot leave the browser is not a report

Everything the portal stores lives in this browser's `localStorage`, and
for a watchlist or a follow-up queue that is honest. A REPORT is
different: its purpose is to be sent to somebody. Stored only locally, the
feature quietly fails at the thing it is named after.

**Recommend:** the report definition is small — an ordered list of block
ids plus a scope each. Serialise it into the URL as well as storing it, so
`?r=<encoded>` reproduces the exact report for anyone who opens the link.
Local storage is then the convenience (your reports are in your rail) and
the URL is the sharing mechanism. No backend, nothing pretending.

---

## 2 · The block catalogue

Everything below already exists as a computed figure. The catalogue is a
registry over them, grouped the way the reader thinks rather than by the
module they live in.

| Group | Blocks |
| --- | --- |
| **Headline** | The six KPI tiles · Execution score ring · Coverage |
| **Availability** | By governorate · By channel · By SKU · Why the shelf was empty · SKU × governorate gaps |
| **Shelf** | Shelf battle (governorate / channel / retailer) · Share by brand · Eye-level conversion |
| **Pricing** | Distance from list by SKU · Compliance by governorate · How far from list · Price position |
| **Assortment** | SKU penetration · Range by SKU and governorate · Compliance by channel |
| **POSM** | Presence by material · Weakest governorates · By channel |
| **Competition** | Competitive scoreboard · Who leads where · Price against shelf |
| **Health** | Brand health cards · Governorate health cards |
| **Findings** | Top decision insights · One outcome category |
| **Follow-up** | Verified before/after results |

Each registry entry declares: `id`, `label`, `group`, one-line
description, which data builder it calls, which chart renders it, its
default width (half or full), and whether it needs a comparison period.

**A block is a pure function of a `MarketView`.** That is already true of
every builder in `lib/market`, which is why this is a registry and not a
rewrite.

---

## 3 · Data model

```
CustomReport = {
  id, name, createdAt, updatedAt,
  /* The report's own scope. Blocks inherit it unless they override. */
  scope: Filters,
  blocks: ReportBlock[]
}

ReportBlock = {
  id,            /* instance id — the same block may appear twice */
  blockId,       /* registry key */
  width: "half" | "full",
  /* Only the dimensions this block overrides. Absent = inherit. */
  scope?: Partial<Filters>,
  /* The reader's own words, where the block's default title is not
     what they are using it to say. */
  title?: string
}
```

Stored under `vemi.reports.v1`, in the external-store shape the watchlist
and targets already use, so every surface sees one list.

---

## 4 · Scope — the crux, and the invariant it breaks

Every page in this portal obeys one rule: **one filter bar, one slice,
every figure on the page computed over it.** `PageShell` exists to enforce
it — pages receive a view, never a filter object, so no page can quietly
compute its figures over a different slice than its header advertises.

Per-block filters break that rule on purpose. A report comparing Baghdad
against Basra side by side is a legitimate thing to want and cannot be
expressed under one global filter.

So the rule is replaced rather than abandoned:

- The report has a scope, shown in the normal filter bar, and it is the
  default for every block.
- A block may override any dimension. An overridden block **states its own
  scope on its face**, as a chip in its header — not in a settings panel,
  not on hover. A figure whose slice differs from the page's must say so
  where the figure is.
- Blocks that inherit show nothing extra. Silence means "the bar above".

Without that chip this feature manufactures exactly the class of error
the portal has spent its whole build avoiding: two numbers that look
comparable and are not.

---

## 5 · The flows

**Create.** `+` in the Reports rail group → creates `My Report` → routes
to `/portal/reports/custom/<id>` → title focused and selected.

**Empty.** One large dashed panel filling the canvas: "Add your first
block", with the four or five most-used blocks offered directly beneath as
one-click starters. A wholly empty page with a single button teaches
nothing about what the report can contain.

**Add.** The button opens a right-hand `Drawer` — the same one the insight
detail uses. Grouped list, search, one-line description each, a small
preview thumbnail if cheap. Click appends and the drawer stays open, so
adding four blocks is four clicks rather than four round trips. A block
already in the report shows a count, not a disabled state — repeats are
legitimate (the same chart, two scopes, side by side).

**Configure.** Each block has one settings control in its top-right,
opening a small popover: Scope · Width · Rename · Duplicate · Move up ·
Move down · Remove. Scope opens the same filter controls the header uses,
never a second filter vocabulary.

**Reorder.** Drag the block by its header. Layout animates. Keyboard users
use Move up / Move down.

**Persistent controls.** The report header holds: the editable title, the
filter bar, `Add block`, and the report's own menu (Rename · Duplicate ·
Export · Delete). These stay visible while scrolling — a report of twelve
blocks must not require scrolling to the top to add a thirteenth.

---

## 6 · Navigation

The Reports group gains a `+` on the group heading and lists the user's
reports beneath the two standing pages:

```
REPORTS                    +
  Monthly Reports
  Historical Trends
  ─────
  Q4 Baghdad review
  POSM deep dive
```

The rail is static today (`lib/market/nav.ts` is a const), so it needs to
read the report store. Cap the rail at five, newest first, with "All
reports" beyond that pointing at an index page. A sidebar that grows
without limit stops being navigation.

**Routing:** `/portal/reports/custom/[id]`. The existing `/portal/reports`
keeps its name. If the two ever read as competing, the fix is renaming the
standing one to "Monthly summary", not nesting custom reports somewhere
less obvious.

---

## 7 · Export

Reuse what the insight drawer settled: browser print for a PDF-shaped
artefact, per-block CSV where the block has a table behind it, and the
shareable `?r=` link. A report is the surface most likely to be printed,
so the print stylesheet matters more here than anywhere else — blocks must
not split across pages, and every overridden scope must print on its
block.

---

## 8 · Phases

| | | Carries |
| --- | --- | --- |
| **A** ✅ | Store + model | `reports.ts`, external store, URL serialisation, 22 tests |
| **B** ✅ | Registry | 21 blocks across 8 groups, each a pure `(view) => ReactNode`. Every block rendered under 8 deliberately awkward scopes, including one that reaches no outlet at all |
| **C** | The page | Route, header, editable title, empty state, block grid |
| **D** | Add | The drawer, grouping, search, click-to-add |
| **E** | Configure | Settings popover, per-block scope with its chip, width, duplicate, remove |
| **F** | Reorder | Drag with `framer-motion`, keyboard move |
| **G** | Nav + index | Rail group, `+`, cap and overflow page |
| **H** | Export | Print stylesheet, CSV, share link |

B was the one that looked small and was not, and the brand-filter
interaction resolved differently than planned. Handing every block both
a filtered view and a brand-unfiltered one, and trusting it to pick, is
a rule a block can silently break — declare `ignoresBrandFilter`, read
the filtered view anyway, and nothing fails until somebody scopes a
report to one brand. So the choice is made OUTSIDE the block by
`scopeForBlock`, and the context carries the single view that choice
produced. A block cannot get it wrong because it is never offered the
alternative.

---

## 9 · Deliberately not in the MVP

- Text and heading blocks (a report is figures first; prose blocks invite
  a document editor)
- Multi-column layouts beyond half/full width
- Cross-filtering between blocks
- Derived or computed blocks — anything not already a portal figure
- Scheduling, email delivery, PDF generation server-side
- Templates and duplication across users
- Undo history beyond a single undo of Remove

---

## 10 · Answered, 10 Sep

1. **Period** — a report follows the GLOBAL filters. It pins nothing. A
   block that wants a different slice says so per block, and that
   override is the only thing that escapes the header. So `CustomReport`
   carries no scope of its own: the header is the scope.
2. **Insights are not blocks.** Charts only. A live finding can stop
   firing between cycles, and a saved report quietly losing a panel is a
   worse failure than not offering it.
3. **The layout is automatic.** A block declares its own natural width in
   the registry and the grid packs them; the reader cannot place blocks
   and so cannot break the page. `ReportBlock` therefore has no `width`.
4. **No ownership until there is a backend.** Every report is visible to
   anyone using the portal, and any report can be deleted.

   ONE HONEST CAVEAT ON THAT. With no server, "visible to everyone" can
   only mean "visible in this browser". `localStorage` is per-browser and
   per-device; another person on another machine sees an empty list. The
   share link is what actually crosses that gap today, and the plan's
   §1.3 is the reason it exists. When the backend arrives, reports move
   to it and gain an owner; nothing above changes shape.

## 11 · Original open questions

1. **Does a custom report obey the global period, or pin its own?** A
   report titled "September review" that silently becomes October is a
   different document. My recommendation: the report stores its period,
   and the header says so; changing it is explicit.
2. **Is the block catalogue open to the Insights blocks?** A live insight
   is not a stable figure — it may vanish next cycle when its rule stops
   firing. A block that disappears from a saved report needs a designed
   empty state ("this finding no longer fires").
3. **Half-width blocks: does the reader place them, or does the grid
   pair them?** Manual placement is more control and more ways to make a
   page look broken.
4. **Who is the audience for the printed artefact** — the person who built
   it, or a customer of theirs? That decides whether the print layout
   carries the Vemi frame or strips it.
