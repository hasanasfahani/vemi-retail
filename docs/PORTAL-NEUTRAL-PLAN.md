# Client portal: neutral frame, universal status colours (plan)

Status: **approved 27 Sep 2026** (N1–N6 as recommended, see §8).
**All six phases done** (build notes and the requirements check in §10). Written after the
brand refresh (docs/BRAND-REFRESH-PLAN.md) shipped the portal fully in
Vemi colours.

This plan changes the **portal only**. The website, the access modal,
emails and share cards stay fully Vemi-branded.

It supersedes two approved decisions, for the portal only:
- **D1**: health bands without traffic lights.
- **D2**: client series in Violet.

---

## 1. The direction in one line

**The portal is the client's room; Vemi built it and signs it.**

The problem with today's portal:
- It reads as a Vemi product demo painted in Vemi colours.
- Pepsi's data is violet. Coca-Cola's is Ink.
- Urgency is a violet-to-Ink ramp that a commercial director has to learn.

In a client portal:
- **Neutrals carry the page.**
- **Universal colours carry urgency.** Green is fine, yellow means watch,
  orange means act, red means act now. Nobody needs a legend.
- **One quiet data colour marks "your portfolio".**
- **Vemi appears at a distance.** The signature, the actions Vemi performs
  for you, and where you are.

## 2. Colour roles: the balance

Each colour has exactly one job, and no colour borrows another's.

