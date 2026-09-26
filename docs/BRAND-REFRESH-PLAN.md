# Vemi brand refresh: website + client portal

Status: **plan, awaiting approval** · Written 26 Sep 2026
Source of truth: `Vemi Branding/` (Brand Guide v1.0 PDF, `BRAND.md`,
`vemi-brand-kit/`, and especially `Vemi Dashboard Branding/vemi-claude-code-kit/`).
Where this plan and the kit disagree, the kit wins, except for the
decisions listed in §2, which the user settles.

---

## 0. The direction in one paragraph

The new identity is the **Insight V**: many signals at the surface
filter down into one decision. Every screen should work the same way.
The page is **warm Paper, not cool gray**. **Ink** carries the words and
**one Violet** carries the client and the action. **Signal amber
appears once per view**, and only when something is actually wrong.
Surfaces are flat and border-first, with no gradients, glass, glows or
colored status stripes. Numbers are set in **IBM Plex Mono** labels next
to **Instrument Sans** figures, and every figure says **when** it was
measured and **how many outlets** it covers. The website becomes an
editorial Paper page built around the Insight V key visual. The portal
becomes a calm instrument: each page leads with the decision and then
shows the evidence behind it.

---

## 1. What exists today (audit)

| Area | Today | Brand v1.0 |
|---|---|---|
| Fonts | Space Grotesk (display) + Inter (body), `app/fonts/*` | Instrument Sans (UI + display), IBM Plex Mono (labels, data, timestamps), IBM Plex Sans Arabic |
| Violet | `#6748fd`, hover `#4b30e0`, tints `#f1eeff` / `#e3ddff` | `#5E57F1`, text/hover `#3F37C9`, on-dark `#7F79F6`, tint `#E8E7FD` |
| Ground | cool canvas `#f6f7f9`, white body | Paper `#F5F4EF` page, White `#FFFFFF` cards |
| Text | 6-step cool ink ramp (`ink-900…300`) | Ink `#15133A` + Slate `#6B6A80`. That's it |
| Lines | `#e7e8ec` / `#d8dae0` | Line `#E2E0D8` (decorative), Line-strong `#8A889E` (controls, 3:1) |
| Status | green / amber / orange / red bands on every KPI, pin, pill, ring | No red/green encoding. Signal amber only as **one** AlertChip per view. Danger red only for form errors |
| Radii | 2, 3, 7, 8, 9, 10, 12, 14, 18, 22, 30 px (11 values) | 6 · 10 · 16 · 24 · pill (5 values) |
| Shadows | 4 tokens + 6 one-off shadows, cards shadowed | None on cards. `raised` only on the active segment; `overlay` on menus, drawers, dialogs |
| Type sizes | 20 sizes incl. 10, 10.5, 11, 11.5, 12.5, 13.5 px (186× `text-[11px]`) | Scale 12 · 14 · 15(ui) · 16 · 18 · 22 · 28 · 36 · 44 · 56 · 72. **Nothing below 12** |
| Logo | Cropped PNG wordmark (`public/vemi-logo*.png`) + CSS invert filter | Insight V mark + outlined wordmark, SVG, color / black / white, 4 lockups |
| Browser icons | One `app/icon.png` (512², RGB, no transparency) | favicon.ico + favicon.svg + 16/32/48 PNG + apple-touch + android 192/512 + manifest + theme-color + OG 1200×630 |
| Hero | Violet gradient + two radial glows, glass nav pill, Title Case headline | Flat Paper, Insight V key visual, sentence case, no blur |
| Charts | Pepsi portfolio in a 4-step violet ramp, 2 grays, donut, score rings, green sparkline | Series order Violet → Ink → Slate, Violet 100 baseline, one Signal flag dot. No pies, radar, dual axes |
| Guardrail | none | `brand-check.mjs` fails the build on raw hex, Tailwind palette, off-brand fonts |

Size of the job, measured:

- **~1,550 token class usages** (`ink-*` 996, `violet*` 368, `line*` 364,
  `canvas` 86). Most color already flows through tokens, which is why a
  token remap (§4) can recolor ~80% of the product in one step.
- **135 status-color usages** through `var(--color-good|warn|serious|critical)`
  in `health.ts`, charts, map, pills and rings. This is the hardest
  conflict (decision D1).
- **83 raw hex values in 12 files** (Hero, Footer, CoverageMap,
  PlanogramScene, ShelfScene, Heatmap, MarketMap, charts/theme, health.ts…).
- **~520 sub-12px text usages** that must move up to 12 or 14.
- **Gradients in 11 files** (hero, footer, skeleton shimmer, evidence cards,
  shelf scene, a legend, a diverging bar).
