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

import { Gauge } from "@/components/vemi/Gauge";
import { vsPrior } from "@/lib/market/asOf";
import type { ReactNode } from "react";
import Link from "next/link";
import { BAND_WORD } from "@/lib/market/brandHealth";
import type { GovernorateHealth } from "@/lib/market/governorateHealth";
import StatusChip from "./ui/StatusChip";
import { componentDetail } from "@/lib/market/bandDetail";
import Delta from "./ui/Delta";

export default function GovernorateHealthCard({
  health,
  watch,
}: {
  health: GovernorateHealth;
  size?: number;
  watch?: ReactNode;
}) {
  const covered = health.inScope
    ? Math.round((health.outlets / health.inScope) * 1000) / 10
    : 0;

  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-line bg-surface p-6 ">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="min-w-0 truncate text-lg font-semibold text-text">
          {health.name}
          {/* Five governorates share a name with their capital; Nineveh
              does not, and a reader who knows the audit works Mosul
              needs to see that this is the same place. */}
          {health.capital !== health.name && (
            <span className="ml-1.5 text-xs font-normal text-text-muted">
              {health.capital}
            </span>
          )}
        </h3>
        <span className="flex shrink-0 items-center gap-1">
          <span className="mono text-xs text-text-muted">
            {health.outlets.toLocaleString()} audited
          </span>
          {watch}
        </span>
      </div>

      {/* Was a ring; the brand avoids donut forms. */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="tnum text-[44px] leading-[48px]">{health.score}</span>
        <span className="font-mono text-xs text-text-muted">/ 100</span>
      </div>
      <Gauge className="mt-3" value={health.score} max={100} band={health.band} label={`${health.name} score ${health.score} of 100`} />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip
          band={health.band}
          label={BAND_WORD[health.band]}
          size="sm"
          title={`${health.name}: what makes the score`}
          detail={componentDetail(health.score, health.components)}
        />
        {health.delta === null ? (
          <span className="font-mono text-xs text-text-muted">loading last cycle…</span>
        ) : (
          <Delta value={health.delta} unit="" floor={1} better="up" label={vsPrior()} />
        )}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-sm text-text-muted">
        <span className="font-semibold text-text">{health.weakest.label}</span>{" "}
        {health.weakest.display} · main gap
      </p>

      <p className="mono mt-1.5 flex items-center justify-between gap-2 text-xs text-text-muted">
        <span>{covered}% of the city covered</span>
        <Link
          href={`/portal/pos?governorate=${health.governorateId}`}
          className="font-semibold text-primary-text hover:underline"
        >
          Outlets
        </Link>
      </p>
    </article>
  );
}