| Role | Colour | Where it appears | Target share of screen |
|---|---|---|---|
| **Neutral frame** | Cool greys, white cards, near-black text | Page ground, cards, text, lines, axes, secondary buttons, skeletons | ~85–88% |
| **Vemi** (identity, Vemi's actions, "where you are") | Violet (Violet 700 for text) | Logo and wordmark, primary buttons (Request follow-up audit, Request a quote, Export), focus ring, links, selected nav icon, selected tab underline | ≤5% |
| **Your data** | One data blue, plus two greys | Chart series: your portfolio = blue, key competitor = dark grey, others = light grey | ~4% |
| **Status / urgency** | Green · yellow · orange · red | Band chips, map pins, heat cells, bars measured against a target, alerts, delta colouring | ~3% |

Three rules make the balance hold:
1. **Status colours never draw a series.** A red line must never be
   mistaken for "critical".
2. **Violet never draws data.** Violet is Vemi talking, not the client's
   numbers.
3. **Status colour is rationed to small marks.** Chips, dots, pins, cells
   and thin bars only. Never a full card fill, a page band or a header.

## 3. The status system (the previous colours, returned and made accessible)

The PRD's four bands stay. Only their colour changes.

The pre-brand portal used green `#0CA30C`, yellow `#FAB219`, orange
`#EC835A` and red `#D03B3B`. Those hues come back. Each band now has
separate tokens for marks and for text:
- the old green as white text failed AA;
- the yellow is invisible as a thin mark on white.

| Band | Previous | Fill (marks) | Tint (chip ground) | Text / icon | Glyph | Contrast |
|---|---|---|---|---|---|---|
| Strong | `#0CA30C` | `#1E9E4A` | `#E6F5EC` | `#146C36` | check-circle | text on tint 5.8:1 · fill on white 3.5:1 |
| Average | `#FAB219` | `#F2B21B` + edge `#A87A00` | `#FDF3D8` | `#7A5600` | minus-circle | text on tint 6.0:1 · edge on white 3.9:1 |
| Needs attention | `#EC835A` | `#E0672A` (shipped; darkened from the proposed `#E8702E`) | `#FDECE2` | `#A2431A` | triangle-alert | text on tint 5.5:1 · fill on white 3.4:1 |
| Critical | `#D03B3B` | `#B42318` (shipped; darkened from the proposed `#D23B3B` for CVD, see §10) | `#FBE8E8` | `#A82828` | octagon-alert | text on tint 5.9:1 · fill on white 6.6:1 |

The values are a starting point. The final values go through a contrast
check and a colour-blindness (CVD) check before shipping; see §7, phase 6.

**Never colour alone.**
- Every chip keeps its **word + glyph**.
- Pins and heat cells keep their number, tooltip and legend.
- Red and green merge for red-green colour-blind users, which is why the
  glyph shapes differ per band.

### Every existing status vocabulary, mapped

| Where | States | Treatment |
|---|---|---|
| Health bands (KPIs, POS, governorates, SKUs, map, heatmap) | Strong / Average / Needs attention / Critical | Green / yellow / orange / red, as above |
| Follow-up outcome | Improved / Mixed / No material change / Worsened / Pending | Green / yellow / neutral grey / red / grey outline |
| Follow-up request workflow | Requested / Scheduled / In progress / Completed / Cancelled | **Neutral.** These are workflow states, not urgency: grey chips with an icon. Only *overdue* turns red. |
| Insight priority | High / Medium / Low | Red / orange / neutral |
| Insight direction | Risk / Win | Red glyph / green glyph beside the title; the card itself stays neutral |
| KPI deltas | ▲ / ▼ / flat | Colour by **outcome**, not direction. Each metric's polarity says which way is better (the watchlist already holds `goodDirection`): better = green, worse = red, inside the detection floor = grey "flat". The arrow still shows direction and the words stay. |
| AlertChip (one per view) | the view's single alert | Red tint with the octagon glyph. Signal amber leaves the portal, because amber would now read as "Average". The one-alert-per-view rule stays. |
| Confidence (measured / estimated / stale) | data quality | **Neutral**, not status. Measured = solid dark dot, estimated = dashed outline, stale = grey. It moves off Violet 100. |
| Form errors | validation | Critical red (the same meaning as before) |

### Marks that take the band colour

- **Bars measured against a target.** This covers the availability bar
  in the hero KPI, the KPI gap bars, the POSM and price-compliance bars,
  and score rings. The fill takes the band; the target tick stays
  near-black.
- **Map pins and clusters.** A cluster takes its worst band, and critical
  pins get a ring. Map tiles stay greyscale so pins are the only colour.
- **Heatmap cells.** Four bins in band tints with the number printed and
  a 1px edge.
- **Shares, counts and trends are not judgements** and stay in data
  colours (§4).

## 4. Data colours (charts)

| Series | Today | Proposed |
|---|---|---|
| Your portfolio | Violet | **Data blue** `#2F6BD8` (5.0:1 on white) |
| Key competitor | Ink | Dark grey `#3A3F4A` |
| Others | Slate | Light grey, about `#8E94A0` (≥3:1 on white) |
| Portfolio split (D2 toggle) | Violet ramp | Blue ramp: 4 steps, with an outline on the lightest |
| Market baseline or benchmark band | Violet 100 | Neutral grey 100 |
| Target / goal line | — | Near-black dashed |

Why blue:
- It is the least loaded hue in business dashboards.
- It stays clear of all four status hues.
- It is kept apart from Vemi violet by **role**: blue only ever appears
  inside a chart, and violet never does.

Colour still follows the entity, never its rank.

**Deferred:** the client's own brand colour for "your portfolio",
configurable per client. When it comes, it must obey one rule: it cannot
be red, green, yellow or orange. Coca-Cola red would read as critical, so
a colliding brand colour falls back to data blue.

## 5. The neutral frame, element by element

| Element | Today (fully Vemi) | Proposed (neutral with Vemi at a distance) |
|---|---|---|
| Page ground | Warm Paper `#F5F4EF` | Cool grey `#F5F6F8` |
| Cards | White, Line `#E2E0D8` | White, neutral line `#E3E5EA`; still flat, no shadow |
| Text | Ink `#15133A` (navy-violet) | Near-black `#16181D` |
| Muted text | Slate `#6B6A80` | Neutral grey `#5E6470` (5.9:1 on white) |
| Left rail | Violet 100 active pill | Neutral grey pill, near-black semibold label, **violet icon** on the active item |
| Rail header | Vemi logo | Vemi logo stays (the signature), slightly smaller |
| Rail foot | Month progress card with violet bar | Neutral card; the bar takes its band colour ("on track" = green) |
| Page header | Client line in mono caps | **The client leads**: "Baghdad Soft Drinks" in 15/600 with "Pepsi · Iraq" beside it; a monogram tile in neutral (a real client logo upload is deferred) |
| Primary buttons | Violet | **Stay violet.** These are the things Vemi does for the client (audit, quote, export). |
| Secondary / text buttons | Neutral / violet text | Neutral, with violet only on links |
| Tabs, segmented controls | Violet 100 / violet | Near-black selected text with a violet underline; segmented selected = white with a hairline |
| Focus ring | Violet | Stays violet |
| KPI hero value | Ink | Near-black; delta coloured by outcome (§3) |
| Confidence badges | Violet 100 "Measured" | Neutral (§3) |
| Sample-data banner | Dashed mono chip | Unchanged, in neutrals |
| Skeletons | Violet 100 blocks | Grey 100 blocks |
| Favicon (portal tab) | Ink tile | Unchanged: it is the Vemi signature |
| Exports and print | Violet | Neutral pages with the status colours; "Prepared by Vemi" footer with the logo |

**What stays Vemi, on purpose:**
- the logo and favicon;
- the type (Instrument Sans + IBM Plex Mono labels);
- the radii, spacing and flat card style;
- primary actions, focus, links and the selected-state accent;
- the access modal and everything before the portal opens.

That is the "distance": the product looks like the client's control room,
and every signature detail says who built it.

## 6. How it would be built (technical)

- **A scoped token layer, not a rewrite.**
  - Add `[data-surface="portal"]` to `brand/tokens.css`, set on the
    portal layout root. It redefines the neutral `--vm-*` values for
    bg, surface, line, text, muted, primary-tint, chart-* and focus.
    Violet primary stays.
  - Components keep reading `--vm-*`, so the website is untouched. This
    is how the dark set already works.
- **New tokens:**
  - `--vm-status-{strong|average|attention|critical}-{fill|tint|text|edge}`;
  - `--vm-data-1..3` and `--vm-data-portfolio-1..4`;
  - neutral `--vm-neutral-100` for baselines and skeletons.
  - Tailwind classes to match: `bg-status-critical-tint`,
    `text-status-strong-text`, and so on.
- **One switch point for status.** `components/market/ui/health.ts`
  (`BAND_COLOR`, `BAND_EDGE`, `BAND_CLASS`) and the `.vm-band--*`,
  `.vm-alert` and `.vm-badge--*` rules in `vemi-components.css`. About 20
  consumers read these, so most of the portal changes colour from this
  one place.
- **Deltas.**
  - `KpiCard` and `components/market/KpiCard` take a `polarity`
    (`"up" | "down"`).
  - Polarity comes from one metric table, extending `kpiLabels` with the
    watchlist's `goodDirection`.
  - Add a unit test so "more gaps" can never render green.
- **Charts.** `components/market/charts/theme.ts` maps `SERIES3` and the
  portfolio ramp to the data tokens. Target bars read the band.
- **Guardrails.**
  - `brand:check` adds a rule: status and data tokens outside `app/portal`
    and `components/market` produce a warning, so the website stays pure.
    `AlertChip` counts stay.
  - The contrast script from phase 8 gains the new pairs.
  - The brand skill and `docs/BRAND-REFRESH-PLAN.md` get a
    "portal surface" section, so future work follows the split.

## 7. Phases (each one a local commit, verified with before/after screenshots)

1. **Tokens and status chips.**
   - Portal surface tokens, status tokens, BandChip, StatusChip, Badge,
     AlertChip and the legend.
   - Update the `/kit` sheet to show both surfaces.
2. **Status marks.**
   - Map pins and clusters, heatmap, gap bars, KPI target bars, score and
     coverage rings.
   - The month-progress card and follow-up outcome chips.
3. **Deltas by outcome.** Polarity table, KpiCard, StatCard, the
   watchlist, and tests.
4. **The neutral frame.**
   - Ground, text, lines, rail, page header with client identity, tabs,
     confidence badges, skeletons, banner.
5. **Chart series.** Data blue, the grey competitor and others, the blue
   portfolio ramp, neutral baselines, target lines.
6. **QA.**
   - Contrast on every pair, plus a DOM scan of all 15 portal surfaces.
   - A CVD simulation of the four fills.
   - Keyboard pass, and print/PDF check.
   - brand:check, tsc, lint, tests, and `next build` with every route
     still static.
   - Full before/after screenshots for your review.

## 8. Decisions for you

| # | Question | Recommendation |
|---|---|---|
| N1 | Status palette: the previous four colours (green, yellow, orange, red), or three (red, amber, green) with attention and critical sharing red? | **Four.** The PRD has four bands, and orange for "act" versus red for "act now" is the difference a field manager uses. |
| N2 | Colour for "your portfolio" in charts: neutral data blue, keep Vemi violet, or the client's own brand colour? | **Data blue now.** The client's colour is deferred, with the rule that it can never be a status hue. |
| N3 | Page ground: cool neutral grey or keep warm Paper? | **Cool grey.** Paper is the most "Vemi" surface there is; grey reads as the client's tool. |
| N4 | Primary buttons: stay violet or go near-black? | **Violet.** They are Vemi's service actions and the main place the brand is felt. |
| N5 | Client identity in the header: client name now, logo upload later? | **Name now** (text plus neutral monogram). Uploading real client logos raises trademark questions and is a later feature. |
| N6 | Scope: portal only, while the website, access modal and emails stay fully Vemi? | **Portal only.** |

## 9. Risks and how they're handled

- **Red and green are indistinguishable to about 1 in 12 men.** Every
  band has a distinct glyph and its word, pins carry a legend, and the CVD
  simulation is a ship gate.
- **The rainbow effect.** Status colour appears only on small marks. At
  most one AlertChip per view, and no status-coloured card or page fills.
- **Yellow legibility.** Yellow marks always have their darker edge, and
  yellow text is never used (chip text is the dark `#7A5600`).
- **Blue and violet read as one accent.** They are separated by role
  (blue only inside charts, violet only outside them) and by hue: blue
  sits about 25° away from violet.
- **Needs-attention orange on the grey ground** is 2.9:1, just under 3:1.
  Darken the fill a step (to about `#DD6426`) during phase 6 if the
  validator agrees.
- **Drift back to "fully branded".** A brand:check rule plus the skill
  update keep the two surfaces distinct.

## 10. Build notes

### Phase 1: tokens and status chips (done)

- **Tokens.** `brand/tokens.css` now holds:
  - `--vm-status-{band}-{fill|tint|text}` plus `--vm-status-average-edge`
    (Tailwind: `bg-status-*` / `text-status-*`);
  - a `[data-surface="portal"]` scope, set on the portal layout root.
  - Attention fill is `#E0672A`, one step darker than proposed, to clear
    3:1 on every ground.
  - No portals exist, so drawers and dialogs inherit the scope.
- **Chips.**
  - `BandChip` gains a `neutral` tone and a glyph per tone: check, minus,
    triangle, octagon, and a dot for neutral. The glyphs are new in the
    icon set.
  - Inside the portal the chips take the status tint and text; the
    website and `/kit` keep the violet ramp.
  - `AlertChip` takes a `band`; the Executive alert is red with an
    octagon.
  - `/kit` shows both surfaces.
- **Swatches follow the chips.** The status chip's cut-off panel and the
  notification list read `BAND_SWATCH`, so a chip never disagrees with
  its own explanation. Pins, heat cells, bars and the **map legend**
  still read `BAND_COLOR` and move in phase 2. The legend explains pins,
  so it moves with them, not in phase 1 as §7 said.
- **States that aren't judgements go neutral:**
  - follow-up "pending" and "no material change";
  - watch "out of scope";
  - insight priority "low".
  - Follow-up "mixed" is yellow.
  - Insight cards say priority with its urgency colour and glyph (high
    red, medium orange).
- **Fixed on the way.** A KPI card's status popover was painted over by
  the next card's labels (a `z-10` layer capped it). The active card now
  lifts (`hover/focus-within:z-20`).
- **Checks:**
  - contrast DOM scan of the executive, performance, competition,
    insights and watchlist pages and `/kit`: clean;
  - tsc and eslint: clean;
  - 270 tests pass;
  - brand:check: 0 errors, 0 warnings;
  - `next build`: OK.

### Phase 2: status marks (done)

- **Role tokens, not violet steps.** `brand/tokens.css` gains a family
  that every drawn band reads:
  - `--vm-mark-{band}` fill, `-edge`, pin `-ring`, and `-on` (text on the
    mark);
  - `--vm-mark-alarm`;
  - `--vm-gauge-{band}`;
  - `--vm-heat-bad-{0..4}` with `-on-{n}`.
  - The Vemi values reproduce plan D1 exactly. The portal scope
    redeclares them all, because a `var()` inside a custom property
    resolves where it is declared.
  - The phase-1 swatch aliases fold into this.
- **health.ts is the one map.**
  - `BAND_COLOR`, `BAND_EDGE`, `BAND_RING`, `BAND_ON`, `MARK_ALARM`,
    `BAND_GAUGE`, `GAUGE_EDGE`.
  - The map, the drawer, the block glyph and the heatmap stop naming
    `--vm-band-*` directly.
- **Map.**
  - Pins take their band, and yellow gets its dark edge as its ring.
  - Clusters take their typical band, with the count in the text colour
    made for that fill: 9.4:1 on yellow.
  - The ring for hidden criticals is red.
  - The help text names the colours.
- **Failure heatmap.** Green → yellow → orange → red tints, with solid
  red for the worst fifth. Each number is in its band's text colour.
  The neutral magnitude ramp stays violet until phase 5, since it is
  data, not a judgement.
- **Everything measured against a target takes its band:**
  - KPI card gauges, the performance hero bar, `Gauge` (new `band`
    prop);
  - brand and governorate score bars, report score bars (score bands);
  - the coverage strip, ring and rail month card (green on track, orange
    behind);
  - gap bars (ahead = green), and `Bar` with a `par` and no explicit
    colour.
  - Bars with a brand's own colour stay data.
  - Help text now says "dark tick" instead of "Ink tick".
- **Noted for later phases:**
  - Trends' "amber dot" and the shelf footnote's series wording:
    phase 5.
  - The Monthly Report's violet cover band: phase 4.
- **Checks:**
  - contrast scan clean on the executive, performance, competition,
    POS explorer (admin), follow-up, trends, setup and reports pages;
  - tsc and eslint: clean;
  - 270 tests pass;
  - brand:check: 0 errors, 0 warnings.

### Phase 3: deltas by outcome (done)

- **One rule for "is this good news".** `lib/market/outcome.ts`:
  - `BETTER` gives the polarity for every measure: rates and the score
    are "up", gaps found is "down".
  - `deltaOutcome()` returns better, worse, flat (inside the detection
    floor) or neutral (no polarity stated, so never guessed).
  - Unit tested, including "more gaps can never read better".
- **Delta.**
  - The colour comes from the outcome (`--vm-delta-better` /
    `--vm-delta-worse`): green / red in the portal, Violet 700 / Ink on
    the Vemi surface.
  - The arrow and sign still carry direction, and screen readers hear
    ", better" or ", worse".
  - `goodUp` is replaced by `better`.
  - All KPI tiles, the brand and governorate health cards, the trend
    tables, follow-up evidence and the watchlist pass their polarity.
  - The Reports opportunity count is a count, not a change, so it stays
    neutral.
  - "N above target" on a KPI tile reads green.
  - The gap figure beside each gap bar is judged against a target
    (ahead green, behind red) and only stated against a reference such
    as list price.
- **Shared `KpiCard`** takes an optional `delta.outcome`; `/kit` shows
  it.
- **Bug fixed: the watchlist ignored polarity.**
  - Before: a watch on gaps found, readings above or below list (target
    0) or worst price variance (target 5) read "Target reached" the day
    it was pinned, and a rise in failures read "Moving toward target".
  - Now: `WATCH_BETTER` states each watch's direction, `watchState`
    honours it, and a test guards it.
- **Fixed on the way:** the lead brand's health card truncated "Pepsi"
  to "Pe…" at 1280.
  - The brand's role ("Lead brand" / "Portfolio brand") now sits under
    the name on every card, so the scores still line up.
- **Checks:**
  - contrast scan clean on the executive, trends, competition and
    pricing pages and `/kit`;
  - tsc and eslint: clean;
  - 276 tests pass;
  - brand:check: 0 errors, 0 warnings;
  - `next build`: OK.

### Phase 4: the neutral frame (done)

- **Tokens.**
  - Cool neutrals `--vm-neutral-50…900` are raw values at `:root`.
  - The portal scope maps bg, surface, line, line-strong, text, muted,
    the selection tint, the scrim and the focus-ring ground onto them.
  - Violet primary, its hover, Violet 700 links and the focus colour
    stay.
  - Checked: text on the ground 16.4, muted on white 5.9 / on the ground
    5.5 / on the tint 5.2, control border 3.5 :1. Muted on the tint
    failed in the Vemi palette (4.3) and now passes.
  - The page ground reaches the viewport edges (`html:has(...)`).
- **Selection** keeps a Violet 700 label on a grey field (filters, table
  chips, toggles), so "selected" is still marked in Vemi's colour at a
  fraction of the area.
- **Rail.**
  - The active item is a grey pill with a near-black label and a violet
    icon.
  - The Vemi logo stays, at 20px (was 24).
  - The month card is neutral with its band-coloured bar.
- **Page header: the client leads.** A neutral monogram tile
  (`components/portal/ClientMark`), "Baghdad Soft Drinks" in 15/600,
  "Pepsi · Iraq" muted, then "/ page name". The mono caps line is gone.
- **Monthly Report cover** is no longer the violet report-cover band.
  - It is a white page with the client's mark and name, and one violet
    action (Export PDF); Excel and Share are neutral.
  - Its foot reads "Prepared by" with the Vemi logo, and it prints as it
    reads.
- **Confidence badges.** Measured is neutral with a solid dark dot;
  estimated stays dashed and stale stays grey.
- **Notes** (executive digest, competition caveat, follow-up request
  note) are plain text on grey, not violet prose.
- **Unchanged, as planned:**
  - tabs (near-black label, violet underline) and segmented control
    (white selected option) already matched;
  - the sample-data banner and skeletons follow the tokens;
  - the favicon, primary buttons and focus ring.
- **Checks:** tsc and eslint clean, 276 tests pass, brand:check 0
  errors, 0 warnings. The contrast scan runs in phase 6.

### Phase 5: chart colours (done)

- **Tokens.** Raw `--vm-data-*` values (data blue, the two greys, a
  four-step blue portfolio ramp, a five-step blue magnitude ramp). The
  portal scope maps `--vm-chart-1/2/3`, `--vm-chart-base/grid`,
  `--vm-portfolio-1…4`, the new `--vm-heat-0…4` and `--vm-chart-marker`
  onto them, so every chart that already read the series tokens changed
  from one place.
- **Validated with the dataviz script** (light):
  - CVD ΔE 23.8, normal-vision ΔE 24.2, contrast ≥ 3:1 — pass.
  - The lightness-band and chroma-floor flags on the greys are the
    emphasis form (client in hue, rivals in neutrals), as with the Vemi
    series.
  - Both ramps are monotone in OKLab L.
  - Heat text is near-black on the light steps and white on the two
    dark ones (≥ 4.98:1).
- **Series.** Your portfolio is data blue, the key competitor dark grey,
  others grey. The portfolio split steps down the blue ramp, with its
  lightest step outlined. Baselines, grids, sparkline areas and hover
  cursors are neutral.
- **Direct violet removed from charts:**
  - the magnitude heatmap (now `--vm-heat-*`), split bars, the block
    glyph and the plain `Bar` default (now `chart-1`);
  - the shelf scene's detection box and label (now near-black: it
    annotates data, and violet never draws data).