- **Dead code: 74 files / 13,629 lines** reachable only from the legacy
  `/dashboard` (Erbil) routes, which `next.config.ts` already redirects
  to `/portal`. None of it renders for any visitor (decision D3).
- Three separate icon sets: `components/ui/Icon`, `components/v2/Icon`,
  `components/market/Icon`.

Live surface after the cleanup: **1 marketing page (9 sections + nav,
footer, 2 modals)** and **13 portal destinations** (Executive, Performance
×5 tabs, Competition, Insights, Consumers-locked, Follow-up Audits, POS
Explorer, Watchlist, Monthly Reports, Custom Reports index + builder,
Historical Trends, Audit Setup, Users & Settings), plus drawers,
overlays and the print layout.

---

## 2. Decisions needed from you (my recommendation first)

**D1 · Health bands without traffic lights.** The PRD's four bands
(Strong / Average / Needs attention / Critical) stay as a *concept*, but
they stop being green/amber/orange/red. I'd encode them the way the
brand encodes confidence, where **fill style carries the meaning, not hue**:

| Band | Chip | Map pin / heat cell | Gauge |
|---|---|---|---|
| Strong | Violet 100 fill, Violet 700 text, `▲ Strong` | Violet 100, small | violet fill past the Ink target tick |
| Average | White, 1px Line-strong border, Ink text | Violet 400 | violet fill just short of target |
| Needs attention | White, 1.5px **Ink** border, Ink text, `▼` | Violet | same, gap labelled in pts |
| Critical | **Ink fill**, Paper text, `▼ Critical` | Ink, larger | same, gap labelled |

Rule of thumb: **darker = needs you sooner**. The single worst item on a
page gets the page's one **Signal AlertChip** ("Critical · 29 outlets in
Basra"). Every chip keeps its word, so nothing relies on color alone.
*Alternative:* keep traffic lights as a documented exception. I advise
against it because red/green is exactly what the brand bans, and it's what
makes the current dashboard read as a generic template.

**D2 · Chart series.** The brand allows three series: client → key
competitor → others. I'd default every share chart to **Your portfolio
(Violet) / Coca-Cola (Ink) / Others (Slate)**. A "Split portfolio" toggle
breaks Violet into Pepsi · 7UP · Mirinda · Mountain Dew as Violet /
Violet 400 / Violet 100 + Violet outline, and only on charts that are
*about* the portfolio. *Alternative:* keep the six-brand stacks recolored
into the brand palette. That's legal but noisy, and it breaks the
"max 3 series" rule on every competition chart.

**D3 · Delete the legacy `/dashboard` product before restyling.** That's
74 files (13.6k lines) plus their tests (`lib/insights.test.ts`,
`lib/verification.test.ts`, `lib/portfolio.test.ts`). They're unreachable
because of the redirect, so restyling them would be wasted work.
Recommended: yes, as its own commit so it can be reverted. (Your standing
rule is to ask before removing them. This is me asking.)

**D4 · Headline and category language.** I'd adopt the brand tagline as
the hero: **"See every shelf. Know every move. Win every decision."**
(sentence case). I'd also rename the site title to **"Vemi · Market
intelligence platform for Iraq"**, because the brand says "retail audit"
is a capability and not what Vemi *is*. This touches copy, not only design.

**D5 · Delta wording.** The brand wants deltas to name a rolling window
("vs trailing 7 days"). The portal data is monthly, so a trailing-days
window would be invented. I'd name the actual comparison month instead:
**"▼ 2.7 pts vs Aug 2026"**. That keeps the rule's intent (always say
what you compared against) without inventing data.

**D6 · Phase 2, not now:** the **Ink dark theme** and **Arabic / RTL UI**.
The tokens will ship with the dark set and logical CSS properties, so
both are cheap to add later. Per the MVP scope rule, I'd master the light
English product first. The **bilingual lockup (vemi | ڤيمي) does ship
now** in the site footer, since it costs nothing and signals the Iraq market.

**D7 · Portal navigation stays a left rail.** The brand example shows a
top bar with four items, but the portal has 13 destinations in 5 groups,
which a top bar can't hold. I'll restyle the rail fully to the brand
(64px header row, mono group labels, violet-tint current pill). Just
flagging that this is a considered deviation, not an oversight.

---

## 3. Guardrails that apply to every phase

- One source of truth: **color, font, radius and shadow values live only
  in `brand/`**. Everything else uses `var(--vm-*)` or brand Tailwind
  classes. `npm run brand:check` must pass before every commit from
  Phase 3 onward.
- Every chart sits in a **ChartCard** with a real `soWhat` (a finding, not
  a description), `howToRead`, and an as-of line. Every metric shows
  **as-of + base** ("As of 26 Sep · 742 outlets").
