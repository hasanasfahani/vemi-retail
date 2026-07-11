"use client";

import { useState } from "react";
import { solution } from "@/lib/content";
import Icon from "@/components/ui/Icon";
import Sparkline from "@/components/ui/Sparkline";

/* Interactive explainer for the 8 platform modules: pick one on the left,
   see a representative live mini-widget on the right. Echoes the hero
   dashboard so the page reads as one product — but only one preview shows
   at a time, so it never gets busy. */

const features = solution.features;

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

function MiniBar({ label, value, scale, tone = "var(--color-violet)", strong }: { label: string; value: number; scale: number; tone?: string; strong?: boolean }) {
  return (
    <Row>
      <span className={`w-24 shrink-0 text-xs ${strong ? "font-semibold text-ink-900" : "text-ink-500"}`}>{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded bg-line">
        <div className="h-full rounded" style={{ width: `${(value / scale) * 100}%`, background: tone }} />
      </div>
      <span className="tnum w-8 shrink-0 text-right text-xs">{value}%</span>
    </Row>
  );
}

function Preview({ title }: { title: string }) {
  switch (title) {
    case "Availability Tracking":
      return (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <span className="t-eyebrow">Store availability</span>
              <div className="tnum text-3xl">73%</div>
            </div>
            <Sparkline data={[66, 68, 67, 70, 71, 70, 72, 73]} />
          </div>
          <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded">
            <div style={{ width: "73%", background: "var(--color-violet)" }} />
            <div style={{ width: "15%", background: "var(--color-critical)" }} />
            <div style={{ width: "12%", background: "var(--color-warn)" }} />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-violet)" }} />Present 73%</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-critical)" }} />Missing 15%</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-warn)" }} />Misplaced 12%</span>
          </div>
        </div>
      );
    case "Shelf Share Analysis":
      return (
        <div className="flex flex-col gap-2.5">
          {[
            { l: "Your brand", v: 28, s: true, t: "var(--color-violet)" },
            { l: "Competitor A", v: 22, t: "var(--color-comp-1)" },
            { l: "Competitor B", v: 18, t: "var(--color-comp-2)" },
            { l: "Competitor C", v: 12, t: "var(--color-comp-3)" },
          ].map((b) => (
            <MiniBar key={b.l} label={b.l} value={b.v} scale={34} tone={b.t} strong={b.s} />
          ))}
        </div>
      );
    case "Price Intelligence":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 text-right font-medium">You</th>
              <th className="pb-2 text-right font-medium">Market</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "Cola 330ml", y: "750", m: "780", ok: true },
              { s: "Orange 330ml", y: "1,000", m: "900", ok: false },
              { s: "Water 500ml", y: "500", m: "520", ok: true },
            ].map((r) => (
              <tr key={r.s} className="border-b border-line last:border-0">
                <td className="py-2 font-medium text-ink-900">{r.s}</td>
                <td className="mono py-2 text-right text-ink-700">{r.y}</td>
                <td className="mono py-2 text-right text-ink-500">{r.m}</td>
                <td className="py-2 text-right">
                  {r.ok ? <span className="pill pill-good"><span className="dot" style={{ background: "var(--color-good)" }} />OK</span> : <span className="pill pill-warn"><span className="dot" style={{ background: "var(--color-warn)" }} />Over</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "Visibility Score":
      return (
        <div className="grid grid-cols-[auto_1fr] items-center gap-5">
          <div className="text-center">
            <span className="tnum text-5xl" style={{ color: "var(--color-violet-ink)" }}>68</span>
            <div className="text-xs text-ink-400">score / 100</div>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { p: "Eye-level", v: 42 },
              { p: "End-cap", v: 12 },
              { p: "Mid-shelf", v: 30 },
              { p: "Bottom", v: 16 },
            ].map((x) => (
              <Row key={x.p}>
                <span className="w-20 shrink-0 text-xs text-ink-500">{x.p}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-line"><div className="h-full rounded" style={{ width: `${x.v}%`, background: "var(--color-violet)" }} /></div>
                <span className="tnum w-8 shrink-0 text-right text-xs">{x.v}%</span>
              </Row>
            ))}
          </div>
        </div>
      );
    case "Promotion & POSM Tracker":
      return (
        <div className="flex flex-col divide-y divide-[color:var(--color-line)]">
          {[
            { w: "20% multi-buy bundle", who: "Competitor A · Baghdad", t: "2d ago" },
            { w: "Gondola end-cap display", who: "Competitor B · Basra", t: "4d ago" },
            { w: "Buy 2 get 1 free", who: "Competitor C · Mosul", t: "5d ago" },
          ].map((p) => (
            <div key={p.w} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-050"><Icon name="photo" className="h-4 w-4 text-violet-ink" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{p.w}</p>
                <p className="truncate text-xs text-ink-500">{p.who}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">{p.t}</span>
            </div>
          ))}
        </div>
      );
    case "Competitor Watch":
      return (
        <div className="flex flex-col gap-2.5">
          {[
            { l: "You — availability", v: 73, s: true },
            { l: "You — shelf share", v: 28, s: true },
            { l: "Comp A — share", v: 22, t: "var(--color-comp-1)" },
            { l: "Comp B — share", v: 18, t: "var(--color-comp-2)" },
          ].map((b) => (
            <MiniBar key={b.l} label={b.l} value={b.v} scale={100} tone={b.t ?? "var(--color-violet)"} strong={b.s} />
          ))}
        </div>
      );
    case "Offer Intelligence":
      return (
        <div className="flex flex-col gap-2">
          {[
            { o: "Buy 2 get 1 free", by: "Competitor C" },
            { o: "15% loyalty-card discount", by: "Competitor A" },
            { o: "Flash −20% weekend", by: "Competitor B" },
          ].map((x) => (
            <div key={x.o} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
              <span className="text-sm font-medium text-ink-900">{x.o}</span>
              <span className="text-xs text-ink-500">{x.by}</span>
            </div>
          ))}
        </div>
      );
    case "Out-of-Stock Alerts":
      return (
        <div>
          <div className="flex items-center gap-3 rounded-xl border border-line p-3" style={{ background: "color-mix(in srgb, var(--color-critical) 6%, #fff)" }}>
            <span className="dot dot-live shrink-0" style={{ background: "var(--color-critical)" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-900">12 SKUs out of stock · Baghdad</p>
              <p className="text-xs text-ink-500">Detected this week · routed to field team</p>
            </div>
          </div>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-line)]">
            {[
              { s: "Cola 1L PET", c: "Baghdad" },
              { s: "Energy 250ml", c: "Basra" },
            ].map((r) => (
              <div key={r.s} className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-900">{r.s}</span>
                <span className="pill pill-critical"><span className="dot" style={{ background: "var(--color-critical)" }} />OOS · {r.c}</span>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function ModuleExplorer() {
  const [active, setActive] = useState(0);
  const current = features[active];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
      {/* module list */}
      <div className="flex flex-col gap-1.5">
        {features.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f.title}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${on ? "border-violet/30 bg-violet-050" : "border-transparent hover:bg-canvas"}`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${on ? "border-transparent bg-violet text-white" : "border-line text-ink-700"}`}>
                <Icon name={f.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-semibold ${on ? "text-violet-ink" : "text-ink-900"}`}>{f.title}</span>
                <span className="mt-0.5 line-clamp-1 block text-xs text-ink-500">{f.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* live preview */}
      <div className="surface flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink-900">{current.title}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
            Live preview
          </span>
        </div>
        <div key={active} className="panel-in flex flex-1 flex-col justify-center p-5" style={{ minHeight: 240 }}>
          <Preview title={current.title} />
          <p className="mt-5 border-t border-line pt-4 text-sm text-ink-500">{current.short}</p>
        </div>
      </div>
    </div>
  );
}