- **The trend's notable-month dot** is near-black in the portal; amber
  would read as "Average". Signal amber is now nowhere in the portal.
- **Your brand outside charts.** The client's scoreboard and setup cards
  take a data-blue border; "Your brand" / "Active" tags are neutral.
- **Copy.** The shelf footnote says "Blue is your portfolio, dark grey
  is Coca-Cola, light grey is every other brand"; the trends footnote
  names the dark target line and the black dot.

### Phase 6: QA and the requirements check (done)

**Found and fixed in QA:**
- **Red vs orange** were too close even with full colour vision
  (dataviz validator, all pairs: ΔE 9.6, below the 15 floor), and red vs
  green merged for red-green colour-blind users (ΔE 3.1).
  - The critical fill moved to `#B42318`, the product's own danger red.
  - Now: normal-vision ΔE 15.9; the CVD worst pair is orange/green at
    7.3, inside the 6–8 band that is legal only with secondary
    encoding.
  - Every status mark has that encoding: chips have word and glyph,
    pins a legend, tooltip and a larger critical size, and heat cells
    their number.
- **Colour inheritance leaked Ink into the portal.**
  - `body` resolves `--vm-text` outside the scope, and any element that
    set no colour of its own inherited that computed Ink. The rail was
    the visible case.
  - A base rule now restarts `color` at every `[data-surface]` /
    `[data-theme]` scope.
