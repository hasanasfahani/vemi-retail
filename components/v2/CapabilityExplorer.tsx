"use client";

import { useState } from "react";
import { retailAudit } from "@/lib/v2Content";
import Icon from "@/components/v2/Icon";
import Sparkline from "@/components/ui/Sparkline";

/* The eight retail-audit capabilities, each with a representative live
   widget. One preview at a time — the list stays scannable, the panel
   carries the proof. */

const caps = retailAudit.capabilities;
const comp = ["var(--color-comp-1)", "var(--color-comp-2)", "var(--color-comp-3)"];

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

function Bar({
  label,
  value,
  scale,
  tone = "var(--color-violet)",
  strong,
  suffix = "%",
}: {
  label: string;
  value: number;
  scale: number;
  tone?: string;
  strong?: boolean;
  suffix?: string;
}) {
  return (
    <Row>
      <span className={`w-28 shrink-0 truncate text-xs ${strong ? "font-semibold text-ink-900" : "text-ink-500"}`}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded bg-line">
        <div className="h-full rounded" style={{ width: `${(value / scale) * 100}%`, background: tone }} />
      </div>
      <span className="tnum w-10 shrink-0 text-right text-xs">
        {value}
        {suffix}
      </span>
    </Row>
  );
}

function StatusPill({ tone, children }: { tone: "good" | "warn" | "critical"; children: React.ReactNode }) {
  const color = `var(--color-${tone === "good" ? "good" : tone === "warn" ? "warn" : "critical"})`;
  return (
    <span className={`pill pill-${tone}`}>
      <span className="dot" style={{ background: color }} />
      {children}
    </span>
  );
}