- **One primary button per view.** **One AlertChip per view.** Controls
  **44px**. Focus ring **2px Violet with a 2px white gap** on every
  control.
- Violet as *text* is always `primary-text` (`#3F37C9`), never `#5E57F1`.
- No emoji, no exclamation marks, sentence case everywhere, uppercase only
  in mono labels.
- Portal framing rules still stand: the "Sample data" notice is the only
  place the portal admits it's illustrative (the brand kit agrees:
  "Label demo data 'Sample data'").
- Workflow (no auto-deploy; Vercel free plan): `tsc` → `eslint` → `vitest` →
  `next build` → `brand:check` → verify on localhost (desktop 1440,
  laptop 1280, tablet 768, phone 375) → **commit locally, never push**.

---

## 4. How the migration works technically (no big-bang rewrite)

**Stage A: bridge (Phase 1).** New brand tokens go in. The *old* utility
names (`ink-900`, `canvas`, `violet`, `line`…) are re-pointed at brand
values, so all ~1,550 class usages recolor at once with zero markup
changes, and each screen is screenshot-compared before and after.

| Old token | → Brand token | Value |
|---|---|---|
| `canvas` | `--vm-bg` | Paper `#F5F4EF` |
| `paper` / `#fff` | `--vm-surface` | `#FFFFFF` |
| `ink-900`, `ink-700` | `--vm-text` | Ink `#15133A` |
| `ink-600`, `ink-500`, `ink-400` | `--vm-text-muted` | Slate `#6B6A80` (also fixes ink-400's failing 2.67:1 contrast) |
| `ink-300` | `--vm-line-strong` | `#8A889E` (icons / control borders only) |
| `line` | `--vm-line` | `#E2E0D8` |
| `line-strong` | split: controls → `--vm-line-strong`; decorative → `--vm-line` | |
| `violet` | `--vm-primary` | `#5E57F1` |
| `violet-ink` | `--vm-primary-text` / `--vm-primary-hover` | `#3F37C9` |
| `violet-050`, `violet-100` | `--vm-primary-tint` | `#E8E7FD` |
| `good/warn/serious/critical` | band tokens per D1 | `--vm-band-strong/average/attention/critical` |
| `comp-1..3`, `chart-context` | `--vm-chart-2/3` | Ink / Slate |
| `stock-1..4`, `chart-prior` | portfolio ramp per D2 | Violet / 400 / 100 |

**Stage B: rename (Phases 5–7).** As each screen is polished, a codemod
renames classes to brand semantics (`text-text`, `text-text-muted`,
`bg-bg`, `bg-surface`, `border-line`, `bg-primary`, `text-primary-text`,
`bg-primary-tint`…). **Stage C (Phase 8):** delete the bridge aliases,
set `--color-*: initial` so Tailwind's default palette cannot be used,
and turn `brand:check` into a required step.

**Where the kit lands** (the repo has no `src/`, so paths adapt):

| Kit path | Repo path |
|---|---|
| `src/brand/*.css, *.ts` | `brand/` (tokens.css, tailwind-v4.css, tokens.ts, chart-theme.ts, format.ts) |
| `src/brand/fonts.css` | replaced by `next/font/local` in `app/layout.tsx` (same woff2 files). This keeps the Vercel local-font build fix and gives preload + zero layout shift |
| `src/components/vemi/` | `components/vemi/` |
| `public/fonts`, `public/brand`, favicons, manifest | `public/…` as in the kit; icons via Next 16 file conventions where they exist (checked against `node_modules/next/dist/docs` first, per AGENTS.md) |
| `.claude/skills/vemi-brand/`, `.claude/commands/brand-check.md` | `vemi-web/.claude/…` with paths corrected |
| `CLAUDE.brand.md` | appended to `vemi-web/CLAUDE.md` with paths corrected |
| `scripts/brand-check.mjs` | `scripts/brand-check.mjs`, scanning `app components lib`, allow-list `brand/`, `public/` |
| `Vemi Branding/` (4.3 MB source folder, untracked) | stays **out of git** (`.gitignore`), same as the earlier logo-artwork commit |

One correction to the kit: its `<Logo>` *types* the wordmark as live
"vemi" text, which contradicts the brand's own "never retype the
wordmark". Our `<Logo>` inlines the **outlined SVG paths** from
`vemi-horizontal-color.svg` with `currentColor` fills. That gives exact
artwork that still themes.

---

## 5. Phases

Each phase is one reviewable commit (or a small series), verified in the
browser, committed locally and not pushed.

### Phase 0 · Cleanup (on D3 approval)
- Delete `app/dashboard/**`, the 60 components/libs only it reaches, and
  their three test files. Keep the redirect.
- Delete `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`,
  `window.svg` (create-next-app leftovers), plus unused `components/ui/{CtaBand,FaqItem,Label,ReportReality,Icon}`
  and `components/v2/{Decisions,DecisionView}`.
- Verify: build, tests and every live route unchanged.

### Phase 1 · Foundation (tokens, type, bridge)
- Fonts: Instrument Sans 400/500/600(/700 reserved), IBM Plex Mono
  400/500, IBM Plex Sans Arabic 400/500/600 via `next/font/local`,
  exposed as `--vm-font-sans|mono|arabic`. Remove Space Grotesk + Inter.
- `brand/tokens.css` exactly as the kit, plus Vemi additions declared
  *inside* it: band tokens (D1), `--vm-scrim: rgba(21,19,58,.4)`,
  portfolio ramp (D2), map tints.
- `brand/tailwind-v4.css` imported after Tailwind. The bridge aliases
  from §4 live in `@theme`.
- Global base: `body` Paper, Ink, 16/24, antialiased, **no negative
  letter-spacing on body** (Inter's −0.011em goes). Selection Violet 100.
  Focus ring `0 0 0 2px surface, 0 0 0 4px focus` on `:focus-visible`
  site-wide (replaces the portal-only outline).
- Type classes rebuilt on the brand scale: `.vm-display` 72/76,
  `.vm-h1` 44/52, `.vm-h2` 32/40, `.vm-h3` 22/28, `.vm-body-lg` 18/28,
  `.vm-body-sm` 14/20, `.vm-label` mono 12/16 +0.1em uppercase,
  `.vm-data` mono 14/20, `.vm-num` tabular. Old `t-display / t-h2 / t-h3 /
  t-eyebrow / t-lead / tnum / mono` become aliases to these, then get
  renamed in Stage B.
- Sub-12px sweep, one rule for all ~520 cases: **labels and metadata →
  12 (mono if it's a label, sans if it's a sentence); body inside cards
  and tables → 14; 15 stays for buttons and tabs.** Nothing below 12. SVG
  chart text: axis 12 mono, direct labels 12–14 sans.
- Radii: 2–3 → 3 (chart bars only), 6–9 → **6** (chips, badges, skeleton),
  10–12 → **10** (controls), 14–18 → **16** (cards), 22–30 → **24**
  (hero panels, dialogs on the site), `rounded-full` → pill.
- Shadows: `--shadow-card` and `--shadow-surface` removed from cards.
  `--shadow-pop` becomes `--vm-shadow-overlay` (menus, popovers, drawers,
  dialogs, toasts). All six one-off shadows are deleted.
- Motion stays quiet: 160–220ms ease-out on color and opacity. **No hover
  lifts** (`-translate-y` goes on buttons and cards). The skeleton shimmer
  gradient becomes a flat Violet 100 block with an opacity pulse.
  `prefers-reduced-motion` keeps working.
- Verify: before/after screenshots of home + 5 portal pages. The only
  expected differences are palette, fonts, sizes and radii.

### Phase 2 · Identity assets (logo, browser icons, sharing)
- `components/vemi/Logo.tsx`: `Mark`, `Logo` (horizontal), `LogoDescriptor`
  (horizontal + "Market intelligence platform"), `LogoBilingual`, each
  as inline outlined SVG with tones `color | mono | reversed | onInk`
  (on Ink: Violet 400 mark + Paper wordmark, per the guide). Enforces
  the brand minimums: mark ≥16px, lockup ≥72px wide. Clear space = one
  block height, built into the component padding.
- Replace every `VemiLogo` PNG use (Nav, Footer, Sidebar) and delete
  `public/vemi-logo*.png`, `design/*.png`, and the CSS invert hack.
- Browser icons: `favicon.ico` (16/32/48), `favicon.svg`,
  `favicon-16/32/48.png`, `apple-touch-icon.png` (180),
  `android-chrome-192/512.png`, `site.webmanifest` (name Vemi,
  theme `#5E57F1`, background `#F5F4EF`), `<meta name="theme-color">`.
  Remove `app/icon.png`.
- Sharing: `openGraph` + `twitter` metadata with
  `vemi-og-share-1200x630.png`, title and description per D4,
  `metadataBase`. The portal gets the same icons and uses the **violet
  app-icon tile** favicon, so a portal tab is distinguishable from the
  website tab at a glance.
- A branded **404** (`app/not-found.tsx`): Paper, a small Insight V,
  "This page moved or never existed.", one secondary button back.
- Verify: tabs in Chrome/Safari light and dark browser chrome, iOS
  add-to-home, the OG preview via the metadata output.

### Phase 3 · Component library (`components/vemi/`)
Kit components ported to Tailwind v4 / Next 16 and extended for what the
portal already needs. Each existing `components/market/ui/*` primitive
is rebuilt on top of these, so page code changes as little as possible.

| Component | Spec (from kit) | Replaces |
|---|---|---|
| `Button` | 44px, radius 10, 15/600; primary Violet→Violet 700 hover; secondary white + Line-strong; text = Violet 700; `size="sm"` 36px only inside dense table rows | `.btn-primary/secondary/ghost`, ~40 ad-hoc buttons |
| `TextField`, `Select`, `Textarea`, `PhoneField` | 44px, white, Line-strong border, radius 10, label 14/600 above, hint 13 Slate, error 13 Danger written as the fix | access modal, quote form, filters, setup forms |
| `ConfidenceBadge` | 26px pill, mono 12 uppercase: Measured / Estimated / Stale | new: marks **IQD money figures as Estimated** (they're built on the assumed 1.5 units/facing/day) and field counts as Measured |
| `BandChip` | per D1 | `StatusChip`, `Badge` band variants, `.pill-*` |
| `AlertChip` | Signal fill, Ink text, warning icon, one per view | ad-hoc amber dots and pills |
| `KpiCard` | mono label → value → delta ▲/▼ + window → divider → mono as-of · base. Sizes: **`hero` 56px** (the first KPI row of a page, max 4) and **`compact` 36px** (secondary grids), both on the brand scale | `KpiCard`, `StatCard`, `StatTile` |
| `Gauge` | 6px track Line, Violet fill, 2px Ink target tick, gap label in pts | `KpiGapBar`, the colored progress bars, **all score rings** (the brand avoids pie and donut forms) |
| `ChartCard` | title + optional badge + actions → optional alert → **soWhat 18/28** → chart → footer: "How to read this" disclosure + as-of | `Card` wrappers around charts, `InfoTip` on charts |
| `SegmentedControl` | Paper track, white active chip, `shadow-raised` | view toggles (metric switchers, table/map) |
| `Tabs` | 44px, 15/600, 2px Violet underline, arrow keys | `market/ui/Tabs` (Performance, Insights) |
| `Card`, `PageHeader`, `Table` (`vm-table`: 44px rows, mono headers, right-aligned tabular numbers, selected = Violet 100) | kit | `market/ui/Card`, `DataTable` styling, all tables |
| `Dialog`, `Drawer`, `Toast`, `Menu/Dropdown`, `Tooltip` | surface, radius 16, `shadow-overlay`, scrim `rgba(21,19,58,.4)`, title 22/600, actions bottom-end | `Modal`, `Drawer`, `Toast`, `Dropdown`, `InfoTip` popover |
| `EmptyState` | h3 saying what's missing + when it arrives + one secondary button, no illustration | `EmptyState` |
| `Skeleton` | Violet 100 blocks at radius 6, same size as content | shimmer skeletons |
| `LockedRegion` | Paper card, mono "NOT IN YOUR PLAN", text button "Request full demo". Never opacity-only grey-out | `LockedOverlay` (currently blurs the page) |
| `Icon` | one set: 20px default (16/24), 1.75 stroke, `currentColor`, round caps | the three icon sets merged into one API. Swapping to lucide paths is deferred |
| `SignalField` | the brand pattern as generated SVG blocks on the 96-unit grid, 3 colorways, density fade toward content, ~1 in 20 accent | new: marketing only, never behind data |

- Verify: a hidden `/portal/_kit` style sheet page (not linked, `noindex`)
  that renders every component in every state, checked at 375 and 1440.
  It gets removed or kept per your call.

### Phase 4 · Chart and map system
- `brand/chart-theme.ts` from the kit + `BRAND_COLOR` rewritten per D2.
  Color follows the **entity**, never rank (existing rule, kept).
- Specs for all chart components (`components/market/charts/*`):
  horizontal gridlines only in `chart-grid`, no value-axis line, axis
  labels mono 12 Slate, bars ≤28px wide with 3px top radius, lines 2px,
  no dots except the active point, direct labels over legends, tooltips
  as `Tooltip` (surface, Line, radius 10, overlay shadow, mono label,
  ▲/▼ words), every `<svg>` with `role="img"` + summary `aria-label`,
  and a table view for export.
- Per chart: `StackedBars` → 3 series (D2) and a 100% CompositionBar
  where it's share. `ShareDonut` → **CompositionBar** (the brand avoids
  pies). `GapBars` / `SplitBars` → the brand's DivergingBar (gain vs
  loss vs month) with ▲/▼ labels. `DotPlot` → dumbbell (Aug → Sep):
  earlier point hollow Violet 400, current solid Violet. `Heatmap` →
  sequential Violet 100 → Violet → Ink (magnitude), band-labelled cells.
  `TrendChart` → Violet line, Violet 100 flat area, Ink dashed target
  line, one Signal dot on the single anomaly month. `BubbleScatter` →
  Violet client, Ink / Slate others, labelled. Sparklines → Violet 2px,
  never green.
- **Map (Leaflet):** tiles desaturated and warmed toward Paper with a CSS
  filter (no new tile provider in the MVP). Outlet pins per the D1 fill
  styles. Clusters are Ink circles with Paper mono counts, sized by count.
  Controls, attribution, tooltips and the legend use brand chrome (the
  legend is mono 12 with the band words). `CoverageMap` on the website
  gets the same treatment.
- `ShelfScene` (drawn shelf evidence): the shelf becomes Paper/Line
  instead of a gray gradient. Pack colors stay product-true because it's
  evidence, not UI. Gap and violation marks become an Ink dashed outline
  + label, with the view's one Signal mark reserved for the single worst
  gap.
- Verify: run every palette pair through the dataviz validator
  (contrast ≥3:1 for marks, CVD separation), record results next to the
  tokens (existing practice).

### Phase 5 · Portal shell (every page inherits this)
- **Sidebar rail** (236px / 68px collapsed): white surface, Line right
  border. Header row 64px: `Logo` 26px + collapse button (44px target).
  Group labels mono 12 Slate uppercase; items 44px, 15/500 Ink, icon 20
  Slate; hover Paper; current = Violet 100 pill + Violet 700 text +
  Violet icon; locked items Slate with a lock icon and "Soon" mono label.
  The reports "+" becomes an icon button with a tooltip. The "This month"
  footer card becomes a Paper card: mono label, `742 / 1,000` in mono 14,
  a Gauge, "9 days left" 12 Slate. The on-track word becomes a BandChip,
  not green text.
- **Top bar** 64px, white, Line bottom border: page title 18/600 + scope
  in mono 12 Slate ("BAGHDAD SOFT DRINKS · PEPSI · IRAQ"); end slot:
  notifications (44px icon button, unread = Violet dot, not red) + avatar
  (Violet 100 circle, Violet 700 initials).
- **Filter bar**: one row of 44px filter buttons with the mono label
  inline ("PERIOD  Sep 2026 ▾"), wrapping on narrow screens, with an
  "Active filters" count + "Reset" text button. It collapses to a
  one-line summary when the page scrolls. Today's two-row block goes away.
- **Sample-data strip**: Paper, Line bottom border, `ConfidenceBadge`-
  style "SAMPLE DATA" + one sentence in 14 Ink + **secondary** "Request a
  quote" (the page keeps its one primary for the page's own action).
- `LockedRegion` replaces the blur overlay on POS, Setup, Users, Trends,
  Actions, Watchlist gates. `FullDemoModal` → `Dialog`.
- `PosDrawer`, `InsightDrawer` → `Drawer` (480px, overlay shadow, Paper
  header band with mono outlet code, h3 name, BandChip).
- Page container: max 1360px, 24px side padding (16 on mobile), 32px top,
  24px card gaps, 48px between sections. Page order everywhere:
  PageHeader → (one AlertChip) → KPI row → ChartCards → tables.
- Print stylesheet updated to the new classes (rail, top bar, filters,
  banners hidden; Ink-only figures; chips keep borders).

### Phase 6 · Portal pages, one commit each

For every page the pattern is the same: `PageHeader` (mono eyebrow scope
· 44/52 title written as the decision · one-line description), at most
one AlertChip, a hero KPI row, then ChartCards with **data-driven
`soWhat` sentences** generated from the same functions that compute the
figures (never static text). The page-specific work:

1. **Executive Dashboard** (`/portal`): coverage strip → Card with Gauge
   `742 / 1,000 audited · 74.2%` and pace in mono. Market health 6 KPIs →
   one hero row of 3 (Availability, Shelf share, Execution score, 56px)
   + a compact row of 3 (Assortment, Price compliance, POSM), each with a
   Gauge-to-target, a BandChip and a delta vs Aug. Green and orange
   sparklines become violet. Brand health rings → brand rows: name, share
   composition bar, Gauge, BandChip. "Key decision insights" cards: the
   category pill becomes a neutral mono tag, the big figure 28/600, the
   "Estimated" badge on IQD figures, and "Open analysis" becomes a
   **secondary** button (four primaries on one screen today). "Where it is
   happening" map → ChartCard with a soWhat ("Basra holds 11 of 29
   critical outlets") and a SegmentedControl for the metric.
2. **Performance** (5 tabs: Availability, Shelf & visibility, Pricing,
   Assortment, POSM): brand Tabs. The top KPI row stays per tab. Every
   chart → ChartCard. The assortment matrix → sequential Violet cells +
   mono headers, sticky first column, 44px rows.
3. **Competition**: scorecard bars → per-brand rows in series order.
   The 4 KPI tiles → compact KpiCards with Measured badges. "Shelf
   battle" → 3-series CompositionBar per governorate (D2) with the
   Split-portfolio toggle; map as above.
4. **Insights**: Tabs + insight cards (title as a finding, evidence line
   in mono, Estimated/Measured badge, secondary action) + InsightDrawer.
5. **Consumers**: locked nav item → `LockedRegion` page if reached.
6. **Follow-up Audits**: KPI row, request flow as a Dialog with brand
   fields, `FollowUpEvidence` before/after with ShelfScene, verification
   shown as a Measured badge + "Verified by re-audit on [date]" (existing
   rule: only a re-run rule grants verification).
7. **POS Explorer**: `vm-table` with sortable mono headers, BandChip
   column, row → Drawer. Map / table SegmentedControl.
8. **Watchlist**: `WatchEye` toggle restyled (watching = Violet, not
   watching = Line-strong outline, 44px target). Sparkline rows → table
   rows with inline sparkline + delta.
9. **Monthly Reports**: the report is the printed artifact, so it gets a
   **report-cover header** in the brand's cover style (Violet block
   panel, white `Logo`, mono "MONTHLY MARKET REPORT", 44/52 title,
   "[Category] · [Month Year]"), then sections. Print output checked at A4.