- **Printed pages kept the grey ground.** The portal root prints white
  now.
- **The header monogram showed on phones.** `ClientMark`'s own
  `inline-flex` beat the `hidden` passed to it; it is now wrapped.

**Checks run:**
- **Contrast.**
  - DOM scan of every portal surface, as a visitor and as admin
    (executive; performance ×5 tabs; competition; insights with an open
    drawer; consumers; follow-up; POS explorer; watchlist; monthly
    report; custom reports; trends; setup; users), plus the website,
    `/kit` and the 404: 0 text pairs under AA.
  - `scripts/contrast-check.mjs`: 48 token pairs across both surfaces,
    now part of `npm run brand:check`.
- **Vemi colours left in the portal** (the same scan): only the intended
  ones. That is the logo, primary buttons, the rail's active icon, the
  bell's unread dot, and the "on" state of notification toggles (a
  selected control). The website is unchanged: Paper ground, Paper text
  in its dark band.
- **Keyboard.** The rail and header tab in order. The focus ring is
  violet `#5E57F1` once its colour transition settles. Escape closes an
  insight drawer, clears the URL and returns focus to "Open analysis".
- **Print.** The monthly report prints white, with the client's mark,
  "Prepared by Vemi" and the status colours.
- **Mobile, 375px.** No horizontal scroll; the header fits.
- **Gates:**
  - tsc clean;
  - eslint 0 errors (3 old warnings in data scripts);
  - 276 tests pass;
  - brand:check 0 errors, 0 warnings;
  - `next build` OK, every portal route still static.

