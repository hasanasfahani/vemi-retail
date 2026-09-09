"use client";

/* One city's health.

   Same composite, same reading order as the brand rings — score, band
   in words, movement, the component holding it down — with two facts
   the brand cards do not carry: how much of that city the audit has
   actually reached, and a way straight into the map filtered to it.

   Coverage matters here in a way it does not for a brand. A score of
   66 over eleven audited outlets is a different claim from the same
   score over two hundred, and a reader deciding where to send someone
   needs to know which one they are looking at. */

import Link from "next/link";
import { BAND_WORD } from "@/lib/market/brandHealth";
import type { CityHealth } from "@/lib/market/cityHealth";
import { BAND_COLOR } from "./ui/health";
import Delta from "./ui/Delta";

export default function CityHealthCard({
  health,
  size = 108,
}: {
  health: CityHealth;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, health.score)) / 100) * c;
  const color = BAND_COLOR[health.band];
  const covered = health.inScope
    ? Math.round((health.outlets / health.inScope) * 1000) / 10
    : 0;

  return (
    <article className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="truncate font-display text-[14px] font-bold tracking-tight text-ink-900">
          {health.name}
        </h3>
        <span className="mono shrink-0 text-[10.5px] text-ink-400">
          {health.outlets.toLocaleString()} audited
        </span>
      </div>

      <div className="mt-2.5 flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${filled} ${c - filled}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display font-bold leading-none tracking-tight text-ink-900"
              style={{ fontSize: size * 0.3 }}
            >
              {health.score}
            </span>
            <span className="mono mt-0.5 text-[10px] text-ink-400">/ 100</span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11.5px] font-semibold"
          style={{ background: `${color}1a`, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {BAND_WORD[health.band]}
        </span>
      </p>

      <p className="mt-1.5 flex justify-center">
        {health.delta === null ? (
          <span className="mono text-[11.5px] text-ink-400">loading last cycle…</span>
        ) : (
          <Delta value={health.delta} unit="" floor={1} label="vs last month" />
        )}
      </p>

      <p className="mt-2.5 border-t border-line pt-2.5 text-[11.5px] leading-snug text-ink-500">
        <span className="font-semibold text-ink-700">{health.weakest.label}</span>{" "}
        {health.weakest.display} · main gap
      </p>

      <p className="mono mt-1.5 flex items-center justify-between gap-2 text-[10.5px] text-ink-400">
        <span>{covered}% of the city covered</span>
        <Link
          href={`/portal/pos?city=${health.cityId}`}
          className="font-semibold text-violet-ink hover:underline"
        >
          Outlets
        </Link>
      </p>
    </article>
  );
}
