/**
 * Vemi tokens for TypeScript. Values are CSS variable references so they
 * follow the light/dark theme automatically. For canvas-based chart
 * libraries that need real hex values, use readChartTheme() in chart-theme.ts.
 */
export const color = {
  bg: 'var(--vm-bg)',
  surface: 'var(--vm-surface)',
  line: 'var(--vm-line)',
  lineStrong: 'var(--vm-line-strong)',
  text: 'var(--vm-text)',
  textMuted: 'var(--vm-text-muted)',
  primary: 'var(--vm-primary)',
  onPrimary: 'var(--vm-on-primary)',
  primaryHover: 'var(--vm-primary-hover)',
  primaryText: 'var(--vm-primary-text)',
  primaryTint: 'var(--vm-primary-tint)',
  primaryOnInk: 'var(--vm-primary-on-ink)',
  signal: 'var(--vm-signal)',
  onSignal: 'var(--vm-on-signal)',
  danger: 'var(--vm-danger)',
  focus: 'var(--vm-focus)',
} as const;

/** Fixed brand values, for places CSS variables cannot reach (emails, OG images, PDFs, native). */
export const brandHex = {
  violet: '#5E57F1',
  violet700: '#3F37C9',
  violet400: '#7F79F6',
  violet100: '#E8E7FD',
  ink: '#15133A',
  paper: '#F5F4EF',
  white: '#FFFFFF',
  slate: '#6B6A80',
  line: '#E2E0D8',
  signal: '#E8A33D',
  danger: '#B42318',
} as const;

export const font = {
  sans: 'var(--vm-font-sans)',
  mono: 'var(--vm-font-mono)',
  arabic: 'var(--vm-font-arabic)',
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 } as const;
export const radius = { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 } as const;
export const controlHeight = 44;

export type Confidence = 'measured' | 'estimated' | 'stale';
export type Direction = 'up' | 'down' | 'flat';
