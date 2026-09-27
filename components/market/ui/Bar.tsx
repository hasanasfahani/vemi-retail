/* An inline proportion — shelf share against par, a compliance rate.
   The bar is the comparison; the number beside it is the fact, and both
   are always shown. `par` draws the brand's 2px Ink target tick.

   A bar measured against a target is a judgement, so unless a colour is
   passed (a brand's own series colour) it takes its band: Violet on the
   Vemi surface, the band's status colour in the client portal. Pass
   `band` where the scale bands differently from a plain rate (scores). */

import { BAND_GAUGE, GAUGE_EDGE, rateBand, type Band } from "./health";

export default function Bar({
  value,
  max = 100,
  par,
  band,
  color,
  height = 6,
  label,
}: {
  value: number;
  max?: number;
  par?: number;
  band?: Band;
  color?: string;
  height?: number;
  label?: string;
}) {
  const judged = color ? undefined : band ?? (par !== undefined ? rateBand(value, par) : undefined);
  const fill = color ?? (judged ? BAND_GAUGE[judged] : "var(--vm-primary)");
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const parPct = par === undefined || max === 0 ? null : Math.max(0, Math.min(100, (par / max) * 100));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div
        className="relative min-w-0 flex-1 rounded-full bg-line"
        style={{ height }}
        role="img"
        aria-label={label ?? `${value} of ${max}`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: fill,
            boxShadow: judged ? `inset 0 0 0 1px ${GAUGE_EDGE[judged]}` : undefined,
          }}
        />
        {parPct !== null && (
          <span
            className="absolute -top-[3px] w-[2px] -translate-x-1/2 rounded-[1px] bg-text"
            style={{ left: `${parPct}%`, height: height + 6 }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