function Preview({ title }: { title: string }) {
  switch (title) {
    case "Availability & OOS":
      return (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <span className="t-eyebrow">On-shelf availability</span>
              <div className="tnum text-3xl">73%</div>
            </div>
            <Sparkline data={[66, 68, 67, 70, 71, 70, 72, 73]} />
          </div>
          <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded">
            <div style={{ width: "73%", background: "var(--color-violet)" }} />
            <div style={{ width: "15%", background: "var(--color-critical)" }} />
            <div style={{ width: "12%", background: "var(--color-warn)" }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-violet)" }} />On shelf 73%</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-critical)" }} />Out of stock 15%</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-warn)" }} />Misplaced 12%</span>
          </div>
        </div>
      );

    case "Shelf Share & Facings":
      return (
        <div className="flex flex-col gap-2.5">
          {[
            { l: "Your brand", v: 28, s: true, t: "var(--color-violet)" },
            { l: "Competitor A", v: 22, t: comp[0] },
            { l: "Competitor B", v: 18, t: comp[1] },
            { l: "Competitor C", v: 12, t: comp[2] },
          ].map((b) => (
            <Bar key={b.l} label={b.l} value={b.v} scale={34} tone={b.t} strong={b.s} />
          ))}
          <p className="mt-1 text-xs text-ink-400">Linear share of the category shelf · 46 facings counted</p>
        </div>
      );

    case "Pricing":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 text-right font-medium">Shelf</th>
              <th className="pb-2 text-right font-medium">RRP</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "Cola 330ml", p: "750", r: "750", ok: true },
              { s: "Orange 330ml", p: "1,000", r: "900", ok: false },
              { s: "Water 500ml", p: "500", r: "500", ok: true },
            ].map((r) => (
              <tr key={r.s} className="border-b border-line last:border-0">
                <td className="py-2 font-medium text-ink-900">{r.s}</td>
                <td className="mono py-2 text-right text-ink-700">{r.p}</td>
                <td className="mono py-2 text-right text-ink-500">{r.r}</td>
                <td className="py-2 text-right">
                  {r.ok ? <StatusPill tone="good">At RRP</StatusPill> : <StatusPill tone="warn">+11%</StatusPill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "Visibility & Shelf Position":
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
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-line">
                  <div className="h-full rounded" style={{ width: `${x.v}%`, background: "var(--color-violet)" }} />
                </div>
                <span className="tnum w-8 shrink-0 text-right text-xs">{x.v}%</span>
              </Row>
            ))}
          </div>
        </div>
      );

    case "Planogram Compliance": {
      /* slot states: 1 correct, 2 wrong product, 3 empty */
      const shelves = [
        [1, 1, 1, 2, 1, 1],
        [1, 3, 1, 1, 2, 1],
        [1, 1, 1, 1, 1, 3],
      ];
      const tone = (s: number) =>
        s === 1 ? "var(--color-violet)" : s === 2 ? "var(--color-warn)" : "var(--color-critical)";
      return (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <span className="t-eyebrow">Compliance</span>
              <div className="tnum text-3xl">83%</div>
            </div>
            <StatusPill tone="warn">3 deviations</StatusPill>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 rounded-lg border border-line p-2.5">
            {shelves.map((row, r) => (
              <div key={r} className="flex gap-1.5">
                {row.map((s, c) => (
                  <div
                    key={c}
                    className="h-6 flex-1 rounded-sm"
                    style={{ background: tone(s), opacity: s === 1 ? 0.85 : 1 }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-violet)" }} />As planned</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-warn)" }} />Wrong SKU</span>
            <span className="flex items-center gap-1.5"><span className="dot" style={{ background: "var(--color-critical)" }} />Empty slot</span>
          </div>
        </div>
      );
    }

    case "Promotions & POSM":
      return (
        <div className="flex flex-col divide-y divide-[color:var(--color-line)]">
          {[
            { w: "20% multi-buy bundle", who: "Competitor A · Baghdad", t: "2d ago" },
            { w: "Gondola end-cap display", who: "Competitor B · Basra", t: "4d ago" },
            { w: "Shelf wobbler + price card", who: "Your brand · Erbil", t: "6d ago" },
          ].map((p) => (
            <div key={p.w} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-050">
                <Icon name="photo" className="h-4 w-4 text-violet-ink" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{p.w}</p>
                <p className="truncate text-xs text-ink-500">{p.who}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">{p.t}</span>
            </div>
          ))}
        </div>
      );

    case "Assortment":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 text-center font-medium">Listed</th>
              <th className="pb-2 text-center font-medium">In store</th>
              <th className="pb-2 text-center font-medium">On shelf</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "Cola 330ml", a: true, b: true, c: true },
              { s: "Cola 1L PET", a: true, b: true, c: false },
              { s: "Orange 330ml", a: true, b: false, c: false },
              { s: "Energy 250ml", a: false, b: false, c: false },
            ].map((r) => (
              <tr key={r.s} className="border-b border-line last:border-0">
                <td className="py-2 font-medium text-ink-900">{r.s}</td>
                {[r.a, r.b, r.c].map((v, i) => (
                  <td key={i} className="py-2 text-center">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: v ? "var(--color-good)" : "var(--color-line-strong)" }}
                      aria-label={v ? "yes" : "no"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "Competitor Tracking":
      return (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
              <th className="pb-2 font-medium">Brand</th>
              <th className="pb-2 text-right font-medium">Avail.</th>
              <th className="pb-2 text-right font-medium">Share</th>
              <th className="pb-2 text-right font-medium">Promos</th>
            </tr>
          </thead>
          <tbody>
            {[
              { b: "Your brand", a: 73, s: 28, p: 1, me: true },
              { b: "Competitor A", a: 68, s: 22, p: 2 },
              { b: "Competitor B", a: 64, s: 18, p: 1 },
              { b: "Competitor C", a: 59, s: 12, p: 0 },
            ].map((r) => (
              <tr key={r.b} className={`border-b border-line last:border-0 ${r.me ? "bg-violet-050" : ""}`}>
                <td className={`py-2 ${r.me ? "font-semibold text-violet-ink" : "font-medium text-ink-900"}`}>{r.b}</td>
                <td className="mono py-2 text-right text-ink-700">{r.a}%</td>
                <td className="mono py-2 text-right text-ink-700">{r.s}%</td>
                <td className="mono py-2 text-right text-ink-500">{r.p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return null;
  }
}

export default function CapabilityExplorer() {
  const [active, setActive] = useState(0);
  const current = caps[active];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
      {/* capability list */}
      <div className="flex flex-col gap-1.5">
        {caps.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={c.title}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                on ? "border-violet/30 bg-violet-050" : "border-transparent hover:bg-canvas"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  on ? "border-transparent bg-violet text-white" : "border-line text-ink-700"
                }`}
              >
                <Icon name={c.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-semibold ${on ? "text-violet-ink" : "text-ink-900"}`}>
                  {c.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{c.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* live preview */}
      <div className="surface flex flex-col overflow-hidden lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink-900">{current.title}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
            Live preview
          </span>
        </div>
        <div key={active} className="panel-in flex flex-1 flex-col justify-center p-5" style={{ minHeight: 260 }}>
          <Preview title={current.title} />
        </div>
      </div>
    </div>
  );
}
