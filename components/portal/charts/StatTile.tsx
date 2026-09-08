/* Stat tile — label · value · signed delta against the previous window.

   `goodDirection` decides what a rise means: availability rising is
   good, out-of-stocks rising is not. Direction colour is a status
   token and always ships with the arrow glyph, never colour alone. */

import { scope } from "@/lib/portal";
import CountUp from "./CountUp";
import WatchButton, { type WatchTarget } from "@/components/portal/WatchButton";

type Props = {
  label: string;
  value: string;
  delta?: number;
  unit?: string;
  goodDirection?: "up" | "down";
  footnote?: string;
  /* Plain data, not a callback — this component renders inside Server
     Components, where a function prop cannot cross the boundary. */
  watch?: WatchTarget;
  /* The core panel's detection floor for this metric, and whether the
     delta clears it. A move the panel cannot resolve is shown as a
     reading rather than as a direction — the arrow and the status
     colour are what turn a number into a claim, so both are withheld
     below the floor. */
  floorPt?: number;
  moved?: boolean;
};

export default function StatTile({
  label,
  value,
  delta,
  unit = "pt",
  goodDirection = "up",
  footnote,
  watch,
  floorPt,
  moved: clearsFloor,
}: Props) {
  const belowFloor = clearsFloor === false;
  const moved = delta !== undefined && Math.abs(delta) >= 0.05 && !belowFloor;
  const rising = (delta ?? 0) > 0;
  const good = goodDirection === "up" ? rising : !rising;

  return (
    <div className="group relative rounded-[14px] border border-line bg-white p-4">
      {watch && (
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <WatchButton target={watch} />
        </div>
      )}
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </div>

      <div className="mt-1.5 flex items-baseline gap-2">
        {/* proportional figures: this is a display number, not a column */}
        <span className="font-display text-[28px] font-bold leading-none tracking-[-0.03em] text-ink-900">
          <CountUp text={value} />
        </span>

        {moved && (
          <span
            className="flex items-center gap-0.5 text-[13px] font-semibold"
            style={{
              color: good ? "var(--color-good)" : "var(--color-critical)",
            }}
          >
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {rising ? (
                <path d="M6 9.5V2.5M3 5.5 6 2.5l3 3" />
              ) : (
                <path d="M6 2.5v7M3 6.5 6 9.5l3-3" />
              )}
            </svg>
            {Math.abs(delta!).toFixed(1)}
            {unit}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-ink-500">
        {footnote && <span>{footnote}</span>}

        {/* The delta's provenance, ALWAYS rendered alongside the
            footnote rather than instead of it — they are different
            facts. The footnote describes the level, which comes from
            everything audited; this line describes the movement, which
            comes from the core panel and is subject to its floor.
            Collapsing the two let a tile show a level's population
            while implying it also explained the delta. */}
        {delta !== undefined &&
          (belowFloor ? (
            <span>
              {delta > 0 ? "+" : ""}
              {delta}pt vs {scope.previousVisit}
              {" — inside this panel\u2019s \u00b1"}
              {floorPt}pt floor, so not a move
            </span>
          ) : (
            <span>
              {moved ? "vs" : "unchanged vs"} {scope.previousVisit} · same{" "}
              {scope.corePanelSize} core outlets both windows
            </span>
          ))}
      </div>
    </div>
  );
}
