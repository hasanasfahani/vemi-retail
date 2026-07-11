"use client";

import { useState } from "react";
import {
  cityByName,
  national,
  healthColor,
  healthLabel,
  cities,
  type Health,
} from "@/lib/marketData";

/* Real Iraq boundary (low-poly, equirectangular w/ latitude correction) +
   the 8 covered cities placed by true lat/long. Pins are colored by live
   health so a sales director reads the whole market at a glance. */
const VIEW = { w: 100, h: 101.27 };
const IRAQ_PATH =
  "M66.74,19.18 L73.04,22.64 L73.77,29.35 L68.93,33.32 L66.7,42.29 L73.36,53.22 L85.14,59.52 L90.09,68.26 L88.51,76.59 L91.58,76.58 L91.68,82.71 L97,88.75 L91.29,88.19 L84.83,87.23 L77.78,98.27 L59.9,97.35 L32.79,74.23 L18.46,66.18 L6.88,63.06 L3,49.06 L24.29,37.1 L27.92,23.2 L27.01,14.8 L32.28,11.96 L37.21,4.79 L41.34,3 L52.52,4.48 L55.9,7.41 L60.51,5.47 L66.74,19.18 Z";

type Side = "left" | "right";
const COORDS: Record<string, { x: number; y: number; side: Side; capital?: boolean }> = {
  Baghdad: { x: 56.55, y: 49.83, side: "right", capital: true },
  Basra: { x: 89.46, y: 82.07, side: "left" },
  Mosul: { x: 44.71, y: 15.02, side: "left" },
  Erbil: { x: 53.16, y: 16.73, side: "right" },
  Najaf: { x: 56.3, y: 64.94, side: "right" },
  Karbala: { x: 53.31, y: 57.83, side: "left" },
  Sulaymaniyah: { x: 66.89, y: 23.97, side: "left" },
  Duhok: { x: 43.34, y: 8.96, side: "right" },
};

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: Health }) {
  return (
    <div className="rounded-lg bg-canvas px-2.5 py-2">
      <div className="tnum !text-base" style={tone && tone !== "good" ? { color: healthColor[tone] } : undefined}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  );
}

export default function IraqMap() {
  const [active, setActive] = useState<string | null>(null);
  const activeCity = active ? cityByName(active) : null;
  const activeCo = active ? COORDS[active] : null;
  const attention = cities.filter((c) => c.health !== "good");

  return (
    <div>
      {/* national scoreboard */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <MiniStat label="Avg avail." value={`${national.avgAvailability}%`} />
        <MiniStat label="Cities" value={`${national.citiesMonitored}`} />
        <MiniStat label="Stock-outs" value={`${national.totalOos}`} tone="critical" />
        <MiniStat label="Price flags" value={`${national.totalViolations}`} tone="warn" />
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="h-full w-full"
          role="img"
          aria-label="Map of Iraq. Vemi monitors 8 cities; pins are colored by health — green healthy, amber price issue, red stock-out."
        >
          <defs>
            <linearGradient id="iraqFill" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#efecff" />
              <stop offset="1" stopColor="#f6f7f9" />
            </linearGradient>
          </defs>

          <path d={IRAQ_PATH} fill="url(#iraqFill)" stroke="var(--color-violet)" strokeOpacity="0.3" strokeWidth="0.7" strokeLinejoin="round" />

          {Object.entries(COORDS).map(([name, c]) => {
            const data = cityByName(name);
            const color = healthColor[data.health];
            const isActive = active === name;
            const labelX = c.side === "right" ? c.x + 3 : c.x - 3;
            return (
              <g
                key={name}
                className="cursor-pointer"
                onMouseEnter={() => setActive(name)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(name)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={`${name}: ${healthLabel[data.health]}. Availability ${data.availability} percent, shelf share ${data.shelfShare} percent, ${data.oos} out of stock, ${data.violations} flagged.`}
              >
                <circle cx={c.x} cy={c.y} r="5" fill="transparent" />
                {/* alert ring for cities needing attention */}
                {data.health === "critical" && (
                  <circle className="map-ping" cx={c.x} cy={c.y} r="2.4" fill="none" stroke={color} strokeWidth="0.8" />
                )}
                {data.health !== "good" && (
                  <circle cx={c.x} cy={c.y} r={isActive ? 3.2 : 2.8} fill={color} opacity="0.18" />
                )}
                <circle cx={c.x} cy={c.y} r={isActive ? 1.9 : 1.5} fill={color} stroke="#fff" strokeWidth="0.7" style={{ transition: "r 140ms ease" }} />
                <text
                  x={labelX}
                  y={c.y + 0.9}
                  textAnchor={c.side === "right" ? "start" : "end"}
                  fontSize="2.9"
                  fontWeight={c.capital ? 700 : 600}
                  fill={isActive ? "var(--color-ink-900)" : "var(--color-ink-700)"}
                  stroke="#fff"
                  strokeWidth="0.7"
                  paintOrder="stroke"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* hover tooltip — the "monitoring" panel */}
        {activeCity && activeCo && (
          <div
            className="pointer-events-none absolute z-10 w-60 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-white p-3 shadow-[var(--shadow-pop)]"
            style={{ left: `${activeCo.x}%`, top: `calc(${(activeCo.y / VIEW.h) * 100}% - 8px)` }}
          >
            <div className="flex items-center justify-between">
              <span className="t-h3 !text-sm">{activeCity.name}</span>
              <span className="pill" style={{ background: `color-mix(in srgb, ${healthColor[activeCity.health]} 14%, #fff)`, color: healthColor[activeCity.health] }}>
                <span className="dot" style={{ background: healthColor[activeCity.health] }} />
                {healthLabel[activeCity.health]}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <MiniStat label="Availability" value={`${activeCity.availability}%`} />
              <MiniStat label="Shelf share" value={`${activeCity.shelfShare}%`} />
              <MiniStat label="Out of stock" value={`${activeCity.oos}`} tone={activeCity.oos > 0 ? "critical" : "good"} />
              <MiniStat label="Flagged" value={`${activeCity.violations}`} tone={activeCity.violations > 0 ? "warn" : "good"} />
            </div>
            <p className="mt-2 text-[11px] text-ink-500">{activeCity.headline}</p>
          </div>
        )}
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
        {(["good", "warn", "critical"] as Health[]).map((h) => (
          <span key={h} className="flex items-center gap-1.5">
            <span className="dot" style={{ background: healthColor[h] }} />
            {healthLabel[h]}
          </span>
        ))}
      </div>

      {/* needs attention */}
      {attention.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Needs your attention</span>
            <span className="tnum !text-xs text-ink-500">{attention.length} cities</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {attention.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5">
                <span className="dot" style={{ background: healthColor[c.health] }} />
                <span className="text-sm font-medium text-ink-900">{c.name}</span>
                <span className="text-xs text-ink-500">— {c.headline}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
