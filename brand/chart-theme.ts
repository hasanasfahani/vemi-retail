/**
 * Vemi chart theme. Series ORDER carries meaning:
 *   1 = the client's brand, 2 = key competitor, 3 = all others.
 * `base` is for market-baseline areas behind bars. `signal` is ONLY for a
 * single anomaly marker, never a series.
 *
 * SVG libraries (Recharts, Visx, hand-written SVG) can use `chartVars`
 * directly because fill/stroke accept var(). Canvas libraries (ECharts,
 * Chart.js) need real values: call readChartTheme() and re-read it when
 * the theme changes (see useChartTheme).
 */
import { useEffect, useState } from 'react';

export const chartVars = {
  series: ['var(--vm-chart-1)', 'var(--vm-chart-2)', 'var(--vm-chart-3)'] as const,
  base: 'var(--vm-chart-base)',
  grid: 'var(--vm-chart-grid)',
  axis: 'var(--vm-text-muted)',
  text: 'var(--vm-text)',
  signal: 'var(--vm-signal)',
  surface: 'var(--vm-surface)',
} as const;

export interface ChartTheme {
  series: [string, string, string];
  base: string;
  grid: string;
  axis: string;
  text: string;
  signal: string;
  surface: string;
  fontSans: string;
  fontMono: string;
}

export function readChartTheme(el: HTMLElement = document.documentElement): ChartTheme {
  const s = getComputedStyle(el);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    series: [v('--vm-chart-1'), v('--vm-chart-2'), v('--vm-chart-3')],
    base: v('--vm-chart-base'),
    grid: v('--vm-chart-grid'),
    axis: v('--vm-text-muted'),
    text: v('--vm-text'),
    signal: v('--vm-signal'),
    surface: v('--vm-surface'),
    fontSans: v('--vm-font-sans'),
    fontMono: v('--vm-font-mono'),
  };
}

/** Resolved chart colors that update when <html data-theme> changes. */
export function useChartTheme(): ChartTheme | null {
  const [theme, setTheme] = useState<ChartTheme | null>(null);
  useEffect(() => {
    const update = () => setTheme(readChartTheme());
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/** Shared axis/grid/tooltip styling for Recharts. Spread onto the matching components. */
export const rechartsDefaults = {
  cartesianGrid: { stroke: chartVars.grid, strokeDasharray: '0', vertical: false },
  xAxis: { tick: { fill: chartVars.axis, fontSize: 12, fontFamily: 'var(--vm-font-mono)' }, axisLine: { stroke: chartVars.grid }, tickLine: false },
  yAxis: { tick: { fill: chartVars.axis, fontSize: 12, fontFamily: 'var(--vm-font-mono)' }, axisLine: false, tickLine: false, width: 48 },
  tooltip: {
    contentStyle: { background: 'var(--vm-surface)', border: '1px solid var(--vm-line)', borderRadius: 10, boxShadow: 'var(--vm-shadow-overlay)', fontFamily: 'var(--vm-font-sans)', fontSize: 14, color: 'var(--vm-text)' },
    labelStyle: { fontFamily: 'var(--vm-font-mono)', fontSize: 12, color: 'var(--vm-text-muted)' },
    cursor: { fill: 'var(--vm-primary-tint)' },
  },
  bar: { radius: [3, 3, 0, 0] as [number, number, number, number], maxBarSize: 28 },
  line: { strokeWidth: 2, dot: false, activeDot: { r: 4 } },
} as const;
