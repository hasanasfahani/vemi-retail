/* The pattern every analytics block on this portal follows:

     metric → comparison → explanation → location → action

   A number on its own starts an argument ("87% of what? against
   what?"). This states the figure, what it should be, what is dragging
   it, where that is concentrated, and the one thing to do about it —
   in that order, in one band across the top of a tab. */

import type { ReactNode } from "react";
import Link from "next/link";
import Delta from "./ui/Delta";
import Badge from "./ui/Badge";
import { rateBand, type Band } from "./ui/health";

export default function Headline({
  label,
  value,
  unit = "%",
  target,
  band,
  delta,
  deltaFloor = 0,
  goodUp = true,
  problem,
  location,
  action,
  aside,
}: {
  label: string;
  value: number;
  unit?: string;
  target?: number;
  band?: Band;
  delta?: number;
  deltaFloor?: number;
  goodUp?: boolean;
  /* What is dragging the number, in a phrase. */
  problem?: ReactNode;
  /* Where it is concentrated. */
  location?: ReactNode;
  action?: { href: string; label: string };
  aside?: ReactNode;
}) {
  const resolved = band ?? (target !== undefined ? rateBand(value, target) : undefined);

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-[220px]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="mt-1 flex items-end gap-2">
            <span className="font-display text-[38px] font-bold leading-none tracking-tight text-ink-900">
              {value}
              <span className="ml-0.5 text-[20px] font-semibold text-ink-500">{unit}</span>
            </span>
            {resolved && <Badge band={resolved} />}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {delta !== undefined && (
              <Delta value={delta} floor={deltaFloor} goodUp={goodUp} label="vs last month" />
            )}
            {target !== undefined && (
              <span className="mono text-[11.5px] text-ink-400">
                target {target}
                {unit}
              </span>
            )}
          </p>
        </div>

        <dl className="flex min-w-[260px] flex-1 flex-col gap-2">
          {problem && (
            <div className="flex gap-3">
              <dt className="w-[74px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Main issue
              </dt>
              <dd className="min-w-0 text-[12.5px] leading-snug text-ink-700">{problem}</dd>
            </div>
          )}
          {location && (
            <div className="flex gap-3">
              <dt className="w-[74px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Where
              </dt>
              <dd className="min-w-0 text-[12.5px] leading-snug text-ink-700">{location}</dd>
            </div>
          )}
          {action && (
            <div className="flex gap-3">
              <dt className="w-[74px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Next
              </dt>
              <dd className="min-w-0">
                <Link
                  href={action.href}
                  className="inline-block rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
                >
                  {action.label}
                </Link>
              </dd>
            </div>
          )}
        </dl>

        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </section>
  );
}
