"use client";

/* One brand's health, as a radial.

   The ring is the glance, the word underneath is the fact, and the
   line at the bottom names the component holding the score down — so a
   reader who looks at nothing else still leaves with something to do.

   Colour never travels alone: every ring is paired with its band in
   words, and the movement figure states its direction in text as well
   as in tint. */

import { BAND_WORD, type BrandHealth } from "@/lib/market/brandHealth";
import { BAND_COLOR } from "./ui/health";
import { brandColor } from "./charts/theme";
import Delta from "./ui/Delta";

export default function BrandHealthCard({
  health,
  focused,
  size = 128,
  onSelect,
}: {
  health: BrandHealth;
  /* The brand the global filter has narrowed to, if any. */
  focused?: boolean;
  size?: number;
  onSelect?: (brandId: string) => void;
}) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, health.score)) / 100) * c;
  const color = BAND_COLOR[health.band];

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ background: brandColor(health.brandId) }}
            aria-hidden
          />
          <span className="truncate font-display text-[14px] font-bold tracking-tight text-ink-900">
            {health.name}
          </span>
        </span>
        {health.isClient && (
          <span className="mono shrink-0 text-[10px] uppercase tracking-wide text-ink-400">
            Lead brand
          </span>
        )}
      </div>

      <div className="mt-3 flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke="var(--color-line)" strokeWidth={stroke}
            />
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

      <p className="mt-2.5 text-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11.5px] font-semibold"
          style={{ background: `${color}1a`, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {BAND_WORD[health.band]}
        </span>
      </p>

      <p className="mt-1.5 flex items-center justify-center gap-1.5">
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
    </>
  );

  const shell = `flex min-w-0 flex-col rounded-[14px] border bg-white p-3.5 shadow-[var(--shadow-card)] transition-colors ${
    focused ? "border-violet ring-1 ring-violet-100" : "border-line"
  }`;

  return onSelect ? (
    <button
      type="button"
      onClick={() => onSelect(health.brandId)}
      aria-pressed={focused}
      className={`${shell} text-left hover:border-ink-400`}
    >
      {body}
    </button>
  ) : (
    <article className={shell}>{body}</article>
  );
}