10. **Custom reports** (index + builder): block cards, block menu/picker
    → Menu + Dialog. Scope chips keep their print rule, restyled to
    Violet 100 / Violet 700.
11. **Historical Trends**: TrendChart spec, windows via SegmentedControl.
12. **Audit Setup**, 13. **Users & Settings**: forms on TextField/Select,
    tables on `vm-table`, KPI tiles compact.

Each commit is verified by a click-through of every interaction on that
page, a keyboard pass (tab order, focus ring, Tabs arrow keys, Escape
closes drawers and dialogs), and 375 / 768 / 1280 / 1440 screenshots.

### Phase 7 · Website (one page, every section)

Target proportion across the scroll: **Paper ~55 · Ink ~20 · Violet ~12
· Violet 100 ~7 · Slate ~3 · Signal ≤1**. Rhythm: Paper sections
separated by Line hairlines, **one Ink band** and **one Violet band**,
with 96px section padding on desktop and 64px on mobile. Container 1200px.

| # | Section | Treatment |
|---|---|---|
| — | **Nav** | Full-width sticky bar, 72px, white, Line bottom hairline once scrolled. No floating glass pill, blur or shadow. `LogoDescriptor` ≥1024px, `Logo` below. Links 15/500 Ink, scroll-spy current = Violet 100 pill + Violet 700. One primary "Explore the dashboard" (44px). Mobile: 44px menu button → full-width white sheet under the bar, 48px rows, CTA at the bottom. |
| 1 | **Hero** | Paper. Left: mono eyebrow "MARKET INTELLIGENCE PLATFORM · IRAQ", `vm-display` 72/76 headline (D4), 18/28 Slate lead, primary + secondary buttons, then a mono proof line "1,000+ POS · 16 governorates · weekly field cycle". Right: the **Insight V key visual** as live SVG on the Signal field, dense at the edge and fading toward the headline. On load the seven Violet blocks settle row by row (surface → convergence → insight point), 600ms total, off under reduced motion. Below, full width: the portal in a white panel, radius 24, 1px Line, no shadow. **The screenshot is re-shot from the rebranded portal** (`vemi-performance-dashboard.png`, 2830×1416). |
| 2 | **Visibility gap** | Paper. h2 32/40 left, 4 gap items as a numbered list (mono "01–04", h3 18/600, 14 Slate), `GapWidget` rebuilt as a brand DivergingBar "Reported vs actual" in a ChartCard-lite (soWhat + as-of). The red bullet dots become mono numerals. |
| 3 | **Retail intelligence** | White. `CapabilityExplorer` → vertical brand Tabs on the left (icon 20, title 15/600, one-line 14 Slate; current tab = Violet 100 pill, never a colored side-border, which the brand bans), preview panel on the right as a product card with a real brand chart per capability. `PlanogramScene` recolored to Paper/Line/Violet. |
| 4 | **Insight to action** | Paper. Photo cards: photography in radius 16 frames with a solid white caption panel (the logo never sits on a photo). "WHAT HAPPENS NEXT" mono label, h3 22/600, steps as mono "STEP 1–3" with a 1px Line connector. The photo tag chip ("01 · Availability gap") becomes a white chip with mono text. |
| 5 | **Trust** | White. 6 evidence items in a 3×2 grid: icon 24 Violet, h3 18/600, 14 Slate. `EvidenceCard` loses its gradient and becomes a real audit photo with a mono metadata strip "ERB-204 · 12 SEP 2026 · 14:02 · GEO-TAGGED" and a Measured badge (evidence-first voice). |
| 6 | **Market intelligence (Beyond)** | **The Ink band.** Ink ground, Ink 800 Signal field at the far edge, Paper text, Violet 400 accents (Violet on Ink only at ≥24px). `BeyondExplorer` tabs on Ink: current = Ink 800 pill + Paper text. Photography in radius 16 frames. |
| 7 | **Proof** | Paper. Coverage figures in `KpiCard`-style tiles (56px values, mono labels, "Sample figure" note where `placeholder: true`, which is honest and on-voice). `CoverageMap` per Phase 4. |
| 8 | **Request / quote** | White card on Paper, radius 24. QuoteForm on brand fields (44px, visible labels, errors as fixes), step indicator in mono, one primary "Request quote". Success state: h3 + one sentence, no exclamation. |
| — | **Closing band** | **The Violet band**, styled like the brand's report cover: Violet ground, white-14% block field fading from the corner, mono eyebrow, 44/52 white headline "See the market clearly. Move before it changes.", white button with Violet 700 text. |
| — | **Footer** | Ink. `LogoBilingual` in the onInk tone, mono column titles, links 15 Paper at 80% opacity (checked to ≥4.5:1) hovering to Paper, legal line mono 12. No gradient. |
| — | **Access modal** | `Dialog`: 560px, radius 16, scrim, `Mark` 24 top-left, h3 title, fields on brand inputs, provisioning steps as a mono checklist with Violet ticks, success → route. |

