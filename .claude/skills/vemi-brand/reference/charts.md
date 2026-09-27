# Charts

- Wrap every chart in `ChartCard` (required `soWhat`, `howToRead`, `asOf`).
- Series order is meaning: **1 client brand → `chart-1` (violet)**, **2 key competitor → `chart-2` (ink)**, **3 others → `chart-3` (slate)**. Never reorder or recolor per chart. More than 3 series: group the rest into "Others" or use small multiples.
- Market baseline / benchmark bands: `chart-base` fill behind the data.
- An anomaly marker: one `signal` dot with a white 2px stroke. Never a signal-colored series.
- Gridlines `chart-grid`, horizontal only. Axis labels mono 12px `text-muted`. No axis lines on the value axis.
- Bars: max 28px wide, 3px top radius. Lines: 2px, no dots except the active point.
- Direction words and ▲/▼ in tooltips and labels; no red/green encoding.
- Percentages as `24.6%`, changes as `1.2 pts` (see `format.ts`). Always state the comparison window.
- This repo draws with Recharts and custom SVG: take colours from `components/market/charts/theme.ts` (`SERIES3`, `brandSeries`, `brandColor`, `AXIS`, `GRID`, `MEASURE`, `SIGNAL`), which read `var(--vm-*)`. `brand/chart-theme.ts` holds the kit's `chartVars` / `rechartsDefaults`.
- Plan D2: charts show 3 series by default (your portfolio / the key competitor / others); a split toggle opens the portfolio into the `--vm-portfolio-*` ramp with direct labels.
- Preferred forms for Vemi data: grouped bars (share by district), CompositionBar (100% stacked share), DivergingBar (gain/loss vs window), dumbbell (then vs now across a trailing window), small multiples by city. Avoid pies, 3D, dual axes, and radar charts.
- Accessible: `role="img"` + `aria-label` summarizing the chart on the `<svg>`, and a data table available for export.
