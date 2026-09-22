"use client";

import { useState } from "react";

/* Real Iraq boundary (low-poly, equirectangular with latitude
   correction) and 16 governorate capitals placed by true lat/long.

   All 16 are pinned — that density is the "nationwide" claim. Only six
   anchor cities carry a permanent label, because sixteen labels on a
   country this shape collide; the rest name themselves on hover. */

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

export default function CoverageMap() {
  const [hover, setHover] = useState<Pin | null>(null);

  return (
    <div className="relative">
      <div className="relative w-full" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="h-full w-full"
          role="img"
          aria-label={`Map of Iraq showing Vemi coverage across ${PINS.length} governorate capitals: ${PINS.map((p) => p.name).join(", ")}.`}
        >
          <defs>
            <linearGradient id="v2IraqFill" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#efecff" />
              <stop offset="1" stopColor="#f6f7f9" />
            </linearGradient>
          </defs>

          <path
            d={IRAQ_PATH}
            fill="url(#v2IraqFill)"
            stroke="var(--color-violet)"
            strokeOpacity="0.3"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />

          {PINS.map((p) => {
            const on = hover?.name === p.name;
            const labelX = p.label === "left" ? p.x - 3 : p.x + 3;
            return (
              <g
                key={p.name}
                className="cursor-pointer"
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                role="button"
                aria-label={p.name}
              >
                <circle cx={p.x} cy={p.y} r="4.2" fill="transparent" />
                {p.capital && (
                  <circle cx={p.x} cy={p.y} r={on ? 3.2 : 2.8} fill="var(--color-violet)" opacity="0.16" />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 1.9 : p.capital ? 1.6 : 1.25}
                  fill="var(--color-violet)"
                  stroke="#fff"
                  strokeWidth="0.6"
                  style={{ transition: "r 140ms ease" }}
                />
                {p.label && (
                  <text
                    x={labelX}
                    y={p.y + 0.9}
                    textAnchor={p.label === "left" ? "end" : "start"}
                    fontSize="2.9"
                    fontWeight={p.capital ? 700 : 600}
                    fill={on ? "var(--color-ink-900)" : "var(--color-ink-700)"}
                    stroke="#fff"
                    strokeWidth="0.7"
                    paintOrder="stroke"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    {p.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* name badge for the unlabelled pins */}
        {hover && !hover.label && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink-900 shadow-[var(--shadow-pop)]"
            style={{ left: `${hover.x}%`, top: `calc(${(hover.y / VIEW.h) * 100}% - 6px)` }}
          >
            {hover.name}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-ink-400">
        {PINS.length} governorate capitals · hover a pin to name it
      </p>
    </div>
  );
}
