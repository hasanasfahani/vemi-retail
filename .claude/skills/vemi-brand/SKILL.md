---
name: vemi-brand
description: Vemi brand and UI system. Use for ANY user-facing work in this repo — the marketing site, portal pages, components, charts, tables, forms, empty states, copy — and whenever styling, colors, fonts, the logo, icons or dark mode come up. Read before writing UI code.
---

# Vemi brand for this repo

Vemi is a **market intelligence platform** for FMCG brands in Iraq. The identity idea is the **Insight V**: many signals at the surface, filtered down, resolving into one decision. Every screen should feel like that: calm, precise, evidence-first, one clear takeaway.

Installed from the brand kit (`Vemi Branding/Vemi Dashboard Branding/vemi-claude-code-kit`, kept out of git) with paths adapted to this Next.js app. The migration record, every approved decision (D1–D7) and each deliberate deviation from the kit are in `docs/BRAND-REFRESH-PLAN.md`; read its section 8 before changing a pattern.

## Where things live

| Path | What |
|---|---|
| `brand/tokens.css` | The ONLY place color values exist. `--vm-*` variables, light (Paper) and dark (Ink, `data-theme="dark"`), plus the Vemi additions (band ramp, portfolio ramp, `--vm-ink-800`, `--vm-scrim`, `--vm-paper`). |
| `brand/tailwind-v4.css` | Tailwind theme. `--color-*: initial` removes the default palette; only brand classes compile (`bg-primary`, `text-text-muted`, `border-line`, `bg-band-critical`…). |
| `brand/fonts.ts` | `next/font/local`: Instrument Sans, IBM Plex Mono, IBM Plex Sans Arabic (files in `brand/fonts/`). |
| `brand/tokens.ts`, `chart-theme.ts`, `format.ts` | Typed tokens, chart colors, number/date formatting. |
| `components/vemi/` | Brand components + `vemi-components.css`. Use these before writing new UI. Live sheet at `/kit`. |
| `app/globals.css` | Base, the `vm-*` type classes, site layout (`.container-vemi`, `.section`), map chrome, print. No colour values. |
| `lib/market/asOf.ts` | "As of 21 Sep 2026" and "vs Aug 2026" wording. |
| `public/brand/` | Logo SVGs for places outside React. |
| `reference/` (next to this file) | Detail: tokens, components, charts, copy, layout. Read the one you need. |

## Hard rules (never break)

1. **No raw colors.** Never write hex, rgb() or hsl() outside `brand/`. Use `var(--vm-*)` or brand Tailwind classes. JS, inline styles and SVG attributes read `var(--vm-*)`, never `var(--color-*)` (those are not emitted).
2. **Violet is the only brand hue.** `primary` for the main action, the client's data series and selected indicators. Violet text/links use `primary-text`, never `primary`.
3. **One alert per view**, only through `<AlertChip>`. On the website it is Signal amber; in the client portal pass `band` and it takes that band's status colour. Never for series, headings, decoration or form errors.
4. **Two surfaces for health.** The website uses the D1 band ramp (Violet 100 → Ink, darker = needs you sooner). The client portal (`data-surface="portal"` on its layout root) uses the universal status colours: `--vm-status-{strong|average|attention|critical}-{fill|tint|text}` = green / yellow / orange / red (docs/PORTAL-NEUTRAL-PLAN.md). Status colours go on chips and small marks only, never on chart series, and never borrowed for a state that is not a judgement (use the `neutral` tone). The band word and glyph always travel with the colour.
5. **Fonts:** Instrument Sans for UI and text, IBM Plex Mono for labels/numbers-with-units/timestamps, IBM Plex Sans Arabic for Arabic. Type scale 12 · 14 · 15 · 16 · 18 · 22 · 28 · 36 · 44 · 56 · 72; nothing below 12px.
6. **Every chart lives in a `ChartCard`** (portal: `components/market/ui/Card` with `soWhat`) with a real `soWhat` finding and `howToRead`.
7. **Every metric shows its basis:** `asOf` and `base` ("742 outlets"). Deltas name the window ("vs Aug 2026").
8. **Confidence is explicit:** `<ConfidenceBadge level="measured|estimated|stale">` where data quality varies; placeholder website figures carry "Sample figure".
9. **Border-first, flat.** Cards = `surface` + 1px `line` + radius 16, no shadow. No gradients, glassmorphism, glows, emoji, or colored left-border cards. Overlay shadow only on menus, popovers, dialogs, drawers.
10. **Accessible by default:** text contrast ≥ 4.5:1 (see `reference/tokens.md`; muted text never on `primary-tint`), 44px controls, visible focus ring, real `<button>`/`<a>`/`<label>`, direction shown with ▲/▼ plus words, never color alone, motion off under `prefers-reduced-motion`.
11. **Never redraw the logo.** `<Logo>`, `<Mark>`, `<LogoBilingual>`, `<LogoDescriptor>` in React, `/brand/*.svg` elsewhere. On Ink use `tone="onInk"`, on Violet `tone="reversed"`.
12. **Retired names stay retired.** The pre-brand classes (`text-ink-900`, `bg-canvas`, `bg-violet`, `text-good`, `t-h2`, `btn-primary`, `font-display`…) no longer compile and `brand:check` rejects them.

