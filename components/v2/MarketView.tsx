"use client";

import { useState } from "react";
import { platform } from "@/lib/v2Content";

/* §6 — "thousands of store observations to one clear market view."
   The drill chain is the message, so it is operable: pick a level and
   the same market resolves at that grain. KPIs stay national on purpose
   — one view, different cuts. */

const LEVELS = platform.filterChain; // Governorate → City → Channel → POS → SKU

const SCOPE: Record<string, string> = {
  Governorate: "All governorates · Iraq",
  City: "All cities · Iraq",
  Channel: "All channels · Iraq",
  POS: "All outlets · Iraq",
  SKU: "All SKUs · your portfolio",
};

type Row = { name: string; value: number; meta: string };

const ROWS: Record<string, Row[]> = {
  Governorate: [
    { name: "Erbil", value: 82, meta: "110 outlets" },
    { name: "Najaf", value: 80, meta: "90 outlets" },
    { name: "Karbala", value: 79, meta: "80 outlets" },
    { name: "Basra", value: 78, meta: "180 outlets" },
    { name: "Mosul", value: 74, meta: "120 outlets" },
    { name: "Baghdad", value: 71, meta: "320 outlets" },
  ],
  City: [
    { name: "Erbil — Downtown", value: 83, meta: "42 outlets" },
    { name: "Basra — Ashar", value: 77, meta: "58 outlets" },
    { name: "Baghdad — Mansour", value: 74, meta: "96 outlets" },
    { name: "Baghdad — Karrada", value: 69, meta: "88 outlets" },
    { name: "Mosul — Al-Jadida", value: 68, meta: "51 outlets" },
  ],
  Channel: [
    { name: "Hypermarkets", value: 86, meta: "120 outlets" },
    { name: "Supermarkets", value: 77, meta: "380 outlets" },
    { name: "Traditional trade", value: 64, meta: "500 outlets" },
  ],
  POS: [
    { name: "City Center Erbil", value: 88, meta: "Hypermarket" },
    { name: "Ashar Mini Market", value: 79, meta: "Supermarket" },
    { name: "Al-Mansour Market", value: 74, meta: "Supermarket" },
    { name: "Karrada Grocery", value: 61, meta: "Traditional" },
  ],
  SKU: [
    { name: "Cola 330ml", value: 91, meta: "6 facings avg" },
    { name: "Water 500ml", value: 88, meta: "8 facings avg" },
    { name: "Orange 330ml", value: 77, meta: "4 facings avg" },
    { name: "Cola 1L PET", value: 62, meta: "3 facings avg" },
    { name: "Energy 250ml", value: 55, meta: "2 facings avg" },
  ],
};

const KPIS = [
  { label: "Observations", value: "41,280" },
  { label: "Outlets covered", value: "1,000+" },
  { label: "Availability", value: "78%" },
  { label: "Shelf share", value: "25%" },
];

function tone(v: number) {
  if (v >= 80) return "var(--color-good)";
  if (v >= 70) return "var(--color-violet)";
  return "var(--color-critical)";
}

export default function MarketView() {
  const [level, setLevel] = useState(LEVELS[0]);
  const rows = ROWS[level];

  return (
    <div className="surface overflow-hidden">
      {/* chrome */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto hidden items-center rounded-md bg-canvas px-3 py-1 text-xs text-ink-400 sm:flex">
          app.vemi.iq / market-view
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
          Live
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {/* drill chain */}
        <div className="flex flex-wrap items-center gap-1.5">
          {LEVELS.map((l, i) => {
            const on = l === level;
            return (
              <span key={l} className="flex items-center gap-1.5">
                <button
                  onClick={() => setLevel(l)}
                  aria-pressed={on}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    on
                      ? "border-violet bg-violet text-white"
                      : "border-line text-ink-600 hover:border-line-strong hover:text-ink-900"
                  }`}
                >
                  {l}
                </button>
                {i < LEVELS.length - 1 && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M4.5 2.5 8 6l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-ink-400">
          Showing <span className="font-medium text-ink-600">{SCOPE[level]}</span> · week 38 · 2026
        </p>

        {/* national KPIs — same view, different cut */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-line p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{k.label}</span>
              <div className="tnum mt-1 text-2xl">{k.value}</div>
            </div>
          ))}
        </div>

        {/* the cut */}
        <div className="mt-4 rounded-xl border border-line p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="t-h3 !text-[15px]">Availability by {level.toLowerCase()}</span>
            <span className="text-xs text-ink-400">{rows.length} rows</span>
          </div>

          <div key={level} className="panel-in flex flex-col gap-2.5">
            {rows.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs font-medium text-ink-900 sm:w-44">{r.name}</span>
                <div className="h-3.5 flex-1 overflow-hidden rounded bg-line">
                  <div
                    className="h-full rounded"
                    style={{ width: `${r.value}%`, background: tone(r.value) }}
                  />
                </div>
                <span className="tnum w-10 shrink-0 text-right text-xs">{r.value}%</span>
                <span className="hidden w-24 shrink-0 text-right text-xs text-ink-400 sm:block">{r.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