- Copy pass (voice rules): sentence case on every heading and button
  (today: "See What's Happening. Know Where to Act."), no Title Case, no
  exclamation, numbers with units and time.
- `metadata` per D4. Section anchors unchanged, so external links keep
  working.
- Verify: full-page screenshots at 375 / 768 / 1280 / 1440, Lighthouse
  a11y ≥ 95, no horizontal scroll at 375, reduced-motion pass, keyboard
  pass through nav, tabs, form and modal.

### Phase 8 · Lock-in and QA
- Remove bridge aliases, set `--color-*: initial`, delete old
  `globals.css` utilities that no longer have callers.
- `npm run brand:check` passes with **0 errors** (raw hex, rgb, Tailwind
  palette, off-brand fonts) and 0 unreviewed warnings (gradients, emoji,
  "previous visit" wording). A `brand-check-ignore` comment is allowed
  only on ShelfScene pack colors (product-true evidence).
- Contrast audit of every text pair against the brand's approved list.
- Full test suite, `next build` (every portal route still static),
  final screenshots of all 14 surfaces for your review.
- Install the kit's `vemi-brand` skill + `/brand-check` command and merge
  `CLAUDE.brand.md`, so every future change is held to the brand
  automatically.

---

## 6. Deferred on purpose (phase 2)