## How to build a portal view

1. Portal shell is fixed: left rail + filter header (plan D7). A page starts with `PageHeader` (eyebrow = scope, a title computed from the data that states the finding, one line on the decision it supports).
2. Lead with the decision: at most one `AlertChip`, then a KPI row (`KpiCard`, hero 56px on the first row, compact 36px after), then chart cards, then detail tables (`table.vm-table`).
3. Compose from `components/vemi` first. If something is missing, build it from tokens and the patterns in `reference/components.md`, then add it to `components/vemi` and `/kit`.
4. Charts: series order is fixed (client → key competitor → others). See `reference/charts.md`.
5. Copy: sentence case, verbs on buttons, numbers with units and time. See `reference/copy.md`.

## The client portal surface

The portal (`app/portal`, `data-surface="portal"` on its layout root) is
the client's room, so it is deliberately **not** fully Vemi-branded.
The plan and its build notes are in `docs/PORTAL-NEUTRAL-PLAN.md`. One
scoped token layer in `brand/tokens.css` does all of it, so components
keep reading `--vm-*` and never branch on the surface.

| Colour role | Portal | Where |
|---|---|---|
| Neutral frame | cool greys (`--vm-neutral-*`), white cards, near-black text | ground, cards, text, lines, selection tint, skeletons, secondary and text buttons, disclosure toggles |
| Vemi | Violet (Violet 700 text) | logo, primary buttons (Vemi's actions: audit, quote, export), links, focus ring, the rail's active icon, the tab underline, a selected control's label |
| Your data | data blue / dark grey / grey (`--vm-chart-1/2/3`, `--vm-portfolio-*`, `--vm-heat-*`) | chart series only: your portfolio blue, key competitor dark grey, others grey |
| Status | green / yellow / orange / red (`--vm-status-*`) | chips, pins, heat cells, bars against a target, the one alert, delta colouring |

Rules:
- Status colours never draw a series, and violet never draws data.
- Status colour stays on small marks: never a card fill, band or header.
- Marks ask for a **role**, never a hue: `BAND_COLOR`, `BAND_EDGE`,
  `BAND_RING`, `BAND_ON`, `MARK_ALARM`, `BAND_GAUGE` in
  `components/market/ui/health.ts`.
- A `Gauge` or `Bar` measured against a target takes its `band`.
- A change is coloured by **outcome**: pass `better` from
  `lib/market/outcome.ts` (`BETTER`) or `WATCH_BETTER`. Counts stay
  unjudged.
- A state that is not a judgement uses the `neutral` tone (pending, no
  change, out of scope, low priority, workflow stages).
- The client leads the header (`components/portal/ClientMark`), and Vemi
  signs exports ("Prepared by" + logo).
- The portal restates every token that names a neutral inside its scope,
  because a `var()` in a custom property resolves where it is declared.
  Keep that true when adding tokens.
- `npm run brand:check` warns on status or data colours outside portal
  code, and `scripts/contrast-check.mjs` (part of `brand:check`) checks
  every pair on both surfaces.

## Website

One page (`app/(site)/page.tsx`, sections in `components/v2/`). Rhythm: Paper sections split by Line hairlines, **one Ink band** (the Market intelligence section, `data-theme="dark"`) and **one Violet band** (the closing band in the footer). The Insight V key visual (`components/v2/InsightV.tsx`) and `SignalField` are marketing-only; product screens never put the pattern behind data.

## Before you say you're done

- Run `npm run brand:check` and fix every ERROR; warnings need a reason.
- `npx tsc --noEmit`, `npx eslint`, `npm run data:check` pass.
- No new color, font, radius or shadow values were introduced outside `brand/`.
- Each chart has a real `soWhat` written as a finding, not a description of the chart.
- Only one `AlertChip` on the screen.
- Keyboard: Tab reaches every control, focus ring visible, Tabs respond to arrow keys, Escape closes overlays and focus returns.
