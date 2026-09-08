"use client";

/* Iraq, as the client's footprint.

   The marketing site has a national map too, and it was tempting to
   reuse it wholesale — but it is driven by `lib/marketData`, whose own
   header says "All values are illustrative". Invented availability and
   out-of-stock figures for eight cities are honest product
   illustration on a landing page and would be fabricated client data
   inside the workspace. So this map borrows that one's geometry — the
   real boundary, the real projected coordinates — and nothing else.

   Every number here is either audited or absent. Erbil carries its
   real figures because Erbil is what was audited; the other eighteen
   governorates carry published population and a note on how the
   category trades there, both of which are context rather than
   measurement, and are labelled as not subscribed rather than as
   zero. */

import { useState } from "react";
import { governorates, coverage, scope, type Governorate } from "@/lib/portal";

const VIEW = { w: 100, h: 101.27 };
const IRAQ_PATH =
  "M66.74,19.18 L73.04,22.64 L73.77,29.35 L68.93,33.32 L66.7,42.29 L73.36,53.22 L85.14,59.52 L90.09,68.26 L88.51,76.59 L91.58,76.58 L91.68,82.71 L97,88.75 L91.29,88.19 L84.83,87.23 L77.78,98.27 L59.9,97.35 L32.79,74.23 L18.46,66.18 L6.88,63.06 L3,49.06 L24.29,37.1 L27.92,23.2 L27.01,14.8 L32.28,11.96 L37.21,4.79 L41.34,3 L52.52,4.48 L55.9,7.41 L60.51,5.47 L66.74,19.18 Z";

export default function NationalMap({
  outletsAudited,
  availability,
}: {
  outletsAudited: number;
  availability: number;
}) {
  const [active, setActive] = useState<Governorate | null>(null);
  const shown = active ?? governorates.find((g) => g.active)!;

  return (
    <section className="min-w-0 rounded-[18px] border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="t-h3">Where you are audited</h2>
          <p className="mt-1 text-sm text-ink-500">
            {coverage.activeCount} of {coverage.totalCount} governorates live.
            Select any pin for what it would add.
          </p>
        </div>
        <span className="chip !py-1 shrink-0">
          <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
          {scope.city} live
        </span>
      </div>

      {/* The map was filling the column and reading as the subject of
          the page rather than as orientation on it. Capped and
          centred: at company altitude the footprint is one fact among
          four, not a poster. */}
      <div className="mt-5 grid items-start gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[200px]">
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Iraq — ${coverage.activeCount} of ${coverage.totalCount} governorates audited`}
          >
            <path
              d={IRAQ_PATH}
              fill="var(--color-canvas)"
              stroke="var(--color-line-strong)"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            {governorates.map((g) => {
              const on = shown.name === g.name;
              return (
                <g key={g.name}>
                  {g.active && (
                    <circle
                      cx={g.x}
                      cy={g.y}
                      r={on ? 4.2 : 3.4}
                      fill="var(--color-violet)"
                      opacity="0.18"
                    />
                  )}
                  <circle
                    cx={g.x}
                    cy={g.y}
                    r={g.active ? 1.9 : 1.2}
                    fill={g.active ? "var(--color-violet)" : "var(--color-ink-400)"}
                    stroke="var(--color-paper)"
                    strokeWidth={on ? 0.9 : 0.5}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setActive(g)}
                    onFocus={() => setActive(g)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${g.name}${g.active ? " — audited" : " — not subscribed"}`}
                  />
                </g>
              );
            })}
          </svg>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-violet)" }} />
              Audited
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--color-ink-400)" }} />
              Available on subscription
            </span>
          </p>
        </div>

        {/* Read-out. Fixed slot so hovering never moves the map. */}
        <div className="min-w-0 rounded-[12px] bg-canvas p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="t-h3 !text-[15px]">{shown.name}</span>
            {shown.active ? (
              <span className="pill pill-good">Live</span>
            ) : (
              <span className="pill">Not subscribed</span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-ink-400">{shown.seat}</p>

          <dl className="mt-3 flex flex-col gap-2 text-[13px]">
            {shown.active ? (
              <>
                {/* Real figures, because this is the governorate that
                    was actually audited. */}
                <Row label="Outlets audited" value={`${outletsAudited}`} />
                <Row label="On-shelf availability" value={`${availability}%`} />
                <Row label="Window" value={scope.dataAsOf} />
              </>
            ) : (
              <>
                {/* Context, never measurement — nothing here has been
                    audited, and a zero would read as a finding. */}
                <Row label="Outlets available" value={`${shown.potentialPos}`} />
                <Row label="Population" value={`${shown.population}m`} />
                <Row label="Audited" value="—" muted />
              </>
            )}
          </dl>

          <p className="mt-3 border-t border-line pt-2.5 text-[12px] leading-snug text-ink-500">
            {shown.retail}
          </p>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className={`mono font-semibold ${muted ? "text-ink-400" : "text-ink-900"}`}>
        {value}
      </dd>
    </div>
  );
}
