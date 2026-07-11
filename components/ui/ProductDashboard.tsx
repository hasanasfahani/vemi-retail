"use client";

import { useState } from "react";
import Sparkline from "@/components/ui/Sparkline";
import {
  cities,
  cityByName,
  competitorsFor,
  rowsFor,
  healthColor,
  type CityPerf,
  type Health,
} from "@/lib/marketData";

/* ------------------------------------------------------------------
   Interactive Vemi product surface (UI only, mock data).
   - Click a module in the rail  -> the main view changes.
   - Change the City filter       -> every metric updates.
   - "Availability by city" bars   -> click to jump to that city.
------------------------------------------------------------------ */

const MODULES = [
  "Availability",
  "Shelf share",
  "Pricing",
  "Visibility",
  "Promotions",
  "Competitors",
] as const;
type Module = (typeof MODULES)[number];

const compColor = ["var(--color-comp-1)", "var(--color-comp-2)", "var(--color-comp-3)"];

function statusColor(h: Health) {
  return healthColor[h];
}

/* ---------- small chart helpers ---------- */
function AreaChart({ data, min, max, avg, avgLabel }: { data: number[]; min: number; max: number; avg?: number; avgLabel?: string }) {
  const W = 300, H = 110, pad = 6;
  const stepX = (W - pad * 2) / (data.length - 1);
  const y = (d: number) => pad + (1 - (d - min) / (max - min)) * (H - pad * 2);
  const pts = data.map((d, i) => [pad + i * stepX, y(d)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <defs>
        <linearGradient id="acFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-violet)" stopOpacity="0.14" />
          <stop offset="1" stopColor="var(--color-violet)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={g * H} y2={g * H} className="grid-line" />
      ))}
      {avg !== undefined && (
        <>
          <line x1={pad} x2={W - pad} y1={y(avg)} y2={y(avg)} stroke="var(--color-ink-400)" strokeWidth="1" strokeDasharray="3 3" />
          <text x={W - pad - 2} y={y(avg) - 4} textAnchor="end" fontSize="9" fill="var(--color-ink-400)">{avgLabel}</text>
        </>
      )}
      <path d={area} fill="url(#acFill)" />
      <path d={line} fill="none" stroke="var(--color-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="var(--color-violet)" />
    </svg>
  );
}

function BarRow({ name, value, scale, me, i, onClick, active }: { name: string; value: number; scale: number; me?: boolean; i?: number; onClick?: () => void; active?: boolean }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left ${onClick ? "hover:bg-canvas" : ""} ${active ? "bg-violet-050" : ""}`}
    >
      <span className={`w-24 shrink-0 truncate text-xs ${me || active ? "font-semibold text-ink-900" : "text-ink-500"}`}>{name}</span>
      <div className="relative h-3.5 flex-1">
        <div className="h-3.5 rounded" style={{ width: `${(value / scale) * 100}%`, background: me ? "var(--color-violet)" : active ? "var(--color-violet)" : compColor[Math.min((i ?? 0), 2)] }} />
      </div>
      <span className={`tnum w-9 shrink-0 text-right text-xs ${me || active ? "" : "!text-ink-500"}`}>{value}%</span>
    </Comp>
  );
}

/* ---------- dropdown ---------- */
function Dropdown({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="chip !py-1.5 transition-colors hover:border-line-strong" aria-expanded={open}>
        <span className="text-ink-400">{label}:</span>
        <span className="font-semibold text-ink-900">{value}</span>
        <svg viewBox="0 0 12 12" className={`h-3 w-3 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-20 cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-30 mt-1.5 max-h-56 w-44 overflow-auto rounded-lg border border-line bg-white p-1 shadow-[var(--shadow-pop)]">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onSelect(o); setOpen(false); }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm ${o === value ? "bg-violet-050 font-semibold text-violet-ink" : "text-ink-700 hover:bg-canvas"}`}
              >
                {o}
                {o === value && <span aria-hidden>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- module panels ---------- */
function ModuleTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="t-h3 !text-[15px]">{children}</span>
      {aside}
    </div>
  );
}

