"use client";

import { useState } from "react";

const VIEW = { w: 100, h: 101.27 };
const IRAQ_PATH =
  "M66.74,19.18 L73.04,22.64 L73.77,29.35 L68.93,33.32 L66.7,42.29 L73.36,53.22 L85.14,59.52 L90.09,68.26 L88.51,76.59 L91.58,76.58 L91.68,82.71 L97,88.75 L91.29,88.19 L84.83,87.23 L77.78,98.27 L59.9,97.35 L32.79,74.23 L18.46,66.18 L6.88,63.06 L3,49.06 L24.29,37.1 L27.92,23.2 L27.01,14.8 L32.28,11.96 L37.21,4.79 L41.34,3 L52.52,4.48 L55.9,7.41 L60.51,5.47 L66.74,19.18 Z";

type Side = "left" | "right";
type Pin = { name: string; x: number; y: number; label?: Side; capital?: boolean };

const PINS: Pin[] = [
  { name: "Duhok", x: 43.34, y: 8.96, label: "right" },
  { name: "Mosul", x: 44.71, y: 15.02, label: "left" },
  { name: "Erbil", x: 53.16, y: 16.73, label: "right" },
  { name: "Sulaymaniyah", x: 66.89, y: 23.97 },
  { name: "Kirkuk", x: 56.84, y: 25.04 },
  { name: "Samarra", x: 51.87, y: 39.64 },
  { name: "Ramadi", x: 46.35, y: 48.53 },
  { name: "Baghdad", x: 56.55, y: 49.83, label: "right", capital: true },
  { name: "Karbala", x: 53.31, y: 57.83 },
  { name: "Hillah", x: 57.24, y: 59.35 },
  { name: "Kut", x: 70.56, y: 59.02 },
  { name: "Najaf", x: 56.3, y: 64.94, label: "left" },
  { name: "Diwaniyah", x: 61.97, y: 65.04 },
  { name: "Amarah", x: 83.32, y: 66.81 },
  { name: "Nasiriyah", x: 74.79, y: 75.77 },
  { name: "Basra", x: 89.46, y: 82.07, label: "left" },
];

const PIN_BY_NAME = new Map(PINS.map((pin) => [pin.name, pin]));
const ROUTES = [
  ["Duhok", "Mosul"],
  ["Mosul", "Erbil"],
  ["Erbil", "Kirkuk"],
  ["Kirkuk", "Baghdad"],
  ["Sulaymaniyah", "Baghdad"],
  ["Ramadi", "Baghdad"],
  ["Baghdad", "Karbala"],
  ["Baghdad", "Kut"],
  ["Karbala", "Najaf"],
  ["Najaf", "Diwaniyah"],
  ["Diwaniyah", "Nasiriyah"],
  ["Kut", "Amarah"],
  ["Nasiriyah", "Basra"],
] as const;

/* The field network (brand refresh, phase 7): a white card, the country
   a flat Violet 100 fill with a Violet hairline, hubs as solid Violet
   dots (the capital larger). No gradient, glow, blur or drop shadow.
   Labels are HTML so they hold 12px at every width. */
export default function CoverageMap() {
  const [hover, setHover] = useState<Pin | null>(null);

  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="vm-label inline-flex items-center gap-2 text-primary-text">
            <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
            Active field network
          </span>
          <p className="mt-1 text-lg font-semibold leading-6 text-text">Iraq coverage</p>
        </div>
        <span className="rounded-sm border border-line px-2 py-1 font-mono text-xs text-text-muted">
          {PINS.length} hubs
        </span>
      </div>

      <div className="relative mx-auto mt-4 w-[88%] max-w-[420px]" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`Map of Iraq showing Vemi coverage across ${PINS.length} governorate capitals: ${PINS.map((p) => p.name).join(", ")}.`}
        >
          <path
            d={IRAQ_PATH}
            fill="var(--vm-primary-tint)"
            stroke="var(--vm-primary)"
            strokeOpacity="0.5"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          <g aria-hidden>
            {ROUTES.map(([from, to]) => {
              const start = PIN_BY_NAME.get(from);
              const end = PIN_BY_NAME.get(to);
              if (!start || !end) return null;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="var(--vm-primary)"
                  strokeOpacity="0.35"
                  strokeWidth="0.45"
                  strokeDasharray="1.4 1.6"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {PINS.map((p) => {
            const on = hover?.name === p.name;
            return (
              <g
                key={p.name}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                role="img"
                aria-label={p.name}
              >
                <circle cx={p.x} cy={p.y} r="4.2" fill="transparent" />
                {on && <circle cx={p.x} cy={p.y} r="3.2" fill="none" stroke="var(--vm-primary)" strokeWidth="0.6" />}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.capital ? 1.8 : 1.3}
                  fill="var(--vm-primary)"
                  stroke="var(--vm-surface)"
                  strokeWidth="0.6"
                />
              </g>
            );
          })}
        </svg>

        {/* standing labels for the anchor hubs */}
        {PINS.filter((p) => p.label).map((p) => (
          <span
            key={p.name}
            aria-hidden
            className={`pointer-events-none absolute -translate-y-1/2 whitespace-nowrap rounded-sm bg-white/90 px-1 font-mono text-xs leading-4 ${
              p.capital ? "font-medium text-text" : "text-text"
            } ${p.label === "left" ? "-translate-x-full" : ""}`}
            style={{
              left: `calc(${p.x}% ${p.label === "left" ? "- 8px" : "+ 8px"})`,
              top: `${(p.y / VIEW.h) * 100}%`,
            }}
          >
            {p.name}
          </span>
        ))}

        {hover && !hover.label && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm border border-line bg-surface px-2 py-1 font-mono text-xs text-text shadow-[var(--vm-shadow-overlay)]"
            style={{ left: `${hover.x}%`, top: `calc(${(hover.y / VIEW.h) * 100}% - 10px)` }}
          >
            {hover.name}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-xs text-text-muted">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
          Field coverage hub
        </span>
        <span>Governorate capitals</span>
      </div>
    </div>
  );
}
