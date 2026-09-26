/**
 * Number and time formatting in the Vemi voice: precise, with a base and a
 * timestamp. Use these instead of ad-hoc toFixed() so every screen reads the same.
 */
import type { Direction } from './tokens';

export type Locale = 'en' | 'ar';
const loc = (l: Locale) => (l === 'ar' ? 'ar-IQ' : 'en-GB');

export function formatNumber(n: number, locale: Locale = 'en', digits = 0): string {
  return new Intl.NumberFormat(loc(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** 0.246 -> "24.6%" */
export function formatPercent(ratio: number, locale: Locale = 'en', digits = 1): string {
  return new Intl.NumberFormat(loc(locale), { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(ratio);
}

/** Change in percentage points: 0.012 -> "1.2 pts". Direction is returned separately; never encode it in color alone. */
export function formatPointsDelta(deltaRatio: number, digits = 1): { text: string; direction: Direction } {
  const pts = Math.abs(deltaRatio * 100);
  const direction: Direction = pts < Math.pow(10, -digits) / 2 ? 'flat' : deltaRatio > 0 ? 'up' : 'down';
  return { text: `${pts.toFixed(digits)} pts`, direction };
}

/** "IQD 1,250,000" — tabular, no abbreviations in tables. */
export function formatIQD(amount: number, locale: Locale = 'en'): string {
  return `IQD ${formatNumber(Math.round(amount), locale)}`;
}

/** "As of 14:02 · 26 Sep" (today's date omitted). Pair with the base: asOfLine(date, '150 outlets'). */
export function formatAsOf(date: Date, now: Date = new Date(), locale: Locale = 'en'): string {
  const time = new Intl.DateTimeFormat(loc(locale), { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  const sameDay = date.toDateString() === now.toDateString();
  const day = new Intl.DateTimeFormat(loc(locale), { day: 'numeric', month: 'short' }).format(date);
  return sameDay ? `As of ${time}` : `As of ${time} · ${day}`;
}

export function asOfLine(date: Date, base?: string, now?: Date): string {
  return base ? `${formatAsOf(date, now)} · ${base}` : formatAsOf(date, now);
}

/** "vs trailing 7 days" — Vemi compares to rolling windows, never to "previous visit". */
export const trailing = (days: number) => `vs trailing ${days} days`;
