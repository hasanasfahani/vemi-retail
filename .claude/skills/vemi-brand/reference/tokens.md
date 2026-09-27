# Tokens

Use CSS variables (`var(--vm-…)`) or the Tailwind classes in the right column. Light = Paper theme; dark = Ink theme (`<html data-theme="dark">`).

## Color

| Token | Light | Dark | Tailwind | Use |
|---|---|---|---|---|
| `--vm-bg` | #F5F4EF | #0F0D2B | `bg-bg` | Page ground |
| `--vm-surface` | #FFFFFF | #15133A | `bg-surface` | Cards, inputs, tables, menus |
| `--vm-line` | #E2E0D8 | #2A2766 | `border-line` | Card borders, dividers (decorative) |
| `--vm-line-strong` | #8A889E | #6E6B9E | `border-line-strong` | Input/control borders (3:1) |
| `--vm-text` | #15133A | #F5F4EF | `text-text` | Body and headings |
| `--vm-text-muted` | #6B6A80 | #A9A7C4 | `text-text-muted` | Captions, metadata, axes. Not on primary/signal |
| `--vm-primary` | #5E57F1 | #7F79F6 | `bg-primary` | Main action, client series, selection |
| `--vm-on-primary` | #FFFFFF | #0F0D2B | `text-primary-fg` | Text on primary |
| `--vm-primary-hover` | #3F37C9 | #A9A5FA | `bg-primary-hover` | Hover/pressed primary |
| `--vm-primary-text` | #3F37C9 | #A9A5FA | `text-primary-text` | Violet text and links |
| `--vm-primary-tint` | #E8E7FD | #2A2766 | `bg-primary-tint` | Selected rows, highlights. Never text |
| `--vm-primary-on-ink` | #7F79F6 | #7F79F6 | `bg-primary-on-ink` | Violet on an Ink panel inside a light page |
| `--vm-signal` | #E8A33D | #F0B560 | `bg-signal` | AlertChip only |
| `--vm-on-signal` | #15133A | #15133A | `text-signal-fg` | Text on signal |
| `--vm-danger` | #B42318 | #F97066 | `text-danger` | Form validation only |
| `--vm-focus` | #5E57F1 | #A9A5FA | – | Focus ring color |
| `--vm-chart-1/2/3` | violet / ink / slate | violet-400 / paper / #8E8CA8 | `fill-chart-1` | Series in fixed order |
| `--vm-chart-base` | #E8E7FD | #2A2766 | `fill-chart-base` | Market baseline areas |
| `--vm-chart-grid` | #E2E0D8 | #2A2766 | `stroke-chart-grid` | Gridlines |
| `--vm-ink-800` | #2A2766 | #2A2766 | `bg-ink-800` | Raised panels and pattern blocks on Ink; the "needs attention" band |
| `--vm-band-strong/average/attention/critical` | Violet 100 / 400 / Violet / Ink | same | `bg-band-*` | Health bands (plan D1): darker = needs you sooner; the band word always travels with the colour |
| `--vm-portfolio-1…4` | Violet → Violet 100 | same | – | The client's portfolio when a chart splits it (plan D2) |
| `--vm-scrim` | Ink 40% | black 55% | `bg-scrim` | Dialog and drawer backdrop |
| `--vm-paper` | #F5F4EF | #F5F4EF | – | Constant Paper for artwork on Ink in either theme |

Approved text pairs (WCAG AA): text on bg/surface ≥16:1 · text-muted on surface 5.3:1 (light) 7.6:1 (dark) · on-primary on primary 5.1:1 / 5.4:1 · primary-text on primary-tint 6.6:1 / 6.0:1 · on-signal on signal 8.2:1 · danger on surface 6.6:1 / 6.4:1.
Never: text-muted on primary (1:1), text-muted on primary-tint (4.3:1, fails AA; use `text` or `primary-text` inside a tint), white on signal (2.2:1), primary as small text on Ink (3.5:1).

Proportion per screen: Paper ~55% · Ink ~20% · Violet ~12% · Violet 100 ~7% · Slate ~3% · Signal ≤1%.

## Type

| Class / Tailwind | Size / line | Weight | Font | Use |
|---|---|---|---|---|
| `.vm-display` / `text-display` | 72/76, −0.02em | 600 | sans | Marketing hero only |
| `.vm-h1` / `text-h1` | 44/52, −0.02em | 600 | sans | Page title |
| `.vm-h2` / `text-h2` | 32/40, −0.01em | 600 | sans | Section title |
| `.vm-h3` / `text-h3` | 22/28 | 600 | sans | Card title |
| `text-kpi` | 56/60, −0.02em | 600 | sans + tabular-nums | KPI values |
| `.vm-body-lg` / `text-lg` | 18/28 | 400 | sans | Lead text, soWhat |
| body / `text-base` | 16/24 | 400 | sans | Default |
| `.vm-body-sm` / `text-sm` | 14/20 | 400 | sans | Tables, helper text |
| `text-ui` | 15/20 | 600 | sans | Buttons, tabs |
| `.vm-label` / `text-label font-mono uppercase` | 12/16, +0.1em | 500 | mono | Eyebrows, KPI labels, table headers |
| `.vm-data` | 14/20 | 400 | mono | Timestamps, IDs |

Numbers in tables and KPIs: `font-variant-numeric: tabular-nums` (`.vm-num` or `.mono`), right-aligned. Arabic: `font-arabic`, no letter-spacing, line-height ≥ 1.6.

## Space, radius, elevation

Spacing 4-pt: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (`--vm-space-1…16`). Card padding 24, gap between cards 24–32, section gap 48, page side padding 24 (mobile 16).
Radius: 6 badges/chips · 10 controls · 16 cards · 24 hero panels · pill for badges/alerts.
Shadows: none on cards. `--vm-shadow-raised` only on the active segmented option; `--vm-shadow-overlay` on menus, popovers, dialogs.
Controls: 44px tall (`--vm-control-height`).
