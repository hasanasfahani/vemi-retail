"use client";

/* ============================================================
   National coverage map.

   Erbil is live and interactive. Every other governorate is drawn
   dimmed with a lock, and says what it would add. The map is the
   argument: the platform already runs, and the rest of the country
   is a switch away.
   ============================================================ */

import { useState } from "react";
import Link from "next/link";
import {
  governorates,
  coverage,
  scope,
  UNLOCK_MESSAGE,
  type Governorate,
} from "@/lib/portal";
import { clientBrand, headline } from "@/lib/portalData";

/* Same projection and outline as the marketing map, so the country
   reads identically on both sides of the login. */
const VIEW = { w: 100, h: 101.27 };
const IRAQ_PATH =
  "M66.74,19.18 L73.04,22.64 L73.77,29.35 L68.93,33.32 L66.7,42.29 L73.36,53.22 L85.14,59.52 L90.09,68.26 L88.51,76.59 L91.58,76.58 L91.68,82.71 L97,88.75 L91.29,88.19 L84.83,87.23 L77.78,98.27 L59.9,97.35 L32.79,74.23 L18.46,66.18 L6.88,63.06 L3,49.06 L24.29,37.1 L27.92,23.2 L27.01,14.8 L32.28,11.96 L37.21,4.79 L41.34,3 L52.52,4.48 L55.9,7.41 L60.51,5.47 L66.74,19.18 Z";

const active = governorates.find((g) => g.active)!;
const activeGovernorate = active;
const nationalPopulation =
  Math.round(governorates.reduce((sum, g) => sum + g.population, 0) * 10) / 10;

export default function CoverageMap() {
  const [selected, setSelected] = useState<Governorate>(active);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="relative">
        <div
          className="relative mx-auto w-full max-w-[420px]"
          style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
        >
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={`Vemi coverage across Iraq: ${scope.city} active, ${
              coverage.totalCount - coverage.activeCount
            } governorates available on subscription`}
          >
            <path
              d={IRAQ_PATH}
              fill="var(--color-canvas)"
              stroke="var(--color-line-strong)"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />

            {governorates.map((g) => {
              const isSelected = selected.name === g.name;
              return (
                <g
                  key={g.name}
                  className="cursor-pointer"
                  onMouseEnter={() => setSelected(g)}
                  onFocus={() => setSelected(g)}
                  onClick={() => setSelected(g)}
                  tabIndex={0}
                  role="button"
                  aria-label={
                    g.active
                      ? `${g.name} — active, ${g.potentialPos} outlets`
                      : `${g.name} — locked. ${UNLOCK_MESSAGE}`
                  }
                >
                  {/* generous hit target */}
                  <circle cx={g.x} cy={g.y} r="3.4" fill="transparent" />

                  {g.active ? (
                    <>
                      <circle
                        cx={g.x}
                        cy={g.y}
                        r="2.4"
                        fill="var(--color-good)"
                        opacity="0.18"
                        className="map-ping"
                      />
                      <circle
                        cx={g.x}
                        cy={g.y}
                        r="1.5"
                        fill="var(--color-good)"
                        stroke="#fff"
                        strokeWidth="0.5"
                      />
                    </>
                  ) : (
                    <>
                      <circle
                        cx={g.x}
                        cy={g.y}
                        r={isSelected ? 1.5 : 1.2}
                        fill="#fff"
                        stroke="var(--color-ink-400)"
                        strokeWidth="0.45"
                        opacity={isSelected ? 1 : 0.75}
                      />
                      {/* lock shackle + body, drawn small enough to read
                          as a texture until you look for it */}
                      <g
                        transform={`translate(${g.x - 0.62} ${g.y - 0.68})`}
                        stroke="var(--color-ink-400)"
                        strokeWidth="0.24"
                        fill="none"
                      >
                        <rect
                          x="0"
                          y="0.62"
                          width="1.24"
                          height="0.86"
                          rx="0.22"
                          fill="var(--color-ink-400)"
                          stroke="none"
                        />
                        <path d="M0.32 0.62V0.36a0.3 0.3 0 0 1 0.6 0v0.26" />
                      </g>
                    </>
                  )}

                  {isSelected && (
                    <circle
                      cx={g.x}
                      cy={g.y}
                      r="3.2"
                      fill="none"
                      stroke={
                        g.active ? "var(--color-good)" : "var(--color-violet)"
                      }
                      strokeWidth="0.4"
                    />
                  )}
                </g>
              );
            })}

            <text
              x={active.x + 4.4}
              y={active.y + 1}
              fontSize="3"
              fontWeight="700"
              fill="var(--color-ink-900)"
            >
              Erbil
            </text>
          </svg>
        </div>
      </div>

      {/* detail panel — market insight, not an outlet list */}
      <div className="flex flex-col gap-3">
        {selected.active ? (
          <div className="card !p-4">
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-h3">{selected.name}</span>
              <span className="pill pill-good">Live</span>
            </div>
            <p className="mt-1 text-[13px] text-ink-500">
              {selected.population}M people · {scope.posCount} outlets audited
              weekly
            </p>

            <dl className="mt-4 space-y-1.5 text-[13px]">
              <Row label={`${clientBrand.name} shelf share`} value={`${headline.shelfShare}%`} />
              <Row label="On-shelf availability" value={`${headline.availability}%`} />
              <Row label="Price compliance" value={`${headline.priceCompliance}%`} />
              <Row
                label="Open gaps"
                value={`${headline.totalOos}`}
                tone="critical"
              />
            </dl>

            <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-500">
              {selected.retail}
            </p>
          </div>
        ) : (
          <div className="card !p-4">
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{ background: "var(--color-ink-400)" }}
              />
              <span className="t-h3">{selected.name}</span>
            </div>
            <p className="mt-1 text-[13px] text-ink-500">
              {selected.seat !== selected.name && `${selected.seat} · `}
              {selected.population}M people
            </p>

            <dl className="mt-4 space-y-1.5 text-[13px]">
              <Row
                label="Share of Iraq"
                value={`${Math.round((selected.population / nationalPopulation) * 1000) / 10}%`}
              />
              <Row label="Outlets we can field" value={`${selected.potentialPos}`} />
              <Row
                label="Relative to Erbil"
                value={`${Math.round((selected.potentialPos / activeGovernorate.potentialPos) * 10) / 10}×`}
              />
            </dl>

            <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-700">
              {selected.retail}
            </p>

            <Link
              href="/#packages"
              className="btn-primary mt-4 w-full !py-2 text-sm"
            >
              Add {selected.name}
            </Link>
          </div>
        )}

        <div className="rounded-[14px] border border-line bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            National potential
          </div>
          <div className="tnum mt-1 text-2xl">
            {coverage.lockedPotentialPos.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[13px] text-ink-500">
            further outlets across{" "}
            {coverage.totalCount - coverage.activeCount} governorates ·{" "}
            {Math.round(
              ((nationalPopulation - activeGovernorate.population) /
                nationalPopulation) *
                100
            )}
            % of Iraq&apos;s population
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className="mono font-semibold"
        style={{
          color:
            tone === "critical"
              ? "var(--color-critical)"
              : "var(--color-ink-900)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