- Ink dark theme toggle (tokens ready from Phase 1).
- Arabic UI + RTL (`lang="ar" dir="rtl"`, Plex Sans Arabic, logical
  properties already used by the kit components).
- Swapping icon paths to lucide-react (the unified `Icon` API makes it a
  one-file change later).
- A licensed muted map tile provider (CARTO or MapTiler) instead of the
  CSS filter.
- Split-portfolio toggle on charts beyond Competition, if D2 is approved.
- Email signature, LinkedIn/X covers, avatars: assets exist in the kit
  but aren't part of the website.
- Removing `framer-motion` if nothing needs it after the hero rebuild.

## 7. Risks and how they're handled

- **Scale of visual change in one go.** Handled by the bridge (Phase 1
  is a pure token swap) and one commit per page after that.
- **Denser text at 12/14 minimum makes cards taller.** Expected and
  intended (the brand wants 44px rows). KPI grids get the hero/compact
  split so the Executive page doesn't double in height.
- **Removing traffic-light colors changes how a sales director scans.**
  Mitigated by the band words on every chip, "darker = sooner", and one
  Signal alert naming the worst problem in a sentence. Confirm with D1
  before Phase 4.
- **Tests asserting old strings or classes.** Updated in the same commit
  as the change they cover. No test gets deleted to make a build pass
  (except the dead-route tests in Phase 0, with your approval).
- **Hero screenshot drifting from the real product.** It's re-shot in
  Phase 7 *after* the portal is done, from the real route.