export default function ProductDashboard() {
  const [cityName, setCityName] = useState("Baghdad");
  const [channel, setChannel] = useState("Supermarkets");
  const [category, setCategory] = useState("Beverages");
  const [week, setWeek] = useState("Week 28 · 2026");
  const [module, setModule] = useState<Module>("Shelf share");
  const city = cityByName(cityName);

  const kpis = [
    { label: "Availability", value: `${city.availability}%`, sub: "vs 78% national", spark: city.availTrend, status: "good" as Health },
    { label: "Shelf share", value: `${city.shelfShare}%`, sub: "category", spark: city.shareTrend, status: "good" as Health },
    { label: "Out of stock", value: `${city.oos}`, sub: "SKUs", spark: undefined, status: (city.oos > 0 ? "critical" : "good") as Health },
    { label: "Price violations", value: `${city.violations}`, sub: "flagged", spark: undefined, status: (city.violations > 0 ? "warn" : "good") as Health },
  ];

  return (
    <div className="surface overflow-hidden text-left">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-md bg-canvas px-3 py-1 text-xs text-ink-400">app.vemi.iq / dashboard</div>
        <span className="hidden items-center gap-1.5 text-xs font-medium text-ink-500 sm:inline-flex">
          <span className="dot dot-live" style={{ background: "var(--color-good)" }} /> Live
        </span>
      </div>

      <div className="flex">
        {/* module rail — interactive */}
        <aside className="hidden w-40 shrink-0 flex-col gap-0.5 border-r border-line p-3 lg:flex">
          <span className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Modules</span>
          {MODULES.map((m) => (
            <button
              key={m}
              onClick={() => setModule(m)}
              className={`rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${module === m ? "bg-violet-050 font-semibold text-violet-ink" : "text-ink-500 hover:bg-canvas hover:text-ink-900"}`}
            >
              {m}
            </button>
          ))}
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {/* filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Dropdown label="City" value={cityName} options={cities.map((c) => c.name)} onSelect={setCityName} />
            <Dropdown label="Channel" value={channel} options={["All channels", "Hypermarkets", "Supermarkets", "Traditional trade"]} onSelect={setChannel} />
            <Dropdown label="Category" value={category} options={["Beverages", "Snacks", "Dairy", "Home care"]} onSelect={setCategory} />
            <Dropdown label="Period" value={week} options={["Week 28 · 2026", "Week 27 · 2026", "Week 26 · 2026", "Week 25 · 2026"]} onSelect={setWeek} />
          </div>

          {/* KPI row — always on, city-driven */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{k.label}</span>
                  <span className="dot" style={{ background: statusColor(k.status) }} />
                </div>
                <div className="mt-1.5 flex items-end justify-between">
                  <span className="tnum text-2xl" style={k.status !== "good" ? { color: statusColor(k.status) } : undefined}>{k.value}</span>
                  {k.spark && <Sparkline data={k.spark} />}
                </div>
                <span className="text-xs text-ink-400">{k.sub}</span>
              </div>
            ))}
          </div>

          {/* module detail — swaps */}
          <div key={module + cityName} className="panel-in mt-4">
            {module === "Shelf share" && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-line p-4">
                  <ModuleTitle aside={<span className="text-xs text-ink-400">W21–W28</span>}>Shelf share trend</ModuleTitle>
                  <AreaChart data={city.shareTrend} min={16} max={32} avg={25} avgLabel="Category avg 25%" />
                </div>
                <div className="rounded-xl border border-line p-4">
                  <ModuleTitle>Shelf share vs competitors</ModuleTitle>
                  <div className="flex flex-col gap-1.5">
                    {competitorsFor(city).map((c, i) => (
                      <BarRow key={c.name} name={c.name} value={c.value} scale={34} me={c.me} i={i - 1} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {module === "Availability" && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-line p-4">
                  <ModuleTitle aside={<span className="tnum !text-sm" style={{ color: "var(--color-violet-ink)" }}>{city.availability}%</span>}>Availability trend — {cityName}</ModuleTitle>
                  <AreaChart data={city.availTrend} min={60} max={90} avg={78} avgLabel="National 78%" />
                </div>
                <div className="rounded-xl border border-line p-4">
                  <ModuleTitle aside={<span className="text-xs text-ink-400">click to inspect</span>}>Availability by city</ModuleTitle>
                  <div className="flex flex-col gap-0.5">
                    {[...cities].sort((a, b) => b.availability - a.availability).map((c) => (
                      <BarRow key={c.name} name={c.name} value={c.availability} scale={90} onClick={() => setCityName(c.name)} active={c.name === cityName} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {module === "Pricing" && (
              <div className="rounded-xl border border-line p-4">
                <ModuleTitle aside={city.violations > 0 ? <span className="pill pill-warn"><span className="dot" style={{ background: "var(--color-warn)" }} />{city.violations} violations</span> : <span className="pill pill-good"><span className="dot" style={{ background: "var(--color-good)" }} />No violations</span>}>Price intelligence — {cityName}</ModuleTitle>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
                      <th className="py-2 pr-3 font-medium">SKU</th>
                      <th className="py-2 pr-3 text-right font-medium">Your price</th>
                      <th className="py-2 pr-3 text-right font-medium">Market avg</th>
                      <th className="py-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { sku: "Cola 330ml", you: "750", mkt: "780", ok: true },
                      { sku: "Cola 1L PET", you: "1,400", mkt: "1,450", ok: true },
                      { sku: "Orange 330ml", you: "1,000", mkt: "900", ok: city.violations === 0 },
                      { sku: "Water 500ml", you: "500", mkt: "520", ok: true },
                    ].map((r) => (
                      <tr key={r.sku} className="border-b border-line last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-ink-900">{r.sku}</td>
                        <td className="mono py-2.5 pr-3 text-right text-ink-700">{r.you} IQD</td>
                        <td className="mono py-2.5 pr-3 text-right text-ink-500">{r.mkt} IQD</td>
                        <td className="py-2.5 text-right">
                          {r.ok ? <span className="pill pill-good"><span className="dot" style={{ background: "var(--color-good)" }} />OK</span> : <span className="pill pill-warn"><span className="dot" style={{ background: "var(--color-warn)" }} />Above cap</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {module === "Visibility" && (
              <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
                <div className="flex flex-col items-center justify-center rounded-xl border border-line p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Visibility score</span>
                  <span className="tnum mt-1 text-5xl" style={{ color: "var(--color-violet-ink)" }}>68</span>
                  <span className="text-xs text-ink-400">out of 100</span>
                </div>
                <div className="rounded-xl border border-line p-4">
                  <ModuleTitle>Facings by shelf position</ModuleTitle>
                  <div className="flex flex-col gap-2">
                    {[
                      { pos: "Eye-level", pct: 42 },
                      { pos: "End-cap", pct: 12 },
                      { pos: "Mid-shelf", pct: 30 },
                      { pos: "Bottom shelf", pct: 16 },
                    ].map((p) => (
                      <div key={p.pos} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-ink-500">{p.pos}</span>
                        <div className="h-3.5 flex-1 overflow-hidden rounded bg-line"><div className="h-full rounded" style={{ width: `${p.pct}%`, background: "var(--color-violet)" }} /></div>
                        <span className="tnum w-9 shrink-0 text-right text-xs">{p.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {module === "Promotions" && (
              <div className="rounded-xl border border-line p-4">
                <ModuleTitle aside={<span className="text-xs text-ink-400">last 7 days</span>}>Competitor promotions detected</ModuleTitle>
                <div className="flex flex-col divide-y divide-[color:var(--color-line)]">
                  {[
                    { who: "Competitor A", what: "20% multi-buy bundle", where: "Baghdad · Hyper", when: "2d ago" },
                    { who: "Competitor B", what: "Gondola end-cap display", where: "Basra · Super", when: "4d ago" },
                    { who: "Competitor C", what: "Buy 2 get 1 free", where: "Mosul · Trad", when: "5d ago" },
                  ].map((p) => (
                    <div key={p.what} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-050 text-xs font-bold text-violet-ink">{p.who.split(" ")[1]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-900">{p.what}</p>
                        <p className="text-xs text-ink-500">{p.who} · {p.where}</p>
                      </div>
                      <span className="shrink-0 text-xs text-ink-400">{p.when}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {module === "Competitors" && (
              <div className="rounded-xl border border-line p-4">
                <ModuleTitle>Benchmark — {cityName}</ModuleTitle>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
                      <th className="py-2 pr-3 font-medium">Brand</th>
                      <th className="py-2 pr-3 text-right font-medium">Avail.</th>
                      <th className="py-2 pr-3 text-right font-medium">Share</th>
                      <th className="hidden py-2 pr-3 text-right font-medium sm:table-cell">Price idx</th>
                      <th className="py-2 text-right font-medium">Promos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { brand: "Your brand", avail: city.availability, share: city.shelfShare, idx: 100, promos: 1, me: true },
                      { brand: "Competitor A", avail: 68, share: Math.max(8, city.shelfShare - 6), idx: 96, promos: 2, me: false },
                      { brand: "Competitor B", avail: 64, share: Math.max(6, city.shelfShare - 10), idx: 92, promos: 1, me: false },
                      { brand: "Competitor C", avail: 59, share: Math.max(4, city.shelfShare - 16), idx: 88, promos: 0, me: false },
                    ].map((r) => (
                      <tr key={r.brand} className={`border-b border-line last:border-0 ${r.me ? "bg-violet-050" : ""}`}>
                        <td className={`py-2.5 pr-3 ${r.me ? "font-semibold text-violet-ink" : "font-medium text-ink-900"}`}>{r.brand}</td>
                        <td className="mono py-2.5 pr-3 text-right text-ink-700">{r.avail}%</td>
                        <td className="mono py-2.5 pr-3 text-right text-ink-700">{r.share}%</td>
                        <td className="mono hidden py-2.5 pr-3 text-right text-ink-500 sm:table-cell">{r.idx}</td>
                        <td className="mono py-2.5 text-right text-ink-500">{r.promos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* live SKU table — reflects selected city */}
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <div className="flex items-center justify-between border-b border-line bg-canvas px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">SKU status · {cityName}</span>
              {city.oos > 0 && (
                <span className="pill pill-critical"><span className="dot dot-live" style={{ background: "var(--color-critical)" }} />{city.oos} out of stock</span>
              )}
            </div>
            <table className="w-full text-left text-sm">
              <tbody>
                {rowsFor(city).map((r) => (
                  <tr key={r.sku} className="border-b border-line last:border-0">
                    <td className="px-3 py-2.5 font-medium text-ink-900">{r.sku}</td>
                    <td className="mono hidden px-3 py-2.5 text-ink-500 sm:table-cell">{r.facings} facings</td>
                    <td className="mono hidden px-3 py-2.5 text-ink-500 sm:table-cell">{r.price === "—" ? "—" : `${r.price} IQD`}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`pill pill-${r.status}`}>
                        <span className="dot" style={{ background: statusColor(r.status) }} />
                        {r.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