**Requirements check, against this plan:**

§1 and §2 (roles and the three rules):
- Neutral frame, Vemi violet at a distance, data blue for your data,
  status colours on small marks: done.
- Status colours never draw a series; violet never draws data: done.
- No status-coloured card, band or header: done.

§3 (status):
- Four bands with fill, tint, text, the yellow edge and a glyph each:
  done.
- Health bands: done.
- Follow-up outcomes (improved green, mixed yellow, no change and
  pending neutral, worsened red): done.
- Workflow stages neutral, with a stage icon: done. "Overdue turns red"
  does not apply: the current portal has no overdue state (the old
  dashboard that had one was deleted).
- Insight priority (high red, medium orange, low neutral): done.
- Insight direction (a red or green glyph beside the title, card
  neutral): done.
- Deltas by outcome, with polarity and a unit test: done.
- AlertChip red with an octagon, one per view, Signal amber gone from
  the portal: done.
- Confidence badges neutral: done.
- Form errors in the critical red: done.
- Marks: target bars, gap bars, score bars, map pins, heat cells: done.
  Two built differently:
  1. A cluster takes its *typical* band plus a red alarm ring when it
     holds any critical outlet, not its worst band. The worst band
     would paint most clusters red and hide the distribution; the ring
     still makes criticals impossible to miss.
  2. The failure heatmap uses five relative steps (four tints, then
     solid red), not four band bins. Its cells count failures, which
     have no band cut-offs.

