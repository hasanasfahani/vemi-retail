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

export default function CoverageMap() {
  const [hover, setHover] = useState<Pin | null>(null);

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-violet-100 p-4 sm:p-5"
      style={{ background: "radial-gradient(circle at 78% 12%, #ffffff 0%, #f7f5ff 44%, #efecff 100%)" }}
    >
      <div aria-hidden className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-100/60 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet opacity-30" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet" />
            </span>
            Active field network
          </span>
          <p className="mt-1 font-display text-lg font-bold tracking-tight text-ink-900">Iraq coverage</p>
        </div>
        <span className="rounded-full border border-violet-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-ink shadow-sm backdrop-blur">
          {PINS.length} coverage hubs
        </span>
      </div>

      <div className="relative mx-auto mt-3 w-[88%]" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="h-full w-full"
          role="img"
          aria-label={`Map of Iraq showing Vemi coverage across ${PINS.length} governorate capitals: ${PINS.map((p) => p.name).join(", ")}.`}
        >
          <defs>
            <linearGradient id="v2IraqFill" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#ddd5ff" />
              <stop offset="0.55" stopColor="#f0edff" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
            <pattern id="v2MapGrid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M5 0H0V5" fill="none" stroke="#6748fd" strokeOpacity="0.08" strokeWidth="0.25" />
            </pattern>
            <clipPath id="v2IraqClip">
              <path d={IRAQ_PATH} />
            </clipPath>
            <filter id="v2MapShadow" x="-25%" y="-25%" width="150%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#4932b7" floodOpacity="0.18" />
            </filter>
          </defs>

          <path
            d={IRAQ_PATH}
            fill="url(#v2IraqFill)"
            stroke="var(--color-violet)"
            strokeOpacity="0.48"
            strokeWidth="0.8"
            strokeLinejoin="round"
            filter="url(#v2MapShadow)"
          />
          <rect width={VIEW.w} height={VIEW.h} fill="url(#v2MapGrid)" clipPath="url(#v2IraqClip)" />

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
                  stroke="var(--color-violet)"
                  strokeOpacity="0.26"
                  strokeWidth="0.55"
                  strokeDasharray="1.4 1.6"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

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
                role="img"
                aria-label={p.name}
              >
                <circle cx={p.x} cy={p.y} r="4.2" fill="transparent" />
                <circle cx={p.x} cy={p.y} r={on ? 3.3 : p.capital ? 2.9 : 2.35} fill="var(--color-violet)" opacity={on ? 0.2 : 0.11} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 1.9 : p.capital ? 1.6 : 1.25}
                  fill="var(--color-violet)"
                  stroke="#fff"
                  strokeWidth="0.75"
                  style={{ transition: "r 180ms ease" }}
                />
                {p.label && (
                  <text
                    x={labelX}
                    y={p.y + 0.9}
                    textAnchor={p.label === "left" ? "end" : "start"}
                    fontSize="2.75"
                    fontWeight={p.capital ? 700 : 600}
                    fill={on ? "var(--color-ink-900)" : "var(--color-ink-700)"}
                    stroke="#fff"
                    strokeWidth="0.9"
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

        {hover && !hover.label && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-violet-100 bg-white px-2.5 py-1 text-xs font-semibold text-ink-900 shadow-[var(--shadow-pop)]"
            style={{ left: `${hover.x}%`, top: `calc(${(hover.y / VIEW.h) * 100}% - 6px)` }}
          >
            {hover.name}
          </div>
        )}
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-violet-100 pt-3 text-[11px] text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-violet" />
          Field coverage hub
        </span>
        <span>Hover or focus to explore</span>
      </div>
    </div>
  );
}
