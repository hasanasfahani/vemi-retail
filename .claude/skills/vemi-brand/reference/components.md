# Components (`components/vemi`)

Import from `components/vemi` and load `vemi-components.css` once at the app root.

| Component | Required props | Rules |
|---|---|---|
| `PageHeader` | `title` | `eyebrow` = scope ("Erbil · Beverages"); `description` = the decision the page supports; `actions` = max one primary + secondaries. |
| `KpiCard` | `label`, `value`, `asOf` | `delta` needs `change`, `window`, `direction`. Add `base` and `confidence`. Value preformatted via `format.ts`. |
| `ChartCard` | `title`, `soWhat`, `howToRead`, `asOf`, `children` | The only container for charts. `actions` = SegmentedControl for time window. `alert` = optional single AlertChip. |
| `ConfidenceBadge` | `level` | measured / estimated / stale. Next to values, in tables, in chart headers. |
| `AlertChip` | `children` | Max one per view. Sentence: what + where ("Out of stock · 3 outlets in Ankawa"). |
| `Button` | – | `primary` (one per view), `secondary`, `text`. Sentence-case verb labels. |
| `TextField` | `label` | Visible label, `hint`, `error` written as the fix. |
| `SegmentedControl` | `options`, `ariaLabel` | 2–4 views of the same data (time window, unit). Not navigation. |
| `Tabs` | `items`, `ariaLabel` | Sections within a page. Arrow-key navigation built in. |
| `Card` | – | Generic surface with optional `title` and `actions`. |
| `Logo` / `Mark` | – | App logo; `tone="reversed"` on a primary fill. Never below 16px mark. |

## Patterns without a component yet

- **Table:** `<table className="vm-table">`; numeric cells `className="num"`; selected row `aria-selected="true"` → `primary-tint`. 44px rows, mono uppercase headers.
- **Empty state:** `EmptyState` (components/vemi) — inside a Card: `.vm-h3` title saying what's missing, one sentence on why/when data arrives, one secondary Button. No illustrations or emoji.
- **Loading:** `Skeleton` (components/vemi) — skeleton blocks in `--vm-primary-tint` at `radius-sm`, same size as the content. No spinners on full pages.
- **Locked/unsubscribed region:** `LockedRegion` (components/vemi) — Card with `bg` background, `.vm-label` "Not in your plan", a `text` Button "Add [city]". Never grey out with opacity alone.
- **Dialog / Drawer:** `Dialog`, `Drawer` (components/vemi; `useOverlay` handles Escape, scroll lock, focus trap and focus return). Backdrop is `--vm-scrim`.
- **Toast:** `Toasts` / `useToasts` (components/vemi) — `surface`, 1px `line`, `shadow-overlay`, bottom-end; never signal-colored unless it is the view's one alert.
- **Icons:** `components/vemi/Icon.tsx` (`<Icon name="…" size={16|20|24} />`, `currentColor`). Add a new glyph there rather than importing an icon library.

When you create a new reusable piece, put it in `components/vemi/`, style it in `vemi-components.css` with `var(--vm-*)` only, export it from `index.ts`, and add a row to this table.

## Also in this repo (`components/vemi`)

`Logo`, `LogoBilingual`, `LogoDescriptor` (tones color / mono / reversed / onInk), `IconButton`, `SelectField`, `TextareaField`, `BandChip` (health bands, plan D1), `Gauge`, `InfoPopover`, `SignalField` (the brand pattern; marketing surfaces only, colorways paper / violet / ink), `cx`. The live sheet of every component is `/kit` (noindex).

Portal charts sit in `components/market/ui/Card.tsx`, which renders a `ChartCard` when given `soWhat` / `asOf` / `base`. Chart colours come from `components/market/charts/theme.ts` (`SERIES3`, `brandSeries`, `AXIS`, `GRID`); health-band colours from `components/market/ui/health.ts` (`BAND_COLOR`, `BAND_EDGE`).