§4 (data):
- Series blue / dark grey / grey: done. "Others" is `#858B97` (3.4:1).
- Blue portfolio ramp with an outlined lightest step: done.
- Neutral baselines, near-black dashed target line: done.
- The client's own brand colour: deferred, as planned.

§5 (frame): every row done:
- ground, cards, text, muted, rail, logo 20px, rail foot;
- the client-led header;
- primary buttons violet; text buttons and "How to read this" toggles
  neutral;
- tabs and segmented control, focus, KPI value;
- confidence, banner, skeletons, favicon;
- exports and print, with "Prepared by Vemi" on the monthly and custom
  reports.

§6 (technical):
- Scoped token layer, status and data tokens with Tailwind classes, the
  role map in health.ts: done.
- Deltas: named `better` rather than `polarity`, sourced from
  `lib/market/outcome.ts` BETTER and `WATCH_BETTER`, with the unit
  test: done.
- Charts via the series tokens: done.
- brand:check `portal-only-colour` warning: done.
- The contrast script: done.
- Skill and brand-plan sections: done.

§7 (phases): 1–6 done, each committed locally.

§8 (N1–N6): all applied as recommended.

§9 (risks): all addressed:
- CVD: darker red plus secondary encoding.
- Rainbow effect: status colour on small marks only.
- Yellow: always edged, never text.
- Blue vs violet: kept apart by role.
- Orange on grey: darkened to `#E0672A`.
- Drift: brand:check and the skill.

