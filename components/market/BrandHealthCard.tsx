"use client";

/* One brand's health, as a radial.

   The ring is the glance, the word underneath is the fact, and the
   line at the bottom names the component holding the score down — so a
   reader who looks at nothing else still leaves with something to do.

   Colour never travels alone: every ring is paired with its band in
   words, and the movement figure states its direction in text as well
   as in tint. */

import { Gauge } from "@/components/vemi/Gauge";
import { vsPrior } from "@/lib/market/asOf";
import type { ReactNode } from "react";
import { BAND_WORD, type BrandHealth } from "@/lib/market/brandHealth";
import StatusChip from "./ui/StatusChip";
import { componentDetail } from "@/lib/market/bandDetail";
import { brandSwatch } from "./charts/theme";
import Delta from "./ui/Delta";

export default function BrandHealthCard({
  health,
  focused,
  onSelect,
  watch,
}: {
  health: BrandHealth;
  /* The brand the global filter has narrowed to, if any. */
  focused?: boolean;
  size?: number;
  onSelect?: (brandId: string) => void;
  /* Pinned to the header row, at the same height on every card —
     which is the whole reason this is an icon and not a button. The
     ring below it is a different height on every card. */
  watch?: ReactNode;
}) {

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={brandSwatch(health.brandId)}
            aria-hidden
          />
          <span className="truncate text-lg font-semibold text-ink-900">
            {health.name}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {health.isClient && (
            <span className="mono uppercase font-mono text-xs font-medium tracking-[0.1em] text-ink-400">
              Lead brand
            </span>
          )}
          {watch}
        </span>
      </div>

      {/* Was a ring; the brand avoids donut forms. The figure, then a
          linear 0-100 gauge, then the band in words. */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="tnum text-[44px] leading-[48px]">{health.score}</span>
        <span className="font-mono text-xs text-ink-500">/ 100</span>
      </div>
      <Gauge className="mt-3" value={health.score} max={100} label={`${health.name} score ${health.score} of 100`} />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip
          band={health.band}
          label={BAND_WORD[health.band]}
          size="sm"
          title={`${health.name}: what makes the score`}
          detail={componentDetail(health.score, health.components)}
        />
        {health.delta === null ? (
          <span className="font-mono text-xs text-ink-500">loading last cycle…</span>
        ) : (
          <Delta value={health.delta} unit="" floor={1} label={vsPrior()} />
        )}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        {/* The brand's slice of the whole fixture, drawn in its series
            colour: the share composition the score sits on. */}
        <p className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-ink-500">Shelf share</span>
          <span className="font-mono font-medium text-ink-900">{health.share}%</span>
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full" style={{ ...brandSwatch(health.brandId), width: `${Math.min(100, health.share)}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink-500">
          <span className="font-semibold text-ink-900">{health.weakest.label}</span>{" "}
          {health.weakest.display} · main gap
        </p>
      </div>
    </>
  );

  const shell = `flex min-w-0 flex-col rounded-lg border bg-white p-6  transition-colors ${
    focused ? "border-violet ring-1 ring-primary-tint" : "border-line"
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
